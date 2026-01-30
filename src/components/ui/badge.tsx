import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-sm',
      secondary: 'glass-card text-muted-foreground border-white/20',
      destructive: 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-sm',
      outline: 'border-2 border-primary/30 bg-transparent text-foreground',
      success: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm',
      warning: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
