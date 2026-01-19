import { NextResponse } from 'next/server';
import { z } from 'zod';

import { validateAuthToken } from '@/lib/auth-server';
import { adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

const goalSchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    'emergency_fund',
    'home',
    'vacation',
    'car',
    'debt_payoff',
    'retirement',
    'education',
    'other',
  ]),
  targetAmount: z.number().min(0),
  currentAmount: z.number().min(0),
  deadline: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    const docRef = db.collection('goals').doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = goalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', errors: parsed.error.formErrors },
        { status: 400 }
      );
    }

    await docRef.update({
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error updating goal', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/goals/[id]',
      method: 'PUT',
      goalId: params.id,
    });
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    const docRef = db.collection('goals').doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting goal', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/goals/[id]',
      method: 'DELETE',
      goalId: params.id,
    });
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}
