/**
 * Tests for encryption.ts
 *
 * Focus: AES-256-GCM encryption/decryption with PBKDF2 key derivation
 * Target: 100% coverage on encryption operations
 */

// Mock logger to avoid external dependencies
const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../logger', () => mockLogger);

describe('encryption', () => {
  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules between tests to pick up env changes
    jest.resetModules();
    // Set a valid encryption key for tests
    process.env = {
      ...originalEnv,
      ENCRYPTION_KEY: 'test-encryption-key-that-is-at-least-32-characters-long',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('encryptSensitiveData', () => {
    it('should encrypt plaintext and return EncryptedData structure', async () => {
      const { encryptSensitiveData } = await import('../encryption');

      const plaintext = 'access-token-12345';
      const encrypted = encryptSensitiveData(plaintext);

      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('salt');
      expect(encrypted).toHaveProperty('tag');
    });

    it('should return different encrypted values for same plaintext (random IV)', async () => {
      const { encryptSensitiveData } = await import('../encryption');

      const plaintext = 'same-secret-value';
      const encrypted1 = encryptSensitiveData(plaintext);
      const encrypted2 = encryptSensitiveData(plaintext);

      // Same plaintext should produce different ciphertext due to random IV/salt
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });

    it('should throw error for empty plaintext', async () => {
      const { encryptSensitiveData } = await import('../encryption');

      expect(() => encryptSensitiveData('')).toThrow();
    });

    it('should handle unicode characters', async () => {
      const { encryptSensitiveData, decryptSensitiveData } = await import('../encryption');

      const plaintext = '🔐 Secure Token: אסימון בטוח';
      const encrypted = encryptSensitiveData(plaintext);
      const decrypted = decryptSensitiveData(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long plaintext', async () => {
      const { encryptSensitiveData, decryptSensitiveData } = await import('../encryption');

      const plaintext = 'x'.repeat(10000);
      const encrypted = encryptSensitiveData(plaintext);
      const decrypted = decryptSensitiveData(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle JSON strings', async () => {
      const { encryptSensitiveData, decryptSensitiveData } = await import('../encryption');

      const data = { accessToken: 'token123', refreshToken: 'refresh456' };
      const plaintext = JSON.stringify(data);
      const encrypted = encryptSensitiveData(plaintext);
      const decrypted = decryptSensitiveData(encrypted);

      expect(JSON.parse(decrypted)).toEqual(data);
    });

    it('should handle special characters', async () => {
      const { encryptSensitiveData, decryptSensitiveData } = await import('../encryption');

      const plaintext = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~\n\t\r';
      const encrypted = encryptSensitiveData(plaintext);
      const decrypted = decryptSensitiveData(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('decryptSensitiveData', () => {
    it('should decrypt encrypted data back to original plaintext', async () => {
      const { encryptSensitiveData, decryptSensitiveData } = await import('../encryption');

      const plaintext = 'my-secret-access-token';
      const encrypted = encryptSensitiveData(plaintext);
      const decrypted = decryptSensitiveData(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for null encrypted data', async () => {
      const { decryptSensitiveData } = await import('../encryption');

      expect(() => decryptSensitiveData(null as any)).toThrow();
    });

    it('should throw error for undefined encrypted data', async () => {
      const { decryptSensitiveData } = await import('../encryption');

      expect(() => decryptSensitiveData(undefined as any)).toThrow();
    });

    it('should throw error for missing encrypted field', async () => {
      const { decryptSensitiveData } = await import('../encryption');

      const incomplete = { iv: 'abc', salt: 'def', tag: 'ghi' };
      expect(() => decryptSensitiveData(incomplete as any)).toThrow();
    });

    it('should throw error for missing iv field', async () => {
      const { decryptSensitiveData } = await import('../encryption');

      const incomplete = { encrypted: 'abc', salt: 'def', tag: 'ghi' };
      expect(() => decryptSensitiveData(incomplete as any)).toThrow();
    });

    it('should throw error for missing salt field', async () => {
      const { decryptSensitiveData } = await import('../encryption');

      const incomplete = { encrypted: 'abc', iv: 'def', tag: 'ghi' };
      expect(() => decryptSensitiveData(incomplete as any)).toThrow();
    });

    it('should throw error for missing tag field', async () => {
      const { decryptSensitiveData } = await import('../encryption');

      const incomplete = { encrypted: 'abc', iv: 'def', salt: 'ghi' };
      expect(() => decryptSensitiveData(incomplete as any)).toThrow();
    });

    it('should throw error for tampered encrypted data', async () => {
      const { encryptSensitiveData, decryptSensitiveData } = await import('../encryption');

      const encrypted = encryptSensitiveData('secret');

      // Tamper with the ciphertext
      const tampered = {
        ...encrypted,
        encrypted: 'ff' + encrypted.encrypted.slice(2),
      };

      expect(() => decryptSensitiveData(tampered)).toThrow('Decryption failed');
    });

    it('should throw error for tampered IV', async () => {
      const { encryptSensitiveData, decryptSensitiveData } = await import('../encryption');

      const encrypted = encryptSensitiveData('secret');

      // Tamper with the IV
      const tampered = {
        ...encrypted,
        iv: 'ff' + encrypted.iv.slice(2),
      };

      expect(() => decryptSensitiveData(tampered)).toThrow('Decryption failed');
    });

    it('should throw error for tampered tag (authentication failure)', async () => {
      const { encryptSensitiveData, decryptSensitiveData } = await import('../encryption');

      const encrypted = encryptSensitiveData('secret');

      // Tamper with the auth tag
      const tampered = {
        ...encrypted,
        tag: 'ff' + encrypted.tag.slice(2),
      };

      expect(() => decryptSensitiveData(tampered)).toThrow('Decryption failed');
    });

    it('should throw error for invalid hex in encrypted field', async () => {
      const { decryptSensitiveData } = await import('../encryption');

      const invalid = {
        encrypted: 'not-valid-hex!!!',
        iv: '0'.repeat(32),
        salt: '0'.repeat(64),
        tag: '0'.repeat(32),
      };

      expect(() => decryptSensitiveData(invalid)).toThrow();
    });
  });

  describe('encryptPlaidToken', () => {
    it('should encrypt a valid Plaid access token', async () => {
      const { encryptPlaidToken } = await import('../encryption');

      const token = 'access-sandbox-abc123def456';
      const encrypted = encryptPlaidToken(token);

      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('salt');
      expect(encrypted).toHaveProperty('tag');
    });

    it('should throw for empty token', async () => {
      const { encryptPlaidToken } = await import('../encryption');

      expect(() => encryptPlaidToken('')).toThrow('Invalid Plaid access token');
    });

    it('should throw for null token', async () => {
      const { encryptPlaidToken } = await import('../encryption');

      expect(() => encryptPlaidToken(null as any)).toThrow('Invalid Plaid access token');
    });

    it('should throw for non-string token', async () => {
      const { encryptPlaidToken } = await import('../encryption');

      expect(() => encryptPlaidToken(12345 as any)).toThrow('Invalid Plaid access token');
    });
  });

  describe('decryptPlaidToken', () => {
    it('should decrypt an encrypted Plaid token', async () => {
      const { encryptPlaidToken, decryptPlaidToken } = await import('../encryption');

      const token = 'access-sandbox-abc123def456';
      const encrypted = encryptPlaidToken(token);
      const decrypted = decryptPlaidToken(encrypted);

      expect(decrypted).toBe(token);
    });

    it('should throw for null encrypted token', async () => {
      const { decryptPlaidToken } = await import('../encryption');

      expect(() => decryptPlaidToken(null as any)).toThrow('No encrypted token provided');
    });

    it('should throw for undefined encrypted token', async () => {
      const { decryptPlaidToken } = await import('../encryption');

      expect(() => decryptPlaidToken(undefined as any)).toThrow('No encrypted token provided');
    });
  });

  describe('isEncryptedData', () => {
    it('should return true for valid encrypted data structure', async () => {
      const { isEncryptedData, encryptSensitiveData } = await import('../encryption');

      const encrypted = encryptSensitiveData('test');

      expect(isEncryptedData(encrypted)).toBe(true);
    });

    it('should return false for null', async () => {
      const { isEncryptedData } = await import('../encryption');

      expect(isEncryptedData(null)).toBe(false);
    });

    it('should return false for undefined', async () => {
      const { isEncryptedData } = await import('../encryption');

      expect(isEncryptedData(undefined)).toBe(false);
    });

    it('should return false for non-object', async () => {
      const { isEncryptedData } = await import('../encryption');

      expect(isEncryptedData('string')).toBe(false);
      expect(isEncryptedData(12345)).toBe(false);
      expect(isEncryptedData(true)).toBe(false);
    });

    it('should return false for object missing encrypted field', async () => {
      const { isEncryptedData } = await import('../encryption');

      expect(isEncryptedData({ iv: 'a', salt: 'b', tag: 'c' })).toBe(false);
    });

    it('should return false for object missing iv field', async () => {
      const { isEncryptedData } = await import('../encryption');

      expect(isEncryptedData({ encrypted: 'a', salt: 'b', tag: 'c' })).toBe(false);
    });

    it('should return false for object missing salt field', async () => {
      const { isEncryptedData } = await import('../encryption');

      expect(isEncryptedData({ encrypted: 'a', iv: 'b', tag: 'c' })).toBe(false);
    });

    it('should return false for object missing tag field', async () => {
      const { isEncryptedData } = await import('../encryption');

      expect(isEncryptedData({ encrypted: 'a', iv: 'b', salt: 'c' })).toBe(false);
    });

    it('should return false if encrypted field is not a string', async () => {
      const { isEncryptedData } = await import('../encryption');

      expect(isEncryptedData({ encrypted: 123, iv: 'a', salt: 'b', tag: 'c' })).toBe(false);
    });

    it('should return false if iv field is not a string', async () => {
      const { isEncryptedData } = await import('../encryption');

      expect(isEncryptedData({ encrypted: 'a', iv: 123, salt: 'b', tag: 'c' })).toBe(false);
    });

    it('should return false if salt field is not a string', async () => {
      const { isEncryptedData } = await import('../encryption');

      expect(isEncryptedData({ encrypted: 'a', iv: 'b', salt: 123, tag: 'c' })).toBe(false);
    });

    it('should return false if tag field is not a string', async () => {
      const { isEncryptedData } = await import('../encryption');

      expect(isEncryptedData({ encrypted: 'a', iv: 'b', salt: 'c', tag: 123 })).toBe(false);
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a 64-character hex key (32 bytes)', async () => {
      // Temporarily suppress console output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const { generateEncryptionKey } = await import('../encryption');
      const key = generateEncryptionKey();

      expect(key).toHaveLength(64);
      // Verify it's valid hex
      expect(/^[0-9a-f]+$/i.test(key)).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should generate unique keys on each call', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const { generateEncryptionKey } = await import('../encryption');
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();

      expect(key1).not.toBe(key2);

      consoleSpy.mockRestore();
    });
  });

  describe('secureClear', () => {
    it('should accept a string without throwing', async () => {
      const { secureClear } = await import('../encryption');

      expect(() => secureClear('sensitive-data')).not.toThrow();
    });

    it('should handle empty string', async () => {
      const { secureClear } = await import('../encryption');

      expect(() => secureClear('')).not.toThrow();
    });

    it('should handle non-string input gracefully', async () => {
      const { secureClear } = await import('../encryption');

      // Should not throw for non-string input
      expect(() => secureClear(null as any)).not.toThrow();
      expect(() => secureClear(undefined as any)).not.toThrow();
      expect(() => secureClear(123 as any)).not.toThrow();
    });
  });

  describe('Environment Key Validation', () => {
    it('should throw error when ENCRYPTION_KEY is missing', async () => {
      jest.resetModules();
      delete process.env.ENCRYPTION_KEY;

      const { encryptSensitiveData } = await import('../encryption');

      // Error gets wrapped in "Encryption failed"
      expect(() => encryptSensitiveData('test')).toThrow('Encryption failed');
    });

    it('should throw error when ENCRYPTION_KEY is too short', async () => {
      jest.resetModules();
      process.env.ENCRYPTION_KEY = 'short';

      const { encryptSensitiveData } = await import('../encryption');

      // Error gets wrapped in "Encryption failed"
      expect(() => encryptSensitiveData('test')).toThrow('Encryption failed');
    });

    it('should work with exactly 32 character key', async () => {
      jest.resetModules();
      process.env.ENCRYPTION_KEY = 'x'.repeat(32);

      const { encryptSensitiveData, decryptSensitiveData } = await import('../encryption');

      const encrypted = encryptSensitiveData('test');
      const decrypted = decryptSensitiveData(encrypted);

      expect(decrypted).toBe('test');
    });

    it('should work with longer than 32 character key', async () => {
      jest.resetModules();
      process.env.ENCRYPTION_KEY = 'x'.repeat(64);

      const { encryptSensitiveData, decryptSensitiveData } = await import('../encryption');

      const encrypted = encryptSensitiveData('test');
      const decrypted = decryptSensitiveData(encrypted);

      expect(decrypted).toBe('test');
    });

    it('should fail decryption with different key', async () => {
      jest.resetModules();
      process.env.ENCRYPTION_KEY = 'original-key-that-is-at-least-32-chars';

      const encryption1 = await import('../encryption');
      const encrypted = encryption1.encryptSensitiveData('secret');

      // Reset and use different key
      jest.resetModules();
      process.env.ENCRYPTION_KEY = 'different-key-that-is-at-least-32-chars';

      const encryption2 = await import('../encryption');

      expect(() => encryption2.decryptSensitiveData(encrypted)).toThrow('Decryption failed');
    });
  });

  describe('Default Export', () => {
    it('should export all functions via default export', async () => {
      const encryptionUtils = await import('../encryption');

      expect(encryptionUtils.default).toBeDefined();
      expect(encryptionUtils.default.encryptSensitiveData).toBeDefined();
      expect(encryptionUtils.default.decryptSensitiveData).toBeDefined();
      expect(encryptionUtils.default.encryptPlaidToken).toBeDefined();
      expect(encryptionUtils.default.decryptPlaidToken).toBeDefined();
      expect(encryptionUtils.default.isEncryptedData).toBeDefined();
      expect(encryptionUtils.default.secureClear).toBeDefined();
      expect(encryptionUtils.default.generateEncryptionKey).toBeDefined();
    });
  });

  describe('Cryptographic Security', () => {
    it('should use 32-byte (256-bit) salt', async () => {
      const { encryptSensitiveData } = await import('../encryption');

      const encrypted = encryptSensitiveData('test');

      // Salt should be 32 bytes = 64 hex characters
      expect(encrypted.salt).toHaveLength(64);
    });

    it('should use 16-byte (128-bit) IV', async () => {
      const { encryptSensitiveData } = await import('../encryption');

      const encrypted = encryptSensitiveData('test');

      // IV should be 16 bytes = 32 hex characters
      expect(encrypted.iv).toHaveLength(32);
    });

    it('should use 16-byte (128-bit) auth tag', async () => {
      const { encryptSensitiveData } = await import('../encryption');

      const encrypted = encryptSensitiveData('test');

      // Auth tag should be 16 bytes = 32 hex characters
      expect(encrypted.tag).toHaveLength(32);
    });

    it('should produce authenticated encryption (GCM mode)', async () => {
      const { encryptSensitiveData, decryptSensitiveData } = await import('../encryption');

      const encrypted = encryptSensitiveData('sensitive-data');

      // Tamper with single bit in ciphertext
      const tamperedChar = encrypted.encrypted[0] === 'f' ? 'e' : 'f';
      const tampered = {
        ...encrypted,
        encrypted: tamperedChar + encrypted.encrypted.slice(1),
      };

      // GCM mode should detect tampering via auth tag
      expect(() => decryptSensitiveData(tampered)).toThrow();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle Plaid sandbox access tokens', async () => {
      const { encryptPlaidToken, decryptPlaidToken } = await import('../encryption');

      const token = 'access-sandbox-8ab976e6-64bc-4b38-98f7-731e7a349970';
      const encrypted = encryptPlaidToken(token);
      const decrypted = decryptPlaidToken(encrypted);

      expect(decrypted).toBe(token);
    });

    it('should handle Plaid development access tokens', async () => {
      const { encryptPlaidToken, decryptPlaidToken } = await import('../encryption');

      const token = 'access-development-8ab976e6-64bc-4b38-98f7-731e7a349970';
      const encrypted = encryptPlaidToken(token);
      const decrypted = decryptPlaidToken(encrypted);

      expect(decrypted).toBe(token);
    });

    it('should handle storing and retrieving encrypted credentials object', async () => {
      const { encryptSensitiveData, decryptSensitiveData } = await import('../encryption');

      const credentials = {
        accessToken: 'access-sandbox-12345',
        itemId: 'item-123456789',
        institution: 'chase',
        timestamp: new Date().toISOString(),
      };

      const encrypted = encryptSensitiveData(JSON.stringify(credentials));
      const decrypted = JSON.parse(decryptSensitiveData(encrypted));

      expect(decrypted).toEqual(credentials);
    });

    it('should handle Israeli bank scraper credentials', async () => {
      const { encryptSensitiveData, decryptSensitiveData } = await import('../encryption');

      // Simulated Hebrew bank credentials
      const credentials = {
        username: 'user123',
        password: 'סיסמא123!',
        bankCode: 'hapoalim',
      };

      const encrypted = encryptSensitiveData(JSON.stringify(credentials));
      const decrypted = JSON.parse(decryptSensitiveData(encrypted));

      expect(decrypted.password).toBe('סיסמא123!');
    });
  });
});
