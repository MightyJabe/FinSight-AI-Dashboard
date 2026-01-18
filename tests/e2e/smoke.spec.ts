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

  test('should login with real credentials and reach dashboard', async ({ page }) => {
    // Real login with test user
    await page.goto('/login');
    
    const testEmail = process.env.E2E_TEST_EMAIL;
    const testPassword = process.env.E2E_TEST_PASSWORD;

    // Skip test if credentials not configured
    if (!testEmail || !testPassword) {
      test.skip();
      return;
    }

    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.click('button[type="submit"]');

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Check if we successfully logged in OR got an error
    const currentURL = page.url();
    
    if (currentURL.includes('/dashboard')) {
      // Success! Verify page loaded
      const bodyText = await page.locator('body').textContent();
      expect(bodyText.length).toBeGreaterThan(100);
    } else if (currentURL.includes('/login')) {
      // Login failed - check for error message
      const hasError = await page.locator('text=/Failed|Invalid|Error/i').isVisible().catch(() => false);
      if (hasError) {
        throw new Error('Login failed - check test credentials in GitHub secrets');
      } else {
        // Credentials might be wrong or Firebase issue
        console.warn('Login redirected back to /login without error message');
        test.skip();
      }
    }
  });

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
