import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { LinkTokenCreateRequest } from 'plaid';

import {
  AuditEventType,
  AuditSeverity,
  logPlaidOperation,
  logSecurityEvent,
} from '@/lib/audit-logger';
import { decryptPlaidToken, isEncryptedData } from '@/lib/encryption';
import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
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
      logger.error('Error verifying ID token', {
        error: error instanceof Error ? error.message : String(error),
        endpoint: '/api/plaid/create-link-token',
        operation: 'verifyIdToken',
      });
    }
  }

  // Fallback to session cookie
  const sessionCookie = cookies().get('session')?.value;
  if (sessionCookie) {
    try {
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
      return decodedClaims.uid;
    } catch (error) {
      logger.error('Error verifying session cookie for link token creation', {
        error: error instanceof Error ? error.message : String(error),
        endpoint: '/api/plaid/create-link-token',
        operation: 'verifySessionCookie',
      });
    }
  }

  return null;
}

/**
 * Creates a Plaid Link token for the authenticated user.
 */
export async function POST(request: Request) {
  try {
    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      await logSecurityEvent(AuditEventType.UNAUTHORIZED_ACCESS, AuditSeverity.HIGH, {
        ipAddress,
        userAgent,
        endpoint: '/api/plaid/create-link-token',
        method: 'POST',
        resource: 'plaid_account',
        success: false,
        errorMessage: 'Unauthorized access attempt',
      });

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
              await logPlaidOperation(userId, 'decrypt_token', {
                itemId,
                ipAddress,
                userAgent,
                endpoint: '/api/plaid/create-link-token',
                success: true,
                details: { operation: 'decrypt_for_link_update' },
              });
            } else {
              accessToken = storedAccessToken as string;
            }

            linkTokenRequest.access_token = accessToken;
          }
        }
      } catch (error) {
        logger.error('Error getting access token for update mode', {
          error: error instanceof Error ? error.message : String(error),
          endpoint: '/api/plaid/create-link-token',
          operation: 'getAccessTokenForUpdate',
          userId,
          itemId,
        });
        // Continue with create mode if we can't get the access token
      }
    }

    const tokenResponse = await plaidClient.linkTokenCreate(linkTokenRequest);

    if (!tokenResponse.data.link_token) {
      throw new Error('Plaid link_token was not created successfully.');
    }

    await logPlaidOperation(userId, 'link', {
      itemId: itemId ?? 'new',
      ipAddress,
      userAgent,
      endpoint: '/api/plaid/create-link-token',
      success: true,
      details: { mode },
    });

    return NextResponse.json({ linkToken: tokenResponse.data.link_token });
  } catch (error: unknown) {
    logger.error('Error creating link token', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/plaid/create-link-token',
      method: 'POST',
    });
    let errorMessage = 'An unknown error occurred while creating link token.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await logSecurityEvent(AuditEventType.SYSTEM_ERROR, AuditSeverity.HIGH, {
      ipAddress,
      userAgent,
      endpoint: '/api/plaid/create-link-token',
      method: 'POST',
      resource: 'plaid_account',
      success: false,
      errorMessage,
    });

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
