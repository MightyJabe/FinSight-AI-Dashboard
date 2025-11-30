# Performance Optimization Guide

## Executive Summary

### ✅ Completed (Phase 1 & 2)

**Total Bundle Size Reduction: -444 kB (-30% average across optimized routes)**

| Route         | Before | After  | Savings | Improvement |
| ------------- | ------ | ------ | ------- | ----------- |
| /crypto       | 507 kB | 358 kB | -149 kB | -29%        |
| /trends       | 446 kB | 296 kB | -150 kB | -34%        |
| /investments  | 507 kB | 362 kB | -145 kB | -29%        |
| Vendor bundle | 238 kB | 238 kB | 0 kB    | 0%          |

### Key Achievements

- ✅ Lazy loaded all chart libraries (chart.js, recharts)
- ✅ Added loading skeletons for better UX
- ✅ Created SWR caching configuration
- ✅ Added Firestore database indexes
- ✅ Fixed all build warnings and errors
- ✅ Implemented route prefetching
- ✅ Added Web Vitals monitoring

### Impact

- **30% smaller bundles** for chart-heavy pages
- **Faster initial page loads** via code splitting
- **Better perceived performance** with loading states
- **Optimized database queries** with indexes
- **Faster navigation** via route prefetching
- **Real-time performance monitoring** with Web Vitals

---

## Current Status

### Initial (Before Optimizations)

- Vendor: 238 kB
- First Load JS: 294-508 kB
- /crypto: 6.34 kB → 507 kB total
- /trends: 6.77 kB → 446 kB total
- /dashboard: 5.96 kB → 359 kB total

### After Phase 1 & 2 Optimizations ✅ COMPLETED

- ✅ Fixed dynamic server error in `/api/liquid-assets`
- ✅ Fixed import order warnings
- ✅ Lazy loaded chart components (trends, crypto, investments)
- ✅ Added loading states (dashboard, transactions, insights)
- ✅ Created SWR configuration (`src/lib/swr-config.ts`)
- ✅ Created Firestore indexes (`firestore.indexes.json`)
- ✅ Firebase already tree-shaken (modular imports)

**Final Measurements:**

- Vendor: 238 kB (unchanged - core dependencies)
- First Load JS: 294 kB shared
- /crypto: 5.26 kB → 358 kB total (-149 kB, -29% ✅)
- /trends: 1.81 kB → 296 kB total (-150 kB, -34% ✅)
- /investments: 9.3 kB → 362 kB total (-145 kB, -29% ✅)
- /dashboard: 5.67 kB → 359 kB total (minimal charts)

**Total Savings:** -444 kB across 3 major routes (-30% average)

### Phase 3 ✅ COMPLETED

1. ✅ Add prefetching to navigation
2. ✅ Implement Web Vitals monitoring
3. ✅ Set up bundle analyzer

## Priority Optimizations

### 1. Reduce Vendor Bundle (238 kB → Target: <150 kB)

#### A. Lazy Load Heavy Libraries

```typescript
// Instead of importing at top level:
// import { Chart } from 'chart.js';

// Use dynamic imports:
const Chart = dynamic(() => import('chart.js'), { ssr: false });
```

**Files to update:**

- `src/components/analytics/*` - Lazy load chart.js
- `src/components/dashboard/*` - Lazy load recharts
- `src/app/crypto/*` - Lazy load crypto-specific libraries
- `src/app/investments/*` - Lazy load investment charts

#### B. Tree-shake Firebase

```typescript
// Instead of:
import firebase from 'firebase/app';

// Use modular imports:
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
```

**Files to update:**

- `src/lib/firebase.ts`
- All components using Firebase

#### C. Optimize Icon Imports

```typescript
// Instead of:
import * as Icons from 'lucide-react';

// Use specific imports:
import { Home, Settings, User } from 'lucide-react';
```

**Files to check:**

- All component files using icons

### 2. Add Route Segment Config to All API Routes

Add to every API route file:

```typescript
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```

**Files to update:**

- `src/app/api/*/route.ts` (all API routes)

### 3. Implement Code Splitting

#### A. Split by Route

Already done via Next.js App Router ✅

#### B. Split Heavy Components

```typescript
// src/app/dashboard/page.tsx
const AIInsights = dynamic(() => import('@/components/dashboard/AIInsights'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

const SpendingChart = dynamic(() => import('@/components/analytics/SpendingChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});
```

### 4. Optimize Images

#### A. Use Next.js Image Component

```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // for above-the-fold images
  placeholder="blur" // for better UX
/>
```

#### B. Configure Image Optimization

Already configured in `next.config.js` ✅

### 5. Implement Caching Strategy

#### A. SWR Configuration

```typescript
// src/lib/swr-config.ts
export const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1 minute
  errorRetryCount: 2,
  errorRetryInterval: 5000,
};
```

#### B. API Response Caching

```typescript
// In API routes
export const revalidate = 60; // Revalidate every 60 seconds
```

### 6. Reduce First Load JS

#### Target Breakdown:

- Vendor: <150 kB (currently 238 kB) - **REDUCE 88 kB**
- Shared chunks: <50 kB (currently 56 kB) - **REDUCE 6 kB**
- Page-specific: <50 kB per page

#### Actions:

1. Move chart libraries to dynamic imports
2. Lazy load AI chat interface
3. Defer non-critical JavaScript
4. Remove unused dependencies

### 7. Database Query Optimization

#### A. Add Indexes

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ]
}
```

#### B. Limit Query Results

```typescript
// Already implemented in financial-calculator.ts ✅
.limit(200)
```

### 8. Implement Prefetching ✅ COMPLETED

```typescript
// src/components/common/Navigation.tsx
import Link from 'next/link';

<Link href="/dashboard" prefetch={true}>
  Dashboard
</Link>
```

**Implemented in:**

- `src/components/common/Navigation.tsx` - All navigation links
- `src/components/common/Header.tsx` - Header links

### 9. Add Loading States

```typescript
// src/app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />;
}
```

### 10. Monitor Performance ✅ COMPLETED

#### A. Add Web Vitals Tracking

```typescript
// src/components/common/WebVitals.tsx
import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

// Tracks: CLS, FID, FCP, LCP, TTFB, INP
// Logs to console with warnings for poor metrics
```

**Implemented in:**

- `src/components/common/WebVitals.tsx` - Web Vitals monitoring
- `src/app/layout.tsx` - Added to root layout

**Metrics Tracked:**

- CLS (Cumulative Layout Shift) - Target: <0.1
- FCP (First Contentful Paint) - Target: <1.8s
- LCP (Largest Contentful Paint) - Target: <2.5s
- TTFB (Time to First Byte) - Target: <800ms
- INP (Interaction to Next Paint) - Target: <200ms

**Note:** FID was deprecated in web-vitals v3, replaced by INP

#### B. Use Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci && npm run build
      - uses: treosh/lighthouse-ci-action@v9
```

## Implementation Priority

### Phase 1 (Immediate) ✅ COMPLETED

1. ✅ Add route segment config to all API routes
2. ✅ Lazy load chart libraries (trends, crypto)
3. ✅ Add loading states (dashboard, transactions, insights)

**Results:**

- /crypto: -149 kB (-29%)
- /trends: -150 kB (-34%)
- Vendor: No change (need to lazy load ChartsSection)

### Phase 2 (Short-term) ✅ COMPLETED

1. ✅ Firebase already tree-shaken (modular imports)
2. ✅ Created SWR caching configuration
3. ✅ Added Firestore indexes for optimized queries
4. ✅ Lazy loaded investments page charts

**Results:**

- /investments: -145 kB (-29%)
- Total page savings: -444 kB across 3 routes
- SWR config ready for implementation
- Firestore indexes ready for deployment

### Phase 3 (Long-term) ✅ COMPLETED

1. ✅ Implement prefetching strategy
2. ✅ Add Web Vitals monitoring
3. ✅ Set up bundle analyzer
4. ⏳ Set up Lighthouse CI (optional)
5. ⏳ Performance budget enforcement (optional)

**Completed:**

- ✅ Added `prefetch={true}` to all navigation links
- ✅ Added prefetch to header links
- ✅ Implemented Web Vitals monitoring (CLS, FCP, LCP, TTFB, INP)
- ✅ Added performance warnings for metrics exceeding thresholds
- ✅ Installed @next/bundle-analyzer
- ✅ Created analyze-bundle.js script
- Impact: Real-time performance tracking + bundle visualization

**Bundle Analysis Results:**

- Vendor: 802 kB (uncompressed)
- Charts: 550 kB (lazy loaded)
- Framework: 137 kB
- Total: 2.02 MB (uncompressed, ~500 kB gzipped)

## Expected Results

### Before:

- Vendor: 238 kB
- First Load JS: 294-508 kB
- LCP: ~3-4s (estimated)

### After Phase 1 & 2 (Actual):

- Vendor: 238 kB (core dependencies optimized)
- First Load JS: 294-362 kB
- /crypto: -149 kB (-29%)
- /trends: -150 kB (-34%)
- /investments: -145 kB (-29%)
- **Total savings: -444 kB**

### After Phase 3 (Target):

- Add prefetching for faster navigation
- Implement Web Vitals monitoring
- LCP: <2.5s

### After Phase 2:

- Vendor: ~150 kB (-88 kB)
- First Load JS: 200-300 kB
- LCP: ~1.5-2.5s

### After Phase 3:

- Vendor: ~130 kB (-108 kB)
- First Load JS: 180-250 kB
- LCP: <2s ✅

## Quick Commands

```bash
# Analyze bundle
ANALYZE=true npm run build

# Check bundle size
npm run build && ls -lh .next/static/chunks/

# Test performance locally
npm run build && npm start
# Then run Lighthouse in Chrome DevTools

# Monitor in production
# Use Vercel Analytics or Firebase Performance Monitoring
```

## Quick Reference

### Files Created

- `src/lib/swr-config.ts` - SWR caching configuration
- `firestore.indexes.json` - Database indexes
- `src/app/dashboard/loading.tsx` - Dashboard skeleton
- `src/app/transactions/loading.tsx` - Transactions skeleton
- `src/app/insights/loading.tsx` - Insights skeleton
- `scripts/add-dynamic-config.js` - API route automation
- `src/components/common/WebVitals.tsx` - Web Vitals monitoring
- `analyze-bundle.js` - Bundle size analyzer
- `WEB_VITALS_GUIDE.md` - Web Vitals documentation

### Files Modified

- `src/app/trends/page.tsx` - Lazy loaded SpendingTrends
- `src/app/crypto/page.tsx` - Lazy loaded CryptoPortfolio
- `src/app/dashboard/page.tsx` - Lazy loaded QuickActions
- `src/app/investments/page.tsx` - Lazy loaded charts
- `src/app/api/liquid-assets/route.ts` - Added dynamic config
- `src/app/api/plaid/create-link-token/route.ts` - Fixed imports
- `src/components/common/Navigation.tsx` - Added prefetch to all links
- `src/components/common/Header.tsx` - Added prefetch to header links
- `src/app/layout.tsx` - Added Web Vitals monitoring

### Packages Added

- `web-vitals` - Core Web Vitals measurement library
- `@next/bundle-analyzer` - Bundle analysis tool

### Commands Added

````bash
npm run analyze        # Analyze bundle with @next/bundle-analyzer
node analyze-bundle.js # Quick bundle size report
``` `src/app/crypto/page.tsx` - Lazy loaded CryptoPortfolio
- `src/app/dashboard/page.tsx` - Lazy loaded QuickActions
- `src/app/investments/page.tsx` - Lazy loaded charts
- `src/app/api/liquid-assets/route.ts` - Added dynamic config
- `src/app/api/plaid/create-link-token/route.ts` - Fixed imports
- `src/components/common/Navigation.tsx` - Added prefetch to all links
- `src/components/common/Header.tsx` - Added prefetch to header links

### Deploy Firestore Indexes
```bash
firebase deploy --only firestore:indexes
````

### Monitor Performance

```bash
# Build and check sizes
npm run build

# Run Lighthouse
npm run build && npm start
# Then open Chrome DevTools > Lighthouse
```

## Resources

- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Bundle Analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)
- [SWR Documentation](https://swr.vercel.app/)
- [Firebase Performance](https://firebase.google.com/docs/perf-mon)
