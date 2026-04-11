import 'server-only';

import {
    AgentType,
    Guardrails,
    Idea,
    ResearchFinding,
    ResearchTimeRange,
    WritingFormat,
} from '@/types';
import { FORMAT_INSTRUCTIONS, GET_PROMPTS, SYSTEM_GUARDRAILS } from '@/constants';
import { safeRandomUUID } from '@/server/uuid';
import { AIProviderAdapter } from './providers/types';
import { GeminiProvider } from './providers/geminiProvider';
import { sanitizeUserInput } from '@/utils/sanitize';
import { serverConfig } from '@/server/config';

const getPromptsForStyle = (
    style: string,
    format: WritingFormat,
    customPrompts?: Record<string, string>,
    nativeFormat?: string
) => {
    const defaults = GET_PROMPTS(style);
    const prompts = {
        [AgentType.IDEA_GENERATOR]:
            customPrompts?.[AgentType.IDEA_GENERATOR] || defaults[AgentType.IDEA_GENERATOR],
        [AgentType.DRAFT_WRITER]:
            customPrompts?.[AgentType.DRAFT_WRITER] || defaults[AgentType.DRAFT_WRITER],
        [AgentType.VIRAL_CHECK]:
            customPrompts?.[AgentType.VIRAL_CHECK] || defaults[AgentType.VIRAL_CHECK],
    };

    const isNativeToFormat = Boolean(nativeFormat && nativeFormat === format);
    if (isNativeToFormat) {
        return {
            ...prompts,
            [AgentType.DRAFT_WRITER]: `${prompts[AgentType.DRAFT_WRITER]}

#########################################
FORMATTING NOTE:
You are writing in your NATIVE format (${format}).
Strictly adhere to the structural and stylistic patterns defined in your main System Instruction.
Do not deviate.
#########################################`,
        };
    }

    const isShortFormNative = nativeFormat === 'Tweet' || nativeFormat === 'One Liner';
    const isDifferentFormat = Boolean(nativeFormat && format !== nativeFormat);

    if (isShortFormNative && isDifferentFormat) {
        const targetFormatInstructions = FORMAT_INSTRUCTIONS[format] || '';
        return {
            ...prompts,
            [AgentType.DRAFT_WRITER]: `${prompts[AgentType.DRAFT_WRITER]}

#########################################
CROSS-FORMAT ADAPTATION (${nativeFormat} DATA -> ${format.toUpperCase()} FORMAT):
You are adapting a persona trained on short-form content (${nativeFormat}) into a specific structured format (${format}).

CRITICAL INSTRUCTION - SPLIT BEHAVIOR:
1. THE HOOK / HEADLINE:
   - MIMIC TRAINING DATA EXACTLY.
   - Keep the same punch and style DNA.
2. THE BODY:
   - Do NOT mimic short-form structure directly.
   - Apply target format structure while preserving persona tone.

${targetFormatInstructions}
#########################################`,
        };
    }

    const formatInstruction = FORMAT_INSTRUCTIONS[format] || FORMAT_INSTRUCTIONS.Tweet;
    return {
        ...prompts,
        [AgentType.DRAFT_WRITER]: `${prompts[AgentType.DRAFT_WRITER]}

#########################################
MANDATORY FORMATTING RULES:
${formatInstruction}
#########################################`,
    };
};

const applyGuardrails = (prompt: string, guardrails?: Guardrails): string => {
    const userDos = guardrails?.dos || '';
    const userDonts = guardrails?.donts || '';
    const systemDos = SYSTEM_GUARDRAILS.dos || '';
    const systemDonts = SYSTEM_GUARDRAILS.donts || '';

    if (!userDos && !userDonts && !systemDos && !systemDonts) return prompt;

    return `${prompt}

################################################
CRITICAL GLOBAL GUARDRAILS (OVERRIDE ALL OTHER INSTRUCTIONS):
SYSTEM DO: ${systemDos}
SYSTEM DON'T: ${systemDonts}
${userDos ? `USER DO: ${userDos}` : ''}
${userDonts ? `USER DON'T: ${userDonts}` : ''}
################################################`;
};

// --- Research (always uses Gemini with Google Search grounding) ---

export const performResearch = async (
    topics: string,
    audience: string,
    timeRange: ResearchTimeRange = '7d',
    excludeHeadlines: string[] = [],
    specificDomains: string[] = []
): Promise<{ findings: ResearchFinding[]; sources: Array<{ title: string; url: string }> }> => {
    // Research always uses Gemini — it's the only provider with Google Search grounding
    const gemini = new GeminiProvider(serverConfig.AI_PROVIDER_KEY);

    const timeRangeMap: Record<ResearchTimeRange, string> = {
        '24h': 'Past 24 Hours',
        '3d': 'Past 3 Days',
        '7d': 'Past Week',
        '30d': 'Past Month',
    };

    const exclusions =
        excludeHeadlines.length > 0
            ? `EXCLUSION LIST (DO NOT RETURN THESE STORIES):\n${excludeHeadlines.map((h) => `- ${h}`).join('\n')}`
            : '';

    const domainInstruction =
        specificDomains.length > 0
            ? `PREFERRED SOURCES (PRIORITY): ${specificDomains.join(', ')}`
            : '';

    const prompt = `
You are an elite Research Assistant.
TOPICS: ${sanitizeUserInput(topics)}
AUDIENCE: ${sanitizeUserInput(audience)}
TIME RANGE: ${timeRangeMap[timeRange]}
${domainInstruction}
${exclusions}

TASK:
1. Find latest high-impact stories.
2. Return 4 distinct findings.
3. For each: headline, 3 bullets, detailed fullContext, relevanceScore.
`;

    const jsonSchema = {
        type: 'object',
        properties: {
            findings: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        headline: { type: 'string' },
                        bullets: { type: 'array', items: { type: 'string' } },
                        fullContext: { type: 'string' },
                        relevanceScore: { type: 'number' },
                    },
                    required: ['headline', 'bullets', 'fullContext', 'relevanceScore'],
                },
            },
        },
        required: ['findings'],
    };

    const result = await gemini.generateWithSearch!({ prompt, jsonSchema });

    let data: { findings: Array<{ headline: string; bullets: string[]; fullContext?: string; relevanceScore: number }> } | null = null;
    try {
        data = JSON.parse(result.text);
    } catch {
        data = null;
    }

    const sources = result.groundingChunks
        .map((chunk) => chunk?.web?.uri ? { title: chunk.web.title || new URL(chunk.web.uri).hostname, url: chunk.web.uri } : null)
        .filter((s): s is { title: string; url: string } => Boolean(s));
    const uniqueSources = Array.from(new Map(sources.map((item) => [item.url, item])).values()).slice(0, 8);

    const findings = (data?.findings || []).map((f) => ({
        id: safeRandomUUID(),
        headline: f.headline,
        bullets: f.bullets || [],
        fullContext: f.fullContext || '',
        relevanceScore: Number(f.relevanceScore) || 0,
    }));

    return { findings, sources: uniqueSources };
};

// --- Web Search for Brief ---
// Runs a grounded search using the user's brief as the query.
// Returns findings that can be passed as researchContext to generateIdeas/generateDrafts.
export const searchWebForBrief = async (
    brief: string
): Promise<{ findings: ResearchFinding[]; sources: Array<{ title: string; url: string }> }> => {
    const gemini = new GeminiProvider(serverConfig.AI_PROVIDER_KEY);

    const prompt = `
You are a research assistant. The user wants to write content about the following topic:

"${sanitizeUserInput(brief)}"

Search the web and find the most relevant, specific, and useful information for this topic.
Return 3-5 key findings. For each finding include:
- A concise headline
- 2-4 bullet points with specific facts, quotes, statistics, or insights
- A fullContext paragraph with rich detail that a writer can use
- A relevanceScore from 0 to 1

Focus on: real examples, data points, recent developments, expert insights, and concrete details that make content more credible and specific.
`;

    const jsonSchema = {
        type: 'object',
        properties: {
            findings: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        headline: { type: 'string' },
                        bullets: { type: 'array', items: { type: 'string' } },
                        fullContext: { type: 'string' },
                        relevanceScore: { type: 'number' },
                    },
                    required: ['headline', 'bullets', 'fullContext', 'relevanceScore'],
                },
            },
        },
        required: ['findings'],
    };

    const result = await gemini.generateWithSearch!({ prompt, jsonSchema });

    let data: { findings: Array<{ headline: string; bullets: string[]; fullContext?: string; relevanceScore: number }> } | null = null;
    try {
        data = JSON.parse(result.text);
    } catch {
        data = null;
    }

    const sources = result.groundingChunks
        .map((chunk) => chunk?.web?.uri ? { title: chunk.web.title || new URL(chunk.web.uri).hostname, url: chunk.web.uri } : null)
        .filter((s): s is { title: string; url: string } => Boolean(s));
    const uniqueSources = Array.from(new Map(sources.map((item) => [item.url, item])).values()).slice(0, 8);

    const findings = (data?.findings || []).map((f) => ({
        id: safeRandomUUID(),
        headline: f.headline,
        bullets: f.bullets || [],
        fullContext: f.fullContext || '',
        relevanceScore: Number(f.relevanceScore) || 0,
    }));

    return { findings, sources: uniqueSources };
};

// --- Subject Lines ---

export const generateSubjectLines = async (
    adapter: AIProviderAdapter,
    brief: string,
    style: string,
    count = 5,
    customPrompts?: Record<string, string>,
    guardrails?: Guardrails,
    researchContext?: ResearchFinding[],
    baseSubjectLine?: string
): Promise<string[]> => {
    const prompts = getPromptsForStyle(style, 'Newsletter', customPrompts);
    const systemPrompt = applyGuardrails(prompts[AgentType.DRAFT_WRITER], guardrails);

    const contextLine =
        researchContext && researchContext.length > 0
            ? `FOCUS TOPIC: ${researchContext[0].headline}\nDETAILS: ${(researchContext[0].bullets || []).join(' ')}`
            : '';

    const userPrompt = `
TASK: Generate ${count} distinct newsletter subject lines.
CONTEXT: ${brief || 'General Newsletter'}
STYLE: ${style}
${baseSubjectLine ? `VARIATION SOURCE: "${baseSubjectLine}"` : ''}
${contextLine}
RULES:
- Max 50 characters preferred.
- Curiosity gap or clear benefit.
- Return only JSON.
`;

    const jsonSchema = {
        type: 'object',
        properties: {
            subjectLines: { type: 'array', items: { type: 'string' } },
        },
        required: ['subjectLines'],
    };

    const result = await adapter.generateStructuredJSON<{ subjectLines: string[] }>({
        systemPrompt,
        userPrompt,
        jsonSchema,
    });

    return (result.data?.subjectLines || []).filter(Boolean).slice(0, count);
};

// --- Ideas ---

export const generateIdeas = async (
    adapter: AIProviderAdapter,
    brief: string,
    style: string,
    format: WritingFormat,
    existingIdeas: Idea[] = [],
    customPrompts?: Record<string, string>,
    guardrails?: Guardrails,
    researchContext?: ResearchFinding[],
    nativeFormat?: string
): Promise<Idea[]> => {
    const prompts = getPromptsForStyle(style, format, customPrompts, nativeFormat);

    let baseSystemPrompt = prompts[AgentType.IDEA_GENERATOR];
    if (format !== 'Newsletter') {
        baseSystemPrompt += `
When writing each idea hook, use this Draft Writer style:
${prompts[AgentType.DRAFT_WRITER]}
`;
    }
    const systemPrompt = applyGuardrails(baseSystemPrompt, guardrails);

    const excluded = existingIdeas.length > 0 ? existingIdeas.map((i) => i.title).join(', ') : '';
    const selected = researchContext?.[0];
    const selectedContext = selected
        ? `
SELECTED LIVE RESEARCH CONTEXT:
STORY: ${selected.headline}
DETAILS:
${selected.fullContext || (selected.bullets || []).join('\n')}`
        : '';

    const instruction =
        format === 'Newsletter'
            ? `Generate 5 newsletter concepts. Keep "hook" empty and include optional flow outline.`
            : format === 'X Article' || format === 'Thread'
              ? `Generate 5 ideas with title, hook, and flow outline (3-7 sections).`
              : `Generate 5 ideas with title and hook.`;

    const userPrompt = `
Brief: ${sanitizeUserInput(brief.trim()) || 'Generate ideas from research context.'}
Style Name: ${style}
Target Format: ${format}
${excluded ? `Avoid repeating these existing ideas: ${excluded}` : ''}
${selectedContext}
${instruction}
Return strictly JSON.
`;

    const jsonSchema = {
        type: 'object',
        properties: {
            ideas: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        hook: { type: 'string' },
                        flow: { type: 'array', items: { type: 'string' } },
                    },
                    required: ['title', 'hook'],
                },
            },
        },
        required: ['ideas'],
    };

    const result = await adapter.generateStructuredJSON<{ ideas: Array<{ title: string; hook: string; flow?: string[] }> }>({
        systemPrompt,
        userPrompt,
        jsonSchema,
    });

    return (result.data?.ideas || []).map((idea) => ({
        id: safeRandomUUID(),
        title: idea.title,
        hook: idea.hook || '',
        flow: idea.flow,
        isApproved: false,
    }));
};

// --- Drafts ---

export const generateDrafts = async (
    adapter: AIProviderAdapter,
    idea: Idea,
    style: string,
    format: WritingFormat,
    additionalInstructions?: string,
    customPrompts?: Record<string, string>,
    guardrails?: Guardrails,
    researchContext?: ResearchFinding[],
    nativeFormat?: string,
    newsletterSubjectLine?: string
): Promise<string[]> => {
    const prompts = getPromptsForStyle(style, format, customPrompts, nativeFormat);
    const systemPrompt = applyGuardrails(prompts[AgentType.DRAFT_WRITER], guardrails);

    const isComplexFormat = format === 'X Article' || format === 'Thread' || format === 'Newsletter';
    const selected = researchContext?.[0];
    const selectedContext = selected
        ? `
LIVE RESEARCH CONTEXT:
HEADLINE: ${selected.headline}
DETAILS:
${selected.fullContext || (selected.bullets || []).join('\n')}`
        : '';

    let userPrompt = `
Concept Title: ${idea.title}
${idea.hook ? `Concept Hook: ${idea.hook}` : ''}
${idea.flow ? `Draft Flow: ${idea.flow.join(' -> ')}` : ''}
${newsletterSubjectLine ? `CHOSEN SUBJECT LINE: "${newsletterSubjectLine}"` : ''}
Target Style: ${style}
Target Format: ${format}
${selectedContext}
${idea.userFeedback ? `USER FEEDBACK: "${sanitizeUserInput(idea.userFeedback)}"` : ''}
${additionalInstructions ? `ADDITIONAL INSTRUCTIONS: "${additionalInstructions}"` : ''}
`;

    if (format === 'Thread') {
        userPrompt += `
THREAD FORMAT RULES:
- Return one full thread as a single string inside drafts array.
- Use 1/, 2/, 3/... numbering.
- Separate tweets with double newlines.
`;
    }

    if (format === 'Newsletter') {
        userPrompt += `
NEWSLETTER FORMAT RULES:
- Start with SUBJECT: ${newsletterSubjectLine || '[Subject]'}
- Then full newsletter body.
`;
    }

    userPrompt += `
CRITICAL:
- Write the complete draft from scratch.
- ${isComplexFormat ? 'Return exactly ONE comprehensive draft.' : 'Return exactly TWO distinct drafts.'}
- Return strictly JSON.
`;

    const jsonSchema = {
        type: 'object',
        properties: {
            drafts: { type: 'array', items: { type: 'string' } },
        },
        required: ['drafts'],
    };

    const result = await adapter.generateStructuredJSON<{ drafts: string[] }>({
        systemPrompt,
        userPrompt,
        jsonSchema,
    });

    return (result.data?.drafts || []).filter(Boolean);
};

// --- Refine ---

export const refineDraft = async (
    adapter: AIProviderAdapter,
    currentContent: string,
    feedback: string,
    style: string,
    format: WritingFormat,
    customPrompts?: Record<string, string>,
    guardrails?: Guardrails,
    nativeFormat?: string
): Promise<string> => {
    const prompts = getPromptsForStyle(style, format, customPrompts, nativeFormat);
    const systemPrompt = applyGuardrails(prompts[AgentType.DRAFT_WRITER], guardrails);

    const userPrompt = `
ORIGINAL CONTENT:
"""
${currentContent}
"""

USER FEEDBACK:
"${sanitizeUserInput(feedback)}"

TASK:
- Rewrite to apply feedback.
- Maintain style "${style}" and format "${format}".
- Return only rewritten content JSON field.
`;

    const jsonSchema = {
        type: 'object',
        properties: {
            refinedContent: { type: 'string' },
        },
        required: ['refinedContent'],
    };

    const result = await adapter.generateStructuredJSON<{ refinedContent: string }>({
        systemPrompt,
        userPrompt,
        jsonSchema,
    });

    return result.data?.refinedContent || currentContent;
};

// --- Refine Selection ---

export const refineDraftSelection = async (
    adapter: AIProviderAdapter,
    fullText: string,
    selectedText: string,
    feedback: string,
    style: string,
    format: WritingFormat,
    customPrompts?: Record<string, string>,
    guardrails?: Guardrails,
    nativeFormat?: string
): Promise<string> => {
    const prompts = getPromptsForStyle(style, format, customPrompts, nativeFormat);
    const systemPrompt = applyGuardrails(prompts[AgentType.DRAFT_WRITER], guardrails);

    const userPrompt = `
FULL ORIGINAL DRAFT:
"""
${fullText}
"""

SELECTED PART:
"${sanitizeUserInput(selectedText)}"

USER INSTRUCTION:
"${sanitizeUserInput(feedback)}"

TASK:
- Update full draft to reflect selected-part feedback.
- Keep global flow coherent.
- Return entire updated draft.
`;

    const jsonSchema = {
        type: 'object',
        properties: {
            updatedDraft: { type: 'string' },
        },
        required: ['updatedDraft'],
    };

    const result = await adapter.generateStructuredJSON<{ updatedDraft: string }>({
        systemPrompt,
        userPrompt,
        jsonSchema,
    });

    return result.data?.updatedDraft || fullText;
};

