export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { getUserData, setUserData } from '@/server/userDataService';

function json(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload ?? null), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

async function verifyJwt(req: NextRequest): Promise<string | null> {
    const jwt = req.headers.get('x-appwrite-user-jwt') || '';
    if (!jwt) return null;
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'}/account`,
            {
                headers: {
                    'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
                    'X-Appwrite-JWT': jwt,
                },
            }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.$id || null;
    } catch {
        return null;
    }
}

export async function GET(req: NextRequest) {
    const userId = await verifyJwt(req);
    if (!userId) return json({ error: 'Unauthorized' }, 401);

    const data = await getUserData(userId);
    return json(data ?? {});
}

export async function POST(req: NextRequest) {
    const userId = await verifyJwt(req);
    if (!userId) return json({ error: 'Unauthorized' }, 401);

    try {
        const body = await req.json();
        await setUserData(userId, body);
        return json({ ok: true });
    } catch (e) {
        console.error('[user-data] Save failed:', e);
        return json({ error: 'Save failed' }, 500);
    }
}
