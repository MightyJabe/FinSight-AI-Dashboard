import { formatDate } from '../format-date';

describe('format-date', () => {
  describe('formatDate', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');
    const testDateString = '2024-01-15T10:30:00Z';

    it('should format Date object with default options', () => {
      const result = formatDate(testDate);
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should format date string with default options', () => {
      const result = formatDate(testDateString);
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should format with custom locale', () => {
      const resultUS = formatDate(testDate, undefined, 'en-US');
      const resultDE = formatDate(testDate, undefined, 'de-DE');

      expect(resultUS).toBeDefined();
      expect(resultDE).toBeDefined();
      // Different locales may format dates differently
    });

    it('should format with custom options - long format', () => {
      const result = formatDate(testDate, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should format with custom options - short format', () => {
      const result = formatDate(testDate, {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
      });

      expect(result).toContain('01');
      expect(result).toContain('15');
      expect(result).toContain('24');
    });

    it('should format with time included', () => {
      const result = formatDate(testDate, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
      // Time formatting may vary by locale
    });

    it('should format date with weekday', () => {
      const result = formatDate(testDate, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      expect(result).toContain('Monday');
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should handle different date strings', () => {
      const isoDate = '2024-06-01';
      const result = formatDate(isoDate);

      expect(result).toContain('Jun');
      expect(result).toContain('1');
      expect(result).toContain('2024');
    });

    it('should handle year-only format', () => {
      const result = formatDate(testDate, { year: 'numeric' });
      expect(result).toBe('2024');
    });

    it('should handle month-year format', () => {
      const result = formatDate(testDate, {
        year: 'numeric',
        month: 'long',
      });

      expect(result).toContain('January');
      expect(result).toContain('2024');
    });

    it('should handle leap year dates', () => {
      const leapDate = new Date('2024-02-29');
      const result = formatDate(leapDate);

      expect(result).toContain('Feb');
      expect(result).toContain('29');
      expect(result).toContain('2024');
    });

    it('should handle year end dates', () => {
      const newYearsEve = new Date('2024-12-31');
      const result = formatDate(newYearsEve);

      expect(result).toContain('Dec');
      expect(result).toContain('31');
      expect(result).toContain('2024');
    });

    it('should handle year start dates', () => {
      const newYearsDay = new Date('2024-01-01');
      const result = formatDate(newYearsDay);

      expect(result).toContain('Jan');
      expect(result).toContain('1');
      expect(result).toContain('2024');
    });

    it('should handle different years', () => {
      const futureDate = new Date('2030-06-15');
      const result = formatDate(futureDate);

      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toContain('2030');
    });

    it('should format with numeric month', () => {
      const result = formatDate(testDate, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });

      expect(result).toContain('1'); // Month
      expect(result).toContain('15'); // Day
      expect(result).toContain('2024'); // Year
    });

    it('should handle de-DE locale', () => {
      const result = formatDate(testDate, undefined, 'de-DE');
      // German format is typically DD.MM.YYYY
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle fr-FR locale', () => {
      const result = formatDate(testDate, undefined, 'fr-FR');
      // French format is typically DD/MM/YYYY
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle ja-JP locale', () => {
      const result = formatDate(testDate, undefined, 'ja-JP');
      // Japanese format is typically YYYY/MM/DD
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle timestamp strings', () => {
      const timestamp = '1705315800000'; // Milliseconds since epoch
      const date = new Date(parseInt(timestamp));
      const result = formatDate(date);

      expect(result).toContain('Jan');
      expect(result).toContain('2024');
    });
  });
});
