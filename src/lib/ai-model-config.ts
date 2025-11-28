/**
 * AI Model Configuration
 *
 * This file centralizes all AI model configurations using the latest
 * OpenAI models (GPT-4o and GPT-4o-mini).
 */

export interface ModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  verbosity?: 'low' | 'medium' | 'high';
  reasoningEffort?: 'minimal' | 'standard' | 'extended';
  fallbackModel?: string;
}

export interface ModelMetrics {
  tokensPerMinute: number;
  costPer1kTokens: number;
  averageLatency: number;
  accuracyScore: number;
}

/**
 * Model configurations optimized for different use cases
 */
export const AI_MODEL_CONFIGS = {
  // Transaction categorization - fast, accurate, cost-effective
  categorization: {
    model: 'gpt-4o-mini',
    temperature: 0.1,
    maxTokens: 300,
    fallbackModel: 'gpt-4o',
  } as ModelConfig,

  // Financial insights and analysis - comprehensive reasoning
  analysis: {
    model: 'gpt-4o',
    temperature: 0.3,
    maxTokens: 1000,
    fallbackModel: 'gpt-4o',
  } as ModelConfig,

  // Interactive chat and conversations - balanced performance
  chat: {
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 1500,
    fallbackModel: 'gpt-4o',
  } as ModelConfig,

  // Complex financial planning - maximum reasoning
  planning: {
    model: 'gpt-4o',
    temperature: 0.4,
    maxTokens: 2000,
    fallbackModel: 'gpt-4o',
  } as ModelConfig,

  // Quick responses and simple queries - fast and efficient
  quick: {
    model: 'gpt-4o-mini',
    temperature: 0.5,
    maxTokens: 500,
    fallbackModel: 'gpt-4o',
  } as ModelConfig,

  // Legacy fallback configuration
  fallback: {
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 1000,
  } as ModelConfig,
} as const;

/**
 * Performance metrics for different models (based on OpenAI specs)
 */
export const MODEL_METRICS: Record<string, ModelMetrics> = {
  'gpt-4o': {
    tokensPerMinute: 30000,
    costPer1kTokens: 0.005,
    averageLatency: 2000,
    accuracyScore: 0.95,
  },
  'gpt-4o-mini': {
    tokensPerMinute: 50000,
    costPer1kTokens: 0.00015,
    averageLatency: 1200,
    accuracyScore: 0.9,
  },
};

/**
 * Enhanced prompts optimized for GPT-5's capabilities
 */
export const ENHANCED_SYSTEM_PROMPTS = {
  categorization: `You are a specialized financial transaction categorization expert using advanced reasoning.

## Core Objective
Categorize financial transactions with maximum accuracy using context clues and pattern recognition.

## Enhanced Analysis Process
1. **Transaction Context**: Analyze description, amount, date, merchant, and payment method
2. **Pattern Recognition**: Apply learned patterns from similar transactions
3. **Semantic Understanding**: Use natural language understanding for unclear descriptions
4. **Confidence Assessment**: Provide accurate confidence scores based on certainty

## Reasoning Guidelines
- Prioritize accuracy for all categorizations
- Use contextual clues for ambiguous cases
- Consider transaction context (timing, amount, merchant patterns)
- Leverage your improved financial knowledge base

## Output Format
Provide JSON with exact category match, confidence score, and brief reasoning.`,

  insights: `You are an advanced AI financial advisor with enhanced reasoning capabilities.

## Enhanced Capabilities  
- Deep pattern analysis across transaction history
- Predictive insights based on spending trends
- Personalized recommendations using behavioral analysis
- Risk assessment and opportunity identification

## Analysis Framework
1. **Data Synthesis**: Combine all available financial data points
2. **Trend Analysis**: Identify patterns and anomalies in spending
3. **Predictive Modeling**: Forecast future financial scenarios
4. **Actionable Insights**: Provide specific, implementable advice

## Communication Style
- Use medium verbosity for balanced detail
- Focus on actionable recommendations
- Provide clear reasoning for all suggestions
- Maintain professional but approachable tone`,

  chat: `You are an expert AI financial assistant with advanced conversational abilities.

## Enhanced Features
- Natural conversation flow with context awareness
- Financial expertise across all topics
- Personalized responses based on user's financial profile
- Visual data interpretation when charts/graphs are referenced

## Interaction Guidelines
- Maintain conversation context across multiple exchanges
- Provide specific answers using user's actual financial data
- Ask clarifying questions when needed
- Offer proactive suggestions based on conversation context

## Response Quality
- Use standard reasoning for complex financial queries
- Balance detail with clarity (medium verbosity)
- Include relevant numbers and percentages when available
- End with helpful next steps or follow-up questions`,
} as const;

/**
 * Feature flags for AI features
 */
export const FEATURE_FLAGS = {
  enableAutoCategorization: true,
  enableAIInsights: true,
  enableAIChat: true,
  enableAIPlanning: true,
  enableAdvancedPrompts: true,
} as const;

/**
 * Get the optimal model configuration for a specific use case
 */
export function getModelConfig(useCase: keyof typeof AI_MODEL_CONFIGS): ModelConfig {
  const config = AI_MODEL_CONFIGS[useCase];

  // Apply feature flags
  if (!FEATURE_FLAGS.enableAutoCategorization && useCase === 'categorization') {
    return AI_MODEL_CONFIGS.fallback;
  }
  if (!FEATURE_FLAGS.enableAIInsights && useCase === 'analysis') {
    return AI_MODEL_CONFIGS.fallback;
  }
  if (!FEATURE_FLAGS.enableAIChat && useCase === 'chat') {
    return AI_MODEL_CONFIGS.fallback;
  }

  return config;
}

/**
 * Get enhanced system prompt for a specific use case
 */
export function getEnhancedPrompt(useCase: keyof typeof ENHANCED_SYSTEM_PROMPTS): string {
  if (!FEATURE_FLAGS.enableAdvancedPrompts) {
    return ''; // Return empty string to use existing prompts
  }

  return ENHANCED_SYSTEM_PROMPTS[useCase];
}

/**
 * Calculate estimated cost for a request
 */
export function estimateRequestCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const metrics = MODEL_METRICS[model] || MODEL_METRICS['gpt-4o']!;
  const totalTokens = promptTokens + completionTokens;
  return (totalTokens / 1000) * metrics.costPer1kTokens;
}

/**
 * Get performance score for a model
 */
export function getModelPerformance(model: string): ModelMetrics {
  return MODEL_METRICS[model] || MODEL_METRICS['gpt-4o']!;
}

/**
 * Model availability checker
 */
export async function checkModelAvailability(model: string): Promise<boolean> {
  // GPT-4o and GPT-4o-mini are available
  if (model === 'gpt-4o' || model === 'gpt-4o-mini') {
    return true;
  }
  return false;
}
