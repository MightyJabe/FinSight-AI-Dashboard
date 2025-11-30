import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { analyzeDeductibleExpenses } from '@/lib/tax-optimizer';

const requestSchema = z.object({
  year: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
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

    const { year, startDate, endDate } = parsed.data;

    let query = adminDb
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .orderBy('date', 'desc');

    if (year) {
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;
      query = query.where('date', '>=', yearStart).where('date', '<=', yearEnd);
    } else if (startDate && endDate) {
      query = query.where('date', '>=', startDate).where('date', '<=', endDate);
    }

    const snapshot = await query.limit(1000).get();
    const transactions = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    const deductibleExpenses = await analyzeDeductibleExpenses(userId, transactions);

    const batch = adminDb.batch();
    deductibleExpenses.forEach(expense => {
      const docRef = adminDb.collection('users').doc(userId).collection('deductibleExpenses').doc();
      batch.set(docRef, {
        ...expense,
        createdAt: new Date().toISOString(),
      });
    });
    await batch.commit();

    logger.info('Analyzed deductible expenses', {
      userId,
      transactionCount: transactions.length,
      deductibleCount: deductibleExpenses.length,
    });

    return NextResponse.json({
      success: true,
      deductibleExpenses,
      summary: {
        totalTransactions: transactions.length,
        deductibleCount: deductibleExpenses.length,
        totalDeductible: deductibleExpenses.reduce((sum, exp) => sum + exp.amount, 0),
      },
    });
  } catch (error) {
    logger.error('Error analyzing deductions', { error });
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
      .collection('deductibleExpenses')
      .orderBy('date', 'desc')
      .get();

    const expenses = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, expenses });
  } catch (error) {
    logger.error('Error fetching deductible expenses', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
