import { NextRequest, NextResponse } from 'next/server';

import { validateAuthToken } from '@/lib/auth-server';
import { adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GDPR-compliant data export endpoint
 * GET /api/user/export
 *
 * Returns all user data in JSON format for download
 * Implements P5.1 from financial-os-upgrade-comprehensive-plan.md
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    logger.info('[Data Export] Starting data export', { userId });

    // Fetch all user data collections in parallel
    const [
      accounts,
      transactions,
      bankingConnections,
      manualAssets,
      manualLiabilities,
      cryptoAccounts,
      realEstate,
      pensionFunds,
      mortgages,
      snapshots,
      budgets,
      conversations,
      alerts,
      settings,
    ] = await Promise.all([
      // Banking & Accounts
      adminDb
        .collection('users')
        .doc(userId)
        .collection('accounts')
        .get()
        .then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),

      // Transactions
      adminDb
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .get()
        .then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),

      // Banking Connections
      adminDb
        .collection('users')
        .doc(userId)
        .collection('banking_connections')
        .get()
        .then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),

      // Manual Assets
      adminDb
        .collection(`users/${userId}/manualAssets`)
        .get()
        .then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),

      // Manual Liabilities
      adminDb
        .collection(`users/${userId}/manualLiabilities`)
        .get()
        .then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),

      // Crypto Accounts
      adminDb
        .collection('users')
        .doc(userId)
        .collection('crypto_accounts')
        .get()
        .then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),

      // Real Estate
      adminDb
        .collection('users')
        .doc(userId)
        .collection('real_estate')
        .get()
        .then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),

      // Pension Funds
      adminDb
        .collection('users')
        .doc(userId)
        .collection('pension_funds')
        .get()
        .then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),

      // Mortgages
      adminDb
        .collection('users')
        .doc(userId)
        .collection('mortgages')
        .get()
        .then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),

      // Net Worth Snapshots
      adminDb
        .collection('users')
        .doc(userId)
        .collection('snapshots')
        .get()
        .then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),

      // Budgets
      adminDb
        .collection('users')
        .doc(userId)
        .collection('budgets')
        .get()
        .then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),

      // AI Conversations
      adminDb
        .collection('users')
        .doc(userId)
        .collection('conversations')
        .get()
        .then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),

      // Alerts
      adminDb
        .collection('users')
        .doc(userId)
        .collection('alerts')
        .get()
        .then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),

      // User Settings
      adminDb
        .collection('users')
        .doc(userId)
        .get()
        .then(doc => (doc.exists ? doc.data() : null)),
    ]);

    // Build export data structure
    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      version: '1.0',
      data: {
        // Financial Data
        accounts: accounts || [],
        transactions: transactions || [],
        bankingConnections: bankingConnections.map(conn => ({
          ...conn,
          // Redact sensitive tokens from export
          accessToken: '[REDACTED]',
        })),

        // Assets
        manualAssets: manualAssets || [],
        cryptoAccounts: cryptoAccounts || [],
        realEstate: realEstate || [],
        pensionFunds: pensionFunds || [],

        // Liabilities
        manualLiabilities: manualLiabilities || [],
        mortgages: mortgages || [],

        // Historical Data
        snapshots: snapshots || [],

        // User Preferences
        budgets: budgets || [],
        settings: settings || {},

        // AI Data
        conversations: conversations || [],
        alerts: alerts || [],
      },
      statistics: {
        totalAccounts: (accounts?.length || 0) + (manualAssets?.length || 0),
        totalTransactions: transactions?.length || 0,
        totalConnections: bankingConnections?.length || 0,
        totalSnapshots: snapshots?.length || 0,
        totalConversations: conversations?.length || 0,
      },
    };

    logger.info('[Data Export] Export completed successfully', {
      userId,
      totalItems: Object.values(exportData.statistics).reduce((sum, val) => sum + val, 0),
    });

    // Return as downloadable JSON file
    const filename = `finsight-export-${userId.substring(0, 8)}-${Date.now()}.json`;

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error('[Data Export] Error during data export', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export data',
      },
      { status: 500 }
    );
  }
}
