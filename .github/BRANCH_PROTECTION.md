# Recommended Branch Protection Settings

## For `master` branch:

1. **Require status checks before merging**
   - ✅ Require branches to be up to date before merging
   - ✅ Required status checks:
     - `Lint & Type Check`
     - `Unit Tests`
     - `E2E Tests` (once fixed)
     - `Build Application`

2. **Require pull request reviews**
   - ✅ Require 1 approval (or 0 for solo projects)
   - ✅ Dismiss stale reviews when new commits are pushed

3. **Do not allow bypassing**
   - ✅ Include administrators
   - ✅ Restrict who can push to matching branches

## Vercel Integration Settings:

### Step-by-step Vercel Configuration:

1. **Set Production Branch**
   - Go to: Vercel Dashboard > Your Project > Settings > Git
   - Set "Production Branch" to: `master`
   - This ensures only the master branch deploys to production

2. **Ignored Build Step (Recommended)**
   - Go to: Vercel Dashboard > Your Project > Settings > Git
   - Set "Ignored Build Step" to: `git diff --quiet HEAD^ HEAD .`
   - Alternative: Check "Only deploy when branch has no failing checks" if available

3. **GitHub App Permissions**
   - Ensure Vercel GitHub app has "Checks" read permission
   - This allows Vercel to see CI status before deploying

### Result:
- ✅ Production deploys ONLY from `master` branch
- ✅ Vercel waits for GitHub Actions to pass before building
- ✅ Failed tests = No deployment
- ✅ Preview deployments still work for PRs (for testing)

## Setup Instructions:

### GitHub Branch Protection:
1. Go to: GitHub > Repository > Settings > Branches > Add Rule
2. Branch name pattern: `master`
3. Enable all settings listed in section above

### Vercel Settings:
1. Go to: https://vercel.com/[your-username]/[project-name]/settings/git
2. Set Production Branch to `master`
3. Configure Ignored Build Step as described above
