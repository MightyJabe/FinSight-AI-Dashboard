# FinSight AI Dashboard

[![Build Status](https://img.shields.io/github/actions/workflow/status/MightyJade/finsight-ai-dashboard/ci.yml?branch=main)](https://github.com/MightyJade/finsight-ai-dashboard/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-blue)](https://tailwindcss.com)

## Table of Contents
- [Description](#description)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Local Development](#local-development)
  - [Live Demo](#live-demo)
- [Configuration](#configuration)
- [Deployment](#deployment)
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

![Dashboard Overview](docs/images/dashboard-overview.png)
*Main dashboard showing financial overview and AI insights*

## Quick Start

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm, yarn, pnpm, or bun package manager

### Dependencies

#### Core Dependencies
- Next.js 15.3.2
- React 19.0.0
- React DOM 19.0.0

#### Development Dependencies
- TypeScript 5
- @types/node 20
- @types/react 19
- @types/react-dom 19
- @tailwindcss/postcss 4
- tailwindcss 4
- eslint 9
- eslint-config-next 15.3.2
- @eslint/eslintrc 3

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

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local` (see [.env.example](.env.example) for reference):
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Plaid
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox

# OpenAI
OPENAI_API_KEY=your_api_key
```

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Usage

### Local Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### Live Demo

- Production: [https://finsight.ai](https://finsight.ai)
- Staging: [https://staging.finsight.ai](https://staging.finsight.ai)

## Configuration

### Required Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase configuration | Yes | - |
| `PLAID_CLIENT_ID` | Plaid API client ID | Yes | - |
| `PLAID_SECRET` | Plaid API secret | Yes | - |
| `PLAID_ENV` | Plaid environment | Yes | sandbox |
| `OPENAI_API_KEY` | OpenAI API key | Yes | - |

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MightyJade/finsight-ai-dashboard)

### Deployment Environments
- Development: `dev.finsight.ai`
- Staging: `staging.finsight.ai`
- Production: `finsight.ai`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the TypeScript style guide
- Use Prettier for code formatting
- Write meaningful commit messages
- Include tests for new features
- Follow the folder structure conventions
- Use proper naming conventions

### Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Run linting
npm run lint

# Run type checking
npm run type-check
```

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