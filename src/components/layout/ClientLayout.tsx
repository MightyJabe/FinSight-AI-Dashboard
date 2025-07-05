'use client';

import { RootLayoutContent } from './MainLayout';

/**
 *
 */
export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <RootLayoutContent>{children}</RootLayoutContent>;
}
