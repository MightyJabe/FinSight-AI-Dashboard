export interface W2Data {
  employer: string;
  ein: string;
  wages: number;
  federalTaxWithheld: number;
  socialSecurityWages: number;
  medicareWages: number;
  year: number;
}

export interface Form1099Data {
  payer: string;
  type: '1099-MISC' | '1099-NEC' | '1099-INT' | '1099-DIV' | '1099-B';
  amount: number;
  federalTaxWithheld: number;
  year: number;
}

export interface ItemizedDeduction {
  category: 'medical' | 'state_local_tax' | 'mortgage_interest' | 'charitable' | 'other';
  description: string;
  amount: number;
}

export interface TaxCredit {
  type: string;
  amount: number;
}

export interface TaxData {
  id: string;
  userId: string;
  year: number;
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household';
  income: {
    w2: W2Data[];
    form1099: Form1099Data[];
    businessIncome: number;
    capitalGains: number;
    otherIncome: number;
    totalIncome: number;
  };
  deductions: {
    standard: number;
    itemized: ItemizedDeduction[];
    totalItemized: number;
    usingStandard: boolean;
  };
  credits: TaxCredit[];
  taxLiability: number;
  refundOrOwed: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeductibleExpense {
  transactionId: string;
  category: string;
  amount: number;
  date: string;
  merchant: string;
  deductionType: 'business' | 'medical' | 'charitable' | 'education' | 'home_office';
  confidence: number;
  notes?: string;
}

export interface QuarterlyTaxEstimate {
  quarter: 1 | 2 | 3 | 4;
  year: number;
  dueDate: string;
  estimatedIncome: number;
  estimatedDeductions: number;
  estimatedTax: number;
  paid: boolean;
  paidAmount?: number;
  paidDate?: string;
}

export interface TaxStrategy {
  id: string;
  type: 'hsa' | '401k' | 'ira' | 'tax_loss_harvesting' | 'roth_conversion' | 'charitable_giving';
  title: string;
  description: string;
  potentialSavings: number;
  priority: 'high' | 'medium' | 'low';
  deadline?: string;
  actionItems: string[];
}
