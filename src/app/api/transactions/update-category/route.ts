import { NextResponse } from 'next/server';
import { z } from 'zod';

import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const updateCategorySchema = z.object({
  transactionId: z.string(),
  category: z.string(),
  type: z.enum(['income', 'expense']),
});

/**
 * Update a transaction's category manually
 */
export async function POST(request: Request) {
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

    // Parse and validate request body
    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          errors: parsed.error.formErrors.fieldErrors,
        },
        { status: 400 }
      );
    }

    const { transactionId, category, type } = parsed.data;

    // Update or create categorized transaction record
    const docRef = db
      .collection('users')
      .doc(userId)
      .collection('categorizedTransactions')
      .doc(transactionId);

    // Check if document exists
    const existingDoc = await docRef.get();

    if (existingDoc.exists) {
      // Update existing categorization
      await docRef.update({
        aiCategory: category,
        type: type,
        manuallyEdited: true,
        lastEditedAt: new Date().toISOString(),
      });
    } else {
      // Create new categorization record
      await docRef.set({
        originalTransactionId: transactionId,
        aiCategory: category,
        aiConfidence: 100, // Manual categorization has 100% confidence
        aiReasoning: 'Manually categorized by user',
        type: type,
        manuallyEdited: true,
        aiCategorizedAt: new Date().toISOString(),
        lastEditedAt: new Date().toISOString(),
      });
    }

    logger.info('Transaction category updated manually', {
      userId,
      transactionId,
      category,
      type,
    });

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
    });
  } catch (error) {
    logger.error('Error updating transaction category', { error });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
