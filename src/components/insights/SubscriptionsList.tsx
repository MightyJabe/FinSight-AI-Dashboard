'use client';

import { RefreshCw, Trash2, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import { Button, Card, CardContent } from '@/components/ui';

interface Subscription {
  id: string;
  merchant: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly';
  status: 'active' | 'cancelled';
  nextBillingDate?: string;
  lastTransactionDate: string;
  transactionIds: string[];
  category?: string;
}

interface SubscriptionsSummary {
  totalMonthly: number;
  totalYearly: number;
  activeCount: number;
}

/**
 * Subscriptions List Component
 * Displays detected recurring charges and allows users to manage them
 * Implements P5.4 from financial-os-upgrade-comprehensive-plan.md
 */
export default function SubscriptionsList() {
  const { firebaseUser } = useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [summary, setSummary] = useState<SubscriptionsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      setLoading(true);
      setError(null);

      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/subscriptions/detect', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
      setSummary(data.summary);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  const detectNewSubscriptions = async () => {
    if (!firebaseUser) return;

    try {
      setDetecting(true);
      setError(null);

      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/subscriptions/detect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to detect subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
      setSummary(data.summary);
    } catch (err) {
      console.error('Error detecting subscriptions:', err);
      setError(err instanceof Error ? err.message : 'Failed to detect subscriptions');
    } finally {
      setDetecting(false);
    }
  };

  const markAsNotSubscription = async (subscriptionId: string) => {
    if (!firebaseUser) return;

    // Optimistically update UI
    setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));

    // TODO: Add API endpoint to mark subscription as false positive
    // For now, just remove from local state
    console.log('Marked as not a subscription:', subscriptionId);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const formatFrequency = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'monthly':
        return 'text-blue-600 bg-blue-50';
      case 'yearly':
        return 'text-purple-600 bg-purple-50';
      case 'weekly':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Loading subscriptions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchSubscriptions} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      {summary && (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Total Monthly Subscriptions
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  ${summary.totalMonthly.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  ${summary.totalYearly.toFixed(2)}/year · {summary.activeCount} active
                </p>
              </div>
              <Button
                onClick={detectNewSubscriptions}
                disabled={detecting}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${detecting ? 'animate-spin' : ''}`} />
                {detecting ? 'Detecting...' : 'Refresh'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions List */}
      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-600 mb-4">No subscriptions detected yet</p>
            <Button onClick={detectNewSubscriptions} disabled={detecting}>
              <RefreshCw className={`h-4 w-4 mr-2 ${detecting ? 'animate-spin' : ''}`} />
              Detect Subscriptions
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {subscriptions.map(subscription => (
            <Card key={subscription.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{subscription.merchant}</h4>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getFrequencyColor(subscription.frequency)}`}
                      >
                        {formatFrequency(subscription.frequency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-medium text-lg text-gray-900">
                        ${subscription.amount.toFixed(2)}
                      </span>
                      <span>Last: {new Date(subscription.lastTransactionDate).toLocaleDateString()}</span>
                      {subscription.category && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {subscription.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => markAsNotSubscription(subscription.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Mark as not a subscription"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
