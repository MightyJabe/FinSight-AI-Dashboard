// import { getAuth } from 'firebase-admin/auth'; // Removed unused import
import { cookies } from 'next/headers';

import { auth } from '@/lib/firebase-admin';
import type { Overview } from '@/types/finance';

import { db } from './firebase-admin';
import { plaidClient } from './plaid'; // Make sure plaidClient is exported from plaid.ts

// Define asset types considered as liquid cash
export const LIQUID_ASSET_TYPES = [
  'Cash',
  'Wallet',
  'Checking Account',
  'Savings Account',
  'PayPal Balance',
  'Digital Wallet Balance',
  'Bank Account',
  // Add any other types that should be considered liquid cash
];

export interface Budget {
  monthlyExpenses: number;
  budgetCategories: Array<{
    id: string;
    name: string;
    amount: number;
    spent: number;
  }>;
  spendingByCategory: Array<{
    category: string;
    amount: number;
  }>;
}

export interface InvestmentAccounts {
  accounts: Array<{
    id: string;
    name: string;
    balance: number;
    type: string;
    performance: {
      daily: number;
      monthly: number;
      yearly: number;
    };
  }>;
}

export interface Liabilities {
  accounts: Array<{
    id: string;
    name: string;
    amount: number;
    type: string;
    interestRate: number;
    minimumPayment: number;
    remainingPayments: number;
    payoffDate: string;
  }>;
  totalDebt: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account: string;
  accountId: string;
  type: 'income' | 'expense';
  createdAt: string | undefined;
  updatedAt: string | undefined;
}

// Helper interface for the new function
export interface DisplayableAccount {
  id: string;
  itemId?: string;
  name: string;
  type: string;
  currentBalance: number;
  source: 'manual' | 'linked'; // To distinguish account origins
  // Consider adding an icon mapping based on type later if needed for UI
  // e.g., icon?: string;
}

/**
 * Gets the current user's ID from the session cookie
 */
async function getCurrentUserId() {
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
 * Fetches overview data for the authenticated user
 */
export async function getOverview(): Promise<Overview> {
  const userId = await getCurrentUserId();

  const [manualAssetsSnapshot, liabilitiesSnapshot, transactionsSnapshot, plaidItemsSnapshot] =
    await Promise.all([
      db.collection(`users/${userId}/manualAssets`).get(),
      db.collection(`users/${userId}/manualLiabilities`).get(),
      db.collection(`users/${userId}/transactions`).get(),
      db.collection(`users/${userId}/plaidItems`).get(),
    ]);

  // Helper function to safely convert dates
  const safeDateConversion = (
    date: string | Date | { toDate: () => Date } | undefined
  ): string | undefined => {
    if (!date) return undefined;
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'object' && date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toISOString();
    }
    return undefined;
  };

  // Process Manual Assets
  const manualAssetsRaw = manualAssetsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name as string,
      amount: Number(data.amount),
      type: data.type as string,
      description: data.description as string | undefined,
      createdAt: safeDateConversion(data.createdAt),
      updatedAt: safeDateConversion(data.updatedAt),
    };
  });

  // Process Liabilities
  const liabilities = liabilitiesSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name as string,
      amount: Number(data.amount),
      type: data.type as string,
      interestRate: Number(data.interestRate),
      minimumPayment: Number(data.minimumPayment),
      remainingPayments: Number(data.remainingPayments),
      payoffDate: data.payoffDate as string,
      createdAt: safeDateConversion(data.createdAt),
      updatedAt: safeDateConversion(data.updatedAt),
    };
  });

  // Process Transactions
  const transactions = transactionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      date: safeDateConversion(data.date) || new Date().toISOString(),
      description: data.description as string,
      amount: Number(data.amount),
      category: data.category as string,
      account: data.account as string,
      accountId: data.accountId as string,
      type: data.type as 'income' | 'expense',
      createdAt: safeDateConversion(data.createdAt),
      updatedAt: safeDateConversion(data.updatedAt),
    };
  });

  // --- Calculate Net Transaction Changes for Manual Assets ---
  const accountNetTransactionChanges: Record<string, number> = {};
  for (const transaction of transactions) {
    if (transaction.accountId) {
      const amount = Number(transaction.amount);
      const change = transaction.type === 'income' ? amount : -amount;
      accountNetTransactionChanges[transaction.accountId] =
        (accountNetTransactionChanges[transaction.accountId] || 0) + change;
    }
  }

  // --- Calculate Total Cash Assets ---
  let calculatedTotalCashAssets = 0;
  const overviewAccounts: Overview['accounts'] = []; // To populate overview.accounts

  // 1. From Manual Assets
  const updatedManualAssetsWithCurrentBalance = manualAssetsRaw.map(asset => {
    let currentBalance = asset.amount;
    currentBalance += accountNetTransactionChanges[asset.id] || 0;
    if (LIQUID_ASSET_TYPES.includes(asset.type)) {
      calculatedTotalCashAssets += currentBalance;
      overviewAccounts.push({
        id: asset.id,
        name: asset.name,
        balance: currentBalance,
        type: asset.type,
        institution: '', // No institution for manual assets
      });
    }
    return { ...asset, currentBalance };
  });

  // 2. From Plaid Linked Accounts
  if (!plaidItemsSnapshot.empty) {
    for (const itemDoc of plaidItemsSnapshot.docs) {
      const plaidItem = itemDoc.data();
      const accessToken = plaidItem.accessToken as string;
      if (accessToken) {
        try {
          const balanceResponse = await plaidClient.accountsBalanceGet({
            access_token: accessToken,
          });
          balanceResponse.data.accounts.forEach((plaidAccount: import('plaid').AccountBase) => {
            // Determine if Plaid account is cash-like (e.g., depository checking/savings)
            const accountType = plaidAccount.type?.toLowerCase();
            const accountSubtype = plaidAccount.subtype?.toLowerCase();
            // Add more Plaid types/subtypes that are considered liquid cash
            if (
              accountType === 'depository' &&
              (accountSubtype === 'checking' || accountSubtype === 'savings')
            ) {
              const currentPlaidBalance =
                plaidAccount.balances.current ?? plaidAccount.balances.available ?? 0;
              calculatedTotalCashAssets += currentPlaidBalance;
              overviewAccounts.push({
                id: plaidAccount.account_id,
                name: plaidAccount.name || plaidAccount.official_name || 'Plaid Account',
                balance: currentPlaidBalance,
                type: `${plaidAccount.subtype || plaidAccount.type}`
                  .toLowerCase()
                  .replace(/_/g, ' ')
                  .replace(/(?:^|\s)\S/g, a => a.toUpperCase()),
                institution: '', // Plaid does not provide institution per account here
              });
            }
            // We could also add non-cash Plaid accounts to a different list if needed elsewhere
          });
        } catch (error: unknown) {
          console.error(
            `Error fetching Plaid balances for overview for item ${plaidItem.itemId}:`,
            error instanceof Error ? error.message : error
          );
          // Decide how to handle errors - e.g., skip this item, or add a placeholder to overviewAccounts if useful
        }
      }
    }
  }

  // --- Calculate other Overview metrics (Net Worth, Income, Expenses etc.) ---

  // Total Assets for Net Worth:
  // Sum of current balances of all manual assets + sum of current balances of all Plaid accounts.
  const totalManualAssetValuesForNetWorth = updatedManualAssetsWithCurrentBalance.reduce(
    (sum, asset) => sum + asset.currentBalance,
    0
  );

  let totalPlaidAssetValuesForNetWorth = 0;
  if (!plaidItemsSnapshot.empty) {
    for (const itemDoc of plaidItemsSnapshot.docs) {
      const plaidItem = itemDoc.data();
      const accessToken = plaidItem.accessToken as string;
      if (accessToken) {
        try {
          const balanceResponse = await plaidClient.accountsBalanceGet({
            access_token: accessToken,
          });
          balanceResponse.data.accounts.forEach((plaidAccount: import('plaid').AccountBase) => {
            totalPlaidAssetValuesForNetWorth +=
              plaidAccount.balances.current ?? plaidAccount.balances.available ?? 0;
          });
        } catch (error: unknown) {
          console.error(
            `Error fetching Plaid balances for overview for item ${plaidItem.itemId}:`,
            error instanceof Error ? error.message : error
          );
          // Decide how to handle errors - e.g., skip this item, or add a placeholder to overviewAccounts if useful
        }
      }
    }
  }

  const totalAssets = totalManualAssetValuesForNetWorth + totalPlaidAssetValuesForNetWorth;
  const totalLiabilities = liabilities.reduce(
    (sum, liability) => sum + Number(liability.amount),
    0
  );
  const netWorth = totalAssets - totalLiabilities;

  const now = new Date();
  const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30)); // Corrected date calculation
  const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);

  const monthlyIncome = recentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyExpenses = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlySavings = monthlyIncome - monthlyExpenses;

  const spendingByCategory = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce(
      (acc, t) => {
        const category = t.category;
        acc[category] = (acc[category] || 0) + Number(t.amount);
        return acc;
      },
      {} as Record<string, number>
    );

  // Ensure all data is serialized before returning
  const serializedOverview = {
    netWorth,
    totalAssets,
    totalLiabilities,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    totalCashAssets: calculatedTotalCashAssets,
    emergencyFundStatus:
      monthlySavings > 0 && monthlyExpenses > 0
        ? Math.min(monthlySavings / (monthlyExpenses * 3), 1)
        : 0,
    savingsRate: monthlyIncome > 0 ? monthlySavings / monthlyIncome : 0,
    accounts: overviewAccounts.map(account => ({
      ...account,
      balance: Number(account.balance),
    })),
    manualAssets: updatedManualAssetsWithCurrentBalance.map(asset => ({
      ...asset,
      amount: Number(asset.amount),
      currentBalance: Number(asset.currentBalance),
    })),
    liabilities: liabilities.map(liability => ({
      ...liability,
      amount: Number(liability.amount),
    })),
    budgetCategories: Object.entries(spendingByCategory).map(([name, amount]) => ({
      id: name,
      name,
      amount: Number(monthlyExpenses),
      spent: Number(amount),
    })),
    spendingByCategory: Object.entries(spendingByCategory).map(([category, amount]) => ({
      category,
      amount: Number(amount),
    })),
    debtToIncomeRatio:
      monthlyIncome > 0 ? Number(totalLiabilities) / (Number(monthlyIncome) * 12) : 0,
    netWorthHistory: Array.isArray((globalThis as { netWorthHistory?: number[] }).netWorthHistory)
      ? (globalThis as { netWorthHistory?: number[] }).netWorthHistory
      : [],
  };

  // Ensure complete serialization
  return JSON.parse(JSON.stringify(serializedOverview));
}

/**
 * Fetches budget data for the authenticated user
 */
export async function getBudget(): Promise<Budget> {
  const userId = await getCurrentUserId();

  const transactionsSnapshot = await db.collection(`users/${userId}/transactions`).get();
  const transactions = transactionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      date: data.date?.toDate ? data.date.toDate().toISOString() : (data.date as string),
      description: data.description as string,
      amount: Number(data.amount),
      category: data.category as string,
      account: data.account as string,
      accountId: data.accountId as string,
      type: data.type as 'income' | 'expense',
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate().toISOString()
        : (data.createdAt as string | undefined),
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate().toISOString()
        : (data.updatedAt as string | undefined),
    };
  }) as Transaction[];

  // Calculate monthly metrics
  const now = new Date();
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
  const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);

  const monthlyExpenses = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Calculate spending by category
  const spendingByCategory = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce(
      (acc, t) => {
        const category = t.category;
        acc[category] = (acc[category] || 0) + Number(t.amount);
        return acc;
      },
      {} as Record<string, number>
    );

  return {
    monthlyExpenses,
    budgetCategories: Object.entries(spendingByCategory).map(([name, amount]) => ({
      id: name,
      name,
      amount: monthlyExpenses,
      spent: amount,
    })),
    spendingByCategory: Object.entries(spendingByCategory).map(([category, amount]) => ({
      category,
      amount,
    })),
  };
}

/**
 * Fetches investment accounts data for the authenticated user
 */
export async function getInvestmentAccounts(): Promise<InvestmentAccounts> {
  const userId = await getCurrentUserId();

  const assetsSnapshot = await db.collection(`users/${userId}/manualAssets`).get();
  const assets = assetsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name as string,
      amount: Number(data.amount),
      type: data.type as string,
      description: data.description as string | undefined,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate().toISOString()
        : (data.createdAt as string | undefined),
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate().toISOString()
        : (data.updatedAt as string | undefined),
    };
  }) as Array<
    Overview['manualAssets'][number] & {
      amount: number;
      description?: string;
      createdAt?: string;
      updatedAt?: string;
    }
  >;

  // Filter investment assets
  const investmentAssets = assets.filter(asset => ['investment', 'crypto'].includes(asset.type));

  return {
    accounts: investmentAssets.map(asset => ({
      id: asset.id,
      name: asset.name,
      balance: Number(asset.amount),
      type: asset.type,
      performance: {
        daily: 0, // Not implemented yet; UI should handle empty state
        monthly: 0,
        yearly: 0,
      },
    })),
  };
}

/**
 * Fetches liabilities data for the authenticated user
 */
export async function getLiabilities(): Promise<Liabilities> {
  const userId = await getCurrentUserId();

  const liabilitiesSnapshot = await db.collection(`users/${userId}/manualLiabilities`).get();
  const liabilities = liabilitiesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Overview['liabilities'];

  const totalDebt = liabilities.reduce((sum, liability) => sum + Number(liability.amount), 0);

  return {
    accounts: liabilities.map(liability => ({
      ...liability,
      amount: Number(liability.amount),
      interestRate: liability.interestRate !== undefined ? Number(liability.interestRate) : 0,
      minimumPayment: liability.minimumPayment !== undefined ? Number(liability.minimumPayment) : 0,
      remainingPayments:
        liability.remainingPayments !== undefined ? Number(liability.remainingPayments) : 0,
      payoffDate: liability.payoffDate || '',
    })),
    totalDebt,
  };
}

/**
 * Fetches transactions for the authenticated user
 */
export async function getTransactions(): Promise<Transaction[]> {
  const userId = await getCurrentUserId();

  const transactionsSnapshot = await db.collection(`users/${userId}/transactions`).get();
  return transactionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      date: data.date?.toDate ? data.date.toDate().toISOString() : (data.date as string),
      description: data.description as string,
      amount: Number(data.amount),
      category: data.category as string,
      account: data.account as string,
      accountId: data.accountId as string,
      type: data.type as 'income' | 'expense',
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate().toISOString()
        : (data.createdAt as string | undefined),
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate().toISOString()
        : (data.updatedAt as string | undefined),
    };
  }) as Transaction[];
}

/**
 * Fetches all displayable accounts (manual and eventually linked) for the user,
 * with dynamically calculated current balances for manual accounts.
 */
export async function getDisplayableAccounts(): Promise<DisplayableAccount[]> {
  const userId = await getCurrentUserId();

  const [manualAssetsSnapshot, transactionsSnapshot, plaidItemsSnapshot] = await Promise.all([
    db.collection(`users/${userId}/manualAssets`).get(),
    db.collection(`users/${userId}/transactions`).get(),
    db.collection(`users/${userId}/plaidItems`).get(), // Fetch Plaid items
  ]);

  // --- Process Manual Assets (same as before) ---
  const manualAssetsData = manualAssetsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name as string,
      amount: Number(data.amount),
      type: data.type as string,
    };
  });

  const transactionsData = transactionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      accountId: data.accountId as string,
      amount: Number(data.amount),
      type: data.type as 'income' | 'expense',
    };
  });

  const accountNetTransactionChanges: Record<string, number> = {};
  for (const transaction of transactionsData) {
    if (transaction.accountId) {
      const change = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      accountNetTransactionChanges[transaction.accountId] =
        (accountNetTransactionChanges[transaction.accountId] || 0) + change;
    }
  }

  const displayableManualAccounts: DisplayableAccount[] = manualAssetsData.map(asset => {
    let currentBalance = asset.amount;
    currentBalance += accountNetTransactionChanges[asset.id] || 0;
    return {
      id: asset.id,
      name: asset.name,
      type: asset.type,
      currentBalance: currentBalance,
      source: 'manual',
    };
  });

  // --- Process Plaid Linked Accounts ---
  const linkedPlaidAccounts: DisplayableAccount[] = [];
  if (!plaidItemsSnapshot.empty) {
    for (const itemDoc of plaidItemsSnapshot.docs) {
      const plaidItem = itemDoc.data();
      const accessToken = plaidItem.accessToken as string;
      const itemId = plaidItem.itemId as string;

      if (accessToken) {
        try {
          const balanceResponse = await plaidClient.accountsBalanceGet({
            access_token: accessToken,
          });
          // Make sure to import Plaid AccountBase type or define a similar one
          balanceResponse.data.accounts.forEach((plaidAccount: import('plaid').AccountBase) => {
            // Replace 'any' with Plaid's AccountBase
            linkedPlaidAccounts.push({
              id: plaidAccount.account_id,
              itemId: itemId,
              name: plaidAccount.name || plaidAccount.official_name || 'Unnamed Account',
              // Attempt to use a more specific type, otherwise default to Plaid's type
              type: `${plaidAccount.subtype || plaidAccount.type}`
                .toLowerCase()
                .replace(/_/g, ' ')
                .replace(/(?:^|\s)\S/g, a => a.toUpperCase()), // Format type string
              currentBalance: plaidAccount.balances.current ?? plaidAccount.balances.available ?? 0,
              source: 'linked',
              // Consider adding institutionName: plaidItem.institutionName to DisplayableAccount
            });
          });
        } catch (error: unknown) {
          console.error(
            `Error fetching Plaid accounts for item ID ${itemId}:`,
            error instanceof Error ? error.message : error
          );
          // Optionally, add a placeholder account indicating an error for this item
          linkedPlaidAccounts.push({
            id: `error-${itemId}`,
            itemId: itemId,
            name: plaidItem.institutionName
              ? `Error: ${plaidItem.institutionName}`
              : `Error: Linked Account ${itemId.substring(0, 6)}...`,
            type: 'Error',
            currentBalance: 0,
            source: 'linked',
          });
        }
      }
    }
  }

  return [...displayableManualAccounts, ...linkedPlaidAccounts].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

// Ensure Overview is exported for external use
export type { Overview };
