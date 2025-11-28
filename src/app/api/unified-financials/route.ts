import { NextRequest, NextResponse } from 'next/server';

import { validateAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import type { Platform, PlatformTransaction } from '@/types/platform';

// GET /api/unified-financials - Get unified financial data with proper net worth calculation
export async function GET(request: NextRequest) {
  try {
    // Validate authentication token
    const authResult = await validateAuthToken(request);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId!;

    // Fetch platform data
    const [platformsSnapshot, platformTransactionsSnapshot] = await Promise.all([
      db.collection('users').doc(userId).collection('platforms').get(),
      db.collection('users').doc(userId).collection('platformTransactions').get(),
    ]);

    const platforms: Platform[] = platformsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const platformTransactions: PlatformTransaction[] = platformTransactionsSnapshot.docs.map(
      (doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })
    );

    // Group transactions by platform
    const transactionsByPlatform = platformTransactions.reduce(
      (acc, transaction) => {
        if (!acc[transaction.platformId]) {
          acc[transaction.platformId] = [];
        }
        acc[transaction.platformId]!.push(transaction);
        return acc;
      },
      {} as Record<string, PlatformTransaction[]>
    );

    // Calculate accurate metrics for each platform
    const platformsWithMetrics = platforms.map(platform => {
      const transactions = transactionsByPlatform[platform.id] || [];
      const deposits = transactions.filter(t => t.type === 'deposit');
      const withdrawals = transactions.filter(t => t.type === 'withdrawal');

      const totalDeposited = deposits.reduce((sum, t) => sum + t.amount, 0);
      const totalWithdrawn = withdrawals.reduce((sum, t) => sum + t.amount, 0);
      const netInvestment = totalDeposited - totalWithdrawn;
      const netProfit = platform.currentBalance - netInvestment;
      const netProfitPercent = netInvestment > 0 ? (netProfit / netInvestment) * 100 : 0;

      // Calculate tracked vs untracked transfers
      const trackedDeposits = deposits
        .filter(t => t.sourceAccountId)
        .reduce((sum, t) => sum + t.amount, 0);
      const trackedWithdrawals = withdrawals
        .filter(t => t.sourceAccountId)
        .reduce((sum, t) => sum + t.amount, 0);
      const untrackedDeposits = totalDeposited - trackedDeposits;
      const untrackedWithdrawals = totalWithdrawn - trackedWithdrawals;

      return {
        ...platform,
        totalDeposited,
        totalWithdrawn,
        netProfit,
        netProfitPercent,
        netInvestment,
        trackedDeposits,
        trackedWithdrawals,
        untrackedDeposits,
        untrackedWithdrawals,
        transactions: transactions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      };
    });

    // Calculate totals
    const totalPlatformBalance = platformsWithMetrics.reduce((sum, p) => sum + p.currentBalance, 0);
    const totalTrackedDeposits = platformsWithMetrics.reduce(
      (sum, p) => sum + p.trackedDeposits,
      0
    );
    const totalTrackedWithdrawals = platformsWithMetrics.reduce(
      (sum, p) => sum + p.trackedWithdrawals,
      0
    );
    const totalUntrackedDeposits = platformsWithMetrics.reduce(
      (sum, p) => sum + p.untrackedDeposits,
      0
    );
    const totalUntrackedWithdrawals = platformsWithMetrics.reduce(
      (sum, p) => sum + p.untrackedWithdrawals,
      0
    );
    const totalNetProfit = platformsWithMetrics.reduce((sum, p) => sum + p.netProfit, 0);

    // Net tracked transfers (money moved from bank accounts to platforms)
    const netTrackedTransfers = totalTrackedDeposits - totalTrackedWithdrawals;

    // Calculate adjusted net worth
    // Platform balances represent real assets
    // But we need to subtract the money that came from tracked bank accounts to avoid double counting
    const adjustedPlatformValue = totalPlatformBalance;

    return NextResponse.json({
      success: true,
      data: {
        platforms: platformsWithMetrics,
        summary: {
          totalPlatformBalance,
          totalTrackedDeposits,
          totalTrackedWithdrawals,
          totalUntrackedDeposits,
          totalUntrackedWithdrawals,
          netTrackedTransfers,
          totalNetProfit,
          adjustedPlatformValue,
          platformCount: platforms.length,
          byType: platformsWithMetrics.reduce((acc, platform) => {
            if (!acc[platform.type]) {
              acc[platform.type] = {
                balance: 0,
                profit: 0,
                deposited: 0,
                withdrawn: 0,
                count: 0,
              };
            }
            acc[platform.type].balance += platform.currentBalance;
            acc[platform.type].profit += platform.netProfit;
            acc[platform.type].deposited += platform.totalDeposited;
            acc[platform.type].withdrawn += platform.totalWithdrawn;
            acc[platform.type].count += 1;
            return acc;
          }, {} as any),
        },
      },
    });
  } catch (error: any) {
    logger.error('Error fetching unified financials', {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch unified financials' },
      { status: 500 }
    );
  }
}
