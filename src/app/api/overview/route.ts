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

    let totalBalance = 0;
    let accounts: any[] = [];

    if (accessToken) {
      const plaidAccounts = await getAccountBalances(accessToken);
      accounts = plaidAccounts;
      totalBalance = accounts.reduce((sum, acc) => sum + (acc.balances.current || 0), 0);
    }

    const assetsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('manualAssets')
      .get();
    const manualAssets = assetsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    const totalManualAssets = manualAssets.reduce(
      (sum: number, a: any) => sum + (a.amount || 0),
      0
    );

    const liabilitiesSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('manualLiabilities')
      .get();
    const manualLiabilities = liabilitiesSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const totalLiabilities = manualLiabilities.reduce(
      (sum: number, l: any) => sum + (l.amount || 0),
      0
    );

    const totalAssets = totalBalance + totalManualAssets;
    const netWorth = totalAssets - totalLiabilities;

    const response = NextResponse.json({
      totalBalance,
      totalAssets,
      totalLiabilities,
      netWorth,
      accounts: accounts.length,
      manualAssets: manualAssets.length,
      manualLiabilities: manualLiabilities.length,
    });

    // Add deprecation warning
    response.headers.set('Deprecation', 'true');
    response.headers.set('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()); // 90 days
    response.headers.set('Link', '</api/financial-overview>; rel="successor-version"');

    return response;
  } catch (error) {
    console.error('Error fetching overview:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch overview',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
