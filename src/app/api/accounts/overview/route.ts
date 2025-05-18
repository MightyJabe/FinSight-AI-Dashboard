import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { getAccountBalances, getTransactions } from '@/lib/plaid';
import { subDays, formatISO } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Get the Firebase ID token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Get the user's Plaid access token from Firestore
    const accessTokenDoc = await db
      .collection('users')
      .doc(userId)
      .collection('plaid')
      .doc('access_token')
      .get();
    const accessToken = accessTokenDoc.exists ? accessTokenDoc.data()?.accessToken : null;

    // Explicit types
    type Account = { account_id: string; name: string; type: string; balances: { current: number | null }; official_name?: string | null; subtype?: string | null };
    type Transaction = { transaction_id: string; name: string; amount: number; date: string };
    type ManualLiability = { id: string; name: string; amount: number; type: string; createdAt: string };

    let accounts: Account[] = [];
    let totalBalance = 0;
    let transactions: Transaction[] = [];
    if (accessToken) {
      accounts = await getAccountBalances(accessToken);
      totalBalance = accounts.reduce((sum: number, acc: Account) => sum + (acc.balances.current || 0), 0);
      // Fetch transactions for the last 30 days
      const endDate = formatISO(new Date(), { representation: 'date' });
      const startDate = formatISO(subDays(new Date(), 30), { representation: 'date' });
      transactions = await getTransactions(accessToken, startDate, endDate);
    }

    // Fetch manual liabilities
    const snapshot = await db.collection('users').doc(userId).collection('manualLiabilities').get();
    const manualLiabilities: ManualLiability[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ManualLiability));
    const totalLiabilities = manualLiabilities.reduce((sum, l) => sum + (l.amount || 0), 0);

    // Net worth = totalBalance - totalLiabilities
    const netWorth = totalBalance - totalLiabilities;

    return NextResponse.json({
      totalBalance,
      accounts,
      netWorth,
      transactions,
      liabilities: manualLiabilities,
      totalLiabilities,
    });
  } catch (error) {
    console.error('Error fetching account overview:', error);
    return NextResponse.json({
      error: 'Failed to fetch account overview',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 