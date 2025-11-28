'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { auth } from '@/lib/firebase';
import logger from '@/lib/logger';

interface SaltEdgeConnectButtonProps {
  onSuccess?: () => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Button component that initiates Salt Edge connection flow for Israeli banks
 */
export function SaltEdgeConnectButton({
  onSuccess,
  className = '',
  children = 'Connect Israeli Bank Account',
}: SaltEdgeConnectButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLoading(true);

      // Get the current user's ID token
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      const idToken = await user.getIdToken();

      // Create Salt Edge connect session
      const response = await fetch('/api/saltedge/create-connect-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('Salt Edge session error:', { errorData });
        throw new Error(errorData.error || 'Failed to create connect session');
      }

      const { connectUrl } = await response.json();

      // Redirect to Salt Edge Connect
      window.location.href = connectUrl;

      // Call success callback if provided (will be called when user returns)
      onSuccess?.();
    } catch (error) {
      logger.error('Error connecting to Salt Edge:', { error });
      toast.error('Failed to connect bank account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
      ) : (
        children
      )}
    </button>
  );
}
