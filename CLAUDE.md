# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Important Rules

- Always use the `frontend-design` skill plugin when working on UI components or styling
- Use Zod schemas for ALL API route input validation
- Follow kebab-case for hook filenames (`use-transactions.ts`)
- Handle loading, error, and empty states in all components

---

## Build & Development Commands

```bash
npm run dev          # Start development server (port 3000)
npm run dev:turbo    # Start with Turbopack for faster HMR
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint with auto-fix
npm run type-check   # TypeScript validation
npm run test         # Run Jest tests
npm run test:watch   # Jest watch mode
npm run test:coverage # Jest with coverage report
npm run analyze      # Build with bundle analyzer
npm run clean        # Clear .next cache and tsbuildinfo
```

### Pre-commit Quality Check
```bash
npm run lint && npm run type-check && npm run test:all && npm run build
```

---

## Available Tools & Integrations

### Claude Code Skills
| Skill | Usage | When to Use |
|-------|-------|-------------|
| `frontend-design` | `/frontend-design` | Creating/modifying UI components, styling, responsive layouts |
| `feature-dev` | `/feature-dev` | Guided feature development with architecture focus |
| `stripe` | Stripe tools | Payment integration, checkout flows, subscriptions |
| `playwright` | Browser tools | E2E testing, browser automation |
| `figma` | `implement-design` | Converting Figma designs to code |

### Custom Agents
| Agent | Command | Description |
|-------|---------|-------------|
| `ui` | `--agent ui` | UI/Frontend specialist for React, Next.js, Tailwind |

### MCP Servers
- **Context7** - Up-to-date library documentation lookup
- **Serena** - Semantic code analysis (`find_symbol`, `get_symbols_overview`)
- **Figma** - Design implementation from Figma files

### Workflow Guidelines
- **UI Components**: Use `frontend-design` skill or `ui` agent
- **Feature Development**: Use `/feature-dev` for guided implementation
- **Code Analysis**: Use Serena tools for symbol lookup and refactoring
- **Library Docs**: Use Context7 to get current API documentation

---

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Auth & Database**: Firebase (Auth + Firestore)
- **Financial Data**: Plaid API, Salt Edge
- **AI**: OpenAI GPT-4
- **State**: SWR for server state, React hooks for local state
- **Payments**: Stripe (optional)
- **Rate Limiting**: Upstash Redis (optional)

### Key Directories
```
src/
├── app/              # Next.js App Router (pages + API routes)
│   └── api/          # API routes (kebab-case folders)
├── components/       # React components by feature
│   ├── auth/         # AuthGuard, LoginForm, SignupForm
│   ├── common/       # Header, Navigation, ErrorBoundary, SkeletonLoader
│   ├── dashboard/    # Dashboard widgets and sections
│   ├── providers/    # SessionProvider, SWRProvider
│   └── ui/           # Base components (Button, Card, Modal, Tabs)
├── hooks/            # Custom React hooks (use-*.ts)
├── lib/              # Core library code
│   ├── firebase.ts       # Client SDK init
│   ├── firebase-admin.ts # Admin SDK init (server-only)
│   ├── plaid.ts          # Plaid client
│   ├── openai.ts         # OpenAI client
│   └── config.ts         # Zod-validated environment config
├── middleware/       # Rate limiting middleware
├── types/            # TypeScript interfaces
└── utils/            # Utility functions (formatters, helpers)
```

### Critical Files Reference
| File | Purpose |
|------|---------|
| `src/lib/config.ts` | Environment configuration (Zod validated) |
| `src/lib/firebase.ts` | Firebase client SDK initialization |
| `src/lib/firebase-admin.ts` | Firebase Admin SDK (server-only) |
| `src/components/providers/SessionProvider.tsx` | Auth context provider |
| `src/components/auth/AuthGuard.tsx` | Route protection component |
| `src/components/common/SkeletonLoader.tsx` | All loading skeleton components |

---

## Code Conventions

### Naming
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `DashboardCard.tsx` |
| Hooks | kebab-case with `use-` prefix | `use-transactions.ts` |
| Utilities | camelCase | `formatCurrency.ts` |
| API routes | kebab-case folders | `/api/create-link-token/route.ts` |
| Types | PascalCase | `Transaction`, `UserProfile` |

### TypeScript Standards
- Use strict mode (`"strict": true`)
- No `any` types without explicit justification
- Prefer interfaces for object shapes, type aliases for unions
- Use utility types (`Pick`, `Omit`, `Partial`, `Required`)

### Component Guidelines
- Keep components under 150-200 lines
- Define props with TypeScript interfaces
- Handle loading, error, and empty states
- Use composition over prop drilling
- Use `data-testid` attributes for E2E testing

### Tailwind CSS
- Use utility classes, avoid custom CSS
- Mobile-first responsive design (`sm:`, `md:`, `lg:`)
- Use colors from `tailwind.config.js` theme only
- Include dark mode variants (`dark:`) when applicable

---

## API Development

### Mandatory Zod Validation
All API routes MUST validate input with Zod:

```typescript
import { z } from 'zod';
import { NextResponse } from 'next/server';

const schema = z.object({
  email: z.string().email(),
  amount: z.number().min(0),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, errors: parsed.error.formErrors.fieldErrors },
      { status: 400 }
    );
  }

  // Process with parsed.data (type-safe)
}
```

### HTTP Status Codes
- `200` Success | `201` Created | `400` Bad Request
- `401` Unauthorized | `403` Forbidden | `404` Not Found
- `429` Rate Limited | `500` Internal Error

### Authentication
- Use `src/lib/auth-server.ts` to verify Firebase ID tokens
- Return consistent error responses
- Rate limiting applied via middleware to all `/api/*` routes

---

## Accessibility (WCAG 2.1 AA)

### Requirements
- Semantic HTML (`<nav>`, `<main>`, `<button>`, not `<div>` for interactive)
- Keyboard navigation for all interactive elements
- Visible focus indicators
- ARIA labels where semantic HTML is insufficient
- Color contrast 4.5:1 for normal text, 3:1 for large text
- All form inputs must have associated labels

### Example
```tsx
<button aria-label="Close dialog" aria-expanded={isOpen}>
  <CloseIcon aria-hidden="true" />
</button>
```

---

## Testing

### Test Locations
- **Unit/Integration**: `src/lib/__tests__/`, component co-location
- **E2E**: `tests/e2e/` (Playwright)

### Commands
```bash
npm run test              # Run Jest tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
npm run test:ci           # CI optimized (--runInBand)
```

### Mock Requirements
- Mock Firebase Admin SDK, Plaid API, and OpenAI in tests
- Use `data-testid` attributes for E2E selectors
- Coverage target: 80% minimum, 90% for financial calculations

---

## Firebase Integration

### Security Rules (`firestore.rules`)
- Users can only access their own data (`request.auth.uid == userId`)
- Always validate data structure in rules
- Default deny, explicitly grant permissions

### Authentication Flow
1. Firebase Auth handles authentication (email/password, social)
2. `SessionProvider` wraps app and provides auth context
3. `AuthGuard` component protects routes
4. Server-side: verify Firebase ID tokens in API routes

---

## Performance Targets

- **FCP** < 1.8s | **LCP** < 2.5s | **FID** < 100ms | **CLS** < 0.1
- API response times < 200ms (P95)
- Use `React.memo`, `useCallback`, `useMemo` judiciously
- Use `next/dynamic` for large components
- Optimize images with `next/image`

---

## Environment Configuration

Variables validated via Zod in `src/lib/config.ts`:

```typescript
import { config, getConfig } from '@/lib/config';
```

Required: Firebase (client + admin), Plaid, OpenAI
Optional: Redis (rate limiting), Stripe (paid tiers)

See `.env.example` for all variables.
