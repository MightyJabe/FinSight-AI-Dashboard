import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

// Simple in-memory store for rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

// Stricter limits for financial operations (adjust for development)
const FINANCIAL_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_FINANCIAL_REQUESTS = process.env.NODE_ENV === 'development' ? 30 : 10; // More lenient in dev

// Financial endpoints that require stricter rate limiting
const FINANCIAL_ENDPOINTS = [
  '/api/plaid/',
  '/api/transactions/',
  '/api/accounts/',
  '/api/ai-features/'
];

/**
 * Check if the request is for a financial endpoint
 */
function isFinancialEndpoint(pathname: string): boolean {
  return FINANCIAL_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint));
}

/**
 * Enhanced rate limiting middleware with stricter limits for financial operations
 */
export function rateLimitMiddleware(request: NextRequest) {
  const ip = request.ip ?? 'anonymous';
  const now = Date.now();
  const pathname = request.nextUrl.pathname;
  
  // Determine rate limit based on endpoint type
  const isFinancial = isFinancialEndpoint(pathname);
  const windowMs = isFinancial ? FINANCIAL_RATE_LIMIT_WINDOW : RATE_LIMIT_WINDOW;
  const maxRequests = isFinancial ? MAX_FINANCIAL_REQUESTS : MAX_REQUESTS;
  
  // Use different keys for financial vs general rate limiting
  const rateLimitKey = isFinancial ? `${ip}:financial` : `${ip}:general`;
  
  // Get or initialize rate limit data for this IP and endpoint type
  const rateLimitData = rateLimit.get(rateLimitKey) ?? { count: 0, resetTime: now + windowMs };

  // Reset count if window has expired
  if (now > rateLimitData.resetTime) {
    rateLimitData.count = 0;
    rateLimitData.resetTime = now + windowMs;
  }

  // Increment request count
  rateLimitData.count++;
  rateLimit.set(rateLimitKey, rateLimitData);

  // Check if rate limit exceeded
  if (rateLimitData.count > maxRequests) {
    const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000);
    
    logger.warn('Rate limit exceeded', {
      ip,
      pathname,
      isFinancial,
      count: rateLimitData.count,
      maxRequests,
      retryAfter
    });
    
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        message: isFinancial 
          ? 'Too many financial operations. Please try again later for security.'
          : 'Too many requests. Please try again later.',
        retryAfter,
        isFinancial
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': Math.max(0, maxRequests - rateLimitData.count).toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimitData.resetTime / 1000).toString(),
        },
      }
    );
  }

  // Add rate limit headers to successful responses
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - rateLimitData.count).toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitData.resetTime / 1000).toString());
  
  return response;
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
