import { cookies } from 'next/headers';

import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';

/**
 * Centralized financial calculation system
 * All financial metrics should be calculated through this module to ensure consistency
 */

export interface FinancialData {
  manualAssets: Array<{
    id: string;
    name: string;
    amount: number;
    type: string;
    currentBalance: number;
  }>;
  manualLiabilities: Array<{
    id: string;
    name: string;
    amount: number;
    type: string;
  }>;
  plaidAccounts: Array<{
    id: string;
    name: string;
    balance: number;
    type: string;
    accountType: string;
    subtype?: string;
    institution: string;
  }>;
  cryptoAccounts: Array<{
    id: string;
    name: string;
    balance: number;
    type: 'exchange' | 'wallet';
  }>;
  transactions: Array<{
    id: string;
    accountId: string;
    amount: number;
    type: 'income' | 'expense';
    date: Date;
  }>;
}

export interface FinancialMetrics {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liquidAssets: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
  investments: number;
}

/**
 * Get current user ID from session cookie
 */
async function getCurrentUserId(): Promise<string> {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) {
    throw new Error('No session cookie found');
  }

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie);
    return decodedClaims.uid;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    throw new Error('Invalid session');
  }
}

/**
 * Fetch all raw financial data for a user
 */
export async function fetchFinancialData(userId: string): Promise<FinancialData> {
  const actualUserId = userId;

  // Fetch all data in parallel
  const [manualAssetsSnapshot, liabilitiesSnapshot, transactionsSnapshot, cryptoAccountsSnapshot] =
    await Promise.all([
      db.collection(`users/${actualUserId}/manualAssets`).get(),
      db.collection(`users/${actualUserId}/manualLiabilities`).get(),
      db
        .collection('transactions')
        .where('userId', '==', actualUserId)
        .orderBy('date', 'desc')
        .limit(200)
        .get(),
      db.collection(`users/${actualUserId}/crypto_accounts`).get(),
    ]);

  // Process manual assets
  const manualAssets = manualAssetsSnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || 'Unknown Asset',
      amount: Number(data.amount || data.balance || 0),
      type: data.type || 'other',
      currentBalance: Number(data.amount || data.balance || 0),
    };
  });

  // Process manual liabilities
  const manualLiabilities = liabilitiesSnapshot.docs.map((doc: any) => ({
    id: doc.id,
    name: doc.data().name,
    amount: Number(doc.data().amount || 0),
    type: doc.data().type,
  }));

  // Process transactions
  const transactions = transactionsSnapshot.docs.map((doc: any) => {
    const data = doc.data();
    let date: Date;
    if (data.date?.toDate) {
      date = data.date.toDate();
    } else if (typeof data.date === 'string') {
      // Parse DD/MM/YYYY format
      const parts = data.date.split('/');
      if (parts.length === 3) {
        date = new Date(parts[2], parts[1] - 1, parts[0]);
      } else {
        date = new Date(data.date);
      }
    } else {
      date = new Date();
    }
    return {
      id: doc.id,
      accountId: data.accountId || '',
      amount: Number(data.amount || 0),
      type: data.type as 'income' | 'expense',
      date,
    };
  });

  // Calculate transaction changes for manual assets
  const accountChanges: Record<string, number> = {};
  transactions.forEach((t: FinancialData['transactions'][0]) => {
    if (t.accountId) {
      const change = t.type === 'income' ? t.amount : -t.amount;
      accountChanges[t.accountId] = (accountChanges[t.accountId] || 0) + change;
    }
  });

  // Update manual asset current balances
  manualAssets.forEach((asset: FinancialData['manualAssets'][0]) => {
    asset.currentBalance = asset.amount + (accountChanges[asset.id] || 0);
  });

  // Process Plaid accounts from cached data in Firestore
  const accountsSnapshot = await db
    .collection('accounts')
    .where('userId', '==', actualUserId)
    .get();
  const plaidAccounts: FinancialData['plaidAccounts'] = accountsSnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || 'Account',
      balance: data.balance || 0,
      type: data.type || 'depository',
      accountType: data.type || 'depository',
      subtype: data.subtype || undefined,
      institution: data.institutionName || '',
    };
  });

  // Process crypto accounts (placeholder balances until blockchain API integration)
  const cryptoAccounts = cryptoAccountsSnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.exchange || data.blockchain || 'Crypto Account',
      balance: 0, // TODO: Fetch real balance from blockchain/exchange API
      type: data.type as 'exchange' | 'wallet',
    };
  });

  return {
    manualAssets,
    manualLiabilities,
    plaidAccounts,
    cryptoAccounts,
    transactions,
  };
}

/**
 * Calculate all financial metrics from raw data
 * This is the single source of truth for all financial calculations
 */
export async function calculateFinancialMetrics(data: FinancialData): Promise<FinancialMetrics> {
  // Calculate total assets
  const manualAssetTotal = data.manualAssets.reduce((sum, asset) => sum + asset.currentBalance, 0);
  const plaidAssetTotal = data.plaidAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const cryptoAssetTotal = data.cryptoAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalAssets = manualAssetTotal + plaidAssetTotal + cryptoAssetTotal;

  // Calculate total liabilities
  const totalLiabilities = data.manualLiabilities.reduce(
    (sum, liability) => sum + liability.amount,
    0
  );

  // Calculate net worth
  const netWorth = totalAssets - totalLiabilities;

  // Calculate liquid assets (cash-like accounts)
  const liquidAssetTypes = [
    'Cash',
    'Wallet',
    'Checking Account',
    'Savings Account',
    'PayPal Balance',
    'Digital Wallet Balance',
    'Bank Account',
  ];
  const liquidFromManual = data.manualAssets
    .filter(asset => liquidAssetTypes.includes(asset.type))
    .reduce((sum, asset) => sum + asset.currentBalance, 0);

  const liquidFromPlaid = data.plaidAccounts
    .filter(
      acc =>
        acc.accountType === 'depository' &&
        acc.subtype &&
        ['checking', 'savings'].includes(acc.subtype)
    )
    .reduce((sum, acc) => sum + acc.balance, 0);

  const liquidAssets = liquidFromManual + liquidFromPlaid;

  // Calculate investments
  const investmentFromManual = data.manualAssets
    .filter(asset => asset.type && ['investment', 'crypto', 'Investment'].includes(asset.type))
    .reduce((sum, asset) => sum + asset.currentBalance, 0);

  const investmentFromPlaid = data.plaidAccounts
    .filter(acc => acc.accountType === 'investment')
    .reduce((sum, acc) => sum + acc.balance, 0);

  const investments = investmentFromManual + investmentFromPlaid + cryptoAssetTotal;

  // Calculate monthly cash flow from recent transactions (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentTransactions = data.transactions.filter(t => t.date >= thirtyDaysAgo);

  const monthlyIncome = recentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyCashFlow = monthlyIncome - monthlyExpenses;

  const metrics = {
    totalAssets,
    totalLiabilities,
    netWorth,
    liquidAssets,
    monthlyIncome,
    monthlyExpenses,
    monthlyCashFlow,
    investments,
  };

  // Validate and normalize for accuracy
  try {
    const { normalizeFinancialMetrics, enforceFinancialAccuracy } =
      await import('./financial-validator');
    const normalizedMetrics = normalizeFinancialMetrics(metrics);
    enforceFinancialAccuracy(normalizedMetrics, 'calculateFinancialMetrics');
    return normalizedMetrics;
  } catch {
    // Financial validator not available, return raw metrics
    return metrics;
  }
}

/**
 * Get complete financial overview with consistent calculations
 */
export async function getFinancialOverview(userId?: string): Promise<{
  data: FinancialData;
  metrics: FinancialMetrics;
}> {
  const actualUserId: string = userId ?? (await getCurrentUserId());
  const data = await fetchFinancialData(actualUserId);
  const metrics = await calculateFinancialMetrics(data);

  return { data, metrics };
}
