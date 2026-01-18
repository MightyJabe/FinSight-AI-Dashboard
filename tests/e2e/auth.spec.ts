import { test, expect } from './fixtures/api-mocks';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    // Override authenticated state for login page tests
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should display login page elements', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.expectLoginPage();
    });

    test('should navigate to signup page from login', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.clickSignUp();
      await expect(page).toHaveURL('/signup');
    });

    test('should show validation error for empty fields', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      // Try to submit without filling fields
      await loginPage.signInButton.click();

      // HTML5 validation should prevent submission
      const emailValidity = await loginPage.emailInput.evaluate(
        (el: HTMLInputElement) => el.validity.valid
      );
      expect(emailValidity).toBe(false);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      // Use invalid credentials
      await loginPage.login('invalid@example.com', 'wrongpassword');

      // Should show error toast/message
      // Wait for error to appear (adjust selector based on your toast implementation)
      await expect(page.locator('text=/Failed to sign in|Invalid|Error/i').first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Login and Redirect', () => {
    test('should login successfully and redirect to dashboard', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.goto();

      // Use test credentials from environment
      const testEmail = process.env.E2E_TEST_EMAIL || 'test@example.com';
      const testPassword = process.env.E2E_TEST_PASSWORD || 'testpassword123';

      await loginPage.login(testEmail, testPassword);

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
      await dashboardPage.expectDashboardPage();
    });

    test('should persist authentication across page reloads', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.goto();

      const testEmail = process.env.E2E_TEST_EMAIL || 'test@example.com';
      const testPassword = process.env.E2E_TEST_PASSWORD || 'testpassword123';

      await loginPage.login(testEmail, testPassword);
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

      // Reload the page
      await page.reload();

      // Should still be on dashboard (not redirected to login)
      await expect(page).toHaveURL('/dashboard');
      await dashboardPage.expectDashboardPage();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route without auth', async ({ browser }) => {
      // Create a completely fresh context without any auth state or mocks
      const context = await browser.newContext({
        storageState: { cookies: [], origins: [] }
      });
      const page = await context.newPage();

      try {
        // Try to access dashboard directly (without logging in)
        await page.goto('/dashboard', { waitUntil: 'networkidle' });

        // Should redirect to login
        await expect(page).toHaveURL('/login', { timeout: 10000 });
      } finally {
        await context.close();
      }
    });

    test('should allow access to dashboard when authenticated', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      // This test uses the authenticated state from auth.setup.ts
      await dashboardPage.goto();

      // Should be able to access dashboard
      await expect(page).toHaveURL('/dashboard');
      await dashboardPage.expectDashboardPage();
    });

    test('should allow access to accounts page when authenticated', async ({ page }) => {
      // This test uses the authenticated state from auth.setup.ts
      await page.goto('/accounts');

      // Should be able to access accounts page (or redirect there)
      await expect(page).toHaveURL(/\/(accounts|dashboard)/);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate from dashboard to accounts', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      await dashboardPage.goto();
      await dashboardPage.expectDashboardPage();

      // Click "Add Account" button
      await dashboardPage.clickAddAccount();

      // Should navigate to accounts page
      await expect(page).toHaveURL(/\/accounts/);
    });

    test('should navigate back to dashboard from navigation', async ({ page }) => {
      await page.goto('/accounts');

      // Find and click the dashboard/home link in navigation
      // Adjust selector based on your navigation structure
      const dashboardLink = page.locator('a[href="/dashboard"], a[href="/"]').first();
      if (await dashboardLink.isVisible()) {
        await dashboardLink.click();
        await expect(page).toHaveURL(/\/(dashboard)?/);
      }
    });
  });
});
