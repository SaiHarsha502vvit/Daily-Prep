import * as path from 'path';

import { defineConfig, devices } from '@playwright/test';

import { envConfig } from './config/env.loader';
import { Timeouts } from './constants/timeouts';

// Generate a timestamped report folder when running in CI so each run
// gets its own isolated report directory (prevents overwrites in
// sharded / matrix jobs).
const isCI = !!process.env.CI;
const ciTimestamp = process.env.PLAYWRIGHT_REPORT_TIMESTAMP || new Date().toISOString().replace(/[:.]/g, '-');
const htmlOutputFolder = isCI
  ? `playwright-report/ci-${ciTimestamp}`
  : 'playwright-report';

// Parse shard settings from environment variables (Docker / CI overrides).
function getShardConfig(): { shardIndex?: number; shardTotal?: number } {
  const idxRaw = process.env.PLAYWRIGHT_SHARD_INDEX || process.env.SHARD_INDEX;
  const totalRaw = process.env.PLAYWRIGHT_SHARD_TOTAL || process.env.SHARD_TOTAL;
  if (idxRaw && totalRaw) {
    const idx = parseInt(idxRaw, 10);
    const total = parseInt(totalRaw, 10);
    if (!Number.isNaN(idx) && !Number.isNaN(total) && idx > 0 && total > 0) {
      return { shardIndex: idx, shardTotal: total };
    }
  }
  return {};
}
const shardCfg = getShardConfig();

export default defineConfig({
  testDir: './tests',

  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI
    ? parseInt(process.env.PLAYWRIGHT_RETRIES || '2', 10)
    : 0,
  workers: isCI
    ? parseInt(process.env.PLAYWRIGHT_WORKERS || '4', 10)
    : undefined,

  // Apply shard configuration when provided (CI / Docker overrides).
  // Playwright expects `current` (1-based), not `index`.
  ...(shardCfg.shardIndex && shardCfg.shardTotal
    ? { shard: { current: shardCfg.shardIndex, total: shardCfg.shardTotal } }
    : {}),

  timeout: Timeouts.SIXTY_SECONDS,
  expect: {
    timeout: Timeouts.TEN_SECONDS,
  },

  reporter: [
    ['list'],
    ['html', { outputFolder: htmlOutputFolder, open: 'never' }],
    [
      'junit',
      {
        outputFile: path.join('test-results', `junit-${ciTimestamp}.xml`),
        // Embed test annotations so GitHub Actions can surface them nicely.
        embedAnnotationsAsProperties: true,
      },
    ],
    ['json', { outputFile: path.join('test-results', `results-${ciTimestamp}.json`) }],
    // Allure — disabled by default to keep local runs lean. Enable by setting
    // ALLURE=1 in your env; the reporter writes to ./allure-results.
    ...(process.env.ALLURE === '1'
      ? [['allure-playwright', { outputFolder: 'allure-results', detail: true, suiteTitle: true }] as const]
      : []),
    // Custom matchers registered in global setup or test fixture
  ],

  use: {
    actionTimeout: Timeouts.FIFTEEN_SECONDS,
    navigationTimeout: Timeouts.THIRTY_SECONDS,
    headless: envConfig.headless,
    // Trace on first retry so we capture useful debugging info without
    // bloating storage on every single test. Retain on final failure.
    trace: 'on-first-retry',
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
    {
      // Mobile-Chromium emulation (Pixel 5 device descriptor). NOT real native mobile.
      // For native Appium-driven Android/iOS, see the sibling module:
      //   21_SDET_Playwright_Automation/CONTEXT.md → 23_Mobile_Dev_And_Testing/
      name: 'mobile-chromium',
      testDir: './tests/orangehrm',
      use: {
        ...devices['Pixel 5'],
        baseURL: envConfig.orangehrm.baseUrl,
      },
      grep: /@mobile/,
    },
    // Nightly projects below — kept out of the default `npm test` so a local run
    // doesn't accidentally pull in visual baseline / Lighthouse / axe-core runs.
    // They ARE discoverable via `--project=visual|a11y|perf` and via the nightly
    // workflow's `--grep @visual|@a11y|@perf` matrix.
    {
      name: 'visual',
      testDir: './visual/tests',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: envConfig.orangehrm.baseUrl,
      },
    },
    {
      name: 'a11y',
      testDir: './a11y/tests',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: envConfig.orangehrm.baseUrl,
      },
    },
    {
      name: 'perf',
      testDir: './perf/tests',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: envConfig.orangehrm.baseUrl,
      },
    },
  ],
});
