import { NextResponse } from 'next/server';

import { getFinancialOverview } from '@/lib/financial-calculator';
import logger from '@/lib/logger';

/**
 * Legacy overview endpoint for backward compatibility
 * Uses centralized financial calculator with accuracy validation
 */
export async function GET() {
  try {
    const { data, metrics } = await getFinancialOverview();

    // Validate accuracy before returning
    const { enforceFinancialAccuracy } = await import('@/lib/financial-validator');
    enforceFinancialAccuracy(metrics, 'legacy overview API');

    // Return data in the format expected by legacy hooks
    const response = {
      netWorth: metrics.netWorth,
      totalAssets: metrics.totalAssets,
      totalLiabilities: metrics.totalLiabilities,
      monthlyIncome: metrics.monthlyIncome,
      monthlyExpenses: metrics.monthlyExpenses,
      monthlySavings: metrics.monthlyCashFlow,
      totalCashAssets: metrics.liquidAssets,
      emergencyFundStatus:
        metrics.monthlyExpenses > 0
          ? Math.min(metrics.liquidAssets / (metrics.monthlyExpenses * 3), 1)
          : 0,
      savingsRate: metrics.monthlyIncome > 0 ? metrics.monthlyCashFlow / metrics.monthlyIncome : 0,
      accounts: data.plaidAccounts
        .filter(
          acc =>
            acc.accountType === 'depository' &&
            acc.subtype &&
            ['checking', 'savings'].includes(acc.subtype)
        )
        .map(acc => ({
          id: acc.id,
          name: acc.name,
          balance: acc.balance,
          type: acc.type,
          institution: acc.institution,
        })),
      manualAssets: data.manualAssets.map(asset => ({
        id: asset.id,
        name: asset.name,
        amount: asset.amount,
        currentBalance: asset.currentBalance,
        type: asset.type,
      })),
      liabilities: data.manualLiabilities.map(liability => ({
        id: liability.id,
        name: liability.name,
        amount: liability.amount,
        type: liability.type,
      })),
    };

    logger.info('Legacy overview data retrieved successfully');
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error retrieving legacy overview:', { error });
    return NextResponse.json({ error: 'Failed to retrieve overview data' }, { status: 500 });
  }
}
