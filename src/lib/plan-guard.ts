import { adminDb as db } from '@/lib/firebase-admin';

export type Plan = 'free' | 'pro' | 'elite';

interface PlanStatus {
  plan: Plan;
  proActive: boolean;
  proExpiresAt?: Date | null;
  trialUsed?: boolean;
  trialEndsAt?: Date | null;
}

const PLAN_ORDER: Record<Plan, number> = {
  free: 0,
  pro: 1,
  elite: 2,
};

export async function getUserPlan(userId: string): Promise<PlanStatus> {
  const snap = await db.collection('users').doc(userId).get();
  const data = snap.exists ? snap.data() || {} : {};

  return {
    plan: (data.plan as Plan) || 'free',
    proActive: Boolean(data.proActive),
    proExpiresAt: data.proExpiresAt ? new Date(data.proExpiresAt) : null,
    trialUsed: Boolean(data.trialUsed),
    trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : null,
  };
}

export function hasPlanOrBetter(current: Plan, minimum: Plan): boolean {
  return PLAN_ORDER[current] >= PLAN_ORDER[minimum];
}

export async function requirePlan(userId: string, minimumPlan: Plan): Promise<boolean> {
  const status = await getUserPlan(userId);

  // Active subscription or higher plan
  if (hasPlanOrBetter(status.plan, minimumPlan) && status.proActive !== false) {
    return true;
  }

  // Trial still active
  if (status.trialEndsAt && status.trialEndsAt > new Date()) {
    return true;
  }

  return false;
}
