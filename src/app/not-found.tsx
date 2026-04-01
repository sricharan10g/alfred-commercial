"use client";

import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-black text-black dark:text-white">
            <h2 className="text-3xl font-bold mb-4">Nothing here.</h2>
            <p className="mb-6 text-gray-500">This page doesn&apos;t exist — or it moved without telling us.</p>
            <Link
                href="/"
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded hover:opacity-90 transition"
            >
                Back to home
            </Link>
        </div>
    );
}
