// Budget recommendations types and functions
export interface BudgetAlert {
  id: string;
  type: 'warning' | 'info' | 'success';
  severity: 'high' | 'medium' | 'low' | 'critical';
  title: string;
  message: string;
  category?: string;
  amount: number;
  percentage?: number;
  priority: 'high' | 'medium' | 'low' | 'critical';
  suggestedAction?: string;
}

export interface BudgetRecommendation {
  id: string;
  title: string;
  description: string;
  reasoning?: string;
  category: string;
  currentAmount: number;
  currentBudget: number;
  currentSpending: number;
  recommendedAmount: number;
  recommendedBudget: number;
  potentialSavings: number;
  priority: 'high' | 'medium' | 'low';
  actionType: 'reduce' | 'increase' | 'maintain';
}

export interface SmartBudgetAnalysis {
  alerts: BudgetAlert[];
  recommendations: BudgetRecommendation[];
  recommendedAllocations: BudgetRecommendation[];
  insights: {
    savingsRate: number;
    recommendedSavingsRate: number;
    budgetEfficiency: number;
  };
  actionItems: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  totalPotentialSavings: number;
  confidence: number;
}

export interface BudgetAnalysis {
  alerts: BudgetAlert[];
  recommendations: BudgetRecommendation[];
  recommendedAllocations: BudgetRecommendation[];
  actionItems: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  totalPotentialSavings: number;
  confidence: number;
}
