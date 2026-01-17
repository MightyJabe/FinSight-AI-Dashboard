import { faker } from '@faker-js/faker';

export interface TestUser {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export const createTestUser = (overrides?: Partial<TestUser>): TestUser => ({
  uid: `test-uid-${faker.string.alphanumeric(8)}`,
  email: faker.internet.email(),
  displayName: faker.person.fullName(),
  createdAt: new Date().toISOString(),
  ...overrides,
});
