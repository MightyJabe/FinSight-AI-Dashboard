'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { usePlaidLink } from 'react-plaid-link';

import { auth } from '@/lib/firebase';
import logger from '@/lib/logger';

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
  className?: string;
  itemId?: string; // For update mode (re-authentication)
  mode?: 'create' | 'update';
}

/**
 *
 */
export function PlaidLinkButton({
  onSuccess,
  className = '',
  itemId,
  mode = 'create',
}: PlaidLinkButtonProps) {
  const [loading, setLoading] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token: string) => {
      try {
        setLoading(true);

        // Get the current user's ID token
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }
        const idToken = await user.getIdToken();

        // Exchange the public token for an access token
        const response = await fetch('/api/plaid/exchange-public-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ publicToken: public_token }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          logger.error('Token exchange error:', { errorData });
          throw new Error('Failed to exchange token');
        }

        toast.success('Successfully connected bank account!');
        onSuccess?.();
      } catch (error) {
        logger.error('Error exchanging token:', { error });
        toast.error('Failed to connect bank account. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onExit: (err: any) => {
      if (err) {
        logger.error('Plaid Link error:', { err });
        toast.error('Failed to connect bank account. Please try again.');
      }
    },
  });

  const handleClick = async () => {
    try {
      setLoading(true);
      // Get the current user's ID token
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      const idToken = await user.getIdToken();
      // Get a new link token
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          mode,
          itemId: mode === 'update' ? itemId : undefined,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        logger.error('Link token error:', { errorData });
        throw new Error('Failed to create link token');
      }
      const { linkToken: newLinkToken } = await response.json();
      setLinkToken(newLinkToken);
    } catch (error) {
      logger.error('Error creating link token:', { error });
      toast.error('Failed to connect bank account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-open Plaid Link when ready and linkToken are set
  useEffect(() => {
    if (ready && linkToken) {
      open();
    }
  }, [ready, linkToken, open]);

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Connecting...
        </>
      ) : mode === 'update' ? (
        'Re-authenticate Account'
      ) : (
        'Connect Bank Account'
      )}
    </button>
  );
}
