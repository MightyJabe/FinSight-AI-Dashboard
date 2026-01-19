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

export async function GET(req: Request) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    const snapshot = await db
      .collection('goals')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const goals = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, goals });
  } catch (error) {
    logger.error('Error fetching goals', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/goals',
      method: 'GET',
    });
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    const body = await req.json();
    const parsed = goalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', errors: parsed.error.formErrors },
        { status: 400 }
      );
    }

    const goalData = {
      ...parsed.data,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('goals').add(goalData);

    return NextResponse.json({ success: true, goal: { id: docRef.id, ...goalData } });
  } catch (error) {
    logger.error('Error creating goal', {
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/goals',
      method: 'POST',
    });
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
