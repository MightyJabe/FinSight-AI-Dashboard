import { db } from '@/lib/firebase-admin';
import { getAccountBalances } from '@/lib/plaid';

export interface Account {
  id: string;
  name: string;
  type: string;
  subtype?: string | null;
  balance: number;
  availableBalance?: number | null;
  limit?: number | null;
  officialName?: string | null;
}

export interface AccountService {
  getAccounts(): Promise<Account[]>;
  getAccountById(accountId: string): Promise<Account | null>;
  getTotalBalance(): Promise<number>;
}

export function getAccountService(userId: string): AccountService {
  return {
    async getAccounts(): Promise<Account[]> {
      try {
        // Get the user's Plaid access token from Firestore
        const accessTokenDoc = await db
          .collection('users')
          .doc(userId)
          .collection('plaid')
          .doc('access_token')
          .get();
        
        const accessToken = accessTokenDoc.exists ? accessTokenDoc.data()?.accessToken : null;
        
        if (!accessToken) {
          return [];
        }

        // Fetch accounts and balances from Plaid
        const plaidAccounts = await getAccountBalances(accessToken);
        
        // Convert to our Account type
        const accounts: Account[] = plaidAccounts.map(acc => ({
          id: acc.account_id,
          name: acc.name,
          type: acc.type,
          subtype: acc.subtype,
          balance: acc.balances.current || 0,
          availableBalance: acc.balances.available,
          limit: acc.balances.limit,
          officialName: acc.official_name
        }));
        
        return accounts;
      } catch (error) {
        console.error('Error fetching accounts:', error);
        return [];
      }
    },

    async getAccountById(accountId: string): Promise<Account | null> {
      const accounts = await this.getAccounts();
      return accounts.find(acc => acc.id === accountId) || null;
    },

    async getTotalBalance(): Promise<number> {
      const accounts = await this.getAccounts();
      return accounts.reduce((sum, acc) => sum + acc.balance, 0);
    }
  };
}