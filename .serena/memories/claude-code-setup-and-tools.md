# Claude Code Setup & Recommended Tools for FinSight AI Dashboard

## Current Configuration Status

### ✅ Fixed Issues
1. **Chrome DevTools MCP** - Windows wrapper fixed (`cmd /c npx`)
2. **TypeScript LSP** - Installed typescript-language-server globally (v5.1.3)
3. **Claude Code** - Updated to latest version (2.1.11)

### Active MCP Servers
1. **Context7** - Library documentation lookup (plugin:context7:context7)
2. **Serena** - Semantic code analysis (plugin:serena:serena)
3. **Chrome DevTools** - Browser automation (plugin:compound-engineering:pw, plugin:playwright:playwright, chrome-devtools)
4. **Firebase** - Firebase operations (plugin:firebase:firebase)

### Disabled MCP Servers
- Figma (plugin:figma:figma, plugin:figma:figma-desktop) - Not needed for this project

## Recommended Claude Code Tools for This Project

### 🎨 Frontend Development
**Tool**: `/frontend-design` skill
**When to use**:
- Creating/modifying React components
- Styling with Tailwind CSS
- Implementing responsive layouts
- Building dashboard widgets
- Creating forms and modals

**Example usage**:
```
/frontend-design create a responsive transaction card component with chart integration
```

### 🏗️ Feature Development
**Tool**: `/feature-dev` skill
**When to use**:
- Planning new features
- Complex multi-file changes
- Architecture decisions
- Understanding existing patterns

**Example usage**:
```
/feature-dev add real-time notifications for transactions
```

### 📊 Code Analysis
**Tool**: Serena MCP tools
**Available tools**:
- `find_symbol` - Locate functions, classes, methods
- `get_symbols_overview` - File structure overview
- `find_referencing_symbols` - Find where code is used
- `search_for_pattern` - Regex search across codebase
- `replace_symbol_body` - Modify functions/classes
- `rename_symbol` - Safe refactoring

**Example usage**:
```
Use Serena to find all transaction processing functions
Use find_symbol to locate the Transaction type definition
```

### 🧪 Testing
**Tool**: Playwright MCP + Jest
**When to use**:
- E2E testing for critical user flows
- Browser automation testing
- Unit testing components and utilities

**Critical flows to test**:
1. User authentication (login/signup)
2. Plaid bank connection
3. Transaction categorization
4. Goal creation and tracking
5. AI chat interaction
6. Document upload/delete

### 📚 Library Documentation
**Tool**: Context7 MCP
**When to use**:
- Need up-to-date docs for libraries
- API reference lookup
- Best practices for dependencies

**Key libraries to reference**:
- Next.js (app router patterns)
- Firebase (Firestore queries, security rules)
- Plaid (API integration)
- OpenAI (prompt engineering)
- SWR (data fetching patterns)
- Zod (schema validation)

**Example usage**:
```
Look up Plaid transaction sync API documentation
Check Firebase security rules best practices
```

### 🔧 Firebase Operations
**Tool**: Firebase MCP
**When to use**:
- Setting up Firebase projects
- Managing Firebase apps
- Configuring security rules
- Initializing Firebase services

**Available operations**:
- Create/list Firebase projects
- Create/list Firebase apps
- Get SDK configuration
- Initialize services (Firestore, Hosting, Storage)
- Get/update security rules

### 🌐 Browser Testing
**Tool**: Chrome DevTools MCP
**When to use**:
- Testing UI components in browser
- Debugging layout issues
- Performance testing
- Network request inspection
- Console error checking

**Common tasks**:
- Navigate to localhost:3000
- Take screenshots of components
- Inspect network requests
- Check console errors
- Test responsive design

## Recommended Workflow Patterns

### 1. New Feature Development
```
1. Use /feature-dev to plan the feature
2. Use Serena to understand existing patterns
3. Use Context7 for library API references
4. Implement the feature
5. Use Playwright for E2E testing
6. Use frontend-design for UI polish
```

### 2. Bug Fixing
```
1. Use Serena find_symbol to locate the bug
2. Use find_referencing_symbols to understand impact
3. Fix the issue
4. Use Jest to add unit tests
5. Verify with Playwright E2E tests
```

### 3. Refactoring
```
1. Use Serena get_symbols_overview to understand structure
2. Use find_referencing_symbols to find all usages
3. Use rename_symbol or replace_symbol_body for safe refactoring
4. Run tests to verify nothing broke
```

### 4. Adding API Endpoints
```
1. Use Serena to find similar API route patterns
2. Implement with Zod validation (MANDATORY)
3. Use Firebase Admin SDK for Firestore operations
4. Add rate limiting if needed
5. Test with Jest + manual API testing
```

## Agents & Skills Available

### Official Skills
- ✅ `frontend-design` - UI component development
- ✅ `feature-dev` - Guided feature development
- ✅ `compound-engineering:*` - Various code quality tools

### Custom Agents
Create custom agents in `~/.claude/agents/` for specialized tasks:
- Financial calculations agent
- API route generator agent
- Security review agent

## Development Commands Reference

### Start Development
```bash
npm run dev              # Standard dev server
npm run dev:turbo        # Faster HMR with Turbopack
```

### Quality Checks
```bash
npm run lint             # Check for linting errors
npm run lint:fix         # Auto-fix linting errors
npm run type-check       # TypeScript validation
npm test                 # Run Jest tests
npm run test:coverage    # Test coverage report
```

### Pre-commit
```bash
npm run lint && npm run type-check && npm run test:all && npm run build
```

### Build & Analysis
```bash
npm run build            # Production build
npm run analyze          # Bundle size analysis
npm run clean            # Clear build cache
```

## Best Practices for This Project

### 1. Always Use Zod Validation
Every API route MUST have Zod schema validation:
```typescript
const schema = z.object({
  userId: z.string(),
  amount: z.number().min(0),
});
```

### 2. Handle All Component States
- Loading state
- Error state
- Empty state
- Success state

### 3. Use TypeScript Strictly
- No `any` types without justification
- Proper interface definitions
- Utility types where appropriate

### 4. Follow Naming Conventions
- Components: PascalCase
- Hooks: kebab-case with `use-` prefix
- API routes: kebab-case folders
- Utilities: camelCase

### 5. Security First
- Validate all inputs
- Verify Firebase tokens in API routes
- Apply rate limiting
- Use encrypted storage for sensitive data

### 6. Accessibility
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- Color contrast compliance

## Performance Optimization Tips

1. **Use SWR caching** - Already configured for API data
2. **Dynamic imports** - Use `next/dynamic` for large components
3. **Image optimization** - Use `next/image` component
4. **React.memo** - Memoize expensive components
5. **Bundle analysis** - Run `npm run analyze` regularly

## Troubleshooting Common Issues

### TypeScript Errors
```bash
npm run type-check  # Identify all type errors
# Use Serena to find and fix type definitions
```

### Build Failures
```bash
npm run clean       # Clear build cache
npm run build       # Try again
```

### Test Failures
```bash
npm test           # Run all tests
npm run test:watch # Watch mode for debugging
```

### Firebase Connection Issues
- Check `.env.local` has all required Firebase keys
- Verify Firebase project is active
- Check Firestore security rules allow operation

### Plaid Integration Issues
- Verify Plaid credentials in `.env.local`
- Check environment (sandbox/development/production)
- Review Plaid dashboard for errors

## Additional MCP Servers to Consider

### Currently Available
1. ✅ Context7 - Library documentation
2. ✅ Serena - Code analysis
3. ✅ Chrome DevTools - Browser automation
4. ✅ Firebase - Firebase operations
5. ✅ Playwright - E2E testing

### Potentially Useful (if available)
- **Stripe MCP** - For implementing payment features (Stripe already in dependencies)
- **Next.js DevTools** - For Next.js-specific debugging
- **Vercel MCP** - For deployment management
- **GitHub MCP** - For PR management and CI/CD

### Not Needed
- Figma MCP (disabled) - No active design work needed
- Render MCP - Not using Render for deployment

## Quick Reference Card

| Task | Tool/Command |
|------|-------------|
| Create UI component | `/frontend-design` |
| Plan new feature | `/feature-dev` |
| Find function/class | Serena `find_symbol` |
| Refactor safely | Serena `rename_symbol` |
| Check library docs | Context7 MCP |
| Test in browser | Chrome DevTools MCP |
| Run E2E tests | Playwright |
| Unit tests | `npm test` |
| Type check | `npm run type-check` |
| Lint code | `npm run lint:fix` |
| Build analysis | `npm run analyze` |

## Memory Files Available
1. `project-overview-and-status.md` - This file
2. `claude-code-setup-and-tools.md` - Claude Code configuration

## Notes for Future Sessions
- Always activate Serena project first: `activate_project finsight-ai-dashboard`
- Review memories before starting work
- Keep security top of mind (financial data!)
- Test thoroughly - financial calculations must be precise
- Follow the patterns established in the codebase
