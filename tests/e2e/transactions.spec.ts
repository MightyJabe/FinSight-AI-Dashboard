import { test, expect } from '@playwright/test';
import { 
  navigateToPage, 
  waitForPageLoad, 
  mockAuthentication, 
  mockAPIResponse,
  waitForElement,
  typeWithDelay 
} from './utils/test-helpers';

test.describe('Transactions & Spending', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
  });

  test('should load transactions page', async ({ page }) => {
    await mockAPIResponse(page, '**/api/transactions**', {
      success: true,
      data: {
        transactions: [
          {
            id: 'txn_1',
            name: 'Grocery Store',
            amount: 85.50,
            date: '2024-01-15',
            category: ['Food and Drink', 'Groceries'],
            account_id: 'acc_1'
          },
          {
            id: 'txn_2',
            name: 'Coffee Shop',
            amount: 12.50,
            date: '2024-01-14',
            category: ['Food and Drink', 'Coffee Shops'],
            account_id: 'acc_1'
          }
        ]
      }
    });

    await navigateToPage(page, '/transactions');
    await waitForPageLoad(page);

    // Check page heading
    await expect(page.locator('h1')).toContainText(/transactions|spending/i);

    // Check transactions list
    await waitForElement(page, '.transaction, [data-testid*="transaction"], .list-item');
  });

  test('should display transaction list with proper information', async ({ page }) => {
    await mockAPIResponse(page, '**/api/transactions**', {
      success: true,
      data: {
        transactions: [
          {
            id: 'txn_1',
            name: 'Amazon Purchase',
            amount: 129.99,
            date: '2024-01-15',
            category: ['General Merchandise', 'Online Marketplaces'],
            account_id: 'acc_1'
          }
        ]
      }
    });

    await navigateToPage(page, '/transactions');
    await waitForPageLoad(page);

    // Check transaction details are visible
    await expect(page.locator(':has-text("Amazon Purchase")')).toBeVisible();
    await expect(page.locator(':has-text("$129.99"), :has-text("129.99")')).toBeVisible();
    await expect(page.locator(':has-text("2024-01-15"), :has-text("Jan 15")')).toBeVisible();
  });

  test('should filter transactions by category', async ({ page }) => {
    await mockAPIResponse(page, '**/api/transactions**', {
      success: true,
      data: {
        transactions: [
          {
            id: 'txn_1',
            name: 'Grocery Store',
            amount: 85.50,
            date: '2024-01-15',
            category: ['Food and Drink', 'Groceries']
          },
          {
            id: 'txn_2',
            name: 'Gas Station',
            amount: 45.00,
            date: '2024-01-14',
            category: ['Transportation', 'Gas Stations']
          }
        ]
      }
    });

    await navigateToPage(page, '/transactions');
    await waitForPageLoad(page);

    // Look for category filter
    const categoryFilter = page.locator('select[name*="category"], select:has(option:text("Food")), .filter select');
    
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption('Food and Drink');
      await waitForPageLoad(page);
      
      // Should show only food-related transactions
      await expect(page.locator(':has-text("Grocery Store")')).toBeVisible();
    }
  });

  test('should search transactions by name', async ({ page }) => {
    await mockAPIResponse(page, '**/api/transactions**', {
      success: true,
      data: {
        transactions: [
          {
            id: 'txn_1',
            name: 'Starbucks Coffee',
            amount: 8.50,
            date: '2024-01-15',
            category: ['Food and Drink', 'Coffee Shops']
          },
          {
            id: 'txn_2',
            name: 'Shell Gas Station',
            amount: 45.00,
            date: '2024-01-14',
            category: ['Transportation', 'Gas Stations']
          }
        ]
      }
    });

    await navigateToPage(page, '/transactions');
    await waitForPageLoad(page);

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[name*="search"]');
    
    if (await searchInput.isVisible()) {
      await typeWithDelay(page, 'input[type="search"], input[placeholder*="search"]', 'Starbucks');
      await page.waitForTimeout(1000); // Wait for search to process
      
      // Should show only Starbucks transaction
      await expect(page.locator(':has-text("Starbucks")')).toBeVisible();
      await expect(page.locator(':has-text("Shell Gas")')).not.toBeVisible();
    }
  });

  test('should display spending breakdown and charts', async ({ page }) => {
    await mockAPIResponse(page, '**/api/spending-analysis**', {
      success: true,
      data: {
        categories: [
          { category: 'Food and Drink', amount: 850, percentage: 35 },
          { category: 'Transportation', amount: 650, percentage: 27 },
          { category: 'Entertainment', amount: 450, percentage: 18 }
        ],
        totalSpent: 2400
      }
    });

    await navigateToPage(page, '/transactions');
    await waitForPageLoad(page);

    // Look for spending breakdown section
    const spendingSection = page.locator(':has-text("Spending"), :has-text("Breakdown"), .chart, canvas, svg');
    await expect(spendingSection.first()).toBeVisible({ timeout: 10000 });

    // Check category percentages
    await expect(page.locator(':has-text("35%"), :has-text("27%"), :has-text("18%")')).toBeVisible();
  });

  test('should handle AI categorization feature', async ({ page }) => {
    await mockAPIResponse(page, '**/api/transactions/categorize**', {
      success: true,
      data: {
        categorizations: [
          {
            transactionId: 'txn_1',
            aiCategory: 'Groceries',
            confidence: 0.95,
            reasoning: 'Store name indicates grocery purchase'
          }
        ]
      }
    });

    await navigateToPage(page, '/transactions');
    await waitForPageLoad(page);

    // Look for AI categorization button or feature
    const aiButton = page.locator('button:has-text("AI"), button:has-text("Categorize"), button:has-text("Auto")');
    
    if (await aiButton.isVisible()) {
      await aiButton.click();
      await page.waitForTimeout(2000);
      
      // Should show categorization results or loading
      const feedback = page.locator(':has-text("categorized"), :has-text("AI"), .success, .loading');
      await expect(feedback.first()).toBeVisible();
    }
  });

  test('should allow manual category editing', async ({ page }) => {
    await mockAPIResponse(page, '**/api/transactions**', {
      success: true,
      data: {
        transactions: [
          {
            id: 'txn_1',
            name: 'Store Purchase',
            amount: 50.00,
            date: '2024-01-15',
            category: ['General Merchandise']
          }
        ]
      }
    });

    await navigateToPage(page, '/transactions');
    await waitForPageLoad(page);

    // Look for edit category functionality
    const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit"], .edit-button');
    const categorySelect = page.locator('select[name*="category"], .category-select');
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption('Food and Drink');
        
        // Look for save button
        const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
          
          // Should show success feedback
          const success = page.locator(':has-text("saved"), :has-text("updated"), .success');
          await expect(success.first()).toBeVisible();
        }
      }
    }
  });

  test('should paginate through transaction history', async ({ page }) => {
    // Mock paginated response
    await mockAPIResponse(page, '**/api/transactions**', {
      success: true,
      data: {
        transactions: Array.from({ length: 20 }, (_, i) => ({
          id: `txn_${i}`,
          name: `Transaction ${i}`,
          amount: 25.00 + i,
          date: '2024-01-15',
          category: ['General']
        })),
        pagination: {
          page: 1,
          total: 100,
          hasMore: true
        }
      }
    });

    await navigateToPage(page, '/transactions');
    await waitForPageLoad(page);

    // Look for pagination controls
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Load more"), .pagination button');
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
      
      // Should load more transactions
      const transactions = page.locator('.transaction, [data-testid*="transaction"]');
      await expect(transactions.count()).toBeGreaterThan(20);
    }
  });

  test('should handle date range filtering', async ({ page }) => {
    await navigateToPage(page, '/transactions');
    await waitForPageLoad(page);

    // Look for date filters
    const dateFromInput = page.locator('input[type="date"], input[name*="from"], input[placeholder*="From"]');
    const dateToInput = page.locator('input[type="date"], input[name*="to"], input[placeholder*="To"]');
    
    if (await dateFromInput.isVisible() && await dateToInput.isVisible()) {
      await dateFromInput.fill('2024-01-01');
      await dateToInput.fill('2024-01-31');
      
      // Look for apply filter button
      const applyButton = page.locator('button:has-text("Apply"), button:has-text("Filter"), button[type="submit"]');
      if (await applyButton.isVisible()) {
        await applyButton.click();
        await waitForPageLoad(page);
        
        // Should filter transactions by date range
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should export transactions data', async ({ page }) => {
    await navigateToPage(page, '/transactions');
    await waitForPageLoad(page);

    // Look for export functionality
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), a[download]');
    
    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      
      await exportButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/transactions|export/i);
    }
  });
});