---
status: pending
priority: p3
issue_id: "014"
tags: [performance, code-review, database]
dependencies: []
---

# Missing Firestore Composite Indexes

## Problem Statement

Several queries require composite indexes that may not be defined, causing full collection scans and performance degradation at scale.

## Findings

**Queries needing indexes:**
```typescript
// quarterly-estimates/route.ts
.where('year', '==', parseInt(year))

// snapshots query
.where('date', '>=', startDate)
.orderBy('date', 'asc')
```

## Proposed Solutions

### Option A: Define Required Indexes
**Pros:** Better query performance
**Cons:** Index storage cost (minimal)
**Effort:** Small (1-2 hours)
**Risk:** Low

Add to `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "quarterlyTaxEstimates",
      "fields": [
        { "fieldPath": "year", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "snapshots",
      "fields": [
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    }
  ]
}
```

## Recommended Action

Create indexes before launch. Monitor query performance in Firebase console.

## Acceptance Criteria

- [ ] All composite indexes defined
- [ ] No "index required" errors in logs
- [ ] Query latency < 100ms at 10K documents

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-16 | Created from performance review | Plan indexes early |
