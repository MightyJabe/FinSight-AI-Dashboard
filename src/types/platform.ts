// Investment Platform tracking types

export type PlatformType =
  | 'stock_broker'
  | 'crypto_exchange'
  | 'real_estate'
  | 'bank_investment'
  | 'retirement'
  | 'crowdfunding'
  | 'forex'
  | 'other';

export type TransactionType = 'deposit' | 'withdrawal';

export type Currency =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'ILS'
  | 'CAD'
  | 'AUD'
  | 'JPY'
  | 'CNY'
  | 'INR'
  | 'Other';

export interface Platform {
  id: string;
  userId: string;
  name: string;
  type: PlatformType;
  currency: Currency;
  currentBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  netProfit: number;
  netProfitPercent: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformTransaction {
  id: string;
  platformId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  date: string;
  description?: string;
  balanceAfter?: number;
  sourceAccountId?: string; // Bank account the money came from/went to
  createdAt: string;
}

export interface PlatformWithTransactions extends Platform {
  transactions: PlatformTransaction[];
  lastTransaction?: PlatformTransaction;
  transactionCount: number;
}

export interface PlatformSummary {
  totalBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalProfit: number;
  totalProfitPercent: number;
  platformCount: number;
  platforms: PlatformWithTransactions[];
  byType: Record<
    PlatformType,
    {
      balance: number;
      deposited: number;
      withdrawn: number;
      profit: number;
      profitPercent: number;
      count: number;
    }
  >;
  byCurrency: Record<
    Currency,
    {
      balance: number;
      deposited: number;
      withdrawn: number;
      profit: number;
    }
  >;
}

export interface CreatePlatformInput {
  name: string;
  type: PlatformType;
  currency: Currency;
  currentBalance?: number;
  notes: string | undefined;
}

export interface UpdatePlatformInput extends Partial<CreatePlatformInput> {
  id: string;
}

export interface CreateTransactionInput {
  platformId: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string | undefined;
  sourceAccountId?: string;
}
