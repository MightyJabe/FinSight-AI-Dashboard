---
status: complete
priority: p1
issue_id: "003"
tags: [architecture, code-review, vercel]
dependencies: []
completed_date: 2026-01-16
---

# WebSocket Incompatible with Vercel - RESOLVED

## Problem Statement

The plan proposed WebSocket for real-time updates, but Vercel serverless doesn't support persistent WebSocket connections.

## Solution Implemented

Used **SWR polling with visibility awareness** as the MVP solution:
- `useNetWorth` hook with 10-second polling
- `useRealtimeCrypto` with 30-second polling (rate limit friendly)
- `useRealtimeDashboard` with 15-second polling
- Polling pauses when tab is hidden (saves API calls)

## Files

- `src/hooks/realtime.ts` - Visibility-aware polling hooks
- `src/lib/swr-config.ts` - SWR configuration

## Migration Path

When moving to Render/custom server, replace polling with WebSocket/SSE while keeping the same hook API.

## Verification

- [x] Dashboard updates without page refresh
- [x] No WebSocket code in codebase
- [x] Works on Vercel serverless
- [x] Polling stops when tab hidden
