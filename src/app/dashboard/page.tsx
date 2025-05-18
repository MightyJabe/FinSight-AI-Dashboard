'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { sendEmailVerification, reload, onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PlaidLinkButton } from '@/components/PlaidLinkButton';

export default function DashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [liabilityForm, setLiabilityForm] = useState({ name: '', amount: '', type: 'loan' });
  const [liabilityLoading, setLiabilityLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthLoading(false);
      if (user) {
        fetchOverview(user);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line
  }, []);

  const fetchOverview = async (user: any) => {
    setLoading(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/accounts/overview", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fetch account overview");
      } else {
        setOverview(data);
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleLiabilityChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setLiabilityForm({ ...liabilityForm, [e.target.name]: e.target.value });
  };

  const handleAddLiability = async (e: React.FormEvent) => {
    e.preventDefault();
    setLiabilityLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('User not authenticated');
        setLiabilityLoading(false);
        return;
      }
      const idToken = await user.getIdToken();
      const res = await fetch('/api/manual-liabilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: liabilityForm.name,
          amount: parseFloat(liabilityForm.amount),
          type: liabilityForm.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add liability');
      } else {
        toast.success('Liability added!');
        setLiabilityForm({ name: '', amount: '', type: 'loan' });
        fetchOverview(user);
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLiabilityLoading(false);
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto py-8">
          <h1 className="text-2xl font-bold mb-4">Account Overview</h1>
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <div className="mb-6">
            <span className="text-lg font-semibold">Total Balance: </span>
            <span className="font-mono text-green-600">
              ${overview?.totalBalance?.toFixed(2) ?? '0.00'}
            </span>
          </div>
          <div className="mb-6">
            <span className="text-lg font-semibold">Total Liabilities: </span>
            <span className="font-mono text-red-600">
              ${overview?.totalLiabilities?.toFixed(2) ?? '0.00'}
            </span>
          </div>
          <div className="mb-6">
            <span className="text-lg font-semibold">Net Worth: </span>
            <span className="font-mono text-blue-600">
              ${overview?.netWorth?.toFixed(2) ?? '0.00'}
            </span>
          </div>
          <h2 className="text-lg font-semibold mb-2">Accounts</h2>
          {overview?.accounts?.length > 0 ? (
            <ul className="divide-y divide-gray-200 mb-6">
              {overview.accounts.map((acc: any, idx: number) => (
                <li key={acc.account_id || idx} className="py-2">
                  <div className="flex justify-between">
                    <span>{acc.name} <span className="text-xs text-gray-500">({acc.type})</span></span>
                    <span className="font-mono">${acc.balances?.current?.toFixed(2) ?? '0.00'}</span>
                  </div>
                  <div className="text-xs text-gray-500">{acc.official_name || acc.subtype}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500 mb-6">No accounts connected.</div>
          )}
          <h2 className="text-lg font-semibold mb-2">Liabilities</h2>
          <form onSubmit={handleAddLiability} className="mb-4 flex flex-col gap-2 bg-white p-4 rounded shadow">
            <div className="flex gap-2">
              <input
                type="text"
                name="name"
                placeholder="Liability Name"
                value={liabilityForm.name}
                onChange={handleLiabilityChange}
                className="flex-1 border rounded px-2 py-1"
                required
              />
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={liabilityForm.amount}
                onChange={handleLiabilityChange}
                className="w-32 border rounded px-2 py-1"
                required
                min="0"
                step="0.01"
              />
              <select
                name="type"
                value={liabilityForm.type}
                onChange={handleLiabilityChange}
                className="border rounded px-2 py-1"
              >
                <option value="loan">Loan</option>
                <option value="credit card">Credit Card</option>
                <option value="mortgage">Mortgage</option>
                <option value="other">Other</option>
              </select>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-1 rounded disabled:opacity-50"
                disabled={liabilityLoading}
              >
                {liabilityLoading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
          {overview?.liabilities?.length > 0 ? (
            <ul className="divide-y divide-gray-200 mb-6">
              {overview.liabilities.map((l: any, idx: number) => (
                <li key={l.id || idx} className="py-2">
                  <div className="flex justify-between">
                    <span>{l.name} <span className="text-xs text-gray-500">({l.type})</span></span>
                    <span className="font-mono text-red-600">${l.amount?.toFixed(2) ?? '0.00'}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500 mb-6">No manual liabilities added.</div>
          )}
          <h2 className="text-lg font-semibold mb-2">Transaction History</h2>
          {overview?.transactions?.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {overview.transactions.map((txn: any, idx: number) => (
                <li key={txn.transaction_id || idx} className="py-2">
                  <div className="flex justify-between">
                    <span>{txn.name}</span>
                    <span className="font-mono">${txn.amount.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-500">{txn.date}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500">No transactions yet.</div>
          )}
          {overview?.accounts?.length === 0 && (
            <div className="mt-8">
              <PlaidLinkButton onSuccess={() => window.location.reload()} />
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
