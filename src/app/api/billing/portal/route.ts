import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { validateAuthToken } from '@/lib/auth-server';
import { adminDb as db } from '@/lib/firebase-admin';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' }) : null;

export async function POST(request: Request) {
  try {
    const { userId, error } = await validateAuthToken(request as any);
    if (error) return error;

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const snap = await db.collection('users').doc(userId).get();
    const customerId = snap.exists
      ? (snap.data()?.stripeCustomerId as string | undefined)
      : undefined;

    if (!customerId) {
      return NextResponse.json({ error: 'No billing customer found' }, { status: 400 });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
