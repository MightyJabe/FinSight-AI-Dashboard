# Testing Infrastructure Implementation

> **Plan Created**: January 17, 2025
> **Last Verified**: January 19, 2026
> **Status**: ⚠️ PARTIALLY STARTED (~5% Complete)
> **Priority**: CRITICAL (Blocks Production Deployment)
> **Complexity**: High
> **Estimated Effort**: 2-3 weeks remaining
>
> **Current State (Verified):**
> - ✅ Basic test infrastructure exists (Jest + Playwright configured)
> - ✅ 6 unit test files created (not just 1)
> - ✅ 3 E2E tests exist (auth.spec.ts, dashboard.spec.ts, smoke.spec.ts)
> - ❌ Coverage critically low: 2.11% statements (Target: 80%)
> - ❌ Most components, hooks, and utils untested
> - ❌ No CI/CD pipeline with quality gates

---

## Overview

Implement comprehensive testing infrastructure to achieve production-ready quality standards with automated test coverage, CI/CD integration, and quality gates. This is a **critical blocker** for production deployment as the application currently has only 6 test files and 2.11% coverage (far below the 80% target).

---

## Problem Statement

### Current State (❌ Not Production-Ready) - Updated January 19, 2026
- **Test Coverage**: 2.11% statements (6 test files exist, but most code untested)
- **E2E Tests**: 3 Playwright specs (auth, dashboard, smoke) - basic coverage only
- **CI/CD Pipeline**: None (no automated testing)
- **Mock Infrastructure**: Partial (Firebase/OpenAI mocked, Plaid missing)
- **Quality Gates**: None (no coverage thresholds enforced)

### Impact
- Application is **fragile and risky** to deploy
- No confidence in refactoring or new feature additions
- Manual testing is incomplete and time-consuming
- Security vulnerabilities may go undetected
- Financial calculation errors could go to production

### Why This Matters
- **User Trust**: Financial applications require high reliability
- **Regulatory Compliance**: Financial services need audit trails
- **Development Velocity**: Tests enable confident rapid iteration
- **Cost of Bugs**: Production bugs in financial software are expensive

---

## Proposed Solution

Implement a comprehensive **3-layer testing pyramid**:

```
         /\
        /E2E\ (10%) - Playwright: Critical user flows
       /------\
      /  API  \ (30%) - Jest: Route validation, integration
     /--------\
    /  Unit   \ (60%) - Jest: Components, hooks, utils
   /----------\
```

### Goals
1. ✅ **80%+ overall code coverage** with Jest
2. ✅ **90%+ coverage for financial calculations** (precision-critical code)
3. ✅ **E2E tests for 6 critical user flows** with Playwright
4. ✅ **Automated CI/CD pipeline** with quality gates
5. ✅ **Mock infrastructure** for Firebase, Plaid, OpenAI

---

## Technical Approach

### Phase 1: Test Infrastructure Setup (Week 1)

#### 1.1 Enhanced Jest Configuration

**File**: `jest.config.js` (enhance existing)

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/tests/',
    '\\.stories\\.',
    '\\.config\\.',
    '/src/types/',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Critical financial code requires 90%+ coverage
    './src/lib/financial-*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/lib/*-calculator.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/utils/format*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json-summary'],
  maxWorkers: process.env.CI ? 2 : 4,
  testTimeout: 10000,
};

module.exports = createJestConfig(customJestConfig);
```

**Key Enhancements**:
- ✅ Per-directory coverage thresholds (90% for financial code)
- ✅ Multiple coverage report formats (HTML for local, LCOV for CI)
- ✅ Worker optimization (4 local, 2 in CI)
- ✅ Ignore generated files and stories

---

#### 1.2 Complete Mock Infrastructure

**File**: `src/__mocks__/plaid.ts` (NEW)

```typescript
import { jest } from '@jest/globals';
import type { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

// Mock Plaid client
export const mockPlaidClient = {
  linkTokenCreate: jest.fn().mockResolvedValue({
    data: {
      link_token: 'link-sandbox-test-token-123456',
      expiration: '2025-01-18T12:00:00Z',
      request_id: 'test-request-id',
    },
  }),

  itemPublicTokenExchange: jest.fn().mockResolvedValue({
    data: {
      access_token: 'access-sandbox-test-token-123456',
      item_id: 'test-item-id',
      request_id: 'test-request-id',
    },
  }),

  accountsGet: jest.fn().mockResolvedValue({
    data: {
      accounts: [
        {
          account_id: 'test-account-1',
          balances: {
            available: 1000.50,
            current: 1100.75,
            limit: null,
            iso_currency_code: 'USD',
          },
          mask: '0000',
          name: 'Plaid Checking',
          official_name: 'Plaid Gold Standard 0% Interest Checking',
          subtype: 'checking',
          type: 'depository',
        },
        {
          account_id: 'test-account-2',
          balances: {
            available: 5000.00,
            current: 5250.25,
            limit: null,
            iso_currency_code: 'USD',
          },
          mask: '1111',
          name: 'Plaid Saving',
          official_name: 'Plaid Silver Standard 0.1% Interest Saving',
          subtype: 'savings',
          type: 'depository',
        },
      ],
      item: {
        item_id: 'test-item-id',
        institution_id: 'ins_test',
        webhook: '',
        error: null,
        available_products: ['balance', 'investments'],
        billed_products: ['auth', 'transactions'],
        consent_expiration_time: null,
      },
      request_id: 'test-request-id',
    },
  }),

  transactionsGet: jest.fn().mockResolvedValue({
    data: {
      accounts: [
        {
          account_id: 'test-account-1',
          balances: {
            available: 1000.50,
            current: 1100.75,
            limit: null,
            iso_currency_code: 'USD',
          },
          mask: '0000',
          name: 'Plaid Checking',
          official_name: 'Plaid Gold Standard 0% Interest Checking',
          subtype: 'checking',
          type: 'depository',
        },
      ],
      transactions: [
        {
          account_id: 'test-account-1',
          amount: 12.50,
          iso_currency_code: 'USD',
          category: ['Food and Drink', 'Restaurants'],
          category_id: '13005000',
          date: '2025-01-15',
          authorized_date: '2025-01-15',
          name: 'Starbucks',
          merchant_name: 'Starbucks',
          payment_channel: 'in store',
          pending: false,
          transaction_id: 'test-txn-1',
          transaction_type: 'place',
        },
        {
          account_id: 'test-account-1',
          amount: -2000.00,
          iso_currency_code: 'USD',
          category: ['Transfer', 'Payroll'],
          category_id: '21009000',
          date: '2025-01-01',
          authorized_date: '2025-01-01',
          name: 'INTRST PYMNT',
          merchant_name: null,
          payment_channel: 'other',
          pending: false,
          transaction_id: 'test-txn-2',
          transaction_type: 'special',
        },
      ],
      total_transactions: 2,
      request_id: 'test-request-id',
    },
  }),

  investmentsHoldingsGet: jest.fn().mockResolvedValue({
    data: {
      accounts: [
        {
          account_id: 'test-investment-1',
          balances: {
            available: null,
            current: 25000.00,
            limit: null,
            iso_currency_code: 'USD',
          },
          mask: '2222',
          name: 'Plaid 401k',
          official_name: 'Plaid 401k',
          subtype: '401k',
          type: 'investment',
        },
      ],
      holdings: [
        {
          account_id: 'test-investment-1',
          security_id: 'test-security-1',
          institution_price: 120.50,
          institution_price_as_of: '2025-01-15',
          institution_value: 6025.00,
          cost_basis: 5000.00,
          quantity: 50,
          iso_currency_code: 'USD',
        },
      ],
      securities: [
        {
          security_id: 'test-security-1',
          isin: null,
          cusip: 'test-cusip-1',
          sedol: null,
          institution_security_id: null,
          institution_id: null,
          proxy_security_id: null,
          name: 'Test ETF',
          ticker_symbol: 'TEST',
          is_cash_equivalent: false,
          type: 'etf',
          close_price: 120.00,
          close_price_as_of: '2025-01-15',
          iso_currency_code: 'USD',
        },
      ],
      item: {
        item_id: 'test-item-id',
        institution_id: 'ins_test',
      },
      request_id: 'test-request-id',
    },
  }),

  itemRemove: jest.fn().mockResolvedValue({
    data: {
      request_id: 'test-request-id',
    },
  }),
};

// Mock Plaid module
jest.mock('plaid', () => ({
  Configuration: jest.fn(),
  PlaidApi: jest.fn(() => mockPlaidClient),
  PlaidEnvironments: {
    sandbox: 'https://sandbox.plaid.com',
    development: 'https://development.plaid.com',
    production: 'https://production.plaid.com',
  },
  Products: {
    Auth: 'auth',
    Transactions: 'transactions',
    Identity: 'identity',
    Assets: 'assets',
    Investments: 'investments',
  },
  CountryCode: {
    Us: 'US',
    Ca: 'CA',
    Gb: 'GB',
  },
}));

export const plaidClient = mockPlaidClient;
```

**File**: `jest.setup.js` (update existing)

```javascript
// Add to existing setup
import '@testing-library/jest-dom';
import 'openai/shims/node';

// Import Plaid mock
import '@/__mocks__/plaid';

// Existing mocks...
// (keep all current Firebase, OpenAI, Next.js mocks)

// Add MSW setup for API route testing
import { server } from './src/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**File**: `src/mocks/server.ts` (NEW - MSW setup)

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

**File**: `src/mocks/handlers.ts` (NEW - API mock handlers)

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // OpenAI API mock
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              category: 'Food & Dining',
              confidence: 95,
              reasoning: 'Transaction at Starbucks, clearly a food purchase',
            }),
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
    });
  }),

  // Plaid API mocks (fallback if direct mock doesn't work)
  http.post('https://sandbox.plaid.com/link/token/create', () => {
    return HttpResponse.json({
      link_token: 'link-sandbox-test-token',
      expiration: '2025-01-18T12:00:00Z',
      request_id: 'test-request',
    });
  }),

  http.post('https://sandbox.plaid.com/item/public_token/exchange', () => {
    return HttpResponse.json({
      access_token: 'access-sandbox-test-token',
      item_id: 'test-item-id',
      request_id: 'test-request',
    });
  }),
];
```

---

#### 1.3 Test Data Factories

**File**: `tests/factories/user.factory.ts` (NEW)

```typescript
import type { UserProfile } from '@/types';

export const createTestUser = (overrides?: Partial<UserProfile>): UserProfile => ({
  uid: `test-uid-${Math.random().toString(36).substring(7)}`,
  email: `test-${Date.now()}@example.com`,
  displayName: 'Test User',
  createdAt: new Date().toISOString(),
  preferences: {
    currency: 'USD',
    language: 'en',
    theme: 'light',
  },
  ...overrides,
});
```

**File**: `tests/factories/transaction.factory.ts` (NEW)

```typescript
import type { Transaction } from '@/types';
import Decimal from 'decimal.js';

export const createTestTransaction = (
  overrides?: Partial<Transaction>
): Transaction => ({
  id: `test-txn-${Math.random().toString(36).substring(7)}`,
  userId: 'test-user-id',
  accountId: 'test-account-id',
  amount: new Decimal(-50.00).toNumber(),
  description: 'Test Transaction',
  category: 'Uncategorized',
  date: new Date().toISOString(),
  pending: false,
  source: 'manual',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});
```

**File**: `tests/factories/account.factory.ts` (NEW)

```typescript
import type { Account } from '@/types';

export const createTestAccount = (overrides?: Partial<Account>): Account => ({
  id: `test-account-${Math.random().toString(36).substring(7)}`,
  userId: 'test-user-id',
  name: 'Test Checking Account',
  type: 'depository',
  subtype: 'checking',
  balance: 1000.00,
  currency: 'USD',
  institution: 'Test Bank',
  source: 'plaid',
  plaidAccountId: 'test-plaid-account',
  plaidItemId: 'test-plaid-item',
  lastSyncedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});
```

**File**: `tests/factories/index.ts` (NEW - barrel export)

```typescript
export * from './user.factory';
export * from './transaction.factory';
export * from './account.factory';
```

---

#### 1.4 Test Utilities

**File**: `tests/utils/test-helpers.ts` (NEW)

```typescript
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { SWRConfig } from 'swr';

// Custom render with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

// Mock Next.js router
export function mockRouter(overrides = {}) {
  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    ...overrides,
  };

  jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue(router);
  jest.spyOn(require('next/navigation'), 'usePathname').mockReturnValue(router.pathname);

  return router;
}

// Wait for async updates
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Create mock Request for API route testing
export function createMockRequest(options: {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  url?: string;
}): Request {
  const { method = 'POST', body, headers = {}, url = 'http://localhost:3000/api/test' } = options;

  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Assert decimal precision for financial tests
export function expectDecimalEqual(actual: number, expected: number, precision = 2) {
  const multiplier = Math.pow(10, precision);
  expect(Math.round(actual * multiplier) / multiplier).toBe(
    Math.round(expected * multiplier) / multiplier
  );
}
```

---

### Phase 2: Unit Tests (Week 1-2)

#### Priority 1: Financial Calculation Tests (90%+ coverage required)

**File**: `src/lib/__tests__/financial-validator.test.ts` (NEW)

```typescript
import Decimal from 'decimal.js';
import {
  validateFinancialMetrics,
  enforceFinancialAccuracy,
  roundFinancialValue,
  addFinancialValues,
  subtractFinancialValues,
  sumFinancialValues,
  normalizeFinancialMetrics,
} from '../financial-validator';

describe('financial-validator', () => {
  describe('validateFinancialMetrics', () => {
    it('should validate correct financial metrics', () => {
      const metrics = {
        totalAssets: 10000,
        totalLiabilities: 5000,
        netWorth: 5000,
        liquidAssets: 3000,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyCashFlow: 2000,
        investments: 7000,
      };

      const result = validateFinancialMetrics(metrics);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect net worth calculation error', () => {
      const metrics = {
        totalAssets: 10000,
        totalLiabilities: 5000,
        netWorth: 6000, // Should be 5000
        liquidAssets: 3000,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyCashFlow: 2000,
        investments: 7000,
      };

      const result = validateFinancialMetrics(metrics);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'netWorth',
          message: expect.stringContaining('does not equal assets minus liabilities'),
        })
      );
    });

    it('should detect negative values where not allowed', () => {
      const metrics = {
        totalAssets: -10000, // Invalid
        totalLiabilities: 5000,
        netWorth: -15000,
        liquidAssets: 3000,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyCashFlow: 2000,
        investments: 7000,
      };

      const result = validateFinancialMetrics(metrics);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'totalAssets',
          message: expect.stringContaining('cannot be negative'),
        })
      );
    });

    it('should detect cash flow calculation error', () => {
      const metrics = {
        totalAssets: 10000,
        totalLiabilities: 5000,
        netWorth: 5000,
        liquidAssets: 3000,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyCashFlow: 1000, // Should be 2000
        investments: 7000,
      };

      const result = validateFinancialMetrics(metrics);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'monthlyCashFlow',
        })
      );
    });
  });

  describe('roundFinancialValue', () => {
    it('should round to 2 decimal places by default', () => {
      expect(roundFinancialValue(10.999)).toBe(11.00);
      expect(roundFinancialValue(10.001)).toBe(10.00);
      expect(roundFinancialValue(10.005)).toBe(10.01); // Banker's rounding
    });

    it('should handle zero', () => {
      expect(roundFinancialValue(0)).toBe(0);
      expect(roundFinancialValue(-0)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(roundFinancialValue(-10.999)).toBe(-11.00);
      expect(roundFinancialValue(-10.001)).toBe(-10.00);
    });

    it('should handle very large numbers', () => {
      expect(roundFinancialValue(1234567890.123)).toBe(1234567890.12);
    });

    it('should handle very small numbers', () => {
      expect(roundFinancialValue(0.001)).toBe(0.00);
      expect(roundFinancialValue(0.009)).toBe(0.01);
    });
  });

  describe('addFinancialValues', () => {
    it('should add two positive numbers precisely', () => {
      const result = addFinancialValues(100.10, 200.20);
      expect(result).toBe(300.30);
    });

    it('should handle floating point edge case (0.1 + 0.2)', () => {
      const result = addFinancialValues(0.1, 0.2);
      expect(result).toBe(0.3); // Not 0.30000000000000004
    });

    it('should add negative numbers', () => {
      const result = addFinancialValues(-100, -50);
      expect(result).toBe(-150);
    });

    it('should add positive and negative', () => {
      const result = addFinancialValues(100, -30);
      expect(result).toBe(70);
    });
  });

  describe('sumFinancialValues', () => {
    it('should sum array of values', () => {
      const result = sumFinancialValues([100, 200, 300]);
      expect(result).toBe(600);
    });

    it('should handle empty array', () => {
      const result = sumFinancialValues([]);
      expect(result).toBe(0);
    });

    it('should handle single value', () => {
      const result = sumFinancialValues([100]);
      expect(result).toBe(100);
    });

    it('should handle mixed positive and negative', () => {
      const result = sumFinancialValues([100, -50, 200, -30]);
      expect(result).toBe(220);
    });

    it('should handle floating point precision issues', () => {
      const result = sumFinancialValues([0.1, 0.2, 0.3]);
      expect(result).toBeCloseTo(0.6, 2);
    });
  });
});
```

**File**: `src/utils/__tests__/format.test.ts` (NEW)

```typescript
import { formatCurrency, formatPercentage, formatNumber } from '../format';

describe('formatCurrency', () => {
  it('should format positive currency', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('should format zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('should format negative currency', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
  });

  it('should format large numbers with commas', () => {
    expect(formatCurrency(1234567890.12)).toBe('$1,234,567,890.12');
  });

  it('should round to 2 decimal places', () => {
    expect(formatCurrency(10.999)).toBe('$11.00');
    expect(formatCurrency(10.001)).toBe('$10.00');
  });

  it('should handle very small amounts', () => {
    expect(formatCurrency(0.001)).toBe('$0.00');
    expect(formatCurrency(0.009)).toBe('$0.01');
  });

  it('should format different currencies', () => {
    expect(formatCurrency(1000, 'EUR')).toMatch(/€|EUR/);
    expect(formatCurrency(1000, 'GBP')).toMatch(/£|GBP/);
  });

  it('should handle null as zero', () => {
    expect(formatCurrency(null as any)).toBe('$0.00');
  });

  it('should handle undefined as zero', () => {
    expect(formatCurrency(undefined as any)).toBe('$0.00');
  });
});

describe('formatPercentage', () => {
  it('should format positive percentage', () => {
    expect(formatPercentage(0.1234)).toBe('12.34%');
  });

  it('should format zero', () => {
    expect(formatPercentage(0)).toBe('0.00%');
  });

  it('should format negative percentage', () => {
    expect(formatPercentage(-0.05)).toBe('-5.00%');
  });

  it('should handle very small percentages', () => {
    expect(formatPercentage(0.0001)).toBe('0.01%');
  });

  it('should handle percentages over 100%', () => {
    expect(formatPercentage(1.5)).toBe('150.00%');
  });

  it('should respect precision parameter', () => {
    expect(formatPercentage(0.123456, 4)).toBe('12.3456%');
  });
});
```

#### Priority 2: API Route Tests

**File**: `src/app/api/transactions/__tests__/categorize.test.ts` (NEW)

```typescript
import { POST } from '../categorize/route';
import { createMockRequest } from '@tests/utils/test-helpers';
import * as openai from '@/lib/openai';

jest.mock('@/lib/openai');

describe('POST /api/transactions/categorize', () => {
  it('should categorize transaction successfully', async () => {
    const mockGenerateChatCompletion = openai.generateChatCompletion as jest.MockedFunction<
      typeof openai.generateChatCompletion
    >;

    mockGenerateChatCompletion.mockResolvedValueOnce({
      content: JSON.stringify({
        category: 'Food & Dining',
        confidence: 95,
        reasoning: 'Starbucks is a coffee shop',
      }),
      role: 'assistant',
    });

    const request = createMockRequest({
      body: {
        description: 'Starbucks',
        amount: 5.50,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.category).toBe('Food & Dining');
    expect(data.confidence).toBe(95);
  });

  it('should validate required fields', async () => {
    const request = createMockRequest({
      body: {
        // Missing description
        amount: 5.50,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.errors).toBeDefined();
  });

  it('should handle OpenAI API errors gracefully', async () => {
    const mockGenerateChatCompletion = openai.generateChatCompletion as jest.MockedFunction<
      typeof openai.generateChatCompletion
    >;

    mockGenerateChatCompletion.mockRejectedValueOnce(new Error('API quota exceeded'));

    const request = createMockRequest({
      body: {
        description: 'Starbucks',
        amount: 5.50,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
});
```

#### Priority 3: Component Tests

**File**: `src/components/auth/__tests__/AuthGuard.test.tsx` (NEW)

```typescript
import { render, screen } from '@testing-library/react';
import { AuthGuard } from '../AuthGuard';
import { useSession } from '@/components/providers/SessionProvider';

jest.mock('@/components/providers/SessionProvider');

describe('AuthGuard', () => {
  it('should render children when user is authenticated', () => {
    (useSession as jest.Mock).mockReturnValue({
      user: { uid: 'test-uid', email: 'test@example.com' },
      loading: false,
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should show loading state while checking auth', () => {
    (useSession as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    // Should show loading indicator
  });

  it('should redirect to login when user is not authenticated', () => {
    (useSession as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    const mockRouter = { push: jest.fn() };
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue(mockRouter);

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });
});
```

---

### Phase 3: E2E Tests (Week 2)

#### 3.1 Enhanced Playwright Configuration

**File**: `playwright.config.ts` (enhance existing)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    permissions: ['clipboard-read'],
  },
  projects: [
    // Setup authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Desktop tests
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    // Mobile tests (optional - add later)
    // {
    //   name: 'mobile',
    //   use: {
    //     ...devices['iPhone 13'],
    //     storageState: 'playwright/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

#### 3.2 Authentication Setup

**File**: `tests/e2e/auth.setup.ts` (NEW)

```typescript
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('/login');

  // Fill in test credentials
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('testpassword123');

  // Click sign in
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/);

  // Verify user is authenticated
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
```

#### 3.3 Page Object Models

**File**: `tests/e2e/pages/LoginPage.ts` (NEW)

```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: /sign in/i });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async expectErrorMessage(message: string) {
    await this.errorMessage.waitFor({ state: 'visible' });
    await this.errorMessage.textContent().then(text => {
      if (!text?.includes(message)) {
        throw new Error(`Expected error message to contain "${message}", but got "${text}"`);
      }
    });
  }
}
```

**File**: `tests/e2e/pages/DashboardPage.ts` (NEW)

```typescript
import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly netWorthCard: Locator;
  readonly addTransactionButton: Locator;
  readonly transactionsList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /dashboard/i });
    this.netWorthCard = page.getByTestId('net-worth-card');
    this.addTransactionButton = page.getByRole('button', { name: /add transaction/i });
    this.transactionsList = page.getByTestId('transactions-list');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async getNetWorth(): Promise<string> {
    return await this.netWorthCard.textContent() || '';
  }

  async addTransaction(description: string, amount: number) {
    await this.addTransactionButton.click();
    await this.page.getByLabel('Description').fill(description);
    await this.page.getByLabel('Amount').fill(amount.toString());
    await this.page.getByRole('button', { name: /save/i }).click();
  }
}
```

#### 3.4 Critical E2E Test Flows

**File**: `tests/e2e/auth-flow.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Authentication Flow', () => {
  test('user can login and logout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Login
    await loginPage.login('test@example.com', 'testpassword123');

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    // Logout
    await page.getByRole('button', { name: /account/i }).click();
    await page.getByRole('menuitem', { name: /sign out/i }).click();

    // Verify redirect to home
    await expect(page).toHaveURL('/');
  });

  test('shows error for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Attempt login with bad credentials
    await loginPage.login('bad@example.com', 'wrongpassword');

    // Verify error message
    await loginPage.expectErrorMessage('Invalid email or password');
  });
});
```

**File**: `tests/e2e/dashboard-flow.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage';

test.describe('Dashboard Flow', () => {
  test('dashboard loads with financial data', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();

    // Verify dashboard elements are visible
    await expect(dashboardPage.heading).toBeVisible();
    await expect(dashboardPage.netWorthCard).toBeVisible();

    // Verify net worth is displayed
    const netWorth = await dashboardPage.getNetWorth();
    expect(netWorth).toMatch(/\$[\d,]+/);
  });

  test('can add manual transaction', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();

    // Add transaction
    await dashboardPage.addTransaction('Coffee', -5.50);

    // Verify transaction appears in list
    await expect(page.getByText('Coffee')).toBeVisible();
    await expect(page.getByText('-$5.50')).toBeVisible();
  });
});
```

**File**: `tests/e2e/plaid-connection.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Plaid Account Connection', () => {
  test('can initiate Plaid connection flow', async ({ page }) => {
    await page.goto('/accounts');

    // Mock Plaid API responses
    await page.route('**/api/plaid/create-link-token', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          linkToken: 'link-sandbox-test-token',
        }),
      });
    });

    // Click connect bank button
    await page.getByRole('button', { name: /connect bank account/i }).click();

    // Verify Plaid Link modal opens (or loading state)
    // Note: Full Plaid OAuth flow requires special handling
    await expect(page.getByText(/connecting to plaid/i)).toBeVisible();
  });
});
```

---

### Phase 4: CI/CD Pipeline (Week 2)

#### 4.1 GitHub Actions Workflow

**File**: `.github/workflows/test.yml` (NEW)

```yaml
name: Tests

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master]

jobs:
  lint-and-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript check
        run: npm run type-check

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests with coverage
        run: npm run test:coverage
        env:
          NODE_OPTIONS: '--max-old-space-size=4096'
          CI: true

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unittests
          fail_ci_if_error: false

      - name: Comment coverage on PR
        if: github.event_name == 'pull_request'
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npx playwright test --project=chromium
        env:
          CI: true
          # Test environment variables
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.TEST_FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.TEST_FIREBASE_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.TEST_FIREBASE_PROJECT_ID }}

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: test-results/
          retention-days: 30

  all-tests-passed:
    name: All Tests Passed
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, unit-tests, e2e-tests]
    if: always()

    steps:
      - name: Check all jobs succeeded
        run: |
          if [ "${{ needs.lint-and-typecheck.result }}" != "success" ] || \
             [ "${{ needs.unit-tests.result }}" != "success" ] || \
             [ "${{ needs.e2e-tests.result }}" != "success" ]; then
            echo "One or more test jobs failed"
            exit 1
          fi
```

#### 4.2 Test Environment Configuration

**File**: `.env.test` (NEW - gitignored)

```bash
# Firebase Test Config (Emulator)
NEXT_PUBLIC_FIREBASE_API_KEY=test-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=test-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=test-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=test-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:test

# Firebase Admin (not needed with mocks)
FIREBASE_PROJECT_ID=test-project
FIREBASE_CLIENT_EMAIL=test@test-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n"

# Plaid Test Config (Sandbox)
PLAID_ENV=sandbox
PLAID_CLIENT_ID=test_client_id
PLAID_SECRET=test_secret

# OpenAI Test Config
OPENAI_API_KEY=test-openai-key

# Encryption
ENCRYPTION_KEY=test_encryption_key_32_chars_long

# Other
NODE_ENV=test
```

**File**: `.env.test.example` (NEW - committed)

```bash
# Copy this to .env.test and fill in values

# Firebase Test Config
NEXT_PUBLIC_FIREBASE_API_KEY=your-test-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-test-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-test-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-test-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:test

# Plaid Sandbox
PLAID_ENV=sandbox
PLAID_CLIENT_ID=get-from-plaid-dashboard
PLAID_SECRET=get-from-plaid-dashboard

# OpenAI (use lower-tier model for testing)
OPENAI_API_KEY=your-openai-test-key

# Encryption
ENCRYPTION_KEY=generate-32-char-random-string

NODE_ENV=test
```

---

## Acceptance Criteria

### Functional Requirements

- [ ] **Jest Unit Tests**
  - [ ] 80%+ overall code coverage achieved
  - [ ] 90%+ coverage for all financial calculation functions
  - [ ] All API routes have tests with Zod validation checks
  - [ ] All critical components have tests (AuthGuard, SessionProvider, Dashboard)
  - [ ] All custom hooks have tests
  - [ ] Tests run successfully with `npm run test`

- [ ] **Playwright E2E Tests**
  - [ ] Authentication flow tested (login, logout, errors)
  - [ ] Dashboard flow tested (load data, display metrics)
  - [ ] Transaction management flow tested (list, add, categorize)
  - [ ] Account connection flow tested (initiate Plaid connection)
  - [ ] AI chat interaction tested (send message, receive response)
  - [ ] Document upload tested (select file, upload, verify)
  - [ ] Tests run successfully with `npm run test:e2e`

- [ ] **Mock Infrastructure**
  - [ ] Plaid client fully mocked with realistic responses
  - [ ] Firebase Admin SDK mocked in jest.setup.js
  - [ ] OpenAI API mocked via MSW
  - [ ] Test data factories created for User, Account, Transaction
  - [ ] Test utilities available for common patterns

- [ ] **CI/CD Pipeline**
  - [ ] GitHub Actions workflow configured and running
  - [ ] Lint + type-check jobs passing
  - [ ] Unit test job passing with coverage report
  - [ ] E2E test job passing with Playwright
  - [ ] Coverage report commented on PRs
  - [ ] Test artifacts uploaded on failure
  - [ ] All tests must pass for PR to be merged

### Non-Functional Requirements

- [ ] **Performance**
  - [ ] Unit test suite completes in < 60 seconds
  - [ ] E2E test suite completes in < 5 minutes
  - [ ] Full CI pipeline completes in < 10 minutes

- [ ] **Maintainability**
  - [ ] Test file organization follows conventions
  - [ ] Page Object Models used for E2E tests
  - [ ] Test data factories used consistently
  - [ ] Test helpers documented and reusable

- [ ] **Quality**
  - [ ] Financial calculation tests cover all edge cases
  - [ ] E2E tests stable (< 5% flakiness rate)
  - [ ] Test failures provide clear error messages
  - [ ] Coverage reports easy to understand

### Quality Gates

- [ ] **Coverage Thresholds Met**
  - [ ] Global: 80% statements, branches, functions, lines
  - [ ] Financial functions: 90% statements, branches, functions, lines
  - [ ] API routes: 85% statements, branches, functions, lines

- [ ] **Zero Critical Issues**
  - [ ] No console errors during E2E tests
  - [ ] No unhandled promise rejections
  - [ ] No accessibility violations in critical flows
  - [ ] No hardcoded credentials or secrets

- [ ] **Documentation Complete**
  - [ ] README updated with testing instructions
  - [ ] Test environment setup documented
  - [ ] Mock usage patterns documented
  - [ ] Troubleshooting guide for common issues

---

## Success Metrics

### Quantitative Metrics
- Code coverage: 80%+ overall, 90%+ financial
- E2E test count: 15+ tests across 6 critical flows
- Unit test count: 100+ tests
- CI execution time: < 10 minutes
- Test flakiness rate: < 5%

### Qualitative Metrics
- Developer confidence in making changes
- Reduced bug reports in production
- Faster code review cycles
- Improved onboarding for new developers

---

## Dependencies & Prerequisites

### Must Have
1. ✅ Node.js 20+ and npm installed
2. ✅ Jest and Playwright already configured
3. ✅ Firebase test project or emulator setup
4. ✅ Plaid sandbox credentials
5. ✅ OpenAI test API key (or mock only)
6. ❌ **NEW**: GitHub Actions enabled on repository
7. ❌ **NEW**: Codecov account (optional but recommended)
8. ❌ **NEW**: `.env.test` file created from `.env.test.example`

### Technical Dependencies
- MSW (Mock Service Worker): `npm install -D msw@latest`
- Additional testing utilities: `npm install -D @faker-js/faker`

---

## Risk Analysis & Mitigation

### High Risk

**Risk 1: E2E Test Flakiness**
- **Impact**: Flaky tests block CI and erode trust
- **Probability**: High (async operations, network timing)
- **Mitigation**:
  - Use explicit waits (`waitFor`, `waitForURL`)
  - Implement retry logic (2 retries in CI)
  - Mock external APIs at network level
  - Use `test.fixme()` to quarantine flaky tests temporarily

**Risk 2: CI Pipeline Too Slow**
- **Impact**: Blocks PRs, slows development velocity
- **Probability**: Medium (full test suite can grow large)
- **Mitigation**:
  - Parallelize unit tests (4 workers)
  - Cache dependencies and Playwright browsers
  - Run E2E tests on Chromium only initially
  - Optimize test isolation to reduce setup time

**Risk 3: Plaid Mock Drift**
- **Impact**: Mocks diverge from real API, integration bugs slip through
- **Probability**: Medium (Plaid API updates frequently)
- **Mitigation**:
  - Document mock creation date
  - Periodic integration tests against staging with real Plaid
  - Subscribe to Plaid API changelog
  - Version control mock responses with timestamps

### Medium Risk

**Risk 4: Coverage Gaming**
- **Impact**: Developers write shallow tests just to hit threshold
- **Probability**: Medium (pressure to meet 80% target)
- **Mitigation**:
  - Code review for test quality, not just coverage %
  - Emphasize testing behavior, not implementation
  - Require meaningful assertions in tests

**Risk 5: Firebase Emulator Differences**
- **Impact**: Tests pass with emulator but fail in production
- **Probability**: Low-Medium (emulator is good but not perfect)
- **Mitigation**:
  - Also test against staging Firebase periodically
  - Document known emulator limitations
  - Use real Firebase for smoke tests post-deploy

**Risk 6: OpenAI Cost in E2E**
- **Impact**: Running E2E against real OpenAI could be expensive
- **Probability**: Low (only if misconfigured)
- **Mitigation**:
  - Mock OpenAI in E2E tests by default
  - Use network route mocking in Playwright
  - Set spending cap on test API key if using real API

### Low Risk

**Risk 7: Test Maintenance Burden**
- **Impact**: Large test suite becomes expensive to maintain
- **Probability**: Low (good structure reduces maintenance)
- **Mitigation**:
  - Invest in test utilities and page objects early
  - Follow DRY principles in test code
  - Regular refactoring of test code

---

## Implementation Phases

### Phase 1: Foundation (Days 1-3)
**Goal**: Set up test infrastructure

**Tasks**:
1. Create Plaid mock (`src/__mocks__/plaid.ts`)
2. Set up MSW (`src/mocks/server.ts`, `src/mocks/handlers.ts`)
3. Create test data factories (`tests/factories/`)
4. Create test utilities (`tests/utils/test-helpers.ts`)
5. Update `jest.setup.js` with MSW integration
6. Create `.env.test` from template
7. Document testing setup in README

**Deliverables**:
- ✅ Complete mock infrastructure
- ✅ Test utilities available
- ✅ Environment configured

---

### Phase 2: Unit Tests - Critical Code (Days 4-7)
**Goal**: Achieve 90%+ coverage for financial calculations

**Tasks**:
1. Test `financial-validator.ts` (all validation functions)
2. Test `financial-calculator.ts` (fetchFinancialData, calculateFinancialMetrics)
3. Test `format.ts` utilities (formatCurrency, formatPercentage)
4. Test `tax-optimizer.ts` (calculateTaxBracket, estimateQuarterlyTaxes)
5. Test `crypto-tax.ts` (calculateCapitalGains)
6. Test `retirement-calculator.ts` (calculateRetirementReadiness)

**Edge Cases to Cover**:
- Zero values
- Negative values (debts, losses)
- Very large numbers (> 1 billion)
- Very small numbers (< 0.01)
- Null/undefined inputs
- Floating-point precision issues (0.1 + 0.2)

**Deliverables**:
- ✅ 90%+ coverage for all financial modules
- ✅ All edge cases tested
- ✅ Property-based tests for critical calculations

---

### Phase 3: Unit Tests - Components & API Routes (Days 8-10)
**Goal**: Achieve 80%+ overall coverage

**Tasks**:
1. Test `AuthGuard` component
2. Test `SessionProvider` context
3. Test API routes: `/api/transactions/categorize`, `/api/plaid/create-link-token`
4. Test custom hooks: `use-transactions.ts`, `use-accounts.ts`
5. Test dashboard components: `DashboardCard`, `OverviewCards`

**Deliverables**:
- ✅ 80%+ overall coverage achieved
- ✅ All critical components tested
- ✅ All API routes validated

---

### Phase 4: E2E Tests (Days 11-13)
**Goal**: Validate 6 critical user flows

**Tasks**:
1. Create Page Object Models (LoginPage, DashboardPage, etc.)
2. Create auth setup fixture (`auth.setup.ts`)
3. Write E2E test: Authentication flow
4. Write E2E test: Dashboard flow
5. Write E2E test: Transaction management
6. Write E2E test: Plaid connection
7. Write E2E test: AI chat interaction
8. Write E2E test: Document upload

**Deliverables**:
- ✅ 15+ E2E tests across 6 flows
- ✅ Page Object Models for maintainability
- ✅ Auth fixture for test isolation

---

### Phase 5: CI/CD Pipeline (Days 14-15)
**Goal**: Automate testing in GitHub Actions

**Tasks**:
1. Create `.github/workflows/test.yml`
2. Configure lint + type-check job
3. Configure unit test job with coverage upload
4. Configure E2E test job with Playwright
5. Set up Codecov integration (optional)
6. Configure PR annotations for coverage
7. Test full pipeline end-to-end
8. Document CI/CD in README

**Deliverables**:
- ✅ Automated CI pipeline running
- ✅ Coverage reports on PRs
- ✅ Test artifacts uploaded on failure
- ✅ Branch protection rules enforced

---

## Files to Create/Modify

### New Files (29 files)

#### Mocks
- `src/__mocks__/plaid.ts` - Plaid client mock
- `src/mocks/server.ts` - MSW server setup
- `src/mocks/handlers.ts` - API request handlers

#### Test Factories
- `tests/factories/user.factory.ts` - User test data
- `tests/factories/transaction.factory.ts` - Transaction test data
- `tests/factories/account.factory.ts` - Account test data
- `tests/factories/index.ts` - Barrel export

#### Test Utilities
- `tests/utils/test-helpers.ts` - Common test utilities

#### Unit Tests (Financial - Priority 1)
- `src/lib/__tests__/financial-validator.test.ts`
- `src/lib/__tests__/financial-calculator.test.ts`
- `src/lib/__tests__/tax-optimizer.test.ts`
- `src/lib/__tests__/crypto-tax.test.ts`
- `src/lib/__tests__/retirement-calculator.test.ts`
- `src/utils/__tests__/format.test.ts`

#### Unit Tests (Components & API)
- `src/components/auth/__tests__/AuthGuard.test.tsx`
- `src/components/providers/__tests__/SessionProvider.test.tsx`
- `src/app/api/transactions/__tests__/categorize.test.ts`
- `src/app/api/plaid/__tests__/create-link-token.test.ts`
- `src/hooks/__tests__/use-transactions.test.ts`

#### E2E Tests
- `tests/e2e/auth.setup.ts` - Auth fixture
- `tests/e2e/pages/LoginPage.ts` - Login page object
- `tests/e2e/pages/DashboardPage.ts` - Dashboard page object
- `tests/e2e/auth-flow.spec.ts` - Auth E2E tests
- `tests/e2e/dashboard-flow.spec.ts` - Dashboard E2E tests
- `tests/e2e/transactions-flow.spec.ts` - Transaction E2E tests
- `tests/e2e/plaid-connection.spec.ts` - Plaid E2E tests

#### CI/CD
- `.github/workflows/test.yml` - GitHub Actions workflow

#### Configuration
- `.env.test` - Test environment variables (gitignored)
- `.env.test.example` - Test env template (committed)

### Modified Files (3 files)

- `jest.config.js` - Enhanced coverage thresholds
- `jest.setup.js` - Add MSW integration
- `playwright.config.ts` - Enhanced with auth fixtures
- `README.md` - Add testing documentation section
- `package.json` - Add MSW dependency

---

## Testing Checklist

### Before Starting
- [ ] Install MSW: `npm install -D msw@latest`
- [ ] Install faker: `npm install -D @faker-js/faker`
- [ ] Create `.env.test` from `.env.test.example`
- [ ] Verify Firebase emulator installed (optional)
- [ ] Verify Plaid sandbox credentials available
- [ ] Create test Firebase project or use emulator

### During Implementation
- [ ] Write test for new function/component **before** or **with** implementation
- [ ] Ensure each test has meaningful assertions (not just smoke tests)
- [ ] Test edge cases (zero, negative, null, huge numbers)
- [ ] Mock external services (Firebase, Plaid, OpenAI)
- [ ] Use test data factories for consistent test data
- [ ] Add `data-testid` attributes for E2E tests
- [ ] Run tests locally before committing: `npm run test && npm run test:e2e`

### Before Merging PR
- [ ] All tests pass locally
- [ ] Coverage threshold met (80% overall, 90% financial)
- [ ] No skipped or pending tests without justification
- [ ] E2E tests recorded (Playwright trace)
- [ ] CI pipeline passes
- [ ] Coverage report reviewed
- [ ] No hardcoded credentials in tests

---

## Documentation Requirements

### README Updates

Add section to `README.md`:

```markdown
## Testing

### Running Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific test file
npm run test -- src/lib/__tests__/financial-validator.test.ts
```

### Test Environment Setup

1. Copy `.env.test.example` to `.env.test`:
   ```bash
   cp .env.test.example .env.test
   ```

2. Fill in test credentials in `.env.test`

3. (Optional) Install Firebase emulator:
   ```bash
   npm install -g firebase-tools
   firebase init emulators
   ```

### Test Coverage

- Overall target: **80%+**
- Financial calculations: **90%+**
- View coverage report: Open `coverage/lcov-report/index.html` after running `npm run test:coverage`

### Continuous Integration

Tests run automatically on:
- Push to `main`, `master`, or `develop` branches
- Pull requests to `main` or `master`

All tests must pass for PRs to be merged.

### Writing Tests

See [TESTING.md](docs/TESTING.md) for detailed testing guidelines.
```

### Create `docs/TESTING.md`

Comprehensive testing guide with:
- Test file organization conventions
- Mock usage patterns
- Test data factory examples
- E2E test best practices
- Troubleshooting common issues
- Example test patterns

---

## Future Enhancements (Out of Scope for Initial Implementation)

### Phase 6: Advanced Testing (Future)
- Visual regression testing with Percy or Chromatic
- Accessibility testing with `@axe-core/playwright`
- Performance testing with Lighthouse CI
- Load testing with k6 or Artillery
- Mutation testing with Stryker

### Phase 7: Test Optimization (Future)
- Test sharding for faster CI
- Parallel E2E test execution
- Incremental testing (only test changed code)
- Snapshot testing for UI components

### Phase 8: Quality Improvements (Future)
- Contract testing for API integrations
- Chaos engineering for resilience testing
- Security testing integration (OWASP ZAP)
- Fuzz testing for input validation

---

## References & Research

### Internal References
- Existing config: `jest.config.js:1-49`
- Existing mocks: `jest.setup.js:1-247`
- Existing test: `src/lib/__tests__/financial-accuracy.test.ts:1-67`
- Financial functions: `src/lib/financial-calculator.ts`, `src/lib/financial-validator.ts`

### External References
- [Next.js Testing Documentation](https://nextjs.org/docs/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Library](https://testing-library.com/docs/)
- [MSW Documentation](https://mswjs.io/docs/)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

### Best Practices
- [Kent C. Dodds - Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)
- [Martin Fowler - Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Google Testing Blog](https://testing.googleblog.com/)

---

## Questions for Clarification

Before starting implementation, please confirm:

1. **CI Platform**: Confirm GitHub Actions is the preferred CI platform? (assumed yes)
2. **Firebase Strategy**: Should we use Firebase Emulator for E2E tests or a staging Firebase project?
3. **OpenAI in E2E**: Should E2E tests use real OpenAI API (with test key) or mocked responses?
4. **Plaid OAuth**: How should we handle Plaid OAuth in E2E tests? (Direct token injection, sandbox OAuth, or full mock?)
5. **Coverage Service**: Should we set up Codecov (free for open source) or another coverage service?
6. **Test User Management**: Should we create real test users in Firebase or use emulator-only users?

---

**Ready to Implement**: YES ✅
**Blocked By**: None (all prerequisites available)
**Estimated Timeline**: 2-3 weeks (15 days)
**Priority**: CRITICAL for production deployment