import ccxt from 'ccxt';

export interface CryptoBalance {
  symbol: string;
  amount: number;
  value: number;
  price: number;
}

export interface CryptoPortfolio {
  exchange: string;
  balances: CryptoBalance[];
  totalValue: number;
  lastUpdated: Date;
}

export async function getCoinbasePortfolio(
  apiKey: string,
  apiSecret: string
): Promise<CryptoPortfolio> {
  const exchange = new ccxt.coinbase({
    apiKey,
    secret: apiSecret,
  });

  const balance = await exchange.fetchBalance();
  const tickers = await exchange.fetchTickers();

  const balances: CryptoBalance[] = [];
  let totalValue = 0;

  for (const [symbol, amount] of Object.entries(balance?.total || {})) {
    if (typeof amount === 'number' && amount > 0) {
      const ticker = tickers[`${symbol}/USD`];
      const price = ticker?.last || 0;
      const value = (amount as number) * price;

      balances.push({
        symbol,
        amount: amount as number,
        value,
        price,
      });

      totalValue += value;
    }
  }

  return {
    exchange: 'Coinbase',
    balances: balances.sort((a, b) => b.value - a.value),
    totalValue,
    lastUpdated: new Date(),
  };
}

export async function getBinancePortfolio(
  apiKey: string,
  apiSecret: string
): Promise<CryptoPortfolio> {
  const exchange = new ccxt.binance({
    apiKey,
    secret: apiSecret,
  });

  const balance = await exchange.fetchBalance();
  const tickers = await exchange.fetchTickers();

  const balances: CryptoBalance[] = [];
  let totalValue = 0;

  for (const [symbol, amount] of Object.entries(balance?.total || {})) {
    if (typeof amount === 'number' && amount > 0) {
      const ticker = tickers[`${symbol}/USDT`];
      const price = ticker?.last || 0;
      const value = (amount as number) * price;

      balances.push({
        symbol,
        amount: amount as number,
        value,
        price,
      });

      totalValue += value;
    }
  }

  return {
    exchange: 'Binance',
    balances: balances.sort((a, b) => b.value - a.value),
    totalValue,
    lastUpdated: new Date(),
  };
}
