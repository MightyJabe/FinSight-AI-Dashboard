import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { SocialAuth } from './SocialAuth';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/**
 *
 */
export function LoginForm({ onSubmit }: { onSubmit?: (data: LoginFormValues) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onFormSubmit = async (data: LoginFormValues) => {
    if (onSubmit) {
      try {
        await onSubmit(data);
      } catch (error) {
        console.error('Error in form submission:', error);
      }
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onFormSubmit)}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="block w-full form-input"
          aria-invalid={!!errors.email}
          suppressHydrationWarning
          {...register('email')}
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className="block w-full form-input pr-10"
            aria-invalid={!!errors.password}
            suppressHydrationWarning
            {...register('password')}
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute inset-y-0 right-0 px-2 flex items-center text-sm text-muted-foreground"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
            suppressHydrationWarning
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
            Remember me
          </label>
        </div>

        <div className="text-sm">
          <Link href="/reset-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-primary text-primary-foreground py-2 font-semibold hover:bg-primary/90 transition disabled:opacity-60"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Logging in...' : 'Log In'}
      </button>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card dark:bg-card-dark text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-6">
          <SocialAuth />
        </div>
      </div>
    </form>
  );
}
