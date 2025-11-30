import { NextResponse } from 'next/server';

import { validateAuthToken } from '@/lib/auth-server';
import { getFinancialOverview } from '@/lib/financial-calculator';
import { enforceFinancialAccuracy } from '@/lib/financial-validator';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @deprecated Use /api/financial-overview for better performance and consistency
 * Legacy endpoint maintained for backward compatibility
 */
export async function GET(request: Request) {
  try {
    const authResult = await validateAuthToken(request);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId!;

    const { data, metrics } = await getFinancialOverview(userId);
    enforceFinancialAccuracy(metrics, 'accounts API');

    const accounts = data.plaidAccounts.map(acc => ({
      account_id: acc.id,
      name: acc.name,
      type: acc.type,
      subtype: acc.subtype,
      balances: {
        current: acc.balance,
        available: acc.balance,
      },
    }));

    const transactions = data.transactions.slice(0, 30).map(txn => ({
      transaction_id: txn.id,
      name: `Transaction ${txn.id}`,
      amount: txn.type === 'expense' ? -txn.amount : txn.amount,
      date: txn.date.toISOString().split('T')[0],
    }));

    return NextResponse.json({
      totalBalance: metrics.liquidAssets,
      totalAssets: metrics.totalAssets,
      accounts,
      manualAssets: data.manualAssets,
      netWorth: metrics.netWorth,
      transactions,
      liabilities: data.manualLiabilities,
      totalLiabilities: metrics.totalLiabilities,
      monthlyCashFlow: metrics.monthlyCashFlow,
      monthlyIncome: metrics.monthlyIncome,
      monthlyExpenses: metrics.monthlyExpenses,
      emergencyFundStatus:
        metrics.monthlyExpenses > 0 ? metrics.liquidAssets / (metrics.monthlyExpenses * 3) : 0,
      savingsRate: metrics.monthlyIncome > 0 ? metrics.monthlyCashFlow / metrics.monthlyIncome : 0,
    });
  } catch (error) {
    logger.error('Error in accounts API:', { error });
    return NextResponse.json({ error: 'Failed to fetch account overview' }, { status: 500 });
  }
}
