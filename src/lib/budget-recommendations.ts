import type { Transaction } from '@/types/finance';

export interface BudgetAlert {
  id: string;
  type: 'overspend' | 'approaching_limit' | 'unusual_spending' | 'opportunity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  message: string;
  amount: number;
  percentage?: number;
  suggestedAction: string;
  createdAt: string;
}

export interface BudgetRecommendation {
  category: string;
  currentSpending: number;
  recommendedBudget: number;
  currentBudget: number;
  variance: number;
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
  potentialSavings: number;
}

export interface SmartBudgetAnalysis {
  totalIncome: number;
  totalExpenses: number;
  recommendedAllocations: BudgetRecommendation[];
  alerts: BudgetAlert[];
  insights: {
    savingsRate: number;
    recommendedSavingsRate: number;
    emergencyFundMonths: number;
    highestSpendingCategory: string;
    variabilityScore: number;
    budgetEfficiency: number;
  };
  actionItems: string[];
}

export interface CategorySpending {
  category: string;
  amount: number;
  transactionCount: number;
  averagePerTransaction: number;
  monthlyTrend: number;
  volatility: number;
}

/**
 * 50/30/20 rule and other budget allocation strategies
 */
const BUDGET_RULES = {
  '50/30/20': {
    necessities: 0.50,
    wants: 0.30,
    savings: 0.20,
  },
  '70/20/10': {
    essentials: 0.70,
    savings: 0.20,
    discretionary: 0.10,
  },
  conservative: {
    necessities: 0.45,
    wants: 0.25,
    savings: 0.30,
  },
};

/**
 * Category mappings for budget allocation
 */
const CATEGORY_TYPES = {
  necessities: [
    'Housing', 'Rent', 'Mortgage', 'Utilities', 'Insurance',
    'Groceries', 'Transportation', 'Healthcare', 'Phone',
    'Internet', 'Minimum Debt Payments'
  ],
  wants: [
    'Dining Out', 'Entertainment', 'Shopping', 'Hobbies',
    'Subscriptions', 'Travel', 'Personal Care', 'Gym',
    'Coffee', 'Alcohol'
  ],
  savings: [
    'Savings', 'Investment', 'Emergency Fund', 'Retirement',
    'Extra Debt Payment'
  ],
};

/**
 * Analyze spending patterns by category
 */
export function analyzeSpendingByCategory(transactions: Transaction[]): CategorySpending[] {
  const categoryMap = new Map<string, Transaction[]>();
  
  // Group transactions by category (expenses only)
  transactions
    .filter(t => t.type === 'expense')
    .forEach(transaction => {
      const category = transaction.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(transaction);
    });

  const categorySpending: CategorySpending[] = [];

  categoryMap.forEach((categoryTransactions, category) => {
    const totalAmount = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const transactionCount = categoryTransactions.length;
    const averagePerTransaction = totalAmount / transactionCount;

    // Calculate monthly trend (comparing last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recent30Days = categoryTransactions.filter(t => 
      new Date(t.date) >= thirtyDaysAgo
    );
    const previous30Days = categoryTransactions.filter(t => 
      new Date(t.date) >= sixtyDaysAgo && new Date(t.date) < thirtyDaysAgo
    );

    const recentAmount = recent30Days.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const previousAmount = previous30Days.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const monthlyTrend = previousAmount > 0 ? ((recentAmount - previousAmount) / previousAmount) : 0;

    // Calculate volatility (standard deviation of transaction amounts)
    const amounts = categoryTransactions.map(t => Math.abs(t.amount));
    const mean = totalAmount / transactionCount;
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / transactionCount;
    const volatility = Math.sqrt(variance);

    categorySpending.push({
      category,
      amount: totalAmount,
      transactionCount,
      averagePerTransaction,
      monthlyTrend,
      volatility,
    });
  });

  return categorySpending.sort((a, b) => b.amount - a.amount);
}

/**
 * Generate AI-powered budget recommendations
 */
export function generateBudgetRecommendations(
  transactions: Transaction[],
  currentBudgets: { [category: string]: number } = {},
  monthlyIncome: number
): SmartBudgetAnalysis {
  const categorySpending = analyzeSpendingByCategory(transactions);
  
  // Calculate total expenses for insights
  const totalExpenses = categorySpending.reduce((sum, cat) => sum + cat.amount, 0);
  
  // Generate recommendations for each category
  const recommendedAllocations: BudgetRecommendation[] = [];
  
  categorySpending.forEach(spending => {
    const currentBudget = currentBudgets[spending.category] || 0;
    const recommendedBudget = calculateOptimalBudget(spending, monthlyIncome);
    const variance = ((spending.amount - currentBudget) / Math.max(currentBudget, 1)) * 100;
    
    recommendedAllocations.push({
      category: spending.category,
      currentSpending: spending.amount,
      recommendedBudget,
      currentBudget,
      variance,
      reasoning: generateBudgetReasoning(spending, recommendedBudget),
      priority: calculatePriority(spending, variance),
      potentialSavings: Math.max(0, spending.amount - recommendedBudget),
    });
  });

  // Generate alerts
  const alerts = generateBudgetAlerts(categorySpending, currentBudgets, recommendedAllocations);

  // Calculate insights
  const insights = {
    savingsRate: monthlyIncome > 0 ? ((monthlyIncome - totalExpenses) / monthlyIncome) * 100 : 0,
    recommendedSavingsRate: 20, // Target 20% savings rate
    emergencyFundMonths: calculateEmergencyFundMonths(totalExpenses, monthlyIncome),
    highestSpendingCategory: categorySpending[0]?.category || 'Unknown',
    variabilityScore: calculateVariabilityScore(categorySpending),
    budgetEfficiency: calculateBudgetEfficiency(categorySpending, currentBudgets),
  };

  // Generate action items
  const actionItems = generateActionItems(recommendedAllocations, insights, alerts);

  return {
    totalIncome: monthlyIncome,
    totalExpenses,
    recommendedAllocations,
    alerts,
    insights,
    actionItems,
  };
}

/**
 * Calculate optimal budget for a category
 */
function calculateOptimalBudget(
  spending: CategorySpending,
  monthlyIncome: number
): number {
  const categoryType = getCategoryType(spending.category);
  const baseAllocation = getBaseAllocation(categoryType, monthlyIncome);
  
  // Adjust based on historical spending patterns
  let adjustedBudget = baseAllocation;
  
  // If spending is volatile, add buffer
  if (spending.volatility > spending.averagePerTransaction * 0.5) {
    adjustedBudget *= 1.15; // Add 15% buffer for volatile categories
  }
  
  // If spending is trending up, adjust accordingly
  if (spending.monthlyTrend > 0.2) {
    adjustedBudget = Math.max(adjustedBudget, spending.amount * 1.1);
  } else if (spending.monthlyTrend < -0.2) {
    adjustedBudget = Math.min(adjustedBudget, spending.amount * 0.9);
  }
  
  // Ensure minimum viable budget for necessities
  if (categoryType === 'necessities') {
    adjustedBudget = Math.max(adjustedBudget, spending.amount * 0.8);
  }
  
  return Math.round(adjustedBudget);
}

/**
 * Determine category type for budget allocation
 */
function getCategoryType(category: string): 'necessities' | 'wants' | 'savings' {
  const categoryLower = category.toLowerCase();
  
  for (const [type, categories] of Object.entries(CATEGORY_TYPES)) {
    if (categories.some(cat => categoryLower.includes(cat.toLowerCase()))) {
      return type as 'necessities' | 'wants' | 'savings';
    }
  }
  
  // Default classification based on common patterns
  if (categoryLower.includes('food') || categoryLower.includes('transport') || 
      categoryLower.includes('util') || categoryLower.includes('rent')) {
    return 'necessities';
  }
  
  return 'wants'; // Default to wants
}

/**
 * Get base allocation for category type
 */
function getBaseAllocation(categoryType: 'necessities' | 'wants' | 'savings', monthlyIncome: number): number {
  const rule = BUDGET_RULES['50/30/20'];
  
  switch (categoryType) {
    case 'necessities':
      return monthlyIncome * rule.necessities * 0.1; // Divide among necessity categories
    case 'wants':
      return monthlyIncome * rule.wants * 0.08; // Divide among want categories
    case 'savings':
      return monthlyIncome * rule.savings * 0.5; // Larger allocation for savings categories
    default:
      return monthlyIncome * 0.05; // Default 5% for uncategorized
  }
}

/**
 * Generate reasoning for budget recommendation
 */
function generateBudgetReasoning(
  spending: CategorySpending,
  recommendedBudget: number
): string {
  const change = recommendedBudget - spending.amount;
  const changePercent = Math.abs(change / Math.max(spending.amount, 1)) * 100;
  
  if (Math.abs(change) < spending.amount * 0.1) {
    return `Your spending in this category is well-balanced. Continue current patterns.`;
  }
  
  if (change > 0) {
    return `Consider increasing budget by $${Math.abs(change).toFixed(0)} (${changePercent.toFixed(0)}%) due to ${
      spending.monthlyTrend > 0.1 ? 'increasing spending trend' : 'spending volatility'
    }.`;
  } else {
    return `Potential savings of $${Math.abs(change).toFixed(0)} (${changePercent.toFixed(0)}%) by ${
      spending.volatility > spending.averagePerTransaction * 0.3 ? 'reducing inconsistent spending' : 'optimizing expenses'
    }.`;
  }
}

/**
 * Calculate recommendation priority
 */
function calculatePriority(spending: CategorySpending, variance: number): 'low' | 'medium' | 'high' {
  if (Math.abs(variance) > 50 || spending.amount > 1000) {
    return 'high';
  } else if (Math.abs(variance) > 25 || spending.amount > 500) {
    return 'medium';
  }
  return 'low';
}

/**
 * Generate budget alerts
 */
function generateBudgetAlerts(
  categorySpending: CategorySpending[],
  currentBudgets: { [category: string]: number },
  recommendations: BudgetRecommendation[]
): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];
  let alertId = 1;

  categorySpending.forEach(spending => {
    const currentBudget = currentBudgets[spending.category] || 0;
    
    if (currentBudget > 0) {
      const usagePercentage = (spending.amount / currentBudget) * 100;
      
      // Overspend alert
      if (usagePercentage > 100) {
        alerts.push({
          id: `alert-${alertId++}`,
          type: 'overspend',
          severity: usagePercentage > 150 ? 'critical' : 'high',
          category: spending.category,
          title: `Budget Exceeded: ${spending.category}`,
          message: `You've spent $${spending.amount.toFixed(0)} against a budget of $${currentBudget.toFixed(0)} (${usagePercentage.toFixed(0)}% usage).`,
          amount: spending.amount - currentBudget,
          percentage: usagePercentage,
          suggestedAction: `Review ${spending.category} expenses and consider reducing discretionary spending in this category.`,
          createdAt: new Date().toISOString(),
        });
      }
      // Approaching limit alert
      else if (usagePercentage > 80) {
        alerts.push({
          id: `alert-${alertId++}`,
          type: 'approaching_limit',
          severity: usagePercentage > 90 ? 'high' : 'medium',
          category: spending.category,
          title: `Approaching Budget Limit: ${spending.category}`,
          message: `You've used ${usagePercentage.toFixed(0)}% of your ${spending.category} budget ($${spending.amount.toFixed(0)} of $${currentBudget.toFixed(0)}).`,
          amount: currentBudget - spending.amount,
          percentage: usagePercentage,
          suggestedAction: `Monitor ${spending.category} spending carefully for the rest of the month.`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Unusual spending alert
    if (spending.monthlyTrend > 0.5) {
      alerts.push({
        id: `alert-${alertId++}`,
        type: 'unusual_spending',
        severity: spending.monthlyTrend > 1.0 ? 'high' : 'medium',
        category: spending.category,
        title: `Unusual Spending Increase: ${spending.category}`,
        message: `${spending.category} spending has increased by ${(spending.monthlyTrend * 100).toFixed(0)}% compared to last month.`,
        amount: spending.amount,
        suggestedAction: `Review recent ${spending.category} transactions to identify the cause of increased spending.`,
        createdAt: new Date().toISOString(),
      });
    }
  });

  // Opportunity alerts (potential savings)
  const highSavingsOpportunities = recommendations
    .filter(rec => rec.potentialSavings > 100 && rec.priority === 'high')
    .slice(0, 2);

  highSavingsOpportunities.forEach(rec => {
    alerts.push({
      id: `alert-${alertId++}`,
      type: 'opportunity',
      severity: 'low',
      category: rec.category,
      title: `Savings Opportunity: ${rec.category}`,
      message: `You could potentially save $${rec.potentialSavings.toFixed(0)} per month in ${rec.category}.`,
      amount: rec.potentialSavings,
      suggestedAction: rec.reasoning,
      createdAt: new Date().toISOString(),
    });
  });

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

/**
 * Calculate emergency fund months
 */
function calculateEmergencyFundMonths(monthlyExpenses: number, monthlyIncome: number): number {
  // This would typically come from user's savings data
  // For now, estimate based on savings rate
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) : 0;
  return Math.max(0, savingsRate * 12); // Simplified calculation
}

/**
 * Calculate spending variability score
 */
function calculateVariabilityScore(categorySpending: CategorySpending[]): number {
  const totalVolatility = categorySpending.reduce((sum, cat) => sum + cat.volatility, 0);
  const totalSpending = categorySpending.reduce((sum, cat) => sum + cat.amount, 0);
  return totalSpending > 0 ? (totalVolatility / totalSpending) * 100 : 0;
}

/**
 * Calculate budget efficiency score
 */
function calculateBudgetEfficiency(
  categorySpending: CategorySpending[],
  currentBudgets: { [category: string]: number }
): number {
  let totalEfficiency = 0;
  let categoriesWithBudget = 0;

  categorySpending.forEach(spending => {
    const budget = currentBudgets[spending.category];
    if (budget && budget > 0) {
      const efficiency = Math.min(100, (budget / spending.amount) * 100);
      totalEfficiency += efficiency;
      categoriesWithBudget++;
    }
  });

  return categoriesWithBudget > 0 ? totalEfficiency / categoriesWithBudget : 0;
}

/**
 * Generate actionable items
 */
function generateActionItems(
  recommendations: BudgetRecommendation[],
  insights: SmartBudgetAnalysis['insights'],
  alerts: BudgetAlert[]
): string[] {
  const actionItems: string[] = [];

  // High priority recommendations
  const highPriorityRecs = recommendations.filter(rec => rec.priority === 'high').slice(0, 3);
  highPriorityRecs.forEach(rec => {
    if (rec.potentialSavings > 50) {
      actionItems.push(`Review ${rec.category} budget: ${rec.reasoning}`);
    }
  });

  // Savings rate improvement
  if (insights.savingsRate < insights.recommendedSavingsRate) {
    const shortfall = insights.recommendedSavingsRate - insights.savingsRate;
    actionItems.push(`Increase savings rate by ${shortfall.toFixed(1)}% to reach the recommended 20%`);
  }

  // Critical alerts
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  if (criticalAlerts.length > 0) {
    actionItems.push(`Address ${criticalAlerts.length} critical budget overspend(s) immediately`);
  }

  // High variability
  if (insights.variabilityScore > 30) {
    actionItems.push('Create more consistent spending patterns to improve budget predictability');
  }

  // Efficiency improvement
  if (insights.budgetEfficiency < 70) {
    actionItems.push('Review and adjust budgets to better align with actual spending patterns');
  }

  return actionItems.slice(0, 5); // Limit to top 5 action items
}