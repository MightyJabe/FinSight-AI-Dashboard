'use client';

import { Bell, Crown, Database, Palette, Shield, Sparkles, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import { CurrencySelector, getCurrencyDisplayString } from '@/components/settings/CurrencySelector';
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
  const { settings, refresh } = useUserSettings(Boolean(user));
  const [billingLoading, setBillingLoading] = useState<'upgrade' | 'portal' | null>(null);
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);

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
        {
          label: 'Currency',
          value: getCurrencyDisplayString(settings.baseCurrency),
          action: 'Change',
          onClick: () => setCurrencyModalOpen(true),
        },
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
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-display gradient-text tracking-tight">Settings</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Manage your account preferences and app configuration.
          </p>
        </div>

        {/* Plan / Billing */}
        <div className="glass-card-strong rounded-2xl border border-border hover:border-blue-500/30 transition-all duration-300 mb-6 group relative overflow-hidden">
          {/* Background glow on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          </div>

          <div className="px-6 py-4 border-b border-border flex items-center gap-3 relative z-10">
            <Crown className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            <h2 className="text-lg font-semibold gradient-text">Plan & Billing</h2>
          </div>
          <div className="p-6 space-y-4 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Current plan</p>
                <p className="text-xl font-semibold text-foreground capitalize">
                  {settings.plan}
                  {settings.proActive ? (
                    <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">Active</span>
                  ) : (
                    <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">Inactive</span>
                  )}
                </p>
                {settings.trialEndsAt && (
                  <p className="text-xs text-muted-foreground">
                    Trial ends: {new Date(settings.trialEndsAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="gradient"
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
            <p className="text-sm text-muted-foreground">
              Pro unlocks investment optimization, tax deductions, subscription detection, and
              document uploads. Elite is available for heavier users and advisor workflows.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {settingsSections.map(section => (
            <div
              key={section.title}
              className="glass-card rounded-2xl border border-border hover:border-blue-500/30 transition-all duration-300 group"
            >
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center">
                  <section.icon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 group-hover:scale-110 transition-transform" />
                  <h2 className="text-lg font-semibold gradient-text">{section.title}</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {section.items.map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.value}</p>
                      </div>
                      {'action' in item && item.action && (
                        <button
                          onClick={'onClick' in item && typeof item.onClick === 'function' ? item.onClick : undefined}
                          className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                            'danger' in item && item.danger
                              ? 'text-rose-400 hover:bg-rose-500/10'
                              : 'text-blue-400 hover:bg-blue-500/10'
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
          <div className="glass-card rounded-2xl border border-border hover:border-red-500/30 transition-all duration-300">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Sign Out</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Sign out of your account. You&apos;ll need to sign in again to access your data.
              </p>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-rose-500/30"
              >
                {loading ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Currency Selector Modal */}
      <CurrencySelector
        isOpen={currencyModalOpen}
        onClose={() => setCurrencyModalOpen(false)}
        currentCurrency={settings.baseCurrency}
        onCurrencyChange={() => {
          refresh();
        }}
      />
    </div>
  );
}
