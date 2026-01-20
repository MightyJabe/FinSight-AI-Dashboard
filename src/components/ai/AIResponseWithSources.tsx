'use client';

import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface AIResponseWithSourcesProps {
  response: string;
  sourceTransactions?: string[];
  sourceAccounts?: string[];
}

/**
 * Component that displays an AI response with collapsible source data citations
 * Implements P4.2 from financial-os-upgrade-comprehensive-plan.md
 */
export default function AIResponseWithSources({
  response,
  sourceTransactions = [],
  sourceAccounts = [],
}: AIResponseWithSourcesProps) {
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);

  const hasSourceData = sourceTransactions.length > 0 || sourceAccounts.length > 0;

  return (
    <div className="space-y-3">
      {/* AI Response Content */}
      <div className="prose prose-sm max-w-none text-gray-700">
        {response}
      </div>

      {/* Source Data Section - Only show if there's source data */}
      {hasSourceData && (
        <div className="border-t border-gray-200 pt-3">
          <button
            onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            aria-expanded={isSourcesExpanded}
            aria-controls="source-data-section"
          >
            {isSourcesExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>Source Data ({sourceTransactions.length + sourceAccounts.length} items)</span>
          </button>

          {isSourcesExpanded && (
            <div
              id="source-data-section"
              className="mt-3 space-y-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* Source Accounts */}
              {sourceAccounts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Accounts Referenced ({sourceAccounts.length})
                  </h4>
                  <div className="space-y-2">
                    {sourceAccounts.slice(0, 10).map((accountId) => (
                      <Link
                        key={accountId}
                        href={`/accounts?highlight=${accountId}`}
                        className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                      >
                        <span className="text-sm text-gray-700 font-medium truncate">
                          Account: {accountId.substring(0, 20)}
                          {accountId.length > 20 && '...'}
                        </span>
                        <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                      </Link>
                    ))}
                    {sourceAccounts.length > 10 && (
                      <p className="text-xs text-gray-500 italic">
                        ... and {sourceAccounts.length - 10} more accounts
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Source Transactions */}
              {sourceTransactions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Transactions Referenced ({sourceTransactions.length})
                  </h4>
                  <div className="space-y-2">
                    {sourceTransactions.slice(0, 10).map((txId) => (
                      <Link
                        key={txId}
                        href={`/transactions?highlight=${txId}`}
                        className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                      >
                        <span className="text-sm text-gray-700 font-medium truncate">
                          Transaction: {txId.substring(0, 30)}
                          {txId.length > 30 && '...'}
                        </span>
                        <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                      </Link>
                    ))}
                    {sourceTransactions.length > 10 && (
                      <p className="text-xs text-gray-500 italic">
                        ... and {sourceTransactions.length - 10} more transactions
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Data Usage Notice */}
              <p className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                This response is based on your financial data. Click any item above to view full details.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
