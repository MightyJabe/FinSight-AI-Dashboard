import OpenAI from 'openai';

import { getConfig } from './config';

const { openai: openaiEnvVars } = getConfig();

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: openaiEnvVars.apiKey,
});

// Type for chat completion response
export type ChatCompletionResponse = {
  content: string;
  role: 'assistant' | 'user' | 'system';
};

// Configuration options for OpenAI
export type OpenAIConfig = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
};

/**
 * Generate a chat completion using OpenAI's API
 * @param messages Array of message objects with role and content
 * @param config Optional configuration for OpenAI parameters
 * @returns The assistant's response
 */
export async function generateChatCompletion(
  messages: { role: 'assistant' | 'user' | 'system'; content: string }[],
  config: OpenAIConfig = {}
): Promise<ChatCompletionResponse> {
  try {
    if (!openaiEnvVars.apiKey) {
      console.warn('OpenAI API key is missing. Using fallback response.');
      return {
        content:
          'I notice you have not connected your bank account yet. To get personalized financial insights, please connect your bank account through Plaid. In the meantime, here are some general financial tips:\n\n1. Start building an emergency fund with 3-6 months of expenses\n2. Pay off high-interest debt as quickly as possible\n3. Consider investing in a diversified portfolio\n4. Review your spending habits and look for areas to save\n5. Set up automatic savings and bill payments',
        role: 'assistant',
      };
    }

    const completion = await openai.chat.completions.create({
      model: config.model || 'gpt-4',
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 1000,
      top_p: config.topP ?? 1,
      frequency_penalty: config.frequencyPenalty ?? 0,
      presence_penalty: config.presencePenalty ?? 0,
    });

    const response = completion.choices[0]?.message;
    if (!response) {
      console.error('No response in completion choices:', completion);
      throw new Error('No response from OpenAI');
    }

    return {
      content: response.content || '',
      role: response.role as 'assistant' | 'user' | 'system',
    };
  } catch (error) {
    console.error('Error generating chat completion:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    return {
      content:
        'I apologize, but I am unable to generate insights at the moment. Please try again later.',
      role: 'assistant',
    };
  }
}

export { openai };
