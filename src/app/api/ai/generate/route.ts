export const runtime = 'nodejs';

import { NextRequest } from 'next/server';

// In-memory rate limiter with periodic cleanup to prevent memory leaks.
// Max 20 requests per minute per user. Entries auto-expire.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_ENTRIES = 1000;

// Guest session tracking (in-memory; resets on server restart which is acceptable).
// Guests get 40 generations — same as the free tier — before being asked to sign up.
const guestSessionMap = new Map<string, number>(); // sessionId → generation count
const GUEST_GENERATION_LIMIT = 40;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Periodic cleanup — runs at most once per minute
let lastCleanup = 0;
function cleanupRateLimitMap() {
    const now = Date.now();
    if (now - lastCleanup < 60_000) return;
    lastCleanup = now;
    for (const [key, entry] of rateLimitMap) {
        if (now > entry.resetAt) rateLimitMap.delete(key);
    }
    // Hard cap: if still too large, drop oldest entries
    if (rateLimitMap.size > RATE_LIMIT_MAX_ENTRIES) {
        const excess = rateLimitMap.size - RATE_LIMIT_MAX_ENTRIES;
        let deleted = 0;
        for (const key of rateLimitMap.keys()) {
            if (deleted >= excess) break;
            rateLimitMap.delete(key);
            deleted++;
        }
    }
}

import { z } from 'zod';
import {
    generateIdeas,
    generateDrafts,
    refineDraft,
    refineDraftSelection,
    performResearch,
    generateSubjectLines,
    searchWebForBrief,
} from '@/services/geminiService';
import { createStyleFromDescription, createStyleFromData } from '@/services/styleAnalyzer';
import { safeRandomUUID } from '@/server/uuid';
import { createProvider } from '@/services/providers/factory';
import { serverConfig } from '@/server/config';
import { AIProvider } from '@/types';
import { checkAndIncrementUsage } from '@/server/usageService';
import { verifyJwt } from '@/server/auth';

function jsonResponse(payload: unknown, status = 200) {
    return new globalThis.Response(JSON.stringify(payload ?? null), {
        status,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
        },
    });
}

const ProviderField = z.enum(['gemini', 'claude', 'openai']).default('gemini');

const GuardrailsSchema = z
    .object({
        dos: z.string().max(5_000),
        donts: z.string().max(5_000),
    })
    .optional();

// Max sizes to prevent abuse / excessive token burn
const MAX_TEXT = 50_000;      // ~50KB text fields
const MAX_SHORT = 5_000;      // shorter fields
const MAX_ARRAY = 100;        // max array items

const CreateStyleFromDescriptionSchema = z.object({
    feature: z.literal('createStyleFromDescription'),
    provider: ProviderField,
    styleName: z.string().max(200),
    description: z.string().max(MAX_SHORT),
    guardrails: GuardrailsSchema,
});

const CsvRowSchema = z.object({
    content: z.string().max(MAX_SHORT),
    likes: z.number(),
});

const CreateStyleFromDataSchema = z.object({
    feature: z.literal('createStyleFromData'),
    provider: ProviderField,
    styleName: z.string().max(200),
    data: z.array(CsvRowSchema).max(MAX_ARRAY),
    nativeFormat: z.string().max(200),
    guardrails: GuardrailsSchema,
});

const GenerateIdeasSchema = z.object({
    feature: z.literal('generateIdeas'),
    provider: ProviderField,
    brief: z.string().max(MAX_SHORT),
    style: z.string().max(MAX_SHORT),
    format: z.string().max(200),
    existingIdeas: z.array(z.any()).max(MAX_ARRAY).optional(),
    customPrompts: z.record(z.string().max(MAX_SHORT)).optional(),
    guardrails: GuardrailsSchema,
    researchContext: z.array(z.any()).max(MAX_ARRAY).optional(),
    nativeFormat: z.string().max(200).optional(),
});

const GenerateDraftsSchema = z.object({
    feature: z.literal('generateDrafts'),
    provider: ProviderField,
    idea: z.any(),
    style: z.string().max(MAX_SHORT),
    format: z.string().max(200),
    additionalInstructions: z.string().max(MAX_SHORT).optional(),
    customPrompts: z.record(z.string().max(MAX_SHORT)).optional(),
    guardrails: GuardrailsSchema,
    researchContext: z.array(z.any()).max(MAX_ARRAY).optional(),
    nativeFormat: z.string().max(200).optional(),
    newsletterSubjectLine: z.string().max(500).optional(),
});

const RefineDraftSchema = z.object({
    feature: z.literal('refineDraft'),
    provider: ProviderField,
    currentContent: z.string().max(MAX_TEXT),
    feedback: z.string().max(MAX_SHORT),
    style: z.string().max(MAX_SHORT),
    format: z.string().max(200),
    customPrompts: z.record(z.string().max(MAX_SHORT)).optional(),
    guardrails: GuardrailsSchema,
    nativeFormat: z.string().max(200).optional(),
});

const RefineDraftSelectionSchema = z.object({
    feature: z.literal('refineDraftSelection'),
    provider: ProviderField,
    fullText: z.string().max(MAX_TEXT),
    selectedText: z.string().max(MAX_TEXT),
    feedback: z.string().max(MAX_SHORT),
    style: z.string().max(MAX_SHORT),
    format: z.string().max(200),
    customPrompts: z.record(z.string().max(MAX_SHORT)).optional(),
    guardrails: GuardrailsSchema,
    nativeFormat: z.string().max(200).optional(),
});

const SearchWebForBriefSchema = z.object({
    feature: z.literal('searchWebForBrief'),
    brief: z.string().max(MAX_SHORT),
});

const PerformResearchSchema = z.object({
    feature: z.literal('performResearch'),
    // Research always uses Gemini — no provider field needed
    topics: z.string().max(MAX_SHORT),
    audience: z.string().max(MAX_SHORT),
    timeRange: z.enum(['24h', '3d', '7d', '30d']),
    excludeHeadlines: z.array(z.string().max(500)).max(MAX_ARRAY).default([]),
    specificDomains: z.array(z.string().max(200)).max(20).default([]),
});

const GenerateSubjectLinesSchema = z.object({
    feature: z.literal('generateSubjectLines'),
    provider: ProviderField,
    brief: z.string().max(MAX_SHORT),
    style: z.string().max(MAX_SHORT),
    count: z.number().max(20).default(5),
    customPrompts: z.record(z.string().max(MAX_SHORT)).optional(),
    guardrails: GuardrailsSchema,
    researchContext: z.array(z.any()).max(MAX_ARRAY).optional(),
    baseSubjectLine: z.string().max(500).optional(),
});

const RequestBodySchema = z.discriminatedUnion('feature', [
    CreateStyleFromDescriptionSchema,
    CreateStyleFromDataSchema,
    GenerateIdeasSchema,
    GenerateDraftsSchema,
    RefineDraftSchema,
    RefineDraftSelectionSchema,
    PerformResearchSchema,
    GenerateSubjectLinesSchema,
    SearchWebForBriefSchema,
]);

function getApiKeyForProvider(provider: AIProvider): string {
    const keyMap: Record<AIProvider, string | undefined> = {
        gemini: serverConfig.AI_PROVIDER_KEY,
        claude: serverConfig.ANTHROPIC_API_KEY,
        openai: serverConfig.OPENAI_API_KEY,
    };

    const key = keyMap[provider];
    if (!key) {
        throw new Error(`API key not configured for provider: ${provider}. Please set the corresponding environment variable.`);
    }
    return key;
}

export async function POST(req: NextRequest) {
    const requestId = safeRandomUUID();
    const start = Date.now();

    // userId is lifted out so it's accessible in the main processing block
    let userId = 'unknown';
    let isGuest = false;

    // Auth: prefer Appwrite JWT; fall back to guest session ID for unauthenticated users.
    const authenticatedUserId = await verifyJwt(req);
    if (authenticatedUserId) {
        userId = authenticatedUserId;
    } else {
        const guestId = req.headers.get('x-guest-session-id') ?? '';
        if (UUID_RE.test(guestId)) {
            // Valid guest — check and increment generation budget
            const used = guestSessionMap.get(guestId) ?? 0;
            if (used >= GUEST_GENERATION_LIMIT) {
                return jsonResponse({
                    error: "You've used your free generation quota. Sign up to continue — it's free!",
                    reason: 'guest_limit',
                }, 402);
            }
            guestSessionMap.set(guestId, used + 1);
            userId = `guest:${guestId}`;
            isGuest = true;
        } else {
            return jsonResponse({ error: 'Unauthorized. Please log in to use Alfred.' }, 401);
        }
    }

    // Rate limiting — 20 requests per minute per user
    cleanupRateLimitMap();
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);

    if (!userLimit || now > userLimit.resetAt) {
        rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
        userLimit.count++;
        if (userLimit.count > RATE_LIMIT_MAX) {
            return jsonResponse({ error: 'Too many requests. Please wait a minute and try again.' }, 429);
        }
    }

    let featureMethod = 'unknown';
    let promptLength = 0;

    try {
        console.log(
            JSON.stringify({
                requestId,
                route: '/api/ai/generate',
                status: 'hit',
                nodeEnv: process.env.NODE_ENV || 'unknown',
            })
        );

        const body = await req.json();
        const validation = RequestBodySchema.safeParse(body);

        if (!validation.success) {
            console.error(
                JSON.stringify({
                    requestId,
                    success: false,
                    error: 'Validation Error',
                    issues: validation.error.issues,
                    latencyMs: Date.now() - start,
                })
            );

            return jsonResponse(
                {
                    error: 'Invalid request body',
                    details: validation.error.issues,
                    requestId,
                },
                400
            );
        }

        const payload = validation.data;
        featureMethod = payload.feature;

        // Usage check — enforce monthly limits and feature gating (authenticated users only;
        // guests are already counted above via guestSessionMap before validation)
        const format = 'format' in payload ? (payload as any).format as string : undefined;
        if (!isGuest) {
            const usageCheck = await checkAndIncrementUsage(userId, format);
            if (!usageCheck.allowed) {
                return jsonResponse({
                    error: usageCheck.reason === 'feature_gated'
                        ? `${format || 'This format'} is only available on paid plans. Upgrade to Starter or Pro to unlock.`
                        : `You've used all ${usageCheck.monthlyLimit} generations this month. Upgrade to continue.`,
                    reason: usageCheck.reason,
                    plan: usageCheck.plan,
                    remaining: usageCheck.remaining,
                    monthlyLimit: usageCheck.monthlyLimit,
                }, 402);
            }
        }

        if (payload.feature === 'createStyleFromDescription') promptLength = payload.description.length;
        if (payload.feature === 'createStyleFromData') promptLength = JSON.stringify(payload.data).length;
        if (payload.feature === 'generateIdeas') promptLength = payload.brief.length;
        if (payload.feature === 'generateDrafts') promptLength = JSON.stringify(payload.idea).length;
        if (payload.feature === 'refineDraft') promptLength = payload.currentContent.length + payload.feedback.length;
        if (payload.feature === 'refineDraftSelection') promptLength = payload.fullText.length + payload.selectedText.length;
        if (payload.feature === 'performResearch') promptLength = payload.topics.length;
        if (payload.feature === 'searchWebForBrief') promptLength = payload.brief.length;
        if (payload.feature === 'generateSubjectLines') promptLength = payload.brief.length;

        // Resolve provider and create adapter (research always uses Gemini internally)
        const providerName = 'provider' in payload ? (payload as any).provider as AIProvider : 'gemini';

        console.log(
            JSON.stringify({
                requestId,
                route: '/api/ai/generate',
                feature: featureMethod,
                provider: providerName,
                status: 'started',
            })
        );

        let result: any;

        switch (payload.feature) {
            case 'createStyleFromDescription': {
                const apiKey = getApiKeyForProvider(payload.provider);
                const adapter = createProvider(payload.provider, apiKey);
                result = await createStyleFromDescription(adapter, payload.styleName, payload.description, payload.guardrails);
                break;
            }
            case 'createStyleFromData': {
                const apiKey = getApiKeyForProvider(payload.provider);
                const adapter = createProvider(payload.provider, apiKey);
                result = await createStyleFromData(adapter, payload.styleName, payload.data, payload.nativeFormat, payload.guardrails);
                break;
            }
            case 'generateIdeas': {
                const apiKey = getApiKeyForProvider(payload.provider);
                const adapter = createProvider(payload.provider, apiKey);
                result = await generateIdeas(
                    adapter,
                    payload.brief,
                    payload.style,
                    payload.format,
                    payload.existingIdeas,
                    payload.customPrompts,
                    payload.guardrails,
                    payload.researchContext,
                    payload.nativeFormat
                );
                break;
            }
            case 'generateDrafts': {
                const apiKey = getApiKeyForProvider(payload.provider);
                const adapter = createProvider(payload.provider, apiKey);
                result = await generateDrafts(
                    adapter,
                    payload.idea,
                    payload.style,
                    payload.format,
                    payload.additionalInstructions,
                    payload.customPrompts,
                    payload.guardrails,
                    payload.researchContext,
                    payload.nativeFormat,
                    payload.newsletterSubjectLine
                );
                break;
            }
            case 'refineDraft': {
                const apiKey = getApiKeyForProvider(payload.provider);
                const adapter = createProvider(payload.provider, apiKey);
                result = await refineDraft(
                    adapter,
                    payload.currentContent,
                    payload.feedback,
                    payload.style,
                    payload.format,
                    payload.customPrompts,
                    payload.guardrails,
                    payload.nativeFormat
                );
                break;
            }
            case 'refineDraftSelection': {
                const apiKey = getApiKeyForProvider(payload.provider);
                const adapter = createProvider(payload.provider, apiKey);
                result = await refineDraftSelection(
                    adapter,
                    payload.fullText,
                    payload.selectedText,
                    payload.feedback,
                    payload.style,
                    payload.format,
                    payload.customPrompts,
                    payload.guardrails,
                    payload.nativeFormat
                );
                break;
            }
            case 'searchWebForBrief':
                result = await searchWebForBrief(payload.brief);
                break;
            case 'performResearch':
                // Research always uses Gemini internally — no adapter needed
                result = await performResearch(
                    payload.topics,
                    payload.audience,
                    payload.timeRange,
                    payload.excludeHeadlines,
                    payload.specificDomains
                );
                break;
            case 'generateSubjectLines': {
                const apiKey = getApiKeyForProvider(payload.provider);
                const adapter = createProvider(payload.provider, apiKey);
                result = await generateSubjectLines(
                    adapter,
                    payload.brief,
                    payload.style,
                    payload.count,
                    payload.customPrompts,
                    payload.guardrails,
                    payload.researchContext,
                    payload.baseSubjectLine
                );
                break;
            }
        }

        console.log(
            JSON.stringify({
                requestId,
                route: '/api/ai/generate',
                feature: featureMethod,
                provider: providerName,
                success: true,
                latencyMs: Date.now() - start,
                promptLength,
            })
        );

        return jsonResponse(result, 200);
    } catch (error: any) {
        console.error(
            JSON.stringify({
                requestId,
                route: '/api/ai/generate',
                feature: featureMethod,
                success: false,
                latencyMs: Date.now() - start,
                error: error?.message || String(error) || 'Unknown error',
            })
        );

        return jsonResponse({ error: 'AI processing failed', requestId }, 500);
    }
}
