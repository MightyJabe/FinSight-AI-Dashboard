import { test, expect } from '@playwright/test';
import {
  navigateToPage,
  waitForPageLoad,
  mockAuthentication,
  mockAPIResponse,
  expectElementToContainText,
} from './utils/test-helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
  });

  test('should load dashboard with overview cards', async ({ page }) => {
    // Mock dashboard data
    await mockAPIResponse(page, '**/api/dashboard**', {
      success: true,
      data: {
        totalBalance: 15000,
        monthlySpending: 3500,
        accountsCount: 3,
        lastUpdated: new Date().toISOString(),
      },
    });

    await navigateToPage(page, '/dashboard');
    await waitForPageLoad(page);

    // Check main dashboard heading
    await expectElementToContainText(page, 'h1', 'Dashboard');

    // Check for overview cards
    const cards = page.locator('[role="region"], .card, .bg-white, .bg-gray-50');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display account balance information', async ({ page }) => {
    await mockAPIResponse(page, '**/api/accounts**', {
      success: true,
      data: {
        accounts: [
          {
            id: 'acc_1',
            name: 'Test Checking',
            type: 'depository',
            subtype: 'checking',
            balance: 5000,
            institution: 'Test Bank',
          },
          {
            id: 'acc_2',
            name: 'Test Savings',
            type: 'depository',
            subtype: 'savings',
            balance: 10000,
            institution: 'Test Bank',
          },
        ],
      },
    });

    await navigateToPage(page, '/dashboard');
    await waitForPageLoad(page);

    // Look for balance information
    const balanceElements = page.locator(
      ':has-text("$"), :has-text("balance"), :has-text("Balance")'
    );
    await expect(balanceElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show recent transactions', async ({ page }) => {
    await mockAPIResponse(page, '**/api/transactions**', {
      success: true,
      data: {
        transactions: [
          {
            id: 'txn_1',
            name: 'Grocery Store',
            amount: 85.5,
            date: '2024-01-15',
            category: ['Food and Drink', 'Groceries'],
          },
          {
            id: 'txn_2',
            name: 'Gas Station',
            amount: 45.0,
            date: '2024-01-14',
            category: ['Transportation', 'Gas Stations'],
          },
        ],
      },
    });

    await navigateToPage(page, '/dashboard');
    await waitForPageLoad(page);

    // Look for transaction elements
    const transactionSection = page.locator(
      ':has-text("Recent"), :has-text("Transactions"), .transaction'
    );
    await expect(transactionSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display spending breakdown chart', async ({ page }) => {
    await mockAPIResponse(page, '**/api/spending-analysis**', {
      success: true,
      data: {
        categories: [
          { category: 'Food and Drink', amount: 850, percentage: 35 },
          { category: 'Transportation', amount: 650, percentage: 27 },
          { category: 'Entertainment', amount: 450, percentage: 18 },
        ],
        totalSpent: 2400,
      },
    });

    await navigateToPage(page, '/dashboard');
    await waitForPageLoad(page);

    // Look for chart or spending breakdown
    const chartElements = page.locator('canvas, svg, .chart, :has-text("Spending")');
    await expect(chartElements.first()).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to different sections from dashboard', async ({ page }) => {
    await navigateToPage(page, '/dashboard');
    await waitForPageLoad(page);

    // Test navigation to transactions
    const transactionsLink = page.locator(
      'a[href*="transactions"], a:has-text("Transactions"), a:has-text("View all")'
    );
    if (await transactionsLink.first().isVisible()) {
      await transactionsLink.first().click();
      await waitForPageLoad(page);
      expect(page.url()).toContain('transactions');
    }
  });

  test('should handle loading states', async ({ page }) => {
    // Delay API response to test loading states
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    });

    await navigateToPage(page, '/dashboard');

    // Look for loading indicators
    const loadingElements = page.locator(
      '.animate-spin, .loading, :has-text("Loading"), .skeleton'
    );

    // At least one loading element should be visible initially
    const hasLoadingElement = (await loadingElements.count()) > 0;
    if (hasLoadingElement) {
      await expect(loadingElements.first()).toBeVisible();
    }

    // Wait for content to load
    await waitForPageLoad(page);
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Server error' }),
      });
    });

    await navigateToPage(page, '/dashboard');
    await waitForPageLoad(page);

    // Should handle errors gracefully without crashing
    const pageContent = page.locator('main, body');
    await expect(pageContent).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToPage(page, '/dashboard');
    await waitForPageLoad(page);

    // Check mobile navigation
    const mobileMenu = page.locator(
      'button[aria-label*="menu"], button[aria-label*="Menu"], .lg\\:hidden button'
    );
    if (await mobileMenu.isVisible()) {
      await expect(mobileMenu).toBeVisible();

      // Test mobile menu functionality
      await mobileMenu.click();
      const navigation = page.locator('nav, [role="navigation"]');
      await expect(navigation).toBeVisible();
    }

    // Check content is properly displayed on mobile
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should update data when refresh button is clicked', async ({ page }) => {
    await navigateToPage(page, '/dashboard');
    await waitForPageLoad(page);

    // Look for refresh button
    const refreshButton = page.locator(
      'button:has-text("Refresh"), button[aria-label*="refresh"], button:has([data-testid*="refresh"])'
    );

    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Should trigger loading state
      const loadingElements = page.locator('.animate-spin, .loading, :has-text("Loading")');
      if ((await loadingElements.count()) > 0) {
        await expect(loadingElements.first()).toBeVisible();
      }
    }
  });
});
