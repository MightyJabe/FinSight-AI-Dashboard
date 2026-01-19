import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import type { Platform, PlatformTransaction } from '@/types/platform';

const createTransactionSchema = z.object({
  platformId: z.string().min(1),
  type: z.enum(['deposit', 'withdrawal']),
  amount: z.number().positive(),
  date: z.string(),
  description: z.string().optional(),
  sourceAccountId: z.string().optional(),
});

async function verifyAuth(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) {
    throw new Error('No session cookie found');
  }
  const decodedClaims = await auth.verifySessionCookie(sessionCookie);
  return decodedClaims.uid;
}

// GET /api/platform-transactions - Get transactions for a platform
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const platformId = searchParams.get('platformId');

    let query = db
      .collection('users')
      .doc(userId)
      .collection('platformTransactions')
      .orderBy('date', 'desc');

    if (platformId) {
      query = query.where('platformId', '==', platformId) as any;
    }

    const snapshot = await query.get();

    const transactions: PlatformTransaction[] = snapshot.docs.map(
      (doc: any) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as PlatformTransaction
    );

    return NextResponse.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    logger.error('Error fetching platform transactions', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST /api/platform-transactions - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const body = await request.json();

    // Add debugging
    logger.info('Creating platform transaction', { userId, body });

    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) {
      logger.error('Transaction validation failed', { errors: parsed.error.formErrors });
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    // Verify platform exists and belongs to user
    const platformDoc = await db
      .collection('users')
      .doc(userId)
      .collection('platforms')
      .doc(parsed.data.platformId)
      .get();

    if (!platformDoc.exists) {
      return NextResponse.json({ success: false, error: 'Platform not found' }, { status: 404 });
    }

    const platform = platformDoc.data() as Platform;

    // Create the transaction
    const transactionData = {
      platformId: parsed.data.platformId,
      type: parsed.data.type,
      amount: parsed.data.amount,
      date: parsed.data.date,
      ...(parsed.data.description &&
        parsed.data.description.trim() && { description: parsed.data.description }),
      ...(parsed.data.sourceAccountId && { sourceAccountId: parsed.data.sourceAccountId }),
      userId,
      createdAt: new Date().toISOString(),
    };

    const transactionRef = await db
      .collection('users')
      .doc(userId)
      .collection('platformTransactions')
      .add(transactionData);

    // Get all transactions for this platform to recalculate metrics
    const transactionsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('platformTransactions')
      .where('platformId', '==', parsed.data.platformId)
      .get();

    const allTransactions: PlatformTransaction[] = transactionsSnapshot.docs.map(
      (doc: any) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as PlatformTransaction
    );

    // Recalculate platform metrics
    const deposits = allTransactions.filter(t => t.type === 'deposit');
    const withdrawals = allTransactions.filter(t => t.type === 'withdrawal');

    const totalDeposited = deposits.reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawn = withdrawals.reduce((sum, t) => sum + t.amount, 0);
    const netInvestment = totalDeposited - totalWithdrawn;
    const netProfit = platform.currentBalance - netInvestment;
    const netProfitPercent = netInvestment > 0 ? (netProfit / netInvestment) * 100 : 0;

    // Update platform with new metrics
    await db
      .collection('users')
      .doc(userId)
      .collection('platforms')
      .doc(parsed.data.platformId)
      .update({
        totalDeposited,
        totalWithdrawn,
        netProfit,
        netProfitPercent,
        updatedAt: new Date().toISOString(),
      });

    const newTransaction: PlatformTransaction = {
      id: transactionRef.id,
      ...transactionData,
    };

    logger.info('Platform transaction created', {
      userId,
      platformId: parsed.data.platformId,
      transactionId: transactionRef.id,
    });

    return NextResponse.json({
      success: true,
      data: newTransaction,
    });
  } catch (error: unknown) {
    logger.error('Error creating platform transaction', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/platform-transactions - Delete a transaction
export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const transactionRef = db
      .collection('users')
      .doc(userId)
      .collection('platformTransactions')
      .doc(id);

    const transactionDoc = await transactionRef.get();
    if (!transactionDoc.exists) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    const transaction = transactionDoc.data() as PlatformTransaction;

    // Delete the transaction
    await transactionRef.delete();

    // Recalculate platform metrics
    const transactionsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('platformTransactions')
      .where('platformId', '==', transaction.platformId)
      .get();

    const remainingTransactions: PlatformTransaction[] = transactionsSnapshot.docs.map(
      (doc: any) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as PlatformTransaction
    );

    const deposits = remainingTransactions.filter(t => t.type === 'deposit');
    const withdrawals = remainingTransactions.filter(t => t.type === 'withdrawal');

    const totalDeposited = deposits.reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawn = withdrawals.reduce((sum, t) => sum + t.amount, 0);

    // Get platform current balance
    const platformDoc = await db
      .collection('users')
      .doc(userId)
      .collection('platforms')
      .doc(transaction.platformId)
      .get();

    if (platformDoc.exists) {
      const platform = platformDoc.data() as Platform;
      const netInvestment = totalDeposited - totalWithdrawn;
      const netProfit = platform.currentBalance - netInvestment;
      const netProfitPercent = netInvestment > 0 ? (netProfit / netInvestment) * 100 : 0;

      await platformDoc.ref.update({
        totalDeposited,
        totalWithdrawn,
        netProfit,
        netProfitPercent,
        updatedAt: new Date().toISOString(),
      });
    }

    logger.info('Platform transaction deleted', {
      userId,
      platformId: transaction.platformId,
      transactionId: id,
    });

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting platform transaction', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
