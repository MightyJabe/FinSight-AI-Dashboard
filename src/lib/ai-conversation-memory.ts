import { adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

const db = adminDb;

export interface ConversationMessage {
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
  // Use a single document in the conversations collection as AI-only memory.
  private docId = 'ai-brain';
  private collectionName = 'conversations';

  constructor(userId: string) {
    this.userId = userId;
  }

  async saveMessage(
    message: Omit<ConversationMessage, 'timestamp'>
  ): Promise<void> {
    try {
      const docRef = db
        .collection('users')
        .doc(this.userId)
        .collection(this.collectionName)
        .doc(this.docId);
      const existing = await docRef.get();
      const messages: ConversationMessage[] = (existing.data()?.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp),
      }));

      const trimmed = messages.slice(-(this.maxMessages - 1));
      trimmed.push({ ...message, timestamp: new Date() });

      await docRef.set(
        {
          messages: trimmed,
          updatedAt: new Date(),
          createdAt: existing.exists ? existing.data()?.createdAt || new Date() : new Date(),
        },
        { merge: true }
      );
    } catch (error) {
      logger.error('Error saving conversation message', { error, userId: this.userId });
    }
  }

  async getRecentMessages(limit: number = this.maxMessages): Promise<ConversationMessage[]> {
    try {
      const docRef = await db
        .collection('users')
        .doc(this.userId)
        .collection(this.collectionName)
        .doc(this.docId)
        .get();

      if (!docRef.exists) return [];

      const messages: ConversationMessage[] = (docRef.data()?.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp),
      }));

      return messages.slice(-limit);
    } catch (error) {
      logger.error('Error getting conversation history', { error, userId: this.userId });
      return [];
    }
  }

  async clearHistory(): Promise<void> {
    try {
      await db.collection('users').doc(this.userId).collection(this.collectionName).doc(this.docId).delete();
    } catch (error) {
      logger.error('Error clearing conversation history', { error, userId: this.userId });
    }
  }
}
