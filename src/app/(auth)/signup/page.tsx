'use client';

import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { SocialAuth } from '@/components/auth/SocialAuth';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  const router = useRouter();

  const handleSignup = async (data: { email: string; password: string }) => {
    if (!auth) {
      console.error('Firebase auth is not initialized');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await sendEmailVerification(userCredential.user);
      toast.success('Account created! Please check your email to verify your account.');
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create account');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark">
      <Toaster position="top-center" />
      <div className="w-full max-w-md p-8 bg-card dark:bg-card-dark rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Create an Account</h1>
        <SignupForm onSubmit={handleSignup} />

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card dark:bg-card-dark text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <SocialAuth />
          </div>
        </div>

        <div className="mt-6 text-center text-sm">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
