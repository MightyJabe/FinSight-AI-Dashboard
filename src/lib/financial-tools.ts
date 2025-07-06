// Date utilities are available if needed in the future

import { db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { getAccountBalances, getTransactions } from '@/lib/plaid';

// Tool definitions for OpenAI function calling
export const financialTools = [
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
        },
        required: [],
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
];

// Function implementations
export async function getNetWorth(
  userId: string
): Promise<{ netWorth: number; assets: number; liabilities: number }> {
  try {
    // Get manual assets
    const assetsSnapshot = await db.collection(`users/${userId}/manualAssets`).get();
    const manualAssets = assetsSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );

    // Get manual liabilities
    const liabilitiesSnapshot = await db.collection(`users/${userId}/manualLiabilities`).get();
    const manualLiabilities = liabilitiesSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );

    // Get Plaid accounts
    const plaidItemsSnapshot = await db.collection(`users/${userId}/plaidItems`).get();
    let plaidAssets = 0;

    for (const itemDoc of plaidItemsSnapshot.docs) {
      const plaidItem = itemDoc.data();
      const accessToken = plaidItem.accessToken;
      if (accessToken) {
        try {
          const balances = await getAccountBalances(accessToken);
          plaidAssets += balances.reduce(
            (sum, account) => sum + (account.balances.current || 0),
            0
          );
        } catch (error) {
          logger.error('Error fetching Plaid balances for net worth', { userId, error });
        }
      }
    }

    const totalAssets = manualAssets + plaidAssets;
    const netWorth = totalAssets - manualLiabilities;

    return { netWorth, assets: totalAssets, liabilities: manualLiabilities };
  } catch (error) {
    logger.error('Error calculating net worth', { userId, error });
    throw error;
  }
}

export async function getAccountBalancesData(
  userId: string
): Promise<Array<{ name: string; balance: number; type: string }>> {
  try {
    const accounts: Array<{ name: string; balance: number; type: string }> = [];

    // Get manual accounts
    const assetsSnapshot = await db.collection(`users/${userId}/manualAssets`).get();
    assetsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      accounts.push({
        name: data.name,
        balance: data.amount || 0,
        type: data.type || 'Manual',
      });
    });

    // Get Plaid accounts
    const accessTokenDoc = await db
      .collection('users')
      .doc(userId)
      .collection('plaid')
      .doc('access_token')
      .get();
    
    if (accessTokenDoc.exists) {
      const accessToken = accessTokenDoc.data()?.accessToken;
      if (accessToken) {
        try {
          const balances = await getAccountBalances(accessToken);
          balances.forEach(account => {
            accounts.push({
              name: account.name || 'Plaid Account',
              balance: account.balances.current || 0,
              type: account.type || 'Bank',
            });
          });
        } catch (error) {
          logger.error('Error fetching Plaid balances', { userId, error });
        }
      }
    }

    return accounts;
  } catch (error) {
    logger.error('Error getting account balances', { userId, error });
    throw error;
  }
}

export async function getSpendingByCategory(
  userId: string,
  period: string,
  category?: string
): Promise<Array<{ category: string; amount: number }>> {
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

    // Get transactions from Plaid
    const accessTokenDoc = await db
      .collection('users')
      .doc(userId)
      .collection('plaid')
      .doc('access_token')
      .get();
    
    const allTransactions: Array<{ category: string; amount: number }> = [];

    if (accessTokenDoc.exists) {
      const accessToken = accessTokenDoc.data()?.accessToken;
      if (accessToken) {
        try {
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

export async function getRecentTransactions(
  userId: string,
  limit = 10,
  category?: string,
  amountMin?: number,
  amountMax?: number
): Promise<Array<{ name: string; amount: number; date: string; category: string }>> {
  try {
    const accessTokenDoc = await db
      .collection('users')
      .doc(userId)
      .collection('plaid')
      .doc('access_token')
      .get();
    
    const allTransactions: Array<{ name: string; amount: number; date: string; category: string }> = [];

    if (accessTokenDoc.exists) {
      const accessToken = accessTokenDoc.data()?.accessToken;
      if (accessToken) {
        try {
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
            if (amountMin && Math.abs(txn.amount) < amountMin) {
              return;
            }
            if (amountMax && Math.abs(txn.amount) > amountMax) {
              return;
            }

            allTransactions.push({
              name: txn.name,
              amount: txn.amount,
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

export async function getMonthlySummary(
  userId: string,
  month?: string
): Promise<{ income: number; expenses: number; savings: number }> {
  try {
    // Calculate date range for the specified month or current month
    const targetDate = month ? new Date(month + '-01') : new Date();
    const startOfMonthDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonthDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    const accessTokenDoc = await db
      .collection('users')
      .doc(userId)
      .collection('plaid')
      .doc('access_token')
      .get();
    
    let income = 0;
    let expenses = 0;

    if (accessTokenDoc.exists) {
      const accessToken = accessTokenDoc.data()?.accessToken;
      if (accessToken) {
        try {
          const transactions = await getTransactions(
            accessToken,
            startOfMonthDate.toISOString().split('T')[0] as string,
            endOfMonthDate.toISOString().split('T')[0] as string
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

// Simplified versions of complex analysis functions
export async function analyzeDebtToIncomeRatio(
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
      const summary = await getMonthlySummary(userId);
      monthlyIncome = summary.income;
    }

    // Calculate monthly debt payments from liabilities
    const liabilitiesSnapshot = await db.collection(`users/${userId}/manualLiabilities`).get();
    let monthlyDebtPayments = 0;

    liabilitiesSnapshot.docs.forEach(doc => {
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
      recommendation = 'Good debt-to-income ratio, but consider paying down debt to improve financial health.';
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

// Add more simplified tool functions...
export async function analyzeCashFlow(userId: string, _months = 6, _projectionMonths = 3) {
  // Simplified cash flow analysis
  const summary = await getMonthlySummary(userId);
  return {
    currentCashFlow: summary.savings,
    trend: summary.savings > 0 ? 'positive' : 'negative',
    recommendation: summary.savings > 0 ? 'Your cash flow is positive!' : 'Consider reducing expenses or increasing income.',
  };
}

export async function analyzeSpendingPatterns(userId: string, _analysisPeriod = '3_months') {
  // Simplified spending pattern analysis
  const spending = await getSpendingByCategory(userId, 'month');
  return {
    topCategories: spending.slice(0, 5),
    totalSpending: spending.reduce((sum, cat) => sum + cat.amount, 0),
    recommendation: 'Review your top spending categories for optimization opportunities.',
  };
}

export async function calculateEmergencyFundStatus(userId: string, targetMonths = 6) {
  // Simplified emergency fund calculation
  const accounts = await getAccountBalancesData(userId);
  const summary = await getMonthlySummary(userId);
  
  const liquidAssets = accounts
    .filter(acc => acc.type.toLowerCase().includes('savings') || acc.type.toLowerCase().includes('checking'))
    .reduce((sum, acc) => sum + acc.balance, 0);
  
  const monthsCovered = summary.expenses > 0 ? liquidAssets / summary.expenses : 0;
  
  return {
    currentEmergencyFund: liquidAssets,
    monthlyExpenses: summary.expenses,
    monthsCovered,
    targetAmount: summary.expenses * targetMonths,
    recommendation: monthsCovered >= targetMonths 
      ? 'Great! Your emergency fund is adequate.' 
      : `Build your emergency fund to ${targetMonths} months of expenses.`,
  };
}

export async function analyzeFinancialHealthScore(userId: string) {
  // Simplified financial health score
  try {
    const [netWorth, emergencyFund, debtRatio] = await Promise.all([
      getNetWorth(userId),
      calculateEmergencyFundStatus(userId),
      analyzeDebtToIncomeRatio(userId),
    ]);

    let score = 0;
    const factors = [];

    // Net worth factor
    if (netWorth.netWorth > 0) {
      score += 25;
      factors.push('Positive net worth');
    }

    // Emergency fund factor
    if (emergencyFund.monthsCovered >= 6) {
      score += 25;
      factors.push('Adequate emergency fund');
    } else if (emergencyFund.monthsCovered >= 3) {
      score += 15;
      factors.push('Partial emergency fund');
    }

    // Debt ratio factor
    if (debtRatio.debtToIncomeRatio <= 20) {
      score += 25;
      factors.push('Low debt-to-income ratio');
    } else if (debtRatio.debtToIncomeRatio <= 36) {
      score += 15;
      factors.push('Moderate debt-to-income ratio');
    }

    // Cash flow factor
    const summary = await getMonthlySummary(userId);
    if (summary.savings > 0) {
      score += 25;
      factors.push('Positive cash flow');
    }

    return {
      overallScore: score,
      factors,
      recommendation: score >= 75 
        ? 'Excellent financial health!' 
        : score >= 50 
        ? 'Good financial health with room for improvement.' 
        : 'Focus on building emergency fund and reducing debt.',
    };
  } catch (error) {
    logger.error('Error analyzing financial health score', { userId, error });
    throw error;
  }
}

/**
 * Execute financial tool by name
 */
export async function executeFinancialTool(
  toolName: string,
  userId: string,
  args: any = {}
): Promise<any> {
  try {
    switch (toolName) {
      case 'get_net_worth':
        return await getNetWorth(userId);
      case 'get_account_balances':
        return await getAccountBalancesData(userId);
      case 'get_spending_by_category':
        return await getSpendingByCategory(userId, args.period, args.category);
      case 'get_recent_transactions':
        return await getRecentTransactions(userId, args.limit, args.category, args.amount_min, args.amount_max);
      case 'get_monthly_summary':
        return await getMonthlySummary(userId, args.month);
      case 'analyze_debt_to_income_ratio':
        return await analyzeDebtToIncomeRatio(userId, args.annual_income);
      case 'analyze_cash_flow':
        return await analyzeCashFlow(userId, args.months, args.projection_months);
      case 'analyze_spending_patterns':
        return await analyzeSpendingPatterns(userId, args.analysis_period);
      case 'calculate_emergency_fund_status':
        return await calculateEmergencyFundStatus(userId, args.target_months);
      case 'analyze_financial_health_score':
        return await analyzeFinancialHealthScore(userId);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    logger.error('Error executing financial tool', { toolName, userId, error });
    throw error;
  }
}