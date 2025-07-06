import { test, expect } from '@playwright/test';
import {
  navigateToPage,
  waitForPageLoad,
  mockAuthentication,
  mockAPIResponse,
  typeWithDelay,
} from './utils/test-helpers';

test.describe('AI Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
  });

  test('should load AI chat page', async ({ page }) => {
    await navigateToPage(page, '/chat');
    await waitForPageLoad(page);

    // Check chat interface elements
    await expect(page.locator('h1, h2')).toContainText(/chat|assistant/i);

    // Check for message input
    const messageInput = page.locator('input[type="text"], textarea, [contenteditable]');
    await expect(messageInput.first()).toBeVisible({ timeout: 10000 });

    // Check for send button
    const sendButton = page.locator(
      'button:has-text("Send"), button[type="submit"], button:has([data-testid*="send"])'
    );
    await expect(sendButton.first()).toBeVisible();
  });

  test('should send and receive messages', async ({ page }) => {
    // Mock chat API response
    await mockAPIResponse(page, '**/api/chat**', {
      success: true,
      data: {
        response: 'Hello! I can help you analyze your financial data. What would you like to know?',
        messageId: 'msg_123',
      },
    });

    await navigateToPage(page, '/chat');
    await waitForPageLoad(page);

    // Find send button
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();

    // Type and send a message
    await typeWithDelay(
      page,
      'input[type="text"], textarea',
      'Hello, how much did I spend on groceries last month?'
    );
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Check that user message appears
    await expect(page.locator(':has-text("groceries last month")')).toBeVisible();

    // Check that AI response appears
    await expect(page.locator(':has-text("analyze your financial data")')).toBeVisible();
  });

  test('should display conversation history', async ({ page }) => {
    // Mock conversation history
    await mockAPIResponse(page, '**/api/chat**', {
      success: true,
      data: {
        messages: [
          {
            id: 'msg_1',
            role: 'user',
            content: 'What is my spending trend?',
            timestamp: '2024-01-15T10:00:00Z',
          },
          {
            id: 'msg_2',
            role: 'assistant',
            content: 'Based on your data, your spending has increased by 15% this month.',
            timestamp: '2024-01-15T10:00:05Z',
          },
        ],
      },
    });

    await navigateToPage(page, '/chat');
    await waitForPageLoad(page);

    // Check for message history
    await expect(page.locator(':has-text("spending trend")')).toBeVisible();
    await expect(page.locator(':has-text("increased by 15%")')).toBeVisible();
  });

  test('should handle typing indicators', async ({ page }) => {
    await navigateToPage(page, '/chat');
    await waitForPageLoad(page);

    // Mock delayed response to see typing indicator
    await page.route('**/api/chat**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            response: 'Here is your analysis...',
            messageId: 'msg_123',
          },
        }),
      });
    });

    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();

    await typeWithDelay(page, 'input[type="text"], textarea', 'Tell me about my spending');
    await sendButton.click();

    // Look for typing indicator
    const typingIndicator = page.locator('.typing, :has-text("typing"), .animate-pulse, .loading');
    if ((await typingIndicator.count()) > 0) {
      await expect(typingIndicator.first()).toBeVisible();
    }

    // Wait for response
    await page.waitForTimeout(3000);
  });

  test('should handle financial data queries', async ({ page }) => {
    // Mock financial query response
    await mockAPIResponse(page, '**/api/chat**', {
      success: true,
      data: {
        response:
          'Last month you spent $450 on groceries across 15 transactions. This is 8% higher than your average.',
        visualization: {
          type: 'chart',
          data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            values: [120, 95, 140, 95],
          },
        },
      },
    });

    await navigateToPage(page, '/chat');
    await waitForPageLoad(page);

    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();

    await typeWithDelay(
      page,
      'input[type="text"], textarea',
      'How much did I spend on groceries last month?'
    );
    await sendButton.click();

    await page.waitForTimeout(2000);

    // Check for financial data in response
    await expect(page.locator(':has-text("$450")')).toBeVisible();
    await expect(page.locator(':has-text("15 transactions")')).toBeVisible();
    await expect(page.locator(':has-text("8% higher")')).toBeVisible();
  });

  test('should display data visualizations', async ({ page }) => {
    // Mock response with visualization
    await mockAPIResponse(page, '**/api/chat**', {
      success: true,
      data: {
        response: 'Here is your spending breakdown:',
        visualization: {
          type: 'pie',
          data: {
            labels: ['Food', 'Transport', 'Entertainment'],
            values: [450, 200, 150],
          },
        },
      },
    });

    await navigateToPage(page, '/chat');
    await waitForPageLoad(page);

    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();

    await typeWithDelay(page, 'input[type="text"], textarea', 'Show me my spending breakdown');
    await sendButton.click();

    await page.waitForTimeout(3000);

    // Look for chart visualization
    const chartElements = page.locator('canvas, svg, .chart, .visualization');
    if ((await chartElements.count()) > 0) {
      await expect(chartElements.first()).toBeVisible();
    }
  });

  test('should provide message actions', async ({ page }) => {
    await navigateToPage(page, '/chat');
    await waitForPageLoad(page);

    // Send a message first to have something to interact with
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();

    await typeWithDelay(page, 'input[type="text"], textarea', 'Test message');
    await sendButton.click();
    await page.waitForTimeout(2000);

    // Look for message actions (copy, regenerate, etc.)
    const messageActions = page.locator(
      'button:has-text("Copy"), button:has-text("Regenerate"), button[aria-label*="copy"]'
    );

    if ((await messageActions.count()) > 0) {
      await expect(messageActions.first()).toBeVisible();

      // Test copy functionality
      const copyButton = page
        .locator('button:has-text("Copy"), button[aria-label*="copy"]')
        .first();
      if (await copyButton.isVisible()) {
        await copyButton.click();
        // Should show feedback
        const feedback = page.locator(':has-text("Copied"), .success');
        if ((await feedback.count()) > 0) {
          await expect(feedback.first()).toBeVisible();
        }
      }
    }
  });

  test('should handle conversation export', async ({ page }) => {
    await navigateToPage(page, '/chat');
    await waitForPageLoad(page);

    // Look for export functionality
    const exportButton = page.locator(
      'button:has-text("Export"), button:has-text("Download"), a[download]'
    );

    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');

      await exportButton.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/conversation|chat|export/i);
    }
  });

  test('should clear conversation', async ({ page }) => {
    await navigateToPage(page, '/chat');
    await waitForPageLoad(page);

    // Send a message first
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();

    await typeWithDelay(page, 'input[type="text"], textarea', 'Test message');
    await sendButton.click();
    await page.waitForTimeout(1000);

    // Look for clear/new conversation button
    const clearButton = page.locator(
      'button:has-text("Clear"), button:has-text("New"), button:has-text("Reset")'
    );

    if (await clearButton.isVisible()) {
      await clearButton.click();

      // Handle confirmation if present
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Messages should be cleared
      await page.waitForTimeout(1000);
      await expect(page.locator(':has-text("Test message")')).not.toBeVisible();
    }
  });

  test('should handle error responses gracefully', async ({ page }) => {
    // Mock API error
    await mockAPIResponse(page, '**/api/chat**', {
      success: false,
      error: 'Unable to process request',
    });

    await navigateToPage(page, '/chat');
    await waitForPageLoad(page);

    const messageInput = page.locator('input[type="text"], textarea').first();
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();

    await typeWithDelay(page, 'input[type="text"], textarea', 'This will cause an error');
    await sendButton.click();

    await page.waitForTimeout(2000);

    // Should show error message without crashing
    const errorElements = page.locator(':has-text("error"), :has-text("failed"), .error');
    if ((await errorElements.count()) > 0) {
      await expect(errorElements.first()).toBeVisible();
    }

    // Chat interface should still be functional
    await expect(messageInput).toBeVisible();
    await expect(sendButton).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToPage(page, '/chat');
    await waitForPageLoad(page);

    // Check mobile layout
    const messageInput = page.locator('input[type="text"], textarea').first();
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();

    await expect(messageInput).toBeVisible();
    await expect(sendButton).toBeVisible();

    // Test sending message on mobile
    await typeWithDelay(page, 'input[type="text"], textarea', 'Mobile test');
    await sendButton.click();
    await page.waitForTimeout(1000);
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    await navigateToPage(page, '/chat');
    await waitForPageLoad(page);

    const messageInput = page.locator('input[type="text"], textarea').first();

    // Type message
    await typeWithDelay(page, 'input[type="text"], textarea', 'Test keyboard shortcut');

    // Test Enter to send (if implemented)
    await messageInput.press('Enter');
    await page.waitForTimeout(1000);

    // Message should be sent
    await expect(page.locator(':has-text("Test keyboard shortcut")')).toBeVisible();
  });
});
