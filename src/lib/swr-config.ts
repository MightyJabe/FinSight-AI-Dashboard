import { SWRConfiguration } from 'swr';

/**
 * Global SWR configuration for optimal caching and performance
 */
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1 minute
  errorRetryCount: 2,
  errorRetryInterval: 5000,
  shouldRetryOnError: true,
  focusThrottleInterval: 5000,
};

/**
 * SWR config for dashboard data (less frequent updates)
 */
export const dashboardSWRConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: false,
  dedupingInterval: 300000, // 5 minutes
  refreshInterval: 300000, // Auto-refresh every 5 minutes
};

/**
 * SWR config for transaction data (more frequent updates)
 */
export const transactionSWRConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: true,
  dedupingInterval: 30000, // 30 seconds
  refreshInterval: 60000, // Auto-refresh every minute
};

/**
 * SWR config for static/rarely changing data
 */
export const staticSWRConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 600000, // 10 minutes
};

/**
 * SWR config for real-time data (aggressive polling)
 * Used for net worth, account balances, and critical financial data
 *
 * MVP: Uses polling as WebSocket alternative on Vercel
 * Future: Can be replaced with WebSocket/SSE when moving to Render/custom server
 */
export const realtimeSWRConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,    // 5 seconds - allow frequent updates
  refreshInterval: 10000,    // Poll every 10 seconds for real-time feel
  errorRetryCount: 3,
  errorRetryInterval: 3000,
  keepPreviousData: true,    // Show stale data while revalidating
  revalidateIfStale: true,
};

/**
 * Real-time polling intervals for different data types
 * Allows easy tuning based on server load and user experience
 */
export const REALTIME_INTERVALS = {
  NET_WORTH: 10000,        // 10 seconds - core metric
  ACCOUNT_BALANCES: 15000, // 15 seconds
  CRYPTO_PRICES: 30000,    // 30 seconds - external API rate limits
  TRANSACTIONS: 60000,     // 1 minute - less volatile
  INSIGHTS: 300000,        // 5 minutes - AI-generated, expensive
} as const;
