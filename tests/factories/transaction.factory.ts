import { faker } from '@faker-js/faker';
import type { Transaction } from '@/types';

export const createTestTransaction = (
  overrides?: Partial<Transaction>
): Transaction => ({
  id: `test-txn-${faker.string.alphanumeric(8)}`,
  type: 'expense',
  amount: faker.number.float({ min: 5, max: 500, fractionDigits: 2 }),
  category: faker.helpers.arrayElement([
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
  ]),
  date: faker.date.recent({ days: 30 }).toISOString(),
  description: faker.company.name(),
  account: 'Test Checking Account',
  accountId: `test-account-${faker.string.alphanumeric(8)}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createTestIncomeTransaction = (
  overrides?: Partial<Transaction>
): Transaction =>
  createTestTransaction({
    type: 'income',
    amount: faker.number.float({ min: 1000, max: 5000, fractionDigits: 2 }),
    category: 'Income',
    description: 'Salary',
    ...overrides,
  });

export const createTestExpenseTransaction = (
  overrides?: Partial<Transaction>
): Transaction =>
  createTestTransaction({
    type: 'expense',
    amount: -Math.abs(
      faker.number.float({ min: 5, max: 500, fractionDigits: 2 })
    ),
    ...overrides,
  });
