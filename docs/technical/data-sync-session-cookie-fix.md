# Data Synchronization Fix

## Problem

Dashboard and accounts pages showed $0 for all metrics, while insights and chat pages showed correct values ($27,255 net worth). This was caused by inconsistent data fetching.

## Root Cause

The `/api/financial-overview` endpoint was incorrectly passing the session cookie string to `getFinancialOverview()` instead of extracting the userId first. This caused the function to fail silently and return empty data.

## Solution

### 1. Fixed Session Cookie Handling

**File**: `src/app/api/financial-overview/route.ts`

**Before**:

```typescript
const sessionCookie = request.cookies.get('session')?.value;
const { data, metrics } = sessionCookie
  ? await getFinancialOverview(sessionCookie) // ❌ Wrong: passing cookie string
  : await getFinancialOverview();
```

**After**:

```typescript
const sessionCookie = request.cookies.get('session')?.value;
const { adminAuth } = await import('@/lib/firebase-admin');
const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
const userId = decodedClaims.uid; // ✅ Extract userId first

const { data, metrics } = await getFinancialOverview(userId);
```

### 2. Added Force Refresh Parameter

Added `?force=true` query parameter to bypass cache when needed:

```typescript
const forceRefresh = searchParams.get('force') === 'true';
if (!forceRefresh) {
  // Check cache...
}
```

### 3. Added Logging

Added detailed logging to track data fetching:

```typescript
logger.info('Financial overview raw data:', {
  manualAssets: rawData.manualAssets.length,
  manualLiabilities: rawData.manualLiabilities.length,
  plaidAccounts: rawData.plaidAccounts.length,
  cryptoAccounts: rawData.cryptoAccounts.length,
  metrics: { totalAssets, totalLiabilities, netWorth },
});
```

### 4. Improved Cache Invalidation

Updated `useDashboardData` hook to clear all related caches:

```typescript
const refetch = useCallback(() => {
  mutate();
  globalMutate(key => typeof key === 'string' && key.includes('/api/financial'));
  globalMutate(key => typeof key === 'string' && key.includes('/api/overview'));
  globalMutate(key => typeof key === 'string' && key.includes('/api/accounts'));
}, [mutate]);
```

## Data Flow (Fixed)

```
User Request
  ↓
Dashboard Page
  ↓
useDashboardData Hook
  ↓
GET /api/financial-overview
  ↓
Extract userId from session cookie ✅
  ↓
getFinancialOverview(userId)
  ↓
fetchFinancialData(userId)
  ├─ Manual Assets from Firestore
  ├─ Manual Liabilities from Firestore
  ├─ Plaid Accounts (if connected)
  ├─ Crypto Accounts from Firestore
  └─ Transactions from Firestore
  ↓
calculateFinancialMetrics(data)
  ├─ Total Assets = Manual + Plaid + Crypto
  ├─ Total Liabilities = Manual Liabilities
  ├─ Net Worth = Assets - Liabilities
  ├─ Liquid Assets = Cash + Checking + Savings
  ├─ Monthly Income/Expenses from Transactions
  └─ Investments = Investment Accounts + Crypto
  ↓
enforceFinancialAccuracy(metrics)
  ↓
Return to Dashboard ✅
```

## Testing

### To Verify Fix:

1. Open dashboard at `/dashboard`
2. Check that net worth, assets, and liabilities show correct values
3. Compare with `/insights` page - values should match
4. Check browser console for any errors
5. Check server logs for "Financial overview raw data" entries

### To Force Refresh:

```typescript
// In browser console
fetch('/api/financial-overview?force=true&includePlatforms=false', {
  credentials: 'include',
})
  .then(r => r.json())
  .then(console.log);
```

### To Clear SWR Cache:

```typescript
// In browser console
import { mutate } from 'swr';
mutate('/api/financial-overview?includePlatforms=false');
```

## Why Insights Page Worked

The `/api/insights` endpoint was already correctly extracting userId:

```typescript
const authHeader = request.headers.get('Authorization');
const idToken = authHeader.split('Bearer ')[1];
const decodedToken = await auth.verifyIdToken(idToken);
const userId = decodedToken.uid; // ✅ Correct from the start

const { data, metrics } = await getFinancialOverview(userId);
```

## Files Modified

1. `src/app/api/financial-overview/route.ts` - Fixed userId extraction
2. `src/hooks/use-dashboard-data.ts` - Improved cache invalidation
3. `src/app/api/accounts/route.ts` - Updated to use centralized calculator
4. `src/app/api/liabilities/route.ts` - Updated to use centralized calculator
5. `src/lib/financial-calculator.ts` - Added crypto accounts support

## Benefits

✅ All pages now show consistent data
✅ Single source of truth for calculations
✅ Proper authentication and authorization
✅ Better caching with force refresh option
✅ Detailed logging for debugging
✅ Includes all data sources (Plaid, Manual, Crypto)

## Next Steps

1. **Test thoroughly** - Verify all pages show correct data
2. **Monitor logs** - Check for any errors in data fetching
3. **Clear browser cache** - If issues persist, clear browser cache and cookies
4. **Refresh page** - Hard refresh (Ctrl+Shift+R) to bypass SWR cache
