import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateAuthToken } from '@/lib/auth-server';
import logger from '@/lib/logger';
import {
  addPensionFund,
  deletePensionFund,
  getPensionFunds,
  PENSION_PROVIDERS,
  updatePensionFund,
} from '@/lib/services/pension-service';

// Validation schemas
const pensionTypeSchema = z.enum(['pension', 'provident', 'education', 'severance']);

const providerIds = PENSION_PROVIDERS.map(p => p.id) as [string, ...string[]];
const providerSchema = z.enum(providerIds);

const createPensionSchema = z.object({
  name: z.string().min(1).max(100),
  provider: providerSchema,
  type: pensionTypeSchema,
  accountNumber: z.string().max(50).optional(),
  currentValue: z.number().min(0),
  employerContribution: z.number().min(0).default(0),
  employeeContribution: z.number().min(0).default(0),
  totalContributions: z.number().min(0).default(0),
  lastStatementDate: z.string().datetime().optional(),
  projectedValueAtRetirement: z.number().min(0).optional(),
  retirementAge: z.number().min(55).max(75).optional(),
  currency: z.string().length(3).default('ILS'),
  notes: z.string().max(1000).optional(),
});

const updatePensionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  currentValue: z.number().min(0).optional(),
  employerContribution: z.number().min(0).optional(),
  employeeContribution: z.number().min(0).optional(),
  totalContributions: z.number().min(0).optional(),
  lastStatementDate: z.string().datetime().optional(),
  projectedValueAtRetirement: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

const deletePensionSchema = z.object({
  id: z.string().min(1),
});

/**
 * GET /api/pension - Get all pension funds for the user
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }

    const result = await getPensionFunds(authResult.userId);

    return NextResponse.json({
      success: true,
      data: result,
      providers: PENSION_PROVIDERS,
    });
  } catch (error) {
    logger.error('Error in GET /api/pension', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pension funds' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pension - Add a new pension fund
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await req.json();
    const parsed = createPensionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    const fund = await addPensionFund(authResult.userId, {
      name: parsed.data.name,
      provider: parsed.data.provider,
      type: parsed.data.type,
      accountNumber: parsed.data.accountNumber,
      currentValue: parsed.data.currentValue,
      employerContribution: parsed.data.employerContribution,
      employeeContribution: parsed.data.employeeContribution,
      totalContributions: parsed.data.totalContributions,
      lastStatementDate: parsed.data.lastStatementDate
        ? new Date(parsed.data.lastStatementDate)
        : new Date(),
      projectedValueAtRetirement: parsed.data.projectedValueAtRetirement,
      retirementAge: parsed.data.retirementAge,
      currency: parsed.data.currency,
      notes: parsed.data.notes,
    });

    return NextResponse.json({
      success: true,
      data: fund,
    }, { status: 201 });
  } catch (error) {
    logger.error('Error in POST /api/pension', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to create pension fund' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pension - Update a pension fund
 */
export async function PUT(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await req.json();
    const parsed = updatePensionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    const { id, lastStatementDate, ...rest } = parsed.data;

    const updates: Record<string, unknown> = { ...rest };
    if (lastStatementDate) {
      updates.lastStatementDate = new Date(lastStatementDate);
    }

    await updatePensionFund(authResult.userId, id, updates);

    return NextResponse.json({
      success: true,
      message: 'Pension fund updated',
    });
  } catch (error) {
    logger.error('Error in PUT /api/pension', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to update pension fund' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pension - Delete a pension fund
 */
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await req.json();
    const parsed = deletePensionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    await deletePensionFund(authResult.userId, parsed.data.id);

    return NextResponse.json({
      success: true,
      message: 'Pension fund deleted',
    });
  } catch (error) {
    logger.error('Error in DELETE /api/pension', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to delete pension fund' },
      { status: 500 }
    );
  }
}
