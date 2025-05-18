import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import './globals.css';
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const SessionContext = createContext<User | null>(null);

export function useSession() {
  return useContext(SessionContext);
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  title: 'FinSight AI Dashboard',
  description: 'AI-powered financial insights and analytics dashboard',
  keywords: ['finance', 'dashboard', 'analytics', 'AI', 'financial insights'],
  icons: {
    icon: '/favicon.svg',
  },
};

// Placeholder theme logic (replace with your theme provider or logic)
const theme =
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : '';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  return (
    <html lang="en" className={theme === 'dark' ? 'dark' : ''}>
      <body
        className={`${inter.variable} min-h-screen bg-page dark:bg-page-dark text-text dark:text-text-dark font-sans antialiased`}
      >
        <SessionContext.Provider value={user}>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </SessionContext.Provider>
      </body>
    </html>
  );
}
