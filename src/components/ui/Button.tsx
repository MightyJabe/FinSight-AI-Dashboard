import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary:
          'bg-foreground text-background hover:bg-foreground/90 shadow-md hover:shadow-xl hover:-translate-y-0.5',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border hover:border-muted-foreground/20',
        success:
          'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-xl hover:-translate-y-0.5 shadow-emerald-500/20',
        danger:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-xl hover:-translate-y-0.5',
        outline:
          'border-2 border-border bg-transparent hover:bg-secondary hover:border-muted-foreground/30',
        ghost: 'hover:bg-secondary/80',
        link: 'text-foreground underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3.5 text-sm',
        md: 'h-10 px-5 text-sm',
        lg: 'h-11 px-6 text-base',
        xl: 'h-12 px-8 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
