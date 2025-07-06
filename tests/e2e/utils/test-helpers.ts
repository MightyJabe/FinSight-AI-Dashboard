import { Page, expect } from '@playwright/test';

/**
 * Test utilities for E2E testing
 */

/**
 * Mock user credentials for testing
 */
export const TEST_USER = {
  email: 'test@example.com',
  password: 'test123456',
  name: 'Test User',
};

/**
 * Navigate to a page and wait for it to load
 */
export async function navigateToPage(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for an element to be visible with timeout
 */
export async function waitForElement(page: Page, selector: string, timeout = 10000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Mock successful login state
 * Note: In a real test environment, you'd want to use proper authentication
 */
export async function mockAuthentication(page: Page) {
  // Mock Firebase Auth state
  await page.addInitScript(() => {
    // Mock Firebase user object
    const mockUser = {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      getIdToken: () => Promise.resolve('mock-token'),
    };

    // Mock Firebase auth methods
    (window as any).mockFirebaseUser = mockUser;

    // Mock local storage for session persistence
    localStorage.setItem(
      'firebase:authUser:test-api-key:[DEFAULT]',
      JSON.stringify({
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      })
    );
  });
}

/**
 * Wait for page to finish loading (no network activity)
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  // Also wait for any React hydration
  await page.waitForFunction(() => {
    return document.readyState === 'complete';
  });
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Check if element contains text
 */
export async function expectElementToContainText(page: Page, selector: string, text: string) {
  const element = page.locator(selector);
  await expect(element).toContainText(text);
}

/**
 * Check if page has no console errors
 */
export async function expectNoConsoleErrors(page: Page) {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Allow some time for any console errors to appear
  await page.waitForTimeout(1000);

  expect(errors).toHaveLength(0);
}

/**
 * Mock API responses for testing
 */
export async function mockAPIResponse(page: Page, route: string, response: any) {
  await page.route(route, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Mock Plaid Link for testing
 */
export async function mockPlaidLink(page: Page) {
  await page.addInitScript(() => {
    // Mock Plaid Link
    (window as any).Plaid = {
      create: (config: any) => ({
        open: () => {
          // Simulate successful Plaid connection
          if (config.onSuccess) {
            config.onSuccess('test-public-token', {
              institution: {
                name: 'Test Bank',
                institution_id: 'test_bank',
              },
              accounts: [
                {
                  id: 'test-account-id',
                  name: 'Test Checking',
                  type: 'depository',
                  subtype: 'checking',
                },
              ],
            });
          }
        },
        exit: () => {
          if (config.onExit) {
            config.onExit(null, {});
          }
        },
        submit: () => {
          // No-op for testing
        },
        destroy: () => {
          // No-op for testing
        },
      }),
    };
  });
}

/**
 * Wait for React component to render
 */
export async function waitForReactComponent(page: Page, testId: string) {
  await page.waitForSelector(`[data-testid="${testId}"]`, { state: 'visible' });
}

/**
 * Simulate user typing with realistic delays
 */
export async function typeWithDelay(page: Page, selector: string, text: string) {
  await page.fill(selector, '');
  await page.type(selector, text, { delay: 50 });
}
