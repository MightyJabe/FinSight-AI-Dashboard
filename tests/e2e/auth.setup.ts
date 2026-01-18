import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth', 'user.json');

// Test credentials - these should be set in environment variables
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'testpassword123';

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Fill in login form
  await page.fill('#email', TEST_EMAIL);
  await page.fill('#password', TEST_PASSWORD);

  // Click sign in button
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard (successful login)
  await page.waitForURL('/dashboard', { timeout: 10000 });

  // Verify we're authenticated by checking for dashboard elements
  await expect(page).toHaveURL('/dashboard');

  // Save signed-in state to 'user.json'
  await page.context().storageState({ path: authFile });
});
