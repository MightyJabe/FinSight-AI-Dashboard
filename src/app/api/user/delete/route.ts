import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { AuditEventType, AuditSeverity, logSecurityEvent } from '@/lib/audit-logger';
import { validateAuthToken } from '@/lib/auth-server';
import { decryptPlaidToken, isEncryptedData } from '@/lib/encryption';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const deleteRequestSchema = z.object({
  confirmation: z.literal('DELETE MY ACCOUNT'),
});

/**
 * GDPR-compliant account deletion endpoint
 * POST /api/user/delete
 *
 * Completely removes all user data and account
 * Implements P5.2 from financial-os-upgrade-comprehensive-plan.md
 *
 * IMPORTANT: This is irreversible
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    // Validate confirmation
    const body = await req.json();
    const parsed = deleteRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Confirmation required. Send { confirmation: "DELETE MY ACCOUNT" }',
          errors: parsed.error.formErrors.fieldErrors,
        },
        { status: 400 }
      );
    }

    logger.warn('[Account Deletion] User requested account deletion', { userId });

    // Log deletion attempt for audit
    await logSecurityEvent(AuditEventType.FINANCIAL_DATA_DELETE, AuditSeverity.CRITICAL, {
      userId,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      resource: 'user_account',
      details: {
        action: 'account_deletion_initiated',
      },
    });

    // Step 1: Remove Plaid items via API (if any)
    try {
      const connectionsSnapshot = await adminDb
        .collection('users')
        .doc(userId)
        .collection('banking_connections')
        .where('provider', '==', 'plaid')
        .get();

      if (!connectionsSnapshot.empty) {
        const { plaidApi } = await import('@/lib/banking/plaidClient');

        for (const connDoc of connectionsSnapshot.docs) {
          try {
            const connData = connDoc.data();
            const { accessToken } = connData;

            if (accessToken) {
              // Decrypt token if encrypted
              let decryptedToken: string;
              if (isEncryptedData(accessToken)) {
                decryptedToken = decryptPlaidToken(accessToken);
              } else {
                decryptedToken = accessToken as string;
              }

              // Remove item from Plaid
              await plaidApi.itemRemove({
                access_token: decryptedToken,
              });

              logger.info('[Account Deletion] Removed Plaid item', {
                userId,
                itemId: connData.itemId,
              });
            }
          } catch (plaidError) {
            logger.error('[Account Deletion] Error removing Plaid item', {
              userId,
              error: plaidError instanceof Error ? plaidError.message : String(plaidError),
            });
            // Continue with deletion even if Plaid removal fails
          }
        }
      }
    } catch (error) {
      logger.error('[Account Deletion] Error processing Plaid connections', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Continue with deletion
    }

    // Step 2: Delete all Firestore subcollections
    const subcollections = [
      'accounts',
      'transactions',
      'banking_connections',
      'manualAssets',
      'manualLiabilities',
      'crypto_accounts',
      'real_estate',
      'pension_funds',
      'mortgages',
      'snapshots',
      'budgets',
      'conversations',
      'alerts',
    ];

    let totalDeleted = 0;

    for (const collectionName of subcollections) {
      try {
        const collectionRef = adminDb.collection('users').doc(userId).collection(collectionName);

        // Batch delete (Firestore limit is 500 per batch)
        let snapshot = await collectionRef.limit(500).get();

        while (!snapshot.empty) {
          const batch = adminDb.batch();

          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });

          await batch.commit();
          totalDeleted += snapshot.docs.length;

          logger.info('[Account Deletion] Deleted batch from collection', {
            userId,
            collection: collectionName,
            count: snapshot.docs.length,
          });

          // Get next batch
          snapshot = await collectionRef.limit(500).get();
        }
      } catch (error) {
        logger.error('[Account Deletion] Error deleting collection', {
          userId,
          collection: collectionName,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue with other collections
      }
    }

    // Step 3: Delete user document
    try {
      await adminDb.collection('users').doc(userId).delete();
      logger.info('[Account Deletion] Deleted user document', { userId });
    } catch (error) {
      logger.error('[Account Deletion] Error deleting user document', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Step 4: Delete Firebase Auth user
    try {
      await adminAuth.deleteUser(userId);
      logger.info('[Account Deletion] Deleted Firebase Auth user', { userId });
    } catch (error) {
      logger.error('[Account Deletion] Error deleting Firebase Auth user', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      // If auth deletion fails, the data is still gone but auth remains
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete authentication account. Please contact support.',
          partialDeletion: true,
        },
        { status: 500 }
      );
    }

    // Final audit log
    await logSecurityEvent(AuditEventType.FINANCIAL_DATA_DELETE, AuditSeverity.CRITICAL, {
      userId,
      resource: 'user_account',
      success: true,
      details: {
        action: 'account_deletion_completed',
        totalDocumentsDeleted: totalDeleted,
      },
    });

    logger.warn('[Account Deletion] Account deletion completed successfully', {
      userId,
      totalDocumentsDeleted: totalDeleted,
    });

    return NextResponse.json({
      success: true,
      message: 'Account and all data have been permanently deleted',
      totalDocumentsDeleted: totalDeleted,
    });
  } catch (error) {
    logger.error('[Account Deletion] Fatal error during account deletion', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete account',
      },
      { status: 500 }
    );
  }
}
