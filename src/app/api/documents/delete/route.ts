import { NextRequest, NextResponse } from 'next/server';

import { AuditEventType, AuditSeverity, logSecurityEvent } from '@/lib/audit-logger';
import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';
import { requirePlan } from '@/lib/plan-guard';

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await auth.verifyIdToken(token);
    const userId = decoded.uid;

    const allowed = await requirePlan(userId, 'pro');
    if (!allowed) {
      await logSecurityEvent(AuditEventType.UNAUTHORIZED_ACCESS, AuditSeverity.HIGH, {
        userId,
        endpoint: '/api/documents/delete',
        resource: 'documents',
        errorMessage: 'Pro plan required for document delete',
      });
      return NextResponse.json(
        { success: false, error: 'Pro plan required for document delete' },
        { status: 402 }
      );
    }

    const { documentId } = await req.json();

    await db.collection('documents').doc(documentId).delete();

    // Storage deletion removed - adminStorage not available

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
