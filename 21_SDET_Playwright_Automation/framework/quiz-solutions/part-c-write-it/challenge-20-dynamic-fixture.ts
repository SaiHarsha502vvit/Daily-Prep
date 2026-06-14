// challenge-20-dynamic-fixture.ts

/**
 * Quiz 02 — Challenge 20: Dynamic Fixture Parameters
 * Curriculum: Ch09 — Fixtures & Extensibility
 * Difficulty: MEDIUM
 *
 * Problem: Fixtures are usually static, but sometimes a test needs to
 *          parameterize a fixture value (e.g., different base URL, different user role).
 * Solution: Use test.use({ fixtureName: value }) to override fixture values per test.
 */

import { test as base, expect, type Page } from '@playwright/test';

/* ───────────────────────────────────────────────────────────────────────────
   Fixture definitions with parameterized values
   ─────────────────────────────────────────────────────────────────────────── */

interface DynamicFixtures {
  /** The active user role for this test. */
  userRole: 'admin' | 'editor' | 'viewer';
  /** The API base URL for this test. */
  apiBaseUrl: string;
  /** A page object that behaves differently based on userRole. */
  contextualPage: ContextualPage;
}

class ContextualPage {
  constructor(
    readonly page: Page,
    readonly role: 'admin' | 'editor' | 'viewer',
  ) {}

  async gotoDashboard(): Promise<void> {
    await this.page.goto('https://example.com/dashboard');
  }

  get expectedMenuItems(): string[] {
    switch (this.role) {
      case 'admin':
        return ['Dashboard', 'Users', 'Settings', 'Reports'];
      case 'editor':
        return ['Dashboard', 'Content', 'Media'];
      case 'viewer':
        return ['Dashboard'];
      default:
        return [];
    }
  }
}

const test = base.extend<DynamicFixtures>({
  // Default values — used unless overridden by test.use().
  userRole: 'viewer',
  apiBaseUrl: 'https://api.example.com',

  // Derived fixture that depends on the parameterized ones.
  contextualPage: async ({ page, userRole }, use) => {
    await use(new ContextualPage(page, userRole));
  },
});

/* ───────────────────────────────────────────────────────────────────────────
   Tests using default fixture values
   ─────────────────────────────────────────────────────────────────────────── */

test('quiz-02-ch20: default role (viewer)', async ({ contextualPage }) => {
  await contextualPage.gotoDashboard();
  expect(contextualPage.role).toBe('viewer');
  expect(contextualPage.expectedMenuItems).toEqual(['Dashboard']);
});

/* ───────────────────────────────────────────────────────────────────────────
   Tests overriding fixture values with test.use()
   ─────────────────────────────────────────────────────────────────────────── */

test.describe('admin user tests', () => {
  // Override userRole for ALL tests in this describe block.
  test.use({ userRole: 'admin' });

  test('quiz-02-ch20: admin sees full menu', async ({ contextualPage }) => {
    await contextualPage.gotoDashboard();
    expect(contextualPage.role).toBe('admin');
    expect(contextualPage.expectedMenuItems).toContain('Settings');
    expect(contextualPage.expectedMenuItems).toContain('Users');
  });

  test('quiz-02-ch20: admin can access reports', async ({ contextualPage }) => {
    await contextualPage.gotoDashboard();
    expect(contextualPage.expectedMenuItems).toContain('Reports');
  });
});

test.describe('editor user tests', () => {
  test.use({ userRole: 'editor' });

  test('quiz-02-ch20: editor sees content menu', async ({ contextualPage }) => {
    await contextualPage.gotoDashboard();
    expect(contextualPage.role).toBe('editor');
    expect(contextualPage.expectedMenuItems).toEqual(['Dashboard', 'Content', 'Media']);
  });
});

/* ───────────────────────────────────────────────────────────────────────────
   Multiple fixture overrides at once
   ─────────────────────────────────────────────────────────────────────────── */

test.describe('staging environment tests', () => {
  test.use({
    userRole: 'admin',
    apiBaseUrl: 'https://api.staging.example.com',
  });

  test('quiz-02-ch20: staging admin with overridden base URL', async ({
    contextualPage,
    apiBaseUrl,
  }) => {
    await contextualPage.gotoDashboard();
    expect(contextualPage.role).toBe('admin');
    expect(apiBaseUrl).toBe('https://api.staging.example.com');
  });
});

/* ───────────────────────────────────────────────────────────────────────────
   Per-test override
   ─────────────────────────────────────────────────────────────────────────── */

test('quiz-02-ch20: single test override', async ({ contextualPage }) => {
  // This test uses the DEFAULT fixture values because it has no test.use().
  expect(contextualPage.role).toBe('viewer');
});

/**
 * test.use() INHERITANCE RULES:
 * 1. Values set in test.use() apply to all tests in the current describe block.
 * 2. Nested describe blocks inherit parent overrides.
 * 3. Child overrides take precedence over parent overrides.
 * 4. You can override ANY fixture, including built-in ones like `baseURL`.
 * 5. Overrides are applied per worker, so they work correctly in parallel.
 *
 * COMMON USE CASES:
 * - Different user roles per describe block.
 * - Different environments (staging vs prod) per CI job.
 * - Different viewport sizes for mobile/desktop suites.
 * - Different storageState files for pre-authenticated vs anonymous tests.
 */
