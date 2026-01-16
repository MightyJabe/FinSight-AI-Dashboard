import { NextResponse } from 'next/server';

import { validateAuthToken } from '@/lib/auth-server';
import { adminDb as db } from '@/lib/firebase-admin';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    const docRef = db.collection('crypto_accounts').doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const account = doc.data();

    // For wallets, fetch balance from blockchain API
    if (account?.type === 'wallet') {
      const { blockchain } = account;

      // Placeholder - integrate with blockchain APIs (Etherscan, Blockchain.info, etc.)
      // For now, return mock data
      return NextResponse.json({
        balance: '0.00',
        symbol:
          blockchain === 'bitcoin'
            ? 'BTC'
            : blockchain === 'ethereum'
              ? 'ETH'
              : blockchain === 'solana'
                ? 'SOL'
                : 'MATIC',
        message: 'Balance checking requires blockchain API integration',
      });
    }

    // For exchanges, use CCXT
    return NextResponse.json({
      balance: '0.00',
      symbol: 'USD',
      message: 'Exchange balance requires API keys',
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}
