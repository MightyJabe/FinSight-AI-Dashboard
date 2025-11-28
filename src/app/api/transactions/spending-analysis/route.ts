import { NextResponse } from 'next/server';

import { auth, db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const CATEGORY_COLORS = {
  Housing: '#3B82F6',
  Utilities: '#8B5CF6',
  Groceries: '#10B981',
  Transportation: '#F59E0B',
  Healthcare: '#EF4444',
  Insurance: '#6366F1',
  'Debt Payments': '#DC2626',
  'Dining Out': '#F97316',
  Entertainment: '#EC4899',
  Shopping: '#8B5CF6',
  Travel: '#06B6D4',
  'Fitness & Health': '#84CC16',
  Education: '#6366F1',
  'Personal Care': '#F472B6',
  Savings: '#059669',
  Investments: '#0D9488',
  Transfers: '#6B7280',
  'Bank Fees': '#DC2626',
  'Gifts & Donations': '#F59E0B',
  'Business Expenses': '#7C3AED',
  Taxes: '#EF4444',
  Uncategorized: '#9CA3AF',
  Salary: '#10B981',
  'Freelance Income': '#06B6D4',
  'Investment Returns': '#059669',
  'Rental Income': '#0D9488',
  'Business Income': '#7C3AED',
  'Government Benefits': '#6366F1',
  'Gifts Received': '#F59E0B',
  'Other Income': '#8B5CF6',
} as const;

/**
 * Get spending analysis from categorized transactions
 */
export async function GET(request: Request) {
  try {
    // Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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

    // Get categorized transactions
    const categorizedSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('categorizedTransactions')
      .get();

    if (categorizedSnapshot.empty) {
      return NextResponse.json({
        success: true,
        data: {
          totalSpent: 0,
          totalIncome: 0,
          netCashFlow: 0,
          categories: [],
          period: 'Last 90 days',
        },
      });
    }

    // Process transactions
    const categoryData = new Map<
      string,
      {
        amount: number;
        count: number;
        type: 'income' | 'expense';
      }
    >();

    let totalIncome = 0;
    let totalExpenses = 0;

    categorizedSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      const category = data.aiCategory;
      const amount = Math.abs(data.amount);
      const type = data.type as 'income' | 'expense';

      if (type === 'income') {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
      }

      if (categoryData.has(category)) {
        const existing = categoryData.get(category)!;
        existing.amount += amount;
        existing.count += 1;
      } else {
        categoryData.set(category, {
          amount,
          count: 1,
          type,
        });
      }
    });

    // Convert to array and sort by amount
    const categories = Array.from(categoryData.entries())
      .map(([category, data]) => ({
        category,
        amount: data.type === 'expense' ? -data.amount : data.amount, // Negative for expenses
        percentage:
          data.type === 'expense'
            ? (data.amount / totalExpenses) * 100
            : (data.amount / totalIncome) * 100,
        transactionCount: data.count,
        color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#9CA3AF',
      }))
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

    const netCashFlow = totalIncome - totalExpenses;

    return NextResponse.json({
      success: true,
      data: {
        totalSpent: -totalExpenses, // Negative to show as expense
        totalIncome,
        netCashFlow,
        categories,
        period: 'Last 90 days',
      },
    });
  } catch (error) {
    logger.error('Error in spending analysis API', { error });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
