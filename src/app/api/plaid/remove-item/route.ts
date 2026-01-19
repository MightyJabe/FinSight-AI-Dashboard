import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  AuditEventType,
  AuditSeverity,
  logPlaidOperation,
  logSecurityEvent,
} from '@/lib/audit-logger';
import { decryptPlaidToken, isEncryptedData } from '@/lib/encryption';
import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { plaidClient } from '@/lib/plaid';

// Zod schema for input validation
const removeItemSchema = z.object({
  itemId: z.string().min(1, 'itemId is required'),
});

/**
 * Get user ID from session cookie
 * @returns The user ID or null if authentication fails
 */
async function getUserIdFromSession(): Promise<string | null> {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;
  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
  } catch (error) {
    logger.error('Error verifying session cookie for Plaid item removal', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/plaid/remove-item',
      operation: 'verifySessionCookie',
    });
    return null;
  }
}

/**
 * Remove a Plaid item and revoke its access token
 * @param request - The HTTP request containing itemId in the body
 * @returns JSON response indicating success or error
 */
export async function POST(request: Request) {
  try {
    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const userId = await getUserIdFromSession();
    if (!userId) {
      await logSecurityEvent(AuditEventType.UNAUTHORIZED_ACCESS, AuditSeverity.HIGH, {
        ipAddress,
        userAgent,
        endpoint: '/api/plaid/remove-item',
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

    const body = await request.json();
    const parsed = removeItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { itemId } = parsed.data;

    const itemDocRef = db.collection('users').doc(userId).collection('plaidItems').doc(itemId);
    const itemDoc = await itemDocRef.get();

    if (!itemDoc.exists) {
      return NextResponse.json({ error: 'Plaid item not found for this user.' }, { status: 404 });
    }

    const storedAccessToken = itemDoc.data()?.accessToken;

    // Step 1: Attempt to remove the item from Plaid (invalidates access token)
    let accessToken: string | undefined;
    if (storedAccessToken) {
      try {
        if (isEncryptedData(storedAccessToken)) {
          accessToken = decryptPlaidToken(storedAccessToken);
          logger.info('Successfully decrypted Plaid access token for removal', { itemId });

          await logPlaidOperation(userId, 'decrypt_token', {
            itemId,
            ipAddress,
            userAgent,
            endpoint: '/api/plaid/remove-item',
            success: true,
            details: { operation: 'decrypt_for_unlink' },
          });
        } else {
          // Handle legacy unencrypted tokens
          accessToken = storedAccessToken as string;
          logger.warn('Found unencrypted Plaid access token during removal', { itemId });
        }

        if (accessToken) {
          await plaidClient.itemRemove({ access_token: accessToken });
        }
      } catch (error: unknown) {
        // This catches both decryption errors and Plaid API errors
        if (error instanceof Error && error.message.includes('decrypt')) {
          logger.error('Failed to decrypt Plaid access token for removal', {
            error,
            itemId,
            userId,
          });
        } else {
          // Log the error but proceed with removing from Firestore, as the token might be already invalid
          // or the item doesn't exist on Plaid's side anymore.
          logger.warn(
            `Could not remove Plaid item ${itemId} from Plaid systems (might be already removed or token invalid)`,
            { error: error instanceof Error ? error.message : error, itemId, userId }
          );
        }
      }
    }

    // Step 2: Delete the item from Firestore
    await itemDocRef.delete();

    await logPlaidOperation(userId, 'unlink', {
      itemId,
      ipAddress,
      userAgent,
      endpoint: '/api/plaid/remove-item',
      success: true,
    });

    return NextResponse.json({ message: 'Plaid item unlinked successfully.', itemId });
  } catch (error: unknown) {
    logger.error('Error unlinking Plaid item', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/plaid/remove-item',
      method: 'POST',
    });
    let errorMessage = 'Failed to unlink Plaid item';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await logSecurityEvent(AuditEventType.SYSTEM_ERROR, AuditSeverity.HIGH, {
      ipAddress,
      userAgent,
      endpoint: '/api/plaid/remove-item',
      method: 'POST',
      resource: 'plaid_account',
      success: false,
      errorMessage,
    });

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
