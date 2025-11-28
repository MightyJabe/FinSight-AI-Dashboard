import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'crypto';

import logger from './logger';

/**
 * Secure encryption utility for protecting sensitive financial data
 * Uses AES-256-GCM encryption with PBKDF2 key derivation
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits
// const TAG_LENGTH = 16; // 128 bits (not used directly, managed by cipher)
const ITERATIONS = 100000; // PBKDF2 iterations

interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
  tag: string;
}

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    // Development fallback - generate a temporary key and warn
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  ENCRYPTION_KEY not found! Using temporary key for development.');
      console.warn('⚠️  Add ENCRYPTION_KEY to your .env.local file for secure operation.');
      console.warn(
        "⚠️  Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
      );
      return 'dev-fallback-key-' + '0'.repeat(48); // 64 chars total
    }
    throw new Error('ENCRYPTION_KEY environment variable is required for data protection');
  }
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }
  return key;
}

/**
 * Derive encryption key using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt sensitive data (e.g., Plaid access tokens)
 * @param plaintext The data to encrypt
 * @returns Encrypted data object
 */
export function encryptSensitiveData(plaintext: string): EncryptedData {
  try {
    if (!plaintext) {
      throw new Error('Cannot encrypt empty data');
    }

    const password = getEncryptionKey();
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const key = deriveKey(password, salt);

    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      salt: salt.toString('hex'),
      tag: tag.toString('hex'),
    };
  } catch (error) {
    logger.error('Failed to encrypt sensitive data', { error });
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt sensitive data
 * @param encryptedData The encrypted data object
 * @returns Decrypted plaintext
 */
export function decryptSensitiveData(encryptedData: EncryptedData): string {
  try {
    if (
      !encryptedData ||
      !encryptedData.encrypted ||
      !encryptedData.iv ||
      !encryptedData.salt ||
      !encryptedData.tag
    ) {
      throw new Error('Invalid encrypted data format');
    }

    const password = getEncryptionKey();
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    const key = deriveKey(password, salt);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Failed to decrypt sensitive data', { error });
    throw new Error('Decryption failed');
  }
}

/**
 * Encrypt a Plaid access token specifically
 * @param accessToken The Plaid access token
 * @returns Encrypted token data
 */
export function encryptPlaidToken(accessToken: string): EncryptedData {
  if (!accessToken || typeof accessToken !== 'string') {
    throw new Error('Invalid Plaid access token');
  }

  logger.info('Encrypting Plaid access token');
  return encryptSensitiveData(accessToken);
}

/**
 * Decrypt a Plaid access token specifically
 * @param encryptedToken The encrypted token data
 * @returns Decrypted access token
 */
export function decryptPlaidToken(encryptedToken: EncryptedData): string {
  if (!encryptedToken) {
    throw new Error('No encrypted token provided');
  }

  logger.info('Decrypting Plaid access token');
  return decryptSensitiveData(encryptedToken);
}

/**
 * Check if a token is encrypted (has the expected structure)
 * @param data The data to check
 * @returns True if the data appears to be encrypted
 */
export function isEncryptedData(data: any): data is EncryptedData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.encrypted === 'string' &&
    typeof data.iv === 'string' &&
    typeof data.salt === 'string' &&
    typeof data.tag === 'string'
  );
}

/**
 * Securely clear a string from memory (best effort)
 * @param sensitiveString The string to clear
 */
export function secureClear(sensitiveString: string): void {
  if (typeof sensitiveString === 'string') {
    // This is a best-effort approach in JavaScript
    // True secure memory clearing requires native modules
    try {
      // Overwrite the string content
      for (let i = 0; i < sensitiveString.length; i++) {
        sensitiveString = sensitiveString.substring(0, i) + '0' + sensitiveString.substring(i + 1);
      }
    } catch (error) {
      // Strings are immutable in JS, so this will fail
      // But it's still good practice to attempt it
    }
  }
}

/**
 * Generate a secure random encryption key for environment setup
 * This should be run once during initial setup and stored securely
 * @returns A secure random key
 */
export function generateEncryptionKey(): string {
  const key = randomBytes(32).toString('hex');
  console.log('Generated encryption key (store this securely in environment):');
  console.log(key);
  return key;
}

const encryptionUtils = {
  encryptSensitiveData,
  decryptSensitiveData,
  encryptPlaidToken,
  decryptPlaidToken,
  isEncryptedData,
  secureClear,
  generateEncryptionKey,
};

export default encryptionUtils;
