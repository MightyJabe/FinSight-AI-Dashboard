---
status: pending
priority: p1
issue_id: "003"
tags: [architecture, code-review, infrastructure]
dependencies: []
---

# WebSocket Architecture Incompatible with Vercel

## Problem Statement

The implementation plan proposes WebSocket for real-time updates (Phase 4), but **Vercel's serverless functions do not support persistent WebSocket connections**. Vercel has a 10-60 second execution limit.

Implementing WebSocket as planned will fail completely on the production infrastructure.

## Findings

**From Architecture Review:**
- Vercel serverless functions have 10-second limit (25s Pro)
- WebSocket requires persistent connections
- Current deployment: `vercel.json` with `"regions": ["fra1"]`

**Current Caching Pattern:**
```typescript
// src/app/api/net-worth/route.ts
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000;
```

This in-memory cache is also problematic - each serverless instance has its own cache.

## Proposed Solutions

### Option A: SWR Polling with Aggressive Refresh (Recommended for MVP)
**Pros:** No infrastructure changes, works immediately
**Cons:** 5-30 second latency
**Effort:** Small (2-4 hours)
**Risk:** Low

```typescript
// src/hooks/use-net-worth.ts
const { data } = useSWR('/api/net-worth', fetcher, {
  refreshInterval: 5000,  // Poll every 5 seconds
  revalidateOnFocus: true,
  dedupingInterval: 2000,
});
```

### Option B: Server-Sent Events (SSE) via Edge Functions
**Pros:** Near real-time, Vercel Edge compatible
**Cons:** More complex, requires edge runtime
**Effort:** Medium (1-2 days)
**Risk:** Medium

### Option C: Pusher/Ably Managed Service
**Pros:** True real-time, managed infrastructure
**Cons:** Additional cost ($50-200/month), vendor dependency
**Effort:** Medium (2-3 days)
**Risk:** Low

### Option D: Firebase Realtime Database
**Pros:** Already using Firebase, built-in real-time
**Cons:** Adds complexity, different query patterns
**Effort:** Large (1 week)
**Risk:** Medium

## Recommended Action

**MVP (Phase 4):** Option A - SWR polling with 5-second intervals
**Post-MVP:** Evaluate Option B (SSE) or Option C (Pusher) based on user feedback

## Technical Details

**Affected Files:**
- Remove proposed: `src/lib/websocket/`
- Remove proposed: `src/app/api/ws/route.ts`
- Update: `src/hooks/use-net-worth.ts` (if exists, or create)
- Update: All dashboard components using financial data

## Acceptance Criteria

- [ ] Real-time feeling achieved with <5 second updates
- [ ] No WebSocket code in codebase
- [ ] Works correctly on Vercel deployment
- [ ] Battery/bandwidth efficient on mobile
- [ ] Falls back gracefully on poor connections

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-16 | Created from architecture review | Serverless != persistent connections |

## Resources

- Vercel limitations: https://vercel.com/docs/functions/runtimes#execution-timeout
- SWR documentation: https://swr.vercel.app/docs/revalidation
- Pusher pricing: https://pusher.com/pricing
