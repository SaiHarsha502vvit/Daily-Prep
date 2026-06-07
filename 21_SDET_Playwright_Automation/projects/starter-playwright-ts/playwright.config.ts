import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

/**
 * ─── PRODUCTION-GRADE PLAYWRIGHT CONFIG ──────────────────────────────────
 * Reference implementation for Ch46: Playwright Configuration —
 * Formal Semantics & Merge Algebra.
 *
 * Principles:
 *   1. Environment-Axiom: every scalar field conditioned on process.env.CI
 *   2. Single-Source Axiom: storageState paths, baseURL are variables
 *   3. Idempotency Axiom: globalSetup is safe to run multiple times
 *   4. Observability Axiom: JSON + HTML reporters on every CI run
 */

const BASE_URL = process.env.BASE_URL ?? 'https://portal.acme.com';
const AUTH_DIR = path.join(__dirname, 'playwright', '.auth');

export default defineConfig({
  // ── Discovery ──────────────────────────────────────────────
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  testIgnore: ['**/node_modules/**', '**/tests-examples/**'],

  // ── Parallelism ────────────────────────────────────────────
  workers: process.env.CI ? 4 : undefined,
  fullyParallel: true,

  // ── Time budgets ───────────────────────────────────────────
  timeout: process.env.CI ? 60_000 : 30_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },

  // ── Reliability ────────────────────────────────────────────
  retries: process.env.CI ? 2 : 0,
  maxFailures: process.env.CI ? 10 : undefined,

  // ── Global setup ───────────────────────────────────────────
  globalSetup: require.resolve('./tests/setup/global-setup.ts'),

  // ── Artifacts ──────────────────────────────────────────────
  use: {
    baseURL: BASE_URL,
    headless: !!process.env.CI,
    trace: process.env.CI ? 'on-first-retry' : 'on',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  // ── Projects (browser matrix + auth dependencies) ───────────
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts$/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'storageState.admin.json'),
      },
    },
    {
      name: 'firefox',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Firefox'],
        storageState: path.join(AUTH_DIR, 'storageState.admin.json'),
      },
    },
  ],

  // ── Reporters ──────────────────────────────────────────────
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/report.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
});
