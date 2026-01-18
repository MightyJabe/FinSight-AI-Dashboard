# FinSight AI Dashboard

[![Build Status](https://img.shields.io/github/actions/workflow/status/MightyJade/finsight-ai-dashboard/ci.yml?branch=main)](https://github.com/MightyJade/finsight-ai-dashboard/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.30-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)](https://www.typescriptlang.org)

An intelligent financial management platform that aggregates all your financial accounts into one unified dashboard. Powered by GPT-4 for personalized insights, budget recommendations, and investment optimizations.

## Features

### Core Features

- **Multi-Account Dashboard** - Connect and view all financial accounts in one place
- **AI-Powered Insights** - GPT-4 analyzes your finances for personalized recommendations
- **Smart Budgeting** - Real-time tracking with intelligent spending analysis
- **Investment Optimization** - Portfolio analysis and opportunity identification
- **Cash Flow Forecasting** - Predict future financial states and plan ahead
- **Secure & Private** - Bank-level encryption with multi-factor authentication

### Additional Features

- **[Tax Intelligence](/tax)** - AI-powered deduction analysis, quarterly tax estimates, and personalized tax strategies
- **[Subscription Management](/subscriptions)** - Automatic recurring charge detection with monthly/yearly cost tracking
- **[Manual Entry](/manual-data)** - Track all assets (real estate, vehicles, jewelry, etc.) and informal debts
- **[Document Management](/documents)** - Upload and analyze financial documents with GPT-4 vision

## Quick Start

### Prerequisites

- Node.js 18.17+ and npm 9.6+
- Accounts: [Firebase](https://firebase.google.com/), [Plaid](https://plaid.com/), [OpenAI](https://openai.com/)

### Installation

```bash
# Clone and install
git clone https://github.com/MightyJade/finsight-ai-dashboard.git
cd finsight-ai-dashboard
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app.

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Check code quality
npm run type-check   # TypeScript validation
npm run analyze      # Build with bundle analyzer
npm run clean        # Remove .next cache and tsbuildinfo
```

### Quality Checks (run before committing)

```bash
npm run lint && npm run type-check && npm run test:all && npm run build
```

## Testing

Comprehensive testing infrastructure with unit tests, integration tests, and E2E tests.

### Test Commands

```bash
# Unit & Integration Tests (Jest)
npm run test              # Run all tests
npm run test:watch        # Watch mode for development
npm run test:coverage     # Run with coverage report
npm run test:ci           # CI-optimized (runs in band)

# E2E Tests (Playwright)
npx playwright test              # Run all E2E tests
npx playwright test --ui         # Run with UI mode
npx playwright test --debug      # Run in debug mode
npx playwright show-report       # View last test report

# Full Test Suite
npm run test:all          # Run unit + E2E tests
```

### Test Coverage

Current test coverage:
- **167 Unit Tests** across utilities, validators, API routes, and components
- **40+ E2E Tests** covering authentication and dashboard flows
- **Coverage Targets**: 80% global, 90% for financial calculations

#### Coverage by Area
- ✅ **Utils** (100%): formatCurrency, formatPercentage, formatDate, truncateText
- ✅ **Financial Validator** (84%): 47 tests covering all validation scenarios
- ✅ **API Routes** (80%+): Transaction categorization with AI integration
- ✅ **Auth Components** (100%): AuthGuard with all edge cases
- 🔄 **Components**: In progress
- 🔄 **Hooks**: In progress

### Test Structure

```
tests/
├── e2e/                          # Playwright E2E tests
│   ├── .auth/                    # Authenticated session storage
│   ├── pages/                    # Page Object Models
│   │   ├── LoginPage.ts          # Login page POM
│   │   └── DashboardPage.ts      # Dashboard page POM
│   ├── auth.setup.ts             # Auth setup fixture
│   ├── auth.spec.ts              # Authentication flow tests
│   └── dashboard.spec.ts         # Dashboard flow tests
├── factories/                    # Test data factories
│   ├── user.factory.ts           # User test data
│   ├── transaction.factory.ts   # Transaction test data
│   └── account.factory.ts        # Account test data
└── utils/
    └── test-helpers.ts           # Shared test utilities

src/
├── __mocks__/                    # Global mocks
│   └── plaid.ts                  # Plaid API mock
├── lib/__mocks__/                # Library mocks
│   ├── ai-categorization.ts      # AI service mock
│   └── logger.ts                 # Logger mock
├── lib/__tests__/                # Library tests
│   ├── financial-validator.test.ts  # 47 tests
│   └── utils.test.ts                # 82 tests
├── components/**/__tests__/      # Component tests
│   └── auth/__tests__/
│       └── AuthGuard.test.tsx    # 18 tests
└── app/api/**/__tests__/         # API route tests
    └── transactions/categorize/__tests__/
        └── route.test.ts         # 20 tests
```

### Writing Tests

#### Unit Test Example
```typescript
import { formatCurrency } from '@/lib/utils';

describe('formatCurrency', () => {
  it('should format USD currency', () => {
    expect(formatCurrency(1234.56, 'USD')).toContain('1,234');
  });
});
```

#### Component Test Example
```typescript
import { render, screen } from '@testing-library/react';
import { AuthGuard } from '../AuthGuard';

describe('AuthGuard', () => {
  it('should render children when authenticated', () => {
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );
    expect(screen.getByText('Protected Content')).toBeTruthy();
  });
});
```

#### E2E Test Example
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password');
  await expect(page).toHaveURL('/dashboard');
});
```

### Test Environment

E2E tests require test credentials:

```bash
# .env.test
E2E_TEST_EMAIL=test@example.com
E2E_TEST_PASSWORD=testpassword123

# Firebase test project credentials
NEXT_PUBLIC_FIREBASE_API_KEY=your-test-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-test-project
# ... other Firebase config
```

### CI/CD Integration

Tests run automatically on every push and PR via GitHub Actions:

- ✅ **Lint & Type Check** - ESLint + TypeScript validation
- ✅ **Unit Tests** - Jest with coverage reporting to Codecov
- ✅ **E2E Tests** - Playwright across Chromium, Firefox, WebKit
- ✅ **Build Validation** - Production build verification

Coverage reports are uploaded to [Codecov](https://codecov.io) for tracking over time.

### Continuous Testing

For active development:

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Watch tests
npm run test:watch

# Terminal 3: E2E tests (when needed)
npx playwright test --ui
```

### Best Practices

1. **Test First**: Write tests for new features before implementation
2. **Coverage Targets**: Maintain 80% global coverage, 90% for financial code
3. **Data Factories**: Use test factories for consistent test data
4. **Page Object Models**: Use POMs for E2E tests to reduce duplication
5. **Mock External APIs**: Always mock Plaid, OpenAI, and Firebase in unit tests
6. **Test Edge Cases**: Cover loading, error, and empty states
7. **Accessibility**: Include a11y checks in E2E tests

## Documentation

- **[CLAUDE.md](CLAUDE.md)** - Development standards, coding conventions, and Claude Code integration
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
- **[docs/technical/](docs/technical/)** - Technical guides and implementation details
- **[docs/planning/](docs/planning/)** - Feature roadmap and planning documents

## Environment Variables

See `.env.example` for required variables. Key integrations:

- **Firebase** - Authentication and database
- **Plaid** - Financial account aggregation
- **OpenAI** - AI-powered insights
- **Redis (optional)** - Distributed rate limiting; falls back to in-memory if not set

## Project Structure

```
src/
├── app/          # Next.js App Router (pages + API routes)
├── components/   # React components by feature
├── hooks/        # Custom React hooks (use-*.ts)
├── lib/          # Core library code
├── types/        # TypeScript interfaces
└── utils/        # Utility functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

- **Plaid "Invalid credentials"** - Verify credentials in `.env.local` and check environment (sandbox/development)
- **Firebase auth errors** - Add your domain to Firebase Auth settings
- **OpenAI rate limits** - Check API usage and implement proper rate limiting
- **Module not found** - Run `npm install` and clear Next.js cache with `npm run clean`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Development Guide**: [CLAUDE.md](CLAUDE.md)
- **Issues**: [GitHub Issues](https://github.com/MightyJade/finsight-ai-dashboard/issues)

---

<!-- Test: Vercel deployment checks integration -->
