import { Idea, CustomStyle, CsvRow, ResearchFinding, WritingFormat, AgentType, Guardrails, ResearchTimeRange, AIProvider } from '../types';
import { account } from './appwrite';

// Custom error class that carries HTTP status and paywall metadata
export class ApiError extends Error {
    status: number;
    reason?: string;
    plan?: string;
    remaining?: number;
    monthlyLimit?: number;

    constructor(message: string, status: number, body?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.reason = body?.reason;
        this.plan = body?.plan;
        this.remaining = body?.remaining;
        this.monthlyLimit = body?.monthlyLimit;
    }
}

// Get a short-lived JWT from Appwrite for server-side auth verification
async function getJWT(): Promise<string | null> {
    try {
        const jwt = await account.createJWT();
        return jwt.jwt;
    } catch {
        return null;
    }
}

// Stable UUID for this browser/device, used to track guest generation quota.
// Stored in localStorage so it persists across page loads (but not incognito sessions).
function getGuestSessionId(): string {
    if (typeof window === 'undefined') return '';
    let id = localStorage.getItem('alfred_guest_session');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('alfred_guest_session', id);
    }
    return id;
}

async function post<T>(feature: string, body: any): Promise<T> {
    const jwt = await getJWT();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (jwt) {
        headers['x-appwrite-user-jwt'] = jwt;
    } else {
        // No active session — send guest ID so the API can track guest quota
        const guestId = getGuestSessionId();
        if (guestId) headers['x-guest-session-id'] = guestId;
    }

    const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ feature, ...body })
    });

    if (!res.ok) {
        let errorBody: any = {};
        try {
            errorBody = await res.json();
        } catch {
            try { errorBody = { error: await res.text() }; } catch { /* ignore */ }
        }
        throw new ApiError(errorBody.error || 'API Request Failed', res.status, errorBody);
    }

    return res.json();
}

// --- Style Analyzer Wrappers ---

export const createStyleFromDescription = (
    styleName: string,
    description: string,
    guardrails?: Guardrails,
    provider: AIProvider = 'gemini'
): Promise<CustomStyle> =>
    post<CustomStyle>('createStyleFromDescription', { styleName, description, guardrails, provider });

export const createStyleFromData = (
    styleName: string,
    data: CsvRow[],
    nativeFormat: string,
    guardrails?: Guardrails,
    provider: AIProvider = 'gemini'
): Promise<CustomStyle> =>
    post<CustomStyle>('createStyleFromData', { styleName, data, nativeFormat, guardrails, provider });

// --- Generation Wrappers ---

export const generateIdeas = (
    brief: string,
    style: string,
    format: WritingFormat,
    existingIdeas?: Idea[],
    customPrompts?: Record<AgentType, string>,
    guardrails?: Guardrails,
    researchContext?: ResearchFinding[],
    nativeFormat?: string,
    provider: AIProvider = 'gemini'
): Promise<Idea[]> =>
    post<Idea[]>('generateIdeas', { brief, style, format, existingIdeas, customPrompts, guardrails, researchContext, nativeFormat, provider });

export const generateDrafts = (
    idea: Idea,
    style: string,
    format: WritingFormat,
    additionalInstructions?: string,
    customPrompts?: Record<AgentType, string>,
    guardrails?: Guardrails,
    researchContext?: ResearchFinding[],
    nativeFormat?: string,
    newsletterSubjectLine?: string,
    provider: AIProvider = 'gemini'
): Promise<string[]> =>
    post<string[]>('generateDrafts', { idea, style, format, additionalInstructions, customPrompts, guardrails, researchContext, nativeFormat, newsletterSubjectLine, provider });

export const refineDraft = (
    currentContent: string,
    feedback: string,
    style: string,
    format: WritingFormat,
    customPrompts?: Record<AgentType, string>,
    guardrails?: Guardrails,
    nativeFormat?: string,
    provider: AIProvider = 'gemini'
): Promise<string> =>
    post<string>('refineDraft', { currentContent, feedback, style, format, customPrompts, guardrails, nativeFormat, provider });

export const refineDraftSelection = (
    fullText: string,
    selectedText: string,
    feedback: string,
    style: string,
    format: WritingFormat,
    customPrompts?: Record<AgentType, string>,
    guardrails?: Guardrails,
    nativeFormat?: string,
    provider: AIProvider = 'gemini'
): Promise<string> =>
    post<string>('refineDraftSelection', { fullText, selectedText, feedback, style, format, customPrompts, guardrails, nativeFormat, provider });

export const performResearch = (
    topics: string,
    audience: string,
    timeRange: ResearchTimeRange,
    excludeHeadlines: string[] = [],
    specificDomains: string[] = []
): Promise<{ findings: ResearchFinding[]; sources: Array<{ title: string; url: string }> }> =>
    post('performResearch', { topics, audience, timeRange, excludeHeadlines, specificDomains });

export const searchWebForBrief = (
    brief: string
): Promise<{ findings: ResearchFinding[]; sources: Array<{ title: string; url: string }> }> =>
    post('searchWebForBrief', { brief });
    // Research always uses Gemini — no provider parameter needed

export const generateSubjectLines = (
    brief: string,
    style: string,
    count: number = 5,
    customPrompts?: Record<AgentType, string>,
    guardrails?: Guardrails,
    researchContext?: ResearchFinding[],
    baseSubjectLine?: string,
    provider: AIProvider = 'gemini'
): Promise<string[]> =>
    post<string[]>('generateSubjectLines', { brief, style, count, customPrompts, guardrails, researchContext, baseSubjectLine, provider });

// --- Provider Availability ---

export const getAvailableProviders = async (): Promise<Record<AIProvider, boolean>> => {
    const res = await fetch('/api/ai/providers');
    if (!res.ok) return { gemini: true, claude: false, openai: false };
    return res.json();
};

// --- Usage / Plan ---

export const fetchUsage = async (): Promise<{
    plan: string;
    monthCount: number;
    monthlyLimit: number;
    remaining: number;
} | null> => {
    try {
        const jwt = await getJWT();
        const headers: Record<string, string> = {};
        if (jwt) headers['x-appwrite-user-jwt'] = jwt;

        const res = await fetch('/api/ai/usage', { headers });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
};
