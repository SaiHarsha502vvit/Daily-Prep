// challenge-03-module-state.ts

/**
 * Quiz 02 — Challenge 3: Module-Level State in Parallel Tests
 * Curriculum: Ch05 — Test Design & Parallelism
 * Difficulty: HIGH
 *
 * Problem: Mutable variables declared at module (file) scope are shared across
 *          ALL concurrently running tests. One test's mutation corrupts another's state.
 * Solution: Never use module-level mutable state. Pass data via fixtures, test params,
 *           or closure-scoped variables.
 */

import { test, expect } from '@playwright/test';

/* ───────────────────────────────────────────────────────────────────────────
   ❌ BROKEN VERSION — module-level counter shared across parallel workers
   ─────────────────────────────────────────────────────────────────────────── */

// TRAP: This variable lives in the module scope. When tests run in parallel,
// each worker process shares this file, so they all mutate the same counter.
// Result: flaky assertions, race-condition-dependent pass/fail.
let globalCounter = 0;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
test.describe('broken parallel suite', () => {
  test('increments counter @flaky', async ({ page }) => {
    await page.goto('https://example.com');
    globalCounter += 1;
    // Another parallel test may have already incremented this!
    expect(globalCounter).toBe(1); // 🐛 Flaky!
  });

  test('also increments counter @flaky', async ({ page }) => {
    await page.goto('https://example.com');
    globalCounter += 1;
    expect(globalCounter).toBe(2); // 🐛 Even flakier!
  });
});

/* ───────────────────────────────────────────────────────────────────────────
   ✅ FIXED VERSION — test-scoped state via fixtures
   ─────────────────────────────────────────────────────────────────────────── */

const base = test;

interface CounterFixture {
  incrementAndGet: () => number;
}

const testFixed = base.extend<{ counter: CounterFixture }>({
  // Fixture provides a fresh, isolated counter for every single test.
  counter: async ({}, use) => {
    let counter = 0;
    await use({
      incrementAndGet: () => {
        counter += 1;
        return counter;
      },
    });
  },
});

testFixed.describe('fixed parallel suite', () => {
  testFixed('increments counter safely', async ({ page, counter }) => {
    await page.goto('https://example.com');
    const value = counter.incrementAndGet();
    expect(value).toBe(1); // ✅ Guaranteed because counter is test-scoped.
  });

  testFixed('increments counter safely in parallel', async ({ page, counter }) => {
    await page.goto('https://example.com');
    const value = counter.incrementAndGet();
    expect(value).toBe(1); // ✅ Also guaranteed, independent of the other test.
  });
});

/* ───────────────────────────────────────────────────────────────────────────
   ✅ ALTERNATIVE — closure-scoped variable inside the test itself
   ─────────────────────────────────────────────────────────────────────────── */
test('quiz-02-ch03: local state inside test function', async ({ page }) => {
  await page.goto('https://example.com');

  // This variable is scoped to THIS test invocation only.
  let localCounter = 0;
  localCounter += 1;
  expect(localCounter).toBe(1);
});

/**
 * RULE OF THUMB:
 * If a variable is declared with `let` or `const` at the top level of a module
 * AND it is mutated during test execution, it is almost certainly a parallelism bug.
 * Use fixtures (test-scoped) or keep state entirely inside test functions.
 */
