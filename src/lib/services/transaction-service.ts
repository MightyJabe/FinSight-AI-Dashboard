import { formatISO, subDays } from 'date-fns';

import { db } from '@/lib/firebase-admin';
import { getTransactions as getPlaidTransactions } from '@/lib/plaid';
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

        // Fetch transactions for the last 30 days (or based on limit)
        const days = limit ? Math.min(limit, 30) : 30;
        const endDate = formatISO(new Date(), { representation: 'date' });
        const startDate = formatISO(subDays(new Date(), days), { representation: 'date' });
        
        const plaidTransactions = await getPlaidTransactions(accessToken, startDate, endDate);
        
        // Convert to our Transaction type
        const transactions: Transaction[] = plaidTransactions.map(txn => ({
          id: txn.transaction_id,
          amount: Math.abs(txn.amount), // Make amount positive for consistency
          type: txn.amount > 0 ? 'income' : 'expense',
          category: txn.category?.[0] || 'Other',
          description: txn.name,
          date: txn.date,
          account: 'Unknown Account',
          accountId: txn.account_id
        }));
        
        return limit ? transactions.slice(0, limit) : transactions;
      } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
    },

    async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
      try {
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

        const plaidTransactions = await getPlaidTransactions(accessToken, startDate, endDate);
        
        const transactions: Transaction[] = plaidTransactions.map(txn => ({
          id: txn.transaction_id,
          amount: Math.abs(txn.amount),
          type: txn.amount > 0 ? 'income' : 'expense',
          category: txn.category?.[0] || 'Other',
          description: txn.name,
          date: txn.date,
          account: 'Unknown Account',
          accountId: txn.account_id
        }));
        
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
    }
  };
}