/**
 * Historical Snapshot Backfill Script
 *
 * Generates monthly snapshots for the past 3 months for all existing users
 * Implements P5.3 from financial-os-upgrade-comprehensive-plan.md
 *
 * Usage: ts-node scripts/backfill-snapshots.ts
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase credentials are not configured');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = admin.firestore();

interface BackfillStats {
  totalUsers: number;
  usersProcessed: number;
  snapshotsCreated: number;
  snapshotsSkipped: number;
  errors: number;
}

/**
 * Create a historical snapshot for a specific date
 */
async function createHistoricalSnapshot(
  userId: string,
  date: Date
): Promise<'created' | 'skipped' | 'error'> {
  try {
    const dateStr = date.toISOString().split('T')[0];
    if (!dateStr) {
      throw new Error('Invalid date string');
    }

    // Check if snapshot already exists
    const existingSnapshot = await db.doc(`users/${userId}/snapshots/${dateStr}`).get();
    if (existingSnapshot.exists) {
      console.log(`  ⏭️  Snapshot already exists for ${dateStr}`);
      return 'skipped';
    }

    // Fetch financial data (similar to createDailySnapshot)
    const { fetchFinancialData, calculateFinancialMetrics } = await import(
      '../src/lib/financial-calculator.js'
    );
    const { getUserBaseCurrency } = await import('../src/lib/snapshot-service.js');

    const financialData = await fetchFinancialData(userId);
    await calculateFinancialMetrics(financialData);
    const baseCurrency = await getUserBaseCurrency(userId);

    // Process accounts
    const accountContributions: any[] = [];

    // Helper function to categorize accounts
    const getAccountCategory = (type: string): string => {
      const lowerType = type.toLowerCase();
      if (lowerType.includes('crypto')) return 'crypto';
      if (lowerType.includes('real') || lowerType.includes('property')) return 'realEstate';
      if (lowerType.includes('pension') || lowerType.includes('retirement')) return 'pension';
      if (lowerType.includes('mortgage')) return 'mortgages';
      if (lowerType.includes('credit') || lowerType.includes('card')) return 'creditCards';
      if (lowerType.includes('loan') || lowerType.includes('debt')) return 'loans';
      if (lowerType.includes('investment')) return 'investments';
      return 'cash';
    };

    const isLiability = (type: string): boolean => {
      const lowerType = type.toLowerCase();
      return (
        lowerType.includes('liability') ||
        lowerType.includes('loan') ||
        lowerType.includes('mortgage') ||
        lowerType.includes('credit') ||
        lowerType.includes('debt')
      );
    };

    // Process all account types
    for (const acc of financialData.plaidAccounts) {
      accountContributions.push({
        accountId: acc.id,
        name: acc.name,
        value: acc.balance,
        originalValue: acc.balance,
        type: isLiability(acc.type) ? 'liability' : 'asset',
        category: getAccountCategory(acc.type),
        currency: 'USD',
      });
    }

    for (const asset of financialData.manualAssets) {
      accountContributions.push({
        accountId: asset.id,
        name: asset.name,
        value: asset.currentBalance,
        originalValue: asset.currentBalance,
        type: 'asset',
        category: getAccountCategory(asset.type),
        currency: 'USD',
      });
    }

    for (const liability of financialData.manualLiabilities) {
      accountContributions.push({
        accountId: liability.id,
        name: liability.name,
        value: liability.amount,
        originalValue: liability.amount,
        type: 'liability',
        category: getAccountCategory(liability.type),
        currency: 'USD',
      });
    }

    for (const crypto of financialData.cryptoAccounts) {
      accountContributions.push({
        accountId: crypto.id,
        name: crypto.name,
        value: crypto.balance,
        originalValue: crypto.balance,
        type: 'asset',
        category: 'crypto',
        currency: 'USD',
      });
    }

    for (const property of financialData.realEstateAssets) {
      accountContributions.push({
        accountId: property.id,
        name: property.name,
        value: property.balance,
        originalValue: property.balance,
        type: 'asset',
        category: 'realEstate',
        currency: 'USD',
      });
    }

    for (const pension of financialData.pensionAssets) {
      accountContributions.push({
        accountId: pension.id,
        name: pension.name,
        value: pension.balance,
        originalValue: pension.balance,
        type: 'asset',
        category: 'pension',
        currency: 'USD',
      });
    }

    for (const mortgage of financialData.mortgageLiabilities) {
      accountContributions.push({
        accountId: mortgage.id,
        name: mortgage.name,
        value: mortgage.amount,
        originalValue: mortgage.amount,
        type: 'liability',
        category: 'mortgages',
        currency: 'USD',
      });
    }

    // Calculate breakdown
    const breakdown = {
      cash: 0,
      investments: 0,
      crypto: 0,
      realEstate: 0,
      pension: 0,
      creditCards: 0,
      loans: 0,
      mortgages: 0,
    };

    for (const acc of accountContributions) {
      const category = acc.category as keyof typeof breakdown;
      breakdown[category] += acc.value;
    }

    // Calculate totals
    const totalAssets = accountContributions
      .filter(a => a.type === 'asset')
      .reduce((sum, a) => sum + a.value, 0);

    const totalLiabilities = accountContributions
      .filter(a => a.type === 'liability')
      .reduce((sum, a) => sum + a.value, 0);

    const netWorth = totalAssets - totalLiabilities;

    // Create snapshot document with historical timestamp
    const snapshot = {
      date: dateStr,
      timestamp: Timestamp.fromDate(date),
      netWorth,
      totalAssets,
      totalLiabilities,
      baseCurrency,
      breakdown,
      accounts: accountContributions,
      backfilled: true, // Mark as backfilled for tracking
    };

    // Store in Firestore
    await db.doc(`users/${userId}/snapshots/${dateStr}`).set(snapshot);

    console.log(`  ✅ Created snapshot for ${dateStr} (Net Worth: $${netWorth.toFixed(2)})`);
    return 'created';
  } catch (error) {
    console.error(`  ❌ Error creating snapshot for ${date.toISOString().split('T')[0]}:`, error);
    return 'error';
  }
}

/**
 * Backfill snapshots for a single user
 */
async function backfillUserSnapshots(userId: string, monthsBack: number = 3): Promise<BackfillStats> {
  console.log(`\n📊 Processing user: ${userId}`);

  const stats: BackfillStats = {
    totalUsers: 1,
    usersProcessed: 0,
    snapshotsCreated: 0,
    snapshotsSkipped: 0,
    errors: 0,
  };

  try {
    // Generate dates for first day of each month going back N months
    const dates: Date[] = [];
    for (let i = 0; i < monthsBack; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1); // First day of month
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }

    // Create snapshots for each historical date
    for (const date of dates) {
      const result = await createHistoricalSnapshot(userId, date);
      if (result === 'created') stats.snapshotsCreated++;
      else if (result === 'skipped') stats.snapshotsSkipped++;
      else stats.errors++;
    }

    stats.usersProcessed = 1;
    console.log(`  ✨ Completed: ${stats.snapshotsCreated} created, ${stats.snapshotsSkipped} skipped`);
  } catch (error) {
    console.error(`  ❌ Error processing user:`, error);
    stats.errors++;
  }

  return stats;
}

/**
 * Backfill snapshots for all users
 */
async function backfillAllUsers(monthsBack: number = 3): Promise<BackfillStats> {
  console.log('\n🚀 Starting historical snapshot backfill...\n');
  console.log(`📅 Generating monthly snapshots for the past ${monthsBack} months\n`);

  const totalStats: BackfillStats = {
    totalUsers: 0,
    usersProcessed: 0,
    snapshotsCreated: 0,
    snapshotsSkipped: 0,
    errors: 0,
  };

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    totalStats.totalUsers = usersSnapshot.size;

    console.log(`👥 Found ${totalStats.totalUsers} users\n`);

    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userStats = await backfillUserSnapshots(userId, monthsBack);

      totalStats.usersProcessed += userStats.usersProcessed;
      totalStats.snapshotsCreated += userStats.snapshotsCreated;
      totalStats.snapshotsSkipped += userStats.snapshotsSkipped;
      totalStats.errors += userStats.errors;
    }

    console.log('\n✅ Backfill completed successfully!');
    console.log('\n📈 Final Statistics:');
    console.log(`   Total Users: ${totalStats.totalUsers}`);
    console.log(`   Users Processed: ${totalStats.usersProcessed}`);
    console.log(`   Snapshots Created: ${totalStats.snapshotsCreated}`);
    console.log(`   Snapshots Skipped: ${totalStats.snapshotsSkipped}`);
    console.log(`   Errors: ${totalStats.errors}`);
  } catch (error) {
    console.error('\n❌ Fatal error during backfill:', error);
    throw error;
  }

  return totalStats;
}

// Run the script
if (require.main === module) {
  const monthsBack = parseInt(process.env.MONTHS_BACK || '3', 10);

  backfillAllUsers(monthsBack)
    .then(() => {
      console.log('\n🎉 Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

export { backfillAllUsers, backfillUserSnapshots };
