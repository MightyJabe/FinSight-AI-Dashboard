import { Configuration, PlaidApi } from 'plaid';

import { BankingAccount, BankingProvider, BankingTransaction } from './types';

// Plaid environment URLs
const PLAID_URLS = {
    sandbox: 'https://sandbox.plaid.com',
    development: 'https://development.plaid.com',
    production: 'https://production.plaid.com',
} as const;

function getPlaidBasePath(): string {
    const env = process.env.PLAID_ENV;
    if (env === 'production') return PLAID_URLS.production;
    if (env === 'development') return PLAID_URLS.development;
    return PLAID_URLS.sandbox;
}

const configuration = new Configuration({
    basePath: getPlaidBasePath(),
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID ?? '',
            'PLAID-SECRET': process.env.PLAID_SECRET ?? '',
        },
    },
});

export const plaidApi = new PlaidApi(configuration);

export class PlaidClient implements BankingProvider {
    name = 'plaid';

    async getAccounts(accessToken: string): Promise<BankingAccount[]> {
        const response = await plaidApi.accountsGet({ access_token: accessToken });
        return response.data.accounts.map(acc => ({
            id: acc.account_id,
            providerId: 'plaid',
            institutionId: 'plaid', // Can fetch item info to get real institution ID
            institutionName: 'Plaid Bank', // Would need extra call to Institutions API
            name: acc.name,
            officialName: acc.official_name || null,
            type: acc.type as any,
            subtype: acc.subtype || null,
            mask: acc.mask || null,
            currency: acc.balances.iso_currency_code || 'USD',
            balance: {
                current: acc.balances.current || 0,
                available: acc.balances.available || null,
                limit: acc.balances.limit || null
            }
        }));
    }

    async getTransactions(accessToken: string, startDate: Date, endDate: Date): Promise<BankingTransaction[]> {
        const startDateStr = startDate.toISOString().slice(0, 10);
        const endDateStr = endDate.toISOString().slice(0, 10);

        const response = await plaidApi.transactionsGet({
            access_token: accessToken,
            start_date: startDateStr,
            end_date: endDateStr
        });

        return response.data.transactions.map(tx => ({
            id: tx.transaction_id,
            accountId: tx.account_id,
            // Plaid: Positive = Expense, Negative = Income.
            // Interface: Positive = Income, Negative = Expense.
            // So we negate it.
            amount: -tx.amount,
            date: tx.date,
            description: tx.name,
            merchantName: tx.merchant_name || null,
            category: tx.category || null,
            pending: tx.pending,
            currency: tx.iso_currency_code || 'USD'
        }));
    }
}
