'use client';

import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  BarChart3,
  Building2,
  CreditCard,
  DollarSign,
  Home,
  PlusCircle,
  Trash2,
  Truck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { AddBankModal } from '@/components/banking/AddBankModal';
import { NoAccountsIllustration } from '@/components/illustrations/EmptyStateIllustrations';
import { PlaidLinkButton } from '@/components/plaid/PlaidLinkButton';
import { useSession } from '@/components/providers/SessionProvider';
import {
  Card,
  CardContent,
  CardHeader,
  CardSkeleton,
  CardTitle,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import logger from '@/lib/logger';

interface FinancialData {
  bankAccounts: any[];
  investmentAccounts: any[];
  cryptoAccounts: any[];
  liabilities: any[];
  manualAssets: any[];
  realEstate: any[];
  vehicles: any[];
  pensions: any[];
  totalNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  totalPlatformProfit?: number;
  netTrackedTransfers?: number;
  unifiedSummary?: any;
  lastUpdated: string;
}

export function ComprehensiveAccountsView() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [plaidItemsNeedingAuth, setPlaidItemsNeedingAuth] = useState<any[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const { firebaseUser } = useSession();

  const fetchFinancialData = useCallback(async () => {
    try {
      // Get auth token for authenticated requests
      const token = firebaseUser ? await firebaseUser.getIdToken() : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch comprehensive financial data from new consolidated endpoint
      const response = await fetch(
        '/api/financial-overview?includeTransactions=true&includePlatforms=true',
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch financial data');
      }

      const financialData = result.data;

      // Extract categorized accounts
      const bankAccounts = financialData.accounts.bank || [];
      const connectedInvestmentAccounts = financialData.accounts.investment || [];
      const creditAccounts = financialData.accounts.credit || [];
      const loanAccounts = financialData.accounts.loan || [];

      // Convert platforms to investment account format for consistency
      const platformInvestmentAccounts =
        financialData.platforms?.map((platform: any) => ({
          id: platform.id,
          name: platform.name,
          type: platform.type || 'platform',
          balance: platform.currentBalance || 0,
          source: 'manual',
          currency: platform.currency || 'USD',
          totalDeposited: platform.totalDeposited || 0,
          totalWithdrawn: platform.totalWithdrawn || 0,
          netProfit: platform.netProfit || 0,
          netProfitPercent: platform.netProfitPercent || 0,
          netInvestment: platform.netInvestment || 0,
          transactionCount: platform.transactions || 0,
          institutionName: platform.name,
        })) || [];

      // Combine all investment accounts
      const investmentAccounts = [...connectedInvestmentAccounts, ...platformInvestmentAccounts];

      // Use calculated summary from API
      const summary = financialData.summary;

      // Create structured data for the component
      const data: FinancialData = {
        bankAccounts,
        investmentAccounts,
        cryptoAccounts: [], // Not implemented yet
        liabilities: [...creditAccounts, ...loanAccounts, ...financialData.manualLiabilities],
        manualAssets: financialData.manualAssets || [],
        realEstate:
          financialData.manualAssets?.filter((asset: any) => asset.type === 'real_estate') || [],
        vehicles:
          financialData.manualAssets?.filter((asset: any) => asset.type === 'vehicle') || [],
        pensions:
          financialData.manualAssets?.filter((asset: any) => asset.type === 'pension') || [],
        totalNetWorth: summary.netWorth,
        totalAssets: summary.totalAssets,
        totalLiabilities: summary.totalLiabilities,
        totalPlatformProfit: platformInvestmentAccounts.reduce(
          (sum: number, acc: any) => sum + (acc.netProfit || 0),
          0
        ),
        netTrackedTransfers: 0, // Will be calculated by the new API
        unifiedSummary: {
          totalPlatformBalance: summary.investments,
          totalNetProfit: platformInvestmentAccounts.reduce(
            (sum: number, acc: any) => sum + (acc.netProfit || 0),
            0
          ),
          monthlyIncome: summary.monthlyIncome,
          monthlyExpenses: summary.monthlyExpenses,
          monthlyCashFlow: summary.monthlyCashFlow,
          liquidAssets: summary.liquidAssets,
          hasPlaidConnection: financialData.metadata?.hasPlaidConnection || false,
          hasPlatforms: financialData.metadata?.hasPlatforms || false,
        },
        lastUpdated: financialData.metadata?.lastUpdated || new Date().toISOString(),
      };

      setData(data);

      // Check for Plaid items needing re-authentication
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const plaidItemsResponse = await fetch('/api/plaid/items', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (plaidItemsResponse.ok) {
            const plaidItemsData = await plaidItemsResponse.json();
            const itemsNeedingAuth =
              plaidItemsData.items?.filter((item: any) => item.status === 'ITEM_LOGIN_REQUIRED') ||
              [];
            setPlaidItemsNeedingAuth(itemsNeedingAuth);
          }
        } catch (error) {
          logger.error('Error checking Plaid items status', {
            error: error instanceof Error ? error.message : String(error),
            component: 'ComprehensiveAccountsView',
            operation: 'checkPlaidItemsStatus',
          });
        }
      }
    } catch (error) {
      toast.error('Failed to load financial data');
      logger.error('Error fetching financial data', {
        error: error instanceof Error ? error.message : String(error),
        component: 'ComprehensiveAccountsView',
        operation: 'fetchFinancialData',
      });
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  // Handler to clear Israeli bank data
  const clearIsraeliBankData = useCallback(async () => {
    if (!confirm('This will delete all Israeli bank connections and transactions. You will need to reconnect your bank. Continue?')) {
      return;
    }

    setIsClearing(true);
    try {
      const response = await fetch('/api/banking/clear', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to clear data');
      }

      const result = await response.json();
      toast.success(`Cleared ${result.deleted.transactions} transactions, ${result.deleted.accounts} accounts`);

      // Refresh the data
      await fetchFinancialData();
    } catch (error) {
      logger.error('Error clearing Israeli bank data', {
        error: error instanceof Error ? error.message : String(error),
        component: 'ComprehensiveAccountsView',
        operation: 'clearIsraeliBankData',
      });
      toast.error('Failed to clear bank data');
    } finally {
      setIsClearing(false);
    }
  }, [fetchFinancialData]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    const currencyCode = currency?.toUpperCase() || 'USD';
    const locale = currencyCode === 'ILS' ? 'he-IL' : 'en-US';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  /**
   * Check if an account is stale (not synced in 24+ hours)
   * Implements P5.5 from financial-os-upgrade-comprehensive-plan.md
   */
  const isAccountStale = (account: any): boolean => {
    if (!account.lastSyncAt && !account.updatedAt) return false;

    const lastSync = account.lastSyncAt || account.updatedAt;
    const lastSyncDate = lastSync instanceof Date ? lastSync : new Date(lastSync);
    const hoursSinceSync = (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60);

    return hoursSinceSync >= 24;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card variant="elevated" className="max-w-md mx-auto mt-20">
        <CardContent className="py-8">
          <EmptyState
            icon={<AlertCircle className="w-8 h-8" />}
            title="No financial data available"
            description="Unable to load your financial information"
            action={{
              label: 'Retry',
              onClick: fetchFinancialData,
            }}
          />
        </CardContent>
      </Card>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'banks', name: `Banks (${data.bankAccounts.length})`, icon: Building2 },
    { id: 'crypto', name: `Crypto (${data.cryptoAccounts.length})`, icon: DollarSign },
    { id: 'liabilities', name: `Debts (${data.liabilities.length})`, icon: CreditCard },
    { id: 'other', name: 'Other Assets', icon: Banknote },
  ];

  return (
    <div className="space-y-6">
      {/* Plaid Re-authentication Banner */}
      {plaidItemsNeedingAuth.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-amber-800">Bank Connection Needs Update</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  {plaidItemsNeedingAuth.length === 1
                    ? 'One of your bank connections'
                    : `${plaidItemsNeedingAuth.length} of your bank connections`}{' '}
                  needs to be re-authenticated. This is common with test accounts in sandbox mode.
                </p>
                <div className="mt-3">
                  <PlaidLinkButton
                    mode="update"
                    itemId={plaidItemsNeedingAuth[0]?.id}
                    onSuccess={() => {
                      fetchFinancialData();
                      setPlaidItemsNeedingAuth([]);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Net Worth Summary */}
      <Card variant="elevated" className="glass-card-strong relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[500px] h-[500px] bg-purple-500/15 dark:bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <CardContent className="p-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Total Assets</p>
              <p className="text-3xl font-bold gradient-text">{formatCurrency(data.totalAssets)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Total Liabilities</p>
              <p className="text-3xl font-bold gradient-text">{formatCurrency(data.totalLiabilities)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Investment Profit</p>
              <p
                className={`text-3xl font-bold ${(data.totalPlatformProfit || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {(data.totalPlatformProfit || 0) >= 0 ? '+' : ''}
                {formatCurrency(Math.abs(data.totalPlatformProfit || 0))}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Net Worth</p>
              <p className="text-3xl font-bold gradient-text">{formatCurrency(data.totalNetWorth)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date(data.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Additional details */}
          {data.unifiedSummary && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-foreground font-medium">Tracked Transfers</p>
                  <p className="font-semibold text-lg mt-1 gradient-text">{formatCurrency(data.netTrackedTransfers || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Money moved between accounts</p>
                </div>
                <div>
                  <p className="text-foreground font-medium">Platform Deposits</p>
                  <p className="font-semibold text-lg mt-1 gradient-text">
                    {formatCurrency(
                      (data.unifiedSummary.totalTrackedDeposits || 0) +
                      (data.unifiedSummary.totalUntrackedDeposits || 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total money invested</p>
                </div>
                <div>
                  <p className="text-foreground font-medium">Platform Balance</p>
                  <p className="font-semibold text-lg mt-1 gradient-text">
                    {formatCurrency(data.unifiedSummary.totalPlatformBalance)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Current investment value</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card variant="flat" padding="none">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8 overflow-x-auto px-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Asset Distribution */}
              <Card variant="elevated" hover>
                <CardHeader>
                  <CardTitle className="text-lg">Asset Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Bank Accounts</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(
                          data.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0)
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Crypto</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(
                          data.cryptoAccounts.reduce(
                            (sum, acc) => sum + (acc.value || acc.balance || 0),
                            0
                          )
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Real Estate</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(
                          data.realEstate.reduce(
                            (sum, acc) => sum + (acc.value || acc.amount || 0),
                            0
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card variant="elevated" hover>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <PlaidLinkButton
                        onSuccess={fetchFinancialData}
                        className="w-full text-left px-3 py-2 rounded hover:bg-secondary/50 flex items-center gap-2 bg-transparent border-0 text-sm font-normal shadow-none"
                      />
                      <div className="w-full px-3 py-2">
                        <AddBankModal onSuccess={fetchFinancialData} />
                      </div>
                    </div>
                    <button
                      className="w-full text-left px-3 py-2 rounded hover:bg-secondary/50 flex items-center gap-2"
                      onClick={() => toast('Crypto integration coming soon!')}
                    >
                      <PlusCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm">Add Crypto Wallet</span>
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 rounded hover:bg-secondary/50 flex items-center gap-2"
                      onClick={() => toast('Manual investment import coming soon!')}
                    >
                      <PlusCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm">Import Investment Statement</span>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Account Summary */}
              <Card variant="elevated" hover>
                <CardHeader>
                  <CardTitle className="text-lg">Account Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Accounts</span>
                      <span className="font-medium">
                        {data.bankAccounts.length +
                          data.cryptoAccounts.length +
                          data.manualAssets.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Linked via Plaid</span>
                      <span className="font-medium">
                        {data.bankAccounts.filter(a => a.source === 'plaid').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Manual Entries</span>
                      <span className="font-medium">
                        {data.manualAssets.length + data.realEstate.length + data.vehicles.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'banks' && (
            <div className="space-y-4">
              {/* Bank management actions */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Connected Banks</h3>
                <div className="flex gap-2">
                  <AddBankModal onSuccess={fetchFinancialData} />
                  {data.bankAccounts.length > 0 && (
                    <button
                      onClick={clearIsraeliBankData}
                      disabled={isClearing}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      {isClearing ? 'Clearing...' : 'Clear & Reconnect'}
                    </button>
                  )}
                </div>
              </div>

              {data.bankAccounts.length === 0 ? (
                <EmptyState
                  variant="card"
                  illustration={<NoAccountsIllustration width={180} height={180} />}
                  title="No bank accounts connected"
                  description="Connect your bank accounts via Plaid or Israeli bank connector to track your finances"
                />
              ) : (
                data.bankAccounts.map(account => (
                  <div key={account.id} className="@container">
                    <Card variant="elevated" hover>
                      <CardContent>
                        <div className="flex flex-col @md:flex-row justify-between @md:items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-foreground">{account.name}</h4>
                              {isAccountStale(account) && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                  title="Account hasn't synced in 24+ hours"
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  Stale
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {account.institutionName} • {account.type}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {account.source === 'israel' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                  🇮🇱 Israeli Bank
                                </span>
                              )}
                              {(account.lastSyncAt || account.updatedAt) && (
                                <span className="text-xs text-muted-foreground">
                                  Last sync: {new Date(account.lastSyncAt || account.updatedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-left @md:text-right">
                            <p className="text-xl @lg:text-2xl font-bold text-foreground">{formatCurrency(account.balance, account.currency)}</p>
                            {account.availableBalance && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Available: {formatCurrency(account.availableBalance, account.currency)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'crypto' && (
            <div className="space-y-4">
              {data.cryptoAccounts.length === 0 ? (
                <EmptyState
                  icon={<DollarSign className="w-8 h-8" />}
                  title="No crypto accounts added"
                  description="Track your cryptocurrency holdings and portfolio performance"
                  action={{
                    label: 'Add Crypto Account',
                    onClick: () => toast('Crypto integration coming soon!'),
                  }}
                />
              ) : (
                data.cryptoAccounts.map(account => (
                  <Card key={account.id} variant="elevated" hover>
                    <CardContent>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-foreground">{account.name}</h4>
                          <p className="text-sm text-muted-foreground">{account.type}</p>
                          {account.description && (
                            <p className="text-sm text-muted-foreground mt-1">{account.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">{formatCurrency(account.value)}</p>
                          <p className="text-xs text-muted-foreground">
                            Updated: {new Date(account.lastUpdated).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'liabilities' && (
            <div className="space-y-4">
              {data.liabilities.length === 0 ? (
                <EmptyState
                  icon={<CreditCard className="w-8 h-8" />}
                  title="No liabilities tracked"
                  description="Track your debts, loans, and credit cards to manage your financial obligations"
                />
              ) : (
                data.liabilities.map(liability => (
                  <Card key={liability.id} variant="elevated" hover>
                    <CardContent>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-foreground">{liability.name}</h4>
                          <p className="text-sm text-muted-foreground capitalize">
                            {liability.type.replace(/_/g, ' ')}
                          </p>
                          {liability.interestRate && (
                            <p className="text-sm text-muted-foreground">
                              Interest Rate: {liability.interestRate}%
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-red-600 dark:text-red-400">
                            -{formatCurrency(liability.balance || liability.amount || 0)}
                          </p>
                          {liability.minimumPayment && (
                            <p className="text-sm text-muted-foreground">
                              Min Payment: {formatCurrency(liability.minimumPayment)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'other' && (
            <div className="space-y-6">
              {/* Real Estate */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Real Estate ({data.realEstate.length})
                </h3>
                {data.realEstate.length === 0 ? (
                  <p className="text-sm text-muted-foreground ml-7">No properties added</p>
                ) : (
                  <div className="space-y-2">
                    {data.realEstate.map(property => (
                      <div key={property.id} className="glass-card rounded-lg border border-border p-3 ml-7">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{property.name}</span>
                          <span className="text-sm font-bold">
                            {formatCurrency(property.value || property.amount || 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vehicles */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Vehicles ({data.vehicles.length})
                </h3>
                {data.vehicles.length === 0 ? (
                  <p className="text-sm text-muted-foreground ml-7">No vehicles added</p>
                ) : (
                  <div className="space-y-2">
                    {data.vehicles.map(vehicle => (
                      <div key={vehicle.id} className="glass-card rounded-lg border border-border p-3 ml-7">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{vehicle.name}</span>
                          <span className="text-sm font-bold">{formatCurrency(vehicle.value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pensions */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Pensions & Retirement ({data.pensions.length})
                </h3>
                {data.pensions.length === 0 ? (
                  <p className="text-sm text-muted-foreground ml-7">No pension accounts added</p>
                ) : (
                  <div className="space-y-2">
                    {data.pensions.map(pension => (
                      <div key={pension.id} className="glass-card rounded-lg border border-border p-3 ml-7">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{pension.name}</span>
                          <span className="text-sm font-bold">{formatCurrency(pension.value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Other Manual Assets */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">
                  Other Assets ({data.manualAssets.length})
                </h3>
                {data.manualAssets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No other assets added</p>
                ) : (
                  <div className="space-y-2">
                    {data.manualAssets.map(asset => (
                      <div key={asset.id} className="glass-card rounded-lg border border-border p-3">
                        <div className="flex justify-between">
                          <div>
                            <span className="text-sm font-medium">{asset.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">({asset.type})</span>
                          </div>
                          <span className="text-sm font-bold">{formatCurrency(asset.value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
