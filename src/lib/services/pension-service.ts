/**
 * Pension Fund Service
 *
 * Manages Israeli pension funds, provident funds (קופת גמל),
 * and education funds (קרן השתלמות) for net worth calculations.
 *
 * Israeli pension types:
 * - pension: קרן פנסיה (Pension Fund)
 * - provident: קופת גמל (Provident Fund)
 * - education: קרן השתלמות (Education/Training Fund)
 * - severance: פיצויים (Severance Pay Fund)
 */

import { adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

export type PensionType = 'pension' | 'provident' | 'education' | 'severance';

export interface PensionFund {
  id: string;
  name: string;
  provider: string;
  type: PensionType;
  accountNumber: string | undefined;
  currentValue: number;
  employerContribution: number;
  employeeContribution: number;
  totalContributions: number;
  lastStatementDate: Date;
  projectedValueAtRetirement: number | undefined;
  retirementAge: number | undefined;
  currency: string;
  notes: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface PensionResult {
  funds: PensionFund[];
  totalValue: number;
  totalByType: Record<PensionType, number>;
  projectedRetirementValue: number;
}

// Major Israeli pension providers
export const PENSION_PROVIDERS = [
  { id: 'migdal', name: 'מגדל (Migdal)', nameEn: 'Migdal' },
  { id: 'menora', name: 'מנורה מבטחים (Menora)', nameEn: 'Menora Mivtachim' },
  { id: 'clal', name: 'כלל ביטוח (Clal)', nameEn: 'Clal Insurance' },
  { id: 'phoenix', name: 'הפניקס (Phoenix)', nameEn: 'Phoenix' },
  { id: 'harel', name: 'הראל (Harel)', nameEn: 'Harel' },
  { id: 'psagot', name: 'פסגות (Psagot)', nameEn: 'Psagot' },
  { id: 'altshuler', name: 'אלטשולר שחם (Altshuler)', nameEn: 'Altshuler Shaham' },
  { id: 'meitav', name: 'מיטב דש (Meitav)', nameEn: 'Meitav Dash' },
  { id: 'analyst', name: 'אנליסט (Analyst)', nameEn: 'Analyst' },
  { id: 'other', name: 'אחר (Other)', nameEn: 'Other' },
] as const;

// Pension type labels in Hebrew and English
export const PENSION_TYPE_LABELS: Record<PensionType, { he: string; en: string }> = {
  pension: { he: 'קרן פנסיה', en: 'Pension Fund' },
  provident: { he: 'קופת גמל', en: 'Provident Fund' },
  education: { he: 'קרן השתלמות', en: 'Education Fund' },
  severance: { he: 'פיצויים', en: 'Severance Fund' },
};

/**
 * Get all pension funds for a user
 */
export async function getPensionFunds(userId: string): Promise<PensionResult> {
  try {
    const fundsSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('pensionFunds')
      .get();

    if (fundsSnapshot.empty) {
      return {
        funds: [],
        totalValue: 0,
        totalByType: {
          pension: 0,
          provident: 0,
          education: 0,
          severance: 0,
        },
        projectedRetirementValue: 0,
      };
    }

    const funds: PensionFund[] = fundsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Pension Fund',
        provider: data.provider || 'other',
        type: data.type || 'pension',
        accountNumber: data.accountNumber,
        currentValue: Number(data.currentValue || 0),
        employerContribution: Number(data.employerContribution || 0),
        employeeContribution: Number(data.employeeContribution || 0),
        totalContributions: Number(data.totalContributions || 0),
        lastStatementDate: data.lastStatementDate?.toDate?.() || new Date(),
        projectedValueAtRetirement: data.projectedValueAtRetirement
          ? Number(data.projectedValueAtRetirement)
          : undefined,
        retirementAge: data.retirementAge ? Number(data.retirementAge) : undefined,
        currency: data.currency || 'ILS',
        notes: data.notes,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      };
    });

    const totalValue = funds.reduce((sum, f) => sum + f.currentValue, 0);

    const totalByType: Record<PensionType, number> = {
      pension: 0,
      provident: 0,
      education: 0,
      severance: 0,
    };

    funds.forEach((fund) => {
      totalByType[fund.type] += fund.currentValue;
    });

    const projectedRetirementValue = funds.reduce(
      (sum, f) => sum + (f.projectedValueAtRetirement || 0),
      0
    );

    logger.info('Pension funds fetched', {
      userId,
      fundCount: funds.length,
      totalValue,
    });

    return {
      funds,
      totalValue,
      totalByType,
      projectedRetirementValue,
    };
  } catch (error) {
    logger.error('Error fetching pension funds', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      funds: [],
      totalValue: 0,
      totalByType: {
        pension: 0,
        provident: 0,
        education: 0,
        severance: 0,
      },
      projectedRetirementValue: 0,
    };
  }
}

/**
 * Add a new pension fund
 */
export async function addPensionFund(
  userId: string,
  fund: Omit<PensionFund, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PensionFund> {
  const now = new Date();
  const docRef = await adminDb
    .collection('users')
    .doc(userId)
    .collection('pensionFunds')
    .add({
      ...fund,
      createdAt: now,
      updatedAt: now,
    });

  logger.info('Pension fund added', {
    userId,
    fundId: docRef.id,
    type: fund.type,
    provider: fund.provider,
  });

  return {
    ...fund,
    id: docRef.id,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update a pension fund
 */
export async function updatePensionFund(
  userId: string,
  fundId: string,
  updates: Partial<Omit<PensionFund, 'id' | 'createdAt'>>
): Promise<void> {
  await adminDb
    .collection('users')
    .doc(userId)
    .collection('pensionFunds')
    .doc(fundId)
    .update({
      ...updates,
      updatedAt: new Date(),
    });

  logger.info('Pension fund updated', { userId, fundId });
}

/**
 * Delete a pension fund
 */
export async function deletePensionFund(userId: string, fundId: string): Promise<void> {
  await adminDb
    .collection('users')
    .doc(userId)
    .collection('pensionFunds')
    .doc(fundId)
    .delete();

  logger.info('Pension fund deleted', { userId, fundId });
}

/**
 * Convert pension funds to account format for financial calculator
 */
export function pensionFundsToAccounts(funds: PensionFund[]): Array<{
  id: string;
  name: string;
  balance: number;
  type: string;
}> {
  return funds.map((f) => ({
    id: f.id,
    name: f.name,
    balance: f.currentValue,
    type: 'pension',
  }));
}

/**
 * Calculate simple retirement projection
 * This is a simplified calculation - real projections need actuarial analysis
 */
export function calculateSimpleRetirementProjection(
  currentValue: number,
  monthlyContribution: number,
  yearsToRetirement: number,
  annualReturnRate: number = 0.05 // 5% default
): number {
  // Future value of current balance
  const fvCurrentBalance = currentValue * Math.pow(1 + annualReturnRate, yearsToRetirement);

  // Future value of monthly contributions (annuity)
  const monthlyRate = annualReturnRate / 12;
  const months = yearsToRetirement * 12;
  const fvContributions = monthlyContribution *
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

  return Math.round(fvCurrentBalance + fvContributions);
}
