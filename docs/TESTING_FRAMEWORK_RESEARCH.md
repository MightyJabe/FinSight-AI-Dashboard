# Testing Framework Research: Official Documentation

**Research Date:** January 17, 2025
**Target Stack:** Next.js 14, TypeScript, Jest, Playwright, React Testing Library
**Latest Versions:**
- Jest: 30.2.0
- Playwright: 1.57.0
- MSW: 2.12.7

---

## Table of Contents

1. [Jest Configuration for Next.js 14](#1-jest-configuration-for-nextjs-14)
2. [Playwright Setup and Best Practices](#2-playwright-setup-and-best-practices)
3. [React Testing Library](#3-react-testing-library)
4. [Testing Library Jest-DOM](#4-testing-library-jest-dom)
5. [Mock Service Worker (MSW)](#5-mock-service-worker-msw)
6. [Firebase Admin SDK Testing](#6-firebase-admin-sdk-testing)
7. [GitHub Actions CI/CD](#7-github-actions-cicd)
8. [Coverage Reporting](#8-coverage-reporting)

---

## 1. Jest Configuration for Next.js 14

### Overview

Next.js provides `next/jest` package that automatically configures Jest with SWC compiler support, handling transformations, auto-mocking, and environment setup.

### Installation

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom ts-node @types/jest
```

### Configuration File

**TypeScript Configuration** (`jest.config.ts`):

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Path alias mapping (if using @/ aliases)
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
  },
}

export default createJestConfig(config)
```

**JavaScript Configuration** (`jest.config.js`):

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
  },
}

module.exports = createJestConfig(config)
```

### Setup File

Create `jest.setup.ts` to configure custom matchers:

```typescript
import '@testing-library/jest-dom'
```

### Automatic Configuration by next/jest

The `next/jest` package automatically handles:

- **Transform**: Next.js Compiler (SWC) setup
- **Auto-mocking**: `.css`, `.module.css`, image imports, `next/font`
- **Environment variables**: `.env` files loaded into `process.env`
- **Ignore patterns**: `node_modules`, `.next`
- **SWC transforms**: Loaded from `next.config.js`

### Module Name Mapper Patterns

**Static Assets:**

```javascript
moduleNameMapper: {
  '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
  '\\.(gif|ttf|eot|svg)$': '<rootDir>/__mocks__/fileMock.js',
  '\\.(jpg|jpeg|png|webp)$': '<rootDir>/__mocks__/imageMock.js',
}
```

**Path Aliases with Regex:**

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
  'module_name_(.*)': '<rootDir>/substituted_module_$1.js',
  'assets/(.*)': [
    '<rootDir>/images/$1',
    '<rootDir>/photos/$1',
  ],
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --runInBand --coverage",
    "test:all": "jest --coverage --collectCoverageFrom='src/**/*.{ts,tsx}' --collectCoverageFrom='!src/**/*.d.ts'"
  }
}
```

### Example Test Structure

**Component Test:**

```typescript
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Page from '@/app/page'

describe('Page', () => {
  it('renders a heading', () => {
    render(<Page />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
  })
})
```

**Snapshot Test:**

```typescript
import { render } from '@testing-library/react'
import Page from '@/app/page'

it('renders homepage unchanged', () => {
  const { container } = render(<Page />)
  expect(container).toMatchSnapshot()
})
```

### Key Limitations

- **Async Server Components**: Not supported by Jest; use E2E tests (Playwright) instead
- **Environment Variables**: Load manually in setup script for direct testing
- **Server-Side Code**: Test API routes and server functions separately

### Best Practices

1. Use `jest.config.ts` with TypeScript for type safety
2. Always use `createJestConfig()` from `next/jest` to wrap your config
3. Keep test files co-located with components or in `__tests__` directories
4. Use descriptive test names with `describe()` and `it()`
5. Aim for 80%+ code coverage, 90%+ for financial calculations

---

## 2. Playwright Setup and Best Practices

### Overview

Playwright is a cross-browser automation framework that enables reliable end-to-end testing for web applications across Chromium, Firefox, and WebKit.

### Installation

```bash
npm install -D @playwright/test
npx playwright install --with-deps
```

### Configuration

**Basic Configuration** (`playwright.config.ts`):

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Page Object Model (POM)

**Page Object Class:**

```typescript
// tests/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByLabel(/email/i)
    this.passwordInput = page.getByLabel(/password/i)
    this.submitButton = page.getByRole('button', { name: /login/i })
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
```

**Using Page Object:**

```typescript
import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'

test.describe('Login Flow', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  test('should login successfully', async ({ page }) => {
    await loginPage.login('user@example.com', 'password123')
    await expect(page).toHaveURL('/dashboard')
  })
})
```

### API Testing Configuration

**GitHub API Example:**

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  use: {
    baseURL: 'https://api.example.com',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${process.env.API_TOKEN}`,
    },
  },
})
```

**API Test Example:**

```typescript
import { test, expect } from '@playwright/test'

test('GET /api/user returns user data', async ({ request }) => {
  const response = await request.get('/user/123')
  expect(response.ok()).toBeTruthy()

  const data = await response.json()
  expect(data).toHaveProperty('id', '123')
  expect(data).toHaveProperty('email')
})
```

### GitHub Actions Integration

```yaml
name: Playwright Tests
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: lts/*

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test

      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Best Practices

1. **Use Page Object Model**: Encapsulate page interactions for reusability
2. **Auto-waiting**: Playwright automatically waits for elements to be actionable
3. **Isolation**: Each test runs in a new browser context (fresh cookies/storage)
4. **Screenshots and Traces**: Enable on failure for debugging
5. **Parallel Execution**: Tests run in parallel by default
6. **CI Optimization**: Use fewer workers and retries in CI environments

---

## 3. React Testing Library

### Overview

React Testing Library provides utilities for testing React components by simulating user interactions and focusing on accessibility.

### Core Principles

- Test components the way users interact with them
- Focus on accessibility (ARIA roles, labels)
- Avoid testing implementation details
- Query by role, label, text (not test IDs)

### Basic Component Test

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

test('loads and displays greeting', async () => {
  const user = userEvent.setup()

  render(<Fetch url="/greeting" />)

  await user.click(screen.getByText('Load Greeting'))
  await screen.findByRole('heading')

  expect(screen.getByRole('heading')).toHaveTextContent('hello there')
  expect(screen.getByRole('button')).toBeDisabled()
})
```

### Testing Hooks

**Using renderHook:**

```typescript
import { renderHook } from '@testing-library/react'
import { useLoggedInUser } from '@/hooks/use-logged-in-user'

test('returns logged in user', () => {
  const { result } = renderHook(() => useLoggedInUser())
  expect(result.current).toEqual({ name: 'Alice' })
})
```

**Hook with State Updates:**

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCounter } from '@/hooks/use-counter'

test('increments counter', () => {
  const { result } = renderHook(() => useCounter())

  expect(result.current.count).toBe(0)

  act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})
```

### Form Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('submits form with correct values', async () => {
  const handleSubmit = jest.fn()
  const user = userEvent.setup()

  render(<MyForm onSubmit={handleSubmit} />)

  await user.type(screen.getByRole('textbox', { name: /first name/i }), 'John')
  await user.type(screen.getByRole('textbox', { name: /last name/i }), 'Doe')
  await user.type(screen.getByRole('textbox', { name: /email/i }), 'john@example.com')

  await user.click(screen.getByRole('button', { name: /submit/i }))

  await waitFor(() =>
    expect(handleSubmit).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    })
  )
})
```

### Custom Queries

**Define Custom Query by data-cy:**

```typescript
// test-utils/custom-queries.ts
import { queryHelpers, buildQueries, Matcher, MatcherOptions } from '@testing-library/react'

const queryAllByDataCy = (
  container: HTMLElement,
  id: Matcher,
  options?: MatcherOptions
) => queryHelpers.queryAllByAttribute('data-cy', container, id, options)

const getMultipleError = (c, dataCyValue) =>
  `Found multiple elements with data-cy="${dataCyValue}"`

const getMissingError = (c, dataCyValue) =>
  `Unable to find element with data-cy="${dataCyValue}"`

export const [
  queryByDataCy,
  getAllByDataCy,
  getByDataCy,
  findAllByDataCy,
  findByDataCy,
] = buildQueries(queryAllByDataCy, getMultipleError, getMissingError)
```

**Custom Render Function:**

```typescript
// test-utils/index.ts
import { render, queries, RenderOptions } from '@testing-library/react'
import * as customQueries from './custom-queries'
import { ReactElement } from 'react'

const allQueries = {
  ...queries,
  ...customQueries,
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'queries'>
) => render(ui, { queries: allQueries, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

### User Event vs FireEvent

**Prefer User Event:**

```typescript
// ✅ GOOD - Simulates real user behavior
const user = userEvent.setup()
await user.type(input, 'Hello')
await user.click(button)

// ❌ AVOID - Lower-level, doesn't simulate full user behavior
fireEvent.change(input, { target: { value: 'Hello' } })
fireEvent.click(button)
```

### Query Priority

1. **getByRole**: Preferred for accessibility
2. **getByLabelText**: For form fields
3. **getByPlaceholderText**: If label not available
4. **getByText**: For non-interactive elements
5. **getByTestId**: Last resort only

---

## 4. Testing Library Jest-DOM

### Overview

`@testing-library/jest-dom` provides custom Jest matchers for testing the DOM state, making assertions more readable and maintainable.

### Setup

**Installation:**

```bash
npm install -D @testing-library/jest-dom
```

**Configuration in jest.setup.ts:**

```typescript
import '@testing-library/jest-dom'
```

**Jest Config:**

```typescript
{
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
}
```

### Common Matchers

#### toBeInTheDocument()

```typescript
expect(screen.getByRole('button')).toBeInTheDocument()
expect(screen.queryByText('Not here')).not.toBeInTheDocument()
```

#### toHaveTextContent()

```typescript
const element = screen.getByTestId('greeting')

// Exact match
expect(element).toHaveTextContent('Hello World')

// Regex pattern
expect(element).toHaveTextContent(/Hello/)
expect(element).toHaveTextContent(/Price: \$\d+\.\d+/)

// Whitespace normalization (default: true)
expect(element).toHaveTextContent('Line 1 Line 2')

// Preserve whitespace
expect(element).toHaveTextContent(/Line 1\s+Line 2/, {
  normalizeWhitespace: false
})
```

#### toBeDisabled() / toBeEnabled()

```typescript
const button = screen.getByRole('button')
expect(button).toBeDisabled()

const input = screen.getByRole('textbox')
expect(input).toBeEnabled()

// Elements inside disabled fieldset
const fieldsetInput = screen.getByTestId('disabled-input')
expect(fieldsetInput).toBeDisabled()
```

#### toHaveValue()

```typescript
const input = screen.getByRole('textbox')
expect(input).toHaveValue('John Doe')

const checkbox = screen.getByRole('checkbox')
expect(checkbox).toBeChecked()
```

#### toHaveAttribute()

```typescript
const link = screen.getByRole('link')
expect(link).toHaveAttribute('href', '/dashboard')
expect(link).toHaveAttribute('target', '_blank')
```

#### toHaveClass()

```typescript
const element = screen.getByTestId('card')
expect(element).toHaveClass('bg-white')
expect(element).toHaveClass('shadow-lg', 'rounded-lg')
```

#### toBeVisible()

```typescript
const element = screen.getByText('Visible text')
expect(element).toBeVisible()

const hidden = screen.getByTestId('hidden')
expect(hidden).not.toBeVisible()
```

### Complete Example

```typescript
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

function LoginForm() {
  return (
    <form>
      <input type="text" data-testid="username" />
      <input type="password" data-testid="password" />
      <button type="submit" data-testid="submit" disabled>
        Login
      </button>
      <fieldset disabled>
        <input type="text" data-testid="disabled-input" />
      </fieldset>
    </form>
  )
}

test('handles form elements correctly', () => {
  render(<LoginForm />)

  // Disabled state
  expect(screen.getByTestId('submit')).toBeDisabled()
  expect(screen.getByTestId('disabled-input')).toBeDisabled()

  // Enabled state
  expect(screen.getByTestId('username')).toBeEnabled()

  // Presence
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
})
```

---

## 5. Mock Service Worker (MSW)

### Overview

MSW intercepts network requests at the network level, providing seamless API mocking for both browser and Node.js environments without changing application code.

### Installation

```bash
npm install -D msw@latest
```

### Setup for Node.js Testing

**1. Define Request Handlers:**

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // REST API mock
  http.get('https://api.example.com/user', () => {
    return HttpResponse.json({
      id: 'abc-123',
      firstName: 'John',
      lastName: 'Maverick',
      email: 'john@example.com',
    })
  }),

  // POST request
  http.post('/api/transactions', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      success: true,
      transactionId: 'txn_123',
      data: body,
    })
  }),

  // Error response
  http.get('/api/error', () => {
    return new HttpResponse(null, { status: 500 })
  }),
]
```

**2. Create Server Instance:**

```typescript
// src/mocks/node.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

**3. Configure Jest Setup:**

```typescript
// jest.setup.ts
import '@testing-library/jest-dom'
import { server } from './src/mocks/node'

// Establish API mocking before all tests
beforeAll(() => {
  server.listen()
})

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers()
})

// Clean up after all tests
afterAll(() => {
  server.close()
})
```

### Usage in Tests

**Basic Test with Mocked API:**

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('loads user data on button click', async () => {
  const user = userEvent.setup()

  render(<UserProfile />)

  await user.click(screen.getByRole('button', { name: /load/i }))

  await waitFor(() => {
    expect(screen.getByText('John Maverick')).toBeInTheDocument()
  })
})
```

**Override Handler for Specific Test:**

```typescript
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/node'

test('handles API error', async () => {
  // Override default handler for this test
  server.use(
    http.get('https://api.example.com/user', () => {
      return new HttpResponse(null, { status: 500 })
    })
  )

  render(<UserProfile />)

  await waitFor(() => {
    expect(screen.getByText(/error loading user/i)).toBeInTheDocument()
  })
})
```

### Advanced Patterns

**Request Matching:**

```typescript
http.get('/api/users/:userId', ({ params }) => {
  const { userId } = params
  return HttpResponse.json({
    id: userId,
    name: 'User ' + userId,
  })
})
```

**Query Parameters:**

```typescript
http.get('/api/search', ({ request }) => {
  const url = new URL(request.url)
  const query = url.searchParams.get('q')

  return HttpResponse.json({
    results: [`Result for ${query}`],
  })
})
```

**Delayed Response:**

```typescript
import { delay } from 'msw'

http.get('/api/slow', async () => {
  await delay(1000)
  return HttpResponse.json({ data: 'Delayed response' })
})
```

**GraphQL Mocking:**

```typescript
import { graphql, HttpResponse } from 'msw'

export const handlers = [
  graphql.query('GetUser', ({ query, variables }) => {
    return HttpResponse.json({
      data: {
        user: {
          id: variables.id,
          name: 'John Doe',
        },
      },
    })
  }),
]
```

### Best Practices

1. **Centralize Handlers**: Keep all handlers in one file for reusability
2. **Reset After Tests**: Always use `server.resetHandlers()` in `afterEach`
3. **Override Sparingly**: Use `server.use()` only when needed in specific tests
4. **Match Actual APIs**: Keep mocked responses consistent with real API shape
5. **Test Error Cases**: Mock error responses to test error handling

---

## 6. Firebase Admin SDK Testing

### Overview

Firebase Admin SDK testing requires careful handling of authentication, initialization, and environment configuration.

### Initialization Patterns

**Default Initialization (Google Environments):**

```typescript
import { initializeApp } from 'firebase-admin/app'

const app = initializeApp()
```

**Service Account (Non-Google Environments):**

```typescript
import { initializeApp, applicationDefault } from 'firebase-admin/app'

const app = initializeApp({
  credential: applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID,
})
```

### Testing Strategies

#### 1. Mocking Firebase Admin SDK

**Mock Implementation:**

```typescript
// __mocks__/firebase-admin.ts
export const mockAuth = {
  verifyIdToken: jest.fn(),
  getUser: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}

export const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
    where: jest.fn(() => ({
      get: jest.fn(),
    })),
  })),
}

const mockApp = {
  auth: () => mockAuth,
  firestore: () => mockFirestore,
}

export const initializeApp = jest.fn(() => mockApp)
export const getAuth = jest.fn(() => mockAuth)
export const getFirestore = jest.fn(() => mockFirestore)
export const applicationDefault = jest.fn()
```

**Using Mocks in Tests:**

```typescript
import { mockAuth, mockFirestore } from 'firebase-admin'
import { verifyToken } from '@/lib/auth-server'

describe('verifyToken', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('verifies valid token', async () => {
    const mockDecodedToken = {
      uid: 'user123',
      email: 'user@example.com',
    }

    mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken)

    const result = await verifyToken('valid-token')

    expect(result).toEqual(mockDecodedToken)
    expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token')
  })

  it('throws error for invalid token', async () => {
    mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'))

    await expect(verifyToken('invalid-token')).rejects.toThrow('Invalid token')
  })
})
```

#### 2. Firebase Emulator Suite

**Setup:**

```bash
npm install -D firebase-tools
npx firebase init emulators
```

**Configuration (firebase.json):**

```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

**Test Setup with Emulators:**

```typescript
// jest.setup.ts
const FIRESTORE_EMULATOR_HOST = 'localhost:8080'
const AUTH_EMULATOR_HOST = 'localhost:9099'

process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST
process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_EMULATOR_HOST

beforeAll(async () => {
  // Wait for emulators to be ready
  await new Promise(resolve => setTimeout(resolve, 1000))
})
```

**Using Emulators in Tests:**

```typescript
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

describe('User CRUD operations', () => {
  const auth = getAuth()
  const db = getFirestore()

  afterEach(async () => {
    // Clean up test data
    const users = await auth.listUsers()
    await Promise.all(users.users.map(u => auth.deleteUser(u.uid)))
  })

  it('creates a new user', async () => {
    const userRecord = await auth.createUser({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(userRecord.email).toBe('test@example.com')

    // Verify in Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get()
    expect(userDoc.exists).toBe(true)
  })
})
```

### Environment Configuration

```typescript
// src/lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize only once
if (!getApps().length) {
  if (process.env.NODE_ENV === 'test') {
    // Use emulators in test environment
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    })
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Production with service account
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    })
  } else {
    // Development with application default credentials
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    })
  }
}

export const adminAuth = getAuth()
export const adminDb = getFirestore()
```

### Best Practices

1. **Mock for Unit Tests**: Use Jest mocks for isolated unit tests
2. **Emulators for Integration**: Use Firebase Emulator Suite for integration tests
3. **Clean Up**: Always clean up test data in `afterEach` hooks
4. **Environment Separation**: Use different Firebase projects for dev/test/prod
5. **Error Handling**: Test both success and error scenarios

---

## 7. GitHub Actions CI/CD

### Overview

GitHub Actions provides automated CI/CD workflows for running tests, generating coverage reports, and deploying applications.

### Complete Test Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

env:
  NODE_VERSION: '20.x'

jobs:
  test:
    name: Test Suite
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: ['18.x', '20.x']

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:ci
        env:
          FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v5
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/coverage-final.json
          flags: unittests
          name: unit-test-coverage
          fail_ci_if_error: true

      - name: Build application
        run: npm run build

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: test

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test
        env:
          BASE_URL: http://localhost:3000

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload Playwright screenshots
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-screenshots
          path: test-results/
          retention-days: 7
```

### Environment Variables

**Repository Secrets:**

Navigate to: `Settings > Secrets and variables > Actions > New repository secret`

Required secrets:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT`
- `CODECOV_TOKEN`
- `PLAID_CLIENT_ID`
- `PLAID_SECRET`
- `OPENAI_API_KEY`

**Using Secrets in Workflow:**

```yaml
env:
  API_KEY: ${{ secrets.API_KEY }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Dependency Caching

**NPM Cache:**

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20.x'
    cache: 'npm'
```

**Yarn Cache:**

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20.x'
    cache: 'yarn'
```

**Manual Cache:**

```yaml
- name: Cache node modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### Matrix Builds

Test across multiple configurations:

```yaml
strategy:
  matrix:
    node-version: ['18.x', '20.x', '21.x']
    os: [ubuntu-latest, windows-latest, macos-latest]

runs-on: ${{ matrix.os }}

steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
```

### Conditional Steps

```yaml
- name: Deploy to production
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  run: npm run deploy

- name: Upload coverage
  if: ${{ !cancelled() }}
  uses: codecov/codecov-action@v5
```

### Best Practices

1. **Use `npm ci`**: Faster and more reliable than `npm install` in CI
2. **Cache Dependencies**: Use built-in caching from `setup-node`
3. **Parallel Jobs**: Split tests into separate jobs for faster execution
4. **Matrix Testing**: Test across multiple Node.js versions
5. **Artifact Upload**: Save test reports and screenshots
6. **Fail Fast**: Use `fail-fast: false` in matrix to see all results
7. **Concurrency Control**: Prevent concurrent runs on same branch

---

## 8. Coverage Reporting

### Jest Coverage Configuration

**In jest.config.ts:**

```typescript
const config: Config = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',

  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/__tests__/**',
    '!src/types/**',
  ],

  // Coverage thresholds
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/lib/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
  ],
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:coverage:watch": "jest --coverage --watch",
    "test:ci": "jest --ci --runInBand --coverage --maxWorkers=2"
  }
}
```

### Codecov Integration

**Installation:**

```bash
npm install -D @codecov/codecov-action
```

**GitHub Actions Configuration:**

```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v5
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: ./coverage/coverage-final.json,./coverage/lcov.info
    flags: unittests
    name: unit-test-coverage
    fail_ci_if_error: true
    verbose: true
```

**Alternative OIDC Authentication (More Secure):**

```yaml
- uses: codecov/codecov-action@v5
  with:
    use_oidc: true
    files: ./coverage/lcov.info

permissions:
  id-token: write
```

### Coverage Reports

**Text Output:**

```bash
npm run test:coverage
```

**HTML Report:**

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

**Coverage Badge (Codecov):**

```markdown
[![codecov](https://codecov.io/gh/username/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/username/repo)
```

### Best Practices

1. **Set Realistic Thresholds**: Start with 70%, gradually increase to 80-90%
2. **Higher Standards for Critical Code**: 90%+ for financial calculations
3. **Ignore Generated Files**: Exclude `.d.ts`, stories, test files
4. **Multiple Reporters**: Use text for CLI, HTML for detailed analysis
5. **CI Enforcement**: Fail builds if coverage drops below threshold
6. **Track Trends**: Use Codecov to monitor coverage over time

---

## Summary

This research document provides comprehensive guidance for setting up a complete testing infrastructure for Next.js 14 applications with TypeScript. The key frameworks and their purposes are:

1. **Jest + next/jest**: Unit and integration testing
2. **Playwright**: End-to-end browser testing
3. **React Testing Library**: Component testing with user-centric approach
4. **jest-dom**: Enhanced DOM assertions
5. **MSW**: API mocking for consistent test data
6. **Firebase Emulator Suite**: Local Firebase testing
7. **GitHub Actions**: Automated CI/CD pipeline
8. **Codecov**: Coverage tracking and reporting

### Implementation Checklist

- [ ] Install all required dependencies
- [ ] Configure `jest.config.ts` with next/jest
- [ ] Create `jest.setup.ts` for custom matchers
- [ ] Set up MSW handlers and server
- [ ] Configure Playwright with POM pattern
- [ ] Add test scripts to `package.json`
- [ ] Create GitHub Actions workflow
- [ ] Configure Codecov integration
- [ ] Set up Firebase emulators (optional)
- [ ] Define coverage thresholds
- [ ] Write initial test suite

### References

- [Next.js Testing Documentation](https://nextjs.org/docs/app/building-your-application/testing/jest)
- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Codecov Documentation](https://docs.codecov.com/)
