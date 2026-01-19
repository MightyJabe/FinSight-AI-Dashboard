import { NextResponse } from 'next/server';

import { validateAuthToken } from '@/lib/auth-server';
import { adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { queryDocToData } from '@/types/firestore';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    const snapshot = await db.collection('crypto_accounts').where('userId', '==', userId).get();

    const accounts = snapshot.docs.map(doc => queryDocToData(doc));

    return NextResponse.json({ success: true, accounts });
  } catch (error) {
    logger.error('Error fetching crypto accounts', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/crypto/accounts',
      method: 'GET',
    });
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}
