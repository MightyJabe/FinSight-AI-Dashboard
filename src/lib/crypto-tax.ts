interface CryptoTransaction {
  date: Date;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  fees?: number;
}

interface TaxReport {
  shortTermGains: number;
  longTermGains: number;
  totalGains: number;
  costBasis: number;
  proceeds: number;
}

export function calculateCostBasis(transactions: CryptoTransaction[]): number {
  const buys = transactions.filter(t => t.type === 'buy');
  return buys.reduce((total, t) => total + t.amount * t.price + (t.fees || 0), 0);
}

export function calculateCapitalGains(transactions: CryptoTransaction[]): TaxReport {
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());

  let shortTermGains = 0;
  let longTermGains = 0;
  let costBasis = 0;
  let proceeds = 0;

  const holdings: Array<{ amount: number; price: number; date: Date }> = [];

  for (const tx of sorted) {
    if (tx.type === 'buy') {
      holdings.push({ amount: tx.amount, price: tx.price, date: tx.date });
      costBasis += tx.amount * tx.price + (tx.fees || 0);
    } else {
      let remaining = tx.amount;
      proceeds += tx.amount * tx.price - (tx.fees || 0);

      while (remaining > 0 && holdings.length > 0) {
        const holding = holdings[0];
        if (!holding) break;

        const sellAmount = Math.min(remaining, holding.amount);
        const holdingPeriod = (tx.date.getTime() - holding.date.getTime()) / (1000 * 60 * 60 * 24);
        const gain = sellAmount * (tx.price - holding.price);

        if (holdingPeriod > 365) {
          longTermGains += gain;
        } else {
          shortTermGains += gain;
        }

        holding.amount -= sellAmount;
        remaining -= sellAmount;

        if (holding.amount === 0) holdings.shift();
      }
    }
  }

  return {
    shortTermGains,
    longTermGains,
    totalGains: shortTermGains + longTermGains,
    costBasis,
    proceeds,
  };
}
