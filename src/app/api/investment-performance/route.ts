import { NextResponse } from 'next/server';
import { z } from 'zod';

import { validateAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { getPlaidAccessToken } from '@/lib/plaid-token-helper';

export const dynamic = 'force-dynamic';

const performanceQuerySchema = z.object({
  period: z.enum(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL']).optional().default('1M'),
  includeAssetAllocation: z.boolean().optional().default(true),
  includeHistorical: z.boolean().optional().default(true),
});

interface InvestmentHolding {
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  value: number;
  costBasis?: number;
  gainLoss?: number;
  gainLossPercent?: number;
  type: 'stock' | 'bond' | 'etf' | 'mutual_fund' | 'crypto' | 'other';
  sector?: string;
}

interface PerformanceMetrics {
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  yearlyReturn: number;
  volatility: number;
  sharpeRatio: number;
}

interface AssetAllocation {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

interface PerformanceData {
  date: string;
  value: number;
  gainLoss: number;
  gainLossPercent: number;
}

/**
 * Get comprehensive investment performance data
 */
export async function GET(request: Request) {
  try {
    // Authentication
    const authResult = await validateAuthToken(request);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId!;

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = {
      period: url.searchParams.get('period') || '1M',
      includeAssetAllocation: url.searchParams.get('includeAssetAllocation') !== 'false',
      includeHistorical: url.searchParams.get('includeHistorical') !== 'false',
    };

    const parsed = performanceQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    const { period, includeAssetAllocation, includeHistorical } = parsed.data;

    // Get Plaid access token
    const accessToken = await getPlaidAccessToken(userId);

    // Fetch investment data from multiple sources
    const [plaidInvestments, manualPlatforms, historicalData] = await Promise.all([
      fetchPlaidInvestmentData(accessToken, userId),
      fetchManualPlatformData(userId),
      includeHistorical ? fetchHistoricalPerformanceData(userId, period) : Promise.resolve([]),
    ]);

    // Combine and process investment data
    const allHoldings = [...plaidInvestments.holdings, ...manualPlatforms.holdings];
    const totalAccounts = plaidInvestments.accounts.length + manualPlatforms.accounts.length;

    // Calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics(allHoldings, historicalData);

    // Calculate asset allocation
    const assetAllocation = includeAssetAllocation ? calculateAssetAllocation(allHoldings) : [];

    // Get sector allocation
    const sectorAllocation = calculateSectorAllocation(allHoldings);

    // Calculate account performance
    const accountPerformance = calculateAccountPerformance([
      ...plaidInvestments.accounts,
      ...manualPlatforms.accounts,
    ]);

    // Generate AI insights
    const insights = generateInvestmentInsights(performanceMetrics, assetAllocation, allHoldings);

    const response = {
      summary: {
        totalAccounts,
        totalValue: performanceMetrics.totalValue,
        totalGainLoss: performanceMetrics.totalGainLoss,
        totalGainLossPercent: performanceMetrics.totalGainLossPercent,
        lastUpdated: new Date().toISOString(),
      },
      performance: performanceMetrics,
      holdings: allHoldings.slice(0, 50), // Limit for API response size
      assetAllocation,
      sectorAllocation,
      accountPerformance,
      historicalData: includeHistorical ? historicalData : [],
      insights,
    };

    logger.info('Investment performance data retrieved', {
      userId,
      period,
      holdingsCount: allHoldings.length,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Error fetching investment performance', { error });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Fetch Plaid investment data
 */
async function fetchPlaidInvestmentData(accessToken: string | null, userId: string) {
  if (!accessToken) {
    return { accounts: [], holdings: [] };
  }

  try {
    // This would integrate with Plaid's investments API
    // For now, return mock data structure
    return {
      accounts: [],
      holdings: [] as InvestmentHolding[],
    };
  } catch (error) {
    logger.error('Error fetching Plaid investment data', { error, userId });
    return { accounts: [], holdings: [] };
  }
}

/**
 * Fetch manual platform investment data
 */
async function fetchManualPlatformData(userId: string) {
  try {
    const platformsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('platforms')
      .get();

    const accounts: any[] = [];
    const holdings: InvestmentHolding[] = [];

    if (!platformsSnapshot.empty) {
      for (const doc of platformsSnapshot.docs) {
        const platform = doc.data();

        accounts.push({
          id: doc.id,
          name: platform.name,
          type: platform.type || 'investment',
          balance: platform.currentBalance || 0,
          performance: {
            daily: 0, // Calculate based on historical data
            monthly: (platform.netProfitPercent || 0) / 12,
            yearly: platform.netProfitPercent || 0,
          },
        });

        // Generate holdings based on platform data
        // This is simplified - in a real app, you'd have detailed holdings data
        if (platform.currentBalance > 0) {
          holdings.push({
            symbol: `${platform.name}_TOTAL`,
            name: `${platform.name} Portfolio`,
            quantity: 1,
            price: platform.currentBalance,
            value: platform.currentBalance,
            costBasis: platform.totalDeposited - platform.totalWithdrawn,
            gainLoss: platform.netProfit || 0,
            gainLossPercent: platform.netProfitPercent || 0,
            type: platform.type === 'crypto_exchange' ? 'crypto' : 'other',
            sector: 'Mixed',
          });
        }
      }
    }

    return { accounts, holdings };
  } catch (error) {
    logger.error('Error fetching manual platform data', { error, userId });
    return { accounts: [], holdings: [] };
  }
}

/**
 * Fetch historical performance data
 */
async function fetchHistoricalPerformanceData(
  userId: string,
  period: string
): Promise<PerformanceData[]> {
  try {
    // Generate mock historical data for now
    // In a real implementation, this would fetch from your database
    const days = getPeriodDays(period);
    const data: PerformanceData[] = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Generate realistic mock data with some volatility
      const baseValue = 100000;
      const volatility = 0.02;
      const trend = 0.001; // Small upward trend
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      const trendAdjustment = trend * (days - i);

      const value = baseValue * (1 + trendAdjustment + randomChange);
      const gainLoss = value - baseValue;
      const gainLossPercent = (gainLoss / baseValue) * 100;

      data.push({
        date: date.toISOString().split('T')[0]!,
        value,
        gainLoss,
        gainLossPercent,
      });
    }

    return data;
  } catch (error) {
    logger.error('Error fetching historical performance data', { error, userId });
    return [];
  }
}

/**
 * Calculate comprehensive performance metrics
 */
function calculatePerformanceMetrics(
  holdings: InvestmentHolding[],
  historicalData: PerformanceData[]
): PerformanceMetrics {
  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
  const totalCostBasis = holdings.reduce(
    (sum, holding) => sum + (holding.costBasis || holding.value),
    0
  );
  const totalGainLoss = totalValue - totalCostBasis;
  const totalGainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

  // Calculate returns from historical data
  let dailyReturn = 0;
  let weeklyReturn = 0;
  let monthlyReturn = 0;
  let yearlyReturn = 0;
  let volatility = 0;

  if (historicalData.length > 1) {
    const latest = historicalData[historicalData.length - 1]!;
    const yesterday = historicalData[historicalData.length - 2];
    const weekAgo = historicalData[Math.max(0, historicalData.length - 8)];
    const monthAgo = historicalData[Math.max(0, historicalData.length - 31)];
    const yearAgo = historicalData[0]!;

    dailyReturn = yesterday ? ((latest.value - yesterday.value) / yesterday.value) * 100 : 0;
    weeklyReturn = weekAgo ? ((latest.value - weekAgo.value) / weekAgo.value) * 100 : 0;
    monthlyReturn = monthAgo ? ((latest.value - monthAgo.value) / monthAgo.value) * 100 : 0;
    yearlyReturn = yearAgo ? ((latest.value - yearAgo.value) / yearAgo.value) * 100 : 0;

    // Calculate volatility (standard deviation of daily returns)
    const dailyReturns = historicalData
      .slice(1)
      .map((data, i) => ((data.value - historicalData[i]!.value) / historicalData[i]!.value) * 100);
    const avgReturn = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
    const variance =
      dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) /
      dailyReturns.length;
    volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
  }

  // Calculate Sharpe ratio (simplified, assuming 2% risk-free rate)
  const riskFreeRate = 2;
  const sharpeRatio = volatility > 0 ? (yearlyReturn - riskFreeRate) / volatility : 0;

  return {
    totalValue,
    totalCostBasis,
    totalGainLoss,
    totalGainLossPercent,
    dailyReturn,
    weeklyReturn,
    monthlyReturn,
    yearlyReturn,
    volatility,
    sharpeRatio,
  };
}

/**
 * Calculate asset allocation by type
 */
function calculateAssetAllocation(holdings: InvestmentHolding[]): AssetAllocation[] {
  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
  const allocationMap = new Map<string, { value: number; color: string }>();

  const colors = {
    stock: '#3B82F6',
    bond: '#10B981',
    etf: '#8B5CF6',
    mutual_fund: '#F59E0B',
    crypto: '#EF4444',
    other: '#6B7280',
  };

  holdings.forEach(holding => {
    const type = holding.type;
    const current = allocationMap.get(type) || { value: 0, color: colors[type] || colors.other };
    allocationMap.set(type, {
      value: current.value + holding.value,
      color: current.color,
    });
  });

  return Array.from(allocationMap.entries())
    .map(([category, data]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' '),
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      color: data.color || colors.other,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Calculate sector allocation
 */
function calculateSectorAllocation(holdings: InvestmentHolding[]): AssetAllocation[] {
  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
  const sectorMap = new Map<string, number>();

  holdings.forEach(holding => {
    const sector = holding.sector || 'Other';
    sectorMap.set(sector, (sectorMap.get(sector) || 0) + holding.value);
  });

  const sectorColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'];

  return Array.from(sectorMap.entries())
    .map(([sector, value], index) => ({
      category: sector,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: sectorColors[index % sectorColors.length]!,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Calculate performance for individual accounts
 */
function calculateAccountPerformance(accounts: any[]) {
  return accounts.map(account => ({
    ...account,
    performance: {
      ...account.performance,
      risk: calculateRiskLevel(account.performance.monthly || 0),
      trend: getTrendDirection(account.performance.monthly || 0),
    },
  }));
}

/**
 * Generate AI-powered investment insights
 */
function generateInvestmentInsights(
  performance: PerformanceMetrics,
  allocation: AssetAllocation[],
  _holdings: InvestmentHolding[]
): string[] {
  const insights: string[] = [];

  // Performance insights
  if (performance.yearlyReturn > 10) {
    insights.push(
      `Excellent performance! Your portfolio has returned ${performance.yearlyReturn.toFixed(1)}% this year, outperforming many market indices.`
    );
  } else if (performance.yearlyReturn < -5) {
    insights.push(
      `Your portfolio is down ${Math.abs(performance.yearlyReturn).toFixed(1)}% this year. Consider reviewing your asset allocation or consulting a financial advisor.`
    );
  }

  // Diversification insights
  if (allocation.length < 3) {
    insights.push('Consider diversifying your portfolio across more asset classes to reduce risk.');
  }

  // Volatility insights
  if (performance.volatility > 20) {
    insights.push(
      'Your portfolio shows high volatility. Consider adding some stable assets like bonds to reduce risk.'
    );
  }

  // Allocation insights
  const topAllocation = allocation[0];
  if (topAllocation && topAllocation.percentage > 70) {
    insights.push(
      `${topAllocation.category} represents ${topAllocation.percentage.toFixed(1)}% of your portfolio. Consider rebalancing for better diversification.`
    );
  }

  return insights.slice(0, 3); // Return top 3 insights
}

/**
 * Helper functions
 */
function getPeriodDays(period: string): number {
  switch (period) {
    case '1D':
      return 1;
    case '1W':
      return 7;
    case '1M':
      return 30;
    case '3M':
      return 90;
    case '6M':
      return 180;
    case '1Y':
      return 365;
    case 'ALL':
      return 1095; // 3 years
    default:
      return 30;
  }
}

function calculateRiskLevel(monthlyReturn: number): 'Low' | 'Medium' | 'High' {
  const absReturn = Math.abs(monthlyReturn);
  if (absReturn < 2) return 'Low';
  if (absReturn < 5) return 'Medium';
  return 'High';
}

function getTrendDirection(monthlyReturn: number): 'up' | 'down' | 'stable' {
  if (monthlyReturn > 1) return 'up';
  if (monthlyReturn < -1) return 'down';
  return 'stable';
}
