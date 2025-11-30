// Cash flow forecasting types and functions
export interface CashFlowPrediction {
  date: string;
  predictedBalance: number;
  predictedIncome: number;
  predictedExpenses: number;
  confidence: number;
}

export interface CashFlowForecast {
  predictions: CashFlowPrediction[];
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    impact: number;
  }>;
  insights: {
    avgMonthlyIncome: number;
    avgMonthlyExpenses: number;
    monthlyNetChange: number;
    recurringTransactions: number;
    volatility: number;
  };
  currentBalance: number;
  confidence: number;
  timeframe: string;
}
