"use client";

import { useEffect } from "react";

export default function GlobalError({
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
        <html>
            <body className="bg-gray-50 dark:bg-black text-black dark:text-white flex items-center justify-center h-screen">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold mb-4">Well, that wasn&apos;t supposed to happen.</h2>
                    <p className="mb-6 text-gray-500">{error.message}</p>
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        Give it another shot
                    </button>
                </div>
            </body>
        </html>
    );
}
