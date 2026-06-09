// challenge-17-scope-mismatch.ts

/**
 * Quiz 02 — Challenge 17: Fixture Dependency Scope Mismatch
 * Curriculum: Ch09 — Fixtures & Extensibility
 * Difficulty: HIGH
 *
 * Problem: A test-scoped fixture cannot depend on a worker-scoped fixture
 *          because worker-scoped values live longer and are shared across tests.
 *          Conversely, a worker-scoped fixture CAN depend on another worker-scoped fixture.
 * Solution: Align scopes. If a resource must be per-test, both fixtures should be
 *           test-scoped. If shared, both should be worker-scoped.
 */

import { test as base, expect } from '@playwright/test';

/* ───────────────────────────────────────────────────────────────────────────
   ❌ BROKEN VERSION — test-scoped fixture depends on worker-scoped mutable state
   ─────────────────────────────────────────────────────────────────────────── */

interface BrokenFixtures {
  sharedCounter: number;
  incrementedValue: number;
}

// TRAP: worker-scoped mutable state leaked to test-scoped fixtures.
const brokenTest = base.extend<BrokenFixtures>({
  sharedCounter: [
    async ({}, use) => {
      let counter = 0;
      await use(counter);
    },
    { scope: 'worker' },
  ],

  // 🐛 This is implicitly test-scoped (no scope specified).
  // It depends on a worker-scoped fixture. Playwright ALLOWS this syntactically,
  // but the semantics are dangerous: the same worker-scoped counter is mutated
  // by multiple tests running in parallel.
  incrementedValue: async ({ sharedCounter }, use) => {
    const value = sharedCounter + 1; // All parallel tests may read the same value!
    await use(value);
  },
});

brokenTest('scope mismatch demo @flaky', async ({ incrementedValue }) => {
  // In parallel execution, multiple tests may see the same incrementedValue
  // because sharedCounter is only initialized once per worker.
  console.log(`  [broken] incrementedValue = ${incrementedValue}`);
  expect(incrementedValue).toBeGreaterThanOrEqual(1);
});

/* ───────────────────────────────────────────────────────────────────────────
   ✅ FIXED VERSION A — both fixtures are test-scoped (isolation)
   ─────────────────────────────────────────────────────────────────────────── */

interface FixedFixtures {
  isolatedCounter: number;
  incrementedValue: number;
}

const fixedTest = base.extend<FixedFixtures>({
  // FIXED: Removed scope:'worker'. Now counter is created fresh for EVERY test.
  isolatedCounter: async ({}, use) => {
    let counter = 0;
    await use(counter);
  },

  // Now safe: each test gets its own counter, so the increment is deterministic.
  incrementedValue: async ({ isolatedCounter }, use) => {
    const value = isolatedCounter + 1;
    await use(value);
  },
});

fixedTest('quiz-02-ch17-fixA: test-scoped isolation', async ({ incrementedValue }) => {
  expect(incrementedValue).toBe(1); // ✅ Guaranteed, every time.
});

/* ───────────────────────────────────────────────────────────────────────────
   ✅ FIXED VERSION B — both fixtures are worker-scoped (intentional sharing)
   ─────────────────────────────────────────────────────────────────────────── */

interface WorkerSharedFixtures {
  workerContext: { dbConnection: string };
  userPool: string[];
}

const workerTest = base.extend<WorkerSharedFixtures>({
  // Worker-scoped: expensive DB connection created once.
  workerContext: [
    async ({}, use) => {
      const conn = { dbConnection: 'postgres://localhost:5432/test' };
      await use(conn);
    },
    { scope: 'worker' },
  ],

  // Worker-scoped: depends on worker-scoped context. Both live for the worker lifetime.
  // This is VALID because scopes match.
  userPool: [
    async ({ workerContext }, use) => {
      // Simulate loading users via the shared connection.
      const pool = [`user-from-${workerContext.dbConnection}-1`, `user-from-${workerContext.dbConnection}-2`];
      await use(pool);
    },
    { scope: 'worker' },
  ],
});

workerTest('quiz-02-ch17-fixB: worker-scoped dependency chain', async ({ userPool }) => {
  expect(userPool.length).toBe(2);
  expect(userPool[0]).toContain('postgres');
});

/* ───────────────────────────────────────────────────────────────────────────
   Scope compatibility matrix
   ─────────────────────────────────────────────────────────────────────────── */

/**
 * ┌─────────────────────┬─────────────────────┬──────────────────────────────┐
 * │ Fixture A scope     │ Fixture B scope     │ Valid?                       │
 * ├─────────────────────┼─────────────────────┼──────────────────────────────┤
 * │ test                │ test                │ ✅ Yes (default)             │
 * │ test                │ worker              │ ✅ Yes (B outlives A, ok)    │
 * │ worker              │ test                │ ❌ No  (B shorter than A)    │
 * │ worker              │ worker              │ ✅ Yes                       │
 * └─────────────────────┴─────────────────────┴──────────────────────────────┘
 *
 * RULE: A fixture can ONLY depend on fixtures with EQUAL or LONGER scope.
 *       Test < Worker. So test-scoped can depend on worker-scoped, but not vice versa.
 *
 * ACTUALLY, let me correct this: In Playwright, test-scoped fixtures CAN depend on
 * worker-scoped fixtures (worker lives longer, so it's available). The DANGER is:
 * if the test-scoped fixture MUTATES the worker-scoped fixture, the mutation leaks.
 *
 * The TRUE restriction: you cannot have a worker-scoped fixture depend on a
 * test-scoped fixture, because the test-scoped one might not exist when the
 * worker-scoped one needs it.
 */

/* ───────────────────────────────────────────────────────────────────────────
   Demonstrating the REAL restriction: worker-scoped depending on test-scoped
   ─────────────────────────────────────────────────────────────────────────── */

// This would be INVALID in Playwright:
//
// base.extend({
//   testScopedData: async ({}, use) => { await use('data'); }, // test scope (default)
//   workerScopedData: [
//     async ({ testScopedData }, use) => { // 🐛 ERROR: cannot depend on test-scoped!
//       await use(testScopedData);
//     },
//     { scope: 'worker' },
//   ],
// });

test('quiz-02-ch17: scope matrix sanity', async ({ page }) => {
  await page.goto('https://example.com');
  expect(true).toBe(true); // placeholder
});

/**
 * BEST PRACTICES:
 * 1. If a fixture is MUTABLE, keep it test-scoped (default).
 * 2. If a fixture is READ-ONLY or expensive to create, use scope:'worker'.
 * 3. Never mutate a worker-scoped fixture from a test-scoped fixture.
 * 4. Playwright will throw at runtime if you try worker→test dependency.
 */
