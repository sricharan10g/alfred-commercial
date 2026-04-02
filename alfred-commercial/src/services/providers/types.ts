import 'server-only';

export interface GenerateParams {
    systemPrompt: string;
    userPrompt: string;
    jsonSchema: Record<string, unknown>;
    temperature?: number;
}

export interface GenerateResult<T = unknown> {
    data: T | null;
    rawText: string;
}

export interface SearchResult {
    text: string;
    groundingChunks: Array<{
        web?: { uri: string; title?: string };
    }>;
}

export interface AIProviderAdapter {
    generateStructuredJSON<T>(params: GenerateParams): Promise<GenerateResult<T>>;
    generateWithSearch?(params: {
        prompt: string;
        jsonSchema: Record<string, unknown>;
    }): Promise<SearchResult>;
}
