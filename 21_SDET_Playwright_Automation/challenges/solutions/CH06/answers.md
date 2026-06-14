# CH06 — Understanding the Auth Fixture

## Part 3 — Written Answers

---

### 1. Why does worker offset prevent contention?

When `npx playwright test --workers=4` runs, it spawns **4 completely separate Node.js processes**. Each process calls `acquireAccount()` independently, and all 4 may call it within the same millisecond. Without any coordination, every worker would try to lock `account-1.lock` first — the one with the lowest account ID. Three of them would immediately fail (file already locked by worker 0), then retry, creating a "thundering herd" problem where workers waste CPU cycles colliding on the same lock file repeatedly.

The worker offset (`workerIndex % ACCOUNTS.length`) breaks this symmetry by giving each worker a **different first-choice lock**. Worker 0 tries `account-1` first, Worker 1 tries `account-2` first (or wraps back to `account-1` if there's only one), Worker 2 tries `account-3` first, and so on. In the common case where `ACCOUNTS.length >= workers`, each worker picks a different lock file on its first attempt and acquires it without any collision — zero retry overhead. This is essentially a deterministic hash-based partitioning strategy: each worker maps to one account via its index, preventing all workers from converging on the same resource simultaneously.

---

### 2. What happens if a test crashes after acquire but before release?

When a test crashes (throws an uncaught exception, hits a timeout, or the process is killed) between `lockfile.lock()` succeeding and `releaseAccount()` being called, the lock file remains on disk. The test process exits abnormally, but the OS-level lock on the file is released automatically when the process terminates. However, the `.lock` file itself persists — a stale marker of a crashed worker.

The `stale: 3_600_000` option (1 hour in milliseconds) solves this. `proper-lockfile` writes a lockfile with a timestamp, and on subsequent lock attempts, it checks whether any existing lockfile's timestamp is older than the stale threshold. If Worker 0 crashes and Worker 1 tries to lock `account-1.lock`, Worker 1 sees the lockfile exists but is "stale" (created > 1 hour ago by a dead process). Since `retries: 0` means it won't retry waiting for the lock, it immediately throws — but if `stale` detection is combined with `update` or if the next lock attempt includes stale detection, it can reclaim the account. In practice, this means a worker crash doesn't permanently exhaust an account; the pool self-heals after the stale timeout expires, or the next worker that tries that account can detect and override a dead lock.

---

### 3. Why a file lock and not a JavaScript Map?

When Playwright runs with `--workers=4`, it creates **4 independent Node.js processes**. Each process has its own V8 heap, its own event loop, and its own module cache. A JavaScript `Map` declared at module scope in `auth.fixture.ts` is **not shared across these processes** — it exists separately in each worker's memory. If Worker 1 puts `{id: 1, release: fn}` into its Map, Worker 2's Map is completely empty. Worker 2 has no way to know that Worker 1 holds account-1.

File locks solve this because they live on the **OS file system**, which is a shared resource accessible from all processes. When Worker 1 calls `lockfile.lock('/path/to/account-1.lock')`, the OS records an exclusive byte-range lock on that file. When Worker 2 later calls `lockfile.lock()` on the same file, the OS detects the existing lock and returns `EWOULDBLOCK` (or equivalent) to `proper-lockfile`, which then throws. The lock is enforced by the kernel, not by any JavaScript code — which is exactly what you need when your synchronization primitives need to work across process boundaries.

---

### 4. Why does release go in a finally block?

In `page.fixture.ts`, the `pooledAccount` fixture looks like:

```typescript
pooledAccount: async ({}, use) => {
  const account = await acquireAccount();
  try {
    await use(account);
  } finally {
    await releaseAccount(account.id);
  }
},
```

The `finally` block is critical because Playwright fixture teardown runs **regardless of how the test body exits**: passing, failing, throwing an exception, timing out, or being skipped. If `releaseAccount` were called only at the end of a successful `try` block, any exception thrown by the test body would skip the release call and leave the account locked until the stale timeout expires. With 4 workers and a single account, one stuck account would completely exhaust the pool on subsequent test runs.

The `finally` guarantee means the account is **always** returned to the pool when the test completes — whether it passed, failed, or crashed mid-execution. This makes the fixture resilient by construction: developers writing tests don't need to remember to clean up manually; the fixture enforces it.

---

### 5. What's the failure mode if `ACCOUNTS.length === 1` and `workers === 4`?

With 1 account and 4 workers, only one worker can hold the account at a time. The other three workers must wait. The wait budget is `waitBudgetMs = 60_000` (60 seconds), implemented as a `while (Date.now() - startedAt < waitBudgetMs)` loop with a 100ms sleep between full rotation attempts.

The failure mode plays out like this: Worker 0 acquires account-1 first and starts its test (which may take seconds to minutes). Workers 1, 2, and 3 all find account-1 locked, rotate through the single-element `ordered` array once, find nothing available, sleep 100ms, and retry. For the first ~60 seconds, the three waiting workers keep retrying. But here is the key problem: the 100ms sleep means each worker gets 600 attempts (60,000 / 100) before the budget expires. If Worker 0's test runs longer than 60 seconds, or if there's accumulated queue delay from the retry loop, Workers 1/2/3 exhaust their budget and throw `"[auth.fixture] No account available within 60s — pool exhausted."`

In the specific case where Worker 0 holds the account but hasn't released it yet (e.g., a long-running test), all three waiting workers will eventually hit the 60-second timeout simultaneously and fail with the same error. The test that was "waiting" never actually ran — the error occurs in the setup fixture, so Playwright marks the test as failed with a fixture error. The practical consequence: with a 1-account pool and 4 workers, you cannot run more than 1 test at a time, and any test taking > 60 seconds causes cascading failures.

The correct sizing rule is: `workers <= ACCOUNTS.length` for a fully utilized pool, or `ACCOUNTS.length >= workers` to guarantee zero contention.
