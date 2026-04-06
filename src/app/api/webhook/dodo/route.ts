export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { Webhook } from 'standardwebhooks';
import { updateUserPlan } from '@/server/usageService';

export async function POST(req: NextRequest) {
    const webhookKey = process.env.DODO_WEBHOOK_KEY;
    if (!webhookKey) {
        console.error('[webhook/dodo] DODO_WEBHOOK_KEY not set');
        return new Response('Webhook key not configured', { status: 500 });
    }

    // Read raw body for signature verification
    const rawBody = await req.text();
    const headers = {
        'webhook-id': req.headers.get('webhook-id') ?? '',
        'webhook-signature': req.headers.get('webhook-signature') ?? '',
        'webhook-timestamp': req.headers.get('webhook-timestamp') ?? '',
    };

    // Verify signature
    try {
        const wh = new Webhook(webhookKey);
        await wh.verify(rawBody, headers);
    } catch {
        console.error('[webhook/dodo] Invalid signature');
        return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { type, data } = payload;

    // Extract userId and plan from metadata we passed during checkout
    const userId = data?.metadata?.userId as string | undefined;
    const plan = data?.metadata?.plan as string | undefined;

    console.log(`[webhook/dodo] Event: ${type} | userId: ${userId} | plan: ${plan}`);

    try {
        switch (type) {
            case 'subscription.active':
            case 'payment.succeeded':
                // payment.succeeded fires alongside subscription.active on initial payment;
                // acts as a backup in case subscription.active is delayed or missing
                if (userId && plan) {
                    await updateUserPlan(userId, plan);
                    console.log(`[webhook/dodo] ✅ Upgraded ${userId} → ${plan} (via ${type})`);
                } else {
                    console.log(`[webhook/dodo] ${type} received but missing userId/plan in metadata`);
                }
                break;

            case 'subscription.cancelled':
            case 'subscription.expired':
            case 'subscription.failed':
                if (userId) {
                    await updateUserPlan(userId, 'free');
                    console.log(`[webhook/dodo] ⬇️ Downgraded ${userId} → free (via ${type})`);
                }
                break;

            case 'subscription.renewed':
                // Plan stays the same on renewal, no action needed
                console.log(`[webhook/dodo] 🔄 Renewal confirmed for ${userId}`);
                break;

            case 'payment.processing':
                // Payment initiated but not yet settled — nothing to do yet
                console.log(`[webhook/dodo] ⏳ Payment processing for userId: ${userId}`);
                break;

            default:
                console.log(`[webhook/dodo] Unhandled event: ${type}`);
        }
    } catch (error) {
        console.error('[webhook/dodo] Failed to process event:', error);
        // Return 500 so Dodo retries — the user paid, we must not silently drop this
        return new Response('Processing failed', { status: 500 });
    }

    return new Response('OK', { status: 200 });
}
