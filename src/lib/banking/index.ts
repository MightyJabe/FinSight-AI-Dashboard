import { IsraelClient } from './israelClient';
import { PlaidClient } from './plaidClient';
import { BankingProvider } from './types';

// Singleton instances or factory
const plaidClient = new PlaidClient();
const israelClient = new IsraelClient();

export function getBankingProvider(type: 'plaid' | 'israel'): BankingProvider {
    if (type === 'plaid') {
        return plaidClient;
    } else if (type === 'israel') {
        return israelClient;
    }
    throw new Error(`Unknown banking provider type: ${type}`);
}
