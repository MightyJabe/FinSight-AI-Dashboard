import { NextResponse } from 'next/server';

import { validateAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/firebase-admin';
import { getAccountBalances } from '@/lib/plaid';
import { getPlaidAccessToken } from '@/lib/plaid-token-helper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @deprecated Use /api/financial-overview instead for better performance and consistency
 */
export async function GET(request: Request) {
  try {
    const authResult = await validateAuthToken(request);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId!;

    const accessToken = await getPlaidAccessToken(userId);

    let creditAccounts: any[] = [];
    let totalCreditDebt = 0;

    if (accessToken) {
      const plaidAccounts = await getAccountBalances(accessToken);
      creditAccounts = plaidAccounts.filter(
        acc => acc.type === 'credit' || acc.subtype === 'credit card'
      );
      totalCreditDebt = creditAccounts.reduce(
        (sum, acc) => sum + Math.abs(acc.balances.current || 0),
        0
      );
    }

    const manualLiabilitiesSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('manualLiabilities')
      .get();
    const manualLiabilities = manualLiabilitiesSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const totalManualDebt = manualLiabilities.reduce(
      (sum: number, l: any) => sum + (l.amount || 0),
      0
    );

    const totalDebt = totalCreditDebt + totalManualDebt;
    const accounts = [...creditAccounts, ...manualLiabilities];

    return NextResponse.json({
      accounts,
      totalDebt,
      creditAccounts: creditAccounts.length,
      manualLiabilities: manualLiabilities.length,
      totalCreditDebt,
      totalManualDebt,
    });
  } catch (error) {
    console.error('Error fetching liabilities:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch liabilities',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
