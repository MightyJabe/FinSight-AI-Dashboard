/**
 * Cryptocurrency-related type definitions
 */

export interface CryptoHolding {
  symbol: string;
  name: string;
  amount: number;
  averagePrice: number;
  currentPrice: number;
  value: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercent: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  marketCap?: number | undefined;
  volume24h?: number | undefined;
  rank?: number | undefined;
  lastUpdated: string;
}

export interface CryptoPortfolioSummary {
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  holdingsCount: number;
  diversificationScore: number;
  topGainer: CryptoHolding | null;
  topLoser: CryptoHolding | null;
  lastUpdated: string;
}

export interface CryptoHistoricalData {
  date: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface CryptoPortfolioData {
  summary: CryptoPortfolioSummary;
  holdings: CryptoHolding[];
  historicalData: CryptoHistoricalData[];
  insights: string[];
}

export interface CryptoPriceData {
  [symbol: string]: {
    usd: number;
    usd_24h_change: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
    market_cap_rank?: number;
  };
}

export interface CryptoAllocation {
  symbol: string;
  name: string;
  percentage: number;
  value: number;
}

export type CryptoCurrency = 'USD' | 'EUR' | 'GBP' | 'BTC' | 'ETH';
export type CryptoTimePeriod = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
