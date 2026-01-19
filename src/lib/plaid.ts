import {
  AccountsGetRequest,
  Configuration,
  CountryCode,
  InvestmentsHoldingsGetRequest,
  LiabilitiesGetRequest,
  PlaidApi,
  PlaidEnvironments,
  Products,
} from 'plaid';

import { getConfig } from './config';
import logger from './logger';

const { plaid: plaidEnvVars } = getConfig();

const PLAID_CLIENT_ID = plaidEnvVars.clientId;
const PLAID_SECRET = plaidEnvVars.secret; // Changed from PLAID_SECRET_KEY to PLAID_SECRET
const PLAID_ENV = plaidEnvVars.environment || 'sandbox';

let plaidClient: PlaidApi;

// Skip validation in CI build environment
if (process.env.CI === 'true' && process.env.NODE_ENV === 'production') {
  console.log('Skipping Plaid configuration validation in CI build environment');
  // Create dummy client for CI
  plaidClient = {} as PlaidApi;
} else if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
  throw new Error('PLAID_CLIENT_ID and PLAID_SECRET must be set in environment variables.');
} else {
  const plaidConfig = new Configuration({
    basePath: (PlaidEnvironments[PLAID_ENV as keyof typeof PlaidEnvironments] ||
      PlaidEnvironments.sandbox) as string,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET,
        'Plaid-Version': '2020-09-14', // Specify Plaid API version
      },
    },
  });

  plaidClient = new PlaidApi(plaidConfig);
}

export { plaidClient };

/**
 * Creates a Plaid Link token for connecting bank accounts
 * @param userId - The authenticated user's ID
 * @returns The link token string for initializing Plaid Link
 */
export async function createLinkToken(userId: string) {
  try {
    const request = {
      user: { client_user_id: userId },
      client_name: 'FinSight AI Dashboard',
      products: [
        Products.Transactions,
        Products.Balance,
        Products.Investments,
        Products.Liabilities,
        Products.Identity,
      ],
      country_codes: [CountryCode.Us],
      language: 'en',
      // redirect_uri: process.env.PLAID_REDIRECT_URI, // Optional: Add if using OAuth redirect flow
    };

    const response = await plaidClient.linkTokenCreate(request);
    return response.data.link_token;
  } catch (error) {
    logger.error('Error creating link token', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      operation: 'createLinkToken',
    });
    throw error;
  }
}

/**
 * Exchanges a Plaid public token for a permanent access token
 * @param publicToken - The public token obtained from Plaid Link
 * @returns The access token for making Plaid API requests
 */
export async function exchangePublicToken(publicToken: string) {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    return response.data.access_token;
  } catch (error) {
    logger.error('Error exchanging public token', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'exchangePublicToken',
    });
    throw error;
  }
}

/**
 * Retrieves account balances from Plaid for all connected accounts
 * @param accessToken - The Plaid access token for the user's connected item
 * @returns Array of account objects with balance information
 */
export async function getAccountBalances(
  accessToken: string
): Promise<import('plaid').AccountBase[]> {
  try {
    const response = await plaidClient.accountsBalanceGet({ access_token: accessToken });
    return response.data.accounts;
  } catch (error: unknown) {
    logger.error('Error fetching account balances from Plaid', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'getAccountBalances',
    });
    if (error instanceof Error) {
      throw new Error(`Plaid API error: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching account balances.');
  }
}

/**
 * Retrieves transactions from Plaid for a specified date range
 * @param accessToken - The Plaid access token for the user's connected item
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Array of transaction objects
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
    logger.error('Error fetching transactions from Plaid', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'getTransactions',
      startDate,
      endDate,
    });
    if (error instanceof Error) {
      throw new Error(`Plaid API error: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching transactions.');
  }
}

// Helper function to get investment holdings
export async function getInvestmentHoldings(accessToken: string): Promise<{
  holdings: import('plaid').Holding[];
  securities: import('plaid').Security[];
  accounts: import('plaid').AccountBase[];
}> {
  try {
    const request: InvestmentsHoldingsGetRequest = {
      access_token: accessToken,
    };
    const response = await plaidClient.investmentsHoldingsGet(request);
    return {
      holdings: response.data.holdings,
      securities: response.data.securities,
      accounts: response.data.accounts,
    };
  } catch (error: unknown) {
    logger.error('Error fetching investment holdings from Plaid', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'getInvestmentHoldings',
    });
    if (error instanceof Error) {
      throw new Error(`Plaid API error: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching investment holdings.');
  }
}

// Helper function to get liabilities
export async function getLiabilities(accessToken: string): Promise<{
  liabilities: import('plaid').LiabilitiesObject;
  accounts: import('plaid').AccountBase[];
}> {
  try {
    const request: LiabilitiesGetRequest = {
      access_token: accessToken,
    };
    const response = await plaidClient.liabilitiesGet(request);
    return {
      liabilities: response.data.liabilities,
      accounts: response.data.accounts,
    };
  } catch (error: unknown) {
    logger.error('Error fetching liabilities from Plaid', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'getLiabilities',
    });
    if (error instanceof Error) {
      throw new Error(`Plaid API error: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching liabilities.');
  }
}

// Helper function to get detailed account information
export async function getDetailedAccounts(
  accessToken: string
): Promise<import('plaid').AccountBase[]> {
  try {
    const request: AccountsGetRequest = {
      access_token: accessToken,
    };
    const response = await plaidClient.accountsGet(request);
    return response.data.accounts;
  } catch (error: unknown) {
    logger.error('Error fetching detailed accounts from Plaid', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'getDetailedAccounts',
    });
    if (error instanceof Error) {
      throw new Error(`Plaid API error: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching account details.');
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
    // TODO: Re-enable deposit_switch once Plaid SDK type definitions are updated
    // The Products.DepositSwitch type may not exist in the current Plaid SDK version
    // case 'deposit_switch':
    //   return Products.DepositSwitch;
    case 'payment_initiation':
      return Products.PaymentInitiation;
    case 'transfer':
      return Products.Transfer;
    // Add other products as needed
    default:
      logger.warn(`Unknown Plaid product string: '${productStr}'. Defaulting to Transactions.`, {
        productStr,
        operation: 'mapToPlaidProducts',
      });
      return Products.Transactions; // Fallback or throw error
  }
};

export const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || 'transactions')
  .split(',')
  .map(mapToPlaidProducts);

export const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US')
  .split(',')
  .map(c => c.trim().toUpperCase() as CountryCode);
