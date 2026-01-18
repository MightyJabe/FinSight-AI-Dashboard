# Deployment Scripts

## Vercel Ignored Build Step

### Purpose
The `vercel-should-deploy.sh` script controls when Vercel builds and deploys your application.

### Setup Instructions

1. **In Vercel Dashboard:**
   - Go to: https://vercel.com/[your-org]/finsight-ai-dashboard/settings/git
   - Find "Ignored Build Step" section
   - Enter: `bash ./scripts/vercel-should-deploy.sh`

2. **How it works:**
   - ✅ **Production** (master/main branch): Always deploys
   - ✅ **Pull Requests**: Always builds preview deployments
   - ⏭️ **Other branches**: Skips deployment

### Combined with GitHub Actions

For best practices, combine this with GitHub branch protection:

1. **Branch Protection** (see `.github/BRANCH_PROTECTION.md`)
   - Require all CI checks to pass before merging to master
   - This ensures only tested code reaches production

2. **Vercel Configuration** (in vercel.json)
   - Only master/main branches trigger production deployments
   - Preview deployments work for all PRs

### Result
- ❌ **Failed tests** → Cannot merge to master → No production deployment
- ✅ **Passing tests** → Can merge to master → Production deploys automatically
- 👀 **Preview deployments** → Always available for PRs (for manual testing)
