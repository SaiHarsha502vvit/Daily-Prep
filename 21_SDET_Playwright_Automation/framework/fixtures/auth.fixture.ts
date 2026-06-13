import * as fs from 'fs';
import * as path from 'path';

import * as lockfile from 'proper-lockfile';

import { envConfig } from '../config/env.loader';
import { UserRole, type PooledAccount } from '../types/user.types';

const LOCK_DIR = path.resolve(__dirname, '..', '.locks');

if (!fs.existsSync(LOCK_DIR)) {
  fs.mkdirSync(LOCK_DIR, { recursive: true });
}

const ACCOUNTS: PooledAccount[] = [
  {
    id: 1,
    username: envConfig.orangehrm.demoUsername,
    password: envConfig.orangehrm.demoPassword,
    role: UserRole.ADMIN,
  },
];

const releaseFunctions = new Map<number, () => Promise<void>>();

function lockPathFor(accountId: number): string {
  const file = path.join(LOCK_DIR, `account-${accountId}.lock`);
  if (!fs.existsSync(file)) fs.writeFileSync(file, '');
  return file;
}

export async function acquireAccount(): Promise<PooledAccount> {
  const workerIndex = parseInt(process.env.TEST_WORKER_INDEX ?? '0', 10);
  const startOffset = workerIndex % ACCOUNTS.length;
  const ordered = [...ACCOUNTS.slice(startOffset), ...ACCOUNTS.slice(0, startOffset)];

  const startedAt = Date.now();
  const waitBudgetMs = 60_000;

  while (Date.now() - startedAt < waitBudgetMs) {
    for (const account of ordered) {
      const file = lockPathFor(account.id);
      try {
        const release = await lockfile.lock(file, {
          retries: 0,
          stale: 3_600_000,
          update: 10_000,
        });
        releaseFunctions.set(account.id, release);
        return account;
      } catch {
        continue;
      }
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('[auth.fixture] No account available within 60s — pool exhausted.');
}

export async function releaseAccount(accountId: number): Promise<void> {
  const release = releaseFunctions.get(accountId);
  if (!release) return;
  try {
    await release();
  } finally {
    releaseFunctions.delete(accountId);
  }
}
