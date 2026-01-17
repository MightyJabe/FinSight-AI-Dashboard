---
status: complete
priority: p2
issue_id: "007"
tags: [architecture, performance, code-review]
dependencies: []
completed_date: 2026-01-16
---

# In-Memory Cache Replaced with Redis - FIXED

## Problem Statement

Multiple API routes used in-memory `Map` caches that were **instance-local**. In Vercel's serverless environment, each request may hit a different instance, causing constant cache misses and unnecessary Firestore reads.

## Solution Implemented

Created centralized cache utility `src/lib/cache.ts` that:
- Uses Upstash Redis as primary cache (distributed across serverless instances)
- Falls back to in-memory cache if Redis unavailable
- Provides type-safe cache operations with TTL support
- Includes cache prefixes and TTL constants for different data types

## Changes Made

**New File:** `src/lib/cache.ts`
```typescript
export async function cacheGet<T>(key: string, options: CacheOptions): Promise<CacheResult<T>>
export async function cacheSet<T>(key: string, data: T, options: CacheOptions): Promise<void>
export async function cacheDel(key: string, options: CacheOptions): Promise<void>
export async function cacheGetOrSet<T>(key: string, fetcher: () => Promise<T>, options: CacheOptions): Promise<T>
export const CACHE_TTL = { REALTIME: 10, FREQUENT: 30, STANDARD: 60, SUMMARY: 300, STATIC: 3600 }
export const CACHE_PREFIX = { NET_WORTH: 'nw', FINANCIAL_OVERVIEW: 'fo', TRANSACTIONS: 'tx', ... }
```

**Modified:** `src/app/api/net-worth/route.ts`
- Replaced in-memory `Map` with Redis cache calls
- Uses `cacheGet` and `cacheSet` from centralized utility
- 30-second TTL for frequent data

## Verification

- [x] Redis cache operations implemented
- [x] In-memory fallback works when Redis unavailable
- [x] Cache keys are user-scoped with prefixes
- [x] TTL appropriate for data type
- [x] Build passes with cache implementation

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-16 | Created from architecture + performance reviews | In-memory doesn't work in serverless |
| 2026-01-16 | Created centralized cache.ts utility | Upstash Redis works great for serverless |
| 2026-01-16 | Updated net-worth route to use Redis | Cache prefixes help organize keys |
