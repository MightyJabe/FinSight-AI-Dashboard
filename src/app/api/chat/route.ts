import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

import { getConfig } from '@/lib/config';
import { auth, db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { getAccountBalances, getTransactions } from '@/lib/plaid';

const { openai: openaiEnvVars } = getConfig();

// Validate OpenAI API key
if (!openaiEnvVars.apiKey) {
  logger.error('OpenAI API key is missing from environment variables');
  throw new Error('OpenAI API key is not configured');
}

const openai = new OpenAI({
  apiKey: openaiEnvVars.apiKey,
});

// Zod schema for request validation
const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
  conversationId: z.string().optional(),
});

// Tool definitions for OpenAI function calling
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_net_worth',
      description: "Get the user's current net worth (assets minus liabilities)",
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_account_balances',
      description: 'Get balances for all user accounts (bank accounts, manual accounts)',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_spending_by_category',
      description: 'Get spending breakdown by category for a specific time period',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['week', 'month', 'quarter', 'year'],
            description: 'Time period to analyze',
          },
          category: {
            type: 'string',
            description: 'Specific category to filter by (optional)',
          },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_recent_transactions',
      description: 'Get recent transactions with optional filtering',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of transactions to return (default: 10)',
          },
          category: {
            type: 'string',
            description: 'Filter by category',
          },
          amount_min: {
            type: 'number',
            description: 'Minimum transaction amount',
          },
          amount_max: {
            type: 'number',
            description: 'Maximum transaction amount',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_monthly_summary',
      description: 'Get monthly income, expenses, and savings summary',
      parameters: {
        type: 'object',
        properties: {
          month: {
            type: 'string',
            description: 'Month to analyze (YYYY-MM format, default: current month)',
          },
        },
        required: [],
      },
    },
  },
];

// Function implementations
/**
 *
 */
async function getNetWorth(
  userId: string
): Promise<{ netWorth: number; assets: number; liabilities: number }> {
  try {
    // Get manual assets
    const assetsSnapshot = await db.collection(`users/${userId}/manualAssets`).get();
    const manualAssets = assetsSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );

    // Get manual liabilities
    const liabilitiesSnapshot = await db.collection(`users/${userId}/manualLiabilities`).get();
    const manualLiabilities = liabilitiesSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );

    // Get Plaid accounts
    const plaidItemsSnapshot = await db.collection(`users/${userId}/plaidItems`).get();
    let plaidAssets = 0;

    for (const itemDoc of plaidItemsSnapshot.docs) {
      const plaidItem = itemDoc.data();
      const accessToken = plaidItem.accessToken;
      if (accessToken) {
        try {
          const balances = await getAccountBalances(accessToken);
          plaidAssets += balances.reduce(
            (sum, account) => sum + (account.balances.current || 0),
            0
          );
        } catch (error) {
          logger.error('Error fetching Plaid balances for net worth', { userId, error });
        }
      }
    }

    const totalAssets = manualAssets + plaidAssets;
    const netWorth = totalAssets - manualLiabilities;

    return { netWorth, assets: totalAssets, liabilities: manualLiabilities };
  } catch (error) {
    logger.error('Error calculating net worth', { userId, error });
    throw error;
  }
}

/**
 *
 */
async function getAccountBalancesData(
  userId: string
): Promise<Array<{ name: string; balance: number; type: string }>> {
  try {
    const accounts: Array<{ name: string; balance: number; type: string }> = [];

    // Get manual accounts
    const assetsSnapshot = await db.collection(`users/${userId}/manualAssets`).get();
    assetsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      accounts.push({
        name: data.name,
        balance: data.amount || 0,
        type: data.type || 'Manual',
      });
    });

    // Get Plaid accounts
    const plaidItemsSnapshot = await db.collection(`users/${userId}/plaidItems`).get();
    for (const itemDoc of plaidItemsSnapshot.docs) {
      const plaidItem = itemDoc.data();
      const accessToken = plaidItem.accessToken;
      if (accessToken) {
        try {
          const balances = await getAccountBalances(accessToken);
          balances.forEach(account => {
            accounts.push({
              name: account.name || 'Plaid Account',
              balance: account.balances.current || 0,
              type: account.type || 'Bank',
            });
          });
        } catch (error) {
          logger.error('Error fetching Plaid balances', { userId, error });
        }
      }
    }

    return accounts;
  } catch (error) {
    logger.error('Error getting account balances', { userId, error });
    throw error;
  }
}

/**
 *
 */
async function getSpendingByCategory(
  userId: string,
  period: string,
  category?: string
): Promise<Array<{ category: string; amount: number }>> {
  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get transactions from Plaid
    const plaidItemsSnapshot = await db.collection(`users/${userId}/plaidItems`).get();
    const allTransactions: Array<{ category: string; amount: number }> = [];

    for (const itemDoc of plaidItemsSnapshot.docs) {
      const plaidItem = itemDoc.data();
      const accessToken = plaidItem.accessToken;
      if (accessToken) {
        try {
          const transactions = await getTransactions(
            accessToken,
            startDate.toISOString().split('T')[0],
            now.toISOString().split('T')[0]
          );

          transactions.forEach(txn => {
            if (txn.amount < 0) {
              // Only expenses
              const txnCategory = txn.category?.[0] || 'Uncategorized';
              if (!category || txnCategory.toLowerCase().includes(category.toLowerCase())) {
                allTransactions.push({
                  category: txnCategory,
                  amount: Math.abs(txn.amount),
                });
              }
            }
          });
        } catch (error) {
          logger.error('Error fetching Plaid transactions for spending analysis', {
            userId,
            error,
          });
        }
      }
    }

    // Group by category
    const spendingByCategory: Record<string, number> = {};
    allTransactions.forEach(txn => {
      spendingByCategory[txn.category] = (spendingByCategory[txn.category] || 0) + txn.amount;
    });

    return Object.entries(spendingByCategory).map(([category, amount]) => ({
      category,
      amount,
    }));
  } catch (error) {
    logger.error('Error getting spending by category', { userId, error });
    throw error;
  }
}

/**
 *
 */
async function getRecentTransactions(
  userId: string,
  limit = 10,
  category?: string,
  amountMin?: number,
  amountMax?: number
): Promise<Array<{ name: string; amount: number; date: string; category: string }>> {
  try {
    const plaidItemsSnapshot = await db.collection(`users/${userId}/plaidItems`).get();
    const allTransactions: Array<{ name: string; amount: number; date: string; category: string }> =
      [];

    for (const itemDoc of plaidItemsSnapshot.docs) {
      const plaidItem = itemDoc.data();
      const accessToken = plaidItem.accessToken;
      if (accessToken) {
        try {
          const transactions = await getTransactions(
            accessToken,
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            new Date().toISOString().split('T')[0]
          );

          transactions.forEach(txn => {
            // Apply filters
            if (
              category &&
              !txn.category?.some(cat => cat.toLowerCase().includes(category.toLowerCase()))
            ) {
              return;
            }
            if (amountMin && Math.abs(txn.amount) < amountMin) {
              return;
            }
            if (amountMax && Math.abs(txn.amount) > amountMax) {
              return;
            }

            allTransactions.push({
              name: txn.name,
              amount: txn.amount,
              date: txn.date,
              category: txn.category?.[0] || 'Uncategorized',
            });
          });
        } catch (error) {
          logger.error('Error fetching Plaid transactions', { userId, error });
        }
      }
    }

    // Sort by date and limit
    return allTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  } catch (error) {
    logger.error('Error getting recent transactions', { userId, error });
    throw error;
  }
}

/**
 *
 */
async function getMonthlySummary(
  userId: string,
  month?: string
): Promise<{ income: number; expenses: number; savings: number }> {
  try {
    // Calculate date range for the specified month or current month
    const targetDate = month ? new Date(month + '-01') : new Date();
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    const plaidItemsSnapshot = await db.collection(`users/${userId}/plaidItems`).get();
    let income = 0;
    let expenses = 0;

    for (const itemDoc of plaidItemsSnapshot.docs) {
      const plaidItem = itemDoc.data();
      const accessToken = plaidItem.accessToken;
      if (accessToken) {
        try {
          const transactions = await getTransactions(
            accessToken,
            startOfMonth.toISOString().split('T')[0],
            endOfMonth.toISOString().split('T')[0]
          );

          transactions.forEach(txn => {
            if (txn.amount > 0) {
              income += txn.amount;
            } else {
              expenses += Math.abs(txn.amount);
            }
          });
        } catch (error) {
          logger.error('Error fetching Plaid transactions for monthly summary', { userId, error });
        }
      }
    }

    const savings = income - expenses;

    return { income, expenses, savings };
  } catch (error) {
    logger.error('Error getting monthly summary', { userId, error });
    throw error;
  }
}

// Add conversation management functions
/**
 *
 */
async function saveConversation(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  conversationId?: string
): Promise<string> {
  try {
    const conversationData: Record<string, unknown> = {
      userId,
      messages,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (!conversationId) {
      conversationData.createdAt = FieldValue.serverTimestamp();
    }

    if (conversationId) {
      await db
        .collection('users')
        .doc(userId)
        .collection('conversations')
        .doc(conversationId)
        .update(conversationData);
      return conversationId;
    } else {
      const docRef = await db
        .collection('users')
        .doc(userId)
        .collection('conversations')
        .add(conversationData);
      return docRef.id;
    }
  } catch (error) {
    logger.error('Error saving conversation', { userId, error });
    throw error;
  }
}

/**
 *
 */
async function getConversation(
  userId: string,
  conversationId: string
): Promise<Array<{ role: string; content: string }> | null> {
  try {
    const doc = await db
      .collection('users')
      .doc(userId)
      .collection('conversations')
      .doc(conversationId)
      .get();
    if (doc.exists) {
      return doc.data()?.messages || [];
    }
    return null;
  } catch (error) {
    logger.error('Error getting conversation', { userId, conversationId, error });
    return null;
  }
}

/**
 *
 */
async function getUserConversations(
  userId: string
): Promise<Array<{ id: string; title: string; updatedAt: Date; messageCount: number }>> {
  try {
    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('conversations')
      .orderBy('updatedAt', 'desc')
      .limit(20)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      const messages = data.messages || [];
      const firstUserMessage =
        messages.find((m: { role: string; content: string }) => m.role === 'user')?.content ||
        'New conversation';

      const title =
        firstUserMessage.length > 50 ? firstUserMessage.substring(0, 50) + '...' : firstUserMessage;

      return {
        id: doc.id,
        title,
        updatedAt: data.updatedAt?.toDate() || new Date(),
        messageCount: messages.length,
      };
    });
  } catch (error) {
    logger.error('Error getting user conversations', { userId, error });
    return [];
  }
}

/**
 *
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      logger.error('Missing or invalid Authorization header', {
        hasHeader: !!authHeader,
        headerValue: authHeader ? authHeader.substring(0, 20) + '...' : 'none',
      });
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (authError) {
      logger.error('Firebase token verification failed', {
        error: authError instanceof Error ? authError.message : String(authError),
      });
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // Validate request body
    const body = await request.json();
    const parsedBody = chatRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      logger.error('Request validation failed', {
        userId,
        errors: parsedBody.error.formErrors,
        body: body,
      });
      return NextResponse.json(
        { error: 'Invalid request body', details: parsedBody.error.formErrors },
        { status: 400 }
      );
    }

    const { message, history = [], conversationId } = parsedBody.data;

    // Prepare conversation history
    const messages = [
      {
        role: 'system' as const,
        content: `You are a helpful financial assistant for FinSight AI. You can answer questions about the user's finances by using the available tools. Always provide clear, helpful responses and format numbers as currency when appropriate. If you don't have access to the requested data, explain what information would be needed.`,
      },
      ...history,
      { role: 'user' as const, content: message },
    ];

    // Call OpenAI with tool calling
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        tools,
        tool_choice: 'auto',
      });
    } catch (openaiError) {
      logger.error('OpenAI API error', {
        userId,
        error: openaiError instanceof Error ? openaiError.message : String(openaiError),
        status:
          typeof openaiError === 'object' && openaiError !== null && 'status' in openaiError
            ? (openaiError as { status?: number }).status
            : undefined,
        type:
          typeof openaiError === 'object' && openaiError !== null && 'type' in openaiError
            ? (openaiError as { type?: string }).type
            : undefined,
      });

      if (
        typeof openaiError === 'object' &&
        openaiError !== null &&
        'status' in openaiError &&
        (openaiError as { status?: number }).status === 401
      ) {
        return NextResponse.json(
          { error: 'OpenAI API key is invalid or expired' },
          { status: 500 }
        );
      } else if (
        typeof openaiError === 'object' &&
        openaiError !== null &&
        'status' in openaiError &&
        (openaiError as { status?: number }).status === 429
      ) {
        return NextResponse.json(
          { error: 'OpenAI API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      } else {
        return NextResponse.json(
          { error: 'Failed to connect to AI service. Please try again.' },
          { status: 500 }
        );
      }
    }

    const responseMessage = completion.choices[0]?.message;
    if (!responseMessage) {
      throw new Error('No response from OpenAI');
    }

    let finalResponse = responseMessage.content || "Sorry, I couldn't process your request.";

    // Handle tool calls if any
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolResults = [];

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments || '{}');

        try {
          let result;
          switch (functionName) {
            case 'get_net_worth':
              result = await getNetWorth(userId);
              break;
            case 'get_account_balances':
              result = await getAccountBalancesData(userId);
              break;
            case 'get_spending_by_category':
              result = await getSpendingByCategory(
                userId,
                functionArgs.period,
                functionArgs.category
              );
              break;
            case 'get_recent_transactions':
              result = await getRecentTransactions(
                userId,
                functionArgs.limit,
                functionArgs.category,
                functionArgs.amount_min,
                functionArgs.amount_max
              );
              break;
            case 'get_monthly_summary':
              result = await getMonthlySummary(userId, functionArgs.month);
              break;
            default:
              result = { error: `Unknown function: ${functionName}` };
          }

          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool' as const,
            content: JSON.stringify(result),
          });
        } catch (error) {
          logger.error('Error executing tool call', { userId, functionName, error });
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
          model: 'gpt-4',
          messages: [...messages, responseMessage, ...toolResults],
        });

        finalResponse =
          finalCompletion.choices[0]?.message?.content ||
          'Sorry, I encountered an error processing your request.';
      } catch (finalError) {
        logger.error('Error getting final response from OpenAI', { userId, error: finalError });
        finalResponse = 'Sorry, I encountered an error processing your request.';
      }
    }

    // Save conversation to database
    const conversationMessages = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: finalResponse },
    ];

    const savedConversationId = await saveConversation(
      userId,
      conversationMessages,
      conversationId
    );

    return NextResponse.json({
      response: finalResponse,
      conversationId: savedConversationId,
    });
  } catch (error) {
    logger.error('Error in chat API', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add GET endpoint to retrieve conversations
/**
 *
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');

    if (conversationId) {
      // Get specific conversation
      const messages = await getConversation(userId, conversationId);
      if (messages) {
        return NextResponse.json({ messages, conversationId });
      } else {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
    } else {
      // Get all conversations
      const conversations = await getUserConversations(userId);
      return NextResponse.json({ conversations });
    }
  } catch (error) {
    logger.error('Error in chat GET API', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
