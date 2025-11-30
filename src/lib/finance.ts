// Legacy finance functions - use financial-calculator.ts for new code
import type { Overview } from '@/types/finance';

import { getFinancialOverview } from './financial-calculator';

// Re-export from financial-calculator
export {
  calculateFinancialMetrics,
  fetchFinancialData,
  getFinancialOverview,
} from './financial-calculator';

// Legacy constants
export const LIQUID_ASSET_TYPES = ['checking', 'savings', 'cash', 'money_market'];

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
  totalCategories?: number;
}

export interface InvestmentAccounts {
  accounts: Array<{
    id: string;
    name: string;
    balance: number;
    type: string;
    performance?: {
      daily: number;
      monthly: number;
      yearly: number;
    };
  }>;
  totalValue?: number;
  totalInvestmentValue?: number;
  totalManualInvestments?: number;
  accountCount?: number;
  performance?: {
    monthlyGain: number;
    yearToDate: number;
    allTimeGain: number;
  };
}

export interface Liabilities {
  accounts: Array<{
    id: string;
    name: string;
    amount: number;
    type: string;
    interestRate?: number;
    minimumPayment?: number;
    remainingPayments?: number;
    payoffDate?: string;
  }>;
  totalDebt: number;
  creditAccounts?: number;
  manualLiabilities?: number;
  totalCreditDebt?: number;
  totalManualDebt?: number;
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

// Removed duplicate getCurrentUserId - use the one in financial-calculator.ts

/**
 * Legacy function - use getFinancialOverview from financial-calculator.ts instead
 */
export async function getOverview(): Promise<Overview> {
  const { data, metrics } = await getFinancialOverview();

  // Transform to legacy format for backward compatibility
  const accounts = [
    ...data.manualAssets.map(asset => ({
      id: asset.id,
      name: asset.name,
      balance: asset.currentBalance,
      type: asset.type,
      institution: '',
    })),
    ...data.plaidAccounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      balance: acc.balance,
      type: acc.type,
      institution: acc.institution,
    })),
  ];

  return {
    netWorth: metrics.netWorth,
    totalAssets: metrics.totalAssets,
    totalLiabilities: metrics.totalLiabilities,
    monthlyIncome: metrics.monthlyIncome,
    monthlyExpenses: metrics.monthlyExpenses,
    monthlySavings: metrics.monthlyCashFlow,
    totalCashAssets: metrics.liquidAssets,
    emergencyFundStatus:
      metrics.monthlyExpenses > 0 ? metrics.liquidAssets / (metrics.monthlyExpenses * 3) : 0,
    savingsRate: metrics.monthlyIncome > 0 ? metrics.monthlyCashFlow / metrics.monthlyIncome : 0,
    accounts,
    manualAssets: data.manualAssets,
    liabilities: data.manualLiabilities,
    budgetCategories: [],
    spendingByCategory: [],
    debtToIncomeRatio:
      metrics.monthlyIncome > 0 ? metrics.totalLiabilities / (metrics.monthlyIncome * 12) : 0,
    netWorthHistory: [],
  };
}

// Legacy functions - use financial-calculator.ts for new implementations
// These are kept for backward compatibility only

/**
 * @deprecated Use getFinancialOverview from financial-calculator.ts instead
 */
export async function getBudget(): Promise<Budget> {
  const { data } = await getFinancialOverview();
  const monthlyExpenses = data.transactions
    .filter(t => t.type === 'expense' && t.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    monthlyExpenses,
    budgetCategories: [],
    spendingByCategory: [],
  };
}

/**
 * @deprecated Use getFinancialOverview from financial-calculator.ts instead
 */
export async function getInvestmentAccounts(): Promise<InvestmentAccounts> {
  const { data } = await getFinancialOverview();
  const investmentAssets = data.manualAssets.filter(asset =>
    ['investment', 'crypto'].includes(asset.type)
  );

  return {
    accounts: investmentAssets.map(asset => ({
      id: asset.id,
      name: asset.name,
      balance: asset.currentBalance,
      type: asset.type,
      performance: { daily: 0, monthly: 0, yearly: 0 },
    })),
  };
}

/**
 * @deprecated Use getFinancialOverview from financial-calculator.ts instead
 */
export async function getLiabilities(): Promise<Liabilities> {
  const { data } = await getFinancialOverview();
  const totalDebt = data.manualLiabilities.reduce((sum, l) => sum + l.amount, 0);

  return {
    accounts: data.manualLiabilities.map(liability => ({
      ...liability,
      interestRate: 0,
      minimumPayment: 0,
      remainingPayments: 0,
      payoffDate: '',
    })),
    totalDebt,
  };
}

/**
 * @deprecated Use getFinancialOverview from financial-calculator.ts instead
 */
export async function getTransactions(): Promise<Transaction[]> {
  const { data } = await getFinancialOverview();
  return data.transactions.map(t => ({
    id: t.id,
    date: t.date.toISOString(),
    description: `Transaction ${t.id}`,
    amount: t.amount,
    category: 'General',
    account: 'Account',
    accountId: t.accountId,
    type: t.type,
    createdAt: undefined,
    updatedAt: undefined,
  }));
}

/**
 * @deprecated Use getFinancialOverview from financial-calculator.ts instead
 */
export async function getDisplayableAccounts(): Promise<DisplayableAccount[]> {
  const { data } = await getFinancialOverview();

  const accounts: DisplayableAccount[] = [
    ...data.manualAssets.map(asset => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      currentBalance: asset.currentBalance,
      source: 'manual' as const,
    })),
    ...data.plaidAccounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      type: acc.type,
      currentBalance: acc.balance,
      source: 'linked' as const,
    })),
  ];

  return accounts.sort((a, b) => a.name.localeCompare(b.name));
}

// Ensure Overview is exported for external use
export type { Overview };
