import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Get all categorized transactions with their AI categories
 */
export async function GET(request: Request) {
  try {
    // Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
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
          categorizedTransactions: {}
        }
      });
    }

    // Build a map of transaction ID to categorized data
    const categorizedTransactions: Record<string, {
      aiCategory: string;
      aiConfidence: number;
      aiReasoning?: string;
      type: 'income' | 'expense';
      aiCategorizedAt: string;
    }> = {};

    categorizedSnapshot.docs.forEach(doc => {
      const data = doc.data();
      categorizedTransactions[data.originalTransactionId || doc.id] = {
        aiCategory: data.aiCategory,
        aiConfidence: data.aiConfidence,
        aiReasoning: data.aiReasoning,
        type: data.type,
        aiCategorizedAt: data.aiCategorizedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        categorizedTransactions
      }
    });

  } catch (error) {
    logger.error('Error fetching categorized transactions', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}