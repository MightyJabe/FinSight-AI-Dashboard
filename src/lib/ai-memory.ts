import { adminDb as db } from './firebase-admin';

export interface FinancialContext {
  type: 'transaction' | 'insight' | 'goal' | 'conversation' | 'document';
  content: string;
  metadata: Record<string, any>;
}

export async function storeFinancialContext(
  userId: string,
  context: FinancialContext
): Promise<void> {
  await db.collection(`users/${userId}/financialMemory`).add({
    type: context.type,
    content: context.content,
    metadata: context.metadata,
    timestamp: new Date(),
    createdAt: new Date(),
  });
}

export async function retrieveRelevantContext(
  userId: string,
  _query: string,
  limit = 10
): Promise<Array<{ content: string; metadata: Record<string, any> }>> {
  const snapshot = await db
    .collection(`users/${userId}/financialMemory`)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      content: data.content || '',
      metadata: data.metadata || {},
    };
  });
}

export async function storeTransactionContext(
  userId: string,
  transaction: {
    amount: number;
    category: string;
    description: string;
    date: string;
  }
): Promise<void> {
  const content = `Transaction: ${transaction.description} - $${transaction.amount} in ${transaction.category} on ${transaction.date}`;
  await storeFinancialContext(userId, {
    type: 'transaction',
    content,
    metadata: transaction,
  });
}
