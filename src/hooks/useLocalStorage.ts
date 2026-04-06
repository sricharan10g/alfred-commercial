'use client';

import { useState, useEffect, useRef } from 'react';

export function useLocalStorage<T>(
    key: string,
    initialValue: T,
    sanitize?: (value: T) => T
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            if (item === null) return initialValue;
            const parsed = JSON.parse(item) as T;
            return sanitize ? sanitize(parsed) : parsed;
        } catch {
            return initialValue;
        }
    });

    // Debounced write — waits 500ms after the last change before persisting.
    // Prevents rapid-fire localStorage writes (e.g. sessions array changing often).
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            try {
                window.localStorage.setItem(key, JSON.stringify(storedValue));
            } catch (e) {
                console.warn(`Failed to save to localStorage key "${key}":`, e);
            }
        }, 500);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
}
