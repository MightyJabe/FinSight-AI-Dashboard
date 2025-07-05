import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { generateCashFlowForecast } from '@/lib/cash-flow-forecasting';
import { auth } from '@/lib/firebase-admin';
import { getDisplayableAccounts } from '@/lib/finance';
import logger from '@/lib/logger';
import type { Transaction } from '@/types/finance';

/**
 * Convert internal TransactionData to Transaction type
 */
function convertToTransaction(data: TransactionData): Transaction {
  return {
    id: data.id,
    date: data.date,
    description: data.description,
    amount: data.amount,
    category: data.category,
    account: data.account,
    accountId: data.accountId,
    type: data.type,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

const querySchema = z.object({
  months: z.string().nullable().optional(),
  includeRecurring: z.string().nullable().optional(),
});


interface ManualTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
}

interface TransactionData {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account: string;
  accountId: string;
  type: 'income' | 'expense';
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

/**
 * GET /api/cash-flow-forecast - Generate cash flow predictions
 */
export async function GET(request: NextRequest) {
  try {
    // Extract and validate authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 401 }
      );
    }
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid user token' },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      months: searchParams.get('months'),
      includeRecurring: searchParams.get('includeRecurring'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: parsed.error.formErrors.fieldErrors 
        },
        { status: 400 }
      );
    }

    const { months: monthsStr, includeRecurring: includeRecurringStr } = parsed.data;
    
    // Manual transformation after validation
    const months = monthsStr && monthsStr !== 'null' ? parseInt(monthsStr) : 6;
    const includeRecurring = includeRecurringStr === 'true';

    // Validate months parameter
    if (months < 1 || months > 24) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Months must be between 1 and 24' 
        },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 401 }
      );
    }

    logger.info('Generating cash flow forecast', {
      userId,
      months,
      includeRecurring,
    });

    // Get current account balances for baseline
    const accounts = await getDisplayableAccounts();

    // Calculate current liquid balance
    const currentBalance = accounts
      .filter(account => account.source === 'linked' || account.type === 'Cash')
      .reduce((sum, account) => sum + account.currentBalance, 0);

    // Fetch transaction data
    const transactions = await fetchUserTransactions(userId);

    // Convert transactions to the expected format
    const convertedTransactions = transactions.map(convertToTransaction);

    // Generate cash flow forecast
    const forecast = generateCashFlowForecast(
      convertedTransactions,
      currentBalance,
      months
    );

    // Add additional insights if requested
    if (includeRecurring) {
      // The forecast already includes recurring transaction analysis
      logger.info('Including recurring transaction analysis in forecast', {
        userId,
        recurringCount: forecast.insights.recurringTransactions
      });
    }

    logger.info('Cash flow forecast generated successfully', {
      userId,
      forecastMonths: forecast.predictions.length,
      avgConfidence: forecast.predictions.reduce((sum, p) => sum + p.confidence, 0) / forecast.predictions.length
    });

    return NextResponse.json({
      success: true,
      data: forecast,
    });

  } catch (error) {
    logger.error('Error generating cash flow forecast', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate cash flow forecast' 
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch all transactions for a user (both Plaid and manual)
 */
async function fetchUserTransactions(userId: string): Promise<TransactionData[]> {
  try {
    const db = (await import('@/lib/firebase-admin')).db;
    
    // Fetch manual transactions
    const manualTransactionsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .orderBy('date', 'desc')
      .limit(500) // Limit to recent transactions for performance
      .get();

    const manualTransactions: TransactionData[] = manualTransactionsSnapshot.docs.map(doc => {
      const data = doc.data() as ManualTransaction;
      const transactionDate = data.date ?? new Date().toISOString().split('T')[0];
      return {
        id: doc.id,
        date: transactionDate,
        description: data.description || 'Unknown transaction',
        amount: data.amount,
        category: data.category,
        account: data.accountId,
        accountId: data.accountId,
        type: data.type,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    });

    // Fetch Plaid transactions (you'll need to implement this based on your Plaid integration)
    const plaidTransactions = await fetchPlaidTransactions(userId);

    // Combine all transactions
    const allTransactions = [...manualTransactions, ...plaidTransactions];

    // Sort by date (most recent first)
    return allTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

  } catch (error) {
    logger.error('Error fetching user transactions', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Fetch Plaid transactions for a user
 */
async function fetchPlaidTransactions(userId: string): Promise<TransactionData[]> {
  try {
    const db = (await import('@/lib/firebase-admin')).db;
    
    // Get Plaid items for the user
    const plaidItemsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('plaidItems')
      .get();

    if (plaidItemsSnapshot.empty) {
      return [];
    }

    const { plaidClient } = await import('@/lib/plaid');
    const allTransactions: TransactionData[] = [];

    // Fetch transactions for each Plaid item
    for (const itemDoc of plaidItemsSnapshot.docs) {
      const itemData = itemDoc.data();
      const accessToken = itemData.accessToken;

      if (!accessToken) continue;

      try {
        // Get transactions from the last 6 months
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);

        const startDateStr = startDate.toISOString().split('T')[0] as string;
        const endDateStr = endDate.toISOString().split('T')[0] as string;

        const response = await plaidClient.transactionsGet({
          access_token: accessToken,
          start_date: startDateStr,
          end_date: endDateStr,
          options: {
            count: 500,
          },
        });

        // Convert Plaid transactions to our format
        const plaidTransactions: TransactionData[] = response.data.transactions.map(t => {
          const transactionDate = t.date ?? new Date().toISOString().split('T')[0];
          return {
            id: t.transaction_id,
            date: transactionDate,
            description: t.name || 'Unknown transaction',
            amount: t.amount,
            category: t.category?.[0] || 'Uncategorized',
            account: t.account_id,
            accountId: t.account_id,
            type: t.amount > 0 ? 'income' as const : 'expense' as const,
            createdAt: transactionDate,
            updatedAt: transactionDate,
          };
        });

        allTransactions.push(...plaidTransactions);

      } catch (plaidError) {
        logger.warn('Failed to fetch transactions for Plaid item', {
          userId,
          itemId: itemDoc.id,
          error: plaidError instanceof Error ? plaidError.message : 'Unknown error',
        });
        // Continue with other items
      }
    }

    return allTransactions;

  } catch (error) {
    logger.error('Error fetching Plaid transactions', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return []; // Return empty array on error to not break the forecast
  }
}