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

    let investmentAccounts: any[] = [];
    let totalInvestmentValue = 0;

    if (accessToken) {
      const plaidAccounts = await getAccountBalances(accessToken);
      investmentAccounts = plaidAccounts.filter(
        acc =>
          acc.type === 'investment' ||
          acc.subtype === 'ira' ||
          acc.subtype === '401k' ||
          acc.subtype === 'brokerage'
      );
      totalInvestmentValue = investmentAccounts.reduce(
        (sum, acc) => sum + (acc.balances.current || 0),
        0
      );
    }

    const manualInvestmentsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('manualAssets')
      .where('type', '==', 'investment')
      .get();
    const manualInvestments = manualInvestmentsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const totalManualInvestments = manualInvestments.reduce(
      (sum: number, inv: any) => sum + (inv.amount || 0),
      0
    );

    const accounts = [...investmentAccounts, ...manualInvestments];
    const totalValue = totalInvestmentValue + totalManualInvestments;

    const performance = {
      monthlyGain: totalValue * 0.02, // Mock 2% monthly gain
      yearToDate: totalValue * 0.08, // Mock 8% YTD
      allTimeGain: totalValue * 0.15, // Mock 15% all-time
    };

    return NextResponse.json({
      accounts,
      totalValue,
      totalInvestmentValue,
      totalManualInvestments,
      accountCount: accounts.length,
      performance,
    });
  } catch (error) {
    console.error('Error fetching investment accounts:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch investment accounts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
