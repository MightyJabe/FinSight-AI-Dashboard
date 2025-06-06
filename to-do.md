# FinSight AI Dashboard – Cursor AI Task List

## Sprint 1 (1 week): Project Bootstrap & Authentication

- [✅] **Initialize repo**

  - Create Next.js 14 app in `src/` (TypeScript, ESLint, Tailwind, App Router)
  - Commit "chore: initial scaffold"

- [✅] **Install core libraries**

  - `firebase`, `plaid`, `openai`, `react-hook-form`, `zod`
  - `@tanstack/react-query`, `date-fns`, `react-hot-toast`, `@headlessui/react`
  - `@tailwindcss/forms`, `@tailwindcss/typography`, `zustand`
  - Commit "chore: add core dependencies"

- [✅] **Configure environment & Firebase**

  - Create `/src/lib/config.ts` with Zod schema for `process.env.*` validation
  - Create `/src/lib/firebase.ts` with Auth + Firestore init
  - Add `.env.local` keys for Firebase
  - Commit "feat(config): add environment validation and Firebase setup"

- [✅] **Build auth pages**

  - `/src/app/(auth)/login/page.tsx` → scaffold layout + import `<LoginForm />`
  - `/src/app/(auth)/signup/page.tsx` → scaffold layout + import `<SignupForm />`
  - `/src/app/(auth)/reset-password/page.tsx` → password reset flow
  - `/src/app/(auth)/verify-email/page.tsx` → email verification page
  - Commit "feat(auth): scaffold auth pages"

- [✅] **Create form components**

  - `src/components/auth/LoginForm.tsx`
    - React‐Hook‐Form + Zod schema for `{ email, password }`
    - Tailwind-Forms inputs, submit button, error display
  - `src/components/auth/SignupForm.tsx`
    - Zod extends `{ confirmPassword }` with refine rule
  - `src/components/auth/ResetPasswordForm.tsx`
    - Handle password reset flow with Firebase
  - `src/components/auth/EmailVerification.tsx`
    - Show verification status and resend option
  - Commit "feat(auth): add auth form components"

- [✅] **Wire up Firebase Auth**

  - In form `onSubmit`, call Firebase `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`
  - Handle success (redirect to `/dashboard`) and errors (toast or inline)
  - Commit "feat(auth): integrate Firebase Auth in forms"

- [✅] **Add social authentication**

  - Configure Google OAuth provider in Firebase
  - Add "Sign in with Google" button to LoginForm
  - Handle OAuth callbacks and user creation
  - Commit "feat(auth): add Google OAuth support"

- [✅] **Implement security measures**

  - Add rate-limiting middleware to API routes
  - Set up input sanitization with Zod
  - Implement CSRF protection on forms
  - Add Error Boundary component
  - Commit "feat(security): add rate limiting and input validation"

- [✅] **Protect routes**
  - Create a simple `AuthGuard` in `/src/components/`
  - Wrap `/dashboard` route so unauthenticated users redirect to `/login`
  - Add middleware for protected API routes
  - Commit "feat(auth): add route protection"

## Sprint 2 (1 week): Financial & Plaid Integration

- [✅] **Initialize Plaid client**

  - Create `/src/lib/plaid.ts` with `PlaidApi` init
  - Add `.env.local` keys for `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`

- [✅] **API routes for Plaid**

  - `/src/app/api/plaid/create-link-token/route.ts`
  - `/src/app/api/plaid/exchange-public-token/route.ts`
  - Commit "feat: add Plaid link-token and exchange endpoints"

- [✅] **PlaidLinkButton component**

  - Create `src/components/PlaidLinkButton.tsx`
  - Fetch link token, open widget, call exchange endpoint on success
  - Commit "feat: add PlaidLinkButton"

- [✅] **Save tokens in Firestore**

  - Update exchange endpoint to write `access_token` → `plaidTokens/{uid}`
  - Commit "feat: persist Plaid tokens"

- [✅] **Basic account overview**

  - `/src/app/dashboard/page.tsx` → after auth, show "Link Account" or display fetched account balances
  - Fetch transaction data via a new API route `/api/plaid/transactions`
  - Commit "feat: basic account overview"

- [✅] **Manual liabilities support**
  - Add `/api/manual-liabilities` endpoints (GET, POST)
  - Update `/api/accounts/overview` to include manual liabilities and net worth calculation
  - Add dashboard UI for adding, listing, and displaying manual liabilities
  - Commit "feat: add manual liabilities support"

## Sprint 3 (1 week): AI Insights

- [ ] **Initialize OpenAI client**

  - Create `/src/lib/openai.ts` wrapping `OpenAI` SDK with `OPENAI_API_KEY`
  - Commit "feat: add OpenAI client"

- [ ] **Prompt templates**

  - Add `src/lib/prompts.ts` with budget/forecast templates
  - Commit "feat: add AI prompt templates"

- [ ] **API route for insights**

  - `/src/app/api/insights/financial-analysis/route.ts`
  - Accept userId, fetch transactions from Firestore, call GPT-4, return suggestions
  - Commit "feat: AI insights endpoint"

- [ ] **Dashboard feed**
  - In `/src/app/dashboard/page.tsx`, call insights endpoint and render cards/list of AI messages
  - Commit "feat: render AI insights"

## Sprint 4 (1 week): Polish & Deploy

- [ ] **Add typography & forms plugin**

  - Update `tailwind.config.js` → include `@tailwindcss/typography` + `@tailwindcss/forms`
  - Use `prose` class on any markdown pages

- [ ] **Dark‐mode toggle**

  - Implement a simple switch in header that toggles `<html class="dark">`
  - Ensure all pages use `bg-background dark:bg-background-dark` etc.

- [ ] **Testing Setup**

  - Set up Jest for unit testing
  - Configure React Testing Library for component tests
  - Add Playwright for E2E testing
  - Create test suites for critical flows
  - Commit "feat: add testing infrastructure"

- [ ] **CI/CD Pipeline**

  - Set up GitHub Actions workflow
  - Configure lint, test, and build steps
  - Add Sentry for error tracking
  - Integrate analytics (PostHog/GA)
  - Commit "feat: add CI/CD and monitoring"

- [ ] **Optimize & deploy**
  - Test Lighthouse scores, add image optimizations, code‐split large components
  - Deploy to Vercel with your GitHub repo
  - Commit "chore: optimize and deploy"

## Sprint 5 (1 week): Code Cleanup

- [ ] **Remove debug API route**

  - Delete `src/app/api/debug` testing endpoint
  - Commit "chore: remove debug api"

- [ ] **Strip console logging**

  - Remove `console.log` calls from `src/components/PlaidLinkButton.tsx` and `src/lib/firebase.ts`
  - Commit "chore: remove console logs"

- [ ] **Finalize finance utilities**

  - Address TODO comments in `src/lib/finance.ts`, implementing or removing as needed
  - Commit "refactor: finalize finance utils"

- [ ] **Update documentation**

  - Summarize cleanup in `README.md` and `project.md`
  - Commit "docs: update after cleanup"

---

📈 **How to use:**  
Copy these tasks into Cursor AI as your "to‐do" list. Cursor can then work on each checkbox item sequentially—scaffolding files, writing code, and committing with those messages. Good luck, and let me know when you'd like to tackle Sprint 1!
