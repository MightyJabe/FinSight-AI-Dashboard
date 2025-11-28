import { endOfMonth, formatISO, startOfMonth, subDays, subMonths } from 'date-fns';
import { NextResponse } from 'next/server';

import { validateAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/firebase-admin';
import { getAccountBalances, getTransactions } from '@/lib/plaid';
import { getPlaidAccessToken } from '@/lib/plaid-token-helper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 *
 */
export async function GET(request: Request) {
  try {
    // Validate authentication token
    const authResult = await validateAuthToken(request);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId!;

    // Get the user's Plaid access token
    const accessToken = await getPlaidAccessToken(userId);

    // Explicit types
    type Account = {
      account_id: string;
      name: string;
      type: string;
      subtype?: string | null;
      official_name?: string | null;
      balances: {
        current: number | null;
        available?: number | null;
        limit?: number | null;
      };
    };

    type Transaction = {
      transaction_id: string;
      name: string;
      amount: number;
      date: string;
      category?: string[] | null;
      payment_channel?: string | null;
      pending?: boolean;
    };

    type ManualLiability = {
      id: string;
      name: string;
      amount: number;
      type: string;
      createdAt: string;
    };

    type ManualAsset = {
      id: string;
      name: string;
      amount: number;
      type: string;
      description?: string;
      createdAt: string;
    };

    let accounts: Account[] = [];
    let totalBalance = 0;
    let transactions: Transaction[] = [];
    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    if (accessToken) {
      // Fetch accounts and balances
      const plaidAccounts = await getAccountBalances(accessToken);
      accounts = plaidAccounts.map(acc => ({
        account_id: acc.account_id,
        name: acc.name,
        type: acc.type,
        subtype: acc.subtype,
        official_name: acc.official_name,
        balances: {
          current: acc.balances.current,
          available: acc.balances.available,
          limit: acc.balances.limit,
        },
      }));
      totalBalance = accounts.reduce(
        (sum: number, acc: Account) => sum + (acc.balances.current || 0),
        0
      );

      // Fetch transactions for the last 30 days
      const endDate = formatISO(new Date(), { representation: 'date' });
      const startDate = formatISO(subDays(new Date(), 30), { representation: 'date' });
      const plaidTransactions = await getTransactions(accessToken, startDate, endDate);
      transactions = plaidTransactions.map(txn => ({
        transaction_id: txn.transaction_id,
        name: txn.name,
        amount: txn.amount,
        date: txn.date,
        category: txn.category,
        payment_channel: txn.payment_channel,
        pending: txn.pending,
      }));

      // Calculate monthly cash flow
      const currentMonthStart = startOfMonth(new Date());
      const currentMonthEnd = endOfMonth(new Date());
      const monthlyTransactions = transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= currentMonthStart && txnDate <= currentMonthEnd;
      });

      monthlyIncome = monthlyTransactions
        .filter(txn => txn.amount > 0)
        .reduce((sum, txn) => sum + txn.amount, 0);

      monthlyExpenses = monthlyTransactions
        .filter(txn => txn.amount < 0)
        .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
    }

    // Fetch manual assets
    const assetsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('manualAssets')
      .get();
    const manualAssets: ManualAsset[] = assetsSnapshot.docs.map(
      (doc: any) => ({ id: doc.id, ...doc.data() }) as ManualAsset
    );
    const totalManualAssets = manualAssets.reduce((sum, a) => sum + (a.amount || 0), 0);

    // Fetch manual liabilities
    const liabilitiesSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('manualLiabilities')
      .get();
    const manualLiabilities: ManualLiability[] = liabilitiesSnapshot.docs.map(
      (doc: any) => ({ id: doc.id, ...doc.data() }) as ManualLiability
    );
    const totalLiabilities = manualLiabilities.reduce((sum, l) => sum + (l.amount || 0), 0);

    // Total assets = bank accounts + manual assets
    const totalAssets = totalBalance + totalManualAssets;

    // Net worth = total assets - total liabilities
    const netWorth = totalAssets - totalLiabilities;

    // Monthly cash flow = income - expenses
    const monthlyCashFlow = monthlyIncome - monthlyExpenses;

    // Calculate net worth history for last 6 months
    const netWorthHistory: {
      month: string;
      netWorth: number;
      assets: number;
      liabilities: number;
    }[] = [];
    let estimatedBankBalance = totalBalance;
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));
      // Get transactions for this month
      const monthTxns = transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= monthStart && txnDate <= monthEnd;
      });
      // Estimate previous month balance by reversing this month's transactions
      if (i !== 5) {
        estimatedBankBalance -= monthTxns.reduce((sum, txn) => sum + txn.amount, 0);
      }
      // Manual assets/liabilities as of this month
      const assetsAsOf = manualAssets.filter(a => new Date(a.createdAt) <= monthEnd);
      const liabilitiesAsOf = manualLiabilities.filter(l => new Date(l.createdAt) <= monthEnd);
      const totalAssetsAsOf =
        estimatedBankBalance + assetsAsOf.reduce((sum, a) => sum + (a.amount || 0), 0);
      const totalLiabilitiesAsOf = liabilitiesAsOf.reduce((sum, l) => sum + (l.amount || 0), 0);
      netWorthHistory.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: '2-digit' }),
        netWorth: totalAssetsAsOf - totalLiabilitiesAsOf,
        assets: totalAssetsAsOf,
        liabilities: totalLiabilitiesAsOf,
      });
    }

    const totalEmergencyFund = accounts
      .filter(acc => acc.name.toLowerCase().includes('savings'))
      .reduce((sum, acc) => sum + (acc.balances.current || 0), 0);

    const savingsRate = monthlyIncome > 0 ? monthlyCashFlow / monthlyIncome : 0;
    const emergencyFundStatus =
      monthlyExpenses > 0 ? totalEmergencyFund / (monthlyExpenses * 3) : 0;

    return NextResponse.json({
      totalBalance,
      totalAssets,
      accounts,
      manualAssets,
      netWorth,
      transactions,
      liabilities: manualLiabilities,
      totalLiabilities,
      monthlyCashFlow,
      monthlyIncome,
      monthlyExpenses,
      netWorthHistory,
      emergencyFundStatus,
      savingsRate,
    });
  } catch (error) {
    console.error('Error fetching account overview:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch account overview',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
