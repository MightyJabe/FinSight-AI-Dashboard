import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/firebase-admin';

/**
 * Creates a session cookie for the authenticated user
 */
export async function POST(request: Request) {
  try {
    // Debug environment variables
    console.log('Environment check:', {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'present' : 'missing',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'present' : 'missing',
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'present' : 'missing',
    });

    // Get the Firebase ID token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      console.error('Invalid token format');
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
    }

    // Create a session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    try {
      const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

      // Set the cookie
      cookies().set('session', sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      return NextResponse.json({ success: true });
    } catch (firebaseError) {
      console.error('Firebase Admin error:', firebaseError);
      return NextResponse.json(
        {
          error: 'Firebase Admin initialization failed',
          details: firebaseError instanceof Error ? firebaseError.message : String(firebaseError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create session',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Gets the current session status
 */
export async function GET() {
  try {
    const sessionCookie = cookies().get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    // Verify the session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie);

    return NextResponse.json({
      authenticated: true,
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        name: decodedClaims.name,
      },
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

/**
 * Deletes the session cookie
 */
export async function DELETE() {
  cookies().delete('session');
  return NextResponse.json({ success: true });
}
