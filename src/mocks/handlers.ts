import { http, HttpResponse } from 'msw';

export const handlers = [
  // OpenAI API mock
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              category: 'Food & Dining',
              confidence: 95,
              reasoning: 'Transaction at Starbucks, clearly a food purchase',
            }),
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
    });
  }),

  // Plaid API mocks (fallback if direct mock doesn't work)
  http.post('https://sandbox.plaid.com/link/token/create', () => {
    return HttpResponse.json({
      link_token: 'link-sandbox-test-token',
      expiration: '2025-01-18T12:00:00Z',
      request_id: 'test-request',
    });
  }),

  http.post('https://sandbox.plaid.com/item/public_token/exchange', () => {
    return HttpResponse.json({
      access_token: 'access-sandbox-test-token',
      item_id: 'test-item-id',
      request_id: 'test-request',
    });
  }),
];
