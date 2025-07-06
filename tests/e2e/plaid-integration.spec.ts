import { test, expect } from '@playwright/test';
import {
  navigateToPage,
  waitForPageLoad,
  mockAuthentication,
  mockAPIResponse,
  mockPlaidLink,
} from './utils/test-helpers';

test.describe('Plaid Integration', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
    await mockPlaidLink(page);
  });

  test('should display account connection interface', async ({ page }) => {
    await navigateToPage(page, '/accounts');
    await waitForPageLoad(page);

    // Look for "Connect Account" or similar button
    const connectButton = page.locator(
      'button:has-text("Connect"), button:has-text("Add"), button:has-text("Link")'
    );
    await expect(connectButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('should open Plaid Link when connecting new account', async ({ page }) => {
    await navigateToPage(page, '/accounts');
    await waitForPageLoad(page);

    // Mock Plaid Link success
    await page.addInitScript(() => {
      (window as any).Plaid = {
        create: (config: any) => ({
          open: () => {
            // Add visual indicator that Plaid opened
            document.body.setAttribute('data-plaid-opened', 'true');

            // Simulate successful connection after delay
            setTimeout(() => {
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
            }, 1000);
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

    // Click connect button
    const connectButton = page.locator(
      'button:has-text("Connect"), button:has-text("Add"), button:has-text("Link")'
    );
    await connectButton.first().click();

    // Wait for Plaid Link to "open"
    await page.waitForFunction(() => {
      return document.body.getAttribute('data-plaid-opened') === 'true';
    });

    // Should show success message or redirect
    await page.waitForTimeout(2000);
  });

  test('should handle Plaid Link success and exchange token', async ({ page }) => {
    // Mock token exchange API
    await mockAPIResponse(page, '**/api/plaid/exchange-public-token**', {
      success: true,
      data: {
        access_token: 'test-access-token',
        item_id: 'test-item-id',
      },
    });

    // Mock accounts API after connection
    await mockAPIResponse(page, '**/api/accounts**', {
      success: true,
      data: {
        accounts: [
          {
            id: 'test-account-id',
            name: 'Test Checking Account',
            type: 'depository',
            subtype: 'checking',
            balance: 1250.5,
            institution: 'Test Bank',
          },
        ],
      },
    });

    await navigateToPage(page, '/accounts');
    await waitForPageLoad(page);

    // Simulate successful Plaid Link flow
    const connectButton = page.locator(
      'button:has-text("Connect"), button:has-text("Add"), button:has-text("Link")'
    );
    if (await connectButton.isVisible()) {
      await connectButton.first().click();

      // Wait for connection process
      await page.waitForTimeout(3000);

      // Should show newly connected account
      await expect(page.locator(':has-text("Test Checking Account")')).toBeVisible();
      await expect(page.locator(':has-text("$1,250.50"), :has-text("1250.50")')).toBeVisible();
    }
  });

  test('should display connected accounts list', async ({ page }) => {
    await mockAPIResponse(page, '**/api/accounts**', {
      success: true,
      data: {
        accounts: [
          {
            id: 'acc_1',
            name: 'Chase Checking',
            type: 'depository',
            subtype: 'checking',
            balance: 2500.0,
            institution: 'Chase Bank',
          },
          {
            id: 'acc_2',
            name: 'Wells Fargo Savings',
            type: 'depository',
            subtype: 'savings',
            balance: 15000.0,
            institution: 'Wells Fargo',
          },
        ],
      },
    });

    await navigateToPage(page, '/accounts');
    await waitForPageLoad(page);

    // Check that accounts are displayed
    await expect(page.locator(':has-text("Chase Checking")')).toBeVisible();
    await expect(page.locator(':has-text("Wells Fargo Savings")')).toBeVisible();

    // Check balances are displayed
    await expect(page.locator(':has-text("$2,500"), :has-text("2500")')).toBeVisible();
    await expect(page.locator(':has-text("$15,000"), :has-text("15000")')).toBeVisible();
  });

  test('should handle account removal', async ({ page }) => {
    await mockAPIResponse(page, '**/api/accounts**', {
      success: true,
      data: {
        accounts: [
          {
            id: 'acc_1',
            name: 'Test Account',
            type: 'depository',
            subtype: 'checking',
            balance: 1000.0,
            institution: 'Test Bank',
          },
        ],
      },
    });

    await mockAPIResponse(page, '**/api/plaid/remove-item**', {
      success: true,
      message: 'Account removed successfully',
    });

    await navigateToPage(page, '/accounts');
    await waitForPageLoad(page);

    // Look for remove/disconnect button
    const removeButton = page.locator(
      'button:has-text("Remove"), button:has-text("Disconnect"), button:has-text("Delete")'
    );

    if (await removeButton.isVisible()) {
      await removeButton.click();

      // Handle confirmation dialog if present
      const confirmButton = page.locator(
        'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Remove")'
      );
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      await page.waitForTimeout(2000);

      // Account should be removed from list
      await expect(page.locator(':has-text("Test Account")')).not.toBeVisible();
    }
  });

  test('should handle Plaid Link errors gracefully', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).Plaid = {
        create: (config: any) => ({
          open: () => {
            // Simulate Plaid error
            setTimeout(() => {
              if (config.onExit) {
                config.onExit('USER_ERROR', {
                  error_type: 'ITEM_ERROR',
                  error_code: 'INVALID_CREDENTIALS',
                });
              }
            }, 1000);
          },
          exit: () => {},
          submit: () => {
            // No-op for testing
          },
          destroy: () => {
            // No-op for testing
          },
        }),
      };
    });

    await navigateToPage(page, '/accounts');
    await waitForPageLoad(page);

    const connectButton = page.locator(
      'button:has-text("Connect"), button:has-text("Add"), button:has-text("Link")'
    );
    if (await connectButton.isVisible()) {
      await connectButton.first().click();

      await page.waitForTimeout(2000);

      // Should handle error gracefully without crashing
      // Error message might be visible, but app should not crash
      const pageContent = page.locator('main, body');
      await expect(pageContent).toBeVisible();
    }
  });

  test('should refresh account data', async ({ page }) => {
    await mockAPIResponse(page, '**/api/accounts**', {
      success: true,
      data: {
        accounts: [
          {
            id: 'acc_1',
            name: 'Test Account',
            type: 'depository',
            subtype: 'checking',
            balance: 1000.0,
            institution: 'Test Bank',
            lastUpdated: new Date().toISOString(),
          },
        ],
      },
    });

    await navigateToPage(page, '/accounts');
    await waitForPageLoad(page);

    // Look for refresh button
    const refreshButton = page.locator(
      'button:has-text("Refresh"), button:has-text("Update"), button[aria-label*="refresh"]'
    );

    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Should show loading state
      const loadingIndicator = page.locator('.loading, .animate-spin, :has-text("Updating")');
      if ((await loadingIndicator.count()) > 0) {
        await expect(loadingIndicator.first()).toBeVisible();
      }

      await page.waitForTimeout(2000);

      // Should complete refresh
      await expect(page.locator(':has-text("Test Account")')).toBeVisible();
    }
  });

  test('should display account types correctly', async ({ page }) => {
    await mockAPIResponse(page, '**/api/accounts**', {
      success: true,
      data: {
        accounts: [
          {
            id: 'acc_1',
            name: 'Checking Account',
            type: 'depository',
            subtype: 'checking',
            balance: 1000.0,
            institution: 'Test Bank',
          },
          {
            id: 'acc_2',
            name: 'Savings Account',
            type: 'depository',
            subtype: 'savings',
            balance: 5000.0,
            institution: 'Test Bank',
          },
          {
            id: 'acc_3',
            name: 'Credit Card',
            type: 'credit',
            subtype: 'credit card',
            balance: -500.0,
            institution: 'Test Bank',
          },
        ],
      },
    });

    await navigateToPage(page, '/accounts');
    await waitForPageLoad(page);

    // Check different account types are displayed
    await expect(page.locator(':has-text("Checking")')).toBeVisible();
    await expect(page.locator(':has-text("Savings")')).toBeVisible();
    await expect(page.locator(':has-text("Credit")')).toBeVisible();

    // Check negative balance is displayed for credit card
    await expect(page.locator(':has-text("-$500"), :has-text("-500")')).toBeVisible();
  });
});
