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
  showIcon = true
}: ErrorMessageProps) {
  const variantStyles = {
    default: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    destructive: 'bg-red-100 border-red-300 text-red-900 dark:bg-red-900/30 dark:border-red-700 dark:text-red-100',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200',
    network: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
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
      className={cn(
        'border rounded-lg p-4 my-3',
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <div className="mt-0.5">
            {getIcon()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">
            {message}
          </p>
          
          {showRetry && onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2',
                  variant === 'default' && 'bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700',
                  variant === 'destructive' && 'bg-red-200 text-red-900 hover:bg-red-300 focus:ring-red-500 dark:bg-red-700 dark:text-red-100 dark:hover:bg-red-600',
                  variant === 'warning' && 'bg-amber-100 text-amber-800 hover:bg-amber-200 focus:ring-amber-500 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700',
                  variant === 'network' && 'bg-blue-100 text-blue-800 hover:bg-blue-200 focus:ring-blue-500 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
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
