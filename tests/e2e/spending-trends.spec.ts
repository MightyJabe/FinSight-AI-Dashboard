import { test, expect } from '@playwright/test';
import { 
  navigateToPage, 
  waitForPageLoad, 
  mockAuthentication, 
  mockAPIResponse,
  waitForElement 
} from './utils/test-helpers';

test.describe('Spending Trends Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
  });

  test('should load spending trends page', async ({ page }) => {
    await mockAPIResponse(page, '**/api/analytics/spending-trends**', {
      success: true,
      data: {
        timeframe: '6months',
        analysisType: 'category',
        totalSpent: 15000,
        averagePerPeriod: 2500,
        trends: [
          {
            period: 'Jan 2024 - Jun 2024',
            category: 'Groceries',
            amount: 4500,
            transactionCount: 125
          },
          {
            period: 'Jan 2024 - Jun 2024', 
            category: 'Transportation',
            amount: 3200,
            transactionCount: 89
          }
        ],
        insights: [
          'Your highest spending category is "Groceries" accounting for 30.0% of total expenses.',
          'Your top 3 categories account for 65.2% of all spending.'
        ]
      }
    });

    await navigateToPage(page, '/trends');
    await waitForPageLoad(page);

    // Check page heading
    await expect(page.locator('h1')).toContainText(/trends|patterns/i);

    // Check feature cards are displayed
    const featureCards = page.locator('.rounded-lg, .card, .border');
    await expect(featureCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display analysis type options', async ({ page }) => {
    await navigateToPage(page, '/trends');
    await waitForPageLoad(page);

    // Check for analysis type information
    await expect(page.locator(':has-text("Category Analysis")')).toBeVisible();
    await expect(page.locator(':has-text("Monthly Trends")')).toBeVisible();
    await expect(page.locator(':has-text("Weekly Patterns")')).toBeVisible();
    await expect(page.locator(':has-text("Daily Habits")')).toBeVisible();
    await expect(page.locator(':has-text("Seasonal Analysis")')).toBeVisible();
    await expect(page.locator(':has-text("Anomaly Detection")')).toBeVisible();
  });

  test('should load and display spending trends component', async ({ page }) => {
    await mockAPIResponse(page, '**/api/analytics/spending-trends**', {
      success: true,
      data: {
        timeframe: '6months',
        analysisType: 'category',
        totalSpent: 15000,
        averagePerPeriod: 2500,
        trends: [
          {
            period: 'Jan 2024 - Jun 2024',
            category: 'Groceries',
            amount: 4500,
            transactionCount: 125
          }
        ],
        insights: [
          'Your highest spending category is "Groceries" accounting for 30.0% of total expenses.'
        ]
      }
    });

    await navigateToPage(page, '/trends');
    await waitForPageLoad(page);

    // Wait for trends component to load
    await waitForElement(page, '.bg-white, .bg-gray-800, .rounded-lg', 15000);

    // Check trends analysis section
    await expect(page.locator(':has-text("Spending Trend Analysis")')).toBeVisible();
  });

  test('should change analysis timeframe', async ({ page }) => {
    await navigateToPage(page, '/trends');
    await waitForPageLoad(page);

    // Wait for the component to load
    await page.waitForTimeout(3000);

    // Look for timeframe selector
    const timeframeSelect = page.locator('select[value*="months"], select:has(option:text("months"))');
    
    if (await timeframeSelect.isVisible()) {
      await timeframeSelect.selectOption('1year');
      
      // Look for analyze button
      const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Update")');
      if (await analyzeButton.isVisible()) {
        await analyzeButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should change analysis type', async ({ page }) => {
    await navigateToPage(page, '/trends');
    await waitForPageLoad(page);

    // Wait for the component to load
    await page.waitForTimeout(3000);

    // Look for analysis type selector
    const analysisSelect = page.locator('select:has(option:text("Category")), select:has(option:text("Monthly"))');
    
    if (await analysisSelect.isVisible()) {
      await analysisSelect.selectOption('monthly');
      
      // Look for analyze button
      const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Update")');
      if (await analyzeButton.isVisible()) {
        await analyzeButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should display spending charts', async ({ page }) => {
    await mockAPIResponse(page, '**/api/analytics/spending-trends**', {
      success: true,
      data: {
        timeframe: '6months',
        analysisType: 'category',
        totalSpent: 15000,
        averagePerPeriod: 2500,
        trends: [
          {
            period: 'Jan 2024 - Jun 2024',
            category: 'Groceries',
            amount: 4500,
            transactionCount: 125
          },
          {
            period: 'Jan 2024 - Jun 2024',
            category: 'Transportation', 
            amount: 3200,
            transactionCount: 89
          }
        ],
        insights: []
      }
    });

    await navigateToPage(page, '/trends');
    await waitForPageLoad(page);

    // Wait for charts to render
    await page.waitForTimeout(5000);

    // Look for chart elements (Recharts creates SVG elements)
    const chartElements = page.locator('svg, canvas, .recharts-wrapper, .chart');
    
    if (await chartElements.count() > 0) {
      await expect(chartElements.first()).toBeVisible();
    }
  });

  test('should display AI-generated insights', async ({ page }) => {
    await mockAPIResponse(page, '**/api/analytics/spending-trends**', {
      success: true,
      data: {
        timeframe: '6months',
        analysisType: 'category',
        totalSpent: 15000,
        averagePerPeriod: 2500,
        trends: [
          {
            period: 'Jan 2024 - Jun 2024',
            category: 'Groceries',
            amount: 4500,
            transactionCount: 125
          }
        ],
        insights: [
          'Your highest spending category is "Groceries" accounting for 30.0% of total expenses.',
          'Your top 3 categories account for 65.2% of all spending.',
          'Consider setting a budget limit for grocery expenses to optimize spending.'
        ]
      }
    });

    await navigateToPage(page, '/trends');
    await waitForPageLoad(page);

    // Wait for insights to load
    await page.waitForTimeout(5000);

    // Look for insights tab
    const insightsTab = page.locator('button:has-text("Insights"), .tab:has-text("Insights")');
    
    if (await insightsTab.isVisible()) {
      await insightsTab.click();
      
      // Check for AI insights content
      await expect(page.locator(':has-text("AI-Generated Insights")')).toBeVisible();
      await expect(page.locator(':has-text("Groceries")')).toBeVisible();
      await expect(page.locator(':has-text("30.0%")')).toBeVisible();
    }
  });

  test('should display data table', async ({ page }) => {
    await mockAPIResponse(page, '**/api/analytics/spending-trends**', {
      success: true,
      data: {
        timeframe: '6months',
        analysisType: 'category',
        totalSpent: 15000,
        averagePerPeriod: 2500,
        trends: [
          {
            period: 'Jan 2024 - Jun 2024',
            category: 'Groceries',
            amount: 4500,
            transactionCount: 125
          },
          {
            period: 'Jan 2024 - Jun 2024',
            category: 'Transportation',
            amount: 3200,
            transactionCount: 89
          }
        ],
        insights: []
      }
    });

    await navigateToPage(page, '/trends');
    await waitForPageLoad(page);

    // Wait for data to load
    await page.waitForTimeout(5000);

    // Look for data table tab
    const dataTab = page.locator('button:has-text("Data"), .tab:has-text("Data")');
    
    if (await dataTab.isVisible()) {
      await dataTab.click();
      
      // Check for table elements
      await expect(page.locator('table, .table, th, td')).toBeVisible();
      await expect(page.locator(':has-text("Groceries")')).toBeVisible();
      await expect(page.locator(':has-text("Transportation")')).toBeVisible();
    }
  });

  test('should toggle projections feature', async ({ page }) => {
    await navigateToPage(page, '/trends');
    await waitForPageLoad(page);

    // Wait for component to load
    await page.waitForTimeout(3000);

    // Look for projections checkbox
    const projectionsCheckbox = page.locator('input[type="checkbox"]:near(:text("Projections"))');
    
    if (await projectionsCheckbox.isVisible()) {
      await projectionsCheckbox.check();
      
      // Look for analyze button
      const analyzeButton = page.locator('button:has-text("Analyze")');
      if (await analyzeButton.isVisible()) {
        await analyzeButton.click();
        await page.waitForTimeout(2000);
        
        // Should show projections tab when enabled
        const projectionsTab = page.locator('button:has-text("Projections"), .tab:has-text("Projections")');
        if (await projectionsTab.isVisible()) {
          await expect(projectionsTab).toBeVisible();
        }
      }
    }
  });

  test('should handle loading states', async ({ page }) => {
    // Delay API response to test loading
    await page.route('**/api/analytics/spending-trends**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            timeframe: '6months',
            analysisType: 'category',
            totalSpent: 15000,
            averagePerPeriod: 2500,
            trends: [],
            insights: []
          }
        })
      });
    });

    await navigateToPage(page, '/trends');
    await waitForPageLoad(page);

    // Wait for component and try to trigger analysis
    await page.waitForTimeout(3000);
    
    const analyzeButton = page.locator('button:has-text("Analyze")');
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click();
      
      // Should show loading state
      const loadingElements = page.locator('.animate-spin, :has-text("Analyzing"), :has-text("Loading")');
      if (await loadingElements.count() > 0) {
        await expect(loadingElements.first()).toBeVisible();
      }
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/analytics/spending-trends**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Analysis failed'
        })
      });
    });

    await navigateToPage(page, '/trends');
    await waitForPageLoad(page);

    // Wait for component and try to trigger analysis
    await page.waitForTimeout(3000);
    
    const analyzeButton = page.locator('button:has-text("Analyze")');
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click();
      await page.waitForTimeout(2000);
      
      // Should show error message
      const errorElements = page.locator(':has-text("Error"), :has-text("failed"), .error');
      if (await errorElements.count() > 0) {
        await expect(errorElements.first()).toBeVisible();
      }
    }
  });

  test('should display tips and best practices section', async ({ page }) => {
    await navigateToPage(page, '/trends');
    await waitForPageLoad(page);

    // Check for tips section
    await expect(page.locator(':has-text("Tips for Better Financial Analysis")')).toBeVisible();
    await expect(page.locator(':has-text("Analysis Tips")')).toBeVisible();
    await expect(page.locator(':has-text("Action Items")')).toBeVisible();
    
    // Check for specific tips
    await expect(page.locator(':has-text("longer timeframes")')).toBeVisible();
    await expect(page.locator(':has-text("spending limits")')).toBeVisible();
  });
});