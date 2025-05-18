import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { getTransactions } from '@/lib/plaid';
import { subDays, formatISO } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Get the Firebase ID token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Get the user's Plaid access token from Firestore
    const accessTokenDoc = await db
      .collection('users')
      .doc(userId)
      .collection('plaid')
      .doc('access_token')
      .get();
    const accessToken = accessTokenDoc.exists ? accessTokenDoc.data()?.accessToken : null;
    if (!accessToken) {
      return NextResponse.json({ error: 'No Plaid access token found' }, { status: 404 });
    }

    // Fetch transactions for the last 30 days
    const endDate = formatISO(new Date(), { representation: 'date' });
    const startDate = formatISO(subDays(new Date(), 30), { representation: 'date' });
    const transactions = await getTransactions(accessToken, startDate, endDate);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
