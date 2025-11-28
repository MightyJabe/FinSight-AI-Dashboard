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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl" role="img" aria-label={TYPE_LABELS[platform.type]}>
              {TYPE_ICONS[platform.type]}
            </span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {platform.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {TYPE_LABELS[platform.type]}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {platform.currency}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(platform)}
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              aria-label="Edit platform"
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(platform.id)}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              aria-label="Delete platform"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(platform.currentBalance)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Net Profit/Loss</p>
            <div className="flex items-center space-x-2">
              <p
                className={`text-xl font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
              >
                {isPositive ? '+' : '-'}
                {formatCurrency(platform.netProfit)}
              </p>
              {isPositive ? (
                <FiTrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <FiTrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}
              {platform.netProfitPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => onAddDeposit(platform.id)}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Deposit</span>
          </button>
          <button
            onClick={() => onAddWithdrawal(platform.id)}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg border border-orange-200 dark:border-orange-800 transition-colors"
          >
            <FiMinus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Withdrawal</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400 flex items-center">
              <FiPlus className="w-4 h-4 mr-1" />
              Total Deposited:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(platform.totalDeposited)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400 flex items-center">
              <FiMinus className="w-4 h-4 mr-1" />
              Total Withdrawn:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(platform.totalWithdrawn)}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Net Investment:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {formatCurrency(platform.totalDeposited - platform.totalWithdrawn)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Transactions:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {platform.transactionCount}
                </span>
              </div>
            </div>

            {platform.transactionCount > 0 && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Recent Transactions ({platform.transactionCount} total):
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {platform.transactions.slice(0, 3).map(transaction => (
                    <div key={transaction.id} className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs px-2 py-1 rounded font-medium ${
                              transaction.type === 'deposit'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            }`}
                          >
                            {transaction.type === 'deposit' ? '💰 Deposit' : '🏧 Withdrawal'}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            {formatDate(transaction.date)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      {transaction.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                  ))}
                  {platform.transactionCount > 3 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                      ... and {platform.transactionCount - 3} more transactions
                    </p>
                  )}
                </div>
              </div>
            )}

            {platform.notes && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Notes:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{platform.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
