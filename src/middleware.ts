import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitMiddleware } from './middleware/rateLimit';

export function middleware(request: NextRequest) {
  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = rateLimitMiddleware(request);
    if (response) return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
