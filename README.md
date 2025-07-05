# FinSight AI Dashboard

[![Build Status](https://img.shields.io/github/actions/workflow/status/MightyJade/finsight-ai-dashboard/ci.yml?branch=main)](https://github.com/MightyJade/finsight-ai-dashboard/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.1.0-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org)

An intelligent financial management platform that aggregates all your financial accounts into one unified dashboard. Powered by GPT-4 for personalized insights, budget recommendations, and investment optimizations.

## Features

- **Multi-Account Dashboard** - Connect and view all financial accounts in one place
- **AI-Powered Insights** - GPT-4 analyzes your finances for personalized recommendations
- **Smart Budgeting** - Real-time tracking with intelligent spending analysis
- **Investment Optimization** - Portfolio analysis and opportunity identification
- **Cash Flow Forecasting** - Predict future financial states and plan ahead
- **Secure & Private** - Bank-level encryption with multi-factor authentication

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
```

### Quality Checks (run before committing)

```bash
npm run lint && npm run type-check && npm run test:all && npm run build
```

## Documentation

- **[project.md](project.md)** - Technical architecture and design details
- **[CLAUDE.md](CLAUDE.md)** - AI assistant guidelines for development
- **[.cursor/rules/](/.cursor/rules/)** - Detailed development rules and patterns
- **[API Documentation](docs/API.md)** - API endpoints and usage

## Environment Variables

See `.env.example` for required variables. Key integrations:

- **Firebase** - Authentication and database
- **Plaid** - Financial account aggregation
- **OpenAI** - AI-powered insights

## Project Structure

```
src/
├── app/          # Next.js app router
├── components/   # React components
├── lib/          # Core configurations
├── hooks/        # Custom React hooks
├── utils/        # Utility functions
└── types/        # TypeScript types
```

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

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
- **Module not found** - Run `npm install` and clear Next.js cache

For detailed troubleshooting, see [project.md](project.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [project.md](project.md)
- **Issues**: [GitHub Issues](https://github.com/MightyJade/finsight-ai-dashboard/issues)
- **Security**: Report to security@finsight.ai
