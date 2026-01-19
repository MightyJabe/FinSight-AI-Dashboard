import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import type {
  Platform,
  PlatformSummary,
  PlatformTransaction,
  PlatformWithTransactions,
} from '@/types/platform';

const createPlatformSchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    'stock_broker',
    'crypto_exchange',
    'real_estate',
    'bank_investment',
    'retirement',
    'crowdfunding',
    'forex',
    'other',
  ]),
  currency: z.enum(['USD', 'EUR', 'GBP', 'ILS', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'Other']),
  currentBalance: z.number().optional().default(0),
  notes: z.string().optional(),
});

async function verifyAuth(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) {
    logger.error('No session cookie found in request');
    throw new Error('No session cookie found');
  }
  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie);
    logger.info('Session verified for user', { uid: decodedClaims.uid });
    return decodedClaims.uid;
  } catch (error) {
    logger.error('Failed to verify session cookie', { error });
    throw new Error('Invalid session');
  }
}

function calculatePlatformMetrics(
  platform: Platform,
  transactions: PlatformTransaction[]
): Platform {
  const deposits = transactions.filter(t => t.type === 'deposit');
  const withdrawals = transactions.filter(t => t.type === 'withdrawal');

  const totalDeposited = deposits.reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawn = withdrawals.reduce((sum, t) => sum + t.amount, 0);
  const netInvestment = totalDeposited - totalWithdrawn;
  const netProfit = platform.currentBalance - netInvestment;
  const netProfitPercent = netInvestment > 0 ? (netProfit / netInvestment) * 100 : 0;

  return {
    ...platform,
    totalDeposited,
    totalWithdrawn,
    netProfit,
    netProfitPercent,
  };
}

// GET /api/platforms - Get all platforms with summary
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);

    const [platformsSnapshot, transactionsSnapshot] = await Promise.all([
      db.collection('users').doc(userId).collection('platforms').get(),
      db.collection('users').doc(userId).collection('platformTransactions').get(),
    ]);

    const platforms: Platform[] = platformsSnapshot.docs.map(
      (doc: any) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Platform
    );

    const allTransactions: PlatformTransaction[] = transactionsSnapshot.docs.map(
      (doc: any) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as PlatformTransaction
    );

    // Group transactions by platform
    const transactionsByPlatform = allTransactions.reduce(
      (acc, transaction) => {
        if (!acc[transaction.platformId]) {
          acc[transaction.platformId] = [];
        }
        acc[transaction.platformId]!.push(transaction);
        return acc;
      },
      {} as Record<string, PlatformTransaction[]>
    );

    // Calculate metrics for each platform
    const platformsWithMetrics = platforms.map(platform => {
      const platformTransactions = transactionsByPlatform[platform.id] || [];
      return calculatePlatformMetrics(platform, platformTransactions);
    });

    const platformsWithTransactions: PlatformWithTransactions[] = platformsWithMetrics.map(
      platform => {
        const transactions = transactionsByPlatform[platform.id] || [];
        const sortedTransactions = transactions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const result: PlatformWithTransactions = {
          ...platform,
          transactions: sortedTransactions,
          transactionCount: transactions.length,
        };

        if (sortedTransactions.length > 0) {
          result.lastTransaction = sortedTransactions[0]!;
        }

        return result;
      }
    );

    // Calculate summary
    const summary: PlatformSummary = {
      totalBalance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      totalProfit: 0,
      totalProfitPercent: 0,
      platformCount: platformsWithTransactions.length,
      platforms: platformsWithTransactions,
      byType: {} as any,
      byCurrency: {} as any,
    };

    platformsWithTransactions.forEach(platform => {
      summary.totalBalance += platform.currentBalance;
      summary.totalDeposited += platform.totalDeposited;
      summary.totalWithdrawn += platform.totalWithdrawn;
      summary.totalProfit += platform.netProfit;

      // By type breakdown
      if (!summary.byType[platform.type]) {
        summary.byType[platform.type] = {
          balance: 0,
          deposited: 0,
          withdrawn: 0,
          profit: 0,
          profitPercent: 0,
          count: 0,
        };
      }
      summary.byType[platform.type].balance += platform.currentBalance;
      summary.byType[platform.type].deposited += platform.totalDeposited;
      summary.byType[platform.type].withdrawn += platform.totalWithdrawn;
      summary.byType[platform.type].profit += platform.netProfit;
      summary.byType[platform.type].count += 1;

      // By currency breakdown
      if (!summary.byCurrency[platform.currency]) {
        summary.byCurrency[platform.currency] = {
          balance: 0,
          deposited: 0,
          withdrawn: 0,
          profit: 0,
        };
      }
      summary.byCurrency[platform.currency].balance += platform.currentBalance;
      summary.byCurrency[platform.currency].deposited += platform.totalDeposited;
      summary.byCurrency[platform.currency].withdrawn += platform.totalWithdrawn;
      summary.byCurrency[platform.currency].profit += platform.netProfit;
    });

    // Calculate percentages
    const totalInvestment = summary.totalDeposited - summary.totalWithdrawn;
    summary.totalProfitPercent =
      totalInvestment > 0 ? (summary.totalProfit / totalInvestment) * 100 : 0;

    Object.keys(summary.byType).forEach(type => {
      const typeData = summary.byType[type as keyof typeof summary.byType];
      const typeInvestment = typeData.deposited - typeData.withdrawn;
      typeData.profitPercent = typeInvestment > 0 ? (typeData.profit / typeInvestment) * 100 : 0;
    });

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Error fetching platforms', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch platforms' },
      { status: 500 }
    );
  }
}

// POST /api/platforms - Create a new platform
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const body = await request.json();

    // Add debugging
    logger.info('Creating platform', { userId, body });

    const parsed = createPlatformSchema.safeParse(body);
    if (!parsed.success) {
      logger.error('Platform validation failed', { errors: parsed.error.formErrors });
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    const currentBalance = parsed.data.currentBalance ?? 0;

    const platformData = {
      name: parsed.data.name,
      type: parsed.data.type,
      currency: parsed.data.currency,
      currentBalance,
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
      userId,
      totalDeposited: 0,
      totalWithdrawn: 0,
      netProfit: currentBalance,
      netProfitPercent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db
      .collection('users')
      .doc(userId)
      .collection('platforms')
      .add(platformData);

    const newPlatform: Platform = {
      id: docRef.id,
      ...platformData,
    };

    logger.info('Platform created', { userId, platformId: docRef.id });

    return NextResponse.json({
      success: true,
      data: newPlatform,
    });
  } catch (error: unknown) {
    logger.error('Error creating platform', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create platform',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/platforms - Update a platform
export async function PUT(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const body = await request.json();

    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Platform ID is required' },
        { status: 400 }
      );
    }

    const docRef = db.collection('users').doc(userId).collection('platforms').doc(id);

    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Platform not found' }, { status: 404 });
    }

    // Get transactions to recalculate metrics
    const transactionsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('platformTransactions')
      .where('platformId', '==', id)
      .get();

    const transactions: PlatformTransaction[] = transactionsSnapshot.docs.map(
      (doc: any) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as PlatformTransaction
    );

    const updatedPlatformData = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updatedPlatformData);

    const updated = await docRef.get();
    const platform: Platform = {
      id: updated.id,
      ...updated.data(),
    } as Platform;

    const platformWithMetrics = calculatePlatformMetrics(platform, transactions);

    logger.info('Platform updated', { userId, platformId: id });

    return NextResponse.json({
      success: true,
      data: platformWithMetrics,
    });
  } catch (error) {
    logger.error('Error updating platform', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to update platform' },
      { status: 500 }
    );
  }
}

// DELETE /api/platforms - Delete a platform
export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Platform ID is required' },
        { status: 400 }
      );
    }

    const docRef = db.collection('users').doc(userId).collection('platforms').doc(id);

    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Platform not found' }, { status: 404 });
    }

    // Delete all transactions for this platform
    const transactionsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('platformTransactions')
      .where('platformId', '==', id)
      .get();

    const batch = db.batch();
    transactionsSnapshot.docs.forEach((doc: any) => {
      batch.delete(doc.ref);
    });

    // Delete the platform
    batch.delete(docRef);

    await batch.commit();

    logger.info('Platform deleted', { userId, platformId: id });

    return NextResponse.json({
      success: true,
      message: 'Platform and all transactions deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting platform', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to delete platform' },
      { status: 500 }
    );
  }
}
