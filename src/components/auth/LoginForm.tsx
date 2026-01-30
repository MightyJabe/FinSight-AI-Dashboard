import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
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
      } catch {
        // Error handling is managed by the parent component
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
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
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
            className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-5 w-5 text-primary focus:ring-primary border-border rounded cursor-pointer"
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
        className="w-full rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white py-2.5 font-semibold hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100 glow-gradient"
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
