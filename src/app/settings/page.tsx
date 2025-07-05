'use client';

import { Bell, Database, Palette, Shield, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import { auth as firebaseAuth } from '@/lib/firebase';

/**
 *
 */
export default function SettingsPage() {
  const { user, firebaseUser: _firebaseUser } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
    <div className="max-w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="mt-2 text-lg text-gray-600">
          Manage your account preferences and app configuration.
        </p>
      </div>

        <div className="space-y-8">
          {settingsSections.map(section => (
            <div
              key={section.title}
              className="bg-white rounded-xl shadow-sm border border-gray-200"
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
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
  );
}
