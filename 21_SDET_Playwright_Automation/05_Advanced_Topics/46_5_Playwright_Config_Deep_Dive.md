# 46.5. Playwright Config Deep-Dive

**Navigation**: [← 46. BDD with Cucumber](./46_BDD_With_Cucumber.md) | [Index](../00_INDEX.md) | [→ 47. Allure & ReportPortal](./47_Allure_ReportPortal.md)

---

> ### ⚠️ This is a brief overview — read the canonical chapter first
>
> The canonical config chapter is [**Ch56 — Playwright Config Deep-Dive (framework-anchored)**](../02_Core_Architecture/56_Playwright_Config_Deep_Dive.md). It walks the real [`framework/playwright.config.ts`](../framework/playwright.config.ts) field-by-field with concrete CI examples.
>
> This file (Ch46.5) is a **brief overview (~670 lines)** kept here so the curriculum number sequence (46 → 46.5 → 47) reads naturally. It overlaps Ch56 substantially.
>
> A longer theoretical reference also exists at [`02_Core_Architecture/46_5_Playwright_Config_Deep_Dive.md`](../02_Core_Architecture/46_5_Playwright_Config_Deep_Dive.md).

---

## 5W1H

- **WHAT**: Every field, every hierarchy, and every trade-off inside `playwright.config.ts`.
- **WHY**: One wrong timeout, shard, or trace setting can multiply CI cost by 10x, mask flaky delays, or silently swallow browser crashes.
- **WHO**: SDETs who own CI pipelines, platform engineers who maintain test infrastructure, and anyone debugging why tests pass locally but fail in Docker.
- **WHEN**: Read this before onboarding onto a team that already has a mature Playwright suite, or before you decide to change `workers`, `retries`, or `dependencies`.
- **HOW**: We trace `defineConfig({})` top-to-bottom, map each field to its runtime effect, and give explicit values for local vs. CI contexts.

---

## Table of Contents

1. [Why Config Matters](#1-why-config-matters)
2. [Config Object Anatomy](#2-config-object-anatomy)
3. [Project Configuration](#3-project-configuration)
4. [GlobalSetup vs GlobalTeardown vs Dependencies](#4-globalsetup-vs-globalteardown-vs-dependencies)
5. [Parallel Execution](#5-parallel-execution)
6. [Timeout Hierarchy](#6-timeout-hierarchy)
7. [Reporter Configuration](#7-reporter-configuration)
8. [Trace and Screenshot Modes](#8-trace-and-screenshot-modes)
9. [Browser and Device Config](#9-browser-and-device-config)
10. [WebServer Config](#10-webserver-config)
11. [Conditional Config per Environment](#11-conditional-config-per-environment)
12. [Common Mistakes](#12-common-mistakes)
13. [Exercise](#13-exercise)

---

## 1. Why config matters

Playwright ships with sensible defaults, but sensible defaults do not know your budget, your SLAs, or your CI concurrency limits. A single `timeout: 60000` in `use` is harmless for a single test and catastrophic at 10,000 tests because it inflates CI wall-clock time even for tests that would have finished in two seconds.

Config is the **control plane** of your test suite. It determines:
- How much you pay in CI minutes (parallelism, shard count, retries)
- How long you wait for a failure signal (timeout hierarchy)
- Whether you can debug a flaky failure post-mortem (trace, screenshots, video)
- Whether your suite represents real users (viewport, locale, permissions, devices)

Treat `playwright.config.ts` like infrastructure-as-code. Changes deserve a PR, a justification, and a budget check.

---

## 2. Config object anatomy

Playwright's exported configuration is a single object passed to `defineConfig(...)`.

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  globalTimeout: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  quiet: false,
  updateSnapshots: 'missing',
  preserveOutput: 'failures-only',
  webServer: { ... },
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 0,
    navigationTimeout: 0,
    locale: 'en-US',
    permissions: [],
    extraHTTPHeaders: {},
    contextOptions: {},
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

### 2.1 Top-level fields at a glance

| Field | Type | Default | Runtime effect |
|---|---|---|---|
| `testDir` | `string` | `'./tests'` | Where Playwright discovers `*.spec.ts` files |
| `outputDir` | `string` | `'./test-results'` | Artifacts folder (trace, screenshots, video) |
| `globalTimeout` | `number` | `0` | Max milliseconds for the **entire** test run; `0` = no limit |
| `timeout` | `number` | `30_000` | Max milliseconds for a single test |
| `expect` | `object` | `{ timeout: 5_000 }` | Default assertion timeout |
| `retries` | `number` | `0` | How many times to retry a failed test |
| `workers` | `number \| string` | `undefined` = CPU count | Number of parallel worker processes |
| `fullyParallel` | `boolean` | `false` | Run individual tests inside the same file in parallel |
| `forbidOnly` | `boolean` | `false` | CI gate: fail if `test.only` is left in code |
| `reporter` | `array` | `list` | Output destinations and formats |
| `quiet` | `boolean` | `false` | Suppress non-error console output |
| `updateSnapshots` | `string` | `'missing'` | When to update baselines (`all`, `none`, `missing`) |
| `preserveOutput` | `string` | `'failures-only'` | Which artifacts to keep from `outputDir` |
| `webServer` | `object` | — | Auto-start and health-check a dev server |
| `globalSetup` | `string` | — | One-time setup across the whole run |
| `globalTeardown` | `string` | — | One-time teardown across the whole run |
| `dependencies` | `array` | — | Project-level dependency chain |
| `projects` | `array` | `[{ name: '', use: {} }]` | Multiple browser / env profiles |

### 2.2 `testDir` and `outputDir`

`testDir` is the discovery root. Playwright recurses into subdirectories. Test files are matched by `testMatch`, default `**/?(*.)@(spec|test).*`. Override with:

```typescript
testMatch: /.*\.e2e\.ts$/,
```

`outputDir` is the artifact graveyard. Every run wipes and recreates it unless `preserveOutput` says otherwise. Keep it outside `git` with `.gitignore`.

### 2.3 `globalTimeout` — the circuit breaker

`globalTimeout: 20 * 60 * 1000` kills the entire suite after 20 minutes. Use this as a hard stop to prevent runaway CI jobs from burning credits. It overrides all per-test timeouts once the global limit is hit.

### 2.4 `forbidOnly`

A CI safety net. If `test.only` or `describe.only` exists, the run fails immediately. Always set:

```typescript
forbidOnly: !!process.env.CI,
```

### 2.5 `updateSnapshots` and `preserveOutput`

- `updateSnapshots: 'missing'` (default) — create baseline the first time a screenshot test runs, fail if existing baseline differs.
- `updateSnapshots: 'all'` — rewrite every baseline. Use locally with extreme caution. Never commit an `all` run without review.
- `preserveOutput: 'failures-only'` — deletes artifacts for passing tests. Keeps disk usage low.
- `preserveOutput: 'always'` — keeps everything. Needed when you want to inspect video/screenshots for passing tests too.

---

## 3. Project configuration

`projects[]` is where you define multiple test profiles — different browsers, viewports, or environment configurations.

### 3.1 Minimal multi-browser project

```typescript
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
],
```

Each project is a **separate test run** with its own worker pool and artifact folder. A test that fails in Chromium but passes in WebKit indicates a browser-specific bug, not a test bug.

### 3.2 Project-level `use` merges with top-level `use`

Playwright merges top-level `use` with project-level `use`. Project wins on collision:

```typescript
use: { baseURL: 'http://localhost:3000', headless: true },
projects: [
  {
    name: 'staging',
    use: { baseURL: 'https://staging.example.com', headless: true },
  },
],
```

Staging project sees `baseURL = 'https://staging.example.com'`, `headless = true`.

### 3.3 `testMatch` per project

Run a different file set per project:

```typescript
projects: [
  {
    name: 'api',
    testMatch: /.*\.api\.spec\.ts$/,
    use: { baseURL: 'https://api.example.com' },
  },
  {
    name: 'ui',
    testMatch: /.*\.ui\.spec\.ts$/,
    use: { baseURL: 'https://app.example.com' },
  },
],
```

This avoids mixing API and UI tests in the same run when the environments differ.

### 3.4 `dependencies` — ordered project chains

Use `dependencies` when one project must run before another:

```typescript
projects: [
  {
    name: 'setup',
    testMatch: /.*\.setup\.ts$/,
  },
  {
    name: 'e2e',
    dependencies: ['setup'],
  },
],
```

Playwright runs all `setup` tests first. If any setup test fails, the `e2e` project is skipped. This is the replacement for `globalSetup` when you need setup to integrate with the test reporter, produce traces, or run in the same output directory.

---

## 4. GlobalSetup vs GlobalTeardown vs Dependencies

| Use case | Recommended mechanism | Lifecycle |
|---|---|---|
| One-time DB seed / schema creation | `globalSetup` | Once per **entire** test run |
| One-time DB cleanup / artifact upload | `globalTeardown` | Once per **entire** test run |
| Per-worker login state (storageState) | `scope: 'worker'` fixture | Once per **worker** |
| Project-scoped auth + integration with reporter/trace | `dependencies` project | Once per **project**, integrated with test infra |

### 4.1 `globalSetup` — the standalone script

`globalSetup` is a module that exports a single default function. It runs in a **separate Node process** before any workers spawn.

```typescript
// global-setup.ts
import type { FullConfig } from '@playwright/test';

export default async function globalSetup(config: FullConfig) {
  await seedDatabase();
  await createSharedBuckets();
}
```

**Limitations**:
- No access to fixtures, test reporters, or traces.
- If it throws, the entire run aborts with no test output.
- Not integrated with `outputDir` artifact collection.

Use `globalSetup` only for infrastructure that is **completely independent** of test files (DB schema, Docker pull, AWS bucket creation).

### 4.2 `globalTeardown` — the cleanup script

Same pattern, opposite timing:

```typescript
export default async function globalTeardown(config: FullConfig) {
  await deleteOrphanTestData();
  await uploadArtifactsToS3();
}
```

Runs after **all** workers finish, regardless of pass/fail. If cleanup must run even when the suite is killed by CI timeout, wrap it in a `finally` and consider a separate cron job as a safety net.

### 4.3 `dependencies` vs `globalSetup`

| Criterion | `globalSetup` | `dependencies` project |
|---|---|---|
| Runs in same outputDir | No | Yes |
| Can produce traces | No | Yes |
| Integrates with reporter | No | Yes |
| Can retry on failure | No | Yes (if the setup file uses retries) |
| Worker-scoped | No | Yes, per project |
| Complexity | Low | Medium |

**Rule of thumb**: If your setup produces data that tests consume and you want traces or screenshots when setup breaks, use a `dependencies` project. If your setup is pure infrastructure (DB schema, Docker container), use `globalSetup`.

---

## 5. Parallel execution

### 5.1 `fullyParallel`

```typescript
fullyParallel: true,
```

By default (`false`), tests inside the same file run sequentially in the same worker. With `fullyParallel: true`, every individual test runs in whichever worker is free. This increases throughput but means tests inside the same file cannot share module-level mutable state.

**When to enable**: Your tests are self-contained and never use `let` at module level to pass data between tests.

**When to keep disabled**: You have `test.describe.serial()` blocks or tests that modify a shared database account.

### 5.2 `workers`

```typescript
workers: process.env.CI ? 4 : undefined,
```

- `undefined` (default) = `os.cpus().length` worker processes.
- Set to a number to cap workers (useful in CI containers with shared CPU limits).
- Set to a percentage string: `'50%'` uses half the CPUs.

**CI rule**: Start with `4` for GitHub-hosted runners (2-core, but workers are I/O bound). Scale up on self-hosted runners with dedicated cores. Never exceed the number of test files unless `fullyParallel` is true.

### 5.3 `shard` — horizontal scaling

Sharding splits the test suite across multiple CI jobs:

```typescript
shards: {
  total: 4,
  current: Number(process.env.SHARD_INDEX),
},
```

Or via CLI:
```bash
npx playwright test --shard=1/4
```

Playwright hashes each test's file path + project name and deterministically assigns it to a shard. This guarantees the same test always lands on the same shard index. Combine with a CI matrix:

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
```

### 5.4 `retries`

```typescript
retries: process.env.CI ? 2 : 0,
```

Retries re-run failed tests. They do **not** retry passed tests. Playwright marks the original result as `flaky` if it passes on retry. Use `retry: 2` in CI, `0` locally — retries mask real product bugs locally and slow debugging.

**Cost math**: If your suite has a 5% flake rate and 1,000 tests, `retries: 2` in CI costs:
- ~50 tests retry once = 50 extra test runs
- ~2.5 of those retry twice = 2.5 extra runs
- Total overhead: ~5.25% more CI time, but zero false-red builds.

---

## 6. Timeout hierarchy

Playwright applies timeouts at five levels. The most specific wins:

1. **Global timeout** — `globalTimeout` on the entire run
2. **Test timeout** — `timeout` per test (default 30 s)
3. **Expect timeout** — `expect: { timeout }` per assertion (default 5 s)
4. **Action timeout** — `use: { actionTimeout }` per click/fill/etc (default: none, uses test timeout)
5. **Navigation timeout** — `use: { navigationTimeout }` per goto/navigate (default: none, uses test timeout)
6. **Inline override** — `test.setTimeout(60000)` in a test function

### 6.1 Recommended CI values

```typescript
export default defineConfig({
  globalTimeout: 20 * 60 * 1000,   // 20 min hard stop
  timeout: 60_000,                  // 1 min per test
  expect: { timeout: 10_000 },      // 10 s for assertions
  use: {
    actionTimeout: 15_000,          // 15 s for clicks/fills
    navigationTimeout: 20_000,      // 20 s for page loads
  },
});
```

### 6.2 When to override per test

For heavy flows (large file upload, multi-step wizard):

```typescript
test('upload 500MB file', async ({ page }) => {
  test.setTimeout(300_000);
  // ...
});
```

Avoid raising the global `timeout` for one slow test. Keep the global tight and override locally.

---

## 7. Reporter configuration

### 7.1 Built-in reporters

```typescript
reporter: [
  ['list'],                              // Console output
  ['html', { open: 'never' }],           // Self-contained HTML report
  ['json', { outputFile: 'results.json' }],
  ['junit', { outputFile: 'junit.xml' }],
  ['blob', { outputDir: 'blob-report' }], // Shard-merge format
],
```

| Reporter | Use case | Artifact |
|---|---|---|
| `list` | Console view during local runs | None |
| `dot` | Minimal console (good for CI logs) | None |
| `html` | Shareable report with trace viewer | `playwright-report/` folder |
| `json` | Programmatic consumption | `results.json` |
| `junit` | Jenkins, Azure DevOps, CircleCI | `junit.xml` |
| `blob` | Merging shard results into one report | `blob-report/` (binary) |

### 7.2 Custom reporter

Implement `Reporter` interface for dashboards, Slack alerts, or metrics pipelines:

```typescript
import type { Reporter, TestCase, TestResult } from '@playwright/test';

export default class SlackReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'failed' && result.retry === result.results.length - 1) {
      sendSlackAlert(`Test failed after all retries: ${test.title}`);
    }
  }
}
```

Register in config:
```typescript
reporter: [['./SlackReporter.ts', { channel: '#alerts' }]],
```

### 7.3 `blob` reporter for sharded CI

Each shard writes its own blob. Merge them in a final CI step:

```bash
npx playwright merge-reports --reporter=html blob-report/
```

This produces a single unified HTML report with traces from all shards.

---

## 8. Trace and screenshot modes

### 8.1 Trace modes

```typescript
use: {
  trace: 'on' | 'off' | 'on-first-retry' | 'retain-on-failure' | 'on-all-retries',
}
```

| Mode | When | Cost | Debugging value |
|---|---|---|---|
| `off` | CI with zero budget | Zero | None — cannot debug failures |
| `on-first-retry` | Standard CI | Medium | Trace of the first failed attempt |
| `retain-on-failure` | Local debugging | Medium | Keeps trace only if test ultimately fails |
| `on` | Deep investigation | High | Every test, every run |
| `on-all-retries` | Flakiness root-cause | Very high | Trace of every retry attempt |

**Recommended**: `trace: 'on-first-retry'` in CI, `trace: 'retain-on-failure'` locally.

### 8.2 Screenshot modes

```typescript
use: {
  screenshot: 'off' | 'on' | 'only-on-failure',
}
```

Use `only-on-failure` in CI. Screenshots are cheap but accumulate fast at scale.

### 8.3 Video modes

```typescript
use: {
  video: 'off' | 'on' | 'retain-on-failure' | 'on-first-retry',
}
```

Video is the most expensive artifact. Enable only for smoke tests or critical paths, or when you need to prove real user flow to stakeholders.

---

## 9. Browser and device config

### 9.1 Device presets

```typescript
import { devices } from '@playwright/test';

projects: [
  { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
  { name: 'iPhone 14', use: { ...devices['iPhone 14'] } },
  { name: 'Pixel 7', use: { ...devices['Pixel 7'] } },
],
```

Device presets set `userAgent`, `viewport`, `deviceScaleFactor`, `isMobile`, and `hasTouch` in one spread.

### 9.2 Custom viewport and permissions

```typescript
use: {
  viewport: { width: 1440, height: 900 },
  permissions: ['geolocation', 'notifications'],
  geolocation: { latitude: 37.7749, longitude: -122.4194 },
  locale: 'de-DE',
  timezoneId: 'Europe/Berlin',
  colorScheme: 'dark',
},
```

### 9.3 Browser launch args

```typescript
use: {
  launchOptions: {
    args: ['--disable-gpu', '--no-sandbox'],
    slowMo: 50, // 50 ms delay between actions (for local demo)
  },
},
```

**Headed mode locally**:
```typescript
headless: !!process.env.CI,
```

---

## 10. WebServer config

Playwright can start your dev server and wait for it to be healthy before running tests.

```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
},
```

| Field | Purpose |
|---|---|
| `command` | Shell command to start the server |
| `url` | URL Playwright polls to confirm readiness |
| `reuseExistingServer` | If true, skips `command` when `url` is already responding (local dev speed) |
| `timeout` | Max time to wait for `url` to respond |

### 10.1 Health-check strategy

If your app does not have a lightweight `/health` endpoint, Playwright polls `url` with `GET` and expects HTTP 200–399. Add `--ignore-stdin` to your server command if the process waits for terminal input.

### 10.2 Multiple servers

```typescript
webServer: [
  { command: 'npm run api', url: 'http://localhost:4000' },
  { command: 'npm run app', url: 'http://localhost:3000' },
],
```

Playwright starts them in parallel and waits for both.

---

## 11. Conditional config per environment

Use `process.env.CI` and `process.env.NODE_ENV` to branch the config:

```typescript
const isCI = !!process.env.CI;

export default defineConfig({
  workers: isCI ? 4 : undefined,
  retries: isCI ? 2 : 0,
  reporter: isCI
    ? [['list'], ['blob', { outputDir: 'blob-report' }]]
    : [['list'], ['html', { open: 'on-failure' }]],
  use: {
    trace: isCI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: isCI ? 'only-on-failure' : 'on',
    headless: isCI,
    baseURL: isCI
      ? 'https://staging.example.com'
      : 'http://localhost:3000',
  },
});
```

**Anti-pattern**: Do not commit `CI=false` overrides or hardcoded URLs. Keep the config deterministic and override via env vars injected by the CI platform.

---

## 12. Common mistakes

1. **Raising global `timeout` for one slow test.** Use `test.setTimeout()` locally instead.
2. **`retries: 2` locally.** Retries hide real bugs during development. Keep `0` locally, `2` in CI.
3. **`fullyParallel: true` with module-level `let` state.** Parallel tests overwrite each other's variables. Use fixtures or `test.describe.serial()`.
4. **No `forbidOnly` in CI.** A left-over `test.only` silently drops 99% of your suite.
5. **`trace: 'on'` in CI without cleanup.** Can generate gigabytes per run. Use `on-first-retry`.
6. **Mixing `globalSetup` and `dependencies` for the same concern.** Pick one. `dependencies` wins for anything test-visible.
7. **Hardcoding `baseURL` to staging.** Breaks local runs. Branch on `process.env.CI`.
8. **No `webServer` health-check timeout.** Defaults to 60 s; if the server never starts, the suite wastes a full CI minute before failing.

---

## 13. Exercise

### 13.1 Scenario

You inherit this config:

```typescript
export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  workers: 1,
  retries: 0,
  use: {
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    headless: false,
  },
  reporter: [['list']],
});
```

Problems:
- `timeout: 120_000` — every test gets 2 minutes, inflating CI time for fast tests.
- `workers: 1` — no parallel execution. 500 tests run sequentially.
- `trace: 'on'`, `screenshot: 'on'`, `video: 'on'` — massive artifact bloat.
- `headless: false` — requires a display in CI; will fail in Docker.
- No `forbidOnly`, no `webServer`, no `retries`, no `globalTimeout`.

### 13.2 Deliverable

Produce `playwright.config.ts` optimized for both local development and CI with these constraints:

1. **Local**: headed mode, HTML reporter with auto-open, trace and screenshot on failure only, no retries, all CPU workers.
2. **CI**: headless mode, blob reporter + list reporter, trace on first retry, screenshots only on failure, 4 workers, 2 retries, 20-minute global timeout, `forbidOnly` enabled.
3. **Projects**: Chromium desktop + iPhone 14 mobile emulation.
4. **WebServer**: Auto-start `npm run dev` on `http://localhost:3000`, reuse existing server locally.
5. **Timeouts**: Test timeout 60 s, expect timeout 10 s, action 15 s, navigation 20 s.
6. **Conditional**: All differences between local and CI must branch on `process.env.CI`.

### 13.3 Rubric

| Criterion | 0 pts | 1 pt | 2 pts | 3 pts |
|---|---|---|---|---|
| **Local vs CI branching** | Hardcoded values | Some branching | All fields branch correctly | Clean, readable `isCI` pattern |
| **Reporter selection** | Only list | List + one other | List + blob + html with correct conditions | Blob for CI, HTML auto-open local |
| **Artifact modes** | All `on` | Some optimization | Correct local + CI modes | Correct + justification comments |
| **Workers / parallel** | `workers: 1` | Static number | Dynamic per env | `undefined` local, `4` CI |
| **Timeout hierarchy** | Single global | Test + expect | Test + expect + action + nav | 4 levels with inline rationale |
| **Projects** | Missing | Single project | Two projects | Two + device presets + names |
| **WebServer** | Missing | Exists but no reuse | Command + URL | + `reuseExistingServer` + timeout |
| **forbidOnly / retries** | Missing | One of two | Both present