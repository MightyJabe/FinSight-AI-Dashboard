// Investment advisor types and functions
export interface PortfolioAllocation {
  symbol: string;
  name: string;
  assetClass: string;
  currentPercentage: number;
  recommendedPercentage: number;
  targetPercentage: number;
  currentValue: number;
  recommendedValue: number;
  amount: number;
  variance: number;
  recommendation: string;
}

export interface PortfolioAnalysis {
  insights: Array<{
    id: string;
    title: string;
    description: string;
    type: 'opportunity' | 'risk' | 'info';
  }>;
  allocations: PortfolioAllocation[];
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    expectedReturn: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  totalValue: number;
  riskScore: number;
  diversificationScore: number;
  expectedReturn: number;
  rebalancingNeeded: boolean;
  nextRebalanceDate: string;
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    riskLevel: 'low' | 'medium' | 'high';
    score: number;
    riskScore: number;
    sharpeRatio: number;
    volatility: number;
    beta: number;
    diversificationScore: number;
    factors: string[];
  };
  performance: {
    daily: number;
    monthly: number;
    yearly: number;
    total: number;
    totalReturn: number;
    ytdReturn: number;
    alpha: number;
    annualizedReturn: number;
    benchmark: string;
    benchmarkReturn: number;
  };
}
