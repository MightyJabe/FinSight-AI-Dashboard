import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createAIBrainService } from '@/lib/ai-brain-service';
import { validateAuthToken } from '@/lib/auth-server';
import logger from '@/lib/logger';

const requestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  originalQuery: z.string().min(1, 'Original query is required'),
  context: z.object({
    page: z.string(),
    pageName: z.string(),
    pageDescription: z.string()
  }),
  includeVisualization: z.boolean().optional().default(true),
  conversationHistory: z.array(z.object({
    id: z.string(),
    type: z.enum(['user', 'ai']),
    content: z.string(),
    timestamp: z.string().or(z.date())
  })).optional().default([])
});

/**
 * Unified AI Assistant API - Handles both chat and financial queries
 * Context-aware based on current page and conversation history
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request format',
          details: parsed.error.formErrors.fieldErrors 
        },
        { status: 400 }
      );
    }

    const { originalQuery, context, includeVisualization, conversationHistory } = parsed.data;

    // Authenticate user
    const authResult = await validateAuthToken(request);
    if (authResult.error) {
      return authResult.error;
    }
    const userId = authResult.userId!;

    logger.info('Processing unified AI query', {
      userId,
      query: originalQuery,
      context: context.pageName,
      hasHistory: conversationHistory.length > 0
    });

    // Create AI Brain Service instance
    const aiBrain = createAIBrainService(userId);
    
    // Convert conversation history to AI Brain format
    const aiBrainHistory = conversationHistory.map(msg => ({
      id: msg.id || Date.now().toString(),
      type: msg.type as 'user' | 'ai',
      content: msg.content,
      timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : new Date()
    }));

    // Process query with AI Brain
    const result = await aiBrain.processQuery(
      originalQuery,
      context,
      aiBrainHistory,
      includeVisualization
    );

    return NextResponse.json({
      success: true,
      data: {
        answer: result.answer,
        confidence: result.confidence,
        queryResult: result.visualization ? result : undefined,
        suggestions: result.suggestions,
        context: context.pageName,
        queryType: result.type,
        conversationId: result.conversationId
      }
    });

  } catch (error) {
    logger.error('Unified AI assistant error', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        answer: 'Sorry, I encountered an error. Please try again.'
      },
      { status: 500 }
    );
  }
}

