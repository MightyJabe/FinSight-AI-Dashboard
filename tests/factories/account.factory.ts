import { faker } from '@faker-js/faker';
import type { Account } from '@/types';

export const createTestAccount = (overrides?: Partial<Account>): Account => ({
  id: `test-account-${faker.string.alphanumeric(8)}`,
  name: faker.helpers.arrayElement([
    'Checking Account',
    'Savings Account',
    'Credit Card',
    'Investment Account',
  ]),
  type: faker.helpers.arrayElement(['checking', 'savings', 'credit', 'investment']),
  balance: faker.number.float({ min: 100, max: 50000, fractionDigits: 2 }),
  institution: faker.company.name(),
  currency: 'USD',
  ...overrides,
});

export const createTestCheckingAccount = (
  overrides?: Partial<Account>
): Account =>
  createTestAccount({
    name: 'Test Checking Account',
    type: 'checking',
    balance: faker.number.float({ min: 500, max: 5000, fractionDigits: 2 }),
    ...overrides,
  });

export const createTestSavingsAccount = (
  overrides?: Partial<Account>
): Account =>
  createTestAccount({
    name: 'Test Savings Account',
    type: 'savings',
    balance: faker.number.float({ min: 1000, max: 20000, fractionDigits: 2 }),
    ...overrides,
  });

export const createTestCreditCardAccount = (
  overrides?: Partial<Account>
): Account =>
  createTestAccount({
    name: 'Test Credit Card',
    type: 'credit',
    balance: -faker.number.float({ min: 0, max: 5000, fractionDigits: 2 }),
    ...overrides,
  });
