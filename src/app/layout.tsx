import '@/app/globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Footer } from '@/components/common/Footer';
import { Header } from '@/components/common/Header';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { SWRProvider } from '@/components/providers/SWRProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FinSight AI Dashboard',
  description: 'Your AI-powered financial dashboard',
};

/**
 *
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen bg-gradient-to-br from-background via-white to-accent/10 antialiased`}
      >
        <SessionProvider>
          <SWRProvider>
            <ErrorBoundary>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
                  {children}
                </main>
                <Footer />
                <Toaster position="top-right" />
              </div>
            </ErrorBoundary>
          </SWRProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
