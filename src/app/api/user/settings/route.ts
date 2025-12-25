import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';

const settingsSchema = z.object({
  onboardingComplete: z.boolean().optional(),
  useDemoData: z.boolean().optional(),
  primaryGoal: z.string().trim().max(200).optional(),
  goalTarget: z
    .preprocess(
      val => (val === null || val === undefined || val === '' ? undefined : Number(val)),
      z.number().finite().positive().optional()
    )
    .optional(),
  proTrialRequested: z.boolean().optional(),
  aiProactive: z.boolean().optional(),
});

async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = await auth.verifyIdToken(token);
      return decoded.uid;
    } catch {
      // fall through to session cookie
    }
  }

  const sessionCookie = cookies().get('session')?.value;
  if (sessionCookie) {
    try {
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
      return decodedClaims.uid;
    } catch {
      return null;
    }
  }

  return null;
}

export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const docRef = db.collection('users').doc(userId);
  const snap = await docRef.get();
  const data = snap.exists ? snap.data() || {} : {};

  return NextResponse.json({
    onboardingComplete: Boolean(data.onboardingComplete),
    useDemoData: Boolean(data.useDemoData),
    primaryGoal: data.primaryGoal || '',
    goalTarget: data.goalTarget ?? null,
    proTrialRequested: Boolean(data.proTrialRequested),
    aiProactive: data.aiProactive !== undefined ? Boolean(data.aiProactive) : true,
    plan: data.plan || 'free',
    proActive: Boolean(data.proActive),
    proExpiresAt: data.proExpiresAt || null,
    trialUsed: Boolean(data.trialUsed),
    trialEndsAt: data.trialEndsAt || null,
  });
}

export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {
    ...parsed.data,
    updatedAt: new Date(),
  };

  // Ensure onboardingComplete is set if any onboarding data is saved
  if (parsed.data.onboardingComplete === undefined) {
    updates.onboardingComplete = false;
  }

  // Never allow client to set plan/billing fields here
  delete updates.plan;
  delete updates.proActive;
  delete updates.proExpiresAt;
  delete updates.trialUsed;
  delete updates.trialEndsAt;
  delete updates.stripeCustomerId;
  delete updates.stripeSubscriptionId;

  await db.collection('users').doc(userId).set(updates, { merge: true });

  return NextResponse.json({ success: true });
}
