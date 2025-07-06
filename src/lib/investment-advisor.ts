import type { InvestmentAccount } from '@/types/finance';

export interface PortfolioAllocation {
  assetClass: string;
  currentPercentage: number;
  targetPercentage: number;
  currentValue: number;
  targetValue: number;
  variance: number;
  recommendation: 'buy' | 'sell' | 'hold';
  amount: number;
}

export interface RiskAssessment {
  riskScore: number; // 1-10 scale
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive' | 'Very Aggressive';
  volatility: number;
  sharpeRatio: number;
  beta: number;
  diversificationScore: number;
}

export interface PortfolioRecommendation {
  type: 'rebalance' | 'diversify' | 'risk_adjustment' | 'tax_optimization' | 'fee_reduction';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expectedBenefit: string;
  timeframe: string;
  steps: string[];
  estimatedCost?: number;
  estimatedSavings?: number;
}

export interface PortfolioAnalysis {
  totalValue: number;
  allocations: PortfolioAllocation[];
  riskAssessment: RiskAssessment;
  recommendations: PortfolioRecommendation[];
  performance: {
    totalReturn: number;
    annualizedReturn: number;
    ytdReturn: number;
    monthlyReturn: number;
    benchmark: string;
    benchmarkReturn: number;
    alpha: number;
  };
  rebalancingNeeded: boolean;
  nextRebalanceDate: string;
  insights: string[];
}

/**
 * Standard asset allocation models
 */
const ALLOCATION_MODELS = {
  conservative: {
    stocks: 30,
    bonds: 60,
    reits: 5,
    commodities: 0,
    cash: 5,
  },
  moderate: {
    stocks: 60,
    bonds: 30,
    reits: 5,
    commodities: 0,
    cash: 5,
  },
  aggressive: {
    stocks: 80,
    bonds: 15,
    reits: 3,
    commodities: 0,
    cash: 2,
  },
  veryAggressive: {
    stocks: 90,
    bonds: 5,
    reits: 3,
    commodities: 0,
    cash: 2,
  },
};

/**
 * Asset class mappings for common securities
 */
const ASSET_CLASS_MAPPING = {
  stocks: [
    'equity', 'stock', 'etf', 'mutual fund', 'growth', 'value',
    'large cap', 'mid cap', 'small cap', 'international', 'domestic',
    'sp500', 's&p', 'nasdaq', 'russell', 'vanguard', 'fidelity',
    'technology', 'healthcare', 'financial', 'energy'
  ],
  bonds: [
    'bond', 'treasury', 'corporate', 'municipal', 'government',
    'fixed income', 'debt', 'notes', 'bills', 'tips'
  ],
  reits: [
    'reit', 'real estate', 'property', 'residential', 'commercial'
  ],
  commodities: [
    'gold', 'silver', 'oil', 'commodity', 'precious metals',
    'natural resources', 'energy'
  ],
  cash: [
    'cash', 'money market', 'savings', 'cd', 'certificate of deposit'
  ],
};

/**
 * Analyze investment portfolio and provide optimization recommendations
 */
export function analyzePortfolio(
  accounts: InvestmentAccount[],
  userAge: number = 35,
  riskTolerance: 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive' = 'moderate'
): PortfolioAnalysis {
  const totalValue = accounts.reduce((sum, account) => sum + account.currentBalance, 0);
  
  if (totalValue === 0) {
    return createEmptyAnalysis();
  }

  // Categorize holdings by asset class
  const currentAllocations = categorizeHoldings(accounts);
  
  // Determine target allocation based on age and risk tolerance
  const targetAllocation = getTargetAllocation(userAge, riskTolerance);
  
  // Calculate allocation recommendations
  const allocations = calculateAllocationRecommendations(
    currentAllocations,
    targetAllocation,
    totalValue
  );

  // Assess portfolio risk
  const riskAssessment = assessPortfolioRisk(currentAllocations, accounts);

  // Calculate performance metrics
  const performance = calculatePerformanceMetrics(accounts);

  // Generate recommendations
  const recommendations = generatePortfolioRecommendations(
    allocations,
    riskAssessment,
    performance,
    userAge
  );

  // Check if rebalancing is needed
  const rebalancingNeeded = allocations.some(alloc => Math.abs(alloc.variance) > 5);
  
  // Calculate next rebalance date (quarterly)
  const nextRebalanceDate = new Date();
  nextRebalanceDate.setMonth(nextRebalanceDate.getMonth() + 3);

  // Generate insights
  const insights = generatePortfolioInsights(allocations, riskAssessment, performance);

  return {
    totalValue,
    allocations,
    riskAssessment,
    recommendations,
    performance,
    rebalancingNeeded,
    nextRebalanceDate: nextRebalanceDate.toISOString().split('T')[0] as string,
    insights,
  };
}

/**
 * Categorize investment holdings by asset class
 */
function categorizeHoldings(accounts: InvestmentAccount[]): { [key: string]: number } {
  const allocations: { [key: string]: number } = {
    stocks: 0,
    bonds: 0,
    reits: 0,
    commodities: 0,
    cash: 0,
    other: 0,
  };

  accounts.forEach(account => {
    // For now, use simple heuristics based on account type and names
    // In a real implementation, you'd use security master data
    const accountName = account.name.toLowerCase();
    const accountType = account.type.toLowerCase();
    
    let classified = false;
    
    for (const [assetClass, keywords] of Object.entries(ASSET_CLASS_MAPPING)) {
      if (keywords.some(keyword => 
        accountName.includes(keyword) || accountType.includes(keyword)
      )) {
        allocations[assetClass] = (allocations[assetClass] || 0) + account.currentBalance;
        classified = true;
        break;
      }
    }
    
    if (!classified) {
      // Default classification based on account type
      if (accountType.includes('401k') || accountType.includes('ira') || accountType.includes('retirement')) {
        allocations.stocks = (allocations.stocks || 0) + account.currentBalance * 0.7; // Assume 70% stocks
        allocations.bonds = (allocations.bonds || 0) + account.currentBalance * 0.3; // 30% bonds
      } else if (accountType.includes('savings') || accountType.includes('checking')) {
        allocations.cash = (allocations.cash || 0) + account.currentBalance;
      } else {
        allocations.other = (allocations.other || 0) + account.currentBalance;
      }
    }
  });

  return allocations;
}

/**
 * Get target allocation based on age and risk tolerance
 */
function getTargetAllocation(
  age: number,
  riskTolerance: 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive'
): { [key: string]: number } {
  // Map very_aggressive to veryAggressive
  const modelKey = riskTolerance === 'very_aggressive' ? 'veryAggressive' : riskTolerance;
  let baseModel = ALLOCATION_MODELS[modelKey as keyof typeof ALLOCATION_MODELS];
  
  // Age-based adjustments (rule of thumb: stocks = 100 - age)
  const ageAdjustedStockPercentage = Math.max(20, Math.min(90, 100 - age));
  const currentStockPercentage = baseModel.stocks;
  const adjustment = ageAdjustedStockPercentage - currentStockPercentage;
  
  return {
    stocks: Math.max(0, baseModel.stocks + adjustment),
    bonds: Math.max(0, baseModel.bonds - adjustment * 0.7),
    reits: baseModel.reits,
    commodities: baseModel.commodities,
    cash: Math.max(0, baseModel.cash - adjustment * 0.3),
  };
}

/**
 * Calculate allocation recommendations
 */
function calculateAllocationRecommendations(
  current: { [key: string]: number },
  target: { [key: string]: number },
  totalValue: number
): PortfolioAllocation[] {
  const allocations: PortfolioAllocation[] = [];

  Object.keys(target).forEach(assetClass => {
    const currentValue = current[assetClass] || 0;
    const currentPercentage = (currentValue / totalValue) * 100;
    const targetPercentage = target[assetClass] || 0;
    const targetValue = (targetPercentage / 100) * totalValue;
    const variance = currentPercentage - targetPercentage;
    const amount = Math.abs(targetValue - currentValue);
    
    let recommendation: 'buy' | 'sell' | 'hold' = 'hold';
    if (variance > 2) {
      recommendation = 'sell';
    } else if (variance < -2) {
      recommendation = 'buy';
    }

    allocations.push({
      assetClass: assetClass.charAt(0).toUpperCase() + assetClass.slice(1),
      currentPercentage: Math.round(currentPercentage * 100) / 100,
      targetPercentage,
      currentValue,
      targetValue,
      variance: Math.round(variance * 100) / 100,
      recommendation,
      amount: Math.round(amount),
    });
  });

  return allocations.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
}

/**
 * Assess portfolio risk characteristics
 */
function assessPortfolioRisk(
  allocations: { [key: string]: number },
  _accounts: InvestmentAccount[]
): RiskAssessment {
  const totalValue = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  
  if (totalValue === 0) {
    return {
      riskScore: 1,
      riskLevel: 'Conservative',
      volatility: 0,
      sharpeRatio: 0,
      beta: 0,
      diversificationScore: 0,
    };
  }

  // Calculate risk score based on asset allocation
  const stockPercentage = (allocations.stocks || 0) / totalValue;
  const bondPercentage = (allocations.bonds || 0) / totalValue;
  const riskScore = Math.min(10, Math.max(1, 
    1 + (stockPercentage * 8) + (allocations.reits || 0) / totalValue * 2
  ));

  // Determine risk level
  let riskLevel: RiskAssessment['riskLevel'] = 'Conservative';
  if (riskScore >= 8) riskLevel = 'Very Aggressive';
  else if (riskScore >= 6) riskLevel = 'Aggressive';
  else if (riskScore >= 4) riskLevel = 'Moderate';

  // Estimate volatility (simplified)
  const volatility = stockPercentage * 0.16 + bondPercentage * 0.04 + 
                    ((allocations.reits || 0) / totalValue) * 0.18;

  // Simplified metrics (in real app, calculate from historical data)
  const sharpeRatio = Math.max(0, (riskScore * 0.8 - 2) / volatility);
  const beta = 0.5 + stockPercentage * 0.8;
  
  // Diversification score based on number of different asset classes
  const assetClassCount = Object.values(allocations).filter(val => val > 0).length;
  const diversificationScore = Math.min(100, (assetClassCount / 5) * 100);

  return {
    riskScore: Math.round(riskScore * 10) / 10,
    riskLevel,
    volatility: Math.round(volatility * 1000) / 10, // Convert to percentage
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    beta: Math.round(beta * 100) / 100,
    diversificationScore: Math.round(diversificationScore),
  };
}

/**
 * Calculate portfolio performance metrics
 */
function calculatePerformanceMetrics(_accounts: InvestmentAccount[]) {
  // Simplified performance calculation
  // In real implementation, use historical data and benchmark comparisons
  
  // Mock performance data (replace with real calculations)
  const totalReturn = 0.08; // 8% total return
  const annualizedReturn = 0.07; // 7% annualized
  const ytdReturn = 0.05; // 5% YTD
  const monthlyReturn = 0.01; // 1% monthly
  const benchmarkReturn = 0.06; // 6% benchmark (S&P 500)
  const alpha = annualizedReturn - benchmarkReturn;

  return {
    totalReturn: Math.round(totalReturn * 1000) / 10,
    annualizedReturn: Math.round(annualizedReturn * 1000) / 10,
    ytdReturn: Math.round(ytdReturn * 1000) / 10,
    monthlyReturn: Math.round(monthlyReturn * 1000) / 10,
    benchmark: 'S&P 500',
    benchmarkReturn: Math.round(benchmarkReturn * 1000) / 10,
    alpha: Math.round(alpha * 1000) / 10,
  };
}

/**
 * Generate portfolio recommendations
 */
function generatePortfolioRecommendations(
  allocations: PortfolioAllocation[],
  risk: RiskAssessment,
  performance: PortfolioAnalysis['performance'],
  userAge: number
): PortfolioRecommendation[] {
  const recommendations: PortfolioRecommendation[] = [];

  // Rebalancing recommendations
  const significantVariances = allocations.filter(alloc => Math.abs(alloc.variance) > 5);
  if (significantVariances.length > 0) {
    recommendations.push({
      type: 'rebalance',
      priority: 'high',
      title: 'Portfolio Rebalancing Needed',
      description: `Your portfolio has drifted from target allocations. ${significantVariances.length} asset classes need rebalancing.`,
      expectedBenefit: 'Restore target risk level and optimize returns',
      timeframe: 'Next 30 days',
      steps: significantVariances.map(alloc => 
        `${alloc.recommendation.charAt(0).toUpperCase() + alloc.recommendation.slice(1)} $${alloc.amount.toLocaleString()} in ${alloc.assetClass}`
      ),
    });
  }

  // Diversification recommendations
  if (risk.diversificationScore < 60) {
    recommendations.push({
      type: 'diversify',
      priority: 'medium',
      title: 'Improve Portfolio Diversification',
      description: `Your diversification score is ${risk.diversificationScore}%. Consider adding more asset classes.`,
      expectedBenefit: 'Reduce portfolio volatility and risk',
      timeframe: 'Next 3 months',
      steps: [
        'Consider adding international equity exposure',
        'Add REITs for real estate diversification',
        'Include some bond allocation for stability',
      ],
    });
  }

  // Risk adjustment for age
  const stockAllocation = allocations.find(alloc => alloc.assetClass === 'Stocks');
  const idealStockPercentage = Math.max(20, 100 - userAge);
  if (stockAllocation && Math.abs(stockAllocation.currentPercentage - idealStockPercentage) > 10) {
    const direction = stockAllocation.currentPercentage > idealStockPercentage ? 'reduce' : 'increase';
    recommendations.push({
      type: 'risk_adjustment',
      priority: 'medium',
      title: `Age-Appropriate Risk Adjustment`,
      description: `Consider ${direction}ing stock allocation to ${idealStockPercentage}% based on your age.`,
      expectedBenefit: 'Align risk level with investment timeline',
      timeframe: 'Next 6 months',
      steps: [
        `${direction.charAt(0).toUpperCase() + direction.slice(1)} stock allocation gradually`,
        'Increase bond allocation for stability',
        'Review allocation annually as you age',
      ],
    });
  }

  // Performance-based recommendations
  if (performance.alpha < -2) {
    recommendations.push({
      type: 'fee_reduction',
      priority: 'medium',
      title: 'Consider Lower-Cost Investment Options',
      description: 'Your portfolio is underperforming the benchmark. High fees might be a factor.',
      expectedBenefit: 'Improve net returns by reducing investment costs',
      timeframe: 'Next 3 months',
      steps: [
        'Review expense ratios of current holdings',
        'Consider low-cost index funds or ETFs',
        'Evaluate advisor fees and services',
      ],
      estimatedSavings: 500, // Estimated annual savings
    });
  }

  return recommendations.slice(0, 4); // Limit to top 4 recommendations
}

/**
 * Generate portfolio insights
 */
function generatePortfolioInsights(
  allocations: PortfolioAllocation[],
  risk: RiskAssessment,
  performance: PortfolioAnalysis['performance']
): string[] {
  const insights: string[] = [];

  if (allocations.length === 0) {
    return ['No portfolio data available for analysis'];
  }

  // Asset allocation insights
  const dominantAsset = allocations.reduce((prev, current) => 
    prev.currentPercentage > current.currentPercentage ? prev : current
  );
  insights.push(
    `Your portfolio is primarily allocated to ${dominantAsset.assetClass.toLowerCase()} (${dominantAsset.currentPercentage}%)`
  );

  // Risk level insight
  insights.push(
    `Your portfolio has a ${risk.riskLevel.toLowerCase()} risk profile with a risk score of ${risk.riskScore}/10`
  );

  // Performance insight
  if (performance.alpha > 0) {
    insights.push(
      `Your portfolio is outperforming the ${performance.benchmark} benchmark by ${performance.alpha}%`
    );
  } else {
    insights.push(
      `Your portfolio is underperforming the ${performance.benchmark} benchmark by ${Math.abs(performance.alpha)}%`
    );
  }

  // Diversification insight
  if (risk.diversificationScore >= 80) {
    insights.push('Your portfolio shows excellent diversification across asset classes');
  } else if (risk.diversificationScore >= 60) {
    insights.push('Your portfolio has moderate diversification with room for improvement');
  } else {
    insights.push('Your portfolio would benefit from better diversification across asset classes');
  }

  // Volatility insight
  insights.push(
    `Expected portfolio volatility is ${risk.volatility}% based on current allocation`
  );

  return insights;
}

/**
 * Create empty analysis for portfolios with no value
 */
function createEmptyAnalysis(): PortfolioAnalysis {
  return {
    totalValue: 0,
    allocations: [],
    riskAssessment: {
      riskScore: 1,
      riskLevel: 'Conservative',
      volatility: 0,
      sharpeRatio: 0,
      beta: 0,
      diversificationScore: 0,
    },
    recommendations: [{
      type: 'diversify',
      priority: 'high',
      title: 'Start Building Your Investment Portfolio',
      description: 'You don\'t have any investment accounts yet. Consider starting with a diversified portfolio.',
      expectedBenefit: 'Begin building long-term wealth',
      timeframe: 'Next 30 days',
      steps: [
        'Open a retirement account (401k, IRA)',
        'Start with low-cost index funds',
        'Set up automatic monthly contributions',
        'Consider target-date funds for simplicity',
      ],
    }],
    performance: {
      totalReturn: 0,
      annualizedReturn: 0,
      ytdReturn: 0,
      monthlyReturn: 0,
      benchmark: 'S&P 500',
      benchmarkReturn: 0,
      alpha: 0,
    },
    rebalancingNeeded: false,
    nextRebalanceDate: new Date().toISOString().split('T')[0] as string,
    insights: [
      'Start investing early to take advantage of compound growth',
      'Diversification is key to managing investment risk',
      'Consider your age and risk tolerance when choosing investments',
    ],
  };
}

/**
 * Calculate optimal rebalancing strategy
 */
export function calculateRebalancingStrategy(
  allocations: PortfolioAllocation[],
  _totalValue: number,
  minTradeAmount: number = 100
): { trades: Array<{ assetClass: string; action: 'buy' | 'sell'; amount: number }>, totalCost: number } {
  const trades: Array<{ assetClass: string; action: 'buy' | 'sell'; amount: number }> = [];
  let totalCost = 0;

  allocations.forEach(allocation => {
    if (Math.abs(allocation.variance) > 2 && allocation.amount >= minTradeAmount) {
      const action = allocation.variance > 0 ? 'sell' : 'buy';
      trades.push({
        assetClass: allocation.assetClass,
        action,
        amount: allocation.amount,
      });
      
      // Estimate trading costs (simplified)
      totalCost += Math.max(5, allocation.amount * 0.001); // $5 minimum or 0.1%
    }
  });

  return { trades, totalCost };
}