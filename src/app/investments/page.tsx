'use client';

import '@/lib/chart-setup';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiActivity,
  FiDollarSign,
  FiPieChart,
  FiPlus,
  FiTrendingDown,
  FiTrendingUp,
} from 'react-icons/fi';
import { usePlaidLink } from 'react-plaid-link';

import { AuthGuard } from '@/components/auth/AuthGuard';
import PlatformCard from '@/components/platforms/PlatformCard';
import PlatformForm from '@/components/platforms/PlatformForm';
import TransactionForm from '@/components/platforms/TransactionForm';
import { useSession } from '@/components/providers/SessionProvider';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import type {
  CreatePlatformInput,
  CreateTransactionInput,
  Platform,
  PlatformSummary,
  PlatformWithTransactions,
} from '@/types/platform';
import { formatCurrency } from '@/utils/format';

const Pie = dynamic(() => import('react-chartjs-2').then(mod => mod.Pie), {
  loading: () => <div className="h-64 animate-pulse bg-gray-200 rounded" />,
  ssr: false,
});

const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), {
  loading: () => <div className="h-64 animate-pulse bg-gray-200 rounded" />,
  ssr: false,
});

export default function InvestmentsPage() {
  const { firebaseUser } = useSession();
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
  const [activeTab, setActiveTab] = useState<string>('all');
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [showCryptoConnect, setShowCryptoConnect] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [cryptoAccounts, setCryptoAccounts] = useState<any[]>([]);

  useEffect(() => {
    fetchPlatforms();
    fetchCryptoAccounts();
    createLinkToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCryptoAccounts = async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/crypto/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCryptoAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Failed to fetch crypto accounts:', err);
    }
  };

  const createLinkToken = async () => {
    try {
      const response = await fetch('/api/plaid/create-link-token', { method: 'POST' });
      const data = await response.json();
      if (data.link_token) setLinkToken(data.link_token);
    } catch (err) {
      console.error('Failed to create link token:', err);
    }
  };

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: async public_token => {
      try {
        const response = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_token }),
        });
        if (response.ok) {
          await fetchPlatforms();
        }
      } catch {
        setError('Failed to connect account');
      }
    },
  });

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const isPositive = summary && summary.totalProfit >= 0;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Investment Platforms</h1>
            <p className="text-gray-600">
              Track your deposits, withdrawals, and profits across all investment platforms
            </p>
          </div>

          {error && (
            <Card variant="elevated" className="mb-6 border-red-200 bg-red-50">
              <CardContent>
                <p className="text-red-800">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Portfolio Summary */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card variant="elevated" hover>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Total Balance</span>
                    <FiDollarSign className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summary.totalBalance)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Net Investment:{' '}
                    {formatCurrency(summary.totalDeposited - summary.totalWithdrawn)}
                  </p>
                </CardContent>
              </Card>

              <Card variant="elevated" hover>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Total Profit/Loss</span>
                    {isPositive ? (
                      <FiTrendingUp className="w-5 h-5 text-green-500" />
                    ) : (
                      <FiTrendingDown className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <p
                    className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {isPositive ? '+' : ''}
                    {formatCurrency(summary.totalProfit)}
                  </p>
                  <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'} mt-1`}>
                    {isPositive ? '+' : ''}
                    {summary.totalProfitPercent.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>

              <Card variant="elevated" hover>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Platforms</span>
                    <FiPieChart className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{summary.platformCount}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {Object.keys(summary.byType).length} types
                  </p>
                </CardContent>
              </Card>

              <Card variant="elevated" hover>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Activity</span>
                    <FiActivity className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Deposited:</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(summary.totalDeposited)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Withdrawn:</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(summary.totalWithdrawn)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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

          <Card variant="elevated" className="bg-gradient-to-r from-blue-50 to-purple-50 mb-8">
            <CardHeader>
              <CardTitle>Connect Your Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => plaidReady && openPlaid()}
                  disabled={!plaidReady}
                  leftIcon={<FiDollarSign className="w-5 h-5" />}
                  className="w-full"
                >
                  Connect Broker
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowCryptoConnect(true)}
                  leftIcon={<FiTrendingUp className="w-5 h-5" />}
                  className="w-full"
                >
                  Connect Crypto
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    setEditingPlatform(undefined);
                    setShowPlatformForm(true);
                  }}
                  leftIcon={<FiPlus className="w-5 h-5" />}
                  className="w-full"
                >
                  Add Manually
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="all">All Platforms</TabsTrigger>
                <TabsTrigger value="crypto_exchange">Crypto</TabsTrigger>
                <TabsTrigger value="stock_broker">Stocks</TabsTrigger>
                <TabsTrigger value="real_estate">Real Estate</TabsTrigger>
                <TabsTrigger value="retirement">Retirement</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>
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

            {/* Crypto Connect Modal */}
            {showCryptoConnect && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                  {!selectedExchange ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Connect Crypto Exchange
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Choose your crypto exchange to connect:
                      </p>
                      <div className="space-y-3 mb-6">
                        <button
                          onClick={() => setSelectedExchange('coinbase')}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <span className="font-medium text-gray-900 dark:text-white">
                            Coinbase
                          </span>
                          <span className="text-sm text-gray-500">API Key Required</span>
                        </button>
                        <button
                          onClick={() => setSelectedExchange('binance')}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <span className="font-medium text-gray-900 dark:text-white">Binance</span>
                          <span className="text-sm text-gray-500">API Key Required</span>
                        </button>
                        <button
                          onClick={() => setSelectedExchange('kraken')}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <span className="font-medium text-gray-900 dark:text-white">Kraken</span>
                          <span className="text-sm text-gray-500">API Key Required</span>
                        </button>
                        <button
                          onClick={() => setSelectedExchange('wallet')}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <span className="font-medium text-gray-900 dark:text-white">
                            Manual Wallet
                          </span>
                          <span className="text-sm text-gray-500">Address-based</span>
                        </button>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowCryptoConnect(false)}
                          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {selectedExchange === 'wallet'
                          ? 'Add Wallet Address'
                          : `Connect ${selectedExchange.charAt(0).toUpperCase() + selectedExchange.slice(1)}`}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {selectedExchange === 'wallet'
                          ? 'Enter your wallet address to track your crypto holdings.'
                          : `Enter your API credentials from ${selectedExchange}. Make sure to enable read-only permissions.`}
                      </p>
                      <div className="space-y-4 mb-6">
                        {selectedExchange === 'wallet' ? (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Wallet Address
                              </label>
                              <input
                                type="text"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="0x... or bc1..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Blockchain
                              </label>
                              <select
                                value={apiSecret}
                                onChange={e => setApiSecret(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              >
                                <option value="">Select blockchain</option>
                                <option value="ethereum">Ethereum</option>
                                <option value="bitcoin">Bitcoin</option>
                                <option value="solana">Solana</option>
                                <option value="polygon">Polygon</option>
                              </select>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                API Key
                              </label>
                              <input
                                type="text"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="Enter your API key"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                API Secret
                              </label>
                              <input
                                type="password"
                                value={apiSecret}
                                onChange={e => setApiSecret(e.target.value)}
                                placeholder="Enter your API secret"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            setSelectedExchange(null);
                            setApiKey('');
                            setApiSecret('');
                          }}
                          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Back
                        </button>
                        <button
                          onClick={async () => {
                            if (!firebaseUser) {
                              toast.error('Please log in first');
                              return;
                            }
                            if (!apiKey || !apiSecret) {
                              toast.error('Please fill in all fields');
                              return;
                            }
                            try {
                              const token = await firebaseUser.getIdToken();
                              const response = await fetch('/api/crypto/connect', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                  exchange: selectedExchange,
                                  apiKey,
                                  apiSecret,
                                }),
                              });
                              const data = await response.json();
                              if (response.ok) {
                                toast.success('Connected successfully!');
                                await fetchPlatforms();
                                await fetchCryptoAccounts();
                                setShowCryptoConnect(false);
                                setSelectedExchange(null);
                                setApiKey('');
                                setApiSecret('');
                              } else {
                                toast.error(data.error || 'Failed to connect');
                              }
                            } catch (err) {
                              toast.error(
                                'Connection failed: ' +
                                  (err instanceof Error ? err.message : 'Unknown error')
                              );
                            }
                          }}
                          disabled={!apiKey || !apiSecret}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Connect
                        </button>
                      </div>
                    </>
                  )}
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
                    Are you sure you want to delete this platform and all its transactions? This
                    action cannot be undone.
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
            <TabsContent value="all">
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
            </TabsContent>

            {['crypto_exchange', 'stock_broker', 'real_estate', 'retirement', 'other'].map(type => (
              <TabsContent key={type} value={type}>
                {type === 'crypto_exchange' && cryptoAccounts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Connected Wallets & Exchanges
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {cryptoAccounts.map(account => (
                        <div
                          key={account.id}
                          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                {account.name ||
                                  (account.type === 'wallet'
                                    ? `${account.blockchain?.charAt(0).toUpperCase() + account.blockchain?.slice(1)} Wallet`
                                    : account.exchange?.charAt(0).toUpperCase() +
                                      account.exchange?.slice(1))}
                              </h4>
                              <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                {account.status || 'active'}
                              </span>
                            </div>
                            <button
                              onClick={async () => {
                                if (confirm('Delete this wallet?')) {
                                  try {
                                    const token = await firebaseUser?.getIdToken();
                                    const response = await fetch(
                                      `/api/crypto/accounts/${account.id}`,
                                      {
                                        method: 'DELETE',
                                        headers: { Authorization: `Bearer ${token}` },
                                      }
                                    );
                                    if (response.ok) {
                                      toast.success('Wallet deleted');
                                      await fetchCryptoAccounts();
                                    } else {
                                      toast.error('Failed to delete');
                                    }
                                  } catch {
                                    toast.error('Error deleting wallet');
                                  }
                                }
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Address:</span>
                              <span
                                className="text-gray-900 dark:text-white font-mono text-xs truncate ml-2 max-w-[180px]"
                                title={account.address}
                              >
                                {account.address
                                  ? `${account.address.slice(0, 8)}...${account.address.slice(-6)}`
                                  : 'API Connected'}
                              </span>
                            </div>
                            {account.blockchain && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">
                                  Blockchain:
                                </span>
                                <span className="text-gray-900 dark:text-white capitalize">
                                  {account.blockchain}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Balance:</span>
                              <button
                                onClick={async () => {
                                  toast.loading('Fetching balance...');
                                  try {
                                    const token = await firebaseUser?.getIdToken();
                                    const response = await fetch(
                                      `/api/crypto/balance/${account.id}`,
                                      {
                                        headers: { Authorization: `Bearer ${token}` },
                                      }
                                    );
                                    const data = await response.json();
                                    if (response.ok) {
                                      toast.success(
                                        `Balance: ${data.balance || '0'} ${data.symbol || ''}`
                                      );
                                    } else {
                                      toast.error('Failed to fetch balance');
                                    }
                                  } catch {
                                    toast.error('Error fetching balance');
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Check Balance →
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {summary?.platforms.filter(p => p.type === type).length === 0 &&
                cryptoAccounts.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                    <FiPieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No {type.replace('_', ' ')} platforms yet
                    </h3>
                    <button
                      onClick={() => setShowPlatformForm(true)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <FiPlus className="w-5 h-5" />
                      <span>Add Platform</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {summary?.platforms
                      .filter(p => p.type === type)
                      .map(platform => (
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
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  );
}
