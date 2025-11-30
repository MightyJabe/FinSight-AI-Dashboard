import { formatISO } from 'date-fns';
import { NextResponse } from 'next/server';

import {
  AuditEventType,
  AuditSeverity,
  logFinancialAccess,
  logPlaidOperation,
  logSecurityEvent,
} from '@/lib/audit-logger';
import { decryptPlaidToken, isEncryptedData } from '@/lib/encryption';
import { adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { getTransactions } from '@/lib/plaid';
import { Permission, validateUserAccess } from '@/middleware/rbac';

export const dynamic = 'force-dynamic';

/**
 * Get transactions from all connected Plaid accounts
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  const ipAddress =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Validate user access with RBAC
    const validation = await validateUserAccess(request as any, Permission.READ_FINANCIAL_DATA);

    if (!validation.success) {
      // Log unauthorized access attempt
      await logSecurityEvent(AuditEventType.UNAUTHORIZED_ACCESS, AuditSeverity.HIGH, {
        ipAddress,
        userAgent,
        endpoint: '/api/plaid/transactions',
        method: 'GET',
        resource: 'plaid_transactions',
        success: false,
        errorMessage: 'Unauthorized access attempt',
        details: { reason: 'Invalid or missing authorization' },
      });

      return validation.response;
    }

    const { userId } = validation;

    // Fetch all Plaid access tokens for this user
    const plaidItemsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('plaidItems')
      .get();

    if (plaidItemsSnapshot.empty) {
      return NextResponse.json({ transactions: [] });
    }

    const allTransactions = [];

    // Fetch transactions from each connected account
    for (const plaidItemDoc of plaidItemsSnapshot.docs) {
      const plaidItemData = plaidItemDoc.data();
      const storedAccessToken = plaidItemData.accessToken;

      if (!storedAccessToken) continue;

      // Decrypt the access token if it's encrypted
      let accessToken: string;
      try {
        if (isEncryptedData(storedAccessToken)) {
          accessToken = decryptPlaidToken(storedAccessToken);
          logger.info('Successfully decrypted Plaid access token', { itemId: plaidItemDoc.id });

          // Log decryption operation
          await logPlaidOperation(userId, 'decrypt_token', {
            itemId: plaidItemDoc.id,
            institutionName: plaidItemData.institutionName,
            ipAddress,
            userAgent,
            endpoint: '/api/plaid/transactions',
            success: true,
            details: { operation: 'decrypt_for_transactions' },
          });
        } else {
          // Handle legacy unencrypted tokens (migration support)
          accessToken = storedAccessToken as string;
          logger.warn('Found unencrypted Plaid access token - migration needed', {
            itemId: plaidItemDoc.id,
          });
        }
      } catch (error) {
        logger.error('Failed to decrypt Plaid access token', {
          error,
          itemId: plaidItemDoc.id,
          userId,
        });

        // Log decryption failure
        await logSecurityEvent(AuditEventType.DECRYPTION_OPERATION, AuditSeverity.HIGH, {
          userId,
          ipAddress,
          userAgent,
          endpoint: '/api/plaid/transactions',
          method: 'GET',
          resource: 'plaid_access_token',
          success: false,
          errorMessage: 'Failed to decrypt Plaid access token',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        });

        continue; // Skip this item if decryption fails
      }

      try {
        // Get transactions for the last 90 days
        const endDate = formatISO(new Date(), { representation: 'date' });
        const startDate = formatISO(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), {
          representation: 'date',
        });

        const plaidTransactions = await getTransactions(accessToken, startDate, endDate);

        // Transform Plaid transactions to our format
        const transformedTransactions = plaidTransactions.map(txn => ({
          transaction_id: txn.transaction_id,
          date: txn.date,
          name: txn.name,
          amount: txn.amount,
          category: txn.category || [],
          account_id: txn.account_id,
          pending: txn.pending || false,
          payment_channel: txn.payment_channel,
          transaction_type: txn.transaction_type,
        }));

        allTransactions.push(...transformedTransactions);
      } catch (error: any) {
        console.error('Error fetching transactions for Plaid item:', error);

        // Check if it's an ITEM_LOGIN_REQUIRED error
        if (error?.response?.data?.error_code === 'ITEM_LOGIN_REQUIRED') {
          logger.warn('Plaid item requires re-authentication', {
            itemId: plaidItemDoc.id,
            institutionName: plaidItemData.institutionName,
            userId,
            errorCode: error.response.data.error_code,
          });

          // Mark this item as needing re-authentication
          await db
            .collection('users')
            .doc(userId)
            .collection('plaidItems')
            .doc(plaidItemDoc.id)
            .update({
              status: 'ITEM_LOGIN_REQUIRED',
              lastError: {
                code: error.response.data.error_code,
                message: error.response.data.error_message,
                timestamp: new Date(),
              },
            });
        }

        // Continue with other accounts even if one fails
      }
    }

    // Sort transactions by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Log successful transaction fetch
    await logFinancialAccess(userId, 'read', 'plaid_transactions', {
      ipAddress,
      userAgent,
      endpoint: '/api/plaid/transactions',
      method: 'GET',
      success: true,
      details: {
        transactionCount: allTransactions.length,
        plaidItemsCount: plaidItemsSnapshot.size,
        processingTime: Date.now() - startTime,
      },
    });

    return NextResponse.json({ transactions: allTransactions });
  } catch (error) {
    console.error('Error in Plaid transactions API:', error);

    // Log system error
    await logSecurityEvent(AuditEventType.SYSTEM_ERROR, AuditSeverity.HIGH, {
      userId: 'unknown',
      ipAddress,
      userAgent,
      endpoint: '/api/plaid/transactions',
      method: 'GET',
      resource: 'plaid_transactions',
      success: false,
      errorMessage: 'System error in transactions API',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      },
    });

    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
