import 'server-only';

import OpenAI from 'openai';
import { AIProviderAdapter, GenerateParams, GenerateResult } from './types';

function toOpenAISchema(schema: Record<string, unknown>): Record<string, unknown> {
    // OpenAI structured outputs require additionalProperties: false on all objects
    const addAdditionalProperties = (s: any): any => {
        if (!s || typeof s !== 'object') return s;

        const result = { ...s };

        if (result.type === 'object' && result.properties) {
            result.additionalProperties = false;
            const newProps: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(result.properties)) {
                newProps[key] = addAdditionalProperties(value);
            }
            result.properties = newProps;
        }

        if (result.type === 'array' && result.items) {
            result.items = addAdditionalProperties(result.items);
        }

        return result;
    };

    return addAdditionalProperties(schema);
}

export class OpenAIProvider implements AIProviderAdapter {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-4.1') {
        this.client = new OpenAI({ apiKey });
        this.model = model;
    }

    async generateStructuredJSON<T>(params: GenerateParams): Promise<GenerateResult<T>> {
        const openaiSchema = toOpenAISchema(params.jsonSchema);

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: params.systemPrompt },
                { role: 'user', content: params.userPrompt },
            ],
            response_format: {
                type: 'json_schema',
                json_schema: {
                    name: 'structured_output',
                    strict: true,
                    schema: openaiSchema,
                },
            },
            ...(params.temperature !== undefined && { temperature: params.temperature }),
        });

        const text = response.choices[0]?.message?.content || '';
        let data: T | null = null;
        try {
            data = JSON.parse(text) as T;
        } catch {
            data = null;
        }

        return { data, rawText: text };
    }

    // OpenAI does not support Google Search grounding — research stays on Gemini
}
