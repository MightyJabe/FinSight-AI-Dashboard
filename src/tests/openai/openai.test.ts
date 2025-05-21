import { generateChatCompletion } from '@/lib/openai';

describe('OpenAI Unit Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('generateChatCompletion', () => {
    it('should generate a chat completion with valid input', async () => {
      const messages = [
        {
          role: 'system' as const,
          content: 'You are a helpful financial assistant. Please provide a brief financial tip.',
        },
      ];

      const response = await generateChatCompletion(messages);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.role).toBe('assistant');
    });

    it('should handle empty messages array', async () => {
      await expect(generateChatCompletion([])).rejects.toThrow();
    });

    it('should handle invalid message format', async () => {
      const invalidMessages = [
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Intentional any for testing invalid role
          role: 'invalid' as any,
          content: 'test',
        },
      ];

      await expect(generateChatCompletion(invalidMessages)).rejects.toThrow();
    });

    it('should use default model when not specified', async () => {
      const messages = [
        {
          role: 'system' as const,
          content: 'test',
        },
      ];

      const response = await generateChatCompletion(messages);
      expect(response).toBeDefined();
    });

    it('should use custom model when specified', async () => {
      const messages = [
        {
          role: 'system' as const,
          content: 'test',
        },
      ];

      const response = await generateChatCompletion(messages, { model: 'gpt-3.5-turbo' });
      expect(response).toBeDefined();
    });
  });
});
