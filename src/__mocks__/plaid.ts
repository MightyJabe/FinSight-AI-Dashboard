import { jest } from '@jest/globals';
import type { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

// Mock Plaid client
export const mockPlaidClient = {
  linkTokenCreate: jest.fn().mockResolvedValue({
    data: {
      link_token: 'link-sandbox-test-token-123456',
      expiration: '2025-01-18T12:00:00Z',
      request_id: 'test-request-id',
    },
  }),

  itemPublicTokenExchange: jest.fn().mockResolvedValue({
    data: {
      access_token: 'access-sandbox-test-token-123456',
      item_id: 'test-item-id',
      request_id: 'test-request-id',
    },
  }),

  accountsGet: jest.fn().mockResolvedValue({
    data: {
      accounts: [
        {
          account_id: 'test-account-1',
          balances: {
            available: 1000.50,
            current: 1100.75,
            limit: null,
            iso_currency_code: 'USD',
          },
          mask: '0000',
          name: 'Plaid Checking',
          official_name: 'Plaid Gold Standard 0% Interest Checking',
          subtype: 'checking',
          type: 'depository',
        },
        {
          account_id: 'test-account-2',
          balances: {
            available: 5000.00,
            current: 5250.25,
            limit: null,
            iso_currency_code: 'USD',
          },
          mask: '1111',
          name: 'Plaid Saving',
          official_name: 'Plaid Silver Standard 0.1% Interest Saving',
          subtype: 'savings',
          type: 'depository',
        },
      ],
      item: {
        item_id: 'test-item-id',
        institution_id: 'ins_test',
        webhook: '',
        error: null,
        available_products: ['balance', 'investments'],
        billed_products: ['auth', 'transactions'],
        consent_expiration_time: null,
      },
      request_id: 'test-request-id',
    },
  }),

  transactionsGet: jest.fn().mockResolvedValue({
    data: {
      accounts: [
        {
          account_id: 'test-account-1',
          balances: {
            available: 1000.50,
            current: 1100.75,
            limit: null,
            iso_currency_code: 'USD',
          },
          mask: '0000',
          name: 'Plaid Checking',
          official_name: 'Plaid Gold Standard 0% Interest Checking',
          subtype: 'checking',
          type: 'depository',
        },
      ],
      transactions: [
        {
          account_id: 'test-account-1',
          amount: 12.50,
          iso_currency_code: 'USD',
          category: ['Food and Drink', 'Restaurants'],
          category_id: '13005000',
          date: '2025-01-15',
          authorized_date: '2025-01-15',
          name: 'Starbucks',
          merchant_name: 'Starbucks',
          payment_channel: 'in store',
          pending: false,
          transaction_id: 'test-txn-1',
          transaction_type: 'place',
        },
        {
          account_id: 'test-account-1',
          amount: -2000.00,
          iso_currency_code: 'USD',
          category: ['Transfer', 'Payroll'],
          category_id: '21009000',
          date: '2025-01-01',
          authorized_date: '2025-01-01',
          name: 'INTRST PYMNT',
          merchant_name: null,
          payment_channel: 'other',
          pending: false,
          transaction_id: 'test-txn-2',
          transaction_type: 'special',
        },
      ],
      total_transactions: 2,
      request_id: 'test-request-id',
    },
  }),

  investmentsHoldingsGet: jest.fn().mockResolvedValue({
    data: {
      accounts: [
        {
          account_id: 'test-investment-1',
          balances: {
            available: null,
            current: 25000.00,
            limit: null,
            iso_currency_code: 'USD',
          },
          mask: '2222',
          name: 'Plaid 401k',
          official_name: 'Plaid 401k',
          subtype: '401k',
          type: 'investment',
        },
      ],
      holdings: [
        {
          account_id: 'test-investment-1',
          security_id: 'test-security-1',
          institution_price: 120.50,
          institution_price_as_of: '2025-01-15',
          institution_value: 6025.00,
          cost_basis: 5000.00,
          quantity: 50,
          iso_currency_code: 'USD',
        },
      ],
      securities: [
        {
          security_id: 'test-security-1',
          isin: null,
          cusip: 'test-cusip-1',
          sedol: null,
          institution_security_id: null,
          institution_id: null,
          proxy_security_id: null,
          name: 'Test ETF',
          ticker_symbol: 'TEST',
          is_cash_equivalent: false,
          type: 'etf',
          close_price: 120.00,
          close_price_as_of: '2025-01-15',
          iso_currency_code: 'USD',
        },
      ],
      item: {
        item_id: 'test-item-id',
        institution_id: 'ins_test',
      },
      request_id: 'test-request-id',
    },
  }),

  itemRemove: jest.fn().mockResolvedValue({
    data: {
      request_id: 'test-request-id',
    },
  }),
};

// Mock Plaid module
jest.mock('plaid', () => ({
  Configuration: jest.fn(),
  PlaidApi: jest.fn(() => mockPlaidClient),
  PlaidEnvironments: {
    sandbox: 'https://sandbox.plaid.com',
    development: 'https://development.plaid.com',
    production: 'https://production.plaid.com',
  },
  Products: {
    Auth: 'auth',
    Transactions: 'transactions',
    Identity: 'identity',
    Assets: 'assets',
    Investments: 'investments',
  },
  CountryCode: {
    Us: 'US',
    Ca: 'CA',
    Gb: 'GB',
  },
}));

export const plaidClient = mockPlaidClient;
