# Changelog

All notable changes to the FinSight AI Dashboard project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Type-safe Firestore wrapper functions in `src/types/firestore.ts`
  - `queryDocToData<T>()` - Convert QueryDocumentSnapshot to typed data
  - `firestoreDocToData<T>()` - Convert DocumentSnapshot to typed data
  - `batchToData<T>()` - Convert query batches to typed arrays
  - `getDocData<T>()` - Safely get document data with existence check
- Generic `ApiResponse<T>` interface for type-safe API responses
- Structured error logging with metadata across all services

### Changed

- **Type Safety Improvements**: Reduced `any` types from 69 to ~20 instances
  - Updated logger interface to use `Record<string, unknown>` instead of `any`
  - Improved AI response types with proper generics and type guards
  - Fixed catch block error types across the codebase
  - Updated 20+ files to use new Firestore helpers
- **Logging Migration**: Migrated 61 files from `console.*` to centralized `logger` service
  - Standardized error logging with structured metadata
  - Kept `console.log` only for CI environment checks and WebVitals monitoring
- Fixed GitHub Actions workflow warning for missing test-results artifact

### Removed

- Empty JSDoc blocks across multiple files
- Vague TODO comments replaced with explicit descriptions

### Repository Cleanup Phases Completed (January 2026)

- ✅ Phase 1: Removed empty JSDoc blocks and commented code
- ✅ Phase 2: Migrated 61 files to centralized logger service
- ✅ Phase 3.1: Fixed logger metadata and catch block types (Quick Wins)
- ✅ Phase 3.2: Improved AI response types, Firestore wrappers, API response types (Medium Complexity)

## [2.0.0] - 2024-11-28

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
