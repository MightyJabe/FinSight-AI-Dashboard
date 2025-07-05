'use client';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

import { LoginForm } from '@/components/auth/LoginForm';
import { auth } from '@/lib/firebase';

/** Login page component that handles user authentication */
export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (data: { email: string; password: string }) => {
    if (!auth) {
      console.error('Firebase auth is not initialized');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success('Successfully signed in!');
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to sign in');
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to your account</p>
      </div>
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
}
