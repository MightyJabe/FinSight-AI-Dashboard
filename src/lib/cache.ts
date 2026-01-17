/**
 * Centralized Cache Utility for Serverless Environments
 *
 * Uses Upstash Redis for distributed caching across serverless instances.
 * Falls back to in-memory cache if Redis is unavailable.
 */

import logger from './logger';

// Types
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export interface CacheResult<T> {
  data: T | null;
  hit: boolean;
  source: 'redis' | 'memory' | 'miss';
}

// In-memory fallback cache (for development or when Redis unavailable)
const memoryCache = new Map<string, { data: unknown; expiresAt: number }>();

// Redis client (lazy initialized)
// Using 'any' here because Upstash Redis has complex generics that don't match our simplified interface
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisClient: any = null;

let redisInitialized = false;

/**
 * Initialize Redis client if credentials are available
 */
async function initRedis(): Promise<boolean> {
  if (redisInitialized) return redisClient !== null;

  redisInitialized = true;

  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    logger.warn('Redis credentials not configured, using in-memory fallback');
    return false;
  }

  try {
    // Dynamic import to avoid build issues if @upstash/redis not installed
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    // Test connection
    await redisClient.set('__test__', 'ok', { ex: 1 });
    logger.info('Redis cache initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Redis, using in-memory fallback', { error });
    redisClient = null;
    return false;
  }
}

/**
 * Build a cache key with optional prefix
 */
function buildKey(key: string, prefix?: string): string {
  return prefix ? `${prefix}:${key}` : key;
}

/**
 * Get a value from cache
 */
export async function cacheGet<T>(key: string, options: CacheOptions = {}): Promise<CacheResult<T>> {
  const fullKey = buildKey(key, options.prefix);

  // Try Redis first
  await initRedis();

  if (redisClient) {
    try {
      const data = await redisClient.get(fullKey);
      if (data !== null && data !== undefined) {
        return { data: data as T, hit: true, source: 'redis' };
      }
    } catch (error) {
      logger.warn('Redis get failed, trying memory cache', { key: fullKey, error });
    }
  }

  // Fallback to memory cache
  const memEntry = memoryCache.get(fullKey);
  if (memEntry && memEntry.expiresAt > Date.now()) {
    return { data: memEntry.data as T, hit: true, source: 'memory' };
  }

  // Clean up expired entry
  if (memEntry) {
    memoryCache.delete(fullKey);
  }

  return { data: null, hit: false, source: 'miss' };
}

/**
 * Set a value in cache
 */
export async function cacheSet<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): Promise<void> {
  const fullKey = buildKey(key, options.prefix);
  const ttl = options.ttl || 60; // Default 60 seconds

  // Try Redis first
  await initRedis();

  if (redisClient) {
    try {
      await redisClient.set(fullKey, data, { ex: ttl });
      return;
    } catch (error) {
      logger.warn('Redis set failed, using memory cache', { key: fullKey, error });
    }
  }

  // Fallback to memory cache
  memoryCache.set(fullKey, {
    data,
    expiresAt: Date.now() + ttl * 1000,
  });
}

/**
 * Delete a value from cache
 */
export async function cacheDel(key: string, options: CacheOptions = {}): Promise<void> {
  const fullKey = buildKey(key, options.prefix);

  await initRedis();

  if (redisClient) {
    try {
      await redisClient.del(fullKey);
    } catch (error) {
      logger.warn('Redis delete failed', { key: fullKey, error });
    }
  }

  memoryCache.delete(fullKey);
}

/**
 * Get or set pattern - fetch from cache or compute and store
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const result = await cacheGet<T>(key, options);

  if (result.hit && result.data !== null) {
    return result.data;
  }

  const data = await fetcher();
  await cacheSet(key, data, options);
  return data;
}

/**
 * Clear all entries with a specific prefix (useful for user data invalidation)
 */
export async function cacheClearPrefix(prefix: string): Promise<void> {
  // Clear memory cache entries with prefix
  for (const key of memoryCache.keys()) {
    if (key.startsWith(`${prefix}:`)) {
      memoryCache.delete(key);
    }
  }

  // Note: Redis pattern deletion requires SCAN which is expensive
  // For production, consider using a different invalidation strategy
  logger.info('Cleared memory cache entries with prefix', { prefix });
}

/**
 * Cache TTL constants for different data types
 */
export const CACHE_TTL = {
  // Real-time data (10 seconds)
  REALTIME: 10,

  // Frequently updated (30 seconds)
  FREQUENT: 30,

  // Standard API responses (1 minute)
  STANDARD: 60,

  // Summaries and aggregates (5 minutes)
  SUMMARY: 300,

  // Static or rarely changing (1 hour)
  STATIC: 3600,

  // User preferences (24 hours)
  USER_PREFS: 86400,
} as const;

/**
 * Cache key prefixes for different data types
 */
export const CACHE_PREFIX = {
  NET_WORTH: 'nw',
  FINANCIAL_OVERVIEW: 'fo',
  TRANSACTIONS: 'tx',
  CRYPTO: 'crypto',
  PENSION: 'pension',
  INSIGHTS: 'insights',
  USER: 'user',
} as const;
