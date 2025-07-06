// Only import on server-side to avoid client-side initialization issues
let generateChatCompletion: any;
let logger: any;

if (typeof window === 'undefined') {
  // In test environment, use static imports to work with Jest mocks
  if (process.env.NODE_ENV === 'test') {
    try {
      const openaiModule = require('@/lib/openai');
      const loggerModule = require('@/lib/logger');
      generateChatCompletion = openaiModule.generateChatCompletion;
      logger = loggerModule.default;

      // Ensure we have valid functions
      if (!generateChatCompletion) {
        throw new Error('generateChatCompletion not found');
      }
      if (!logger) {
        throw new Error('logger not found');
      }
    } catch (error) {
      // Fallback for tests - use mock functions if jest is available
      const mockFn = typeof jest !== 'undefined' ? jest.fn() : () => {};
      generateChatCompletion = mockFn;
      logger = { error: mockFn, warn: mockFn, info: mockFn };
    }
  } else {
    generateChatCompletion = require('./openai').generateChatCompletion;
    logger = require('./logger').default;
  }
}

// Standard financial categories based on common budgeting frameworks
export const EXPENSE_CATEGORIES = {
  // Essential Categories
  HOUSING: 'Housing',
  UTILITIES: 'Utilities',
  GROCERIES: 'Groceries',
  TRANSPORTATION: 'Transportation',
  HEALTHCARE: 'Healthcare',
  INSURANCE: 'Insurance',
  DEBT_PAYMENTS: 'Debt Payments',

  // Lifestyle Categories
  DINING_OUT: 'Dining Out',
  ENTERTAINMENT: 'Entertainment',
  SHOPPING: 'Shopping',
  TRAVEL: 'Travel',
  FITNESS: 'Fitness & Health',
  EDUCATION: 'Education',
  PERSONAL_CARE: 'Personal Care',

  // Financial Categories
  SAVINGS: 'Savings',
  INVESTMENTS: 'Investments',
  TRANSFERS: 'Transfers',
  FEES: 'Bank Fees',

  // Miscellaneous
  GIFTS: 'Gifts & Donations',
  BUSINESS: 'Business Expenses',
  TAXES: 'Taxes',
  UNCATEGORIZED: 'Uncategorized',
} as const;

export const INCOME_CATEGORIES = {
  SALARY: 'Salary',
  FREELANCE: 'Freelance Income',
  INVESTMENT_RETURNS: 'Investment Returns',
  RENTAL_INCOME: 'Rental Income',
  BUSINESS_INCOME: 'Business Income',
  GOVERNMENT_BENEFITS: 'Government Benefits',
  GIFTS_RECEIVED: 'Gifts Received',
  OTHER_INCOME: 'Other Income',
} as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[keyof typeof EXPENSE_CATEGORIES];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[keyof typeof INCOME_CATEGORIES];
export type TransactionCategory = ExpenseCategory | IncomeCategory;

export interface CategorizedTransaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  originalCategory?: string[] | undefined;
  aiCategory: TransactionCategory;
  aiConfidence: number;
  reasoning?: string;
  type: 'income' | 'expense';
}

export interface CategorySuggestion {
  category: TransactionCategory;
  confidence: number;
  reasoning: string;
}

/**
 * Categorize a single transaction using AI
 */
export async function categorizeTransaction(transaction: {
  amount: number;
  description: string;
  date: string;
  originalCategory?: string[] | undefined;
  merchant_name?: string | undefined;
  payment_channel?: string | undefined;
}): Promise<CategorySuggestion> {
  try {
    // Ensure we're on server-side
    if (typeof window !== 'undefined') {
      throw new Error('AI categorization can only run on server-side');
    }
    const isIncome = transaction.amount < 0; // Plaid uses negative amounts for income
    const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    const systemPrompt = `You are a financial transaction categorization expert. Your job is to categorize financial transactions into the most appropriate category.

Available categories for ${isIncome ? 'INCOME' : 'EXPENSES'}:
${Object.values(categories)
  .map(cat => `- ${cat}`)
  .join('\n')}

Guidelines:
1. Analyze the transaction description, amount, and any available metadata
2. Choose the MOST SPECIFIC and ACCURATE category
3. Provide a confidence score (0-100)
4. Give a brief reasoning for your choice
5. Consider common merchant names and transaction patterns

Respond in this exact JSON format:
{
  "category": "exact category name from the list",
  "confidence": number between 0-100,
  "reasoning": "brief explanation of your choice"
}`;

    const userPrompt = `Categorize this transaction:
- Description: "${transaction.description}"
- Amount: $${Math.abs(transaction.amount).toFixed(2)} ${isIncome ? '(income)' : '(expense)'}
- Date: ${transaction.date}
${transaction.merchant_name ? `- Merchant: ${transaction.merchant_name}` : ''}
${transaction.payment_channel ? `- Payment Method: ${transaction.payment_channel}` : ''}
${transaction.originalCategory?.length ? `- Bank Category: ${transaction.originalCategory.join(', ')}` : ''}`;

    const response = await generateChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: 'gpt-4o',
        temperature: 0.3, // Lower temperature for more consistent categorization
        maxTokens: 300,
      }
    );

    // Parse AI response
    try {
      const parsed = JSON.parse(response.content);

      // Validate the response
      if (!parsed.category || !Object.values(categories).includes(parsed.category)) {
        throw new Error('Invalid category returned by AI');
      }

      if (
        typeof parsed.confidence !== 'number' ||
        parsed.confidence < 0 ||
        parsed.confidence > 100
      ) {
        throw new Error('Invalid confidence score');
      }

      return {
        category: parsed.category,
        confidence: Math.round(parsed.confidence),
        reasoning: parsed.reasoning || 'AI categorization',
      };
    } catch (parseError) {
      logger?.error('Failed to parse AI categorization response', {
        error: parseError,
        response: response.content,
        transaction: transaction.description,
      });

      // Fallback categorization
      return fallbackCategorization(transaction, isIncome);
    }
  } catch (error) {
    logger?.error('Error in AI categorization', { error, transaction: transaction.description });
    return fallbackCategorization(transaction, transaction.amount < 0);
  }
}

/**
 * Categorize multiple transactions in batch for efficiency
 */
export async function categorizeTransactionsBatch(
  transactions: Array<{
    id: string;
    amount: number;
    description: string;
    date: string;
    originalCategory?: string[] | undefined;
    merchant_name?: string | undefined;
    payment_channel?: string | undefined;
  }>
): Promise<CategorizedTransaction[]> {
  // Ensure we're on server-side
  if (typeof window !== 'undefined') {
    throw new Error('AI categorization can only run on server-side');
  }
  const batchSize = 10; // Process in batches to avoid rate limits
  const results: CategorizedTransaction[] = [];

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);

    const batchPromises = batch.map(async transaction => {
      const suggestion = await categorizeTransaction(transaction);

      return {
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date,
        originalCategory: transaction.originalCategory || undefined,
        aiCategory: suggestion.category,
        aiConfidence: suggestion.confidence,
        reasoning: suggestion.reasoning,
        type: transaction.amount < 0 ? ('income' as const) : ('expense' as const),
      };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches to respect rate limits
    if (i + batchSize < transactions.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Fallback categorization using rule-based logic
 */
function fallbackCategorization(
  transaction: {
    amount: number;
    description: string;
    originalCategory?: string[] | undefined;
  },
  isIncome: boolean
): CategorySuggestion {
  const description = transaction.description.toLowerCase();

  if (isIncome) {
    if (description.includes('salary') || description.includes('payroll')) {
      return {
        category: INCOME_CATEGORIES.SALARY,
        confidence: 80,
        reasoning: 'Pattern match: salary/payroll',
      };
    }
    if (description.includes('freelance') || description.includes('contractor')) {
      return {
        category: INCOME_CATEGORIES.FREELANCE,
        confidence: 75,
        reasoning: 'Pattern match: freelance',
      };
    }
    return {
      category: INCOME_CATEGORIES.OTHER_INCOME,
      confidence: 50,
      reasoning: 'Fallback: general income',
    };
  }

  // Expense categorization
  if (
    description.includes('grocery') ||
    description.includes('supermarket') ||
    description.includes('food')
  ) {
    return {
      category: EXPENSE_CATEGORIES.GROCERIES,
      confidence: 85,
      reasoning: 'Pattern match: grocery/food',
    };
  }
  if (
    description.includes('gas') ||
    description.includes('fuel') ||
    description.includes('uber') ||
    description.includes('lyft')
  ) {
    return {
      category: EXPENSE_CATEGORIES.TRANSPORTATION,
      confidence: 80,
      reasoning: 'Pattern match: transportation',
    };
  }
  if (
    description.includes('restaurant') ||
    description.includes('cafe') ||
    description.includes('starbucks')
  ) {
    return {
      category: EXPENSE_CATEGORIES.DINING_OUT,
      confidence: 85,
      reasoning: 'Pattern match: dining out',
    };
  }
  if (description.includes('rent') || description.includes('mortgage')) {
    return {
      category: EXPENSE_CATEGORIES.HOUSING,
      confidence: 90,
      reasoning: 'Pattern match: housing',
    };
  }
  if (
    description.includes('electric') ||
    description.includes('water') ||
    description.includes('internet')
  ) {
    return {
      category: EXPENSE_CATEGORIES.UTILITIES,
      confidence: 85,
      reasoning: 'Pattern match: utilities',
    };
  }
  if (
    description.includes('netflix') ||
    description.includes('spotify') ||
    description.includes('entertainment') ||
    description.includes('movie') ||
    description.includes('subscription')
  ) {
    return {
      category: EXPENSE_CATEGORIES.ENTERTAINMENT,
      confidence: 80,
      reasoning: 'Pattern match: entertainment',
    };
  }

  return {
    category: EXPENSE_CATEGORIES.UNCATEGORIZED,
    confidence: 30,
    reasoning: 'Fallback: no pattern match',
  };
}

/**
 * Analyze spending patterns and provide insights
 */
export async function analyzeSpendingPatterns(
  categorizedTransactions: CategorizedTransaction[]
): Promise<{
  topCategories: Array<{ category: string; amount: number; percentage: number }>;
  monthlyTrends: Array<{ month: string; category: string; amount: number }>;
  insights: string[];
}> {
  // Ensure we're on server-side
  if (typeof window !== 'undefined') {
    throw new Error('AI analysis can only run on server-side');
  }
  // Calculate category totals
  const categoryTotals = new Map<string, number>();
  const monthlyData = new Map<string, Map<string, number>>();

  let totalExpenses = 0;

  categorizedTransactions.forEach(transaction => {
    if (transaction.type === 'expense') {
      const amount = Math.abs(transaction.amount);
      totalExpenses += amount;

      // Category totals
      const current = categoryTotals.get(transaction.aiCategory) || 0;
      categoryTotals.set(transaction.aiCategory, current + amount);

      // Monthly trends
      const month = transaction.date.substring(0, 7); // YYYY-MM format
      if (!monthlyData.has(month)) {
        monthlyData.set(month, new Map());
      }
      const monthData = monthlyData.get(month)!;
      const monthCategoryAmount = monthData.get(transaction.aiCategory) || 0;
      monthData.set(transaction.aiCategory, monthCategoryAmount + amount);
    }
  });

  // Top categories
  const topCategories = Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalExpenses) * 100,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  // Monthly trends
  const monthlyTrends: Array<{ month: string; category: string; amount: number }> = [];
  monthlyData.forEach((categories, month) => {
    categories.forEach((amount, category) => {
      monthlyTrends.push({ month, category, amount });
    });
  });

  // Generate insights using AI
  const insights = await generateSpendingInsights(topCategories, monthlyTrends);

  return {
    topCategories,
    monthlyTrends,
    insights,
  };
}

/**
 * Generate spending insights using AI
 */
async function generateSpendingInsights(
  topCategories: Array<{ category: string; amount: number; percentage: number }>,
  monthlyTrends: Array<{ month: string; category: string; amount: number }>
): Promise<string[]> {
  try {
    // Ensure we're on server-side
    if (typeof window !== 'undefined') {
      throw new Error('AI insights generation can only run on server-side');
    }
    const systemPrompt = `You are a financial advisor analyzing spending patterns. Provide 3-5 actionable insights based on the spending data. Focus on:
1. Spending patterns and potential areas for optimization
2. Budget recommendations
3. Trends that need attention
4. Positive spending habits to maintain

Keep insights concise, specific, and actionable. Each insight should be 1-2 sentences.`;

    const userPrompt = `Analyze this spending data:

Top Categories:
${topCategories.map(cat => `- ${cat.category}: $${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`).join('\n')}

Recent Monthly Trends:
${monthlyTrends
  .slice(0, 15)
  .map(trend => `- ${trend.month}: ${trend.category} $${trend.amount.toFixed(2)}`)
  .join('\n')}

Provide 3-5 specific, actionable insights.`;

    const response = await generateChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 500,
      }
    );

    // Parse insights from response
    const insights = response.content
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .filter((line: string) => !line.startsWith('#') && !line.startsWith('**'))
      .map((line: string) =>
        line
          .replace(/^\d+\.\s*/, '')
          .replace(/^-\s*/, '')
          .trim()
      )
      .filter((line: string) => line.length > 20); // Filter out very short lines

    return insights.slice(0, 5); // Return max 5 insights
  } catch (error) {
    logger?.error('Error generating spending insights', { error });
    return [
      'Review your top spending categories to identify potential savings opportunities.',
      'Consider setting up budget limits for your highest expense categories.',
      'Track monthly spending trends to spot unusual increases in specific categories.',
    ];
  }
}
