"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-black text-black dark:text-white">
            <h2 className="text-2xl font-bold mb-4">Well, that wasn&apos;t supposed to happen.</h2>
            <button
                onClick={() => reset()}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded hover:opacity-90 transition"
            >
                Give it another shot
            </button>
        </div>
    );
}
