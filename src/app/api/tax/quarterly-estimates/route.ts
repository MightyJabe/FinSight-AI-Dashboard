import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateAuthToken } from '@/lib/auth-server';
import { adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { estimateQuarterlyTaxes } from '@/lib/tax-optimizer';

const requestSchema = z.object({
  income: z.number().positive(),
  deductions: z.number().min(0),
  filingStatus: z
    .enum(['single', 'married_joint', 'married_separate', 'head_of_household'])
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    const { income, deductions, filingStatus = 'single' } = parsed.data;

    const estimates = await estimateQuarterlyTaxes(income, deductions, filingStatus);

    const batch = adminDb.batch();
    estimates.forEach(estimate => {
      const docRef = adminDb
        .collection('users')
        .doc(userId)
        .collection('quarterlyTaxEstimates')
        .doc(`${estimate.year}-Q${estimate.quarter}`);
      batch.set(
        docRef,
        {
          ...estimate,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    });
    await batch.commit();

    logger.info('Generated quarterly tax estimates', { userId, income, deductions });

    return NextResponse.json({
      success: true,
      estimates,
      summary: {
        annualIncome: income,
        annualDeductions: deductions,
        totalEstimatedTax: estimates.reduce((sum, e) => sum + e.estimatedTax, 0),
      },
    });
  } catch (error) {
    logger.error('Error generating quarterly estimates', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');

    const baseQuery = adminDb.collection('users').doc(userId).collection('quarterlyTaxEstimates');

    const snapshot = year
      ? await baseQuery.where('year', '==', parseInt(year)).get()
      : await baseQuery.get();
    const estimates = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, estimates });
  } catch (error) {
    logger.error('Error fetching quarterly estimates', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
