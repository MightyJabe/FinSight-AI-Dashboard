'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * PageTransition component provides smooth animations when navigating between pages
 * Uses Framer Motion for enter/exit animations with spring physics
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          type: 'spring',
          stiffness: 380,
          damping: 30,
          mass: 0.8,
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Variant for fade-only transitions (no vertical movement)
 * Useful for subtle transitions or content that shouldn't shift
 */
export function PageTransitionFade({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Variant for slide transitions from the side
 * Creates a drawer-like effect when transitioning
 */
export function PageTransitionSlide({ children, direction = 'right' }: PageTransitionProps & { direction?: 'left' | 'right' }) {
  const pathname = usePathname();
  const slideAmount = direction === 'right' ? 100 : -100;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: slideAmount }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -slideAmount }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
