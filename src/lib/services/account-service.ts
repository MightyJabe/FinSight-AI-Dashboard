import type { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { adminDb as db } from '@/lib/firebase-admin';

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
        // Get accounts from Firestore (cached data)
        const accountsSnapshot = await db
          .collection('accounts')
          .where('userId', '==', userId)
          .get();

        const accounts: Account[] = accountsSnapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || 'Unknown Account',
              type: data.type || 'depository',
              subtype: data.subtype || null,
              balance: data.balance || 0,
              availableBalance: data.availableBalance || null,
              limit: data.limit || null,
              officialName: data.officialName || null,
            };
          }
        );

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
    },
  };
}
