---
status: complete
priority: p1
issue_id: "001"
tags: [security, code-review, crypto]
dependencies: []
---

# Crypto Exchange API Keys Stored Unencrypted

## Problem Statement

Crypto exchange API keys and secrets are stored in **plaintext** in Firestore. A database breach would expose all connected exchange accounts, potentially allowing attackers to drain user crypto funds.

This is the most critical security vulnerability in the application.

## Findings

**File:** `src/app/api/crypto/connect/route.ts` (lines 68-75)

```typescript
await db.collection('crypto_accounts').add({
  apiKey: apiKey.trim(),        // PLAINTEXT - CRITICAL VULNERABILITY
  apiSecret: apiSecret.trim(),  // PLAINTEXT - CRITICAL VULNERABILITY
});
```

**Evidence:**
- Encryption utility EXISTS at `src/lib/encryption.ts` using AES-256-GCM
- Israeli bank credentials ARE encrypted in `banking/connect/route.ts`
- Plaid tokens ARE encrypted in `exchange-public-token/route.ts`
- But crypto keys were missed

## Proposed Solutions

### Option A: Use Existing Encryption Utility (Recommended)
**Pros:** Consistent with existing patterns, no new dependencies
**Cons:** None
**Effort:** Small (1-2 hours)
**Risk:** Low

```typescript
import { encryptSensitiveData } from '@/lib/encryption';

await db.collection('crypto_accounts').add({
  apiKey: encryptSensitiveData(apiKey.trim()),
  apiSecret: encryptSensitiveData(apiSecret.trim()),
  // ...
});
```

### Option B: Use Cloud KMS
**Pros:** Enterprise-grade, key rotation
**Cons:** Additional cost, complexity
**Effort:** Large (1-2 days)
**Risk:** Medium

## Recommended Action

**Option A** - Use existing encryption utility for consistency.

Also update:
- `src/app/api/crypto/portfolio/route.ts` - decrypt when reading
- `src/lib/integrations/crypto/coinbase.ts` - decrypt before CCXT calls

## Technical Details

**Affected Files:**
- `src/app/api/crypto/connect/route.ts` - encrypt on write
- `src/app/api/crypto/portfolio/route.ts` - decrypt on read
- `src/lib/integrations/crypto/coinbase.ts` - decrypt before use
- `src/lib/integrations/crypto/binance.ts` - decrypt before use

**Database Changes:** None (encrypted values same field)

## Acceptance Criteria

- [ ] All crypto API keys encrypted before Firestore storage
- [ ] Decryption works correctly when fetching portfolio
- [ ] Existing connected accounts migrated (one-time script)
- [ ] No plaintext keys in Firestore console
- [ ] Unit test for encrypt/decrypt round-trip

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-16 | Created from security review | Encryption utility exists but wasn't applied to crypto |

## Resources

- Security review agent findings
- Existing encryption: `src/lib/encryption.ts`
- Similar pattern: `src/app/api/banking/connect/route.ts` (line 84)
