import {
  Car,
  Coins,
  CreditCard,
  Home,
  Pencil,
  PiggyBank,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import type { Account, ManualAsset } from '@/types/finance';
import { formatCurrency } from '@/utils/format';
import { formatDate } from '@/utils/format-date';

interface AssetsSectionProps {
  accounts: Account[];
  manualAssets: ManualAsset[];
  onEditAsset: (asset: ManualAsset) => void;
  onDeleteAsset: (assetId: string) => void;
}

/**
 *
 */
export function AssetsSection({
  accounts,
  manualAssets,
  onEditAsset,
  onDeleteAsset,
}: AssetsSectionProps) {
  return (
    <div className="space-y-8">
      {/* Bank Accounts */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Bank Accounts</h2>
        <div className="space-y-4">
          {accounts.length > 0 ? (
            accounts.map(acc => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {acc.type === 'investment' ? (
                    <Coins className="h-5 w-5 text-yellow-500" />
                  ) : acc.type === 'credit' ? (
                    <CreditCard className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Wallet className="h-5 w-5 text-green-500" />
                  )}
                  <div>
                    <p className="font-medium">{acc.name}</p>
                    <p className="text-sm text-gray-500">{acc.type}</p>
                  </div>
                </div>
                <p className="font-mono font-medium">{formatCurrency(acc.balance ?? 0)}</p>
              </div>
            ))
          ) : (
            <div className="text-gray-500">No accounts connected</div>
          )}
        </div>
      </div>

      {/* Manual Assets List */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Other Assets</h2>
        <div className="space-y-4">
          {manualAssets.length > 0 ? (
            manualAssets.map(asset => (
              <div
                key={asset.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {asset.type === 'real_estate' ? (
                    <Home className="h-5 w-5 text-green-500" />
                  ) : asset.type === 'vehicle' ? (
                    <Car className="h-5 w-5 text-blue-500" />
                  ) : asset.type === 'investment' ? (
                    <TrendingUp className="h-5 w-5 text-yellow-500" />
                  ) : asset.type === 'crypto' ? (
                    <Coins className="h-5 w-5 text-purple-500" />
                  ) : (
                    <PiggyBank className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    {asset.createdAt && (
                      <p className="text-xs text-gray-400">Added: {formatDate(asset.createdAt)}</p>
                    )}
                    <p className="text-sm text-gray-500">{asset.type}</p>
                    {asset.description && (
                      <p className="text-xs text-gray-400 mt-1">{asset.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-medium text-green-600">
                    {formatCurrency(asset.amount ?? 0)}
                  </p>
                  <button
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Edit"
                    onClick={() => onEditAsset(asset)}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete"
                    onClick={() => onDeleteAsset(asset.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500">No manual assets added</div>
          )}
        </div>
      </div>
    </div>
  );
}
