# FinSight AI Dashboard

[![Build Status](https://img.shields.io/github/actions/workflow/status/MightyJade/finsight-ai-dashboard/ci.yml?branch=main)](https://github.com/MightyJade/finsight-ai-dashboard/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.1.0-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-blue)](https://tailwindcss.com)

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
- [Development](#development)
  - [Local Development](#local-development)
  - [Testing](#testing)
  - [Code Style](#code-style)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Contact](#contact)

## Description

FinSight AI Dashboard is an intelligent financial management platform that brings together all your financial accounts into one unified dashboard. Powered by GPT-4, it provides personalized insights, budget recommendations, and investment optimizations to help you make better financial decisions.

### Key Features

- Multi-account financial data aggregation
- AI-powered financial insights
- Real-time budget tracking
- Investment portfolio optimization
- Cash flow analysis and forecasting
- Risk assessment and alerts
- Personalized financial goal tracking

## Features

### Financial Management

- Real-time account balance tracking
- Transaction categorization
- Budget planning and monitoring
- Investment portfolio analysis
- Cash flow forecasting
- Financial goal tracking

### AI-Powered Insights

- Personalized financial recommendations
- Spending pattern analysis
- Investment opportunity identification
- Risk assessment
- Market trend analysis
- Automated financial advice

### Security & Privacy

- End-to-end encryption
- Multi-factor authentication
- Regular security audits
- GDPR compliance
- Data retention policies
- Secure API key management

## Quick Start

### Prerequisites

- Node.js 18.17.0 or later
- npm 9.6.7 or later
- Git
- Firebase account
- Plaid developer account
- OpenAI API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/MightyJade/finsight-ai-dashboard.git
cd finsight-ai-dashboard
```

2. Install dependencies:

```bash
npm install
```

### Environment Setup

1. Copy the environment template:

```bash
cp .env.example .env.local
```

2. Configure your environment variables in `.env.local`:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Plaid Configuration
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox

# OpenAI Configuration
OPENAI_API_KEY=your_api_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Development

### Local Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run all tests with coverage
npm run test:coverage
```

### Code Style

- Follow the TypeScript style guide
- Use Prettier for code formatting
- Follow ESLint rules
- Write meaningful commit messages
- Include tests for new features

## API Documentation

### Authentication Endpoints

```typescript
POST / api / auth / login;
POST / api / auth / register;
POST / api / auth / logout;
GET / api / auth / session;
```

### Financial Data Endpoints

```typescript
POST / api / plaid / link - token;
POST / api / plaid / exchange - token;
GET / api / accounts;
GET / api / transactions;
GET / api / balance;
```

### AI Insights Endpoints

```typescript
POST /api/insights/generate
GET /api/insights
PUT /api/insights/:id
```

For detailed API documentation, see [API.md](docs/API.md).

## Deployment

### Environments

- Development: `dev.finsight.ai`
- Staging: `staging.finsight.ai`
- Production: `finsight.ai`

### Deployment Process

1. Push to main branch
2. GitHub Actions runs tests
3. Vercel deploys to staging
4. Manual approval for production
5. Vercel deploys to production

## Security

### Security Measures

- JWT-based authentication
- Refresh token rotation
- Rate limiting
- Input validation
- API key rotation
- Regular security audits

### Reporting Security Issues

Please report security issues to security@finsight.ai

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Troubleshooting

### Common Issues

#### Plaid Integration

- **Error**: "Invalid client_id or secret"

  - Solution: Verify your Plaid credentials in `.env.local`
  - Check if you're using the correct environment (sandbox/development)

- **Error**: "Link token creation failed"
  - Solution: Ensure your Plaid account is properly configured
  - Check if you have the necessary permissions

#### Firebase Authentication

- **Error**: "Firebase auth domain mismatch"
  - Solution: Add your domain to Firebase Auth settings
  - Update `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` in `.env.local`

#### OpenAI Integration

- **Error**: "Rate limit exceeded"
  - Solution: Check your OpenAI API usage
  - Implement proper rate limiting in your code

#### Development Server

- **Error**: "Module not found"
  - Solution: Run `npm install` to ensure all dependencies are installed
  - Clear Next.js cache with `npm run clean`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Maintainer: [Your Name](mailto:your.email@example.com)

Project Link: [https://github.com/MightyJade/finsight-ai-dashboard](https://github.com/MightyJade/finsight-ai-dashboard)
