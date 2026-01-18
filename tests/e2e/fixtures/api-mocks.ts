import { test as base, Page } from '@playwright/test';

/**
 * Mock data responses for API endpoints
 * These match the shapes expected by the dashboard hooks
 */

const mockNetWorthResponse = {
  success: true,
  data: {
    netWorth: 45231.50,
    totalAssets: 55231.50,
    totalLiabilities: 10000.00,
    liquidAssets: 12500.00,
    investments: 22000.00,
    cryptoBalance: 5000.00,
    realEstate: 150000.00,
    pension: 80000.00,
    trend: {
      daily: 125.50,
      weekly: 850.25,
      monthly: 2150.75,
    },
  },
};

const mockFinancialOverviewResponse = {
  success: true,
  data: {
    summary: {
      liquidAssets: 12500.00,
      totalAssets: 55231.50,
      totalLiabilities: 10000.00,
      netWorth: 45231.50,
      monthlyIncome: 8500.00,
      monthlyExpenses: 5100.00,
      monthlyCashFlow: 3400.00,
      investments: 22000.00,
      hasIsraeliAccounts: false,
    },
    accounts: {
      bank: [
        {
          id: 'mock-checking-1',
          name: 'E2E Test Checking',
          balance: 8500.00,
          type: 'checking',
          subtype: 'checking',
          accountType: 'depository',
          institutionName: 'Test Bank',
          mask: '1234',
          currency: 'USD',
        },
        {
          id: 'mock-savings-1',
          name: 'E2E Test Savings',
          balance: 4000.00,
          type: 'savings',
          subtype: 'savings',
          accountType: 'depository',
          institutionName: 'Test Bank',
          mask: '5678',
          currency: 'USD',
        },
      ],
      credit: [
        {
          id: 'mock-credit-1',
          name: 'E2E Test Credit Card',
          balance: -2500.00,
          type: 'credit',
          accountType: 'credit',
          institutionName: 'Test Bank',
          mask: '9012',
        },
      ],
      investment: [
        {
          id: 'mock-investment-1',
          name: 'E2E Test Brokerage',
          balance: 22000.00,
          type: 'investment',
          source: 'plaid',
        },
      ],
      loan: [
        {
          id: 'mock-loan-1',
          name: 'E2E Test Loan',
          balance: -7500.00,
          type: 'loan',
          accountType: 'loan',
        },
      ],
      crypto: [
        {
          id: 'mock-crypto-1',
          name: 'Bitcoin Wallet',
          balance: 5000.00,
          type: 'wallet',
        },
      ],
    },
    manualAssets: [
      {
        id: 'mock-manual-asset-1',
        name: 'Emergency Fund',
        amount: 3000.00,
        currentBalance: 3000.00,
        type: 'savings',
      },
    ],
    manualLiabilities: [],
    platforms: undefined,
  },
};

/**
 * Set up API route mocking for a page
 * Intercepts API calls and returns mock data without requiring Firebase Admin credentials
 */
async function setupApiMocks(page: Page) {
  // Mock /api/net-worth endpoint
  await page.route('**/api/net-worth**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockNetWorthResponse),
    });
  });

  // Mock /api/financial-overview endpoint
  await page.route('**/api/financial-overview**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockFinancialOverviewResponse),
    });
  });

  console.log('[API Mocks] Route interception set up for /api/net-worth and /api/financial-overview');
}

/**
 * Extended Playwright test with automatic API mocking
 * Use this instead of the base test to automatically mock API endpoints
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Set up API mocks before each test
    await setupApiMocks(page);
    
    // Run the test
    await use(page);
  },
});

export { expect } from '@playwright/test';
