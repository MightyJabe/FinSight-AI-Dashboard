import { NextRequest } from 'next/server';
import { GET, HEAD } from '@/app/api/health/route';

describe('Health API Endpoint', () => {
  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const request = new NextRequest('http://localhost:3000/api/health', {
        method: 'GET'
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
      expect(typeof data.timestamp).toBe('string');
    });

    it('should include cache control headers', async () => {
      const response = await GET();
      
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });
  });

  describe('HEAD /api/health', () => {
    it('should respond with 200 status', async () => {
      const response = await HEAD();

      expect(response.status).toBe(200);
      expect(response.body).toBeNull();
    });

    it('should include cache control headers', async () => {
      const response = await HEAD();
      
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });
  });
});