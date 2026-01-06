'use client';

import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

import { Header } from '@/components/common/Header';
import { Navigation } from '@/components/common/Navigation';
import { useSession } from '@/components/providers/SessionProvider';
import QuickCashEntry from '@/components/transactions/QuickCashEntry';

const CommandPalette = dynamic(
  () => import('@/components/common/CommandPalette').then(mod => mod.CommandPalette),
  { ssr: false }
);

interface RootLayoutContentProps {
  children: React.ReactNode;
}

export function RootLayoutContent({ children }: RootLayoutContentProps) {
  const { user, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [checkedOnboarding, setCheckedOnboarding] = useState(false);

  // Redirect logged-in users to onboarding if not complete (skip on onboarding route)
  useEffect(() => {
    // No user - no need to check onboarding
    if (!user) {
      setCheckedOnboarding(true);
      return;
    }
    // Skip check on onboarding route
    if (pathname.startsWith('/onboarding')) {
      setCheckedOnboarding(true);
      return;
    }
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch('/api/user/settings');
        if (!res.ok) return;
        const data = await res.json();
        if (!data.onboardingComplete && !cancelled) {
          router.replace('/onboarding');
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setCheckedOnboarding(true);
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, [user, router, pathname]);

  if (loading || (!user && !checkedOnboarding)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Landing page layout (no auth required)
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-6 py-8">{children}</main>
        <Toaster position="top-right" />
      </div>
    );
  }

  // Authenticated user layout
  return (
    <div className="min-h-screen bg-background">
      <CommandPalette />
      <Header />
      <div className="flex h-[calc(100vh-64px)]">
        <Navigation />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
      <QuickCashEntry />
      <Toaster position="top-right" />
    </div>
  );
}
