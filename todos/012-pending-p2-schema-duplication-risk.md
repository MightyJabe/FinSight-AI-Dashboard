---
status: pending
priority: p2
issue_id: "012"
tags: [architecture, code-review, database]
dependencies: []
---

# Database Schema Duplication and Inconsistency Risk

## Problem Statement

The proposed new schema (`users/{userId}/netWorth/`, `assets/`, `liabilities/`) overlaps with **existing collections**, creating data inconsistency and maintenance nightmare.

## Findings

**Existing Collections:**
```
users/{userId}/manualAssets/
users/{userId}/manualLiabilities/
users/{userId}/crypto_accounts/
users/{userId}/summaries/financial
users/{userId}/snapshots/{YYYY-MM-DD}
accounts/ (top-level, filtered by userId)
```

**Proposed New Collections:**
```
users/{userId}/netWorth/current/
users/{userId}/netWorth/history/
users/{userId}/assets/bankAccounts/
users/{userId}/assets/crypto/
users/{userId}/assets/investments/
users/{userId}/assets/realEstate/
users/{userId}/assets/pension/
users/{userId}/liabilities/loans/
users/{userId}/liabilities/creditCards/
```

**Problems:**
1. `assets/crypto/` duplicates `crypto_accounts/`
2. `netWorth/history/` duplicates `snapshots/`
3. `assets/bankAccounts/` duplicates top-level `accounts/`
4. Same data in multiple places = inconsistency

## Proposed Solutions

### Option A: Extend Existing Schema (Recommended)
**Pros:** No migration, consistent data
**Cons:** Slightly less "clean" naming
**Effort:** None (use what exists)
**Risk:** Low

Add new asset types to existing `manualAssets`:
```typescript
// Existing collection supports:
interface ManualAsset {
  type: 'real_estate' | 'vehicle' | 'pension' | 'investment' | 'other';
  // ...
}
```

### Option B: Full Schema Migration
**Pros:** Clean slate
**Cons:** Data migration risk, downtime, 2-3 weeks work
**Effort:** Large
**Risk:** High

## Recommended Action

**Option A** - Use existing schema. The current structure supports all proposed asset types via the `type` field.

Also standardize on subcollection pattern - deprecate top-level `accounts/` collection.

## Technical Details

**Do NOT Create:**
- `users/{userId}/assets/` (use `manualAssets`)
- `users/{userId}/liabilities/` (use `manualLiabilities`)
- `users/{userId}/netWorth/history/` (use `snapshots`)

**May Create:**
- `users/{userId}/summaries/assetBreakdown` - denormalized summary for fast reads

## Acceptance Criteria

- [ ] No duplicate collections created
- [ ] Plan updated to use existing schema
- [ ] Existing manualAssets extended if needed
- [ ] Data consistency maintained
- [ ] Migration plan if any schema changes needed

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-16 | Created from architecture review | Understand existing schema before proposing new |

## Resources

- Architecture review findings
- Existing schema: `users/{userId}/manualAssets/`
