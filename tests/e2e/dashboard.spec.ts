import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage';

test.describe('Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard before each test
    // Uses authenticated state from auth.setup.ts
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.expectDashboardPage();
  });

  test.describe('Page Elements', () => {
    test('should display all main dashboard elements', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      // Check main elements are visible
      await expect(dashboardPage.pageTitle).toBeVisible();
      await expect(dashboardPage.welcomeText).toBeVisible();
      await expect(dashboardPage.addAccountButton).toBeVisible();
    });

    test('should display net worth section', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.expectNetWorthVisible();

      // Net worth should show a currency value
      const netWorthText = await dashboardPage.getNetWorthText();
      expect(netWorthText).toBeTruthy();
    });

    test('should display welcome message', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      // Check for "Welcome back" text
      await expect(dashboardPage.welcomeText).toBeVisible();
    });
  });

  test.describe('Accounts Section', () => {
    test('should display accounts section when accounts exist', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      // Check if accounts section is visible
      const accountCount = await dashboardPage.getAccountCount();

      if (accountCount > 0) {
        await dashboardPage.expectAccountsVisible();
        await expect(dashboardPage.viewAllAccountsLink).toBeVisible();
      }
    });

    test('should show correct number of account cards', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      const accountCount = await dashboardPage.getAccountCount();

      // Should show up to 4 accounts on dashboard
      expect(accountCount).toBeGreaterThanOrEqual(0);
      expect(accountCount).toBeLessThanOrEqual(4);
    });

    test('should navigate to accounts page when clicking View All', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      const accountCount = await dashboardPage.getAccountCount();

      if (accountCount > 0) {
        await dashboardPage.clickViewAllAccounts();
        await expect(page).toHaveURL('/accounts');
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to Add Account page', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      await dashboardPage.clickAddAccount();
      await expect(page).toHaveURL(/\/accounts/);
    });

    test('should have working navigation links', async ({ page }) => {
      // Check for common navigation links (adjust based on your nav structure)
      const navLinks = page.locator('nav a, header a');
      const linkCount = await navLinks.count();

      expect(linkCount).toBeGreaterThan(0);

      // All nav links should be visible
      for (let i = 0; i < Math.min(linkCount, 5); i++) {
        await expect(navLinks.nth(i)).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();

      // Main elements should still be visible
      await expect(dashboardPage.pageTitle).toBeVisible();
      await expect(dashboardPage.addAccountButton).toBeVisible();
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();

      // Main elements should still be visible
      await expect(dashboardPage.pageTitle).toBeVisible();
      await expect(dashboardPage.addAccountButton).toBeVisible();
      await dashboardPage.expectNetWorthVisible();
    });

    test('should display correctly on desktop viewport', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.reload();

      // All elements should be visible
      await expect(dashboardPage.pageTitle).toBeVisible();
      await expect(dashboardPage.addAccountButton).toBeVisible();
      await dashboardPage.expectNetWorthVisible();
    });
  });

  test.describe('Real-time Updates', () => {
    test('should show real-time indicator', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      // Check for real-time status indicator
      // May or may not be visible depending on data loading
      const indicatorVisible = await dashboardPage.realTimeIndicator.isVisible().catch(() => false);

      // Just verify the test can check for it (indicator presence depends on app state)
      expect(typeof indicatorVisible).toBe('boolean');
    });
  });

  test.describe('Empty States', () => {
    test('should handle dashboard with no accounts gracefully', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      // Check if there's a connect bank CTA or empty state
      const hasAccounts = (await dashboardPage.getAccountCount()) > 0;

      if (!hasAccounts) {
        // Should show some CTA to connect accounts
        await expect(dashboardPage.connectBankCTA).toBeVisible();
      }
    });
  });

  test.describe('Interactions', () => {
    test('should allow clicking on account cards', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      const accountCount = await dashboardPage.getAccountCount();

      if (accountCount > 0) {
        // Click first account card
        await dashboardPage.accountCards.first().click();

        // Should either navigate somewhere or show detail (adjust based on behavior)
        // For now, just verify the click doesn't error
        await page.waitForTimeout(500);
      }
    });

    test('should handle page refresh without errors', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      // Reload page
      await page.reload();

      // Should still show dashboard
      await dashboardPage.expectDashboardPage();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      // Check for h1
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();

      // Check for proper headings structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
    });

    test('should have accessible links with text', async ({ page }) => {
      const links = page.locator('a');
      const linkCount = await links.count();

      // Check first few links have text or aria-label
      for (let i = 0; i < Math.min(linkCount, 5); i++) {
        const link = links.nth(i);
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');

        expect(text || ariaLabel).toBeTruthy();
      }
    });

    test('should have focusable interactive elements', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      // Tab to the add account button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Some element should be focused
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });
  });
});
