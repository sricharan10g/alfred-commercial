export const runtime = 'nodejs';

import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    // Auth guard — same protection as /api/ai/generate
    try {
        const cookie = req.headers.get('cookie') || '';
        const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
        const appwriteProjectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';

        const authCheck = await fetch(`${appwriteEndpoint}/account`, {
            headers: {
                'X-Appwrite-Project': appwriteProjectId,
                'Cookie': cookie,
            },
        });

        if (!authCheck.ok) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'content-type': 'application/json' },
            });
        }
    } catch {
        return new Response(JSON.stringify({ error: 'Authentication failed' }), {
            status: 401,
            headers: { 'content-type': 'application/json' },
        });
    }

    return new Response(
        JSON.stringify({
            gemini: true, // Always available — required for research
            claude: !!process.env.ANTHROPIC_API_KEY,
            openai: !!process.env.OPENAI_API_KEY,
        }),
        {
            status: 200,
            headers: {
                'content-type': 'application/json; charset=utf-8',
                'cache-control': 'no-store',
            },
        }
    );
}
