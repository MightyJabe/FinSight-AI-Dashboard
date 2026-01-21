/**
 * Snapshot Service
 *
 * Creates and manages daily net worth snapshots with multi-currency support.
 * Integrates with the existing financial calculator and FX utility.
 */

import { Timestamp } from 'firebase-admin/firestore';

import { calculateFinancialMetrics,fetchFinancialData } from '@/lib/financial-calculator';
import { adminDb as db } from '@/lib/firebase-admin';
import { convert,getRate } from '@/lib/fx';
import logger from '@/lib/logger';

// Snapshot types
export interface AccountContribution {
  accountId: string;
  name: string;
  value: number;
  originalValue: number;
  type: 'asset' | 'liability';
  category: string;
  currency: string;
  fxRate?: number | undefined;
  fxRateTimestamp?: Timestamp | undefined;
}

export interface SnapshotBreakdown {
  cash: number;
  investments: number;
  crypto: number;
  realEstate: number;
  pension: number;
  creditCards: number;
  loans: number;
  mortgages: number;
}

export interface DailySnapshot {
  date: string; // YYYY-MM-DD (document ID)
  timestamp: Timestamp;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  baseCurrency: string;
  breakdown: SnapshotBreakdown;
  accounts: AccountContribution[];
}

// Default user currency
const DEFAULT_CURRENCY = 'USD';

/**
 * Get user's base currency preference
 */
export async function getUserBaseCurrency(userId: string): Promise<string> {
  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    const data = userDoc.data();
    return data?.baseCurrency || data?.currency || DEFAULT_CURRENCY;
  } catch (error) {
    logger.warn('Failed to get user currency, using default', { userId, error });
    return DEFAULT_CURRENCY;
  }
}

/**
 * Determine account category for breakdown
 */
function getAccountCategory(type: string, accountType?: string): keyof SnapshotBreakdown {
  const lowerType = type.toLowerCase();
  const lowerAccountType = accountType?.toLowerCase() || '';

  if (lowerType.includes('crypto') || lowerType.includes('exchange') || lowerType.includes('wallet')) {
    return 'crypto';
  }
  if (lowerType.includes('real') || lowerType.includes('property')) {
    return 'realEstate';
  }
  if (lowerType.includes('pension') || lowerType.includes('retirement') || lowerType.includes('401k')) {
    return 'pension';
  }
  if (lowerType.includes('mortgage')) {
    return 'mortgages';
  }
  if (lowerType.includes('credit') || lowerType.includes('card')) {
    return 'creditCards';
  }
  if (lowerType.includes('loan') || lowerType.includes('debt')) {
    return 'loans';
  }
  if (lowerType.includes('investment') || lowerAccountType === 'investment') {
    return 'investments';
  }
  if (
    lowerType.includes('checking') ||
    lowerType.includes('savings') ||
    lowerType.includes('cash') ||
    lowerAccountType === 'depository'
  ) {
    return 'cash';
  }

  return 'cash'; // Default fallback
}

/**
 * Determine if account type is a liability
 */
function isLiability(type: string): boolean {
  const lowerType = type.toLowerCase();
  return (
    lowerType.includes('liability') ||
    lowerType.includes('loan') ||
    lowerType.includes('mortgage') ||
    lowerType.includes('credit') ||
    lowerType.includes('debt')
  );
}

/**
 * Create a daily snapshot for a user
 */
export async function createDailySnapshot(userId: string): Promise<DailySnapshot> {
  const startTime = Date.now();
  logger.info('Creating daily snapshot', { userId });

  // Fetch all financial data
  const financialData = await fetchFinancialData(userId);
  // Note: We calculate our own totals from contributions for snapshot consistency
  // but we still run calculateFinancialMetrics to validate the data
  await calculateFinancialMetrics(financialData);
  const baseCurrency = await getUserBaseCurrency(userId);

  // Process all accounts into contributions with FX conversion
  const accountContributions: AccountContribution[] = [];
  const now = Timestamp.now();

  // Process Plaid accounts
  // Note: Plaid accounts from FinancialData don't have currency field,
  // so we default to USD. In the future, currency should be fetched from Plaid.
  for (const acc of financialData.plaidAccounts) {
    const currency = DEFAULT_CURRENCY; // Plaid accounts default to USD
    const originalValue = acc.balance;
    let value = originalValue;
    let fxRate: number | undefined;

    if (currency !== baseCurrency) {
      fxRate = await getRate(currency, baseCurrency);
      value = await convert(originalValue, currency, baseCurrency);
    }

    accountContributions.push({
      accountId: acc.id,
      name: acc.name,
      value,
      originalValue,
      type: isLiability(acc.type) ? 'liability' : 'asset',
      category: getAccountCategory(acc.type, acc.accountType),
      currency,
      fxRate,
      fxRateTimestamp: fxRate ? now : undefined,
    });
  }

  // Process manual assets
  for (const asset of financialData.manualAssets) {
    const currency = DEFAULT_CURRENCY; // Manual assets don't have currency field
    accountContributions.push({
      accountId: asset.id,
      name: asset.name,
      value: asset.currentBalance,
      originalValue: asset.currentBalance,
      type: 'asset',
      category: getAccountCategory(asset.type),
      currency,
    });
  }

  // Process manual liabilities
  for (const liability of financialData.manualLiabilities) {
    accountContributions.push({
      accountId: liability.id,
      name: liability.name,
      value: liability.amount,
      originalValue: liability.amount,
      type: 'liability',
      category: getAccountCategory(liability.type),
      currency: DEFAULT_CURRENCY,
    });
  }

  // Process crypto accounts
  for (const crypto of financialData.cryptoAccounts) {
    accountContributions.push({
      accountId: crypto.id,
      name: crypto.name,
      value: crypto.balance,
      originalValue: crypto.balance,
      type: 'asset',
      category: 'crypto',
      currency: DEFAULT_CURRENCY, // Crypto values are typically in USD
    });
  }

  // Process real estate
  for (const property of financialData.realEstateAssets) {
    accountContributions.push({
      accountId: property.id,
      name: property.name,
      value: property.balance,
      originalValue: property.balance,
      type: 'asset',
      category: 'realEstate',
      currency: DEFAULT_CURRENCY,
    });
  }

  // Process pension
  for (const pension of financialData.pensionAssets) {
    accountContributions.push({
      accountId: pension.id,
      name: pension.name,
      value: pension.balance,
      originalValue: pension.balance,
      type: 'asset',
      category: 'pension',
      currency: DEFAULT_CURRENCY,
    });
  }

  // Process mortgages
  for (const mortgage of financialData.mortgageLiabilities) {
    accountContributions.push({
      accountId: mortgage.id,
      name: mortgage.name,
      value: mortgage.amount,
      originalValue: mortgage.amount,
      type: 'liability',
      category: 'mortgages',
      currency: DEFAULT_CURRENCY,
    });
  }

  // Calculate breakdown
  const breakdown: SnapshotBreakdown = {
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
    const category = acc.category as keyof SnapshotBreakdown;
    if (acc.type === 'asset') {
      breakdown[category] += acc.value;
    } else {
      breakdown[category] += acc.value; // Liabilities are positive in their categories
    }
  }

  // Calculate totals
  const totalAssets = accountContributions
    .filter((a) => a.type === 'asset')
    .reduce((sum, a) => sum + a.value, 0);

  const totalLiabilities = accountContributions
    .filter((a) => a.type === 'liability')
    .reduce((sum, a) => sum + a.value, 0);

  const netWorth = totalAssets - totalLiabilities;

  // Create snapshot document
  const isoDate = new Date().toISOString();
  const today = isoDate.split('T')[0] ?? isoDate.slice(0, 10);
  const snapshot: DailySnapshot = {
    date: today,
    timestamp: now,
    netWorth,
    totalAssets,
    totalLiabilities,
    baseCurrency,
    breakdown,
    accounts: accountContributions,
  };

  // Store in Firestore
  await db.doc(`users/${userId}/snapshots/${today}`).set(snapshot);

  const duration = Date.now() - startTime;
  logger.info('Daily snapshot created', {
    userId,
    date: today,
    netWorth,
    totalAssets,
    totalLiabilities,
    accountCount: accountContributions.length,
    durationMs: duration,
  });

  return snapshot;
}

/**
 * Get a snapshot for a specific date
 */
export async function getSnapshot(userId: string, date: string): Promise<DailySnapshot | null> {
  const doc = await db.doc(`users/${userId}/snapshots/${date}`).get();
  if (!doc.exists) {
    return null;
  }
  return doc.data() as DailySnapshot;
}

/**
 * Get snapshots for a date range
 */
export async function getSnapshots(
  userId: string,
  startDate: string,
  endDate: string
): Promise<DailySnapshot[]> {
  const snapshot = await db
    .collection(`users/${userId}/snapshots`)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .orderBy('date', 'asc')
    .get();

  return snapshot.docs.map((doc) => doc.data() as DailySnapshot);
}

/**
 * Get the most recent snapshot
 */
export async function getLatestSnapshot(userId: string): Promise<DailySnapshot | null> {
  const snapshot = await db
    .collection(`users/${userId}/snapshots`)
    .orderBy('date', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty || !snapshot.docs[0]) {
    return null;
  }

  return snapshot.docs[0].data() as DailySnapshot;
}

/**
 * Get snapshot count for a user
 */
export async function getSnapshotCount(userId: string): Promise<number> {
  const snapshot = await db.collection(`users/${userId}/snapshots`).count().get();
  return snapshot.data()?.count ?? 0;
}

/**
 * Delete old snapshots (keep last N days)
 */
export async function pruneOldSnapshots(userId: string, keepDays: number = 365): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - keepDays);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  const oldSnapshots = await db
    .collection(`users/${userId}/snapshots`)
    .where('date', '<', cutoffStr)
    .get();

  if (oldSnapshots.empty) {
    return 0;
  }

  const batch = db.batch();
  oldSnapshots.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  logger.info('Pruned old snapshots', { userId, deletedCount: oldSnapshots.size, cutoffDate: cutoffStr });
  return oldSnapshots.size;
}
