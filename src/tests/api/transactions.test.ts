import { NextRequest } from 'next/server';

// Mock AI categorization
jest.mock('@/lib/ai-categorization', () => ({
  categorizeTransactionsBatch: jest.fn().mockResolvedValue([
    {
      id: 'txn_123',
      aiCategory: 'Groceries',
      aiConfidence: 95,
      reasoning: 'Grocery store transaction',
      type: 'expense',
      amount: 45.67,
      description: 'WHOLE FOODS',
      date: '2024-01-15',
    },
  ]),
}));

// Mock Firestore
const mockDoc = {
  update: jest.fn().mockResolvedValue({}),
  get: jest.fn().mockResolvedValue({
    exists: true,
    data: () => ({
      id: 'txn_123',
      aiCategory: 'Groceries',
      amount: 45.67,
    }),
  }),
};

const mockCollection = {
  add: jest.fn().mockResolvedValue({ id: 'doc_123' }),
  get: jest.fn().mockResolvedValue({
    docs: [
      {
        id: 'txn_123',
        data: () => ({
          id: 'txn_123',
          aiCategory: 'Groceries',
          amount: 45.67,
          description: 'WHOLE FOODS',
          date: '2024-01-15',
          type: 'expense',
        }),
      },
    ],
  }),
  doc: jest.fn(() => mockDoc),
};

const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      collection: jest.fn(() => mockCollection),
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ overview: { transactions: [] } }),
      }),
      set: jest.fn().mockResolvedValue({}),
    })),
  })),
};

// Mock Firebase Admin
jest.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: jest.fn().mockResolvedValue({
    uid: 'test-user-id',
    email: 'test@example.com',
  }),
  firestore: mockFirestore,
}));

// Import route handlers after mocks
import { POST } from '@/app/api/transactions/categorize/route';
import { GET as getCategorized } from '@/app/api/transactions/categorized/route';
import { POST as updateCategory } from '@/app/api/transactions/update-category/route';
import { GET as getSpendingAnalysis } from '@/app/api/transactions/spending-analysis/route';

describe('Transactions API Endpoints', () => {
  const validToken = 'Bearer valid-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/transactions/categorize', () => {
    it('should categorize transactions successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        headers: {
          Authorization: validToken,
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('transactions categorized');
    });

    it('should reject requests without authorization', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle AI categorization errors gracefully', async () => {
      // Mock categorization to throw error
      const { categorizeTransactionsBatch } = require('@/lib/ai-categorization');
      categorizeTransactionsBatch.mockRejectedValueOnce(new Error('AI service unavailable'));

      const request = new NextRequest('http://localhost:3000/api/transactions/categorize', {
        method: 'POST',
        headers: {
          Authorization: validToken,
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('categorization failed');
    });
  });

  describe('GET /api/transactions/categorized', () => {
    it('should return categorized transactions', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/categorized', {
        method: 'GET',
        headers: {
          Authorization: validToken,
        },
      });

      const response = await getCategorized(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.transactions)).toBe(true);
    });

    it('should reject requests without authorization', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/categorized', {
        method: 'GET',
      });

      const response = await getCategorized(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/transactions/update-category', () => {
    it('should update transaction category successfully', async () => {
      const requestBody = {
        transactionId: 'txn_123',
        category: 'Dining Out',
        confidence: 100,
        reasoning: 'User manual override',
      };

      const request = new NextRequest('http://localhost:3000/api/transactions/update-category', {
        method: 'POST',
        headers: {
          Authorization: validToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await updateCategory(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('updated successfully');
    });

    it('should validate required fields', async () => {
      const requestBody = {
        // Missing transactionId
        category: 'Dining Out',
      };

      const request = new NextRequest('http://localhost:3000/api/transactions/update-category', {
        method: 'POST',
        headers: {
          Authorization: validToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await updateCategory(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });

    it('should handle non-existent transaction', async () => {
      // Mock Firestore to return non-existent document
      mockDoc.get.mockResolvedValueOnce({
        exists: false,
      });

      const requestBody = {
        transactionId: 'non-existent',
        category: 'Dining Out',
        confidence: 100,
        reasoning: 'User manual override',
      };

      const request = new NextRequest('http://localhost:3000/api/transactions/update-category', {
        method: 'POST',
        headers: {
          Authorization: validToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await updateCategory(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
  });

  describe('GET /api/transactions/spending-analysis', () => {
    it('should return spending analysis data', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/spending-analysis', {
        method: 'GET',
        headers: {
          Authorization: validToken,
        },
      });

      const response = await getSpendingAnalysis(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(typeof data.data.totalSpent).toBe('number');
      expect(typeof data.data.totalIncome).toBe('number');
      expect(Array.isArray(data.data.categories)).toBe(true);
    });

    it('should handle empty transaction data', async () => {
      // Mock empty transactions
      mockCollection.get.mockResolvedValueOnce({
        docs: [],
      });

      const request = new NextRequest('http://localhost:3000/api/transactions/spending-analysis', {
        method: 'GET',
        headers: {
          Authorization: validToken,
        },
      });

      const response = await getSpendingAnalysis(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.totalSpent).toBe(0);
      expect(data.data.categories).toHaveLength(0);
    });

    it('should reject requests without authorization', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/spending-analysis', {
        method: 'GET',
      });

      const response = await getSpendingAnalysis(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
