/**
 * Foreign Exchange (FX) Rate Utility
 *
 * Provides currency conversion with caching support.
 * Uses the existing cache infrastructure for Redis/memory fallback.
 */

import { CACHE_TTL,cacheGetOrSet } from './cache';
import logger from './logger';

// Supported currencies
export const SUPPORTED_CURRENCIES = ['USD', 'ILS', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// FX rate response type
interface FXRateResponse {
  result: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

// Cache configuration
const FX_CACHE_PREFIX = 'fx';
const FX_CACHE_TTL = CACHE_TTL.STATIC; // 1 hour

// Fallback rates (used when API is unavailable)
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  USD: { ILS: 3.65, EUR: 0.92, GBP: 0.79, CAD: 1.36, AUD: 1.53, JPY: 149.5, CHF: 0.88 },
  ILS: { USD: 0.274, EUR: 0.252, GBP: 0.216, CAD: 0.373, AUD: 0.419, JPY: 40.96, CHF: 0.241 },
  EUR: { USD: 1.09, ILS: 3.97, GBP: 0.86, CAD: 1.48, AUD: 1.66, JPY: 162.5, CHF: 0.96 },
};

/**
 * Fetch exchange rate from API
 */
async function fetchRateFromAPI(from: string, to: string): Promise<number> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;

  if (!apiKey) {
    logger.warn('EXCHANGE_RATE_API_KEY not configured, using fallback rates');
    return getFallbackRate(from, to);
  }

  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${from}`,
      { next: { revalidate: 3600 } } // Next.js fetch cache
    );

    if (!response.ok) {
      throw new Error(`FX API returned ${response.status}`);
    }

    const data: FXRateResponse = await response.json();

    if (data.result !== 'success' || !data.conversion_rates[to]) {
      throw new Error(`Invalid FX API response for ${from}/${to}`);
    }

    return data.conversion_rates[to];
  } catch (error) {
    logger.error('FX API fetch failed, using fallback', { from, to, error });
    return getFallbackRate(from, to);
  }
}

/**
 * Get fallback rate when API is unavailable
 */
function getFallbackRate(from: string, to: string): number {
  if (from === to) return 1;

  // Direct rate
  if (FALLBACK_RATES[from]?.[to]) {
    return FALLBACK_RATES[from][to];
  }

  // Inverse rate
  if (FALLBACK_RATES[to]?.[from]) {
    return 1 / FALLBACK_RATES[to][from];
  }

  // Cross rate via USD
  if (from !== 'USD' && to !== 'USD') {
    const fromToUsd = getFallbackRate(from, 'USD');
    const usdToTo = getFallbackRate('USD', to);
    return fromToUsd * usdToTo;
  }

  logger.warn('No fallback rate available', { from, to });
  return 1; // Safe fallback
}

/**
 * Get exchange rate between two currencies
 *
 * @param from - Source currency code (e.g., 'USD')
 * @param to - Target currency code (e.g., 'ILS')
 * @returns Exchange rate (multiply source amount by this to get target amount)
 */
export async function getRate(from: string, to: string): Promise<number> {
  // Same currency - no conversion needed
  if (from === to) return 1;

  const normalizedFrom = from.toUpperCase();
  const normalizedTo = to.toUpperCase();
  const cacheKey = `${normalizedFrom}/${normalizedTo}`;

  return cacheGetOrSet(
    cacheKey,
    () => fetchRateFromAPI(normalizedFrom, normalizedTo),
    { prefix: FX_CACHE_PREFIX, ttl: FX_CACHE_TTL }
  );
}

/**
 * Convert an amount from one currency to another
 *
 * @param amount - Amount to convert
 * @param from - Source currency code
 * @param to - Target currency code
 * @returns Converted amount
 */
export async function convert(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount;
  const rate = await getRate(from, to);
  return amount * rate;
}

/**
 * Convert multiple amounts to a single target currency
 *
 * @param amounts - Array of { amount, currency } objects
 * @param targetCurrency - Currency to convert all amounts to
 * @returns Total in target currency
 */
export async function convertMultiple(
  amounts: Array<{ amount: number; currency: string }>,
  targetCurrency: string
): Promise<number> {
  const conversions = await Promise.all(
    amounts.map(({ amount, currency }) => convert(amount, currency, targetCurrency))
  );
  return conversions.reduce((sum, val) => sum + val, 0);
}

/**
 * Check if a currency is supported
 */
export function isSupportedCurrency(currency: string): currency is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(currency.toUpperCase() as SupportedCurrency);
}

/**
 * Get all rates for a base currency
 */
export async function getAllRates(baseCurrency: string): Promise<Record<string, number>> {
  const rates: Record<string, number> = {};

  await Promise.all(
    SUPPORTED_CURRENCIES.map(async (currency) => {
      rates[currency] = await getRate(baseCurrency, currency);
    })
  );

  return rates;
}
