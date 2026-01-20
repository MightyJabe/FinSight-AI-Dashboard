/**
 * Tests for FX Rate Utility
 */

// Mock the cache module - must be before imports
jest.mock('../cache', () => ({
  cacheGetOrSet: jest.fn((key: string, fetcher: () => Promise<number>) => fetcher()),
  CACHE_TTL: { STATIC: 3600 },
}));

// Mock the logger - must be before imports
jest.mock('../logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

import {
  getRate,
  convert,
  convertMultiple,
  isSupportedCurrency,
  getAllRates,
  SUPPORTED_CURRENCIES,
} from '../fx';
import logger from '../logger';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Get reference to mocked logger for assertions
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('FX Rate Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXCHANGE_RATE_API_KEY;
  });

  describe('getRate', () => {
    it('returns 1 for same currency', async () => {
      const rate = await getRate('USD', 'USD');
      expect(rate).toBe(1);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns 1 for same currency (case insensitive)', async () => {
      const rate = await getRate('usd', 'USD');
      expect(rate).toBe(1);
    });

    it('uses fallback rates when API key not configured', async () => {
      const rate = await getRate('USD', 'ILS');
      expect(rate).toBe(3.65); // Fallback rate
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'EXCHANGE_RATE_API_KEY not configured, using fallback rates'
      );
    });

    it('fetches rate from API when key is configured', async () => {
      process.env.EXCHANGE_RATE_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            result: 'success',
            base_code: 'USD',
            conversion_rates: { ILS: 3.72 },
          }),
      });

      const rate = await getRate('USD', 'ILS');
      expect(rate).toBe(3.72);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://v6.exchangerate-api.com/v6/test-key/latest/USD',
        expect.any(Object)
      );
    });

    it('falls back when API returns error status', async () => {
      process.env.EXCHANGE_RATE_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const rate = await getRate('USD', 'EUR');
      expect(rate).toBe(0.92); // Fallback rate
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('falls back when API returns invalid response', async () => {
      process.env.EXCHANGE_RATE_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            result: 'error',
            conversion_rates: {},
          }),
      });

      const rate = await getRate('USD', 'GBP');
      expect(rate).toBe(0.79); // Fallback rate
    });

    it('falls back when fetch throws', async () => {
      process.env.EXCHANGE_RATE_API_KEY = 'test-key';
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const rate = await getRate('USD', 'CAD');
      expect(rate).toBe(1.36); // Fallback rate
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('calculates inverse fallback rate', async () => {
      const rate = await getRate('ILS', 'USD');
      expect(rate).toBeCloseTo(0.274, 2);
    });

    it('calculates cross rate via USD', async () => {
      const rate = await getRate('ILS', 'GBP');
      // ILS -> USD (0.274) * USD -> GBP (0.79) ≈ 0.216
      expect(rate).toBeCloseTo(0.216, 2);
    });

    it('returns 1 and warns for unsupported currency pair', async () => {
      // XYZ is not in fallback rates, so should return 1 with warning
      const rate = await getRate('USD', 'XYZ');
      expect(rate).toBe(1);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No fallback rate available',
        expect.any(Object)
      );
    });

    it('calculates inverse rate correctly for EUR to ILS', async () => {
      // EUR->ILS is not direct but ILS->EUR exists (0.252), so inverse = 1/0.252 ≈ 3.97
      const rate = await getRate('EUR', 'ILS');
      expect(rate).toBeCloseTo(3.97, 1);
    });
  });

  describe('convert', () => {
    it('returns same amount for same currency', async () => {
      const result = await convert(100, 'USD', 'USD');
      expect(result).toBe(100);
    });

    it('converts USD to ILS using fallback rate', async () => {
      const result = await convert(100, 'USD', 'ILS');
      expect(result).toBe(365); // 100 * 3.65
    });

    it('converts zero amount', async () => {
      const result = await convert(0, 'USD', 'EUR');
      expect(result).toBe(0);
    });

    it('converts negative amount', async () => {
      const result = await convert(-50, 'USD', 'ILS');
      expect(result).toBe(-182.5); // -50 * 3.65
    });
  });

  describe('convertMultiple', () => {
    it('converts multiple amounts to target currency', async () => {
      const amounts = [
        { amount: 100, currency: 'USD' },
        { amount: 100, currency: 'EUR' },
      ];

      // USD: 100 * 3.65 = 365
      // EUR: 100 * 3.97 = 397
      // Total: 762
      const result = await convertMultiple(amounts, 'ILS');
      expect(result).toBeCloseTo(762, 0);
    });

    it('handles empty array', async () => {
      const result = await convertMultiple([], 'USD');
      expect(result).toBe(0);
    });

    it('handles single currency array', async () => {
      const amounts = [
        { amount: 50, currency: 'USD' },
        { amount: 75, currency: 'USD' },
      ];

      const result = await convertMultiple(amounts, 'USD');
      expect(result).toBe(125);
    });
  });

  describe('isSupportedCurrency', () => {
    it('returns true for supported currencies', () => {
      expect(isSupportedCurrency('USD')).toBe(true);
      expect(isSupportedCurrency('ILS')).toBe(true);
      expect(isSupportedCurrency('EUR')).toBe(true);
      expect(isSupportedCurrency('GBP')).toBe(true);
    });

    it('returns true for lowercase currencies', () => {
      expect(isSupportedCurrency('usd')).toBe(true);
      expect(isSupportedCurrency('eur')).toBe(true);
    });

    it('returns false for unsupported currencies', () => {
      expect(isSupportedCurrency('XYZ')).toBe(false);
      expect(isSupportedCurrency('BTC')).toBe(false);
      expect(isSupportedCurrency('')).toBe(false);
    });
  });

  describe('getAllRates', () => {
    it('returns rates for all supported currencies', async () => {
      const rates = await getAllRates('USD');

      expect(Object.keys(rates)).toHaveLength(SUPPORTED_CURRENCIES.length);
      expect(rates.USD).toBe(1);
      expect(rates.ILS).toBe(3.65);
      expect(rates.EUR).toBe(0.92);
    });
  });

  describe('SUPPORTED_CURRENCIES', () => {
    it('includes expected currencies', () => {
      expect(SUPPORTED_CURRENCIES).toContain('USD');
      expect(SUPPORTED_CURRENCIES).toContain('ILS');
      expect(SUPPORTED_CURRENCIES).toContain('EUR');
      expect(SUPPORTED_CURRENCIES).toContain('GBP');
    });
  });
});
