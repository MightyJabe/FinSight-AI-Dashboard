// Dashboard-related shared types

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string | string[];
  date: string;
  description?: string;
  recurrence?: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  institution: string;
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
  monthlySavings: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  accounts: Account[];
  manualAssets: ManualAsset[];
  liabilities: Liability[];
  netWorthHistory: Array<{ date: string; value: number }>;
  budgetCategories: BudgetCategory[];
  spendingByCategory: SpendingCategory[];
}

export interface Insight {
  title: string;
  description: string;
  type: 'financial_health' | 'spending_pattern' | 'investment' | 'budget';
  score?: number;
  recommendations?: string[];
}
