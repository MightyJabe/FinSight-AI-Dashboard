# Changelog

All notable changes to the FinSight AI Dashboard project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-28

### Added

- **Consolidated Development Roadmap** - Single source of truth for project planning
- **Financial Accuracy Enforcement System** - Zero-tolerance validation for all calculations
- **GPT-5.1 Integration** - Enhanced AI capabilities with 45% fewer errors
- **Comprehensive Testing Strategy** - Jest + Playwright with 80%+ coverage
- **Performance Optimization** - 30% bundle size reduction
- **Enhanced Chat Visualization** - Fixed net worth display inconsistencies

### Changed

- **Documentation Structure** - Consolidated multiple .md files into organized structure
- **AI Chat Data Flow** - Now uses centralized financial calculator for accuracy
- **Project Organization** - Removed redundant and outdated documentation

### Removed

- **Redundant Documentation** - Consolidated CLAUDE.md, SETUP.md, GPT5-UPGRADE.md, etc.
- **Outdated Planning Files** - Merged into comprehensive ROADMAP.md

## [1.0.0] - Previous Versions

### Previous Features

- **Enhanced AI Transaction Categorization System**
  - Smart fallback categorization for immediate results (McDonald's → "Dining Out", etc.)
  - Auto-categorization banner with improved user guidance
  - Two-tier system: Basic pattern matching + AI enhancement option
  - Real-time transaction list updates after AI processing
  - Better user messaging distinguishing basic vs AI categorization
- **Comprehensive Investment Performance Tracking**
  - New `/api/investment-performance` endpoint with advanced financial calculations
  - Performance metrics including Sharpe ratio, volatility, and asset allocation
  - Historical portfolio tracking with time-based analytics
  - AI-powered investment insights and recommendations
  - Interactive charts for portfolio visualization

- **Cryptocurrency Portfolio Integration**
  - New `/crypto` page for dedicated crypto portfolio management
  - Real-time price integration with CoinGecko API
  - Comprehensive crypto analytics including diversification scoring
  - Auto-refresh capabilities for live price updates
  - Risk assessment and portfolio concentration warnings
  - Advanced crypto-specific charts and visualizations

- **Enhanced Type System**
  - Centralized type definitions in `/src/types/`
  - New crypto-specific types in `@/types/crypto`
  - Improved type safety across investment and crypto modules
  - Better TypeScript intellisense and error detection

### Improved

- **Repository Organization**
  - Cleaned up unused components and deprecated files
  - Added comprehensive index files for better import organization
  - Enhanced .gitignore with testing and IDE exclusions
  - Removed legacy `InvestmentPerformance` component replaced by comprehensive version

- **Code Quality**
  - All components pass TypeScript strict mode checking
  - ESLint compliance with zero warnings
  - Consistent code formatting and naming conventions
  - Better error handling and loading states

- **User Experience**
  - Added Bitcoin icon to crypto navigation
  - Enhanced dashboard with crypto portfolio integration
  - Improved responsive design for mobile devices
  - Better loading states and error messages

### Technical Improvements

- Production-ready build verification
- Enhanced Firebase integration for crypto data
- Optimized API routes with proper authentication
- Better component composition and reusability

### Documentation

- Added comprehensive README for crypto module
- Enhanced component documentation
- Improved type definitions with JSDoc comments
- Better code organization and maintainability

## Previous Versions

### [v1.0.0] - Initial Release

- Core financial dashboard functionality
- Plaid integration for banking data
- AI-powered transaction categorization
- Basic investment tracking
- Responsive design with dark/light themes
