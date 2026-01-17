'use client';

import { AlertCircle, CheckCircle2, RefreshCw, Wifi, WifiOff } from 'lucide-react';

import { cn } from '@/lib/utils';

interface RealTimeIndicatorProps {
  lastRefresh: Date | null;
  isValidating: boolean;
  isStale: boolean;
  onRefresh?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
  showLabel?: boolean;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return date.toLocaleDateString();
}

/**
 * Real-Time Status Indicator
 *
 * Shows the current state of real-time data:
 * - Live indicator with last update time
 * - Validating/syncing indicator
 * - Stale data warning
 * - Manual refresh button
 */
export function RealTimeIndicator({
  lastRefresh,
  isValidating,
  isStale,
  onRefresh,
  className,
  variant = 'default',
  showLabel = true,
}: RealTimeIndicatorProps) {
  const getStatusIcon = () => {
    if (isValidating) {
      return <RefreshCw className="w-3 h-3 animate-spin" />;
    }
    if (isStale) {
      return <WifiOff className="w-3 h-3" />;
    }
    return <Wifi className="w-3 h-3" />;
  };

  const getStatusColor = () => {
    if (isStale) return 'text-amber-500';
    if (isValidating) return 'text-blue-500';
    return 'text-emerald-500';
  };

  const getStatusText = () => {
    if (isValidating) return 'Syncing...';
    if (isStale) return 'Data may be outdated';
    return 'Live';
  };

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            isStale ? 'bg-amber-500' : isValidating ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'
          )}
        />
        {lastRefresh && (
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(lastRefresh)}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn('flex items-center gap-1.5', getStatusColor())}>
          {getStatusIcon()}
          {showLabel && (
            <span className="text-xs font-medium">{getStatusText()}</span>
          )}
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isValidating}
            className="p-1 rounded hover:bg-secondary/80 transition-colors disabled:opacity-50"
            aria-label="Refresh data"
          >
            <RefreshCw
              className={cn('w-3 h-3 text-muted-foreground', isValidating && 'animate-spin')}
            />
          </button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50',
        className
      )}
    >
      {/* Status indicator */}
      <div className={cn('flex items-center gap-1.5', getStatusColor())}>
        {getStatusIcon()}
        {showLabel && <span className="text-xs font-medium">{getStatusText()}</span>}
      </div>

      {/* Last updated */}
      {lastRefresh && !isValidating && (
        <span className="text-xs text-muted-foreground">
          Updated {formatRelativeTime(lastRefresh)}
        </span>
      )}

      {/* Refresh button */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isValidating}
          className="p-1 rounded-full hover:bg-secondary transition-colors disabled:opacity-50"
          aria-label="Refresh data"
        >
          <RefreshCw
            className={cn(
              'w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors',
              isValidating && 'animate-spin'
            )}
          />
        </button>
      )}

      {/* Stale warning */}
      {isStale && !isValidating && (
        <div className="flex items-center gap-1 text-amber-500">
          <AlertCircle className="w-3 h-3" />
          <span className="text-xs">Refresh recommended</span>
        </div>
      )}
    </div>
  );
}

/**
 * Live Dot Indicator
 * Simple pulsing dot to show real-time status
 */
export function LiveDot({
  isLive = true,
  isStale = false,
  className,
}: {
  isLive?: boolean;
  isStale?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('relative flex h-2 w-2', className)}>
      {isLive && !isStale && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full h-2 w-2',
          isStale ? 'bg-amber-500' : isLive ? 'bg-emerald-500' : 'bg-gray-400'
        )}
      />
    </span>
  );
}

/**
 * Real-Time Badge
 * Shows "LIVE" badge with status
 */
export function RealTimeBadge({
  isValidating,
  isStale,
  className,
}: {
  isValidating: boolean;
  isStale: boolean;
  className?: string;
}) {
  if (isStale) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400',
          className
        )}
      >
        <AlertCircle className="w-3 h-3" />
        Stale
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        isValidating
          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        className
      )}
    >
      {isValidating ? (
        <>
          <RefreshCw className="w-3 h-3 animate-spin" />
          Syncing
        </>
      ) : (
        <>
          <CheckCircle2 className="w-3 h-3" />
          Live
        </>
      )}
    </span>
  );
}

export default RealTimeIndicator;
