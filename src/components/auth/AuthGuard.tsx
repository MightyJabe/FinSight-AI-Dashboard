'use client';

import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { auth } from '@/lib/firebase';

interface AuthGuardProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

/**
 *
 */
export function AuthGuard({ children, requireEmailVerification = false }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      console.error('Firebase auth is not initialized');
      router.push('/login');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, user => {
      if (!user) {
        router.push('/login');
      } else if (requireEmailVerification && !user.emailVerified) {
        router.push('/verify-email');
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, requireEmailVerification]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  return <>{children}</>;
}
