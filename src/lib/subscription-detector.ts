import type { Subscription } from '@/types/subscription';

interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  category: string;
}

export function detectSubscriptions(transactions: Transaction[]): Subscription[] {
  const merchantGroups = new Map<string, Transaction[]>();

  transactions.forEach(t => {
    const merchant = normalizeMerchant(t.description);
    if (!merchantGroups.has(merchant)) {
      merchantGroups.set(merchant, []);
    }
    const group = merchantGroups.get(merchant);
    if (group) group.push(t);
  });

  const subscriptions: Subscription[] = [];

  merchantGroups.forEach((txns, merchant) => {
    if (txns.length < 2) return;

    txns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const intervals: number[] = [];
    for (let i = 1; i < txns.length; i++) {
      const days = Math.round(
        (new Date(txns[i]!.date).getTime() - new Date(txns[i - 1]!.date).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      intervals.push(days);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const isRecurring = intervals.every(i => Math.abs(i - avgInterval) < 7);

    if (!isRecurring) return;

    const frequency = avgInterval < 10 ? 'weekly' : avgInterval < 35 ? 'monthly' : 'yearly';
    const lastTxn = txns[txns.length - 1];
    if (!lastTxn) return;
    const nextCharge = new Date(
      new Date(lastTxn.date).getTime() + avgInterval * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split('T')[0] as string;

    const amounts = txns.map(t => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const amountVariance = amounts.every(a => Math.abs(a - avgAmount) < avgAmount * 0.1);

    if (!amountVariance) return;

    subscriptions.push({
      id: `sub-${merchant}-${Date.now()}`,
      userId: '',
      merchant,
      amount: avgAmount,
      frequency,
      nextCharge,
      category: lastTxn?.category || 'Other',
      status: 'active',
      firstDetected: txns[0]!.date,
      lastCharge: (lastTxn?.date || new Date().toISOString().split('T')[0]) as string,
      transactionIds: txns.map(t => t.id),
      cancellable: true,
      priceHistory: txns.map(t => ({ amount: t.amount, date: t.date })),
    });
  });

  return subscriptions;
}

function normalizeMerchant(description: string): string {
  return description
    .toLowerCase()
    .replace(/\d+/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');
}

export function calculateMonthlyTotal(subscriptions: Subscription[]): number {
  return subscriptions.reduce((total, sub) => {
    if (sub.status !== 'active') return total;

    switch (sub.frequency) {
      case 'weekly':
        return total + sub.amount * 4.33;
      case 'monthly':
        return total + sub.amount;
      case 'yearly':
        return total + sub.amount / 12;
      default:
        return total;
    }
  }, 0);
}

export function detectPriceIncrease(subscription: Subscription): {
  increased: boolean;
  oldPrice: number;
  newPrice: number;
  percentIncrease: number;
} | null {
  if (subscription.priceHistory.length < 2) return null;

  const sorted = [...subscription.priceHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const oldPrice = sorted[sorted.length - 2]!.amount;
  const newPrice = sorted[sorted.length - 1]!.amount;

  if (newPrice > oldPrice) {
    return {
      increased: true,
      oldPrice,
      newPrice,
      percentIncrease: ((newPrice - oldPrice) / oldPrice) * 100,
    };
  }

  return null;
}
