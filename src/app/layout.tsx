import './globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
    title: 'Alfred',
    description: 'AI Writing Assistant',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
            </head>
            <body className="bg-gray-50 dark:bg-black text-zinc-900 dark:text-zinc-100 antialiased h-[125vh] overflow-hidden transition-colors duration-300 ease-in-out">
                <Providers>
                    <div id="root">{children}</div>
                </Providers>
            </body>
        </html>
    );
}
