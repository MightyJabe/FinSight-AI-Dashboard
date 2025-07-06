import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'muted';
}

/**
 * Enhanced loading spinner with consistent theming
 */
export function LoadingSpinner({ 
  message = 'Loading...', 
  className,
  size = 'md',
  variant = 'default'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  const variantClasses = {
    default: 'border-primary',
    primary: 'border-primary',
    muted: 'border-muted-foreground'
  };

  return (
    <div className={cn('flex items-center gap-3', className)} role="status" aria-live="polite">
      <div 
        className={cn(
          'animate-spin rounded-full border-2 border-transparent border-t-current',
          sizeClasses[size],
          variantClasses[variant]
        )}
        aria-hidden="true"
      />
      {message && (
        <span className="text-muted-foreground text-sm font-medium">
          {message}
        </span>
      )}
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
}
