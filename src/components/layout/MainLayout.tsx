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
  className?: string;
}

/** Main layout component that handles authenticated and public routes */
export function RootLayoutContent({ children, className }: RootLayoutContentProps) {
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
      <div className={className}>
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
    <div className={className}>
      <SWRProvider>
        <ErrorBoundary>
          <div className="flex min-h-screen">
            <Navigation />
            <div className="flex-1">
              <Header />
              <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8">{children}</main>
              <Footer />
              <Toaster position="top-right" />
            </div>
          </div>
        </ErrorBoundary>
      </SWRProvider>
    </div>
  );
}
