---
status: complete
priority: p2
issue_id: "009"
tags: [data-integrity, code-review, crypto]
dependencies: []
completed_date: 2026-01-16
---

# Crypto Balance Hardcoded to Zero in Net Worth - FIXED ✅

## Problem Statement

The financial calculator **always returned 0** for crypto balance, even when users had connected crypto accounts. This made net worth incorrect for any user with crypto holdings.

## Solution Implemented

Created `src/lib/services/crypto-balance-service.ts` that:
- Fetches real crypto balances from exchanges (Coinbase, Binance via CCXT)
- Implements 5-minute caching to avoid rate limits
- Gracefully falls back to cached values on errors
- Integrates with the centralized financial calculator

## Changes Made

**New File:** `src/lib/services/crypto-balance-service.ts`
```typescript
export async function getCryptoBalance(userId: string, forceRefresh = false): Promise<CryptoBalanceResult>
export function clearCryptoCache(userId: string): void
```

**Modified:** `src/lib/financial-calculator.ts`
- Now imports and uses `getCryptoBalance()`
- Crypto accounts included in totalAssets calculation
- Removed the hardcoded `cryptoBalance: 0` TODO

## Verification

- [x] Crypto balance included in net worth calculation
- [x] Uses existing crypto account data from Firestore
- [x] Falls back to 0 if no crypto accounts connected
- [x] Crypto shown in asset breakdown on dashboard
- [x] Build passes with crypto integration

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-16 | Created from data integrity + simplicity reviews | Don't ignore existing working code |
| 2026-01-16 | Implemented crypto-balance-service.ts | Cache is important for rate-limited APIs |
| 2026-01-16 | Integrated into financial-calculator.ts | Use parallel Promise.all for performance |
