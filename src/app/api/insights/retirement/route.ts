import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateAuthToken } from '@/lib/auth-server';
import logger from '@/lib/logger';
import {
  calculateIsraeliRetirement,
  generateRetirementRecommendations,
  ISRAELI_RETIREMENT_AGES,
} from '@/lib/services/israeli-retirement-calculator';
import { getPensionFunds } from '@/lib/services/pension-service';

const retirementInputSchema = z.object({
  currentAge: z.number().min(18).max(70),
  gender: z.enum(['male', 'female']),
  currentSalary: z.number().min(0),
  yearsWorked: z.number().min(0).max(50),
  additionalSavings: z.number().min(0).default(0),
  desiredMonthlyIncome: z.number().min(0),
  earlyRetirement: z.boolean().default(false),
  expectedReturnRate: z.number().min(1).max(15).default(5),
  inflationRate: z.number().min(0).max(10).default(2.5),
});

/**
 * GET /api/insights/retirement
 * Get user's retirement projection based on their pension funds
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }

    // Return retirement configuration options
    return NextResponse.json({
      success: true,
      data: {
        retirementAges: ISRAELI_RETIREMENT_AGES,
        defaultAssumptions: {
          expectedReturnRate: 5,
          inflationRate: 2.5,
          withdrawalRate: 4,
        },
        pensionTypes: ['pension', 'provident', 'education', 'severance'],
      },
    });
  } catch (error) {
    logger.error('Error in GET /api/insights/retirement', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to get retirement info' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/insights/retirement
 * Calculate retirement projection
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await req.json();
    const parsed = retirementInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    // Fetch user's pension funds
    const pensionFunds = await getPensionFunds(authResult.userId);

    // Calculate retirement projection
    const inputs = {
      ...parsed.data,
      pensionFunds,
    };

    const projection = calculateIsraeliRetirement(inputs);
    const recommendations = generateRetirementRecommendations(projection, inputs);

    logger.info('Retirement projection calculated', {
      userId: authResult.userId,
      readinessScore: projection.readinessScore,
      retirementAge: projection.retirementAge,
      pensionFundCount: pensionFunds.funds.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        projection,
        recommendations,
        inputs: {
          currentAge: inputs.currentAge,
          gender: inputs.gender,
          retirementAge: projection.retirementAge,
        },
      },
    });
  } catch (error) {
    logger.error('Error in POST /api/insights/retirement', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to calculate retirement projection' },
      { status: 500 }
    );
  }
}
