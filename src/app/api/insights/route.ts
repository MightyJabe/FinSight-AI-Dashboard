import { NextResponse } from 'next/server';
import { z } from 'zod';

import { AuditEventType, AuditSeverity, logSecurityEvent } from '@/lib/audit-logger';
import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { generateChatCompletion } from '@/lib/openai';
import { requirePlan } from '@/lib/plan-guard';

import { OpenAIInsights, openAIInsightsSchema } from './schemas';

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
function prepareOpenAIPrompt(
  metrics: any,
  plaidDataAvailable: boolean
): { role: 'system'; content: string }[] {
  let promptContent = `You are a specialized financial advisor AI assistant for Finsight AI. Your primary goal is to provide clear, actionable, and personalized financial insights. Analyze the user's data meticulously.

User's Financial Snapshot:
- Net Worth: $${metrics.netWorth.toLocaleString()}
- Total Assets: $${metrics.totalAssets.toLocaleString()}
- Total Liabilities: $${metrics.totalLiabilities.toLocaleString()}`;

  promptContent += `
- Monthly Income: $${(metrics.monthlyIncome || 0).toLocaleString()}
- Monthly Expenses: $${(metrics.monthlyExpenses || 0).toLocaleString()}
- Monthly Cash Flow: $${(metrics.monthlyCashFlow || 0).toLocaleString()}`;

  if (plaidDataAvailable) {
    promptContent += `
- Connected Accounts: Bank accounts, credit cards, and investment accounts are linked`;
  }

  if (!plaidDataAvailable) {
    promptContent += `

Important Note: Detailed transaction data (spending, income) from linked bank accounts is currently unavailable or incomplete. Therefore, insights regarding spending patterns will be general. Insights will primarily focus on net worth, assets, and liabilities. For more detailed spending analysis and personalized budgeting advice, please ensure bank accounts are linked and transactions are up to date.`;
  }

  // Calculate additional advanced metrics
  const monthlyExpenses = metrics.monthlyExpenses || 0;
  const emergencyFundMonths =
    monthlyExpenses > 0 ? (metrics.liquidAssets || metrics.totalAssets) / monthlyExpenses : 0;
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
    // Clean the response - remove markdown code blocks if present
    let cleanContent = openAIResponseContent.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsedContent = JSON.parse(cleanContent);
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

    const allowed = await requirePlan(userId, 'pro');
    if (!allowed) {
      await logSecurityEvent(AuditEventType.UNAUTHORIZED_ACCESS, AuditSeverity.HIGH, {
        userId,
        endpoint: '/api/insights',
        resource: 'ai_insights',
        errorMessage: 'Pro plan required for AI insights',
      });
      return NextResponse.json(
        { success: false, error: 'Pro plan required for AI insights' },
        { status: 402 }
      );
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

    // Use the centralized financial calculator
    const { getFinancialOverview } = await import('@/lib/financial-calculator');
    const { enforceFinancialAccuracy } = await import('@/lib/financial-validator');
    const { data: financialData, metrics: calculatedMetrics } = await getFinancialOverview(userId);

    // Enforce accuracy before using in AI analysis
    enforceFinancialAccuracy(calculatedMetrics, 'insights API');

    const plaidDataAvailable = financialData.plaidAccounts.length > 0;

    const metrics = {
      netWorth: calculatedMetrics.netWorth,
      totalAssets: calculatedMetrics.totalAssets,
      totalLiabilities: calculatedMetrics.totalLiabilities,
      monthlyIncome: calculatedMetrics.monthlyIncome,
      monthlyExpenses: calculatedMetrics.monthlyExpenses,
      monthlyCashFlow: calculatedMetrics.monthlyCashFlow,
      liquidAssets: calculatedMetrics.liquidAssets,
      spendingByCategory: {},
      monthlySpending: {
        [new Date().toISOString().substring(0, 7)]: calculatedMetrics.monthlyExpenses,
      },
    };

    const openAIMessages = prepareOpenAIPrompt(metrics, plaidDataAvailable);
    let openAIResponse;

    try {
      openAIResponse = await generateChatCompletion(openAIMessages, {
        model: 'gpt-4o',
        maxTokens: 2000,
      });
    } catch (error) {
      logger.error('OpenAI API call failed', { error, userId });
      // Return fallback insights
      return NextResponse.json({
        insights: [
          {
            title: 'AI Insights Temporarily Unavailable',
            description:
              'Unable to generate AI insights at this time. Your financial data is safe and available.',
            actionItems: ['Try refreshing the page', 'Check back in a few minutes'],
            priority: 'low',
          },
        ],
        summary: 'AI analysis temporarily unavailable',
        nextSteps: ['Refresh the page to try again'],
        metrics,
        plaidDataAvailable,
      });
    }

    if (!openAIResponse.content || openAIResponse.content.trim() === '') {
      logger.error('OpenAI returned empty response', { userId, metrics });

      // Generate basic insights from metrics
      const basicInsights = [];

      if (metrics.netWorth > 0) {
        basicInsights.push({
          title: 'Positive Net Worth',
          description: `Your net worth is $${metrics.netWorth.toLocaleString()}. You have more assets than liabilities, which is a strong financial position.`,
          actionItems: ['Continue building your emergency fund', 'Consider investing surplus cash'],
          priority: 'medium' as const,
        });
      }

      if (metrics.monthlyExpenses > 0 && metrics.monthlyIncome > 0) {
        const savingsRate = (metrics.monthlyCashFlow / metrics.monthlyIncome) * 100;
        basicInsights.push({
          title: savingsRate > 20 ? 'Strong Savings Rate' : 'Improve Savings Rate',
          description: `You're saving ${savingsRate.toFixed(1)}% of your income. ${savingsRate > 20 ? 'Great job!' : 'Try to increase this to at least 20%.'}`,
          actionItems:
            savingsRate > 20
              ? ['Maintain your savings habit', 'Consider investing more']
              : ['Review expenses for cuts', 'Automate savings'],
          priority: savingsRate > 20 ? ('low' as const) : ('high' as const),
        });
      }

      if (basicInsights.length === 0) {
        basicInsights.push({
          title: 'Start Tracking Your Finances',
          description: 'Connect your accounts and add transactions to get personalized insights.',
          actionItems: ['Connect a bank account', 'Add manual transactions', 'Set financial goals'],
          priority: 'high' as const,
        });
      }

      return NextResponse.json({
        insights: basicInsights,
        summary:
          'AI insights temporarily unavailable. Here are some basic recommendations based on your data.',
        nextSteps: [
          'Try refreshing insights',
          'Add more financial data for better recommendations',
        ],
        metrics,
        plaidDataAvailable,
      });
    }

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
        monthlyIncome: Number(metrics.monthlyIncome) || 0,
        monthlyExpenses: Number(metrics.monthlyExpenses) || 0,
        monthlyCashFlow: Number(metrics.monthlyCashFlow) || 0,
        liquidAssets: Number(metrics.liquidAssets) || 0,
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
