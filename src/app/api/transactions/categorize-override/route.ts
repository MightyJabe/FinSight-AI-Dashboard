import { NextResponse } from 'next/server';
import { z } from 'zod';

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/ai-categorization';
import { validateAuthToken } from '@/lib/auth-server';
import { adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const overrideSchema = z.object({
  transactionId: z.string(),
  newCategory: z.string(),
  reason: z.string().optional(),
});

const bulkOverrideSchema = z.object({
  overrides: z.array(
    z.object({
      transactionId: z.string(),
      newCategory: z.string(),
      reason: z.string().optional(),
    })
  ),
});

/**
 * Manual categorization override for individual or bulk transactions
 */
export async function POST(request: Request) {
  try {
    // Authentication using centralized helper
    const authResult = await validateAuthToken(request);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId!;

    // Parse and validate request body
    const body = await request.json();

    // Check if it's a bulk operation
    const isBulk = Array.isArray(body.overrides);
    const parsed = isBulk ? bulkOverrideSchema.safeParse(body) : overrideSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          errors: parsed.error.formErrors.fieldErrors,
        },
        { status: 400 }
      );
    }

    // Validate categories exist in our predefined lists
    const allCategories = [
      ...Object.values(EXPENSE_CATEGORIES),
      ...Object.values(INCOME_CATEGORIES),
    ];

    const overridesToProcess = isBulk
      ? (
          parsed.data as {
            overrides: Array<{ transactionId: string; newCategory: string; reason?: string }>;
          }
        ).overrides
      : [parsed.data as { transactionId: string; newCategory: string; reason?: string }];

    // Validate all categories
    for (const override of overridesToProcess) {
      if (!allCategories.includes(override.newCategory as any)) {
        return NextResponse.json(
          { success: false, error: `Invalid category: ${override.newCategory}` },
          { status: 400 }
        );
      }
    }

    const batch = db.batch();
    const results: Array<{ transactionId: string; success: boolean; error?: string }> = [];

    for (const override of overridesToProcess) {
      try {
        // Check if the categorized transaction exists
        const categorizedDocRef = db
          .collection('users')
          .doc(userId)
          .collection('categorizedTransactions')
          .doc(override.transactionId);

        const categorizedDoc = await categorizedDocRef.get();

        if (!categorizedDoc.exists) {
          results.push({
            transactionId: override.transactionId,
            success: false,
            error: 'Transaction not found or not categorized',
          });
          continue;
        }

        const existingData = categorizedDoc.data()!;

        // Create manual override entry
        const overrideData = {
          ...existingData,
          manualCategory: override.newCategory,
          manualOverrideReason: override.reason || 'Manual categorization',
          manualOverrideAt: new Date().toISOString(),
          isManualOverride: true,
          // Keep original AI data for reference
          originalAiCategory: existingData.aiCategory,
          originalAiConfidence: existingData.aiConfidence,
          originalAiReasoning: existingData.aiReasoning,
        };

        batch.set(categorizedDocRef, overrideData, { merge: true });

        results.push({
          transactionId: override.transactionId,
          success: true,
        });

        logger.info('Manual category override applied', {
          userId,
          transactionId: override.transactionId,
          fromCategory: existingData.aiCategory,
          toCategory: override.newCategory,
          reason: override.reason,
        });
      } catch (error) {
        logger.error('Failed to apply manual category override', {
          error,
          transactionId: override.transactionId,
          userId,
        });

        results.push({
          transactionId: override.transactionId,
          success: false,
          error: 'Failed to update categorization',
        });
      }
    }

    // Commit all changes
    await batch.commit();

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    logger.info('Manual categorization override completed', {
      userId,
      totalOverrides: overridesToProcess.length,
      successful: successCount,
      failed: failureCount,
    });

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          total: overridesToProcess.length,
          successful: successCount,
          failed: failureCount,
        },
      },
    });
  } catch (error) {
    logger.error('Error in manual categorization override API', { error });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Get manual override history for a user
 */
export async function GET(request: Request) {
  try {
    // Authentication using centralized helper
    const authResult = await validateAuthToken(request);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId!;

    const url = new URL(request.url);
    const transactionId = url.searchParams.get('transactionId');

    if (transactionId) {
      // Get specific transaction override history
      const doc = await db
        .collection('users')
        .doc(userId)
        .collection('categorizedTransactions')
        .doc(transactionId)
        .get();

      if (!doc.exists) {
        return NextResponse.json(
          { success: false, error: 'Transaction not found' },
          { status: 404 }
        );
      }

      const data = doc.data()!;
      return NextResponse.json({
        success: true,
        data: {
          transactionId,
          hasManualOverride: data.isManualOverride || false,
          manualCategory: data.manualCategory,
          originalAiCategory: data.originalAiCategory || data.aiCategory,
          manualOverrideReason: data.manualOverrideReason,
          manualOverrideAt: data.manualOverrideAt,
        },
      });
    } else {
      // Get all manual overrides for the user
      const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('categorizedTransactions')
        .where('isManualOverride', '==', true)
        .orderBy('manualOverrideAt', 'desc')
        .limit(100)
        .get();

      const overrides = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          transactionId: doc.id,
          manualCategory: data.manualCategory,
          originalAiCategory: data.originalAiCategory,
          manualOverrideReason: data.manualOverrideReason,
          manualOverrideAt: data.manualOverrideAt,
          description: data.description,
          amount: data.amount,
          date: data.date,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          overrides,
          total: overrides.length,
        },
      });
    }
  } catch (error) {
    logger.error('Error fetching manual override data', { error });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
