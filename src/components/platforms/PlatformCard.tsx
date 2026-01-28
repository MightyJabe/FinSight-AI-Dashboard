'use client';

import { useState } from 'react';
import { FiEdit2, FiMinus, FiPlus, FiTrash2, FiTrendingDown, FiTrendingUp } from 'react-icons/fi';

import type { PlatformWithTransactions } from '@/types/platform';

interface PlatformCardProps {
  platform: PlatformWithTransactions;
  onEdit: (platform: PlatformWithTransactions) => void;
  onDelete: (id: string) => void;
  onAddDeposit: (platformId: string) => void;
  onAddWithdrawal: (platformId: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
  stock_broker: '📈',
  crypto_exchange: '₿',
  real_estate: '🏠',
  bank_investment: '🏦',
  retirement: '🎯',
  crowdfunding: '👥',
  forex: '💱',
  other: '💼',
};

const TYPE_LABELS: Record<string, string> = {
  stock_broker: 'Stock Broker',
  crypto_exchange: 'Crypto Exchange',
  real_estate: 'Real Estate',
  bank_investment: 'Bank Investment',
  retirement: 'Retirement',
  crowdfunding: 'Crowdfunding',
  forex: 'Forex',
  other: 'Other',
};

export default function PlatformCard({
  platform,
  onEdit,
  onDelete,
  onAddDeposit,
  onAddWithdrawal,
}: PlatformCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isPositive = platform.netProfit >= 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      ILS: '₪',
      CAD: 'C$',
      AUD: 'A$',
      JPY: '¥',
      CNY: '¥',
      INR: '₹',
    };
    return symbols[currency] || currency;
  };

  const formatCurrency = (amount: number) => {
    return `${getCurrencySymbol(platform.currency)}${Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="glass-card-strong rounded-2xl overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 backdrop-blur-sm">
              <span className="text-2xl" role="img" aria-label={TYPE_LABELS[platform.type]}>
                {TYPE_ICONS[platform.type]}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold gradient-text">
                {platform.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                  {TYPE_LABELS[platform.type]}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-xs font-bold text-blue-400">
                  {platform.currency}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(platform)}
              className="p-2 text-muted-foreground hover:text-blue-400 transition-all hover:scale-110 active:scale-95 rounded-lg hover:bg-blue-500/10"
              aria-label="Edit platform"
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(platform.id)}
              className="p-2 text-muted-foreground hover:text-rose-400 transition-all hover:scale-110 active:scale-95 rounded-lg hover:bg-rose-500/10"
              aria-label="Delete platform"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1.5">Current Balance</p>
            <p className="text-xl font-bold gradient-text tabular-nums">
              {formatCurrency(platform.currentBalance)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1.5">Net Profit/Loss</p>
            <div className="flex items-center space-x-2">
              <p
                className={`text-xl font-bold tabular-nums ${isPositive ? 'text-blue-400' : 'text-pink-400'}`}
              >
                {isPositive ? '+' : '-'}
                {formatCurrency(platform.netProfit)}
              </p>
              {isPositive ? (
                <FiTrendingUp className="w-5 h-5 text-blue-400" />
              ) : (
                <FiTrendingDown className="w-5 h-5 text-pink-400" />
              )}
            </div>
            <p className={`text-xs font-semibold tabular-nums ${isPositive ? 'text-blue-400' : 'text-pink-400'}`}>
              {isPositive ? '+' : ''}
              {platform.netProfitPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => onAddDeposit(platform.id)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-blue-400 hover:text-blue-300 rounded-xl border border-blue-500/30 hover:border-blue-400/50 transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold"
          >
            <FiPlus className="w-4 h-4" />
            <span className="text-sm">Deposit</span>
          </button>
          <button
            onClick={() => onAddWithdrawal(platform.id)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-pink-400 hover:text-pink-300 rounded-xl border border-pink-500/30 hover:border-pink-400/50 transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold"
          >
            <FiMinus className="w-4 h-4" />
            <span className="text-sm">Withdraw</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1.5 flex items-center">
              <FiPlus className="w-3 h-3 mr-1" />
              Deposited
            </span>
            <span className="font-bold text-foreground tabular-nums">
              {formatCurrency(platform.totalDeposited)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1.5 flex items-center">
              <FiMinus className="w-3 h-3 mr-1" />
              Withdrawn
            </span>
            <span className="font-bold text-foreground tabular-nums">
              {formatCurrency(platform.totalWithdrawn)}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-400 hover:text-blue-300 font-semibold transition-colors hover:underline"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>

        {showDetails && (
          <div className="mt-5 pt-5 border-t border-white/10 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1.5">Net Investment</span>
                <span className="font-bold text-foreground tabular-nums">
                  {formatCurrency(platform.totalDeposited - platform.totalWithdrawn)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1.5">Transactions</span>
                <span className="font-bold text-foreground tabular-nums">
                  {platform.transactionCount}
                </span>
              </div>
            </div>

            {platform.transactionCount > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3">
                  Recent Transactions ({platform.transactionCount} total)
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {platform.transactions.slice(0, 3).map(transaction => (
                    <div key={transaction.id} className="glass-card rounded-xl p-3 hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                              transaction.type === 'deposit'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                            }`}
                          >
                            {transaction.type === 'deposit' ? '💰 Deposit' : '🏧 Withdrawal'}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            {formatDate(transaction.date)}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-foreground tabular-nums">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      {transaction.description && (
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                  ))}
                  {platform.transactionCount > 3 && (
                    <p className="text-xs text-muted-foreground text-center py-2 font-medium">
                      ... and {platform.transactionCount - 3} more transactions
                    </p>
                  )}
                </div>
              </div>
            )}

            {platform.notes && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Notes</p>
                <p className="text-sm text-foreground leading-relaxed">{platform.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
