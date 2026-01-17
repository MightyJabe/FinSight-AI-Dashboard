import { NextResponse } from 'next/server';

// Mock dependencies BEFORE imports
jest.mock('@/lib/auth-server');
jest.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: jest.fn(),
    batch: jest.fn(),
  },
}));
jest.mock('@/lib/ai-categorization');
jest.mock('@/lib/plaid');
jest.mock('@/lib/plaid-token-helper');
jest.mock('@/lib/logger');

import { POST, GET } from '../route';
import * as aiCategorization from '@/lib/ai-categorization';
import * as authServer from '@/lib/auth-server';
import { adminDb } from '@/lib/firebase-admin';
import * as plaid from '@/lib/plaid';
import * as plaidTokenHelper from '@/lib/plaid-token-helper';

describe('POST /api/transactions/categorize', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Default auth mock - successful authentication
    (authServer.validateAuthToken as jest.Mock).mockResolvedValue({
      userId: mockUserId,
      error: null,
    });

    // Reset categorization mock to default behavior
    (aiCategorization.categorizeTransactionsBatch as jest.Mock).mockResolvedValue([]);
  });

  describe('Authentication', () => {
    it('should return error if authentication fails', async () => {
      const mockError = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      (authServer.validateAuthToken as jest.Mock).mockResolvedValue({
        userId: null,
        error: mockError,
      });

      const request = new Request('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        body: JSON.stringify({ transactions: [] }),
      });

      const response = await POST(request);

      expect(response).toBe(mockError);
    });

    it('should proceed with valid authentication', async () => {
      const transactions = [
        {
          id: 'txn-1',
          amount: 50,
          description: 'Test',
          date: '2024-01-15',
        },
      ];

      const request = new Request('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        body: JSON.stringify({ transactions }),
      });

      // Mock categorization
      (aiCategorization.categorizeTransactionsBatch as jest.Mock).mockResolvedValue([
        {
          ...transactions[0],
          aiCategory: 'Food',
          aiConfidence: 0.9,
          reasoning: 'Test',
          type: 'expense',
        },
      ]);

      // Mock batch operations
      const mockBatch = { set: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      (adminDb.batch as jest.Mock).mockReturnValue(mockBatch);

      // Mock Firestore doc/collection chain
      const mockDoc = jest.fn().mockReturnValue({});
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({ collection: mockCollection }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(authServer.validateAuthToken).toHaveBeenCalledWith(request);
      expect(data.success).toBe(true);
    });
  });

  describe('Input Validation', () => {
    it('should accept valid transactions array', async () => {
      const validTransactions = [
        {
          id: 'txn-1',
          amount: 50.00,
          description: 'Test transaction',
          date: '2024-01-15',
        },
      ];

      const request = new Request('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        body: JSON.stringify({ transactions: validTransactions }),
      });

      // Mock categorization
      (aiCategorization.categorizeTransactionsBatch as jest.Mock).mockResolvedValue([
        {
          ...validTransactions[0],
          aiCategory: 'Food',
          aiConfidence: 0.9,
          reasoning: 'Test',
          type: 'expense',
        },
      ]);

      // Mock batch operations
      const mockBatch = { set: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      (adminDb.batch as jest.Mock).mockReturnValue(mockBatch);

      // Mock Firestore collection/doc chain
      const mockDoc = jest.fn().mockReturnValue({ set: jest.fn() });
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({ collection: mockCollection }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject invalid input - missing required fields', async () => {
      const invalidTransactions = [
        {
          id: 'txn-1',
          // Missing amount, description, date
        },
      ];

      const request = new Request('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        body: JSON.stringify({ transactions: invalidTransactions }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });

    it('should reject invalid amount type', async () => {
      const invalidTransactions = [
        {
          id: 'txn-1',
          amount: 'not-a-number',
          description: 'Test',
          date: '2024-01-15',
        },
      ];

      const request = new Request('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        body: JSON.stringify({ transactions: invalidTransactions }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should accept optional fields', async () => {
      const validTransactions = [
        {
          id: 'txn-1',
          amount: 50.00,
          description: 'Test',
          date: '2024-01-15',
          originalCategory: ['Food', 'Dining'],
          merchant_name: 'Test Restaurant',
          payment_channel: 'in store',
        },
      ];

      const request = new Request('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        body: JSON.stringify({ transactions: validTransactions }),
      });

      // Mock categorization
      (aiCategorization.categorizeTransactionsBatch as jest.Mock).mockResolvedValue([
        { ...validTransactions[0], aiCategory: 'Food', aiConfidence: 0.9, reasoning: 'Test', type: 'expense' },
      ]);

      // Mock batch
      const mockBatch = { set: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      (adminDb.batch as jest.Mock).mockReturnValue(mockBatch);

      const mockDoc = jest.fn().mockReturnValue({});
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({ collection: mockCollection }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Direct Transaction Processing', () => {
    it('should categorize provided transactions', async () => {
      const transactions = [
        {
          id: 'txn-1',
          amount: 50.00,
          description: 'Grocery Store',
          date: '2024-01-15',
        },
        {
          id: 'txn-2',
          amount: 25.50,
          description: 'Coffee Shop',
          date: '2024-01-16',
        },
      ];

      const request = new Request('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        body: JSON.stringify({ transactions }),
      });

      const categorizedResults = transactions.map(t => ({
        ...t,
        aiCategory: 'Food',
        aiConfidence: 0.9,
        reasoning: 'Food purchase',
        type: 'expense',
      }));

      (aiCategorization.categorizeTransactionsBatch as jest.Mock).mockResolvedValue(categorizedResults);

      // Mock batch
      const mockBatch = { set: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      (adminDb.batch as jest.Mock).mockReturnValue(mockBatch);

      const mockDoc = jest.fn().mockReturnValue({});
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({ collection: mockCollection }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(aiCategorization.categorizeTransactionsBatch).toHaveBeenCalledWith(transactions);
      expect(data.success).toBe(true);
      expect(data.data.categorizedTransactions).toHaveLength(2);
      expect(data.data.summary.total).toBe(2);
      expect(data.data.summary.categorized).toBe(2);
    });

    it('should return empty result for empty transaction array', async () => {
      const request = new Request('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        body: JSON.stringify({ transactions: [] }),
      });

      // Empty array causes route to check Plaid/Firestore, so mock them
      (plaidTokenHelper.getPlaidAccessToken as jest.Mock).mockResolvedValue(null);

      // Mock empty Firestore response
      const mockEmptyDocs = { empty: true, docs: [] };
      const mockGet = jest.fn().mockResolvedValue(mockEmptyDocs);
      const mockCollection = jest.fn().mockReturnValue({ get: mockGet });
      const mockDoc = jest.fn().mockReturnValue({ collection: mockCollection });
      (adminDb.collection as jest.Mock).mockReturnValue({ doc: mockDoc });

      const response = await POST(request);
      const data = await response.json();

      // API returns success with empty data when no transactions found
      expect(data).toEqual({
        success: true,
        data: {
          categorizedTransactions: [],
          summary: {
            total: 0,
            categorized: 0,
            failed: 0,
          },
        },
      });
    });
  });

  describe('Fetching from Plaid and Firestore', () => {
    it('should fetch transactions from Plaid when no transactions provided', async () => {
      const request = new Request('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const mockAccessToken = 'access-token-123';
      const mockPlaidTransactions = [
        {
          transaction_id: 'plaid-txn-1',
          amount: 50.00,
          name: 'Store Purchase',
          date: '2024-01-15',
          category: ['Shopping'],
          merchant_name: 'Test Store',
          payment_channel: 'in store',
          account_id: 'acc-1',
        },
      ];

      (plaidTokenHelper.getPlaidAccessToken as jest.Mock).mockResolvedValue(mockAccessToken);
      (plaid.getTransactions as jest.Mock).mockResolvedValue(mockPlaidTransactions);

      // Mock Firestore manual transactions
      const mockManualDocs = {
        empty: true,
        docs: [],
      };
      const mockGet = jest.fn().mockResolvedValue(mockManualDocs);
      const mockCollection = jest.fn().mockReturnValue({ get: mockGet });
      const mockDoc = jest.fn().mockReturnValue({ collection: mockCollection });
      (adminDb.collection as jest.Mock).mockReturnValue({ doc: mockDoc });

      // Mock categorization
      (aiCategorization.categorizeTransactionsBatch as jest.Mock).mockResolvedValue([
        {
          id: 'plaid-txn-1',
          amount: 50.00,
          description: 'Store Purchase',
          date: '2024-01-15',
          aiCategory: 'Shopping',
          aiConfidence: 0.95,
          reasoning: 'Purchase at store',
          type: 'expense',
        },
      ]);

      // Mock batch
      const mockBatch = { set: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      (adminDb.batch as jest.Mock).mockReturnValue(mockBatch);

      const response = await POST(request);
      const data = await response.json();

      expect(plaidTokenHelper.getPlaidAccessToken).toHaveBeenCalledWith(mockUserId);
      expect(plaid.getTransactions).toHaveBeenCalled();
      expect(data.success).toBe(true);
      expect(data.data.categorizedTransactions).toHaveLength(1);
    });

    it('should fetch manual transactions from Firestore', async () => {
      const request = new Request('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      // No Plaid token
      (plaidTokenHelper.getPlaidAccessToken as jest.Mock).mockResolvedValue(null);

      // Mock Firestore manual transactions
      const mockManualDocs = {
        empty: false,
        docs: [
          {
            id: 'manual-1',
            data: () => ({
              type: 'expense',
              amount: 100,
              description: 'Manual Transaction',
              date: '2024-01-15',
              category: 'Shopping',
            }),
          },
        ],
      };

      const mockGet = jest.fn().mockResolvedValue(mockManualDocs);
      const mockCollectionChain = jest.fn().mockReturnValue({ get: mockGet });
      const mockDocChain = jest.fn().mockReturnValue({ collection: mockCollectionChain });
      (adminDb.collection as jest.Mock).mockReturnValue({ doc: mockDocChain });

      // Mock categorization
      (aiCategorization.categorizeTransactionsBatch as jest.Mock).mockResolvedValue([
        {
          id: 'manual-1',
          amount: 100,
          description: 'Manual Transaction',
          date: '2024-01-15',
          aiCategory: 'Shopping',
          aiConfidence: 0.85,
          reasoning: 'Manual shopping entry',
          type: 'expense',
        },
      ]);

      // Mock batch
      const mockBatch = { set: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      (adminDb.batch as jest.Mock).mockReturnValue(mockBatch);

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.categorizedTransactions).toHaveLength(1);
    });

    it('should combine Plaid and manual transactions', async () => {
      const request = new Request('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      // Mock Plaid
      const mockAccessToken = 'access-token-123';
      const mockPlaidTransactions = [
        {
          transaction_id: 'plaid-1',
          amount: 50,
          name: 'Store',
          date: '2024-01-15',
          account_id: 'acc-1',
        },
      ];

      (plaidTokenHelper.getPlaidAccessToken as jest.Mock).mockResolvedValue(mockAccessToken);
      (plaid.getTransactions as jest.Mock).mockResolvedValue(mockPlaidTransactions);

      // Mock Firestore
      const mockManualDocs = {
        empty: false,
        docs: [
          {
            id: 'manual-1',
            data: () => ({
              type: 'income',
              amount: 1000,
              description: 'Salary',
              date: '2024-01-15',
            }),
          },
        ],
      };

      const mockGet = jest.fn().mockResolvedValue(mockManualDocs);
      const mockCollectionChain = jest.fn().mockReturnValue({ get: mockGet });
      const mockDocChain = jest.fn().mockReturnValue({ collection: mockCollectionChain });
      (adminDb.collection as jest.Mock).mockReturnValue({ doc: mockDocChain });

      // Mock categorization - should process both transactions
      (aiCategorization.categorizeTransactionsBatch as jest.Mock).mockResolvedValue([
        {
          id: 'plaid-1',
          amount: 50,
          description: 'Store',
          date: '2024-01-15',
          aiCategory: 'Shopping',
          aiConfidence: 0.9,
          reasoning: 'Store purchase',
          type: 'expense',
        },
        {
          id: 'manual-1',
          amount: -1000,
          description: 'Salary',
          date: '2024-01-15',
          aiCategory: 'Income',
          aiConfidence: 0.95,
          reasoning: 'Salary payment',
          type: 'income',
        },
      ]);

      // Mock batch
      const mockBatch = { set: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      (adminDb.batch as jest.Mock).mockReturnValue(mockBatch);

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.categorizedTransactions).toHaveLength(2);
      expect(data.data.summary.total).toBe(2);
    });
  });

  describe('Date Filtering', () => {
    it('should filter transactions by startDate and endDate', async () => {
      const request = new Request('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        body: JSON.stringify({
          startDate: '2024-01-10',
          endDate: '2024-01-20',
        }),
      });

      // Mock Plaid with date range
      const mockAccessToken = 'access-token-123';
      (plaidTokenHelper.getPlaidAccessToken as jest.Mock).mockResolvedValue(mockAccessToken);
      (plaid.getTransactions as jest.Mock).mockResolvedValue([]);

      // Mock Firestore
      const mockManualDocs = { empty: true, docs: [] };
      const mockGet = jest.fn().mockResolvedValue(mockManualDocs);
      const mockCollectionChain = jest.fn().mockReturnValue({ get: mockGet });
      const mockDocChain = jest.fn().mockReturnValue({ collection: mockCollectionChain });
      (adminDb.collection as jest.Mock).mockReturnValue({ doc: mockDocChain });

      const response = await POST(request);

      // Verify Plaid was called with date parameters
      expect(plaid.getTransactions).toHaveBeenCalledWith(
        mockAccessToken,
        '2024-01-10',
        '2024-01-20'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle Plaid fetch errors gracefully', async () => {
      const request = new Request('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const mockAccessToken = 'access-token-123';
      (plaidTokenHelper.getPlaidAccessToken as jest.Mock).mockResolvedValue(mockAccessToken);
      (plaid.getTransactions as jest.Mock).mockRejectedValue(new Error('Plaid API error'));

      // Mock Firestore
      const mockManualDocs = { empty: true, docs: [] };
      const mockGet = jest.fn().mockResolvedValue(mockManualDocs);
      const mockCollectionChain = jest.fn().mockReturnValue({ get: mockGet });
      const mockDocChain = jest.fn().mockReturnValue({ collection: mockCollectionChain });
      (adminDb.collection as jest.Mock).mockReturnValue({ doc: mockDocChain });

      const response = await POST(request);
      const data = await response.json();

      // Should continue with manual transactions
      expect(data.success).toBe(true);
    });

    it('should return 500 for unexpected errors', async () => {
      const transactions = [
        {
          id: 'txn-1',
          amount: 50,
          description: 'Test',
          date: '2024-01-15',
        },
      ];

      const request = new Request('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        body: JSON.stringify({ transactions }),
      });

      // Make AI categorization throw
      (aiCategorization.categorizeTransactionsBatch as jest.Mock).mockRejectedValueOnce(
        new Error('AI service down')
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Firestore Storage', () => {
    it('should store categorized transactions in Firestore', async () => {
      const transactions = [
        {
          id: 'txn-1',
          amount: 50,
          description: 'Test',
          date: '2024-01-15',
        },
      ];

      const request = new Request('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        body: JSON.stringify({ transactions }),
      });

      const categorizedResult = {
        ...transactions[0],
        aiCategory: 'Food',
        aiConfidence: 0.9,
        reasoning: 'Food purchase',
        type: 'expense',
        originalCategory: undefined,
      };

      (aiCategorization.categorizeTransactionsBatch as jest.Mock).mockResolvedValue([categorizedResult]);

      // Mock batch
      const mockSet = jest.fn();
      const mockCommit = jest.fn().mockResolvedValue(undefined);
      const mockBatch = { set: mockSet, commit: mockCommit };
      (adminDb.batch as jest.Mock).mockReturnValue(mockBatch);

      // Mock doc ref
      const mockDocRef = { path: 'users/test-user-123/categorizedTransactions/txn-1' };
      const mockDoc = jest.fn().mockReturnValue(mockDocRef);
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({ collection: mockCollection }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(mockSet).toHaveBeenCalled();
      expect(mockCommit).toHaveBeenCalled();
      expect(data.success).toBe(true);
      expect(data.data.summary.categorized).toBe(1);
    });
  });
});

describe('GET /api/transactions/categorize', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Default auth mock
    (authServer.validateAuthToken as jest.Mock).mockResolvedValue({
      userId: mockUserId,
      error: null,
    });
  });

  describe('Authentication', () => {
    it('should return error if authentication fails', async () => {
      const mockError = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      (authServer.validateAuthToken as jest.Mock).mockResolvedValue({
        userId: null,
        error: mockError,
      });

      const request = new Request('http://localhost:3000/api/transactions/categorize');

      const response = await GET(request);

      expect(response).toBe(mockError);
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate categorization statistics correctly', async () => {
      const request = new Request('http://localhost:3000/api/transactions/categorize', {
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      // Mock Plaid API response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          transactions: [{ id: '1' }, { id: '2' }, { id: '3' }],
        }),
      });

      // Mock Firestore - manual transactions (2 docs)
      const mockManualDocs = {
        size: 2,
        empty: false,
      };

      // Mock Firestore - categorized transactions (3 docs)
      const mockCategorizedDocs = {
        empty: false,
        docs: [
          { id: '1', data: () => ({ originalTransactionId: '1' }) },
          { id: '2', data: () => ({ originalTransactionId: '2' }) },
          { id: 'manual-1', data: () => ({ originalTransactionId: 'manual-1' }) },
        ],
      };

      const mockGet = jest
        .fn()
        .mockResolvedValueOnce(mockManualDocs)
        .mockResolvedValueOnce(mockCategorizedDocs);

      const mockCollection = jest.fn().mockReturnValue({ get: mockGet });
      const mockDoc = jest.fn().mockReturnValue({ collection: mockCollection });
      (adminDb.collection as jest.Mock).mockReturnValue({ doc: mockDoc });

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.total).toBe(5); // 3 from Plaid + 2 manual
      expect(data.data.categorized).toBe(3);
      expect(data.data.uncategorized).toBe(2);
      expect(data.data.percentage).toBe(60); // 3/5 = 60%
    });

    it('should handle zero transactions', async () => {
      const request = new Request('http://localhost:3000/api/transactions/categorize');

      // Mock empty Plaid response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ transactions: [] }),
      });

      // Mock empty Firestore
      const mockEmptyDocs = { size: 0, empty: true, docs: [] };
      const mockGet = jest.fn().mockResolvedValue(mockEmptyDocs);
      const mockCollection = jest.fn().mockReturnValue({ get: mockGet });
      const mockDoc = jest.fn().mockReturnValue({ collection: mockCollection });
      (adminDb.collection as jest.Mock).mockReturnValue({ doc: mockDoc });

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.total).toBe(0);
      expect(data.data.categorized).toBe(0);
      expect(data.data.percentage).toBe(0);
    });

    it('should handle failed Plaid fetch', async () => {
      const request = new Request('http://localhost:3000/api/transactions/categorize');

      // Mock failed Plaid response
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      // Mock Firestore - manual transactions only
      const mockManualDocs = { size: 5, empty: false };
      const mockCategorizedDocs = {
        empty: false,
        docs: [
          { id: '1', data: () => ({ originalTransactionId: '1' }) },
          { id: '2', data: () => ({ originalTransactionId: '2' }) },
        ],
      };

      const mockGet = jest
        .fn()
        .mockResolvedValueOnce(mockManualDocs)
        .mockResolvedValueOnce(mockCategorizedDocs);

      const mockCollection = jest.fn().mockReturnValue({ get: mockGet });
      const mockDoc = jest.fn().mockReturnValue({ collection: mockCollection });
      (adminDb.collection as jest.Mock).mockReturnValue({ doc: mockDoc });

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.total).toBe(5); // Only manual transactions
      expect(data.data.categorized).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 for unexpected errors', async () => {
      const request = new Request('http://localhost:3000/api/transactions/categorize');

      // Make fetch throw
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });
});
