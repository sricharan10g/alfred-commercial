import 'server-only';

import { AIProviderAdapter } from './types';
import { GeminiProvider } from './geminiProvider';
import { ClaudeProvider } from './claudeProvider';
import { OpenAIProvider } from './openaiProvider';
import { AIProvider } from '@/types';

export function createProvider(provider: AIProvider, apiKey: string): AIProviderAdapter {
    switch (provider) {
        case 'gemini':
            return new GeminiProvider(apiKey);
        case 'claude':
            return new ClaudeProvider(apiKey);
        case 'openai':
            return new OpenAIProvider(apiKey);
        default:
            throw new Error(`Unknown AI provider: ${provider}`);
    }
}
