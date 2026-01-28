import { NextResponse } from 'next/server';

import { getCategoryHexColor } from '@/lib/constants';
import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Simple in-memory cache for spending analysis
const cache = new Map<string, { data: unknown; timestamp: number }>();

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

    // Temporarily disable cache to debug
    // const cacheKey = `spending-analysis-${userId}`;
    // const cached = cache.get(cacheKey);
    // if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    //   return NextResponse.json(cached.data);
    // }
    const cacheKey = `spending-analysis-${userId}`;
    logger.info('Spending analysis request', { userId });

    // Get categorized transactions
    const categorizedSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('categorizedTransactions')
      .get();

    // Also get Israeli bank transactions
    const israeliTxSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .get();

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

    // Track processed transaction IDs to prevent double counting
    const processedIds = new Set<string>();

    // Process categorized transactions (these are already AI-enhanced)
    categorizedSnapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      const txId = data.originalTransactionId || doc.id;

      // Skip if already processed
      if (processedIds.has(txId)) return;
      processedIds.add(txId);

      const category = data.aiCategory || 'Uncategorized';
      const amount = Math.abs(data.amount || 0);
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

    // Process Israeli bank transactions (not yet categorized by AI)
    israeliTxSnapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      const txId = doc.id;

      // Skip if already processed from categorized transactions
      if (processedIds.has(txId)) return;
      processedIds.add(txId);

      // Israeli transactions are stored with 'amount' field by IsraelClient
      // Fallback to chargedAmount/originalAmount for older data
      const rawAmount = data.amount || data.chargedAmount || data.originalAmount || 0;
      const amount = Math.abs(rawAmount);
      const type = rawAmount > 0 ? 'income' : 'expense';
      const category = data.category || 'Uncategorized';

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

    logger.info('Spending analysis totals', {
      categorizedCount: categorizedSnapshot.docs.length,
      israeliCount: israeliTxSnapshot.docs.length,
      totalIncome,
      totalExpenses,
    });

    // Convert to array and sort by amount
    const categories = Array.from(categoryData.entries())
      .map(([category, data]) => ({
        category,
        amount: data.type === 'expense' ? -data.amount : data.amount, // Negative for expenses
        percentage:
          data.type === 'expense'
            ? totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0
            : totalIncome > 0 ? (data.amount / totalIncome) * 100 : 0,
        transactionCount: data.count,
        color: getCategoryHexColor(category),
      }))
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

    const netCashFlow = totalIncome - totalExpenses;

    // Determine dominant currency (ILS if Israeli transactions, USD otherwise)
    const dominantCurrency = israeliTxSnapshot.docs.length > categorizedSnapshot.docs.length ? 'ILS' : 'USD';

    const responseData = {
      success: true,
      data: {
        totalSpent: -totalExpenses, // Negative to show as expense
        totalIncome,
        netCashFlow,
        categories,
        period: 'Last 90 days',
        currency: dominantCurrency,
      },
    };

    // Cache the result
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('Error in spending analysis API', { error });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
