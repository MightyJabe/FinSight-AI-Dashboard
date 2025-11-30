import OpenAI from 'openai';

import { getConfig } from './config';

const { openai: openaiEnvVars } = getConfig();

// Initialize OpenAI client only on server-side
let openai: OpenAI | null = null;

if (typeof window === 'undefined') {
  // Server-side only
  // Skip OpenAI initialization in CI build environment
  if (process.env.CI === 'true' && process.env.NODE_ENV === 'production') {
    console.log('Skipping OpenAI initialization in CI build environment');
    openai = {} as OpenAI;
  } else {
    openai = new OpenAI({
      apiKey: openaiEnvVars.apiKey,
    });
  }
}

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
  // GPT-5 specific features
  verbosity?: 'low' | 'medium' | 'high';
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high';
};

// Model configurations for different use cases
export const MODEL_CONFIGS = {
  // High-accuracy tasks like categorization
  categorization: {
    model: 'gpt-5.1',
    temperature: 0.1,
    maxTokens: 150,
  },
  // Complex analysis and insights
  analysis: {
    model: 'gpt-5.1',
    temperature: 0.3,
    maxTokens: 800,
  },
  // Interactive chat and conversations
  chat: {
    model: 'gpt-5.1',
    temperature: 0.7,
    maxTokens: 1500,
  },
  // Fallback for when models are unavailable
  fallback: {
    model: 'gpt-4o',
    temperature: 0.7,
  },
} as const;

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
    if (!openai || !openaiEnvVars.apiKey) {
      console.warn('OpenAI API key is missing or client not initialized. Using fallback response.');
      return {
        content:
          'I notice you have not connected your bank account yet. To get personalized financial insights, please connect your bank account through Plaid. In the meantime, here are some general financial tips:\n\n1. Start building an emergency fund with 3-6 months of expenses\n2. Pay off high-interest debt as quickly as possible\n3. Consider investing in a diversified portfolio\n4. Review your spending habits and look for areas to save\n5. Set up automatic savings and bill payments',
        role: 'assistant',
      };
    }

    // Prepare completion parameters
    const completionParams: any = {
      model: config.model || 'gpt-5.1',
      messages,
      top_p: config.topP ?? 1,
      frequency_penalty: config.frequencyPenalty ?? 0,
      presence_penalty: config.presencePenalty ?? 0,
    };

    // Only add temperature for GPT-5.1 with reasoning effort 'none' or non-GPT-5.1 models
    if (!completionParams.model.startsWith('gpt-5') || config.reasoningEffort === 'none') {
      completionParams.temperature = config.temperature ?? 0.7;
    }

    // Use correct token parameter based on model
    if (completionParams.model.startsWith('gpt-5')) {
      completionParams.max_completion_tokens = config.maxTokens ?? 1000;
    } else {
      completionParams.max_tokens = config.maxTokens ?? 1000;
    }

    // Add GPT-5.1 specific parameters
    if (config.verbosity && completionParams.model.startsWith('gpt-5')) {
      try {
        (completionParams as any).verbosity = config.verbosity;
      } catch {
        // Ignore if parameter is not supported
      }
    }
    if (config.reasoningEffort && completionParams.model.startsWith('gpt-5')) {
      try {
        (completionParams as any).reasoning_effort = config.reasoningEffort;
      } catch {
        // Ignore if parameter is not supported
      }
    }

    let completion;
    try {
      completion = await openai.chat.completions.create(completionParams);
    } catch (error: any) {
      // Fallback to GPT-4o if GPT-5.1 is not available or has parameter issues
      if (
        error?.status === 404 ||
        error?.code === 'model_not_found' ||
        error?.message?.includes('max_tokens')
      ) {
        console.warn('GPT-5.1 not available or parameter issue, falling back to GPT-4o');
        const fallbackParams = {
          ...completionParams,
          model: 'gpt-4o',
          max_tokens: config.maxTokens ?? 1000,
        };
        // Remove GPT-5.1 specific parameters
        delete fallbackParams.verbosity;
        delete fallbackParams.reasoning_effort;
        delete fallbackParams.max_completion_tokens;

        completion = await openai.chat.completions.create(fallbackParams);
      } else {
        throw error;
      }
    }

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

// Export openai client (may be null on client-side)
export { openai };
