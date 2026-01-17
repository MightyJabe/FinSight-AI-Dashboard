# Quick Setup Checklist

Follow these steps in order:

## ☐ 1. Create Firebase Test Project (5 minutes)

1. [ ] Go to https://console.firebase.google.com/
2. [ ] Click "Add project"
3. [ ] Name: `finsight-ai-test`
4. [ ] Disable Google Analytics
5. [ ] Click "Create project"

## ☐ 2. Register Web App (2 minutes)

1. [ ] Click the Web icon (</>)
2. [ ] Nickname: "FinSight Test Web"
3. [ ] Register app
4. [ ] **COPY THE CONFIG** - paste it below:

```javascript
// Paste your Firebase config here:
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "....firebaseapp.com",
  projectId: "....",
  storageBucket: "....appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

## ☐ 3. Enable Authentication (3 minutes)

1. [ ] Go to Authentication → Get started
2. [ ] Click "Sign-in method" tab
3. [ ] Enable "Email/Password"
4. [ ] Save

## ☐ 4. Create Test User (1 minute)

1. [ ] Go to Authentication → Users
2. [ ] Click "Add user"
3. [ ] Email: `test@finsight-test.com`
4. [ ] Password: (create strong password)
5. [ ] **SAVE CREDENTIALS** - you'll need them!

**Your test credentials:**
```
Email: test@finsight-test.com
Password: __________________ (write it down!)
```

## ☐ 5. Enable Firestore (2 minutes)

1. [ ] Go to Firestore Database
2. [ ] Click "Create database"
3. [ ] Select "Start in test mode"
4. [ ] Choose location: `us-central1`
5. [ ] Enable

## ☐ 6. Update Security Rules (1 minute)

1. [ ] In Firestore, go to "Rules" tab
2. [ ] Replace with these test rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /test_data/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. [ ] Click "Publish"

## ☐ 7. Create .env.test Locally (2 minutes)

Create a file `.env.test` in your project root:

```bash
# Copy this template and fill in your values from Step 2

# Firebase Test Project Config
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="finsight-ai-test.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="finsight-ai-test"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="finsight-ai-test.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abc123"

# Test User Credentials (from Step 4)
E2E_TEST_EMAIL="test@finsight-test.com"
E2E_TEST_PASSWORD="your-password-here"
```

## ☐ 8. Test Locally (3 minutes)

```bash
# Terminal 1 - Start dev server
npm run dev

# Terminal 2 - Run E2E tests
npx playwright test --ui
```

**Expected**: Tests should run and most should pass!

## ☐ 9. Add GitHub Secrets (5 minutes)

Go to: **GitHub Repo → Settings → Secrets and variables → Actions**

For each secret below, click "New repository secret":

### Firebase Config Secrets:
```
Name: NEXT_PUBLIC_FIREBASE_API_KEY_TEST
Value: (paste from .env.test)

Name: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_TEST
Value: (paste from .env.test)

Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID_TEST
Value: (paste from .env.test)

Name: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_TEST
Value: (paste from .env.test)

Name: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_TEST
Value: (paste from .env.test)

Name: NEXT_PUBLIC_FIREBASE_APP_ID_TEST
Value: (paste from .env.test)
```

### Test Credentials:
```
Name: E2E_TEST_EMAIL
Value: test@finsight-test.com

Name: E2E_TEST_PASSWORD
Value: (your test password)
```

### Quick Copy Format for GitHub:
Use this format when adding secrets (one per secret):

```
NEXT_PUBLIC_FIREBASE_API_KEY_TEST=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_TEST=finsight-ai-test.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID_TEST=finsight-ai-test
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_TEST=finsight-ai-test.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_TEST=123456789
NEXT_PUBLIC_FIREBASE_APP_ID_TEST=1:123456789:web:abc123
E2E_TEST_EMAIL=test@finsight-test.com
E2E_TEST_PASSWORD=your-password
```

## ☐ 10. Optional: Set Up Codecov (3 minutes)

1. [ ] Go to https://codecov.io
2. [ ] Sign in with GitHub
3. [ ] Add repository: `finsight-ai-dashboard`
4. [ ] Copy upload token
5. [ ] Add to GitHub secrets:
   ```
   Name: CODECOV_TOKEN
   Value: (paste token)
   ```

**Note**: Skip this if you don't need coverage tracking yet. CI will still work.

## ☐ 11. Push and Watch CI (2 minutes)

```bash
git push origin feat/testing-infrastructure
```

Then watch in GitHub:
- Go to **Actions** tab
- Click on your workflow run
- Watch tests execute

**Expected results:**
- ✅ Lint & Type Check (passes)
- ✅ Unit Tests (172 tests pass)
- ✅ E2E Tests (40+ tests pass)
- ✅ Build (completes successfully)

## 🎉 Done!

Total time: ~25 minutes

If any step fails, see the full guide: `docs/TESTING_SETUP.md`

## Quick Test Commands Reference

```bash
# Unit tests
npm run test              # Run once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage

# E2E tests
npx playwright test       # Headless
npx playwright test --ui  # With UI
npx playwright test --debug  # Debug mode

# Full suite
npm run test:all         # All tests
```

## Troubleshooting Quick Fixes

**E2E tests timeout?**
→ Check test user exists in Firebase Auth

**"Invalid credentials" error?**
→ Double-check E2E_TEST_EMAIL and E2E_TEST_PASSWORD

**CI E2E tests fail?**
→ Verify all 8 secrets are added to GitHub (no typos!)

**Firestore permission denied?**
→ Update security rules (Step 6)

**Coverage upload fails?**
→ CODECOV_TOKEN not set (optional, won't fail CI)
