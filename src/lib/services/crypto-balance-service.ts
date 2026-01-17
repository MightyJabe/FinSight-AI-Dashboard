/**
 * Crypto Balance Service
 *
 * Fetches and caches crypto balances from exchanges.
 * Used by the financial calculator for accurate net worth.
 */

import { decryptSensitiveData, isEncryptedData } from '@/lib/encryption';
import { adminDb } from '@/lib/firebase-admin';
import { type CryptoPortfolio,getBinancePortfolio, getCoinbasePortfolio } from '@/lib/integrations/crypto/coinbase';
import logger from '@/lib/logger';

// Cache crypto balances for 5 minutes to avoid hitting rate limits
const CACHE_TTL = 5 * 60 * 1000;
const balanceCache = new Map<string, { totalValue: number; portfolios: CryptoPortfolio[]; timestamp: number }>();

export interface CryptoBalanceResult {
  totalValue: number;
  portfolios: CryptoPortfolio[];
  fromCache: boolean;
  accounts: Array<{
    id: string;
    name: string;
    exchange: string;
    balance: number;
    type: 'exchange' | 'wallet';
  }>;
}

/**
 * Get total crypto balance for a user
 * Uses caching to avoid hitting exchange rate limits
 */
export async function getCryptoBalance(userId: string, forceRefresh = false): Promise<CryptoBalanceResult> {
  const cacheKey = `crypto-${userId}`;

  // Check cache first
  if (!forceRefresh) {
    const cached = balanceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.debug('Returning cached crypto balance', { userId });
      return {
        totalValue: cached.totalValue,
        portfolios: cached.portfolios,
        fromCache: true,
        accounts: portfoliosToAccounts(cached.portfolios),
      };
    }
  }

  try {
    // Fetch crypto accounts from Firestore
    const cryptoAccountsSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('cryptoAccounts')
      .get();

    if (cryptoAccountsSnapshot.empty) {
      // No crypto accounts configured
      return {
        totalValue: 0,
        portfolios: [],
        fromCache: false,
        accounts: [],
      };
    }

    // Fetch all portfolios in parallel
    const portfolioPromises = cryptoAccountsSnapshot.docs.map(async (doc) => {
      const account = doc.data();
      const accountId = doc.id;

      try {
        // Decrypt API keys
        let apiKey = account.apiKey;
        let apiSecret = account.apiSecret;

        if (isEncryptedData(apiKey)) {
          apiKey = decryptSensitiveData(apiKey);
        }
        if (isEncryptedData(apiSecret)) {
          apiSecret = decryptSensitiveData(apiSecret);
        }

        let portfolio: CryptoPortfolio | null = null;

        if (account.exchange === 'coinbase') {
          portfolio = await getCoinbasePortfolio(apiKey, apiSecret);
        } else if (account.exchange === 'binance') {
          portfolio = await getBinancePortfolio(apiKey, apiSecret);
        }

        if (portfolio) {
          // Add account ID for reference
          return { ...portfolio, accountId };
        }
        return null;
      } catch (error) {
        logger.error('Error fetching crypto portfolio', {
          userId,
          accountId,
          exchange: account.exchange,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return null;
      }
    });

    const results = await Promise.all(portfolioPromises);
    const portfolios = results.filter((p): p is CryptoPortfolio & { accountId: string } => p !== null);
    const totalValue = portfolios.reduce((sum, p) => sum + p.totalValue, 0);

    // Cache the results
    balanceCache.set(cacheKey, {
      totalValue,
      portfolios,
      timestamp: Date.now(),
    });

    logger.info('Crypto balance fetched successfully', {
      userId,
      totalValue,
      exchangeCount: portfolios.length,
    });

    return {
      totalValue,
      portfolios,
      fromCache: false,
      accounts: portfoliosToAccounts(portfolios),
    };
  } catch (error) {
    logger.error('Error in getCryptoBalance', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Return cached value if available, even if stale
    const cached = balanceCache.get(cacheKey);
    if (cached) {
      logger.warn('Returning stale cached crypto balance due to error', { userId });
      return {
        totalValue: cached.totalValue,
        portfolios: cached.portfolios,
        fromCache: true,
        accounts: portfoliosToAccounts(cached.portfolios),
      };
    }

    // No cache, return zero
    return {
      totalValue: 0,
      portfolios: [],
      fromCache: false,
      accounts: [],
    };
  }
}

/**
 * Convert portfolios to account format for financial calculator
 */
function portfoliosToAccounts(portfolios: CryptoPortfolio[]): CryptoBalanceResult['accounts'] {
  return portfolios.map((p, index) => ({
    id: `crypto-${p.exchange.toLowerCase()}-${index}`,
    name: p.exchange,
    exchange: p.exchange,
    balance: p.totalValue,
    type: 'exchange' as const,
  }));
}

/**
 * Clear the cache for a specific user (e.g., after connecting a new exchange)
 */
export function clearCryptoCache(userId: string): void {
  balanceCache.delete(`crypto-${userId}`);
}

/**
 * Clear all cached crypto balances
 */
export function clearAllCryptoCache(): void {
  balanceCache.clear();
}
