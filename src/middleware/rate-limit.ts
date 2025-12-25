import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createRateLimiter } from '@/lib/rate-limiter';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

const FINANCIAL_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_FINANCIAL_REQUESTS = process.env.NODE_ENV === 'development' ? 100 : 10;

const generalLimiter = createRateLimiter({
  prefix: 'rl:general',
  limit: MAX_REQUESTS,
  windowMs: RATE_LIMIT_WINDOW,
});

const financialLimiter = createRateLimiter({
  prefix: 'rl:financial',
  limit: MAX_FINANCIAL_REQUESTS,
  windowMs: FINANCIAL_RATE_LIMIT_WINDOW,
});

const FINANCIAL_ENDPOINTS = [
  '/api/plaid/',
  '/api/transactions/',
  '/api/accounts/',
  '/api/ai-features/',
];

function isFinancialEndpoint(pathname: string): boolean {
  return FINANCIAL_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint));
}

/**
 * Enhanced rate limiting middleware with Redis support and in-memory fallback.
 */
export async function rateLimitMiddleware(request: NextRequest) {
  const ip = request.ip ?? 'anonymous';
  const pathname = request.nextUrl.pathname;
  const isFinancial = isFinancialEndpoint(pathname);
  const key = `${ip}:${pathname.slice(0, 50)}`;
  const limiter = isFinancial ? financialLimiter : generalLimiter;

  const result = await limiter.consume(key);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        message: isFinancial
          ? 'Too many financial operations. Please try again later for security.'
          : 'Too many requests. Please try again later.',
        retryAfter,
        isFinancial,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString(),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(result.reset / 1000).toString());

  return response;
}
