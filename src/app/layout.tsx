import './globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
    title: 'Alfred',
    description: 'AI Writing Assistant',
    icons: {
        icon: '/icon.svg',
        apple: '/apple-icon.png',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark h-full">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                {/* PWA — full-screen on iOS home screen, hides Safari chrome */}
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="Alfred" />
                <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
                <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
            </head>
            <body className="bg-gray-50 dark:bg-black text-zinc-900 dark:text-zinc-100 antialiased h-full overflow-hidden transition-colors duration-300 ease-in-out" style={{ minHeight: '-webkit-fill-available' }}>
                <Providers>
                    <div id="root" className="h-full">{children}</div>
                </Providers>
            </body>
        </html>
    );
}
