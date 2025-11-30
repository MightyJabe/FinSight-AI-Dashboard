/**
 * FINANCIAL ACCURACY ENFORCER
 * Critical system to ensure 100% accuracy in all financial calculations
 */

import { FinancialMetrics } from './financial-calculator';

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
 */
export function roundFinancialValue(value: number): number {
  return Math.round(value * 100) / 100;
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
