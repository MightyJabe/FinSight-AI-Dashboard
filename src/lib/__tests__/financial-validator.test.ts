import Decimal from 'decimal.js';
import {
  validateFinancialMetrics,
  enforceFinancialAccuracy,
  roundFinancialValue,
  addFinancialValues,
  subtractFinancialValues,
  sumFinancialValues,
  normalizeFinancialMetrics,
} from '../financial-validator';
import type { FinancialMetrics } from '../financial-calculator';

describe('financial-validator', () => {
  describe('validateFinancialMetrics', () => {
    it('should validate correct financial metrics', () => {
      const metrics: FinancialMetrics = {
        totalAssets: 10000,
        totalLiabilities: 5000,
        netWorth: 5000,
        liquidAssets: 3000,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyCashFlow: 2000,
        investments: 7000,
      };

      const result = validateFinancialMetrics(metrics);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect net worth calculation error', () => {
      const metrics: FinancialMetrics = {
        totalAssets: 10000,
        totalLiabilities: 5000,
        netWorth: 6000, // Should be 5000
        liquidAssets: 3000,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyCashFlow: 2000,
        investments: 7000,
      };

      const result = validateFinancialMetrics(metrics);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Net worth calculation error');
    });

    it('should detect negative total assets', () => {
      const metrics: FinancialMetrics = {
        totalAssets: -10000, // Invalid
        totalLiabilities: 5000,
        netWorth: -15000,
        liquidAssets: 0,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyCashFlow: 2000,
        investments: 0,
      };

      const result = validateFinancialMetrics(metrics);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('Total assets cannot be negative')
      );
    });

    it('should detect negative total liabilities', () => {
      const metrics: FinancialMetrics = {
        totalAssets: 10000,
        totalLiabilities: -5000, // Invalid
        netWorth: 15000,
        liquidAssets: 3000,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyCashFlow: 2000,
        investments: 7000,
      };

      const result = validateFinancialMetrics(metrics);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('Total liabilities cannot be negative')
      );
    });

    it('should detect liquid assets exceeding total assets', () => {
      const metrics: FinancialMetrics = {
        totalAssets: 10000,
        totalLiabilities: 5000,
        netWorth: 5000,
        liquidAssets: 15000, // Invalid - exceeds total assets
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyCashFlow: 2000,
        investments: 7000,
      };

      const result = validateFinancialMetrics(metrics);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('Liquid assets')
      );
      expect(result.errors).toContainEqual(
        expect.stringContaining('cannot exceed total assets')
      );
    });

    it('should detect investments exceeding total assets', () => {
      const metrics: FinancialMetrics = {
        totalAssets: 10000,
        totalLiabilities: 5000,
        netWorth: 5000,
        liquidAssets: 3000,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyCashFlow: 2000,
        investments: 15000, // Invalid - exceeds total assets
      };

      const result = validateFinancialMetrics(metrics);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('Investments')
      );
      expect(result.errors).toContainEqual(
        expect.stringContaining('cannot exceed total assets')
      );
    });

    it('should detect non-finite net worth', () => {
      const metrics: FinancialMetrics = {
        totalAssets: 10000,
        totalLiabilities: 5000,
        netWorth: NaN,
        liquidAssets: 3000,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyCashFlow: 2000,
        investments: 7000,
      };

      const result = validateFinancialMetrics(metrics);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('Net worth must be a finite number')
      );
    });

    it('should detect non-finite total assets', () => {
      const metrics: FinancialMetrics = {
        totalAssets: Infinity,
        totalLiabilities: 5000,
        netWorth: 5000,
        liquidAssets: 3000,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyCashFlow: 2000,
        investments: 7000,
      };

      const result = validateFinancialMetrics(metrics);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('Total assets must be a finite number')
      );
    });

    it('should warn when expenses exceed 2x income', () => {
      const metrics: FinancialMetrics = {
        totalAssets: 10000,
        totalLiabilities: 5000,
        netWorth: 5000,
        liquidAssets: 3000,
        monthlyIncome: 2000,
        monthlyExpenses: 5000, // 2.5x income
        monthlyCashFlow: -3000,
        investments: 7000,
      };

      const result = validateFinancialMetrics(metrics);
      expect(result.isValid).toBe(true); // Valid but has warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Monthly expenses');
      expect(result.warnings[0]).toContain('2x monthly income');
    });

    it('should warn when liquid assets are low', () => {
      const metrics: FinancialMetrics = {
        totalAssets: 10000,
        totalLiabilities: 5000,
        netWorth: 5000,
        liquidAssets: 500, // Less than 0.5 months expenses
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyCashFlow: 2000,
        investments: 7000,
      };

      const result = validateFinancialMetrics(metrics);
      expect(result.isValid).toBe(true); // Valid but has warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Low liquid assets');
    });

    it('should handle zero values correctly', () => {
      const metrics: FinancialMetrics = {
        totalAssets: 0,
        totalLiabilities: 0,
        netWorth: 0,
        liquidAssets: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyCashFlow: 0,
        investments: 0,
      };

      const result = validateFinancialMetrics(metrics);
      expect(result.isValid).toBe(true);
    });
  });

  describe('enforceFinancialAccuracy', () => {
    it('should not throw for valid metrics', () => {
      const metrics: FinancialMetrics = {
        totalAssets: 10000,
        totalLiabilities: 5000,
        netWorth: 5000,
        liquidAssets: 3000,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyCashFlow: 2000,
        investments: 7000,
      };

      expect(() => {
        enforceFinancialAccuracy(metrics, 'test context');
      }).not.toThrow();
    });

    it('should throw for invalid metrics', () => {
      const metrics: FinancialMetrics = {
        totalAssets: 10000,
        totalLiabilities: 5000,
        netWorth: 6000, // Wrong calculation
        liquidAssets: 3000,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyCashFlow: 2000,
        investments: 7000,
      };

      expect(() => {
        enforceFinancialAccuracy(metrics, 'test context');
      }).toThrow('FINANCIAL ACCURACY VIOLATION');
    });

    it('should include context in error message', () => {
      const metrics: FinancialMetrics = {
        totalAssets: -10000, // Invalid
        totalLiabilities: 5000,
        netWorth: -15000,
        liquidAssets: 0,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyCashFlow: 2000,
        investments: 0,
      };

      expect(() => {
        enforceFinancialAccuracy(metrics, 'dashboard calculation');
      }).toThrow('dashboard calculation');
    });
  });

  describe('roundFinancialValue', () => {
    it('should round to 2 decimal places', () => {
      expect(roundFinancialValue(10.999)).toBe(11.00);
      expect(roundFinancialValue(10.001)).toBe(10.00);
    });

    it('should use banker\'s rounding (ROUND_HALF_UP)', () => {
      expect(roundFinancialValue(10.005)).toBe(10.01);
      expect(roundFinancialValue(10.015)).toBe(10.02);
    });

    it('should handle zero', () => {
      expect(roundFinancialValue(0)).toBe(0);
      // -0 is technically different from 0 in JavaScript (Object.is), but mathematically equal
      expect(Math.abs(roundFinancialValue(-0))).toBe(0);
    });

    it('should handle negative values', () => {
      expect(roundFinancialValue(-10.999)).toBe(-11.00);
      expect(roundFinancialValue(-10.001)).toBe(-10.00);
    });

    it('should handle very large numbers', () => {
      expect(roundFinancialValue(1234567890.123)).toBe(1234567890.12);
    });

    it('should handle very small numbers', () => {
      expect(roundFinancialValue(0.001)).toBe(0.00);
      expect(roundFinancialValue(0.009)).toBe(0.01);
      expect(roundFinancialValue(0.004)).toBe(0.00);
      expect(roundFinancialValue(0.005)).toBe(0.01);
    });

    it('should return NaN for NaN input', () => {
      expect(roundFinancialValue(NaN)).toBeNaN();
    });

    it('should return Infinity for Infinity input', () => {
      expect(roundFinancialValue(Infinity)).toBe(Infinity);
      expect(roundFinancialValue(-Infinity)).toBe(-Infinity);
    });

    it('should handle JavaScript floating-point edge cases', () => {
      // 0.615 rounds incorrectly with Math.round() but correctly with Decimal
      expect(roundFinancialValue(0.615)).toBe(0.62);
      expect(roundFinancialValue(0.625)).toBe(0.63);
    });
  });

  describe('addFinancialValues', () => {
    it('should add two positive numbers precisely', () => {
      const result = addFinancialValues(100.10, 200.20);
      expect(result).toBeCloseTo(300.30, 2);
    });

    it('should handle floating-point edge case (0.1 + 0.2)', () => {
      const result = addFinancialValues(0.1, 0.2);
      expect(result).toBe(0.3); // Not 0.30000000000000004
    });

    it('should add negative numbers', () => {
      const result = addFinancialValues(-100, -50);
      expect(result).toBe(-150);
    });

    it('should add positive and negative', () => {
      const result = addFinancialValues(100, -30);
      expect(result).toBe(70);
    });

    it('should handle zero', () => {
      expect(addFinancialValues(0, 0)).toBe(0);
      expect(addFinancialValues(100, 0)).toBe(100);
      expect(addFinancialValues(0, 100)).toBe(100);
    });

    it('should handle very large numbers', () => {
      const result = addFinancialValues(999999999, 1);
      expect(result).toBe(1000000000);
    });

    it('should handle very small decimals', () => {
      const result = addFinancialValues(0.001, 0.002);
      expect(result).toBeCloseTo(0.003, 3);
    });
  });

  describe('subtractFinancialValues', () => {
    it('should subtract two positive numbers precisely', () => {
      const result = subtractFinancialValues(300.30, 100.10);
      expect(result).toBeCloseTo(200.20, 2);
    });

    it('should handle negative result', () => {
      const result = subtractFinancialValues(50, 100);
      expect(result).toBe(-50);
    });

    it('should subtract negative numbers', () => {
      const result = subtractFinancialValues(-100, -50);
      expect(result).toBe(-50);
    });

    it('should handle zero', () => {
      expect(subtractFinancialValues(100, 0)).toBe(100);
      expect(subtractFinancialValues(0, 100)).toBe(-100);
      expect(subtractFinancialValues(0, 0)).toBe(0);
    });

    it('should handle floating-point precision', () => {
      const result = subtractFinancialValues(0.3, 0.1);
      expect(result).toBeCloseTo(0.2, 2);
    });
  });

  describe('sumFinancialValues', () => {
    it('should sum array of values', () => {
      const result = sumFinancialValues([100, 200, 300]);
      expect(result).toBe(600);
    });

    it('should handle empty array', () => {
      const result = sumFinancialValues([]);
      expect(result).toBe(0);
    });

    it('should handle single value', () => {
      const result = sumFinancialValues([100]);
      expect(result).toBe(100);
    });

    it('should handle mixed positive and negative', () => {
      const result = sumFinancialValues([100, -50, 200, -30]);
      expect(result).toBe(220);
    });

    it('should handle floating-point precision issues', () => {
      const result = sumFinancialValues([0.1, 0.2, 0.3]);
      expect(result).toBeCloseTo(0.6, 2);
    });

    it('should handle large arrays', () => {
      const values = Array(100).fill(10.50);
      const result = sumFinancialValues(values);
      expect(result).toBeCloseTo(1050, 2);
    });

    it('should handle zero values', () => {
      const result = sumFinancialValues([0, 0, 0]);
      expect(result).toBe(0);
    });

    it('should handle decimals with precision', () => {
      const result = sumFinancialValues([10.55, 20.33, 30.12]);
      expect(result).toBeCloseTo(61.00, 2);
    });
  });

  describe('normalizeFinancialMetrics', () => {
    it('should round all financial metrics to 2 decimal places', () => {
      const metrics: FinancialMetrics = {
        totalAssets: 10000.999,
        totalLiabilities: 5000.555,
        netWorth: 5000.444,
        liquidAssets: 3000.125,
        monthlyIncome: 5000.678,
        monthlyExpenses: 3000.321,
        monthlyCashFlow: 2000.357,
        investments: 7000.999,
      };

      const normalized = normalizeFinancialMetrics(metrics);

      expect(normalized.totalAssets).toBe(10001.00);
      expect(normalized.totalLiabilities).toBe(5000.56);
      expect(normalized.netWorth).toBe(5000.44);
      expect(normalized.liquidAssets).toBe(3000.13);
      expect(normalized.monthlyIncome).toBe(5000.68);
      expect(normalized.monthlyExpenses).toBe(3000.32);
      expect(normalized.monthlyCashFlow).toBe(2000.36);
      expect(normalized.investments).toBe(7001.00);
    });

    it('should handle zero values', () => {
      const metrics: FinancialMetrics = {
        totalAssets: 0,
        totalLiabilities: 0,
        netWorth: 0,
        liquidAssets: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyCashFlow: 0,
        investments: 0,
      };

      const normalized = normalizeFinancialMetrics(metrics);

      expect(normalized.totalAssets).toBe(0);
      expect(normalized.totalLiabilities).toBe(0);
      expect(normalized.netWorth).toBe(0);
    });

    it('should handle negative values', () => {
      const metrics: FinancialMetrics = {
        totalAssets: -100.555,
        totalLiabilities: -50.333,
        netWorth: -50.222,
        liquidAssets: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyCashFlow: -100.111,
        investments: 0,
      };

      const normalized = normalizeFinancialMetrics(metrics);

      expect(normalized.totalAssets).toBe(-100.56);
      expect(normalized.totalLiabilities).toBe(-50.33);
      expect(normalized.netWorth).toBe(-50.22);
      expect(normalized.monthlyCashFlow).toBe(-100.11);
    });

    it('should return same object structure', () => {
      const metrics: FinancialMetrics = {
        totalAssets: 10000,
        totalLiabilities: 5000,
        netWorth: 5000,
        liquidAssets: 3000,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyCashFlow: 2000,
        investments: 7000,
      };

      const normalized = normalizeFinancialMetrics(metrics);

      expect(normalized).toHaveProperty('totalAssets');
      expect(normalized).toHaveProperty('totalLiabilities');
      expect(normalized).toHaveProperty('netWorth');
      expect(normalized).toHaveProperty('liquidAssets');
      expect(normalized).toHaveProperty('monthlyIncome');
      expect(normalized).toHaveProperty('monthlyExpenses');
      expect(normalized).toHaveProperty('monthlyCashFlow');
      expect(normalized).toHaveProperty('investments');
    });
  });
});
