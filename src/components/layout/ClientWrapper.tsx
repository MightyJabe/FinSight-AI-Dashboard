'use client';

import { RootLayoutContent } from '@/components/layout/MainLayout';
import { SessionProvider } from '@/components/providers/SessionProvider';

interface ClientWrapperProps {
  children: React.ReactNode;
}

/**
 *
 */
export function ClientWrapper({ children }: ClientWrapperProps) {
  return (
    <SessionProvider>
      <RootLayoutContent>{children}</RootLayoutContent>
    </SessionProvider>
  );
}
