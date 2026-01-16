import { NextRequest, NextResponse } from 'next/server';

import { AuditEventType, AuditSeverity, logSecurityEvent } from '@/lib/audit-logger';
import { validateAuthToken } from '@/lib/auth-server';
import { adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { requirePlan } from '@/lib/plan-guard';
import { calculateMonthlyTotal, detectSubscriptions } from '@/lib/subscription-detector';

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId;

    const allowed = await requirePlan(userId, 'pro');
    if (!allowed) {
      await logSecurityEvent(AuditEventType.UNAUTHORIZED_ACCESS, AuditSeverity.HIGH, {
        userId,
        endpoint: '/api/subscriptions/detect',
        resource: 'subscriptions',
        errorMessage: 'Pro plan required for subscription detection',
      });
      return NextResponse.json(
        { success: false, error: 'Pro plan required for subscription detection' },
        { status: 402 }
      );
    }

    const snapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .orderBy('date', 'desc')
      .limit(500)
      .get();

    const transactions = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    const subscriptions = detectSubscriptions(transactions);

    const batch = adminDb.batch();
    subscriptions.forEach(sub => {
      const docRef = adminDb
        .collection('users')
        .doc(userId)
        .collection('subscriptions')
        .doc(sub.id);
      batch.set(
        docRef,
        {
          ...sub,
          userId,
          detectedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    });
    await batch.commit();

    const monthlyTotal = calculateMonthlyTotal(subscriptions);

    logger.info('Detected subscriptions', {
      userId,
      count: subscriptions.length,
      monthlyTotal,
    });

    return NextResponse.json({
      success: true,
      subscriptions,
      summary: {
        totalMonthly: monthlyTotal,
        totalYearly: monthlyTotal * 12,
        activeCount: subscriptions.filter(s => s.status === 'active').length,
      },
    });
  } catch (error) {
    logger.error('Error detecting subscriptions', {
      error: error instanceof Error ? error.message : String(error),
    });
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

    const allowed = await requirePlan(userId, 'pro');
    if (!allowed) {
      await logSecurityEvent(AuditEventType.UNAUTHORIZED_ACCESS, AuditSeverity.HIGH, {
        userId,
        endpoint: '/api/subscriptions/detect',
        resource: 'subscriptions',
        errorMessage: 'Pro plan required to view subscriptions',
      });
      return NextResponse.json(
        { success: false, error: 'Pro plan required to view subscriptions' },
        { status: 402 }
      );
    }

    const snapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('subscriptions')
      .where('status', '==', 'active')
      .get();

    const subscriptions = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const monthlyTotal = calculateMonthlyTotal(subscriptions as any[]);

    return NextResponse.json({
      success: true,
      subscriptions,
      summary: {
        totalMonthly: monthlyTotal,
        totalYearly: monthlyTotal * 12,
        activeCount: subscriptions.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching subscriptions', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
