'use client';

import { MotionConfig } from 'framer-motion';

import { RootLayoutContent } from '@/components/layout/MainLayout';
import { SessionProvider } from '@/components/providers/SessionProvider';

interface ClientWrapperProps {
  children: React.ReactNode;
}

/**
 * Client-side wrapper that provides global context and animation configuration
 * Wraps the app with MotionConfig for consistent animation behavior and reduced motion support
 */
export function ClientWrapper({ children }: ClientWrapperProps) {
  return (
    <MotionConfig reducedMotion="user">
      <SessionProvider>
        <RootLayoutContent>{children}</RootLayoutContent>
      </SessionProvider>
    </MotionConfig>
  );
}
