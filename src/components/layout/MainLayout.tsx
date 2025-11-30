'use client';

import { Toaster } from 'react-hot-toast';

import { CommandPalette } from '@/components/common/CommandPalette';
import { Header } from '@/components/common/Header';
import { Navigation } from '@/components/common/Navigation';
import { useSession } from '@/components/providers/SessionProvider';
import QuickCashEntry from '@/components/transactions/QuickCashEntry';

interface RootLayoutContentProps {
  children: React.ReactNode;
}

export function RootLayoutContent({ children }: RootLayoutContentProps) {
  const { user, loading } = useSession();

  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
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
