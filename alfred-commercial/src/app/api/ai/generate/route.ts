export const runtime = 'nodejs';

import { NextRequest } from 'next/server';

// Simple in-memory rate limiter — max 20 requests per minute per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
import { z } from 'zod';
import {
    generateIdeas,
    generateDrafts,
    refineDraft,
    refineDraftSelection,
    performResearch,
    generateSubjectLines,
} from '@/services/geminiService';
import { createStyleFromDescription, createStyleFromData } from '@/services/styleAnalyzer';
import { safeRandomUUID } from '@/server/uuid';
import { createProvider } from '@/services/providers/factory';
import { serverConfig } from '@/server/config';
import { AIProvider } from '@/types';
import { checkAndIncrementUsage } from '@/server/usageService';

// Helper: Native JSON response with strict sanitization for Edge
function jsonResponse(payload: unknown, status = 200) {
    const safePayload = JSON.parse(JSON.stringify(payload ?? null));

    return new globalThis.Response(JSON.stringify(safePayload), {
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
        dos: z.string(),
        donts: z.string(),
    })
    .optional();

const CreateStyleFromDescriptionSchema = z.object({
    feature: z.literal('createStyleFromDescription'),
    provider: ProviderField,
    styleName: z.string(),
    description: z.string(),
    guardrails: GuardrailsSchema,
});

const CsvRowSchema = z.object({
    content: z.string(),
    likes: z.number(),
});

const CreateStyleFromDataSchema = z.object({
    feature: z.literal('createStyleFromData'),
    provider: ProviderField,
    styleName: z.string(),
    data: z.array(CsvRowSchema),
    nativeFormat: z.string(),
    guardrails: GuardrailsSchema,
});

const GenerateIdeasSchema = z.object({
    feature: z.literal('generateIdeas'),
    provider: ProviderField,
    brief: z.string(),
    style: z.string(),
    format: z.string(),
    existingIdeas: z.array(z.any()).optional(),
    customPrompts: z.record(z.string()).optional(),
    guardrails: GuardrailsSchema,
    researchContext: z.array(z.any()).optional(),
    nativeFormat: z.string().optional(),
});

const GenerateDraftsSchema = z.object({
    feature: z.literal('generateDrafts'),
    provider: ProviderField,
    idea: z.any(),
    style: z.string(),
    format: z.string(),
    additionalInstructions: z.string().optional(),
    customPrompts: z.record(z.string()).optional(),
    guardrails: GuardrailsSchema,
    researchContext: z.array(z.any()).optional(),
    nativeFormat: z.string().optional(),
    newsletterSubjectLine: z.string().optional(),
});

const RefineDraftSchema = z.object({
    feature: z.literal('refineDraft'),
    provider: ProviderField,
    currentContent: z.string(),
    feedback: z.string(),
    style: z.string(),
    format: z.string(),
    customPrompts: z.record(z.string()).optional(),
    guardrails: GuardrailsSchema,
    nativeFormat: z.string().optional(),
});

const RefineDraftSelectionSchema = z.object({
    feature: z.literal('refineDraftSelection'),
    provider: ProviderField,
    fullText: z.string(),
    selectedText: z.string(),
    feedback: z.string(),
    style: z.string(),
    format: z.string(),
    customPrompts: z.record(z.string()).optional(),
    guardrails: GuardrailsSchema,
    nativeFormat: z.string().optional(),
});

const PerformResearchSchema = z.object({
    feature: z.literal('performResearch'),
    // Research always uses Gemini — no provider field needed
    topics: z.string(),
    audience: z.string(),
    timeRange: z.enum(['24h', '3d', '7d', '30d']),
    excludeHeadlines: z.array(z.string()).default([]),
    specificDomains: z.array(z.string()).default([]),
});

const GenerateSubjectLinesSchema = z.object({
    feature: z.literal('generateSubjectLines'),
    provider: ProviderField,
    brief: z.string(),
    style: z.string(),
    count: z.number().default(5),
    customPrompts: z.record(z.string()).optional(),
    guardrails: GuardrailsSchema,
    researchContext: z.array(z.any()).optional(),
    baseSubjectLine: z.string().optional(),
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

    // Auth guard — verify Appwrite JWT sent by the client
    try {
        const jwt = req.headers.get('x-appwrite-user-jwt') || '';
        const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
        const appwriteProjectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';

        if (!jwt) {
            return jsonResponse({ error: 'Unauthorized. Please log in to use Alfred.' }, 401);
        }

        const authCheck = await fetch(`${appwriteEndpoint}/account`, {
            headers: {
                'X-Appwrite-Project': appwriteProjectId,
                'X-Appwrite-JWT': jwt,
            },
        });

        if (!authCheck.ok) {
            return jsonResponse({ error: 'Unauthorized. Please log in to use Alfred.' }, 401);
        }

        // Rate limiting — 20 requests per minute per user
        const authData = await authCheck.json();
        userId = authData.$id || 'unknown';
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
    } catch {
        return jsonResponse({ error: 'Authentication check failed. Please log in.' }, 401);
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

        // Usage check — enforce monthly limits and feature gating
        const format = 'format' in payload ? (payload as any).format as string : undefined;
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

        if (payload.feature === 'createStyleFromDescription') promptLength = payload.description.length;
        if (payload.feature === 'createStyleFromData') promptLength = JSON.stringify(payload.data).length;
        if (payload.feature === 'generateIdeas') promptLength = payload.brief.length;
        if (payload.feature === 'generateDrafts') promptLength = JSON.stringify(payload.idea).length;
        if (payload.feature === 'refineDraft') promptLength = payload.currentContent.length + payload.feedback.length;
        if (payload.feature === 'refineDraftSelection') promptLength = payload.fullText.length + payload.selectedText.length;
        if (payload.feature === 'performResearch') promptLength = payload.topics.length;
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
