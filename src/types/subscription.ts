export interface Subscription {
  id: string;
  userId: string;
  merchant: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  nextCharge: string;
  category: string;
  status: 'active' | 'cancelled' | 'paused';
  firstDetected: string;
  lastCharge: string;
  transactionIds: string[];
  cancellable: boolean;
  cancellationUrl?: string;
  priceHistory: Array<{
    amount: number;
    date: string;
  }>;
}

export interface SubscriptionSummary {
  totalMonthly: number;
  totalYearly: number;
  activeCount: number;
  categories: Record<string, number>;
}
