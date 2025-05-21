'use client';

import { AlertTriangle, Trash2 } from 'lucide-react'; // Added AlertTriangle
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { DisplayableAccount } from '@/lib/finance'; // Assuming this path is correct
import { formatCurrency } from '@/utils/format';

interface AccountItemProps {
  account: DisplayableAccount;
  iconElement: JSX.Element; // Changed from getAccountIcon function to JSX.Element
}

const AccountItem: React.FC<AccountItemProps> = ({ account, iconElement }) => {
  const router = useRouter();
  const [isUnlinking, setIsUnlinking] = useState(false);

  const handleUnlink = async () => {
    if (!account.itemId || account.source !== 'linked') {
      toast.error('This account cannot be unlinked directly.');
      return;
    }

    // Confirmation dialog
    if (
      !confirm(
        `Are you sure you want to unlink the item associated with "${account.name}"? This will remove all accounts from this institution.`
      )
    ) {
      return;
    }

    setIsUnlinking(true);
    try {
      const response = await fetch('/api/plaid/remove-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: account.itemId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to unlink Plaid item');
      }
      toast.success('Account item unlinked successfully. Refreshing...');
      router.refresh(); // Refresh the accounts list
    } catch (error: unknown) {
      console.error('Failed to unlink Plaid item:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to unlink. Please try again.');
    } finally {
      setIsUnlinking(false);
    }
  };

  const isErrorAccount = account.type === 'Error';

  return (
    <div
      key={account.id}
      className={`flex items-center justify-between p-4 sm:p-6  rounded-xl shadow-lg border transition-shadow duration-200 
                    ${isErrorAccount ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:shadow-xl'}`}
    >
      <div className="flex items-center overflow-hidden">
        {isErrorAccount ? (
          <AlertTriangle className="mr-3 h-6 w-6 text-red-500 flex-shrink-0" />
        ) : (
          iconElement
        )}
        <div className="overflow-hidden">
          <h3
            className={`text-base sm:text-lg font-semibold truncate ${isErrorAccount ? 'text-red-700' : 'text-gray-800'}`}
          >
            {account.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500">
            {account.type}
            {account.source && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ml-1.5 whitespace-nowrap 
                                ${
                                  account.source === 'manual'
                                    ? 'bg-sky-100 text-sky-700'
                                    : isErrorAccount
                                      ? 'bg-red-200 text-red-800'
                                      : 'bg-indigo-100 text-indigo-700'
                                }`}
              >
                {account.source === 'linked' && isErrorAccount ? 'Link Error' : account.source}
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center flex-shrink-0 ml-2">
        {!isErrorAccount && (
          <div className="text-right mr-2 sm:mr-4">
            <p
              className={`text-md sm:text-xl font-bold ${account.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatCurrency(account.currentBalance)}
            </p>
            <p className="text-xs text-gray-400 hidden sm:block">Balance</p>
          </div>
        )}
        {(account.source === 'linked' || isErrorAccount) && account.itemId && (
          <button
            onClick={handleUnlink}
            disabled={isUnlinking}
            title={
              isErrorAccount
                ? 'Remove this errored link'
                : 'Unlink this institution and all its accounts'
            }
            className={`p-2 rounded-md transition-colors duration-150 
                        ${isErrorAccount ? 'bg-red-100 hover:bg-red-200 text-red-600' : 'bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-500'}
                        disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isUnlinking ? (
              <span className="text-xs">Unlinking...</span>
            ) : (
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default AccountItem;
