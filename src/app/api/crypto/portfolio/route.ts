import { NextRequest, NextResponse } from 'next/server';

import { validateAuthToken } from '@/lib/auth-server';
import { decryptSensitiveData, isEncryptedData } from '@/lib/encryption';
import { adminDb } from '@/lib/firebase-admin';
import { getBinancePortfolio, getCoinbasePortfolio } from '@/lib/integrations/crypto/coinbase';
import logger from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    const cryptoAccountsSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('cryptoAccounts')
      .get();

    // PERFORMANCE FIX: Fetch all portfolios in parallel instead of sequentially
    const portfolioPromises = cryptoAccountsSnapshot.docs.map(async (doc) => {
      const account = doc.data();

      try {
        // SECURITY: Decrypt API keys before use
        let apiKey = account.apiKey;
        let apiSecret = account.apiSecret;

        // Handle both encrypted (new) and plaintext (legacy) credentials
        if (isEncryptedData(apiKey)) {
          apiKey = decryptSensitiveData(apiKey);
        }
        if (isEncryptedData(apiSecret)) {
          apiSecret = decryptSensitiveData(apiSecret);
        }

        let portfolio;
        if (account.exchange === 'coinbase') {
          portfolio = await getCoinbasePortfolio(apiKey, apiSecret);
        } else if (account.exchange === 'binance') {
          portfolio = await getBinancePortfolio(apiKey, apiSecret);
        }

        return portfolio;
      } catch (error) {
        logger.error('Error fetching crypto portfolio', {
          userId,
          exchange: account.exchange,
          error,
        });
        return null; // Don't fail entire request for one exchange error
      }
    });

    // Wait for all portfolio fetches in parallel
    const results = await Promise.all(portfolioPromises);
    const portfolios = results.filter((p): p is NonNullable<typeof p> => p !== null);

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
