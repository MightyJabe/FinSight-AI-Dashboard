import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  message: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'network';
  showRetry?: boolean;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  showIcon?: boolean;
}

/**
 * Enhanced error message component with retry functionality
 */
export function ErrorMessage({
  message,
  className,
  variant = 'default',
  showRetry = false,
  onRetry,
  retryLabel = 'Try Again',
  isRetrying = false,
  showIcon = true,
}: ErrorMessageProps) {
  const variantStyles = {
    default:
      'glass-card border-red-500/30 text-destructive-foreground bg-destructive/10',
    destructive:
      'glass-card border-red-500/40 text-destructive-foreground bg-destructive/20',
    warning:
      'glass-card border-amber-500/30 text-amber-900 dark:text-amber-100 bg-amber-500/10',
    network:
      'glass-card border-blue-500/30 text-blue-900 dark:text-blue-100 bg-blue-500/10',
  };

  const getIcon = () => {
    switch (variant) {
      case 'network':
        return <WifiOff className="h-5 w-5 flex-shrink-0" />;
      default:
        return <AlertCircle className="h-5 w-5 flex-shrink-0" />;
    }
  };

  return (
    <div
      className={cn('border rounded-2xl p-4 my-3 backdrop-blur-sm', variantStyles[variant], className)}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {showIcon && <div className="mt-0.5">{getIcon()}</div>}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">{message}</p>

          {showRetry && onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-300',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'hover:scale-105 active:scale-95',
                  variant === 'default' &&
                    'bg-destructive/20 text-destructive-foreground hover:bg-destructive/30',
                  variant === 'destructive' &&
                    'bg-destructive/30 text-destructive-foreground hover:bg-destructive/40',
                  variant === 'warning' &&
                    'bg-amber-500/20 text-amber-900 dark:text-amber-100 hover:bg-amber-500/30',
                  variant === 'network' &&
                    'bg-blue-500/20 text-blue-900 dark:text-blue-100 hover:bg-blue-500/30',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                )}
              >
                <RefreshCw className={cn('h-3 w-3', isRetrying && 'animate-spin')} />
                {isRetrying ? 'Retrying...' : retryLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
