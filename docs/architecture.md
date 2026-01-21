# FinSight AI - Financial OS Architecture

> Production-grade personal finance platform with AI-powered financial coaching.

## 1. Current State Summary

### Tech Stack
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript | SSR, routing, type safety |
| Styling | Tailwind CSS, Framer Motion | UI components, animations |
| Auth | Firebase Authentication | Email/password, social login |
| Database | Firestore | User data, transactions, accounts |
| AI | OpenAI GPT-4 | Financial analysis, chat, insights |
| US Banking | Plaid API | Bank/investment connections |
| IL Banking | israeli-bank-scrapers + Puppeteer | Screen scraping (Render service) |
| Crypto | CCXT library | Exchange integrations |
| Cache | Upstash Redis | Rate limiting, caching |
| State | SWR | Server state management |

### Existing Capabilities
- ✅ Multi-provider banking (Plaid for US, scraper for Israel)
- ✅ AI chat with financial context (`AIBrainService`)
- ✅ Centralized financial calculations (`FinancialCalculator` - SSOT)
- ✅ Crypto portfolio tracking (exchanges + wallets)
- ✅ Investment/retirement accounts
- ✅ Transaction categorization (AI-powered)
- ✅ Subscription detection
- ✅ Tax planning tools
- ✅ Goals tracking

### Data Model (Firestore)
```
users/{userId}
├── plaidItems/{itemId}
│   └── accounts/{accountId}      # Balances, types
├── categorizedTransactions/      # AI-categorized txns
├── conversations/                # AI chat history
├── manualData/                   # User-entered data
├── insights/                     # Cached AI insights
├── analysis/                     # Period analysis
├── physicalAssets/               # Real estate, vehicles
├── informalDebts/                # P2P lending
├── subscriptions/                # Recurring payments
├── financialMemory/              # AI context
└── taxData/                      # Tax items
```

### Integration Points
1. **Plaid** - US banking, investments, credit cards
2. **Israeli Bank Scrapers** - Deployed to Render (Puppeteer service)
3. **CCXT** - Crypto exchanges (Coinbase, Binance, Kraken)
4. **OpenAI** - GPT-4 for analysis and chat

---

## 2. Target State Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  Dashboard │ Accounts │ Transactions │ Insights │ AI Assistant  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js API Routes)              │
│                 Rate Limited, Authenticated, Validated           │
└─────────────────────────────────────────────────────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Connector     │    │ Financial Engine │    │ AI Brain        │
│ Framework     │    │ (SSOT)           │    │ Service         │
├───────────────┤    ├──────────────────┤    ├─────────────────┤
│ • Plaid       │───▶│ • Net Worth      │───▶│ • Context       │
│ • IL Scraper  │    │ • Cash Flow      │    │   Builder       │
│ • Crypto APIs │    │ • Snapshots      │    │ • Financial     │
│ • Manual      │    │ • Currency Conv  │    │   Tools         │
└───────────────┘    └──────────────────┘    │ • RAG           │
        │                       │            │ • Prompt Eng    │
        ▼                       ▼            └─────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                   Data Layer (Firestore + Cache)                 │
│  Raw Payloads │ Normalized Entities │ Snapshots │ AI Memory     │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Connector Framework
Unified interface for all financial data providers:

```typescript
interface FinancialConnector {
  providerId: string;
  syncAccounts(): Promise<Account[]>;
  syncTransactions(since: Date): Promise<Transaction[]>;
  syncBalances(): Promise<BalanceSnapshot[]>;
  syncHoldings?(): Promise<Holding[]>;
  getStatus(): ConnectionStatus;
}
```

Providers:
- `PlaidConnector` - US banks, investments
- `IsraeliBankConnector` - IL banks/cards (via scraper service)
- `CryptoExchangeConnector` - Exchanges via CCXT
- `ManualConnector` - User-entered data

#### 2. Data Model (Enhanced)

```typescript
// Core Entities
interface Account {
  id: string;
  userId: string;
  providerId: string;
  providerAccountId: string;
  type: 'checking' | 'savings' | 'credit' | 'loan' | 'mortgage' | 
        'brokerage' | 'pension' | 'crypto';
  name: string;
  mask: string;           // Last 4 digits
  currency: Currency;
  isActive: boolean;
  lastSyncedAt: Date;
}

interface BalanceSnapshot {
  id: string;
  accountId: string;
  balance: number;
  available?: number;
  currency: Currency;
  timestamp: Date;
}

interface Transaction {
  id: string;
  accountId: string;
  providerTxId: string;   // For deduplication
  amount: number;
  currency: Currency;
  date: Date;
  merchant?: string;
  name: string;
  category: string;
  categoryConfidence: number;
  status: 'pending' | 'posted';
  isRecurring: boolean;
  recurringId?: string;
}

interface NetWorthSnapshot {
  id: string;
  userId: string;
  timestamp: Date;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  breakdown: {
    cash: number;
    investments: number;
    crypto: number;
    realEstate: number;
    otherAssets: number;
    creditCards: number;
    loans: number;
    mortgages: number;
  };
  currency: Currency;
}

type Currency = 'USD' | 'ILS' | 'EUR' | 'GBP';
```

#### 3. Sync Pipeline

```
┌──────────────┐    ┌───────────────┐    ┌───────────────────┐
│ Trigger      │───▶│ Job Queue     │───▶│ Sync Worker       │
│ (Cron/Manual)│    │ (Redis/BullMQ)│    │                   │
└──────────────┘    └───────────────┘    │ 1. Get credentials│
                                          │ 2. Call provider   │
                                          │ 3. Normalize data  │
                                          │ 4. Store raw+clean │
                                          │ 5. Update snapshots│
                                          │ 6. Trigger insights│
                                          └───────────────────┘
                                                     │
                                    ┌────────────────┼────────────────┐
                                    ▼                ▼                ▼
                              ┌──────────┐    ┌─────────────┐    ┌────────┐
                              │Raw Store │    │Normalized   │    │Snapshot│
                              │(encrypted)│   │Entities     │    │Store   │
                              └──────────┘    └─────────────┘    └────────┘
```

#### 4. AI Financial Assistant

```
User Question
     │
     ▼
┌───────────────────────────────────────────────────────────────┐
│                  Context Builder                               │
│  - Fetch relevant accounts, transactions, balances            │
│  - Get user preferences and history                           │
│  - Calculate derived metrics (net worth, cash flow)           │
│  - Build structured context with citations                    │
└───────────────────────────────────────────────────────────────┘
     │
     ▼
┌───────────────────────────────────────────────────────────────┐
│                  Financial Tools                               │
│  - calculate_net_worth(userId)                                │
│  - get_spending_by_category(userId, dateRange)               │
│  - compare_periods(userId, period1, period2)                  │
│  - simulate_scenario(userId, params)                          │
│  - get_recurring_expenses(userId)                             │
└───────────────────────────────────────────────────────────────┘
     │
     ▼
┌───────────────────────────────────────────────────────────────┐
│                  LLM + Prompt Engineering                      │
│  - System prompt with financial expertise                     │
│  - Tool-use for calculations (not mental math)                │
│  - Citation requirements                                       │
│  - Uncertainty and scenario language                          │
│  - Safe guardrails (no specific advice as certainty)          │
└───────────────────────────────────────────────────────────────┘
     │
     ▼
Answer with Citations
```

---

## 3. Security & Privacy

### Encryption Strategy
- **Secrets at rest**: Provider tokens encrypted with AES-256-GCM
- **Raw payloads**: Encrypted before storage
- **Transport**: HTTPS everywhere, Firebase App Check

### Access Control
- User data isolation via Firestore rules (`userId == auth.uid`)
- API routes verify Firebase ID tokens
- Rate limiting via Upstash Redis

### PII Minimization
- Store only necessary data
- Mask account numbers (last 4 digits visible)
- No plain-text credentials in logs

### Data Deletion
- Export all user data (JSON)
- Delete user and all subcollections
- Audit log of deletion

---

## 4. Observability

### Structured Logging
- `src/lib/logger.ts` - Centralized logger
- JSON format with context (userId, requestId)
- Log levels: debug, info, warn, error

### Metrics (Future)
- Sync success/failure rates
- API response times
- AI query latency
- User engagement

### Health Checks
- `/api/health` - Basic health
- Provider sync status per user
- Stale data detection

---

## 5. Key Files Reference

| Area | Files |
|------|-------|
| Financial Calculator | `src/lib/financial-calculator.ts` (SSOT) |
| AI Brain | `src/lib/ai-brain-service.ts`, `ai-specialized-functions.ts` |
| Financial Tools | `src/lib/financial-tools.ts` |
| Auth | `src/lib/auth-server.ts`, `src/components/providers/SessionProvider.tsx` |
| Plaid | `src/lib/plaid.ts`, `src/app/api/plaid/` |
| Israeli Scraper | `services/scraper/`, `src/lib/banking/` |
| Crypto | `src/lib/services/crypto-balance-service.ts` |
| Types | `src/types/finance.ts`, `src/types/firestore.ts` |
| Validation | `src/lib/financial-validator.ts` |

---

## 6. Development Guidelines

### Adding a New Connector
1. Implement `FinancialConnector` interface
2. Add provider config to `src/lib/config.ts`
3. Register in connector factory
4. Add sync job configuration
5. Update security rules if new collections
6. Add tests with mocked responses

### Modifying Financial Calculations
1. All changes go through `financial-calculator.ts`
2. Add validation in `financial-validator.ts`
3. Update tests
4. Verify consistency across all consuming endpoints

### AI Prompt Changes
1. Update `buildEnhancedSystemPrompt` in `ai-brain-service.ts`
2. Add evaluation tests for expected behaviors
3. Document guardrails and safety considerations
