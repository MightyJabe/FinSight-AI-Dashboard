import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory store for rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

export function rateLimitMiddleware(request: NextRequest) {
  const ip = request.ip ?? 'anonymous';
  const now = Date.now();

  // Get or initialize rate limit data for this IP
  const rateLimitData = rateLimit.get(ip) ?? { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

  // Reset count if window has expired
  if (now > rateLimitData.resetTime) {
    rateLimitData.count = 0;
    rateLimitData.resetTime = now + RATE_LIMIT_WINDOW;
  }

  // Increment request count
  rateLimitData.count++;
  rateLimit.set(ip, rateLimitData);

  // Check if rate limit exceeded
  if (rateLimitData.count > MAX_REQUESTS) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: Math.ceil((rateLimitData.resetTime - now) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateLimitData.resetTime - now) / 1000).toString(),
        },
      }
    );
  }

  return null;
}

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimit.entries()) {
    if (now > data.resetTime) {
      rateLimit.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);
