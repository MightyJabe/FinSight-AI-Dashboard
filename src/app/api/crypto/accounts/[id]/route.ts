import { NextResponse } from 'next/server';

import { validateAuthToken } from '@/lib/auth-server';
import { adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    const docRef = db.collection('crypto_accounts').doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting crypto account', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/crypto/accounts/[id]',
      method: 'DELETE',
      accountId: params.id,
    });
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
