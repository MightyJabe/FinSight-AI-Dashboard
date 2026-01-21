# Development Workflow Guide

This guide provides recommended workflows for common development tasks in the FinSight AI Dashboard project.

## Quick Start

### Setting Up for Development
```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your actual credentials

# 3. Start development server
npm run dev

# 4. Open browser
http://localhost:3000
```

## Common Development Workflows

### 1. Adding a New Feature

**Step 1: Planning**
```bash
# Use Claude Code's feature-dev skill for guided planning
/feature-dev add [feature description]
```

**Step 2: Understanding Existing Code**
```bash
# Use Serena to explore similar features
- Use get_symbols_overview to understand file structure
- Use find_symbol to locate related components
- Use find_referencing_symbols to understand dependencies
```

**Step 3: Implementation**
1. Create necessary components in `src/components/[feature]/`
2. Add API routes in `src/app/api/[feature]/`
3. Create hooks in `src/hooks/use-[feature].ts`
4. Add types in `src/types/[feature].ts`

**Step 4: Testing**
```bash
# Unit tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint:fix
```

**Step 5: Commit**
```bash
git add .
git commit -m "feat: add [feature name]"
```

---

### 2. Fixing a Bug

**Step 1: Locate the Bug**
```bash
# Use Serena to find the problematic code
- Use find_symbol to locate the function/component
- Use search_for_pattern for error messages or patterns
```

**Step 2: Understand Impact**
```bash
# Use find_referencing_symbols to see where code is used
# This helps understand if fix will break anything
```

**Step 3: Fix and Test**
1. Make the fix
2. Add test case to prevent regression
3. Run all tests: `npm run test:all`

**Step 4: Verify**
```bash
# Check no new TypeScript errors
npm run type-check

# Test manually in browser
npm run dev
```

---

### 3. Creating a New API Endpoint

**Step 1: Find Similar Endpoints**
```bash
# Use Serena to explore existing API routes
- Look at src/app/api/ structure
- Find similar endpoints for pattern reference
```

**Step 2: Create Route File**
```typescript
// src/app/api/[feature-name]/route.ts
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';

// MANDATORY: Define Zod schema
const schema = z.object({
  // Define your expected inputs
  userId: z.string(),
  amount: z.number().min(0),
});

export async function POST(req: Request) {
  try {
    // Verify authentication
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.formErrors.fieldErrors },
        { status: 400 }
      );
    }

    // Your business logic here
    const result = await doSomething(parsed.data);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Step 3: Create Hook**
```typescript
// src/hooks/use-[feature].ts
import useSWR from 'swr';

export function useFeature() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/[feature-name]',
    fetcher
  );

  return {
    data,
    isLoading,
    error,
    refresh: mutate,
  };
}
```

**Step 4: Test**
```bash
# Manual testing with curl or Postman
curl -X POST http://localhost:3000/api/[feature-name] \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","amount":100}'

# Add Jest tests
npm test
```

---

### 4. Creating a New UI Component

**Step 1: Use Frontend Design Skill**
```bash
/frontend-design create [component description]
```

**Step 2: Component Structure**
```typescript
// src/components/[feature]/ComponentName.tsx
import { FC } from 'react';

interface ComponentNameProps {
  // Define props
  title: string;
  onAction: () => void;
}

export const ComponentName: FC<ComponentNameProps> = ({
  title,
  onAction,
}) => {
  // State
  const [loading, setLoading] = useState(false);

  // Handlers
  const handleAction = async () => {
    try {
      setLoading(true);
      await onAction();
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  // Render states
  if (loading) return <LoadingSpinner />;

  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  );
};
```

**Step 3: Add to Parent**
```typescript
import { ComponentName } from '@/components/[feature]/ComponentName';

// Use in parent
<ComponentName title="Title" onAction={handleAction} />
```

---

### 5. Refactoring Code

**Step 1: Understand Current Structure**
```bash
# Use Serena to analyze
- get_symbols_overview for file structure
- find_referencing_symbols to find all usages
```

**Step 2: Plan Refactoring**
1. Identify what needs to change
2. Find all places code is used
3. Plan backward-compatible approach if possible

**Step 3: Execute Refactoring**
```bash
# Use Serena tools for safe refactoring
- rename_symbol for renaming
- replace_symbol_body for updating implementation
```

**Step 4: Verify**
```bash
# Run all checks
npm run lint && npm run type-check && npm run test:all && npm run build
```

---

### 6. Debugging Production Issues

**Step 1: Reproduce Locally**
```bash
# Build production version
npm run build
npm start

# Or use Chrome DevTools MCP for browser debugging
```

**Step 2: Check Logs**
- Check Vercel logs (if deployed)
- Check Firebase console
- Check browser console

**Step 3: Use Context7 for API References**
```bash
# Look up specific library behavior
# Check for known issues or gotchas
```

**Step 4: Fix and Deploy**
1. Create fix
2. Test thoroughly
3. Deploy via Vercel/your platform

---

## Pre-Commit Checklist

Before every commit, run:
```bash
npm run lint:fix        # Fix linting issues
npm run type-check      # Check TypeScript
npm run test:all        # Run all tests
npm run build           # Verify build succeeds
```

Or use the all-in-one command:
```bash
npm run lint && npm run type-check && npm run test:all && npm run build
```

---

## Code Review Checklist

When reviewing code (yours or others):

### Security
- [ ] All API routes have Zod validation
- [ ] Authentication verified where needed
- [ ] No sensitive data in logs
- [ ] Rate limiting applied
- [ ] Input sanitization for user data

### TypeScript
- [ ] No `any` types without justification
- [ ] Proper interfaces defined
- [ ] Return types specified
- [ ] Null checks where needed

### React/UI
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Empty states handled
- [ ] Accessibility attributes present
- [ ] Mobile responsive

### Testing
- [ ] Unit tests for utilities
- [ ] Component tests for complex logic

### Performance
- [ ] No unnecessary re-renders
- [ ] Large components lazy-loaded
- [ ] Images optimized with next/image
- [ ] API responses cached with SWR

---

## Useful Claude Code Commands

### Code Analysis
```
Use Serena to find all transaction processing functions
Show me the structure of the banking integration
Find all places where Firestore is queried
```

### Documentation
```
Look up Plaid transaction sync API in Context7
Check Firebase security rules best practices
Find Next.js App Router data fetching patterns
```

### Feature Development
```
/feature-dev add real-time notifications
/frontend-design create a transaction filter component
```

### Testing
```
Test the login flow in Chrome DevTools
Run Playwright tests for the dashboard
Check console errors for the transactions page
```

---

## Emergency Procedures

### Build Broken
```bash
# 1. Clear cache
npm run clean

# 2. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 3. Try building again
npm run build
```

### Tests Failing
```bash
# 1. Run tests in watch mode to debug
npm run test:watch

# 2. Check for environment variable issues
# Ensure .env.local is properly configured

# 3. Check for async issues
# Common culprit in React tests
```

### Deployment Failed
```bash
# 1. Check Vercel logs
# 2. Verify all environment variables are set
# 3. Test build locally first
npm run build && npm start
```

---

## Additional Resources

- **CLAUDE.md** - Project-specific guidance for Claude Code
- **Project Memories**:
  - `project-overview-and-status.md` - Current implementation status
  - `claude-code-setup-and-tools.md` - Tool configuration and usage
- **Documentation**:
  - [Next.js Docs](https://nextjs.org/docs)
  - [Firebase Docs](https://firebase.google.com/docs)
  - [Plaid API Reference](https://plaid.com/docs/api/)
  - [Tailwind CSS](https://tailwindcss.com/docs)

---

## Tips for Working with Claude Code

1. **Start with Serena** - Always use Serena to understand code before modifying
2. **Use Context7** - Get up-to-date library docs instead of relying on training data
3. **Frontend Design** - Let the skill handle UI components for best results
4. **Test in Browser** - Use Chrome DevTools MCP for real browser testing
5. **Memory Files** - Reference project memories for context

---

Last Updated: January 2026
