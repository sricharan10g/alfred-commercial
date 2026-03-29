'use client';

import { useRef, useCallback } from 'react';

export function useThrottledCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 2000
): T {
    const lastCall = useRef(0);

    return useCallback(
        ((...args: any[]) => {
            const now = Date.now();
            if (now - lastCall.current >= delay) {
                lastCall.current = now;
                return callback(...args);
            }
        }) as T,
        [callback, delay]
    );
}
