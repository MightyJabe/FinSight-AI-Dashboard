import { z } from 'zod';

// Account types that are typically assets
const ASSET_TYPES = new Set([
  'checking',
  'savings',
  'investment',
  'brokerage',
  'retirement',
  'pension',
  'crypto',
  'real_estate',
  'vehicle',
  'other_asset',
]);

// Account types that are typically liabilities
const LIABILITY_TYPES = new Set([
  'credit',
  'credit_card',
  'loan',
  'mortgage',
  'student_loan',
  'auto_loan',
  'personal_loan',
  'other_liability',
]);

export const AccountSchema = z.object({
  id: z.string(),
  type: z.string(),
  balance: z.number(),
  name: z.string().optional(),
});

export type AccountInput = z.infer<typeof AccountSchema>;

export const NetWorthResultSchema = z.object({
  totalNetWorth: z.number(),
  totalAssets: z.number(),
  totalLiabilities: z.number(),
  assetsByType: z.record(z.string(), z.number()),
  liabilitiesByType: z.record(z.string(), z.number()),
  accountCount: z.number(),
  lastUpdated: z.date(),
});

export type NetWorthResult = z.infer<typeof NetWorthResultSchema>;

function isAssetType(type: string): boolean {
  return ASSET_TYPES.has(type.toLowerCase());
}

function isLiabilityType(type: string): boolean {
  return LIABILITY_TYPES.has(type.toLowerCase());
}

function groupByType(accounts: AccountInput[]): Record<string, number> {
  return accounts.reduce(
    (acc, account) => {
      const type = account.type.toLowerCase();
      acc[type] = (acc[type] || 0) + Math.abs(account.balance);
      return acc;
    },
    {} as Record<string, number>
  );
}

/**
 * Calculate net worth from a list of accounts
 * Assets have positive balances or are explicitly asset types
 * Liabilities have negative balances or are explicitly liability types
 */
export function calculateNetWorth(accounts: AccountInput[]): NetWorthResult {
  if (accounts.length === 0) {
    return {
      totalNetWorth: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      assetsByType: {},
      liabilitiesByType: {},
      accountCount: 0,
      lastUpdated: new Date(),
    };
  }

  const assets: AccountInput[] = [];
  const liabilities: AccountInput[] = [];

  for (const account of accounts) {
    const type = account.type.toLowerCase();

    // Explicit liability types are always liabilities
    if (isLiabilityType(type)) {
      liabilities.push(account);
    }
    // Explicit asset types are always assets
    else if (isAssetType(type)) {
      assets.push(account);
    }
    // For unknown types, use balance sign
    else if (account.balance >= 0) {
      assets.push(account);
    } else {
      liabilities.push(account);
    }
  }

  const totalAssets = assets.reduce((sum, a) => sum + Math.abs(a.balance), 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + Math.abs(a.balance), 0);

  return {
    totalNetWorth: totalAssets - totalLiabilities,
    totalAssets,
    totalLiabilities,
    assetsByType: groupByType(assets),
    liabilitiesByType: groupByType(liabilities),
    accountCount: accounts.length,
    lastUpdated: new Date(),
  };
}
