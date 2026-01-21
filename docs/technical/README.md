# Technical Documentation Index

## Overview

This directory contains technical guides, implementation documentation, and architectural decisions for the FinSight AI Dashboard project.

---

## Data Management & Calculations

### [Centralized Financial Calculations](./centralized-financial-calculations.md)
Single source of truth for all financial calculations across the application.

**Key Topics:**
- Financial metrics calculation logic
- Net worth, assets, and liabilities computation
- Data aggregation from multiple sources (Plaid, manual, crypto)
- Consistency guarantees across all pages

**When to Reference:** Understanding financial calculations, debugging data inconsistencies, modifying calculation logic

---

### [Data Sync & Session Cookie Fix](./data-sync-session-cookie-fix.md)
Documentation of the data synchronization bug fix and session cookie handling improvements.

**Key Topics:**
- Session cookie extraction and userId handling
- API route authentication patterns
- Cache invalidation strategies
- Data consistency across dashboard pages

**When to Reference:** API authentication issues, session handling bugs, cache problems

---

## Architecture & Structure

### [Page Restructure Complete](./page-restructure-complete.md)
Comprehensive documentation of the page restructuring project (Historical Reference).

**Key Topics:**
- Dashboard simplification and focus
- Accounts vs Investments separation
- Data display rules and consistency
- Before/after comparison and achievements

**When to Reference:** Understanding page organization decisions, layout patterns, UX improvements

---

## Performance & Optimization

### [Bundle Optimization Guide](./bundle-optimization-guide.md)
Bundle size reduction strategies and implementation (-444 kB, -30% reduction).

**Key Topics:**
- Dynamic imports and code splitting
- Dependency optimization
- Build analysis and monitoring
- Performance impact measurements

**When to Reference:** Optimizing bundle size, improving load times, analyzing dependencies

---

### [Web Vitals Monitoring](./web-vitals-monitoring.md)
Performance monitoring setup for Core Web Vitals tracking.

**Key Topics:**
- CLS, LCP, FCP, TTFB, INP tracking
- Performance metric reporting
- Integration with analytics
- Monitoring best practices

**When to Reference:** Performance monitoring, debugging slow pages, tracking UX metrics

---

## Recent Improvements

### [Repository Cleanup Summary](./repository-cleanup-summary.md) ⭐ NEW
Summary of repository quality improvements completed in January 2026.

**Key Topics:**
- Type safety improvements (69 → ~20 `any` types)
- Centralized logging migration (61 files)
- Firestore wrapper functions
- Code cleanliness improvements

**When to Reference:** Understanding recent codebase improvements, type-safe patterns, logging standards

---

## Quick Reference

| Task | Document |
|------|----------|
| Understanding financial calculations | [Centralized Financial Calculations](./centralized-financial-calculations.md) |
| Fixing authentication/session bugs | [Data Sync & Session Cookie Fix](./data-sync-session-cookie-fix.md) |
| Optimizing bundle size | [Bundle Optimization Guide](./bundle-optimization-guide.md) |
| Monitoring performance | [Web Vitals Monitoring](./web-vitals-monitoring.md) |
| Understanding page structure | [Page Restructure Complete](./page-restructure-complete.md) |
| Recent code quality improvements | [Repository Cleanup Summary](./repository-cleanup-summary.md) |

---

## Related Documentation

- [Main Documentation Hub](../README.md) - Master documentation index
- [Feature Roadmap](../planning/feature-roadmap.md) - Planned features and enhancements
- [Pre-Production Assessment](../planning/pre-production-assessment.md) - Production readiness checklist
- [CLAUDE.md](../../CLAUDE.md) - Development standards and AI coding guidelines

---

## Contributing to Documentation

When adding new technical documentation:

1. **Create the document** in this directory with a descriptive name
2. **Add an entry** to this README.md with:
   - Document title and link
   - Key topics covered
   - When to reference it
3. **Update** the Quick Reference table if applicable
4. **Link from** other relevant documentation

---

## Documentation Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| Centralized Financial Calculations | ✅ Current | 2024 |
| Data Sync & Session Cookie Fix | ✅ Current | 2024 |
| Page Restructure Complete | 📚 Historical Reference | 2024 |
| Bundle Optimization Guide | ✅ Current | 2024 |
| Web Vitals Monitoring | ✅ Current | 2024 |
| Repository Cleanup Summary | ⭐ New | January 2026 |
