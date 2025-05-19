'use client';

import { getRedirectResult } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

import { LoginForm } from '@/components/auth/LoginForm';
import { useSession } from '@/components/providers/SessionProvider';
import { auth } from '@/lib/firebase';

/**
 *
 */
export default function LoginPage() {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Handle redirect result
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          toast.success('Successfully signed in!');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Redirect result error:', error);
        toast.error('Failed to sign in');
      }
    };

    handleRedirectResult();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
