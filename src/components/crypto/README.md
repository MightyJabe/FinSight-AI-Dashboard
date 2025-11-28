# Crypto Portfolio Module

This module provides comprehensive cryptocurrency portfolio tracking and analytics.

## Components

### ComprehensiveCryptoPortfolio

A full-featured cryptocurrency portfolio component with the following features:

- **Real-time Price Updates**: Live crypto prices with auto-refresh capabilities
- **Portfolio Analytics**: Total value, gains/losses, diversification scores
- **Performance Metrics**: Daily, weekly, monthly, and yearly returns
- **Visual Analytics**: Line charts for performance, doughnut charts for allocation
- **Risk Assessment**: Diversification scoring and portfolio concentration warnings
- **AI-Powered Insights**: Smart recommendations based on portfolio composition

#### Props

```typescript
interface ComprehensiveCryptoPortfolioProps {
  className?: string;
}
```

#### Features

- **Tab Interface**: Overview, Holdings, Allocation, Performance views
- **Auto-refresh**: Configurable live data updates every 30 seconds
- **Risk Alerts**: Visual warnings for low diversification
- **Mobile Responsive**: Optimized for all device sizes
- **Chart Integration**: Chart.js for beautiful data visualizations

## Usage

```tsx
import { ComprehensiveCryptoPortfolio } from '@/components/crypto';

export default function CryptoPage() {
  return (
    <div>
      <ComprehensiveCryptoPortfolio />
    </div>
  );
}
```

## API Integration

The component integrates with:

- `/api/crypto-portfolio` - Portfolio data and analytics
- CoinGecko API - Real-time cryptocurrency prices
- Firebase - User portfolio data storage

## Types

All TypeScript interfaces are defined in `@/types/crypto.ts` for consistency across the application.
