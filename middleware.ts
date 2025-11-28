import { NextRequest, NextResponse } from 'next/server';

import { rateLimitMiddleware } from './src/middleware/rate-limit';

export function middleware(request: NextRequest) {
  // Only apply rate limiting to API routes in production
  if (request.nextUrl.pathname.startsWith('/api/') && process.env.NODE_ENV === 'production') {
    // Apply rate limiting only in production
    const rateLimitResponse = rateLimitMiddleware(request);
    if (rateLimitResponse && rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
