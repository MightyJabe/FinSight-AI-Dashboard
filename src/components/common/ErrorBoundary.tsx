'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import React from 'react';
import { toast } from 'react-hot-toast';

import logger from '@/lib/logger';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showErrorDetails?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fullScreen?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

/**
 * Enhanced Error Boundary with retry logic and detailed error information
 */
export class ErrorBoundary extends React.Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to error reporting service
    logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
      component: 'ErrorBoundary',
    });
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
    
    // Show toast notification
    toast.error('Something went wrong. Please try again.');
  }

  override componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  handleRetry = () => {
    const maxRetries = 3;
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  override render() {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const { children, fallback, showErrorDetails = false, fullScreen = true } = this.props;
    const maxRetries = 3;

    if (hasError) {
      // Return custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Determine container classes based on fullScreen prop
      const containerClasses = fullScreen 
        ? "min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"
        : "min-h-[200px] flex items-center justify-center p-4";

      return (
        <div className={containerClasses}>
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Something went wrong
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We&apos;re sorry, but something unexpected happened.
                  </p>
                </div>
              </div>

              {showErrorDetails && error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                    Error Details:
                  </h4>
                  <p className="text-xs text-red-700 dark:text-red-300 font-mono break-all">
                    {error.message}
                  </p>
                  {process.env.NODE_ENV === 'development' && errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                        Stack Trace
                      </summary>
                      <pre className="text-xs text-red-600 dark:text-red-400 mt-1 whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {retryCount < maxRetries && (
                  <button
                    onClick={this.handleRetry}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again ({maxRetries - retryCount} left)
                  </button>
                )}
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Reload Page
                </button>
              </div>

              {retryCount >= maxRetries && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Multiple retry attempts failed. Please refresh the page or contact support if the problem persists.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// HOC for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
