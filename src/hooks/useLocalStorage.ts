'use client';

import { useState, useEffect, useCallback } from 'react';

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

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (e) {
            console.warn(`Failed to save to localStorage key "${key}":`, e);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
}
