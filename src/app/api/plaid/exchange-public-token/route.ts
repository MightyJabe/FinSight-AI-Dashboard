import { NextResponse } from 'next/server';
import { exchangePublicToken } from '@/lib/plaid';
import { auth, db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Get the Firebase ID token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Get the public token from the request body
    const { publicToken } = await request.json();
    if (!publicToken) {
      return NextResponse.json({ error: 'Public token is required' }, { status: 400 });
    }

    // Exchange the public token for an access token
    const accessToken = await exchangePublicToken(publicToken);

    // Store the access token in Firestore
    await db.collection('users').doc(userId).collection('plaid').doc('access_token').set({
      accessToken,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    return NextResponse.json({ 
      error: 'Failed to exchange public token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
