'use client';

import { useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import { Button } from '@/components/ui/Button';
import type { Subscription } from '@/types/subscription';

export default function SubscriptionsPage() {
  const { firebaseUser } = useSession();
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [summary, setSummary] = useState({ totalMonthly: 0, totalYearly: 0, activeCount: 0 });

  const detectSubscriptions = async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/subscriptions/detect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSubscriptions(data.subscriptions);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error detecting subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <Button onClick={detectSubscriptions} disabled={loading}>
            {loading ? 'Detecting...' : 'Detect Subscriptions'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Monthly Total</p>
            <p className="text-2xl font-bold">${summary.totalMonthly.toFixed(2)}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Yearly Total</p>
            <p className="text-2xl font-bold">${summary.totalYearly.toFixed(2)}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Active Subscriptions</p>
            <p className="text-2xl font-bold">{summary.activeCount}</p>
          </div>
        </div>

        {subscriptions.length > 0 ? (
          <div className="space-y-4">
            {subscriptions.map(sub => (
              <div key={sub.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{sub.merchant}</h3>
                    <p className="text-sm text-gray-600">{sub.category}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Next charge: {sub.nextCharge} • {sub.frequency}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${sub.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      per{' '}
                      {sub.frequency === 'monthly'
                        ? 'month'
                        : sub.frequency === 'yearly'
                          ? 'year'
                          : 'week'}
                    </p>
                  </div>
                </div>

                {sub.priceHistory.length > 1 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-600">Price History:</p>
                    <div className="flex gap-2 mt-1">
                      {sub.priceHistory.slice(-3).map((ph, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          ${ph.amount.toFixed(2)} ({ph.date})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No subscriptions detected yet.</p>
            <p className="text-sm mt-2">
              Click &quot;Detect Subscriptions&quot; to analyze your transactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
