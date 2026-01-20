# Monitoring & Feedback Guide - Phase 6

This guide covers monitoring, alerting, and feedback collection for the FinSight AI Financial OS.

**Phase**: 6 (Learn & Iterate)
**Status**: Ready for Implementation
**Last Updated**: January 2026

---

## Table of Contents

1. [Monitoring Setup](#monitoring-setup)
2. [Key Metrics to Track](#key-metrics-to-track)
3. [Alert Configuration](#alert-configuration)
4. [Feedback Collection](#feedback-collection)
5. [Performance Dashboards](#performance-dashboards)
6. [Incident Response](#incident-response)

---

## Monitoring Setup

### 1. Vercel Analytics

**Enable in Vercel Dashboard**:
1. Go to your project → Analytics tab
2. Enable Web Analytics
3. Enable Speed Insights

**Metrics Tracked**:
- Page views and unique visitors
- Core Web Vitals (LCP, FID, CLS)
- Top pages by traffic
- Geographic distribution
- Device breakdown

**Access**: https://vercel.com/dashboard → Your Project → Analytics

### 2. Firebase Monitoring

**Enable in Firebase Console**:
1. Navigate to Firebase Console → Your Project
2. Enable Performance Monitoring
3. Enable Crashlytics (if using Firebase SDK)
4. Enable App Check (optional - bot protection)

**Metrics Tracked**:
- API response times
- Database read/write operations
- Authentication success/failure rates
- Function execution times
- Error rates by endpoint

**Access**: https://console.firebase.google.com/ → Your Project → Performance / Crashlytics

### 3. Uptime Monitoring

**Recommended Services**:
- **UptimeRobot** (free tier: 50 monitors, 5-min checks)
- **Pingdom** (paid, more features)
- **StatusCake** (free tier available)

**Endpoints to Monitor**:
```
https://your-domain.vercel.app/
https://your-domain.vercel.app/api/health
https://your-domain.vercel.app/dashboard
https://your-domain.vercel.app/login
```

**Alert Channels**: Email, SMS, Slack, Discord

### 4. Error Tracking

Firebase automatically logs errors. For more detailed tracking:

**Option A: Sentry (Recommended)**
```bash
npm install @sentry/nextjs
```

Configure in `sentry.client.config.js`:
```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.VERCEL_ENV || 'development',
});
```

**Option B: Firebase Error Reporting**
Already integrated via Firebase SDK.

---

## Key Metrics to Track

### User Engagement

| Metric | Target | How to Track |
|--------|--------|--------------|
| Daily Active Users | Baseline | Vercel Analytics |
| Weekly Active Users | Baseline | Vercel Analytics |
| Session Duration | >5 min | Vercel Analytics |
| Pages per Session | >3 | Vercel Analytics |
| Bounce Rate | <40% | Vercel Analytics |

### Feature Adoption

| Feature | Metric | Target | Location |
|---------|--------|--------|----------|
| Net Worth History | Views of `/dashboard` | Baseline | Vercel Analytics |
| AI Chat | Messages sent | Baseline | Firestore `conversations` count |
| Banking Connections | Plaid links created | Baseline | Firestore `banking_connections` |
| Data Export | Export requests | Track usage | API logs |
| Subscriptions | View `/subscriptions` | Baseline | Vercel Analytics |

### Performance Metrics

| Metric | Target | Tool |
|--------|--------|------|
| Largest Contentful Paint (LCP) | <2.5s | Vercel Speed Insights |
| First Input Delay (FID) | <100ms | Vercel Speed Insights |
| Cumulative Layout Shift (CLS) | <0.1 | Vercel Speed Insights |
| API Response Time (P95) | <200ms | Firebase Performance |
| Database Read Time (P95) | <100ms | Firebase Performance |

### Reliability Metrics

| Metric | Target | Tool |
|--------|--------|------|
| Uptime | >99.5% | UptimeRobot |
| Error Rate | <1% | Firebase Error Reporting |
| Cron Success Rate | >95% | Vercel Function Logs |
| Failed Logins | <5% | Firebase Auth logs |

### Financial Metrics (Optional)

| Metric | Tracking Method |
|--------|----------------|
| Plaid API Costs | Plaid Dashboard |
| OpenAI Token Usage | OpenAI Usage Dashboard |
| Firebase Costs | Firebase Billing |
| Vercel Costs | Vercel Billing |

---

## Alert Configuration

### Critical Alerts (Page Immediately)

1. **Site Down**
   - Threshold: 2 consecutive failed checks
   - Tool: UptimeRobot
   - Channel: SMS + Email
   - Response: Check Vercel status, review recent deployments

2. **Error Rate Spike**
   - Threshold: >5% error rate for 5 minutes
   - Tool: Firebase / Sentry
   - Channel: Email + Slack
   - Response: Check function logs, review recent changes

3. **Cron Job Failures**
   - Threshold: 2 consecutive failures
   - Tool: Vercel Function Logs (custom monitoring)
   - Channel: Email
   - Response: Check cron logs, verify CRON_SECRET

### Warning Alerts (Review Daily)

1. **Slow API Response**
   - Threshold: P95 >500ms for 10 minutes
   - Tool: Firebase Performance
   - Channel: Email
   - Response: Review slow queries, check database indexes

2. **High Database Usage**
   - Threshold: >80% of Firestore quota
   - Tool: Firebase Console → Usage
   - Channel: Email
   - Response: Review query efficiency, consider pagination

3. **Failed Syncs**
   - Threshold: >20% sync failure rate
   - Tool: Custom query on `accounts` collection
   - Channel: Email
   - Response: Check Plaid status, review sync errors

### Info Alerts (Review Weekly)

1. **New User Signups**
   - Threshold: Weekly summary
   - Tool: Firebase Auth
   - Channel: Email digest

2. **Feature Usage Trends**
   - Threshold: Weekly summary
   - Tool: Custom analytics query
   - Channel: Email digest

---

## Feedback Collection

### In-App Feedback Form

**Implementation**:

Create `src/components/feedback/FeedbackModal.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useSession } from '@/components/providers/SessionProvider';
import { Button, Modal } from '@/components/ui';

export default function FeedbackModal() {
  const { firebaseUser } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [type, setType] = useState<'bug' | 'feature' | 'general'>('general');
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = async () => {
    if (!firebaseUser || !feedback.trim()) return;

    setSubmitting(true);
    try {
      const token = await firebaseUser.getIdToken();
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          message: feedback,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });

      setFeedback('');
      setIsOpen(false);
      alert('Thank you for your feedback!');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-primary text-white px-4 py-2 rounded-lg shadow-lg hover:bg-primary-dark"
      >
        💬 Feedback
      </button>

      {isOpen && (
        <Modal onClose={() => setIsOpen(false)}>
          <h2 className="text-xl font-bold mb-4">Send Feedback</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="general">General Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full border rounded px-3 py-2 h-32"
              placeholder="Tell us what you think..."
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={submitFeedback} disabled={submitting || !feedback.trim()}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
```

**API Endpoint**: `src/app/api/feedback/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateAuthToken } from '@/lib/auth-server';
import { adminDb } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general']),
  message: z.string().min(1).max(2000),
  url: z.string().optional(),
  userAgent: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAuthToken(req);
    if (authResult.error) return authResult.error;
    const userId = authResult.userId;

    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    // Store feedback in Firestore
    await adminDb.collection('feedback').add({
      userId,
      ...parsed.data,
      createdAt: new Date(),
      status: 'new',
    });

    logger.info('Feedback received', { userId, type: parsed.data.type });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to save feedback', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}
```

### NPS Survey (Optional)

**Implementation**: Use a service like:
- **Delighted** (free tier available)
- **Hotjar** (free tier available)
- **Typeform** (paid)

**Schedule**: Quarterly NPS survey sent to active users

**Key Questions**:
1. How likely are you to recommend FinSight AI? (0-10 scale)
2. What's the most valuable feature?
3. What's missing or needs improvement?

---

## Performance Dashboards

### Vercel Dashboard

**URL**: https://vercel.com/dashboard → Your Project

**Key Sections**:
- **Deployments**: Recent deployments, build times
- **Analytics**: Traffic, page views, top pages
- **Speed Insights**: Core Web Vitals by page
- **Functions**: Serverless function execution logs
- **Cron Jobs**: Scheduled job execution history

### Firebase Dashboard

**URL**: https://console.firebase.google.com/ → Your Project

**Key Sections**:
- **Authentication**: User signups, login stats
- **Firestore**: Document counts, read/write operations
- **Performance**: API response times, network requests
- **Error Reporting**: Recent errors with stack traces

### Custom Analytics Query

Create `scripts/analytics-report.ts`:

```typescript
import { adminDb } from '../src/lib/firebase-admin';

async function generateWeeklyReport() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Count new users
  const usersSnapshot = await adminDb
    .collection('users')
    .where('createdAt', '>=', oneWeekAgo)
    .get();

  // Count AI conversations
  const conversationsSnapshot = await adminDb
    .collectionGroup('conversations')
    .where('createdAt', '>=', oneWeekAgo)
    .get();

  // Count new banking connections
  const connectionsSnapshot = await adminDb
    .collectionGroup('banking_connections')
    .where('createdAt', '>=', oneWeekAgo)
    .get();

  console.log('📊 Weekly Analytics Report');
  console.log('==========================');
  console.log(`New Users: ${usersSnapshot.size}`);
  console.log(`AI Conversations: ${conversationsSnapshot.size}`);
  console.log(`Banking Connections: ${connectionsSnapshot.size}`);
}

generateWeeklyReport();
```

Run weekly: `ts-node scripts/analytics-report.ts`

---

## Incident Response

### Incident Severity Levels

| Level | Response Time | Examples |
|-------|--------------|----------|
| **P0 - Critical** | <15 minutes | Site down, data breach, payment failures |
| **P1 - High** | <1 hour | Cron failures, slow API, auth issues |
| **P2 - Medium** | <4 hours | UI bugs, feature not working, sync errors |
| **P3 - Low** | <24 hours | Minor UI issues, feature requests |

### Response Workflow

**1. Acknowledge**
- Respond to alert immediately
- Post status update if user-facing
- Create incident ticket

**2. Investigate**
- Check Vercel function logs
- Review Firebase error logs
- Check recent deployments
- Review Firestore audit logs

**3. Mitigate**
- Apply temporary fix if possible
- Rollback deployment if needed
- Scale resources if capacity issue

**4. Resolve**
- Deploy permanent fix
- Verify resolution in production
- Update monitoring if needed

**5. Post-Mortem**
- Document incident timeline
- Identify root cause
- Create prevention tasks
- Share learnings with team

### Common Incidents & Solutions

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| Site unreachable | Vercel outage | Check https://vercel-status.com |
| Slow API responses | Database query inefficiency | Add Firestore index, optimize query |
| Cron job failures | CRON_SECRET mismatch | Verify environment variable |
| Auth errors | Firebase config issue | Check Firebase credentials |
| High costs | API abuse or runaway job | Review logs, implement rate limiting |

---

## Review Cadence

### Daily (First 2 Weeks)
- [ ] Check error rate in Firebase
- [ ] Review Vercel function logs
- [ ] Verify cron jobs executed successfully
- [ ] Monitor uptime alerts

### Weekly (Ongoing)
- [ ] Review performance metrics
- [ ] Analyze user feedback
- [ ] Check cost trends
- [ ] Review top errors by frequency

### Monthly (Ongoing)
- [ ] Analyze user engagement trends
- [ ] Review feature adoption rates
- [ ] Plan improvements based on feedback
- [ ] Update monitoring thresholds

---

## Data-Driven Decisions

### Questions to Answer

**Week 1-2** (Stability):
- Is the app stable in production?
- Are cron jobs executing reliably?
- Are there any critical errors?
- Is performance within targets?

**Week 3-4** (Usage):
- Which features are users engaging with most?
- What's the average session duration?
- Are users connecting banking accounts?
- How often are users checking net worth history?

**Month 2** (Value):
- What features drive return visits?
- Where do users get stuck or drop off?
- What feedback is most common?
- Which features should we improve first?

**Month 3+** (Growth):
- What's our user retention rate?
- What drives user referrals?
- What features should we build next?
- Should we pivot any existing features?

---

## Tools Summary

| Purpose | Tool | Cost | Setup |
|---------|------|------|-------|
| Web Analytics | Vercel Analytics | Free (included) | Auto-enabled |
| Performance | Firebase Performance | Free tier | Enable in console |
| Uptime Monitoring | UptimeRobot | Free tier | Manual setup |
| Error Tracking | Firebase / Sentry | Free tier | Firebase auto, Sentry manual |
| User Feedback | Custom form | Free | Implement component |
| NPS Surveys | Delighted | Free tier | Sign up + integrate |

---

## Next Steps (Phase 6)

1. **Week 8**: Deploy to production and enable all monitoring
2. **Week 9**: Implement feedback form component
3. **Week 10**: Review first 2 weeks of metrics
4. **Week 11-12**: Analyze feedback and plan v2 features

---

**Last Updated**: January 2026
**Document Version**: 1.0.0
**Related**: production-deployment.md, implementation-status.md
