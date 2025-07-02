import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { LinkTokenCreateRequest } from 'plaid';

import { auth } from '@/lib/firebase-admin';
import { PLAID_COUNTRY_CODES, PLAID_PRODUCTS, plaidClient } from '@/lib/plaid';

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

    const linkTokenRequest: LinkTokenCreateRequest = {
      user: {
        client_user_id: userId,
      },
      client_name: 'FinSight AI Dashboard', // Or your app name from an env variable
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: 'en',
      // redirect_uri: process.env.PLAID_REDIRECT_URI, // Add if you are using hosted Link for OAuth
      // webhook: process.env.PLAID_WEBHOOK_URL, // Add if you want to receive webhooks from Plaid
    };

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
