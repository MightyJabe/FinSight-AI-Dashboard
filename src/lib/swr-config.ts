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
