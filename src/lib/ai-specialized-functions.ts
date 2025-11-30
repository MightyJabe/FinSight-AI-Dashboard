import logger from '@/lib/logger';
import { getAccountService } from '@/lib/services/account-service';
import { getUserBudgets } from '@/lib/services/budget-service';
import { getTransactionService } from '@/lib/services/transaction-service';

export interface SpecializedFunctionResult {
  success: boolean;
  data?: any;
  insights?: string[];
  recommendations?: string[];
  error?: string;
}

export class SpecializedAIFunctions {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async analyzeBudget(): Promise<SpecializedFunctionResult> {
    try {
      const transactionService = getTransactionService(this.userId);
      const transactions = await transactionService.getTransactions(30);
      const budgets = await getUserBudgets(this.userId);

      const categorySpending = transactions
        .filter(t => t.type === 'expense')
        .reduce(
          (acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
          },
          {} as Record<string, number>
        );

      const insights: string[] = [];
      const recommendations: string[] = [];

      Object.entries(budgets).forEach(([category, budget]) => {
        const spent = categorySpending[category] || 0;
        const percentage = (spent / budget) * 100;

        if (percentage > 100) {
          insights.push(
            `Over budget in ${category}: $${spent.toFixed(2)} / $${budget} (${percentage.toFixed(0)}%)`
          );
          recommendations.push(`Reduce ${category} spending by $${(spent - budget).toFixed(2)}`);
        } else if (percentage > 80) {
          insights.push(`Approaching limit in ${category}: ${percentage.toFixed(0)}% used`);
          recommendations.push(`Monitor ${category} spending closely`);
        }
      });

      return {
        success: true,
        data: { categorySpending, budgets },
        insights,
        recommendations,
      };
    } catch (error) {
      logger.error('Budget analysis error', { error, userId: this.userId });
      return { success: false, error: 'Failed to analyze budget' };
    }
  }

  async optimizeInvestments(): Promise<SpecializedFunctionResult> {
    try {
      const accountService = getAccountService(this.userId);
      const accounts = await accountService.getAccounts();
      const investmentAccounts = accounts.filter(a => a.type === 'investment');

      const totalInvestments = investmentAccounts.reduce((sum, a) => sum + a.balance, 0);
      const insights: string[] = [];
      const recommendations: string[] = [];

      if (totalInvestments === 0) {
        insights.push('No investment accounts detected');
        recommendations.push('Consider opening a retirement account (401k, IRA)');
        recommendations.push('Start with low-cost index funds');
      } else {
        insights.push(`Total investments: $${totalInvestments.toLocaleString()}`);

        if (investmentAccounts.length === 1) {
          recommendations.push('Diversify across multiple investment accounts');
        }

        recommendations.push('Review asset allocation quarterly');
        recommendations.push('Consider tax-advantaged accounts');
      }

      return {
        success: true,
        data: { investmentAccounts, totalInvestments },
        insights,
        recommendations,
      };
    } catch (error) {
      logger.error('Investment optimization error', { error, userId: this.userId });
      return { success: false, error: 'Failed to optimize investments' };
    }
  }

  async findTaxDeductions(): Promise<SpecializedFunctionResult> {
    try {
      const transactionService = getTransactionService(this.userId);
      const transactions = await transactionService.getTransactions(365);

      const deductibleCategories = ['Healthcare', 'Charity', 'Education', 'Business'];
      const potentialDeductions = transactions
        .filter(t => deductibleCategories.includes(t.category))
        .reduce(
          (acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
          },
          {} as Record<string, number>
        );

      const totalDeductions = Object.values(potentialDeductions).reduce((sum, amt) => sum + amt, 0);
      const insights: string[] = [];
      const recommendations: string[] = [];

      if (totalDeductions > 0) {
        insights.push(`Potential deductions: $${totalDeductions.toLocaleString()}`);
        Object.entries(potentialDeductions).forEach(([category, amount]) => {
          insights.push(`${category}: $${amount.toFixed(2)}`);
        });
        recommendations.push('Keep receipts for all deductible expenses');
        recommendations.push('Consult a tax professional for optimization');
      } else {
        insights.push('No obvious tax deductions found');
        recommendations.push('Track charitable donations');
        recommendations.push('Document business expenses');
      }

      return {
        success: true,
        data: { potentialDeductions, totalDeductions },
        insights,
        recommendations,
      };
    } catch (error) {
      logger.error('Tax deduction analysis error', { error, userId: this.userId });
      return { success: false, error: 'Failed to find tax deductions' };
    }
  }

  async createDebtPayoffPlan(): Promise<SpecializedFunctionResult> {
    try {
      const accountService = getAccountService(this.userId);
      const accounts = await accountService.getAccounts();
      const debtAccounts = accounts.filter(a => a.balance < 0);

      const totalDebt = Math.abs(debtAccounts.reduce((sum, a) => sum + a.balance, 0));
      const insights: string[] = [];
      const recommendations: string[] = [];

      if (totalDebt === 0) {
        insights.push('No debt detected - excellent!');
        recommendations.push('Maintain debt-free status');
        recommendations.push('Build emergency fund');
      } else {
        insights.push(`Total debt: $${totalDebt.toLocaleString()}`);

        const sortedDebts = debtAccounts
          .map(a => ({ name: a.name, balance: Math.abs(a.balance) }))
          .sort((a, b) => a.balance - b.balance);

        recommendations.push('Use avalanche method: pay highest interest first');
        recommendations.push(
          `Focus on: ${sortedDebts[0]?.name} ($${sortedDebts[0]?.balance.toFixed(2)})`
        );
        recommendations.push('Make minimum payments on all other debts');
      }

      return {
        success: true,
        data: { debtAccounts, totalDebt },
        insights,
        recommendations,
      };
    } catch (error) {
      logger.error('Debt payoff plan error', { error, userId: this.userId });
      return { success: false, error: 'Failed to create debt payoff plan' };
    }
  }

  async planSavingsGoal(
    goalAmount: number,
    timeframeMonths: number
  ): Promise<SpecializedFunctionResult> {
    try {
      const transactionService = getTransactionService(this.userId);
      const transactions = await transactionService.getTransactions(30);

      const monthlyIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlyExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlySavings = monthlyIncome - monthlyExpenses;
      const requiredMonthlySavings = goalAmount / timeframeMonths;

      const insights: string[] = [];
      const recommendations: string[] = [];

      insights.push(`Goal: $${goalAmount.toLocaleString()} in ${timeframeMonths} months`);
      insights.push(`Required monthly savings: $${requiredMonthlySavings.toFixed(2)}`);
      insights.push(`Current monthly surplus: $${monthlySavings.toFixed(2)}`);

      if (monthlySavings >= requiredMonthlySavings) {
        recommendations.push('Goal is achievable with current spending!');
        recommendations.push('Set up automatic transfers');
      } else {
        const gap = requiredMonthlySavings - monthlySavings;
        recommendations.push(`Need to save additional $${gap.toFixed(2)}/month`);
        recommendations.push('Review discretionary spending');
        recommendations.push('Consider additional income sources');
      }

      return {
        success: true,
        data: { goalAmount, timeframeMonths, requiredMonthlySavings, monthlySavings },
        insights,
        recommendations,
      };
    } catch (error) {
      logger.error('Savings goal planning error', { error, userId: this.userId });
      return { success: false, error: 'Failed to plan savings goal' };
    }
  }
}

export function createSpecializedFunctions(userId: string): SpecializedAIFunctions {
  return new SpecializedAIFunctions(userId);
}
