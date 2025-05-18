import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { env } from './env';

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[env.plaid.environment],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': env.plaid.clientId,
      'PLAID-SECRET': env.plaid.secret,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// Helper function to create a link token
export async function createLinkToken(userId: string) {
  try {
    const request = {
      user: { client_user_id: userId },
      client_name: 'FinSight AI Dashboard',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    };

    const response = await plaidClient.linkTokenCreate(request);
    return response.data.link_token;
  } catch (error) {
    console.error('Error creating link token:', error);
    throw error;
  }
}

// Helper function to exchange public token for access token
export async function exchangePublicToken(publicToken: string) {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error exchanging public token:', error);
    throw error;
  }
}

// Helper function to get account balances
export async function getAccountBalances(accessToken: string) {
  try {
    const response = await plaidClient.accountsBalanceGet({
      access_token: accessToken,
    });
    return response.data.accounts;
  } catch (error) {
    console.error('Error getting account balances:', error);
    throw error;
  }
}

// Helper function to get transactions
export async function getTransactions(accessToken: string, startDate: string, endDate: string) {
  try {
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    });
    return response.data.transactions;
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
}
