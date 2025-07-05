import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase-admin';
import { categorizeTransactionsBatch } from '@/lib/ai-categorization';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const categorizeSchema = z.object({
  transactions: z.array(z.object({
    id: z.string(),
    amount: z.number(),
    description: z.string(),
    date: z.string(),
    originalCategory: z.array(z.string()).optional(),
    merchant_name: z.string().optional(),
    payment_channel: z.string().optional(),
  })).optional(),
  accountId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * Categorize transactions using AI
 */
export async function POST(request: Request) {
  try {
    // Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Missing token' },
        { status: 401 }
      );
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid user ID' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = categorizeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { 
          success: false, 
          errors: parsed.error.formErrors.fieldErrors 
        },
        { status: 400 }
      );
    }

    const { transactions: inputTransactions, accountId, startDate, endDate } = parsed.data;
    let transactionsToProcess: Array<{
      id: string;
      amount: number;
      description: string;
      date: string;
      originalCategory?: string[] | undefined;
      merchant_name?: string | undefined;
      payment_channel?: string | undefined;
    }> = [];

    // If transactions are provided directly, use them
    if (inputTransactions && inputTransactions.length > 0) {
      transactionsToProcess = inputTransactions;
    } else {
      // Fetch transactions from Plaid API and any stored manual transactions
      const [plaidResponse, manualResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/plaid/transactions`, {
          headers: {
            Authorization: authHeader,
          },
        }),
        db.collection('users').doc(userId).collection('manualTransactions').get(),
      ]);

      const allTransactions = [];

      // Process Plaid transactions
      if (plaidResponse.ok) {
        const plaidData = await plaidResponse.json();
        const plaidTransactions = plaidData.transactions.map((txn: any) => ({
          id: txn.transaction_id,
          amount: txn.amount,
          description: txn.name,
          date: txn.date,
          originalCategory: txn.category || undefined,
          merchant_name: undefined,
          payment_channel: txn.payment_channel || undefined,
        }));
        allTransactions.push(...plaidTransactions);
      }

      // Process manual transactions
      if (!manualResponse.empty) {
        const manualTransactions = manualResponse.docs.map((doc: any) => {
          const data = doc.data();
          return {
            id: doc.id,
            amount: data.type === 'income' ? -Math.abs(data.amount) : Math.abs(data.amount),
            description: data.description,
            date: data.date,
            originalCategory: data.category ? [data.category] : undefined,
            merchant_name: undefined,
            payment_channel: undefined,
          };
        });
        allTransactions.push(...manualTransactions);
      }

      // Apply filters if provided
      transactionsToProcess = allTransactions.filter(txn => {
        if (accountId && txn.account_id !== accountId) return false;
        if (startDate && txn.date < startDate) return false;
        if (endDate && txn.date > endDate) return false;
        return true;
      });

      if (transactionsToProcess.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            categorizedTransactions: [],
            summary: {
              total: 0,
              categorized: 0,
              failed: 0
            }
          }
        });
      }
    }

    if (transactionsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          categorizedTransactions: [],
          summary: {
            total: 0,
            categorized: 0,
            failed: 0
          }
        }
      });
    }

    logger.info('Starting AI categorization', { 
      userId, 
      transactionCount: transactionsToProcess.length 
    });

    // Process transactions with AI categorization
    const categorizedTransactions = await categorizeTransactionsBatch(transactionsToProcess);
    
    // Store categorized transactions in a dedicated collection
    const batch = db.batch();
    let categorizedCount = 0;
    let failedCount = 0;

    for (const categorizedTx of categorizedTransactions) {
      try {
        const docRef = db
          .collection('users')
          .doc(userId)
          .collection('categorizedTransactions')
          .doc(categorizedTx.id);

        batch.set(docRef, {
          originalTransactionId: categorizedTx.id,
          amount: categorizedTx.amount,
          description: categorizedTx.description,
          date: categorizedTx.date,
          originalCategory: categorizedTx.originalCategory,
          aiCategory: categorizedTx.aiCategory,
          aiConfidence: categorizedTx.aiConfidence,
          aiReasoning: categorizedTx.reasoning,
          type: categorizedTx.type,
          aiCategorizedAt: new Date().toISOString(),
        }, { merge: true });

        categorizedCount++;
      } catch (error) {
        logger.error('Failed to store categorized transaction', { 
          error, 
          transactionId: categorizedTx.id 
        });
        failedCount++;
      }
    }

    // Commit the batch update
    await batch.commit();

    logger.info('AI categorization completed', {
      userId,
      total: transactionsToProcess.length,
      categorized: categorizedCount,
      failed: failedCount
    });

    return NextResponse.json({
      success: true,
      data: {
        categorizedTransactions,
        summary: {
          total: transactionsToProcess.length,
          categorized: categorizedCount,
          failed: failedCount
        }
      }
    });

  } catch (error) {
    logger.error('Error in AI categorization API', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get categorization status for user's transactions
 */
export async function GET(request: Request) {
  try {
    // Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Missing token' },
        { status: 401 }
      );
    }
    
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid user ID' },
        { status: 401 }
      );
    }

    // Get categorization statistics from both Plaid and manual transactions
    const [plaidResponse, manualResponse, categorizedResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/plaid/transactions`, {
        headers: {
          Authorization: authHeader,
        },
      }),
      db.collection('users').doc(userId).collection('manualTransactions').get(),
      db.collection('users').doc(userId).collection('categorizedTransactions').get(),
    ]);

    let total = 0;
    let categorized = 0;
    const categorizedTransactionIds = new Set();

    // Count categorized transactions
    if (!categorizedResponse.empty) {
      categorizedResponse.docs.forEach(doc => {
        categorizedTransactionIds.add(doc.data().originalTransactionId || doc.id);
        categorized++;
      });
    }

    // Count total transactions from Plaid
    if (plaidResponse.ok) {
      const plaidData = await plaidResponse.json();
      total += plaidData.transactions.length;
    }

    // Count manual transactions
    total += manualResponse.size;

    const uncategorized = Math.max(0, total - categorized);
    const percentage = total > 0 ? Math.round((categorized / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        total,
        categorized,
        uncategorized,
        percentage
      }
    });

  } catch (error) {
    logger.error('Error fetching categorization status', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}