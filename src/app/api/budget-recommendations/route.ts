import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { generateBudgetRecommendations } from '@/lib/budget-recommendations';
import { auth } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import type { Transaction } from '@/types/finance';

const querySchema = z.object({
  includeAlerts: z.string().nullable().optional(),
  monthlyIncome: z.string().nullable().optional(),
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

/**
 * GET /api/budget-recommendations - Generate AI-powered budget recommendations and alerts
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
    const queryParams = {
      includeAlerts: searchParams.get('includeAlerts'),
      monthlyIncome: searchParams.get('monthlyIncome'),
    };
    
    logger.info('Query parameters received', { queryParams });
    
    const parsed = querySchema.safeParse(queryParams);

    if (!parsed.success) {
      logger.error('Query parameter validation failed', {
        queryParams,
        errors: parsed.error.issues,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: parsed.error.issues 
        },
        { status: 400 }
      );
    }

    const { includeAlerts: includeAlertsStr, monthlyIncome: monthlyIncomeStr } = parsed.data;
    
    // Manual transformation after validation
    const includeAlerts = includeAlertsStr === 'true';
    const monthlyIncome = monthlyIncomeStr && monthlyIncomeStr !== 'null' ? parseFloat(monthlyIncomeStr) : undefined;

    logger.info('Generating budget recommendations', {
      userId,
      includeAlerts,
      monthlyIncome,
    });

    // Fetch user's transaction and budget data
    const [transactions, currentBudgets, calculatedIncome] = await Promise.all([
      fetchUserTransactions(userId),
      fetchUserBudgets(userId),
      monthlyIncome ? Promise.resolve(monthlyIncome) : calculateMonthlyIncome(userId),
    ]);

    // Generate AI-powered budget recommendations
    const analysis = generateBudgetRecommendations(
      transactions.map(convertToTransaction),
      currentBudgets,
      calculatedIncome
    );

    // Filter alerts if not requested
    if (!includeAlerts) {
      analysis.alerts = [];
    }

    logger.info('Budget recommendations generated successfully', {
      userId,
      recommendationCount: analysis.recommendedAllocations.length,
      alertCount: analysis.alerts.length,
      potentialSavings: analysis.recommendedAllocations.reduce(
        (sum, rec) => sum + rec.potentialSavings, 0
      ),
    });

    return NextResponse.json({
      success: true,
      data: analysis,
    });

  } catch (error) {
    logger.error('Error generating budget recommendations', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate budget recommendations' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/budget-recommendations - Update budget based on recommendations
 */
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const updateSchema = z.object({
      budgets: z.record(z.string(), z.number().min(0)),
      acceptedRecommendations: z.array(z.string()).optional(),
    });

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request body',
          details: parsed.error.formErrors.fieldErrors 
        },
        { status: 400 }
      );
    }

    const { budgets, acceptedRecommendations } = parsed.data;

    // Update user's budgets in Firebase
    await updateUserBudgets(userId, budgets);

    // Log accepted recommendations for analytics
    if (acceptedRecommendations && acceptedRecommendations.length > 0) {
      logger.info('User accepted budget recommendations', {
        userId,
        acceptedCount: acceptedRecommendations.length,
        categories: acceptedRecommendations,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Budget updated successfully',
    });

  } catch (error) {
    logger.error('Error updating budget', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update budget' 
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
    
    // Fetch manual transactions from the last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const manualTransactionsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .where('date', '>=', threeMonthsAgo.toISOString().split('T')[0])
      .orderBy('date', 'desc')
      .limit(1000)
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

    // Fetch Plaid transactions
    const plaidTransactions = await fetchPlaidTransactions(userId);

    // Combine all transactions
    const allTransactions = [...manualTransactions, ...plaidTransactions];

    // Sort by date (most recent first)
    return allTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

  } catch (error) {
    logger.error('Error fetching user transactions for budget analysis', {
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

    // Fetch transactions for each Plaid item from the last 3 months
    for (const itemDoc of plaidItemsSnapshot.docs) {
      const itemData = itemDoc.data();
      const accessToken = itemData.accessToken;

      if (!accessToken) continue;

      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);

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
            amount: Math.abs(t.amount), // Ensure positive amounts for analysis
            category: t.category?.[0] || 'Uncategorized',
            account: t.account_id,
            accountId: t.account_id,
            type: t.amount > 0 ? 'expense' as const : 'income' as const, // Plaid uses positive for expenses
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
    logger.error('Error fetching Plaid transactions for budget analysis', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return []; // Return empty array on error to not break the analysis
  }
}

/**
 * Fetch user's current budget settings
 */
async function fetchUserBudgets(userId: string): Promise<{ [category: string]: number }> {
  try {
    const db = (await import('@/lib/firebase-admin')).db;
    
    const budgetDoc = await db
      .collection('users')
      .doc(userId)
      .collection('settings')
      .doc('budgets')
      .get();

    if (!budgetDoc.exists) {
      return {};
    }

    const budgetData = budgetDoc.data();
    return budgetData?.categories || {};

  } catch (error) {
    logger.error('Error fetching user budgets', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {};
  }
}

/**
 * Update user's budget settings
 */
async function updateUserBudgets(userId: string, budgets: { [category: string]: number }): Promise<void> {
  try {
    const db = (await import('@/lib/firebase-admin')).db;
    
    await db
      .collection('users')
      .doc(userId)
      .collection('settings')
      .doc('budgets')
      .set({
        categories: budgets,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

    logger.info('User budgets updated successfully', {
      userId,
      categoryCount: Object.keys(budgets).length,
      totalBudget: Object.values(budgets).reduce((sum, amount) => sum + amount, 0),
    });

  } catch (error) {
    logger.error('Error updating user budgets', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Calculate monthly income from transactions
 */
async function calculateMonthlyIncome(userId: string): Promise<number> {
  try {
    const transactions = await fetchUserTransactions(userId);
    
    // Calculate average monthly income from last 3 months
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Estimate monthly income (assuming 3 months of data)
    return totalIncome / 3;

  } catch (error) {
    logger.warn('Error calculating monthly income, using default', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 5000; // Default fallback
  }
}