import 'server-only';
import { PAID_ONLY_FORMATS } from '@/constants';

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '';
const COLLECTION_ID = process.env.APPWRITE_USAGE_COLLECTION_ID || 'user_usage';

// Monthly generation limits per plan
export const PLAN_MONTHLY_LIMITS: Record<string, number> = {
    free: 40,
    starter: 350,
    pro: 1500,
};

function appwriteHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY,
    };
}

function startOfMonth(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

export interface UsageRecord {
    $id: string;
    userId: string;
    plan: string;
    monthStart: number;
    monthCount: number;
    windowStart: number;
    windowCount: number;
}

export interface UsageStatus {
    plan: string;
    monthCount: number;
    monthlyLimit: number;
    remaining: number;
}

export interface UsageCheckResult extends UsageStatus {
    allowed: boolean;
    reason?: 'monthly_limit' | 'feature_gated';
}

async function getUserUsage(userId: string): Promise<UsageRecord | null> {
    try {
        // Direct document fetch using userId as the document ID — O(1), no query needed,
        // and guarantees uniqueness (Appwrite rejects duplicate creates for the same ID)
        const url = `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${encodeURIComponent(userId)}`;
        const res = await fetch(url, { headers: appwriteHeaders() });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

async function createUsageRecord(userId: string): Promise<UsageRecord | null> {
    try {
        const now = Date.now();
        const res = await fetch(
            `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`,
            {
                method: 'POST',
                headers: appwriteHeaders(),
                body: JSON.stringify({
                    documentId: userId,  // use userId as doc ID → Appwrite enforces uniqueness
                    data: {
                        userId,
                        plan: 'free',
                        monthStart: startOfMonth(),
                        monthCount: 0,
                        windowStart: now,
                        windowCount: 0,
                    },
                }),
            }
        );
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

async function patchUsageRecord(docId: string, updates: Record<string, unknown>): Promise<void> {
    try {
        await fetch(
            `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${docId}`,
            {
                method: 'PATCH',
                headers: appwriteHeaders(),
                body: JSON.stringify({ data: updates }),
            }
        );
    } catch {
        console.error('[usageService] Failed to update usage record');
    }
}

// Get a user's current plan and usage (read-only, no increment)
export async function getUserStatus(userId: string): Promise<UsageStatus> {
    const record = await getUserUsage(userId);
    const plan = record?.plan || 'free';
    const monthlyLimit = PLAN_MONTHLY_LIMITS[plan] ?? PLAN_MONTHLY_LIMITS.free;
    const currentMonthStart = startOfMonth();
    const monthCount = record && record.monthStart >= currentMonthStart ? record.monthCount : 0;
    return {
        plan,
        monthCount,
        monthlyLimit,
        remaining: Math.max(0, monthlyLimit - monthCount),
    };
}

// Update a user's subscription plan (called from Dodo webhook)
export async function updateUserPlan(userId: string, plan: string): Promise<void> {
    try {
        const record = await getUserUsage(userId);
        if (record) {
            await patchUsageRecord(record.$id, { plan });
        } else {
            // No record yet — create one with the new plan
            const now = Date.now();
            await fetch(
                `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`,
                {
                    method: 'POST',
                    headers: appwriteHeaders(),
                    body: JSON.stringify({
                        documentId: userId,  // use userId as doc ID → Appwrite enforces uniqueness
                        data: {
                            userId,
                            plan,
                            monthStart: startOfMonth(),
                            monthCount: 0,
                            windowStart: now,
                            windowCount: 0,
                        },
                    }),
                }
            );
        }
    } catch (error) {
        console.error('[usageService] Failed to update user plan:', error);
        throw error;
    }
}

// Check usage limits and increment if allowed
export async function checkAndIncrementUsage(userId: string, format?: string): Promise<UsageCheckResult> {
    let record = await getUserUsage(userId);

    if (!record) {
        record = await createUsageRecord(userId);
        if (!record) {
            // Fail open — can't reach DB, allow the request
            return { allowed: true, plan: 'free', monthCount: 0, monthlyLimit: 40, remaining: 40 };
        }
    }

    const plan = record.plan || 'free';
    const monthlyLimit = PLAN_MONTHLY_LIMITS[plan] ?? PLAN_MONTHLY_LIMITS.free;
    const currentMonthStart = startOfMonth();

    // Check if month rolled over
    let monthCount = record.monthCount;
    const monthReset = record.monthStart < currentMonthStart;
    if (monthReset) {
        monthCount = 0;
    }

    // Feature gating — free users cannot use X Article or Newsletter
    if (format && PAID_ONLY_FORMATS.includes(format) && plan === 'free') {
        return {
            allowed: false,
            reason: 'feature_gated',
            plan,
            monthCount,
            monthlyLimit,
            remaining: monthlyLimit - monthCount,
        };
    }

    // Monthly limit check
    if (monthCount >= monthlyLimit) {
        return {
            allowed: false,
            reason: 'monthly_limit',
            plan,
            monthCount,
            monthlyLimit,
            remaining: 0,
        };
    }

    // Increment usage
    const newMonthCount = monthCount + 1;
    const updates: Record<string, unknown> = {
        monthCount: newMonthCount,
        windowCount: record.windowCount + 1,
    };
    if (monthReset) {
        updates.monthStart = currentMonthStart;
        updates.windowStart = Date.now();
        updates.windowCount = 1;
    }
    await patchUsageRecord(record.$id, updates);

    return {
        allowed: true,
        plan,
        monthCount: newMonthCount,
        monthlyLimit,
        remaining: monthlyLimit - newMonthCount,
    };
}
