import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component for loading states
 */
export function Skeleton({ className, ...props }: SkeletonProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer',
        className
      )}
      {...props}
    />
  );
}

/**
 * Card skeleton for dashboard cards
 */
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

/**
 * Transaction list skeleton
 */
export function TransactionSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Chart skeleton for dashboard charts
 */
export function ChartSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-3">
        <div className="flex items-end gap-2 h-32">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="flex-1" 
              style={{ height: `${Math.random() * 60 + 40}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Table skeleton for data tables
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Table Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      </div>
      
      {/* Table Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  className={`h-4 ${colIndex === 0 ? 'w-32' : colIndex === columns - 1 ? 'w-16' : 'w-24'}`} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Chat message skeleton
 */
export function ChatMessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={`flex gap-4 p-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />}
      <div className={`max-w-3xl ${isUser ? 'order-first' : ''}`}>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      {isUser && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />}
    </div>
  );
}

/**
 * Navigation skeleton
 */
export function NavigationSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 h-[68px]">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-8 rounded-full md:hidden" />
      <div className="hidden md:flex space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

/**
 * Account item skeleton
 */
export function AccountSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Dashboard skeleton for full page loading
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <CardSkeleton />
    </div>
  );
}

/**
 * Investments page skeleton for loading state
 */
export function InvestmentsSkeleton() {
  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Hero Section */}
      <div className="mb-10 rounded-3xl bg-card border border-border p-8 lg:p-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-16 w-64 mb-4" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="flex items-end gap-1 h-20">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="w-3 lg:w-4 rounded-t"
                style={{ height: `${Math.random() * 60 + 30}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Holdings Table */}
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/30"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <Skeleton className="h-6 w-40 mb-6" />
          <Skeleton className="h-48 w-full rounded-xl mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}