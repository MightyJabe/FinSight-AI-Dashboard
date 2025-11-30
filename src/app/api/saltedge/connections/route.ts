import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { adminAuth as auth } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { getCustomerConnections } from '@/lib/saltedge';

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  // Try to get user ID from Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const idToken = authHeader.substring(7);
      const decodedToken = await auth.verifyIdToken(idToken);
      return decodedToken.uid;
    } catch (error) {
      console.error('Error verifying ID token:', error);
    }
  }

  // Fallback to session cookie
  const sessionCookie = cookies().get('session')?.value;
  if (sessionCookie) {
    try {
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
      return decodedClaims.uid;
    } catch (error) {
      console.error('Error verifying session cookie:', error);
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's Salt Edge connections
    const connections = await getCustomerConnections(userId);

    logger.info('Retrieved Salt Edge connections', {
      userId,
      connectionCount: connections.data?.length || 0,
    });

    return NextResponse.json({
      success: true,
      connections: connections.data || [],
    });
  } catch (error) {
    logger.error('Failed to get Salt Edge connections', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, error: 'Failed to retrieve connections' },
      { status: 500 }
    );
  }
}
