import { NextRequest, NextResponse } from 'next/server';

import { auth, db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

/**
 *
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized - Missing token' }, { status: 401 });
    }
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid as string;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - Invalid user ID' }, { status: 401 });
    }

    const { conversationId } = params;

    // Verify the conversation belongs to the user
    const conversationDoc = await db
      .collection('users')
      .doc(userId)
      .collection('conversations')
      .doc(conversationId)
      .get();

    if (!conversationDoc.exists) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Delete the conversation
    await db
      .collection('users')
      .doc(userId)
      .collection('conversations')
      .doc(conversationId)
      .delete();

    logger.info('Conversation deleted', { userId, conversationId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting conversation', {
      error: error instanceof Error ? error.message : String(error),
      conversationId: params.conversationId,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
