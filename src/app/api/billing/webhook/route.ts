import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { adminDb as db } from '@/lib/firebase-admin';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' }) : null;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    if (stripeWebhookSecret) {
      event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
    } else {
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err) {
    console.error('Webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const plan = subscription.metadata?.plan || 'pro';
        if (!userId) break;
        await db
          .collection('users')
          .doc(userId)
          .set(
            {
              plan,
              proActive: subscription.status === 'active' || subscription.status === 'trialing',
              proExpiresAt:
                subscription.current_period_end &&
                new Date(subscription.current_period_end * 1000).toISOString(),
              trialUsed: true,
              trialEndsAt:
                subscription.trial_end && new Date(subscription.trial_end * 1000).toISOString(),
              stripeSubscriptionId: subscription.id,
            },
            { merge: true }
          );
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;
        await db.collection('users').doc(userId).set(
          {
            plan: 'free',
            proActive: false,
            proExpiresAt: null,
            stripeSubscriptionId: null,
          },
          { merge: true }
        );
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error('Error processing webhook', err);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
