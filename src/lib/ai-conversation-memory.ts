import type { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

const db = adminDb;

export interface ConversationMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    page: string;
    pageName: string;
  };
}

export class ConversationMemory {
  private userId: string;
  private maxMessages = 50;

  constructor(userId: string) {
    this.userId = userId;
  }

  async saveMessage(
    message: Omit<ConversationMessage, 'id' | 'userId' | 'timestamp'>
  ): Promise<void> {
    try {
      await db.collection('conversations').add({
        ...message,
        userId: this.userId,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Error saving conversation message', { error, userId: this.userId });
    }
  }

  async getRecentMessages(limit: number = this.maxMessages): Promise<ConversationMessage[]> {
    try {
      const snapshot = await db
        .collection('conversations')
        .where('userId', '==', this.userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs
        .map(
          (doc: QueryDocumentSnapshot<DocumentData>): ConversationMessage => ({
            id: doc.id,
            ...(doc.data() as Omit<ConversationMessage, 'id'>),
            timestamp: doc.data().timestamp?.toDate(),
          })
        )
        .reverse();
    } catch (error) {
      logger.error('Error getting conversation history', { error, userId: this.userId });
      return [];
    }
  }

  async clearHistory(): Promise<void> {
    try {
      const snapshot = await db
        .collection('conversations')
        .where('userId', '==', this.userId)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => batch.delete(doc.ref));
      await batch.commit();
    } catch (error) {
      logger.error('Error clearing conversation history', { error, userId: this.userId });
    }
  }
}
