import 'server-only';

import Anthropic from '@anthropic-ai/sdk';
import { AIProviderAdapter, GenerateParams, GenerateResult } from './types';

function jsonSchemaToToolSchema(schema: Record<string, unknown>): Record<string, unknown> {
    // Claude's tool input_schema uses standard JSON Schema, so minimal conversion needed.
    // Just ensure we have required top-level fields.
    return {
        type: schema.type || 'object',
        properties: schema.properties || {},
        required: schema.required || [],
    };
}

export class ClaudeProvider implements AIProviderAdapter {
    private client: Anthropic;
    private model: string;

    constructor(apiKey: string, model: string = 'claude-sonnet-4-6-20250514') {
        this.client = new Anthropic({ apiKey });
        this.model = model;
    }

    async generateStructuredJSON<T>(params: GenerateParams): Promise<GenerateResult<T>> {
        const toolName = 'structured_output';
        const inputSchema = jsonSchemaToToolSchema(params.jsonSchema);

        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 8192,
            system: params.systemPrompt,
            tools: [
                {
                    name: toolName,
                    description: 'Return the structured output as JSON.',
                    input_schema: inputSchema as Anthropic.Tool.InputSchema,
                },
            ],
            tool_choice: { type: 'tool', name: toolName },
            messages: [
                {
                    role: 'user',
                    content: params.userPrompt,
                },
            ],
            ...(params.temperature !== undefined && { temperature: params.temperature }),
        });

        // Extract the tool use result
        let data: T | null = null;
        let rawText = '';

        for (const block of response.content) {
            if (block.type === 'tool_use' && block.name === toolName) {
                data = block.input as T;
                rawText = JSON.stringify(block.input);
                break;
            }
        }

        return { data, rawText };
    }

    // Claude does not support web search grounding — research stays on Gemini
}
