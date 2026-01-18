#!/bin/bash

# Vercel Ignored Build Step Script
# This script determines if Vercel should build and deploy
# Reference: https://vercel.com/docs/deployments/configure-a-build#ignored-build-step

# Exit codes:
# 0 = Proceed with build
# 1 = Skip build

echo "Checking if deployment should proceed..."

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

# Check if this is the production branch
if [[ "$VERCEL_GIT_COMMIT_REF" == "master" ]] || [[ "$VERCEL_GIT_COMMIT_REF" == "main" ]]; then
  echo "✅ Production branch detected: $VERCEL_GIT_COMMIT_REF"
  echo "✅ Proceeding with production deployment"
  exit 0
fi

# For preview deployments (PRs), always build
if [[ -n "$VERCEL_GIT_PULL_REQUEST_ID" ]]; then
  echo "✅ Pull request detected: #$VERCEL_GIT_PULL_REQUEST_ID"
  echo "✅ Proceeding with preview deployment"
  exit 0
fi

# For other branches, skip deployment
echo "⏭️  Non-production branch: $VERCEL_GIT_COMMIT_REF"
echo "⏭️  Skipping deployment"
exit 1
