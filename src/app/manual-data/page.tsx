'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useAuth } from '@/lib/auth';

interface AssetForm {
  name: string;
  amount: string;
  type: string;
  description: string;
}

interface LiabilityForm {
  name: string;
  amount: string;
  type: string;
}

interface TransactionForm {
  type: string;
  amount: string;
  category: string;
  date: string;
  recurrence: string;
  description: string;
  accountId: string;
}

interface LiquidAccount {
  id: string;
  name: string;
}

/**
 *
 */
export default function ManualDataPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'asset' | 'liability' | 'transaction'>('asset');
  const [loading, setLoading] = useState(false);
  const [liquidAccounts, setLiquidAccounts] = useState<LiquidAccount[]>([]);

  // Form states
  const [assetForm, setAssetForm] = useState<AssetForm>({
    name: '',
    amount: '',
    type: '',
    description: '',
  });

  const [liabilityForm, setLiabilityForm] = useState<LiabilityForm>({
    name: '',
    amount: '',
    type: 'loan',
  });

  const [transactionForm, setTransactionForm] = useState<TransactionForm>({
    type: 'expense',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    recurrence: 'none',
    description: '',
    accountId: '',
  });

  // Effect to fetch liquid accounts when transaction tab is active and user is available
  useEffect(() => {
    if (activeTab === 'transaction' && user) {
      const fetchLiquidAccounts = async () => {
        try {
          setLoading(true);
          const response = await fetch('/api/liquid-assets', {
            headers: {
              Authorization: `Bearer ${await user.getIdToken()}`,
            },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch liquid accounts');
          }
          const data = await response.json();
          setLiquidAccounts(data || []);
        } catch (error) {
          toast.error('Could not load your accounts. Please try again.');
          console.error('Failed to fetch liquid accounts:', error);
          setLiquidAccounts([]);
        } finally {
          setLoading(false);
        }
      };
      fetchLiquidAccounts();
    }
  }, [activeTab, user]);

  // Form handlers
  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to add assets');
      return;
    }
    if (!assetForm.type) {
      toast.error('Please select an asset type.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/manual-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          type: 'manualAssets',
          data: { ...assetForm, amount: parseFloat(assetForm.amount) },
        }),
      });

      if (!response.ok) throw new Error('Failed to add asset');

      toast.success('Asset added successfully');
      setAssetForm({ name: '', amount: '', type: '', description: '' });
      router.refresh();
    } catch (error) {
      toast.error('Failed to add asset. Check console for details.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLiabilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to add liabilities');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/manual-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          type: 'manualLiabilities',
          data: { ...liabilityForm, amount: parseFloat(liabilityForm.amount) },
        }),
      });

      if (!response.ok) throw new Error('Failed to add liability');

      toast.success('Liability added successfully');
      setLiabilityForm({ name: '', amount: '', type: 'loan' });
      router.refresh();
    } catch (error) {
      toast.error('Failed to add liability. Check console for details.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to add transactions');
      return;
    }
    if (!transactionForm.accountId) {
      toast.error('Please select an account for the transaction.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/manual-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          type: 'transactions',
          data: { ...transactionForm, amount: parseFloat(transactionForm.amount) },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add transaction');
      }

      toast.success('Transaction added successfully');
      setTransactionForm({
        type: 'expense',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        recurrence: 'none',
        description: '',
        accountId: '',
      });
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while adding transaction. Check console for details.'
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Add Financial Data</h1>

      {/* Tabs */}
      <div className="flex mb-8 border-b">
        <button
          className={`flex-1 py-3 text-base font-semibold ${
            activeTab === 'asset' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('asset')}
        >
          Add Asset
        </button>
        <button
          className={`flex-1 py-3 text-base font-semibold ${
            activeTab === 'liability' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('liability')}
        >
          Add Liability
        </button>
        <button
          className={`flex-1 py-3 text-base font-semibold ${
            activeTab === 'transaction'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('transaction')}
        >
          Add Transaction
        </button>
      </div>

      {/* Asset Form */}
      {activeTab === 'asset' && (
        <form onSubmit={handleAssetSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <label htmlFor="assetName" className="block text-sm font-medium text-gray-700">
              Asset Name
            </label>
            <input
              type="text"
              id="assetName"
              value={assetForm.name}
              onChange={e => setAssetForm({ ...assetForm, name: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="assetAmount" className="block text-sm font-medium text-gray-700">
              Value
            </label>
            <input
              type="number"
              id="assetAmount"
              value={assetForm.amount}
              onChange={e => setAssetForm({ ...assetForm, amount: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label htmlFor="assetType" className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              id="assetType"
              value={assetForm.type}
              onChange={e => setAssetForm({ ...assetForm, type: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="">Select Type</option>
              <option value="Cash">Cash</option>
              <option value="Wallet">Wallet</option>
              <option value="Checking Account">Checking Account</option>
              <option value="Savings Account">Savings Account</option>
              <option value="PayPal Balance">PayPal Balance</option>
              <option value="Digital Wallet Balance">Digital Wallet Balance</option>
              <option value="Bank Account">Bank Account</option>
              <option value="Investment">Investment</option>
              <option value="Cryptocurrency">Cryptocurrency</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="assetDescription" className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              id="assetDescription"
              value={assetForm.description}
              onChange={e => setAssetForm({ ...assetForm, description: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm disabled:opacity-50 transition duration-150 ease-in-out"
            disabled={loading}
          >
            {loading ? 'Adding Asset...' : 'Add Asset'}
          </button>
        </form>
      )}

      {/* Liability Form */}
      {activeTab === 'liability' && (
        <form onSubmit={handleLiabilitySubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <label htmlFor="liabilityName" className="block text-sm font-medium text-gray-700">
              Liability Name
            </label>
            <input
              type="text"
              id="liabilityName"
              value={liabilityForm.name}
              onChange={e => setLiabilityForm({ ...liabilityForm, name: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="liabilityAmount" className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <input
              type="number"
              id="liabilityAmount"
              value={liabilityForm.amount}
              onChange={e => setLiabilityForm({ ...liabilityForm, amount: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label htmlFor="liabilityType" className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              id="liabilityType"
              value={liabilityForm.type}
              onChange={e => setLiabilityForm({ ...liabilityForm, type: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="loan">Loan</option>
              <option value="credit card">Credit Card</option>
              <option value="mortgage">Mortgage</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm disabled:opacity-50 transition duration-150 ease-in-out"
            disabled={loading}
          >
            {loading ? 'Adding Liability...' : 'Add Liability'}
          </button>
        </form>
      )}

      {/* Transaction Form */}
      {activeTab === 'transaction' && (
        <form
          onSubmit={handleTransactionSubmit}
          className="space-y-6 bg-white p-6 rounded-lg shadow"
        >
          <div>
            <label htmlFor="transactionAccount" className="block text-sm font-medium text-gray-700">
              Account
            </label>
            <select
              id="transactionAccount"
              value={transactionForm.accountId}
              onChange={e => setTransactionForm({ ...transactionForm, accountId: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
              disabled={loading || liquidAccounts.length === 0}
            >
              <option value="">Select Account</option>
              {liquidAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            {liquidAccounts.length === 0 && !loading && (
              <p className="text-xs text-gray-500 mt-1">
                No cash accounts found. Please add a cash-like asset first (e.g., Checking Account,
                Savings Account, Cash, Wallet).
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="transactionType" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                id="transactionType"
                value={transactionForm.type}
                onChange={e => setTransactionForm({ ...transactionForm, type: e.target.value })}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="transactionAmount"
                className="block text-sm font-medium text-gray-700"
              >
                Amount
              </label>
              <input
                type="number"
                id="transactionAmount"
                value={transactionForm.amount}
                onChange={e => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="transactionCategory"
              className="block text-sm font-medium text-gray-700"
            >
              Category
            </label>
            <input
              type="text"
              id="transactionCategory"
              placeholder="E.g., Groceries, Salary, Utilities"
              value={transactionForm.category}
              onChange={e => setTransactionForm({ ...transactionForm, category: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                id="transactionDate"
                value={transactionForm.date}
                onChange={e => setTransactionForm({ ...transactionForm, date: e.target.value })}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label
                htmlFor="transactionRecurrence"
                className="block text-sm font-medium text-gray-700"
              >
                Recurrence
              </label>
              <select
                id="transactionRecurrence"
                value={transactionForm.recurrence}
                onChange={e =>
                  setTransactionForm({ ...transactionForm, recurrence: e.target.value })
                }
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="none">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="transactionDescription"
              className="block text-sm font-medium text-gray-700"
            >
              Description (Optional)
            </label>
            <textarea
              id="transactionDescription"
              value={transactionForm.description}
              onChange={e =>
                setTransactionForm({ ...transactionForm, description: e.target.value })
              }
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm disabled:opacity-50 transition duration-150 ease-in-out"
            disabled={loading || (activeTab === 'transaction' && liquidAccounts.length === 0)}
          >
            {loading ? 'Adding Transaction...' : 'Add Transaction'}
          </button>
        </form>
      )}
    </div>
  );
}
