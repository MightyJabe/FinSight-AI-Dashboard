// Dashboard-related shared types

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
  account: string;
  accountId: string;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
  recurrence?: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  institution: string;
  currency?: string;
}

export interface ManualAsset {
  id: string;
  name: string;
  type: string;
  amount: number;
  description?: string;
  createdAt?: string;
}

export interface Liability {
  id: string;
  name: string;
  type: string;
  amount: number;
  interestRate?: number;
  minimumPayment?: number;
  remainingPayments?: number;
  payoffDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetCategory {
  category: string;
  budget: number;
  spent: number;
}

export interface SpendingCategory {
  category: string;
  amount: number;
}

export interface Overview {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlySavings?: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  accounts: Account[];
  manualAssets: ManualAsset[];
  manualLiabilities?: number;
  liabilities: Liability[];
  netWorthHistory?: Array<{ date: string; value: number }>;
  budgetCategories?: BudgetCategory[];
  spendingByCategory?: SpendingCategory[];
  totalCashAssets?: number;
  emergencyFundStatus: number;
  savingsRate: number;
  debtToIncomeRatio?: number;
  totalBalance?: number; // For compatibility
}

export interface Insight {
  title: string;
  description: string;
  type: 'financial_health' | 'spending_pattern' | 'investment' | 'budget';
  score?: number;
  recommendations?: string[];
}

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

export interface InvestmentAccount {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
  source: 'linked' | 'manual';
  lastUpdated: string;
  holdings?: Array<{
    symbol: string;
    name: string;
    shares: number;
    currentPrice: number;
    value: number;
  }>;
  performance?: {
    totalReturn: number;
    dayChange: number;
    dayChangePercent: number;
  };
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
