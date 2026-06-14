/**
 * CH06 — Auth Fixture Re-implementation from Memory
 *
 * This is a clean-room reimplementation of framework/fixtures/auth.fixture.ts
 * designed to run in the solutions/CH06/ directory.
 *
 * Key design decisions (matching the original):
 * - proper-lockfile for OS-level file-based mutual exclusion
 * - Worker offset (workerIndex % ACCOUNTS.length) for deterministic first-choice lock
 * - Wait budget (60s) with clear error on exhaustion
 * - Map<accountId, releaseFn> for tracking active locks within a worker process
 * - finally-block in page.fixture.ts for guaranteed cleanup
 */

import * as fs from "fs";
import * as path from "path";
import * as lockfile from "proper-lockfile";

export enum UserRole {
  ADMIN = "ADMIN",
  ESS = "ESS",
}

export interface PooledAccount {
  id: number;
  username: string;
  password: string;
  role: UserRole;
}

// ---------------------------------------------------------------------------
// Lock directory setup
// ---------------------------------------------------------------------------
const LOCK_DIR = path.resolve(__dirname, ".locks");

if (!fs.existsSync(LOCK_DIR)) {
  fs.mkdirSync(LOCK_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Account pool
// ---------------------------------------------------------------------------
const ACCOUNTS: PooledAccount[] = [
  {
    id: 1,
    username: process.env.ORANGEHRM_DEMO_USERNAME ?? "Admin",
    password: process.env.ORANGEHRM_DEMO_PASSWORD ?? "admin123",
    role: UserRole.ADMIN,
  },
  // Extend with more accounts to scale workers: { id: 2, ... }, { id: 3, ... }
];

// ---------------------------------------------------------------------------
// Per-worker release function registry
// Maps accountId → the release function returned by proper-lockfile
// This Map lives in-process only (safe: each worker process is separate)
// ---------------------------------------------------------------------------
const releaseFunctions = new Map<number, () => Promise<void>>();

function lockPathFor(accountId: number): string {
  const file = path.join(LOCK_DIR, `account-${accountId}.lock`);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "");
  }
  return file;
}

// ---------------------------------------------------------------------------
// acquireAccount — blocks until an account is available or budget exhausted
// ---------------------------------------------------------------------------
export async function acquireAccount(): Promise<PooledAccount> {
  const workerIndex = parseInt(process.env.TEST_WORKER_INDEX ?? "0", 10);

  // Deterministic ordering: start from workerIndex to spread first attempts
  const startOffset = workerIndex % ACCOUNTS.length;
  const ordered = [
    ...ACCOUNTS.slice(startOffset),
    ...ACCOUNTS.slice(0, startOffset),
  ];

  const startedAt = Date.now();
  const waitBudgetMs = 60_000; // 1 minute

  while (Date.now() - startedAt < waitBudgetMs) {
    for (const account of ordered) {
      const file = lockPathFor(account.id);

      try {
        const release = await lockfile.lock(file, {
          retries: 0, // non-blocking: throw immediately if locked
          stale: 3_600_000, // 1 hour — auto-reclaim if original holder died
          update: 10_000, // refresh lockfile mtime every 10s to avoid stale
        });

        // Store release function so releaseAccount() can call it later
        releaseFunctions.set(account.id, release);
        return account;
      } catch {
        // Lock held by another worker — try the next account
        continue;
      }
    }

    // Full rotation with no acquisition — wait before retrying
    await new Promise((r) => setTimeout(r, 100));
  }

  throw new Error(
    "[auth.fixture] No account available within 60s — pool exhausted.\n" +
      "  Hint: ensure ACCOUNTS.length >= workers, or increase waitBudgetMs.",
  );
}

// ---------------------------------------------------------------------------
// releaseAccount — releases the lock for the given accountId
// ---------------------------------------------------------------------------
export async function releaseAccount(accountId: number): Promise<void> {
  const release = releaseFunctions.get(accountId);
  if (!release) {
    // Already released or never acquired — idempotent, no-op
    return;
  }

  try {
    await release();
  } finally {
    // Always remove from registry, even if release() throws
    // (proper-lockfile should not throw on release, but defensive finally is safe)
    releaseFunctions.delete(accountId);
  }
}
