'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { sendEmailVerification, reload } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function DashboardPage() {
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    if (!auth) {
      console.error('Firebase auth is not initialized');
      return;
    }

    const user = auth.currentUser;
    if (user) {
      setIsEmailVerified(user.emailVerified);
    }
  }, []);

  const handleResendVerification = async () => {
    if (!auth) {
      console.error('Firebase auth is not initialized');
      return;
    }

    const user = auth.currentUser;
    if (user) {
      try {
        await sendEmailVerification(user);
        toast.success('Verification email sent! Please check your inbox.');
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Failed to send verification email');
        }
      }
    }
  };

  const handleCheckVerification = async () => {
    if (!auth) {
      console.error('Firebase auth is not initialized');
      return;
    }

    const user = auth.currentUser;
    if (user) {
      try {
        await reload(user);
        setIsEmailVerified(user.emailVerified);
        if (user.emailVerified) {
          toast.success('Email verified!');
        } else {
          toast.error('Email not verified yet. Please check your inbox and click the verification link.');
        }
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Failed to check verification status');
        }
      }
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {!isEmailVerified && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Please verify your email address to access all features.
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="ml-2 font-medium text-yellow-700 underline hover:text-yellow-600"
                  >
                    Resend verification email
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckVerification}
                    className="ml-2 font-medium text-yellow-700 underline hover:text-yellow-600"
                  >
                    I&apos;ve verified my email
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Add your dashboard content here */}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
