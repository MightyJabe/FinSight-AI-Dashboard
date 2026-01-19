import type { DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase-admin/firestore';

/**
 * Converts a Firestore DocumentSnapshot to a typed object with ID
 * @param doc - The Firestore document snapshot
 * @returns The typed data with ID or null if document doesn't exist
 */
export function firestoreDocToData<T>(doc: DocumentSnapshot<DocumentData>): (T & { id: string }) | null {
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as T & { id: string };
}

/**
 * Converts a Firestore QueryDocumentSnapshot to a typed object with ID
 * @param doc - The Firestore query document snapshot
 * @returns The typed data with ID
 */
export function queryDocToData<T>(doc: QueryDocumentSnapshot<DocumentData>): T & { id: string } {
  return { id: doc.id, ...doc.data() } as T & { id: string };
}

/**
 * Maps an array of Firestore documents to typed objects with IDs
 * @param docs - Array of Firestore document snapshots
 * @returns Array of typed data with IDs, filtered to remove nulls
 */
export function mapDocsToData<T>(docs: DocumentSnapshot<DocumentData>[]): (T & { id: string })[] {
  return docs.map(doc => firestoreDocToData<T>(doc)).filter((item): item is T & { id: string } => item !== null);
}

/**
 * Maps an array of Firestore query documents to typed objects with IDs
 * @param docs - Array of Firestore query document snapshots
 * @returns Array of typed data with IDs
 */
export function mapQueryDocsToData<T>(docs: QueryDocumentSnapshot<DocumentData>[]): (T & { id: string })[] {
  return docs.map(doc => queryDocToData<T>(doc));
}
