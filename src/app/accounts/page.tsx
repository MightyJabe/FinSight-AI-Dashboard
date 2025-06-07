import { Link2, PlusCircle, Wallet } from 'lucide-react';
import Link from 'next/link';

import AccountItem from '@/components/accounts/AccountItem';
import { PlaidLinkButton } from '@/components/plaid/PlaidLinkButton';
import { DisplayableAccount, getDisplayableAccounts } from '@/lib/finance';

/**
 *
 */
export default async function AccountsPage() {
  let accounts: DisplayableAccount[] = [];
  let fetchError = null;

  try {
    accounts = await getDisplayableAccounts();
  } catch (error) {
    console.error('Failed to fetch accounts for page:', error);
    fetchError = error instanceof Error ? error.message : 'An unknown error occurred.';
    // accounts will remain empty
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Manage Accounts</h1>
        <p className="mt-2 text-lg text-gray-600">
          View your connected accounts and their balances. Add new manual accounts or link external
          services.
        </p>
      </header>

      {/* Action Buttons Section */}
      <section className="mb-12 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add or Connect Accounts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add Manual Account Card */}
          <Link
            href="/manual-data"
            className="block p-6 bg-sky-50 hover:bg-sky-100 rounded-lg shadow-md transition-all duration-200 ease-in-out transform hover:scale-105"
          >
            <div className="flex items-center text-sky-700 mb-3">
              <PlusCircle className="h-8 w-8 mr-3" />
              <h3 className="text-xl font-semibold">Add Manual Account</h3>
            </div>
            <p className="text-sky-600 text-sm">
              Manually add bank accounts, cash, wallets, or other assets and liabilities.
            </p>
          </Link>

          {/* Connect Bank Account Card (Plaid) */}
          <PlaidLinkButton />

          {/* Placeholder for other connections */}
          <div className="block p-6 bg-teal-50 rounded-lg shadow-md cursor-not-allowed opacity-70">
            <div className="flex items-center text-teal-700 mb-3">
              <Link2 className="h-8 w-8 mr-3" />
              <h3 className="text-xl font-semibold">Connect Other Service</h3>
            </div>
            <p className="text-teal-600 text-sm">E.g., PayPal, Crypto Wallets. (Future Feature)</p>
          </div>
        </div>
      </section>

      {/* Accounts List Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Accounts</h2>
        {fetchError && (
          <div className="mb-6 p-4 text-red-700 bg-red-100 border border-red-300 rounded-md">
            <p className="font-semibold">Error loading accounts:</p>
            <p>{fetchError}</p>
          </div>
        )}
        {!fetchError && accounts.length === 0 && (
          <div className="text-center py-10 px-6 bg-white rounded-xl shadow-lg border border-gray-200">
            <Wallet className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Accounts Yet</h3>
            <p className="text-gray-500">
              Get started by adding a manual account or connecting a service above.
            </p>
          </div>
        )}
        {!fetchError && accounts.length > 0 && (
          <div className="space-y-4">
            {accounts.map(account => (
              <AccountItem key={account.id} account={account} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
