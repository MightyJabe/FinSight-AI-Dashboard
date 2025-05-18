'use client';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { SocialAuth } from '@/components/auth/SocialAuth';
import { toast, Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();

  const handleEmailLogin = async (data: { email: string; password: string }) => {
    console.log('Attempting to log in with:', data.email);
    
    if (!auth) {
      console.error('Firebase auth is not initialized');
      toast.error('Authentication service is not available');
      return;
    }

    try {
      console.log('Firebase auth state:', {
        isInitialized: !!auth,
        currentUser: auth.currentUser?.email,
        config: auth.app.options
      });

      console.log('Calling Firebase signInWithEmailAndPassword...');
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log('Login successful:', {
        email: userCredential.user.email,
        isEmailVerified: userCredential.user.emailVerified,
        uid: userCredential.user.uid
      });
      
      toast.success('Successfully logged in!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Error ? (error as any).code : 'No error code'
      });
      
      if (error instanceof Error) {
        // Handle specific Firebase auth errors
        const errorMessage = error.message.includes('auth/invalid-credential')
          ? 'Invalid email or password'
          : error.message.includes('auth/too-many-requests')
          ? 'Too many failed attempts. Please try again later.'
          : error.message.includes('auth/user-not-found')
          ? 'No account found with this email'
          : error.message.includes('auth/wrong-password')
          ? 'Incorrect password'
          : error.message.includes('auth/user-disabled')
          ? 'This account has been disabled'
          : error.message.includes('auth/network-request-failed')
          ? 'Network error. Please check your connection'
          : `Login failed: ${error.message}`;
        toast.error(errorMessage);
      } else {
        toast.error('An unexpected error occurred during login');
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Toaster position="top-center" />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <LoginForm onSubmit={handleEmailLogin} />
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>
            <SocialAuth />
          </div>
        </div>
      </div>
    </div>
  );
}
