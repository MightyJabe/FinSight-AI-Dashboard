# MVP: Israeli Net Worth Dashboard

**Type:** MVP / Feature
**Priority:** Critical
**Timeline:** 2 Weeks
**Created:** 2025-01-06

---

## Vision (Unchanged)

> "Open the application and know exactly your net worth, and why."

---

## MVP Scope (Radically Simplified)

### What We're Building

A **single dashboard page** that shows:
1. **Total Net Worth** - Large, prominent, immediate
2. **Breakdown** - Assets vs Liabilities with drill-down
3. **Connected Accounts** - List of Israeli bank accounts via Salt Edge
4. **Why Changed** - Simple explanation of changes since last visit

### What We're NOT Building (Yet)

- ❌ BullMQ/Redis job queue (fetch inline)
- ❌ israeli-bank-scrapers integration (Salt Edge already works)
- ❌ AI "context builder" abstraction (use existing AI)
- ❌ Confidence scoring (show insights, no fake metrics)
- ❌ Crypto exchange APIs (manual entry later)
- ❌ Pension/investment APIs (manual entry later)
- ❌ Hebrew/RTL (English MVP, Hebrew v2 if needed)
- ❌ Offline mode (require internet)
- ❌ Push notifications (email later if needed)

---

## Technical Approach

### Architecture: Keep It Simple

```
User Opens App
     ↓
Dashboard Page (src/app/dashboard/page.tsx)
     ↓
useDashboardData hook (existing) → API Route → Salt Edge + Firebase
     ↓
NetWorthHero Component (NEW)
     ↓
Display: ₪687,350
```

**No new infrastructure.** Use existing:
- Salt Edge for Israeli bank connections
- Firebase for auth + data storage
- Existing `useDashboardData` hook
- Existing AI categorization

### Files to Create/Modify

```
src/components/dashboard/
├── NetWorthHero.tsx           # NEW: Large net worth display
├── NetWorthBreakdown.tsx      # NEW: Assets/liabilities breakdown
└── AccountsList.tsx           # MODIFY: Show connected accounts

src/app/dashboard/
└── page.tsx                   # MODIFY: Redesign with net worth focus

src/lib/
└── calculate-net-worth.ts     # NEW: Simple calculation function

src/app/api/
└── net-worth/route.ts         # NEW: API endpoint with Zod validation
```

**Total new code: ~400 lines**

---

## Week 1: Core Dashboard

### Day 1-2: Net Worth Calculation

**Task:** Create simple, accurate net worth calculation

```typescript
// src/lib/calculate-net-worth.ts
import { z } from 'zod';

export const NetWorthResultSchema = z.object({
  totalNetWorth: z.number(),
  totalAssets: z.number(),
  totalLiabilities: z.number(),
  assetsByType: z.record(z.string(), z.number()),
  liabilitiesByType: z.record(z.string(), z.number()),
  accountCount: z.number(),
  lastUpdated: z.date(),
});

export type NetWorthResult = z.infer<typeof NetWorthResultSchema>;

export function calculateNetWorth(accounts: Account[]): NetWorthResult {
  const assets = accounts.filter(a => a.balance >= 0 || isAssetType(a.type));
  const liabilities = accounts.filter(a => a.balance < 0 || isLiabilityType(a.type));

  const totalAssets = assets.reduce((sum, a) => sum + Math.abs(a.balance), 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + Math.abs(a.balance), 0);

  return {
    totalNetWorth: totalAssets - totalLiabilities,
    totalAssets,
    totalLiabilities,
    assetsByType: groupByType(assets),
    liabilitiesByType: groupByType(liabilities),
    accountCount: accounts.length,
    lastUpdated: new Date(),
  };
}
```

**Acceptance Criteria:**
- [ ] Net worth calculated correctly from accounts
- [ ] Assets and liabilities separated by account type
- [ ] Zod schema validates output
- [ ] Unit tests for edge cases (negative balances, zero accounts)

### Day 2-3: API Endpoint

**Task:** Create Zod-validated API route

```typescript
// src/app/api/net-worth/route.ts
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth-server';
import { calculateNetWorth } from '@/lib/calculate-net-worth';
import { getAccounts } from '@/lib/firebase-admin';

const ResponseSchema = z.object({
  success: z.literal(true),
  data: NetWorthResultSchema,
});

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.enum(['UNAUTHORIZED', 'NO_ACCOUNTS', 'FETCH_FAILED']),
});

export async function GET(req: Request) {
  try {
    const session = await verifySession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const accounts = await getAccounts(session.uid);

    if (accounts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No accounts connected', code: 'NO_ACCOUNTS' },
        { status: 404 }
      );
    }

    const netWorth = calculateNetWorth(accounts);

    return NextResponse.json({ success: true, data: netWorth });
  } catch (error) {
    console.error('Net worth calculation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate net worth', code: 'FETCH_FAILED' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria:**
- [ ] Zod validation on response
- [ ] Proper error codes and messages
- [ ] Auth verification
- [ ] < 200ms response time

### Day 3-4: Net Worth Hero Component

**Task:** Create the main visual display

```typescript
// src/components/dashboard/NetWorthHero.tsx
'use client';

import { formatCurrency } from '@/utils/formatters';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

interface NetWorthHeroProps {
  netWorth: number | null;
  previousNetWorth: number | null;
  lastUpdated: Date | null;
  isLoading: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function NetWorthHero({
  netWorth,
  previousNetWorth,
  lastUpdated,
  isLoading,
  onRefresh,
  isRefreshing,
}: NetWorthHeroProps) {
  if (isLoading) {
    return <SkeletonLoader variant="hero" />;
  }

  if (netWorth === null) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl text-muted-foreground">No accounts connected</h2>
        <p className="mt-2">Connect your Israeli bank to see your net worth</p>
      </div>
    );
  }

  const change = previousNetWorth ? netWorth - previousNetWorth : null;
  const changePercent = previousNetWorth && previousNetWorth !== 0
    ? ((change ?? 0) / previousNetWorth) * 100
    : null;
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className="text-center py-8 md:py-12">
      <p className="text-sm text-muted-foreground mb-2">Total Net Worth</p>

      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
        {formatCurrency(netWorth, 'ILS')}
      </h1>

      {change !== null && (
        <div className={cn(
          "flex items-center justify-center gap-1 mt-3",
          isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        )}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="font-medium">
            {isPositive ? '+' : ''}{formatCurrency(change, 'ILS')}
          </span>
          {changePercent !== null && (
            <span className="text-muted-foreground">
              ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
        {lastUpdated && (
          <span>Updated {formatRelativeTime(lastUpdated)}</span>
        )}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1 hover:bg-muted rounded"
          aria-label="Refresh data"
        >
          <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
        </button>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Large, bold net worth number
- [ ] Change indicator (up/down arrow, amount, percentage)
- [ ] Loading skeleton state
- [ ] Empty state (no accounts)
- [ ] Manual refresh button
- [ ] Responsive (mobile/desktop)
- [ ] Dark mode support

### Day 4-5: Breakdown Component

**Task:** Show assets vs liabilities with drill-down

```typescript
// src/components/dashboard/NetWorthBreakdown.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatters';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface BreakdownProps {
  totalAssets: number;
  totalLiabilities: number;
  assetsByType: Record<string, number>;
  liabilitiesByType: Record<string, number>;
}

export function NetWorthBreakdown({
  totalAssets,
  totalLiabilities,
  assetsByType,
  liabilitiesByType,
}: BreakdownProps) {
  const [expandedSection, setExpandedSection] = useState<'assets' | 'liabilities' | null>(null);

  return (
    <div className="grid md:grid-cols-2 gap-4 mt-8">
      {/* Assets */}
      <Card className="p-4">
        <button
          onClick={() => setExpandedSection(expandedSection === 'assets' ? null : 'assets')}
          className="w-full flex items-center justify-between"
        >
          <div>
            <p className="text-sm text-muted-foreground">Total Assets</p>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(totalAssets, 'ILS')}
            </p>
          </div>
          {expandedSection === 'assets' ? <ChevronDown /> : <ChevronRight />}
        </button>

        {expandedSection === 'assets' && (
          <div className="mt-4 space-y-2 border-t pt-4">
            {Object.entries(assetsByType).map(([type, amount]) => (
              <div key={type} className="flex justify-between text-sm">
                <span className="text-muted-foreground capitalize">{type}</span>
                <span>{formatCurrency(amount, 'ILS')}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Liabilities */}
      <Card className="p-4">
        <button
          onClick={() => setExpandedSection(expandedSection === 'liabilities' ? null : 'liabilities')}
          className="w-full flex items-center justify-between"
        >
          <div>
            <p className="text-sm text-muted-foreground">Total Liabilities</p>
            <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(totalLiabilities, 'ILS')}
            </p>
          </div>
          {expandedSection === 'liabilities' ? <ChevronDown /> : <ChevronRight />}
        </button>

        {expandedSection === 'liabilities' && (
          <div className="mt-4 space-y-2 border-t pt-4">
            {Object.entries(liabilitiesByType).map(([type, amount]) => (
              <div key={type} className="flex justify-between text-sm">
                <span className="text-muted-foreground capitalize">{type}</span>
                <span>{formatCurrency(amount, 'ILS')}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Side-by-side assets/liabilities cards
- [ ] Expandable drill-down
- [ ] Color coding (green for assets, red for liabilities)
- [ ] Account type grouping

---

## Week 2: Bank Connection + Polish

### Day 6-7: Bank Connection CTA

**Task:** Add clear call-to-action to connect Israeli banks

```typescript
// src/components/dashboard/ConnectBankCTA.tsx
'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Building2, Plus } from 'lucide-react';

interface ConnectBankCTAProps {
  accountCount: number;
  onConnect: () => void;
}

export function ConnectBankCTA({ accountCount, onConnect }: ConnectBankCTAProps) {
  if (accountCount === 0) {
    return (
      <Card className="p-8 text-center border-dashed">
        <Building2 className="w-12 h-12 mx-auto text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Connect Your Israeli Bank</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Link your bank accounts to see your total net worth. We support Hapoalim,
          Leumi, Discount, Mizrahi-Tefahot, and more.
        </p>
        <Button onClick={onConnect} className="mt-6">
          Connect Bank Account
        </Button>
      </Card>
    );
  }

  return (
    <Button onClick={onConnect} variant="outline" size="sm">
      <Plus className="w-4 h-4 mr-2" />
      Add Another Account
    </Button>
  );
}
```

**Note:** Uses existing Salt Edge integration via `src/lib/saltedge.ts`.

**Acceptance Criteria:**
- [ ] Empty state with prominent CTA
- [ ] "Add another account" button when accounts exist
- [ ] Triggers existing Salt Edge connection flow

### Day 7-8: Dashboard Page Redesign

**Task:** Restructure dashboard with net worth focus

```typescript
// src/app/dashboard/page.tsx
'use client';

import { useDashboardData } from '@/hooks/use-dashboard-data';
import { NetWorthHero } from '@/components/dashboard/NetWorthHero';
import { NetWorthBreakdown } from '@/components/dashboard/NetWorthBreakdown';
import { ConnectBankCTA } from '@/components/dashboard/ConnectBankCTA';
import { AccountsList } from '@/components/dashboard/AccountsList';
import { ProactiveInsightsCard } from '@/components/dashboard/ProactiveInsightsCard';
import { useState } from 'react';

export default function DashboardPage() {
  const { data, isLoading, error, mutate } = useDashboardData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setIsRefreshing(false);
  };

  const handleConnectBank = () => {
    // Trigger existing Salt Edge connection flow
    window.location.href = '/accounts?connect=true';
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Failed to load financial data</p>
        <Button onClick={handleRefresh} className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* Net Worth Hero - THE MAIN THING */}
      <NetWorthHero
        netWorth={data?.netWorth ?? null}
        previousNetWorth={data?.previousNetWorth ?? null}
        lastUpdated={data?.lastUpdated ?? null}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Breakdown */}
      {data && data.accountCount > 0 && (
        <NetWorthBreakdown
          totalAssets={data.totalAssets}
          totalLiabilities={data.totalLiabilities}
          assetsByType={data.assetsByType}
          liabilitiesByType={data.liabilitiesByType}
        />
      )}

      {/* Connect Bank CTA */}
      <ConnectBankCTA
        accountCount={data?.accountCount ?? 0}
        onConnect={handleConnectBank}
      />

      {/* Connected Accounts */}
      {data && data.accountCount > 0 && (
        <AccountsList accounts={data.accounts} />
      )}

      {/* AI Insights (existing component) */}
      {data && data.accountCount > 0 && (
        <ProactiveInsightsCard />
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Net worth is THE FIRST THING user sees
- [ ] Clear hierarchy: Net Worth > Breakdown > Accounts > Insights
- [ ] Loading and error states
- [ ] Empty state guides user to connect bank

### Day 8-9: Testing

**Task:** Write tests for critical paths

```typescript
// src/lib/__tests__/calculate-net-worth.test.ts
import { calculateNetWorth } from '../calculate-net-worth';

describe('calculateNetWorth', () => {
  it('calculates net worth correctly', () => {
    const accounts = [
      { id: '1', type: 'checking', balance: 10000 },
      { id: '2', type: 'savings', balance: 50000 },
      { id: '3', type: 'credit', balance: -5000 },
    ];

    const result = calculateNetWorth(accounts);

    expect(result.totalNetWorth).toBe(55000);
    expect(result.totalAssets).toBe(60000);
    expect(result.totalLiabilities).toBe(5000);
  });

  it('handles empty accounts', () => {
    const result = calculateNetWorth([]);

    expect(result.totalNetWorth).toBe(0);
    expect(result.accountCount).toBe(0);
  });

  it('handles all liabilities (negative net worth)', () => {
    const accounts = [
      { id: '1', type: 'credit', balance: -10000 },
      { id: '2', type: 'loan', balance: -50000 },
    ];

    const result = calculateNetWorth(accounts);

    expect(result.totalNetWorth).toBe(-60000);
    expect(result.totalAssets).toBe(0);
    expect(result.totalLiabilities).toBe(60000);
  });
});
```

**Acceptance Criteria:**
- [ ] Unit tests for net worth calculation
- [ ] Edge cases: empty, negative, zero
- [ ] API route tests with mocked auth
- [ ] Component tests for loading/error/empty states

### Day 9-10: Polish & Ship

**Tasks:**
- [ ] Dark mode verification
- [ ] Mobile responsive testing
- [ ] Performance check (< 2s load)
- [ ] Error message review
- [ ] Deploy to production
- [ ] Test with 5-10 real Israeli users
- [ ] Collect feedback

---

## Post-MVP Roadmap (Based on User Feedback)

**Only build if users ask for it:**

| Feature | Trigger | Effort |
|---------|---------|--------|
| More Israeli banks | Users request specific bank | 2-4 hours each |
| Manual asset entry | Users want to track car/property | 1 day |
| Crypto tracking | Users ask about Bitcoin | 2 days |
| Hebrew translation | Multiple users request | 3-5 days |
| Spending trends | Users want category breakdown | 2 days (existing feature) |
| AI chat improvements | Users ask financial questions | Ongoing |

---

## Success Criteria

### Week 1 Milestone
- [ ] Net worth displays correctly from connected accounts
- [ ] Dashboard redesigned with net worth focus
- [ ] API returns data in < 200ms

### Week 2 Milestone
- [ ] Bank connection flow works end-to-end
- [ ] Tests passing (>80% coverage for new code)
- [ ] Deployed to production
- [ ] 5+ real users testing

### 30-Day Success Metrics
- [ ] 10+ active users
- [ ] Average session time > 30 seconds
- [ ] Users return at least weekly
- [ ] Collected feedback on what to build next

---

## What This Plan Cuts

| From Original Plan | Status |
|-------------------|--------|
| BullMQ + Redis | ❌ Cut - fetch inline |
| israeli-bank-scrapers | ❌ Cut - use Salt Edge |
| Financial Context Builder | ❌ Cut - simple functions |
| AI Confidence Scoring | ❌ Cut - fake metric |
| Phases 3-5 | ⏸️ Deferred - based on feedback |
| 20 week timeline | ✅ Reduced to 2 weeks |
| 6,000 LOC | ✅ Reduced to ~400 LOC |

---

## References

- Existing Salt Edge integration: `src/lib/saltedge.ts`
- Existing dashboard hook: `src/hooks/use-dashboard-data.ts`
- Existing financial calculator: `src/lib/financial-calculator.ts`
- Existing AI features: `src/lib/ai-categorization.ts`

---

*Simplified plan created 2025-01-06 based on DHH, Kieran, and Simplicity reviewer feedback.*
