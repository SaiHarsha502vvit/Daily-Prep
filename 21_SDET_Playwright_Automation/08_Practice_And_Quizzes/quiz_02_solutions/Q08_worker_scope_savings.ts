/**
 * QUIZ 02 — Challenge 8 [MEDIUM]: Explain the scope: 'worker' Savings
 *
 * GIVEN CODE:
 *   // playwright.config.ts: workers: 4
 *   account: [
 *     async ({}, use) => {
 *       const acc = await createTestAccount(apiCredentials);
 *       await use(acc);
 *       await deleteTestAccount(acc.id);
 *     },
 *     { scope: 'worker' }
 *   ],
 *
 * QUESTION: 4 workers, 40 tests.
 *   How many times does createTestAccount run WITH scope:'worker'?
 *   How many times WITHOUT scope:'worker'?
 */

import { test as base } from '@playwright/test';

// ============================================================
// ANSWER — with scope: 'worker'
// ============================================================
// createTestAccount runs 4 TIMES — once per worker at startup.
// deleteTestAccount runs 4 TIMES — once per worker at teardown.
// Each worker's 10 tests share the same account object.
//
// ANSWER — without scope: 'worker' (default 'test' scope)
// ============================================================
// createTestAccount runs 40 TIMES — before EVERY test.
// deleteTestAccount runs 40 TIMES — after EVERY test.
//
// Real-world impact (assuming createTestAccount takes 3 s):
//   Worker scope: 4 × 3s  = 12 s  total setup time
//   Test scope:  40 × 3s  = 120 s total setup time
//   → 108 seconds saved just by adding { scope: 'worker' }

// ============================================================
// Annotated example
// ============================================================

interface Account {
  id: string;
  email: string;
  role: string;
}

async function createTestAccount(_creds: object): Promise<Account> {
  // Simulate 3-second API call
  return { id: 'acc-1', email: 'test@example.com', role: 'standard' };
}

async function deleteTestAccount(_id: string): Promise<void> {
  // cleanup
}

// ✅ WORKER-SCOPED (4 calls for 40 tests with 4 workers)
const testWithWorkerAccount = base.extend<Record<string, never>, { account: Account }>({
  account: [
    async ({}, use) => {
      // Runs ONCE when this worker starts.
      const acc = await createTestAccount({});
      console.log(`[worker] Account created: ${acc.id}`);

      await use(acc); // all tests in this worker receive the same acc

      // Runs ONCE when this worker finishes (even if tests failed).
      await deleteTestAccount(acc.id);
      console.log(`[worker] Account deleted: ${acc.id}`);
    },
    { scope: 'worker' }, // ← the key
  ],
});

// ✅ TEST-SCOPED (40 calls for 40 tests — fresh account per test)
const testWithTestAccount = base.extend<{ account: Account }>({
  account: async ({}, use) => {
    // Runs ONCE BEFORE each test.
    const acc = await createTestAccount({});
    console.log(`[test] Account created: ${acc.id}`);

    await use(acc);

    // Runs ONCE AFTER each test.
    await deleteTestAccount(acc.id);
    console.log(`[test] Account deleted: ${acc.id}`);
  },
  // No { scope: 'worker' } → default is 'test'
});

// Demo tests showing usage:
testWithWorkerAccount(
  'test A uses the worker account',
  async ({ account }) => {
    console.log('Test A sees account:', account.id); // same acc as Test B in same worker
  },
);

testWithTestAccount(
  'test B gets its own fresh account',
  async ({ account }) => {
    console.log('Test B sees account:', account.id); // different from every other test
  },
);

export { testWithWorkerAccount, testWithTestAccount };

// WHY
// Playwright workers are long-lived Node processes.  They run multiple tests
// sequentially within a single process.  Worker-scoped fixtures are created
// at process start and destroyed at process end — like a class-level @BeforeAll
// in JUnit or a pytest session fixture.
//
// Decision guide:
//   scope: 'worker'  → data tests READ but don't MODIFY
//                       (auth tokens, reference accounts, seed data)
//   scope: 'test'    → data tests MODIFY (records that one test changes and
//                       another checks — must be fresh each time)
//
// Common examples of worker-scoped fixtures:
//   - OAuth access tokens (fetched once, reused across the worker's tests)
//   - Expensive DB seed data that tests only READ
//   - HTTP client instances (stateless)
//
// Common examples of test-scoped fixtures:
//   - A "testCitation" created so the test can update/delete it
//   - A Page object (always test-scoped — one page per test)
