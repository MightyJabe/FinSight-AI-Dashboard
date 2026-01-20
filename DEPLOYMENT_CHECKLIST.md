# Production Deployment Checklist

**Date**: January 2026
**Target**: Vercel Production
**Status**: Ready to Deploy

---

## ✅ Pre-Deployment Checks (COMPLETED)

- [x] TypeScript type check passes
- [x] ESLint check passes (no errors or warnings)
- [x] Production build successful (62 pages)
- [x] Firebase project switched to production (`finsight-ai-dashboard-2281a`)
- [x] Firestore security rules deployed
- [x] Firestore composite indexes deployed (3 indexes)
- [x] `.firebaserc` configured with project aliases

---

## 🚀 Deployment Steps

### Step 1: Commit Changes

```bash
git status
git add .
git commit -m "feat: Production deployment with Firebase configuration and indexes"
git push origin main
```

**Verify**: Changes pushed to GitHub

---

### Step 2: Configure Vercel Environment Variables

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

#### Required Variables (Production Only)

**Firebase Client (Public)**:
```
NEXT_PUBLIC_FIREBASE_API_KEY=<from Firebase Console>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=finsight-ai-dashboard-2281a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=finsight-ai-dashboard-2281a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=finsight-ai-dashboard-2281a.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<from Firebase Console>
NEXT_PUBLIC_FIREBASE_APP_ID=<from Firebase Console>
```

**Firebase Admin (Server-side)**:
```
FIREBASE_PROJECT_ID=finsight-ai-dashboard-2281a
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@finsight-ai-dashboard-2281a.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**⚠️ IMPORTANT**: When copying `FIREBASE_PRIVATE_KEY`, preserve the `\n` characters exactly as they appear in the JSON file.

**External Services**:
```
PLAID_CLIENT_ID=<production credentials>
PLAID_SECRET=<production secret>
OPENAI_API_KEY=<your API key>
CRON_SECRET=<generate with: openssl rand -hex 32>
```

**Optional but Recommended**:
```
UPSTASH_REDIS_REST_URL=<if using rate limiting>
UPSTASH_REDIS_REST_TOKEN=<if using rate limiting>
EXCHANGE_RATE_API_KEY=<for real-time FX rates>
```

---

### Step 3: Verify Vercel Configuration

Check `vercel.json`:
- [x] Cron jobs configured (2 jobs)
- [x] Region set to `fra1`
- [x] Cache headers configured
- [x] GitHub auto-deploy enabled

---

### Step 4: Deploy

**Option A**: Auto-deploy via GitHub (Recommended)
- Push to `main` branch triggers automatic deployment
- Monitor deployment in Vercel Dashboard

**Option B**: Manual deploy via CLI
```bash
vercel --prod
```

**Verify**: Check Vercel Dashboard for deployment status

---

### Step 5: Verify Cron Jobs

After deployment, verify cron jobs are active:

1. Go to Vercel Dashboard → Your Project → Cron Jobs
2. Verify both jobs appear:
   - `/api/cron/daily-snapshot` - Daily at midnight UTC
   - `/api/cron/sync-accounts` - Every 6 hours

**Status**: Should show "Active" with next execution time

---

## 📋 Post-Deployment Verification (Within 30 Minutes)

### Quick Smoke Tests

#### 1. Site Accessibility
```bash
# Test homepage
curl https://your-domain.vercel.app/

# Test health endpoint
curl https://your-domain.vercel.app/api/health
```

**Expected**: Both return 200 status

#### 2. Authentication
- [ ] Visit `/login`
- [ ] Sign in with existing account
- [ ] Verify redirect to `/dashboard`
- [ ] Check that user data loads

#### 3. Dashboard
- [ ] Dashboard displays without errors
- [ ] Net worth chart renders (if data exists)
- [ ] No console errors in browser

#### 4. API Endpoints
Test a protected endpoint:
```bash
# This should return 401 Unauthorized (correct behavior)
curl https://your-domain.vercel.app/api/net-worth
```

#### 5. Cron Job Manual Test (Optional)
```bash
# Test daily snapshot cron
curl -X POST https://your-domain.vercel.app/api/cron/daily-snapshot \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected**: Returns JSON with success status

---

## 🧪 Comprehensive Testing (Day 1)

Follow: `docs/production-deployment.md` → Section 6: Post-Deployment Testing

### Critical User Flows (30 minutes)

#### Flow 1: Authentication ✅
- [ ] Sign up with new email (use test email)
- [ ] Verify email redirect works
- [ ] Log out
- [ ] Log back in
- [ ] Password reset flow (initiate only, don't complete)

#### Flow 2: Banking Connections ✅
- [ ] Navigate to `/banking`
- [ ] Click "Connect Account"
- [ ] Plaid Link modal opens
- [ ] Complete or cancel connection
- [ ] Verify accounts list updates

#### Flow 3: Financial Data ✅
- [ ] View dashboard after connecting accounts
- [ ] Verify transactions appear in `/transactions`
- [ ] Check account balances in `/accounts`
- [ ] Verify net worth calculation

#### Flow 4: AI Chat ✅
- [ ] Navigate to `/chat`
- [ ] Send a message: "What's my spending this month?"
- [ ] Verify AI response includes data
- [ ] Check for source citations
- [ ] Verify disclaimer appears

#### Flow 5: Data Export & Settings ✅
- [ ] Navigate to `/settings`
- [ ] Change base currency
- [ ] Export user data (Download JSON)
- [ ] Verify JSON contains expected data

---

## 📊 Monitoring Setup (Day 1)

Follow: `docs/monitoring-guide.md`

### Enable Monitoring Services

#### Vercel Analytics
- [ ] Enable in Vercel Dashboard → Analytics
- [ ] Enable Speed Insights
- [ ] Verify data collection starts

#### Firebase Monitoring
- [ ] Firebase Console → Performance
- [ ] Enable Performance Monitoring
- [ ] Verify first data points appear

#### Uptime Monitoring
- [ ] Set up UptimeRobot account (or similar)
- [ ] Add 4 monitors:
  - Homepage (`/`)
  - Health endpoint (`/api/health`)
  - Dashboard (`/dashboard`)
  - Login (`/login`)
- [ ] Configure alert channels (email, SMS)

#### Error Tracking
- [ ] Check Firebase Error Reporting
- [ ] Review any errors from first hour
- [ ] Set up error rate alerts

---

## 📝 First Week Monitoring Tasks

### Daily (Days 1-7)
- [ ] Check error rate in Firebase Console
- [ ] Review Vercel function logs
- [ ] Verify cron jobs executed successfully
  - Daily snapshot: Check at 00:05 UTC
  - Account sync: Check every 6 hours
- [ ] Monitor uptime alerts
- [ ] Check for user-reported issues

### After 24 Hours
- [ ] Review first day metrics:
  - Page views
  - API response times
  - Error rate
  - Cron success rate
- [ ] Check Firestore read/write operations
- [ ] Verify costs are within expectations
- [ ] Review Firebase quota usage

### After 7 Days
- [ ] Generate weekly analytics report
- [ ] Review feature adoption (which pages are most visited)
- [ ] Check for any recurring errors
- [ ] Analyze cron job success rate
- [ ] Plan any quick fixes needed

---

## 🔧 One-Time Post-Deployment Tasks

### Run Historical Backfill (Important!)

**When**: After first successful deployment and verification

**How**: Run locally with production credentials
```bash
# Ensure .env.local has production credentials
npm run backfill
```

**Expected Output**:
```
🚀 Starting historical snapshot backfill...
📅 Generating monthly snapshots for the past 3 months
👥 Found N users

📊 Processing user: user_id_1
  ✅ Created snapshot for 2025-01-01 (Net Worth: $X)
  ✅ Created snapshot for 2024-12-01 (Net Worth: $X)
  ✅ Created snapshot for 2024-11-01 (Net Worth: $X)
  ✨ Completed: 3 created, 0 skipped

...

✅ Backfill completed successfully!
📈 Final Statistics:
   Total Users: N
   Users Processed: N
   Snapshots Created: 3N
   Errors: 0
```

**Verify**: Check Firestore → `users/{userId}/snapshots` collection has documents

---

## 🚨 Rollback Plan (If Issues Arise)

If critical issues are discovered:

### Immediate Rollback (Vercel)
```bash
# List recent deployments
vercel ls

# Promote previous deployment
vercel promote <previous-deployment-url>
```

### Database Rollback (If Needed)
1. Firebase Console → Firestore → Backups
2. Restore from most recent backup
3. Follow disaster recovery guide in `docs/production-deployment.md`

---

## ✅ Deployment Success Criteria

Mark deployment as successful when:

- [ ] Site is accessible at production URL
- [ ] All 5 critical user flows tested successfully
- [ ] Zero critical errors in first hour
- [ ] Cron jobs execute successfully (verified after 6 hours)
- [ ] Monitoring dashboards show data
- [ ] Uptime > 99% in first 24 hours
- [ ] API response times < 500ms (P95)
- [ ] Historical backfill completed for existing users

---

## 📞 Support Contacts

**Vercel Issues**: https://vercel.com/help
**Firebase Issues**: https://firebase.google.com/support
**Plaid Issues**: https://dashboard.plaid.com/support

---

## 📚 Reference Documents

- **Production Deployment Guide**: `docs/production-deployment.md`
- **Monitoring Guide**: `docs/monitoring-guide.md`
- **Implementation Status**: `docs/implementation-status.md`
- **Architecture**: `CLAUDE.md`

---

**Last Updated**: January 2026
**Next Review**: After first successful deployment
