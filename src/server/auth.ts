import 'server-only';

import { NextRequest } from 'next/server';

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';

// Simple in-memory JWT cache — avoids re-verifying the same token on every request.
// Each entry expires after 5 minutes. The cache is bounded to prevent memory leaks.
const JWT_CACHE_TTL_MS = 5 * 60 * 1000;
const JWT_CACHE_MAX_SIZE = 500;
const jwtCache = new Map<string, { userId: string; expiresAt: number }>();

function pruneJwtCache() {
    if (jwtCache.size <= JWT_CACHE_MAX_SIZE) return;
    const now = Date.now();
    for (const [key, entry] of jwtCache) {
        if (entry.expiresAt <= now || jwtCache.size > JWT_CACHE_MAX_SIZE) {
            jwtCache.delete(key);
        }
    }
}

/**
 * Verify an Appwrite JWT and return the userId.
 * Results are cached for 5 minutes to avoid round-tripping to Appwrite on every request.
 */
export async function verifyJwt(req: NextRequest): Promise<string | null> {
    const jwt = req.headers.get('x-appwrite-user-jwt') || '';
    if (!jwt) return null;

    // Check cache first
    const cached = jwtCache.get(jwt);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.userId;
    }

    try {
        const res = await fetch(`${APPWRITE_ENDPOINT}/account`, {
            headers: {
                'X-Appwrite-Project': APPWRITE_PROJECT_ID,
                'X-Appwrite-JWT': jwt,
            },
        });
        if (!res.ok) return null;
        const data = await res.json();
        const userId = data.$id || null;

        if (userId) {
            pruneJwtCache();
            jwtCache.set(jwt, { userId, expiresAt: Date.now() + JWT_CACHE_TTL_MS });
        }

        return userId;
    } catch {
        return null;
    }
}
