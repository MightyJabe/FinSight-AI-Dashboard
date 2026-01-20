import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateAuthToken } from '@/lib/auth-server';
import { adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Zod validation schema
const syncRequestSchema = z.object({
  accountId: z.string().optional(), // If not provided, sync all accounts
});

/**
 * Manual sync endpoint for accounts
 * POST /api/banking/sync
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    const body = await req.json();
    const parsed = syncRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    const { accountId } = parsed.data;

    // If accountId is provided, sync just that account
    // Otherwise, sync all user's accounts
    let accountsToSync: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[] = [];

    if (accountId) {
      const accountSnapshot = await adminDb
        .collection('users')
        .doc(userId)
        .collection('accounts')
        .where('__name__', '==', accountId)
        .limit(1)
        .get();

      if (accountSnapshot.empty) {
        return NextResponse.json(
          { success: false, error: 'Account not found' },
          { status: 404 }
        );
      }

      accountsToSync = accountSnapshot.docs;
    } else {
      // Sync all accounts
      const accountsSnapshot = await adminDb
        .collection('users')
        .doc(userId)
        .collection('accounts')
        .get();

      accountsToSync = accountsSnapshot.docs;
    }

    if (accountsToSync.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No accounts to sync',
        synced: 0,
        errors: 0,
      });
    }

    let synced = 0;
    let errors = 0;
    const results = [];

    for (const accountDoc of accountsToSync) {
      const accountData = accountDoc.data();
      const accountDocId = accountDoc.id;

      try {
        // Get the connection for this account
        const connectionSnapshot = await adminDb
          .collection('users')
          .doc(userId)
          .collection('banking_connections')
          .where('id', '==', accountData.connectionId)
          .limit(1)
          .get();

        if (connectionSnapshot.empty) {
          logger.warn(`[Manual Sync] No connection found for account ${accountDocId}`);
          await accountDoc.ref.update({
            syncStatus: 'error',
            syncError: 'Connection not found',
            updatedAt: new Date(),
          });
          errors++;
          results.push({
            accountId: accountDocId,
            accountName: accountData.name,
            success: false,
            error: 'Connection not found',
          });
          continue;
        }

        const connectionDoc = connectionSnapshot.docs[0];
        if (!connectionDoc) {
          throw new Error('Connection document not found');
        }
        const connectionData = connectionDoc.data();
        const provider = connectionData.provider;

        // Update status to syncing
        await accountDoc.ref.update({
          syncStatus: 'syncing',
          syncError: null,
          updatedAt: new Date(),
        });

        if (provider === 'israel') {
          // Re-sync Israeli account
          await syncIsraeliAccount(userId, accountDocId, connectionData);
        } else if (provider === 'plaid') {
          // Re-sync Plaid account
          await syncPlaidAccount(userId, accountDocId, connectionData);
        } else {
          throw new Error(`Unknown provider: ${provider}`);
        }

        // Mark account as synced
        await accountDoc.ref.update({
          lastSyncAt: new Date(),
          syncStatus: 'active',
          syncError: null,
          updatedAt: new Date(),
        });

        synced++;
        results.push({
          accountId: accountDocId,
          accountName: accountData.name,
          success: true,
        });

        logger.info(`[Manual Sync] Account synced successfully: ${accountDocId}`);

      } catch (accountError) {
        logger.error(`[Manual Sync] Error syncing account ${accountDocId}`, {
          error: accountError instanceof Error ? accountError.message : String(accountError),
          userId,
          accountId: accountDocId,
        });

        // Mark account as error
        await accountDoc.ref.update({
          syncStatus: 'error',
          syncError: accountError instanceof Error ? accountError.message : 'Unknown error',
          updatedAt: new Date(),
        });

        errors++;
        results.push({
          accountId: accountDocId,
          accountName: accountData.name,
          success: false,
          error: accountError instanceof Error ? accountError.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      errors,
      results,
    });

  } catch (error) {
    logger.error('[Manual Sync] Fatal error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Sync a single Israeli banking account
 */
async function syncIsraeliAccount(
  userId: string,
  accountId: string,
  connectionData: FirebaseFirestore.DocumentData
): Promise<void> {
  try {
    const { accessToken } = connectionData;

    if (!accessToken) {
      throw new Error('No access token found for Israeli account');
    }

    // Decrypt the credentials
    const { decryptSensitiveData } = await import('@/lib/encryption');
    const decrypted = decryptSensitiveData(JSON.parse(accessToken));

    // Import and use the scrapeAll method
    const { IsraelClient } = await import('@/lib/banking/israelClient');
    const israelClient = new IsraelClient();

    // Scrape latest data
    const result = await israelClient.scrapeAll(decrypted);

    logger.info(`[Manual Sync] Israeli account synced: ${result.accounts.length} accounts, ${result.transactions.length} transactions`);

    // Update accounts in Firestore
    const batch = adminDb.batch();
    for (const account of result.accounts) {
      const accountRef = adminDb
        .collection('users')
        .doc(userId)
        .collection('accounts')
        .doc(accountId);

      batch.update(accountRef, {
        balance: account.balance || 0,
        updatedAt: new Date(),
      });
    }

    // Save new transactions (with deduplication via providerTxId)
    for (const tx of result.transactions) {
      const amount = (tx as any).originalAmount || (tx as any).chargedAmount || 0;
      const providerTxId = `israel_${tx.date}_${amount}_${tx.description}`.toLowerCase()
        .replace(/[\\/\\\\\\.]/g, '_')
        .substring(0, 100);

      const txRef = adminDb
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .doc(providerTxId);

      batch.set(txRef, {
        ...tx,
        providerTxId,
        connectionId: connectionData.id,
        userId,
        updatedAt: new Date(),
      }, { merge: true });
    }

    await batch.commit();

  } catch (error) {
    logger.error('[Manual Sync] Israeli account sync failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      accountId,
    });
    throw error;
  }
}

/**
 * Sync a single Plaid account
 */
async function syncPlaidAccount(
  userId: string,
  accountId: string,
  connectionData: FirebaseFirestore.DocumentData
): Promise<void> {
  try {
    const { accessToken } = connectionData;

    if (!accessToken) {
      throw new Error('No access token found for Plaid account');
    }

    // Decrypt the access token
    const { decryptPlaidToken, isEncryptedData } = await import('@/lib/encryption');
    let decryptedToken: string;

    if (isEncryptedData(accessToken)) {
      decryptedToken = decryptPlaidToken(accessToken);
    } else {
      decryptedToken = accessToken as string;
    }

    // Get Plaid accounts
    const { plaidApi } = await import('@/lib/banking/plaidClient');
    const accountsResponse = await plaidApi.accountsGet({
      access_token: decryptedToken,
    });

    logger.info(`[Manual Sync] Plaid account synced: ${accountsResponse.data.accounts.length} accounts`);

    // Update account balance in Firestore
    const plaidAccount = accountsResponse.data.accounts.find(acc => acc.account_id === accountId);
    if (plaidAccount) {
      const accountRef = adminDb
        .collection('users')
        .doc(userId)
        .collection('accounts')
        .doc(accountId);

      await accountRef.update({
        balance: plaidAccount.balances.current || 0,
        updatedAt: new Date(),
      });
    }

  } catch (error) {
    logger.error('[Manual Sync] Plaid account sync failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      accountId,
    });
    throw error;
  }
}
