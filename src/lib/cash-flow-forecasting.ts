import type { Transaction } from '@/types/finance';

export interface CashFlowPrediction {
  date: string;
  predictedIncome: number;
  predictedExpenses: number;
  predictedBalance: number;
  confidence: number;
}

export interface CashFlowForecast {
  currentBalance: number;
  predictions: CashFlowPrediction[];
  insights: {
    avgMonthlyIncome: number;
    avgMonthlyExpenses: number;
    monthlyNetChange: number;
    volatility: number;
    recurringTransactions: number;
  };
  recommendations: string[];
}

export interface RecurringTransaction {
  category: string;
  averageAmount: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly';
  confidence: number;
  nextPredictedDate: string;
  type: 'income' | 'expense';
}

/**
 * Analyzes historical transactions to identify recurring patterns
 */
export function identifyRecurringTransactions(transactions: Transaction[]): RecurringTransaction[] {
  const transactionsByCategory = new Map<string, Transaction[]>();
  
  // Group transactions by category
  transactions.forEach(transaction => {
    const key = `${transaction.category}-${transaction.type}`;
    if (!transactionsByCategory.has(key)) {
      transactionsByCategory.set(key, []);
    }
    const categoryArray = transactionsByCategory.get(key);
    if (categoryArray) {
      categoryArray.push(transaction);
    }
  });
  
  const recurringTransactions: RecurringTransaction[] = [];
  
  transactionsByCategory.forEach((categoryTransactions, key) => {
    const parts = key.split('-');
    const category = parts[0];
    const type = parts[1];
    
    if (!category || !type) return;
    
    // Need at least 3 transactions to identify a pattern
    if (categoryTransactions.length < 3) return;
    
    // Sort by date
    const sortedTransactions = categoryTransactions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Calculate intervals between transactions
    const intervals: number[] = [];
    for (let i = 1; i < sortedTransactions.length; i++) {
      const currentDate = sortedTransactions[i]?.date;
      const previousDate = sortedTransactions[i - 1]?.date;
      
      if (!currentDate || !previousDate) continue;
      
      const interval = Math.round(
        (new Date(currentDate).getTime() - 
         new Date(previousDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      intervals.push(interval);
    }
    
    // Analyze interval patterns
    const avgInterval = intervals.length > 0 ? intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length : 0;
    const intervalVariance = intervals.length > 0 ? intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length : 0;
    const intervalStdDev = Math.sqrt(intervalVariance);
    
    // Determine frequency and confidence
    let frequency: RecurringTransaction['frequency'];
    let confidence = 0;
    
    if (Math.abs(avgInterval - 7) < 2 && intervalStdDev < 3) {
      frequency = 'weekly';
      confidence = Math.max(0, 0.9 - (intervalStdDev / 10));
    } else if (Math.abs(avgInterval - 14) < 3 && intervalStdDev < 5) {
      frequency = 'bi-weekly';
      confidence = Math.max(0, 0.85 - (intervalStdDev / 10));
    } else if (Math.abs(avgInterval - 30) < 5 && intervalStdDev < 7) {
      frequency = 'monthly';
      confidence = Math.max(0, 0.8 - (intervalStdDev / 15));
    } else if (Math.abs(avgInterval - 90) < 10 && intervalStdDev < 15) {
      frequency = 'quarterly';
      confidence = Math.max(0, 0.7 - (intervalStdDev / 20));
    } else {
      return; // No clear pattern
    }
    
    // Only include if confidence is reasonable
    if (confidence < 0.5) return;
    
    // Calculate average amount
    const averageAmount = categoryTransactions.reduce((sum, t) => 
      sum + Math.abs(t.amount), 0) / categoryTransactions.length;
    
    // Predict next date
    const lastTransaction = sortedTransactions[sortedTransactions.length - 1];
    if (!lastTransaction?.date) return;
    
    const lastTransactionDate = new Date(lastTransaction.date);
    const nextPredictedDate = new Date(lastTransactionDate);
    nextPredictedDate.setDate(nextPredictedDate.getDate() + avgInterval);
    
    recurringTransactions.push({
      category,
      averageAmount,
      frequency,
      confidence,
      nextPredictedDate: nextPredictedDate.toISOString().split('T')[0] || '',
      type: (type === 'income' || type === 'expense') ? type : 'expense'
    });
  });
  
  return recurringTransactions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Generates cash flow forecast based on historical data and recurring patterns
 */
export function generateCashFlowForecast(
  transactions: Transaction[],
  currentBalance: number,
  monthsToForecast: number = 6
): CashFlowForecast {
  // Filter recent transactions (last 6 months for analysis)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentTransactions = transactions.filter(t => 
    new Date(t.date) >= sixMonthsAgo
  );
  
  // Identify recurring transactions
  const recurringTransactions = identifyRecurringTransactions(recentTransactions);
  
  // Calculate monthly averages
  const monthlyData = new Map<string, { income: number; expenses: number }>();
  
  recentTransactions.forEach(transaction => {
    const monthKey = transaction.date.substring(0, 7); // YYYY-MM
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { income: 0, expenses: 0 });
    }
    
    const monthData = monthlyData.get(monthKey)!;
    if (transaction.type === 'income') {
      monthData.income += Math.abs(transaction.amount);
    } else {
      monthData.expenses += Math.abs(transaction.amount);
    }
  });
  
  const monthlyValues = Array.from(monthlyData.values());
  const avgMonthlyIncome = monthlyValues.reduce((sum, m) => sum + m.income, 0) / monthlyValues.length || 0;
  const avgMonthlyExpenses = monthlyValues.reduce((sum, m) => sum + m.expenses, 0) / monthlyValues.length || 0;
  const monthlyNetChange = avgMonthlyIncome - avgMonthlyExpenses;
  
  // Calculate volatility
  const netChanges = monthlyValues.map(m => m.income - m.expenses);
  const avgNetChange = netChanges.reduce((sum, n) => sum + n, 0) / netChanges.length || 0;
  const volatility = Math.sqrt(
    netChanges.reduce((sum, n) => sum + Math.pow(n - avgNetChange, 2), 0) / netChanges.length
  ) || 0;
  
  // Generate predictions
  const predictions: CashFlowPrediction[] = [];
  let runningBalance = currentBalance;
  
  for (let month = 1; month <= monthsToForecast; month++) {
    const forecastDate = new Date();
    forecastDate.setMonth(forecastDate.getMonth() + month);
    const dateStr = forecastDate.toISOString().split('T')[0] || '';
    
    // Base prediction on historical averages
    let predictedIncome = avgMonthlyIncome;
    let predictedExpenses = avgMonthlyExpenses;
    
    // Adjust for recurring transactions that should occur this month
    recurringTransactions.forEach(recurring => {
      const nextDate = new Date(recurring.nextPredictedDate);
      const forecastMonth = forecastDate.getMonth();
      const forecastYear = forecastDate.getFullYear();
      
      if (nextDate.getMonth() === forecastMonth && nextDate.getFullYear() === forecastYear) {
        if (recurring.type === 'income') {
          predictedIncome += recurring.averageAmount * recurring.confidence;
        } else {
          predictedExpenses += recurring.averageAmount * recurring.confidence;
        }
      }
    });
    
    // Apply seasonal adjustments (simple model)
    const seasonalMultiplier = getSeasonalMultiplier(forecastDate.getMonth());
    predictedExpenses *= seasonalMultiplier;
    
    runningBalance += predictedIncome - predictedExpenses;
    
    // Calculate confidence based on data quality and time horizon
    const baseConfidence = Math.min(0.9, recurringTransactions.length * 0.1 + 0.3);
    const timeDecay = Math.max(0.3, 1 - (month * 0.1));
    const dataQualityFactor = Math.min(1, recentTransactions.length / 50);
    const confidence = baseConfidence * timeDecay * dataQualityFactor;
    
    predictions.push({
      date: dateStr,
      predictedIncome,
      predictedExpenses,
      predictedBalance: runningBalance,
      confidence
    });
  }
  
  // Generate recommendations
  const recommendations = generateCashFlowRecommendations(
    avgMonthlyIncome,
    avgMonthlyExpenses,
    volatility,
    predictions,
    recurringTransactions
  );
  
  return {
    currentBalance,
    predictions,
    insights: {
      avgMonthlyIncome,
      avgMonthlyExpenses,
      monthlyNetChange,
      volatility,
      recurringTransactions: recurringTransactions.length
    },
    recommendations
  };
}

/**
 * Simple seasonal multiplier for expenses
 */
function getSeasonalMultiplier(month: number): number {
  // 0 = January, 11 = December
  const seasonalFactors = [
    1.1,  // January - New Year, bills
    1.0,  // February
    1.0,  // March  
    1.0,  // April
    1.1,  // May - Spring activities
    1.1,  // June - Summer activities
    1.1,  // July - Summer vacation
    1.1,  // August - Back to school
    1.0,  // September
    1.0,  // October
    1.2,  // November - Holiday shopping
    1.3   // December - Holiday expenses
  ];
  
  return seasonalFactors[month] || 1.0;
}

/**
 * Generate actionable recommendations based on cash flow analysis
 */
function generateCashFlowRecommendations(
  avgIncome: number,
  avgExpenses: number,
  volatility: number,
  predictions: CashFlowPrediction[],
  recurringTransactions: RecurringTransaction[]
): string[] {
  const recommendations: string[] = [];
  
  // Check for negative cash flow periods
  const negativeMonths = predictions.filter(p => p.predictedBalance < 0);
  if (negativeMonths.length > 0) {
    recommendations.push(
      `Warning: Your balance may go negative in ${negativeMonths.length} month(s). Consider reducing expenses or increasing income.`
    );
  }
  
  // Low balance warning
  const lowBalanceMonths = predictions.filter(p => p.predictedBalance < avgExpenses * 0.5);
  if (lowBalanceMonths.length > 0) {
    recommendations.push(
      `Your balance may drop below half a month's expenses. Consider building an emergency fund.`
    );
  }
  
  // High volatility warning
  if (volatility > avgIncome * 0.3) {
    recommendations.push(
      `Your income/expenses show high volatility. Consider creating a buffer for unexpected changes.`
    );
  }
  
  // Positive cash flow opportunities
  const avgNetChange = avgIncome - avgExpenses;
  if (avgNetChange > 0) {
    recommendations.push(
      `You have a positive cash flow of $${avgNetChange.toFixed(0)}/month on average. Consider investing this surplus.`
    );
  }
  
  // Recurring transaction insights
  const highValueRecurring = recurringTransactions.filter(
    r => r.averageAmount > avgIncome * 0.1 && r.type === 'expense'
  );
  if (highValueRecurring.length > 0) {
    recommendations.push(
      `You have ${highValueRecurring.length} high-value recurring expense(s). Review these for potential savings.`
    );
  }
  
  // Emergency fund recommendation
  const emergencyFund = predictions[0]?.predictedBalance || 0;
  const recommendedEmergencyFund = avgExpenses * 3;
  if (emergencyFund < recommendedEmergencyFund) {
    recommendations.push(
      `Consider building an emergency fund of $${recommendedEmergencyFund.toFixed(0)} (3 months of expenses).`
    );
  }
  
  return recommendations;
}