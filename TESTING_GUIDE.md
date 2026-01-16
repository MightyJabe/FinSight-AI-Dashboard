# Bank Connection Testing Guide

## Overview

The Finsight AI Dashboard supports two bank connection methods:
1. **Plaid** - For US banks (with sandbox mode for testing)
2. **Salt Edge** - For Israeli and European banks

## Prerequisites

### 1. Firebase Setup
Ensure you have Firebase configured:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- Firebase client config in `NEXT_PUBLIC_FIREBASE_*`

### 2. Salt Edge Setup (for Israeli Banks)

To test Israeli bank connections, you need Salt Edge credentials:

1. **Get Salt Edge Test Credentials**:
   - Sign up at [Salt Edge](https://www.saltedge.com/)
   - Create a test application
   - Get your `App ID` and `Secret`

2. **Configure Environment Variables** (`.env.local`):
   ```env
   SALTEDGE_APP_ID="your_test_app_id"
   SALTEDGE_SECRET="your_test_secret"
   SALTEDGE_BASE_URL="https://www.saltedge.com/api/v5"
   ```

### 3. Plaid Setup (for US Banks - Optional)

For Plaid sandbox testing:
```env
PLAID_CLIENT_ID="your_plaid_client_id"
PLAID_SECRET="your_plaid_sandbox_secret"
PLAID_ENV="sandbox"
```

## Testing Flows

### Option 1: Test Israeli Bank Connection (Salt Edge)

**Requirements**: Salt Edge credentials configured

1. Start the dev server and navigate to `/onboarding`

2. Skip to the "Connect accounts" step

3. Click **"Connect with Plaid sandbox"** → redirects to `/accounts`

4. On the accounts page, look for the Salt Edge connect button

5. Click to initiate Salt Edge flow:
   - Redirects to Salt Edge Connect widget
   - Select "Fake Bank" (test provider)
   - Enter test credentials (provided by Salt Edge)
   - Authorize connection

6. After successful connection:
   - Redirected back to `/accounts`
   - Accounts should sync automatically
   - Navigate to `/dashboard` to see your net worth

### Option 2: Test Plaid Connection (US Banks)

**Requirements**: Plaid sandbox credentials configured

1. Follow steps 1-3 from Option 1

2. Use the Plaid Link button

3. In Plaid sandbox:
   - Select any test bank
   - Use credentials: `user_good` / `pass_good`

4. Complete the flow and verify data appears

## Manual Testing Checklist

### Dashboard Page (`/dashboard`)

- [ ] **Net Worth Hero**
  - [ ] Displays correct total net worth
  - [ ] Shows change indicator (or null if no previous data)
  - [ ] "Updated X ago" displays correctly
  - [ ] Refresh button works and shows spinner
  - [ ] Loading skeleton appears on initial load
  - [ ] Empty state shows when no accounts connected

- [ ] **Net Worth Breakdown**
  - [ ] Shows total assets (green)
  - [ ] Shows total liabilities (red)
  - [ ] Expandable drill-down works
  - [ ] Assets grouped by type correctly
  - [ ] Liabilities grouped by type correctly
  - [ ] Only shows when accounts exist

- [ ] **Connect Bank CTA**
  - [ ] Shows full CTA card when no accounts
  - [ ] Shows "Add Another Account" button when accounts exist
  - [ ] Redirects to `/accounts?connect=true`

- [ ] **Accounts List**
  - [ ] Displays up to 4 accounts
  - [ ] Shows correct account type icons
  - [ ] Displays correct balances
  - [ ] "View all" link works

### Accounts Page (`/accounts`)

- [ ] **Bank Connection**
  - [ ] Salt Edge button appears
  - [ ] Plaid button appears (if configured)
  - [ ] Connection flow completes successfully
  - [ ] Accounts sync after connection
  - [ ] Error messages display if connection fails

- [ ] **Account Management**
  - [ ] Connected accounts display
  - [ ] Account balances show correctly
  - [ ] Can disconnect accounts

### API Routes

Test the new net worth endpoint:

```bash
# Get your Firebase ID token from browser DevTools
# Application → Storage → Local Storage → firebaseIdToken

curl http://localhost:3000/api/net-worth \
  -H "Cookie: session=YOUR_SESSION_COOKIE"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "totalNetWorth": 127450.82,
    "totalAssets": 132450.82,
    "totalLiabilities": 5000,
    "assetsByType": {
      "checking": 12500,
      "savings": 25750.82,
      "investment": 89200
    },
    "liabilitiesByType": {
      "credit": 5000
    },
    "accountCount": 3,
    "lastUpdated": "2025-01-06T..."
  }
}
```

## Troubleshooting

### Salt Edge Connection Fails

1. Check environment variables are set:
   ```bash
   echo $SALTEDGE_APP_ID
   echo $SALTEDGE_SECRET
   ```

2. Check server logs for errors:
   ```bash
   npm run dev
   # Look for "Salt Edge" errors in console
   ```

3. Verify Salt Edge credentials in dashboard

### No Data Appears After Connection

1. Check browser console for errors
2. Check network tab for failed API calls
3. Verify Firebase rules allow user data access
4. Check `/api/financial-overview` returns data

### Dashboard Shows Empty State

1. Verify you've connected at least one account
2. Check `/accounts` page shows connected accounts
3. Clear cache and refresh
4. Check if API `/api/financial-overview` returns account data

## Quick Test Script

Save this as `test-connection.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Bank Connection Flow"
echo "================================"

# 1. Check environment
echo "1. Checking environment variables..."
if [ -z "$SALTEDGE_APP_ID" ]; then
  echo "❌ SALTEDGE_APP_ID not set"
else
  echo "✅ SALTEDGE_APP_ID configured"
fi

# 2. Start dev server
echo ""
echo "2. Starting dev server..."
npm run dev &
DEV_PID=$!
sleep 5

# 3. Check health
echo ""
echo "3. Checking API health..."
curl -s http://localhost:3000/api/health | jq .

# 4. Instructions
echo ""
echo "✨ Ready to test!"
echo ""
echo "Manual test steps:"
echo "  1. Open http://localhost:3000/onboarding"
echo "  2. Connect your bank accounts (Salt Edge or Plaid)"
echo "  3. Go to http://localhost:3000/dashboard"
echo "  4. Verify net worth displays from connected accounts"
echo ""
echo "Press Ctrl+C to stop dev server"

# Keep running
wait $DEV_PID
```

## Israeli Bank Specifics

Salt Edge supports these Israeli institutions:
- Bank Hapoalim
- Bank Leumi
- Israel Discount Bank
- Mizrahi Tefahot Bank
- First International Bank
- Union Bank
- Bank Yahav
- Bank Mercantile
- Bank Otsar Hahayal
- Postal Bank

In **test mode**, use:
- Provider: "Fake Bank"
- Username: `username`
- Password: `secret`

## Next Steps

After verifying connections work:

1. **Week 2 Tasks** (from MVP plan):
   - Add unit tests for `calculateNetWorth`
   - Test with 5-10 real Israeli users
   - Collect feedback on connection flow
   - Polish error messages

2. **Future Enhancements**:
   - Add connection health monitoring
   - Implement automatic reconnection for expired credentials
   - Add support for more Israeli credit cards
   - Consider `israeli-bank-scrapers` as alternative (free)
