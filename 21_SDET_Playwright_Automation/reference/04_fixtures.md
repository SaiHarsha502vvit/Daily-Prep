# Fixtures

> The authoritative reference for Playwright's dependency injection system. Every scope rule, every lifecycle phase, every override mechanism, every pattern for managing shared state across tests, every production failure mode.

---

## Table of contents

1. [What fixtures actually are](#1-what-fixtures-actually-are)
2. [The complete fixture lifecycle](#2-the-complete-fixture-lifecycle)
3. [`test.extend()` — the API surface](#3-testextend--the-api-surface)
4. [Test scope vs worker scope](#4-test-scope-vs-worker-scope)
5. [Scope dependency rules](#5-scope-dependency-rules)
6. [The `use()` yield pattern](#6-the-use-yield-pattern)
7. [Teardown semantics](#7-teardown-semantics)
8. [Built-in fixtures](#8-built-in-fixtures)
9. [Composing fixtures](#9-composing-fixtures)
10. [The options pattern — `{ option: true }`](#10-the-options-pattern)
11. [`test.use({})` — per-file/describe overrides](#11-testuse--per-filedescribe-overrides)
12. [Auto fixtures — `{ auto: true }`](#12-auto-fixtures)
13. [Overriding built-in fixtures](#13-overriding-built-in-fixtures)
14. [Page fixture pattern](#14-page-fixture-pattern)
15. [Account pool — file-locked, parallel-safe](#15-account-pool)
16. [API client fixtures](#16-api-client-fixtures)
17. [Performance — fixture timing](#17-performance)
18. [Error handling in fixtures](#18-error-handling)
19. [Common production failures](#19-common-production-failures)
20. [Comparison with other DI systems](#20-comparison-with-other-di-systems)
21. [Anti-pattern catalog](#21-anti-pattern-catalog)

---

## 1. What fixtures actually are

A fixture is a managed dependency. Playwright creates it, injects it into your test, and cleans it up after the test finishes.

You've been using built-in fixtures since day one:

```typescript
test('example', async ({ page, request, browser, context }) => {
  //                     ↑     ↑       ↑        ↑
  //                     All built-in fixtures.
  //                     You never wrote "const page = await browser.newPage()".
  //                     Playwright created them, injected them, will dispose them.
});
```

### 1.1 The mental model

```
Your test signature says: "I need { page, account, citationsClient }."
Playwright's fixture resolver: "I know how to make each of those."
For each fixture, resolve its dependencies first (DFS).
Set them all up, in dependency order.
Inject into the test.
Run the test.
Tear them all down, in reverse dependency order.
```

This is classical dependency injection — the same idea as Angular's `@Injectable`, NestJS providers, pytest fixtures, Spring beans, etc. Playwright's implementation is more lightweight because tests don't need full module systems.

### 1.2 The problem fixtures solve

Without fixtures, every test duplicates setup:

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', process.env.TEST_USER!);
  await page.fill('#password', process.env.TEST_PASSWORD!);
  await page.click('#loginButton');
  await page.waitForURL('**/dashboard');
});
```

If 30 test files need this:
- 30 copies of the same code.
- If login changes, 30 files to update.
- If login becomes slow, 30 places to optimise.
- If login becomes flaky, 30 places to add retries.

With a fixture:

```typescript
test('my test', async ({ authenticatedPage }) => {
  // already logged in — fixture handled it
});
```

One definition, used everywhere.

### 1.3 What fixtures CAN do

| Capability | Example |
|---|---|
| Construct an object before the test | `new MasterSearchPage(page)` |
| Make an HTTP call to set up state | `await api.createUser()` |
| Open a database connection | `await db.connect()` |
| Generate test data | `const customer = faker.customer()` |
| Authenticate (fetch a token) | `const token = await getOAuthToken()` |
| Lock a shared resource | `await lockfile.lock('accounts.lock')` |
| Set environment variables | `process.env.RUN_ID = '...'` |
| Inject into the test | `await use(theThing)` |
| Tear down after the test | `await db.disconnect()` |
| Fail the test if setup fails | `throw new Error(...)` |
| Skip the test conditionally | `test.skip(condition, 'reason')` |

### 1.4 What fixtures CANNOT do

| Limitation | Why |
|---|---|
| Run before `test.describe()` | describe runs at file-evaluation time, before fixtures resolve |
| Share state between workers | Each worker is a separate process |
| Modify the test object after `test.extend` | Once extended, the test object is immutable |
| Be created inside a test body | Fixtures are statically declared in the test signature |
| Have circular dependencies | Cycle detection throws at config load |
| Be conditionally injected | Either you depend on it or you don't (use options to vary behavior) |

---

## 2. The complete fixture lifecycle

### 2.1 The phases

For a single test running in a worker:

```
Phase 1 — Worker startup (once per worker):
  1. Worker process forks.
  2. Config file re-loaded.
  3. Worker-scoped fixtures set up, in dependency order.
     Each fixture: setup → use() → (held — used by multiple tests)
  4. Worker is ready.

Phase 2 — Per-test:
  5. test.beforeAll hooks fire (for describe blocks).
  6. Test-scoped fixtures set up, in dependency order.
     Each fixture: setup → use() → (held for this test)
  7. test.beforeEach hooks fire.
  8. Test body runs.
  9. test.afterEach hooks fire.
  10. Test-scoped fixtures tear down, in REVERSE order.
      Each fixture: continuation after use() → cleanup.
  11. test.afterAll hooks fire (after last test in describe).

Phase 3 — Worker shutdown:
  12. Worker-scoped fixtures tear down, in reverse order.
  13. Worker process exits.
```

### 2.2 Dependency order vs declaration order

Fixtures set up in DEPENDENCY order, not declaration order:

```typescript
export const test = base.extend({
  c: async ({ b }, use) => { /* depends on b */ await use(makeC()); },
  a: async ({}, use)  => { /* no deps */     await use(makeA()); },
  b: async ({ a }, use) => { /* depends on a */ await use(makeB()); },
});

test('example', async ({ c }) => { /* ... */ });

// Resolution:
//   c depends on b.
//   b depends on a.
//   a has no deps.
//
// Setup order: a → b → c.
// Teardown order: c → b → a.
```

### 2.3 What runs synchronously vs asynchronously

| Phase | Mode |
|---|---|
| Config file load | Sync top-level + async dynamic imports |
| Fixture function calls | Async — fixtures are `async` functions |
| `await use()` boundary | Async — this is the test body |
| Teardown after `use()` | Async — fixtures continue |
| Cross-fixture handoff (a's value to b) | Resolved before b's setup runs |

### 2.4 The hooks vs fixtures decision

Both `beforeEach` and a setup fixture run before the test. Which to use?

| Use beforeEach when | Use a fixture when |
|---|---|
| Setup is one-line (`await page.goto('/login')`) | Setup is non-trivial |
| Only one test file needs it | Multiple files need the same setup |
| You want explicit control over order | You want injected ergonomics (`async ({ x }) => ...`) |
| Setup doesn't produce a value | Setup produces an object the test uses |
| Cleanup is paired with setup tightly | Cleanup runs even on test failure (fixtures guarantee this) |

Hooks and fixtures coexist — the same test can use both.

### 2.5 The test object identity

```typescript
import { test as base } from '@playwright/test';

const testA = base.extend({ a: ... });
const testB = testA.extend({ b: ... });

testA('a test', async ({ a }) => { /* ok */ });
testB('b test', async ({ a, b }) => { /* ok — b inherits a */ });
testA('mix?', async ({ a, b }) => { /* TS error — testA doesn't know about b */ });
```

Each `extend` returns a NEW test object that includes its parent's fixtures. The parent is unmodified. Spec files import the test object that has the fixtures they need.

---

## 3. `test.extend()` — the API surface

```typescript
const test = base.extend<TestFixtures, WorkerFixtures>({
  fixtureA: async ({}, use) => { /* test-scoped */ },
  fixtureB: [async ({}, use) => { /* test-scoped */ }, { auto: true }],
  fixtureC: [async ({}, use) => { /* worker-scoped */ }, { scope: 'worker' }],
  fixtureD: [defaultValue, { option: true }],
});
```

### 3.1 The generic parameters

`base.extend<TestFixtures, WorkerFixtures>(...)` accepts two generic types:

| Parameter | Purpose |
|---|---|
| `TestFixtures` | Type shape of all test-scoped fixtures |
| `WorkerFixtures` | Type shape of all worker-scoped fixtures |

```typescript
interface MyTestFixtures {
  citationsClient: CitationsApiClient;
  testCitation: CitationResponse;
}

interface MyWorkerFixtures {
  authToken: string;
}

const test = base.extend<MyTestFixtures, MyWorkerFixtures>({
  citationsClient: async ({ request }, use) => { /* ... */ },
  testCitation:    async ({ citationsClient }, use) => { /* ... */ },
  authToken:       [async ({}, use) => { /* ... */ }, { scope: 'worker' }],
});
```

If you omit `WorkerFixtures`, all fixtures are inferred as test-scoped:

```typescript
const test = base.extend<MyTestFixtures>({ /* ... */ });
// Cannot add worker-scoped fixtures here — TS will reject them.
```

### 3.2 The fixture definition shape

Each fixture is one of:

```typescript
// 1. Plain function — test-scoped, no options
fixtureName: async ({ dep1, dep2 }, use) => {
  await use(value);
},

// 2. Tuple — function + options
fixtureName: [
  async ({ dep1, dep2 }, use) => { await use(value); },
  { scope: 'worker' | 'test', auto: boolean, option: boolean, timeout: number },
],

// 3. Option value with default
fixtureName: [defaultValue, { option: true }],
```

### 3.3 The fixture function signature

```typescript
async (deps, use, testInfo) => {
  // deps: object of dependencies (Playwright provides these)
  // use: function to inject the value into the test
  // testInfo: object with test metadata (only for test-scoped fixtures)
}
```

`testInfo` parameter:

```typescript
async ({ page }, use, testInfo) => {
  console.log(testInfo.title);          // test name
  console.log(testInfo.file);           // spec file path
  console.log(testInfo.project.name);   // project running this test
  console.log(testInfo.retry);          // retry attempt number (0 = first attempt)
  console.log(testInfo.workerIndex);    // 0-indexed worker ID
  console.log(testInfo.outputDir);      // where artifacts go for THIS test

  await use(somethingNew);

  if (testInfo.status === 'failed') {
    // post-failure cleanup
  }
},
```

Worker-scoped fixtures get `workerInfo` instead (no test-specific data):

```typescript
async ({}, use, workerInfo) => {
  console.log(workerInfo.workerIndex);
  console.log(workerInfo.project.name);
  await use(...);
},
```

---

## 4. Test scope vs worker scope

| Aspect | Test scope (default) | Worker scope |
|---|---|---|
| Lifetime | One per test | One per worker process |
| Setup cost | Paid per test | Paid once per worker |
| Teardown timing | After each test | When the worker shuts down |
| State sharing | Isolated per test | Shared across all tests in a worker |
| Failure isolation | Fixture failure → that test fails | Fixture failure → ALL tests in that worker fail |
| Suitable for | Mutable state, data that tests modify | Read-only data, shared connections, auth tokens |
| Example | `page`, `request`, page object, test data | Auth token, DB connection pool, file-locked account |
| Syntax | Plain function | Tuple with `{ scope: 'worker' }` |

### 4.1 The cost calculation

A test-scoped fixture pays setup + teardown for EVERY test. With a 3s setup cost and 40 tests:

| Scope | Setup calls | Setup cost |
|---|---|---|
| Test scope | 40 | 40 × 3s = 120s |
| Worker scope, 4 workers | 4 | 4 × 3s = 12s |

A 10× reduction. For an OAuth token fetch (often 1–3s), worker scope is essential.

### 4.2 The contention calculation

For a file-locked account pool with 100 tests, 4 workers, and N accounts:

| Account pool size | Worker scope | Test scope |
|---|---|---|
| 4 accounts | Each worker holds one for the whole run — works | Each test claims one; with 100 tests, accounts cycle 25 times per worker → contention |
| 1 account | Workers block on the single lock | Tests block on the single lock |

Worker scope effectively partitions accounts across workers.

### 4.3 The teardown timing trap

Worker-scoped teardown runs at the END of the worker — not after the test that "used" the fixture.

```typescript
// ❌ Wrong intuition
{
  scope: 'worker',
  async fixture({}, use) {
    const txn = await db.beginTransaction();
    await use(txn);
    await txn.rollback();   // rollback runs ONCE at worker shutdown
  }
}
// Tests see the same txn across the whole worker, with all changes accumulated.
// Test 1 inserts a row. Test 2 reads the row (still in the same txn).
// This breaks test isolation.
```

For per-test transactions, the fixture MUST be test-scoped.

### 4.4 The worker fixture re-evaluation risk

Worker-scoped fixtures only run once. If you change the fixture during a debugging session and restart with `--workers=1`, the fixture runs once with the new code. Good.

If you change the fixture between two test runs in the SAME worker (during interactive UI mode), the fixture doesn't re-run. UI mode reloads test files but worker fixtures from the previous run are still cached. To force re-run, restart UI mode.

---

## 5. Scope dependency rules

The most subtle rule, and the source of cryptic errors:

| Worker fixture can depend on | Worker scope ✅ | Test scope ❌ |
|---|---|---|
| Test fixture can depend on | Worker scope ✅ | Test scope ✅ |

### 5.1 The error message

```typescript
const test = base.extend<{ user: User }, { db: Database }>({
  db: async ({}, use) => {
    // test-scoped (default)
    const db = await connect();
    await use(db);
    await db.disconnect();
  },
  user: [async ({ db }, use) => {
    // worker-scoped — depends on test-scoped db
    const u = await db.createUser({ name: 'TestUser' });
    await use(u);
    await db.deleteUser(u.id);
  }, { scope: 'worker' }],
});
```

Throws at runtime when the first test resolves:

```
Error: Fixture "user" has worker scope, but depends on a test-scoped fixture "db".
Worker scoped fixtures can only depend on other worker-scoped fixtures.
```

### 5.2 Why this rule exists

Worker fixtures set up at worker startup, BEFORE any test runs. Test fixtures set up per-test. If a worker fixture needs a test fixture, Playwright would need to create a test fixture outside of any test context — meaningless, since the test fixture's identity depends on which test asked for it.

### 5.3 The two valid fixes

**Fix A — promote db to worker scope:**

```typescript
db: [async ({}, use) => {
  const db = await connect();
  await use(db);
  await db.disconnect();
}, { scope: 'worker' }],

user: [async ({ db }, use) => { /* ... */ }, { scope: 'worker' }],
```

Use when: the db connection is safe to reuse across tests (almost all connection pools are).

**Fix B — demote user to test scope:**

```typescript
db: async ({}, use) => { /* test-scoped */ },
user: async ({ db }, use) => { /* test-scoped — depends on test-scoped db */ },
```

Use when: each test needs a fresh user (or tests modify the user).

### 5.4 Built-in fixtures and their scopes

For reference when planning your own fixture dependencies:

| Built-in | Scope |
|---|---|
| `browser` | Worker |
| `browserName` | Worker |
| `playwright` | Worker |
| `context` | Test |
| `page` | Test |
| `request` | Test |

So a worker-scoped fixture CAN depend on `browser` but NOT on `page`. This matters when, for example, you want a worker-scoped pre-authenticated context. The trick is to create a new context in the worker fixture rather than depending on the test-scoped `context`:

```typescript
authenticatedContext: [async ({ browser }, use) => {
  const ctx = await browser.newContext({ storageState: 'auth.json' });
  await use(ctx);
  await ctx.close();
}, { scope: 'worker' }],
```

---

## 6. The `use()` yield pattern

```typescript
myFixture: async ({ dep }, use) => {
  // ── SETUP ── runs before each test (or worker) ─────────────────────
  const resource = await create(dep);

  // ── INJECT + YIELD ── give it to the test, wait for test to finish ──
  await use(resource);

  // ── TEARDOWN ── runs after the test, EVEN IF THE TEST FAILED ───────
  await destroy(resource);
},
```

### 6.1 Why `use` is a function, not `yield`

JavaScript has generator syntax (`yield`), but Playwright chose `use` to:
- Stay in async/await world (no generators).
- Make the injection point explicit.
- Allow zero-yield fixtures: a fixture that throws before calling `use()` fails setup; a fixture that calls `use(undefined)` injects undefined.

### 6.2 What happens AT `use()`

When you `await use(value)`:

1. The current fixture function's coroutine PAUSES.
2. The value is passed to the test runner.
3. The test runner waits for ALL needed fixtures (potentially many) to reach their `use()` call.
4. The test body executes.
5. When the test body returns (or throws), the test runner resumes each fixture's coroutine, which runs its teardown.
6. Teardown runs in REVERSE order of setup completion.

### 6.3 What "around" the test looks like

```typescript
fixtureA: async ({}, use) => {
  console.log('A setup');
  await use('A');
  console.log('A teardown');
},
fixtureB: async ({ fixtureA }, use) => {
  console.log('B setup');
  await use('B');
  console.log('B teardown');
},
fixtureC: async ({ fixtureB }, use) => {
  console.log('C setup');
  await use('C');
  console.log('C teardown');
},

test('demo', async ({ fixtureC }) => {
  console.log('TEST BODY');
});
```

Output:
```
A setup
B setup
C setup
TEST BODY
C teardown
B teardown
A teardown
```

Setup is DFS-ordered (top-down through deps). Teardown is reverse (bottom-up).

### 6.4 Multiple yields are not supported

```typescript
// ❌ Will throw "Fixture has already been used"
myFixture: async ({}, use) => {
  await use('first');
  await use('second');   // error
},
```

Each fixture yields exactly once. The fixture lifecycle assumes "one setup, one yield, one teardown."

### 6.5 Skipping `use()` is a fixture error

```typescript
// ❌ Will hang the test until timeout, then fail
myFixture: async ({}, use) => {
  const x = await create();
  if (!x) return;    // skipped use() — test never gets the value
  await use(x);
},
```

Always call `use()` exactly once. If you can't construct the value, throw — don't return early.

---

## 7. Teardown semantics

### 7.1 Teardown runs after `use()` returns

```typescript
myFixture: async ({}, use) => {
  const resource = await create();
  try {
    await use(resource);
  } finally {
    await destroy(resource);   // GUARANTEED to run, even if test threw
  }
},
```

Equivalent more compactly (Playwright wraps `use()` internally):

```typescript
myFixture: async ({}, use) => {
  const resource = await create();
  await use(resource);
  await destroy(resource);     // ALSO guaranteed — Playwright catches the exception
},
```

Either form works. The `try/finally` makes intent explicit.

### 7.2 What happens if teardown throws

If teardown throws, the test result depends on what happened in the test body:

| Test body | Teardown | Final test result |
|---|---|---|
| Passed | Passed | Passed |
| Passed | Threw | **Failed** — with teardown error |
| Failed | Passed | Failed (original error) |
| Failed | Threw | Failed (test error wins; teardown error logged) |

A teardown that throws on a passing test is a fixture bug. Always wrap teardown that might fail (network calls, cleanup APIs) in try/catch IF the failure shouldn't mask a real test failure:

```typescript
myFixture: async ({}, use) => {
  const resource = await create();
  await use(resource);
  try {
    await destroy(resource);
  } catch (e) {
    console.warn(`[fixture] cleanup failed: ${e}`);
    // Don't rethrow — let the test pass even if cleanup leaked.
  }
},
```

### 7.3 Teardown ordering across fixtures

Fixtures tear down in REVERSE dependency order. If A is setup before B, B tears down before A:

```
Setup:    A → B → C → use() → TEST → continuation
Teardown: C → B → A
```

This matches "release in reverse order of acquisition" — a fundamental resource management principle.

### 7.4 Teardown on worker shutdown

Worker-scoped fixtures run their teardown when the worker process is about to exit. If the worker is killed (SIGKILL, OOM), teardown does NOT run.

For critical cleanup (e.g., DB rows that must not leak), use both:
- Fixture teardown for the normal case.
- A nightly cleanup job for the abnormal case (search for `testFlag=true` records older than 24h).

### 7.5 `testInfo.status` and conditional teardown

```typescript
myFixture: async ({}, use, testInfo) => {
  const resource = await create();
  await use(resource);

  // Test has finished. Status is set.
  if (testInfo.status === 'failed') {
    await captureStateForDebugging(resource);
  }
  await destroy(resource);
},
```

`testInfo.status` is `'passed' | 'failed' | 'timedOut' | 'interrupted' | 'skipped'`.

---

## 8. Built-in fixtures

Playwright ships these out of the box. Know what's available before extending.

### 8.1 Test-scoped built-ins

| Fixture | Type | What it is |
|---|---|---|
| `page` | `Page` | The default page in a fresh context |
| `context` | `BrowserContext` | The browser context (cookies, storage, etc.) |
| `request` | `APIRequestContext` | HTTP request context, shares cookies with browser |
| `browser` | `Browser` | The shared browser instance for the worker (yes — accessible from test scope) |
| `browserName` | `'chromium' \| 'firefox' \| 'webkit'` | Which browser type is running |
| `playwright` | `Playwright` | The Playwright API (advanced — for creating browsers) |

### 8.2 Worker-scoped built-ins

Same as test-scoped above for `browser`, `browserName`, `playwright` — these are inherently worker-scoped under the hood. They appear as both because Playwright auto-resolves them through the worker→test scope chain.

### 8.3 Option fixtures (built-in)

Set via `test.use({})` at file/describe level:

| Option | Default | What it does |
|---|---|---|
| `viewport` | from project | Set the viewport for this scope |
| `geolocation` | from project | Set geolocation |
| `locale` | from project | Set locale (Accept-Language, Date format) |
| `timezoneId` | from project | Set timezone |
| `colorScheme` | from project | 'light' / 'dark' / 'no-preference' |
| `permissions` | from project | Granted permissions |
| `extraHTTPHeaders` | from project | Headers on all requests |
| `httpCredentials` | from project | HTTP Basic Auth |
| `storageState` | from project | Pre-authenticated state file |
| `userAgent` | from project | Browser user agent |
| `baseURL` | from project | URL prefix for navigations |

Example:

```typescript
test.describe('Italian locale tests', () => {
  test.use({ locale: 'it-IT', timezoneId: 'Europe/Rome' });
  test('date renders in Italian', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.today')).toContainText('mercoledì');
  });
});
```

### 8.4 Customising the `page` fixture per-project

`page` is just a fixture. You can override it for specific projects via the `use` block:

```typescript
// playwright.config.ts
{
  name: 'mobile-chrome',
  use: { ...devices['Pixel 7'] },   // overrides multiple page-related options at once
}
```

---

## 9. Composing fixtures

Fixtures depend on other fixtures via the destructured first argument.

### 9.1 Single dependency

```typescript
citationsClient: async ({ request }, use) => {
  const client = new CitationsApiClient(request);
  await use(client);
},
```

`citationsClient` depends on `request`. Playwright resolves `request` first, then constructs `citationsClient`.

### 9.2 Multi-dependency

```typescript
testCitation: async ({ citationsClient, account }, use) => {
  const citation = await citationsClient.create({
    customerId: account.userId,
    status: 'PENDING',
  });
  await use(citation);
  await citationsClient.delete(citation.id);
},
```

Both `citationsClient` and `account` resolve first.

### 9.3 Deep chains

```typescript
A: async ({}, use) => use('A'),
B: async ({ A }, use) => use(`B(${A})`),
C: async ({ B }, use) => use(`C(${B})`),
D: async ({ C }, use) => use(`D(${C})`),
test('chain', async ({ D }) => {
  expect(D).toBe('D(C(B(A)))');
});
```

Playwright topologically sorts the dep graph. Each fixture sets up exactly once per test.

### 9.4 Same fixture, multiple consumers — resolved once

```typescript
A: async ({}, use) => { console.log('A setup'); await use({ value: Math.random() }); },
B: async ({ A }, use) => { console.log('B uses A.value', A.value); await use('B'); },
C: async ({ A }, use) => { console.log('C uses A.value', A.value); await use('C'); },
test('shared', async ({ B, C, A }) => {
  // A is constructed ONCE. B and C see the same A.
});
```

Output (one run):
```
A setup
B uses A.value 0.4239...
C uses A.value 0.4239...     ← same value
```

Within a single test, each fixture resolves exactly once.

### 9.5 Conditional logic in fixtures

You can branch on options or environment:

```typescript
api: async ({ baseURL }, use) => {
  const client = process.env.MOCK_API
    ? new MockedApiClient()
    : new RealApiClient(baseURL);
  await use(client);
},
```

This is sometimes preferable to feature flags inside tests — keeps test bodies clean.

---

## 10. The options pattern

`{ option: true }` declares a CONFIGURATION VALUE, not a setup function. Tests can override it per-file or per-describe.

### 10.1 Declaring an option

```typescript
interface MyFixtures {
  accountRole: 'standard' | 'admin' | 'read-only';   // the option
  testAccount: TestAccount;                           // the actual fixture
}

const test = base.extend<MyFixtures>({
  // Option with a default value
  accountRole: ['standard', { option: true }],

  // Setup fixture that reads the option
  testAccount: async ({ accountRole }, use) => {
    const account = await createUser(accountRole);
    await use(account);
    await deleteUser(account.id);
  },
});
```

### 10.2 Consuming the option in tests

Default value applies if nothing overrides:

```typescript
test('default role', async ({ testAccount }) => {
  expect(testAccount.role).toBe('standard');
});
```

Override for one describe block:

```typescript
test.describe('admin tests', () => {
  test.use({ accountRole: 'admin' });   // applies to every test below

  test('admin sees all records', async ({ testAccount }) => {
    expect(testAccount.role).toBe('admin');
  });

  test('admin can delete', async ({ testAccount }) => {
    expect(testAccount.role).toBe('admin');
  });
});
```

Override for one test:

```typescript
test.use({ accountRole: 'read-only' });

test('read-only user cannot edit', async ({ testAccount }) => {
  expect(testAccount.role).toBe('read-only');
});
```

### 10.3 Options vs fixtures — the difference

| | Fixture | Option |
|---|---|---|
| Default declared as | Function | Plain value |
| Has setup/teardown | Yes | No |
| Overridable per test | No | Yes |
| Used by other fixtures | Yes | Yes (as a dependency) |
| Default is a function | OK | The function itself becomes the default value |

### 10.4 Multi-option compositions

```typescript
interface ExtendedFixtures {
  accountRole: 'standard' | 'admin';
  accountRegion: 'US' | 'EU' | 'APAC';
  testAccount: TestAccount;
}

const test = base.extend<ExtendedFixtures>({
  accountRole:   ['standard',  { option: true }],
  accountRegion: ['US',        { option: true }],

  testAccount: async ({ accountRole, accountRegion }, use) => {
    const account = await createRegionalUser(accountRole, accountRegion);
    await use(account);
    await deleteUser(account.id);
  },
});

test.describe('EU admin smoke', () => {
  test.use({ accountRole: 'admin', accountRegion: 'EU' });
  test('EU admin sees EU orders', async ({ testAccount }) => { /* ... */ });
});
```

Both options can be overridden independently or together.

### 10.5 Project-level option defaults

In `playwright.config.ts`:

```typescript
projects: [
  {
    name: 'us-tests',
    use: { accountRegion: 'US' },    // default for this whole project
  },
  {
    name: 'eu-tests',
    use: { accountRegion: 'EU' },
  },
],
```

Now `--project=us-tests` runs everything with `accountRegion='US'` (unless individual tests override).

### 10.6 Option fixtures as feature flags

```typescript
useFlag_v2_layout: [false, { option: true }],

dashboardPage: async ({ page, useFlag_v2_layout }, use) => {
  if (useFlag_v2_layout) {
    await page.goto('/dashboard?v=2');
    await use(new DashboardV2Page(page));
  } else {
    await page.goto('/dashboard');
    await use(new DashboardV1Page(page));
  }
},
```

When the flag rolls out, every test using `dashboardPage` automatically uses the V2 page object. To test both, run two projects with different option defaults.

---

## 11. `test.use({})` — per-file/describe overrides

### 11.1 Scope of `test.use`

| Where `test.use({})` appears | Affects |
|---|---|
| Top of a file (outside any describe) | Every test in this file |
| Inside `test.describe(...)` | Every test in that describe block |
| Multiple `test.use` calls | Merged — later wins on conflict |

### 11.2 What can be overridden

Any option fixture (built-in or custom). Common built-ins:

```typescript
test.use({
  viewport: { width: 800, height: 600 },
  locale: 'de-DE',
  timezoneId: 'Europe/Berlin',
  permissions: ['clipboard-read', 'clipboard-write'],
  geolocation: { latitude: 52.52, longitude: 13.41 },
  storageState: 'auth-states/user.json',
  baseURL: 'https://api.example.com',
});
```

### 11.3 What CANNOT be overridden via `test.use`

```typescript
test.use({
  page: ...,            // ❌ TS error — 'page' is not an option fixture
  myCustomFixture: ..., // ❌ unless declared with { option: true }
});
```

Only fixtures declared with `{ option: true }` (or built-in option fixtures) accept overrides via `test.use`.

### 11.4 Combining `test.use` with conditional logic

```typescript
test.use({ accountRole: process.env.ADMIN_MODE ? 'admin' : 'standard' });
```

`test.use` accepts any value, including computed ones. Evaluated when the test file loads.

---

## 12. Auto fixtures

`{ auto: true }` makes a fixture run for EVERY test, even if the test doesn't list it as a dependency.

### 12.1 Use case — global logging

```typescript
logger: [async ({}, use, testInfo) => {
  const start = Date.now();
  console.log(`[start] ${testInfo.title}`);
  await use(undefined);
  const ms = Date.now() - start;
  console.log(`[end] ${testInfo.title} (${ms}ms)`);
}, { auto: true }],

// Now EVERY test logs start/end automatically — no need to mention `logger`.
test('any test', async ({ page }) => {
  await page.goto('/');
  // Test doesn't reference logger, but logger runs anyway.
});
```

### 12.2 Use case — failure capture

```typescript
captureOnFailure: [async ({ page }, use, testInfo) => {
  await use(undefined);
  if (testInfo.status === 'failed') {
    await page.screenshot({ path: `${testInfo.outputDir}/post-failure.png` });
    const html = await page.content();
    await testInfo.attach('dom-snapshot.html', { body: html, contentType: 'text/html' });
  }
}, { auto: true }],
```

Equivalent to `afterEach` but composable across files via fixture inheritance.

### 12.3 Use case — accessibility scan on every test

```typescript
a11yScan: [async ({ page }, use) => {
  await use(undefined);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}, { auto: true }],
```

Runs an axe scan after every test. Combined with `test.skip()` for specific exemptions.

### 12.4 Mixing scopes with `auto`

Auto fixtures can be worker-scoped:

```typescript
workerWarmup: [async ({ browser }, use, workerInfo) => {
  // Pre-warm the browser by opening a page
  const page = await browser.newPage();
  await page.goto('about:blank');
  await page.close();
  await use(undefined);
}, { scope: 'worker', auto: true }],
```

Runs once per worker — useful for one-time process-level setup like loading a large data file into memory.

### 12.5 The dependency chain trick

`auto: true` fixtures are dependencies of the test. They can be themselves depended upon:

```typescript
configWatcher: [async ({}, use) => {
  setupWatchers();
  await use(undefined);
  teardownWatchers();
}, { auto: true }],

featureFlags: async ({ configWatcher }, use) => {
  // featureFlags depends on configWatcher implicitly via auto
  await use(loadFlags());
},
```

This lets you chain global setup without explicit listing.

---

## 13. Overriding built-in fixtures

You can replace a built-in fixture with your own implementation.

### 13.1 Override `page` — inject pre-navigation

```typescript
const test = base.extend({
  page: async ({ page }, use) => {
    // Pre-navigation
    await page.goto('/login');
    await page.fill('#user', 'admin');
    await page.fill('#pass', 'admin');
    await page.click('#submit');
    await page.waitForURL(/dashboard/);

    // Inject the now-authenticated page
    await use(page);
  },
});

test('test sees authenticated page', async ({ page }) => {
  // page is already on dashboard
  await expect(page).toHaveURL(/dashboard/);
});
```

### 13.2 Override `context` — inject default cookies

```typescript
const test = base.extend({
  context: async ({ context }, use) => {
    await context.addCookies([{ name: 'preferences', value: 'theme=dark', url: process.env.APP_URL! }]);
    await use(context);
  },
});
```

### 13.3 Override `request` — inject default headers

```typescript
const test = base.extend({
  request: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: process.env.API_URL,
      extraHTTPHeaders: { 'x-trace-id': randomUUID() },
    });
    await use(ctx);
    await ctx.dispose();
  },
});
```

### 13.4 The dependency reference

When overriding a built-in, you can reference it in the destructured deps:

```typescript
page: async ({ page }, use) => { /* receives the original built-in page */ }
```

Playwright resolves the inner `page` to the built-in, then your override wraps it. This is how you EXTEND built-ins rather than replace them entirely.

---

## 14. Page fixture pattern

The cleanest way to eliminate per-test setup boilerplate.

### 14.1 The pattern

```typescript
// fixtures/page.fixture.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../websites/orangehrm/pages/LoginPage';
import { DashboardPage } from '../websites/orangehrm/pages/DashboardPage';
import { AdminPage } from '../websites/orangehrm/pages/AdminPage';

interface Pages {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  adminPage: AdminPage;
}

export const test = base.extend<Pages>({
  loginPage:     async ({ page }, use) => { await use(new LoginPage(page)); },
  dashboardPage: async ({ page }, use) => { await use(new DashboardPage(page)); },
  adminPage:     async ({ page }, use) => { await use(new AdminPage(page)); },
});

export { expect } from '@playwright/test';
```

### 14.2 Tests then read cleanly

```typescript
import { test, expect } from '../../fixtures/page.fixture';

test('login flow', async ({ loginPage, dashboardPage }) => {
  await loginPage.goto();
  await loginPage.login('Admin', 'admin123');
  await expect(dashboardPage.welcomeBanner).toBeVisible();
});
```

No `new LoginPage(page)` boilerplate. The fixture handles it.

### 14.3 Lazy POM construction

POM construction is cheap (no DOM queries). Creating a POM for every test, even if the test doesn't use it, costs ~1ms. For most teams this is fine — the readability gain outweighs the cost.

For very large POM trees (50+ pages), you might want to construct lazily:

```typescript
pages: async ({ page }, use) => {
  const lazy = {
    get login() { return new LoginPage(page); },
    get dashboard() { return new DashboardPage(page); },
    get admin() { return new AdminPage(page); },
  };
  await use(lazy);
},

test('uses login', async ({ pages }) => {
  await pages.login.goto();   // LoginPage instantiated here
});
```

The getter-based approach means only the POMs the test references get constructed.

### 14.4 Pre-authenticated page variants

For tests that need different auth states:

```typescript
interface AuthPages {
  page: Page;              // override of built-in
  adminPage: AdminPage;
}

const test = base.extend<AuthPages>({
  page: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: 'auth-states/admin.json' });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
  adminPage: async ({ page }, use) => { await use(new AdminPage(page)); },
});
```

Tests using this `test` always get a logged-in admin context.

---

## 15. Account pool

When tests modify accounts (e.g., changing profile, resetting password), accounts can't be shared concurrently. The account pool pattern partitions accounts across workers using a file lock.

### 15.1 The mental model

```
auth.fixture.ts (worker-scoped):
  1. Lock test-data/accounts.lock (with proper-lockfile)
  2. Read pool from test-data/accounts.json
  3. Pop one account
  4. Write updated pool back
  5. Release lock
  6. Inject the claimed account into the worker
  7. Hold for the whole worker lifetime
  8. At worker shutdown: re-lock, push account back to pool, release
```

### 15.2 Implementation

```typescript
// fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';
import lockfile from 'proper-lockfile';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface Account {
  username: string;
  password: string;
}

const POOL_PATH = path.resolve('test-data/accounts.json');
const LOCK_PATH = path.resolve('test-data/accounts.lock');

async function readPool(): Promise<Account[]> {
  const raw = await fs.readFile(POOL_PATH, 'utf8');
  return JSON.parse(raw);
}

async function writePool(pool: Account[]): Promise<void> {
  await fs.writeFile(POOL_PATH, JSON.stringify(pool, null, 2));
}

async function claimAccount(): Promise<Account> {
  const release = await lockfile.lock(LOCK_PATH, { retries: 50 });
  try {
    const pool = await readPool();
    const claimed = pool.shift();
    if (!claimed) throw new Error('Account pool exhausted');
    await writePool(pool);
    return claimed;
  } finally {
    await release();
  }
}

async function returnAccount(account: Account): Promise<void> {
  const release = await lockfile.lock(LOCK_PATH, { retries: 50 });
  try {
    const pool = await readPool();
    pool.push(account);
    await writePool(pool);
  } finally {
    await release();
  }
}

export const test = base.extend<NonNullable<unknown>, { account: Account }>({
  account: [async ({}, use) => {
    const account = await claimAccount();
    await use(account);
    await returnAccount(account);
  }, { scope: 'worker' }],
});
```

### 15.3 Required pool size

With N workers, you need at least N accounts in the pool. With fewer, workers block on `lockfile.lock` retries indefinitely.

Rule of thumb: `accounts = workers + (safety margin of 1)`. For 4 workers, ship 5 accounts.

### 15.4 Why a lockfile and not in-memory mutex

Workers are separate Node processes. They cannot share JS memory. Options:

| Strategy | Cross-process | Robust to worker crash |
|---|---|---|
| `Mutex` / `Semaphore` in JS | ❌ Per-process only | N/A |
| Redis lock | ✅ Yes | ✅ TTL on lock |
| File lock (`proper-lockfile`) | ✅ Yes | ✅ Stale lock removal |
| OS file lock (`flock`) | ✅ Yes | ✅ Removed on process exit |

`proper-lockfile` is the standard for Node — lightweight, no external service, handles stale locks.

### 15.5 Stale lock handling

If a worker crashes while holding the lock:

```typescript
await lockfile.lock(LOCK_PATH, {
  retries: 50,
  stale: 30_000,           // consider lock stale after 30 s
  realpath: false,         // don't follow symlinks (security)
});
```

Stale locks are auto-removed. The other waiting workers then claim them.

### 15.6 Why worker scope, not test scope

Test scope:
- 100 tests × 4 workers = 400 lock/unlock cycles.
- Each cycle is ~10–50 ms.
- Total: ~10 seconds wasted on file locking.

Worker scope:
- 4 workers × 1 claim each = 4 cycles.
- Total: ~100 ms wasted.

Plus the test-scope version still has account-mutation isolation problems: if test 1 changes the password, test 2 in the same worker gets a stale password.

Worker scope is correct for "this account is dedicated to this worker for the whole run."

---

## 16. API client fixtures

The fixture pattern for HTTP clients (the framework's `APIUtils`, custom clients, etc.).

### 16.1 Basic API client fixture

```typescript
import { test as base } from '@playwright/test';

class CitationsApiClient {
  constructor(private readonly request: APIRequestContext, private readonly baseURL: string) {}

  async create(payload: CreateCitation): Promise<Citation> {
    const response = await this.request.post(`${this.baseURL}/citations`, { data: payload });
    return response.json();
  }
  // ... more methods
}

export const test = base.extend<{ citationsClient: CitationsApiClient }>({
  citationsClient: async ({ request }, use) => {
    const client = new CitationsApiClient(request, process.env.API_URL!);
    await use(client);
    // No teardown — client is stateless
  },
});
```

### 16.2 Authenticated API client

```typescript
const test = base.extend<{}, { authToken: string }>({
  authToken: [async ({}, use) => {
    const token = await fetchToken();
    await use(token);
    await revokeToken(token);
  }, { scope: 'worker' }],
});

const testWithApi = test.extend<{ citationsClient: CitationsApiClient }>({
  citationsClient: async ({ request, authToken }, use) => {
    const client = new CitationsApiClient(request, process.env.API_URL!, authToken);
    await use(client);
  },
});
```

`citationsClient` depends on both `request` (test-scoped) and `authToken` (worker-scoped). Mixing scopes in a test-scoped fixture is legal.

### 16.3 Test data setup/teardown fixture

The "create a test record, use it, delete it" pattern:

```typescript
const test = baseWithApi.extend<{ testCitation: Citation }>({
  testCitation: async ({ citationsClient }, use) => {
    const citation = await citationsClient.create({
      status: 'PENDING',
      amount: 150,
      testFlag: true,                // marks as synthetic
    });

    await use(citation);

    try {
      await citationsClient.delete(citation.id);
    } catch (e) {
      console.warn(`[cleanup] failed to delete ${citation.id}: ${e}`);
    }
  },
});

test('citation can be paid', async ({ testCitation, citationsClient }) => {
  await citationsClient.pay(testCitation.id, { amount: 150 });
  // Cleanup runs even if pay() throws
});
```

The `testFlag: true` marks the record as synthetic so a nightly cleanup job can sweep orphans (in case the in-test cleanup fails).

---

## 17. Performance

### 17.1 Fixture setup cost

| Fixture type | Typical cost |
|---|---|
| POM construction (`new LoginPage(page)`) | ~0.1 ms |
| API client instantiation | ~0.1 ms |
| HTTP token fetch | 100–2000 ms |
| DB connection | 50–200 ms |
| Account claim (file lock + JSON I/O) | 5–50 ms |
| `storageState` load + new context | 30–100 ms |
| browser launch (worker fixture) | 500–2000 ms |
| File-based test data load | 10–100 ms |

### 17.2 When fixture cost dominates

For a 1-second test with a 3-second setup fixture:
- Test scope: 4 s × 40 tests = 160 s.
- Worker scope (4 workers): 4 × 3 + 40 × 1 = 52 s.

Worker scoping saves 100+ seconds for a small suite. For large suites the savings scale linearly.

### 17.3 Memory implications

Each fixture holds its value until teardown. For worker-scoped fixtures, the value lives in worker memory for the whole run:

| Fixture | Held memory |
|---|---|
| String token (worker) | ~100 bytes |
| Database connection pool (worker) | ~10–50 MB |
| Browser context (worker, custom) | ~150–300 MB |
| Test data array (worker) | depends on data |

Worker memory is shared across all tests in that worker. A 10 MB test-data fixture in worker scope adds 10 MB × workers to total memory. With `workers: 8`, that's 80 MB total — usually fine. With `workers: 16` and a 100 MB fixture, OOM risk.

### 17.4 Lazy initialisation

For fixtures that are expensive AND rarely used:

```typescript
expensiveThing: async ({}, use) => {
  let thing: ExpensiveThing | undefined;
  const getter = {
    get value() {
      if (!thing) thing = createExpensive();
      return thing;
    },
  };
  await use(getter);
  if (thing) destroyExpensive(thing);
},
```

The expensive resource is only created when first accessed. Saves cost for tests that don't actually need it.

### 17.5 Sharing across tests within a worker

Worker scope already gives you intra-worker sharing. For more granular sharing (e.g., a per-describe pool), use `test.beforeAll` instead:

```typescript
test.describe('related tests', () => {
  let shared: SharedResource;

  test.beforeAll(async () => {
    shared = await createShared();
  });

  test.afterAll(async () => {
    await destroyShared(shared);
  });

  test('uses shared 1', async () => { /* ... */ });
  test('uses shared 2', async () => { /* ... */ });
});
```

`beforeAll` is similar to a worker fixture but scoped to the describe block. The tradeoff: less ergonomic dependency injection.

---

## 18. Error handling

### 18.1 Errors during setup

```typescript
myFixture: async ({}, use) => {
  const r = await createOrThrow();   // throws → test fails as "fixture setup failed"
  await use(r);
},
```

Output:
```
Error: Failed to initialize fixture "myFixture"
  at: createOrThrow ...
```

The test never runs. The HTML report shows the test as failed with the fixture error.

### 18.2 Errors during teardown

```typescript
myFixture: async ({}, use) => {
  await use(r);
  throw new Error('cleanup failed');   // test was passing — now FAILS
},
```

Tests that passed in body but threw in teardown: marked as FAILED with the teardown error.

To avoid teardown errors masking real test failures, wrap teardown:

```typescript
myFixture: async ({}, use, testInfo) => {
  await use(r);
  try {
    await cleanup(r);
  } catch (e) {
    // If test passed, suppress cleanup error
    if (testInfo.status === 'passed') {
      console.warn(`[cleanup] suppressed: ${e}`);
      return;
    }
    throw e;
  }
},
```

### 18.3 Errors during `use()`

If the test body throws, `use()` returns the thrown value as a rejected promise:

```typescript
myFixture: async ({}, use) => {
  const r = await create();
  try {
    await use(r);   // re-throws if test failed
  } finally {
    await cleanup(r);   // ALWAYS runs
  }
},
```

The `try/finally` is the canonical "always cleanup" pattern.

### 18.4 Conditional skip during fixture setup

```typescript
myFixture: async ({}, use) => {
  if (!process.env.RUN_INTEGRATION_TESTS) {
    throw new Error('SKIP — integration tests disabled');
    // Or, even better:
    test.skip(true, 'integration tests disabled');
  }
  await use(createResource());
},
```

Note: `test.skip()` works inside fixtures and marks the calling test as skipped, not failed.

### 18.5 Logging fixture lifecycle

For debugging fixture issues:

```typescript
myFixture: async ({}, use, testInfo) => {
  const id = randomUUID().slice(0, 8);
  console.log(`[${id}] setup for ${testInfo.title}`);
  const r = await create();
  console.log(`[${id}] yielding for ${testInfo.title}`);
  try {
    await use(r);
  } finally {
    console.log(`[${id}] tearing down for ${testInfo.title}`);
    await cleanup(r);
    console.log(`[${id}] done for ${testInfo.title}`);
  }
},
```

The UUID lets you correlate logs across parallel test runs.

---

## 19. Common production failures

### Failure 1 — Worker fixture depends on test fixture

**Symptom:** `Error: Fixture "X" has worker scope, but depends on a test-scoped fixture "Y".`

**Cause:** Mixed scopes incorrectly.

**Fix:** Promote both to worker, or demote both to test. See Section 5.

### Failure 2 — Worker fixture mutated across tests

**Symptom:** Test 1 modifies a worker-scoped value, test 2 sees the modification.

**Cause:** Worker fixtures are shared. Tests must NOT mutate them.

**Fix:** Mutable data goes in test scope. Worker scope is for read-only data.

### Failure 3 — `await use()` forgotten

**Symptom:** Test hangs forever, eventually times out.

**Cause:** Fixture doesn't call `use()`. The test runner waits for the fixture to yield, which never happens.

**Fix:** Always call `use()` exactly once.

### Failure 4 — Account pool deadlock

**Symptom:** Tests hang at the start with "Lock not acquired."

**Cause:** Pool exhausted (more workers than accounts) or lockfile crashed without releasing.

**Fix:** Ensure `accounts.length >= workers`. Set `stale: 30_000` to auto-remove abandoned locks.

### Failure 5 — Fixture for closed connection

**Symptom:** Tests fail with "connection is closed" intermittently.

**Cause:** A test-scoped DB connection fixture, but workers reuse contexts. The teardown closes the connection while another test is still using it.

**Fix:** Either make the fixture worker-scoped (one connection per worker) OR ensure tests are fully sequential within their describe block.

### Failure 6 — `test.use({ accountRole: 'admin' })` ignored

**Symptom:** Test uses `accountRole: 'admin'` but the fixture still creates a standard account.

**Cause:** Fixture is using a captured value from before `test.use` runs — common when the fixture is defined in another file with its own `accountRole` import.

**Fix:** Always read options from the fixture's destructured arg, not from imports:
```typescript
// ❌
const role = importedRole;
testAccount: async ({}, use) => { use(await create(role)); }

// ✅
testAccount: async ({ accountRole }, use) => { use(await create(accountRole)); }
```

### Failure 7 — `auto: true` fixture not running

**Symptom:** Defined `auto: true` fixture, but the side effects don't happen.

**Cause:** Spec file imported the wrong `test` object (raw `@playwright/test` instead of your extended version).

**Fix:** Always `import { test } from '../fixtures'` (your barrel), not from `@playwright/test`.

### Failure 8 — `testInfo.status` is always `'passed'` in fixture teardown

**Symptom:** Trying to capture screenshots only on failure, but it captures on every test.

**Cause:** `testInfo.status` is set AFTER the test body returns. Inside fixtures, you only see the final status after `await use()` returns.

**Fix:** Code AFTER `await use()` is where status is set. Make sure you're reading status post-yield, not pre-yield.

### Failure 9 — Fixture timeout

**Symptom:** `Error: Timeout 30000ms exceeded while setting up "myFixture".`

**Cause:** Fixture setup or teardown takes longer than the test timeout.

**Fix:** Either increase fixture timeout:
```typescript
myFixture: [async ({}, use) => { /* ... */ }, { timeout: 60_000 }],
```
Or speed up the fixture (move to worker scope, use cached values, etc.).

### Failure 10 — Worker fixture not torn down on Ctrl+C

**Symptom:** Database has open transactions after canceling a test run.

**Cause:** Worker fixtures only tear down on graceful shutdown. SIGINT may bypass.

**Fix:** Register process exit handlers:
```typescript
process.on('SIGTERM', async () => {
  // teardown logic
});
```
Plus a nightly cleanup job for orphaned resources.

---

## 20. Comparison with other DI systems

### 20.1 Playwright vs pytest

| Aspect | Playwright `test.extend` | pytest fixtures |
|---|---|---|
| Scope | `test` / `worker` | `function` / `class` / `module` / `session` |
| Definition | Function in fixture file | `@pytest.fixture` decorator |
| Injection | Destructured first arg | Function parameter name |
| Teardown | After `use()` | `yield` then post-yield code |
| Parametrise | `{ option: true }` + `test.use` | `@pytest.mark.parametrize` |
| Conditional | `test.skip()` inside fixture | `pytest.skip()` |

Both are excellent DI systems. pytest has 4 scopes vs Playwright's 2 — finer control. Playwright's option pattern is cleaner for runtime parametrisation.

### 20.2 Playwright vs JUnit 5

| Aspect | Playwright | JUnit 5 |
|---|---|---|
| Setup/teardown | Fixture body | `@BeforeEach`, `@AfterEach`, `@BeforeAll`, `@AfterAll` |
| Sharing across tests | Worker fixtures | `@TestInstance(Lifecycle.PER_CLASS)` |
| Parametrise | Options pattern | `@ParameterizedTest`, `@MethodSource` |
| DI | Fixture system | `@RegisterExtension`, Guice integrations |

JUnit's hook system is older and more explicit but verbose. Playwright's fixture system trades verbosity for type safety and composability.

### 20.3 Playwright vs Angular DI

Angular DI is for production code; Playwright fixtures are for tests. The principles are the same (declarative dependencies, lifecycle management), but the implementation is much lighter — fixtures don't need a Module system.

### 20.4 Playwright vs Cypress fixtures

Cypress "fixtures" is just `cy.fixture()` for loading JSON files. It doesn't have DI in the Playwright sense. Setup/teardown in Cypress uses `before`, `beforeEach`, `after`, `afterEach` — like JUnit.

This is a real gap. In Cypress you can't easily inject a typed `citationsClient` parameter into tests; you have to attach it to the cypress global or create it inside the test.

### 20.5 Playwright vs WebdriverIO

WebdriverIO has hooks (`before`, `beforeEach`, `after`, `afterEach`) and a "service" concept for cross-test shared state. No type-safe DI like Playwright's `test.extend`.

---

## 21. Anti-pattern catalog

| ❌ Anti-pattern | ✅ Fix |
|---|---|
| `import { test } from '@playwright/test'` in test files | Import from your fixtures barrel |
| Worker fixture depends on test fixture | Match scopes |
| Mutable state in worker fixture | Use test scope for mutable state |
| `await use()` forgotten | Always call exactly once |
| Multiple `await use()` calls | Each fixture yields exactly once |
| `try/catch` swallowing teardown errors silently | Log warnings; rethrow if test failed |
| Worker fixture for per-test data | Per-test data must be test-scoped |
| Test-scoped DB connection for every test | Worker-scoped connection pool |
| `let myFixture` declared in spec, manually set in beforeEach | Use the fixture system |
| Hardcoded values inside fixture | Use options + `test.use` |
| 50-line fixture body | Extract helpers; fixtures should be thin |
| Fixture depends on too many things (8+ params) | Group related fixtures into a single composite |
| Fixture that ALSO runs assertions | Fixtures set up; tests assert |
| Fixture mutates `process.env` | Only `globalSetup` should mutate env |
| `console.log` in production fixture | Use `testInfo.attach()` or the logger pattern |
| Loading 50 MB JSON per test | Cache in worker scope; load once |
| File I/O in test fixture without lock | Use `proper-lockfile` for shared state |
| Fixture returns `undefined` then test checks `if (x)` | Use `test.skip()` to actually skip |

---

## Cross-references

- Config integration (`use:`, projects): [`./02_config.md`](./02_config.md)
- Auth fixtures (OAuth, TOTP, mTLS): [`./05_auth.md`](./05_auth.md)
- POM construction details: [`../learn/03_pom.md`](../learn/03_pom.md)
- Account pool pattern source: [`../framework/fixtures/auth.fixture.ts`](../framework/fixtures/auth.fixture.ts)
- Practice problems: Q8, Q14, Q17, Q20 in [`../practice/quiz_02_solutions/`](../practice/quiz_02_solutions/)
