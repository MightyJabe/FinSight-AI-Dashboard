---
status: pending
priority: p3
issue_id: "016"
tags: [architecture, code-review, localization]
dependencies: []
---

# Missing Israeli-Specific Financial Types

## Problem Statement

Existing types use US-centric terminology (`RMD`, `401k`). Israeli users need pension fund types and tax considerations.

## Findings

**From Architecture Review:**

Current retirement types are US-focused:
```typescript
// retirement-calculator.ts
expectedAnnualReturn: 0.07, // US market average
```

**Missing Israeli types:**
- Keren Pensia (pension fund)
- Keren Hishtalmut (advanced study fund)
- Kupat Gemel (provident fund)
- Mas Hachnasa (income tax) considerations

## Proposed Solutions

### Option A: Add Israeli Financial Types
**Pros:** Better Israeli user experience
**Cons:** More complexity
**Effort:** Medium (1-2 days)
**Risk:** Low

```typescript
// src/types/israeli-finance.ts
interface IsraeliPensionFund {
  type: 'pensia_mikifya' | 'pensia_klali' | 'keren_hishtalmut' | 'kupat_gemel';
  monthlyContribution: number;
  employerContribution: number;
  taxBenefitUsed: number;
  vestingPeriod: Date;
}
```

## Recommended Action

Add types in Phase 2-3 when pension integration is implemented.

## Acceptance Criteria

- [ ] Israeli pension types defined
- [ ] Retirement calculator uses Israeli assumptions
- [ ] Tax benefits calculated correctly
- [ ] Hebrew field labels in UI

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-16 | Created from architecture review | Localization goes beyond translation |
