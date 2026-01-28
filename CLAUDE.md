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
| `src/types/firestore.ts` | Type-safe Firestore document wrappers |
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
- Use `data-testid` attributes for testing

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

## Accessibility (WCAG 2.2 Level AA)

### Core Requirements

#### Semantic HTML & ARIA
- Use semantic HTML elements (`<nav>`, `<main>`, `<button>`, not `<div>` for interactive)
- Keyboard navigation for all interactive elements (Tab, Enter, Space, Arrow keys)
- Visible focus indicators with 2px ring and offset
- ARIA labels where semantic HTML is insufficient
- `aria-hidden="true"` for decorative icons

#### Color & Contrast
- Text contrast: 4.5:1 for normal text, 3:1 for large text (18px+ or bold 14px+)
- Interactive element contrast: 3:1 against adjacent colors
- Don't rely solely on color to convey information

#### Form Accessibility
- All inputs must have associated `<label>` elements or `aria-label`
- Error messages must be programmatically associated with inputs
- Required fields indicated with visual and semantic markers (`required` attribute + `*`)
- Password fields must support password managers (`autoComplete="current-password"`)

### WCAG 2.2 Specific Requirements

This application implements all WCAG 2.2 Level AA success criteria:

#### 2.4.11 Focus Not Obscured (Minimum)
- `scroll-padding-top: 5rem` in globals.css prevents sticky header from hiding focused elements
- When an element receives keyboard focus, it's not fully hidden by sticky headers

#### 2.5.8 Target Size (Minimum)
- All interactive elements (buttons, inputs, links) have minimum 24×24px tap targets
- Checkboxes: 20×20px (h-5 w-5)
- Icon buttons: Minimum 20×20px icon + 4px padding = 28×28px total
- Password toggle buttons: Proper padding for 24×24px minimum

#### 3.3.7 Redundant Entry
- Form data persists across navigation where appropriate
- Autofill enabled for common fields (email, password, name)

#### 3.3.8 Accessible Authentication
- **No cognitive function tests**: No puzzles, CAPTCHAs, or memory tests for login
- **Password visibility toggle**: Eye/EyeOff icons allow users to show/hide passwords
- **Password manager support**: `autoComplete` attributes enable password manager integration
- **Alternative authentication**: Social auth (Google, Apple) available

### Focus Management

#### Global Focus Styles (globals.css)
```css
/* Base focus for all interactive elements */
*:focus-visible {
  @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
}

/* Stronger focus for buttons and links */
button:focus-visible,
a:focus-visible,
[role="button"]:focus-visible {
  @apply ring-2 ring-primary ring-offset-2;
}

/* Distinct focus for form inputs */
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  @apply ring-2 ring-ring ring-offset-2;
}
```

#### Focus Trapping
- Dialogs/Modals use Radix UI primitives with built-in focus trapping
- Focus returns to trigger element when dialog closes
- `DialogClose` button is keyboard accessible

### Keyboard Navigation Patterns

| Component | Keys | Behavior |
|-----------|------|----------|
| Button | Enter, Space | Activates button |
| Link | Enter | Follows link |
| Checkbox | Space | Toggles checked state |
| Input | Tab | Moves to next field |
| Dialog | Escape | Closes dialog |
| Dialog | Tab | Cycles through interactive elements within dialog |

### Motion & Animation
- All animations respect `prefers-reduced-motion` via Framer Motion's `MotionConfig`
- Animations are subtle (duration < 300ms) and enhance, not distract
- No auto-playing videos or content that flashes more than 3 times per second

### Screen Reader Testing
- Test with NVDA (Windows), JAWS (Windows), VoiceOver (macOS/iOS), TalkBack (Android)
- Ensure all interactive elements have accessible names
- Form errors are announced when validation fails
- Loading states are announced ("Loading...")

### Example: Accessible Button
```tsx
<button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  className="focus-visible:ring-2 focus-visible:ring-ring"
>
  <X className="h-5 w-5" aria-hidden="true" />
</button>
```

### Example: Accessible Form Input
```tsx
<div>
  <label htmlFor="email" className="block text-sm font-medium mb-1">
    Email address
    {required && <span className="ml-1 text-destructive">*</span>}
  </label>
  <input
    id="email"
    type="email"
    autoComplete="email"
    aria-invalid={!!error}
    aria-describedby={error ? "email-error" : undefined}
    className="form-input focus-visible:ring-2"
  />
  {error && (
    <p id="email-error" className="mt-1 text-xs text-red-600">
      {error}
    </p>
  )}
</div>
```

---

## Testing

### Test Locations
- **Unit/Integration**: `src/lib/__tests__/`, component co-location
- **Accessibility Tests**: `src/components/ui/__tests__/` (co-located with components)

### Commands
```bash
npm run test              # Run Jest tests (includes a11y tests)
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
npm run test:ci           # CI optimized (--runInBand)
```

### Mock Requirements
- Mock Firebase Admin SDK, Plaid API, and OpenAI in tests
- Use `data-testid` attributes for test selectors
- Coverage target: 80% minimum, 90% for financial calculations

### Accessibility Testing with jest-axe

This project uses **jest-axe** for automated accessibility testing. jest-axe integrates the **axe-core** accessibility engine into Jest tests.

#### What jest-axe Detects (~30-40% of WCAG issues)

✅ **Detectable Issues:**
- Missing alt text on images
- Form inputs without labels
- Insufficient color contrast (text vs background)
- Missing ARIA roles, states, and properties
- Invalid HTML structure (e.g., duplicate IDs)
- Keyboard accessibility issues (tabindex problems)
- Missing focus indicators
- Incorrect heading hierarchy (h1 → h3 without h2)
- Links without accessible names
- Buttons without accessible names

❌ **Not Detectable (Requires Manual Testing):**
- Keyboard navigation flow and logic
- Screen reader announcement quality
- Focus management in complex interactions
- Content comprehensibility and clarity
- Whether ARIA is used correctly in context
- Motion/animation accessibility (prefers-reduced-motion)

#### Setting Up Accessibility Tests

jest-axe is configured globally in `jest.setup.js`:

```javascript
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
```

#### Writing Accessibility Tests

**Basic Test Pattern:**
```typescript
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Button } from '../button';

describe('Button Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**Testing Different States:**
```typescript
it('should not have violations when disabled', async () => {
  const { container } = render(<Button disabled>Disabled</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

it('should not have violations with error state', async () => {
  const { container } = render(
    <Input label="Email" error="Invalid email" />
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**Testing Icon Buttons (require aria-label):**
```typescript
it('should not have violations with icon button', async () => {
  const { container } = render(
    <Button size="icon" aria-label="Close dialog">
      <X />
    </Button>
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### Component Testing Checklist

When creating accessibility tests for a component, verify:

- [ ] Default state has no violations
- [ ] All variants (primary, secondary, destructive, etc.) have no violations
- [ ] All sizes (sm, md, lg) have no violations
- [ ] Disabled state has no violations
- [ ] Error state has no violations (for form components)
- [ ] Loading state has no violations
- [ ] With icons/left icon/right icon has no violations
- [ ] Icon-only buttons have `aria-label`
- [ ] Form inputs have associated labels
- [ ] Focus styles are present in className

#### Complementary Manual Testing

Automated tests catch only ~30-40% of accessibility issues. Always perform manual testing:

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify focus order is logical
   - Ensure focus is visible (2px ring)
   - Test Enter/Space on buttons, Escape on dialogs

2. **Screen Reader Testing**
   - NVDA (Windows): Free, works with Chrome/Firefox
   - JAWS (Windows): Enterprise standard
   - VoiceOver (macOS): Cmd+F5 to enable
   - Test form labels, error messages, loading states

3. **Zoom & Text Scaling**
   - Zoom to 200% (Ctrl/Cmd + "+")
   - Increase text size in browser settings
   - Verify no content is cut off or overlaps

4. **Color Contrast**
   - Use browser DevTools contrast checker
   - Test in light and dark modes
   - Verify 4.5:1 for normal text, 3:1 for large text

5. **Motion Sensitivity**
   - Enable "prefers-reduced-motion" in OS settings
   - Verify animations are disabled/simplified

#### Examples

See comprehensive accessibility tests in:
- `src/components/ui/__tests__/Button.test.tsx`
- `src/components/ui/__tests__/Input.test.tsx`

#### Resources

- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [jest-axe Documentation](https://github.com/nickcolley/jest-axe)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

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
Optional: Redis (rate limiting)

See `.env.example` for all variables.
