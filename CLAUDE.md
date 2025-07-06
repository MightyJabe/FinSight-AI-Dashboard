# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

```bash
# Development
npm run dev         # Start development server
npm run build       # Build for production (must pass before commit)

# Quality Checks (run before committing)
npm run lint        # ESLint - must pass
npm run type-check  # TypeScript - must pass
npm run test:all    # Tests - must pass with >80% coverage

# E2E Testing (requires browser dependencies)
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Run with UI mode
npm run test:e2e:headed    # Run in headed mode
npm run test:e2e:debug     # Debug specific tests

# Quick check all:
npm run lint && npm run type-check && npm run test:all && npm run build
```

For all available commands, see `package.json` scripts section.

## Critical Development Rules

### API Routes (src/app/api/)

- **MANDATORY**: All API routes must use Zod for input validation
- Use kebab-case file naming
- Must return structured error responses with appropriate HTTP status codes
- Pattern:
  ```typescript
  import { NextResponse } from 'next/server';
  import { z } from 'zod';

  const schema = z.object({
    // Define validation schema
  });

  export async function POST(request: Request) {
    try {
      const body = await request.json();
      const parsed = schema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, errors: parsed.error.formErrors.fieldErrors },
          { status: 400 }
        );
      }

      // Process validated data
      return NextResponse.json({ success: true, data: result });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }
  ```

### TypeScript

- Strict mode enabled - no `any` types without justification
- Use interfaces for object shapes, type aliases for unions
- Prefer utility types (`Pick`, `Omit`, `Partial`, etc.)

### Components

- PascalCase naming
- Define props with TypeScript interfaces
- Implement error boundaries
- Pattern:
  ```typescript
  interface ComponentProps {
    // Define props interface
  }

  export default function Component({ ...props }: ComponentProps) {
    // Component logic
    return (
      <div className="tailwind-classes">
        {/* JSX */}
      </div>
    );
  }
  ```

### Styling

- Use Tailwind utility classes exclusively
- Use theme colors from `tailwind.config.js` - never hardcode colors
- Mobile-first responsive design

### Error Handling

- Use centralized logger from `src/lib/logger.ts`
- Never expose sensitive information in errors
- Pattern:
  ```typescript
  try {
    // Operation
  } catch (error) {
    logger.error('Operation failed', { error, context });
    // Handle error appropriately
  }
  ```

### Security

- Never commit secrets or API keys
- Input validation on all API endpoints
- Use environment variables via `src/lib/config.ts`
- **NEVER log**: passwords, API keys, bank accounts, PII

## Pre-Commit Checklist

Before committing, ensure:

1. **Code Quality**
   - `npm run lint` - Must pass
   - `npm run type-check` - Must pass
   - `npm run format:check` - Code is properly formatted

2. **Tests**
   - `npm run test:all` - Must pass with >80% coverage
   - `npm run test:e2e` - E2E tests must pass (requires browser deps)
   - New features have corresponding tests

3. **Build**
   - `npm run build` - Must complete successfully

4. **Security**
   - No hardcoded secrets or API keys
   - All API routes have Zod validation

## Key Files to Reference

### Documentation
- `project.md` - Technical design, architecture, database schema
- `README.md` - Setup instructions, troubleshooting
- `.env.example` - Complete list of environment variables
- `TESTING-STRATEGY.md` - Comprehensive testing guide (Jest + Playwright)

### Development Rules
- `.cursor/rules/api-rules.mdc` - API development patterns
- `.cursor/rules/testing-rules.mdc` - Testing guidelines
- `.cursor/rules/firebase-rules.mdc` - Firebase patterns
- `.cursor/rules/logging-rules.mdc` - Logging conventions
- `.cursor/rules/a11y-rules.mdc` - Accessibility standards
- `.cursor/rules/zustand-rules.mdc` - State management

### Configuration
- `src/lib/config.ts` - Environment configuration
- `src/lib/logger.ts` - Logging setup
- `tailwind.config.js` - Design system and theme

## Project-Specific Notes

- Next.js 14 App Router - all routes follow app directory conventions
- Firebase Admin SDK requires proper service account configuration
- Plaid integration requires webhook configuration for production
- All financial calculations use utilities in `src/lib/finance.ts`
- Tests go in `src/tests/` mirroring source structure

## Completed Improvements ✅

### High Priority - COMPLETED
1. **Chat UI/UX Enhancements** (`src/app/chat/page.tsx`) - ✅ DONE
   - ✅ Better message bubbles with user avatars (enhanced 10x10 avatars with gradients and status indicators)
   - ✅ Typing indicators when AI is responding (smooth animations with "AI is composing" text)
   - ✅ Improved message timestamps formatting (better positioned with proper time format)
   - ✅ Smoother animations and transitions (scale effects, hover animations, staggered loading)
   - ✅ Message status indicators (sending, sent, error with visual icons)

2. **Loading States & Error Handling** - ✅ DONE
   - ✅ Skeleton loaders for conversation lists (enhanced with gradient effects and staggered animations)
   - ✅ Better error messages with actionable solutions (contextual errors based on HTTP status codes)
   - ✅ Retry mechanisms for failed API calls (retry buttons with proper state management)
   - ✅ Connection status indicators (online/offline detection with visual indicators)
   - ✅ Graceful fallbacks for offline scenarios (offline mode UI and message queuing)

### Medium Priority - COMPLETED
3. **Dark Mode Implementation** - ✅ DONE (Pre-existing)
   - ✅ Dark/light theme toggle in navigation (fully functional with useTheme hook)
   - ✅ System preference detection and respect (automatic theme switching)
   - ✅ Smooth theme transitions with proper color schemes (CSS custom properties)
   - ✅ Persistent theme preference storage (localStorage-based)

4. **Chat Message Actions** - ✅ DONE
   - ✅ Copy message to clipboard button (enhanced with visual feedback)
   - ✅ Regenerate AI response option (regenerate assistant responses with loading states)
   - ✅ Edit/delete message functionality (inline editing for user messages with save/cancel)
   - ✅ Message reactions or ratings (thumbs up/down for assistant messages with visual feedback)
   - ✅ Export conversation feature (download as formatted text file with timestamps and ratings)

### Lower Priority - COMPLETED
5. **Dashboard Improvements** (`src/app/dashboard/page.tsx`) - ✅ DONE
   - ✅ Interactive data visualization charts (expandable charts with time range selection)
   - ✅ Real-time financial data updates (toggle switch for live updates)
   - ✅ Better overview card layouts (enhanced 5-card grid with better UX and hover effects)
   - ✅ Drill-down capabilities for metrics (clickable cards with detailed views)

### Technical Debt - COMPLETED
- ✅ Optimize bundle size and lazy loading (dynamic imports already implemented)
- ✅ Add comprehensive error boundaries (enhanced with retry logic and detailed error info)
- ✅ Implement proper caching strategies (server-side data fetching and memoization in place)
- ✅ Add performance monitoring (error tracking and component performance optimization)

## All Planned Improvements Complete! 🎉

All items from the original TODO list have been successfully implemented and are production-ready.

## E2E Testing Setup

### Browser Dependencies (Required for E2E tests)

```bash
# Install Playwright browser dependencies
sudo npx playwright install-deps

# Or manually install required packages
sudo apt-get install libnspr4 libnss3 libasound2t64
```

### E2E Test Structure

- **Location**: `tests/e2e/` directory
- **Framework**: Playwright with TypeScript
- **Coverage**: Homepage, Auth, Dashboard, Transactions, Plaid, Trends, AI Chat
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **CI/CD**: GitHub Actions workflow with cross-browser testing

### Key Features

- **Authentication Mocking**: Mock Firebase auth for testing protected routes
- **API Response Mocking**: Mock all external API calls for consistent testing
- **Plaid Integration Mocking**: Mock Plaid Link flow for banking features
- **Mobile Testing**: Responsive design testing on mobile viewports
- **Accessibility Testing**: Basic a11y checks integrated into test suite
- **Visual Testing**: Screenshots and videos on test failures

## Important Reminders

- NEVER create files unless absolutely necessary - prefer editing existing files
- NEVER proactively create documentation files (*.md) unless explicitly requested
- For clear communication, avoid using emojis
- All file paths in responses must be absolute
- When in doubt about patterns, check the `.cursor/rules/` directory

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.