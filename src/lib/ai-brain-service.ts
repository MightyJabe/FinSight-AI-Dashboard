import OpenAI from 'openai';

import { getConfig } from '@/lib/config';
import { db } from '@/lib/firebase-admin';
import { executeFinancialTool, financialTools } from '@/lib/financial-tools';
import logger from '@/lib/logger';
import { getAccountService } from '@/lib/services/account-service';
import { getUserBudgets } from '@/lib/services/budget-service';
import { getTransactionService } from '@/lib/services/transaction-service';

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
    config: any;
  };
  data?: any;
  suggestions?: string[];
  context?: string;
  conversationId?: string;
}

export interface ContextInfo {
  page: string;
  pageName: string;
  pageDescription: string;
}

export interface ConversationMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  context?: ContextInfo;
}

/**
 * Unified AI Brain Service - The smartest financial AI assistant
 * Uses OpenAI GPT-4 with advanced financial tools and context awareness
 */
export class AIBrainService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Main entry point for all AI interactions
   * Intelligently routes between different AI capabilities
   */
  async processQuery(
    query: string,
    context: ContextInfo,
    conversationHistory: ConversationMessage[] = [],
    includeVisualization = true
  ): Promise<AIResponse> {
    try {
      logger.info('AI Brain processing query', {
        userId: this.userId,
        query: query.substring(0, 100),
        context: context.pageName,
        hasHistory: conversationHistory.length > 0,
      });

      // Smart query classification
      const queryType = this.classifyQuery(query);
      logger.info('Query classified', { queryType, query: query.substring(0, 50) });

      // Get user's financial context
      const financialContext = await this.getFinancialContext();

      // Build enhanced system prompt with context
      const systemPrompt = this.buildSystemPrompt(context, financialContext);

      // Process based on query type
      let response: AIResponse;

      if (queryType === 'financial_query' || queryType === 'financial_analysis') {
        response = await this.processFinancialQuery(
          query,
          context,
          systemPrompt,
          conversationHistory,
          includeVisualization
        );
      } else {
        response = await this.processGeneralChat(
          query,
          context,
          systemPrompt,
          conversationHistory,
          financialContext
        );
      }

      // Add contextual suggestions
      response.suggestions = this.generateContextualSuggestions(query, context, response);

      // Save conversation
      const conversationId = await this.saveConversation(query, response, context);
      response.conversationId = conversationId;

      return response;
    } catch (error) {
      logger.error('AI Brain error', {
        error,
        userId: this.userId,
        query: query.substring(0, 100),
      });
      return {
        answer:
          'I apologize, but I encountered an error processing your request. Please try rephrasing your question.',
        confidence: 0.1,
        type: 'error',
        suggestions: [
          'Try asking about your spending this month',
          'Ask for your account balances',
          'Request a financial health overview',
          'Ask about your budget status',
        ],
      };
    }
  }

  /**
   * Intelligent query classification using keyword analysis and patterns
   */
  private classifyQuery(query: string): 'financial_query' | 'financial_analysis' | 'general_chat' {
    const queryLower = query.toLowerCase();

    // Financial analysis patterns (complex financial concepts)
    const analysisPatterns = [
      'analyze',
      'analysis',
      'patterns',
      'trends',
      'forecast',
      'predict',
      'projection',
      'health score',
      'financial health',
      'debt to income',
      'cash flow',
      'emergency fund',
      'portfolio',
      'investment',
      'optimize',
      'strategy',
      'recommend',
      'advice',
      'net worth',
      'savings rate',
      'budget adherence',
      'risk',
      'volatility',
    ];

    // Financial query patterns (data retrieval)
    const queryPatterns = [
      'how much',
      'what is',
      'show me',
      'total',
      'balance',
      'spend',
      'spent',
      'income',
      'transaction',
      'account',
      'category',
      'budget',
      'this month',
      'last month',
      'recent',
      'current',
      'average',
      'sum',
      'count',
      'list',
    ];

    // Check for financial analysis
    if (analysisPatterns.some(pattern => queryLower.includes(pattern))) {
      return 'financial_analysis';
    }

    // Check for financial queries
    if (queryPatterns.some(pattern => queryLower.includes(pattern))) {
      return 'financial_query';
    }

    // Default to general chat
    return 'general_chat';
  }

  /**
   * Get comprehensive financial context for the user
   */
  private async getFinancialContext(): Promise<any> {
    try {
      const transactionService = getTransactionService(this.userId);
      const accountService = getAccountService(this.userId);

      const [transactions, accounts, budgets] = await Promise.all([
        transactionService.getTransactions(30),
        accountService.getAccounts(),
        getUserBudgets(this.userId),
      ]);

      const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
      const monthlySpending = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const monthlyIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        totalBalance,
        monthlySpending,
        monthlyIncome,
        netCashFlow: monthlyIncome - monthlySpending,
        accountCount: accounts.length,
        transactionCount: transactions.length,
        budgetCategories: Object.keys(budgets),
        topSpendingCategories: this.getTopCategories(transactions),
        hasRecentActivity: transactions.length > 0,
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
   * Build comprehensive system prompt with context
   */
  private buildSystemPrompt(context: ContextInfo, financialContext: any): string {
    const contextualFinancialInfo = financialContext.hasRecentActivity
      ? `
Current Financial Snapshot:
- Total Account Balance: $${financialContext.totalBalance.toLocaleString()}
- Monthly Income: $${financialContext.monthlyIncome.toLocaleString()}
- Monthly Spending: $${financialContext.monthlySpending.toLocaleString()}
- Net Cash Flow: $${financialContext.netCashFlow.toLocaleString()}
- Number of Accounts: ${financialContext.accountCount}
- Recent Transactions: ${financialContext.transactionCount}
- Active Budget Categories: ${financialContext.budgetCategories.join(', ')}
${
  financialContext.topSpendingCategories.length > 0
    ? `- Top Spending Categories: ${financialContext.topSpendingCategories.map((c: any) => `${c.category} ($${c.amount.toFixed(2)})`).join(', ')}`
    : ''
}
`
      : 'User has limited financial data connected. Focus on general financial guidance and encourage connecting accounts for personalized insights.';

    return `You are FinSight AI, an expert financial advisor and AI assistant with deep expertise in personal finance, investment strategy, and financial planning.

CURRENT CONTEXT:
- User is viewing: ${context.pageName} (${context.pageDescription})
- Page Context: ${context.page}

${contextualFinancialInfo}

YOUR CAPABILITIES:
- Real-time financial data analysis and insights
- Advanced spending pattern recognition and anomaly detection
- Cash flow forecasting and trend analysis
- Investment strategy and portfolio optimization
- Emergency fund planning and debt management
- Personalized budget recommendations and alerts
- Financial health scoring and risk assessment

INTERACTION GUIDELINES:
1. **Context Awareness**: Always consider the current page context when responding
2. **Data-Driven Insights**: Use the user's actual financial data to provide specific, actionable advice
3. **Personalization**: Tailor responses to the user's financial situation and goals
4. **Clarity**: Explain complex financial concepts in simple, understandable terms
5. **Action-Oriented**: Provide specific next steps and recommendations with dollar amounts and timeframes
6. **Professional Tone**: Maintain a knowledgeable but approachable tone
7. **Proactive Suggestions**: Identify opportunities for improvement and optimization

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

Remember: You have access to the user's complete financial picture. Use this data to provide insights that go far beyond generic financial advice.`;
  }

  /**
   * Process financial queries using OpenAI with financial tools
   */
  private async processFinancialQuery(
    query: string,
    _context: ContextInfo,
    systemPrompt: string,
    conversationHistory: ConversationMessage[],
    _includeVisualization: boolean
  ): Promise<AIResponse> {
    try {
      // Use OpenAI with advanced financial analysis tools
      return await this.useOpenAIWithTools(query, systemPrompt, conversationHistory);
    } catch (error) {
      logger.error('Error processing financial query', { error, userId: this.userId });
      return await this.useOpenAIWithTools(query, systemPrompt, conversationHistory);
    }
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
          role: msg.type === 'user' ? ('user' as const) : ('assistant' as const),
          content: msg.content,
        })),
        { role: 'user' as const, content: query },
      ];

      if (!openai) {
        throw new Error('OpenAI client not initialized');
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools: financialTools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1500,
      });

      const responseMessage = completion.choices[0]?.message;
      if (!responseMessage) {
        throw new Error('No response from OpenAI');
      }

      let finalResponse = responseMessage.content || "I couldn't process your request.";

      // Handle tool calls
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolResults = [];

        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments || '{}');

          try {
            const result = await executeFinancialTool(functionName, this.userId, functionArgs);
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
          const finalCompletion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [...messages, responseMessage, ...toolResults],
            temperature: 0.7,
            max_tokens: 1500,
          });

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

      return {
        answer: finalResponse,
        confidence: 0.9,
        type: 'financial_analysis',
      };
    } catch (error) {
      logger.error('Error using OpenAI with tools', { error, userId: this.userId });
      throw error;
    }
  }

  /**
   * Process general chat with financial context
   */
  private async processGeneralChat(
    query: string,
    _context: ContextInfo,
    systemPrompt: string,
    conversationHistory: ConversationMessage[],
    _financialContext: any
  ): Promise<AIResponse> {
    try {
      const chatPrompt = `${systemPrompt}

User Query: "${query}"

Provide a helpful, contextual response that considers:
1. The user's current page context (${_context.pageName})
2. Their financial situation and data
3. Any relevant financial insights or suggestions
4. A warm, professional tone

If the query is financial in nature, provide specific insights based on their data.
If it's general, still relate it back to their financial goals when appropriate.`;

      // Build conversation for OpenAI
      const messages = [
        { role: 'system' as const, content: chatPrompt },
        ...conversationHistory.slice(-4).map(msg => ({
          role: msg.type === 'user' ? ('user' as const) : ('assistant' as const),
          content: msg.content,
        })),
        { role: 'user' as const, content: query },
      ];

      if (!openai) {
        throw new Error('OpenAI client not initialized');
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 800,
      });

      const response =
        completion.choices[0]?.message?.content ||
        "I'm here to help with your financial questions. What would you like to know?";

      return {
        answer: response,
        confidence: 0.8,
        type: 'general_chat',
        context: _context.pageName,
      };
    } catch (error) {
      logger.error('Error processing general chat', { error, userId: this.userId });
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
    if (response.data?.categories) {
      const topCategory = response.data.categories[0]?.[0];
      if (topCategory) {
        contextSuggestions.unshift(`How can I reduce my ${topCategory} spending?`);
      }
    }

    return contextSuggestions.slice(0, 4);
  }

  /**
   * Save conversation to database
   */
  private async saveConversation(
    query: string,
    response: AIResponse,
    context: ContextInfo
  ): Promise<string> {
    try {
      const conversationData = {
        userId: this.userId,
        query,
        response: response.answer,
        type: response.type,
        context,
        confidence: response.confidence,
        timestamp: new Date(),
        createdAt: new Date(),
      };

      const docRef = await db
        .collection('users')
        .doc(this.userId)
        .collection('ai_conversations')
        .add(conversationData);

      return docRef.id;
    } catch (error) {
      logger.error('Error saving AI conversation', { error, userId: this.userId });
      return '';
    }
  }
}

/**
 * Factory function to create AI Brain Service instance
 */
export function createAIBrainService(userId: string): AIBrainService {
  return new AIBrainService(userId);
}
