'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

import { CommandPaletteProvider } from '@/components/common/CommandPalette';
import { Header } from '@/components/common/Header';
import { Navigation } from '@/components/common/Navigation';
import { useSession } from '@/components/providers/SessionProvider';
import QuickCashEntry from '@/components/transactions/QuickCashEntry';

interface RootLayoutContentProps {
  children: React.ReactNode;
}

export function RootLayoutContent({ children }: RootLayoutContentProps) {
  const { user, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [checkedOnboarding, setCheckedOnboarding] = useState(false);

  // Onboarding redirect disabled for testing
  useEffect(() => {
    setCheckedOnboarding(true);
  }, []);

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
    <CommandPaletteProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex h-[calc(100vh-64px)]">
          {/* Hide navigation on mobile, show on tablet+ */}
          <div className="hidden md:block">
            <Navigation />
          </div>
          <main className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
              <div className="animate-in">
                {children}
              </div>
            </div>
          </main>
        </div>
        <QuickCashEntry />
        <Toaster position="top-right" />
      </div>
    </CommandPaletteProvider>
  );
}
