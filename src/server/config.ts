import 'server-only';
import { z } from 'zod';

const serverEnvSchema = z.object({
    APPWRITE_API_KEY: z.string().min(1),
    AI_PROVIDER_KEY: z.string().min(1), // Gemini API key (required for research)
    ANTHROPIC_API_KEY: z.string().optional().transform(v => v || undefined), // Claude API key
    OPENAI_API_KEY: z.string().optional().transform(v => v || undefined), // OpenAI API key
    APPWRITE_DATABASE_ID: z.string().optional(),
    APPWRITE_USAGE_COLLECTION_ID: z.string().optional(),
});

export type ServerConfig = z.infer<typeof serverEnvSchema>;

let _cached: ServerConfig | null = null;

export function getServerConfig(): ServerConfig {
    if (_cached) return _cached;

    const processEnv = {
        APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
        AI_PROVIDER_KEY: process.env.AI_PROVIDER_KEY,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        APPWRITE_DATABASE_ID: process.env.APPWRITE_DATABASE_ID,
        APPWRITE_USAGE_COLLECTION_ID: process.env.APPWRITE_USAGE_COLLECTION_ID,
    };

    const parsed = serverEnvSchema.safeParse(processEnv);

    if (!parsed.success) {
        console.error('❌ Invalid server environment variables:', parsed.error.format());
        throw new Error('Invalid server environment variables');
    }

    _cached = parsed.data;
    return _cached;
}

export const serverConfig: ServerConfig = new Proxy({} as ServerConfig, {
    get(_target, prop) {
        const cfg = getServerConfig() as any;
        return cfg[prop as any];
    },
});
