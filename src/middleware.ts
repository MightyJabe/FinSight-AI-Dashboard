import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { rateLimitMiddleware } from './middleware/rate-limit';

/**
 *
 */
export async function middleware(request: NextRequest) {
  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = await rateLimitMiddleware(request);
    if (response) return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
