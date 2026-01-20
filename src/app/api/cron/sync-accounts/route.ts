import { NextRequest, NextResponse } from 'next/server';

import { adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

const STALE_THRESHOLD_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Cron job to sync stale accounts
 * Runs every 6 hours via Vercel cron
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.warn('[Sync Cron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('[Sync Cron] Unauthorized attempt', {
        providedAuth: authHeader ? 'present' : 'missing',
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const startTime = Date.now();
    logger.info('[Sync Cron] Starting account sync job');

    // Calculate stale threshold
    const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MS);

    // Get all users
    const usersSnapshot = await adminDb.collection('users').get();
    let totalAccountsSynced = 0;
    let totalErrors = 0;
    const userResults = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      try {
        // Find stale accounts for this user
        const accountsSnapshot = await adminDb
          .collection('users')
          .doc(userId)
          .collection('accounts')
          .where('lastSyncAt', '<=', staleThreshold)
          .get();

        if (accountsSnapshot.empty) {
          continue; // No stale accounts for this user
        }

        logger.info(`[Sync Cron] Found ${accountsSnapshot.size} stale accounts for user ${userId}`);

        let synced = 0;
        let errors = 0;

        for (const accountDoc of accountsSnapshot.docs) {
          const accountData = accountDoc.data();
          const accountId = accountDoc.id;

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
              logger.warn(`[Sync Cron] No connection found for account ${accountId}`);
              await accountDoc.ref.update({
                syncStatus: 'error',
                syncError: 'Connection not found',
                updatedAt: new Date(),
              });
              errors++;
              continue;
            }

            const connectionDoc = connectionSnapshot.docs[0];
            if (!connectionDoc) {
              logger.warn(`[Sync Cron] Connection doc not found for account ${accountId}`);
              await accountDoc.ref.update({
                syncStatus: 'error',
                syncError: 'Connection not found',
                updatedAt: new Date(),
              });
              errors++;
              continue;
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
              await syncIsraeliAccount(userId, accountId, connectionData);
              synced++;
            } else if (provider === 'plaid') {
              // Re-sync Plaid account
              await syncPlaidAccount(userId, accountId, connectionData);
              synced++;
            } else {
              logger.warn(`[Sync Cron] Unknown provider ${provider} for account ${accountId}`);
              await accountDoc.ref.update({
                syncStatus: 'error',
                syncError: `Unknown provider: ${provider}`,
                updatedAt: new Date(),
              });
              errors++;
            }

            // Mark account as synced
            await accountDoc.ref.update({
              lastSyncAt: new Date(),
              syncStatus: 'active',
              syncError: null,
              updatedAt: new Date(),
            });

          } catch (accountError) {
            logger.error(`[Sync Cron] Error syncing account ${accountId}`, {
              error: accountError instanceof Error ? accountError.message : String(accountError),
              userId,
              accountId,
            });

            // Mark account as error
            await accountDoc.ref.update({
              syncStatus: 'error',
              syncError: accountError instanceof Error ? accountError.message : 'Unknown error',
              updatedAt: new Date(),
            });
            errors++;
          }
        }

        totalAccountsSynced += synced;
        totalErrors += errors;

        userResults.push({
          userId,
          synced,
          errors,
        });

      } catch (userError) {
        logger.error(`[Sync Cron] Error processing user ${userId}`, {
          error: userError instanceof Error ? userError.message : String(userError),
        });
        totalErrors++;
      }
    }

    const duration = Date.now() - startTime;
    logger.info('[Sync Cron] Account sync job completed', {
      duration,
      totalAccountsSynced,
      totalErrors,
      usersProcessed: userResults.length,
    });

    return NextResponse.json({
      success: true,
      duration,
      totalAccountsSynced,
      totalErrors,
      usersProcessed: userResults.length,
      details: userResults,
    });

  } catch (error) {
    logger.error('[Sync Cron] Fatal error in sync job', {
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

    logger.info(`[Sync Cron] Israeli account synced: ${result.accounts.length} accounts, ${result.transactions.length} transactions`);

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
    logger.error('[Sync Cron] Israeli account sync failed', {
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

    logger.info(`[Sync Cron] Plaid account synced: ${accountsResponse.data.accounts.length} accounts`);

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

    // Note: Full transaction sync is not implemented here to keep cron fast
    // Transaction sync can be triggered separately or on-demand

  } catch (error) {
    logger.error('[Sync Cron] Plaid account sync failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      accountId,
    });
    throw error;
  }
}
