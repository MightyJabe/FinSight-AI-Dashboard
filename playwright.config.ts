import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.test for E2E tests (unless in CI, where secrets are set directly)
if (!process.env.CI) {
  dotenv.config({ path: path.resolve(__dirname, '.env.test') });
}

const workers = process.env.CI ? 1 : undefined;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(workers !== undefined ? { workers } : {}),
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Test projects that depend on auth setup
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    // Firefox and WebKit disabled in CI to stay under 20min timeout
    // Re-enable locally: remove CI check or run `npx playwright test --project=firefox`
    ...(process.env.CI
      ? []
      : [
          {
            name: 'firefox',
            use: {
              ...devices['Desktop Firefox'],
              storageState: 'tests/e2e/.auth/user.json',
            },
            dependencies: ['setup'],
          },
          {
            name: 'webkit',
            use: {
              ...devices['Desktop Safari'],
              storageState: 'tests/e2e/.auth/user.json',
            },
            dependencies: ['setup'],
          },
        ]),
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      // Pass all environment variables to the Next.js dev server
      ...process.env,
      // Explicitly ensure Firebase Admin credentials are passed
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    },
  },
});
