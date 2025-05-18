'use client';

import { useEffect, useState, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PlaidLinkButton } from '@/components/PlaidLinkButton';
import { OverviewCards } from '@/components/dashboard/OverviewCards';
import { AIInsights } from '@/components/dashboard/AIInsights';
import { ChartsSection } from '@/components/dashboard/ChartsSection';
import { AssetsSection } from '@/components/dashboard/AssetsSection';
import { LiabilitiesSection } from '@/components/dashboard/LiabilitiesSection';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { FabModal } from '@/components/dashboard/FabModal';
import { UndoToast } from '@/components/dashboard/UndoToast';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
} from 'chart.js';
import type { Transaction, ManualAsset, Liability } from '@/types/finance';
import { getPieChartData } from '@/utils/chartData';
import useSWR from 'swr';
import { useSession } from '@/components/providers/SessionProvider';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler
);

// Define a type for user with getIdToken
interface AuthUser {
  getIdToken: () => Promise<string>;
}

// Add deleteTransaction function
async function deleteTransaction(id: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/manual-transactions?id=${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error('Failed to delete transaction');
}

async function fetchOverview(user: unknown) {
  if (!user || typeof user !== 'object' || !('getIdToken' in user)) return null;
  const idToken = await (user as AuthUser).getIdToken();
  const res = await fetch('/api/accounts/overview', {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch overview');
  return res.json();
}

async function fetchInsights(user: unknown) {
  if (!user || typeof user !== 'object' || !('getIdToken' in user)) return null;
  const idToken = await (user as AuthUser).getIdToken();
  const res = await fetch('/api/insights', {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch insights');
  return res.json();
}

async function fetchManualTxns(user: unknown) {
  if (!user || typeof user !== 'object' || !('getIdToken' in user)) return null;
  const idToken = await (user as AuthUser).getIdToken();
  const res = await fetch('/api/manual-transactions', {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch manual transactions');
  return res.json();
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useSession();

  // SWR fetchers
  const {
    data: overview,
    error: overviewError,
    isLoading: overviewLoading,
    mutate: mutateOverview,
  } = useSWR(user ? ['overview', user.uid] : null, () => fetchOverview(user));

  const {
    data: insights,
    error: insightsError,
    isLoading: insightsLoading,
  } = useSWR(user ? ['insights', user.uid] : null, () => fetchInsights(user));

  const {
    error: manualTxnsError,
    isLoading: manualTxnsLoading,
    mutate: mutateManualTxns,
  } = useSWR(user ? ['manualTxns', user.uid] : null, () => fetchManualTxns(user));

  const [fabOpen, setFabOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'transaction' | 'asset' | 'liability'>('transaction');
  const [txnForm, setTxnForm] = useState({
    type: 'expense',
    amount: '',
    category: '',
    date: '',
    recurrence: 'none',
    description: '',
  });
  const [txnLoading, setTxnLoading] = useState(false);
  const [modalAssetForm, setModalAssetForm] = useState({
    name: '',
    amount: '',
    type: 'real_estate',
    description: '',
  });
  const [modalAssetLoading, setModalAssetLoading] = useState(false);
  const [modalLiabilityForm, setModalLiabilityForm] = useState({
    name: '',
    amount: '',
    type: 'loan',
  });
  const [modalLiabilityLoading, setModalLiabilityLoading] = useState(false);
  const [editTxnId, setEditTxnId] = useState<string | null>(null);
  const [editAssetId, setEditAssetId] = useState<string | null>(null);
  const [editLiabilityId, setEditLiabilityId] = useState<string | null>(null);
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastDeleted = useRef<{ type: 'txn' | 'asset' | 'liability'; data: unknown } | null>(null);

  // Move handleUndo inside the component
  const handleUndo = async () => {
    if (!lastDeleted.current) return;
    const user = auth.currentUser;
    if (!user) return;
    const idToken = await user.getIdToken();
    const { type, data } = lastDeleted.current;

    try {
      if (type === 'txn') {
        await fetch('/api/manual-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify(data),
        });
        await mutateManualTxns();
        await mutateOverview();
      } else if (type === 'asset') {
        await fetch('/api/manual-assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify(data),
        });
        await mutateOverview();
      } else if (type === 'liability') {
        await fetch('/api/manual-liabilities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify(data),
        });
        await mutateOverview();
      }
      lastDeleted.current = null;
      toast.success('Undo successful');
    } catch {
      toast.error('Failed to undo');
    }
  };

  const handleTxnChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setTxnForm({ ...txnForm, [e.target.name]: e.target.value });
  };

  // Fix handleEditTxn type issues
  const handleEditTxn = async (txn: Transaction) => {
    if (!txn.id) return;
    setEditTxnId(txn.id);
    setTxnForm({
      type: txn.type || 'expense',
      amount: txn.amount.toString(),
      category: Array.isArray(txn.category) ? txn.category[0] : txn.category || '',
      date: txn.date,
      recurrence: txn.recurrence || 'none',
      description: txn.description || '',
    });
    setModalTab('transaction');
    setFabOpen(true);
  };

  // Fix handleDeleteTxn type issues
  const handleDeleteTxn = async (txn: Transaction) => {
    if (!txn.id) return;
    try {
      await deleteTransaction(txn.id);
      lastDeleted.current = { type: 'txn', data: txn };
      if (undoTimeout.current) {
        clearTimeout(undoTimeout.current);
      }
      undoTimeout.current = setTimeout(() => {
        lastDeleted.current = null;
      }, 5000);
      toast.success('Transaction deleted');
      mutateManualTxns();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  const handleAddTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxnLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        return;
      }
      const idToken = await user.getIdToken();
      const url = editTxnId
        ? `/api/manual-transactions?id=${editTxnId}`
        : '/api/manual-transactions';
      const method = editTxnId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...txnForm,
          amount: parseFloat(txnForm.amount),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save transaction');
      } else {
        toast.success(editTxnId ? 'Transaction updated!' : 'Transaction added!');
        setTxnForm({
          type: 'expense',
          amount: '',
          category: '',
          date: '',
          recurrence: 'none',
          description: '',
        });
        setFabOpen(false);
        setEditTxnId(null);
        await mutateOverview();
        await mutateManualTxns();
      }
    } finally {
      setTxnLoading(false);
    }
  };

  const handleModalAssetChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setModalAssetForm({ ...modalAssetForm, [e.target.name]: e.target.value });
  };

  const handleModalLiabilityChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setModalLiabilityForm({ ...modalLiabilityForm, [e.target.name]: e.target.value });
  };

  const handleEditAsset = (asset: ManualAsset) => {
    setModalTab('asset');
    setModalAssetForm({
      name: asset.name,
      amount: String(asset.amount),
      type: asset.type,
      description: asset.description || '',
    });
    setEditAssetId(asset.id);
    setFabOpen(true);
  };

  const handleDeleteAsset = async (_assetId: string) => {
    const asset = overview?.manualAssets?.find((a: ManualAsset) => a.id === _assetId);
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      const user = auth.currentUser;
      if (!user) return;
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/manual-assets?id=${_assetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        lastDeleted.current = { type: 'asset', data: { ...asset, id: undefined } };
        toast.custom(_t => <UndoToast message="Asset deleted" onUndo={handleUndo} />, {
          duration: 5000,
        });
        await mutateOverview();
        if (undoTimeout.current) clearTimeout(undoTimeout.current);
        undoTimeout.current = setTimeout(() => {
          lastDeleted.current = null;
        }, 5000);
      } else {
        toast.error('Failed to delete asset');
      }
    } catch {
      toast.error('Error deleting asset');
    }
  };

  const handleEditLiability = (liability: Liability) => {
    setModalTab('liability');
    setModalLiabilityForm({
      name: liability.name,
      amount: String(liability.amount),
      type: liability.type,
    });
    setEditLiabilityId(liability.id);
    setFabOpen(true);
  };

  const handleDeleteLiability = async (liabilityId: string) => {
    const liability = overview?.liabilities?.find((l: Liability) => l.id === liabilityId);
    if (!window.confirm('Are you sure you want to delete this liability?')) return;
    try {
      const user = auth.currentUser;
      if (!user) return;
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/manual-liabilities?id=${liabilityId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        lastDeleted.current = { type: 'liability', data: { ...liability, id: undefined } };
        toast.custom(_t => <UndoToast message="Liability deleted" onUndo={handleUndo} />, {
          duration: 5000,
        });
        await mutateOverview();
        if (undoTimeout.current) clearTimeout(undoTimeout.current);
        undoTimeout.current = setTimeout(() => {
          lastDeleted.current = null;
        }, 5000);
      } else {
        toast.error('Failed to delete liability');
      }
    } catch {
      toast.error('Error deleting liability');
    }
  };

  const handleAddModalAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalAssetLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        return;
      }
      const idToken = await user.getIdToken();
      const url = editAssetId ? `/api/manual-assets?id=${editAssetId}` : '/api/manual-assets';
      const method = editAssetId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: modalAssetForm.name,
          amount: parseFloat(modalAssetForm.amount),
          type: modalAssetForm.type,
          description: modalAssetForm.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save asset');
      } else {
        toast.success(editAssetId ? 'Asset updated!' : 'Asset added!');
        setModalAssetForm({ name: '', amount: '', type: 'real_estate', description: '' });
        setFabOpen(false);
        setEditAssetId(null);
        await mutateOverview();
      }
    } finally {
      setModalAssetLoading(false);
    }
  };

  const handleAddModalLiability = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLiabilityLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        return;
      }
      const idToken = await user.getIdToken();
      const url = editLiabilityId
        ? `/api/manual-liabilities?id=${editLiabilityId}`
        : '/api/manual-liabilities';
      const method = editLiabilityId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: modalLiabilityForm.name,
          amount: parseFloat(modalLiabilityForm.amount),
          type: modalLiabilityForm.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save liability');
      } else {
        toast.success(editLiabilityId ? 'Liability updated!' : 'Liability added!');
        setModalLiabilityForm({ name: '', amount: '', type: 'loan' });
        setFabOpen(false);
        setEditLiabilityId(null);
        await mutateOverview();
      }
    } finally {
      setModalLiabilityLoading(false);
    }
  };

  useEffect(() => {
    if (!fabOpen) {
      setEditTxnId(null);
      setEditAssetId(null);
      setEditLiabilityId(null);
    }
  }, [fabOpen]);

  // Asset allocation for pie chart
  const assetPieData = getPieChartData(
    [
      { type: 'Bank', amount: overview?.totalAssets ?? 0 },
      ...(overview?.manualAssets?.length ? overview.manualAssets : []),
    ],
    'type',
    'amount',
    ['#2563eb', '#22c55e', '#f59e42', '#a855f7', '#f43f5e', '#eab308', '#14b8a6', '#64748b']
  );

  // Liability allocation for pie chart
  const liabilityPieData = getPieChartData(overview?.liabilities || [], 'type', 'amount', [
    '#f43f5e',
    '#f59e42',
    '#2563eb',
    '#a855f7',
    '#eab308',
    '#14b8a6',
    '#64748b',
  ]);

  // Map netWorthHistory to the expected format for ChartsSection
  const netWorthHistory = (overview?.netWorthHistory || []).map(
    (item: { date: string; value: number }) => ({
      month: item.date,
      netWorth: item.value,
    })
  );

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 relative">
        <FabModal
          isOpen={fabOpen}
          onClose={() => setFabOpen(false)}
          modalTab={modalTab}
          onTabChange={setModalTab}
          txnForm={txnForm}
          onTxnFormChange={handleTxnChange}
          onTxnSubmit={handleAddTxn}
          txnLoading={txnLoading}
          modalAssetForm={modalAssetForm}
          onModalAssetFormChange={handleModalAssetChange}
          onModalAssetSubmit={handleAddModalAsset}
          modalAssetLoading={modalAssetLoading}
          modalLiabilityForm={modalLiabilityForm}
          onModalLiabilityFormChange={handleModalLiabilityChange}
          onModalLiabilitySubmit={handleAddModalLiability}
          modalLiabilityLoading={modalLiabilityLoading}
        />

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Financial Dashboard</h1>

          {(overviewLoading || insightsLoading || manualTxnsLoading) && (
            <LoadingSpinner message="Loading dashboard..." className="mb-4" />
          )}
          {overviewError && <ErrorMessage message={String(overviewError)} />}
          {insightsError && <ErrorMessage message={String(insightsError)} />}
          {manualTxnsError && <ErrorMessage message={String(manualTxnsError)} />}

          <OverviewCards overview={overview} />

          <AIInsights insights={insights} insightsLoading={insightsLoading} />

          <ChartsSection
            netWorthHistory={netWorthHistory}
            assetPieData={assetPieData}
            liabilityPieData={liabilityPieData}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <AssetsSection
              accounts={overview?.accounts || []}
              manualAssets={overview?.manualAssets || []}
              onEditAsset={handleEditAsset}
              onDeleteAsset={handleDeleteAsset}
            />

            <LiabilitiesSection
              liabilities={overview?.liabilities || []}
              onEditLiability={handleEditLiability}
              onDeleteLiability={handleDeleteLiability}
            />
          </div>

          <RecentTransactions
            onEditTransaction={handleEditTxn}
            onDeleteTransaction={handleDeleteTxn}
          />

          {/* Connect Account Button */}
          {overview?.accounts?.length === 0 && (
            <div className="text-center">
              <p className="text-gray-500 mb-4">Connect your financial accounts to get started</p>
              <PlaidLinkButton onSuccess={() => window.location.reload()} />
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
