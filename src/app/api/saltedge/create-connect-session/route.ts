import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { createConnectSession } from '@/lib/saltedge';

const schema = z.object({
  returnUrl: z.string().url().optional(),
});

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  // Try to get user ID from Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const idToken = authHeader.substring(7);
      const decodedToken = await auth.verifyIdToken(idToken);
      return decodedToken.uid;
    } catch (error) {
      console.error('Error verifying ID token:', error);
    }
  }

  // Fallback to session cookie
  const sessionCookie = cookies().get('session')?.value;
  if (sessionCookie) {
    try {
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
      return decodedClaims.uid;
    } catch (error) {
      console.error('Error verifying session cookie:', error);
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    const { returnUrl } = parsed.data;

    // Create Salt Edge connect session
    // Use Firebase UID as customer ID for Salt Edge
    const session = await createConnectSession(userId, returnUrl);

    logger.info('Salt Edge connect session created', {
      userId,
      sessionId: session.data?.id,
    });

    return NextResponse.json({
      success: true,
      connectUrl: session.data?.connect_url,
      sessionId: session.data?.id,
    });
  } catch (error) {
    logger.error('Salt Edge connect session creation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to create connect session' },
      { status: 500 }
    );
  }
}
