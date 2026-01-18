// Mock for ai-categorization module

export const EXPENSE_CATEGORIES = {
  HOUSING: 'Housing',
  UTILITIES: 'Utilities',
  GROCERIES: 'Groceries',
  TRANSPORTATION: 'Transportation',
  HEALTHCARE: 'Healthcare',
  INSURANCE: 'Insurance',
  DEBT_PAYMENTS: 'Debt Payments',
  DINING_OUT: 'Dining Out',
  ENTERTAINMENT: 'Entertainment',
  SHOPPING: 'Shopping',
  TRAVEL: 'Travel',
  FITNESS: 'Fitness & Health',
  EDUCATION: 'Education',
  PERSONAL_CARE: 'Personal Care',
  SAVINGS: 'Savings',
  INVESTMENTS: 'Investments',
  TRANSFERS: 'Transfers',
  FEES: 'Bank Fees',
  GIFTS: 'Gifts & Donations',
  BUSINESS: 'Business Expenses',
  TAXES: 'Taxes',
  UNCATEGORIZED: 'Uncategorized',
} as const;

export const INCOME_CATEGORIES = {
  SALARY: 'Salary',
  FREELANCE: 'Freelance Income',
  BUSINESS_INCOME: 'Business Income',
  INVESTMENT_INCOME: 'Investment Income',
  RENTAL_INCOME: 'Rental Income',
  REFUNDS: 'Refunds',
  OTHER_INCOME: 'Other Income',
} as const;

export const categorizeTransactionsBatch = jest.fn().mockResolvedValue([]);
export const categorizeTransaction = jest.fn().mockResolvedValue({
  category: 'Uncategorized',
  confidence: 0.5,
  reasoning: 'Mock categorization',
});
