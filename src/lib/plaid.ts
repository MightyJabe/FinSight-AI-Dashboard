import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from 'plaid';

import { getConfig } from './config';

const { plaid: plaidEnvVars } = getConfig();

const PLAID_CLIENT_ID = plaidEnvVars.clientId;
const PLAID_SECRET = plaidEnvVars.secret; // Changed from PLAID_SECRET_KEY to PLAID_SECRET
const PLAID_ENV = plaidEnvVars.environment || 'sandbox';

if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
  throw new Error('PLAID_CLIENT_ID and PLAID_SECRET must be set in environment variables.');
}

const plaidConfig = new Configuration({
  basePath: (PlaidEnvironments[PLAID_ENV as keyof typeof PlaidEnvironments] || PlaidEnvironments.sandbox) as string,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
      'Plaid-Version': '2020-09-14', // Specify Plaid API version
    },
  },
});

export const plaidClient = new PlaidApi(plaidConfig);

// Helper function to create a link token
/**
 *
 */
export async function createLinkToken(userId: string) {
  try {
    const request = {
      user: { client_user_id: userId },
      client_name: 'FinSight AI Dashboard',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
      // redirect_uri: process.env.PLAID_REDIRECT_URI, // Optional: Add if using OAuth redirect flow
    };

    const response = await plaidClient.linkTokenCreate(request);
    return response.data.link_token;
  } catch (error) {
    console.error('Error creating link token:', error);
    throw error;
  }
}

// Helper function to exchange public token for access token
/**
 *
 */
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
/**
 *
 */
export async function getAccountBalances(
  accessToken: string
): Promise<import('plaid').AccountBase[]> {
  try {
    const response = await plaidClient.accountsBalanceGet({ access_token: accessToken });
    return response.data.accounts;
  } catch (error: unknown) {
    console.error('Error fetching account balances from Plaid:', error);
    if (error instanceof Error) {
      throw new Error(`Plaid API error: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching account balances.');
  }
}

// Helper function to get transactions
/**
 *
 */
export async function getTransactions(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<import('plaid').Transaction[]> {
  try {
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: {
        count: 250,
        offset: 0,
      },
    });
    const transactions = response.data.transactions;
    return transactions;
  } catch (error: unknown) {
    console.error('Error fetching transactions from Plaid:', error);
    if (error instanceof Error) {
      throw new Error(`Plaid API error: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching transactions.');
  }
}

// Define types for Plaid products and country codes if needed for linkTokenCreate
const mapToPlaidProducts = (productStr: string): Products => {
  const productLower = productStr.toLowerCase().trim();
  switch (productLower) {
    case 'auth':
      return Products.Auth;
    case 'transactions':
      return Products.Transactions;
    case 'identity':
      return Products.Identity;
    case 'balance':
      return Products.Balance;
    case 'investments':
      return Products.Investments;
    case 'credit_details':
      return Products.CreditDetails;
    case 'income_verification':
      return Products.IncomeVerification;
    // case 'deposit_switch': // Temporarily commented out due to TS error
    //   return Products.DepositSwitch; // Temporarily commented out
    case 'payment_initiation':
      return Products.PaymentInitiation;
    case 'transfer':
      return Products.Transfer;
    // Add other products as needed
    default:
      console.warn(`Unknown Plaid product string: '${productStr}'. Defaulting to Transactions.`);
      return Products.Transactions; // Fallback or throw error
  }
};

export const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || 'transactions')
  .split(',')
  .map(mapToPlaidProducts);

export const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US')
  .split(',')
  .map(c => c.trim().toUpperCase() as CountryCode);
