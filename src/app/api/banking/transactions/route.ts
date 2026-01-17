import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

// Validation schema for query parameters
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(500).default(100),
  cursor: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Get userId from session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { adminAuth } = await import('@/lib/firebase-admin');
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedClaims.uid;

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = querySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    const { limit, cursor, startDate, endDate } = parsed.data;

    // Build query with pagination
    let query = adminDb
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .orderBy('date', 'desc')
      .limit(limit);

    // Apply date filters if provided
    if (startDate) {
      query = query.where('date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('date', '<=', endDate);
    }

    // Apply cursor for pagination
    if (cursor) {
      try {
        const cursorDoc = await adminDb
          .collection('users')
          .doc(userId)
          .collection('transactions')
          .doc(cursor)
          .get();

        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      } catch (cursorError) {
        logger.warn('Invalid cursor provided', { cursor, error: cursorError });
        // Continue without cursor if invalid
      }
    }

    const transactionsSnapshot = await query.get();

    const transactions = transactionsSnapshot.docs.map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        return {
          transaction_id: doc.id,
          id: doc.id,
          date: data.date || '',
          name: data.description || data.memo || 'Unknown',
          description: data.description || data.memo || 'Unknown',
          amount: data.chargedAmount || data.originalAmount || 0,
          originalAmount: data.originalAmount || data.chargedAmount || 0,
          originalCurrency: data.originalCurrency || 'ILS',
          chargedCurrency: data.chargedCurrency || 'ILS',
          category: data.category || 'Uncategorized',
          type: (data.chargedAmount || data.originalAmount || 0) > 0 ? 'income' : 'expense',
          account_name: data.institutionName || data.accountName || 'Israeli Bank',
          account_id: data.accountId || '',
          institutionName: data.institutionName || 'Israeli Bank',
          source: 'israel',
          status: data.status || 'completed',
          processedDate: data.processedDate || data.date || '',
        };
      }
    );

    // Determine next cursor for pagination
    const lastDoc = transactionsSnapshot.docs[transactionsSnapshot.docs.length - 1];
    const nextCursor =
      transactionsSnapshot.docs.length === limit && lastDoc ? lastDoc.id : null;

    // Check if there are more results
    const hasMore = transactionsSnapshot.docs.length === limit;

    logger.debug('Fetched transactions with pagination', {
      userId,
      count: transactions.length,
      hasMore,
      cursor: cursor || 'none',
    });

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
      pagination: {
        limit,
        nextCursor,
        hasMore,
      },
    });
  } catch (error) {
    logger.error('Error fetching Israeli transactions:', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
