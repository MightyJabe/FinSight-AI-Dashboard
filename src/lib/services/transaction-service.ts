import type { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { adminDb as db } from '@/lib/firebase-admin';
import type { Transaction } from '@/types/finance';

export interface TransactionService {
  getTransactions(limit?: number): Promise<Transaction[]>;
  getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]>;
  getTransactionsByCategory(category: string): Promise<Transaction[]>;
}

export function getTransactionService(userId: string): TransactionService {
  return {
    async getTransactions(limit?: number): Promise<Transaction[]> {
      try {
        // Get transactions from Firestore (cached data)
        let query = db
          .collection('transactions')
          .where('userId', '==', userId)
          .orderBy('date', 'desc');

        if (limit) {
          query = query.limit(limit);
        }

        const snapshot = await query.get();

        const transactions: Transaction[] = snapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            return {
              id: doc.id,
              amount: data.amount || 0,
              type: data.type || 'expense',
              category: data.category || 'Other',
              description: data.description || 'Unknown',
              date: data.date || new Date().toISOString(),
              account: data.account || 'Unknown Account',
              accountId: data.accountId || '',
            };
          }
        );

        return transactions;
      } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
    },

    async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
      try {
        const snapshot = await db
          .collection('transactions')
          .where('userId', '==', userId)
          .where('date', '>=', startDate)
          .where('date', '<=', endDate)
          .orderBy('date', 'desc')
          .get();

        const transactions: Transaction[] = snapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            return {
              id: doc.id,
              amount: data.amount || 0,
              type: data.type || 'expense',
              category: data.category || 'Other',
              description: data.description || 'Unknown',
              date: data.date || new Date().toISOString(),
              account: data.account || 'Unknown Account',
              accountId: data.accountId || '',
            };
          }
        );

        return transactions;
      } catch (error) {
        console.error('Error fetching transactions by date range:', error);
        return [];
      }
    },

    async getTransactionsByCategory(category: string): Promise<Transaction[]> {
      const transactions = await this.getTransactions();
      return transactions.filter(txn =>
        txn.category.toLowerCase().includes(category.toLowerCase())
      );
    },
  };
}
