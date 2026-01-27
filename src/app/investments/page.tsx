'use client';

import {
  Activity,
  DollarSign,
  PieChart,
  Plus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { usePlaidLink } from 'react-plaid-link';

import { AuthGuard } from '@/components/auth/AuthGuard';
import PlatformCard from '@/components/platforms/PlatformCard';
import PlatformForm from '@/components/platforms/PlatformForm';
import TransactionForm from '@/components/platforms/TransactionForm';
import { useSession } from '@/components/providers/SessionProvider';
import { Button } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';
import type {
  CreatePlatformInput,
  CreateTransactionInput,
  Platform,
  PlatformSummary,
  PlatformWithTransactions,
} from '@/types/platform';
import { formatCurrency } from '@/utils/format';

const PieChart2 = dynamic(() => import('react-chartjs-2').then(mod => mod.Pie), {
  loading: () => <div className="h-64 animate-pulse bg-secondary rounded-xl" />,
  ssr: false,
});

const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), {
  loading: () => <div className="h-64 animate-pulse bg-secondary rounded-xl" />,
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
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    import('chart.js/auto')
      .then(() => mounted && setChartsReady(true))
      .catch(() => mounted && setChartsReady(false));

    fetchPlatforms();
    fetchCryptoAccounts();
    createLinkToken();
    return () => {
      mounted = false;
    };
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
            '#3B82F6', // Blue-500
            '#8B5CF6', // Purple-500
            '#EC4899', // Pink-500
            '#6366F1', // Indigo-500
            '#A78BFA', // Violet-400
            '#F472B6', // Pink-400
            '#60A5FA', // Blue-400
            '#C084FC', // Purple-400
            '#818CF8', // Indigo-400
            '#93C5FD', // Blue-300
          ],
          borderWidth: 0,
          hoverOffset: 8,
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
            platform.netProfit >= 0
              ? 'rgba(59, 130, 246, 0.8)' // Blue-500 for gains
              : 'rgba(236, 72, 153, 0.8)'  // Pink-500 for losses
          ),
          borderRadius: 8,
          hoverBackgroundColor: sortedPlatforms.map(platform =>
            platform.netProfit >= 0
              ? 'rgba(96, 165, 250, 1)' // Blue-400 hover
              : 'rgba(244, 114, 182, 1)' // Pink-400 hover
          ),
        },
      ],
    };
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen">
          <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const isPositive = summary && summary.totalProfit >= 0;

  return (
    <AuthGuard>
      <div className="min-h-screen">
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
          {/* Header */}
          <header className="mb-10 animate-in">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-semibold uppercase tracking-[0.2em] mb-2">Wealth Management</p>
                <h1 className="text-4xl lg:text-5xl font-display tracking-tight gradient-text mb-3">
                  Investment Platforms
                </h1>
                <p className="text-muted-foreground text-base">
                  Track your deposits, withdrawals, and profits across all investment platforms
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingPlatform(undefined);
                  setShowPlatformForm(true);
                }}
                variant="gradient"
                size="lg"
                leftIcon={<Plus className="w-5 h-5" />}
              >
                <span className="hidden sm:inline">Add Platform</span>
              </Button>
            </div>
          </header>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 animate-in">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {/* Portfolio Summary Hero */}
          {summary && (
            <section className="mb-8 animate-in delay-75">
              <div className="relative overflow-hidden rounded-[2rem] glass-card-strong p-8 lg:p-10">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className={cn(
                    "absolute -top-1/2 -right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-1000",
                    isPositive ? 'bg-blue-500/20' : 'bg-rose-500/15'
                  )} />
                  <div className="absolute -bottom-1/2 -left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem]" />
                </div>

                <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center backdrop-blur-sm">
                      <DollarSign className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.15em] font-semibold mb-1">Total Balance</p>
                      <p className="text-2xl lg:text-3xl font-bold gradient-text tabular-nums">
                        {formatCurrency(summary.totalBalance)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-sm border',
                      isPositive
                        ? 'bg-blue-500/20 border-blue-400/30'
                        : 'bg-rose-500/20 border-rose-400/30'
                    )}>
                      {isPositive ? (
                        <TrendingUp className="w-7 h-7 text-blue-400" />
                      ) : (
                        <TrendingDown className="w-7 h-7 text-rose-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.15em] font-semibold mb-1">Profit/Loss</p>
                      <p className={cn(
                        'text-2xl lg:text-3xl font-bold tabular-nums',
                        isPositive ? 'text-blue-400' : 'text-rose-400'
                      )}>
                        {isPositive ? '+' : ''}{formatCurrency(summary.totalProfit)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 flex items-center justify-center backdrop-blur-sm">
                      <PieChart className="w-7 h-7 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.15em] font-semibold mb-1">Platforms</p>
                      <p className="text-2xl lg:text-3xl font-bold gradient-text tabular-nums">{summary.platformCount}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-amber-500/20 border border-pink-500/30 flex items-center justify-center backdrop-blur-sm">
                      <Activity className="w-7 h-7 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.15em] font-semibold mb-1">Net Invested</p>
                      <p className="text-2xl lg:text-3xl font-bold gradient-text tabular-nums">
                        {formatCurrency(summary.totalDeposited - summary.totalWithdrawn)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Charts */}
          {summary && summary.platforms.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-in delay-150">
              <div className="rounded-2xl glass-card-strong p-6">
                <h2 className="text-lg font-bold gradient-text mb-6">
                  Platform Allocation
                </h2>
                <div className="h-64">
                  {chartsReady && getPieChartData() ? (
                    <PieChart2
                      data={getPieChartData()!}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              padding: 12,
                              usePointStyle: true,
                              font: {
                                size: 12,
                                weight: '500',
                              },
                            },
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="h-full w-full rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 animate-pulse" />
                  )}
                </div>
              </div>

              <div className="rounded-2xl glass-card-strong p-6">
                <h2 className="text-lg font-bold gradient-text mb-6">
                  Platform Performance
                </h2>
                <div className="h-64">
                  {chartsReady && getBarChartData() ? (
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
                            grid: {
                              color: 'rgba(255, 255, 255, 0.05)',
                            },
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="h-full w-full rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl glass-card-strong p-6 mb-8 animate-in delay-200">
            <h3 className="text-lg font-bold gradient-text mb-6">Connect Your Accounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="glass"
                size="lg"
                onClick={() => plaidReady && openPlaid()}
                disabled={!plaidReady}
                leftIcon={<DollarSign className="w-5 h-5" />}
                className="w-full"
              >
                Connect Broker
              </Button>
              <Button
                variant="glass"
                size="lg"
                onClick={() => setShowCryptoConnect(true)}
                leftIcon={<TrendingUp className="w-5 h-5" />}
                className="w-full"
              >
                Connect Crypto
              </Button>
              <Button
                variant="gradient"
                size="lg"
                onClick={() => {
                  setEditingPlatform(undefined);
                  setShowPlatformForm(true);
                }}
                leftIcon={<Plus className="w-5 h-5" />}
                className="w-full"
              >
                Add Manually
              </Button>
            </div>
          </div>

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
              <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
                <div className="glass-card-strong rounded-[2rem] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in">
                  <h2 className="text-2xl font-bold gradient-text mb-6">
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
              <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
                <div className="glass-card-strong rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in">
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
              <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
                <div className="glass-card-strong rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in">
                  {!selectedExchange ? (
                    <>
                      <h3 className="text-xl font-bold gradient-text mb-3">
                        Connect Crypto Exchange
                      </h3>
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        Choose your crypto exchange to connect:
                      </p>
                      <div className="space-y-3 mb-6">
                        <button
                          onClick={() => setSelectedExchange('coinbase')}
                          className="w-full flex items-center justify-between px-5 py-4 glass-card rounded-xl hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <span className="font-bold text-foreground">
                            Coinbase
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">API Key Required</span>
                        </button>
                        <button
                          onClick={() => setSelectedExchange('binance')}
                          className="w-full flex items-center justify-between px-5 py-4 glass-card rounded-xl hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <span className="font-bold text-foreground">Binance</span>
                          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">API Key Required</span>
                        </button>
                        <button
                          onClick={() => setSelectedExchange('kraken')}
                          className="w-full flex items-center justify-between px-5 py-4 glass-card rounded-xl hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <span className="font-bold text-foreground">Kraken</span>
                          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">API Key Required</span>
                        </button>
                        <button
                          onClick={() => setSelectedExchange('wallet')}
                          className="w-full flex items-center justify-between px-5 py-4 glass-card rounded-xl hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <span className="font-bold text-foreground">
                            Manual Wallet
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Address-based</span>
                        </button>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={() => setShowCryptoConnect(false)}
                          variant="glass"
                          size="lg"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-bold gradient-text mb-3">
                        {selectedExchange === 'wallet'
                          ? 'Add Wallet Address'
                          : `Connect ${selectedExchange.charAt(0).toUpperCase() + selectedExchange.slice(1)}`}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                        {selectedExchange === 'wallet'
                          ? 'Enter your wallet address to track your crypto holdings.'
                          : `Enter your API credentials from ${selectedExchange}. Make sure to enable read-only permissions.`}
                      </p>
                      <div className="space-y-4 mb-6">
                        {selectedExchange === 'wallet' ? (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Wallet Address
                              </label>
                              <input
                                type="text"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="0x... or bc1..."
                                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Blockchain
                              </label>
                              <select
                                value={apiSecret}
                                onChange={e => setApiSecret(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                              <label className="block text-sm font-medium text-foreground mb-2">
                                API Key
                              </label>
                              <input
                                type="text"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="Enter your API key"
                                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                API Secret
                              </label>
                              <input
                                type="password"
                                value={apiSecret}
                                onChange={e => setApiSecret(e.target.value)}
                                placeholder="Enter your API secret"
                                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                              />
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button
                          onClick={() => {
                            setSelectedExchange(null);
                            setApiKey('');
                            setApiSecret('');
                          }}
                          variant="glass"
                          size="lg"
                        >
                          Back
                        </Button>
                        <Button
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
                          variant="gradient"
                          size="lg"
                        >
                          Connect
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
                <div className="glass-card-strong rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in">
                  <h3 className="text-xl font-bold gradient-text mb-4">
                    Confirm Delete
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Are you sure you want to delete this platform and all its transactions? This
                    action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <Button
                      onClick={() => setDeleteConfirm(null)}
                      variant="glass"
                      size="lg"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleDeletePlatform(deleteConfirm)}
                      variant="destructive"
                      size="lg"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Platforms List */}
            <TabsContent value="all">
              {summary && summary.platforms.length === 0 ? (
                <div className="rounded-[2rem] glass-card-strong p-16 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 backdrop-blur-sm mb-6">
                    <PieChart className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold gradient-text mb-3">
                    No platforms yet
                  </h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto text-base leading-relaxed">
                    Start tracking your investments by adding your first platform.
                  </p>
                  <Button
                    onClick={() => setShowPlatformForm(true)}
                    variant="gradient"
                    size="lg"
                    leftIcon={<Plus className="w-5 h-5" />}
                  >
                    Add Your First Platform
                  </Button>
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
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Connected Wallets & Exchanges
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {cryptoAccounts.map(account => (
                        <div
                          key={account.id}
                          className="rounded-2xl bg-card border border-border p-6 hover:border-border/80 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-base font-semibold text-foreground mb-1">
                                {account.name ||
                                  (account.type === 'wallet'
                                    ? `${account.blockchain?.charAt(0).toUpperCase() + account.blockchain?.slice(1)} Wallet`
                                    : account.exchange?.charAt(0).toUpperCase() +
                                      account.exchange?.slice(1))}
                              </h4>
                              <span className="inline-block px-2 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
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
                              className="text-rose-500 hover:text-rose-600 p-1 transition-colors"
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
                              <span className="text-muted-foreground">Address:</span>
                              <span
                                className="text-foreground font-mono text-xs truncate ml-2 max-w-[180px]"
                                title={account.address}
                              >
                                {account.address
                                  ? `${account.address.slice(0, 8)}...${account.address.slice(-6)}`
                                  : 'API Connected'}
                              </span>
                            </div>
                            {account.blockchain && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Blockchain:
                                </span>
                                <span className="text-foreground capitalize">
                                  {account.blockchain}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Balance:</span>
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
                                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium transition-colors"
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
                  <div className="rounded-[2rem] glass-card-strong p-16 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 backdrop-blur-sm mb-6">
                      <PieChart className="w-10 h-10 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold gradient-text mb-3">
                      No {type.replace('_', ' ')} platforms yet
                    </h3>
                    <Button
                      onClick={() => setShowPlatformForm(true)}
                      variant="gradient"
                      size="lg"
                      leftIcon={<Plus className="w-5 h-5" />}
                    >
                      Add Platform
                    </Button>
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
