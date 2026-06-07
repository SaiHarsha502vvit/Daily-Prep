import { defineConfig, devices } from '@playwright/test';
import { envConfig } from './config/env.loader';
import { Timeouts } from './constants/timeouts';

export default defineConfig({
  testDir: './tests',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,

  timeout: Timeouts.SIXTY_SECONDS,
  expect: {
    timeout: Timeouts.TEN_SECONDS,
  },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    actionTimeout: Timeouts.FIFTEEN_SECONDS,
    navigationTimeout: Timeouts.THIRTY_SECONDS,
    headless: envConfig.headless,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },

  projects: [
    {
      name: 'orangehrm',
      testDir: './tests/orangehrm',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: envConfig.orangehrm.baseUrl,
      },
    },
    {
      name: 'api',
      testDir: './tests',
      testMatch: /.*\.api\.spec\.ts$/,
      use: {
        baseURL: envConfig.api.baseUrl,
      },
    },
    {
      name: 'firefox-ci',
      testDir: './tests/orangehrm',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: envConfig.orangehrm.baseUrl,
      },
      grep: /@cross-browser/,
    },
    {
      name: 'file-io',
      testDir: './tests/file-io',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
