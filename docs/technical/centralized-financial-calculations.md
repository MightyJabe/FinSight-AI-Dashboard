# Financial Calculation Centralization

## Overview

All financial calculations across the application now use the centralized `financial-calculator.ts` module to ensure consistency and accuracy.

## Single Source of Truth

### Core Module: `src/lib/financial-calculator.ts`

This module is the **ONLY** place where financial metrics are calculated:

- **Total Assets** = Manual Assets + Plaid Accounts + Crypto Accounts
- **Total Liabilities** = Manual Liabilities + Credit Accounts
- **Net Worth** = Total Assets - Total Liabilities
- **Liquid Assets** = Cash + Checking + Savings accounts
- **Monthly Income** = Sum of income transactions (last 30 days)
- **Monthly Expenses** = Sum of expense transactions (last 30 days)
- **Monthly Cash Flow** = Monthly Income - Monthly Expenses
- **Investments** = Investment Accounts + Crypto + Manual Investment Assets

### Data Sources Included

1. **Plaid Accounts** - Bank accounts, credit cards, investments, loans
2. **Manual Assets** - User-entered assets (real estate, vehicles, etc.)
3. **Manual Liabilities** - User-entered debts
4. **Crypto Accounts** - Exchange connections and wallet addresses
5. **Transactions** - Income and expense tracking

## API Endpoints Using Centralized Calculator

### Primary Endpoint

- **`/api/financial-overview`** - Main endpoint for all financial data
  - Returns comprehensive financial metrics
  - Includes all account types
  - Validates accuracy before returning

### Legacy Endpoints (Updated)

- **`/api/overview`** - Legacy endpoint, now uses centralized calculator
- **`/api/accounts`** - Now uses centralized calculator
- **`/api/liabilities`** - Now uses centralized calculator
- **`/api/insights`** - Uses centralized calculator for AI analysis

## Frontend Integration

### Hooks

- **`useDashboardData`** - Fetches from `/api/financial-overview`
  - Transforms data for dashboard components
  - Caches with SWR for performance
  - Single source for all dashboard metrics

### Components

All components should use `useDashboardData` hook instead of making direct API calls or calculating metrics themselves.

## Benefits

### Consistency

- All pages show the same values for net worth, assets, liabilities
- No discrepancies between dashboard, insights, and other pages
- Single calculation logic eliminates bugs

### Performance

- Data fetched once and cached
- No redundant API calls
- Efficient parallel data fetching

### Maintainability

- Changes to calculation logic in one place
- Easy to add new data sources (e.g., crypto)
- Centralized validation and accuracy checks

### Accuracy

- All calculations validated by `financial-validator.ts`
- Enforces financial accuracy rules
- Prevents floating-point errors

## Migration Guide

### Before (❌ Don't Do This)

```typescript
// Component calculating its own metrics
const totalAssets =
  manualAssets.reduce((sum, a) => sum + a.amount, 0) +
  plaidAccounts.reduce((sum, a) => sum + a.balance, 0);
const netWorth = totalAssets - totalLiabilities;
```

### After (✅ Do This)

```typescript
// Use centralized hook
const { overview } = useDashboardData();
const totalAssets = overview?.totalAssets || 0;
const netWorth = overview?.netWorth || 0;
```

## Adding New Data Sources

To add a new data source (e.g., real estate API):

1. **Update `fetchFinancialData` in `financial-calculator.ts`**

   ```typescript
   const realEstateSnapshot = await db.collection(`users/${userId}/realEstate`).get();
   const realEstateAssets = realEstateSnapshot.docs.map(...);
   ```

2. **Update `calculateFinancialMetrics`**

   ```typescript
   const realEstateTotal = data.realEstateAssets.reduce((sum, a) => sum + a.value, 0);
   const totalAssets = manualAssetTotal + plaidAssetTotal + cryptoAssetTotal + realEstateTotal;
   ```

3. **All endpoints and components automatically get the new data**

## Testing

When testing financial calculations:

1. **Test the calculator directly**

   ```typescript
   const { metrics } = await getFinancialOverview(userId);
   expect(metrics.netWorth).toBe(expectedValue);
   ```

2. **Mock the calculator in component tests**
   ```typescript
   jest.mock('@/lib/financial-calculator', () => ({
     getFinancialOverview: jest.fn().mockResolvedValue({
       metrics: { netWorth: 10000, ... }
     })
   }));
   ```

## Validation

All calculations are validated by `financial-validator.ts`:

- Ensures no NaN or Infinity values
- Validates that assets >= 0
- Validates that liabilities >= 0
- Logs warnings for suspicious values
- Normalizes floating-point precision

## Performance Considerations

### Caching

- API responses cached for 30 seconds
- SWR caching on frontend
- Prevents excessive database queries

### Optimization

- Parallel data fetching with Promise.all
- Minimal data transformation
- Efficient Firestore queries

## Future Enhancements

1. **Historical Tracking** - Store calculated metrics for trend analysis
2. **Real-time Updates** - WebSocket for live balance updates
3. **Multi-currency** - Support for international accounts
4. **Tax Integration** - Calculate tax implications
5. **Blockchain Integration** - Real-time crypto balances

## Troubleshooting

### Different values on different pages?

- Check if page is using `useDashboardData` hook
- Verify API endpoint uses `getFinancialOverview`
- Clear SWR cache: `mutate('/api/financial-overview')`

### Calculations seem wrong?

- Check `financial-validator.ts` logs
- Verify data sources are being fetched
- Check for Plaid token expiration

### Performance issues?

- Check cache TTL settings
- Verify SWR deduplication is working
- Monitor Firestore query performance

## Related Files

- `src/lib/financial-calculator.ts` - Core calculation logic
- `src/lib/financial-validator.ts` - Validation and accuracy checks
- `src/hooks/use-dashboard-data.ts` - Frontend data hook
- `src/app/api/financial-overview/route.ts` - Primary API endpoint
- `src/app/api/insights/route.ts` - AI insights using calculator
