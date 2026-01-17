---
status: complete
priority: p1
issue_id: "006"
tags: [performance, code-review, crypto]
dependencies: []
---

# Sequential N+1 Query Pattern in Crypto Portfolio API

## Problem Statement

The crypto portfolio API fetches exchange data **sequentially** in a for loop. With 12 connected exchanges, this results in **24+ sequential API calls** taking **6+ seconds** to respond.

This will cause timeouts and terrible user experience on the dashboard.

## Findings

**File:** `src/app/api/crypto/portfolio/route.ts` (lines 24-45)

```typescript
for (const doc of cryptoAccountsSnapshot.docs) {
  const account = doc.data();
  // Each iteration AWAITS - sequential execution!
  if (account.exchange === 'coinbase') {
    portfolio = await getCoinbasePortfolio(account.apiKey, account.apiSecret);
  } else if (account.exchange === 'binance') {
    portfolio = await getBinancePortfolio(account.apiKey, account.apiSecret);
  }
  // ...
}
```

**Performance Impact:**
- Each CCXT call: 200-500ms
- 12 exchanges: 2.4-6 seconds (sequential)
- With rate limiting: 10+ seconds
- Vercel timeout: 10-60 seconds (function may fail)

## Proposed Solutions

### Option A: Promise.all with Rate Limiting (Recommended)
**Pros:** Parallel execution, respects rate limits
**Cons:** Slightly more complex
**Effort:** Small (2-4 hours)
**Risk:** Low

```typescript
const portfolioPromises = cryptoAccountsSnapshot.docs.map(async (doc) => {
  const account = doc.data();
  try {
    return await getPortfolioByExchange(account);
  } catch (error) {
    logger.error('Exchange fetch failed', { exchange: account.exchange, error });
    return null; // Don't fail entire request
  }
});

const portfolios = await Promise.all(portfolioPromises);
const validPortfolios = portfolios.filter(Boolean);
```

### Option B: Background Job with Cached Results
**Pros:** Instant response, no timeout risk
**Cons:** Stale data (up to 5 min)
**Effort:** Medium (1 day)
**Risk:** Low

## Recommended Action

**Option A** - Use Promise.all. Add per-exchange error handling so one failed exchange doesn't break the entire response.

## Technical Details

**Affected Files:**
- `src/app/api/crypto/portfolio/route.ts` - parallelize
- Consider: Add circuit breaker per exchange

**Performance Improvement:**
- Before: 6+ seconds (sequential)
- After: ~500ms (parallel, limited by slowest)

## Acceptance Criteria

- [ ] All exchange fetches run in parallel
- [ ] Single exchange failure doesn't break entire request
- [ ] Response time < 2 seconds for 5+ exchanges
- [ ] Rate limits respected per exchange
- [ ] Error logged for failed exchanges

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-16 | Created from performance review | Always parallelize independent async operations |

## Resources

- Performance review agent findings
- Promise.all documentation: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
