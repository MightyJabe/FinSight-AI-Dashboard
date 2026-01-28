import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] glow-gradient',
        primary:
          'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] glow-gradient',
        gradient:
          '!bg-gradient-to-r !from-blue-500 !via-purple-500 !to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] glow-lg',
        glass:
          'glass-card text-foreground border-white/20 hover:border-white/30 hover:bg-white/80 dark:hover:bg-slate-800/70 hover:scale-[1.02] active:scale-[0.98]',
        destructive:
          'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
        outline:
          'border-2 border-blue-600 dark:border-blue-400 bg-transparent text-foreground hover:bg-blue-500/10 hover:border-blue-700 dark:hover:border-blue-300 hover:scale-[1.02] active:scale-[0.98]',
        secondary:
          'bg-secondary/80 backdrop-blur-sm text-secondary-foreground border border-white/10 shadow-md hover:bg-secondary hover:scale-[1.02] active:scale-[0.98]',
        ghost: 'hover:bg-accent/50 hover:text-accent-foreground hover:backdrop-blur-sm',
        link: 'text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline hover:text-purple-600 dark:hover:text-purple-400',
        success:
          'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
      },
      size: {
        default: 'h-10 px-5 py-2.5',
        sm: 'h-8 rounded-lg px-3 text-xs',
        md: 'h-10 px-5 py-2.5',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading, leftIcon, rightIcon, children, disabled, style, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);

    // Apply gradient with !important to override CSS
    React.useEffect(() => {
      if (variant === 'gradient' && buttonRef.current) {
        buttonRef.current.style.setProperty(
          'background-image',
          'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--secondary)))',
          'important'
        );
      }
    }, [variant]);

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={buttonRef}
        disabled={disabled || loading}
        style={style}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && leftIcon && leftIcon}
        {children}
        {!loading && rightIcon && rightIcon}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
