import { NextRequest } from 'next/server';
import { POST as budgetRecommendations } from '@/app/api/budget-recommendations/route';
import { POST as cashFlowForecast } from '@/app/api/cash-flow-forecast/route';
import { POST as investmentAdvisor } from '@/app/api/investment-advisor/route';
import { POST as unifiedAI } from '@/app/api/unified-ai-assistant/route';

// Mock Firebase Admin
jest.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: jest.fn().mockResolvedValue({
    uid: 'test-user-id',
    email: 'test@example.com'
  }),
}));

// Mock AI services
jest.mock('@/lib/budget-recommendations', () => ({
  generateBudgetRecommendations: jest.fn().mockResolvedValue({
    recommendations: [
      {
        category: 'Dining Out',
        currentSpending: 500,
        recommendedBudget: 400,
        potentialSavings: 100,
        priority: 'high'
      }
    ],
    totalPotentialSavings: 100,
    budgetHealthScore: 75
  }),
}));

jest.mock('@/lib/cash-flow-forecasting', () => ({
  generateCashFlowForecast: jest.fn().mockResolvedValue({
    projections: [
      {
        month: '2024-02',
        projectedIncome: 5000,
        projectedExpenses: 4200,
        netCashFlow: 800,
        confidence: 85
      }
    ],
    insights: ['Your cash flow looks stable for the next 6 months'],
    riskFactors: [],
    forecastAccuracy: 85
  }),
}));

jest.mock('@/lib/investment-advisor', () => ({
  generateInvestmentAdvice: jest.fn().mockResolvedValue({
    riskProfile: 'moderate',
    recommendations: [
      {
        type: 'ETF',
        allocation: 60,
        reasoning: 'Diversified growth potential'
      }
    ],
    portfolioAnalysis: {
      currentAllocation: {},
      suggestedRebalancing: []
    }
  }),
}));

jest.mock('@/lib/ai-brain-service', () => ({
  processUnifiedRequest: jest.fn().mockResolvedValue({
    response: 'Based on your financial data, here are some insights...',
    type: 'analysis',
    confidence: 90,
    actionItems: ['Review your dining budget', 'Consider increasing savings']
  }),
}));

// Mock Firestore
const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          overview: {
            transactions: [
              {
                id: 'txn_123',
                amount: 45.67,
                category: ['Groceries'],
                date: '2024-01-15'
              }
            ],
            accounts: [
              {
                account_id: 'acc_123',
                balances: { current: 1000 },
                name: 'Checking'
              }
            ]
          }
        })
      }),
      collection: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          docs: [{
            data: () => ({
              aiCategory: 'Groceries',
              amount: 45.67,
              type: 'expense'
            })
          }]
        })
      }))
    }))
  }))
};

jest.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: jest.fn().mockResolvedValue({
    uid: 'test-user-id',
    email: 'test@example.com'
  }),
  firestore: mockFirestore,
}));

describe('AI Features API Endpoints', () => {
  const validToken = 'Bearer valid-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/budget-recommendations', () => {
    it('should generate budget recommendations successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/budget-recommendations', {
        method: 'POST',
        headers: {
          'Authorization': validToken,
          'Content-Type': 'application/json'
        }
      });

      const response = await budgetRecommendations(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.recommendations).toBeDefined();
      expect(Array.isArray(data.recommendations.recommendations)).toBe(true);
      expect(typeof data.recommendations.totalPotentialSavings).toBe('number');
      expect(typeof data.recommendations.budgetHealthScore).toBe('number');
    });

    it('should reject requests without authorization', async () => {
      const request = new NextRequest('http://localhost:3000/api/budget-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await budgetRecommendations(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle AI service errors', async () => {
      const { generateBudgetRecommendations } = require('@/lib/budget-recommendations');
      generateBudgetRecommendations.mockRejectedValueOnce(new Error('AI service unavailable'));

      const request = new NextRequest('http://localhost:3000/api/budget-recommendations', {
        method: 'POST',
        headers: {
          'Authorization': validToken,
          'Content-Type': 'application/json'
        }
      });

      const response = await budgetRecommendations(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('budget recommendations');
    });
  });

  describe('POST /api/cash-flow-forecast', () => {
    it('should generate cash flow forecast successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/cash-flow-forecast', {
        method: 'POST',
        headers: {
          'Authorization': validToken,
          'Content-Type': 'application/json'
        }
      });

      const response = await cashFlowForecast(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.forecast).toBeDefined();
      expect(Array.isArray(data.forecast.projections)).toBe(true);
      expect(Array.isArray(data.forecast.insights)).toBe(true);
      expect(typeof data.forecast.forecastAccuracy).toBe('number');
    });

    it('should handle insufficient data gracefully', async () => {
      // Mock empty user data
      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ overview: { transactions: [], accounts: [] } })
      });

      const request = new NextRequest('http://localhost:3000/api/cash-flow-forecast', {
        method: 'POST',
        headers: {
          'Authorization': validToken,
          'Content-Type': 'application/json'
        }
      });

      const response = await cashFlowForecast(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should still return a forecast, even with limited data
      expect(data.forecast).toBeDefined();
    });
  });

  describe('POST /api/investment-advisor', () => {
    it('should generate investment advice successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/investment-advisor', {
        method: 'POST',
        headers: {
          'Authorization': validToken,
          'Content-Type': 'application/json'
        }
      });

      const response = await investmentAdvisor(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.advice).toBeDefined();
      expect(data.advice.riskProfile).toBeDefined();
      expect(Array.isArray(data.advice.recommendations)).toBe(true);
      expect(data.advice.portfolioAnalysis).toBeDefined();
    });

    it('should validate risk tolerance parameter', async () => {
      const requestBody = {
        riskTolerance: 'invalid-risk-level'
      };

      const request = new NextRequest('http://localhost:3000/api/investment-advisor', {
        method: 'POST',
        headers: {
          'Authorization': validToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await investmentAdvisor(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });
  });

  describe('POST /api/unified-ai-assistant', () => {
    it('should process natural language queries successfully', async () => {
      const requestBody = {
        message: 'How much did I spend on dining out last month?'
      };

      const request = new NextRequest('http://localhost:3000/api/unified-ai-assistant', {
        method: 'POST',
        headers: {
          'Authorization': validToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await unifiedAI(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.response).toBeDefined();
      expect(typeof data.response.response).toBe('string');
      expect(data.response.type).toBeDefined();
      expect(typeof data.response.confidence).toBe('number');
    });

    it('should validate message parameter', async () => {
      const requestBody = {}; // Missing message

      const request = new NextRequest('http://localhost:3000/api/unified-ai-assistant', {
        method: 'POST',
        headers: {
          'Authorization': validToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await unifiedAI(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });

    it('should handle context parameters', async () => {
      const requestBody = {
        message: 'What can I do to improve my budget?',
        context: {
          timeframe: 'last_3_months',
          focusArea: 'expense_reduction'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/unified-ai-assistant', {
        method: 'POST',
        headers: {
          'Authorization': validToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await unifiedAI(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.response).toBeDefined();
      expect(Array.isArray(data.response.actionItems)).toBe(true);
    });

    it('should handle AI processing errors', async () => {
      const { processUnifiedRequest } = require('@/lib/ai-brain-service');
      processUnifiedRequest.mockRejectedValueOnce(new Error('AI processing failed'));

      const requestBody = {
        message: 'Test query'
      };

      const request = new NextRequest('http://localhost:3000/api/unified-ai-assistant', {
        method: 'POST',
        headers: {
          'Authorization': validToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await unifiedAI(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('AI assistant');
    });
  });
});