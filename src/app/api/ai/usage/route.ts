export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { getUserStatus } from '@/server/usageService';

export async function GET(req: NextRequest) {
    // Auth guard — verify Appwrite JWT sent by the client
    try {
        const jwt = req.headers.get('x-appwrite-user-jwt') || '';
        const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
        const appwriteProjectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';

        if (!jwt) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'content-type': 'application/json' },
            });
        }

        const authCheck = await fetch(`${appwriteEndpoint}/account`, {
            headers: {
                'X-Appwrite-Project': appwriteProjectId,
                'X-Appwrite-JWT': jwt,
            },
        });

        if (!authCheck.ok) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'content-type': 'application/json' },
            });
        }

        const authData = await authCheck.json();
        const userId: string = authData.$id || 'unknown';

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
