/**
 * Net Worth History API
 *
 * Returns historical net worth snapshots for charting.
 * Supports period selection: 1M, 3M, 6M, 1Y, All
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { adminAuth } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { DailySnapshot,getLatestSnapshot, getSnapshots } from '@/lib/snapshot-service';

// Query parameter validation
const querySchema = z.object({
  period: z.enum(['1M', '3M', '6M', '1Y', 'ALL']).default('3M'),
});

// Response types
export interface NetWorthHistoryPoint {
  date: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

export interface NetWorthHistoryResponse {
  success: boolean;
  data?: {
    points: NetWorthHistoryPoint[];
    period: string;
    startDate: string;
    endDate: string;
    latestSnapshot: DailySnapshot | null;
  };
  error?: string;
}

/**
 * Calculate start date based on period
 */
function getStartDate(period: string): string {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case '1M':
      start.setMonth(start.getMonth() - 1);
      break;
    case '3M':
      start.setMonth(start.getMonth() - 3);
      break;
    case '6M':
      start.setMonth(start.getMonth() - 6);
      break;
    case '1Y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    case 'ALL':
      start.setFullYear(2020, 0, 1); // Far enough back to include all data
      break;
    default:
      start.setMonth(start.getMonth() - 3);
  }

  return start.toISOString().split('T')[0] ?? start.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as NetWorthHistoryResponse,
        { status: 401 }
      );
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedClaims.uid;

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = querySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid period parameter' } as NetWorthHistoryResponse,
        { status: 400 }
      );
    }

    const { period } = parsed.data;
    const startDate = getStartDate(period);
    const endDate = new Date().toISOString().split('T')[0] ?? new Date().toISOString().slice(0, 10);

    logger.debug('Fetching net worth history', { userId, period, startDate, endDate });

    // Fetch snapshots
    const snapshots = await getSnapshots(userId, startDate, endDate);
    const latestSnapshot = await getLatestSnapshot(userId);

    // Transform to response format
    const points: NetWorthHistoryPoint[] = snapshots.map((s) => ({
      date: s.date,
      netWorth: s.netWorth,
      totalAssets: s.totalAssets,
      totalLiabilities: s.totalLiabilities,
    }));

    logger.info('Net worth history retrieved', {
      userId,
      period,
      pointCount: points.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        points,
        period,
        startDate,
        endDate,
        latestSnapshot,
      },
    } as NetWorthHistoryResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching net worth history', { error: errorMessage });

    return NextResponse.json(
      { success: false, error: 'Failed to fetch history' } as NetWorthHistoryResponse,
      { status: 500 }
    );
  }
}
