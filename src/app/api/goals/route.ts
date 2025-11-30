import { NextResponse } from 'next/server';
import { z } from 'zod';

import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';

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
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

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
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

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
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
