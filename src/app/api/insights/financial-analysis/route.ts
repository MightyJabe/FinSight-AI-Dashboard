import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { getTransactions } from '@/lib/plaid';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Fetch user's financial data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const accessToken = userData?.plaidAccessToken;

    // Get transactions for the last 90 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    let transactions = [];
    if (accessToken) {
      const plaidTransactions = await getTransactions(accessToken, startDate, endDate);
      transactions = plaidTransactions.map(txn => ({
        name: txn.name,
        amount: txn.amount,
        date: txn.date,
        category: txn.category,
      }));
    }

    // Get manual assets and liabilities
    const assetsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('manualAssets')
      .get();
    const manualAssets = assetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const liabilitiesSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('manualLiabilities')
      .get();
    const manualLiabilities = liabilitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate financial metrics
    const totalAssets = manualAssets.reduce((sum, a) => sum + (a.amount || 0), 0);
    const totalLiabilities = manualLiabilities.reduce((sum, l) => sum + (l.amount || 0), 0);
    const netWorth = totalAssets - totalLiabilities;

    const monthlyIncome =
      transactions.filter(txn => txn.amount > 0).reduce((sum, txn) => sum + txn.amount, 0) / 3; // Average over 3 months

    const monthlyExpenses =
      transactions
        .filter(txn => txn.amount < 0)
        .reduce((sum, txn) => sum + Math.abs(txn.amount), 0) / 3;

    const savingsRate =
      monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    // Prepare data for AI analysis
    const financialData = {
      netWorth,
      totalAssets,
      totalLiabilities,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      transactions: transactions.slice(0, 50), // Limit to last 50 transactions for analysis
      assets: manualAssets,
      liabilities: manualLiabilities,
    };

    // Generate AI insights
    const prompt = `Analyze the following financial data and provide insights in JSON format with the following structure:
    {
      "financialHealth": {
        "score": number (0-100),
        "summary": string,
        "strengths": string[],
        "concerns": string[]
      },
      "spendingPatterns": {
        "topCategories": { category: string, amount: number }[],
        "analysis": string,
        "recommendations": string[]
      },
      "investmentInsights": {
        "portfolioDiversity": string,
        "riskAssessment": string,
        "suggestions": string[]
      },
      "budgetRecommendations": {
        "savingsTarget": number,
        "suggestions": string[]
      }
    }

    Financial Data:
    ${JSON.stringify(financialData, null, 2)}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4-turbo-preview',
      response_format: { type: 'json_object' },
    });

    const insights = JSON.parse(completion.choices[0].message.content);

    return NextResponse.json({
      insights,
      metrics: {
        netWorth,
        totalAssets,
        totalLiabilities,
        monthlyIncome,
        monthlyExpenses,
        savingsRate,
      },
    });
  } catch (error) {
    console.error('Error generating financial insights:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate financial insights',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
