import { NextResponse } from 'next/server';

import { validateAuthToken } from '@/lib/auth-server';
import { adminDb as db } from '@/lib/firebase-admin';

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

    const items = plaidItemsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching Plaid items:', error);
    return NextResponse.json({ error: 'Failed to fetch Plaid items' }, { status: 500 });
  }
}
