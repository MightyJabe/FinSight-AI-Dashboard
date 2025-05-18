import { NextResponse } from 'next/server';
import { createLinkToken } from '@/lib/plaid';
import { auth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    console.log('Creating link token...');

    // Get the Firebase ID token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);

    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log('ID token present:', !!idToken);

    const decodedToken = await auth.verifyIdToken(idToken);
    console.log('Token decoded successfully, user ID:', decodedToken.uid);

    const userId = decodedToken.uid;
    const linkToken = await createLinkToken(userId);
    console.log('Link token created successfully');

    return NextResponse.json({ linkToken });
  } catch (error) {
    console.error('Error creating link token:', error);
    return NextResponse.json(
      {
        error: 'Failed to create link token',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
