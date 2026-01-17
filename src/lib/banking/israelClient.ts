import logger from '@/lib/logger';

import { BankingAccount, BankingProvider, BankingTransaction } from './types';

export interface ScrapeResult {
    accounts: BankingAccount[];
    transactions: BankingTransaction[];
}

export interface RetryConfig {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    timeoutMs: number;
}

// Error types that should trigger a retry
const RETRYABLE_ERROR_TYPES = [
    'TIMEOUT',
    'NETWORK_ERROR',
    'RATE_LIMITED',
    'SERVICE_UNAVAILABLE',
    'TEMPORARY_ERROR',
];

// Error types that should NOT be retried (invalid credentials, etc.)
const NON_RETRYABLE_ERROR_TYPES = [
    'INVALID_PASSWORD',
    'INVALID_CREDENTIALS',
    'ACCOUNT_BLOCKED',
    'CHANGE_PASSWORD',
];

export class IsraelClient implements BankingProvider {
    name = 'israeli-scraper';
    private serviceUrl = process.env.ISRAEL_SCRAPER_URL || 'http://localhost:3002';
    private retryConfig: RetryConfig = {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        timeoutMs: 120000, // 2 minutes for scraping (can be slow)
    };

    /**
     * Sleep for a specified duration
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Calculate delay with exponential backoff and jitter
     */
    private calculateDelay(attempt: number): number {
        const exponentialDelay = this.retryConfig.baseDelayMs * Math.pow(2, attempt);
        const jitter = Math.random() * 1000; // Add up to 1 second of jitter
        return Math.min(exponentialDelay + jitter, this.retryConfig.maxDelayMs);
    }

    /**
     * Check if an error is retryable
     */
    private isRetryableError(errorType: string | undefined, statusCode?: number): boolean {
        // Don't retry authentication errors
        if (errorType && NON_RETRYABLE_ERROR_TYPES.includes(errorType)) {
            return false;
        }

        // Retry network errors and rate limits
        if (errorType && RETRYABLE_ERROR_TYPES.includes(errorType)) {
            return true;
        }

        // Retry on 5xx server errors or network issues
        if (statusCode && statusCode >= 500) {
            return true;
        }

        // Retry on 429 rate limit
        if (statusCode === 429) {
            return true;
        }

        return false;
    }

    /**
     * Make a fetch request with timeout
     */
    private async fetchWithTimeout(
        url: string,
        options: RequestInit,
        timeoutMs: number
    ): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    // Single scrape that returns both accounts and transactions with retry logic
    async scrapeAll(credentialsJson: string): Promise<ScrapeResult> {
        const credentials = JSON.parse(credentialsJson);
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                logger.info('Israeli bank scrape attempt', {
                    attempt: attempt + 1,
                    maxRetries: this.retryConfig.maxRetries + 1,
                    bankId: credentials.companyId,
                });

                const response = await this.fetchWithTimeout(
                    `${this.serviceUrl}/scrape`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            companyId: credentials.companyId,
                            credentials: credentials.creds,
                            showBrowser: true // Force visible for 2FA
                        })
                    },
                    this.retryConfig.timeoutMs
                );

                if (!response.ok) {
                    const errorMessage = `Scraper failed: ${response.statusText}`;

                    if (this.isRetryableError(undefined, response.status) && attempt < this.retryConfig.maxRetries) {
                        const delay = this.calculateDelay(attempt);
                        logger.warn('Retryable HTTP error, will retry', {
                            attempt: attempt + 1,
                            statusCode: response.status,
                            delayMs: delay,
                        });
                        await this.sleep(delay);
                        continue;
                    }

                    throw new Error(errorMessage);
                }

                const data = await response.json();

                if (!data.success) {
                    const errorType = data.errorType;
                    const errorMessage = `Scraper Error: ${errorType} - ${data.errorMessage || 'Unknown'}`;

                    if (this.isRetryableError(errorType) && attempt < this.retryConfig.maxRetries) {
                        const delay = this.calculateDelay(attempt);
                        logger.warn('Retryable scraper error, will retry', {
                            attempt: attempt + 1,
                            errorType,
                            delayMs: delay,
                        });
                        await this.sleep(delay);
                        continue;
                    }

                    throw new Error(errorMessage);
                }

                // Success!
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

                logger.info('Israeli bank scrape successful', {
                    bankId: credentials.companyId,
                    accountCount: accounts.length,
                    transactionCount: allTransactions.length,
                    attempts: attempt + 1,
                });

                return { accounts, transactions: allTransactions };

            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                // Check if it's an abort error (timeout)
                if (lastError.name === 'AbortError') {
                    lastError = new Error(`Scraper timeout after ${this.retryConfig.timeoutMs}ms`);

                    if (attempt < this.retryConfig.maxRetries) {
                        const delay = this.calculateDelay(attempt);
                        logger.warn('Request timeout, will retry', {
                            attempt: attempt + 1,
                            delayMs: delay,
                        });
                        await this.sleep(delay);
                        continue;
                    }
                }

                // Check for network errors
                if (lastError.message.includes('fetch') || lastError.message.includes('network')) {
                    if (attempt < this.retryConfig.maxRetries) {
                        const delay = this.calculateDelay(attempt);
                        logger.warn('Network error, will retry', {
                            attempt: attempt + 1,
                            error: lastError.message,
                            delayMs: delay,
                        });
                        await this.sleep(delay);
                        continue;
                    }
                }

                // Non-retryable error or max retries reached
                logger.error('Israeli bank scrape failed', {
                    bankId: credentials.companyId,
                    error: lastError.message,
                    attempts: attempt + 1,
                });
            }
        }

        // All retries exhausted
        throw lastError || new Error('Scraper failed after all retries');
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
