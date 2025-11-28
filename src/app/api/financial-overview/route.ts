import { endOfMonth, formatISO, startOfMonth, subDays } from 'date-fns';
import { NextResponse } from 'next/server';

import { validateAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { getAccountBalances, getTransactions } from '@/lib/plaid';
import { getPlaidAccessToken } from '@/lib/plaid-token-helper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/financial-overview
 * Consolidated endpoint for all financial data
 */
export async function GET(request: Request) {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId!;

    // Parse query parameters
    const url = new URL(request.url);
    const params = {
      includeTransactions: url.searchParams.get('includeTransactions') !== 'false',
      transactionDays: parseInt(url.searchParams.get('transactionDays') || '30'),
      includePlatforms: url.searchParams.get('includePlatforms') !== 'false',
    };

    // Get Plaid access token
    const accessToken = await getPlaidAccessToken(userId);

    // Initialize response data
    const data = {
      accounts: {
        bank: [] as any[],
        investment: [] as any[],
        credit: [] as any[],
        loan: [] as any[],
      },
      transactions: [] as any[],
      platforms: [] as any[],
      manualAssets: [] as any[],
      manualLiabilities: [] as any[],
      summary: {
        totalAssets: 0,
        totalLiabilities: 0,
        netWorth: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyCashFlow: 0,
        liquidAssets: 0,
        investments: 0,
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        hasPlaidConnection: !!accessToken,
        hasPlatforms: false,
      },
    };

    // Fetch Plaid data if connected
    if (accessToken) {
      try {
        // Get accounts
        const plaidAccounts = await getAccountBalances(accessToken);

        // Categorize accounts
        for (const account of plaidAccounts) {
          const accountData = {
            id: account.account_id,
            name: account.name,
            type: account.type,
            subtype: account.subtype,
            institutionName: account.official_name,
            balance: account.balances.current || 0,
            availableBalance: account.balances.available,
            limit: account.balances.limit,
            source: 'plaid',
          };

          switch (account.type) {
            case 'depository':
              data.accounts.bank.push(accountData);
              data.summary.liquidAssets += accountData.balance;
              break;
            case 'investment':
              data.accounts.investment.push(accountData);
              data.summary.investments += accountData.balance;
              break;
            case 'credit':
              data.accounts.credit.push(accountData);
              data.summary.totalLiabilities += Math.abs(accountData.balance);
              break;
            case 'loan':
              data.accounts.loan.push(accountData);
              data.summary.totalLiabilities += Math.abs(accountData.balance);
              break;
          }
        }

        // Get transactions if requested
        if (params.includeTransactions && params.transactionDays > 0) {
          const endDate = formatISO(new Date(), { representation: 'date' });
          const startDate = formatISO(subDays(new Date(), params.transactionDays), {
            representation: 'date',
          });
          const transactions = await getTransactions(accessToken, startDate, endDate);

          // Process transactions for monthly summary
          const currentMonthStart = startOfMonth(new Date());
          const currentMonthEnd = endOfMonth(new Date());

          for (const txn of transactions) {
            const txnDate = new Date(txn.date);
            const amount = txn.amount;

            if (txnDate >= currentMonthStart && txnDate <= currentMonthEnd) {
              if (amount > 0) {
                data.summary.monthlyExpenses += amount;
              } else {
                data.summary.monthlyIncome += Math.abs(amount);
              }
            }

            data.transactions.push({
              id: txn.transaction_id,
              name: txn.name,
              amount: amount,
              date: txn.date,
              category: txn.category?.[0] || 'Other',
              pending: txn.pending,
              accountId: txn.account_id,
            });
          }
        }
      } catch (error) {
        logger.error('Error fetching Plaid data', { userId, error });
        // Continue without Plaid data
      }
    }

    // Fetch manual assets
    const assetsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('manualAssets')
      .get();

    data.manualAssets = assetsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const totalManualAssets = data.manualAssets.reduce((sum, a: any) => sum + (a.amount || 0), 0);

    // Fetch manual liabilities
    const liabilitiesSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('manualLiabilities')
      .get();

    data.manualLiabilities = liabilitiesSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const totalManualLiabilities = data.manualLiabilities.reduce(
      (sum, l: any) => sum + (l.amount || 0),
      0
    );

    // Fetch platforms if requested
    if (params.includePlatforms) {
      const platformsSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('platforms')
        .get();

      const platformTransactionsSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('platformTransactions')
        .get();

      const platforms = platformsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const platformTransactions = platformTransactionsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Calculate platform metrics
      for (const platform of platforms as any[]) {
        const txns = platformTransactions.filter((t: any) => t.platformId === platform.id);
        const deposits = txns.filter((t: any) => t.type === 'deposit');
        const withdrawals = txns.filter((t: any) => t.type === 'withdrawal');

        const totalDeposited = deposits.reduce((sum: number, t: any) => sum + t.amount, 0);
        const totalWithdrawn = withdrawals.reduce((sum: number, t: any) => sum + t.amount, 0);
        const netInvestment = totalDeposited - totalWithdrawn;
        const netProfit = platform.currentBalance - netInvestment;

        data.platforms.push({
          ...platform,
          totalDeposited,
          totalWithdrawn,
          netInvestment,
          netProfit,
          netProfitPercent: netInvestment > 0 ? (netProfit / netInvestment) * 100 : 0,
          transactions: txns.length,
        });

        data.summary.investments += platform.currentBalance || 0;
      }

      data.metadata.hasPlatforms = platforms.length > 0;
    }

    // Calculate final summary
    data.summary.totalAssets =
      data.summary.liquidAssets + data.summary.investments + totalManualAssets;
    data.summary.totalLiabilities += totalManualLiabilities;
    data.summary.netWorth = data.summary.totalAssets - data.summary.totalLiabilities;
    data.summary.monthlyCashFlow = data.summary.monthlyIncome - data.summary.monthlyExpenses;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error fetching financial overview', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch financial overview',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
