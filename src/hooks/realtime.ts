/**
 * Real-Time Hooks Index
 *
 * Export all real-time hooks for easy importing.
 * These hooks provide visibility-aware polling as a WebSocket alternative
 * for Vercel serverless deployment.
 *
 * Usage:
 * import { useNetWorth, useRealtimeCrypto, useRealtimeDashboard } from '@/hooks/realtime';
 *
 * Migration Path:
 * When moving to Render or custom server with WebSocket support,
 * replace polling with WebSocket connections while keeping the same API.
 */

// Net Worth - 10 second polling for core metric
export type { NetWorthData, NetWorthTrend, UseNetWorthResult } from './use-net-worth';
export { useNetWorth, useNetWorthOptimistic } from './use-net-worth';

// Crypto Portfolio - 30 second polling (API rate limits)
export type { UseRealtimeCryptoOptions, UseRealtimeCryptoResult } from './use-realtime-crypto';
export { useRealtimeCrypto, useRealtimeCryptoOptimistic } from './use-realtime-crypto';

// Dashboard Data - 15 second polling for account balances
export type {
  RealtimeDashboardData,
  UseRealtimeDashboardOptions,
  UseRealtimeDashboardResult,
} from './use-realtime-dashboard';
export { useRealtimeDashboard, useRealtimeDashboardOptimistic } from './use-realtime-dashboard';

// Re-export interval constants for custom configurations
export { REALTIME_INTERVALS } from '@/lib/swr-config';
