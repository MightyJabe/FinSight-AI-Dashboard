/**
 * CRITICAL FINANCIAL ACCURACY TESTS
 * These tests ensure 100% precision in all financial calculations
 */

import { FinancialMetrics } from '../financial-calculator';
import { enforceFinancialAccuracy, validateFinancialMetrics } from '../financial-validator';

describe('Financial Accuracy Tests', () => {
  const validMetrics: FinancialMetrics = {
    totalAssets: 39255.0,
    totalLiabilities: 12000.0,
    netWorth: 27255.0,
    liquidAssets: 15000.0,
    monthlyIncome: 5000.0,
    monthlyExpenses: 3500.0,
    monthlyCashFlow: 1500.0,
    investments: 20000.0,
  };

  describe('validateFinancialMetrics', () => {
    it('should pass validation for correct metrics', () => {
      const result = validateFinancialMetrics(validMetrics);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when net worth calculation is wrong', () => {
      const invalidMetrics = {
        ...validMetrics,
        netWorth: 25000.0, // Should be 27255.00
      };
      const result = validateFinancialMetrics(invalidMetrics);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Net worth calculation error');
    });

    it('should fail when liquid assets exceed total assets', () => {
      const invalidMetrics = {
        ...validMetrics,
        liquidAssets: 50000.0, // More than totalAssets
      };
      const result = validateFinancialMetrics(invalidMetrics);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Liquid assets');
    });
  });

  describe('enforceFinancialAccuracy', () => {
    it('should not throw for valid metrics', () => {
      expect(() => {
        enforceFinancialAccuracy(validMetrics, 'test');
      }).not.toThrow();
    });

    it('should throw for invalid metrics', () => {
      const invalidMetrics = {
        ...validMetrics,
        netWorth: 25000.0, // Wrong calculation
      };
      expect(() => {
        enforceFinancialAccuracy(invalidMetrics, 'test');
      }).toThrow('FINANCIAL ACCURACY VIOLATION');
    });
  });
});
