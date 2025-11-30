import { ComprehensiveAccountsView } from '@/components/accounts/ComprehensiveAccountsView';

/**
 *
 */
export default function AccountsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Financial Overview</h1>
        <p className="mt-2 text-lg text-gray-600">
          Track all your financial accounts, investments, properties, and liabilities in one
          comprehensive view.
        </p>
      </div>

      <ComprehensiveAccountsView />
    </div>
  );
}
