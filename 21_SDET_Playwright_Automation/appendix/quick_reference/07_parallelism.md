# Parallelism

> **Canonical lesson:** [09 Parallel Execution Workers](../../02_Test_Architecture/09_Parallel_Execution_Workers.md). This page is a shorter summary kept for quick lookup; the chapter is the maintained version — if the two disagree, trust the chapter.

> The authoritative reference for Playwright's parallel execution model. Worker process anatomy, `fullyParallel` semantics, sharding mechanics, data-collision avoidance, optimal worker counts for every CI tier, real benchmarks, and every production failure that comes from misunderstanding the model.

---

## Table of contents

1. [The execution model](#1-the-execution-model)
2. [Workers — what they are](#2-workers)
3. [`fullyParallel` semantics](#3-fullyparallel-semantics)
4. [`workers` — count and `'50%'` syntax](#4-workers)
5. [`test.describe.serial()` and `test.describe.parallel()`](#5-serial-and-parallel)
6. [Sharding](#6-sharding)
7. [Data collision avoidance](#7-data-collision-avoidance)
8. [Worker isolation](#8-worker-isolation)
9. [Memory and CPU budget](#9-memory-and-cpu-budget)
10. [Optimal counts by CI tier](#10-optimal-counts-by-ci-tier)
11. [Real benchmarks](#11-real-benchmarks)
12. [Test ordering and stability](#12-test-ordering)
13. [Cross-worker communication (don't)](#13-cross-worker-communication)
14. [Sharding strategies in CI](#14-sharding-strategies-in-ci)
15. [Merging sharded reports](#15-merging-sharded-reports)
16. [Common production failures](#16-common-production-failures)
17. [Anti-pattern catalog](#17-anti-pattern-catalog)

---

## 1. The execution model

Playwright runs tests in **parallel worker processes**. Each worker is a separate Node.js process with its own memory, its own browser, and its own fixture lifecycle.

### 1.1 The hierarchy

```
playwright (the CLI invocation)
└── workers (N processes)
    └── test files (each worker picks up a file, runs all its tests, then picks the next)
        └── tests (sequential within a file UNLESS fullyParallel: true)
```

By default, files run in parallel across workers; tests within a file run serially. `fullyParallel: true` upgrades to "tests within a file also parallel" — each test gets its own worker slot.

### 1.2 The state model

| State scope                             | Lives in                                            |
| --------------------------------------- | --------------------------------------------------- |
| Module-level variables (in a spec file) | One worker's memory; NOT shared across workers      |
| Worker-scoped fixtures                  | One worker's memory; shared by tests in that worker |
| Test-scoped fixtures                    | One test's memory; fresh per test                   |
| Filesystem / DB / external APIs         | Shared across ALL workers (collision risk)          |

### 1.3 Worker lifecycle

```
1. Playwright forks N worker processes.
2. Each worker:
   - Loads the config file.
   - Sets up worker-scoped fixtures.
3. The main process distributes files (or tests, if fullyParallel) to workers.
4. Each worker:
   - For each assigned file:
     - Sets up file-level beforeAll hooks.
     - For each test:
       - Sets up test-scoped fixtures.
       - Runs beforeEach hooks.
       - Runs the test body.
       - Runs afterEach hooks.
       - Tears down test-scoped fixtures.
     - Runs afterAll hooks.
5. Each worker:
   - Tears down worker-scoped fixtures.
   - Process exits.
```

The main process aggregates results and produces reports.

---

## 2. Workers

A worker is a forked Node.js process. Concretely:

| Component                             | Memory     | CPU                                    |
| ------------------------------------- | ---------- | -------------------------------------- |
| Node.js process                       | ~50 MB     | 1 thread (Node single-threaded for JS) |
| Test framework                        | ~50 MB     | shared with Node                       |
| Loaded modules (POMs, fixtures, deps) | ~100 MB    | shared                                 |
| Browser process (separately spawned)  | 150–500 MB | 1+ thread                              |
| Browser context                       | 50–150 MB  | shared with browser                    |

Total per worker: ~400–800 MB, 1 dedicated CPU thread, 1+ shared browser thread.

### 2.1 Worker inter-process model

Workers don't share JS heap. To communicate:

- Filesystem (locks, JSON files)
- External services (DB, Redis, message queue)
- Coordinator process (Playwright's main process — but it only sends test assignments, not arbitrary messages)

There is NO way for two test bodies in two workers to share JS objects.

### 2.2 Worker assignment

By default, Playwright assigns FILES to workers. A 4-worker run with 12 files:

- Worker 1: file_a.spec.ts → file_e.spec.ts → file_i.spec.ts
- Worker 2: file_b.spec.ts → file_f.spec.ts → file_j.spec.ts
- ... etc.

Files are processed in alphabetical order by default. Long files don't load-balance — a worker with a 100-test file completes after a worker with a 1-test file.

### 2.3 `fullyParallel: true` changes assignment

With `fullyParallel: true`, Playwright assigns INDIVIDUAL TESTS to workers. Better load balancing:

- Worker 1: file_a/test_1 → file_e/test_3 → ...
- Worker 2: file_a/test_2 → file_f/test_1 → ...

Tests within a file run on different workers. File-level beforeAll hooks run multiple times (once per worker that picks up a test from that file).

### 2.4 The "files vs tests" cost trade-off

| Strategy                            | Cost                                      | Best when                                         |
| ----------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| Files in parallel                   | Per-file beforeAll runs once              | Files have heavy beforeAll, low test count        |
| Tests in parallel (`fullyParallel`) | Per-file beforeAll may run multiple times | Files have many tests, no shared file-level state |

For most modern suites without heavy `beforeAll`, `fullyParallel: true` is correct.

---

## 3. `fullyParallel` semantics

```typescript
// playwright.config.ts
{
  fullyParallel: true,
  workers: 4,
}
```

With both:

- Tests within a file run in parallel.
- File-level `beforeAll` runs in each worker that touches the file (i.e., potentially N times for N workers).
- File-level state (module-level `let x` outside any test) is per-worker.

### 3.1 What this breaks

```typescript
let createdCustomerId: string; // ← module-level

test("Create customer", async ({ api }) => {
  const customer = await api.createCustomer();
  createdCustomerId = customer.id; // ← writes worker A's memory
});

test("Verify customer", async ({ api }) => {
  // ← may run in worker B; createdCustomerId is undefined here
  expect(await api.getCustomer(createdCustomerId)).toBeDefined();
});
```

This passes with `fullyParallel: false, workers: 1`. It fails intermittently with `fullyParallel: true, workers: 4`.

### 3.2 The two fixes

**Fix A — Use `test.describe.serial`:**

```typescript
test.describe.serial("customer lifecycle", () => {
  const data = { customerId: "" };

  test("Create", async ({ api }) => {
    data.customerId = (await api.createCustomer()).id;
  });
  test("Verify", async ({ api }) => {
    expect(await api.getCustomer(data.customerId)).toBeDefined();
  });
});
```

`describe.serial` pins all tests in the block to one worker AND runs them sequentially.

**Fix B — Make tests independent:**

```typescript
test("verify customer can be created and read", async ({ api }) => {
  const customer = await api.createCustomer();
  expect(await api.getCustomer(customer.id)).toBeDefined();
});
```

One test, no shared state. Always preferable when feasible.

### 3.3 `describe.parallel` and `describe.serial` interaction

- Inside `fullyParallel: false`: a `describe.parallel` block opts INTO parallel for those tests.
- Inside `fullyParallel: true`: a `describe.serial` block opts OUT (same worker, sequential).

```typescript
// fullyParallel: false (default)
test.describe.parallel("these can run in parallel", () => {
  test("A", async ({}) => {
    /* ... */
  });
  test("B", async ({}) => {
    /* ... */
  });
});
```

```typescript
// fullyParallel: true
test.describe.serial("these must run in order", () => {
  test("A", async ({}) => {
    /* ... */
  }); // always before B
  test("B", async ({}) => {
    /* ... */
  });
});
```

---

## 4. `workers`

```typescript
// Various ways to set worker count
workers: 4,
workers: '50%',           // 50% of CPU cores, rounded down
workers: undefined,       // default — half of CPU cores

// At CLI (overrides config)
npx playwright test --workers=8
```

### 4.1 Default behaviour

If `workers` is undefined:

- Locally: half of CPU cores (e.g., 4 on an 8-core machine).
- CI (detected via `process.env.CI`): default unchanged, but most teams cap explicitly.

### 4.2 `'50%'` syntax

```typescript
workers: process.env.CI ? '50%' : undefined,
```

Scales with the runner. On a 4-core runner → 2 workers. On a 16-core runner → 8.

### 4.3 Hard cap

```typescript
workers: process.env.CI ? Math.min(os.cpus().length, 4) : undefined,
```

Caps at 4 even on a 32-core runner. Useful when:

- Tests are I/O-bound (DB, API) — more workers don't help past the I/O ceiling.
- Memory is limited.
- Per-test setup is expensive — more workers = more setup overhead.

### 4.4 Workers vs CPU cores

| Workers     | CPU cores | Effect                                            |
| ----------- | --------- | ------------------------------------------------- |
| `cores / 2` | N         | Conservative, leaves headroom for browser threads |
| `cores`     | N         | Aggressive; can be optimal for CPU-bound tests    |
| `2 * cores` | N         | Almost always bad — context switching dominates   |

In practice: `workers = min(cores, RAM / 600MB)`. Memory is usually the binding constraint.

### 4.5 Workers vs sharding

Workers parallelise within ONE Playwright invocation. Sharding parallelises across MULTIPLE invocations (on multiple machines).

For a 4-machine matrix CI:

- Each machine runs `--shard=N/4` with `--workers=4`.
- Total parallelism: 16 (4 machines × 4 workers).
- Wall-clock = (total runtime / 16) + per-shard ramp-up.

---

## 5. Serial and parallel

### 5.1 `test.describe.serial`

```typescript
test.describe.serial("order lifecycle", () => {
  const data = { orderId: "" };

  test("create order", async ({ api }) => {
    data.orderId = (await api.createOrder()).id;
  });
  test("add line item", async ({ api }) => {
    await api.addLineItem(data.orderId, { sku: "X" });
  });
  test("checkout", async ({ api }) => {
    await api.checkout(data.orderId);
  });
});
```

Properties:

- All three tests run on the same worker.
- They run in the order declared.
- If "create order" fails, "add line item" and "checkout" are SKIPPED (not run, not failed — short-circuited).

### 5.2 Why short-circuit

A serial sequence assumes each test depends on the previous. If "create order" failed, "add line item" cannot succeed (no order exists). Running it would mask the real failure.

This differs from non-serial: in regular `describe`, a failure in one test does NOT skip others.

### 5.3 The retry interaction

```typescript
test.describe.serial(...)
retries: 2,
```

If "create order" fails on attempt 1, the whole serial block restarts from "create order" on attempt 2 (and 3). If any test passes attempt 1 but fails attempt 2, the block also restarts.

This is correct: a sequence is atomic. You can't retry just "checkout" if "create order" never produced an order.

### 5.4 `test.describe.parallel` — opt in within a serial default

```typescript
// playwright.config.ts: fullyParallel: false

test.describe.parallel("independent tests", () => {
  test("A", async ({}) => {
    /* ... */
  });
  test("B", async ({}) => {
    /* ... */
  });
});
```

Useful when most of your suite needs `fullyParallel: false` but a specific block can parallelise.

### 5.5 Nesting

```typescript
test.describe.serial("serial outer", () => {
  test.describe.parallel("parallel inner", () => {
    // ← contradiction
    test("A", async ({}) => {
      /* ... */
    });
    test("B", async ({}) => {
      /* ... */
    });
  });
});
```

`serial` wins on nesting conflict. The inner `parallel` is ignored.

---

## 6. Sharding

Splits a test suite into N partitions; runs the Nth.

```bash
npx playwright test --shard=1/4    # run shard 1 of 4
npx playwright test --shard=2/4    # run shard 2 of 4
# ... etc.
```

### 6.1 The algorithm

1. Discover all matching tests.
2. Sort by test ID (deterministic).
3. Split into N chunks of equal SIZE (by test count, not by estimated duration).
4. Run chunk M.

The split is by count, not weight. A shard with 50 small tests has the same nominal share as a shard with 50 large tests — but real durations differ.

### 6.2 Shard imbalance

A 200-test suite with shards 1/4, 2/4, 3/4, 4/4 each gets 50 tests. But if shard 1 has all the slow tests, it takes 30 minutes while shard 4 finishes in 5 minutes.

Mitigation:

- Use `test.slow()` to tag known-slow tests; Playwright groups them across shards.
- Profile and balance manually.
- Use `--last-failed` for re-runs to skip passing tests.

### 6.3 Sharding interacts with grep

```bash
npx playwright test --shard=1/4 --grep @smoke
```

Grep applies AFTER sharding. So shard 1 gets 50 tests, then grep filters to (say) 3 smoke tests. Shards 2–4 also get 50 each, filtering to 2, 4, 1 smoke tests. Total: 10 smoke tests across 4 shards — sometimes one shard is empty.

For small filtered suites, don't shard.

### 6.4 Sharding interacts with retries

Each shard manages its own retries. If shard 1's test fails twice with `retries: 2`, it doesn't affect shard 2.

### 6.5 Sharding interacts with `dependencies`

```typescript
projects: [
  { name: "setup", testMatch: /setup\.ts$/ },
  { name: "main", dependencies: ["setup"], testDir: "./tests" },
];
```

`setup` runs in EVERY shard, not just shard 1. Each shard independently runs its setup.

For setup that genuinely needs to run only once (e.g., seeding a DB), use `globalSetup` (which doesn't shard).

---

## 7. Data collision avoidance

The #1 source of flakiness in parallel runs.

### 7.1 The classes of collision

| Collision type             | Example                                                           |
| -------------------------- | ----------------------------------------------------------------- |
| Same record ID             | Tests A and B both create customer "test-001"                     |
| Same shared resource       | Tests A and B both modify global app settings                     |
| Same external system state | Tests A and B both send email to `test@example.com`               |
| Race on read/write         | Test A updates field; Test B reads it before A's update completes |
| Filesystem                 | Tests A and B both write to `/tmp/output.json`                    |

### 7.2 The fixes

**Random IDs:**

```typescript
const customerId = `cust-${randomUUID()}`;
```

UUIDs collide at a rate of ~0 per universe-age. Safe for any parallel run.

**Per-worker IDs:**

```typescript
const customerId = `cust-w${test.info().workerIndex}-${counter++}`;
```

Worker-scoped. Predictable. Doesn't work for tests running in parallel within a worker (use UUIDs for that).

**Per-test scoping:**

```typescript
const customerId = `cust-${testInfo.testId}`;
```

`testInfo.testId` is unique per test attempt. Includes retry number.

**Account pool (see [`./04_fixtures.md#15-account-pool`](./04_fixtures.md#15-account-pool)):**

For tests that need real, authenticated user accounts (not arbitrary IDs).

**Per-test output dir:**

```typescript
const outputFile = testInfo.outputPath("result.json");
```

`testInfo.outputPath` returns a path inside the test's unique output directory. No cross-test collision.

### 7.3 External system state

For systems with shared state (e.g., a single staging email inbox):

| Mitigation                                     | When                                                         |
| ---------------------------------------------- | ------------------------------------------------------------ |
| Per-test email aliases (`+suffix@example.com`) | Email systems that support sub-addressing                    |
| Mailosaur / MailHog with per-test mailbox      | When the test needs full mailbox access                      |
| Stub the external system                       | When the test doesn't actually need the external integration |
| Serialise via `describe.serial`                | When you can't avoid shared state                            |

### 7.4 DB-level isolation

For tests against a shared DB:

| Strategy                       | How                                                                         |
| ------------------------------ | --------------------------------------------------------------------------- |
| Schema-per-worker              | Each worker uses `worker_${index}_schema`; created at start, dropped at end |
| Truncation between tests       | `BEGIN; ROLLBACK;` wrapper, with tests in a single transaction              |
| Tagged data + cleanup          | All test data has `testFlag=true`; nightly sweep deletes old                |
| Real isolation (test-only DBs) | Each test claims a Docker DB from a pool                                    |

Choose based on:

- DB type (Postgres supports schemas; MongoDB collections; etc.)
- Test count
- Cost of provisioning
- Cleanup risk

---

## 8. Worker isolation

What workers DO and DO NOT share.

### 8.1 What's isolated

| Aspect                 | Per-worker             | Shared                                    |
| ---------------------- | ---------------------- | ----------------------------------------- |
| JS heap                | ✅ Isolated            | —                                         |
| Module-level variables | ✅ Per-worker copy     | —                                         |
| Stdout/stderr          | ✅ Per-worker capture  | Merged in reports                         |
| Worker-scoped fixtures | ✅ Per-worker instance | —                                         |
| Browser instance       | ✅ Per-worker          | —                                         |
| `process.env`          | ✅ Per-worker process  | Initially shared from parent              |
| File system            | —                      | ✅ Shared                                 |
| Database               | —                      | ✅ Shared (unless isolated by app design) |
| External APIs          | —                      | ✅ Shared                                 |

### 8.2 The `process.env` subtlety

When the parent process forks workers, env vars copy. A worker mutating `process.env.X` does NOT affect other workers OR the parent.

This means: if `globalSetup` mutates env, workers see the mutation. But if a TEST mutates env, no other test sees it.

For test-scoped config that varies per test, use fixtures (options pattern) — see [`./04_fixtures.md#10-the-options-pattern`](./04_fixtures.md#10-the-options-pattern).

### 8.3 Test artifact isolation

Each test gets its own output directory:

```
test-results/
├── tests-myspec-test-name-chromium/
│   ├── trace.zip
│   ├── screenshot.png
│   └── video.webm
├── tests-myspec-test-name-chromium-retry1/
│   └── ... (retry attempt)
```

Naming includes test path + project + retry. No cross-test collision.

### 8.4 Crash isolation

If one worker crashes (OOM, segfault, uncaught exception in fixture):

- That worker's tests are marked failed.
- Other workers continue.
- The main process exits with non-zero if any test failed.

A single bad fixture doesn't take down the whole run.

---

## 9. Memory and CPU budget

### 9.1 Memory per worker

| Component       | Idle       | Active      |
| --------------- | ---------- | ----------- |
| Node process    | 50 MB      | 100 MB      |
| Test framework  | 50 MB      | 100 MB      |
| Loaded modules  | 100 MB     | 200 MB      |
| Browser process | 200 MB     | 500 MB      |
| Browser context | 100 MB     | 300 MB      |
| **Total**       | **500 MB** | **~1.2 GB** |

For a heavy SPA with lots of DOM, browser memory can hit 1+ GB.

### 9.2 CPU per worker

A worker uses:

- 1 thread for the Node test framework.
- 1+ threads for the browser process (main, renderer, GPU, network — separate threads per process).

On a 4-core CI, 4 workers fully saturate. 8 workers would cause contention.

### 9.3 I/O budget

Tests that do many network calls share the host's network stack. With 16 parallel workers each making 10 RPS, you generate 160 RPS to one API — may hit rate limits.

Disk I/O similarly shared. Trace writes, screenshots, video segments all contend.

### 9.4 The "Why is workers=16 slower" debug

Symptom: 4 workers → 8 minutes. 16 workers → 12 minutes.

Diagnosis:

- Memory exhaustion → OS swaps to disk → 100× slowdown
- CPU contention → context switching dominates
- I/O saturation → DB or API rate limits
- Browser process contention → too many Chromium processes fighting for GPU

The fix is usually to step DOWN until you find the local minimum, not up.

### 9.5 Profiling worker resource use

```bash
# Linux: monitor while tests run
top -p $(pgrep -d ',' -f playwright)

# Memory snapshot
ps -o pid,user,%mem,rss,command -p $(pgrep -f playwright)
```

If `%mem` totals near 100%, you've over-provisioned workers. Reduce.

---

## 10. Optimal counts by CI tier

| CI tier                             | RAM   | Cores        | Recommended workers | Notes                             |
| ----------------------------------- | ----- | ------------ | ------------------- | --------------------------------- |
| GitHub Actions free (ubuntu-latest) | 7 GB  | 2            | 2                   | OOM at 4+ workers                 |
| GitHub Actions Linux X4             | 16 GB | 4            | 4                   | Sweet spot                        |
| GitHub Actions Linux X8             | 32 GB | 8            | 8                   | Or shard instead                  |
| Azure DevOps Linux Standard         | 7 GB  | 2            | 2                   | Same as GHA free                  |
| Azure DevOps Linux Premium          | 16 GB | 4            | 4                   |                                   |
| Self-hosted m5.xlarge               | 16 GB | 4            | 4                   |                                   |
| Self-hosted m5.2xlarge              | 32 GB | 8            | 6                   | Leave room for OS                 |
| Self-hosted m5.4xlarge              | 64 GB | 16           | 8                   | Beyond 8, returns diminish; shard |
| GitLab.com small                    | 4 GB  | 1            | 1                   | Can't really parallelise          |
| Local M2 MacBook Air                | 16 GB | 8 (4P + 4E)  | 4                   | Performance cores only            |
| Local M2 Pro MacBook Pro            | 32 GB | 10 (6P + 4E) | 6                   |                                   |

### 10.1 The rule of thumb

```
workers = min(cpus, RAM_GB / 0.8)
```

For a 16 GB / 4-core runner: `min(4, 16/0.8) = min(4, 20) = 4`. CPU-bound.

For a 4 GB / 4-core runner: `min(4, 5) = 4`. Marginal — may OOM under load.

For a 7 GB / 2-core runner: `min(2, 8.75) = 2`. CPU-bound.

### 10.2 Shard when workers alone aren't enough

A 500-test suite that takes 8 minutes with 4 workers:

- Add more workers: hits memory wall.
- Shard across 4 CI jobs: 4 × 8 min wall-clock = 2 min wall-clock (with 4 workers per shard).

Wall-clock improves linearly with shards (limited by CI parallelism limits and per-shard ramp-up).

---

## 11. Real benchmarks

Measured on `mcr.microsoft.com/playwright:v1.49.0-jammy` in GitHub Actions.

### 11.1 OrangeHRM smoke (5 tests, simple SPA)

| Config                             | Wall-clock                            |
| ---------------------------------- | ------------------------------------- |
| `workers: 1, fullyParallel: false` | 38 s                                  |
| `workers: 1, fullyParallel: true`  | 38 s (fully parallel needs >1 worker) |
| `workers: 2, fullyParallel: true`  | 22 s                                  |
| `workers: 4, fullyParallel: true`  | 14 s                                  |
| `workers: 8, fullyParallel: true`  | 13 s (diminishing returns)            |

### 11.2 API smoke (50 tests, no browser)

| Config        | Wall-clock                |
| ------------- | ------------------------- |
| `workers: 1`  | 78 s                      |
| `workers: 4`  | 24 s                      |
| `workers: 8`  | 16 s                      |
| `workers: 16` | 11 s                      |
| `workers: 32` | 13 s (network contention) |

API tests scale better than browser tests because each worker is lighter.

### 11.3 Sharded run (500 tests)

| Config                               | Wall-clock                   |
| ------------------------------------ | ---------------------------- |
| 1 job × workers=4                    | 18 min                       |
| 2 jobs × workers=4 (shard 1/2, 2/2)  | 9.5 min                      |
| 4 jobs × workers=4 (shard 1/4...4/4) | 5 min                        |
| 8 jobs × workers=4                   | 3.2 min (limited by ramp-up) |

Beyond 8 shards, ramp-up dominates and wall-clock barely improves.

### 11.4 Trace overhead

| Trace mode            | Wall-clock       | Disk                   |
| --------------------- | ---------------- | ---------------------- |
| `'off'`               | 14 m 00 s        | 0                      |
| `'retain-on-failure'` | 14 m 30 s (+4%)  | ~50 MB (only failures) |
| `'on'`                | 16 m 00 s (+14%) | ~2.5 GB                |

For 500 tests, `'on'` adds 2 minutes and 2.5 GB of artifacts. Always `'retain-on-failure'` in CI.

---

## 12. Test ordering

Test execution order matters more than people expect.

### 12.1 Default ordering

Files: alphabetical by path.
Tests within a file: declaration order.

```typescript
// file_a.spec.ts
test('alpha', ...);   // runs first
test('beta',  ...);
test('gamma', ...);   // runs third
```

### 12.2 `--workers=1` vs `--workers=N`

With 1 worker: tests run in true alphabetical order across all files.
With N workers: tests run in MOSTLY alphabetical order but interleaved.

Tests that pass with `workers=1` and fail with `workers=N` often have hidden dependencies.

### 12.3 Reproducing flake from CI locally

```bash
# Reproduce CI's order on a different machine
npx playwright test --workers=4 --shard=1/4

# Force single-worker, alphabetical order
npx playwright test --workers=1

# Force one specific test
npx playwright test --grep "specific test name"
```

### 12.4 The `--repeat-each` flag for flake hunting

```bash
npx playwright test --repeat-each=20 --grep "flaky test"
```

Runs the same test 20 times. If 18 pass, you have a 90% pass rate — definitely flaky.

### 12.5 The `--max-failures` flag for fast-fail CI

```bash
npx playwright test --max-failures=5
```

Stops the entire run after 5 failures. Useful when you know any failure means something fundamental broke.

---

## 13. Cross-worker communication

Don't.

### 13.1 Why you might be tempted

- Sharing rate-limit budget across workers (e.g., "we can do 100 RPS total, share fairly").
- Aggregating test results across workers in real-time.
- Coordinating cleanup.

### 13.2 The right answers

| Need                             | Solution                                                              |
| -------------------------------- | --------------------------------------------------------------------- |
| Rate limit budget                | Configure the IdP / API for higher limit, OR shard fewer ways         |
| Cross-worker aggregation         | Use the `Reporter` interface — runs in main process, sees all workers |
| Coordinated cleanup              | `globalTeardown` runs after all workers, in main process              |
| Shared cache (e.g., OAuth token) | File cache with `proper-lockfile`                                     |
| Real-time status                 | Custom reporter posting to a dashboard                                |

### 13.3 The wrong answers

- Module-level variables (worker-isolated)
- TCP sockets between workers (fragile, no coordinator)
- Shared `process.env` (copied at fork, doesn't sync)
- Browser localStorage (worker-isolated browser contexts)

If you find yourself needing cross-worker communication during a test, your test design likely needs revision.

---

## 14. Sharding strategies in CI

### 14.1 GitHub Actions matrix

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false # don't cancel siblings on first failure
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test --shard=${{ matrix.shard }}/4
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report/
```

### 14.2 Azure DevOps parallel jobs

```yaml
- job: PlaywrightTests
  strategy:
    parallel: 4
  steps:
    - script: |
        npx playwright test --shard=$(System.JobPositionInPhase)/$(System.TotalJobsInPhase)
```

### 14.3 GitLab CI parallel

```yaml
playwright_tests:
  parallel:
    matrix:
      - SHARD: [1, 2, 3, 4]
  script:
    - npx playwright test --shard=$SHARD/4
```

### 14.4 Self-hosted cluster

For massive suites (5000+ tests), shard across N machines AND M workers per machine:

```bash
# Machine 1
SSH host1 'cd /repo && npx playwright test --shard=1/8 --workers=4'

# Machine 2
SSH host2 'cd /repo && npx playwright test --shard=2/8 --workers=4'
```

8 machines × 4 workers = 32 parallel. For 5000 tests at 5s avg: 5000 × 5 / 32 = 13 minutes.

---

## 15. Merging sharded reports

Each shard produces its own JSON/HTML report. Useful to combine.

### 15.1 The `blob` reporter

```typescript
// playwright.config.ts
reporter: process.env.CI
  ? [['blob', { outputDir: 'blob-report' }]]
  : [['list'], ['html']],
```

Each shard writes `blob-report/report-{shard}.zip`.

### 15.2 The merge step

After all shards complete:

```bash
npx playwright merge-reports --reporter=html ./all-blob-reports
```

Produces a single HTML report covering all shards. The merged report shows tests in the order they appear in `testDir`, not the order they ran.

### 15.3 GitHub Actions example — full flow

```yaml
jobs:
  test:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright test --shard=${{ matrix.shard }}/4
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report/

  merge:
    if: always()
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true
      - run: npx playwright merge-reports --reporter html ./all-blob-reports
      - uses: actions/upload-artifact@v4
        with:
          name: playwright-merged-html-report
          path: playwright-report/
```

The `merge` job runs after all shards, regardless of pass/fail. Final report has all results.

---

## 16. Common production failures

### Failure 1 — Tests pass with workers=1, fail with workers=4

**Symptom:** Specific tests intermittently fail in CI but always pass locally.

**Cause:** Hidden dependency between tests. Test A writes module-level state; Test B reads it. With 1 worker, B runs after A. With 4, B runs in a different worker (no state).

**Fix:** Eliminate cross-test state. Use `describe.serial` if the tests truly depend on each other.

### Failure 2 — workers=8 is SLOWER than workers=4

**Symptom:** Counterintuitive perf regression with more workers.

**Cause:** Memory exhaustion → OS swap. Or CPU contention. Or both.

**Fix:** Check `top` during run. If %mem near 100% or load avg > cores × 2, reduce workers.

### Failure 3 — Sharded run has empty shard

**Symptom:** `--shard=1/4 --grep @smoke` runs 0 tests; shard 2 runs 5 tests.

**Cause:** Sharding splits by count BEFORE grep filters. Small grep + many shards = uneven distribution.

**Fix:** Don't shard small filtered subsets. Either skip sharding or run without grep then filter the report.

### Failure 4 — `fullyParallel: true` causes account collisions

**Symptom:** Tests fail with "account in use" when running parallel.

**Cause:** Worker-scoped account fixture was correct for `fullyParallel: false`. With `fullyParallel: true`, multiple tests within a worker run in parallel — they share the worker's single account.

**Fix:** Use test-scoped account fixtures. Or pool with N = workers × tests-in-parallel.

### Failure 5 — Sharded reports don't merge

**Symptom:** `merge-reports` errors with `Invalid blob report format`.

**Cause:** Mixed Playwright versions across shards. Or the blob report from one shard is corrupt (worker crashed mid-write).

**Fix:** Ensure all shards run the same Playwright version. Add `if: always()` to upload so partial blob reports are captured for debugging.

### Failure 6 — `describe.serial` retries the wrong test

**Symptom:** "Step 1" passes, "Step 2" fails. On retry, "Step 1" runs again.

**Cause:** This is the documented behaviour — serial blocks restart from the top on any failure.

**Fix:** Either accept the cost OR split into independent tests.

### Failure 7 — Worker setup is too slow

**Symptom:** A 100-test suite takes 5 min, of which 2 min is setup.

**Cause:** Many heavy test-scoped fixtures (DB connect, OAuth token).

**Fix:** Promote to worker scope. Or shard fewer ways (each shard's setup adds to total time).

### Failure 8 — CI job times out at 60 min

**Symptom:** Job is killed after 60 minutes, tests didn't finish.

**Cause:** Suite is too big for one shard. Or `globalTimeout` isn't set.

**Fix:** Shard more aggressively. Set `globalTimeout: 50 * 60 * 1000` so Playwright self-terminates before the CI timeout.

### Failure 9 — Different shards see different Playwright versions

**Symptom:** Shard 1 uses v1.49.0; shard 4 uses v1.48.0. Reports don't merge.

**Cause:** Each shard does `npm install` separately and `package-lock.json` somehow drifted.

**Fix:** Always `npm ci` (not `install`). Pin Playwright version exactly in `package.json`.

### Failure 10 — Memory leak across tests

**Symptom:** Worker memory grows from 500 MB to 4 GB over a 200-test run. Eventually OOMs.

**Cause:** A worker-scoped fixture accumulates state. Or a test creates objects in a global that never gets cleared.

**Fix:** Audit worker fixtures for unbounded growth. Use `--worker-on-failure` (Playwright respawns worker after failure) as a band-aid; fix the leak as the real solution.

---

## 17. Anti-pattern catalog

| ❌ Anti-pattern                                                | ✅ Fix                                                      |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| Module-level `let createdId: string` shared across tests       | Use `describe.serial` + an object accumulator               |
| Hardcoded test data IDs                                        | UUIDs or per-test scoping                                   |
| `workers: 16` on a 4-core CI                                   | Cap workers to CPU cores                                    |
| `fullyParallel: false` "for safety" without diagnosing flakes  | Diagnose flakes; `fullyParallel: true` is the right default |
| Sharding a 20-test suite                                       | Don't shard small suites; ramp-up dominates                 |
| Per-worker DB schema cleanup at start (not teardown)           | Cleanup at teardown so failures don't poison next run       |
| `describe.serial` for tests that are independent               | Make tests independent; let parallel do its job             |
| Mixed retries between serial steps                             | Serial = atomic; retry the whole block                      |
| `process.env` mutation expecting other workers to see it       | Workers are isolated; use globalSetup                       |
| `--workers=1` permanently to "fix" CI flakiness                | Diagnose the real cause                                     |
| Shard count exceeds CI parallel limit                          | Check CI's actual concurrent job cap                        |
| Same `outputDir` for multiple workers                          | Use `testInfo.outputPath()`                                 |
| Same test names across describe blocks                         | Title collisions confuse reports                            |
| Storing test results in a global array                         | Use the `Reporter` interface in the main process            |
| `await Promise.all([test1, test2])` (treating tests as values) | Use Playwright's parallel model, not manual coordination    |

---

## Cross-references

- Workers as fixtures: [`./04_fixtures.md`](./04_fixtures.md#4-test-scope-vs-worker-scope)
- Config for parallelism: [`./02_config.md`](./02_config.md#7-projects)
- CI integration: [`./10_ci_docker.md`](./10_ci_docker.md)
- Reliability + flakiness: [`./08_reliability.md`](./08_reliability.md)
- Practice problem: Q03 in [`../09_Practice_And_Quizzes/quiz_02_solutions/Q03_module_level_state_parallel.ts`](../../09_Practice_And_Quizzes/quiz_02_solutions/Q03_module_level_state_parallel.ts)
