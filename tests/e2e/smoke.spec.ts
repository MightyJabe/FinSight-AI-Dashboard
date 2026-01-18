/**
 * Smoke Tests - Real API Integration
 *
 * These tests hit REAL Firebase APIs with the test user credentials.
 * NO MOCKS - This validates the full stack works end-to-end.
 *
 * Focus: Verify pages load successfully with real data (or empty data).
 * These tests prove the full stack (Frontend → API → Firebase) works.
 *
 * Run separately in CI to catch integration issues.
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests (Real APIs)', () => {
  // Use longer timeout for real API calls
  test.setTimeout(60000);

  // Note: Manual login is tested in auth.setup.ts
  // These tests use the authenticated state from setup to validate the full stack

  test('should load accounts page successfully', async ({ page }) => {
    // Uses authenticated state from auth.setup.ts
    await page.goto('/accounts');
    await page.waitForLoadState('load', { timeout: 30000 });

    // Verify page loaded
    await expect(page).toHaveURL('/accounts');
    
    // Page should render content (not blank)
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test('should be able to navigate between protected routes', async ({ page }) => {
    // Start at dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL('/dashboard');

    // Navigate to accounts (direct URL, proves routing works)
    await page.goto('/accounts');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL('/accounts');
    
    // Navigate to settings
    await page.goto('/settings');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL('/settings');
  });

  test('should handle authentication redirect on protected route', async ({ browser }) => {
    // Create fresh context without auth
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] }
    });
    const page = await context.newPage();

    try {
      // Try to access dashboard without auth
      await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 });

      // Should redirect to login
      await expect(page).toHaveURL('/login', { timeout: 15000 });

      // Login page should be visible
      await expect(page.locator('h2').filter({ hasText: 'Sign In' })).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('should load settings page successfully', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('load', { timeout: 30000 });

    // Verify page loaded
    await expect(page).toHaveURL('/settings');
    
    // Page should render content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.length).toBeGreaterThan(100);
  });
});
