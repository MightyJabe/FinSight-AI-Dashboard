import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

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
    console.log('Form submitted with data:', {
      email: data.email,
      hasPassword: !!data.password,
      passwordLength: data.password.length
    });
    
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
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            suppressHydrationWarning
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
            Remember me
          </label>
        </div>

        <div className="text-sm">
          <Link href="/reset-password" className="font-medium text-blue-600 hover:text-blue-500">
            Forgot your password?
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
    </form>
  );
}
