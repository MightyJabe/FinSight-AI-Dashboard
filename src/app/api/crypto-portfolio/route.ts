import { NextResponse } from 'next/server';
import { z } from 'zod';

import { validateAuthToken } from '@/lib/auth-server';
import { db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import type {
  CryptoHistoricalData,
  CryptoHolding,
  CryptoPortfolioSummary,
  CryptoPriceData,
} from '@/types/crypto';

export const dynamic = 'force-dynamic';

const cryptoQuerySchema = z.object({
  includeHistorical: z.boolean().optional().default(true),
  includePrices: z.boolean().optional().default(true),
  currency: z.string().optional().default('USD'),
});

/**
 * Get comprehensive crypto portfolio data
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
      includeHistorical: url.searchParams.get('includeHistorical') !== 'false',
      includePrices: url.searchParams.get('includePrices') !== 'false',
      currency: url.searchParams.get('currency') || 'USD',
    };

    const parsed = cryptoQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    const { includeHistorical, includePrices, currency } = parsed.data;

    // Fetch crypto holdings from platforms
    const cryptoHoldings = await fetchCryptoHoldings(userId);

    if (cryptoHoldings.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalValue: 0,
            totalCostBasis: 0,
            totalGainLoss: 0,
            totalGainLossPercent: 0,
            dayChange: 0,
            dayChangePercent: 0,
            holdingsCount: 0,
            diversificationScore: 0,
            topGainer: null,
            topLoser: null,
            lastUpdated: new Date().toISOString(),
          },
          holdings: [],
          historicalData: [],
          insights: [
            'Connect crypto exchanges or add manual holdings to start tracking your portfolio.',
          ],
        },
      });
    }

    // Get current crypto prices
    let currentPrices: CryptoPriceData = {};
    if (includePrices) {
      const symbols = cryptoHoldings.map(h => h.symbol.toLowerCase()).join(',');
      currentPrices = await fetchCryptoPrices(symbols, currency);
    }

    // Calculate portfolio data
    const portfolioData = calculateCryptoPortfolio(cryptoHoldings, currentPrices);

    // Get historical data
    const historicalData = includeHistorical
      ? await fetchHistoricalPortfolioData(userId, cryptoHoldings)
      : [];

    // Generate insights
    const insights = generateCryptoInsights(portfolioData.summary, portfolioData.holdings);

    const response = {
      summary: portfolioData.summary,
      holdings: portfolioData.holdings,
      historicalData,
      insights,
    };

    logger.info('Crypto portfolio data retrieved', {
      userId,
      holdingsCount: cryptoHoldings.length,
      totalValue: portfolioData.summary.totalValue,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Error fetching crypto portfolio', { error });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Fetch crypto holdings from user's platforms
 */
async function fetchCryptoHoldings(userId: string): Promise<CryptoHolding[]> {
  try {
    const platformsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('platforms')
      .where('type', '==', 'crypto_exchange')
      .get();

    const holdings: CryptoHolding[] = [];

    for (const doc of platformsSnapshot.docs) {
      const platform = doc.data();

      // For now, create aggregate holdings from platform data
      // In a real implementation, you'd have detailed holdings per coin
      if (platform.currentBalance > 0) {
        // This is simplified - normally you'd have individual coin holdings
        const avgPrice =
          platform.totalDeposited > 0
            ? platform.currentBalance / (platform.totalDeposited / 1000) // Assuming rough calculation
            : 1;

        holdings.push({
          symbol: 'BTC', // Placeholder - would come from detailed holdings
          name: 'Bitcoin',
          amount: platform.currentBalance / 50000, // Rough BTC amount calculation
          averagePrice: avgPrice,
          currentPrice: 0, // Will be filled by price API
          value: platform.currentBalance,
          costBasis: platform.totalDeposited - platform.totalWithdrawn,
          gainLoss: platform.netProfit || 0,
          gainLossPercent: platform.netProfitPercent || 0,
          priceChange24h: 0,
          priceChangePercent24h: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    return holdings;
  } catch (error) {
    logger.error('Error fetching crypto holdings', { error, userId });
    return [];
  }
}

/**
 * Fetch current crypto prices from CoinGecko API
 */
async function fetchCryptoPrices(symbols: string, currency: string): Promise<CryptoPriceData> {
  try {
    // Using CoinGecko free API (rate limited)
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbols}&vs_currencies=${currency.toLowerCase()}&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
    );

    if (!response.ok) {
      logger.warn('Failed to fetch crypto prices from CoinGecko');
      return {};
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching crypto prices', { error });
    return {};
  }
}

/**
 * Calculate comprehensive crypto portfolio metrics
 */
function calculateCryptoPortfolio(
  holdings: CryptoHolding[],
  prices: CryptoPriceData
): { summary: CryptoPortfolioSummary; holdings: CryptoHolding[] } {
  // Update holdings with current prices
  const updatedHoldings: CryptoHolding[] = holdings.map(holding => {
    const priceData = prices[holding.symbol.toLowerCase()];
    if (priceData) {
      const currentPrice = priceData.usd;
      const value = holding.amount * currentPrice;
      const gainLoss = value - holding.costBasis;
      const gainLossPercent = holding.costBasis > 0 ? (gainLoss / holding.costBasis) * 100 : 0;

      return {
        ...holding,
        currentPrice,
        value,
        gainLoss,
        gainLossPercent,
        priceChange24h: priceData.usd_24h_change || 0,
        priceChangePercent24h: priceData.usd_24h_change || 0,
        marketCap: priceData.usd_market_cap,
        volume24h: priceData.usd_24h_vol,
        rank: priceData.market_cap_rank,
        lastUpdated: new Date().toISOString(),
      } as CryptoHolding;
    }
    return holding;
  });

  // Calculate summary metrics
  const totalValue = updatedHoldings.reduce((sum, h) => sum + h.value, 0);
  const totalCostBasis = updatedHoldings.reduce((sum, h) => sum + h.costBasis, 0);
  const totalGainLoss = totalValue - totalCostBasis;
  const totalGainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

  // Calculate day change
  const dayChange = updatedHoldings.reduce((sum, h) => {
    const dayChangeValue = (h.value * h.priceChangePercent24h) / 100;
    return sum + dayChangeValue;
  }, 0);
  const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

  // Find top gainer and loser
  const sortedByPerformance = [...updatedHoldings].sort(
    (a, b) => b.gainLossPercent - a.gainLossPercent
  );
  const topGainer: CryptoHolding | null = sortedByPerformance[0] || null;
  const topLoser: CryptoHolding | null =
    sortedByPerformance[sortedByPerformance.length - 1] || null;

  // Calculate diversification score
  const diversificationScore = calculateDiversificationScore(updatedHoldings);

  const summary: CryptoPortfolioSummary = {
    totalValue,
    totalCostBasis,
    totalGainLoss,
    totalGainLossPercent,
    dayChange,
    dayChangePercent,
    holdingsCount: updatedHoldings.length,
    diversificationScore,
    topGainer,
    topLoser,
    lastUpdated: new Date().toISOString(),
  };

  return { summary, holdings: updatedHoldings };
}

/**
 * Fetch historical portfolio data
 */
async function fetchHistoricalPortfolioData(
  _userId: string,
  holdings: CryptoHolding[]
): Promise<CryptoHistoricalData[]> {
  // This would fetch historical portfolio values
  // For now, generate mock data
  const data = [];
  const days = 30;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Generate mock historical value
    const baseValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const volatility = 0.05; // 5% daily volatility for crypto
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    const value = baseValue * (1 + randomChange);

    data.push({
      date: date.toISOString().split('T')[0] || date.toISOString(),
      value,
      change: value - baseValue,
      changePercent: baseValue > 0 ? ((value - baseValue) / baseValue) * 100 : 0,
    });
  }

  return data;
}

/**
 * Calculate portfolio diversification score
 */
function calculateDiversificationScore(holdings: CryptoHolding[]): number {
  if (holdings.length === 0) return 0;

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const weights = holdings.map(h => h.value / totalValue);

  // Calculate Herfindahl-Hirschman Index (HHI)
  const hhi = weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);

  // Convert to diversification score (0-100)
  return Math.max(0, (1 - hhi) * 100);
}

/**
 * Generate AI-powered crypto insights
 */
function generateCryptoInsights(
  summary: CryptoPortfolioSummary,
  holdings: CryptoHolding[]
): string[] {
  const insights: string[] = [];

  // Performance insights
  if (summary.totalGainLossPercent > 20) {
    insights.push(
      `Outstanding performance! Your crypto portfolio is up ${summary.totalGainLossPercent.toFixed(1)}%, significantly outperforming traditional markets.`
    );
  } else if (summary.totalGainLossPercent < -20) {
    insights.push(
      `Your portfolio is down ${Math.abs(summary.totalGainLossPercent).toFixed(1)}%. Consider dollar-cost averaging to reduce volatility impact.`
    );
  }

  // Daily change insights
  if (Math.abs(summary.dayChangePercent) > 10) {
    const direction = summary.dayChangePercent > 0 ? 'gained' : 'lost';
    insights.push(
      `Significant daily movement: Your portfolio ${direction} ${Math.abs(summary.dayChangePercent).toFixed(1)}% today. This volatility is typical for crypto markets.`
    );
  }

  // Diversification insights
  if (summary.diversificationScore < 30) {
    insights.push(
      'Your crypto portfolio is highly concentrated. Consider diversifying across different cryptocurrencies and market caps to reduce risk.'
    );
  } else if (summary.diversificationScore > 70) {
    insights.push(
      'Well diversified crypto portfolio! Your holdings are spread across multiple assets, helping to manage risk.'
    );
  }

  // Holdings insights
  if (holdings.length < 3) {
    insights.push(
      'Consider adding more cryptocurrencies to your portfolio. A mix of large-cap, mid-cap, and small-cap coins can improve returns and reduce risk.'
    );
  }

  // Top performer insight
  if (summary.topGainer && summary.topGainer.gainLossPercent > 50) {
    insights.push(
      `${summary.topGainer.symbol} is your top performer with ${summary.topGainer.gainLossPercent.toFixed(1)}% gains. Consider taking some profits to lock in gains.`
    );
  }

  return insights.slice(0, 4); // Return top 4 insights
}
