import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { auth, db } from '@/lib/firebase-admin';
import { plaidClient } from '@/lib/plaid';

/**
 *
 */
async function getUserIdFromSession(): Promise<string | null> {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;
  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
  } catch (error) {
    console.error('Error verifying session cookie for token exchange:', error);
    return null;
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 *
 */
export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User session is invalid or missing.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { public_token, institution_id, institution_name } = body;

    if (!public_token) {
      return NextResponse.json({ error: 'Missing public_token in request body' }, { status: 400 });
    }

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = exchangeResponse.data;

    if (!access_token || !item_id) {
      throw new Error('Failed to exchange public token for access token or item_id.');
    }

    // Store the access_token and item_id securely in Firestore
    // We'll store it in a subcollection `plaidItems` under the user document,
    // with the document ID being the Plaid item_id for easy lookup/management.
    const itemDocRef = db.collection('users').doc(userId).collection('plaidItems').doc(item_id);

    await itemDocRef.set({
      accessToken: access_token, // Encrypt this in a real production app
      itemId: item_id,
      userId: userId,
      institutionId: institution_id || null, // From Plaid Link metadata
      institutionName: institution_name || null, // From Plaid Link metadata
      linkedAt: new Date(),
      // You might want to store initial account details from Plaid Link metadata (accounts) here too,
      // or trigger an immediate fetch of accounts using the new access_token.
    });

    // Optionally, trigger an initial sync of accounts and transactions here.
    // For now, we just confirm success.

    return NextResponse.json({ message: 'Plaid item linked successfully', itemId: item_id });
  } catch (error: unknown) {
    console.error('Error exchanging public token:', error);
    let errorMessage = 'An unknown error occurred while exchanging public token.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // if (error instanceof PlaidError) { errorMessage = error.response?.data?.error_message || error.message; }
    throw new Error(errorMessage);
  }
}
