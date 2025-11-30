import { NextRequest, NextResponse } from 'next/server';

import { getFinancialOverview } from '@/lib/financial-calculator';
import logger from '@/lib/logger';

// Cache for 30 seconds to prevent excessive API calls
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includePlatforms = searchParams.get('includePlatforms') === 'true';
    const forceRefresh = searchParams.get('force') === 'true';

    // Get userId from session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { adminAuth } = await import('@/lib/firebase-admin');
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedClaims.uid;

    const cacheKey = `financial-overview-${userId}-${includePlatforms}`;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        logger.info('Returning cached financial overview data');
        return NextResponse.json(cached.data);
      }
    }

    // Fetch data using centralized calculator
    const { data: rawData, metrics } = await getFinancialOverview(userId);

    logger.info('Financial overview raw data:', {
      manualAssets: rawData.manualAssets.length,
      manualLiabilities: rawData.manualLiabilities.length,
      plaidAccounts: rawData.plaidAccounts.length,
      cryptoAccounts: rawData.cryptoAccounts.length,
      transactions: rawData.transactions.length,
      metrics: {
        totalAssets: metrics.totalAssets,
        totalLiabilities: metrics.totalLiabilities,
        netWorth: metrics.netWorth,
      },
    });

    // Validate metrics before transformation
    const { enforceFinancialAccuracy } = await import('@/lib/financial-validator');
    enforceFinancialAccuracy(metrics, 'financial-overview API');

    // Transform data to match expected API format
    const bankAccounts = rawData.plaidAccounts.filter(
      acc =>
        acc.accountType === 'depository' &&
        acc.subtype &&
        ['checking', 'savings'].includes(acc.subtype)
    );

    const creditAccounts = rawData.plaidAccounts.filter(acc => acc.accountType === 'credit');

    const investmentAccounts = [
      ...rawData.plaidAccounts.filter(acc => acc.accountType === 'investment'),
      ...rawData.manualAssets
        .filter(asset => ['investment', 'crypto'].includes(asset.type))
        .map(asset => ({
          id: asset.id,
          name: asset.name,
          balance: asset.currentBalance,
          type: asset.type,
          source: 'manual',
        })),
      ...rawData.cryptoAccounts.map(crypto => ({
        id: crypto.id,
        name: crypto.name,
        balance: crypto.balance,
        type: 'crypto',
        source: crypto.type,
      })),
    ];

    const loanAccounts = rawData.plaidAccounts.filter(acc =>
      ['loan', 'mortgage'].includes(acc.accountType)
    );

    const transformedData = {
      summary: {
        liquidAssets: metrics.liquidAssets,
        totalAssets: metrics.totalAssets,
        totalLiabilities: metrics.totalLiabilities,
        netWorth: metrics.netWorth,
        monthlyIncome: metrics.monthlyIncome,
        monthlyExpenses: metrics.monthlyExpenses,
        monthlyCashFlow: metrics.monthlyCashFlow,
        investments: metrics.investments,
      },
      accounts: {
        bank: bankAccounts,
        credit: creditAccounts,
        investment: investmentAccounts,
        loan: loanAccounts,
        crypto: rawData.cryptoAccounts,
      },
      manualAssets: rawData.manualAssets,
      manualLiabilities: rawData.manualLiabilities,
      platforms: includePlatforms ? [] : undefined,
    };

    const responseData = {
      success: true,
      data: transformedData,
    };

    // Cache the response
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    // Clean up old cache entries
    for (const [key, value] of cache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL * 2) {
        cache.delete(key);
      }
    }

    logger.info('Financial overview data retrieved successfully');
    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('Error retrieving financial overview:', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve financial data' },
      { status: 500 }
    );
  }
}
