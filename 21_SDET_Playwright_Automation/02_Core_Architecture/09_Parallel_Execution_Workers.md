# 09. Parallel Execution & Worker Architecture

**Navigation**: [← Chapter 08: Browser Internals](./08_Browser_Internals_for_SDETs.md) | [Index](../00_INDEX.md) | [→ Chapter 10: Dynamics 365 CRM Testing](../03_D365_And_Patterns/10_Dynamics365_CRM_Testing.md)

**Cross-links:**
- [`13_Developer_Essentials/19_Concurrency_Models_Coroutines.md`](../../13_Developer_Essentials/19_Concurrency_Models_Coroutines.md) — Concurrency mental models
- [`21_SDET/06_Custom_Fixtures_Architecture.md`](./06_Custom_Fixtures_Architecture.md) — Worker-scoped fixtures (the `account` fixture)

---

## 5W1H — Why This Chapter?

- **WHAT**: How Playwright's Worker model works, how tests are distributed across workers, and how to design tests that are safe to run in parallel without interfering with each other.
- **WHY**: Running 100 tests sequentially takes 20 minutes. Running them with 4 parallel workers takes 5 minutes. But naive parallel tests corrupt each other's test data, causing random failures that are impossible to debug.
- **WHO**: SDETs whose test suite is growing and needs to run faster, or who are onboarding to a codebase that already uses workers.
- **WHEN**: As soon as more than one test file exists.
- **HOW**: By understanding process isolation, shared state dangers, unique data generation, and the `test.serial()` escape hatch.

---

## 1. The Worker Model — What Actually Happens

When you run `npx playwright test --workers=4`, this is what happens:

```
npx playwright test --workers=4
      │
      ├── Main Process (orchestrator)
      │     Reads playwright.config.ts
      │     Discovers all test files
      │     Assigns test files to workers
      │
      ├── Worker Process 1 (Node.js process)
      │     Launches: Chromium Browser 1
      │     Runs: auth.spec.ts (tests 1–5)
      │     Has: its own memory, its own auth token, its own DB connection
      │
      ├── Worker Process 2 (Node.js process)
      │     Launches: Chromium Browser 2
      │     Runs: masterSearch.spec.ts (tests 1–8)
      │     Has: completely separate memory from Worker 1
      │
      ├── Worker Process 3 (Node.js process)
      │     Launches: Chromium Browser 3
      │     Runs: customerDetails.spec.ts (tests 1–6)
      │
      └── Worker Process 4 (Node.js process)
            Launches: Chromium Browser 4
            Runs: apiTests.spec.ts (tests 1–12)
```

**Key facts:**
1. Each worker is a separate Node.js process. They share NO memory.
2. Each worker has its own browser instance.
3. By default, each TEST gets its own BrowserContext (isolated cookies/storage).
4. Module-level variables in a test file are shared only within a single worker.

### Process Isolation Internals — What "Separate Process" Actually Means

```
Main Playwright Process:
  - Reads config, discovers tests
  - Sends test assignments to workers via IPC (Inter-Process Communication)
  - Collects results via IPC (stdout JSON messages)
  - Does NOT share memory with workers

Worker Process (one per --workers N):
  - Completely separate V8 heap
  - Separate event loop
  - Separate Node.js module cache
  - Imports your test files fresh (no shared singleton state between workers)
  - Communicates with main process via IPC pipe only

If Worker 2 crashes:
  Main process detects it via IPC timeout/disconnect
  Marks tests assigned to Worker 2 as failed
  Other workers continue unaffected
```

This is fundamentally different from threads. In a thread model, all threads share the same heap — one thread's crash corrupts the whole process. In Playwright's process model, each worker is isolated.

```typescript
// This is why module-level variables are scoped to ONE worker:
// global.ts (imported by both Worker 1 and Worker 2)
let sharedCounter = 0;  // Worker 1 sees 0; Worker 2 ALSO sees 0 (separate process)

// Worker 1 increments: sharedCounter = 1
// Worker 2 increments: sharedCounter = 1  ← NOT 2! They're separate

// The only "shared" things between workers:
// - File system (both workers can read/write the same files)
// - Network (both workers call the same APIs)
// - Databases (both workers write to the same DB)
// → These are where data collisions actually happen
```

---

## 2. Default vs `fullyParallel` Mode

### Default Mode (File-Level Parallelism)

```typescript
// playwright.config.ts
export default defineConfig({
  workers: 4,
  // fullyParallel is NOT set (defaults to false)
});
```

Behaviour:
- Different **files** run in parallel (one file per worker at a time).
- Tests **within the same file** run SEQUENTIALLY.
- Test order within a file is preserved.

```
Worker 1: file_A: [test1 → test2 → test3]  ← sequential within file
Worker 2: file_B: [test1 → test2 → test3]  ← sequential within file
Worker 3: file_C: [test1 → test2]
Worker 4: file_D: [test1 → test2 → test3 → test4]
```

**Use when:** Tests within a file depend on each other (create user in test 1, use user in test 2). This is common in enterprise E2E suites.

### `fullyParallel: true` (Test-Level Parallelism)

```typescript
export default defineConfig({
  workers: 4,
  fullyParallel: true,
});
```

Behaviour:
- Every individual test can run on any worker at any time.
- No ordering guarantees within a file.
- Maximum speed — all 4 workers run 4 tests simultaneously.

```
Worker 1: file_A/test1, file_B/test3, file_C/test2, ...
Worker 2: file_A/test2, file_D/test1, file_B/test1, ...
Worker 3: file_B/test2, file_A/test3, ...
Worker 4: file_C/test1, file_D/test2, ...
```

**Use when:** Every test is completely independent (no shared mutable state, unique test data per test). This is the goal to work towards.

---

## 3. The Data Collision Problem

The most dangerous problem with parallel tests.

### Scenario — Two Workers, One User Record

```typescript
// ❌ WRONG — hardcoded test data
test('Create customer', async ({ request }) => {
  const response = await request.post('/api/customers', {
    data: { email: 'test@company.com', name: 'Test Customer' }
  });
  expect(response.status()).toBe(201);
});
```

Worker 1 runs this test and creates `test@company.com`.  
Worker 2 runs the same test simultaneously and also tries to create `test@company.com`.  
The API returns `409 Conflict` (email already exists).  
Worker 2's test fails.

The failure is random — sometimes Worker 1 finishes first (test passes), sometimes they collide. **This is the definition of a flaky test.**

### The Fix — Unique Data Per Test

```typescript
// ✅ CORRECT — unique identifier per test run
test('Create customer', async ({ request }) => {
  // Every run generates a unique email
  const uniqueEmail = `test-${Date.now()}@company.com`;
  // OR: const uniqueEmail = `test-${crypto.randomUUID()}@company.com`;

  const response = await request.post('/api/customers', {
    data: { email: uniqueEmail, name: 'Test Customer' }
  });
  expect(response.status()).toBe(201);
  
  const body = await response.json();
  const customerId = body.customerId;
  
  // Clean up after the test — delete the unique customer we created
  await request.delete(`/api/customers/${customerId}`);
});
```

### Unique Data Generation Strategies — Comparison Table

| Strategy | Example | Uniqueness | Readability | Risk |
|---|---|---|---|---|
| `Date.now()` | `test-1716893445123@co.com` | High (ms precision) | Poor | Collision if 2 tests start same ms |
| `randomUUID()` | `test-f47ac10b-58cc@co.com` | Guaranteed | Poor | None |
| `workerIndex + timestamp` | `w2-1716893445123@co.com` | High | Medium | None |
| `testId` hash | `test-a3f2b8c1@co.com` | Guaranteed | Good | None |
| `testTitle` slug | `test-create-citation@co.com` | Moderate | Best | Two tests with same title collide |
| Faker.js | `John.Smith.5521@acme.com` | High | Best | Extra dependency |

```typescript
// Strategy 1: Timestamp (simple)
const email = `test-${Date.now()}@company.com`;

// Strategy 2: randomUUID (guaranteed unique)
import { randomUUID } from 'crypto';
const email = `test-${randomUUID()}@company.com`;

// Strategy 3: workerIndex + timestamp (readable, no collision)
const workerId = test.info().workerIndex;  // 0, 1, 2, or 3
const email = `w${workerId}-${Date.now()}@company.com`;

// Strategy 4: testId (stable hash per test — useful for debugging)
const testId = test.info().testId;  // e.g. 'a3f2b8c1d4e5f6g7'
const email = `test-${testId.slice(0, 8)}@company.com`;

// Strategy 5: Faker.js (readable + unique)
import { faker } from '@faker-js/faker';
const email = faker.internet.email({ firstName: 'Test', provider: 'company.com' });
// → 'Test.Smith5521@company.com'

// Best practice for enterprise suites:
export function uniqueEmail(prefix = 'test'): string {
  return `${prefix}-w${test.info().workerIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@testenv.com`;
  // e.g. 'test-w2-1716893445123-8f2k@testenv.com'
}
```

---

## 4. Shared State Dangers — The Hidden Killer

### Module-Level Variables (Never Mutable)

```typescript
// ❌ WRONG — mutable module-level variable
let authToken: string; // shared within a worker across tests!

test('test A', async ({ request }) => {
  authToken = await getToken(request); // sets it
});

test('test B', async ({ request }) => {
  // If fullyParallel:true, test B might run BEFORE test A!
  // authToken is undefined!
  await request.get('/api/data', {
    headers: { Authorization: `Bearer ${authToken}` } // undefined → 401
  });
});

// ✅ CORRECT — use fixtures (previous chapter) or local variables per test
test('test B', async ({ request, account }) => {
  // account.accessToken comes from the fixture — always set, always valid
  await request.get('/api/data', {
    headers: { Authorization: `Bearer ${account.accessToken}` }
  });
});
```

### Reading Shared Files (Safe Patterns)

```typescript
// Reading a file is safe — multiple workers can read the same file simultaneously
import endpoints from '../data/endpoints'; // ✅ safe — read-only import

// Reading storageState file — safe
const context = await browser.newContext({
  storageState: 'fixtures/auth-state.json' // ✅ safe — workers only READ this
});

// Writing to a shared file — DANGEROUS in parallel
// ❌ Never write to a shared log file from multiple workers simultaneously
// ✅ Use testInfo.attach() to add files to the Playwright report instead
```

---

## 5. `test.describe.configure` — Controlling Parallelism Per Suite

You don't have to pick one mode globally. You can configure parallelism at the `describe` level:

```typescript
// Make THIS describe block run in parallel (even if global fullyParallel is false)
test.describe.configure({ mode: 'parallel' });

test.describe('Independent API tests', () => {
  test.describe.configure({ mode: 'parallel' }); // tests in here run in parallel

  test('GET citations API', async ({ request }) => { ... });
  test('GET customers API', async ({ request }) => { ... });
  test('POST create citation', async ({ request }) => { ... });
});
```

```typescript
// Make THIS describe block run sequentially (even if global fullyParallel is true)
test.describe('Order-dependent E2E flow', () => {
  test.describe.configure({ mode: 'serial' }); // ← forces sequential

  test('Step 1: Create customer', async ({ request }) => {
    // creates customer, somehow stores ID...
  });

  test('Step 2: Create order for customer', async ({ request }) => {
    // depends on customer created in Step 1
  });

  test('Step 3: Verify order in DB', async ({ }) => {
    // depends on Steps 1 and 2
  });
});
```

> [!WARNING]
> Using `mode: 'serial'` to manage test dependencies is a design smell. Tests that depend on each other are fragile — if Step 1 fails, Steps 2 and 3 are skipped, leaving you with no information about whether they would have passed. Better design: use fixtures and API calls to set up state independently per test.

---

## 6. `test.serial()` — The Escape Hatch

For tests that truly must run in order (rare but legitimate):

```typescript
test.describe.serial('Citation lifecycle — must run in order', () => {
  let createdCitationId: string;

  test('Create citation via API', async ({ request }) => {
    const response = await request.post('/api/citations', { data: { ... } });
    createdCitationId = (await response.json()).citationId;
    expect(createdCitationId).toBeDefined();
  });

  test('Verify citation appears in UI', async ({ page }) => {
    // Uses createdCitationId from previous test
    await page.fill('#citationSearch', createdCitationId);
    await page.click('#searchButton');
    await expect(page.locator('.result-row')).toBeVisible();
  });

  test('Delete citation and verify removal', async ({ request, page }) => {
    await request.delete(`/api/citations/${createdCitationId}`);
    await page.reload();
    await expect(page.locator('.result-row')).toHaveCount(0);
  });
});
```

When any test in a `test.describe.serial` block fails, all subsequent tests in that block are **skipped** (not run). This is intentional — if "Create" fails, there's nothing to verify or delete.

---

## 7. `--shard` — Running Across Multiple Machines

For very large test suites (500+ tests), you can split the work across multiple CI machines:

```bash
# Machine 1 (CI Job 1): Run the first quarter of all tests
npx playwright test --shard=1/4

# Machine 2 (CI Job 2): Run the second quarter
npx playwright test --shard=2/4

# Machine 3: Third quarter
npx playwright test --shard=3/4

# Machine 4: Fourth quarter
npx playwright test --shard=4/4
```

Each machine runs with its own set of workers. This is how large teams run 1000+ tests in under 10 minutes.

### Sharding in GitHub Actions — Full YAML

```yaml
# .github/workflows/playwright-sharded.yml

name: Playwright Tests (Sharded)

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  playwright-shard:
    name: Playwright Shard ${{ matrix.shardIndex }} of ${{ matrix.shardTotal }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false  # don't cancel other shards if one fails
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npx playwright install chromium --with-deps

      - name: Run Playwright tests (shard ${{ matrix.shardIndex }}/${{ matrix.shardTotal }})
        run: |
          npx playwright test \
            --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }} \
            --workers=2
        env:
          CRM_URL:        ${{ secrets.CRM_URL }}
          ADMIN_EMAIL:    ${{ secrets.ADMIN_EMAIL }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
          CI: true

      - name: Upload blob report for merge
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: blob-report-${{ matrix.shardIndex }}
          path: blob-report/
          retention-days: 1

  # Merge all shard reports into one HTML report
  merge-reports:
    needs: playwright-shard
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci

      - name: Download all blob reports
        uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true

      - name: Merge reports
        run: npx playwright merge-reports --reporter html ./all-blob-reports

      - name: Upload merged HTML report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

**The math with 4 shards × 2 workers each = 8 parallel test executors:**
```
500 tests × 30s average = 15,000s sequential
With 8 parallel executors: 15,000 / 8 ≈ 1,875s ≈ 31 minutes
With sharding overhead (setup/teardown per shard): ~35 minutes total
Vs sequential: 15,000s = 4.2 hours
Speedup: ~7x
```

---

## 8. Worker-Scoped Fixtures — The Performance Pattern

From Chapter 06, the `account` fixture is worker-scoped. Here is how that interacts with the worker model:

```
Worker 1 starts:
  account fixture setup (login) → runs ONCE
  Test 1 runs with account
  Test 2 runs with same account  ← no login overhead!
  Test 3 runs with same account
  ...
  Test N runs with same account
  account fixture teardown (logout) → runs ONCE
Worker 1 ends

Worker 2 starts:
  account fixture setup (login) → runs ONCE (separate from Worker 1's login)
  Test 1 runs ...
  ...
```

**The math:** 20 tests across 4 workers = 4 logins total (not 20 logins). If each login takes 3 seconds: 60 seconds saved for every test run.

### `workerIndex` in Worker-Scoped Fixtures

```typescript
// fixtures/account.fixture.ts
// The workerIndex lets each worker create a deterministically unique account
// Useful when you want reproducible accounts (not random UUIDs) for debugging

export const test = base.extend<{}, { account: TestAccount }>({{
  account: [
    async ({ browser }, use, workerInfo) => {
      // workerInfo.workerIndex: 0, 1, 2, ... (sequential per worker)
      // workerInfo.parallelIndex: same as workerIndex in Playwright
      const workerEmail = `worker-${workerInfo.workerIndex}@testenv.com`;

      // Try to use existing account (idempotent setup)
      let account: TestAccount;
      try {
        account = await usersClient.getByEmail(workerEmail);
      } catch {
        // Account doesn't exist — create it
        account = await usersClient.create({
          email: workerEmail,
          name:  `Test Worker ${workerInfo.workerIndex}`,
          role:  'TESTER',
        });
      }

      await use(account);

      // Don't delete worker accounts — reuse on next run (faster setup)
      // Instead: truncate test data created BY this account
      await citationsClient.bulkDelete({ createdBy: account.userId });
    },
    { scope: 'worker' }
  ],
}});
```

### `test.info()` — The Complete Reference

All properties available in a running test:

```typescript
test('demo test info', async ({}, testInfo) => {
  testInfo.title           // 'demo test info'
  testInfo.titlePath       // ['describe name', 'nested describe', 'demo test info']
  testInfo.file            // '/path/to/spec.ts'
  testInfo.line            // 3
  testInfo.column          // 1
  testInfo.testId          // 'a3f2b8c1...' (unique per test)
  testInfo.workerIndex     // 0-N (which worker process)
  testInfo.parallelIndex   // same as workerIndex
  testInfo.retry           // 0, 1, 2... (0 = first attempt)
  testInfo.repeatEachIndex // for --repeat-each flag
  testInfo.timeout         // timeout in ms from config
  testInfo.project.name    // 'admin-tests'
  testInfo.config.workers  // 4

  // Runtime state:
  testInfo.status          // 'passed' | 'failed' | 'timedOut' | 'skipped' (set after test)
  testInfo.error           // the error if status is 'failed'
  testInfo.duration        // ms (set after test)
  testInfo.startTime       // Date

  // Paths:
  testInfo.outputDir       // directory for this test's output files
  testInfo.snapshotDir     // directory for screenshots
  testInfo.snapshotSuffix  // platform + browser suffix for screenshots

  // Actions:
  await testInfo.attach('name', { body: 'content', contentType: 'text/plain' });
  testInfo.annotations.push({ type: 'issue', description: 'JIRA-1234' });
  testInfo.skip('reason');         // skip the test from within
  testInfo.fixme('known bug');     // mark as known failure
  testInfo.slow();                 // triple the timeout for this test

  // Useful pattern: add context to test titles for CI reports
  if (testInfo.retry > 0) {
    console.log(`[RETRY ${testInfo.retry}] ${testInfo.title}`);
  }
});
```

---

## 9. Playwright Config — The Full Parallelism Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test discovery
  testDir: './tests/specs',
  testMatch: '**/*.spec.ts',

  // Parallelism
  workers: process.env.CI ? 4 : 2,
  // In CI: use 4 workers (CI machines usually have more CPUs)
  // Locally: use 2 workers (don't max out your laptop)

  fullyParallel: false,
  // Keep false for enterprise E2E suites where files have dependencies
  // Set to true only when all tests are fully independent

  // Timeouts
  timeout: 60000,              // 60s per test
  expect: { timeout: 10000 },  // 10s for assertions to auto-retry

  // Retry on failure (useful for flaky D365 rendering)
  retries: process.env.CI ? 2 : 0,
  // In CI: retry twice (network glitches, D365 slowness)
  // Locally: no retries (you want to see failures immediately)

  // Reporter
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    // Base URL — all page.goto('/path') calls use this
    baseURL: process.env.CRM_URL,

    // Global headers for all requests
    extraHTTPHeaders: {
      'x-test-correlation-id': `playwright-${Date.now()}`,
    },

    // Tracing — saves a trace file on failure for debugging
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Project configurations for different apps/browsers
  projects: [
    { name: 'crm-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'legacy-firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
```

### Worker Count Tuning Guide

Choosing the right `workers` value prevents CI machines from running out of memory or CPU:

```
Rule of thumb: workers = min(CPUs, availableRAM_GB / 1.5)

Each Playwright worker needs approximately:
- 1 Chromium browser process: ~150MB RAM + 1 CPU core when active
- 1 Node.js worker process:   ~50-100MB RAM
- Per test overhead:           ~20-50MB for DOM, page state

Total per worker: ~300-500MB RAM

CI machine sizes and recommended workers:
  2 CPU / 4GB RAM:   workers: 2   (4GB / 500MB = 8, but CPU is the limit)
  4 CPU / 8GB RAM:   workers: 4
  8 CPU / 16GB RAM:  workers: 6   (leave headroom for OS + Node main process)
  16 CPU / 32GB RAM: workers: 10  (beyond 10, network/DB become the bottleneck)

For D365 (heavy app, loads ~50MB of JS per page):
  Lower your workers by 1-2 vs the formula above
  D365 is CPU-intensive (React reconciliation, Fluent UI rendering)

Signs you have too many workers:
  - Workers randomly crash (OOM killed)
  - Flakiness increases with more workers (resource contention)
  - CPU is pegged at 100% throughout the run (no headroom)

Signs you have too few workers:
  - CPU is 20-30% during the run (underutilized)
  - Adding a worker would reduce run time
```

---


## 🏋️ Practice Challenges

**Challenge 1 (Collision Detection):** Two workers both run this test simultaneously. What happens and why?
```typescript
test('search for test customer', async ({ page }) => {
  await page.fill('#emailSearch', 'automation-test@company.com');
  await page.click('#searchButton');
  await expect(page.locator('.customer-row')).toHaveCount(1);
});
```
<details><summary>Answer</summary>

This test only READS data (searches for an existing customer) — it doesn't create or delete anything. Two workers running this simultaneously are both just querying the same record. No collision. This test is safe to run in parallel as-is, ASSUMING the customer `automation-test@company.com` already exists as a stable fixture record and no other test deletes it. The risk is if another parallel test does DELETE this record.
</details>

**Challenge 2 (Data Design):** You need to test "Create → Verify → Delete" for a citation record. Design this as a SINGLE test (not 3 separate serial tests) using a fixture for setup/teardown. Why is the single-test approach better?
<details><summary>Answer</summary>

```typescript
// The fixture creates and cleans up:
citationRecord: async ({ request }, use) => {
  const response = await request.post('/api/citations', {
    data: { amount: 150.00, type: 'PARKING', vehicleId: `VH-${Date.now()}` }
  });
  const { citationId } = await response.json();
  
  await use(citationId); // test runs here
  
  await request.delete(`/api/citations/${citationId}`); // always runs
},

// The test:
test('Citation CRUD flow', async ({ page, citationRecord }) => {
  // citationRecord is the citationId, pre-created
  
  await test.step('Verify citation appears in UI', async () => {
    await page.fill('#citationSearch', citationRecord);
    await expect(page.locator('.result-row')).toBeVisible();
  });
  
  await test.step('Delete citation via UI', async () => {
    await page.click('#deleteButton');
    await expect(page.locator('.result-row')).toHaveCount(0);
  });
  // Fixture teardown: delete via API (safety net if UI delete failed)
});
```
Better than serial tests because: (1) If it fails, only one test shows as failed (not 3). (2) Teardown always runs even on failure. (3) The test can run in parallel with itself (different `citationId` each time). (4) No shared state between steps via module-level variables.
</details>

**Challenge 3 (Config):** Your suite has 200 tests. Locally, developers run it with 2 workers. In CI, it runs with 6 workers. Tests take ~30s average. With `fullyParallel: false`: estimate the local and CI run times. Would `fullyParallel: true` help if tests are independent?
<details><summary>Answer</summary>

With `fullyParallel: false` (file-level parallelism), the bottleneck is the largest file. If tests are evenly distributed across 20 files (10 tests each, 300s per file): Local (2 workers): ~10 files per worker × 300s = ~3000s = ~50 minutes. CI (6 workers): ~4 files per worker × 300s = ~1200s = ~20 minutes.

With `fullyParallel: true` (test-level): Local (2 workers): 100 tests per worker × 30s = ~3000s = ~50 minutes (same). CI (6 workers): ~34 tests per worker × 30s = ~1020s = ~17 minutes. The improvement with fullyParallel depends on how unevenly tests are distributed. If one file has 80 tests and others have 10, fullyParallel distributes more evenly. The real win is adding more workers, not just enabling fullyParallel.
</details>

---

**Challenge 4 [Spot the Leak]:** A worker-scoped fixture creates a test customer and stores the `customerId` in a module-level variable. After the fixture, 10 tests run. What is the risk and how do you fix it?

```typescript
// ❌ The problem:
let workerCustomerId: string;  // module level

export const test = base.extend<{}, { account: Account }>({{
  account: [
    async ({ request }, use) => {
      const customer = await request.post('/api/customers', { data: { name: 'Test' } });
      workerCustomerId = (await customer.json()).customerId;  // stored in module
      await use({ customerId: workerCustomerId });
    },
    { scope: 'worker' }
  ],
}});

// In test files:
import { workerCustomerId } from '../../fixtures';  // someone imports this!
test('check customer', async ({ page }) => {
  await page.goto(`/customers/${workerCustomerId}`);  // might be undefined!
});
```

<details><summary>Answer</summary>

**Risk**: `workerCustomerId` is undefined until the first test that uses the `account` fixture runs. If a test that DOESN'T use the `account` fixture imports and uses `workerCustomerId`, it gets `undefined`. Even worse, if `fullyParallel: true`, there's no guarantee the fixture runs before the test that reads the variable.

**Root cause**: Exposing fixture state via module-level exports breaks the fixture isolation contract. Fixture state should only be accessible through the fixture parameter.

**Fix**: Never export fixture state via module-level variables. The customerId must flow THROUGH the fixture:
```typescript
// ✅ State flows through the fixture parameter only
test('check customer', async ({ account }) => {
  // account.customerId is always set because the fixture ran before this test
  await page.goto(`/customers/${account.customerId}`);
});
// Nothing is exported. The customerId is only accessible inside tests that declare `account`.
```
</details>

---

**Challenge 5 [Design]:** Your team wants to run visual regression tests and functional tests in parallel but keep visual tests on a separate CI machine (to avoid resource contention). How do you structure `playwright.config.ts` and the GitHub Actions YAML to achieve this?

<details><summary>Answer</summary>

```typescript
// playwright.config.ts — separate projects
projects: [
  {
    name: 'functional',
    testMatch: ['**/*.spec.ts'],
    testIgnore: ['**/*.visual.spec.ts'],
    workers: 4,
  },
  {
    name: 'visual',
    testMatch: ['**/*.visual.spec.ts'],
    workers: 2,  // visual tests are heavier — fewer workers
    use: {
      viewport: { width: 1920, height: 1080 },
    },
  },
],
```

```yaml
# GitHub Actions — separate jobs
jobs:
  functional:
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test --project=functional

  visual:
    runs-on: ubuntu-latest
    needs: []  # runs in parallel with functional
    steps:
      - run: npx playwright test --project=visual
```

Both jobs run simultaneously on separate machines. Functional tests don't compete with visual tests for CPU/memory.
</details>

---

## 10. Test Tagging — Selective Parallel Execution by Tier

Large suites use tags to run different test tiers at different speeds:

```typescript
// Tag tests at definition time using @tag notation in the title,
// or using test.info().annotations:

// playwright.config.ts — filter by tag using grep
export default defineConfig({
  projects: [
    {
      name: 'smoke',
      grep: /@smoke/,         // only runs tests tagged @smoke
      retries: 0,             // smoke tests must pass first time
      workers: 2,
    },
    {
      name: 'regression',
      grepInvert: /@smoke/,   // everything EXCEPT smoke tests
      retries: 2,
      workers: 4,
    },
  ],
});
```

```typescript
// In test files — add @smoke tag to critical path tests:
test('@smoke search by transit account', async ({ masterSearchPage }) => {
  // This test runs in BOTH the smoke project and regression project
  // unless you use grepInvert in regression
});

test('advanced filter by date range', async ({ masterSearchPage }) => {
  // No @smoke tag — only runs in regression project
});

// CLI: run only smoke tests:
// npx playwright test --project=smoke
// npx playwright test --grep "@smoke"
// npx playwright test --grep-invert "@smoke"  ← run everything except smoke

// GitHub Actions — run smoke on every PR, regression only on merge to main:
// smoke job:      trigger: pull_request → npx playwright test --project=smoke
// regression job: trigger: push to main  → npx playwright test --project=regression
```

```typescript
// Annotation-based tagging (richer metadata):
test('D365 customer search', async ({ page }, testInfo) => {
  testInfo.annotations.push(
    { type: 'owner',    description: 'team-crm' },
    { type: 'jira',     description: 'CRM-1234' },
    { type: 'severity', description: 'critical' },
  );
  // These annotations appear in the HTML report and can be queried
});
```

---

**Challenge 6 [Tag Strategy]:** Your enterprise suite has 300 tests. You need to run 30 "smoke" tests on every PR (must complete in < 5 minutes) and all 300 as a nightly regression. Design the playwright.config.ts and a 2-job GitHub Actions workflow.

<details><summary>Answer</summary>

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

const isCI   = !!process.env.CI;
const isNight = !!process.env.NIGHTLY;

export default defineConfig({
  testDir: './tests/specs',
  retries: isCI ? 1 : 0,

  projects: [
    {
      name: 'smoke',
      grep: /@smoke/,
      workers: 4,
      timeout: 30_000,
    },
    {
      name: 'full-regression',
      workers: 6,
      timeout: 60_000,
      retries: 2,
    },
  ],
});
```

```yaml
# .github/workflows/playwright.yml
name: Playwright CI

on:
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'   # nightly at 02:00 UTC

jobs:
  smoke:
    name: Smoke Tests (PR gate)
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install chromium --with-deps
      - run: npx playwright test --project=smoke
        env:
          CI: true
          CRM_URL: ${{ secrets.CRM_URL }}

  regression:
    name: Full Regression (Nightly)
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --project=full-regression --shard=1/2
        env:
          NIGHTLY: true
          CI: true
          CRM_URL: ${{ secrets.CRM_URL }}
      # Add a second parallel job for shard 2/2 for even faster nightly
```

**Key decisions:**
- Smoke uses `grep: /@smoke/` to match exactly 30 tagged tests
- PR gate targets < 5 min: 30 tests × ~7s average × 4 workers ≈ 52s
- Nightly regression uses 6 workers + sharding for speed
- Separate `if:` conditions ensure smoke only runs on PRs, regression only on schedule
</details>

---

## 📚 References & Further Reading

### Official Documentation — Playwright
- [Parallelism and Sharding](https://playwright.dev/docs/test-parallel) — Official documentation on worker processes, `fullyParallel`, and serial mode
- [Sharding Tests](https://playwright.dev/docs/test-sharding) — How to distribute test execution across multiple CI machines
- [Annotations and Tags](https://playwright.dev/docs/test-annotations) — How to tag tests, conditionally skip tests, and attach metadata
- [GitHub Actions Integration](https://playwright.dev/docs/ci-github) — Standard workflows, including how to merge sharded blob reports

### Deep Dives
- [Node.js Event Loop, Timers, and process.nextTick()](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick) — How the single-threaded event loop powers multiple asynchronous Playwright actions within a single worker
- [Playwright's "Merge Reports" Feature](https://playwright.dev/docs/test-sharding#merge-reports-cli) — How to combine multiple `blob` reports from sharded runs into a single HTML report

---

**Navigation**: [← Chapter 08: Browser Internals](./08_Browser_Internals_for_SDETs.md) | [Index](../00_INDEX.md) | [→ Chapter 10: Dynamics 365 CRM Testing](../03_D365_And_Patterns/10_Dynamics365_CRM_Testing.md)

