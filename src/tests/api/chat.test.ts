import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/chat/route';
import { DELETE } from '@/app/api/chat/[conversationId]/route';

// Mock Firebase Admin
jest.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: jest.fn().mockResolvedValue({
    uid: 'test-user-id',
    email: 'test@example.com'
  }),
}));

// Mock AI Brain Service
jest.mock('@/lib/ai-brain-service', () => ({
  processUnifiedRequest: jest.fn().mockResolvedValue({
    response: 'Based on your financial data, you spent $500 on dining out last month.',
    type: 'analysis',
    confidence: 90,
    actionItems: ['Consider setting a dining budget of $400', 'Try cooking at home more often']
  }),
}));

// Mock Firestore
const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn((id) => ({
      get: jest.fn().mockResolvedValue({
        exists: id !== 'non-existent',
        id: id,
        data: () => ({
          title: 'Test Conversation',
          userId: 'test-user-id',
          messages: [
            { role: 'user', content: 'How much did I spend on dining?' },
            { role: 'assistant', content: 'You spent $500 on dining out last month.' }
          ],
          updatedAt: new Date(),
          createdAt: new Date()
        })
      }),
      set: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({})
    })),
    where: jest.fn(() => ({
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            docs: [
              {
                id: 'conv_123',
                data: () => ({
                  title: 'Dining Expenses Discussion',
                  userId: 'test-user-id',
                  messageCount: 4,
                  updatedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString()
                })
              },
              {
                id: 'conv_456',
                data: () => ({
                  title: 'Budget Planning Chat',
                  userId: 'test-user-id',
                  messageCount: 2,
                  updatedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString()
                })
              }
            ]
          })
        }))
      }))
    })),
    add: jest.fn().mockResolvedValue({ id: 'new_conv_123' })
  }))
};

jest.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: jest.fn().mockResolvedValue({
    uid: 'test-user-id',
    email: 'test@example.com'
  }),
  firestore: mockFirestore,
}));

describe('Chat API Endpoints', () => {
  const validToken = 'Bearer valid-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/chat', () => {
    it('should return user conversations', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'GET',
        headers: {
          'Authorization': validToken
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.conversations)).toBe(true);
      expect(data.conversations).toHaveLength(2);
      expect(data.conversations[0]).toMatchObject({
        id: 'conv_123',
        title: 'Dining Expenses Discussion',
        messageCount: 4
      });
    });

    it('should return specific conversation when conversationId provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat?conversationId=conv_123', {
        method: 'GET',
        headers: {
          'Authorization': validToken
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messages).toBeDefined();
      expect(Array.isArray(data.messages)).toBe(true);
      expect(data.messages).toHaveLength(2);
    });

    it('should handle non-existent conversation', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat?conversationId=non-existent', {
        method: 'GET',
        headers: {
          'Authorization': validToken
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should reject requests without authorization', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/chat', () => {
    it('should create new conversation and respond to message', async () => {
      const requestBody = {
        message: 'How much did I spend on dining out last month?'
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': validToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.response).toBeDefined();
      expect(typeof data.response).toBe('string');
      expect(data.conversationId).toBeDefined();
    });

    it('should continue existing conversation', async () => {
      const requestBody = {
        message: 'What about groceries?',
        conversationId: 'conv_123',
        history: [
          { role: 'user', content: 'How much did I spend on dining?' },
          { role: 'assistant', content: 'You spent $500 on dining out last month.' }
        ]
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': validToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.response).toBeDefined();
      expect(data.conversationId).toBe('conv_123');
    });

    it('should validate message parameter', async () => {
      const requestBody = {}; // Missing message

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': validToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });

    it('should handle empty message', async () => {
      const requestBody = {
        message: '   ' // Empty/whitespace message
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': validToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });

    it('should handle AI processing errors', async () => {
      const { processUnifiedRequest } = require('@/lib/ai-brain-service');
      processUnifiedRequest.mockRejectedValueOnce(new Error('AI service unavailable'));

      const requestBody = {
        message: 'Test message'
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': validToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('chat response');
    });

    it('should validate history format', async () => {
      const requestBody = {
        message: 'Test message',
        history: [
          { role: 'invalid-role', content: 'Test' } // Invalid role
        ]
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': validToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });
  });

  describe('DELETE /api/chat/[conversationId]', () => {
    it('should delete conversation successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat/conv_123', {
        method: 'DELETE',
        headers: {
          'Authorization': validToken
        }
      });

      const response = await DELETE(request, { params: { conversationId: 'conv_123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted successfully');
    });

    it('should handle non-existent conversation deletion', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat/non-existent', {
        method: 'DELETE',
        headers: {
          'Authorization': validToken
        }
      });

      const response = await DELETE(request, { params: { conversationId: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should reject unauthorized deletion requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat/conv_123', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { conversationId: 'conv_123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should validate conversationId parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat/', {
        method: 'DELETE',
        headers: {
          'Authorization': validToken
        }
      });

      const response = await DELETE(request, { params: { conversationId: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });
  });
});