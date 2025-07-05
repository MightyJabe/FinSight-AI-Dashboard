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
    <div className="max-w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Accounts & Balances</h1>
        <p className="mt-2 text-lg text-gray-600">
          Connect your bank accounts and manage all your financial accounts in one place.
        </p>
      </div>

      {/* Connection Options */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Connect Your Accounts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Connect Bank Account Card (Plaid) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center text-indigo-700 mb-3">
              <Link2 className="h-8 w-8 mr-3" />
              <h3 className="text-xl font-semibold">Connect Bank Account</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Securely connect your bank accounts to automatically sync transactions and balances.
            </p>
            <PlaidLinkButton className="w-full justify-center" />
          </div>

          {/* Add Manual Account Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center text-sky-700 mb-3">
              <PlusCircle className="h-8 w-8 mr-3" />
              <h3 className="text-xl font-semibold">Add Manual Account</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Add cash, investments, or other assets that aren&apos;t connected to a bank.
            </p>
            <Link
              href="/manual-data"
              className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
            >
              Add Account
            </Link>
          </div>
        </div>
      </section>

      {/* Accounts List Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Your Accounts</h2>
          {accounts.length > 0 && (
            <div className="text-sm text-gray-500">
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected
            </div>
          )}
        </div>

        {fetchError && (
          <div className="mb-6 p-4 text-red-700 bg-red-100 border border-red-300 rounded-md">
            <p className="font-semibold">Error loading accounts:</p>
            <p>{fetchError}</p>
          </div>
        )}

        {!fetchError && accounts.length === 0 && (
          <div className="text-center py-12 px-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <Wallet className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Accounts Connected</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Connect your bank accounts or add manual accounts to start tracking your finances.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <PlaidLinkButton className="inline-flex justify-center" />
              <Link
                href="/manual-data"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                Add Manual Account
              </Link>
            </div>
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
