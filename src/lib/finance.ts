export interface Overview {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  /**
   * Ratio of current emergency fund to recommended (e.g. 1 = 100% funded)
   */
  emergencyFundStatus: number;
  /**
   * Ratio of monthly savings to monthly income (e.g. 0.2 = 20%)
   */
  savingsRate: number;
  netWorthHistory: Array<{ date: string; value: number }>;
  accounts: Array<{
    id: string;
    name: string;
    balance: number;
    type: string;
  }>;
  manualAssets: Array<{
    id: string;
    name: string;
    amount: number;
    type: string;
    description?: string;
  }>;
  liabilities: Array<{
    id: string;
    name: string;
    amount: number;
    type: string;
    interestRate: number;
    minimumPayment: number;
    remainingPayments: number;
    payoffDate: string;
  }>;
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
  debtToIncomeRatio: number;
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
  assetAllocation: Array<{
    type: string;
    amount: number;
    target: number;
  }>;
  historicalPerformance: Array<{
    date: string;
    value: number;
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
  totalMonthlyPayment: number;
  totalDebt: number;
  projectedPayoffDate: string;
}

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  account: string;
  type: 'income' | 'expense';
}

/**
 *
 */
export async function getOverview(): Promise<Overview> {
  // TODO: Implement actual data fetching
  return {
    netWorth: 100000,
    totalAssets: 150000,
    totalLiabilities: 50000,
    monthlyIncome: 8000,
    monthlyExpenses: 5000,
    monthlySavings: 3000,
    emergencyFundStatus: 0.75, // 75% funded
    savingsRate: 0.375, // 37.5% savings rate
    netWorthHistory: [
      { date: '2024-01', value: 90000 },
      { date: '2024-02', value: 95000 },
      { date: '2024-03', value: 100000 },
    ],
    accounts: [
      { id: '1', name: 'Checking', balance: 5000, type: 'bank' },
      { id: '2', name: 'Savings', balance: 15000, type: 'bank' },
    ],
    manualAssets: [
      { id: '1', name: 'Car', amount: 25000, type: 'vehicle' },
      { id: '2', name: 'House', amount: 300000, type: 'real_estate' },
    ],
    liabilities: [
      {
        id: '1',
        name: 'Mortgage',
        amount: 250000,
        type: 'mortgage',
        interestRate: 0.035,
        minimumPayment: 1500,
        remainingPayments: 300,
        payoffDate: '2049-03',
      },
      {
        id: '2',
        name: 'Car Loan',
        amount: 20000,
        type: 'auto_loan',
        interestRate: 0.045,
        minimumPayment: 400,
        remainingPayments: 48,
        payoffDate: '2028-03',
      },
    ],
    budgetCategories: [
      { id: '1', name: 'Housing', amount: 2000, spent: 1800 },
      { id: '2', name: 'Food', amount: 800, spent: 750 },
      { id: '3', name: 'Transportation', amount: 500, spent: 450 },
    ],
    spendingByCategory: [
      { category: 'Housing', amount: 1800 },
      { category: 'Food', amount: 750 },
      { category: 'Transportation', amount: 450 },
    ],
    debtToIncomeRatio: 0.25, // 25% debt-to-income ratio
  };
}

/**
 *
 */
export async function getBudget(): Promise<Budget> {
  // TODO: Implement actual data fetching
  return {
    monthlyExpenses: 5000,
    budgetCategories: [
      { id: '1', name: 'Housing', amount: 2000, spent: 1800 },
      { id: '2', name: 'Food', amount: 800, spent: 750 },
      { id: '3', name: 'Transportation', amount: 500, spent: 450 },
    ],
    spendingByCategory: [
      { category: 'Housing', amount: 1800 },
      { category: 'Food', amount: 750 },
      { category: 'Transportation', amount: 450 },
    ],
  };
}

/**
 *
 */
export async function getInvestmentAccounts(): Promise<InvestmentAccounts> {
  // TODO: Implement actual data fetching
  return {
    accounts: [
      {
        id: '1',
        name: '401(k)',
        balance: 50000,
        type: 'retirement',
        performance: {
          daily: 0.001,
          monthly: 0.08,
          yearly: 0.07,
        },
      },
      {
        id: '2',
        name: 'IRA',
        balance: 25000,
        type: 'retirement',
        performance: {
          daily: 0.002,
          monthly: 0.07,
          yearly: 0.06,
        },
      },
      {
        id: '3',
        name: 'Brokerage',
        balance: 30000,
        type: 'investment',
        performance: {
          daily: 0.003,
          monthly: 0.09,
          yearly: 0.08,
        },
      },
    ],
    assetAllocation: [
      { type: 'Stocks', amount: 60000, target: 60 },
      { type: 'Bonds', amount: 30000, target: 30 },
      { type: 'Cash', amount: 15000, target: 10 },
    ],
    historicalPerformance: [
      { date: '2024-01', value: 95000 },
      { date: '2024-02', value: 98000 },
      { date: '2024-03', value: 105000 },
    ],
  };
}

/**
 *
 */
export async function getLiabilities(): Promise<Liabilities> {
  // TODO: Implement actual data fetching
  return {
    accounts: [
      {
        id: '1',
        name: 'Mortgage',
        amount: 250000,
        type: 'mortgage',
        interestRate: 0.035,
        minimumPayment: 1500,
        remainingPayments: 300,
        payoffDate: '2049-03',
      },
      {
        id: '2',
        name: 'Car Loan',
        amount: 20000,
        type: 'auto_loan',
        interestRate: 0.045,
        minimumPayment: 400,
        remainingPayments: 48,
        payoffDate: '2028-03',
      },
    ],
    totalMonthlyPayment: 1900,
    totalDebt: 270000,
    projectedPayoffDate: '2049-03',
  };
}

/**
 *
 */
export async function getTransactions(): Promise<Transaction[]> {
  // Mock data for transactions
  return [
    {
      id: '1',
      date: new Date('2024-03-01'),
      description: 'Salary',
      amount: 5000,
      category: 'Income',
      account: 'Checking',
      type: 'income',
    },
    {
      id: '2',
      date: new Date('2024-03-02'),
      description: 'Rent',
      amount: -1500,
      category: 'Housing',
      account: 'Checking',
      type: 'expense',
    },
    {
      id: '3',
      date: new Date('2024-03-03'),
      description: 'Grocery Shopping',
      amount: -200,
      category: 'Food',
      account: 'Credit Card',
      type: 'expense',
    },
    {
      id: '4',
      date: new Date('2024-03-04'),
      description: 'Freelance Work',
      amount: 800,
      category: 'Income',
      account: 'Checking',
      type: 'income',
    },
    {
      id: '5',
      date: new Date('2024-03-05'),
      description: 'Electric Bill',
      amount: -120,
      category: 'Utilities',
      account: 'Checking',
      type: 'expense',
    },
    {
      id: '6',
      date: new Date('2024-03-06'),
      description: 'Internet Bill',
      amount: -80,
      category: 'Utilities',
      account: 'Credit Card',
      type: 'expense',
    },
    {
      id: '7',
      date: new Date('2024-03-07'),
      description: 'Restaurant',
      amount: -75,
      category: 'Food',
      account: 'Credit Card',
      type: 'expense',
    },
    {
      id: '8',
      date: new Date('2024-03-08'),
      description: 'Gas',
      amount: -45,
      category: 'Transportation',
      account: 'Credit Card',
      type: 'expense',
    },
    {
      id: '9',
      date: new Date('2024-03-09'),
      description: 'Investment Dividend',
      amount: 150,
      category: 'Investment Income',
      account: 'Brokerage',
      type: 'income',
    },
    {
      id: '10',
      date: new Date('2024-03-10'),
      description: 'Movie Tickets',
      amount: -30,
      category: 'Entertainment',
      account: 'Credit Card',
      type: 'expense',
    },
  ];
}
