'use client';

import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

import { SignupForm } from '@/components/auth/SignupForm';
import { SocialAuth } from '@/components/auth/SocialAuth';
import { auth } from '@/lib/firebase';

/**
 *
 */
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
    <div className="w-full max-w-md mx-auto p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Join FinSight AI today</p>
      </div>
      <SignupForm onSubmit={handleSignup} />

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
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
  );
}
