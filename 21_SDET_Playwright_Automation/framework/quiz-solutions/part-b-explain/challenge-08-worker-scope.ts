// challenge-08-worker-scope.ts

/**
 * Quiz 02 — Challenge 8: What does scope:'worker' Actually Save?
 * Curriculum: Ch09 — Fixtures & Extensibility
 * Difficulty: MEDIUM
 *
 * Question: "When should I use `scope: 'worker'` in a fixture, and what does it save?"
 *
 * Answer: By default, fixtures are test-scoped: setup runs before EVERY test.
 *         Worker-scoped fixtures run ONCE per worker process and are reused across
 *         all tests assigned to that worker. This saves expensive setup time.
 */

import { test as base } from '@playwright/test';
import * as fs from 'fs';

/* ───────────────────────────────────────────────────────────────────────────
   Simulating an expensive setup operation (e.g., DB seeding, build, auth)
   ─────────────────────────────────────────────────────────────────────────── */

let workerSetupCallCount = 0;

async function expensiveSetup(): Promise<{ seeded: boolean; timestamp: number }> {
  // Simulates a 2-second DB seed, Docker container start, or complex build.
  await new Promise((resolve) => setTimeout(resolve, 2_000));
  workerSetupCallCount += 1;
  return { seeded: true, timestamp: Date.now() };
}

/* ───────────────────────────────────────────────────────────────────────────
   Fixture definitions: test-scoped vs worker-scoped
   ─────────────────────────────────────────────────────────────────────────── */

interface MyFixtures {
  testScopedSeed: { seeded: boolean; timestamp: number };
  workerScopedSeed: { seeded: boolean; timestamp: number };
  logDir: string;
}

const test = base.extend<MyFixtures>({
  // DEFAULT (no scope specified) = test scope.
  // This runs for EVERY test. In a 100-test suite, expensiveSetup() is called 100 times.
  testScopedSeed: async ({}, use) => {
    const seed = await expensiveSetup();
    await use(seed);
    // teardown runs after each test too
  },

  // FIXED: Worker scope. This runs ONCE per worker process.
  // In a 100-test suite with 4 workers, expensiveSetup() is called only 4 times.
  workerScopedSeed: [
    async ({}, use) => {
      const seed = await expensiveSetup();
      await use(seed);
      // teardown runs once when the worker shuts down
    },
    { scope: 'worker' },
  ],

  // Practical example: per-worker log directory
  logDir: [
    async ({}, use) => {
      const workerIndex = process.env.TEST_WORKER_INDEX ?? '0';
      const dir = `./logs/worker-${workerIndex}`;
      fs.mkdirSync(dir, { recursive: true });
      await use(dir);
      // Could archive logs here on worker teardown
    },
    { scope: 'worker' },
  ],
});

/* ───────────────────────────────────────────────────────────────────────────
   Tests demonstrating reuse
   ─────────────────────────────────────────────────────────────────────────── */

test.describe('worker scope savings demo', () => {
  test('quiz-02-ch08: test-scoped seed is fresh each time', async ({ testScopedSeed, page }) => {
    await page.goto('https://example.com');
    // Every test gets a NEW timestamp because expensiveSetup() ran again.
    expect(testScopedSeed.seeded).toBe(true);
    console.log(`  [test-scoped] timestamp: ${testScopedSeed.timestamp}`);
  });

  test('quiz-02-ch08: worker-scoped seed is reused', async ({ workerScopedSeed, page }) => {
    await page.goto('https://example.com');
    // Same timestamp as the previous test IF they share a worker.
    expect(workerScopedSeed.seeded).toBe(true);
    console.log(`  [worker-scoped] timestamp: ${workerScopedSeed.timestamp}`);
  });

  test('quiz-02-ch08: log dir is per-worker', async ({ logDir, page }) => {
    await page.goto('https://example.com');
    expect(fs.existsSync(logDir)).toBe(true);
    console.log(`  [logDir] ${logDir}`);
  });
});

/**
 * MATH:
 * Suite: 100 tests, 4 workers
 *
 * Test-scoped seed:  100 setups × 2s = 200s  (~3.3 minutes of setup alone)
 * Worker-scoped seed:   4 setups × 2s =   8s  (~8 seconds total)
 *
 * Savings: ~192 seconds — more than 3 minutes of CI time eliminated.
 *
 * WHEN TO USE scope:'worker':
 * ✅ DB seeding, Docker compose up, expensive build steps
 * ✅ Browser context that only needs auth once (reuse storageState)
 * ✅ Shared read-only test data that never changes
 * ✅ Log directories, report directories
 *
 * WHEN NOT TO USE scope:'worker':
 * ❌ Fixtures that produce mutable state (one test's mutation leaks to the next)
 * ❌ Fixtures that must start fresh for isolation (e.g., user account per test)
 * ❌ Any fixture that depends on a test-scoped fixture (scope mismatch — see Ch17)
 */
