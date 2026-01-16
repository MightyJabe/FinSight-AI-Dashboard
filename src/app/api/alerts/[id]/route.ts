import { NextResponse } from 'next/server';

import { markAlertAsRead } from '@/lib/automated-alerts';
import { adminAuth as auth } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing token' }, { status: 401 });
    }

    try {
      await auth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    await markAlertAsRead(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error marking alert as read', { alertId: params.id, error });
    return NextResponse.json({ success: false, error: 'Failed to update alert' }, { status: 500 });
  }
}
