import { auth } from 'firebase-admin';

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
      const response = await fetch('http://localhost:3000/api/insights', {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('insights');
      expect(data).toHaveProperty('metrics');
      expect(data.metrics).toHaveProperty('netWorth');
      expect(data.metrics).toHaveProperty('totalAssets');
      expect(data.metrics).toHaveProperty('totalLiabilities');
      expect(data.metrics).toHaveProperty('spendingByCategory');
      expect(data.metrics).toHaveProperty('monthlySpending');
    });

    it('should handle unauthorized requests', async () => {
      const response = await fetch('http://localhost:3000/api/insights', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(401);
    });

    it('should handle missing authorization header', async () => {
      const response = await fetch('http://localhost:3000/api/insights');
      expect(response.status).toBe(401);
    });

    it('should handle malformed authorization header', async () => {
      const response = await fetch('http://localhost:3000/api/insights', {
        headers: {
          Authorization: 'InvalidFormat',
        },
      });
      expect(response.status).toBe(401);
    });

    it('should handle server errors gracefully', async () => {
      // Mock a server error scenario
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Server error'));

      const response = await fetch('http://localhost:3000/api/insights', {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      });

      expect(response.status).toBe(500);
    });
  });
});
