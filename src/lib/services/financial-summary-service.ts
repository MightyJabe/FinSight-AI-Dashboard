/**
 * Financial Summary Caching Service
 * 
 * Provides cached financial summaries to avoid recalculating on every request.
 * Uses Firestore for persistence with automatic cache invalidation.
 * 
 * Database Schema:
 * users/{userId}/summaries/financial - Cached summary document
 * users/{userId}/snapshots/{YYYY-MM-DD} - Historical daily snapshots
 */

import type { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

import { calculateFinancialMetrics, fetchFinancialData, FinancialMetrics } from '@/lib/financial-calculator';
import { adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export interface CachedSummary {
    metrics: FinancialMetrics;
    lastCalculatedAt: Date;
    version: number;
    isStale: boolean;
}

export interface DailySnapshot {
    date: string;
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    liquidAssets: number;
    investments: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    createdAt: Date;
}

// Cache TTL: 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Get cached financial summary, calculating fresh if stale
 */
export async function getCachedFinancialSummary(userId: string): Promise<CachedSummary> {
    const summaryRef = db.collection('users').doc(userId).collection('summaries').doc('financial');

    try {
        const summaryDoc = await summaryRef.get();

        if (summaryDoc.exists) {
            const data = summaryDoc.data();
            const lastCalculatedAt = data?.lastCalculatedAt?.toDate?.() || new Date(0);
            const age = Date.now() - lastCalculatedAt.getTime();

            // Return cached if fresh
            if (age < CACHE_TTL_MS) {
                logger.info('Returning cached financial summary', { userId, age: `${age}ms` });
                return {
                    metrics: data?.metrics as FinancialMetrics,
                    lastCalculatedAt,
                    version: data?.version || 1,
                    isStale: false,
                };
            }
        }

        // Calculate fresh and cache
        logger.info('Calculating fresh financial summary', { userId });
        return await refreshFinancialSummary(userId);
    } catch (error) {
        logger.error('Error getting cached summary, calculating fresh', { error, userId });
        return await refreshFinancialSummary(userId);
    }
}

/**
 * Force refresh the cached financial summary
 */
export async function refreshFinancialSummary(userId: string): Promise<CachedSummary> {
    try {
        const data = await fetchFinancialData(userId);
        const metrics = await calculateFinancialMetrics(data);

        const summaryRef = db.collection('users').doc(userId).collection('summaries').doc('financial');

        const summaryData = {
            metrics,
            lastCalculatedAt: FieldValue.serverTimestamp(),
            version: FieldValue.increment(1),
        };

        await summaryRef.set(summaryData, { merge: true });

        logger.info('Financial summary cached', { userId, netWorth: metrics.netWorth });

        return {
            metrics,
            lastCalculatedAt: new Date(),
            version: 1,
            isStale: false,
        };
    } catch (error) {
        logger.error('Error refreshing financial summary', { error, userId });
        throw error;
    }
}

/**
 * Invalidate the cached summary (call when accounts/transactions change)
 */
export async function invalidateFinancialSummary(userId: string): Promise<void> {
    try {
        const summaryRef = db.collection('users').doc(userId).collection('summaries').doc('financial');
        await summaryRef.update({
            lastCalculatedAt: new Date(0), // Force cache miss on next read
        });
        logger.info('Financial summary cache invalidated', { userId });
    } catch {
        // Ignore if document doesn't exist
        logger.warn('Could not invalidate summary cache (may not exist)', { userId });
    }
}

/**
 * Save a daily snapshot for historical tracking
 */
export async function saveDailySnapshot(userId: string): Promise<DailySnapshot> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
        const { metrics } = await getCachedFinancialSummary(userId);

        const snapshot: DailySnapshot = {
            date: today as string,
            netWorth: metrics.netWorth,
            totalAssets: metrics.totalAssets,
            totalLiabilities: metrics.totalLiabilities,
            liquidAssets: metrics.liquidAssets,
            investments: metrics.investments,
            monthlyIncome: metrics.monthlyIncome,
            monthlyExpenses: metrics.monthlyExpenses,
            createdAt: new Date(),
        };

        const snapshotRef = db
            .collection('users')
            .doc(userId)
            .collection('snapshots')
            .doc(today);

        await snapshotRef.set(snapshot);

        logger.info('Daily snapshot saved', { userId, date: today, netWorth: metrics.netWorth });

        return snapshot;
    } catch (error) {
        logger.error('Error saving daily snapshot', { error, userId });
        throw error;
    }
}

/**
 * Get historical snapshots for trend analysis
 */
export async function getHistoricalSnapshots(
    userId: string,
    days: number = 30
): Promise<DailySnapshot[]> {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const snapshotsRef = db
            .collection('users')
            .doc(userId)
            .collection('snapshots')
            .where('date', '>=', startDate.toISOString().split('T')[0])
            .orderBy('date', 'asc');

        const snapshot = await snapshotsRef.get();

        return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        })) as DailySnapshot[];
    } catch (error) {
        logger.error('Error getting historical snapshots', { error, userId });
        return [];
    }
}

/**
 * Service instance for dependency injection
 */
export class FinancialSummaryService {
    constructor(private userId: string) { }

    getCachedSummary = () => getCachedFinancialSummary(this.userId);
    refresh = () => refreshFinancialSummary(this.userId);
    invalidate = () => invalidateFinancialSummary(this.userId);
    saveDailySnapshot = () => saveDailySnapshot(this.userId);
    getHistory = (days?: number) => getHistoricalSnapshots(this.userId, days);
}

export function getFinancialSummaryService(userId: string): FinancialSummaryService {
    return new FinancialSummaryService(userId);
}
