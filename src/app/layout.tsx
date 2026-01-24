import '@/app/globals.css';

import { Inter, Outfit, DM_Serif_Display } from 'next/font/google';

import PerformanceMonitor from '@/components/common/PerformanceMonitor';
import { WebVitals } from '@/components/common/WebVitals';
import { ClientWrapper } from '@/components/layout/ClientWrapper';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400'],
  style: ['normal', 'italic'],
});

/** Root layout component that wraps the entire application */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSerif.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <title>FinSight AI Dashboard</title>
        <meta name="description" content="Track your net worth, manage finances, and get AI-powered insights - the #1 personal finance app for Israeli users" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#3b82f6" />

        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="FinSight AI" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FinSight" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />

        {/* PWA Icons */}
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              const theme = localStorage.getItem('theme');
              const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              const resolvedTheme = theme === 'system' || !theme ? systemTheme : theme;
              
              document.documentElement.classList.add(resolvedTheme);
              
              // Update theme-color meta tag
              const metaThemeColor = document.querySelector('meta[name="theme-color"]');
              if (metaThemeColor) {
                metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#1f2937' : '#ffffff');
              }
            })();
          `,
          }}
        />
      </head>
      <body className={`${outfit.className} overflow-x-hidden`}>
        <ClientWrapper>{children}</ClientWrapper>
        <PerformanceMonitor />
        <WebVitals />
      </body>
    </html>
  );
}
