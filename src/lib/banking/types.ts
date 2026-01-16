export interface BankingAccount {
    id: string; // Plaid account_id or Scraper account number
    providerId: string; // 'plaid' or 'israeli-scraper'
    institutionId: string; // 'ins_1' or 'leumi'
    institutionName: string;
    name: string;
    officialName: string | null;
    type: 'depository' | 'credit' | 'investment' | 'loan' | 'other';
    subtype: string | null;
    mask: string | null;
    currency: string;
    balance: {
        current: number;
        available: number | null;
        limit: number | null;
    };
}

export interface BankingTransaction {
    id: string;
    accountId: string;
    amount: number; // Positive for expense, typically (Plaid style) or signed? Let's use signed: +Income, -Expense to match internal dashboard usually, OR follow Plaid logic (positive = money out). 
    // Let's normalize to: Positive = Deposit/Income, Negative = Withdrawal/Expense. 
    // NOTE: Plaid is opposite (positive = expense). We will normalize in adapters.
    date: string; // ISO YYYY-MM-DD
    description: string;
    merchantName: string | null;
    category: string[] | null;
    pending: boolean;
    currency: string;
}

export interface BankingProvider {
    name: string;
    getAccounts(accessToken: string): Promise<BankingAccount[]>;
    getTransactions(accessToken: string, startDate: Date, endDate: Date): Promise<BankingTransaction[]>;
}
