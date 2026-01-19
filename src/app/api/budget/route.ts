import { formatISO, startOfMonth } from 'date-fns';
import { NextResponse } from 'next/server';

import { validateAuthToken } from '@/lib/auth-server';
import logger from '@/lib/logger';
import { getTransactions } from '@/lib/plaid';
import { getPlaidAccessToken } from '@/lib/plaid-token-helper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @deprecated Use /api/financial-overview instead for better performance and consistency
 */
export async function GET(request: Request) {
  try {
    const authResult = await validateAuthToken(request);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId!;

    const accessToken = await getPlaidAccessToken(userId);

    let monthlyExpenses = 0;
    let spendingByCategory: { category: string; amount: number; budget?: number }[] = [];
    let budgetCategories: { name: string; budgeted: number; spent: number }[] = [];

    if (accessToken) {
      const endDate = formatISO(new Date(), { representation: 'date' });
      const startDate = formatISO(startOfMonth(new Date()), { representation: 'date' });
      const transactions = await getTransactions(accessToken, startDate, endDate);

      const expenses = transactions.filter(txn => txn.amount < 0);
      monthlyExpenses = expenses.reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

      const categoryMap = new Map<string, number>();
      expenses.forEach(txn => {
        const category = txn.category?.[0] || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + Math.abs(txn.amount));
      });

      spendingByCategory = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({
          category,
          amount,
        }))
        .sort((a, b) => b.amount - a.amount);

      const defaultBudgets = [
        { name: 'Food and Drink', budgeted: monthlyExpenses * 0.15 },
        { name: 'Transportation', budgeted: monthlyExpenses * 0.12 },
        { name: 'Shops', budgeted: monthlyExpenses * 0.1 },
        { name: 'Recreation', budgeted: monthlyExpenses * 0.08 },
        { name: 'Healthcare', budgeted: monthlyExpenses * 0.05 },
      ];

      budgetCategories = defaultBudgets.map(budget => ({
        name: budget.name,
        budgeted: budget.budgeted,
        spent: spendingByCategory.find(s => s.category === budget.name)?.amount || 0,
      }));
    }

    return NextResponse.json({
      monthlyExpenses,
      budgetCategories,
      spendingByCategory: spendingByCategory.slice(0, 10),
      totalCategories: spendingByCategory.length,
    });
  } catch (error) {
    logger.error('Error fetching budget data', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/budget',
      method: 'GET',
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch budget data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
