'use client';

import { Bell, Crown, Database, Palette, Shield, Sparkles, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import { Button } from '@/components/ui';
import { useUserSettings } from '@/hooks/use-user-settings';
import { auth as firebaseAuth } from '@/lib/firebase';

/**
 *
 */
export default function SettingsPage() {
  const { user } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { settings } = useUserSettings(Boolean(user));
  const [billingLoading, setBillingLoading] = useState<'upgrade' | 'portal' | null>(null);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await firebaseAuth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCheckout = async (plan: 'pro' | 'elite') => {
    try {
      setBillingLoading('upgrade');
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout failed', error);
    } finally {
      setBillingLoading(null);
    }
  };

  const openPortal = async () => {
    try {
      setBillingLoading('portal');
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal failed', error);
    } finally {
      setBillingLoading(null);
    }
  };

  const settingsSections = [
    {
      title: 'Account',
      icon: User,
      items: [
        { label: 'Email', value: user?.email || 'Not set' },
        { label: 'Display Name', value: user?.displayName || 'Not set' },
        // 'Account Created' removed due to missing 'metadata' on SerializableUser
      ],
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      items: [
        { label: 'Two-Factor Authentication', value: 'Not enabled', action: 'Enable' },
        { label: 'Data Export', value: 'Download your data', action: 'Export' },
        { label: 'Delete Account', value: 'Permanently delete', action: 'Delete', danger: true },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Email Notifications', value: 'Enabled', action: 'Configure' },
        { label: 'Insight Reminders', value: 'Weekly', action: 'Change' },
        { label: 'Account Alerts', value: 'Enabled', action: 'Configure' },
      ],
    },
    {
      title: 'Appearance',
      icon: Palette,
      items: [
        { label: 'Theme', value: 'Light', action: 'Change' },
        { label: 'Currency', value: 'USD ($)', action: 'Change' },
        { label: 'Date Format', value: 'MM/DD/YYYY', action: 'Change' },
      ],
    },
    {
      title: 'Data & Sync',
      icon: Database,
      items: [
        { label: 'Connected Accounts', value: 'Manage Plaid connections', action: 'Manage' },
        { label: 'Manual Data', value: 'View and edit', action: 'View' },
        { label: 'Sync Frequency', value: 'Daily', action: 'Change' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Settings</h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage your account preferences and app configuration.
          </p>
        </div>

        {/* Plan / Billing */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <Crown className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Plan & Billing</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm text-gray-600">Current plan</p>
                <p className="text-xl font-semibold text-gray-900 capitalize">
                  {settings.plan}
                  {settings.proActive ? (
                    <span className="ml-2 text-xs text-green-600">Active</span>
                  ) : (
                    <span className="ml-2 text-xs text-amber-600">Inactive</span>
                  )}
                </p>
                {settings.trialEndsAt && (
                  <p className="text-xs text-gray-500">
                    Trial ends: {new Date(settings.trialEndsAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => startCheckout('pro')}
                  loading={billingLoading === 'upgrade'}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Upgrade to Pro
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openPortal}
                  loading={billingLoading === 'portal'}
                >
                  Manage Billing
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Pro unlocks investment optimization, tax deductions, subscription detection, and
              document uploads. Elite is available for heavier users and advisor workflows.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {settingsSections.map(section => (
            <div
              key={section.title}
              className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <section.icon className="h-5 w-5 text-gray-500 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {section.items.map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.value}</p>
                      </div>
                      {'action' in item && item.action && (
                        <button
                          className={`text-sm font-medium px-3 py-1 rounded-md transition-colors ${
                            'danger' in item && item.danger
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-primary hover:bg-primary/10'
                          }`}
                        >
                          {item.action}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Sign Out Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Sign Out</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Sign out of your account. You&apos;ll need to sign in again to access your data.
              </p>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
