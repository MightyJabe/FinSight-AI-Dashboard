import '@/app/globals.css';

import { Inter } from 'next/font/google';

import { ClientWrapper } from '@/components/layout/ClientWrapper';

const inter = Inter({ subsets: ['latin'] });

/** Root layout component that wraps the entire application */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>FinSight AI Dashboard</title>
        <meta name="description" content="Your AI-powered financial dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <script dangerouslySetInnerHTML={{
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
          `
        }} />
      </head>
      <body className={`${inter.className} overflow-x-hidden`}>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
