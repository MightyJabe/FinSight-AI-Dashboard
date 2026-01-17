/**
 * FINANCIAL ACCURACY ENFORCER
 * Critical system to ensure 100% accuracy in all financial calculations
 *
 * Uses decimal.js for precise financial math to avoid floating-point errors
 * (e.g., 0.1 + 0.2 !== 0.3 in JavaScript)
 */

import Decimal from 'decimal.js';

import { FinancialMetrics } from './financial-calculator';

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 20,       // High precision for intermediate calculations
  rounding: Decimal.ROUND_HALF_UP,  // Standard banker's rounding
});

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates financial metrics for accuracy and consistency
 */
export function validateFinancialMetrics(metrics: FinancialMetrics): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical validations - these MUST pass
  if (Math.abs(metrics.netWorth - (metrics.totalAssets - metrics.totalLiabilities)) > 0.01) {
    errors.push(
      `Net worth calculation error: ${metrics.netWorth} ≠ ${metrics.totalAssets} - ${metrics.totalLiabilities}`
    );
  }

  if (metrics.totalAssets < 0) {
    errors.push(`Total assets cannot be negative: ${metrics.totalAssets}`);
  }

  if (metrics.totalLiabilities < 0) {
    errors.push(`Total liabilities cannot be negative: ${metrics.totalLiabilities}`);
  }

  if (metrics.liquidAssets > metrics.totalAssets) {
    errors.push(
      `Liquid assets (${metrics.liquidAssets}) cannot exceed total assets (${metrics.totalAssets})`
    );
  }

  if (metrics.investments > metrics.totalAssets) {
    errors.push(
      `Investments (${metrics.investments}) cannot exceed total assets (${metrics.totalAssets})`
    );
  }

  // Precision validations
  if (!Number.isFinite(metrics.netWorth)) {
    errors.push(`Net worth must be a finite number: ${metrics.netWorth}`);
  }

  if (!Number.isFinite(metrics.totalAssets)) {
    errors.push(`Total assets must be a finite number: ${metrics.totalAssets}`);
  }

  if (!Number.isFinite(metrics.totalLiabilities)) {
    errors.push(`Total liabilities must be a finite number: ${metrics.totalLiabilities}`);
  }

  // Warnings for unusual but not invalid scenarios
  if (metrics.monthlyExpenses > metrics.monthlyIncome * 2) {
    warnings.push(
      `Monthly expenses (${metrics.monthlyExpenses}) are more than 2x monthly income (${metrics.monthlyIncome})`
    );
  }

  if (metrics.liquidAssets < metrics.monthlyExpenses * 0.5) {
    warnings.push(
      `Low liquid assets: only ${(metrics.liquidAssets / metrics.monthlyExpenses).toFixed(1)} months of expenses`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Enforces financial accuracy - throws error if validation fails
 */
export function enforceFinancialAccuracy(metrics: FinancialMetrics, context: string): void {
  const validation = validateFinancialMetrics(metrics);

  if (!validation.isValid) {
    const errorMessage = `FINANCIAL ACCURACY VIOLATION in ${context}:\n${validation.errors.join('\n')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  if (validation.warnings.length > 0) {
    console.warn(`Financial warnings in ${context}:`, validation.warnings);
  }
}

/**
 * Rounds financial values to 2 decimal places for consistency
 * Uses Decimal.js to avoid floating-point precision errors
 *
 * @example
 * // JavaScript: Math.round(0.615 * 100) / 100 = 0.61 (WRONG!)
 * // decimal.js: roundFinancialValue(0.615) = 0.62 (CORRECT)
 */
export function roundFinancialValue(value: number): number {
  if (!Number.isFinite(value)) {
    return value; // Return NaN/Infinity as-is for validation to catch
  }
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Adds two financial values with precision
 * Avoids JavaScript floating-point errors like 0.1 + 0.2 !== 0.3
 */
export function addFinancialValues(a: number, b: number): number {
  return new Decimal(a).plus(b).toNumber();
}

/**
 * Subtracts two financial values with precision
 */
export function subtractFinancialValues(a: number, b: number): number {
  return new Decimal(a).minus(b).toNumber();
}

/**
 * Sums an array of financial values with precision
 */
export function sumFinancialValues(values: number[]): number {
  return values
    .reduce((sum, val) => sum.plus(val), new Decimal(0))
    .toNumber();
}

/**
 * Ensures all financial metrics are properly rounded
 */
export function normalizeFinancialMetrics(metrics: FinancialMetrics): FinancialMetrics {
  return {
    totalAssets: roundFinancialValue(metrics.totalAssets),
    totalLiabilities: roundFinancialValue(metrics.totalLiabilities),
    netWorth: roundFinancialValue(metrics.netWorth),
    liquidAssets: roundFinancialValue(metrics.liquidAssets),
    monthlyIncome: roundFinancialValue(metrics.monthlyIncome),
    monthlyExpenses: roundFinancialValue(metrics.monthlyExpenses),
    monthlyCashFlow: roundFinancialValue(metrics.monthlyCashFlow),
    investments: roundFinancialValue(metrics.investments),
  };
}
