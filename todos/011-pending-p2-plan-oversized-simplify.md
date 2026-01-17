---
status: pending
priority: p2
issue_id: "011"
tags: [architecture, code-review, planning]
dependencies: []
---

# Implementation Plan Over-Engineered - 60-70% Already Exists

## Problem Statement

The 12-week implementation plan proposes building many services and features that **already exist** in the codebase. This wastes 4-5 weeks of development time on duplicate work.

## Findings

**From Simplicity Review:**

| Proposed New Service | Already Exists | Location |
|---------------------|----------------|----------|
| `net-worth-service.ts` | `calculate-net-worth.ts` | `src/lib/calculate-net-worth.ts` (122 lines) |
| `ccxt-client.ts` | Already uses ccxt | `src/lib/integrations/crypto/coinbase.ts` |
| `retirement-calculator.ts` | Complete | `src/lib/retirement-calculator.ts` (101 lines) |
| Subscription detection | Working | `src/lib/subscription-detector.ts` (132 lines) |
| AI insights service | Working | `src/lib/ai-proactive-insights.ts` (197 lines) |
| WebSocket infrastructure | Not needed | SWR polling achieves same UX |
| 8 new DB collections | Unnecessary | Existing `manualAssets` supports all types |

**YAGNI Violations:**
1. WebSocket - financial data changes daily at most
2. Real estate/pension modules - manual entry takes 30 seconds
3. New database schema - existing supports pension, real_estate via type field

## Proposed Solutions

### Option A: Revise Plan to Enhance Existing Code (Recommended)
**Pros:** 70-80% less code, 5 weeks saved
**Cons:** Less "impressive" scope
**Effort:** Plan revision (2 hours)
**Risk:** Low

**Simplified Timeline:**
| Phase | Original | Revised | Focus |
|-------|----------|---------|-------|
| 1 | 3 weeks | 2 weeks | Form enhancements, not new services |
| 2 | 3 weeks | 2 weeks | Visualization, not new modules |
| 3 | 3 weeks | 2 weeks | Extend existing AI service |
| 4 | 3 weeks | 1-2 weeks | PWA + polish, skip WebSocket |
| **Total** | **12 weeks** | **7-8 weeks** | |

### Option B: Proceed with Original Plan
**Pros:** Complete rewrite, "clean" architecture
**Cons:** Duplicate work, more bugs, delayed launch
**Effort:** 12 weeks
**Risk:** High

## Recommended Action

**Option A** - Revise the plan to build on existing code. The simplicity review shows the foundation is solid.

## Technical Details

**What to Remove from Plan:**
- `src/lib/websocket/` - use SWR polling instead
- `src/lib/real-estate/` - use existing manualAssets
- `src/lib/pension/` - use existing asset type field
- New `net-worth-service.ts` - enhance existing calculate-net-worth.ts
- 8 new DB collections - 0-2 actually needed

**What to Keep:**
- Israeli bank scraper reliability improvements
- Dashboard redesign with hero net worth
- Hebrew localization
- PWA support

## Acceptance Criteria

- [ ] Revised plan reviewed and approved
- [ ] Existing services identified and documented
- [ ] Timeline reduced to 7-8 weeks
- [ ] No duplicate code written
- [ ] Existing tests continue passing

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-16 | Created from simplicity review | Read codebase before proposing new features |

## Resources

- Simplicity review agent findings
- Existing services in `src/lib/`
- YAGNI principle: https://martinfowler.com/bliki/Yagni.html
