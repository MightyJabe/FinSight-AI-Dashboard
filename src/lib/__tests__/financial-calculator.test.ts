/**
 * Tests for financial-calculator.ts
 *
 * Focus: calculateFinancialMetrics - the SSOT for all financial calculations
 * Target: 100% coverage on money math
 */

import type { FinancialData, FinancialMetrics } from '../financial-calculator';

// Mock the firebase-admin imports to avoid connection issues
jest.mock('@/lib/firebase-admin', () => ({
  adminAuth: {
    verifySessionCookie: jest.fn(),
  },
  adminDb: {
    collection: jest.fn(() => ({
      get: jest.fn(),
      where: jest.fn(() => ({
        get: jest.fn(),
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(),
          })),
        })),
      })),
    })),
    doc: jest.fn(),
  },
}));

// Mock crypto services to avoid external dependencies
jest.mock('@/lib/services/crypto-balance-service', () => ({
  getCryptoBalance: jest.fn(() => Promise.resolve({ accounts: [] })),
}));

jest.mock('@/lib/services/pension-service', () => ({
  getPensionFunds: jest.fn(() => Promise.resolve({ funds: [] })),
  pensionFundsToAccounts: jest.fn(() => []),
}));

jest.mock('@/lib/services/real-estate-service', () => ({
  getRealEstateProperties: jest.fn(() => Promise.resolve({ properties: [] })),
  propertiesToAccounts: jest.fn(() => []),
  getMortgageLiabilities: jest.fn(() => []),
}));

// Mock financial validator to test isolation
jest.mock('../financial-validator', () => ({
  normalizeFinancialMetrics: jest.fn((metrics: FinancialMetrics) => metrics),
  enforceFinancialAccuracy: jest.fn(),
}));

// Import after mocks
import { calculateFinancialMetrics } from '../financial-calculator';

describe('calculateFinancialMetrics', () => {
  // Helper to create minimal valid FinancialData
  const createEmptyFinancialData = (): FinancialData => ({
    manualAssets: [],
    manualLiabilities: [],
    plaidAccounts: [],
    cryptoAccounts: [],
    realEstateAssets: [],
    pensionAssets: [],
    mortgageLiabilities: [],
    transactions: [],
  });

  describe('Total Assets Calculation', () => {
    it('should calculate total assets from manual assets', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [
        { id: '1', name: 'Savings', amount: 5000, type: 'Savings Account', currentBalance: 5000 },
        { id: '2', name: 'Checking', amount: 3000, type: 'Checking Account', currentBalance: 3000 },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.totalAssets).toBe(8000);
    });

    it('should calculate total assets from plaid accounts', async () => {
      const data = createEmptyFinancialData();
      data.plaidAccounts = [
        { id: '1', name: 'Chase Checking', balance: 10000, type: 'depository', accountType: 'depository', institution: 'Chase' },
        { id: '2', name: 'Investment', balance: 25000, type: 'investment', accountType: 'investment', institution: 'Fidelity' },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.totalAssets).toBe(35000);
    });

    it('should calculate total assets from crypto accounts', async () => {
      const data = createEmptyFinancialData();
      data.cryptoAccounts = [
        { id: '1', name: 'Bitcoin', balance: 15000, type: 'exchange' },
        { id: '2', name: 'Ethereum', balance: 8000, type: 'wallet' },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.totalAssets).toBe(23000);
    });

    it('should calculate total assets from real estate', async () => {
      const data = createEmptyFinancialData();
      data.realEstateAssets = [
        { id: '1', name: 'Primary Home', balance: 500000, type: 'residential' },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.totalAssets).toBe(500000);
    });

    it('should calculate total assets from pension funds', async () => {
      const data = createEmptyFinancialData();
      data.pensionAssets = [
        { id: '1', name: '401k', balance: 150000, type: 'pension' },
        { id: '2', name: 'IRA', balance: 50000, type: 'pension' },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.totalAssets).toBe(200000);
    });

    it('should sum all asset types correctly', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [{ id: '1', name: 'Cash', amount: 1000, type: 'Cash', currentBalance: 1000 }];
      data.plaidAccounts = [{ id: '2', name: 'Bank', balance: 2000, type: 'depository', accountType: 'depository', institution: 'Chase' }];
      data.cryptoAccounts = [{ id: '3', name: 'BTC', balance: 3000, type: 'exchange' }];
      data.realEstateAssets = [{ id: '4', name: 'House', balance: 4000, type: 'residential' }];
      data.pensionAssets = [{ id: '5', name: '401k', balance: 5000, type: 'pension' }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.totalAssets).toBe(15000); // 1000 + 2000 + 3000 + 4000 + 5000
    });

    it('should handle zero balance assets', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [{ id: '1', name: 'Empty', amount: 0, type: 'Cash', currentBalance: 0 }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.totalAssets).toBe(0);
    });

    it('should handle empty asset arrays', async () => {
      const data = createEmptyFinancialData();

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.totalAssets).toBe(0);
    });
  });

  describe('Total Liabilities Calculation', () => {
    it('should calculate total liabilities from manual liabilities', async () => {
      const data = createEmptyFinancialData();
      data.manualLiabilities = [
        { id: '1', name: 'Credit Card', amount: 5000, type: 'credit' },
        { id: '2', name: 'Personal Loan', amount: 10000, type: 'loan' },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.totalLiabilities).toBe(15000);
    });

    it('should calculate total liabilities from mortgages', async () => {
      const data = createEmptyFinancialData();
      data.mortgageLiabilities = [
        { id: '1', name: 'Home Mortgage', amount: 300000, type: 'mortgage' },
        { id: '2', name: 'Investment Property', amount: 150000, type: 'mortgage' },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.totalLiabilities).toBe(450000);
    });

    it('should sum manual liabilities and mortgages', async () => {
      const data = createEmptyFinancialData();
      data.manualLiabilities = [{ id: '1', name: 'Credit Card', amount: 5000, type: 'credit' }];
      data.mortgageLiabilities = [{ id: '2', name: 'Mortgage', amount: 200000, type: 'mortgage' }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.totalLiabilities).toBe(205000);
    });

    it('should handle zero liabilities', async () => {
      const data = createEmptyFinancialData();
      data.manualLiabilities = [{ id: '1', name: 'Paid Off', amount: 0, type: 'credit' }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.totalLiabilities).toBe(0);
    });
  });

  describe('Net Worth Calculation', () => {
    it('should calculate net worth as assets minus liabilities', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [{ id: '1', name: 'Savings', amount: 50000, type: 'Savings Account', currentBalance: 50000 }];
      data.manualLiabilities = [{ id: '1', name: 'Loan', amount: 20000, type: 'loan' }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.netWorth).toBe(30000);
    });

    it('should handle negative net worth', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [{ id: '1', name: 'Cash', amount: 5000, type: 'Cash', currentBalance: 5000 }];
      data.manualLiabilities = [{ id: '1', name: 'Debt', amount: 50000, type: 'loan' }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.netWorth).toBe(-45000);
    });

    it('should handle zero net worth', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [{ id: '1', name: 'Cash', amount: 10000, type: 'Cash', currentBalance: 10000 }];
      data.manualLiabilities = [{ id: '1', name: 'Debt', amount: 10000, type: 'loan' }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.netWorth).toBe(0);
    });
  });

  describe('Liquid Assets Calculation', () => {
    it('should include Cash type as liquid assets', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [{ id: '1', name: 'Cash', amount: 5000, type: 'Cash', currentBalance: 5000 }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.liquidAssets).toBe(5000);
    });

    it('should include Wallet type as liquid assets', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [{ id: '1', name: 'Wallet', amount: 500, type: 'Wallet', currentBalance: 500 }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.liquidAssets).toBe(500);
    });

    it('should include Checking Account type as liquid assets', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [{ id: '1', name: 'Checking', amount: 3000, type: 'Checking Account', currentBalance: 3000 }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.liquidAssets).toBe(3000);
    });

    it('should include Savings Account type as liquid assets', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [{ id: '1', name: 'Savings', amount: 10000, type: 'Savings Account', currentBalance: 10000 }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.liquidAssets).toBe(10000);
    });

    it('should include PayPal Balance as liquid assets', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [{ id: '1', name: 'PayPal', amount: 200, type: 'PayPal Balance', currentBalance: 200 }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.liquidAssets).toBe(200);
    });

    it('should include Digital Wallet Balance as liquid assets', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [{ id: '1', name: 'Venmo', amount: 150, type: 'Digital Wallet Balance', currentBalance: 150 }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.liquidAssets).toBe(150);
    });

    it('should include Bank Account type as liquid assets', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [{ id: '1', name: 'Bank', amount: 5000, type: 'Bank Account', currentBalance: 5000 }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.liquidAssets).toBe(5000);
    });

    it('should include Plaid checking accounts as liquid assets', async () => {
      const data = createEmptyFinancialData();
      data.plaidAccounts = [
        { id: '1', name: 'Checking', balance: 5000, type: 'depository', accountType: 'depository', subtype: 'checking', institution: 'Chase' },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.liquidAssets).toBe(5000);
    });

    it('should include Plaid savings accounts as liquid assets', async () => {
      const data = createEmptyFinancialData();
      data.plaidAccounts = [
        { id: '1', name: 'Savings', balance: 10000, type: 'depository', accountType: 'depository', subtype: 'savings', institution: 'Chase' },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.liquidAssets).toBe(10000);
    });

    it('should NOT include Plaid investment accounts as liquid assets', async () => {
      const data = createEmptyFinancialData();
      data.plaidAccounts = [
        { id: '1', name: 'Brokerage', balance: 50000, type: 'investment', accountType: 'investment', subtype: 'brokerage', institution: 'Fidelity' },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.liquidAssets).toBe(0);
    });

    it('should NOT include non-liquid manual asset types', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [
        { id: '1', name: 'Car', amount: 20000, type: 'Vehicle', currentBalance: 20000 },
        { id: '2', name: 'Jewelry', amount: 5000, type: 'Collectible', currentBalance: 5000 },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.liquidAssets).toBe(0);
    });

    it('should sum all liquid asset types', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [
        { id: '1', name: 'Cash', amount: 1000, type: 'Cash', currentBalance: 1000 },
        { id: '2', name: 'Savings', amount: 5000, type: 'Savings Account', currentBalance: 5000 },
      ];
      data.plaidAccounts = [
        { id: '3', name: 'Checking', balance: 3000, type: 'depository', accountType: 'depository', subtype: 'checking', institution: 'Chase' },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.liquidAssets).toBe(9000); // 1000 + 5000 + 3000
    });
  });

  describe('Investments Calculation', () => {
    it('should include investment type manual assets', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [{ id: '1', name: 'Stocks', amount: 25000, type: 'investment', currentBalance: 25000 }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.investments).toBe(25000);
    });

    it('should include Investment (capital I) type manual assets', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [{ id: '1', name: 'Bonds', amount: 15000, type: 'Investment', currentBalance: 15000 }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.investments).toBe(15000);
    });

    it('should include crypto type manual assets', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [{ id: '1', name: 'Crypto', amount: 10000, type: 'crypto', currentBalance: 10000 }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.investments).toBe(10000);
    });

    it('should include Plaid investment accounts', async () => {
      const data = createEmptyFinancialData();
      data.plaidAccounts = [
        { id: '1', name: 'Brokerage', balance: 50000, type: 'investment', accountType: 'investment', institution: 'Fidelity' },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.investments).toBe(50000);
    });

    it('should include all crypto accounts', async () => {
      const data = createEmptyFinancialData();
      data.cryptoAccounts = [
        { id: '1', name: 'Bitcoin', balance: 20000, type: 'exchange' },
        { id: '2', name: 'Ethereum', balance: 10000, type: 'wallet' },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.investments).toBe(30000);
    });

    it('should sum all investment sources', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [{ id: '1', name: 'Stocks', amount: 10000, type: 'investment', currentBalance: 10000 }];
      data.plaidAccounts = [
        { id: '2', name: 'Brokerage', balance: 20000, type: 'investment', accountType: 'investment', institution: 'Fidelity' },
      ];
      data.cryptoAccounts = [{ id: '3', name: 'Bitcoin', balance: 15000, type: 'exchange' }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.investments).toBe(45000); // 10000 + 20000 + 15000
    });

    it('should NOT include non-investment Plaid accounts', async () => {
      const data = createEmptyFinancialData();
      data.plaidAccounts = [
        { id: '1', name: 'Checking', balance: 5000, type: 'depository', accountType: 'depository', institution: 'Chase' },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.investments).toBe(0);
    });
  });

  describe('Monthly Cash Flow Calculation', () => {
    it('should calculate monthly income from recent income transactions', async () => {
      const data = createEmptyFinancialData();
      const now = new Date();
      data.transactions = [
        { id: '1', accountId: 'acc1', amount: 5000, type: 'income', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
        { id: '2', accountId: 'acc1', amount: 500, type: 'income', date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.monthlyIncome).toBe(5500);
    });

    it('should calculate monthly expenses from recent expense transactions', async () => {
      const data = createEmptyFinancialData();
      const now = new Date();
      data.transactions = [
        { id: '1', accountId: 'acc1', amount: 1000, type: 'expense', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
        { id: '2', accountId: 'acc1', amount: 500, type: 'expense', date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.monthlyExpenses).toBe(1500);
    });

    it('should calculate monthly cash flow as income minus expenses', async () => {
      const data = createEmptyFinancialData();
      const now = new Date();
      data.transactions = [
        { id: '1', accountId: 'acc1', amount: 5000, type: 'income', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
        { id: '2', accountId: 'acc1', amount: 3000, type: 'expense', date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.monthlyIncome).toBe(5000);
      expect(metrics.monthlyExpenses).toBe(3000);
      expect(metrics.monthlyCashFlow).toBe(2000);
    });

    it('should handle negative cash flow', async () => {
      const data = createEmptyFinancialData();
      const now = new Date();
      data.transactions = [
        { id: '1', accountId: 'acc1', amount: 2000, type: 'income', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
        { id: '2', accountId: 'acc1', amount: 5000, type: 'expense', date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.monthlyCashFlow).toBe(-3000);
    });

    it('should exclude transactions older than 30 days', async () => {
      const data = createEmptyFinancialData();
      const now = new Date();
      data.transactions = [
        { id: '1', accountId: 'acc1', amount: 5000, type: 'income', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
        { id: '2', accountId: 'acc1', amount: 10000, type: 'income', date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000) }, // Old
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.monthlyIncome).toBe(5000); // Excludes the 10000
    });

    it('should handle empty transactions', async () => {
      const data = createEmptyFinancialData();
      data.transactions = [];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.monthlyIncome).toBe(0);
      expect(metrics.monthlyExpenses).toBe(0);
      expect(metrics.monthlyCashFlow).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle completely empty financial data', async () => {
      const data = createEmptyFinancialData();

      const metrics = await calculateFinancialMetrics(data);

      expect(metrics.totalAssets).toBe(0);
      expect(metrics.totalLiabilities).toBe(0);
      expect(metrics.netWorth).toBe(0);
      expect(metrics.liquidAssets).toBe(0);
      expect(metrics.monthlyIncome).toBe(0);
      expect(metrics.monthlyExpenses).toBe(0);
      expect(metrics.monthlyCashFlow).toBe(0);
      expect(metrics.investments).toBe(0);
    });

    it('should handle decimal values correctly', async () => {
      const data = createEmptyFinancialData();
      data.manualAssets = [
        { id: '1', name: 'Checking', amount: 1234.56, type: 'Checking Account', currentBalance: 1234.56 },
        { id: '2', name: 'Savings', amount: 5678.90, type: 'Savings Account', currentBalance: 5678.90 },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.totalAssets).toBeCloseTo(6913.46, 2);
    });

    it('should handle large values', async () => {
      const data = createEmptyFinancialData();
      data.realEstateAssets = [{ id: '1', name: 'House', balance: 1500000, type: 'residential' }];
      data.mortgageLiabilities = [{ id: '2', name: 'Mortgage', amount: 1200000, type: 'mortgage' }];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.totalAssets).toBe(1500000);
      expect(metrics.totalLiabilities).toBe(1200000);
      expect(metrics.netWorth).toBe(300000);
    });

    it('should handle assets with currentBalance different from amount', async () => {
      const data = createEmptyFinancialData();
      // currentBalance is what actually counts in the calculation
      data.manualAssets = [
        { id: '1', name: 'Checking', amount: 5000, type: 'Cash', currentBalance: 7500 },
      ];

      const metrics = await calculateFinancialMetrics(data);
      expect(metrics.totalAssets).toBe(7500); // Uses currentBalance
      expect(metrics.liquidAssets).toBe(7500);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should calculate metrics for a typical millennial financial profile', async () => {
      const data = createEmptyFinancialData();
      const now = new Date();

      // Typical millennial setup
      data.plaidAccounts = [
        { id: '1', name: 'Checking', balance: 3500, type: 'depository', accountType: 'depository', subtype: 'checking', institution: 'Chase' },
        { id: '2', name: 'Savings', balance: 8000, type: 'depository', accountType: 'depository', subtype: 'savings', institution: 'Chase' },
        { id: '3', name: '401k', balance: 45000, type: 'investment', accountType: 'investment', institution: 'Fidelity' },
      ];
      data.cryptoAccounts = [
        { id: '4', name: 'Coinbase', balance: 2500, type: 'exchange' },
      ];
      data.manualLiabilities = [
        { id: '5', name: 'Student Loans', amount: 35000, type: 'loan' },
        { id: '6', name: 'Credit Card', amount: 2000, type: 'credit' },
      ];
      data.transactions = [
        { id: 't1', accountId: '1', amount: 5500, type: 'income', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
        { id: 't2', accountId: '1', amount: 1500, type: 'expense', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
        { id: 't3', accountId: '1', amount: 1200, type: 'expense', date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
        { id: 't4', accountId: '1', amount: 800, type: 'expense', date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) },
      ];

      const metrics = await calculateFinancialMetrics(data);

      expect(metrics.totalAssets).toBe(59000); // 3500 + 8000 + 45000 + 2500
      expect(metrics.totalLiabilities).toBe(37000); // 35000 + 2000
      expect(metrics.netWorth).toBe(22000);
      expect(metrics.liquidAssets).toBe(11500); // 3500 + 8000
      expect(metrics.investments).toBe(47500); // 45000 + 2500
      expect(metrics.monthlyIncome).toBe(5500);
      expect(metrics.monthlyExpenses).toBe(3500); // 1500 + 1200 + 800
      expect(metrics.monthlyCashFlow).toBe(2000);
    });

    it('should calculate metrics for a homeowner with mortgage', async () => {
      const data = createEmptyFinancialData();

      data.realEstateAssets = [
        { id: '1', name: 'Primary Home', balance: 450000, type: 'residential' },
      ];
      data.mortgageLiabilities = [
        { id: '2', name: 'Mortgage', amount: 350000, type: 'mortgage' },
      ];
      data.plaidAccounts = [
        { id: '3', name: 'Checking', balance: 10000, type: 'depository', accountType: 'depository', subtype: 'checking', institution: 'Chase' },
      ];

      const metrics = await calculateFinancialMetrics(data);

      expect(metrics.totalAssets).toBe(460000); // 450000 + 10000
      expect(metrics.totalLiabilities).toBe(350000);
      expect(metrics.netWorth).toBe(110000);
    });

    it('should calculate metrics for someone with multi-currency accounts', async () => {
      const data = createEmptyFinancialData();

      // Different account types
      data.plaidAccounts = [
        { id: '1', name: 'US Checking', balance: 5000, type: 'depository', accountType: 'depository', subtype: 'checking', institution: 'Chase' },
      ];
      data.manualAssets = [
        // Israeli Shekel account value in USD
        { id: '2', name: 'Israeli Savings', amount: 10000, type: 'Savings Account', currentBalance: 10000 },
      ];
      data.pensionAssets = [
        { id: '3', name: 'Israeli Pension', balance: 50000, type: 'pension' },
      ];

      const metrics = await calculateFinancialMetrics(data);

      expect(metrics.totalAssets).toBe(65000); // 5000 + 10000 + 50000
      expect(metrics.liquidAssets).toBe(15000); // 5000 + 10000
    });
  });
});

describe('FinancialMetrics Interface', () => {
  it('should return all required metric fields', async () => {
    const data: FinancialData = {
      manualAssets: [],
      manualLiabilities: [],
      plaidAccounts: [],
      cryptoAccounts: [],
      realEstateAssets: [],
      pensionAssets: [],
      mortgageLiabilities: [],
      transactions: [],
    };

    const metrics = await calculateFinancialMetrics(data);

    // Verify all fields exist
    expect(metrics).toHaveProperty('totalAssets');
    expect(metrics).toHaveProperty('totalLiabilities');
    expect(metrics).toHaveProperty('netWorth');
    expect(metrics).toHaveProperty('liquidAssets');
    expect(metrics).toHaveProperty('monthlyIncome');
    expect(metrics).toHaveProperty('monthlyExpenses');
    expect(metrics).toHaveProperty('monthlyCashFlow');
    expect(metrics).toHaveProperty('investments');
  });

  it('should return numeric values for all fields', async () => {
    const data: FinancialData = {
      manualAssets: [{ id: '1', name: 'Cash', amount: 1000, type: 'Cash', currentBalance: 1000 }],
      manualLiabilities: [],
      plaidAccounts: [],
      cryptoAccounts: [],
      realEstateAssets: [],
      pensionAssets: [],
      mortgageLiabilities: [],
      transactions: [],
    };

    const metrics = await calculateFinancialMetrics(data);

    expect(typeof metrics.totalAssets).toBe('number');
    expect(typeof metrics.totalLiabilities).toBe('number');
    expect(typeof metrics.netWorth).toBe('number');
    expect(typeof metrics.liquidAssets).toBe('number');
    expect(typeof metrics.monthlyIncome).toBe('number');
    expect(typeof metrics.monthlyExpenses).toBe('number');
    expect(typeof metrics.monthlyCashFlow).toBe('number');
    expect(typeof metrics.investments).toBe('number');
  });
});
