'use client';

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  FiActivity,
  FiDollarSign,
  FiPieChart,
  FiPlus,
  FiTrendingDown,
  FiTrendingUp,
} from 'react-icons/fi';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import PlatformCard from '@/components/platforms/PlatformCard';
import PlatformForm from '@/components/platforms/PlatformForm';
import TransactionForm from '@/components/platforms/TransactionForm';
import type {
  CreatePlatformInput,
  CreateTransactionInput,
  Platform,
  PlatformSummary,
  PlatformWithTransactions,
} from '@/types/platform';
import { formatCurrency } from '@/utils/format';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function InvestmentsPage() {
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPlatformForm, setShowPlatformForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | undefined>(undefined);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('');
  const [selectedPlatformName, setSelectedPlatformName] = useState<string>('');
  const [selectedTransactionType, setSelectedTransactionType] = useState<
    'deposit' | 'withdrawal' | undefined
  >(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  // const [activeTab, setActiveTab] = useState<'overview' | 'platforms' | 'performance'>('overview');

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/platforms');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch platforms');
      }

      setSummary(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platforms');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlatform = async (data: CreatePlatformInput) => {
    try {
      const response = await fetch('/api/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add platform');
      }

      await fetchPlatforms();
      setShowPlatformForm(false);
      setEditingPlatform(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add platform');
    }
  };

  const handleUpdatePlatform = async (data: CreatePlatformInput) => {
    if (!editingPlatform) return;

    try {
      const response = await fetch('/api/platforms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: editingPlatform.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update platform');
      }

      await fetchPlatforms();
      setShowPlatformForm(false);
      setEditingPlatform(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update platform');
    }
  };

  const handleDeletePlatform = async (id: string) => {
    try {
      const response = await fetch(`/api/platforms?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete platform');
      }

      await fetchPlatforms();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete platform');
    }
  };

  const handleAddTransaction = async (data: CreateTransactionInput) => {
    try {
      const response = await fetch('/api/platform-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add transaction');
      }

      await fetchPlatforms();
      setShowTransactionForm(false);
      setSelectedPlatformId('');
      setSelectedPlatformName('');
      setSelectedTransactionType(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add transaction');
    }
  };

  const handleEdit = (platform: PlatformWithTransactions) => {
    setEditingPlatform(platform);
    setShowPlatformForm(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const handleAddDeposit = (platformId: string) => {
    const platform = summary?.platforms.find(p => p.id === platformId);
    if (platform) {
      setSelectedPlatformId(platformId);
      setSelectedPlatformName(platform.name);
      setSelectedTransactionType('deposit');
      setShowTransactionForm(true);
    }
  };

  const handleAddWithdrawal = (platformId: string) => {
    const platform = summary?.platforms.find(p => p.id === platformId);
    if (platform) {
      setSelectedPlatformId(platformId);
      setSelectedPlatformName(platform.name);
      setSelectedTransactionType('withdrawal');
      setShowTransactionForm(true);
    }
  };

  const getPieChartData = () => {
    if (!summary) return null;

    const labels = Object.keys(summary.byType);
    const data = labels.map(type => summary.byType[type as keyof typeof summary.byType].balance);

    return {
      labels: labels.map(type => {
        const typeLabels: Record<string, string> = {
          stock_broker: 'Stock Broker',
          crypto_exchange: 'Crypto Exchange',
          real_estate: 'Real Estate',
          bank_investment: 'Bank Investment',
          retirement: 'Retirement',
          crowdfunding: 'Crowdfunding',
          forex: 'Forex',
          other: 'Other',
        };
        return typeLabels[type] || type;
      }),
      datasets: [
        {
          data,
          backgroundColor: [
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#EF4444',
            '#8B5CF6',
            '#EC4899',
            '#14B8A6',
            '#F97316',
            '#6366F1',
            '#84CC16',
          ],
          borderWidth: 0,
        },
      ],
    };
  };

  const getBarChartData = () => {
    if (!summary) return null;

    const sortedPlatforms = [...summary.platforms]
      .sort((a, b) => b.netProfit - a.netProfit)
      .slice(0, 10);

    return {
      labels: sortedPlatforms.map(platform => platform.name),
      datasets: [
        {
          label: 'Net Profit/Loss',
          data: sortedPlatforms.map(platform => platform.netProfit),
          backgroundColor: sortedPlatforms.map(platform =>
            platform.netProfit >= 0 ? '#10B981' : '#EF4444'
          ),
        },
      ],
    };
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </AuthGuard>
    );
  }

  const isPositive = summary && summary.totalProfit >= 0;

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Investment Platforms
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your deposits, withdrawals, and profits across all investment platforms
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {/* Portfolio Summary */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Balance</span>
                <FiDollarSign className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.totalBalance)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Net Investment: {formatCurrency(summary.totalDeposited - summary.totalWithdrawn)}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Profit/Loss</span>
                {isPositive ? (
                  <FiTrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <FiTrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
              <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}
                {formatCurrency(summary.totalProfit)}
              </p>
              <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'} mt-1`}>
                {isPositive ? '+' : ''}
                {summary.totalProfitPercent.toFixed(2)}%
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Platforms</span>
                <FiPieChart className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.platformCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {Object.keys(summary.byType).length} types
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Activity</span>
                <FiActivity className="w-5 h-5 text-orange-500" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Deposited:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(summary.totalDeposited)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Withdrawn:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(summary.totalWithdrawn)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {summary && summary.platforms.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Platform Allocation
              </h2>
              <div className="h-64">
                {getPieChartData() && (
                  <Pie
                    data={getPieChartData()!}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 10,
                            usePointStyle: true,
                          },
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Platform Performance
              </h2>
              <div className="h-64">
                {getBarChartData() && (
                  <Bar
                    data={getBarChartData()!}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        x: {
                          display: false,
                        },
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Your Investment Platforms
          </h2>
          <button
            onClick={() => {
              setEditingPlatform(undefined);
              setShowPlatformForm(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            <span>Add Platform</span>
          </button>
        </div>

        {/* Platform Form Modal */}
        {showPlatformForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {editingPlatform ? 'Edit Platform' : 'Add New Platform'}
              </h2>
              <PlatformForm
                platform={editingPlatform}
                onSubmit={editingPlatform ? handleUpdatePlatform : handleAddPlatform}
                onCancel={() => {
                  setShowPlatformForm(false);
                  setEditingPlatform(undefined);
                }}
              />
            </div>
          </div>
        )}

        {/* Transaction Form Modal */}
        {showTransactionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <TransactionForm
                platformId={selectedPlatformId}
                platformName={selectedPlatformName}
                transactionType={selectedTransactionType}
                onSubmit={handleAddTransaction}
                onCancel={() => {
                  setShowTransactionForm(false);
                  setSelectedPlatformId('');
                  setSelectedPlatformName('');
                  setSelectedTransactionType(undefined);
                }}
              />
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Confirm Delete
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this platform and all its transactions? This action
                cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePlatform(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Platforms List */}
        {summary && summary.platforms.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <FiPieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No platforms yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start tracking your investments by adding your first platform.
            </p>
            <button
              onClick={() => setShowPlatformForm(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiPlus className="w-5 h-5" />
              <span>Add Your First Platform</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {summary?.platforms.map(platform => (
              <PlatformCard
                key={platform.id}
                platform={platform}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddDeposit={handleAddDeposit}
                onAddWithdrawal={handleAddWithdrawal}
              />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
