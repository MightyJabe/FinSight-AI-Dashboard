/**
 * Daily Snapshot Cron Job
 *
 * Creates daily net worth snapshots for all active users.
 * Triggered by Vercel Cron at midnight UTC.
 *
 * Schedule: 0 0 * * * (daily at midnight UTC)
 */

import { NextResponse } from 'next/server';

import { adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { createDailySnapshot } from '@/lib/snapshot-service';

// Cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Get list of active users (users who have logged in within last 30 days)
 */
async function getActiveUsers(): Promise<string[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get users with recent activity
  const usersSnapshot = await db
    .collection('users')
    .where('lastLoginAt', '>=', thirtyDaysAgo)
    .select() // Only get document IDs
    .get();

  return usersSnapshot.docs.map((doc) => doc.id);
}

export async function GET(request: Request) {
  const startTime = Date.now();

  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    logger.warn('Unauthorized cron request', {
      path: '/api/cron/daily-snapshot',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('Starting daily snapshot cron job');

  try {
    const users = await getActiveUsers();
    logger.info('Found active users for snapshot', { count: users.length });

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as Array<{ userId: string; error: string }>,
    };

    // Process users sequentially to avoid overwhelming the database
    for (const userId of users) {
      results.processed++;
      try {
        await createDailySnapshot(userId);
        results.succeeded++;
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({ userId, error: errorMessage });
        logger.error('Snapshot failed for user', { userId, error: errorMessage });
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Daily snapshot cron job completed', {
      ...results,
      durationMs: duration,
    });

    return NextResponse.json({
      success: true,
      ...results,
      durationMs: duration,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Daily snapshot cron job failed', { error: errorMessage });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Allow POST as well for manual triggers
export async function POST(request: Request) {
  return GET(request);
}
