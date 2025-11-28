'use client';

import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Connection status indicator component
 */
export function ConnectionStatus({
  className,
  showLabel = true,
  size = 'md',
}: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Initialize with current online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsConnecting(false);
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Check connection periodically when offline
    let intervalId: NodeJS.Timeout | null = null;

    if (!isOnline) {
      intervalId = setInterval(async () => {
        try {
          setIsConnecting(true);
          // Try to fetch a small resource to test connectivity
          const response = await fetch('/api/health', {
            method: 'HEAD',
            cache: 'no-cache',
          });

          if (response.ok) {
            setIsOnline(true);
            setIsConnecting(false);
          }
        } catch {
          // Still offline
        } finally {
          setIsConnecting(false);
        }
      }, 5000); // Check every 5 seconds
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isOnline]);

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const getIcon = () => {
    if (isConnecting) {
      return <RefreshCw className={cn(sizeClasses[size], 'animate-spin')} />;
    }
    return isOnline ? (
      <Wifi className={sizeClasses[size]} />
    ) : (
      <WifiOff className={sizeClasses[size]} />
    );
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    return isOnline ? 'Online' : 'Offline';
  };

  const getStatusColor = () => {
    if (isConnecting) return 'text-amber-600 dark:text-amber-400';
    return isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className={cn('flex items-center gap-2', getStatusColor(), className)}>
      {getIcon()}
      {showLabel && (
        <span className={cn('font-medium', textSizeClasses[size])}>{getStatusText()}</span>
      )}
    </div>
  );
}

/**
 * Offline banner component
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Keep banner visible for a moment to show "back online" message
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowBanner(true);
    };

    // Initialize
    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 p-3 text-center text-sm font-medium transition-all duration-300',
        isOffline ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {isOffline ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span>No internet connection. Some features may be limited.</span>
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4" />
            <span>Connection restored!</span>
          </>
        )}
      </div>
    </div>
  );
}
