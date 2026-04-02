import 'server-only';

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '';
const COLLECTION_ID = process.env.APPWRITE_USER_DATA_COLLECTION_ID || 'user_data';

function appwriteHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY,
    };
}

function docUrl(userId: string) {
    return `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${encodeURIComponent(userId)}`;
}

export async function getUserData(userId: string): Promise<object | null> {
    try {
        const res = await fetch(docUrl(userId), { headers: appwriteHeaders() });
        if (!res.ok) return null;
        const doc = await res.json();
        if (!doc.payload) return null;
        return JSON.parse(doc.payload);
    } catch {
        return null;
    }
}

export async function setUserData(userId: string, data: object): Promise<void> {
    // Strip large / runtime-only fields from sessions before saving
    const cleaned = {
        ...(data as any),
        sessions: ((data as any).sessions ?? []).map((s: any) => {
            const { researchResults, isProcessing, isResearching, isRefining, ...rest } = s;
            void researchResults; // explicitly dropped — too large to sync
            return rest;
        }),
    };

    const payload = JSON.stringify(cleaned);

    // Try PATCH (update) first; fall back to POST (create) if doc doesn't exist yet
    const patchRes = await fetch(docUrl(userId), {
        method: 'PATCH',
        headers: appwriteHeaders(),
        body: JSON.stringify({ data: { payload } }),
    });

    if (patchRes.status === 404) {
        await fetch(
            `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`,
            {
                method: 'POST',
                headers: appwriteHeaders(),
                body: JSON.stringify({ documentId: userId, data: { payload } }),
            }
        );
    }
}
