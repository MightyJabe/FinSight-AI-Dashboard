'use client';

import { AlertTriangle } from 'lucide-react';

/**
 *
 */
export default function PlaidDataWarning() {
  return (
    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start">
      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
      <div>
        <h3 className="text-sm font-semibold text-yellow-700">Limited Insight Accuracy</h3>
        <p className="text-xs text-yellow-600">
          Your financial insights are based on manually entered data only, as we couldn&apos;t
          access your bank account information. For more comprehensive and accurate insights, please
          connect or re-link your bank account via Plaid.
        </p>
      </div>
    </div>
  );
}
