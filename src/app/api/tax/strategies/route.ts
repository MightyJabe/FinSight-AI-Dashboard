import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { suggestTaxStrategies } from '@/lib/tax-optimizer';

const requestSchema = z.object({
  income: z.number().positive(),
  age: z.number().min(18).max(100),
  hasRetirementAccount: z.boolean().optional(),
  has401k: z.boolean().optional(),
  hasHSA: z.boolean().optional(),
  investmentAccounts: z.number().min(0).optional(),
  charitableGiving: z.number().min(0).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    const financialProfile = {
      income: parsed.data.income,
      age: parsed.data.age,
      hasRetirementAccount: parsed.data.hasRetirementAccount ?? false,
      has401k: parsed.data.has401k ?? false,
      hasHSA: parsed.data.hasHSA ?? false,
      investmentAccounts: parsed.data.investmentAccounts ?? 0,
      charitableGiving: parsed.data.charitableGiving ?? 0,
    };

    const strategies = await suggestTaxStrategies(userId, financialProfile);

    const batch = adminDb.batch();
    strategies.forEach(strategy => {
      const docRef = adminDb
        .collection('users')
        .doc(userId)
        .collection('taxStrategies')
        .doc(strategy.id);
      batch.set(docRef, {
        ...strategy,
        createdAt: new Date().toISOString(),
      });
    });
    await batch.commit();

    logger.info('Generated tax strategies', { userId, strategyCount: strategies.length });

    return NextResponse.json({
      success: true,
      strategies,
      summary: {
        totalStrategies: strategies.length,
        totalPotentialSavings: strategies.reduce((sum, s) => sum + s.potentialSavings, 0),
      },
    });
  } catch (error) {
    logger.error('Error generating tax strategies', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const snapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('taxStrategies')
      .orderBy('priority', 'desc')
      .get();

    const strategies = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, strategies });
  } catch (error) {
    logger.error('Error fetching tax strategies', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
