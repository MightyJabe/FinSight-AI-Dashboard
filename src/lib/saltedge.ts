import crypto from 'crypto';

// Salt Edge configuration
const SALTEDGE_CONFIG = {
  appId: process.env.SALTEDGE_APP_ID,
  secret: process.env.SALTEDGE_SECRET,
  baseUrl: process.env.SALTEDGE_BASE_URL || 'https://www.saltedge.com/api/v5',
};

// Helper function to create Salt Edge API signature
function createSignature(method: string, url: string, body?: string, expires?: number): string {
  if (!SALTEDGE_CONFIG.secret) {
    throw new Error('Salt Edge secret is required');
  }

  const expiresAt = expires || Math.floor(Date.now() / 1000) + 60; // 60 seconds from now
  const message = `${method}|${url}|${body || ''}|${expiresAt}`;

  return crypto.createHmac('sha256', SALTEDGE_CONFIG.secret).update(message).digest('base64');
}

// Helper function to make Salt Edge API requests
async function saltEdgeRequest(method: string, endpoint: string, body?: any) {
  if (!SALTEDGE_CONFIG.appId || !SALTEDGE_CONFIG.secret) {
    throw new Error(
      'Salt Edge is not configured. Add SALTEDGE_APP_ID and SALTEDGE_SECRET to your .env.local file to enable Israeli bank connections.'
    );
  }
  const url = `${SALTEDGE_CONFIG.baseUrl}${endpoint}`;
  const bodyString = body ? JSON.stringify(body) : '';
  const expires = Math.floor(Date.now() / 1000) + 60;
  const signature = createSignature(method, url, bodyString, expires);

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'App-id': SALTEDGE_CONFIG.appId,
    Secret: signature,
    'Expires-at': expires.toString(),
  };

  const response = await fetch(url, {
    method,
    headers,
    ...(bodyString && { body: bodyString }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Salt Edge API error: ${response.status} ${error}`);
  }

  return response.json();
}

// Salt Edge specific types
export interface SaltEdgeAccount {
  id: string;
  name: string;
  nature: string;
  balance: number;
  currency_code: string;
  connection_id: string;
  created_at: string;
  updated_at: string;
}

export interface SaltEdgeTransaction {
  id: string;
  account_id: string;
  amount: number;
  currency_code: string;
  description: string;
  category: string;
  made: string;
  status: string;
}

export interface SaltEdgeConnection {
  id: string;
  provider_id: string;
  provider_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Helper function to create connect session
export async function createConnectSession(customerId: string, returnUrl?: string) {
  try {
    const body = {
      data: {
        customer_id: customerId,
        country_code: 'IL', // Israel
        return_to: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/accounts`,
        consent: {
          scopes: ['account_details', 'transactions_details'],
          from_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
        },
      },
    };

    const response = await saltEdgeRequest('POST', '/connect_sessions', body);
    return response;
  } catch (error) {
    console.error('Salt Edge connect session error:', error);
    throw error;
  }
}

// Helper function to get customer's connections
export async function getCustomerConnections(customerId: string) {
  try {
    const response = await saltEdgeRequest('GET', `/connections?customer_id=${customerId}`);
    return response;
  } catch (error) {
    console.error('Salt Edge connections error:', error);
    throw error;
  }
}

// Helper function to get accounts for a connection
export async function getConnectionAccounts(connectionId: string) {
  try {
    const response = await saltEdgeRequest('GET', `/accounts?connection_id=${connectionId}`);
    return response;
  } catch (error) {
    console.error('Salt Edge accounts error:', error);
    throw error;
  }
}

// Helper function to get transactions for an account
export async function getAccountTransactions(accountId: string, fromDate?: string) {
  try {
    const from =
      fromDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await saltEdgeRequest(
      'GET',
      `/transactions?account_id=${accountId}&from_date=${from}`
    );
    return response;
  } catch (error) {
    console.error('Salt Edge transactions error:', error);
    throw error;
  }
}
