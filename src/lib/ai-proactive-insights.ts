import type { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';
import { generateChatCompletion } from '@/lib/openai';

import { getTransactionService } from '@/lib/services/transaction-service';

export interface ProactiveInsight {
  id?: string;
  userId: string;
  type: 'weekly_summary' | 'monthly_report' | 'unusual_spending' | 'bill_reminder' | 'opportunity';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  status: 'new' | 'read' | 'archived';
  createdAt: Date;
  data?: any;
}

export class ProactiveInsightsService {
  private userId: string;
  private db = adminDb;

  constructor(userId: string) {
    this.userId = userId;
  }

  async generateWeeklySummary(): Promise<ProactiveInsight> {
    try {
      const transactionService = getTransactionService(this.userId);
      const transactions = await transactionService.getTransactions(7);

      const totalSpending = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const prompt = `Generate a brief weekly financial summary for a user with:
- Total spending: $${totalSpending.toFixed(2)}
- Total income: $${totalIncome.toFixed(2)}
- Net: $${(totalIncome - totalSpending).toFixed(2)}
- Transaction count: ${transactions.length}

Keep it under 100 words, friendly tone, highlight key insights.`;

      const response = await generateChatCompletion([
        { role: 'system', content: 'You are a financial advisor providing weekly summaries.' },
        { role: 'user', content: prompt },
      ]);

      const insight: ProactiveInsight = {
        userId: this.userId,
        type: 'weekly_summary',
        title: 'Your Week in Finance',
        content: response.content,
        priority: 'medium',
        status: 'new',
        createdAt: new Date(),
        data: { totalSpending, totalIncome, transactionCount: transactions.length },
      };

      await this.saveInsight(insight);
      return insight;
    } catch (error) {
      logger.error('Error generating weekly summary', { error, userId: this.userId });
      throw error;
    }
  }

  async generateMonthlySummary(): Promise<ProactiveInsight> {
    try {
      // Use SSOT from financial-calculator
      const { getFinancialOverview } = await import('@/lib/financial-calculator');
      const { metrics } = await getFinancialOverview(this.userId);

      const prompt = `Generate a comprehensive monthly financial report for a user with:
- Total spending: $${metrics.monthlyExpenses.toFixed(2)}
- Total income: $${metrics.monthlyIncome.toFixed(2)}
- Net savings: $${metrics.monthlyCashFlow.toFixed(2)}
- Current balance: $${metrics.liquidAssets.toFixed(2)}
- Net worth: $${metrics.netWorth.toFixed(2)}
- Savings rate: ${((metrics.monthlyCashFlow / (metrics.monthlyIncome || 1)) * 100).toFixed(1)}%

Provide 3 key insights and 2 actionable recommendations. Keep under 150 words.`;

      const response = await generateChatCompletion([
        { role: 'system', content: 'You are a financial advisor providing monthly reports.' },
        { role: 'user', content: prompt },
      ]);

      const insight: ProactiveInsight = {
        userId: this.userId,
        type: 'monthly_report',
        title: 'Monthly Financial Health Report',
        content: response.content,
        priority: 'high',
        status: 'new',
        createdAt: new Date(),
        data: {
          totalSpending: metrics.monthlyExpenses,
          totalIncome: metrics.monthlyIncome,
          totalBalance: metrics.liquidAssets,
          netWorth: metrics.netWorth,
        },
      };

      await this.saveInsight(insight);
      return insight;
    } catch (error) {
      logger.error('Error generating monthly summary', { error, userId: this.userId });
      throw error;
    }
  }

  async detectUnusualSpending(): Promise<ProactiveInsight | null> {
    try {
      const transactionService = getTransactionService(this.userId);
      const recentTransactions = await transactionService.getTransactions(7);
      const historicalTransactions = await transactionService.getTransactions(30);

      const recentAvg =
        recentTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) /
        7;

      const historicalAvg =
        historicalTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0) / 30;

      if (recentAvg > historicalAvg * 1.5) {
        const insight: ProactiveInsight = {
          userId: this.userId,
          type: 'unusual_spending',
          title: 'Unusual Spending Detected',
          content: `Your spending this week ($${(recentAvg * 7).toFixed(2)}) is 50% higher than your monthly average. Review your recent transactions to identify any unexpected expenses.`,
          priority: 'high',
          status: 'new',
          createdAt: new Date(),
          data: { recentAvg, historicalAvg },
        };

        await this.saveInsight(insight);
        return insight;
      }

      return null;
    } catch (error) {
      logger.error('Error detecting unusual spending', { error, userId: this.userId });
      return null;
    }
  }

  async getInsights(limit: number = 10): Promise<ProactiveInsight[]> {
    try {
      const snapshot = await this.db
        .collection('insights')
        .where('userId', '==', this.userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>): ProactiveInsight => ({
          id: doc.id,
          ...(doc.data() as Omit<ProactiveInsight, 'id'>),
          createdAt: doc.data().createdAt?.toDate(),
        })
      );
    } catch (error) {
      logger.error('Error getting insights', { error, userId: this.userId });
      return [];
    }
  }

  async markAsRead(insightId: string): Promise<void> {
    try {
      await this.db.collection('insights').doc(insightId).update({ status: 'read' });
    } catch (error) {
      logger.error('Error marking insight as read', { error, userId: this.userId });
    }
  }

  private async saveInsight(insight: ProactiveInsight): Promise<void> {
    try {
      await this.db.collection('insights').add(insight);
    } catch (error) {
      logger.error('Error saving insight', { error, userId: this.userId });
    }
  }
}

export function createProactiveInsightsService(userId: string): ProactiveInsightsService {
  return new ProactiveInsightsService(userId);
}
