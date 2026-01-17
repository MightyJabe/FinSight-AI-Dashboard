import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { AuditEventType, AuditSeverity, logSecurityEvent } from '@/lib/audit-logger';
import { validateAuthToken } from '@/lib/auth-server';
import { adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { requirePlan } from '@/lib/plan-guard';

// Zod schema for document deletion
const deleteSchema = z.object({
  documentId: z.string().min(1, 'Document ID required').max(200),
});

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

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

    const body = await req.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    const { documentId } = parsed.data;

    // SECURITY FIX: Verify document exists and belongs to user before deleting
    const docRef = db.collection('documents').doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // CRITICAL: Check ownership to prevent IDOR attacks
    const docData = doc.data();
    if (docData?.userId !== userId) {
      await logSecurityEvent(AuditEventType.UNAUTHORIZED_ACCESS, AuditSeverity.HIGH, {
        userId,
        endpoint: '/api/documents/delete',
        resource: 'documents',
        errorMessage: 'Attempted to delete document owned by another user',
        details: { documentId },
      });
      logger.warn('IDOR attempt blocked on document delete', { userId, documentId });
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    await docRef.delete();
    logger.info('Document deleted', { userId, documentId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting document', { error });
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
