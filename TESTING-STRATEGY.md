# Testing Strategy for FinSight AI Dashboard

## Overview

This project uses a comprehensive testing strategy with two complementary testing frameworks:
- **Jest** for unit and integration testing
- **Playwright** for end-to-end (E2E) testing

## Testing Structure

```
FinSight-AI-Dashboard/
├── src/tests/          # Unit & Integration tests (Jest)
│   ├── api/           # API route tests
│   ├── components/    # React component tests
│   └── lib/           # Utility function tests
└── tests/e2e/         # End-to-End tests (Playwright)
    ├── *.spec.ts      # E2E test scenarios
    └── utils/         # E2E test helpers
```

## Testing Types

### 1. Unit Tests (Jest)
**Location:** `src/tests/`  
**Purpose:** Test individual functions, components, and utilities in isolation  
**Speed:** Very fast (milliseconds)  
**When to run:** On every save, pre-commit

Examples:
- Testing a utility function that calculates spending totals
- Testing a React component renders correctly
- Testing form validation logic

```typescript
// Example: src/tests/lib/finance.test.ts
test('calculateTotal should sum transaction amounts', () => {
  const transactions = [
    { amount: 10.50 },
    { amount: 25.00 },
    { amount: 5.25 }
  ];
  expect(calculateTotal(transactions)).toBe(40.75);
});
```

### 2. Integration Tests (Jest)
**Location:** `src/tests/api/`  
**Purpose:** Test how different parts work together (API routes, services)  
**Speed:** Fast (seconds)  
**When to run:** Pre-commit, CI pipeline

Examples:
- Testing API endpoints with mocked database
- Testing authentication flows
- Testing service interactions

```typescript
// Example: src/tests/api/transactions.test.ts
test('GET /api/transactions returns user transactions', async () => {
  const response = await GET(mockRequest);
  expect(response.status).toBe(200);
  expect(response.data.transactions).toHaveLength(3);
});
```

### 3. End-to-End Tests (Playwright)
**Location:** `tests/e2e/`  
**Purpose:** Test complete user journeys across the entire application  
**Speed:** Slower (minutes)  
**When to run:** Pre-merge, nightly builds

Examples:
- User logs in and views dashboard
- User connects bank account via Plaid
- User asks AI chat about spending habits

```typescript
// Example: tests/e2e/dashboard.spec.ts
test('user can view spending breakdown', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('.spending-chart')).toBeVisible();
});
```

## When to Use Each Test Type

### Use Jest Unit Tests When:
- Testing pure functions (calculations, formatters, validators)
- Testing React component rendering
- Testing individual hooks or utilities
- You need fast feedback during development

### Use Jest Integration Tests When:
- Testing API endpoints
- Testing database operations
- Testing authentication flows
- Testing service layer logic

### Use Playwright E2E Tests When:
- Testing critical user paths (login, payment, data viewing)
- Testing multi-page workflows
- Testing third-party integrations (Plaid, OpenAI)
- Ensuring the entire stack works together

## Testing Commands

```bash
# Jest Tests
npm run test           # Run all Jest tests
npm run test:watch     # Run Jest in watch mode
npm run test:coverage  # Run with coverage report

# Playwright Tests
npm run test:e2e              # Run all E2E tests
npm run test:e2e:ui           # Run with interactive UI
npm run test:e2e:headed       # Run in headed browser
npm run test:e2e:debug        # Debug specific tests

# All Tests
npm run test:all              # Run Jest tests with coverage
npm run validate              # Run linting, type-check, and tests
```

## Testing Best Practices

### 1. Test Naming
- Unit tests: `[functionName].test.ts`
- Integration tests: `[endpoint].test.ts`
- E2E tests: `[feature].spec.ts`

### 2. Test Organization
- Group related tests using `describe` blocks
- Use clear, descriptive test names
- Follow Arrange-Act-Assert pattern

### 3. Mocking Strategy
- Mock external dependencies (databases, APIs)
- Use real implementations when possible
- Keep mocks simple and focused

### 4. E2E Best Practices
- Use data-testid attributes for reliable selectors
- Mock external services (Plaid, OpenAI)
- Test both happy paths and error scenarios
- Include mobile viewport testing

## Coverage Goals

### Unit Tests (Jest)
- **Target:** 80%+ coverage
- **Critical paths:** 90%+ coverage
- **Focus on:** Business logic, calculations, data transformations

### E2E Tests (Playwright)
- **Target:** Cover all critical user journeys
- **Focus on:** User workflows that generate revenue or handle sensitive data
- **Examples:** Login, account connection, transaction viewing, AI interactions

## CI/CD Integration

### Pre-commit
- Run unit tests for changed files
- Run linting and type checking

### Pull Request
- Run all unit and integration tests
- Run E2E tests on critical paths
- Generate coverage reports

### Main Branch
- Run full E2E test suite
- Run performance tests
- Deploy if all tests pass

## Why Both Jest and Playwright?

1. **Speed vs Confidence Trade-off**
   - Jest gives fast feedback during development
   - Playwright gives confidence before deployment

2. **Different Failure Modes**
   - Jest catches logic errors
   - Playwright catches integration issues

3. **Cost Efficiency**
   - Running E2E tests on every change is expensive
   - Unit tests provide rapid iteration

4. **Debugging**
   - Unit test failures pinpoint exact issues
   - E2E test failures indicate user impact

## Migration from Selenium

If you're familiar with Selenium, here's why Playwright is better:

1. **Auto-waiting**: No more `sleep()` or explicit waits
2. **Better debugging**: Time-travel debugging, trace viewer
3. **Speed**: Runs headless by default, parallel execution
4. **Modern API**: Promise-based, better error messages
5. **Cross-browser**: Test Safari (WebKit) without macOS

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/write-tests)