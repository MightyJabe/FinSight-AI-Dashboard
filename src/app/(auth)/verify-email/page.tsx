'use client';

import { reload, sendEmailVerification } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';

import { auth } from '@/lib/firebase';

/**
 *
 */
export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      console.error('Firebase auth is not initialized');
      router.push('/login');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.emailVerified) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleResendVerification = async () => {
    if (!auth) {
      console.error('Firebase auth is not initialized');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      await sendEmailVerification(user);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to send verification email');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!auth) {
      console.error('Firebase auth is not initialized');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      await reload(user);
      if (user.emailVerified) {
        toast.success('Email verified! Redirecting to dashboard...');
        router.push('/dashboard');
      } else {
        toast.error(
          'Email not verified yet. Please check your inbox and click the verification link.'
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to check verification status');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" />
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We&apos;ve sent you a verification email. Please check your inbox and click the
            verification link.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Resend verification email'}
            </button>

            <button
              type="button"
              onClick={handleCheckVerification}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              I&apos;ve verified my email
            </button>
          </div>

          <div className="text-center">
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
