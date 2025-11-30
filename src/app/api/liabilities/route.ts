import { NextResponse } from 'next/server';

import { validateAuthToken } from '@/lib/auth-server';
import { getFinancialOverview } from '@/lib/financial-calculator';
import { enforceFinancialAccuracy } from '@/lib/financial-validator';
import logger from '@/lib/logger';

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

    const { data, metrics } = await getFinancialOverview(userId);
    enforceFinancialAccuracy(metrics, 'liabilities API');

    const creditAccounts = data.plaidAccounts.filter(acc => acc.accountType === 'credit');

    const accounts = [...creditAccounts, ...data.manualLiabilities];

    return NextResponse.json({
      accounts,
      totalDebt: metrics.totalLiabilities,
      creditAccounts: creditAccounts.length,
      manualLiabilities: data.manualLiabilities.length,
      totalCreditDebt: creditAccounts.reduce((sum, acc) => sum + Math.abs(acc.balance), 0),
      totalManualDebt: data.manualLiabilities.reduce((sum, l) => sum + l.amount, 0),
    });
  } catch (error) {
    logger.error('Error in liabilities API:', { error });
    return NextResponse.json({ error: 'Failed to fetch liabilities' }, { status: 500 });
  }
}
