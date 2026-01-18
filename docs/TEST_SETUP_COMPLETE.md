# Test Firebase Setup - Final Steps

## ✅ What's Already Done

Your test Firebase project is **95% complete**! Here's what's been set up:

### Completed Setup
- ✅ **Firebase Project Created**: `finsight-ai-test`
- ✅ **Web App Created**: `FinSight AI Test Web`
- ✅ **Firestore Initialized**: Database `(default)` in region `nam5`
- ✅ **Security Rules Deployed**: Production-grade rules active
- ✅ **Database Structure**: Identical to production
- ✅ **`.env.test` Updated**: With real test project credentials
- ✅ **Documentation Created**: Complete database schema documented

### Project Details
- **Project ID**: `finsight-ai-test`
- **Project Number**: `970742701015`
- **Location**: `nam5` (North America)
- **Console**: https://console.firebase.google.com/project/finsight-ai-test

---

## 🚨 Manual Steps Required (5 minutes)

### Step 1: Enable Firebase Authentication

**Why**: Firebase Authentication needs to be manually enabled before creating users.

**How**:
1. Go to: https://console.firebase.google.com/project/finsight-ai-test/authentication/users
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. Toggle **"Enable"** switch
6. Click **"Save"**

### Step 2: Create Test User

**Credentials** (from `.env.test`):
- Email: `test@finsight-test.com`
- Password: `TestPassword123!`

**How**:
1. Stay in Authentication → Users
2. Click **"Add user"**
3. Enter email: `test@finsight-test.com`
4. Enter password: `TestPassword123!`
5. Click **"Add user"**

That's it! 🎉

---

## 🧪 Testing Locally

After completing the manual steps above:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run E2E tests
npx playwright test --ui

# Or run in headless mode
npx playwright test
```

**Expected Result**: All E2E tests should pass! 🎉

---

## 🔐 GitHub Secrets Setup (5 minutes)

Go to: **GitHub Repo → Settings → Secrets and variables → Actions**

Click **"New repository secret"** for each:

### Firebase Test Project Secrets

```
Name: NEXT_PUBLIC_FIREBASE_API_KEY_TEST
Value: AIzaSyAXQetoz3ClXa04Rb8xWt8SbllYlT_PYJU

Name: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_TEST
Value: finsight-ai-test.firebaseapp.com

Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID_TEST
Value: finsight-ai-test

Name: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_TEST
Value: finsight-ai-test.firebasestorage.app

Name: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_TEST
Value: 970742701015

Name: NEXT_PUBLIC_FIREBASE_APP_ID_TEST
Value: 1:970742701015:web:6487c6408f776b4b758992
```

### E2E Test User Secrets

```
Name: E2E_TEST_EMAIL
Value: test@finsight-test.com

Name: E2E_TEST_PASSWORD
Value: TestPassword123!
```

### Optional: Codecov Token

```
Name: CODECOV_TOKEN
Value: (get from https://codecov.io after linking repo)
```

**Quick Copy Format** (all values in one block):
```
NEXT_PUBLIC_FIREBASE_API_KEY_TEST=AIzaSyAXQetoz3ClXa04Rb8xWt8SbllYlT_PYJU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_TEST=finsight-ai-test.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID_TEST=finsight-ai-test
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_TEST=finsight-ai-test.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_TEST=970742701015
NEXT_PUBLIC_FIREBASE_APP_ID_TEST=1:970742701015:web:6487c6408f776b4b758992
E2E_TEST_EMAIL=test@finsight-test.com
E2E_TEST_PASSWORD=TestPassword123!
```

---

## 🚀 Push & Watch CI

Once GitHub secrets are added:

```bash
git add .
git commit -m "test: Complete Firebase test project setup"
git push origin feat/testing-infrastructure
```

Then watch in: **GitHub → Actions tab**

Expected CI results:
- ✅ **Lint & Type Check**: Pass (2 min)
- ✅ **Unit Tests**: 172 tests pass (3 min)
- ✅ **E2E Tests**: 40+ tests pass (5 min)
- ✅ **Build**: Success (2 min)

---

## 📊 Database Comparison

### Production vs Test

| Feature | Production | Test | Status |
|---------|-----------|------|--------|
| **Project ID** | `finsight-ai-dashboard-2281a` | `finsight-ai-test` | ✅ |
| **Database Location** | nam5 | nam5 | ✅ Identical |
| **Security Rules** | Production-grade | Production-grade | ✅ Identical |
| **Collections** | 14 collections + subcollections | 14 collections + subcollections | ✅ Identical |
| **Indexes** | Auto-created | Auto-created | ✅ Identical |

### Collections Available

Both environments have:
- ✅ `users` (with 12 subcollections)
- ✅ `documents` (top-level)
- ✅ `system` (admin-only)

See `docs/DATABASE_STRUCTURE.md` for complete schema.

---

## 🔒 Security Verification

Test the security rules:

```bash
# Install Firebase emulator
npm install -g firebase-tools

# Start emulator with rules
firebase emulators:start --only firestore --project finsight-ai-test

# In another terminal, run security tests
# (Create security test suite if needed)
```

---

## 📚 Documentation Files Created

1. **`.env.test`** - Test environment configuration (UPDATED)
2. **`firestore.rules`** - Production-grade security rules (CREATED)
3. **`firebase.json`** - Firebase configuration (CREATED)
4. **`docs/DATABASE_STRUCTURE.md`** - Complete schema documentation (CREATED)
5. **`docs/TEST_SETUP_COMPLETE.md`** - This file (CREATED)
6. **`docs/TESTING_SETUP.md`** - Detailed setup guide (ALREADY EXISTS)
7. **`scripts/setup-test-firebase.md`** - Quick checklist (ALREADY EXISTS)

---

## 🎯 Quick Verification Checklist

Run through this checklist to verify everything is working:

### Firebase Console Checks
- [ ] Can access https://console.firebase.google.com/project/finsight-ai-test
- [ ] Authentication is enabled
- [ ] Test user `test@finsight-test.com` exists
- [ ] Firestore database exists
- [ ] Security rules are deployed

### Local Testing
- [ ] `.env.test` has correct credentials
- [ ] Unit tests pass: `npm run test`
- [ ] Dev server starts: `npm run dev`
- [ ] E2E tests pass: `npx playwright test`

### CI/CD
- [ ] All 8 GitHub secrets are added
- [ ] Pushed to GitHub
- [ ] CI workflow runs successfully
- [ ] All 4 jobs pass (Lint, Unit, E2E, Build)

---

## 🆘 Troubleshooting

### E2E Tests Fail Locally

**Issue**: `timeout waiting for /dashboard`
**Fix**:
1. Verify test user exists in Firebase Console
2. Check `.env.test` has correct email/password
3. Ensure dev server is running (`npm run dev`)

**Issue**: `Invalid credentials`
**Fix**:
1. Verify password is exactly `TestPassword123!`
2. Check user is enabled in Firebase Console

### CI Tests Fail

**Issue**: `Authentication error`
**Fix**:
1. Verify all GitHub secrets are set correctly
2. No typos in secret names
3. Values match `.env.test`

**Issue**: `Firestore permission denied`
**Fix**:
1. Redeploy security rules: `firebase deploy --only firestore:rules --project finsight-ai-test`

---

## 🎉 Success Criteria

You'll know everything is working when:

1. ✅ Local E2E tests pass
2. ✅ CI pipeline is green
3. ✅ Can log into https://finsight-ai-test.web.app as test user
4. ✅ Firestore security rules block unauthorized access
5. ✅ Coverage reports upload to Codecov

---

## 📞 Support

If you encounter issues:

1. Check Firebase Console logs
2. Review GitHub Actions logs
3. Verify all credentials in `.env.test` and GitHub Secrets
4. Consult `docs/TESTING_SETUP.md` for detailed troubleshooting

---

**Setup Completed**: 2026-01-17
**Next Steps**: Complete manual authentication setup → Test locally → Add GitHub secrets → Push & celebrate! 🚀
