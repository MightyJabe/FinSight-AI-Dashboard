import { NextRequest, NextResponse } from 'next/server';

import { validateAuthToken } from '@/lib/auth-server';
import { getFinancialOverview } from '@/lib/financial-calculator';
import logger from '@/lib/logger';
import { generateChatCompletion } from '@/lib/openai';
import { analyzeExpenses, OptimizationOpportunity } from '@/lib/services/expense-optimizer';
import {
  calculateIsraeliRetirement,
  generateRetirementRecommendations,
  RetirementRecommendation,
} from '@/lib/services/israeli-retirement-calculator';
import { getPensionFunds } from '@/lib/services/pension-service';
import { getTransactionService } from '@/lib/services/transaction-service';
import {
  calculateMonthlyTotal,
  detectPriceIncrease,
  detectSubscriptions,
} from '@/lib/subscription-detector';

export interface ActionableRecommendation {
  id: string;
  category: 'savings' | 'subscriptions' | 'spending' | 'retirement' | 'emergency' | 'debt';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  potentialSavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeToImplement: string;
  actionSteps: string[];
  priority: number; // 1-10, higher = more important
}

/**
 * GET /api/insights/recommendations
 * Get personalized, actionable financial recommendations
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) {
      return authResult.error;
    }

    const userId = authResult.userId;

    // Gather all financial data in parallel
    const [financialOverview, pensionFunds, transactionsData] = await Promise.all([
      getFinancialOverview(userId),
      getPensionFunds(userId),
      (async () => {
        const service = getTransactionService(userId);
        return service.getTransactions(90);
      })(),
    ]);

    const { metrics } = financialOverview;

    // Format transactions for analysis
    const formattedTransactions = transactionsData.map(t => ({
      id: t.id,
      amount: t.amount,
      date: typeof t.date === 'string' ? t.date : new Date().toISOString(),
      description: t.description || 'Unknown',
      category: t.category || 'Other',
      type: t.type as 'income' | 'expense',
    }));

    // Run all analyses in parallel
    const [expenseAnalysis, subscriptions] = await Promise.all([
      analyzeExpenses(formattedTransactions, metrics.monthlyIncome || 15000, 20),
      Promise.resolve(detectSubscriptions(formattedTransactions)),
    ]);

    const recommendations: ActionableRecommendation[] = [];

    // 1. Subscription recommendations
    const monthlySubscriptionCost = calculateMonthlyTotal(subscriptions);
    if (monthlySubscriptionCost > metrics.monthlyIncome * 0.05) {
      // More than 5% on subscriptions
      recommendations.push({
        id: 'reduce-subscriptions',
        category: 'subscriptions',
        title: 'Review subscription spending',
        description: `You're spending ₪${monthlySubscriptionCost.toFixed(0)}/month on subscriptions (${((monthlySubscriptionCost / metrics.monthlyIncome) * 100).toFixed(1)}% of income). Consider canceling unused services.`,
        impact: 'high',
        potentialSavings: monthlySubscriptionCost * 0.3,
        difficulty: 'easy',
        timeToImplement: '1 hour',
        actionSteps: [
          'List all active subscriptions',
          'Check last usage for each service',
          'Cancel services not used in 30+ days',
          'Look for family/shared plans',
        ],
        priority: 8,
      });
    }

    // Check for subscription price increases
    subscriptions.forEach(sub => {
      const increase = detectPriceIncrease(sub);
      if (increase && increase.percentIncrease > 10) {
        recommendations.push({
          id: `price-increase-${sub.id}`,
          category: 'subscriptions',
          title: `${sub.merchant} raised prices`,
          description: `${sub.merchant} increased from ₪${increase.oldPrice.toFixed(0)} to ₪${increase.newPrice.toFixed(0)} (${increase.percentIncrease.toFixed(0)}% increase).`,
          impact: 'medium',
          potentialSavings: increase.newPrice - increase.oldPrice,
          difficulty: 'easy',
          timeToImplement: '30 minutes',
          actionSteps: [
            'Consider if service is worth new price',
            'Look for competitor alternatives',
            'Check for loyalty discounts',
          ],
          priority: 5,
        });
      }
    });

    // 2. Expense optimization recommendations
    expenseAnalysis.opportunities.forEach((opp: OptimizationOpportunity) => {
      recommendations.push({
        id: opp.id,
        category: 'spending',
        title: opp.title,
        description: opp.description,
        impact: opp.priority,
        potentialSavings: opp.potentialSavings,
        difficulty: opp.difficulty,
        timeToImplement: opp.difficulty === 'easy' ? '1 day' : opp.difficulty === 'medium' ? '1 week' : '1 month',
        actionSteps: opp.actionItems,
        priority: opp.priority === 'high' ? 9 : opp.priority === 'medium' ? 6 : 3,
      });
    });

    // 3. Emergency fund recommendation
    const recommendedEmergencyFund = metrics.monthlyExpenses * 6;
    const currentLiquid = metrics.liquidAssets;
    if (currentLiquid < recommendedEmergencyFund) {
      const gap = recommendedEmergencyFund - currentLiquid;
      recommendations.push({
        id: 'build-emergency-fund',
        category: 'emergency',
        title: 'Build your emergency fund',
        description: `Your liquid savings cover ${(currentLiquid / metrics.monthlyExpenses).toFixed(1)} months of expenses. Aim for 6 months (₪${recommendedEmergencyFund.toLocaleString()}).`,
        impact: 'high',
        potentialSavings: 0,
        difficulty: 'medium',
        timeToImplement: `${Math.ceil(gap / (metrics.monthlyCashFlow || 1000))} months`,
        actionSteps: [
          `Save ₪${Math.min(gap / 12, metrics.monthlyCashFlow * 0.5).toFixed(0)}/month toward emergency fund`,
          'Keep funds in high-yield savings account',
          'Set up automatic transfers',
          'Review and adjust as expenses change',
        ],
        priority: 10,
      });
    }

    // 4. Retirement recommendations (if pension data available)
    if (pensionFunds.funds.length > 0) {
      const retirementInputs = {
        currentAge: 35, // Default assumption - would get from user profile
        gender: 'male' as const,
        currentSalary: metrics.monthlyIncome,
        yearsWorked: 10,
        pensionFunds,
        additionalSavings: metrics.liquidAssets,
        desiredMonthlyIncome: metrics.monthlyExpenses * 0.8, // 80% of current expenses
        earlyRetirement: false,
      };

      const projection = calculateIsraeliRetirement(retirementInputs);
      const retirementRecs = generateRetirementRecommendations(projection, retirementInputs);

      retirementRecs.forEach((rec: RetirementRecommendation) => {
        recommendations.push({
          id: rec.id,
          category: 'retirement',
          title: rec.title,
          description: rec.description,
          impact: rec.impact,
          potentialSavings: 0,
          difficulty: 'medium',
          timeToImplement: 'ongoing',
          actionSteps: rec.actionItems,
          priority: rec.impact === 'high' ? 7 : 4,
        });
      });
    }

    // 5. Savings rate recommendation
    const savingsRate = metrics.monthlyIncome > 0
      ? (metrics.monthlyCashFlow / metrics.monthlyIncome) * 100
      : 0;

    if (savingsRate < 20) {
      const additionalSavingsNeeded = metrics.monthlyIncome * 0.2 - metrics.monthlyCashFlow;
      recommendations.push({
        id: 'increase-savings-rate',
        category: 'savings',
        title: 'Increase your savings rate',
        description: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for 20% to build long-term wealth.`,
        impact: 'high',
        potentialSavings: additionalSavingsNeeded * 12,
        difficulty: 'medium',
        timeToImplement: '1-3 months',
        actionSteps: [
          `Find ₪${additionalSavingsNeeded.toFixed(0)}/month in expense cuts`,
          'Automate savings transfers on payday',
          'Review and cancel unused subscriptions',
          'Look for ways to increase income',
        ],
        priority: 8,
      });
    }

    // 6. Debt-related recommendations (if liabilities exist)
    if (metrics.totalLiabilities > 0) {
      const debtToIncomeRatio = metrics.totalLiabilities / (metrics.monthlyIncome * 12);
      if (debtToIncomeRatio > 0.5) {
        recommendations.push({
          id: 'reduce-debt',
          category: 'debt',
          title: 'Focus on debt reduction',
          description: `Your total debt (₪${metrics.totalLiabilities.toLocaleString()}) is ${(debtToIncomeRatio * 100).toFixed(0)}% of annual income. Consider an aggressive payoff strategy.`,
          impact: 'high',
          potentialSavings: 0,
          difficulty: 'hard',
          timeToImplement: '1-5 years',
          actionSteps: [
            'List all debts with interest rates',
            'Consider debt avalanche (highest rate first) or snowball (lowest balance first)',
            'Look into balance transfer or consolidation options',
            'Avoid taking on new debt',
          ],
          priority: 9,
        });
      }
    }

    // Sort by priority
    recommendations.sort((a, b) => b.priority - a.priority);

    // Generate AI summary
    let aiSummary = '';
    try {
      const topRecs = recommendations.slice(0, 3);
      const prompt = `Based on a user's financial analysis, here are their top recommendations:
${topRecs.map((r, i) => `${i + 1}. ${r.title}: ${r.description}`).join('\n')}

Write a brief, encouraging 2-3 sentence summary for the user about their financial situation and top priorities. Be specific about numbers if available. Use Israeli Shekel (₪) for currency.`;

      const response = await generateChatCompletion([
        { role: 'system', content: 'You are a friendly Israeli financial advisor. Be encouraging but honest.' },
        { role: 'user', content: prompt },
      ]);
      aiSummary = response.content;
    } catch (error) {
      logger.warn('Failed to generate AI summary', { error });
      aiSummary = `You have ${recommendations.length} opportunities to improve your finances. Focus on the high-priority items first.`;
    }

    logger.info('Generated financial recommendations', {
      userId,
      recommendationCount: recommendations.length,
      topPriority: recommendations[0]?.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        recommendations: recommendations.slice(0, 10), // Top 10
        summary: {
          totalRecommendations: recommendations.length,
          totalPotentialSavings: recommendations.reduce((sum, r) => sum + r.potentialSavings, 0),
          highPriorityCount: recommendations.filter(r => r.priority >= 7).length,
          aiSummary,
        },
        metrics: {
          monthlyIncome: metrics.monthlyIncome,
          monthlyExpenses: metrics.monthlyExpenses,
          savingsRate,
          netWorth: metrics.netWorth,
        },
      },
    });
  } catch (error) {
    logger.error('Error in GET /api/insights/recommendations', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
