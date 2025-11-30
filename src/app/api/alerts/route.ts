import { NextResponse } from 'next/server';

import { generateAlerts, getUserAlerts, saveAlerts } from '@/lib/automated-alerts';
import { adminAuth as auth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const generate = searchParams.get('generate') === 'true';

    if (generate) {
      try {
        const newAlerts = await generateAlerts(userId);
        if (newAlerts.length > 0) {
          await saveAlerts(newAlerts);
        }
      } catch (err) {
        console.error('Error generating alerts:', err);
        // Continue to fetch existing alerts even if generation fails
      }
    }

    const alerts = await getUserAlerts(userId, unreadOnly);

    return NextResponse.json({ success: true, alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ success: true, alerts: [] }); // Return empty array instead of error
  }
}
