import { NextRequest, NextResponse } from 'next/server';

import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await auth.verifyIdToken(token);

    const { documentId } = await req.json();

    await db.collection('documents').doc(documentId).delete();

    // Storage deletion removed - adminStorage not available

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
