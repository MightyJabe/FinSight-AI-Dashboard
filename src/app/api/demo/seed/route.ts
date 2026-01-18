import { NextRequest, NextResponse } from 'next/server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

/**
 * Demo Data Seed API
 * POST /api/demo/seed
 *
 * Populates the current user's account with realistic demo data
 * for testing and demonstration purposes.
 */

// Demo bank accounts (Israeli + US)
const DEMO_ACCOUNTS = [
  {
    id: 'demo-hapoalim-checking',
    name: 'Bank Hapoalim - Checking',
    type: 'depository',
    subtype: 'checking',
    balance: { current: 45230.50, available: 44000 },
    currency: 'ILS',
    institution: 'Bank Hapoalim',
    lastSynced: new Date(),
  },
  {
    id: 'demo-leumi-savings',
    name: 'Bank Leumi - Savings',
    type: 'depository',
    subtype: 'savings',
    balance: { current: 125000 },
    currency: 'ILS',
    institution: 'Bank Leumi',
    lastSynced: new Date(),
  },
  {
    id: 'demo-discount-checking',
    name: 'Discount Bank - Checking',
    type: 'depository',
    subtype: 'checking',
    balance: { current: 8750.25 },
    currency: 'ILS',
    institution: 'Discount Bank',
    lastSynced: new Date(),
  },
  {
    id: 'demo-chase-usd',
    name: 'Chase - USD Checking',
    type: 'depository',
    subtype: 'checking',
    balance: { current: 12500 },
    currency: 'USD',
    institution: 'Chase',
    lastSynced: new Date(),
  },
];

// Demo crypto holdings
const DEMO_CRYPTO = [
  {
    id: 'demo-btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    amount: 0.75,
    avgCost: 35000,
    currentPrice: 42500,
    balance: 31875, // 0.75 * 42500
    currency: 'USD',
  },
  {
    id: 'demo-eth',
    symbol: 'ETH',
    name: 'Ethereum',
    amount: 5.5,
    avgCost: 2200,
    currentPrice: 2650,
    balance: 14575, // 5.5 * 2650
    currency: 'USD',
  },
  {
    id: 'demo-sol',
    symbol: 'SOL',
    name: 'Solana',
    amount: 120,
    avgCost: 85,
    currentPrice: 98,
    balance: 11760, // 120 * 98
    currency: 'USD',
  },
];

// Demo real estate
const DEMO_PROPERTIES = [
  {
    id: 'demo-apartment-tlv',
    name: 'Apartment in Tel Aviv',
    propertyType: 'residential',
    address: 'Rothschild Blvd 45, Tel Aviv',
    purchasePrice: 2800000,
    currentValue: 3450000,
    purchaseDate: new Date('2019-03-15'),
    currency: 'ILS',
    mortgage: {
      lender: 'Bank Hapoalim',
      originalAmount: 2000000,
      currentBalance: 1650000,
      monthlyPayment: 8500,
      interestRate: 3.5,
    },
  },
];

// Demo pension funds (Israeli)
const DEMO_PENSION = [
  {
    id: 'demo-pension-migdal',
    provider: 'Migdal',
    type: 'pension',
    name: 'Migdal Makefet',
    balance: 285000,
    employerContribution: 850,
    employeeContribution: 425,
    currency: 'ILS',
    lastUpdated: new Date(),
  },
  {
    id: 'demo-keren-hishtalmut',
    provider: 'Clal',
    type: 'provident',
    name: 'Clal Keren Hishtalmut',
    balance: 145000,
    employerContribution: 625,
    employeeContribution: 375,
    currency: 'ILS',
    lastUpdated: new Date(),
  },
];

// Demo manual assets
const DEMO_MANUAL_ASSETS = [
  {
    id: 'demo-investment-account',
    name: 'IBI Investment Account',
    type: 'investment',
    amount: 180000,
    currentBalance: 195000,
    currency: 'ILS',
  },
  {
    id: 'demo-car',
    name: 'Toyota Corolla 2022',
    type: 'vehicle',
    amount: 85000,
    currentBalance: 72000,
    currency: 'ILS',
  },
];

// Demo liabilities
const DEMO_LIABILITIES = [
  {
    id: 'demo-credit-card-visa',
    name: 'Visa Credit Card',
    type: 'credit_card',
    amount: 4500,
    currency: 'ILS',
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
  },
  {
    id: 'demo-car-loan',
    name: 'Car Loan - Bank Leumi',
    type: 'auto_loan',
    amount: 35000,
    monthlyPayment: 1200,
    remainingPayments: 30,
    interestRate: 4.2,
    currency: 'ILS',
  },
];

// Demo transactions
const DEMO_TRANSACTIONS = [
  { description: 'Salary - Tech Company Ltd', amount: 28500, category: 'income', date: -2 },
  { description: 'Shufersal Supermarket', amount: -850, category: 'groceries', date: -1 },
  { description: 'Netflix Subscription', amount: -54.90, category: 'entertainment', date: -3 },
  { description: 'Electricity - IEC', amount: -420, category: 'utilities', date: -5 },
  { description: 'Gym Membership - Holmes Place', amount: -350, category: 'health', date: -7 },
  { description: 'Restaurant - Ouzeria', amount: -280, category: 'dining', date: -4 },
  { description: 'Fuel - Paz', amount: -320, category: 'transportation', date: -2 },
  { description: 'Amazon Purchase', amount: -450, category: 'shopping', date: -6 },
  { description: 'Water Bill - Mekorot', amount: -180, category: 'utilities', date: -10 },
  { description: 'Spotify Premium', amount: -29.90, category: 'entertainment', date: -8 },
  { description: 'Medical Checkup', amount: -150, category: 'health', date: -12 },
  { description: 'Coffee - Aroma', amount: -32, category: 'dining', date: -1 },
  { description: 'Internet - Bezeq', amount: -199, category: 'utilities', date: -15 },
  { description: 'Freelance Income', amount: 5500, category: 'income', date: -20 },
  { description: 'Clothing - Zara', amount: -380, category: 'shopping', date: -18 },
].map((t, i) => ({
  id: `demo-tx-${i}`,
  ...t,
  date: new Date(Date.now() + t.date * 24 * 60 * 60 * 1000),
  currency: 'ILS',
  accountId: 'demo-hapoalim-checking',
}));

export async function POST(request: NextRequest) {
  try {
    // Get userId from session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedClaims.uid;

    logger.info('Seeding demo data for user', { userId });

    const userRef = adminDb.collection('users').doc(userId);
    const batch = adminDb.batch();

    // 1. Seed bank accounts
    for (const account of DEMO_ACCOUNTS) {
      const accountRef = userRef.collection('accounts').doc(account.id);
      batch.set(accountRef, {
        ...account,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 2. Seed crypto holdings
    for (const crypto of DEMO_CRYPTO) {
      const cryptoRef = userRef.collection('crypto').doc(crypto.id);
      batch.set(cryptoRef, {
        ...crypto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 3. Seed real estate properties
    for (const property of DEMO_PROPERTIES) {
      const propertyRef = userRef.collection('properties').doc(property.id);
      batch.set(propertyRef, {
        ...property,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 4. Seed pension funds
    for (const pension of DEMO_PENSION) {
      const pensionRef = userRef.collection('pension').doc(pension.id);
      batch.set(pensionRef, {
        ...pension,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 5. Seed manual assets
    for (const asset of DEMO_MANUAL_ASSETS) {
      const assetRef = userRef.collection('manualAssets').doc(asset.id);
      batch.set(assetRef, {
        ...asset,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 6. Seed liabilities
    for (const liability of DEMO_LIABILITIES) {
      const liabilityRef = userRef.collection('manualLiabilities').doc(liability.id);
      batch.set(liabilityRef, {
        ...liability,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 7. Seed transactions
    for (const transaction of DEMO_TRANSACTIONS) {
      const txRef = userRef.collection('transactions').doc(transaction.id);
      batch.set(txRef, {
        ...transaction,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 8. Update user profile with demo flag
    batch.set(userRef, {
      isDemoAccount: true,
      demoSeededAt: new Date(),
      preferredCurrency: 'ILS',
      updatedAt: new Date(),
    }, { merge: true });

    // Commit all changes
    await batch.commit();

    // Calculate summary for response
    const totalILSAssets =
      DEMO_ACCOUNTS.filter(a => a.currency === 'ILS').reduce((sum, a) => sum + a.balance.current, 0) +
      DEMO_PROPERTIES.reduce((sum, p) => sum + p.currentValue, 0) +
      DEMO_PENSION.reduce((sum, p) => sum + p.balance, 0) +
      DEMO_MANUAL_ASSETS.reduce((sum, a) => sum + (a.currentBalance || a.amount), 0);

    const totalUSDAssets =
      DEMO_ACCOUNTS.filter(a => a.currency === 'USD').reduce((sum, a) => sum + a.balance.current, 0) +
      DEMO_CRYPTO.reduce((sum, c) => sum + c.balance, 0);

    const totalLiabilities =
      DEMO_LIABILITIES.reduce((sum, l) => sum + l.amount, 0) +
      (DEMO_PROPERTIES[0]?.mortgage?.currentBalance || 0);

    logger.info('Demo data seeded successfully', {
      userId,
      accounts: DEMO_ACCOUNTS.length,
      crypto: DEMO_CRYPTO.length,
      properties: DEMO_PROPERTIES.length,
      pension: DEMO_PENSION.length,
      transactions: DEMO_TRANSACTIONS.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      summary: {
        accounts: DEMO_ACCOUNTS.length,
        cryptoHoldings: DEMO_CRYPTO.length,
        properties: DEMO_PROPERTIES.length,
        pensionFunds: DEMO_PENSION.length,
        manualAssets: DEMO_MANUAL_ASSETS.length,
        liabilities: DEMO_LIABILITIES.length,
        transactions: DEMO_TRANSACTIONS.length,
        estimatedNetWorth: {
          ILS: totalILSAssets - totalLiabilities,
          USD: totalUSDAssets,
        },
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error seeding demo data:', { error: errorMessage });

    return NextResponse.json(
      { success: false, error: 'Failed to seed demo data' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if demo data exists
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedClaims.uid;

    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    return NextResponse.json({
      success: true,
      isDemoAccount: userData?.isDemoAccount || false,
      demoSeededAt: userData?.demoSeededAt?.toDate() || null,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to check demo status' },
      { status: 500 }
    );
  }
}
