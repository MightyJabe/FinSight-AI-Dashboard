/**
 * Expense Optimizer Service
 *
 * Analyzes spending patterns, identifies optimization opportunities,
 * and provides actionable recommendations to reduce expenses.
 */

import logger from '@/lib/logger';
import { generateChatCompletion } from '@/lib/openai';

export interface SpendingCategory {
  category: string;
  amount: number;
  transactionCount: number;
  percentOfTotal: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  averageTransaction: number;
}

export interface SpendingBenchmark {
  category: string;
  userSpending: number;
  benchmarkSpending: number;
  percentageDiff: number;
  status: 'above' | 'below' | 'at';
}

export interface OptimizationOpportunity {
  id: string;
  type: 'subscription' | 'recurring' | 'impulse' | 'alternative' | 'timing';
  category: string;
  title: string;
  description: string;
  potentialSavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
}

export interface ExpenseAnalysis {
  totalSpending: number;
  categoryBreakdown: SpendingCategory[];
  benchmarks: SpendingBenchmark[];
  opportunities: OptimizationOpportunity[];
  savingsGoal: number;
  projectedSavings: number;
}

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
}

// Israeli average spending benchmarks (percentage of income)
const SPENDING_BENCHMARKS: Record<string, number> = {
  'Housing': 30,
  'Transportation': 12,
  'Food & Dining': 15,
  'Utilities': 5,
  'Healthcare': 4,
  'Entertainment': 5,
  'Shopping': 8,
  'Education': 3,
  'Insurance': 4,
  'Personal Care': 2,
  'Subscriptions': 3,
  'Other': 9,
};

// Known subscription services with alternatives
export const SUBSCRIPTION_ALTERNATIVES: Record<string, { alternatives: string[]; potentialSavings: string }> = {
  'netflix': {
    alternatives: ['Sharing a family plan', 'Switching to ad-supported tier', 'Annual billing'],
    potentialSavings: '30-50%',
  },
  'spotify': {
    alternatives: ['YouTube Music (included with YouTube Premium)', 'Family plan sharing', 'Student discount'],
    potentialSavings: '20-50%',
  },
  'amazon prime': {
    alternatives: ['Share with household', 'Student discount', 'Cancel if not using shipping'],
    potentialSavings: '50%',
  },
  'gym': {
    alternatives: ['Outdoor exercise', 'Home workout apps', 'Community centers'],
    potentialSavings: '100%',
  },
  'cloud storage': {
    alternatives: ['Free tiers (15GB)', 'Local backup drives', 'Bundled services'],
    potentialSavings: '100%',
  },
};

/**
 * Analyze spending by category
 */
export function analyzeSpendingByCategory(
  transactions: Transaction[],
  _monthlyIncome: number
): SpendingCategory[] {
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalSpending = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const categoryMap = new Map<string, Transaction[]>();
  expenses.forEach(t => {
    const category = t.category || 'Other';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(t);
  });

  // Calculate metrics for each category
  const categories: SpendingCategory[] = [];
  categoryMap.forEach((txns, category) => {
    const amount = txns.reduce((sum, t) => sum + t.amount, 0);
    const averageTransaction = amount / txns.length;

    // Determine trend by comparing first half to second half
    const sorted = [...txns].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint).reduce((sum, t) => sum + t.amount, 0);
    const secondHalf = sorted.slice(midpoint).reduce((sum, t) => sum + t.amount, 0);

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (secondHalf > firstHalf * 1.15) trend = 'increasing';
    else if (secondHalf < firstHalf * 0.85) trend = 'decreasing';

    categories.push({
      category,
      amount,
      transactionCount: txns.length,
      percentOfTotal: (amount / totalSpending) * 100,
      trend,
      averageTransaction,
    });
  });

  // Sort by amount descending
  return categories.sort((a, b) => b.amount - a.amount);
}

/**
 * Compare user spending to benchmarks
 */
export function compareToIsraeliBenchmarks(
  categorySpending: SpendingCategory[],
  monthlyIncome: number
): SpendingBenchmark[] {
  return categorySpending.map(cat => {
    const benchmarkPercent = SPENDING_BENCHMARKS[cat.category] || SPENDING_BENCHMARKS['Other']!;
    const benchmarkAmount = (monthlyIncome * benchmarkPercent) / 100;
    const userPercent = (cat.amount / monthlyIncome) * 100;
    const percentageDiff = userPercent - benchmarkPercent;

    let status: 'above' | 'below' | 'at' = 'at';
    if (percentageDiff > 2) status = 'above';
    else if (percentageDiff < -2) status = 'below';

    return {
      category: cat.category,
      userSpending: cat.amount,
      benchmarkSpending: benchmarkAmount,
      percentageDiff,
      status,
    };
  });
}

/**
 * Identify optimization opportunities
 */
export function findOptimizationOpportunities(
  transactions: Transaction[],
  _categorySpending: SpendingCategory[],
  benchmarks: SpendingBenchmark[]
): OptimizationOpportunity[] {
  const opportunities: OptimizationOpportunity[] = [];

  // 1. High spending categories above benchmark
  benchmarks
    .filter(b => b.status === 'above' && b.percentageDiff > 5)
    .forEach(b => {
      const potentialSavings = b.userSpending - b.benchmarkSpending;
      opportunities.push({
        id: `high-${b.category.toLowerCase().replace(/\s/g, '-')}`,
        type: 'recurring',
        category: b.category,
        title: `Reduce ${b.category} spending`,
        description: `Your ${b.category} spending is ${b.percentageDiff.toFixed(1)}% above the Israeli average. Consider reviewing these expenses.`,
        potentialSavings,
        difficulty: 'medium',
        priority: potentialSavings > 500 ? 'high' : 'medium',
        actionItems: [
          `Review all ${b.category} transactions`,
          'Identify unnecessary purchases',
          'Look for cheaper alternatives',
          'Set a monthly budget for this category',
        ],
      });
    });

  // 2. Detect subscription opportunities
  const subscriptionLike = transactions.filter(t => {
    const desc = t.description.toLowerCase();
    return (
      desc.includes('netflix') ||
      desc.includes('spotify') ||
      desc.includes('amazon') ||
      desc.includes('gym') ||
      desc.includes('cloud') ||
      desc.includes('subscription') ||
      desc.includes('membership')
    );
  });

  if (subscriptionLike.length > 0) {
    const subTotal = subscriptionLike.reduce((sum, t) => sum + t.amount, 0);
    opportunities.push({
      id: 'subscription-audit',
      type: 'subscription',
      category: 'Subscriptions',
      title: 'Review your subscriptions',
      description: `You have ${subscriptionLike.length} subscription-like charges totaling ₪${subTotal.toFixed(0)}/month. Consider which ones you actually use.`,
      potentialSavings: subTotal * 0.3, // Assume 30% can be saved
      difficulty: 'easy',
      priority: 'high',
      actionItems: [
        'List all active subscriptions',
        'Check last usage date for each service',
        'Cancel unused subscriptions',
        'Look for family/shared plans',
        'Consider annual billing for savings',
      ],
    });
  }

  // 3. Detect impulse spending patterns
  const expenses = transactions.filter(t => t.type === 'expense');
  const weekendExpenses = expenses.filter(t => {
    const day = new Date(t.date).getDay();
    return day === 0 || day === 5 || day === 6; // Friday, Saturday, Sunday
  });

  const weekendTotal = weekendExpenses.reduce((sum, t) => sum + t.amount, 0);
  const weekdayTotal = expenses.reduce((sum, t) => sum + t.amount, 0) - weekendTotal;
  const weekendDays = 3 / 7;
  const expectedWeekendShare = weekdayTotal * (weekendDays / (1 - weekendDays));

  if (weekendTotal > expectedWeekendShare * 1.3) {
    opportunities.push({
      id: 'weekend-spending',
      type: 'impulse',
      category: 'Lifestyle',
      title: 'Weekend spending is high',
      description: 'Your weekend spending is 30% higher than expected. Weekend purchases often include more impulse buys.',
      potentialSavings: (weekendTotal - expectedWeekendShare) * 0.5,
      difficulty: 'medium',
      priority: 'medium',
      actionItems: [
        'Plan weekend activities in advance',
        'Set a weekend spending budget',
        'Use cash instead of cards on weekends',
        'Wait 24 hours before large purchases',
      ],
    });
  }

  // 4. Small frequent purchases
  const smallExpenses = expenses.filter(t => t.amount < 50 && t.amount > 0);
  const smallTotal = smallExpenses.reduce((sum, t) => sum + t.amount, 0);

  if (smallExpenses.length > 30 && smallTotal > 500) {
    opportunities.push({
      id: 'small-purchases',
      type: 'impulse',
      category: 'Daily Expenses',
      title: 'Small purchases add up',
      description: `You made ${smallExpenses.length} purchases under ₪50, totaling ₪${smallTotal.toFixed(0)}. These small amounts can significantly impact your budget.`,
      potentialSavings: smallTotal * 0.2,
      difficulty: 'easy',
      priority: 'medium',
      actionItems: [
        'Track small daily expenses',
        'Bring lunch from home',
        'Use a reusable water bottle',
        'Set a daily spending limit',
      ],
    });
  }

  // Sort by potential savings
  return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
}

/**
 * Generate AI-powered personalized recommendations
 */
export async function generatePersonalizedRecommendations(
  analysis: Omit<ExpenseAnalysis, 'projectedSavings'>
): Promise<string> {
  const topCategories = analysis.categoryBreakdown.slice(0, 5);
  const topOpportunities = analysis.opportunities.slice(0, 3);

  const prompt = `As a financial advisor for an Israeli user, provide 3 specific, actionable recommendations based on this spending analysis:

Total Monthly Spending: ₪${analysis.totalSpending.toFixed(0)}

Top Spending Categories:
${topCategories.map(c => `- ${c.category}: ₪${c.amount.toFixed(0)} (${c.percentOfTotal.toFixed(1)}%, trend: ${c.trend})`).join('\n')}

Main Optimization Opportunities:
${topOpportunities.map(o => `- ${o.title}: Potential savings ₪${o.potentialSavings.toFixed(0)}`).join('\n')}

Savings Goal: ₪${analysis.savingsGoal.toFixed(0)}/month

Provide practical, Israeli-context recommendations. Be specific about amounts and actions. Keep each recommendation under 50 words.`;

  try {
    const response = await generateChatCompletion([
      {
        role: 'system',
        content:
          'You are a friendly Israeli financial advisor. Provide practical money-saving tips relevant to Israeli living costs and lifestyle.',
      },
      { role: 'user', content: prompt },
    ]);

    return response.content;
  } catch (error) {
    logger.error('Error generating personalized recommendations', { error });
    return 'Unable to generate personalized recommendations at this time.';
  }
}

/**
 * Full expense analysis
 */
export async function analyzeExpenses(
  transactions: Transaction[],
  monthlyIncome: number,
  savingsGoalPercent: number = 20
): Promise<ExpenseAnalysis> {
  const totalSpending = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const categoryBreakdown = analyzeSpendingByCategory(transactions, monthlyIncome);
  const benchmarks = compareToIsraeliBenchmarks(categoryBreakdown, monthlyIncome);
  const opportunities = findOptimizationOpportunities(transactions, categoryBreakdown, benchmarks);

  const savingsGoal = (monthlyIncome * savingsGoalPercent) / 100;
  const projectedSavings = opportunities.reduce((sum, o) => sum + o.potentialSavings, 0);

  return {
    totalSpending,
    categoryBreakdown,
    benchmarks,
    opportunities,
    savingsGoal,
    projectedSavings,
  };
}
