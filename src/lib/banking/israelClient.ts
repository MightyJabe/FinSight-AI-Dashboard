import { BankingAccount, BankingProvider, BankingTransaction } from './types';

export interface ScrapeResult {
    accounts: BankingAccount[];
    transactions: BankingTransaction[];
}

export class IsraelClient implements BankingProvider {
    name = 'israeli-scraper';
    private serviceUrl = process.env.ISRAEL_SCRAPER_URL || 'http://localhost:3002';

    // Single scrape that returns both accounts and transactions
    async scrapeAll(credentialsJson: string): Promise<ScrapeResult> {
        const credentials = JSON.parse(credentialsJson);

        const response = await fetch(`${this.serviceUrl}/scrape`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                companyId: credentials.companyId,
                credentials: credentials.creds,
                showBrowser: true // Force visible for 2FA
            })
        });

        if (!response.ok) {
            throw new Error(`Scraper failed: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(`Scraper Error: ${data.errorType} - ${data.errorMessage || 'Unknown'}`);
        }

        const accounts = this.mapAccounts(data.accounts || [], credentials.companyId);

        // Extract transactions from all accounts
        let allTransactions: BankingTransaction[] = [];
        if (data.accounts) {
            for (const acc of data.accounts) {
                if (acc.txns) {
                    allTransactions = allTransactions.concat(
                        this.mapTransactions(acc.txns, acc.accountNumber, credentials.companyId)
                    );
                }
            }
        }

        return { accounts, transactions: allTransactions };
    }

    // Legacy interface - now just wraps scrapeAll
    async getAccounts(credentialsJson: string): Promise<BankingAccount[]> {
        const result = await this.scrapeAll(credentialsJson);
        return result.accounts;
    }

    // Date parameters required by BankingProvider interface but not used by Israeli scrapers
    async getTransactions(
        credentialsJson: string,
        _startDate: Date, // eslint-disable-line @typescript-eslint/no-unused-vars
        _endDate: Date // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<BankingTransaction[]> {
        const result = await this.scrapeAll(credentialsJson);
        return result.transactions;
    }

    private mapAccounts(rawAccounts: any[], bankId: string): BankingAccount[] {
        return rawAccounts.map(acc => ({
            id: acc.accountNumber,
            providerId: 'israel',
            institutionId: bankId,
            institutionName: this.getBankDisplayName(bankId),
            name: `Account ${acc.accountNumber}`,
            officialName: null,
            type: 'depository' as const,
            subtype: null,
            mask: String(acc.accountNumber).slice(-4),
            currency: 'ILS',
            balance: {
                current: acc.balance || 0,
                available: null,
                limit: null
            }
        }));
    }

    private mapTransactions(rawTx: any[], accountId: string, bankId: string): BankingTransaction[] {
        const institutionName = this.getBankDisplayName(bankId);
        return rawTx.map((tx: any) => {
            // israeli-bank-scrapers returns: chargedAmount, originalAmount, chargedCurrency, originalCurrency
            // Official interface: Transaction { chargedAmount: number, originalAmount: number, ... }
            const amount = tx.chargedAmount ?? tx.originalAmount ?? 0;
            console.log(`[IsraelClient] Mapping tx: chargedAmount=${tx.chargedAmount}, originalAmount=${tx.originalAmount}, mapped=${amount}`);

            return {
                id: tx.identifier || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                accountId: accountId,
                accountName: institutionName, // Display name for the account
                institutionName: institutionName, // Bank name for grouping
                // Store the raw amounts for debugging
                chargedAmount: tx.chargedAmount,
                originalAmount: tx.originalAmount,
                amount: amount,
                date: tx.date ? new Date(tx.date).toISOString().split('T')[0]! : new Date().toISOString().split('T')[0]!,
                description: tx.description || tx.memo || 'Unknown',
                merchantName: tx.description || null,
                category: tx.category || null,
                pending: tx.status === 'pending',
                currency: tx.chargedCurrency || tx.originalCurrency || 'ILS',
                originalCurrency: tx.originalCurrency || 'ILS',
                processedDate: tx.processedDate,
                memo: tx.memo,
                type: tx.type,
                status: tx.status
            };
        });
    }

    private getBankDisplayName(bankId: string): string {
        const names: Record<string, string> = {
            hapoalim: 'Bank Hapoalim',
            leumi: 'Bank Leumi',
            discount: 'Discount Bank',
            mizrahi: 'Mizrahi Tefahot',
            max: 'Max',
            isracard: 'Isracard'
        };
        return names[bankId] || bankId;
    }
}
