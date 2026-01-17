---
status: complete
priority: p1
issue_id: "005"
tags: [data-integrity, code-review, financial]
dependencies: []
---

# Decimal Precision Issues in Financial Calculations

## Problem Statement

Using JavaScript's native `Math.round(value * 100) / 100` for financial calculations introduces **floating-point errors**. Over 10,000 transactions, these errors can compound to **50+ currency units** of inaccuracy.

For a financial application showing net worth, this is unacceptable - users will lose trust if their numbers don't add up.

## Findings

**File:** `src/lib/financial-validator.ts` (lines 101-103)

```typescript
export function roundFinancialValue(value: number): number {
  return Math.round(value * 100) / 100; // 0.615 becomes 0.61, should be 0.62!
}
```

**Demonstration of Issue:**
```javascript
// Classic floating-point problem
0.1 + 0.2 === 0.3  // false! Returns 0.30000000000000004

// Rounding amplifies errors
Math.round(0.615 * 100) / 100  // 0.61 (should be 0.62)
Math.round(1.005 * 100) / 100  // 1 (should be 1.01)
```

**Impact Calculation:**
- Average error per transaction: ±0.005
- 10,000 transactions: ±50 currency units
- For ILS: ₪50 error in net worth display

## Proposed Solutions

### Option A: Use decimal.js Library (Recommended)
**Pros:** Industry standard, handles all edge cases
**Cons:** Additional dependency (~31KB)
**Effort:** Medium (4-8 hours)
**Risk:** Low

```typescript
import Decimal from 'decimal.js';

export function roundFinancialValue(value: number): number {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

export function addFinancialValues(a: number, b: number): number {
  return new Decimal(a).plus(b).toNumber();
}
```

### Option B: Integer Arithmetic (Store Cents)
**Pros:** No dependency, fastest
**Cons:** Requires data migration, more code changes
**Effort:** Large (2-3 days)
**Risk:** Medium

Store all amounts in cents/agorot:
- ₪100.50 stored as 10050
- Display: `value / 100`

### Option C: String-Based Decimal Handling
**Pros:** No dependency
**Cons:** More complex, slower
**Effort:** Medium (1 day)
**Risk:** Low

## Recommended Action

**Option A** - Use decimal.js. It's the standard solution and worth the small bundle size for a financial app.

## Technical Details

**Affected Files:**
- `src/lib/financial-validator.ts` - replace Math.round
- `src/lib/financial-calculator.ts` - all aggregations
- `src/lib/calculate-net-worth.ts` - net worth sum
- `src/components/` - any display formatting

**Install:**
```bash
npm install decimal.js
npm install -D @types/decimal.js
```

## Acceptance Criteria

- [ ] All financial math uses decimal.js
- [ ] 0.1 + 0.2 === 0.3 in tests
- [ ] Rounding 0.615 produces 0.62
- [ ] Net worth calculation accurate to 2 decimal places
- [ ] No floating-point artifacts in displayed values

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-16 | Created from data integrity review | Never use native JS for money math |

## Resources

- decimal.js: https://github.com/MikeMcl/decimal.js
- IEEE 754 floating point issues: https://floating-point-gui.de/
- Data integrity review findings
