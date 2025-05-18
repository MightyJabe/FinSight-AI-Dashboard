'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

export default function ResetPage() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset link sent!');
      router.push('/login');
    } catch (err) {
      toast.error('Failed to send reset link. Please check your email.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark">
      <Toaster position="top-center" />
      <div className="w-full max-w-md p-8 bg-card dark:bg-card-dark rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full form-input"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary text-primary-foreground py-2 font-semibold hover:bg-primary/90 transition"
          >
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
} 