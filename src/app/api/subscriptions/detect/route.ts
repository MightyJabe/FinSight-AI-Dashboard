import { NextRequest, NextResponse } from 'next/server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { calculateMonthlyTotal, detectSubscriptions } from '@/lib/subscription-detector';

export async function POST(req: NextRequest) {
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
