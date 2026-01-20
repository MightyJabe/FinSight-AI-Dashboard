import OpenAI from 'openai';

import { ConversationMemory, ConversationMessage } from '@/lib/ai-conversation-memory';
import { getConfig } from '@/lib/config';
import { executeFinancialTool, financialTools } from '@/lib/financial-tools';
import logger from '@/lib/logger';
import { getUserBudgets } from '@/lib/services/budget-service';

const { openai: openaiEnvVars } = getConfig();

// Initialize OpenAI client conditionally
let openai: OpenAI | null = null;

// Skip OpenAI initialization in CI build environment
if (process.env.CI === 'true' && process.env.NODE_ENV === 'production') {
  console.log('Skipping OpenAI initialization in AI Brain Service for CI build environment');
  openai = {} as OpenAI;
} else {
  // Validate OpenAI API key
  if (!openaiEnvVars.apiKey) {
    logger.error('OpenAI API key is missing from environment variables');
    throw new Error('OpenAI API key is not configured');
  }

  openai = new OpenAI({
    apiKey: openaiEnvVars.apiKey,
  });
}

export interface AIResponse {
  answer: string;
  confidence: number;
  type: 'financial_analysis' | 'general_chat' | 'financial_query' | 'error';
  visualization?: {
    type: 'chart' | 'metric' | 'table' | 'list';
    config: Record<string, unknown>;
  };
  data?: Record<string, unknown>;
  suggestions?: string[];
  context?: string;
  conversationId?: string;
  sourceTransactions?: string[];
  sourceAccounts?: string[];
}

export interface ContextInfo {
  page: string;
  pageName: string;
  pageDescription: string;
}

/**
 * Unified AI Brain Service - The smartest financial AI assistant
 * Uses OpenAI GPT-4 with advanced financial tools and context awareness
 */
export class AIBrainService {
  private userId: string;
  private conversationMemory: ConversationMemory;

  constructor(userId: string) {
    this.userId = userId;
    this.conversationMemory = new ConversationMemory(userId);
  }

  /**
   * Main entry point for all AI interactions
   */
  async processQuery(
    query: string,
    context: ContextInfo,
    conversationHistory: ConversationMessage[] = []
  ): Promise<AIResponse> {
    try {
      // Get conversation history from Firestore
      const storedHistory = await this.conversationMemory.getRecentMessages();
      const fullHistory = [...storedHistory, ...conversationHistory];

      // Get user's financial context
      const financialContext = await this.getFinancialContext();

      // Build enhanced system prompt
      const systemPrompt = this.buildEnhancedSystemPrompt(context, financialContext, fullHistory);

      // Process with OpenAI
      const response = await this.useOpenAIWithTools(query, systemPrompt, fullHistory);

      // Save conversation to memory
      await this.conversationMemory.saveMessage({
        role: 'user',
        content: query,
        context: { page: context.page, pageName: context.pageName },
      });
      await this.conversationMemory.saveMessage({
        role: 'assistant',
        content: response.answer,
      });

      // Add suggestions
      response.suggestions = this.generateContextualSuggestions(query, context, response);

      return response;
    } catch (error) {
      logger.error('AI Brain error', { error, userId: this.userId });
      return {
        answer: 'I apologize, but I encountered an error. Please try rephrasing your question.',
        confidence: 0.1,
        type: 'error',
        suggestions: [
          'Try asking about your spending',
          'Ask for account balances',
          'Request financial overview',
        ],
      };
    }
  }

  /**
   * Get comprehensive financial context for the user
   * Uses centralized financial calculator for SSOT
   */
  private async getFinancialContext(): Promise<any> {
    try {
      // Use SSOT from financial-calculator
      const { getFinancialOverview } = await import('@/lib/financial-calculator');
      const { data: financialData, metrics } = await getFinancialOverview(this.userId);

      const budgets = await getUserBudgets(this.userId);

      return {
        totalBalance: metrics.liquidAssets,
        monthlySpending: metrics.monthlyExpenses,
        monthlyIncome: metrics.monthlyIncome,
        netCashFlow: metrics.monthlyCashFlow,
        totalAssets: metrics.totalAssets,
        totalLiabilities: metrics.totalLiabilities,
        netWorth: metrics.netWorth,
        investments: metrics.investments,
        accountCount: financialData.plaidAccounts.length + financialData.manualAssets.length,
        transactionCount: financialData.transactions.length,
        budgetCategories: Object.keys(budgets),
        topSpendingCategories: this.getTopCategories(financialData.transactions),
        hasRecentActivity: financialData.transactions.length > 0,
      };
    } catch (error) {
      logger.error('Error getting financial context', { error, userId: this.userId });
      return {
        totalBalance: 0,
        monthlySpending: 0,
        monthlyIncome: 0,
        netCashFlow: 0,
        accountCount: 0,
        transactionCount: 0,
        budgetCategories: [],
        topSpendingCategories: [],
        hasRecentActivity: false,
      };
    }
  }

  /**
   * Get top spending categories
   */
  private getTopCategories(transactions: any[]): Array<{ category: string; amount: number }> {
    const categoryTotals = transactions
      .filter(t => t.type === 'expense')
      .reduce(
        (acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        },
        {} as { [key: string]: number }
      );

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount: Number(amount) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }

  /**
   * Build enhanced system prompt with conversation history
   */
  private buildEnhancedSystemPrompt(
    context: ContextInfo,
    financialContext: any,
    conversationHistory: ConversationMessage[]
  ): string {
    const savingsRate =
      financialContext.monthlyIncome > 0
        ? ((financialContext.netCashFlow / financialContext.monthlyIncome) * 100).toFixed(1)
        : '0';

    const contextualFinancialInfo = financialContext.hasRecentActivity
      ? `
Current Financial Snapshot:
- Total Account Balance: $${financialContext.totalBalance.toLocaleString()}
- Monthly Income: $${financialContext.monthlyIncome.toLocaleString()}
- Monthly Spending: $${financialContext.monthlySpending.toLocaleString()}
- Net Cash Flow: $${financialContext.netCashFlow.toLocaleString()}
- Savings Rate: ${savingsRate}%
- Number of Accounts: ${financialContext.accountCount}
- Recent Transactions: ${financialContext.transactionCount}
- Active Budget Categories: ${financialContext.budgetCategories.join(', ')}
${financialContext.topSpendingCategories.length > 0
        ? `- Top Spending Categories: ${financialContext.topSpendingCategories.map((c: any) => `${c.category} ($${c.amount.toFixed(2)})`).join(', ')}`
        : ''
      }
`
      : 'User has limited financial data connected. Focus on general financial guidance and encourage connecting accounts for personalized insights.';

    const conversationContext =
      conversationHistory.length > 0
        ? `
RECENT CONVERSATION HISTORY:
${conversationHistory
          .slice(-6)
          .map(msg => `${msg.role.toUpperCase()}: ${msg.content.substring(0, 150)}...`)
          .join('\n')}
`
        : '';

    return `You are FinSight AI, a certified financial advisor with 20 years of experience in personal finance, investment strategy, and financial planning.

CURRENT CONTEXT:
- User is viewing: ${context.pageName} (${context.pageDescription})
- Page Context: ${context.page}

${contextualFinancialInfo}${conversationContext}

YOUR CAPABILITIES:
- Real-time financial data analysis and insights
- Advanced spending pattern recognition and anomaly detection
- Cash flow forecasting and trend analysis
- Investment strategy and portfolio optimization
- Emergency fund planning and debt management
- Personalized budget recommendations and alerts
- Financial health scoring and risk assessment

INTERACTION GUIDELINES:
1. **Context Awareness**: Always consider the current page context and conversation history
2. **Data-Driven Insights**: Use the user's actual financial data to provide specific, actionable advice
3. **Personalization**: Tailor responses to the user's financial situation, goals, and previous conversations
4. **Clarity**: Explain complex financial concepts in simple, understandable terms
5. **Action-Oriented**: Provide specific next steps with dollar amounts, percentages, and timeframes
6. **Professional Tone**: Maintain a knowledgeable but approachable tone
7. **Proactive Suggestions**: Identify opportunities for improvement and optimization
8. **Continuity**: Reference previous conversations when relevant to show understanding

RESPONSE FORMAT:
- Be concise but comprehensive
- Use specific numbers from the user's data when available
- Provide 2-3 actionable recommendations when appropriate
- Format monetary values as currency (e.g., $1,234.56)
- Prioritize high-impact, practical advice

SPECIAL FOCUS AREAS:
- ${context.pageName === 'Dashboard' ? 'Overall financial health and key metrics overview' : ''}
- ${context.pageName === 'Accounts' ? 'Account optimization and balance management strategies' : ''}
- ${context.pageName === 'Transactions' ? 'Spending analysis and budget optimization' : ''}
- ${context.pageName === 'Insights' ? 'Deep financial analysis and predictive insights' : ''}

IMPORTANT DISCLAIMER:
You are providing informational insights, not professional financial advice. When discussing investments, taxes, retirement planning, or major financial decisions, always remind users to consult qualified financial advisors, tax professionals, or legal counsel. For projections and forecasts, use phrases like "based on current trends," "this estimate assumes," or "if patterns continue." Never recommend specific stocks, funds, real estate investments, or financial products by name. Your role is to help users understand their data and explore possibilities, not to make binding financial recommendations.

Remember: You have access to the user's complete financial picture. Use this data to provide insights that go far beyond generic financial advice.`;
  }

  /**
   * Use OpenAI with advanced financial tools
   */
  private async useOpenAIWithTools(
    query: string,
    systemPrompt: string,
    conversationHistory: ConversationMessage[]
  ): Promise<AIResponse> {
    try {
      // Build conversation for OpenAI
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory.slice(-6).map(msg => ({
          role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: msg.content,
        })),
        { role: 'user' as const, content: query },
      ];

      if (!openai) {
        throw new Error('OpenAI client not initialized');
      }

      // Try GPT-5.1 first, with fallback to GPT-4o
      let completion;
      try {
        completion = await openai.chat.completions.create({
          model: 'gpt-5.1',
          messages,
          tools: financialTools,
          tool_choice: 'auto',
          max_completion_tokens: 1500,
          // GPT-5.1 parameters (conditionally added)
          ...(true && { verbosity: 'medium' as any }),
          ...(true && { reasoning_effort: 'medium' as any }),
        });
      } catch (modelError: any) {
        if (modelError?.status === 404 || modelError?.code === 'model_not_found') {
          logger.warn('GPT-5.1 not available, falling back to GPT-4o for AI brain service');
          completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
            tools: financialTools,
            tool_choice: 'auto',
            temperature: 0.7,
            max_tokens: 1500,
          });
        } else {
          throw modelError;
        }
      }

      const responseMessage = completion.choices[0]?.message;
      if (!responseMessage) {
        throw new Error('No response from OpenAI');
      }

      let finalResponse = responseMessage.content || "I couldn't process your request.";

      // Accumulate source data from all tool calls
      const allSourceTransactions: string[] = [];
      const allSourceAccounts: string[] = [];

      // Handle tool calls
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolResults = [];

        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments || '{}');

          try {
            const result = await executeFinancialTool(functionName, this.userId, functionArgs);

            // Extract source data from tool result
            if (result && typeof result === 'object') {
              if (Array.isArray(result.sourceTransactions)) {
                allSourceTransactions.push(...result.sourceTransactions);
              }
              if (Array.isArray(result.sourceAccounts)) {
                allSourceAccounts.push(...result.sourceAccounts);
              }
            }

            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool' as const,
              content: JSON.stringify(result),
            });
          } catch (error) {
            logger.error('Error executing tool call', { userId: this.userId, functionName, error });
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool' as const,
              content: JSON.stringify({ error: 'Failed to execute function' }),
            });
          }
        }

        // Get final response with tool results
        try {
          // Try GPT-5.1 first for final response
          let finalCompletion;
          try {
            finalCompletion = await openai.chat.completions.create({
              model: 'gpt-5.1',
              messages: [...messages, responseMessage, ...toolResults],
              max_completion_tokens: 1500,
              // GPT-5.1 parameters (conditionally added)
              ...(true && { verbosity: 'medium' as any }),
              ...(true && { reasoning_effort: 'medium' as any }),
            });
          } catch (modelError: any) {
            if (modelError?.status === 404 || modelError?.code === 'model_not_found') {
              finalCompletion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [...messages, responseMessage, ...toolResults],
                temperature: 0.7,
                max_tokens: 1500,
              });
            } else {
              throw modelError;
            }
          }

          finalResponse =
            finalCompletion.choices[0]?.message?.content ||
            'I analyzed your financial data and here are the insights.';
        } catch (finalError) {
          logger.error('Error getting final response from OpenAI', {
            userId: this.userId,
            error: finalError,
          });
          finalResponse =
            'I analyzed your financial data, but encountered an error in the final response.';
        }
      }

      // Deduplicate source IDs
      const uniqueSourceTransactions = [...new Set(allSourceTransactions)];
      const uniqueSourceAccounts = [...new Set(allSourceAccounts)];

      const response: AIResponse = {
        answer: finalResponse,
        confidence: 0.9,
        type: 'financial_analysis',
      };

      // Only add source data if present (for exactOptionalPropertyTypes)
      if (uniqueSourceTransactions.length > 0) {
        response.sourceTransactions = uniqueSourceTransactions;
      }
      if (uniqueSourceAccounts.length > 0) {
        response.sourceAccounts = uniqueSourceAccounts;
      }

      return response;
    } catch (error) {
      logger.error('Error using OpenAI with tools', { error, userId: this.userId });
      throw error;
    }
  }

  /**
   * Generate contextual suggestions based on page and response
   */
  private generateContextualSuggestions(
    _query: string,
    context: ContextInfo,
    response: AIResponse
  ): string[] {
    const baseSuggestions = {
      Dashboard: [
        "What's my financial health score?",
        'How is my spending trending?',
        'What are my biggest opportunities to save money?',
        'How does this month compare to last month?',
      ],
      Accounts: [
        'Should I move money between accounts?',
        'Which account is best for my emergency fund?',
        'How can I optimize my account balances?',
        "What's my total liquid net worth?",
      ],
      Transactions: [
        "What's my biggest expense category?",
        'Are there any unusual spending patterns?',
        'How can I reduce my spending?',
        'What subscriptions am I paying for?',
      ],
      Insights: [
        'Analyze my spending patterns over time',
        'What financial risks should I be aware of?',
        'How can I improve my financial health?',
        'Forecast my cash flow for next quarter',
      ],
    };

    const contextSuggestions =
      baseSuggestions[context.pageName as keyof typeof baseSuggestions] ||
      baseSuggestions.Dashboard;

    // Add response-specific suggestions
    if (response.data && 'categories' in response.data) {
      const categories = response.data.categories as unknown[][];
      const topCategory = categories[0]?.[0];
      if (topCategory && typeof topCategory === 'string') {
        contextSuggestions.unshift(`How can I reduce my ${topCategory} spending?`);
      }
    }

    return contextSuggestions.slice(0, 4);
  }
}

/**
 * Factory function to create AI Brain Service instance
 */
export function createAIBrainService(userId: string): AIBrainService {
  return new AIBrainService(userId);
}
