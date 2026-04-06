export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { verifyJwt } from '@/server/auth';

export async function GET(req: NextRequest) {
    // Auth guard — verify JWT (consistent with all other routes)
    const userId = await verifyJwt(req);
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
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
