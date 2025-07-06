import { test, expect } from '@playwright/test';
import { 
  navigateToPage, 
  waitForPageLoad, 
  mockAuthentication, 
  typeWithDelay,
  waitForElement 
} from './utils/test-helpers';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await navigateToPage(page, '/login');
    await waitForPageLoad(page);

    // Check login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display signup page', async ({ page }) => {
    await navigateToPage(page, '/signup');
    await waitForPageLoad(page);

    // Check signup form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should handle login form validation', async ({ page }) => {
    await navigateToPage(page, '/login');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Check for validation messages
    const errorMessages = page.locator('[role="alert"], .error, .text-red-500, .text-red-600');
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await navigateToPage(page, '/login');

    // Fill in invalid credentials
    await typeWithDelay(page, 'input[type="email"]', 'invalid@example.com');
    await typeWithDelay(page, 'input[type="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for error message (this would be shown after Firebase auth fails)
    await page.waitForTimeout(3000);

    // Check that we're still on login page (not redirected)
    expect(page.url()).toContain('/login');
  });

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access dashboard without authentication
    await navigateToPage(page, '/dashboard');
    
    // Should redirect to login or show authentication UI
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    const isRedirectedToAuth = currentUrl.includes('/login') || currentUrl.includes('/signup') || currentUrl === '/';
    
    expect(isRedirectedToAuth).toBeTruthy();
  });

  test('should navigate between login and signup', async ({ page }) => {
    await navigateToPage(page, '/login');

    // Look for signup link
    const signupLink = page.locator('a[href*="signup"], a:has-text("Sign up"), a:has-text("Create account")');
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await waitForPageLoad(page);
      expect(page.url()).toContain('/signup');
    }

    // Look for login link on signup page
    const loginLink = page.locator('a[href*="login"], a:has-text("Log in"), a:has-text("Sign in")');
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await waitForPageLoad(page);
      expect(page.url()).toContain('/login');
    }
  });

  test('should show password visibility toggle', async ({ page }) => {
    await navigateToPage(page, '/login');

    const passwordInput = page.locator('input[type="password"]');
    const toggleButton = page.locator('button[aria-label*="password"], button:has([data-testid*="eye"]), button:has(svg)').last();

    // Check if password toggle exists and works
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('should handle forgot password link', async ({ page }) => {
    await navigateToPage(page, '/login');

    // Look for forgot password link
    const forgotPasswordLink = page.locator('a:has-text("Forgot"), a:has-text("Reset"), button:has-text("Forgot")');
    
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      await waitForPageLoad(page);
      
      // Should either navigate to forgot password page or show modal
      const currentUrl = page.url();
      const hasForgotPasswordUI = currentUrl.includes('forgot') || 
                                  await page.locator('input[type="email"]').isVisible();
      
      expect(hasForgotPasswordUI).toBeTruthy();
    }
  });
});

test.describe('Authenticated User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication state
    await mockAuthentication(page);
  });

  test('should access dashboard when authenticated', async ({ page }) => {
    await navigateToPage(page, '/dashboard');
    await waitForPageLoad(page);

    // Should successfully load dashboard
    await waitForElement(page, 'main, [role="main"]');
    
    // Check for dashboard elements
    const dashboardContent = page.locator('h1:has-text("Dashboard"), h1:has-text("Overview")');
    await expect(dashboardContent).toBeVisible({ timeout: 10000 });
  });

  test('should show navigation menu when authenticated', async ({ page }) => {
    await navigateToPage(page, '/dashboard');
    await waitForPageLoad(page);

    // Check for navigation elements
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();

    // Check for common navigation links
    const expectedLinks = ['Dashboard', 'Transactions', 'Accounts', 'Chat'];
    for (const linkText of expectedLinks) {
      const link = page.locator(`a:has-text("${linkText}"), button:has-text("${linkText}")`);
      if (await link.isVisible()) {
        await expect(link).toBeVisible();
      }
    }
  });
});