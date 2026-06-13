// challenge-14-fixture-teardown.ts

/**
 * Quiz 02 — Challenge 14: Fixture with Teardown
 * Curriculum: Ch09 — Fixtures & Extensibility
 * Difficulty: MEDIUM
 *
 * Problem: Resources created during a test (files, DB records, temp accounts)
 *          leak across tests if not cleaned up, causing state pollution.
 * Solution: Use fixture teardown: code AFTER `await use(...)` runs automatically
 *           when the test (or worker) finishes, even if the test fails.
 */

import * as fs from 'fs';
import * as path from 'path';

import { test as base, expect } from '@playwright/test';

/* ───────────────────────────────────────────────────────────────────────────
   Fixture types
   ─────────────────────────────────────────────────────────────────────────── */

interface TempFileFixture {
  tempFile: {
    path: string;
    write: (content: string) => Promise<void>;
    read: () => Promise<string>;
  };
}

interface TestAccountFixture {
  testAccount: {
    id: string;
    username: string;
  };
}

/* ───────────────────────────────────────────────────────────────────────────
   Fixture 1: Test-scoped temp file with automatic cleanup
   ─────────────────────────────────────────────────────────────────────────── */

const test = base.extend<TempFileFixture & TestAccountFixture>({
  // Test-scoped fixture: creates a temp file before the test,
  // then deletes it after the test finishes (even on failure).
  tempFile: async ({}, use) => {
    const tmpDir = path.resolve(__dirname, '..', '..', '.tmp');
    fs.mkdirSync(tmpDir, { recursive: true });

    const filePath = path.join(tmpDir, `test-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`);

    const tempFileAPI = {
      path: filePath,
      write: async (content: string) => {
        fs.writeFileSync(filePath, content, 'utf-8');
      },
      read: async () => {
        return fs.readFileSync(filePath, 'utf-8');
      },
    };

    // Provide the fixture value to the test.
    await use(tempFileAPI);

    // TEARDOWN: This code ALWAYS runs, even if the test throws.
    // Guaranteed cleanup prevents disk space leaks and cross-test contamination.
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Swallow cleanup errors so they don't mask the actual test failure.
    }
  },

  // Test-scoped fixture: simulated account creation + deletion.
  testAccount: async ({}, use) => {
    // Simulate creating a user account via API or UI.
    const accountId = `acc-${Date.now()}`;
    const account = { id: accountId, username: `testuser-${accountId}` };

    // In a real framework, you'd call your user API here:
    // await apiClient.createUser({ username: account.username, ... });

    await use(account);

    // TEARDOWN: Delete the account so the next test starts clean.
    // This is the pattern used for account pooling and test isolation.
    try {
      // await apiClient.deleteUser(account.id);
      // For demo purposes, we just assert the teardown ran conceptually.
    } catch {
      // Log but don't fail the test on cleanup issues.
    }
  },
});

/* ───────────────────────────────────────────────────────────────────────────
   Tests using the teardown fixtures
   ─────────────────────────────────────────────────────────────────────────── */

test('quiz-02-ch14: temp file fixture creates and cleans up', async ({ tempFile, page }) => {
  await page.goto('https://example.com');

  // Use the fixture during the test.
  await tempFile.write('Hello, Playwright!');
  const content = await tempFile.read();

  expect(content).toBe('Hello, Playwright!');
  expect(fs.existsSync(tempFile.path)).toBe(true); // File exists during test

  // When this test function returns (or throws), the teardown runs
  // and the file is deleted.
});

test('quiz-02-ch14: test account fixture with teardown', async ({ testAccount, page }) => {
  await page.goto('https://example.com');

  expect(testAccount.id).toBeTruthy();
  expect(testAccount.username).toContain('testuser-');

  // After this test, the teardown deletes the account.
});

/* ───────────────────────────────────────────────────────────────────────────
   Advanced: Worker-scoped fixture with worker-level teardown
   ─────────────────────────────────────────────────────────────────────────── */

interface WorkerLogFixture {
  workerLog: { write: (line: string) => void };
}

const testWorkerScoped = base.extend<WorkerLogFixture>({
  workerLog: [
    async ({}, use) => {
      const workerIndex = process.env.TEST_WORKER_INDEX ?? '0';
      const logPath = path.resolve(__dirname, '..', '..', '.tmp', `worker-${workerIndex}.log`);
      fs.mkdirSync(path.dirname(logPath), { recursive: true });

      const stream = fs.createWriteStream(logPath, { flags: 'a' });

      await use({
        write: (line: string) => {
          stream.write(`${new Date().toISOString()} ${line}\n`);
        },
      });

      // TEARDOWN at worker scope: close the stream when the worker shuts down.
      stream.end();
    },
    { scope: 'worker' },
  ],
});

testWorkerScoped('quiz-02-ch14: worker-scoped log fixture', async ({ workerLog, page }) => {
  await page.goto('https://example.com');
  workerLog.write('Test started');
  expect(true).toBe(true); // placeholder
});

/**
 * TEARDOWN BEST PRACTICES:
 * 1. Place cleanup code IMMEDIATELY after `await use(...)` — no accidental early returns.
 * 2. Wrap cleanup in try/catch so cleanup failures don't mask test failures.
 * 3. Use scope:'worker' for expensive setup that should run once and clean up once.
 * 4. Use scope:'test' (default) for resources that must be isolated per test.
 * 5. For file system operations, use fs.rmSync with { recursive: true, force: true }.
 * 6. For API cleanup, always implement idempotent deletes (safe to call twice).
 */
