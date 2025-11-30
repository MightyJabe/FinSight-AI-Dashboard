import type { DeductibleExpense, QuarterlyTaxEstimate, TaxStrategy } from '@/types/tax';

import logger from './logger';
import { openai } from './openai';

interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  category: string;
}

export async function analyzeDeductibleExpenses(
  userId: string,
  transactions: Transaction[]
): Promise<DeductibleExpense[]> {
  try {
    const prompt = `Analyze these transactions and identify potential tax-deductible expenses. Consider:
- Business expenses (office supplies, software, equipment)
- Medical expenses (over 7.5% of AGI)
- Charitable donations
- Home office expenses
- Educational expenses

Transactions:
${transactions.map(t => `${t.date}: ${t.description} - $${t.amount} (${t.category})`).join('\n')}

Return a JSON array of deductible expenses with: transactionId, deductionType, confidence (0-1), notes.`;

    if (!openai) throw new Error('OpenAI not initialized');
    const response = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [
        {
          role: 'system',
          content: 'You are a tax expert analyzing transactions for deductible expenses.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"expenses":[]}');

    return result.expenses.map((exp: any) => ({
      ...exp,
      userId,
      amount: transactions.find(t => t.id === exp.transactionId)?.amount || 0,
      date: transactions.find(t => t.id === exp.transactionId)?.date || '',
      merchant: transactions.find(t => t.id === exp.transactionId)?.description || '',
      category: transactions.find(t => t.id === exp.transactionId)?.category || '',
    }));
  } catch (error) {
    logger.error('Error analyzing deductible expenses', { userId, error });
    return [];
  }
}

export async function estimateQuarterlyTaxes(
  income: number,
  deductions: number,
  filingStatus: string = 'single'
): Promise<QuarterlyTaxEstimate[]> {
  const taxableIncome = Math.max(0, income - deductions);

  // 2024 tax brackets (simplified)
  const brackets =
    filingStatus === 'single'
      ? [
          { limit: 11600, rate: 0.1 },
          { limit: 47150, rate: 0.12 },
          { limit: 100525, rate: 0.22 },
          { limit: 191950, rate: 0.24 },
          { limit: 243725, rate: 0.32 },
          { limit: 609350, rate: 0.35 },
          { limit: Infinity, rate: 0.37 },
        ]
      : [
          { limit: 23200, rate: 0.1 },
          { limit: 94300, rate: 0.12 },
          { limit: 201050, rate: 0.22 },
          { limit: 383900, rate: 0.24 },
          { limit: 487450, rate: 0.32 },
          { limit: 731200, rate: 0.35 },
          { limit: Infinity, rate: 0.37 },
        ];

  let tax = 0;
  let remaining = taxableIncome;
  let previousLimit = 0;

  for (const bracket of brackets) {
    const taxableInBracket = Math.min(remaining, bracket.limit - previousLimit);
    if (taxableInBracket <= 0) break;

    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
    previousLimit = bracket.limit;
  }

  // Add self-employment tax (15.3% on 92.35% of net earnings)
  const selfEmploymentTax = taxableIncome * 0.9235 * 0.153;
  const totalTax = tax + selfEmploymentTax;
  const quarterlyAmount = totalTax / 4;

  const currentYear = new Date().getFullYear();
  const quarters: QuarterlyTaxEstimate[] = [
    {
      quarter: 1,
      year: currentYear,
      dueDate: `${currentYear}-04-15`,
      estimatedIncome: income / 4,
      estimatedDeductions: deductions / 4,
      estimatedTax: quarterlyAmount,
      paid: false,
    },
    {
      quarter: 2,
      year: currentYear,
      dueDate: `${currentYear}-06-15`,
      estimatedIncome: income / 4,
      estimatedDeductions: deductions / 4,
      estimatedTax: quarterlyAmount,
      paid: false,
    },
    {
      quarter: 3,
      year: currentYear,
      dueDate: `${currentYear}-09-15`,
      estimatedIncome: income / 4,
      estimatedDeductions: deductions / 4,
      estimatedTax: quarterlyAmount,
      paid: false,
    },
    {
      quarter: 4,
      year: currentYear,
      dueDate: `${currentYear + 1}-01-15`,
      estimatedIncome: income / 4,
      estimatedDeductions: deductions / 4,
      estimatedTax: quarterlyAmount,
      paid: false,
    },
  ];

  return quarters;
}

export async function suggestTaxStrategies(
  userId: string,
  financialProfile: {
    income: number;
    age: number;
    hasRetirementAccount: boolean;
    has401k: boolean;
    hasHSA: boolean;
    investmentAccounts: number;
    charitableGiving: number;
  }
): Promise<TaxStrategy[]> {
  try {
    const prompt = `Based on this financial profile, suggest tax optimization strategies:
Income: $${financialProfile.income}
Age: ${financialProfile.age}
Has 401k: ${financialProfile.has401k}
Has HSA: ${financialProfile.hasHSA}
Investment Accounts: $${financialProfile.investmentAccounts}
Charitable Giving: $${financialProfile.charitableGiving}

Suggest specific, actionable tax strategies with potential savings estimates.`;

    if (!openai) throw new Error('OpenAI not initialized');
    const response = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [
        {
          role: 'system',
          content: 'You are a tax strategist providing personalized tax optimization advice.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"strategies":[]}');

    return result.strategies.map((strategy: any, index: number) => ({
      id: `strategy-${Date.now()}-${index}`,
      ...strategy,
    }));
  } catch (error) {
    logger.error('Error suggesting tax strategies', { userId, error });
    return [];
  }
}

export function calculateTaxBracket(
  income: number,
  filingStatus: string = 'single'
): {
  bracket: number;
  rate: number;
  effectiveRate: number;
} {
  const brackets =
    filingStatus === 'single'
      ? [
          { limit: 11600, rate: 0.1 },
          { limit: 47150, rate: 0.12 },
          { limit: 100525, rate: 0.22 },
          { limit: 191950, rate: 0.24 },
          { limit: 243725, rate: 0.32 },
          { limit: 609350, rate: 0.35 },
          { limit: Infinity, rate: 0.37 },
        ]
      : [
          { limit: 23200, rate: 0.1 },
          { limit: 94300, rate: 0.12 },
          { limit: 201050, rate: 0.22 },
          { limit: 383900, rate: 0.24 },
          { limit: 487450, rate: 0.32 },
          { limit: 731200, rate: 0.35 },
          { limit: Infinity, rate: 0.37 },
        ];

  let tax = 0;
  let remaining = income;
  let previousLimit = 0;
  let marginalRate = 0.1;

  for (const bracket of brackets) {
    const taxableInBracket = Math.min(remaining, bracket.limit - previousLimit);
    if (taxableInBracket <= 0) break;

    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
    previousLimit = bracket.limit;
    marginalRate = bracket.rate;
  }

  return {
    bracket: previousLimit,
    rate: marginalRate,
    effectiveRate: income > 0 ? tax / income : 0,
  };
}
