import { formatISO } from 'date-fns';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth, db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { generateChatCompletion } from '@/lib/openai';
import { getTransactions } from '@/lib/plaid';

import { OpenAIInsights, openAIInsightsSchema } from './schemas';

interface Transaction {
  name: string;
  amount: number;
  date: string;
  category: string[];
}

interface ManualAsset {
  id: string;
  amount: number;
  name: string;
}

interface ManualLiability {
  id: string;
  amount: number;
  name: string;
}

interface FinancialData {
  transactions: Transaction[];
  manualAssets: ManualAsset[];
  manualLiabilities: ManualLiability[];
  plaidDataAvailable: boolean;
}

interface CalculatedMetrics {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  spendingByCategory: Record<string, number>;
  monthlySpending: Record<string, number>;
}

interface CachedInsights {
  insights: OpenAIInsights[];
  summary: string;
  nextSteps: string[];
  metrics: Record<string, number>;
  plaidDataAvailable: boolean;
  cachedAt: string;
}

const insightsQuerySchema = z.object({
  force: z.preprocess(val => val === 'true' || val === '1', z.boolean().optional().default(false)),
});

/**
 *
 */
async function getCachedInsights(userId: string): Promise<CachedInsights | null> {
  const insightsDoc = await db
    .collection('users')
    .doc(userId)
    .collection('insights')
    .doc('latest')
    .get();

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  if (insightsDoc.exists) {
    const dataFromDoc = insightsDoc.data();
    if (dataFromDoc) {
      const cachedAtTimestamp = dataFromDoc.cachedAt;
      const cachedAtDate =
        cachedAtTimestamp && typeof cachedAtTimestamp.toDate === 'function'
          ? cachedAtTimestamp.toDate()
          : null;

      if (cachedAtDate && cachedAtDate > oneDayAgo) {
        logger.info('Returning cached insights for user', {
          userId,
          cachedAt: cachedAtDate.toISOString(),
        });

        // Create a plain object with all data serialized
        const serializedData = {
          insights: dataFromDoc.insights || [],
          summary: dataFromDoc.summary || '',
          nextSteps: dataFromDoc.nextSteps || [],
          metrics: dataFromDoc.metrics || {},
          plaidDataAvailable: dataFromDoc.plaidDataAvailable === true,
          cachedAt: cachedAtDate.toISOString(),
        };

        // Ensure complete serialization by stringifying and parsing
        return JSON.parse(JSON.stringify(serializedData));
      }
    }
  }
  return null;
}

/**
 *
 */
async function cacheInsights(userId: string, insightsDataWithDateObject: any): Promise<void> {
  // Create a serialized version of the data for Firestore
  const serializedData = {
    ...insightsDataWithDateObject,
    // Ensure all nested objects are serialized
    insights: JSON.parse(JSON.stringify(insightsDataWithDateObject.insights)),
    metrics: JSON.parse(JSON.stringify(insightsDataWithDateObject.metrics)),
    nextSteps: JSON.parse(JSON.stringify(insightsDataWithDateObject.nextSteps || [])),
  };

  await db.collection('users').doc(userId).collection('insights').doc('latest').set(serializedData);
  logger.info('Insights cached', { userId });
}

/**
 *
 */
async function fetchFinancialData(userId: string, accessToken?: string): Promise<FinancialData> {
  let transactions: Transaction[] = [];
  let plaidDataAvailable = false;

  if (accessToken) {
    try {
      const endDate = formatISO(new Date(), { representation: 'date' });
      const startDate = formatISO(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), {
        representation: 'date',
      });
      const plaidTransactions = await getTransactions(accessToken, startDate, endDate);
      transactions = plaidTransactions.map(txn => ({
        name: txn.name,
        amount: txn.amount,
        date: txn.date,
        category: txn.category || [],
      }));
      plaidDataAvailable = true;
    } catch (error) {
      logger.error('Error fetching Plaid transactions', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Continue without Plaid data, plaidDataAvailable remains false
    }
  }

  const assetsSnapshot = await db.collection('users').doc(userId).collection('manualAssets').get();
  const manualAssets = assetsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as ManualAsset[];

  const liabilitiesSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('manualLiabilities')
    .get();
  const manualLiabilities = liabilitiesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as ManualLiability[];

  return { transactions, manualAssets, manualLiabilities, plaidDataAvailable };
}

/**
 *
 */
function calculateFinancialMetrics(
  transactions: Transaction[],
  manualAssets: ManualAsset[],
  manualLiabilities: ManualLiability[]
): CalculatedMetrics {
  const spendingByCategory = transactions.reduce(
    (acc, txn) => {
      const category = txn.category[0] || 'Uncategorized';
      acc[category] = (acc[category] || 0) + Math.abs(txn.amount);
      return acc;
    },
    {} as Record<string, number>
  );

  const monthlySpending = transactions.reduce(
    (acc, txn) => {
      const month = txn.date.substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + Math.abs(txn.amount);
      return acc;
    },
    {} as Record<string, number>
  );

  const totalAssets = manualAssets.reduce((sum, a) => sum + a.amount, 0);
  const totalLiabilities = manualLiabilities.reduce((sum, l) => sum + l.amount, 0);
  const netWorth = totalAssets - totalLiabilities;

  return { netWorth, totalAssets, totalLiabilities, spendingByCategory, monthlySpending };
}

/**
 *
 */
function prepareOpenAIPrompt(
  metrics: CalculatedMetrics,
  plaidDataAvailable: boolean
): { role: 'system'; content: string }[] {
  let promptContent = `You are a specialized financial advisor AI assistant for Finsight AI. Your primary goal is to provide clear, actionable, and personalized financial insights. Analyze the user's data meticulously.

User's Financial Snapshot:
- Net Worth: $${metrics.netWorth.toLocaleString()}
- Total Assets: $${metrics.totalAssets.toLocaleString()}
- Total Liabilities: $${metrics.totalLiabilities.toLocaleString()}`;

  if (plaidDataAvailable && Object.keys(metrics.spendingByCategory).length > 0) {
    promptContent += `
- Top Spending Categories (Last 90 days): ${JSON.stringify(metrics.spendingByCategory)}`;
  }
  if (plaidDataAvailable && Object.keys(metrics.monthlySpending).length > 0) {
    promptContent += `
- Monthly Spending Overview (Last 90 days): ${JSON.stringify(metrics.monthlySpending)}`;
  }

  if (!plaidDataAvailable) {
    promptContent += `

Important Note: Detailed transaction data (spending, income) from linked bank accounts is currently unavailable or incomplete. Therefore, insights regarding spending patterns will be general. Insights will primarily focus on net worth, assets, and liabilities. For more detailed spending analysis and personalized budgeting advice, please ensure bank accounts are linked and transactions are up to date.`;
  }

  promptContent += `

Based on this data, provide 3-5 distinct and actionable insights. Each insight should help the user improve their financial health.

Focus Areas for Insights:
1.  **Spending Analysis & Savings (if transaction data is available):** Identify specific unusual spending patterns or concrete opportunities for savings. Suggest small, manageable changes.
2.  **Debt Management:** If liabilities exist, offer specific strategies for debt reduction (e.g., prioritizing high-interest debt).
3.  **Wealth Building & Investments:** Provide general suggestions for growing assets or improving investment strategies suitable for the user's current financial picture (e.g., diversification, emergency fund adequacy).
4.  **Financial Health & Risk Assessment:** Highlight key indicators of financial health or potential risks evident from the data.

For each insight, provide:
- A clear "title".
- A concise "description" explaining the observation and its implication.
- A list of 1-3 highly specific, small, and actionable "actionItems". Example: "Transfer $50 to your emergency fund this week" instead of "Save more money".
- A "priority" (high, medium, low) based on urgency and potential impact.

Also include an overall "summary" of the user's financial situation and a few general "nextSteps" the user could consider.

Format your entire response STRICTLY as a single JSON object with the following structure (no markdown, no conversational text outside the JSON values):
{
  "insights": [
    {
      "title": "string (concise and informative)",
      "description": "string (clear explanation and implication)",
      "actionItems": ["string (specific, small, actionable step)"],
      "priority": "high" | "medium" | "low"
    }
  ],
  "summary": "string (brief overview of financial health)",
  "nextSteps": ["string (general recommendations for further action)"]
}`;

  return [{ role: 'system', content: promptContent }];
}

/**
 *
 */
function parseAndValidateInsights(openAIResponseContent: string, userId: string): OpenAIInsights {
  try {
    const parsedContent = JSON.parse(openAIResponseContent);
    const validationResult = openAIInsightsSchema.safeParse(parsedContent);
    if (!validationResult.success) {
      logger.error('OpenAI response validation failed', {
        error: validationResult.error.formErrors,
        rawResponse: openAIResponseContent, // Be cautious logging raw response
        userId,
      });
      return {
        // Consistent fallback structure
        insights: [
          {
            title: 'Insights Temporarily Unavailable',
            description:
              'We encountered an issue generating detailed insights. Please try refreshing. If the issue persists, generic financial tips are provided below.',
            actionItems: [
              'Start building an emergency fund with 3-6 months of expenses.',
              'Pay off high-interest debt as quickly as possible.',
              'Consider investing in a diversified portfolio.',
            ],
            priority: 'medium',
          },
        ],
        summary: 'Could not generate personalized summary at this time.',
        nextSteps: ['Try refreshing the insights.'],
      };
    }
    return validationResult.data;
  } catch (error) {
    logger.error('Error parsing insights JSON from OpenAI', {
      error: error instanceof Error ? error.message : String(error),
      rawResponse: openAIResponseContent,
      userId,
    });
    return {
      // Consistent fallback structure
      insights: [
        {
          title: 'Content Format Issue',
          description:
            "We received data that couldn't be properly formatted. You can try refreshing. The raw content snippet is: " +
            openAIResponseContent.substring(0, 200) +
            '...',
          actionItems: [],
          priority: 'medium',
        },
      ],
      summary: 'Financial insights received with formatting issues.',
      nextSteps: ['Try refreshing the insights.', 'Check back later.'],
    };
  }
}

/**
 * Get financial insights and analysis for the user
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const url = new URL(request.url);
    const parsedQuery = insightsQuerySchema.safeParse({
      force: url.searchParams.get('force'),
    });

    if (!parsedQuery.success) {
      logger.warn('Invalid query parameters for insights', {
        error: parsedQuery.error.formErrors,
        requestId: request.headers.get('x-request-id'),
        userId,
      });
      return NextResponse.json(
        { success: false, errors: parsedQuery.error.formErrors },
        { status: 400 }
      );
    }
    const { force: forceRefresh } = parsedQuery.data;

    if (!forceRefresh) {
      const cachedData = await getCachedInsights(userId);
      if (cachedData) {
        return NextResponse.json(cachedData);
      }
    }

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const accessToken = userData?.plaidAccessToken;

    const { transactions, manualAssets, manualLiabilities, plaidDataAvailable } =
      await fetchFinancialData(userId, accessToken);
    const metrics = calculateFinancialMetrics(transactions, manualAssets, manualLiabilities);

    const openAIMessages = prepareOpenAIPrompt(metrics, plaidDataAvailable);
    const openAIResponse = await generateChatCompletion(openAIMessages);

    const insightsData = parseAndValidateInsights(openAIResponse.content, userId);

    // Create a serialized version of the data for caching
    const dataToCache = {
      ...insightsData,
      metrics,
      cachedAt: new Date(),
      plaidDataAvailable,
    };

    // Cache the data
    await cacheInsights(userId, dataToCache);

    // Create a serialized version for the client response
    const clientResponse = {
      insights: insightsData.insights || [],
      summary: insightsData.summary || '',
      nextSteps: insightsData.nextSteps || [],
      metrics: {
        netWorth: Number(metrics.netWorth) || 0,
        totalAssets: Number(metrics.totalAssets) || 0,
        totalLiabilities: Number(metrics.totalLiabilities) || 0,
        spendingByCategory: metrics.spendingByCategory || {},
        monthlySpending: metrics.monthlySpending || {},
      },
      cachedAt: dataToCache.cachedAt.toISOString(),
      plaidDataAvailable: Boolean(plaidDataAvailable),
    };

    // Ensure complete serialization
    const serializedResponse = JSON.parse(JSON.stringify(clientResponse));

    return NextResponse.json(serializedResponse);
  } catch (error) {
    const userIdFromError = (error as any).userId || 'unknown';
    logger.error('Critical error in GET /api/insights', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: userIdFromError,
    });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
