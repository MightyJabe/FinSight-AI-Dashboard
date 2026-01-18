# Deployment Scripts

## Vercel Deployment Guard

### Purpose
The `vercel-should-deploy.sh` script ensures Vercel **only deploys to production after ALL GitHub Actions checks pass**.

This prevents broken code from reaching production.

### How It Works

```
1. Push to master → Vercel webhook fires
2. Vercel runs: bash ./scripts/vercel-should-deploy.sh
3. Script checks GitHub Actions status via API:
   - ⏳ Checks still running? → Exit 1 (skip, Vercel will retry)
   - ❌ Any checks failed? → Exit 1 (skip deployment)
   - ✅ All checks passed? → Exit 0 (proceed with deployment)
4. Vercel deploys only if script returned 0
```

### Setup Instructions

**1. Configure in Vercel Dashboard:**
   - Go to: https://vercel.com/[your-org]/finsight-ai-dashboard/settings/git
   - Find "Ignored Build Step" section
   - Enter: `bash ./scripts/vercel-should-deploy.sh`
   - Save settings

**2. How it protects production:**
   - ✅ **PRs**: Always build preview deployments
   - ✅ **Master with passing tests**: Deploys to production
   - ❌ **Master with failing tests**: Blocks deployment
   - ❌ **Master with running tests**: Waits for completion
   - ⏭️ **Other branches**: Skips deployment

### Testing the Flow

To test that it works:

```bash
# 1. Make a trivial change
git commit --allow-empty -m "test: verify deployment guard"
git push origin master

# 2. Watch what happens:
# - GitHub Actions start running
# - Vercel checks script → sees tests running → skips
# - Tests complete and pass
# - Vercel checks again → sees all passed → deploys ✅
```

### Combined with Branch Protection

For best security, enable GitHub branch protection:
- Settings → Branches → Add rule for `master`
- ✅ Require pull request reviews
- ✅ Require status checks to pass (select: E2E Tests, Unit Tests, Lint)
- ✅ Require branches to be up to date

**Result:**
- Cannot merge to master unless tests pass
- Cannot deploy to production unless tests pass
- Double protection! 🔒
