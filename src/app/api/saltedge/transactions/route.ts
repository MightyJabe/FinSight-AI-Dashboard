import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { adminAuth as auth } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import {
  getAccountTransactions,
  getConnectionAccounts,
  getCustomerConnections,
} from '@/lib/saltedge';

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
    const accountId = searchParams.get('accountId');
    const fromDate = searchParams.get('fromDate');

    if (accountId) {
      // Get transactions for specific account
      const transactions = await getAccountTransactions(accountId, fromDate || undefined);

      return NextResponse.json({
        success: true,
        transactions: transactions.data || [],
      });
    } else {
      // Get transactions for all user's accounts
      const connections = await getCustomerConnections(userId);
      const allTransactions = [];

      if (connections.data) {
        for (const connection of connections.data) {
          try {
            // Get accounts for this connection
            const accounts = await getConnectionAccounts(connection.id);

            if (accounts.data) {
              // Get transactions for each account
              for (const account of accounts.data) {
                try {
                  const transactions = await getAccountTransactions(
                    account.id,
                    fromDate || undefined
                  );
                  if (transactions.data) {
                    // Add account info to each transaction
                    const transactionsWithAccount = transactions.data.map((t: any) => ({
                      ...t,
                      account_name: account.name,
                      connection_id: connection.id,
                      provider_name: connection.provider_name,
                    }));
                    allTransactions.push(...transactionsWithAccount);
                  }
                } catch (error) {
                  logger.warn('Failed to get transactions for account', {
                    accountId: account.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                  });
                }
              }
            }
          } catch (error) {
            logger.warn('Failed to get accounts for connection', {
              connectionId: connection.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }

      // Sort transactions by date (most recent first)
      allTransactions.sort((a, b) => new Date(b.made).getTime() - new Date(a.made).getTime());

      logger.info('Retrieved Salt Edge transactions', {
        userId,
        transactionCount: allTransactions.length,
      });

      return NextResponse.json({
        success: true,
        transactions: allTransactions,
      });
    }
  } catch (error) {
    logger.error('Failed to get Salt Edge transactions', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, error: 'Failed to retrieve transactions' },
      { status: 500 }
    );
  }
}
