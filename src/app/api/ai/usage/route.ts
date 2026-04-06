export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { getUserStatus } from '@/server/usageService';
import { verifyJwt } from '@/server/auth';

export async function GET(req: NextRequest) {
    try {
        const userId = await verifyJwt(req);
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'content-type': 'application/json' },
            });
        }

        const status = await getUserStatus(userId);

        return new Response(JSON.stringify(status), {
            status: 200,
            headers: {
                'content-type': 'application/json; charset=utf-8',
                'cache-control': 'no-store',
            },
        });
    } catch {
        return new Response(JSON.stringify({ error: 'Failed to get usage' }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}
