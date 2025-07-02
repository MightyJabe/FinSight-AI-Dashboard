'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useSession } from '@/components/providers/SessionProvider';

interface AuthGuardProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

/**
 * Component that protects routes requiring authentication
 */
export function AuthGuard({ children, requireEmailVerification = false }: AuthGuardProps) {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requireEmailVerification && !user.emailVerified) {
        router.push('/verify-email');
      }
    }
  }, [user, loading, router, requireEmailVerification]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
