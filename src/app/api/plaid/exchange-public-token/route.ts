import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth, db } from '@/lib/firebase-admin';
import { plaidClient } from '@/lib/plaid';
import { encryptPlaidToken } from '@/lib/encryption';
import logger from '@/lib/logger';

// Zod schema for input validation
const exchangeTokenSchema = z.object({
  publicToken: z.string().min(1, 'publicToken is required'),
  institution_id: z.string().optional(),
  institution_name: z.string().optional(),
});

/**
 *
 */
async function getUserIdFromRequest(request: Request): Promise<string | null> {
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
      console.error('Error verifying session cookie for token exchange:', error);
    }
  }

  return null;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 *
 */
export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User session is invalid or missing.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = exchangeTokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { publicToken, institution_id, institution_name } = parsed.data;

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    const { access_token, item_id } = exchangeResponse.data;

    if (!access_token || !item_id) {
      throw new Error('Failed to exchange public token for access token or item_id.');
    }

    // Store the access_token and item_id securely in Firestore
    // We'll store it in a subcollection `plaidItems` under the user document,
    // with the document ID being the Plaid item_id for easy lookup/management.
    const itemDocRef = db.collection('users').doc(userId).collection('plaidItems').doc(item_id);

    // Encrypt the Plaid access token before storing
    const encryptedToken = encryptPlaidToken(access_token);
    
    await itemDocRef.set({
      accessToken: encryptedToken, // ✅ SECURE: Encrypted access token
      itemId: item_id,
      userId: userId,
      institutionId: institution_id || null, // From Plaid Link metadata
      institutionName: institution_name || null, // From Plaid Link metadata
      linkedAt: new Date(),
      encryptedAt: new Date(), // Track when encryption was applied
      // You might want to store initial account details from Plaid Link metadata (accounts) here too,
      // or trigger an immediate fetch of accounts using the new access_token.
    });
    
    logger.info('Plaid access token encrypted and stored securely', { 
      userId, 
      itemId: item_id,
      institutionName: institution_name 
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
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
