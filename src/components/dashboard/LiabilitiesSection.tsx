import { AlertCircle, CreditCard, Home, Pencil, Trash2 } from 'lucide-react';

import type { Liability } from '@/types/finance';
import { formatCurrency } from '@/utils/format';
import { formatDate } from '@/utils/format-date';

interface LiabilitiesSectionProps {
  liabilities: Liability[];
  onEditLiability: (liability: Liability) => void;
  onDeleteLiability: (liabilityId: string) => void;
}

/**
 *
 */
export function LiabilitiesSection({
  liabilities,
  onEditLiability,
  onDeleteLiability,
}: LiabilitiesSectionProps) {
  return (
    <div className="space-y-8">
      {/* Liabilities List */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Liabilities</h2>
        <div className="space-y-4">
          {liabilities.length > 0 ? (
            liabilities.map(l => (
              <div
                key={l.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {l.type === 'mortgage' ? (
                    <Home className="h-5 w-5 text-red-500" />
                  ) : l.type === 'credit card' ? (
                    <CreditCard className="h-5 w-5 text-red-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">{l.name}</p>
                    {l.createdAt && (
                      <p className="text-xs text-gray-400">Added: {formatDate(l.createdAt)}</p>
                    )}
                    <p className="text-sm text-gray-500">{l.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-medium text-red-600">
                    {formatCurrency(l.amount ?? 0)}
                  </p>
                  <button
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Edit"
                    onClick={() => onEditLiability(l)}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete"
                    onClick={() => onDeleteLiability(l.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500">No liabilities added</div>
          )}
        </div>
      </div>
    </div>
  );
}
