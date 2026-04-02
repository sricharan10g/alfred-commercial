export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import DodoPayments from 'dodopayments';

export async function POST(req: NextRequest) {
    try {
        const { plan, userId, email, name } = await req.json();

        if (!plan || !userId || !email) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const starterProductId = process.env.DODO_STARTER_PRODUCT_ID;
        const proProductId = process.env.DODO_PRO_PRODUCT_ID;
        const apiKey = process.env.DODO_API_KEY;
        const environment = (process.env.DODO_ENVIRONMENT || 'test_mode') as 'test_mode' | 'live_mode';

        if (!apiKey) {
            return Response.json({ error: 'Payment not configured' }, { status: 500 });
        }

        const productId = plan === 'starter' ? starterProductId : proProductId;
        if (!productId) {
            return Response.json({ error: 'Product not found' }, { status: 500 });
        }

        const client = new DodoPayments({ bearerToken: apiKey, environment });

        // Derive the base URL from the incoming request so it works on both
        // localhost and the live Cloudflare URL without any build-time baking
        const appUrl = new URL(req.url).origin;

        const session = await client.checkoutSessions.create({
            product_cart: [{ product_id: productId, quantity: 1 }],
            customer: { email, name: name || email },
            return_url: `${appUrl}/?payment=success&plan=${plan}`,
            metadata: { userId, plan },
        });

        return Response.json({ checkoutUrl: session.checkout_url });
    } catch (error) {
        console.error('[checkout] Error:', error);
        return Response.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }
}
