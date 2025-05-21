import { OpenAI } from 'openai';

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for testing in JSDOM environment
});

describe('OpenAI Integration Tests', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    jest.clearAllMocks();
    jest.spyOn(openai.chat.completions, 'create').mockResolvedValue({
      id: 'cmpl-test',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'Test insight',
            refusal: null,
          },
          finish_reason: 'stop',
          index: 0,
          logprobs: null,
        },
      ],
    });
  });

  it('should generate insights from financial data', async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a financial advisor.',
        },
        {
          role: 'user',
          content: 'Analyze my spending patterns.',
        },
      ],
    });

    expect(response.choices[0].message.content).toBe('Test insight');
  });

  it('should handle API errors gracefully', async () => {
    jest
      .spyOn(openai.chat.completions, 'create')
      .mockRejectedValueOnce(new Error('Too Many Requests'));
    await expect(
      openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a financial advisor.',
          },
          {
            role: 'user',
            content: 'Analyze my spending patterns.',
          },
        ],
      })
    ).rejects.toThrow('Too Many Requests');
  });
});
