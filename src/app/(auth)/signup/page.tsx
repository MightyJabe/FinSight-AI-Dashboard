'use client';

import { Logo } from '@/components/Logo';
import { SignupForm } from '@/components/auth/SignupForm';
import Link from 'next/link';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

function isErrorWithMessage(err: unknown): err is { message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message?: unknown }).message === 'string'
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSignup({ email, password }: { email: string; password: string }) {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = isErrorWithMessage(err) ? err.message : 'Signup failed';
      setError(message);
      toast.error(message);
    }
  }

  async function handleGoogleSignup() {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Signed up with Google!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const googleMessage = isErrorWithMessage(err) ? err.message : 'Google signup failed';
      toast.error(googleMessage);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark">
      <Toaster position="top-center" />
      <div className="w-full max-w-md p-8 bg-card dark:bg-card-dark rounded-lg shadow-md">
        <Logo width={48} height={48} className="mx-auto mb-6" />
        <SignupForm onSubmit={handleSignup} />
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 rounded-md border border-border bg-white dark:bg-background py-2 font-semibold text-sm text-foreground shadow-sm hover:bg-gray-50 dark:hover:bg-muted transition mt-2"
          onClick={handleGoogleSignup}
        >
          <span className="flex items-center">
            <svg className="h-5 w-5 mr-2" viewBox="0 0 48 48" aria-hidden="true">
              <g>
                <path
                  fill="#4285F4"
                  d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C36.68 2.36 30.77 0 24 0 14.82 0 6.73 5.48 2.69 13.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"
                />
                <path
                  fill="#34A853"
                  d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.98 37.36 46.1 31.45 46.1 24.55z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.67 28.65c-1.13-3.36-1.13-6.99 0-10.35l-7.98-6.2C.99 16.36 0 20.06 0 24c0 3.94.99 7.64 2.69 11.01l7.98 6.2z"
                />
                <path
                  fill="#EA4335"
                  d="M24 48c6.77 0 12.68-2.24 16.85-6.09l-7.19-5.6c-2.01 1.35-4.59 2.15-7.66 2.15-6.38 0-11.87-3.63-14.33-8.95l-7.98 6.2C6.73 42.52 14.82 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </g>
            </svg>
            Continue with Google
          </span>
        </button>
        {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
