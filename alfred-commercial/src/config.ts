import { z } from 'zod';

const safeSchema = z.object({
    APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    PUBLIC_APP_URL: z.string().url().optional(),
    APPWRITE_ENDPOINT: z.string().url().optional(),
    APPWRITE_PROJECT_ID: z.string().min(1).optional(),
});

const env = {
    APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development',
    PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
};

const safeParsed = safeSchema.safeParse(env);

export const config = {
    APP_ENV: (safeParsed.success ? safeParsed.data.APP_ENV : 'development') as
        | 'development'
        | 'staging'
        | 'production',
    PUBLIC_APP_URL: safeParsed.success ? safeParsed.data.PUBLIC_APP_URL : undefined,
    APPWRITE_ENDPOINT: safeParsed.success ? safeParsed.data.APPWRITE_ENDPOINT : undefined,
    APPWRITE_PROJECT_ID: safeParsed.success ? safeParsed.data.APPWRITE_PROJECT_ID : undefined,
};


const requiredPublicSchema = z.object({
    PUBLIC_APP_URL: z.string().url(),
    APPWRITE_ENDPOINT: z.string().url(),
    APPWRITE_PROJECT_ID: z.string().min(1),
});

export function getPublicConfig() {
    const parsed = requiredPublicSchema.safeParse({
        PUBLIC_APP_URL: config.PUBLIC_APP_URL,
        APPWRITE_ENDPOINT: config.APPWRITE_ENDPOINT,
        APPWRITE_PROJECT_ID: config.APPWRITE_PROJECT_ID,
    });

    if (!parsed.success) {
        console.error('❌ Invalid public environment variables:', parsed.error.format());
        throw new Error('Invalid public environment variables');
    }

    return parsed.data; // fully typed as required strings
}