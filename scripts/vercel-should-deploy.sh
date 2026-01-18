#!/bin/bash

# Vercel Ignored Build Step Script
# This script ensures Vercel only deploys after ALL GitHub Actions checks pass
# Reference: https://vercel.com/docs/deployments/configure-a-build#ignored-build-step

# Exit codes:
# 0 = Proceed with build
# 1 = Skip build

set -e

echo "=== Vercel Deployment Guard ==="
echo "Checking if deployment should proceed..."
echo ""
echo "Environment:"
echo "  VERCEL_ENV: ${VERCEL_ENV:-not set}"
echo "  VERCEL_GIT_COMMIT_REF: ${VERCEL_GIT_COMMIT_REF:-not set}"
echo "  VERCEL_GIT_COMMIT_SHA: ${VERCEL_GIT_COMMIT_SHA:-not set}"
echo "  VERCEL_GIT_PULL_REQUEST_ID: ${VERCEL_GIT_PULL_REQUEST_ID:-not set}"
echo ""

# For preview deployments (PRs), always build
if [[ -n "$VERCEL_GIT_PULL_REQUEST_ID" ]]; then
  echo "✅ Pull request detected: #$VERCEL_GIT_PULL_REQUEST_ID"
  echo "✅ Proceeding with preview deployment"
  exit 0
fi

# Only proceed for master/main branches
if [[ "$VERCEL_GIT_COMMIT_REF" != "master" ]] && [[ "$VERCEL_GIT_COMMIT_REF" != "main" ]]; then
  echo "⏭️  Non-production branch: $VERCEL_GIT_COMMIT_REF"
  echo "⏭️  Skipping deployment"
  exit 1
fi

echo "📋 Production branch detected: $VERCEL_GIT_COMMIT_REF"
echo ""

# Check GitHub Actions status
if [[ -z "$VERCEL_GIT_COMMIT_SHA" ]]; then
  echo "⚠️  VERCEL_GIT_COMMIT_SHA not set, cannot check GitHub Actions status"
  echo "⚠️  Deploying anyway (use at your own risk)"
  exit 0
fi

echo "🔍 Checking GitHub Actions status for commit: ${VERCEL_GIT_COMMIT_SHA:0:7}"

# GitHub API to check commit status
GITHUB_API="https://api.github.com/repos/MightyJabe/FinSight-AI-Dashboard/commits/$VERCEL_GIT_COMMIT_SHA/check-runs"
RESPONSE=$(curl -s -H "Accept: application/vnd.github+json" "$GITHUB_API")

# Parse the response
TOTAL_COUNT=$(echo "$RESPONSE" | grep -o '"total_count":[0-9]*' | head -1 | cut -d':' -f2)

if [[ -z "$TOTAL_COUNT" ]] || [[ "$TOTAL_COUNT" == "0" ]]; then
  echo "⏳ No GitHub Actions checks found yet"
  echo "⏳ Checks may still be starting..."
  echo "❌ Skipping deployment - checks must complete first"
  exit 1
fi

echo "   Found $TOTAL_COUNT check run(s)"
echo ""

# Check if any checks are still running
IN_PROGRESS=$(echo "$RESPONSE" | grep -c '"status":"in_progress"' || true)
if [[ "$IN_PROGRESS" -gt 0 ]]; then
  echo "⏳ GitHub Actions are still running ($IN_PROGRESS in progress)"
  echo "❌ Skipping deployment - waiting for checks to complete"
  exit 1
fi

# Check if all checks are completed
COMPLETED=$(echo "$RESPONSE" | grep -c '"status":"completed"' || true)
if [[ "$COMPLETED" -ne "$TOTAL_COUNT" ]]; then
  echo "⏳ Not all checks are completed yet ($COMPLETED/$TOTAL_COUNT)"
  echo "❌ Skipping deployment - waiting for all checks"
  exit 1
fi

# Check if any checks failed
FAILED=$(echo "$RESPONSE" | grep -c '"conclusion":"failure"' || true)
if [[ "$FAILED" -gt 0 ]]; then
  echo "❌ $FAILED check(s) failed"
  echo "❌ Skipping deployment - all checks must pass"
  exit 1
fi

# Check for successful checks
SUCCESS=$(echo "$RESPONSE" | grep -c '"conclusion":"success"' || true)

echo "✅ All checks completed successfully ($SUCCESS/$TOTAL_COUNT passed)"
echo "✅ Proceeding with production deployment"
echo ""
exit 0
