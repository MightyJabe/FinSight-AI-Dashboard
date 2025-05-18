import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import '@/app/globals.css';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { SWRProvider } from '@/components/providers/SWRProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FinSight AI Dashboard',
  description: 'Your AI-powered financial dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SWRProvider>
          <SessionProvider>
            <ErrorBoundary>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow">{children}</main>
                <Footer />
              </div>
              <Toaster position="top-right" />
            </ErrorBoundary>
          </SessionProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
