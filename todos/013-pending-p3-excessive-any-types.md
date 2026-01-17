---
status: pending
priority: p3
issue_id: "013"
tags: [quality, code-review, typescript]
dependencies: []
---

# Excessive `any` Types in Codebase

## Problem Statement

The codebase contains **218 occurrences of `any` types** across 59 files. This undermines TypeScript's type safety benefits and makes refactoring risky.

## Findings

**From Pattern Recognition Review:**
- 218 `any` type usages found
- Spread across 59 files
- Most common in API routes and Firestore operations

**Examples:**
```typescript
// Common pattern found
const data = doc.data() as any;
snapshot.docs.map((doc: any) => ...);
```

## Proposed Solutions

### Option A: Gradual Type Improvement
**Pros:** Low risk, can be done incrementally
**Cons:** Takes time
**Effort:** Medium (ongoing)
**Risk:** Low

Replace `any` with proper types:
```typescript
interface TransactionDoc {
  id: string;
  amount: number;
  date: string;
  // ...
}

const data = doc.data() as TransactionDoc;
```

## Recommended Action

Address as part of regular maintenance. Not blocking for launch.

## Acceptance Criteria

- [ ] Reduce `any` count by 50% in first pass
- [ ] All new code has proper types
- [ ] Core financial types fully typed
- [ ] ESLint rule for no-explicit-any warnings

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-16 | Created from pattern review | Type safety is incremental |
