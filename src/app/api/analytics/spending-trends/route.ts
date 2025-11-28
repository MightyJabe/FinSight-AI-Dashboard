import {
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  formatISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { logFinancialAccess } from '@/lib/audit-logger';
import { decryptPlaidToken, isEncryptedData } from '@/lib/encryption';
import { db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { getTransactions } from '@/lib/plaid';
import { Permission, validateUserAccess } from '@/middleware/rbac';

export const dynamic = 'force-dynamic';

// Input validation schema
const trendAnalysisSchema = z.object({
  timeframe: z.enum(['3months', '6months', '1year', '2years']).default('6months'),
  analysisType: z
    .enum(['category', 'monthly', 'weekly', 'daily', 'seasonal', 'anomaly'])
    .default('category'),
  categories: z.array(z.string()).optional(),
  includeProjections: z.boolean().default(false),
});

interface Transaction {
  transaction_id: string;
  date: string;
  name: string;
  amount: number;
  category: string[];
  account_id: string;
  pending: boolean;
  aiConfidence?: number;
  aiReasoning?: string;
}

interface TrendData {
  period: string;
  amount: number;
  transactionCount: number;
  category?: string;
  percentChange?: number;
  anomaly?: boolean;
}

interface SpendingTrends {
  timeframe: string;
  analysisType: string;
  totalSpent: number;
  averagePerPeriod: number;
  trends: TrendData[];
  insights: string[];
  projections?:
    | {
        nextPeriod: number;
        confidence: number;
        factors: string[];
      }
    | undefined;
}

/**
 * Analyze spending trends for pattern recognition
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Validate user access
    const validation = await validateUserAccess(request as any, Permission.READ_FINANCIAL_DATA);
    if (!validation.success) {
      return validation.response;
    }
    const { userId } = validation;

    // Parse and validate request body
    const body = await request.json();
    const parsed = trendAnalysisSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    const { timeframe, analysisType, categories, includeProjections } = parsed.data;

    // Calculate date range
    const endDate = new Date();
    const monthsBack = {
      '3months': 3,
      '6months': 6,
      '1year': 12,
      '2years': 24,
    }[timeframe];
    const startDate = subMonths(endDate, monthsBack);

    // Fetch categorized transactions (with AI categories)
    const transactions = await fetchCategorizedTransactions(userId, startDate, endDate);

    // Filter by categories if specified
    const filteredTransactions = categories?.length
      ? transactions.filter(t => categories.some(cat => t.category.includes(cat)))
      : transactions;

    // Analyze trends based on type
    const trends = await analyzeTrends(filteredTransactions, analysisType, startDate, endDate);

    // Generate insights
    const insights = generateInsights(trends, analysisType, filteredTransactions);

    // Calculate projections if requested
    let projections: { nextPeriod: number; confidence: number; factors: string[] } | undefined;
    if (includeProjections) {
      projections = calculateProjections(trends, analysisType);
    }

    const result: SpendingTrends = {
      timeframe,
      analysisType,
      totalSpent: filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
      averagePerPeriod:
        trends.length > 0 ? trends.reduce((sum, t) => sum + t.amount, 0) / trends.length : 0,
      trends,
      insights,
      projections,
    };

    // Log analytics access
    await logFinancialAccess(userId, 'read', 'spending_trends', {
      ipAddress,
      userAgent,
      endpoint: '/api/analytics/spending-trends',
      method: 'POST',
      success: true,
      details: {
        timeframe,
        analysisType,
        transactionCount: filteredTransactions.length,
        processingTime: Date.now() - startTime,
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error in spending trends analysis:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to analyze spending trends' },
      { status: 500 }
    );
  }
}

/**
 * Fetch user transactions for the specified period
 */
async function fetchUserTransactions(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Transaction[]> {
  const allTransactions: Transaction[] = [];

  // Get user's Plaid items
  const plaidItemsSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('plaidItems')
    .get();

  for (const plaidItemDoc of plaidItemsSnapshot.docs) {
    const plaidItemData = plaidItemDoc.data();
    const storedAccessToken = plaidItemData.accessToken;

    if (!storedAccessToken) continue;

    try {
      // Decrypt access token
      let accessToken: string;
      if (isEncryptedData(storedAccessToken)) {
        accessToken = decryptPlaidToken(storedAccessToken);
      } else {
        accessToken = storedAccessToken as string;
      }

      // Fetch transactions from Plaid
      const plaidTransactions = await getTransactions(
        accessToken,
        formatISO(startDate, { representation: 'date' }),
        formatISO(endDate, { representation: 'date' })
      );

      // Transform transactions
      const transformedTransactions: Transaction[] = plaidTransactions.map(txn => ({
        transaction_id: txn.transaction_id,
        date: txn.date,
        name: txn.name,
        amount: txn.amount,
        category: txn.category || ['Other'],
        account_id: txn.account_id,
        pending: txn.pending || false,
      }));

      allTransactions.push(...transformedTransactions);
    } catch (error) {
      logger.warn('Failed to fetch transactions for Plaid item', {
        itemId: plaidItemDoc.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return allTransactions.filter(t => !t.pending && t.amount > 0); // Only completed expenses
}

/**
 * Fetch categorized transactions with AI categories from Firebase
 */
async function fetchCategorizedTransactions(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Transaction[]> {
  const allTransactions: Transaction[] = [];

  // First, get the raw transactions
  const rawTransactions = await fetchUserTransactions(userId, startDate, endDate);

  // Get categorized data from Firebase
  const categorizedSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('categorizedTransactions')
    .get();

  // Build a map of transaction ID to categorized data
  const categorizedMap: Record<
    string,
    {
      aiCategory: string;
      aiConfidence: number;
      aiReasoning?: string;
      type: 'income' | 'expense';
    }
  > = {};

  categorizedSnapshot.docs.forEach((doc: any) => {
    const data = doc.data();
    categorizedMap[data.originalTransactionId || doc.id] = {
      aiCategory: data.aiCategory,
      aiConfidence: data.aiConfidence,
      aiReasoning: data.aiReasoning,
      type: data.type,
    };
  });

  // Merge raw transactions with categorized data
  for (const transaction of rawTransactions) {
    const categorizedData = categorizedMap[transaction.transaction_id];

    if (categorizedData && categorizedData.type === 'expense') {
      // Use AI category instead of Plaid category
      allTransactions.push({
        ...transaction,
        category: [categorizedData.aiCategory], // Use AI category
        aiConfidence: categorizedData.aiConfidence,
        ...(categorizedData.aiReasoning && { aiReasoning: categorizedData.aiReasoning }),
      });
    } else if (!categorizedData) {
      // Keep uncategorized transactions as-is (fallback)
      allTransactions.push(transaction);
    }
    // Skip income transactions for spending analysis
  }

  return allTransactions;
}

/**
 * Analyze trends based on the specified type
 */
async function analyzeTrends(
  transactions: Transaction[],
  analysisType: string,
  startDate: Date,
  endDate: Date
): Promise<TrendData[]> {
  switch (analysisType) {
    case 'monthly':
      return analyzeMonthlyTrends(transactions, startDate, endDate);
    case 'weekly':
      return analyzeWeeklyTrends(transactions, startDate, endDate);
    case 'daily':
      return analyzeDailyTrends(transactions, startDate, endDate);
    case 'category':
      return analyzeCategoryTrends(transactions, startDate, endDate);
    case 'seasonal':
      return analyzeSeasonalTrends(transactions);
    case 'anomaly':
      return analyzeAnomalies(transactions);
    default:
      return analyzeCategoryTrends(transactions, startDate, endDate);
  }
}

/**
 * Analyze monthly spending trends
 */
function analyzeMonthlyTrends(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): TrendData[] {
  const months = eachMonthOfInterval({ start: startDate, end: endDate });
  const trends: TrendData[] = [];

  for (const month of months) {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });

    const totalAmount = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

    trends.push({
      period: format(month, 'MMM yyyy'),
      amount: totalAmount,
      transactionCount: monthTransactions.length,
    });
  }

  // Calculate percent changes
  for (let i = 1; i < trends.length; i++) {
    const current = trends[i];
    const previous = trends[i - 1];
    if (current && previous && previous.amount > 0) {
      current.percentChange = ((current.amount - previous.amount) / previous.amount) * 100;
    }
  }

  return trends;
}

/**
 * Analyze weekly spending trends
 */
function analyzeWeeklyTrends(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): TrendData[] {
  const trends: TrendData[] = [];
  let currentDate = startOfWeek(startDate);

  while (currentDate <= endDate) {
    const weekEnd = endOfWeek(currentDate);

    const weekTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= currentDate && transactionDate <= weekEnd;
    });

    const totalAmount = weekTransactions.reduce((sum, t) => sum + t.amount, 0);

    trends.push({
      period: `${format(currentDate, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`,
      amount: totalAmount,
      transactionCount: weekTransactions.length,
    });

    currentDate = subDays(weekEnd, -1); // Move to next week
  }

  return trends;
}

/**
 * Analyze daily spending trends
 */
function analyzeDailyTrends(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): TrendData[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const trends: TrendData[] = [];

  for (const day of days) {
    const dayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return format(transactionDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });

    const totalAmount = dayTransactions.reduce((sum, t) => sum + t.amount, 0);

    trends.push({
      period: format(day, 'MMM dd, yyyy'),
      amount: totalAmount,
      transactionCount: dayTransactions.length,
    });
  }

  return trends;
}

/**
 * Analyze spending trends by category
 */
function analyzeCategoryTrends(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): TrendData[] {
  const categoryMap = new Map<string, { amount: number; count: number }>();

  transactions.forEach(transaction => {
    const primaryCategory = transaction.category[0] || 'Other';
    const existing = categoryMap.get(primaryCategory) || { amount: 0, count: 0 };
    categoryMap.set(primaryCategory, {
      amount: existing.amount + transaction.amount,
      count: existing.count + 1,
    });
  });

  const trends: TrendData[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      period: `${format(startDate, 'MMM yyyy')} - ${format(endDate, 'MMM yyyy')}`,
      category,
      amount: data.amount,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  return trends;
}

/**
 * Analyze seasonal spending patterns
 */
function analyzeSeasonalTrends(transactions: Transaction[]): TrendData[] {
  const seasons = {
    Spring: [3, 4, 5],
    Summer: [6, 7, 8],
    Fall: [9, 10, 11],
    Winter: [12, 1, 2],
  };

  const seasonalData: Record<string, { amount: number; count: number }> = {};

  Object.keys(seasons).forEach(season => {
    seasonalData[season] = { amount: 0, count: 0 };
  });

  transactions.forEach(transaction => {
    const month = new Date(transaction.date).getMonth() + 1;
    const season = Object.keys(seasons).find(s =>
      seasons[s as keyof typeof seasons].includes(month)
    );

    if (season && seasonalData[season]) {
      seasonalData[season].amount += transaction.amount;
      seasonalData[season].count += 1;
    }
  });

  return Object.entries(seasonalData).map(([season, data]) => ({
    period: season,
    amount: data.amount,
    transactionCount: data.count,
  }));
}

/**
 * Detect spending anomalies
 */
function analyzeAnomalies(transactions: Transaction[]): TrendData[] {
  // Group by day and calculate daily spending
  const dailySpending = new Map<string, number>();

  transactions.forEach(t => {
    const date = format(new Date(t.date), 'yyyy-MM-dd');
    dailySpending.set(date, (dailySpending.get(date) || 0) + t.amount);
  });

  const amounts = Array.from(dailySpending.values());
  const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
  const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  // Identify anomalies (spending > 2 standard deviations from mean)
  const threshold = mean + 2 * stdDev;

  const anomalies: TrendData[] = [];
  dailySpending.forEach((amount, date) => {
    if (amount > threshold) {
      anomalies.push({
        period: format(new Date(date), 'MMM dd, yyyy'),
        amount,
        transactionCount: transactions.filter(t => format(new Date(t.date), 'yyyy-MM-dd') === date)
          .length,
        anomaly: true,
      });
    }
  });

  return anomalies.sort((a, b) => b.amount - a.amount);
}

/**
 * Generate insights from trend analysis
 */
function generateInsights(
  trends: TrendData[],
  analysisType: string,
  _transactions: Transaction[]
): string[] {
  const insights: string[] = [];

  if (trends.length === 0) {
    return ['No spending data available for the selected period.'];
  }

  switch (analysisType) {
    case 'monthly':
      // Find growth/decline patterns
      const monthlyGrowth = trends.filter(t => t.percentChange && t.percentChange > 10);
      const monthlyDecline = trends.filter(t => t.percentChange && t.percentChange < -10);

      if (monthlyGrowth.length > 0 && monthlyGrowth[0]) {
        insights.push(
          `Spending increased significantly in ${monthlyGrowth.length} month(s), with the highest increase of ${monthlyGrowth[0].percentChange?.toFixed(1)}% in ${monthlyGrowth[0].period}.`
        );
      }

      if (monthlyDecline.length > 0 && monthlyDecline[0]) {
        insights.push(
          `Spending decreased significantly in ${monthlyDecline.length} month(s), with the largest decrease of ${Math.abs(monthlyDecline[0].percentChange || 0).toFixed(1)}% in ${monthlyDecline[0].period}.`
        );
      }
      break;

    case 'category':
      const topCategory = trends[0];
      if (!topCategory) break;

      const totalSpent = trends.reduce((sum, t) => sum + t.amount, 0);
      const topCategoryPercentage = (topCategory.amount / totalSpent) * 100;

      insights.push(
        `Your highest spending category is "${topCategory.category}" accounting for ${topCategoryPercentage.toFixed(1)}% of total expenses.`
      );

      if (trends.length > 3) {
        const topThreeSpending = trends.slice(0, 3).reduce((sum, t) => sum + t.amount, 0);
        const topThreePercentage = (topThreeSpending / totalSpent) * 100;
        insights.push(
          `Your top 3 categories account for ${topThreePercentage.toFixed(1)}% of all spending.`
        );
      }
      break;

    case 'seasonal':
      if (trends.length > 0) {
        const maxSeason = trends.reduce((max, t) => (t.amount > max.amount ? t : max));
        const minSeason = trends.reduce((min, t) => (t.amount < min.amount ? t : min));

        insights.push(
          `You spend the most during ${maxSeason.period} and least during ${minSeason.period}.`
        );
      }
      break;

    case 'anomaly':
      if (trends.length > 0 && trends[0]) {
        insights.push(
          `Detected ${trends.length} unusual spending day(s). Your highest anomaly was $${trends[0].amount.toFixed(2)} on ${trends[0].period}.`
        );
      } else {
        insights.push('No unusual spending patterns detected in your transaction history.');
      }
      break;

    default:
      insights.push('Analysis completed successfully.');
  }

  return insights;
}

/**
 * Calculate spending projections
 */
function calculateProjections(
  trends: TrendData[],
  _analysisType: string
): { nextPeriod: number; confidence: number; factors: string[] } {
  if (trends.length < 2) {
    return {
      nextPeriod: 0,
      confidence: 0,
      factors: ['Insufficient data for projection'],
    };
  }

  // Simple linear trend projection
  const recentTrends = trends.slice(-3); // Use last 3 periods
  const avgAmount = recentTrends.reduce((sum, t) => sum + t.amount, 0) / recentTrends.length;

  // Calculate trend direction
  const trendChanges = [];
  for (let i = 1; i < recentTrends.length; i++) {
    const current = recentTrends[i];
    const previous = recentTrends[i - 1];
    if (current && previous) {
      trendChanges.push(current.amount - previous.amount);
    }
  }

  const avgChange = trendChanges.reduce((sum, c) => sum + c, 0) / trendChanges.length;
  const projection = avgAmount + avgChange;

  // Calculate confidence based on trend consistency
  const variance =
    trendChanges.reduce((sum, c) => sum + Math.pow(c - avgChange, 2), 0) / trendChanges.length;
  const confidence = Math.max(0, Math.min(100, 100 - (Math.sqrt(variance) / avgAmount) * 100));

  const factors = [];
  if (avgChange > 0) {
    factors.push('Upward spending trend');
  } else if (avgChange < 0) {
    factors.push('Downward spending trend');
  } else {
    factors.push('Stable spending pattern');
  }

  return {
    nextPeriod: Math.max(0, projection),
    confidence: Math.round(confidence),
    factors,
  };
}
