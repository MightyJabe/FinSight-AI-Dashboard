import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateAuthToken } from '@/lib/auth-server';
import logger from '@/lib/logger';
import {
  analyzeExpenses,
  generatePersonalizedRecommendations,
} from '@/lib/services/expense-optimizer';
import { getTransactionService } from '@/lib/services/transaction-service';

const querySchema = z.object({
  days: z.coerce.number().min(7).max(365).default(30),
  savingsGoal: z.coerce.number().min(5).max(50).default(20),
});

/**
 * GET /api/insights/expense-analysis
 * Analyze user expenses and provide optimization recommendations
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }

    // Parse query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const parsed = querySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    const { days, savingsGoal } = parsed.data;

    // Fetch user transactions
    const transactionService = getTransactionService(authResult.userId);
    const transactions = await transactionService.getTransactions(days);

    // Get user's monthly income (from financial overview)
    const { getFinancialOverview } = await import('@/lib/financial-calculator');
    const { metrics } = await getFinancialOverview(authResult.userId);
    const monthlyIncome = metrics.monthlyIncome || 15000; // Default fallback

    // Transform transactions to expected format
    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      amount: t.amount,
      date: typeof t.date === 'string' ? t.date : new Date().toISOString(),
      description: t.description || 'Unknown',
      category: t.category || 'Other',
      type: t.type as 'income' | 'expense',
    }));

    // Analyze expenses
    const analysis = await analyzeExpenses(
      formattedTransactions,
      monthlyIncome,
      savingsGoal
    );

    // Generate AI recommendations
    const aiRecommendations = await generatePersonalizedRecommendations(analysis);

    logger.info('Expense analysis generated', {
      userId: authResult.userId,
      transactionCount: transactions.length,
      opportunityCount: analysis.opportunities.length,
      projectedSavings: analysis.projectedSavings,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...analysis,
        aiRecommendations,
        analyzedDays: days,
        monthlyIncome,
      },
    });
  } catch (error) {
    logger.error('Error in GET /api/insights/expense-analysis', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to analyze expenses' },
      { status: 500 }
    );
  }
}
