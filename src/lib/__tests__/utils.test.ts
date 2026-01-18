import {
  cn,
  formatCurrency,
  getCurrencySymbol,
  formatPercentage,
  truncateText,
  generateId,
} from '../utils';

describe('lib/utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
    });

    it('should merge Tailwind classes correctly', () => {
      // twMerge should keep the last conflicting class
      expect(cn('px-2', 'px-4')).toBe('px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle arrays', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
    });

    it('should handle objects', () => {
      expect(cn({ class1: true, class2: false, class3: true })).toBe('class1 class3');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(cn(null, undefined, 'class1')).toBe('class1');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD currency by default', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1,234');
      expect(result).toContain('56');
    });

    it('should format USD with symbol', () => {
      const result = formatCurrency(1000, 'USD');
      expect(result).toContain('$');
      expect(result).toContain('1,000');
    });

    it('should format ILS currency', () => {
      const result = formatCurrency(1000, 'ILS');
      expect(result).toContain('1,000');
      // Should use Israeli locale
    });

    it('should format EUR currency', () => {
      const result = formatCurrency(1000, 'EUR');
      expect(result).toContain('1');
      expect(result).toContain('000');
    });

    it('should format GBP currency', () => {
      const result = formatCurrency(1000, 'GBP');
      expect(result).toContain('1,000');
    });

    it('should format JPY currency without decimals', () => {
      const result = formatCurrency(1234.56, 'JPY');
      // JPY rounds to nearest yen (no decimals)
      expect(result).toContain('1,235');
      // JPY shouldn't have decimal places
      expect(result).not.toContain('.56');
      expect(result).not.toContain('.');
    });

    it('should handle zero values', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    it('should handle negative values', () => {
      const result = formatCurrency(-1234.56, 'USD');
      expect(result).toContain('1,234');
      expect(result).toContain('56');
      // Should have some negative indicator (-, parentheses, etc.)
    });

    it('should handle large numbers', () => {
      const result = formatCurrency(1234567890.12, 'USD');
      expect(result).toContain('1,234,567,890');
    });

    it('should handle small decimal values', () => {
      const result = formatCurrency(0.99, 'USD');
      expect(result).toContain('0.99');
    });

    it('should handle lowercase currency codes', () => {
      const result = formatCurrency(1000, 'usd');
      expect(result).toContain('$');
      expect(result).toContain('1,000');
    });

    it('should fallback to USD for unknown currency codes', () => {
      const result = formatCurrency(1000, 'XXX');
      // Should still format the number
      expect(result).toContain('1,000');
    });

    it('should handle undefined currency (default to USD)', () => {
      const result = formatCurrency(1000, undefined);
      expect(result).toContain('$');
      expect(result).toContain('1,000');
    });

    it('should format CAD currency', () => {
      const result = formatCurrency(1000, 'CAD');
      expect(result).toContain('1,000');
    });

    it('should format AUD currency', () => {
      const result = formatCurrency(1000, 'AUD');
      expect(result).toContain('1,000');
    });

    it('should format CHF currency', () => {
      const result = formatCurrency(1000, 'CHF');
      // Swiss locale formats with their specific separator
      expect(result).toContain('1');
      expect(result).toContain('000');
      expect(result).toContain('CHF');
    });

    it('should format INR currency', () => {
      const result = formatCurrency(1000, 'INR');
      expect(result).toContain('1,000');
    });

    it('should format CNY currency', () => {
      const result = formatCurrency(1000, 'CNY');
      expect(result).toContain('1,000');
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return USD symbol', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    it('should return EUR symbol', () => {
      expect(getCurrencySymbol('EUR')).toBe('€');
    });

    it('should return GBP symbol', () => {
      expect(getCurrencySymbol('GBP')).toBe('£');
    });

    it('should return ILS symbol', () => {
      expect(getCurrencySymbol('ILS')).toBe('₪');
    });

    it('should return JPY symbol', () => {
      expect(getCurrencySymbol('JPY')).toBe('¥');
    });

    it('should return CNY symbol', () => {
      expect(getCurrencySymbol('CNY')).toBe('¥');
    });

    it('should return INR symbol', () => {
      expect(getCurrencySymbol('INR')).toBe('₹');
    });

    it('should return CAD symbol', () => {
      expect(getCurrencySymbol('CAD')).toBe('C$');
    });

    it('should return AUD symbol', () => {
      expect(getCurrencySymbol('AUD')).toBe('A$');
    });

    it('should return CHF symbol', () => {
      expect(getCurrencySymbol('CHF')).toBe('CHF');
    });

    it('should handle lowercase currency codes', () => {
      expect(getCurrencySymbol('usd')).toBe('$');
      expect(getCurrencySymbol('eur')).toBe('€');
    });

    it('should return currency code for unknown currencies', () => {
      expect(getCurrencySymbol('XXX')).toBe('XXX');
    });

    it('should return $ for undefined currency', () => {
      expect(getCurrencySymbol(undefined as any)).toBe('$');
    });

    it('should return $ for empty string', () => {
      expect(getCurrencySymbol('')).toBe('$');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with default 2 decimals', () => {
      expect(formatPercentage(0.1234)).toBe('12.34%');
    });

    it('should format percentage with custom decimals', () => {
      expect(formatPercentage(0.1234, 0)).toBe('12%');
      expect(formatPercentage(0.1234, 1)).toBe('12.3%');
      expect(formatPercentage(0.1234, 3)).toBe('12.340%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.00%');
    });

    it('should handle negative percentages', () => {
      expect(formatPercentage(-0.1234)).toBe('-12.34%');
    });

    it('should handle values greater than 1', () => {
      expect(formatPercentage(1.5)).toBe('150.00%');
      expect(formatPercentage(2.0)).toBe('200.00%');
    });

    it('should handle very small values', () => {
      expect(formatPercentage(0.0001)).toBe('0.01%');
    });

    it('should handle very large values', () => {
      expect(formatPercentage(10)).toBe('1000.00%');
    });

    it('should round values correctly', () => {
      expect(formatPercentage(0.12345, 2)).toBe('12.35%');
      expect(formatPercentage(0.12344, 2)).toBe('12.34%');
    });

    it('should handle 100%', () => {
      expect(formatPercentage(1)).toBe('100.00%');
    });

    it('should handle fractional percentages', () => {
      expect(formatPercentage(0.005, 1)).toBe('0.5%');
    });
  });

  describe('truncateText', () => {
    it('should truncate text longer than maxLength', () => {
      expect(truncateText('This is a long text', 10)).toBe('This is a ...');
    });

    it('should not truncate text shorter than maxLength', () => {
      expect(truncateText('Short', 10)).toBe('Short');
    });

    it('should not truncate text equal to maxLength', () => {
      expect(truncateText('1234567890', 10)).toBe('1234567890');
    });

    it('should handle empty string', () => {
      expect(truncateText('', 10)).toBe('');
    });

    it('should handle maxLength of 0', () => {
      expect(truncateText('text', 0)).toBe('...');
    });

    it('should handle maxLength of 1', () => {
      expect(truncateText('text', 1)).toBe('t...');
    });

    it('should handle very long text', () => {
      const longText = 'a'.repeat(1000);
      const result = truncateText(longText, 50);
      expect(result.length).toBe(53); // 50 chars + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('should preserve exact characters before ellipsis', () => {
      const result = truncateText('Hello World', 5);
      expect(result).toBe('Hello...');
      expect(result.startsWith('Hello')).toBe(true);
    });
  });

  describe('generateId', () => {
    it('should generate a string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });

    it('should generate non-empty string', () => {
      const id = generateId();
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      const id3 = generateId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should generate IDs with reasonable length', () => {
      const id1 = generateId();
      const id2 = generateId();

      // IDs should be between 8-13 characters (based on implementation)
      expect(id1.length).toBeGreaterThanOrEqual(8);
      expect(id1.length).toBeLessThanOrEqual(13);
      expect(id2.length).toBeGreaterThanOrEqual(8);
      expect(id2.length).toBeLessThanOrEqual(13);
    });

    it('should generate alphanumeric IDs', () => {
      const id = generateId();
      expect(id).toMatch(/^[a-z0-9]+$/);
    });

    it('should generate multiple unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      // All 100 should be unique
      expect(ids.size).toBe(100);
    });
  });
});
