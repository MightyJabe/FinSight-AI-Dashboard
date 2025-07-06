# End-to-End Testing with Playwright

This directory contains comprehensive E2E tests for the FinSight AI Dashboard using Playwright.

## Overview

The E2E test suite covers critical user flows including:

- **Homepage & Navigation** - Basic page loading, responsiveness, SEO
- **Authentication** - Login/signup flows, validation, redirects
- **Dashboard** - Overview cards, data loading, error handling
- **Transactions** - Transaction lists, filtering, AI categorization
- **Plaid Integration** - Account connection, data sync, error handling
- **Spending Trends** - Analysis tools, charts, insights
- **AI Chat** - Message flows, visualizations, error handling

## Test Structure

```
tests/e2e/
├── utils/
│   └── test-helpers.ts        # Shared utilities and helpers
├── homepage.spec.ts           # Homepage and navigation tests
├── authentication.spec.ts     # Auth flows and security
├── dashboard.spec.ts          # Dashboard functionality
├── transactions.spec.ts       # Transaction management
├── plaid-integration.spec.ts  # Banking integration
├── spending-trends.spec.ts    # Analytics and insights
├── ai-chat.spec.ts           # AI assistant features
└── README.md                 # This file
```

## Setup Requirements

### System Dependencies

Install Playwright browser dependencies:

```bash
# On Ubuntu/Debian
sudo npx playwright install-deps

# Or manually install required packages
sudo apt-get install libnspr4 libnss3 libasound2t64
```

### Environment Setup

1. **Environment Variables**: Create `.env.local` with test configuration:
   ```bash
   E2E_BASE_URL=http://localhost:3000
   NODE_ENV=test
   ```

2. **Firebase Configuration**: Ensure Firebase test project is configured
3. **Test Data**: Set up test user accounts and sample data

## Running Tests

### Basic Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Advanced Usage

```bash
# Run specific test file
npx playwright test homepage.spec.ts

# Run tests on specific browser
npx playwright test --project=chromium

# Run tests with specific grep pattern
npx playwright test --grep "should load dashboard"

# Generate test code
npx playwright codegen localhost:3000
```

## Test Configuration

### Browser Matrix

Tests run on multiple browsers:
- **Chromium** (Desktop Chrome)
- **Firefox** (Desktop Firefox) 
- **WebKit** (Desktop Safari)
- **Mobile Chrome** (Pixel 5)
- **Mobile Safari** (iPhone 12)

### Timeouts and Retries

- **Test Timeout**: 30 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Global Timeout**: 15 minutes for full suite

### Screenshots and Videos

- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **Traces**: Collected on first retry

## Test Helpers

### Authentication Mocking

```typescript
import { mockAuthentication } from './utils/test-helpers';

test.beforeEach(async ({ page }) => {
  await mockAuthentication(page);
});
```

### API Response Mocking

```typescript
import { mockAPIResponse } from './utils/test-helpers';

await mockAPIResponse(page, '**/api/transactions**', {
  success: true,
  data: { transactions: [...] }
});
```

### Plaid Integration Mocking

```typescript
import { mockPlaidLink } from './utils/test-helpers';

await mockPlaidLink(page);
```

### Wait Utilities

```typescript
import { waitForPageLoad, waitForElement } from './utils/test-helpers';

await waitForPageLoad(page);
await waitForElement(page, '.transaction-list');
```

## Writing New Tests

### Test Structure Guidelines

1. **Arrange**: Set up test data and mocks
2. **Act**: Perform user actions
3. **Assert**: Verify expected outcomes

### Example Test

```typescript
test('should display transaction list', async ({ page }) => {
  // Arrange
  await mockAuthentication(page);
  await mockAPIResponse(page, '**/api/transactions**', {
    success: true,
    data: { transactions: mockTransactions }
  });

  // Act
  await navigateToPage(page, '/transactions');
  await waitForPageLoad(page);

  // Assert
  await expect(page.locator('.transaction-item')).toHaveCount(3);
  await expect(page.locator(':has-text("Grocery Store")')).toBeVisible();
});
```

### Best Practices

1. **Use Data Test IDs**: Add `data-testid` attributes for reliable selectors
2. **Mock External APIs**: Mock all external services (Firebase, Plaid, OpenAI)
3. **Handle Async Operations**: Always wait for operations to complete
4. **Test Error States**: Include negative test cases
5. **Mobile Testing**: Test responsive behavior
6. **Accessibility**: Include accessibility checks where appropriate

### Selectors Guidelines

```typescript
// ✅ Good - Specific and stable
page.locator('[data-testid="transaction-list"]')
page.locator('button:has-text("Add Account")')

// ❌ Avoid - Fragile and implementation-dependent
page.locator('.css-class-xyz')
page.locator('div > div > button')
```

## Debugging Tests

### Debug Mode

```bash
# Run with debugger
npm run test:e2e:debug

# Debug specific test
npx playwright test --debug homepage.spec.ts
```

### Screenshots and Traces

```bash
# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### Console Logging

```typescript
// Add debugging output
test('debug example', async ({ page }) => {
  page.on('console', msg => console.log(msg.text()));
  page.on('response', response => console.log(response.url()));
  
  await page.goto('/dashboard');
});
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npm run test:e2e
  env:
    E2E_BASE_URL: http://localhost:3000

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

### Test Reports

- **HTML Report**: Generated in `playwright-report/`
- **JUnit Report**: Generated in `test-results/e2e-results.xml`
- **JSON Report**: Generated in `test-results/e2e-results.json`

## Maintenance

### Updating Tests

1. **Keep Selectors Updated**: Update when UI changes
2. **Mock Data Maintenance**: Keep test data realistic
3. **Browser Compatibility**: Test on latest browser versions
4. **Performance Monitoring**: Monitor test execution times

### Common Issues

1. **Flaky Tests**: Use proper waits instead of timeouts
2. **Slow Tests**: Optimize API mocks and reduce unnecessary waits
3. **Auth Issues**: Ensure mock authentication is properly set up
4. **Mobile Tests**: Test responsive behavior on different viewports

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [API Reference](https://playwright.dev/docs/api/class-playwright)