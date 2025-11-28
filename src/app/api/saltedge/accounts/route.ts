import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { getConnectionAccounts, getCustomerConnections } from '@/lib/saltedge';

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

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    if (connectionId) {
      // Get accounts for specific connection
      const accounts = await getConnectionAccounts(connectionId);

      return NextResponse.json({
        success: true,
        accounts: accounts.data || [],
      });
    } else {
      // Get all accounts for all user's connections
      const connections = await getCustomerConnections(userId);
      const allAccounts = [];

      if (connections.data) {
        for (const connection of connections.data) {
          try {
            const accounts = await getConnectionAccounts(connection.id);
            if (accounts.data) {
              allAccounts.push(...accounts.data);
            }
          } catch (error) {
            logger.warn('Failed to get accounts for connection', {
              connectionId: connection.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }

      logger.info('Retrieved Salt Edge accounts', {
        userId,
        accountCount: allAccounts.length,
      });

      return NextResponse.json({
        success: true,
        accounts: allAccounts,
      });
    }
  } catch (error) {
    logger.error('Failed to get Salt Edge accounts', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, error: 'Failed to retrieve accounts' },
      { status: 500 }
    );
  }
}
