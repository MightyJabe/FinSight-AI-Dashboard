import { formatISO } from 'date-fns';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth, db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { generateChatCompletion } from '@/lib/openai';
import { getAccountBalances, getTransactions } from '@/lib/plaid';

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

interface PlaidAccount {
  account_id: string;
  name: string;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
  };
  type: string;
  subtype: string;
}

interface FinancialData {
  transactions: Transaction[];
  manualAssets: ManualAsset[];
  manualLiabilities: ManualLiability[];
  plaidAccounts: PlaidAccount[];
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
interface InsightsCacheData extends OpenAIInsights {
  metrics: CalculatedMetrics;
  cachedAt: Date;
  plaidDataAvailable: boolean;
}

/**
 *
 */
async function cacheInsights(
  userId: string,
  insightsDataWithDateObject: InsightsCacheData
): Promise<void> {
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
  let plaidAccounts: PlaidAccount[] = [];
  let plaidDataAvailable = false;

  if (accessToken) {
    try {
      // Fetch transactions for the last 30 days to match dashboard calculation
      const endDate = formatISO(new Date(), { representation: 'date' });
      const startDate = formatISO(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), {
        representation: 'date',
      });
      const plaidTransactions = await getTransactions(accessToken, startDate, endDate);
      transactions = plaidTransactions.map(txn => ({
        name: txn.name,
        amount: txn.amount,
        date: txn.date,
        category: txn.category || [],
      }));

      // Log transaction data for debugging
      logger.info('Fetched Plaid transactions for insights', {
        userId,
        transactionCount: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
        dateRange: { startDate, endDate },
      });

      // Fetch account balances
      const plaidAccountBalances = await getAccountBalances(accessToken);
      plaidAccounts = plaidAccountBalances.map(account => ({
        account_id: account.account_id,
        name: account.name,
        balances: {
          available: account.balances.available,
          current: account.balances.current,
          limit: account.balances.limit,
        },
        type: account.type,
        subtype: account.subtype ?? '',
      }));

      plaidDataAvailable = true;
    } catch (error) {
      logger.error('Error fetching Plaid data', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Continue without Plaid data, plaidDataAvailable remains false
    }
  }

  const assetsSnapshot = await db.collection('users').doc(userId).collection('manualAssets').get();
  const manualAssets = assetsSnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  })) as ManualAsset[];

  const liabilitiesSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('manualLiabilities')
    .get();
  const manualLiabilities = liabilitiesSnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  })) as ManualLiability[];

  return { transactions, manualAssets, manualLiabilities, plaidAccounts, plaidDataAvailable };
}

/**
 *
 */
function calculateFinancialMetrics(
  transactions: Transaction[],
  manualAssets: ManualAsset[],
  manualLiabilities: ManualLiability[],
  plaidAccounts: PlaidAccount[]
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

  // Calculate manual assets and liabilities
  const manualAssetsTotal = manualAssets.reduce((sum, a) => sum + a.amount, 0);
  const manualLiabilitiesTotal = manualLiabilities.reduce((sum, l) => sum + l.amount, 0);

  // Calculate Plaid account balances - match dashboard calculation
  const plaidAssetsTotal = plaidAccounts.reduce((sum, account) => {
    // Use available balance if present, otherwise current balance (same as dashboard)
    const balance = account.balances.available ?? account.balances.current ?? 0;
    // Include ALL balances (positive and negative) as they are
    return sum + balance;
  }, 0);

  // For net worth calculation, we don't separate Plaid assets/liabilities
  // We just use the total balance (which can be positive or negative)
  const totalAssets = manualAssetsTotal + Math.max(0, plaidAssetsTotal);
  const totalLiabilities = manualLiabilitiesTotal + Math.max(0, -plaidAssetsTotal);
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

  // Calculate additional advanced metrics
  const monthlyExpenses =
    metrics.totalLiabilities > 0
      ? metrics.totalLiabilities * 0.03
      : Object.values(metrics.monthlySpending).reduce((a, b) => a + b, 0) /
        Object.keys(metrics.monthlySpending).length;
  const emergencyFundMonths = monthlyExpenses > 0 ? metrics.totalAssets / monthlyExpenses : 0;
  const debtToAssetRatio =
    metrics.totalAssets > 0 ? (metrics.totalLiabilities / metrics.totalAssets) * 100 : 0;

  promptContent += `

Advanced Financial Metrics:
- Emergency Fund Coverage: ${emergencyFundMonths.toFixed(1)} months of expenses
- Debt-to-Asset Ratio: ${debtToAssetRatio.toFixed(1)}%
- Estimated Monthly Expenses: $${monthlyExpenses.toLocaleString()}`;

  promptContent += `

You are an expert financial advisor with deep knowledge of personal finance best practices. Based on this comprehensive financial data, provide 4-6 sophisticated and highly actionable insights that will meaningfully improve the user's financial health.

Advanced Focus Areas for Insights:
1. **Cash Flow & Liquidity Analysis:** Analyze emergency fund adequacy, cash flow patterns, and liquidity risk. Provide specific recommendations for optimizing cash positions.
2. **Debt Optimization Strategy:** If debt exists, provide detailed debt payoff strategies including avalanche vs. snowball methods, refinancing opportunities, and debt consolidation analysis.
3. **Spending Pattern Intelligence:** Identify subtle spending trends, seasonal patterns, and behavioral insights. Suggest micro-optimizations and behavioral changes.
4. **Investment & Growth Strategy:** Analyze asset allocation opportunities, tax-advantaged account utilization, and wealth-building strategies appropriate for their financial situation.
5. **Risk Management & Protection:** Assess financial vulnerabilities, insurance gaps, and recommend protective measures.
6. **Financial Health Score & Benchmarking:** Compare their metrics to optimal ranges and provide specific improvement strategies.

For each insight, provide:
- A clear, engaging "title" that captures the key opportunity or concern
- A detailed "description" that explains the analysis, implications, and why this matters for their financial future
- A list of 2-4 highly specific, time-bound, and actionable "actionItems" with dollar amounts and deadlines where appropriate
- A "priority" (high, medium, low) based on potential financial impact and urgency

Requirements for actionItems:
- Include specific dollar amounts when relevant (e.g., "Transfer $500 to emergency fund by month-end")
- Set realistic timeframes (e.g., "within 30 days", "by next month")
- Focus on high-impact, low-effort actions first
- Provide concrete next steps, not general advice

Also include:
- A comprehensive "summary" that synthesizes their overall financial position and trajectory
- Strategic "nextSteps" that outline a 3-6 month financial improvement roadmap

Format your entire response STRICTLY as a single JSON object with the following structure (no markdown, no conversational text outside the JSON values):
{
  "insights": [
    {
      "title": "string (engaging and specific)",
      "description": "string (detailed analysis and implications)",
      "actionItems": ["string (specific, time-bound, measurable action)"],
      "priority": "high" | "medium" | "low"
    }
  ],
  "summary": "string (comprehensive financial health assessment)",
  "nextSteps": ["string (strategic 3-6 month roadmap items)"]
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
    if (!idToken) {
      return new NextResponse('Unauthorized - Missing token', { status: 401 });
    }
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid as string;
    if (!userId) {
      return new NextResponse('Unauthorized - Invalid user ID', { status: 401 });
    }

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

    // Fetch Plaid access tokens from the plaidItems subcollection
    const plaidItemsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('plaidItems')
      .get();

    const plaidAccessTokens = plaidItemsSnapshot.docs.map((doc: any) => doc.data().accessToken);

    // Use the first access token (or undefined if none exist)
    const accessToken = plaidAccessTokens.length > 0 ? plaidAccessTokens[0] : undefined;

    const { transactions, manualAssets, manualLiabilities, plaidAccounts, plaidDataAvailable } =
      await fetchFinancialData(userId, accessToken);
    const metrics = calculateFinancialMetrics(
      transactions,
      manualAssets,
      manualLiabilities,
      plaidAccounts
    );

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
    const userIdFromError = (error as { userId?: string }).userId ?? 'unknown';
    logger.error('Critical error in GET /api/insights', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: userIdFromError,
    });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
