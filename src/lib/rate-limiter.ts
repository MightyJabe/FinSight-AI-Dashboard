import { Redis } from '@upstash/redis';

import logger from './logger';

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  reset: number;
};

interface RateLimiterOptions {
  /** Unique prefix for keys to avoid collisions */
  prefix: string;
  /** Max requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

/**
 * Factory that returns a rate limiter backed by Redis when available,
 * and falls back to an in-memory store otherwise.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const redisUrl = process.env.REDIS_URL;
  const redisToken = process.env.REDIS_TOKEN;

  const redisClient =
    redisUrl && redisToken
      ? new Redis({
          url: redisUrl,
          token: redisToken,
        })
      : null;

  // Local fallback store; only used when Redis is not configured.
  const localStore = new Map<string, { count: number; resetAt: number }>();

  const cleanupLocalStore = () => {
    const now = Date.now();
    for (const [key, entry] of localStore.entries()) {
      if (entry.resetAt <= now) {
        localStore.delete(key);
      }
    }
  };

  const toKey = (key: string) => `${options.prefix}:${key}`;

  /**
   * Consume one token for the given key. Returns rate limit metadata.
   */
  async function consume(key: string): Promise<RateLimitResult> {
    const now = Date.now();

    // Prefer Redis if configured
    if (redisClient) {
      try {
        const redisKey = toKey(key);

        // Increment the counter and set expiry if not present
        const [count, ttl] = (await redisClient.multi().incr(redisKey).pttl(redisKey).exec()) as [
          number | null,
          number | null,
        ];

        // If no TTL, set it
        if (ttl === null || ttl < 0) {
          await redisClient.pexpire(redisKey, options.windowMs);
        }

        const currentCount = count ?? 1;
        const remaining = Math.max(0, options.limit - currentCount);
        const reset = now + (ttl && ttl > 0 ? ttl : options.windowMs);

        return {
          allowed: currentCount <= options.limit,
          remaining,
          limit: options.limit,
          reset,
        };
      } catch (error) {
        logger.warn('Redis rate limiter failed, falling back to in-memory', { error });
      }
    }

    // In-memory fallback
    cleanupLocalStore();
    const cacheKey = toKey(key);
    const existing = localStore.get(cacheKey);
    const resetAt = existing && existing.resetAt > now ? existing.resetAt : now + options.windowMs;
    const count = existing && existing.resetAt > now ? existing.count + 1 : 1;

    localStore.set(cacheKey, { count, resetAt });

    return {
      allowed: count <= options.limit,
      remaining: Math.max(0, options.limit - count),
      limit: options.limit,
      reset: resetAt,
    };
  }

  return { consume };
}
