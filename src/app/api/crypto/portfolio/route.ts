import { NextRequest, NextResponse } from 'next/server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getBinancePortfolio, getCoinbasePortfolio } from '@/lib/integrations/crypto/coinbase';
import logger from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const cryptoAccountsSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('cryptoAccounts')
      .get();

    const portfolios = [];

    for (const doc of cryptoAccountsSnapshot.docs) {
      const account = doc.data();

      try {
        let portfolio;
        if (account.exchange === 'coinbase') {
          portfolio = await getCoinbasePortfolio(account.apiKey, account.apiSecret);
        } else if (account.exchange === 'binance') {
          portfolio = await getBinancePortfolio(account.apiKey, account.apiSecret);
        }

        if (portfolio) {
          portfolios.push(portfolio);
        }
      } catch (error) {
        logger.error('Error fetching crypto portfolio', {
          userId,
          exchange: account.exchange,
          error,
        });
      }
    }

    const totalValue = portfolios.reduce((sum, p) => sum + p.totalValue, 0);

    return NextResponse.json({
      success: true,
      portfolios,
      totalValue,
    });
  } catch (error) {
    logger.error('Error in crypto portfolio API', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
