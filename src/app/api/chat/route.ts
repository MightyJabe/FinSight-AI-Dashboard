import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

import { retrieveRelevantContext, storeConversationContext } from '@/lib/ai-memory';
import { getConfig } from '@/lib/config';
import { decryptPlaidToken, isEncryptedData } from '@/lib/encryption';
import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { getTransactions } from '@/lib/plaid';

const { openai: openaiEnvVars } = getConfig();

// Initialize OpenAI client conditionally
let openai: OpenAI | null = null;

// Skip OpenAI initialization in CI build environment
if (process.env.CI === 'true' && process.env.NODE_ENV === 'production') {
  console.log('Skipping OpenAI initialization in CI build environment');
  openai = {} as OpenAI;
} else {
  // Validate OpenAI API key
  if (!openaiEnvVars.apiKey) {
    logger.error('OpenAI API key is missing from environment variables');
    throw new Error('OpenAI API key is not configured');
  }

  openai = new OpenAI({
    apiKey: openaiEnvVars.apiKey,
  });
}

// Zod schema for request validation
const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
  conversationId: z.string().optional(),
});

// Tool definitions for OpenAI function calling
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_net_worth',
      description: "Get the user's current net worth (assets minus liabilities)",
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_account_balances',
      description: 'Get balances for all user accounts (bank accounts, manual accounts)',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_spending_by_category',
      description: 'Get spending breakdown by category for a specific time period',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['week', 'month', 'quarter', 'year'],
            description: 'Time period to analyze',
          },
          category: {
            type: 'string',
            description: 'Specific category to filter by (optional)',
          },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_recent_transactions',
      description: 'Get recent transactions with optional filtering',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of transactions to return (default: 10)',
          },
          category: {
            type: 'string',
            description: 'Filter by category',
          },
          amount_min: {
            type: 'number',
            description: 'Minimum transaction amount',
          },
          amount_max: {
            type: 'number',
            description: 'Maximum transaction amount',
          },
          merchant: {
            type: 'string',
            description: 'Search by merchant/business name (e.g., "Uber", "Starbucks", "Amazon")',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_transactions_by_merchant',
      description: 'Search transactions by merchant/business name with spending totals',
      parameters: {
        type: 'object',
        properties: {
          merchant: {
            type: 'string',
            description: 'Merchant name to search for (e.g., "Uber", "Starbucks", "Amazon")',
          },
          period: {
            type: 'string',
            enum: ['week', 'month', 'quarter', 'year'],
            description: 'Time period to search (default: month)',
          },
          limit: {
            type: 'number',
            description: 'Number of transactions to return (default: 50)',
          },
        },
        required: ['merchant'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_monthly_summary',
      description: 'Get monthly income, expenses, and savings summary',
      parameters: {
        type: 'object',
        properties: {
          month: {
            type: 'string',
            description: 'Month to analyze (YYYY-MM format, default: current month)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'analyze_debt_to_income_ratio',
      description: 'Calculate debt-to-income ratio and provide recommendations',
      parameters: {
        type: 'object',
        properties: {
          annual_income: {
            type: 'number',
            description:
              'Annual income (optional, will estimate from transaction data if not provided)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'analyze_cash_flow',
      description: 'Analyze cash flow patterns and provide projections',
      parameters: {
        type: 'object',
        properties: {
          months: {
            type: 'number',
            description: 'Number of months to analyze (default: 6)',
          },
          projection_months: {
            type: 'number',
            description: 'Number of months to project forward (default: 3)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'analyze_spending_patterns',
      description: 'Analyze spending patterns and identify trends, anomalies, and opportunities',
      parameters: {
        type: 'object',
        properties: {
          analysis_period: {
            type: 'string',
            enum: ['3_months', '6_months', '1_year'],
            description: 'Period to analyze spending patterns',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'calculate_emergency_fund_status',
      description: 'Calculate emergency fund adequacy and recommendations',
      parameters: {
        type: 'object',
        properties: {
          target_months: {
            type: 'number',
            description: 'Target months of expenses to save (default: 6)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'analyze_financial_health_score',
      description: 'Calculate comprehensive financial health score with detailed breakdown',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_documents',
      description:
        'Search ALL uploaded financial documents. ALWAYS call this first without category parameter to see all available documents.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['tax-returns', 'pay-stubs', 'statements', 'contracts', 'insurance', 'other'],
            description: 'Optional: Filter by specific category only after seeing all documents',
          },
        },
        required: [],
      },
    },
  },
];

// Function implementations
/**
 * Get net worth using centralized calculator with accuracy validation
 */
async function getNetWorth(
  userId: string
): Promise<{ netWorth: number; assets: number; liabilities: number }> {
  try {
    const { getFinancialOverview } = await import('@/lib/financial-calculator');
    const { enforceFinancialAccuracy } = await import('@/lib/financial-validator');
    const { metrics } = await getFinancialOverview(userId);

    // Enforce accuracy before returning to AI
    enforceFinancialAccuracy(metrics, 'chat getNetWorth');

    return {
      netWorth: metrics.netWorth,
      assets: metrics.totalAssets,
      liabilities: metrics.totalLiabilities,
    };
  } catch (error) {
    logger.error('Error calculating net worth', { userId, error });
    throw error;
  }
}

/**
 * Get account balances using centralized calculator
 */
async function getAccountBalancesData(
  userId: string
): Promise<Array<{ name: string; balance: number; type: string }>> {
  try {
    const { getFinancialOverview } = await import('@/lib/financial-calculator');
    const { data } = await getFinancialOverview(userId);

    const accounts: Array<{ name: string; balance: number; type: string }> = [];

    // Add manual assets
    data.manualAssets.forEach(asset => {
      accounts.push({
        name: asset.name,
        balance: asset.currentBalance,
        type: asset.type,
      });
    });

    // Add Plaid accounts
    data.plaidAccounts.forEach(account => {
      accounts.push({
        name: account.name,
        balance: account.balance,
        type: account.type,
      });
    });

    return accounts;
  } catch (error) {
    logger.error('Error getting account balances', { userId, error });
    throw error;
  }
}

/**
 *
 */
async function getSpendingByCategory(
  userId: string,
  period: string,
  category?: string
): Promise<Array<{ category: string; amount: number }>> {
  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to month
        break;
    }

    // Get transactions from Plaid
    const plaidItemsSnapshot = await db.collection(`users/${userId}/plaidItems`).get();
    const allTransactions: Array<{ category: string; amount: number }> = [];

    for (const itemDoc of plaidItemsSnapshot.docs) {
      const plaidItem = itemDoc.data();
      const storedToken = plaidItem.accessToken;
      if (storedToken) {
        try {
          const accessToken = isEncryptedData(storedToken)
            ? decryptPlaidToken(storedToken)
            : storedToken;
          const transactions = await getTransactions(
            accessToken,
            startDate.toISOString().split('T')[0] as string,
            now.toISOString().split('T')[0] as string
          );

          transactions.forEach(txn => {
            if (txn.amount < 0) {
              // Only expenses
              const txnCategory = txn.category?.[0] || 'Uncategorized';
              if (!category || txnCategory.toLowerCase().includes(category.toLowerCase())) {
                allTransactions.push({
                  category: txnCategory,
                  amount: Math.abs(txn.amount),
                });
              }
            }
          });
        } catch (error) {
          logger.error('Error fetching Plaid transactions for spending analysis', {
            userId,
            error,
          });
        }
      }
    }

    // Group by category
    const spendingByCategory: Record<string, number> = {};
    allTransactions.forEach(txn => {
      spendingByCategory[txn.category] = (spendingByCategory[txn.category] || 0) + txn.amount;
    });

    return Object.entries(spendingByCategory).map(([category, amount]) => ({
      category,
      amount,
    }));
  } catch (error) {
    logger.error('Error getting spending by category', { userId, error });
    throw error;
  }
}

/**
 *
 */
async function getRecentTransactions(
  userId: string,
  limit = 10,
  category?: string,
  amountMin?: number,
  amountMax?: number,
  merchant?: string
): Promise<Array<{ name: string; amount: number; date: string; category: string }>> {
  try {
    const plaidItemsSnapshot = await db.collection(`users/${userId}/plaidItems`).get();
    const allTransactions: Array<{ name: string; amount: number; date: string; category: string }> =
      [];

    for (const itemDoc of plaidItemsSnapshot.docs) {
      const plaidItem = itemDoc.data();
      const storedToken = plaidItem.accessToken;
      if (storedToken) {
        try {
          const accessToken = isEncryptedData(storedToken)
            ? decryptPlaidToken(storedToken)
            : storedToken;
          const transactions = await getTransactions(
            accessToken,
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] as string,
            new Date().toISOString().split('T')[0] as string
          );

          transactions.forEach(txn => {
            // Apply filters
            if (
              category &&
              !txn.category?.some(cat => cat.toLowerCase().includes(category.toLowerCase()))
            ) {
              return;
            }
            if (merchant && !txn.name.toLowerCase().includes(merchant.toLowerCase())) {
              return;
            }
            if (amountMin && Math.abs(txn.amount) < amountMin) {
              return;
            }
            if (amountMax && Math.abs(txn.amount) > amountMax) {
              return;
            }

            allTransactions.push({
              name: txn.name,
              amount: -txn.amount, // Invert Plaid amounts: negative becomes positive (income), positive becomes negative (expense)
              date: txn.date,
              category: txn.category?.[0] || 'Uncategorized',
            });
          });
        } catch (error) {
          logger.error('Error fetching Plaid transactions', { userId, error });
        }
      }
    }

    // Sort by date and limit
    return allTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  } catch (error) {
    logger.error('Error getting recent transactions', { userId, error });
    throw error;
  }
}

/**
 * Search transactions by merchant name with spending totals
 */
async function searchTransactionsByMerchant(
  userId: string,
  merchant: string,
  period = 'month',
  limit = 50
): Promise<{
  transactions: Array<{ name: string; amount: number; date: string; category: string }>;
  totalSpent: number;
  totalTransactions: number;
}> {
  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const plaidItemsSnapshot = await db.collection(`users/${userId}/plaidItems`).get();
    const matchingTransactions: Array<{
      name: string;
      amount: number;
      date: string;
      category: string;
    }> = [];

    for (const itemDoc of plaidItemsSnapshot.docs) {
      const plaidItem = itemDoc.data();
      const accessToken = plaidItem.accessToken;
      if (accessToken) {
        try {
          const transactions = await getTransactions(
            accessToken,
            startDate.toISOString().split('T')[0] as string,
            now.toISOString().split('T')[0] as string
          );

          transactions.forEach(txn => {
            // Search by merchant name (case insensitive)
            if (txn.name.toLowerCase().includes(merchant.toLowerCase())) {
              matchingTransactions.push({
                name: txn.name,
                amount: -txn.amount, // Invert Plaid amounts
                date: txn.date,
                category: txn.category?.[0] || 'Uncategorized',
              });
            }
          });
        } catch (error) {
          logger.error('Error fetching Plaid transactions for merchant search', { userId, error });
        }
      }
    }

    // Sort by date (most recent first) and limit results
    const sortedTransactions = matchingTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    // Calculate totals (only expenses - negative amounts)
    const expenseTransactions = matchingTransactions.filter(txn => txn.amount < 0);
    const totalSpent = expenseTransactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

    return {
      transactions: sortedTransactions,
      totalSpent,
      totalTransactions: matchingTransactions.length,
    };
  } catch (error) {
    logger.error('Error searching transactions by merchant', { userId, merchant, error });
    throw error;
  }
}

/**
 *
 */
async function getMonthlySummary(
  userId: string,
  month?: string
): Promise<{ income: number; expenses: number; savings: number }> {
  try {
    // Calculate date range for the specified month or current month
    const targetDate = month ? new Date(month + '-01') : new Date();
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    const plaidItemsSnapshot = await db.collection(`users/${userId}/plaidItems`).get();
    let income = 0;
    let expenses = 0;

    for (const itemDoc of plaidItemsSnapshot.docs) {
      const plaidItem = itemDoc.data();
      const accessToken = plaidItem.accessToken;
      if (accessToken) {
        try {
          const transactions = await getTransactions(
            accessToken,
            startOfMonth.toISOString().split('T')[0] as string,
            endOfMonth.toISOString().split('T')[0] as string
          );

          transactions.forEach(txn => {
            if (txn.amount > 0) {
              income += txn.amount;
            } else {
              expenses += Math.abs(txn.amount);
            }
          });
        } catch (error) {
          logger.error('Error fetching Plaid transactions for monthly summary', { userId, error });
        }
      }
    }

    const savings = income - expenses;

    return { income, expenses, savings };
  } catch (error) {
    logger.error('Error getting monthly summary', { userId, error });
    throw error;
  }
}

/**
 * Analyze debt-to-income ratio and provide recommendations
 */
async function analyzeDebtToIncomeRatio(
  userId: string,
  annualIncome?: number
): Promise<{
  debtToIncomeRatio: number;
  monthlyDebtPayments: number;
  monthlyIncome: number;
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high';
}> {
  try {
    // Get monthly income from transactions if not provided
    let monthlyIncome = annualIncome ? annualIncome / 12 : 0;

    if (!monthlyIncome) {
      // Estimate income from the last 3 months of transactions
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const plaidItemsSnapshot = await db.collection(`users/${userId}/plaidItems`).get();
      let totalIncome = 0;

      for (const itemDoc of plaidItemsSnapshot.docs) {
        const plaidItem = itemDoc.data();
        const accessToken = plaidItem.accessToken;
        if (accessToken) {
          try {
            const transactions = await getTransactions(
              accessToken,
              threeMonthsAgo.toISOString().split('T')[0] as string,
              new Date().toISOString().split('T')[0] as string
            );

            transactions.forEach(txn => {
              if (txn.amount > 0) {
                totalIncome += txn.amount;
              }
            });
          } catch (error) {
            logger.error('Error fetching transactions for DTI analysis', { userId, error });
          }
        }
      }

      monthlyIncome = totalIncome / 3;
    }

    // Calculate monthly debt payments from liabilities
    const liabilitiesSnapshot = await db.collection(`users/${userId}/manualLiabilities`).get();
    let monthlyDebtPayments = 0;

    liabilitiesSnapshot.docs.forEach((doc: any) => {
      const liability = doc.data();
      // Estimate monthly payment as 3% of total debt (conservative estimate)
      monthlyDebtPayments += (liability.amount || 0) * 0.03;
    });

    const debtToIncomeRatio = monthlyIncome > 0 ? (monthlyDebtPayments / monthlyIncome) * 100 : 0;

    let recommendation = '';
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (debtToIncomeRatio <= 20) {
      recommendation = 'Excellent debt-to-income ratio! You have good financial flexibility.';
      riskLevel = 'low';
    } else if (debtToIncomeRatio <= 36) {
      recommendation =
        'Good debt-to-income ratio, but consider paying down debt to improve financial health.';
      riskLevel = 'medium';
    } else {
      recommendation = 'High debt-to-income ratio. Focus on debt reduction strategies immediately.';
      riskLevel = 'high';
    }

    return {
      debtToIncomeRatio,
      monthlyDebtPayments,
      monthlyIncome,
      recommendation,
      riskLevel,
    };
  } catch (error) {
    logger.error('Error analyzing debt-to-income ratio', { userId, error });
    throw error;
  }
}

/**
 * Analyze cash flow patterns and provide projections
 */
async function analyzeCashFlow(
  userId: string,
  months = 6,
  projectionMonths = 3
): Promise<{
  historicalCashFlow: Array<{ month: string; income: number; expenses: number; netFlow: number }>;
  projectedCashFlow: Array<{
    month: string;
    projectedIncome: number;
    projectedExpenses: number;
    projectedNetFlow: number;
  }>;
  trends: {
    incomeGrowth: number;
    expenseGrowth: number;
    volatility: number;
  };
  recommendations: string[];
}> {
  try {
    const plaidItemsSnapshot = await db.collection(`users/${userId}/plaidItems`).get();
    const historicalData: Array<{
      month: string;
      income: number;
      expenses: number;
      netFlow: number;
    }> = [];

    // Analyze historical cash flow
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStr = monthDate.toISOString().substring(0, 7);

      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      let monthlyIncome = 0;
      let monthlyExpenses = 0;

      for (const itemDoc of plaidItemsSnapshot.docs) {
        const plaidItem = itemDoc.data();
        const accessToken = plaidItem.accessToken;
        if (accessToken) {
          try {
            const transactions = await getTransactions(
              accessToken,
              startOfMonth.toISOString().split('T')[0] as string,
              endOfMonth.toISOString().split('T')[0] as string
            );

            transactions.forEach(txn => {
              if (txn.amount > 0) {
                monthlyIncome += txn.amount;
              } else {
                monthlyExpenses += Math.abs(txn.amount);
              }
            });
          } catch (error) {
            logger.error('Error fetching transactions for cash flow analysis', { userId, error });
          }
        }
      }

      historicalData.push({
        month: monthStr,
        income: monthlyIncome,
        expenses: monthlyExpenses,
        netFlow: monthlyIncome - monthlyExpenses,
      });
    }

    // Calculate trends
    const incomes = historicalData.map(d => d.income);
    const expenses = historicalData.map(d => d.expenses);

    const incomeGrowth =
      incomes.length > 1 ? ((incomes[incomes.length - 1]! - incomes[0]!) / incomes[0]!) * 100 : 0;
    const expenseGrowth =
      expenses.length > 1
        ? ((expenses[expenses.length - 1]! - expenses[0]!) / expenses[0]!) * 100
        : 0;

    const avgIncome = incomes.reduce((a, b) => a + b, 0) / incomes.length;
    const avgExpenses = expenses.reduce((a, b) => a + b, 0) / expenses.length;

    const volatility =
      (Math.sqrt(
        incomes.reduce((sum, income) => sum + Math.pow(income - avgIncome, 2), 0) / incomes.length
      ) /
        avgIncome) *
      100;

    // Generate projections
    const projectedCashFlow: Array<{
      month: string;
      projectedIncome: number;
      projectedExpenses: number;
      projectedNetFlow: number;
    }> = [];

    for (let i = 1; i <= projectionMonths; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      const monthStr = futureDate.toISOString().substring(0, 7);

      const projectedIncome = avgIncome * (1 + incomeGrowth / 100 / 12);
      const projectedExpenses = avgExpenses * (1 + expenseGrowth / 100 / 12);

      projectedCashFlow.push({
        month: monthStr,
        projectedIncome,
        projectedExpenses,
        projectedNetFlow: projectedIncome - projectedExpenses,
      });
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (incomeGrowth < 0) {
      recommendations.push(
        'Income is declining. Consider diversifying income sources or negotiating a raise.'
      );
    }

    if (expenseGrowth > incomeGrowth) {
      recommendations.push(
        'Expenses are growing faster than income. Review and optimize your spending.'
      );
    }

    if (volatility > 20) {
      recommendations.push(
        'Income volatility is high. Build a larger emergency fund for stability.'
      );
    }

    const avgNetFlow =
      historicalData.reduce((sum, d) => sum + d.netFlow, 0) / historicalData.length;
    if (avgNetFlow < 0) {
      recommendations.push(
        'Average monthly cash flow is negative. Focus on expense reduction or income increase.'
      );
    }

    return {
      historicalCashFlow: historicalData,
      projectedCashFlow,
      trends: {
        incomeGrowth,
        expenseGrowth,
        volatility,
      },
      recommendations,
    };
  } catch (error) {
    logger.error('Error analyzing cash flow', { userId, error });
    throw error;
  }
}

/**
 * Analyze spending patterns and identify trends, anomalies, and opportunities
 */
async function analyzeSpendingPatterns(
  userId: string,
  analysisPeriod: '3_months' | '6_months' | '1_year' = '6_months'
): Promise<{
  categoryTrends: Array<{
    category: string;
    trend: number;
    avgMonthly: number;
    volatility: number;
  }>;
  anomalies: Array<{ date: string; amount: number; category: string; description: string }>;
  opportunities: Array<{ category: string; potentialSavings: number; recommendation: string }>;
  seasonalPatterns: Array<{
    month: string;
    averageSpending: number;
    categories: Record<string, number>;
  }>;
}> {
  try {
    const monthsToAnalyze =
      analysisPeriod === '3_months' ? 3 : analysisPeriod === '6_months' ? 6 : 12;

    const plaidItemsSnapshot = await db.collection(`users/${userId}/plaidItems`).get();
    const categoryData: Record<
      string,
      Array<{
        month: string;
        amount: number;
        transactions: Array<{ date: string; amount: number; name: string }>;
      }>
    > = {};
    const seasonalData: Record<
      string,
      { totalSpending: number; categories: Record<string, number> }
    > = {};

    // Collect spending data by category and month
    for (let i = monthsToAnalyze - 1; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStr = monthDate.toISOString().substring(0, 7);

      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      seasonalData[monthStr] = { totalSpending: 0, categories: {} };

      for (const itemDoc of plaidItemsSnapshot.docs) {
        const plaidItem = itemDoc.data();
        const accessToken = plaidItem.accessToken;
        if (accessToken) {
          try {
            const transactions = await getTransactions(
              accessToken,
              startOfMonth.toISOString().split('T')[0] as string,
              endOfMonth.toISOString().split('T')[0] as string
            );

            transactions.forEach(txn => {
              if (txn.amount < 0) {
                // Only expenses
                const category = txn.category?.[0] || 'Uncategorized';
                const amount = Math.abs(txn.amount);

                if (!categoryData[category]) {
                  categoryData[category] = [];
                }

                let monthEntry = categoryData[category].find(m => m.month === monthStr);
                if (!monthEntry) {
                  monthEntry = { month: monthStr, amount: 0, transactions: [] };
                  categoryData[category].push(monthEntry);
                }

                monthEntry.amount += amount;
                monthEntry.transactions.push({
                  date: txn.date,
                  amount,
                  name: txn.name,
                });

                seasonalData[monthStr]!.totalSpending += amount;
                seasonalData[monthStr]!.categories[category] =
                  (seasonalData[monthStr]!.categories[category] || 0) + amount;
              }
            });
          } catch (error) {
            logger.error('Error fetching transactions for spending pattern analysis', {
              userId,
              error,
            });
          }
        }
      }
    }

    // Analyze category trends
    const categoryTrends: Array<{
      category: string;
      trend: number;
      avgMonthly: number;
      volatility: number;
    }> = [];

    Object.entries(categoryData).forEach(([category, monthlyData]) => {
      const amounts = monthlyData.map(d => d.amount);
      const avgMonthly = amounts.reduce((a, b) => a + b, 0) / amounts.length;

      // Calculate trend (percentage change from first to last month)
      const trend =
        amounts.length > 1 ? ((amounts[amounts.length - 1]! - amounts[0]!) / amounts[0]!) * 100 : 0;

      // Calculate volatility (coefficient of variation)
      const variance =
        amounts.reduce((sum, amount) => sum + Math.pow(amount - avgMonthly, 2), 0) / amounts.length;
      const volatility = (Math.sqrt(variance) / avgMonthly) * 100;

      categoryTrends.push({
        category,
        trend,
        avgMonthly,
        volatility,
      });
    });

    // Identify anomalies (transactions 2+ standard deviations from category average)
    const anomalies: Array<{
      date: string;
      amount: number;
      category: string;
      description: string;
    }> = [];

    Object.entries(categoryData).forEach(([category, monthlyData]) => {
      const allTransactions = monthlyData.flatMap(m => m.transactions);
      const amounts = allTransactions.map(t => t.amount);
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const stdDev = Math.sqrt(
        amounts.reduce((sum, amount) => sum + Math.pow(amount - avgAmount, 2), 0) / amounts.length
      );

      allTransactions.forEach(txn => {
        if (txn.amount > avgAmount + 2 * stdDev) {
          anomalies.push({
            date: txn.date,
            amount: txn.amount,
            category,
            description: `Unusually high ${category} expense: ${txn.name}`,
          });
        }
      });
    });

    // Identify savings opportunities
    const opportunities: Array<{
      category: string;
      potentialSavings: number;
      recommendation: string;
    }> = [];

    categoryTrends.forEach(trend => {
      if (trend.trend > 10 && trend.avgMonthly > 100) {
        // Growing categories with significant spending
        opportunities.push({
          category: trend.category,
          potentialSavings: trend.avgMonthly * 0.15, // Assume 15% reduction potential
          recommendation: `${trend.category} spending has increased by ${trend.trend.toFixed(1)}%. Consider reviewing and optimizing these expenses.`,
        });
      }

      if (trend.volatility > 50 && trend.avgMonthly > 200) {
        // High volatility categories
        opportunities.push({
          category: trend.category,
          potentialSavings: trend.avgMonthly * 0.1, // Assume 10% reduction through better planning
          recommendation: `${trend.category} spending is highly volatile. Better budgeting could reduce unnecessary expenses.`,
        });
      }
    });

    // Format seasonal patterns
    const seasonalPatterns = Object.entries(seasonalData).map(([month, data]) => ({
      month,
      averageSpending: data.totalSpending,
      categories: data.categories,
    }));

    return {
      categoryTrends: categoryTrends.sort((a, b) => b.avgMonthly - a.avgMonthly),
      anomalies: anomalies.sort((a, b) => b.amount - a.amount).slice(0, 10), // Top 10 anomalies
      opportunities: opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings),
      seasonalPatterns,
    };
  } catch (error) {
    logger.error('Error analyzing spending patterns', { userId, error });
    throw error;
  }
}

/**
 * Calculate emergency fund adequacy using centralized calculator
 */
async function calculateEmergencyFundStatus(
  userId: string,
  targetMonths = 6
): Promise<{
  currentEmergencyFund: number;
  monthlyExpenses: number;
  monthsCovered: number;
  targetAmount: number;
  shortfall: number;
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high';
}> {
  try {
    const { getFinancialOverview } = await import('@/lib/financial-calculator');
    const { metrics } = await getFinancialOverview(userId);

    const currentEmergencyFund = metrics.liquidAssets;
    const monthlyExpenses = metrics.monthlyExpenses;
    const monthsCovered = monthlyExpenses > 0 ? currentEmergencyFund / monthlyExpenses : 0;
    const targetAmount = monthlyExpenses * targetMonths;
    const shortfall = Math.max(0, targetAmount - currentEmergencyFund);

    let recommendation = '';
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (monthsCovered >= targetMonths) {
      recommendation = `Excellent! You have ${monthsCovered.toFixed(1)} months of expenses saved. Your emergency fund is well-funded.`;
      riskLevel = 'low';
    } else if (monthsCovered >= 3) {
      recommendation = `Good progress! You have ${monthsCovered.toFixed(1)} months of expenses saved. Consider building it up to ${targetMonths} months.`;
      riskLevel = 'medium';
    } else {
      recommendation = `Emergency fund needs attention. You only have ${monthsCovered.toFixed(1)} months of expenses saved. This is a financial priority.`;
      riskLevel = 'high';
    }

    return {
      currentEmergencyFund,
      monthlyExpenses,
      monthsCovered,
      targetAmount,
      shortfall,
      recommendation,
      riskLevel,
    };
  } catch (error) {
    logger.error('Error calculating emergency fund status', { userId, error });
    throw error;
  }
}

/**
 * Search uploaded documents
 */
async function searchDocuments(
  userId: string,
  category?: string
): Promise<
  Array<{ fileName: string; category: string; url: string; fileType: string; uploadedAt: string }>
> {
  try {
    const docsRef = db.collection(`users/${userId}/documents`);

    let snapshot;
    if (category) {
      snapshot = await docsRef.where('category', '==', category).get();
    } else {
      snapshot = await docsRef.orderBy('uploadedAt', 'desc').limit(10).get();
    }

    logger.info('Document search results', { userId, category, count: snapshot.docs.length });

    let docs = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        fileName: data.fileName,
        category: data.category,
        url: data.url,
        fileType: data.fileType,
        uploadedAt: data.uploadedAt?.toDate?.()?.toISOString() || '',
      };
    });

    if (category) {
      docs.sort(
        (a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      docs = docs.slice(0, 10);
    }

    logger.info('Returning documents', { userId, documentCount: docs.length, documents: docs });
    return docs;
  } catch (error) {
    logger.error('Error searching documents', { userId, error });
    return [];
  }
}

/**
 * Calculate comprehensive financial health score
 */
async function analyzeFinancialHealthScore(userId: string): Promise<{
  overallScore: number;
  breakdown: {
    emergencyFund: { score: number; weight: number };
    debtToIncome: { score: number; weight: number };
    savingsRate: { score: number; weight: number };
    netWorthGrowth: { score: number; weight: number };
    budgetAdherence: { score: number; weight: number };
  };
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}> {
  try {
    // Get emergency fund score
    const emergencyFundData = await calculateEmergencyFundStatus(userId);
    const emergencyFundScore = Math.min(100, (emergencyFundData.monthsCovered / 6) * 100);

    // Get debt-to-income score
    const dtiData = await analyzeDebtToIncomeRatio(userId);
    const dtiScore = Math.max(0, 100 - dtiData.debtToIncomeRatio * 2); // Lower DTI = higher score

    // Calculate savings rate score
    const cashFlowData = await analyzeCashFlow(userId, 3, 1);
    const recentMonths = cashFlowData.historicalCashFlow.slice(-3);
    const avgSavingsRate =
      recentMonths.reduce((sum, month) => {
        const rate = month.income > 0 ? (month.netFlow / month.income) * 100 : 0;
        return sum + rate;
      }, 0) / recentMonths.length;

    const savingsRateScore = Math.min(100, Math.max(0, avgSavingsRate * 5)); // 20% savings rate = 100 score

    // Calculate net worth growth score (simplified)
    const netWorthData = await getNetWorth(userId);
    const netWorthGrowthScore = netWorthData.netWorth > 0 ? 75 : 25; // Simplified for now

    // Calculate budget adherence score (simplified)
    const spendingData = await analyzeSpendingPatterns(userId, '3_months');
    const avgVolatility =
      spendingData.categoryTrends.reduce((sum, cat) => sum + cat.volatility, 0) /
      spendingData.categoryTrends.length;
    const budgetAdherenceScore = Math.max(0, 100 - avgVolatility); // Lower volatility = better adherence

    // Calculate weighted overall score
    const breakdown = {
      emergencyFund: { score: emergencyFundScore, weight: 0.25 },
      debtToIncome: { score: dtiScore, weight: 0.25 },
      savingsRate: { score: savingsRateScore, weight: 0.25 },
      netWorthGrowth: { score: netWorthGrowthScore, weight: 0.15 },
      budgetAdherence: { score: budgetAdherenceScore, weight: 0.1 },
    };

    const overallScore = Object.values(breakdown).reduce((sum, component) => {
      return sum + component.score * component.weight;
    }, 0);

    // Generate recommendations
    const recommendations: string[] = [];

    if (emergencyFundScore < 50) {
      recommendations.push('Priority: Build your emergency fund to cover 3-6 months of expenses.');
    }

    if (dtiScore < 60) {
      recommendations.push('Focus on reducing debt to improve your debt-to-income ratio.');
    }

    if (savingsRateScore < 40) {
      recommendations.push('Increase your savings rate by reducing expenses or increasing income.');
    }

    if (budgetAdherenceScore < 60) {
      recommendations.push('Work on more consistent budgeting to reduce spending volatility.');
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (overallScore < 40) {
      riskLevel = 'high';
    } else if (overallScore < 70) {
      riskLevel = 'medium';
    }

    return {
      overallScore,
      breakdown,
      recommendations,
      riskLevel,
    };
  } catch (error) {
    logger.error('Error analyzing financial health score', { userId, error });
    throw error;
  }
}

// Add conversation management functions
/**
 *
 */
async function saveConversation(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  conversationId?: string
): Promise<string> {
  try {
    const conversationData: Record<string, unknown> = {
      userId,
      messages,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (!conversationId) {
      conversationData.createdAt = FieldValue.serverTimestamp();
    }

    if (conversationId) {
      await db
        .collection('users')
        .doc(userId)
        .collection('conversations')
        .doc(conversationId)
        .update(conversationData);
      return conversationId;
    } else {
      const docRef = await db
        .collection('users')
        .doc(userId)
        .collection('conversations')
        .add(conversationData);
      return docRef.id;
    }
  } catch (error) {
    logger.error('Error saving conversation', { userId, error });
    throw error;
  }
}

/**
 *
 */
async function getConversation(
  userId: string,
  conversationId: string
): Promise<Array<{ role: string; content: string }> | null> {
  try {
    const doc = await db
      .collection('users')
      .doc(userId)
      .collection('conversations')
      .doc(conversationId)
      .get();
    if (doc.exists) {
      return doc.data()?.messages || [];
    }
    return null;
  } catch (error) {
    logger.error('Error getting conversation', { userId, conversationId, error });
    return null;
  }
}

/**
 *
 */
async function getUserConversations(
  userId: string
): Promise<Array<{ id: string; title: string; updatedAt: Date; messageCount: number }>> {
  try {
    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('conversations')
      .orderBy('updatedAt', 'desc')
      .limit(20)
      .get();

    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      const messages = data.messages || [];
      const firstUserMessage =
        messages.find((m: { role: string; content: string }) => m.role === 'user')?.content ||
        'New conversation';

      const title =
        firstUserMessage.length > 50 ? firstUserMessage.substring(0, 50) + '...' : firstUserMessage;

      return {
        id: doc.id,
        title,
        updatedAt: data.updatedAt?.toDate() || new Date(),
        messageCount: messages.length,
      };
    });
  } catch (error) {
    logger.error('Error getting user conversations', { userId, error });
    return [];
  }
}

/**
 *
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      logger.error('Missing or invalid Authorization header', {
        hasHeader: !!authHeader,
        headerValue: authHeader ? authHeader.substring(0, 20) + '...' : 'none',
      });
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      logger.error('Missing or invalid Authorization token');
      return NextResponse.json({ error: 'Unauthorized - Missing token' }, { status: 401 });
    }
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (authError) {
      logger.error('Firebase token verification failed', {
        error: authError instanceof Error ? authError.message : String(authError),
      });
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid as string;
    if (!userId) {
      logger.error('User ID is missing from decoded token');
      return NextResponse.json({ error: 'Unauthorized - Invalid user ID' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const parsedBody = chatRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      logger.error('Request validation failed', {
        userId,
        errors: parsedBody.error.formErrors,
        body: body,
      });
      return NextResponse.json(
        { error: 'Invalid request body', details: parsedBody.error.formErrors },
        { status: 400 }
      );
    }

    const { message, history = [], conversationId } = parsedBody.data;

    // Retrieve relevant context from AI memory
    let contextStr = '';
    try {
      const relevantContext = await retrieveRelevantContext(userId, message, 5);
      if (relevantContext.length > 0) {
        contextStr =
          '\n\nRelevant financial history:\n' + relevantContext.map(ctx => ctx.content).join('\n');
      }
    } catch (error) {
      logger.warn('Failed to retrieve AI memory context', { userId, error });
    }

    // Prepare conversation history
    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert financial advisor and AI assistant for FinSight AI with deep expertise in personal finance, investment strategy, and financial planning.

Your capabilities include:
- Comprehensive financial analysis using real-time data
- Advanced calculations for debt-to-income ratios, cash flow projections, and financial health scoring
- Spending pattern analysis with anomaly detection and trend identification
- Emergency fund optimization and risk assessment
- Personalized investment and savings strategies
- Reading and analyzing uploaded financial documents (PDFs, images) directly via URLs
- Long-term memory of user's financial history and past conversations${contextStr}

Guidelines for responses:
1. Always use the available tools to access real financial data when answering questions
2. When users ask about documents:
   - First call search_documents to get document URLs
   - Then analyze the document by reading the URL directly (you have vision capabilities)
   - Provide detailed analysis of what you see in the document
3. Provide specific, actionable advice with dollar amounts and timeframes
4. Explain complex financial concepts in simple terms
5. Format all monetary values as currency (e.g., $1,234.56)
6. When making recommendations, explain the reasoning and potential impact
7. If you don't have access to specific data, explain what information would help provide better advice
8. Prioritize high-impact, low-effort improvements first
9. Consider the user's complete financial picture when giving advice

IMPORTANT: You CAN read PDFs and images directly from URLs. When you get document URLs from search_documents, analyze them immediately in your next response.`,
      },
      ...history,
      { role: 'user' as const, content: message },
    ];

    // Call OpenAI with tool calling
    let completion;
    try {
      if (!openai) {
        throw new Error('OpenAI client not initialized');
      }
      completion = await openai.chat.completions.create({
        model: 'gpt-5.1',
        messages,
        tools,
        tool_choice: 'auto',
      });
    } catch (openaiError) {
      logger.error('OpenAI API error', {
        userId,
        error: openaiError instanceof Error ? openaiError.message : String(openaiError),
        status:
          typeof openaiError === 'object' && openaiError !== null && 'status' in openaiError
            ? (openaiError as { status?: number }).status
            : undefined,
        type:
          typeof openaiError === 'object' && openaiError !== null && 'type' in openaiError
            ? (openaiError as { type?: string }).type
            : undefined,
      });

      if (
        typeof openaiError === 'object' &&
        openaiError !== null &&
        'status' in openaiError &&
        (openaiError as { status?: number }).status === 401
      ) {
        return NextResponse.json(
          { error: 'OpenAI API key is invalid or expired' },
          { status: 500 }
        );
      } else if (
        typeof openaiError === 'object' &&
        openaiError !== null &&
        'status' in openaiError &&
        (openaiError as { status?: number }).status === 429
      ) {
        return NextResponse.json(
          { error: 'OpenAI API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      } else {
        return NextResponse.json(
          { error: 'Failed to connect to AI service. Please try again.' },
          { status: 500 }
        );
      }
    }

    const responseMessage = completion.choices[0]?.message;
    if (!responseMessage) {
      throw new Error('No response from OpenAI');
    }

    let finalResponse = responseMessage.content || "Sorry, I couldn't process your request.";

    // Handle tool calls if any
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolResults = [];

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments || '{}');

        try {
          let result;
          switch (functionName) {
            case 'get_net_worth':
              result = await getNetWorth(userId!);
              break;
            case 'get_account_balances':
              result = await getAccountBalancesData(userId!);
              break;
            case 'get_spending_by_category':
              result = await getSpendingByCategory(
                userId!,
                functionArgs.period,
                functionArgs.category
              );
              break;
            case 'get_recent_transactions':
              result = await getRecentTransactions(
                userId!,
                functionArgs.limit,
                functionArgs.category,
                functionArgs.amount_min,
                functionArgs.amount_max,
                functionArgs.merchant
              );
              break;
            case 'search_transactions_by_merchant':
              result = await searchTransactionsByMerchant(
                userId!,
                functionArgs.merchant,
                functionArgs.period,
                functionArgs.limit
              );
              break;
            case 'get_monthly_summary':
              result = await getMonthlySummary(userId!, functionArgs.month);
              break;
            case 'analyze_debt_to_income_ratio':
              result = await analyzeDebtToIncomeRatio(userId!, functionArgs.annual_income);
              break;
            case 'analyze_cash_flow':
              result = await analyzeCashFlow(
                userId,
                functionArgs.months,
                functionArgs.projection_months
              );
              break;
            case 'analyze_spending_patterns':
              result = await analyzeSpendingPatterns(userId!, functionArgs.analysis_period);
              break;
            case 'calculate_emergency_fund_status':
              result = await calculateEmergencyFundStatus(userId!, functionArgs.target_months);
              break;
            case 'analyze_financial_health_score':
              result = await analyzeFinancialHealthScore(userId!);
              break;
            case 'search_documents':
              logger.info('AI calling search_documents', {
                userId,
                category: functionArgs.category,
              });
              const docs = await searchDocuments(userId!, functionArgs.category);
              logger.info('search_documents result', {
                userId,
                resultCount: Array.isArray(docs) ? docs.length : 0,
              });

              if (docs.length > 0) {
                result = {
                  documents: docs,
                  next_step: 'vision_read',
                  url: docs[0]?.url || '',
                };
              } else {
                result = { documents: [] };
              }
              break;
            default:
              result = { error: `Unknown function: ${functionName}` };
          }

          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool' as const,
            content: JSON.stringify(result),
          });
        } catch (error) {
          logger.error('Error executing tool call', { userId, functionName, error });
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool' as const,
            content: JSON.stringify({ error: 'Failed to execute function' }),
          });
        }
      }

      // Get final response with tool results
      try {
        const visionMessages = [...messages, responseMessage, ...toolResults];

        // Check if we need to add vision input for document reading
        const docTool = toolResults.find(t => {
          try {
            const parsed = JSON.parse(t.content);
            return parsed.next_step === 'vision_read';
          } catch {
            return false;
          }
        });

        if (docTool) {
          const { url, documents } = JSON.parse(docTool.content);
          const fileType = documents[0]?.fileType || '';

          // For images, use image_url. For PDFs, include URL in text
          if (fileType.startsWith('image/')) {
            visionMessages.push({
              role: 'user' as const,
              content: [
                { type: 'text', text: 'Analyze this document:' },
                { type: 'image_url', image_url: { url } },
              ] as any,
            });
          } else {
            // For PDFs, GPT-5.1 can read from URL in text
            visionMessages.push({
              role: 'user' as const,
              content: `Please read and analyze this PDF document: ${url}`,
            });
          }
        }

        const finalCompletion = await openai.chat.completions.create({
          model: 'gpt-5.1',
          messages: visionMessages,
          tools,
          tool_choice: 'auto',
        });

        finalResponse =
          finalCompletion.choices[0]?.message?.content ||
          'Sorry, I encountered an error processing your request.';
      } catch (finalError) {
        logger.error('Error getting final response from OpenAI', { userId, error: finalError });
        finalResponse = 'Sorry, I encountered an error processing your request.';
      }
    }

    // Save conversation to database
    const conversationMessages = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: finalResponse },
    ];

    const savedConversationId = await saveConversation(
      userId,
      conversationMessages,
      conversationId
    );

    // Store conversation in AI memory
    try {
      await storeConversationContext(userId, message, finalResponse);
    } catch (error) {
      logger.warn('Failed to store conversation in AI memory', { userId, error });
    }

    return NextResponse.json({
      response: finalResponse,
      conversationId: savedConversationId,
    });
  } catch (error) {
    logger.error('Error in chat API', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add GET endpoint to retrieve conversations
/**
 *
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized - Missing token' }, { status: 401 });
    }
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');

    if (conversationId) {
      // Get specific conversation
      const messages = await getConversation(userId!, conversationId);
      if (messages) {
        return NextResponse.json({ messages, conversationId });
      } else {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
    } else {
      // Get all conversations
      const conversations = await getUserConversations(userId!);
      return NextResponse.json({ conversations });
    }
  } catch (error) {
    logger.error('Error in chat GET API', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
