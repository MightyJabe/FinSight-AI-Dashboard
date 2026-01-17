import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateAuthToken } from '@/lib/auth-server';
import { adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import {
  analyzeExpenses,
  type Transaction,
} from '@/lib/services/expense-optimizer';

const querySchema = z.object({
  months: z.coerce.number().min(1).max(12).default(3),
  savingsGoalPercent: z.coerce.number().min(5).max(50).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    // Parse query params
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const parsed = querySchema.safeParse(searchParams);

    const months = parsed.success ? parsed.data.months : 3;
    const savingsGoalPercent = parsed.success ? parsed.data.savingsGoalPercent : 20;

    // Calculate date range
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Fetch transactions
    const transactionsSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .where('date', '>=', startDate.toISOString().split('T')[0])
      .orderBy('date', 'desc')
      .limit(1000)
      .get();

    const transactions: Transaction[] = transactionsSnapshot.docs.map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: Math.abs(data.amount || 0),
          date: data.date || '',
          description: data.description || data.name || '',
          category: data.category || 'Other',
          type: (data.amount || 0) < 0 ? 'expense' : 'income',
        };
      }
    );

    // Fetch user's monthly income (from settings or calculate from transactions)
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    let monthlyIncome = userData?.monthlyIncome || 0;

    // If no income set, estimate from income transactions
    if (!monthlyIncome) {
      const incomeTransactions = transactions.filter((t) => t.type === 'income');
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
      monthlyIncome = totalIncome / months || 15000; // Default to 15000 ILS if no data
    }

    // Analyze expenses
    const analysis = await analyzeExpenses(transactions, monthlyIncome, savingsGoalPercent);

    logger.info('Expense analysis completed', {
      userId,
      transactionCount: transactions.length,
      opportunityCount: analysis.opportunities.length,
    });

    return NextResponse.json({
      success: true,
      data: analysis,
      meta: {
        months,
        transactionCount: transactions.length,
        monthlyIncome,
        savingsGoalPercent,
      },
    });
  } catch (error) {
    logger.error('Error analyzing expenses', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
