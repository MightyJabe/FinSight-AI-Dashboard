import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateAuthToken } from '@/lib/auth-server';
import { adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import {
  calculateIsraeliRetirement,
  generateRetirementRecommendations,
  type IsraeliRetirementInputs,
} from '@/lib/services/israeli-retirement-calculator';
import { getPensionFunds } from '@/lib/services/pension-service';

const calculateSchema = z.object({
  currentAge: z.number().min(18).max(80),
  gender: z.enum(['male', 'female']),
  currentSalary: z.number().min(0),
  yearsWorked: z.number().min(0).max(60),
  desiredMonthlyIncome: z.number().min(0),
  earlyRetirement: z.boolean().default(false),
  expectedReturnRate: z.number().min(0).max(15).default(5),
  inflationRate: z.number().min(0).max(10).default(2.5),
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    const body = await req.json().catch(() => ({}));
    const parsed = calculateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const inputs = parsed.data;

    // Fetch user's pension funds
    const pensionFunds = await getPensionFunds(userId);

    // Fetch additional savings (non-pension investments)
    const savingsSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('manualAssets')
      .where('type', 'in', ['savings', 'investment', 'brokerage'])
      .get();

    const additionalSavings = savingsSnapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (data.currentBalance || data.amount || 0);
    }, 0);

    // Build retirement inputs
    const retirementInputs: IsraeliRetirementInputs = {
      currentAge: inputs.currentAge,
      gender: inputs.gender,
      currentSalary: inputs.currentSalary,
      yearsWorked: inputs.yearsWorked,
      pensionFunds,
      additionalSavings,
      desiredMonthlyIncome: inputs.desiredMonthlyIncome,
      earlyRetirement: inputs.earlyRetirement,
      expectedReturnRate: inputs.expectedReturnRate,
      inflationRate: inputs.inflationRate,
    };

    // Calculate projection
    const projection = calculateIsraeliRetirement(retirementInputs);

    // Generate recommendations
    const recommendations = generateRetirementRecommendations(projection, retirementInputs);

    logger.info('Retirement calculation completed', {
      userId,
      readinessScore: projection.readinessScore,
      yearsToRetirement: projection.yearsToRetirement,
    });

    return NextResponse.json({
      success: true,
      data: {
        projection,
        recommendations,
        inputs: {
          ...inputs,
          pensionFundsCount: pensionFunds.funds.length,
          totalPensionValue: pensionFunds.totalValue,
          additionalSavings,
        },
      },
    });
  } catch (error) {
    logger.error('Error calculating retirement', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    // Fetch user settings for saved retirement preferences
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Fetch pension funds
    const pensionFunds = await getPensionFunds(userId);

    return NextResponse.json({
      success: true,
      data: {
        savedSettings: {
          currentAge: userData?.retirementSettings?.currentAge,
          gender: userData?.retirementSettings?.gender || userData?.gender,
          currentSalary: userData?.retirementSettings?.currentSalary || userData?.monthlyIncome,
          yearsWorked: userData?.retirementSettings?.yearsWorked,
          desiredMonthlyIncome: userData?.retirementSettings?.desiredMonthlyIncome,
          earlyRetirement: userData?.retirementSettings?.earlyRetirement || false,
        },
        pensionFunds: {
          count: pensionFunds.funds.length,
          totalValue: pensionFunds.totalValue,
          byType: pensionFunds.totalByType,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching retirement data', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
