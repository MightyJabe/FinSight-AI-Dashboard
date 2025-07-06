import { test, expect } from '@playwright/test';
import { navigateToPage, waitForPageLoad, expectNoConsoleErrors } from './utils/test-helpers';

test.describe('Homepage', () => {
  test('should load homepage without errors', async ({ page }) => {
    await navigateToPage(page, '/');
    await waitForPageLoad(page);

    // Check page title
    await expect(page).toHaveTitle(/FinSight AI Dashboard/);

    // Check main heading is visible
    await expect(page.locator('h1')).toBeVisible();

    // Check no console errors
    await expectNoConsoleErrors(page);
  });

  test('should display navigation elements', async ({ page }) => {
    await navigateToPage(page, '/');

    // Check navigation links are present
    const navLinks = page.locator('nav a');
    await expect(navLinks).toHaveCount(3, { timeout: 10000 }); // Login, Signup, etc.

    // Check for proper accessibility
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    await navigateToPage(page, '/');

    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content');

    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', 'width=device-width, initial-scale=1');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToPage(page, '/');

    // Check mobile menu button is visible
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]');
    await expect(mobileMenuButton).toBeVisible();

    // Check content is properly laid out
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should handle dark mode toggle if available', async ({ page }) => {
    await navigateToPage(page, '/');

    // Look for theme toggle button
    const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="Theme"]');
    
    if (await themeToggle.isVisible()) {
      // Click theme toggle
      await themeToggle.click();
      
      // Check if dark mode class is applied
      const htmlElement = page.locator('html');
      await expect(htmlElement).toHaveClass(/dark/);
    }
  });
});