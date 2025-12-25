import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { validateAuthToken } from '@/lib/auth-server';
import { adminDb as db } from '@/lib/firebase-admin';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' }) : null;

const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO,
  elite: process.env.STRIPE_PRICE_ELITE,
};

export async function POST(request: Request) {
  try {
    const { userId, error } = await validateAuthToken(request as any);
    if (error) return error;

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const plan = body.plan === 'elite' ? 'elite' : 'pro';
    const priceId = PLAN_PRICE_MAP[plan];

    if (!priceId) {
      return NextResponse.json({ error: 'Plan not available' }, { status: 400 });
    }

    // Get or create Stripe customer
    const userRef = db.collection('users').doc(userId);
    const snap = await userRef.get();
    const userData = snap.exists ? snap.data() || {} : {};

    let customerId = userData.stripeCustomerId as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await userRef.set({ stripeCustomerId: customerId }, { merge: true });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?billing=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?billing=cancel`,
      allow_promotion_codes: true,
      subscription_data: {
        trial_settings: {
          end_behavior: { missing_payment_method: 'cancel' },
        },
      },
      metadata: {
        userId,
        plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
