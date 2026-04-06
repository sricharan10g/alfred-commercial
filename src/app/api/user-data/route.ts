export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { getUserData, setUserData } from '@/server/userDataService';
import { verifyJwt } from '@/server/auth';

function json(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload ?? null), {
        status,
        headers: { 'content-type': 'application/json' },
    });
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
