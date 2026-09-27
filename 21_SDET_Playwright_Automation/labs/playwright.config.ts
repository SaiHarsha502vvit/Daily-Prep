import { defineConfig, devices } from '@playwright/test';

// The grader sets LAB_BASE_URL for each app version it starts.
// When you run tests yourself, start the app first:  npm run app -- 02
export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  retries: 0,                      // a lab that only passes on retry has a bug in the test
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.LAB_BASE_URL ?? 'http://localhost:4400',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
