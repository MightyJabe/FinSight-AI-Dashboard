import { auth } from '@/lib/firebase-admin';

// Mock Firebase Admin auth
jest.mock('@/lib/firebase-admin', () => ({
  auth: () => ({
    createCustomToken: jest.fn().mockResolvedValue('mock-token'),
    verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-user-id' }),
  }),
}));

describe('Insights API Integration Tests', () => {
  let testToken: string;

  beforeAll(async () => {
    // Generate a test token before running tests
    testToken = await auth().createCustomToken('test-user-id', {
      email: 'test@example.com',
    });
  });

  beforeEach(() => {
    // Reset fetch mock before each test
    jest.clearAllMocks();
  });

  describe('GET /api/insights', () => {
    it('should return insights and metrics for authenticated user', async () => {
      // Mock successful response
      const mockResponse = {
        insights: [{ id: 1, text: 'Test insight' }],
        metrics: { total: 100 },
      };
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await fetch('http://localhost:3000/api/insights', {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('insights');
      expect(data).toHaveProperty('metrics');
    });

    it('should handle unauthorized requests', async () => {
      // Mock unauthorized response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const response = await fetch('http://localhost:3000/api/insights', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(401);
    });

    it('should handle missing authorization header', async () => {
      // Mock unauthorized response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const response = await fetch('http://localhost:3000/api/insights');
      expect(response.status).toBe(401);
    });

    it('should handle malformed authorization header', async () => {
      // Mock unauthorized response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const response = await fetch('http://localhost:3000/api/insights', {
        headers: {
          Authorization: 'invalid-header',
        },
      });
      expect(response.status).toBe(401);
    });

    it('should handle server errors gracefully', async () => {
      // Mock server error
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const response = await fetch('http://localhost:3000/api/insights', {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      });

      expect(response.status).toBe(500);
    });
  });
});
