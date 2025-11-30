import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { LinkTokenCreateRequest } from 'plaid';

import { decryptPlaidToken, isEncryptedData } from '@/lib/encryption';
import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';
import { PLAID_COUNTRY_CODES, PLAID_PRODUCTS, plaidClient } from '@/lib/plaid';

export const dynamic = 'force-dynamic';

/**
 * Get user ID from request (Authorization header or session cookie)
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
      console.error('Error verifying session cookie for link token creation:', error);
    }
  }

  return null;
}

/**
 * Creates a Plaid Link token for the authenticated user.
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

    const body = await request.json().catch(() => ({}));
    const { mode = 'create', itemId } = body;

    const linkTokenRequest: LinkTokenCreateRequest = {
      user: {
        client_user_id: userId,
      },
      client_name: 'FinSight AI Dashboard',
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: 'en',
    };

    // If update mode, get the access token for the item
    if (mode === 'update' && itemId) {
      try {
        const plaidItemDoc = await db
          .collection('users')
          .doc(userId)
          .collection('plaidItems')
          .doc(itemId)
          .get();

        if (plaidItemDoc.exists) {
          const plaidItemData = plaidItemDoc.data();
          const storedAccessToken = plaidItemData?.accessToken;

          if (storedAccessToken) {
            let accessToken: string;
            if (isEncryptedData(storedAccessToken)) {
              accessToken = decryptPlaidToken(storedAccessToken);
            } else {
              accessToken = storedAccessToken as string;
            }

            linkTokenRequest.access_token = accessToken;
          }
        }
      } catch (error) {
        console.error('Error getting access token for update mode:', error);
        // Continue with create mode if we can't get the access token
      }
    }

    const tokenResponse = await plaidClient.linkTokenCreate(linkTokenRequest);

    if (!tokenResponse.data.link_token) {
      throw new Error('Plaid link_token was not created successfully.');
    }

    return NextResponse.json({ linkToken: tokenResponse.data.link_token });
  } catch (error: unknown) {
    console.error('Error creating link token:', error);
    let errorMessage = 'An unknown error occurred while creating link token.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
