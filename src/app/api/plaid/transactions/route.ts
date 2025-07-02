import { formatISO } from 'date-fns';
import { NextResponse } from 'next/server';

import { auth, db } from '@/lib/firebase-admin';
import { getTransactions } from '@/lib/plaid';

export const dynamic = 'force-dynamic';

/**
 * Get transactions from all connected Plaid accounts
 */
export async function GET(request: Request) {
  try {
    // Get user ID from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Fetch all Plaid access tokens for this user
    const plaidItemsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('plaidItems')
      .get();

    if (plaidItemsSnapshot.empty) {
      return NextResponse.json({ transactions: [] });
    }

    const allTransactions = [];

    // Fetch transactions from each connected account
    for (const plaidItemDoc of plaidItemsSnapshot.docs) {
      const plaidItemData = plaidItemDoc.data();
      const accessToken = plaidItemData.accessToken;

      if (!accessToken) continue;

      try {
        // Get transactions for the last 90 days
        const endDate = formatISO(new Date(), { representation: 'date' });
        const startDate = formatISO(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), {
          representation: 'date',
        });

        const plaidTransactions = await getTransactions(accessToken, startDate, endDate);

        // Transform Plaid transactions to our format
        const transformedTransactions = plaidTransactions.map(txn => ({
          transaction_id: txn.transaction_id,
          date: txn.date,
          name: txn.name,
          amount: txn.amount,
          category: txn.category || [],
          account_id: txn.account_id,
          pending: txn.pending || false,
          payment_channel: txn.payment_channel,
          transaction_type: txn.transaction_type,
        }));

        allTransactions.push(...transformedTransactions);
      } catch (error) {
        console.error('Error fetching transactions for Plaid item:', error);
        // Continue with other accounts even if one fails
      }
    }

    // Sort transactions by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ transactions: allTransactions });
  } catch (error) {
    console.error('Error in Plaid transactions API:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
