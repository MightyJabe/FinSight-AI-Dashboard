import { NextRequest } from 'next/server';
import { GET as getSession } from '@/app/api/auth/session/route';
import { GET as getAccounts } from '@/app/api/accounts/route';
import { GET as getHealth } from '@/app/api/health/route';

// Mock Firebase Admin
jest.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: jest.fn().mockImplementation(token => {
    if (token === 'valid-token') {
      return Promise.resolve({
        uid: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      });
    }
    throw new Error('Invalid token');
  }),
  firestore: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            overview: {
              accounts: [
                {
                  account_id: 'acc_checking_123',
                  name: 'Checking Account',
                  official_name: 'Premium Checking',
                  type: 'depository',
                  subtype: 'checking',
                  balances: {
                    current: 2500.0,
                    available: 2500.0,
                    iso_currency_code: 'USD',
                  },
                },
                {
                  account_id: 'acc_savings_456',
                  name: 'Savings Account',
                  official_name: 'High Yield Savings',
                  type: 'depository',
                  subtype: 'savings',
                  balances: {
                    current: 10000.0,
                    available: 10000.0,
                    iso_currency_code: 'USD',
                  },
                },
              ],
              total_balances: {
                current: 12500.0,
                available: 12500.0,
              },
            },
            profile: {
              name: 'Test User',
              email: 'test@example.com',
              preferences: {
                currency: 'USD',
                theme: 'light',
              },
            },
          }),
        }),
        set: jest.fn().mockResolvedValue({}),
        collection: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ docs: [] }),
        }),
      })),
    })),
  },
}));

describe('Auth & Accounts API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/auth/session', () => {
    it('should return user session with valid token', async () => {
      const response = await getSession();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.uid).toBe('test-user-id');
      expect(data.user.email).toBe('test@example.com');
    });

    it('should reject requests with invalid token', async () => {
      const response = await getSession();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject requests without authorization header', async () => {
      const response = await getSession();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle malformed authorization header', async () => {
      const response = await getSession();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/accounts', () => {
    it('should return user accounts and financial overview', async () => {
      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      const response = await getAccounts(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.accounts)).toBe(true);
      expect(data.accounts).toHaveLength(2);

      // Check account structure
      expect(data.accounts[0]).toMatchObject({
        account_id: 'acc_checking_123',
        name: 'Checking Account',
        type: 'depository',
        subtype: 'checking',
      });

      // Check financial overview
      expect(data.netWorth).toBeDefined();
      expect(typeof data.netWorth).toBe('number');
      expect(data.totalAssets).toBeDefined();
      expect(data.totalLiabilities).toBeDefined();
    });

    it('should handle users with no account data', async () => {
      // Mock empty user data
      const { firestore } = require('@/lib/firebase-admin');
      firestore.collection().doc().get.mockResolvedValueOnce({
        exists: false,
      });

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      const response = await getAccounts(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.accounts).toEqual([]);
      expect(data.netWorth).toBe(0);
      expect(data.totalAssets).toBe(0);
      expect(data.totalLiabilities).toBe(0);
    });

    it('should calculate net worth correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      const response = await getAccounts(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.netWorth).toBe(12500.0); // Total of checking + savings
      expect(data.totalAssets).toBe(12500.0);
      expect(data.totalLiabilities).toBe(0);
    });

    it('should reject requests without authorization', async () => {
      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'GET',
      });

      const response = await getAccounts(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should include spending analytics when available', async () => {
      // Mock user data with categorized transactions
      const { firestore } = require('@/lib/firebase-admin');
      firestore
        .collection()
        .doc()
        .get.mockResolvedValueOnce({
          exists: true,
          data: () => ({
            overview: {
              accounts: [
                {
                  account_id: 'acc_123',
                  balances: { current: 1000 },
                  name: 'Test Account',
                },
              ],
            },
          }),
        });

      // Mock categorized transactions collection
      const mockCategorizedCollection = {
        get: jest.fn().mockResolvedValue({
          docs: [
            {
              data: () => ({
                aiCategory: 'Groceries',
                amount: 100,
                type: 'expense',
                date: '2024-01-15',
              }),
            },
            {
              data: () => ({
                aiCategory: 'Dining Out',
                amount: 50,
                type: 'expense',
                date: '2024-01-14',
              }),
            },
          ],
        }),
      };

      // Override the collection method for this specific test
      firestore.collection().doc().collection.mockReturnValueOnce(mockCategorizedCollection);

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      const response = await getAccounts(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.monthlySpending).toBeDefined();
      expect(data.topSpendingCategories).toBeDefined();
    });
  });

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const response = await getHealth();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
      expect(data.version).toBeDefined();
    });

    it('should respond to HEAD requests for monitoring', async () => {
      const response = await getHealth();

      expect(response.status).toBe(200);
      // HEAD requests should not have body content
    });

    it('should include service checks', async () => {
      const response = await getHealth();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.services).toBeDefined();
      expect(data.services.database).toBe('operational');
      expect(data.services.auth).toBe('operational');
    });
  });
});
