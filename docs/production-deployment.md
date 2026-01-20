# Production Deployment Guide

This guide covers deploying FinSight AI Dashboard to production on Vercel with Firebase.

## Prerequisites

- Vercel account with Pro plan (required for cron jobs)
- Firebase project (production instance)
- Plaid production credentials
- OpenAI API key with sufficient credits

## 1. Environment Variables

### Required Variables

Set these in Vercel Project Settings → Environment Variables:

#### Firebase Client (Public)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-prod-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-prod-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-prod-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Firebase Admin (Server-side)
```bash
FIREBASE_PROJECT_ID=your-prod-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-prod-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Note**: Copy the private key exactly as shown in the Firebase service account JSON, preserving `\n` characters.

#### External Services
```bash
PLAID_CLIENT_ID=your_plaid_production_client_id
PLAID_SECRET=your_plaid_production_secret
OPENAI_API_KEY=sk-prod-...
```

#### Cron Jobs
```bash
# Generate with: openssl rand -hex 32
CRON_SECRET=your_secure_random_cron_secret
```

### Optional Variables

#### Rate Limiting (Recommended)
```bash
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

#### Currency Exchange Rates
```bash
EXCHANGE_RATE_API_KEY=your_exchangerate_api_key
```

## 2. Firebase Configuration

### Firestore Security Rules

Ensure production security rules are deployed:

```bash
firebase use production
firebase deploy --only firestore:rules
```

Verify rules in Firebase Console → Firestore Database → Rules:
- Users can only access their own data
- All writes are authenticated
- Sensitive collections are protected

### Firebase Authentication

1. Enable Email/Password authentication
2. Configure authorized domains (add Vercel domain)
3. Set up email templates for password reset
4. Configure session duration (default: 1 hour)

### Firestore Indexes

Create required composite indexes:

```bash
firebase deploy --only firestore:indexes
```

Required indexes:
- `users/{userId}/transactions`: `(date DESC, category)`
- `users/{userId}/accounts`: `(lastSyncAt ASC)`
- `users/{userId}/snapshots`: `(date DESC)`

## 3. Vercel Configuration

### Project Setup

1. Import project from GitHub
2. Framework Preset: **Next.js**
3. Root Directory: `./`
4. Build Command: `npm run build`
5. Output Directory: `.next`

### Regions

Set in `vercel.json`:
```json
{
  "regions": ["fra1"]
}
```

Choose region closest to your Firebase project region for optimal latency.

### Cron Jobs

Configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-snapshot",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/sync-accounts",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Important**: Cron jobs require Vercel Pro plan.

#### Verify Cron Jobs

After deployment, verify cron jobs are active:

1. Go to Vercel Dashboard → Your Project → Cron Jobs
2. Check that both cron jobs appear with their schedules
3. View recent executions and logs

#### Test Cron Jobs Manually

```bash
# Test daily snapshot cron
curl -X POST https://your-domain.vercel.app/api/cron/daily-snapshot \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test account sync cron
curl -X POST https://your-domain.vercel.app/api/cron/sync-accounts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "processed": 10,
  "succeeded": 10,
  "failed": 0,
  "durationMs": 5432
}
```

## 4. Plaid Configuration

### Switch to Production Environment

1. Request production access from Plaid
2. Complete Plaid compliance review
3. Update environment variables with production credentials
4. Test Plaid Link in production

### Webhook Configuration

Set Plaid webhook URL in Plaid Dashboard:
```
https://your-domain.vercel.app/api/webhooks/plaid
```

Supported webhook types:
- `TRANSACTIONS`
- `ITEM`
- `HOLDINGS`

## 5. Security Checklist

### Environment Variables
- [ ] All secrets stored in Vercel (not in code)
- [ ] No `.env` files committed to repository
- [ ] CRON_SECRET is strong (32+ characters)
- [ ] Firebase private key properly escaped with `\n`

### Firebase Security
- [ ] Firestore security rules deployed
- [ ] Authentication enabled with proper settings
- [ ] Service account has minimal permissions
- [ ] Authorized domains configured

### API Security
- [ ] Rate limiting enabled (Redis configured)
- [ ] CORS configured properly
- [ ] Input validation with Zod on all endpoints
- [ ] Authentication required on protected routes

### Data Protection
- [ ] Sensitive data encrypted at rest (Plaid tokens)
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Audit logging enabled for sensitive operations

## 6. Post-Deployment Testing

### Critical User Flows

1. **Authentication**
   - [ ] Sign up with email/password
   - [ ] Login with email/password
   - [ ] Password reset flow
   - [ ] Logout

2. **Banking Connections**
   - [ ] Connect Plaid account
   - [ ] Sync transactions
   - [ ] View account balances
   - [ ] Disconnect account

3. **Financial Data**
   - [ ] View dashboard with net worth
   - [ ] View transactions list
   - [ ] Add manual asset
   - [ ] Add manual liability
   - [ ] View snapshots history

4. **AI Chat**
   - [ ] Send message to AI
   - [ ] Receive response with financial data
   - [ ] View source citations
   - [ ] See disclaimer

5. **Data Export & Deletion**
   - [ ] Export user data (GDPR compliance)
   - [ ] Delete account (test with dummy account)

### Performance Testing

Run Lighthouse audit:
- [ ] Performance score > 90
- [ ] Accessibility score > 95
- [ ] Best Practices score > 95
- [ ] SEO score > 95

Verify Core Web Vitals:
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

### Cron Job Verification

Wait 24 hours after deployment, then verify:

1. **Daily Snapshot Cron** (runs at midnight UTC)
   - [ ] Check Vercel cron logs for execution
   - [ ] Verify new snapshots created in Firestore
   - [ ] Check for any errors in logs

2. **Account Sync Cron** (runs every 6 hours)
   - [ ] Check Vercel cron logs for execution
   - [ ] Verify stale accounts are synced
   - [ ] Check for any sync errors

Access logs via:
```bash
vercel logs --follow your-project-name
```

## 7. Monitoring Setup

### Vercel Analytics

Enable in Vercel Dashboard:
- [ ] Web Analytics (track page views)
- [ ] Speed Insights (monitor Core Web Vitals)
- [ ] Logs (real-time error tracking)

### Firebase Monitoring

Enable in Firebase Console:
- [ ] Performance Monitoring
- [ ] Crashlytics
- [ ] App Check (bot protection)

### Error Tracking

Monitor errors via:
1. Vercel Function Logs
2. Firebase Error Reporting
3. Application logs in Firestore `audit_logs` collection

Set up alerts for:
- [ ] 500 errors on critical endpoints
- [ ] Failed cron job executions
- [ ] High error rates (>5%)
- [ ] Slow API response times (>2s)

### Uptime Monitoring

Use services like:
- UptimeRobot (free tier available)
- Pingdom
- StatusCake

Monitor endpoints:
- `https://your-domain.vercel.app/api/health`
- `https://your-domain.vercel.app/`

## 8. Scaling Considerations

### Database

- [ ] Monitor Firestore read/write quotas
- [ ] Set up billing alerts
- [ ] Consider composite indexes for common queries
- [ ] Implement pagination for large collections

### API Rate Limits

Current limits (with Redis):
- 100 requests per minute per IP
- 1000 requests per hour per IP

Adjust in `src/middleware/rate-limit.ts` if needed.

### Function Timeouts

Vercel function timeout: 10s (Pro plan: 60s)

Long-running operations:
- Daily snapshot cron: ~5-10s per user
- Account sync cron: ~3-5s per account

If users exceed 100, consider:
- Batch processing with queue
- Separate worker functions
- Firebase Cloud Functions for heavy tasks

## 9. Backup Strategy

### Firestore Backups

Enable automated backups in Firebase Console:
1. Go to Firestore → Backups
2. Schedule daily backups
3. Retention: 30 days

### Manual Backup

Export specific collections:
```bash
gcloud firestore export gs://your-backup-bucket/$(date +%Y-%m-%d) \
  --collection-ids=users,transactions,accounts
```

### Disaster Recovery

Test restore procedure:
1. Create test Firebase project
2. Import backup data
3. Verify data integrity
4. Test application functionality

## 10. Rollback Procedure

If deployment causes issues:

### Immediate Rollback (Vercel)

```bash
# List deployments
vercel ls

# Promote previous deployment to production
vercel promote <deployment-url>
```

### Database Rollback (Firebase)

```bash
# Restore from backup
gcloud firestore import gs://your-backup-bucket/2024-01-20
```

### Code Rollback (Git)

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or rollback to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

## 11. Post-Launch Checklist

### Week 1
- [ ] Monitor error rates daily
- [ ] Check cron job execution logs
- [ ] Review API response times
- [ ] Verify user signups work
- [ ] Test all critical flows manually

### Week 2
- [ ] Review Firebase quota usage
- [ ] Check Plaid API usage and costs
- [ ] Monitor OpenAI token consumption
- [ ] Analyze user behavior with analytics
- [ ] Address any reported bugs

### Monthly
- [ ] Review and rotate secrets
- [ ] Check for security updates
- [ ] Review and optimize database indexes
- [ ] Analyze performance metrics
- [ ] Update dependencies

## 12. Support & Troubleshooting

### Common Issues

**Cron jobs not executing:**
- Verify Pro plan is active
- Check CRON_SECRET is set correctly
- Review function logs for errors
- Ensure functions complete within timeout

**Firebase connection errors:**
- Verify all Firebase env variables are set
- Check private key has proper `\n` escaping
- Confirm service account has required permissions

**Plaid connection failures:**
- Verify production credentials are set
- Check Plaid webhook is configured
- Review Plaid Dashboard for item errors

**High latency:**
- Check Firebase region matches Vercel region
- Review database query performance
- Enable Redis caching
- Optimize database indexes

### Getting Help

- **Vercel Support**: https://vercel.com/help
- **Firebase Support**: https://firebase.google.com/support
- **Plaid Support**: https://dashboard.plaid.com/support

### Internal Escalation

For critical issues:
1. Check Vercel function logs
2. Review Firebase error logs
3. Check audit logs in Firestore
4. Contact on-call engineer

## 13. Maintenance Windows

Schedule maintenance during low-traffic periods:
- Database migrations: Sunday 2-4 AM UTC
- Dependency updates: Monthly, during off-peak hours
- Security patches: As needed, with immediate deployment

Notify users 24 hours before scheduled maintenance via:
- In-app banner
- Email notification
- Status page

---

## Quick Reference

### Useful Commands

```bash
# Deploy to production
vercel --prod

# View logs
vercel logs --follow

# List deployments
vercel ls

# Run backfill script
npm run backfill

# Type check
npm run type-check

# Run tests
npm run test

# Build locally
npm run build
```

### Important URLs

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Firebase Console**: https://console.firebase.google.com
- **Plaid Dashboard**: https://dashboard.plaid.com
- **OpenAI Usage**: https://platform.openai.com/usage

---

**Last Updated**: January 2026
**Version**: 1.0.0
