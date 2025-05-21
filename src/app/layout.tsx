import '@/app/globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { RootLayoutContent } from '@/components/layout/MainLayout';
import { SessionProvider } from '@/components/providers/SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FinSight AI Dashboard',
  description: 'Your AI-powered financial dashboard',
};

/** Root layout component that wraps the entire application */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const bodyClassName = `${inter.className} min-h-screen bg-gradient-to-br from-background via-white to-accent/10 antialiased`;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClassName}>
        <SessionProvider>
          <RootLayoutContent>{children}</RootLayoutContent>
        </SessionProvider>
      </body>
    </html>
  );
}
