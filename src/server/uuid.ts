import 'server-only';

/**
 * Generates a random UUID safely in Edge runtime environments (like Cloudflare Workers).
 *
 * This works around the "Illegal invocation" error that can occur when calling
 * `crypto.randomUUID()` directly if it's not properly bound to the `crypto` object.
 */
export function safeRandomUUID(): string {
    // 1. Try standards-compliant crypto.randomUUID with explicit binding
    if (typeof globalThis.crypto?.randomUUID === 'function') {
        try {
            return globalThis.crypto.randomUUID.bind(globalThis.crypto)();
        } catch (e) {
            console.warn('safeRandomUUID: Bound crypto.randomUUID failed, falling back to RFC4122', e);
        }
    }

    // 2. Fallback: CSPRNG via crypto.getRandomValues (RFC4122 v4)
    // This is supported in virtually all modern JS environments including Edge
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
        try {
            const arr = new Uint8Array(16);
            globalThis.crypto.getRandomValues(arr);

            // Per RFC 4122:
            // - Set the 4 most significant bits of the 7th byte to 0100 (version 4)
            arr[6] = (arr[6] & 0x0f) | 0x40;
            // - Set the 2 most significant bits of the 9th byte to 10 (variant 1)
            arr[8] = (arr[8] & 0x3f) | 0x80;

            const hex = [...arr].map((b) => b.toString(16).padStart(2, '0')).join('');
            // Format: 8-4-4-4-12
            return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
        } catch (e) {
            console.error('safeRandomUUID: crypto.getRandomValues failed', e);
        }
    }

    // 3. Last resort: Math.random (Not cryptographically secure, but functional)
    console.warn('safeRandomUUID: Using Math.random fallback (insecure)');
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
