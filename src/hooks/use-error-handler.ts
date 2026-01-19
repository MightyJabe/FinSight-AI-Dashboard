'use client';

import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';

import logger from '@/lib/logger';

export interface ErrorState {
  message: string;
  type: 'network' | 'validation' | 'server' | 'unknown';
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
}

interface UseErrorHandlerOptions {
  maxRetries?: number;
  showToast?: boolean;
  logErrors?: boolean;
}

/**
 * Enhanced error handling hook with retry logic and categorization
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { maxRetries = 3, showToast = true, logErrors = true } = options;
  
  const [error, setError] = useState<ErrorState | null>(null);

  const categorizeError = useCallback((error: unknown): ErrorState['type'] => {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return 'network';
    }
    
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
        return 'network';
      }
      
      if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
        return 'validation';
      }
      
      if (message.includes('server') || message.includes('500') || message.includes('internal')) {
        return 'server';
      }
    }
    
    return 'unknown';
  }, []);

  const getErrorMessage = useCallback((error: unknown, type: ErrorState['type']): string => {
    const defaultMessages = {
      network: 'Connection failed. Please check your internet connection and try again.',
      validation: 'Please check your input and try again.',
      server: 'Server error occurred. Please try again later.',
      unknown: 'An unexpected error occurred. Please try again.'
    };

    if (error instanceof Error) {
      // Return a user-friendly version of the error message
      const message = error.message;
      
      // Network errors
      if (type === 'network') {
        if (message.includes('Failed to fetch')) {
          return 'Unable to connect to the server. Please check your internet connection.';
        }
        if (message.includes('timeout')) {
          return 'Request timed out. Please check your connection and try again.';
        }
      }
      
      // Server errors
      if (type === 'server') {
        if (message.includes('500')) {
          return 'Server is temporarily unavailable. Please try again in a few moments.';
        }
        if (message.includes('404')) {
          return 'The requested resource was not found.';
        }
        if (message.includes('401') || message.includes('unauthorized')) {
          return 'Authentication required. Please log in again.';
        }
        if (message.includes('403') || message.includes('forbidden')) {
          return 'You do not have permission to access this resource.';
        }
      }
      
      // For validation errors, we can often use the original message if it's user-friendly
      if (type === 'validation' && message.length < 100 && !message.includes('Error:')) {
        return message;
      }
    }
    
    return defaultMessages[type];
  }, []);

  const handleError = useCallback((error: unknown, context?: string) => {
    const type = categorizeError(error);
    const message = getErrorMessage(error, type);
    
    const errorState: ErrorState = {
      message,
      type,
      isRetrying: false,
      retryCount: 0,
      maxRetries
    };
    
    setError(errorState);
    
    // Log error for debugging
    if (logErrors) {
      logger.error('Error caught by error handler', {
        error: error instanceof Error ? error.message : String(error),
        context: context || 'unknown context',
        errorType: type,
      });
    }
    
    // Show toast notification
    if (showToast) {
      toast.error(message);
    }
    
    return errorState;
  }, [categorizeError, getErrorMessage, maxRetries, logErrors, showToast]);

  const retry = useCallback(async (retryFn: () => Promise<void> | void) => {
    if (!error || error.retryCount >= error.maxRetries) {
      return;
    }
    
    setError(prev => prev ? { ...prev, isRetrying: true } : null);
    
    try {
      await retryFn();
      setError(null); // Clear error on successful retry
    } catch (retryError) {
      const newRetryCount = error.retryCount + 1;
      const type = categorizeError(retryError);
      const message = getErrorMessage(retryError, type);
      
      setError({
        ...error,
        message,
        type,
        isRetrying: false,
        retryCount: newRetryCount
      });
      
      if (logErrors) {
        logger.error('Retry attempt failed', {
          error: retryError instanceof Error ? retryError.message : String(retryError),
          retryCount: newRetryCount,
          maxRetries,
          errorType: type,
        });
      }
      
      if (newRetryCount >= maxRetries && showToast) {
        toast.error('Maximum retry attempts reached. Please refresh the page or contact support.');
      }
    }
  }, [error, categorizeError, getErrorMessage, logErrors, maxRetries, showToast]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const canRetry = error && error.retryCount < error.maxRetries && !error.isRetrying;

  return {
    error,
    handleError,
    retry,
    clearError,
    canRetry,
    isRetrying: error?.isRetrying ?? false
  };
}

/**
 * Hook for network status detection
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [wasOffline, setWasOffline] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (wasOffline) {
      toast.success('Connection restored');
      setWasOffline(false);
    }
  }, [wasOffline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    toast.error('Connection lost. Please check your internet connection.');
  }, []);

  // Set up event listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  return { isOnline, wasOffline };
}

/**
 * Utility function to create retry-enabled async functions
 */
export function createRetryableFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  maxRetries = 3,
  delay = 1000
) {
  return async (...args: T): Promise<R> => {
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
        }
      }
    }
    
    throw lastError;
  };
}