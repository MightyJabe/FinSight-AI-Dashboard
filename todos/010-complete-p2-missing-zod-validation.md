---
status: complete
priority: p2
issue_id: "010"
tags: [security, code-review, validation]
dependencies: []
completed_date: 2026-01-16
---

# Missing Zod Validation Added to API Routes - FIXED

## Problem Statement

Several API routes accepted user input without Zod schema validation, violating the project's CLAUDE.md guidelines and exposing the app to malformed data attacks.

## Solution Implemented

Added Zod validation schemas to critical API routes:

### 1. `src/app/api/banking/connect/route.ts`
```typescript
const plaidConnectionSchema = z.object({
  provider: z.literal('plaid'),
  publicToken: z.string().min(1, 'Public token is required'),
});

const israelConnectionSchema = z.object({
  provider: z.literal('israel'),
  companyId: z.string().min(1, 'Company ID is required'),
  credentials: z.object({...}).passthrough(),
});

const connectionSchema = z.discriminatedUnion('provider', [...]);
```

### 2. `src/app/api/banking/transactions/route.ts`
```typescript
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(500).default(100),
  cursor: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
```

### 3. `src/app/api/crypto/connect/route.ts`
Already had Zod validation in place (no changes needed).

## Verification

- [x] banking/connect has discriminated union schema
- [x] banking/transactions has query param validation
- [x] crypto/connect already validated (confirmed)
- [x] Invalid input returns 400 with field errors
- [x] TypeScript types derived from schemas

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-16 | Created from security review | Follow project conventions consistently |
| 2026-01-16 | Added Zod to banking/connect | Discriminated unions work great for provider-specific validation |
| 2026-01-16 | Added Zod to banking/transactions | z.coerce is essential for URL query params |
