import { NextResponse } from 'next/server';

import { config } from '@/lib/config';
import { openai } from '@/lib/openai';

/**
 *
 */
export async function GET() {
  try {
    // Test the API key with a simple completion
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "test successful" if you can read this.' }],
      max_tokens: 10,
    });

    return NextResponse.json({
      openai: {
        apiKey: !!config.openai.apiKey,
        testSuccessful: true,
        response: completion.choices[0]?.message?.content,
      },
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json({
      openai: {
        apiKey: !!config.openai.apiKey,
        testSuccessful: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      nodeEnv: process.env.NODE_ENV,
    });
  }
}
