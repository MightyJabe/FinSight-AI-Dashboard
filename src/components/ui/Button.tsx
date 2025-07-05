import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/tailwind';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary variants
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        primary:
          'bg-gradient-to-r from-primary via-accent to-logoNode text-white shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-200',

        // Secondary variants
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border-2 border-primary bg-transparent text-primary hover:bg-primary/10',

        // Accent variants
        accent: 'bg-accent text-white shadow hover:bg-accent/90',
        accentOutline: 'border-2 border-accent bg-transparent text-accent hover:bg-accent/10',

        // Ghost variants
        ghost: 'hover:bg-accent/10 hover:text-accent',
        link: 'text-primary underline-offset-4 hover:underline',

        // Destructive variants
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        destructiveOutline:
          'border-2 border-destructive bg-transparent text-destructive hover:bg-destructive/10',

        // Success variants
        success: 'bg-green-500 text-white hover:bg-green-600',
        successOutline:
          'border-2 border-green-500 bg-transparent text-green-500 hover:bg-green-500/10',

        // Warning variants
        warning: 'bg-amber-500 text-white hover:bg-amber-600',
        warningOutline:
          'border-2 border-amber-500 bg-transparent text-amber-500 hover:bg-amber-500/10',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8 text-base',
        xl: 'h-12 rounded-md px-10 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
      fullWidth: {
        true: 'w-full',
      },
      isLoading: {
        true: 'relative text-transparent transition-none hover:text-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
      isLoading: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      asChild = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isButton = !asChild;

    // If icon-only, require aria-label
    const isIconOnly = !children && (size === 'icon' || size === 'icon-sm' || size === 'icon-lg');

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, isLoading, className }))}
        ref={ref}
        type={isButton ? (props.type as 'button' | 'submit' | 'reset') || 'button' : undefined}
        aria-busy={isLoading || undefined}
        aria-disabled={disabled || isLoading || undefined}
        disabled={isButton ? Boolean(disabled || isLoading) : undefined}
        role={!isButton ? 'button' : undefined}
        tabIndex={!isButton && (disabled || isLoading) ? -1 : undefined}
        {...(isIconOnly && { 'aria-label': props['aria-label'] })}
        {...props}
      >
        {isLoading && (
          <span
            className="absolute inset-0 flex items-center justify-center"
            aria-live="polite"
            aria-label="Loading"
          >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </span>
        )}
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
