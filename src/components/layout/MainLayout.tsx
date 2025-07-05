'use client';

import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Footer } from '@/components/common/Footer';
import { Header } from '@/components/common/Header';
import { Navigation } from '@/components/common/Navigation';
import { useSession } from '@/components/providers/SessionProvider';
import { SWRProvider } from '@/components/providers/SWRProvider';

interface RootLayoutContentProps {
  children: React.ReactNode;
}

/** Main layout component that handles authenticated and public routes */
export function RootLayoutContent({ children }: RootLayoutContentProps) {
  const { user, loading } = useSession();
  const pathname = usePathname();
  const isPublicRoute = ['/', '/login', '/signup'].includes(pathname);

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Public layout (homepage, login, signup)
  if (!user || isPublicRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-white to-accent/10 antialiased">
        <div className="flex min-h-screen">
          <div className="flex-1">
            <Header />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8">{children}</main>
            <Footer />
            <Toaster position="top-right" />
          </div>
        </div>
      </div>
    );
  }

  // Authenticated layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-white to-accent/10 antialiased overflow-x-hidden">
      <SWRProvider>
        <ErrorBoundary>
          <div className="lg:flex min-h-screen overflow-x-hidden">
            <Navigation />
            <div className="flex-1 min-w-0 w-full">
              <Header />
              <main className="flex-1 w-full max-w-none px-4 py-8 pt-16 lg:pt-8 lg:px-8 overflow-x-hidden">{children}</main>
              <Footer />
              <Toaster position="top-right" />
            </div>
          </div>
        </ErrorBoundary>
      </SWRProvider>
    </div>
  );
}
