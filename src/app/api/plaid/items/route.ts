import { NextResponse } from 'next/server';

import { validateAuthToken } from '@/lib/auth-server';
import { adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { queryDocToData } from '@/types/firestore';

export const dynamic = 'force-dynamic';

/**
 * Get Plaid items status for the authenticated user
 */
export async function GET(request: Request) {
  try {
    // Validate authentication token
    const authResult = await validateAuthToken(request);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId!;

    // Fetch all Plaid items for this user
    const plaidItemsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('plaidItems')
      .get();

    const items = plaidItemsSnapshot.docs.map(doc => queryDocToData(doc));

    return NextResponse.json({ items });
  } catch (error) {
    logger.error('Error fetching Plaid items', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/plaid/items',
      method: 'GET',
    });
    return NextResponse.json({ error: 'Failed to fetch Plaid items' }, { status: 500 });
  }
}
