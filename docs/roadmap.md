# FinSight AI - Financial OS Roadmap

> Phased plan for upgrading FinSight to a production-grade Financial OS.

## Phase 0: Baseline & Cleanup (Week 1)
**Goal**: Ensure solid foundation before adding new features.

### Tasks
- [x] Document current architecture (`docs/architecture.md`)
- [ ] Run full test suite, fix any failures
- [ ] Add missing tests for critical paths (financial-calculator, ai-brain)
- [ ] Update dependencies (security patches only)
- [ ] Create baseline performance metrics

### Deliverables
- Architecture documentation ✅
- Test coverage report (target: 80%+)
- Performance baseline recorded

---

## Phase 1: Canonical Schema & Snapshots (Weeks 2-3)
**Goal**: Establish single source of truth for net worth history and multi-currency support.

### Tasks
- [ ] Add `BalanceSnapshot` collection structure
- [ ] Add `NetWorthSnapshot` collection structure  
- [ ] Implement snapshot creation on sync completion
- [ ] Add FX rate service (API: exchangerate-api or similar)
- [ ] Implement currency conversion in `financial-calculator.ts`
- [ ] Add transaction deduplication by `providerTxId`
- [ ] Backfill historical snapshots from existing data
- [ ] Net worth history chart in dashboard

### Schema Additions
```
users/{userId}/
├── balanceSnapshots/{snapshotId}
│   ├── accountId: string
│   ├── balance: number
│   ├── currency: string
│   └── timestamp: Date
└── netWorthSnapshots/{snapshotId}
    ├── totalAssets: number
    ├── totalLiabilities: number
    ├── netWorth: number
    ├── breakdown: {...}
    ├── currency: string
    └── timestamp: Date
```

### Deliverables
- Snapshot collections with indexes
- Currency conversion utility
- Net worth history visualization
- Migration script for existing users

---

## Phase 2: Connector Framework (Weeks 4-6)
**Goal**: Unified abstraction for all financial data providers.

### Tasks
- [ ] Define `FinancialConnector` interface
- [ ] Create connector factory and registry
- [ ] Refactor Plaid integration to use connector pattern
- [ ] Refactor Israeli scraper to use connector pattern
- [ ] Refactor crypto service to use connector pattern
- [ ] Add sync job scheduler (cron + on-demand)
- [ ] Implement retry with exponential backoff
- [ ] Add dead-letter queue for failed syncs
- [ ] Store encrypted raw payloads
- [ ] Sync status dashboard per account

### Interface
```typescript
interface FinancialConnector {
  providerId: string;
  
  // Account operations
  syncAccounts(): Promise<Account[]>;
  getAccountStatus(): Promise<ConnectionStatus>;
  
  // Data fetching
  syncTransactions(since?: Date): Promise<Transaction[]>;
  syncBalances(): Promise<BalanceSnapshot[]>;
  syncHoldings?(): Promise<Holding[]>;
  
  // Lifecycle
  connect(credentials: EncryptedCredentials): Promise<void>;
  disconnect(): Promise<void>;
  handleError(error: ProviderError): Promise<ErrorResolution>;
}
```

### Deliverables
- Connector abstraction layer
- Sync job queue system
- Raw payload storage (encrypted)
- Sync status monitoring UI

---

## Phase 3: Insights & Categorization (Weeks 7-8)
**Goal**: Smarter automated analysis and data quality.

### Tasks
- [ ] Enhance merchant mapping rules
- [ ] Improve recurring payment detection algorithm
- [ ] Add anomaly detection (unusual spending, large charges)
- [ ] Implement subscription change alerts
- [ ] Create data quality dashboard:
  - Missing accounts warning
  - Stale sync detection
  - Uncategorized spend summary
  - Duplicate transaction alerts
- [ ] Budget vs actual alerting
- [ ] Upcoming bills notification

### Deliverables
- Enhanced categorization accuracy
- Data quality panel in dashboard
- Anomaly alerts system
- Recurring expense management

---

## Phase 4: AI Financial Assistant (Weeks 9-12)
**Goal**: Explainable AI that answers with citations and safe guardrails.

### Tasks
- [ ] Build structured context builder:
  - Fetch relevant accounts/transactions
  - Compute derived metrics (don't let LLM do math)
  - Format data with citation IDs
- [ ] Implement deterministic financial tool functions:
  - `calculate_monthly_spending(category, dateRange)`
  - `calculate_savings_rate(dateRange)`
  - `compare_spending_periods(period1, period2)`
  - `get_recurring_expenses()`
  - `simulate_loan_impact(amount, rate, term)`
- [ ] Add prompt templates for core questions:
  - "How much can I safely invest monthly?"
  - "What's my net worth trend?"
  - "Where am I overspending?"
  - "What subscriptions can I cancel?"
  - "Can I afford a loan of X?"
- [ ] Implement safe guardrails:
  - Uncertainty language for projections
  - Scenario-based advice (not certainty)
  - Disclaimer for high-stakes decisions
- [ ] Create evaluation test suite

### Deliverables
- Enhanced AI assistant with tool use
- Citation system in responses
- Prompt template library
- Guardrail documentation
- Evaluation test suite (80%+ pass rate)

---

## Phase 5: Scale & Polish (Weeks 13-16)
**Goal**: Production hardening and expanded provider support.

### Tasks
- [ ] Add mock providers for testing
- [ ] Expand Israeli bank support (validate all 13 banks)
- [ ] Add observability:
  - Structured logging with traceId
  - Error tracking (Sentry or similar)
  - Performance monitoring
- [ ] Security audit:
  - STRIDE threat model
  - Penetration test critical paths
  - Secrets rotation procedure
- [ ] Data deletion workflow (GDPR)
- [ ] Admin diagnostics page
- [ ] Documentation updates
- [ ] User testing and feedback iteration

### Deliverables
- Production-ready system
- Security documentation
- Admin tools
- User documentation

---

## Success Criteria

### Functional
- [ ] Net worth history tracked over time with 100% accuracy
- [ ] Multi-currency support (USD, ILS, EUR)
- [ ] Transaction deduplication working (<1% duplicates)
- [ ] All connected accounts sync within 24 hours
- [ ] AI assistant can answer 5 core questions with citations

### Non-Functional
- [ ] API response times <200ms (P95)
- [ ] Sync jobs complete <60s average
- [ ] Test coverage >80%
- [ ] Zero critical security vulnerabilities
- [ ] Uptime >99.5%

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Israeli bank scraper breaks | Monitor scraper health, fast incident response, upstream lib updates |
| OpenAI rate limits | Caching, request batching, rate limiting client-side |
| Firestore costs | Efficient queries, pagination, avoid full collection scans |
| Security breach | Encryption, audit logs, least privilege, regular audits |
| FX rate API downtime | Cache rates, fallback to stale rates with warning |

---

## Timeline Summary

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 0 | Week 1 | Baseline & cleanup |
| Phase 1 | Weeks 2-3 | Schema & snapshots |
| Phase 2 | Weeks 4-6 | Connector framework |
| Phase 3 | Weeks 7-8 | Insights & categorization |
| Phase 4 | Weeks 9-12 | AI assistant |
| Phase 5 | Weeks 13-16 | Scale & polish |

**Total: 16 weeks to full Financial OS**
