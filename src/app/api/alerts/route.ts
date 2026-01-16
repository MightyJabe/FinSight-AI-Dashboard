import { NextResponse } from 'next/server';
import { z } from 'zod';

import { generateAlerts, getUserAlerts, saveAlerts } from '@/lib/automated-alerts';
import { adminAuth as auth } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Zod schema for query parameters
const alertsQuerySchema = z.object({
  unread: z.enum(['true', 'false']).optional(),
  generate: z.enum(['true', 'false']).optional(),
});

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing token' }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    const { searchParams } = new URL(req.url);
    const queryValidation = alertsQuerySchema.safeParse({
      unread: searchParams.get('unread'),
      generate: searchParams.get('generate'),
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters' },
        { status: 400 }
      );
    }

    const unreadOnly = searchParams.get('unread') === 'true';
    const generate = searchParams.get('generate') === 'true';

    if (generate) {
      try {
        const newAlerts = await generateAlerts(userId);
        if (newAlerts.length > 0) {
          await saveAlerts(newAlerts);
        }
      } catch (err) {
        // Log error but continue - alert generation failure shouldn't block fetching existing alerts
        logger.error('Error generating alerts', { userId, error: err });
      }
    }

    const alerts = await getUserAlerts(userId, unreadOnly);

    return NextResponse.json({ success: true, alerts });
  } catch (error) {
    // Log the actual error server-side for debugging
    logger.error('Error fetching alerts', { error });
    // Return generic error message to client (don't leak internal details)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
