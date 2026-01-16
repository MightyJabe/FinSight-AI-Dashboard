import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { calculateNetWorth, NetWorthResultSchema } from '@/lib/calculate-net-worth';
import { getFinancialOverview } from '@/lib/financial-calculator';
import logger from '@/lib/logger';

// Response type definitions for documentation
type SuccessResponse = {
  success: true;
  data: z.infer<typeof NetWorthResultSchema>;
};

type ErrorResponse = {
  success: false;
  error: string;
  code: 'UNAUTHORIZED' | 'NO_ACCOUNTS' | 'FETCH_FAILED';
};

export type NetWorthApiResponse = SuccessResponse | ErrorResponse;

// Cache for 60 seconds
const cache = new Map<string, { data: SuccessResponse; timestamp: number }>();
const CACHE_TTL = 60 * 1000;

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
    const cacheKey = `net-worth-${userId}`;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        logger.info('Returning cached net worth data');
        return NextResponse.json(cached.data);
      }
    }

    // Fetch data using centralized calculator
    const { data: rawData } = await getFinancialOverview(userId);

    // Check if user has any accounts
    const hasAccounts =
      rawData.plaidAccounts.length > 0 ||
      rawData.manualAssets.length > 0 ||
      rawData.cryptoAccounts.length > 0;

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
    ];

    const netWorthResult = calculateNetWorth(accounts);

    const responseData: SuccessResponse = {
      success: true,
      data: netWorthResult,
    };

    // Cache the response
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    // Clean up old cache entries
    for (const [key, value] of cache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL * 2) {
        cache.delete(key);
      }
    }

    logger.info('Net worth data calculated successfully', {
      netWorth: netWorthResult.totalNetWorth,
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
