'use client';

import {
  Banknote,
  BarChart3,
  Building2,
  CreditCard,
  DollarSign,
  Home,
  PlusCircle,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { PlaidLinkButton } from '@/components/plaid/PlaidLinkButton';
import { useSession } from '@/components/providers/SessionProvider';
import { SaltEdgeConnectButton } from '@/components/saltedge/SaltEdgeConnectButton';

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
    } catch (error) {
      toast.error('Failed to load financial data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No financial data available</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'banks', name: `Banks (${data.bankAccounts.length})`, icon: Building2 },
    {
      id: 'investments',
      name: `Investments (${data.investmentAccounts.length})`,
      icon: TrendingUp,
    },
    { id: 'crypto', name: `Crypto (${data.cryptoAccounts.length})`, icon: DollarSign },
    { id: 'liabilities', name: `Debts (${data.liabilities.length})`, icon: CreditCard },
    { id: 'property', name: `Property (${data.realEstate.length})`, icon: Home },
    { id: 'other', name: 'Other Assets', icon: Banknote },
  ];

  return (
    <div className="space-y-6">
      {/* Net Worth Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Assets</p>
            <p className="text-3xl font-bold">{formatCurrency(data.totalAssets)}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Liabilities</p>
            <p className="text-3xl font-bold">{formatCurrency(data.totalLiabilities)}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm font-medium">Investment Profit</p>
            <p
              className={`text-3xl font-bold ${(data.totalPlatformProfit || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}
            >
              {(data.totalPlatformProfit || 0) >= 0 ? '+' : ''}
              {formatCurrency(data.totalPlatformProfit || 0)}
            </p>
          </div>
          <div>
            <p className="text-blue-100 text-sm font-medium">Net Worth</p>
            <p className="text-3xl font-bold">{formatCurrency(data.totalNetWorth)}</p>
            <p className="text-xs text-blue-200 mt-1">
              Last updated: {new Date(data.lastUpdated).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Additional details */}
        {data.unifiedSummary && (
          <div className="mt-4 pt-4 border-t border-blue-400/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-blue-200">Tracked Transfers</p>
                <p className="font-medium">{formatCurrency(data.netTrackedTransfers || 0)}</p>
                <p className="text-xs text-blue-300">Money moved between accounts</p>
              </div>
              <div>
                <p className="text-blue-200">Platform Deposits</p>
                <p className="font-medium">
                  {formatCurrency(
                    data.unifiedSummary.totalTrackedDeposits +
                      data.unifiedSummary.totalUntrackedDeposits
                  )}
                </p>
                <p className="text-xs text-blue-300">Total money invested</p>
              </div>
              <div>
                <p className="text-blue-200">Platform Balance</p>
                <p className="font-medium">
                  {formatCurrency(data.unifiedSummary.totalPlatformBalance)}
                </p>
                <p className="text-xs text-blue-300">Current investment value</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Asset Distribution */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Asset Distribution</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bank Accounts</span>
                  <span className="font-medium">
                    {formatCurrency(data.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Investments</span>
                  <span className="font-medium">
                    {formatCurrency(
                      data.investmentAccounts.reduce((sum, acc) => sum + acc.balance, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Crypto</span>
                  <span className="font-medium">
                    {formatCurrency(data.cryptoAccounts.reduce((sum, acc) => sum + acc.value, 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Real Estate</span>
                  <span className="font-medium">
                    {formatCurrency(data.realEstate.reduce((sum, acc) => sum + acc.value, 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <div className="space-y-1">
                  <PlaidLinkButton
                    onSuccess={fetchFinancialData}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 flex items-center gap-2 bg-transparent border-0 text-sm font-normal shadow-none"
                  />
                  <div className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 flex items-center gap-2">
                    <SaltEdgeConnectButton
                      onSuccess={fetchFinancialData}
                      className="w-full text-left px-0 py-0 bg-transparent border-0 text-sm font-normal shadow-none text-gray-900 hover:text-gray-900"
                    >
                      <PlusCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm">Connect Israeli Bank</span>
                    </SaltEdgeConnectButton>
                  </div>
                </div>
                <button
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => toast('Crypto integration coming soon!')}
                >
                  <PlusCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Add Crypto Wallet</span>
                </button>
                <button
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => toast('Manual investment import coming soon!')}
                >
                  <PlusCircle className="h-5 w-5 text-purple-600" />
                  <span className="text-sm">Import Investment Statement</span>
                </button>
              </div>
            </div>

            {/* Account Summary */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Account Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Accounts</span>
                  <span className="font-medium">
                    {data.bankAccounts.length +
                      data.investmentAccounts.length +
                      data.cryptoAccounts.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Linked via Plaid</span>
                  <span className="font-medium">
                    {data.bankAccounts.filter(a => a.source === 'plaid').length +
                      data.investmentAccounts.filter(a => a.source === 'plaid').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Manual Entries</span>
                  <span className="font-medium">
                    {data.manualAssets.length + data.realEstate.length + data.vehicles.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'banks' && (
          <div className="space-y-4">
            {data.bankAccounts.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No bank accounts connected</p>
                <div className="mt-3 space-y-2">
                  <PlaidLinkButton onSuccess={fetchFinancialData} className="block mx-auto" />
                  <SaltEdgeConnectButton
                    onSuccess={fetchFinancialData}
                    className="block mx-auto bg-green-600 hover:bg-green-700"
                  >
                    Connect Israeli Bank Account
                  </SaltEdgeConnectButton>
                </div>
              </div>
            ) : (
              data.bankAccounts.map(account => (
                <div key={account.id} className="bg-white rounded-lg border p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{account.name}</h4>
                      <p className="text-sm text-gray-500">
                        {account.institutionName} • {account.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(account.balance)}</p>
                      {account.availableBalance && (
                        <p className="text-sm text-gray-500">
                          Available: {formatCurrency(account.availableBalance)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'investments' && (
          <div className="space-y-4">
            {data.investmentAccounts.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No investment accounts connected</p>
                <div className="mt-3 space-y-2">
                  <PlaidLinkButton onSuccess={fetchFinancialData} className="block mx-auto" />
                  <SaltEdgeConnectButton
                    onSuccess={fetchFinancialData}
                    className="block mx-auto bg-green-600 hover:bg-green-700"
                  >
                    Connect Israeli Investment Account
                  </SaltEdgeConnectButton>
                  <a
                    href="/investments"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Manual Investment Platform
                  </a>
                </div>
              </div>
            ) : (
              data.investmentAccounts.map(account => (
                <div key={account.id} className="bg-white rounded-lg border p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">
                        {account.type === 'crypto_exchange'
                          ? '₿'
                          : account.type === 'real_estate'
                            ? '🏠'
                            : '📈'}
                      </span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{account.name}</h4>
                        <p className="text-sm text-gray-500">
                          {account.source === 'manual'
                            ? 'Manual Platform'
                            : account.institutionName}{' '}
                          • {account.currency || 'USD'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(account.balance)}</p>
                      {account.source === 'manual' && account.netProfit !== undefined && (
                        <p
                          className={`text-sm ${account.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {account.netProfit >= 0 ? '+' : ''}
                          {formatCurrency(account.netProfit)}
                          {account.netProfitPercent !== undefined && (
                            <span className="ml-1">({account.netProfitPercent.toFixed(2)}%)</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Manual platform details */}
                  {account.source === 'manual' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Total Deposited:</span>
                          <span className="ml-2 font-medium">
                            {formatCurrency(account.totalDeposited || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Withdrawn:</span>
                          <span className="ml-2 font-medium">
                            {formatCurrency(account.totalWithdrawn || 0)}
                          </span>
                        </div>
                        {account.trackedDeposits !== undefined && (
                          <>
                            <div>
                              <span className="text-gray-500">Tracked Deposits:</span>
                              <span className="ml-2 font-medium text-blue-600">
                                {formatCurrency(account.trackedDeposits)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Untracked Deposits:</span>
                              <span className="ml-2 font-medium text-orange-600">
                                {formatCurrency(account.untrackedDeposits || 0)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {account.trackedDeposits !== undefined && account.untrackedDeposits > 0 && (
                        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                          💡 Link {formatCurrency(account.untrackedDeposits)} to bank accounts for
                          accurate net worth tracking
                        </div>
                      )}

                      {account.transactionCount > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{account.transactionCount}</span>{' '}
                          transactions
                          {account.lastTransaction && (
                            <span className="ml-2">
                              • Last: {new Date(account.lastTransaction.date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex space-x-2 pt-2">
                        <a
                          href={`/investments?deposit=${account.id}`}
                          className="flex-1 text-center px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition-colors text-sm"
                        >
                          💰 Add Deposit
                        </a>
                        <a
                          href={`/investments?withdrawal=${account.id}`}
                          className="flex-1 text-center px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg border border-orange-200 transition-colors text-sm"
                        >
                          🏧 Add Withdrawal
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Connected account holdings */}
                  {account.positions && account.positions.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Holdings</p>
                      <div className="space-y-1">
                        {account.positions.slice(0, 5).map((position: any, idx: number) => (
                          <div
                            key={`${account.id}-position-${idx}`}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-600">
                              {position.symbol} ({position.quantity} shares)
                            </span>
                            <span className="font-medium">{formatCurrency(position.value)}</span>
                          </div>
                        ))}
                        {account.positions.length > 5 && (
                          <p className="text-xs text-gray-500 mt-2">
                            +{account.positions.length - 5} more positions
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'crypto' && (
          <div className="space-y-4">
            {data.cryptoAccounts.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No crypto accounts added</p>
                <button
                  className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => toast('Crypto integration coming soon!')}
                >
                  Add Crypto Account
                </button>
              </div>
            ) : (
              data.cryptoAccounts.map(account => (
                <div key={account.id} className="bg-white rounded-lg border p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{account.name}</h4>
                      <p className="text-sm text-gray-500">{account.type}</p>
                      {account.description && (
                        <p className="text-sm text-gray-600 mt-1">{account.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(account.value)}</p>
                      <p className="text-xs text-gray-500">
                        Updated: {new Date(account.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'liabilities' && (
          <div className="space-y-4">
            {data.liabilities.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No liabilities tracked</p>
              </div>
            ) : (
              data.liabilities.map(liability => (
                <div key={liability.id} className="bg-white rounded-lg border p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{liability.name}</h4>
                      <p className="text-sm text-gray-500 capitalize">
                        {liability.type.replace(/_/g, ' ')}
                      </p>
                      {liability.interestRate && (
                        <p className="text-sm text-gray-600">
                          Interest Rate: {liability.interestRate}%
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-600">
                        -{formatCurrency(liability.balance)}
                      </p>
                      {liability.minimumPayment && (
                        <p className="text-sm text-gray-500">
                          Min Payment: {formatCurrency(liability.minimumPayment)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'property' && (
          <div className="space-y-4">
            {data.realEstate.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Home className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No properties added</p>
                <button
                  className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => toast('Manual property entry coming soon!')}
                >
                  Add Property
                </button>
              </div>
            ) : (
              data.realEstate.map(property => (
                <div key={property.id} className="bg-white rounded-lg border p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{property.name}</h4>
                      {property.description && (
                        <p className="text-sm text-gray-600 mt-1">{property.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(property.value)}</p>
                      <p className="text-xs text-gray-500">
                        Updated: {new Date(property.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'other' && (
          <div className="space-y-6">
            {/* Vehicles */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Vehicles ({data.vehicles.length})
              </h3>
              {data.vehicles.length === 0 ? (
                <p className="text-sm text-gray-500 ml-7">No vehicles added</p>
              ) : (
                <div className="space-y-2">
                  {data.vehicles.map(vehicle => (
                    <div key={vehicle.id} className="bg-white rounded-lg border p-3 ml-7">
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
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Pensions & Retirement ({data.pensions.length})
              </h3>
              {data.pensions.length === 0 ? (
                <p className="text-sm text-gray-500 ml-7">No pension accounts added</p>
              ) : (
                <div className="space-y-2">
                  {data.pensions.map(pension => (
                    <div key={pension.id} className="bg-white rounded-lg border p-3 ml-7">
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
              <h3 className="font-semibold text-gray-900 mb-3">
                Other Assets ({data.manualAssets.length})
              </h3>
              {data.manualAssets.length === 0 ? (
                <p className="text-sm text-gray-500">No other assets added</p>
              ) : (
                <div className="space-y-2">
                  {data.manualAssets.map(asset => (
                    <div key={asset.id} className="bg-white rounded-lg border p-3">
                      <div className="flex justify-between">
                        <div>
                          <span className="text-sm font-medium">{asset.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({asset.type})</span>
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
    </div>
  );
}
