# Testing Environment Setup Guide

Complete guide to setting up the test Firebase project and configuring CI/CD.

## Step 1: Create Test Firebase Project

### 1.1 Create New Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Name it: `finsight-ai-test` (or your preferred name)
4. **Disable Google Analytics** (not needed for testing)
5. Click **Create project**

### 1.2 Register Web App
1. In your new Firebase project, click the **Web icon** (</>) to add a web app
2. App nickname: `FinSight Test Web`
3. **Do NOT** check "Set up Firebase Hosting"
4. Click **Register app**
5. **Copy the Firebase config object** - you'll need this!

```javascript
// It looks like this:
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "finsight-ai-test.firebaseapp.com",
  projectId: "finsight-ai-test",
  storageBucket: "finsight-ai-test.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 1.3 Enable Authentication
1. In Firebase Console, go to **Authentication** → **Get started**
2. Click **Sign-in method** tab
3. Enable **Email/Password** provider
4. Click **Save**

### 1.4 Create Test User
1. Go to **Authentication** → **Users** tab
2. Click **Add user**
3. Email: `test@finsight-test.com` (or your choice)
4. Password: Create a strong password (save it securely!)
5. Click **Add user**

**Important**: Save these credentials - you'll need them for E2E tests!

### 1.5 Enable Firestore Database
1. Go to **Firestore Database** → **Create database**
2. Select **Start in test mode** (we'll secure it later)
3. Choose a location (e.g., `us-central1`)
4. Click **Enable**

### 1.6 Set Up Security Rules (Important!)
Replace the default rules with test-friendly rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Test environment - allow authenticated users to read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Allow test user to access test data
    match /test_data/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 2: Configure Local Environment

### 2.1 Create .env.test
Create/update `.env.test` with your Firebase test project config:

```bash
# Firebase Test Project (from Step 1.2)
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="finsight-ai-test.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="finsight-ai-test"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="finsight-ai-test.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abc123"

# Test User Credentials (from Step 1.4)
E2E_TEST_EMAIL="test@finsight-test.com"
E2E_TEST_PASSWORD="your-strong-password"

# Optional: Firebase Admin SDK (for API tests)
FIREBASE_ADMIN_PROJECT_ID="finsight-ai-test"
# Note: Admin SDK credentials usually come from a service account JSON
# For tests, we're using mocks so this is optional
```

### 2.2 Test Local Setup
Run unit tests to verify configuration:

```bash
# Should pass - uses mocks, doesn't need real Firebase
npm run test

# Test coverage
npm run test:coverage
```

## Step 3: Configure GitHub Secrets

### 3.1 Add Firebase Secrets
Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets (from your `.env.test`):

```
Name: NEXT_PUBLIC_FIREBASE_API_KEY_TEST
Value: AIza... (from your Firebase config)

Name: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_TEST
Value: finsight-ai-test.firebaseapp.com

Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID_TEST
Value: finsight-ai-test

Name: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_TEST
Value: finsight-ai-test.appspot.com

Name: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_TEST
Value: 123456789

Name: NEXT_PUBLIC_FIREBASE_APP_ID_TEST
Value: 1:123456789:web:abc123
```

### 3.2 Add E2E Test Credentials

```
Name: E2E_TEST_EMAIL
Value: test@finsight-test.com

Name: E2E_TEST_PASSWORD
Value: your-strong-password
```

### 3.3 Screenshot Guide
Your GitHub secrets page should look like this:

```
Repository secrets (9 secrets)
├── CODECOV_TOKEN                                (Optional - for coverage)
├── E2E_TEST_EMAIL                               ✓ Required
├── E2E_TEST_PASSWORD                            ✓ Required
├── NEXT_PUBLIC_FIREBASE_API_KEY_TEST            ✓ Required
├── NEXT_PUBLIC_FIREBASE_APP_ID_TEST             ✓ Required
├── NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_TEST        ✓ Required
├── NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_TEST ✓ Required
├── NEXT_PUBLIC_FIREBASE_PROJECT_ID_TEST         ✓ Required
└── NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_TEST     ✓ Required
```

## Step 4: Set Up Codecov (Optional)

### 4.1 Create Codecov Account
1. Go to [codecov.io](https://codecov.io)
2. Click **Sign up with GitHub**
3. Authorize Codecov

### 4.2 Add Repository
1. In Codecov dashboard, click **Add repository**
2. Find `finsight-ai-dashboard`
3. Click **Setup repo**
4. Copy the **Upload Token**

### 4.3 Add Codecov Secret to GitHub
```
Name: CODECOV_TOKEN
Value: (paste token from Codecov)
```

**Note**: The CI will continue to work even without Codecov token - it just won't upload coverage reports.

## Step 5: Test E2E Locally

### 5.1 Start Development Server
```bash
npm run dev
```

Wait for the server to start at http://localhost:3000

### 5.2 Run E2E Tests
In a new terminal:

```bash
# Run all E2E tests
npx playwright test

# Run with UI (recommended for first time)
npx playwright test --ui

# Run specific test file
npx playwright test auth.spec.ts

# Debug mode
npx playwright test --debug
```

### 5.3 Expected Results
On first run, some tests may fail. Common issues:

**Issue**: `Timeout waiting for /dashboard`
**Fix**: Test user may not have proper permissions. Check Firestore security rules.

**Issue**: `Invalid credentials`
**Fix**: Double-check `E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD` in `.env.test`

**Issue**: `Network error`
**Fix**: Ensure Firebase Auth is enabled and test user exists.

### 5.4 View Test Report
```bash
npx playwright show-report
```

## Step 6: Verify CI/CD Pipeline

### 6.1 Push to GitHub
```bash
git push origin feat/testing-infrastructure
```

### 6.2 Watch Actions
1. Go to GitHub repo → **Actions** tab
2. Click on the workflow run
3. Watch each job execute

### 6.3 Expected Results

**✅ Lint & Type Check** - Should pass immediately
```
Run ESLint
Run TypeScript type check
```

**✅ Unit Tests** - Should pass (172 tests)
```
Test Suites: 6 passed, 6 total
Tests:       172 passed, 172 total
```

**⚠️ E2E Tests** - May take 3-5 minutes
```
Running 15 tests using 1 worker
✓ auth.spec.ts (8 tests) - 2m 30s
✓ dashboard.spec.ts (7 tests) - 1m 45s
```

**✅ Build** - Should pass
```
Creating an optimized production build...
Compiled successfully
```

### 6.4 Troubleshooting CI Issues

**If E2E tests fail in CI:**
1. Check GitHub Actions logs for specific error
2. Verify all secrets are set correctly (no typos!)
3. Ensure Firebase test user exists and can sign in
4. Check Firestore security rules allow test data access

**If coverage upload fails:**
1. Check `CODECOV_TOKEN` is set correctly
2. Verify repository is added to Codecov
3. If you don't need Codecov yet, this won't fail the build

## Step 7: Maintenance

### Regular Tasks

**Weekly:**
- Check Firestore for test data accumulation
- Clean up old test data if needed

**Monthly:**
- Review Firebase usage (should be within free tier)
- Rotate test user password if needed

**Per Feature:**
- Add new test scenarios to E2E tests
- Update Page Object Models if UI changes
- Keep unit test coverage above 80%

### Monitoring

**Firebase Console:**
- Monitor Authentication → Users (should only have test user)
- Monitor Firestore → Data (clean up test data periodically)
- Monitor Usage (should stay in free tier)

**GitHub Actions:**
- Check build status on each push
- Review coverage trends in Codecov
- Fix flaky tests immediately

## Quick Reference

### Useful Commands
```bash
# Local testing
npm run test              # Unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
npx playwright test       # E2E tests
npx playwright test --ui  # E2E with UI

# CI testing
git push origin branch    # Triggers CI
# Watch on GitHub Actions tab

# Debugging
npx playwright test --debug        # Debug E2E
npx playwright codegen localhost:3000  # Record new tests
npm run test -- --verbose          # Verbose unit tests
```

### Important URLs
- Firebase Console: https://console.firebase.google.com/project/finsight-ai-test
- GitHub Actions: https://github.com/YOUR_USERNAME/finsight-ai-dashboard/actions
- Codecov: https://app.codecov.io/gh/YOUR_USERNAME/finsight-ai-dashboard

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env.test` to Git (already in .gitignore)
- Use a separate Firebase project for testing (not production)
- Test passwords should be strong but different from production
- Regularly review Firebase security rules
- Monitor Firebase usage to avoid unexpected charges

## Getting Help

If you encounter issues:
1. Check GitHub Actions logs for error details
2. Review Firebase Console for authentication errors
3. Run E2E tests locally first to isolate issues
4. Check test credentials are correctly set in GitHub secrets
5. Verify Firestore security rules allow test access

## Next Steps

After successful setup:
1. ✅ Merge `feat/testing-infrastructure` to main
2. ✅ Set up branch protection rules requiring tests to pass
3. ✅ Add more unit tests to increase coverage
4. ✅ Expand E2E tests for new features
5. ✅ Monitor coverage trends in Codecov
