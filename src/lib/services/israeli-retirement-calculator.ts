/**
 * Israeli Retirement Calculator
 *
 * Calculates retirement projections specific to Israeli users,
 * including pension funds, provident funds, Bituach Leumi,
 * and Israeli-specific retirement ages.
 */

import logger from '@/lib/logger';

import { PensionFund, PensionResult, PensionType } from './pension-service';

// Israeli retirement ages (as of 2024, gradually increasing)
export const ISRAELI_RETIREMENT_AGES = {
  men: {
    current: 67,
    early: 60,
  },
  women: {
    // Gradually increasing from 62 to 65 by 2032
    current: 62,
    target2032: 65,
    early: 60,
  },
};

// Bituach Leumi (National Insurance) parameters
const BITUACH_LEUMI = {
  // Average monthly benefit (as of 2024)
  averageMonthlyBenefit: 5800, // ILS
  maxMonthlyBenefit: 10800, // ILS
  // Contribution years for full benefit
  fullBenefitYears: 40,
  // Minimum years for any benefit
  minimumYears: 10,
};

// Israeli tax brackets for pension withdrawals (simplified)
const PENSION_TAX_BRACKETS = [
  { limit: 8500, rate: 0.1 },
  { limit: 12200, rate: 0.14 },
  { limit: 19600, rate: 0.2 },
  { limit: 40200, rate: 0.31 },
  { limit: 66300, rate: 0.35 },
  { limit: Infinity, rate: 0.47 },
];

export interface IsraeliRetirementInputs {
  currentAge: number;
  gender: 'male' | 'female';
  currentSalary: number; // Monthly gross salary in ILS
  yearsWorked: number; // Years of employment in Israel
  pensionFunds: PensionResult;
  additionalSavings: number; // Non-pension savings
  desiredMonthlyIncome: number; // Desired income at retirement
  earlyRetirement: boolean; // Whether planning for early retirement
  expectedReturnRate?: number; // Default 5%
  inflationRate?: number; // Default 2.5%
}

export interface RetirementProjection {
  // Core metrics
  retirementAge: number;
  yearsToRetirement: number;
  projectedPensionValue: number;
  projectedSavingsValue: number;
  projectedBituachLeumi: number;
  totalProjectedValue: number;

  // Monthly income projections
  monthlyPensionIncome: number;
  monthlyBituachLeumi: number;
  monthlyFromSavings: number;
  totalMonthlyIncome: number;

  // Gap analysis
  incomeGap: number;
  readinessScore: number;

  // Recommendations
  recommendedMonthlySaving: number;
  yearsOfIncome: number;

  // Breakdown by pension type
  pensionBreakdown: {
    type: PensionType;
    currentValue: number;
    projectedValue: number;
    monthlyContribution: number;
  }[];
}

export interface RetirementRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionItems: string[];
}

/**
 * Calculate future value with monthly contributions
 */
function calculateFutureValue(
  presentValue: number,
  monthlyContribution: number,
  monthlyRate: number,
  months: number
): number {
  // FV of present value
  const fvPresentValue = presentValue * Math.pow(1 + monthlyRate, months);

  // FV of annuity (monthly contributions)
  const fvContributions =
    monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

  return fvPresentValue + fvContributions;
}

/**
 * Calculate how long savings will last (years of income)
 */
function calculateYearsOfIncome(
  totalSavings: number,
  monthlyWithdrawal: number,
  monthlyRate: number
): number {
  if (monthlyWithdrawal <= 0) return 100; // Effectively infinite

  // Using present value of annuity formula solved for n
  const ratio = 1 - (totalSavings * monthlyRate) / monthlyWithdrawal;
  if (ratio <= 0) return 100; // Savings grow faster than withdrawals

  const months = -Math.log(ratio) / Math.log(1 + monthlyRate);
  return Math.round(months / 12);
}

/**
 * Estimate Bituach Leumi benefit
 */
function estimateBituachLeumi(yearsWorked: number, retirementAge: number): number {
  // Simplified calculation - actual formula is more complex
  const qualifyingYears = Math.min(yearsWorked, BITUACH_LEUMI.fullBenefitYears);
  const benefitRatio = qualifyingYears / BITUACH_LEUMI.fullBenefitYears;

  if (qualifyingYears < BITUACH_LEUMI.minimumYears) {
    return 0; // Not enough years for benefit
  }

  // Early retirement penalty
  const earlyPenalty = retirementAge < 67 ? 0.95 ** (67 - retirementAge) : 1;

  return Math.round(BITUACH_LEUMI.averageMonthlyBenefit * benefitRatio * earlyPenalty);
}

/**
 * Calculate after-tax pension income
 * Exported for potential future use in detailed tax calculations
 */
export function calculateAfterTaxIncome(grossMonthly: number): number {
  let remainingIncome = grossMonthly;
  let totalTax = 0;

  for (const bracket of PENSION_TAX_BRACKETS) {
    if (remainingIncome <= 0) break;

    const taxableInBracket = Math.min(remainingIncome, bracket.limit);
    totalTax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }

  return grossMonthly - totalTax;
}

/**
 * Main retirement calculation
 */
export function calculateIsraeliRetirement(
  inputs: IsraeliRetirementInputs
): RetirementProjection {
  const {
    currentAge,
    gender,
    yearsWorked,
    pensionFunds,
    additionalSavings,
    desiredMonthlyIncome,
    earlyRetirement,
    expectedReturnRate = 5,
    inflationRate = 2.5,
  } = inputs;

  // Determine retirement age
  const standardRetirementAge =
    gender === 'male'
      ? ISRAELI_RETIREMENT_AGES.men.current
      : ISRAELI_RETIREMENT_AGES.women.current;

  const retirementAge = earlyRetirement
    ? gender === 'male'
      ? ISRAELI_RETIREMENT_AGES.men.early
      : ISRAELI_RETIREMENT_AGES.women.early
    : standardRetirementAge;

  const yearsToRetirement = Math.max(0, retirementAge - currentAge);
  const monthsToRetirement = yearsToRetirement * 12;

  // Calculate real return rate (nominal - inflation)
  const realReturnRate = (expectedReturnRate - inflationRate) / 100;
  const monthlyRate = realReturnRate / 12;

  // Process pension funds by type
  const pensionBreakdown = processePensionBreakdown(
    pensionFunds.funds,
    monthlyRate,
    monthsToRetirement
  );

  // Total projected pension value
  const projectedPensionValue = pensionBreakdown.reduce((sum, p) => sum + p.projectedValue, 0);

  // Project additional savings
  const projectedSavingsValue = calculateFutureValue(
    additionalSavings,
    0, // Assuming no additional contributions to non-pension savings
    monthlyRate,
    monthsToRetirement
  );

  // Estimate Bituach Leumi
  const projectedYearsWorked = yearsWorked + yearsToRetirement;
  const projectedBituachLeumi = estimateBituachLeumi(projectedYearsWorked, retirementAge);

  // Total projected value
  const totalProjectedValue = projectedPensionValue + projectedSavingsValue;

  // Calculate monthly income from pension (using 4% safe withdrawal rate)
  const pensionWithdrawalRate = 0.04 / 12;
  const monthlyPensionIncome = Math.round(projectedPensionValue * pensionWithdrawalRate);

  // Monthly from savings
  const monthlyFromSavings = Math.round(projectedSavingsValue * pensionWithdrawalRate);

  // Total monthly income
  const totalMonthlyIncome = monthlyPensionIncome + projectedBituachLeumi + monthlyFromSavings;

  // Income gap analysis
  const incomeGap = Math.max(0, desiredMonthlyIncome - totalMonthlyIncome);

  // Readiness score (0-100)
  const readinessScore = Math.min(100, Math.round((totalMonthlyIncome / desiredMonthlyIncome) * 100));

  // Calculate recommended monthly saving to close the gap
  const recommendedMonthlySaving = calculateRecommendedSaving(
    incomeGap,
    monthlyRate,
    monthsToRetirement
  );

  // Calculate years of income
  const yearsOfIncome = calculateYearsOfIncome(
    totalProjectedValue,
    desiredMonthlyIncome - projectedBituachLeumi,
    monthlyRate
  );

  return {
    retirementAge,
    yearsToRetirement,
    projectedPensionValue: Math.round(projectedPensionValue),
    projectedSavingsValue: Math.round(projectedSavingsValue),
    projectedBituachLeumi,
    totalProjectedValue: Math.round(totalProjectedValue),
    monthlyPensionIncome,
    monthlyBituachLeumi: projectedBituachLeumi,
    monthlyFromSavings,
    totalMonthlyIncome,
    incomeGap,
    readinessScore,
    recommendedMonthlySaving,
    yearsOfIncome,
    pensionBreakdown,
  };
}

/**
 * Process pension funds and project future values
 */
function processePensionBreakdown(
  funds: PensionFund[],
  monthlyRate: number,
  monthsToRetirement: number
): RetirementProjection['pensionBreakdown'] {
  const byType = new Map<PensionType, { currentValue: number; monthlyContribution: number }>();

  funds.forEach(fund => {
    const existing = byType.get(fund.type) || { currentValue: 0, monthlyContribution: 0 };
    existing.currentValue += fund.currentValue;
    existing.monthlyContribution += fund.employeeContribution + fund.employerContribution;
    byType.set(fund.type, existing);
  });

  const breakdown: RetirementProjection['pensionBreakdown'] = [];

  byType.forEach((values, type) => {
    const projectedValue = calculateFutureValue(
      values.currentValue,
      values.monthlyContribution,
      monthlyRate,
      monthsToRetirement
    );

    breakdown.push({
      type,
      currentValue: values.currentValue,
      projectedValue: Math.round(projectedValue),
      monthlyContribution: values.monthlyContribution,
    });
  });

  return breakdown;
}

/**
 * Calculate recommended monthly saving to close income gap
 */
function calculateRecommendedSaving(
  incomeGap: number,
  monthlyRate: number,
  months: number
): number {
  if (incomeGap <= 0 || months <= 0) return 0;

  // Convert income gap to required additional savings (assuming 4% withdrawal rate)
  const requiredAdditionalSavings = (incomeGap / 0.04) * 12;

  // Calculate monthly saving needed to reach this amount
  const fvFactor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
  return Math.round(requiredAdditionalSavings / fvFactor);
}

/**
 * Generate retirement recommendations
 */
export function generateRetirementRecommendations(
  projection: RetirementProjection,
  inputs: IsraeliRetirementInputs
): RetirementRecommendation[] {
  const recommendations: RetirementRecommendation[] = [];

  // Low readiness score
  if (projection.readinessScore < 70) {
    recommendations.push({
      id: 'increase-savings',
      title: 'Increase pension contributions',
      description: `Your retirement readiness is ${projection.readinessScore}%. Consider increasing monthly savings by ₪${projection.recommendedMonthlySaving.toLocaleString()}.`,
      impact: 'high',
      actionItems: [
        'Review your pension fund contribution rate',
        'Ask employer about matching contributions',
        'Consider voluntary pension deposits (הפקדות שוטפות)',
        'Open a קרן השתלמות if eligible',
      ],
    });
  }

  // Missing pension types
  const existingTypes = new Set(projection.pensionBreakdown.map(p => p.type));
  if (!existingTypes.has('education') && inputs.yearsWorked < 30) {
    recommendations.push({
      id: 'education-fund',
      title: 'Consider a קרן השתלמות',
      description:
        'Education funds offer tax-free withdrawals after 6 years and employer contributions. Great for medium-term savings.',
      impact: 'high',
      actionItems: [
        'Check if your employer offers קרן השתלמות',
        'Maximize the tax-exempt contribution limit',
        'Consider using matured funds for investments',
      ],
    });
  }

  // Early retirement warning
  if (inputs.earlyRetirement && projection.yearsOfIncome < 25) {
    recommendations.push({
      id: 'early-retirement-risk',
      title: 'Early retirement risk',
      description: `With early retirement, your savings may only last ${projection.yearsOfIncome} years. Consider delaying retirement or increasing savings.`,
      impact: 'high',
      actionItems: [
        'Consider part-time work in early retirement',
        'Delay retirement by 2-3 years if possible',
        'Build an emergency fund for unexpected expenses',
      ],
    });
  }

  // Bituach Leumi optimization
  if (inputs.yearsWorked < 35 && projection.yearsToRetirement > 0) {
    const yearsNeeded = BITUACH_LEUMI.fullBenefitYears - inputs.yearsWorked;
    if (yearsNeeded <= projection.yearsToRetirement) {
      recommendations.push({
        id: 'bituach-leumi',
        title: 'Maximize Bituach Leumi benefits',
        description: `Working ${yearsNeeded} more years will maximize your National Insurance pension benefit.`,
        impact: 'medium',
        actionItems: [
          'Keep employment continuous when possible',
          'Consider voluntary contributions if self-employed',
          'Check your Bituach Leumi status on gov.il',
        ],
      });
    }
  }

  // Diversification recommendation
  if (projection.pensionBreakdown.length === 1) {
    recommendations.push({
      id: 'diversify',
      title: 'Diversify retirement savings',
      description:
        'Having multiple pension fund types provides tax advantages and flexibility.',
      impact: 'medium',
      actionItems: [
        'Consider adding a provident fund (קופת גמל)',
        'Review investment tracks in your existing funds',
        'Balance between growth and stability based on age',
      ],
    });
  }

  return recommendations;
}

/**
 * Format currency for display
 */
export function formatILS(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Log retirement calculation for debugging
 */
export function logRetirementCalculation(
  inputs: IsraeliRetirementInputs,
  projection: RetirementProjection
): void {
  logger.info('Israeli retirement calculation', {
    inputs: {
      currentAge: inputs.currentAge,
      gender: inputs.gender,
      yearsWorked: inputs.yearsWorked,
      pensionValue: inputs.pensionFunds.totalValue,
      additionalSavings: inputs.additionalSavings,
    },
    projection: {
      retirementAge: projection.retirementAge,
      readinessScore: projection.readinessScore,
      totalMonthlyIncome: projection.totalMonthlyIncome,
      incomeGap: projection.incomeGap,
    },
  });
}
