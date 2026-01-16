import { NextRequest, NextResponse } from 'next/server';

import { getFinancialOverview } from '@/lib/financial-calculator';
import { adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

// Cache for 30 seconds to prevent excessive API calls
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includePlatforms = searchParams.get('includePlatforms') === 'true';
    const forceRefresh = searchParams.get('force') === 'true';

    // Get userId from session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { adminAuth } = await import('@/lib/firebase-admin');
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedClaims.uid;

    const cacheKey = `financial-overview-${userId}-${includePlatforms}`;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        logger.info('Returning cached financial overview data');
        return NextResponse.json(cached.data);
      }
    }

    // Fetch data using centralized calculator
    const { data: rawData, metrics } = await getFinancialOverview(userId);

    // If user opted for demo data and has no plaid accounts, inject demo values for UX
    const userDoc = await db.collection('users').doc(userId).get();
    const useDemoData = Boolean(userDoc.exists && userDoc.data()?.useDemoData);
    const hasRealAccounts = rawData.plaidAccounts.length > 0;
    const applyDemo = useDemoData && !hasRealAccounts;

    logger.info('Financial overview raw data:', {
      manualAssets: rawData.manualAssets.length,
      manualLiabilities: rawData.manualLiabilities.length,
      plaidAccounts: rawData.plaidAccounts.length,
      cryptoAccounts: rawData.cryptoAccounts.length,
      transactions: rawData.transactions.length,
      metrics: {
        totalAssets: metrics.totalAssets,
        totalLiabilities: metrics.totalLiabilities,
        netWorth: metrics.netWorth,
      },
    });

    // Validate metrics before transformation
    const { enforceFinancialAccuracy } = await import('@/lib/financial-validator');
    enforceFinancialAccuracy(metrics, 'financial-overview API');

    // Fetch cached Israeli bank accounts from Firestore
    const israeliAccountsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('accounts')
      .get();

    const israeliAccounts = israeliAccountsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Account ${data.mask || doc.id}`,
        balance: data.balance?.current || 0,
        availableBalance: data.balance?.available || null,
        type: data.type || 'depository',
        subtype: data.subtype || 'checking',
        accountType: data.type || 'depository',
        institutionName: data.institutionName || 'Israeli Bank',
        mask: data.mask || null,
        currency: data.currency || 'ILS',
        source: 'israel',
        providerId: data.providerId || 'israel',
      };
    });

    logger.info(`Found ${israeliAccounts.length} cached Israeli accounts`);

    // Transform data to match expected API format
    // Combine Plaid bank accounts with Israeli accounts
    const plaidBankAccounts = rawData.plaidAccounts.filter(
      acc =>
        acc.accountType === 'depository' &&
        acc.subtype &&
        ['checking', 'savings'].includes(acc.subtype)
    );

    const bankAccounts = [...plaidBankAccounts, ...israeliAccounts];

    const creditAccounts = rawData.plaidAccounts.filter(acc => acc.accountType === 'credit');

    const investmentAccounts = [
      ...rawData.plaidAccounts.filter(acc => acc.accountType === 'investment'),
      ...rawData.manualAssets
        .filter(asset => ['investment', 'crypto'].includes(asset.type))
        .map(asset => ({
          id: asset.id,
          name: asset.name,
          balance: asset.currentBalance,
          type: asset.type,
          source: 'manual',
        })),
      ...rawData.cryptoAccounts.map(crypto => ({
        id: crypto.id,
        name: crypto.name,
        balance: crypto.balance,
        type: 'crypto',
        source: crypto.type,
      })),
    ];

    const loanAccounts = rawData.plaidAccounts.filter(acc =>
      ['loan', 'mortgage'].includes(acc.accountType)
    );

    // Calculate Israeli accounts totals
    const israeliAccountsTotal = israeliAccounts.reduce((sum: number, acc) => sum + (acc.balance || 0), 0);

    const transformedData = {
      summary: {
        liquidAssets: applyDemo ? 12500 : metrics.liquidAssets + israeliAccountsTotal,
        totalAssets: applyDemo ? 45231 : metrics.totalAssets + israeliAccountsTotal,
        totalLiabilities: metrics.totalLiabilities,
        netWorth: applyDemo ? 45231 : metrics.netWorth + israeliAccountsTotal,
        monthlyIncome: applyDemo ? 8500 : metrics.monthlyIncome,
        monthlyExpenses: applyDemo ? 5100 : metrics.monthlyExpenses,
        monthlyCashFlow: applyDemo ? 3400 : metrics.monthlyCashFlow,
        investments: metrics.investments,
        hasIsraeliAccounts: israeliAccounts.length > 0,
      },
      accounts: {
        bank: applyDemo
          ? [
            {
              id: 'demo-checking',
              name: 'Demo Checking',
              balance: 12500,
              type: 'checking',
              institution: 'Demo Bank',
            },
          ]
          : bankAccounts,
        credit: creditAccounts,
        investment: investmentAccounts,
        loan: loanAccounts,
        crypto: rawData.cryptoAccounts,
      },
      manualAssets: applyDemo
        ? [
          { id: 'demo-savings', name: 'Emergency Fund', amount: 3000, type: 'savings' },
          { id: 'demo-brokerage', name: 'Brokerage', amount: 22000, type: 'investment' },
        ]
        : rawData.manualAssets,
      manualLiabilities: rawData.manualLiabilities,
      platforms: includePlatforms ? [] : undefined,
    };

    const responseData = {
      success: true,
      data: transformedData,
    };

    // Cache the response
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    // Clean up old cache entries
    for (const [key, value] of cache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL * 2) {
        cache.delete(key);
      }
    }

    logger.info('Financial overview data retrieved successfully');
    return NextResponse.json(responseData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('Error retrieving financial overview:', {
      error: errorMessage,
      stack: errorStack,
    });

    // In development, return detailed error for debugging
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: errorStack,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to retrieve financial data' },
      { status: 500 }
    );
  }
}
