import { decryptPlaidToken, isEncryptedData } from '@/lib/encryption';
import { db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

/**
 * Helper function to get and decrypt Plaid access token for a user
 * Consolidates token retrieval and decryption logic
 */
export async function getPlaidAccessToken(userId: string): Promise<string | null> {
  try {
    // Check new location first (plaid/access_token)
    const accessTokenDoc = await db
      .collection('users')
      .doc(userId)
      .collection('plaid')
      .doc('access_token')
      .get();

    if (accessTokenDoc.exists) {
      const tokenData = accessTokenDoc.data()?.accessToken;
      if (tokenData) {
        // Check if token is encrypted and decrypt if needed
        if (isEncryptedData(tokenData)) {
          return decryptPlaidToken(tokenData);
        }
        return tokenData;
      }
    }

    return null;
  } catch (error) {
    logger.error('Error retrieving Plaid access token', { userId, error });
    return null;
  }
}

/**
 * Get Plaid connection info for a user
 */
export async function getPlaidConnectionInfo(userId: string): Promise<any | null> {
  try {
    const doc = await db
      .collection('users')
      .doc(userId)
      .collection('plaid')
      .doc('access_token')
      .get();

    if (doc.exists) {
      const data = doc.data();
      // Don't return the actual token, just metadata
      return {
        hasConnection: true,
        institutionId: data?.institutionId,
        institutionName: data?.institutionName,
        linkedAt: data?.linkedAt,
        updatedAt: data?.updatedAt,
      };
    }

    return null;
  } catch (error) {
    logger.error('Error retrieving Plaid connection info', { userId, error });
    return null;
  }
}
