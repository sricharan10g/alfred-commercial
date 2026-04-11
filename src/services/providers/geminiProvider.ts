import 'server-only';

import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { AIProviderAdapter, GenerateParams, GenerateResult, SearchResult } from './types';

function convertJsonSchemaToGemini(schema: Record<string, unknown>): any {
    const typeMap: Record<string, any> = {
        string: Type.STRING,
        number: Type.NUMBER,
        integer: Type.NUMBER,
        boolean: Type.BOOLEAN,
        array: Type.ARRAY,
        object: Type.OBJECT,
    };

    const convert = (s: any): any => {
        if (!s || typeof s !== 'object') return s;

        const result: any = {};

        if (s.type) {
            result.type = typeMap[s.type] ?? s.type;
        }

        if (s.properties) {
            result.properties = {};
            for (const [key, value] of Object.entries(s.properties)) {
                result.properties[key] = convert(value);
            }
        }

        if (s.items) {
            result.items = convert(s.items);
        }

        if (s.required) {
            result.required = s.required;
        }

        if (s.description) {
            result.description = s.description;
        }

        return result;
    };

    return convert(schema);
}

export class GeminiProvider implements AIProviderAdapter {
    private ai: GoogleGenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gemini-3-flash-preview') {
        this.ai = new GoogleGenAI({ apiKey });
        this.model = model;
    }

    async generateStructuredJSON<T>(params: GenerateParams): Promise<GenerateResult<T>> {
        const geminiSchema = convertJsonSchemaToGemini(params.jsonSchema);

        const response = await this.ai.models.generateContent({
            model: this.model,
            contents: params.userPrompt,
            config: {
                systemInstruction: params.systemPrompt,
                responseMimeType: 'application/json',
                responseSchema: geminiSchema,
                thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
                ...(params.temperature !== undefined && { temperature: params.temperature }),
            },
        });

        const text = response.text || '';

        // Token usage logging — check Cloudflare Dashboard → Workers → alfred-commercial → Observability → Logs
        // or run: wrangler tail alfred-commercial --format pretty
        const usage = response.usageMetadata;
        if (usage) {
            const total   = usage.promptTokenCount     ?? 0;
            const cached  = usage.cachedContentTokenCount ?? 0;
            const output  = usage.candidatesTokenCount ?? 0;
            const paid    = total - cached;
            console.log(
                `[Gemini tokens] prompt=${total} cached=${cached} paid_input=${paid} output=${output} cache_hit=${cached > 0}`
            );
        }

        let data: T | null = null;
        try {
            data = JSON.parse(text) as T;
        } catch {
            data = null;
        }

        return { data, rawText: text };
    }

    async generateWithSearch(params: {
        prompt: string;
        jsonSchema: Record<string, unknown>;
    }): Promise<SearchResult> {
        // Google Search grounding is incompatible with responseSchema / responseMimeType.
        // We ask for JSON in the prompt and extract it from the plain-text response.
        const promptWithJsonInstruction = `${params.prompt}

IMPORTANT: Respond with ONLY a valid JSON object. No markdown, no code fences, no explanation.`;

        const response = await this.ai.models.generateContent({
            model: this.model,
            contents: promptWithJsonInstruction,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const rawText = response.text || '';

        // Strip markdown code fences if the model wraps the output anyway
        const jsonText = rawText
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```\s*$/, '')
            .trim();

        const chunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []).map((chunk: any) => ({
            web: chunk?.web ? { uri: chunk.web.uri || '', title: chunk.web.title } : undefined,
        }));

        return {
            text: jsonText,
            groundingChunks: chunks,
        };
    }
}
