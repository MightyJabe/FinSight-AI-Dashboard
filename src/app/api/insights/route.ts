import { formatISO } from 'date-fns';
import { NextResponse } from 'next/server';

import { auth, db } from '@/lib/firebase-admin';
import { generateChatCompletion } from '@/lib/openai';
import { getTransactions } from '@/lib/plaid';

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

    // Check if force refresh is requested
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('force') === 'true';

    if (!forceRefresh) {
      // Check for cached insights
      const insightsDoc = await db
        .collection('users')
        .doc(userId)
        .collection('insights')
        .doc('latest')
        .get();

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      if (insightsDoc.exists) {
        const cachedData = insightsDoc.data();
        if (cachedData) {
          const cachedAt = cachedData.cachedAt?.toDate();
          if (cachedAt && cachedAt > oneDayAgo) {
            console.log('Returning cached insights from:', cachedAt);
            return NextResponse.json(cachedData);
          }
        }
      }
    }

    // Fetch user's financial data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const accessToken = userData?.plaidAccessToken;

    // Get transactions for the last 90 days
    const endDate = formatISO(new Date(), {
      representation: 'date',
    });
    const startDate = formatISO(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), {
      representation: 'date',
    });

    let transactions: Transaction[] = [];
    let spendingByCategory: Record<string, number> = {};
    let monthlySpending: Record<string, number> = {};

    if (accessToken) {
      try {
        const plaidTransactions = await getTransactions(accessToken, startDate, endDate);
        transactions = plaidTransactions.map(txn => ({
          name: txn.name,
          amount: txn.amount,
          date: txn.date,
          category: txn.category || [],
        }));

        // Calculate spending by category
        spendingByCategory = transactions.reduce(
          (acc, txn) => {
            const category = txn.category[0] || 'Uncategorized';
            acc[category] = (acc[category] || 0) + Math.abs(txn.amount);
            return acc;
          },
          {} as Record<string, number>
        );

        // Calculate monthly spending
        monthlySpending = transactions.reduce(
          (acc, txn) => {
            const month = txn.date.substring(0, 7); // YYYY-MM
            acc[month] = (acc[month] || 0) + Math.abs(txn.amount);
            return acc;
          },
          {} as Record<string, number>
        );
      } catch (error) {
        console.error('Error fetching Plaid transactions:', error);
        // Continue without Plaid data
      }
    }

    // Get manual assets and liabilities
    const assetsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('manualAssets')
      .get();
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

    // Calculate financial metrics
    const totalAssets = manualAssets.reduce((sum, a) => sum + a.amount, 0);
    const totalLiabilities = manualLiabilities.reduce((sum, l) => sum + l.amount, 0);
    const netWorth = totalAssets - totalLiabilities;

    // Generate AI insights
    const messages = [
      {
        role: 'system' as const,
        content: `You are a specialized financial advisor AI assistant for Finsight AI. Your role is to provide personalized financial insights based on the user's data.

        Analyze the following financial data and provide insights:
        - Net Worth: $${netWorth}
        - Total Assets: $${totalAssets}
        - Total Liabilities: $${totalLiabilities}
        ${Object.keys(spendingByCategory).length > 0 ? `- Spending by Category: ${JSON.stringify(spendingByCategory)}` : ''}
        ${Object.keys(monthlySpending).length > 0 ? `- Monthly Spending: ${JSON.stringify(monthlySpending)}` : ''}
        
        Provide 3-5 actionable insights and recommendations based on this data. Focus on:
        1. Spending patterns and potential savings opportunities
        2. Debt management and reduction strategies
        3. Investment and wealth-building suggestions
        4. Risk assessment and financial health indicators

        Format your response as a JSON object with the following structure:
        {
          "insights": [
            {
              "title": "string",
              "description": "string",
              "actionItems": ["string"],
              "priority": "high" | "medium" | "low"
            }
          ],
          "summary": "string",
          "nextSteps": ["string"]
        }`,
      },
    ];

    const insights = await generateChatCompletion(messages);

    // Parse the JSON response
    let insightsData;
    try {
      insightsData = JSON.parse(insights.content);
    } catch (error) {
      console.error('Error parsing insights JSON:', error);
      // Fallback to simple string parsing if JSON parsing fails
      insightsData = {
        insights: insights.content
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => ({
            title: line.split(':')[0]?.trim() || 'Insight',
            description: line.split(':')[1]?.trim() || line.trim(),
            actionItems: [],
            priority: 'medium',
          })),
        summary: 'Financial insights generated',
        nextSteps: ['Review your spending patterns', 'Consider the suggested actions'],
      };
    }

    // Add metrics to the response
    const responseData = {
      ...insightsData,
      metrics: {
        netWorth,
        totalAssets,
        totalLiabilities,
        spendingByCategory,
        monthlySpending,
      },
      cachedAt: new Date(),
    };

    // Cache the insights
    await db.collection('users').doc(userId).collection('insights').doc('latest').set(responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error generating insights:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
