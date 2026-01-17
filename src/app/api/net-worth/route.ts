import { NextRequest, NextResponse } from 'next/server';

import { CACHE_PREFIX, CACHE_TTL, cacheGet, cacheSet } from '@/lib/cache';
import { calculateNetWorth } from '@/lib/calculate-net-worth';
import { getFinancialOverview } from '@/lib/financial-calculator';
import { roundFinancialValue } from '@/lib/financial-validator';
import { adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

/**
 * Net Worth API Response Format
 * Designed for real-time dashboard updates
 */
export interface NetWorthApiData {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  liquidAssets: number;
  investments: number;
  cryptoBalance: number;
  realEstate: number;
  pension: number;
  trend?: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

type SuccessResponse = {
  success: true;
  data: NetWorthApiData;
};

type ErrorResponse = {
  success: false;
  error: string;
  code: 'UNAUTHORIZED' | 'NO_ACCOUNTS' | 'FETCH_FAILED';
};

export type NetWorthApiResponse = SuccessResponse | ErrorResponse;

// Historical data cache for trend calculation (kept in-memory for now as trends are session-specific)
const historyCache = new Map<string, { netWorth: number; timestamp: number }[]>();

export async function GET(request: NextRequest) {
  try {
    // Get userId from session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' } as ErrorResponse,
        { status: 401 }
      );
    }

    const { adminAuth } = await import('@/lib/firebase-admin');
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedClaims.uid;

    const forceRefresh = request.nextUrl.searchParams.get('force') === 'true';

    // Check Redis cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await cacheGet<SuccessResponse>(userId, { prefix: CACHE_PREFIX.NET_WORTH });
      if (cached.hit && cached.data) {
        logger.debug('Returning cached net worth data', { source: cached.source });
        return NextResponse.json(cached.data);
      }
    }

    // Fetch data using centralized calculator
    const { data: rawData } = await getFinancialOverview(userId);

    // Fetch Israeli bank accounts from Firestore
    const israeliAccountsSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('accounts')
      .get();

    const israeliAccounts = israeliAccountsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: (data.name as string) || `Account ${doc.id}`,
        balance: (data.balance?.current as number) || 0,
        type: (data.subtype as string) || (data.type as string) || 'checking',
      };
    });

    logger.debug('Found Israeli accounts for net worth', { count: israeliAccounts.length });

    // Check if user has any accounts (including Israeli accounts)
    const hasAccounts =
      rawData.plaidAccounts.length > 0 ||
      rawData.manualAssets.length > 0 ||
      rawData.cryptoAccounts.length > 0 ||
      israeliAccounts.length > 0;

    if (!hasAccounts) {
      return NextResponse.json(
        { success: false, error: 'No accounts connected', code: 'NO_ACCOUNTS' } as ErrorResponse,
        { status: 404 }
      );
    }

    // Convert accounts to the format expected by calculateNetWorth
    const accounts = [
      // Plaid accounts
      ...rawData.plaidAccounts.map(acc => ({
        id: acc.id,
        type: acc.subtype || acc.accountType,
        balance: acc.balance,
        name: acc.name,
      })),
      // Israeli bank accounts
      ...israeliAccounts.map(acc => ({
        id: acc.id,
        type: acc.type,
        balance: acc.balance,
        name: acc.name,
      })),
      // Manual assets
      ...rawData.manualAssets.map(asset => ({
        id: asset.id,
        type: asset.type,
        balance: asset.currentBalance ?? asset.amount,
        name: asset.name,
      })),
      // Manual liabilities (negative balance)
      ...rawData.manualLiabilities.map(liability => ({
        id: liability.id,
        type: liability.type,
        balance: -Math.abs(liability.amount),
        name: liability.name,
      })),
      // Crypto accounts
      ...rawData.cryptoAccounts.map(crypto => ({
        id: crypto.id,
        type: 'crypto',
        balance: crypto.balance,
        name: crypto.name,
      })),
      // Real estate assets
      ...rawData.realEstateAssets.map(property => ({
        id: property.id,
        type: 'real_estate',
        balance: property.balance,
        name: property.name,
      })),
      // Pension assets
      ...rawData.pensionAssets.map(pension => ({
        id: pension.id,
        type: 'pension',
        balance: pension.balance,
        name: pension.name,
      })),
      // Mortgage liabilities (negative balance)
      ...rawData.mortgageLiabilities.map(mortgage => ({
        id: mortgage.id,
        type: 'mortgage',
        balance: -Math.abs(mortgage.amount),
        name: mortgage.name,
      })),
    ];

    const netWorthResult = calculateNetWorth(accounts);

    // Extract specific asset categories from assetsByType
    const assetsByType = netWorthResult.assetsByType;

    const liquidAssets = roundFinancialValue(
      (assetsByType['checking'] || 0) +
      (assetsByType['savings'] || 0)
    );

    const investments = roundFinancialValue(
      (assetsByType['investment'] || 0) +
      (assetsByType['brokerage'] || 0) +
      (assetsByType['retirement'] || 0)
    );

    const cryptoBalance = roundFinancialValue(assetsByType['crypto'] || 0);
    const realEstate = roundFinancialValue(assetsByType['real_estate'] || 0);
    const pension = roundFinancialValue(assetsByType['pension'] || 0);

    // Calculate trends from historical data
    const trend = calculateTrend(userId, netWorthResult.totalNetWorth);

    // Store current value in history for future trend calculation
    storeHistoricalValue(userId, netWorthResult.totalNetWorth);

    const responseData: SuccessResponse = {
      success: true,
      data: {
        netWorth: roundFinancialValue(netWorthResult.totalNetWorth),
        totalAssets: roundFinancialValue(netWorthResult.totalAssets),
        totalLiabilities: roundFinancialValue(netWorthResult.totalLiabilities),
        liquidAssets,
        investments,
        cryptoBalance,
        realEstate,
        pension,
        ...(trend && { trend }),
      },
    };

    // Cache the response in Redis (30 seconds TTL)
    await cacheSet(userId, responseData, {
      prefix: CACHE_PREFIX.NET_WORTH,
      ttl: CACHE_TTL.FREQUENT,
    });

    logger.info('Net worth data calculated successfully', {
      netWorth: responseData.data.netWorth,
      accountCount: netWorthResult.accountCount,
    });

    return NextResponse.json(responseData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Error calculating net worth:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to calculate net worth', code: 'FETCH_FAILED' } as ErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * Calculate trend data from historical values
 * Uses in-memory cache for MVP (will be replaced with Firestore for persistence)
 */
function calculateTrend(
  userId: string,
  currentNetWorth: number
): { daily: number; weekly: number; monthly: number } | undefined {
  const history = historyCache.get(userId);

  if (!history || history.length === 0) {
    return undefined;
  }

  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  // Find closest historical values to each time period
  const dayValue = findClosestValue(history, dayAgo);
  const weekValue = findClosestValue(history, weekAgo);
  const monthValue = findClosestValue(history, monthAgo);

  // If we don't have enough history, use earliest available
  const earliestValue = history[0]?.netWorth ?? currentNetWorth;

  return {
    daily: roundFinancialValue(currentNetWorth - (dayValue ?? earliestValue)),
    weekly: roundFinancialValue(currentNetWorth - (weekValue ?? earliestValue)),
    monthly: roundFinancialValue(currentNetWorth - (monthValue ?? earliestValue)),
  };
}

/**
 * Find the historical value closest to the target timestamp
 */
function findClosestValue(
  history: { netWorth: number; timestamp: number }[],
  targetTimestamp: number
): number | undefined {
  let closest: { netWorth: number; timestamp: number } | undefined;
  let minDiff = Infinity;

  for (const entry of history) {
    // Only consider entries before or at the target time
    if (entry.timestamp <= targetTimestamp) {
      const diff = targetTimestamp - entry.timestamp;
      if (diff < minDiff) {
        minDiff = diff;
        closest = entry;
      }
    }
  }

  return closest?.netWorth;
}

/**
 * Store current net worth value for historical trend calculation
 * Keeps last 100 entries per user
 */
function storeHistoricalValue(userId: string, netWorth: number): void {
  const history = historyCache.get(userId) || [];

  // Only store if value changed or enough time passed (5 minutes)
  const lastEntry = history[history.length - 1];
  const shouldStore =
    !lastEntry ||
    lastEntry.netWorth !== netWorth ||
    Date.now() - lastEntry.timestamp > 5 * 60 * 1000;

  if (shouldStore) {
    history.push({ netWorth, timestamp: Date.now() });

    // Keep only last 100 entries
    if (history.length > 100) {
      history.shift();
    }

    historyCache.set(userId, history);
  }
}
