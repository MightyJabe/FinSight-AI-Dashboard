import { NextResponse } from 'next/server';

import { markAlertAsRead } from '@/lib/automated-alerts';
import { adminAuth as auth } from '@/lib/firebase-admin';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    await auth.verifyIdToken(token);

    await markAlertAsRead(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}
