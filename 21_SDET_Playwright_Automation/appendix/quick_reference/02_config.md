# Config — `playwright.config.ts`

> **Canonical lesson:** [56 Playwright Config Deep Dive](../../01_Foundations/56_Playwright_Config_Deep_Dive.md). This page is a shorter summary kept for quick lookup; the chapter is the maintained version — if the two disagree, trust the chapter.

> The authoritative reference for every field, every interaction, every failure mode, and every performance trade-off in `playwright.config.ts`. Read end-to-end on day one; grep into it for the next 18 months.

---

## Table of contents

1. [How Playwright loads your config](#1-how-playwright-loads-your-config)
2. [The complete field reference](#2-the-complete-field-reference)
3. [The 4-level timeout cascade](#3-the-4-level-timeout-cascade)
4. [Reporters — all 8 built-in + the custom reporter API](#4-reporters)
5. [The `use{}` block — every field annotated](#5-the-use-block)
6. [Trace internals](#6-trace-internals)
7. [Projects — resolution algorithm and dependency graph](#7-projects)
8. [`globalSetup` vs setup project with `dependencies`](#8-globalsetup-vs-setup-project)
9. [Device emulation — accuracy and limits](#9-device-emulation)
10. [Multi-environment configuration strategy](#10-multi-environment-strategy)
11. [Performance tuning — workers, memory, shard sizing](#11-performance-tuning)
12. [Common production failures](#12-common-production-failures)
13. [Migration history — v1.20 → v1.49](#13-migration-history)
14. [Comparison with Cypress / Jest / Vitest config](#14-comparison-with-other-tools)

---

## 1. How Playwright loads your config

### 1.1 File resolution

When you run `npx playwright test`, the CLI searches for a config file in the current working directory in this order:

1. `--config <path>` CLI flag (absolute or relative)
2. `playwright.config.ts`
3. `playwright.config.mts`
4. `playwright.config.cts`
5. `playwright.config.js`
6. `playwright.config.mjs`
7. `playwright.config.cjs`
8. `playwright.ct.config.ts` (component testing)

The first match wins. If none exist, Playwright uses an empty config and walks the file system from CWD looking for `*.spec.ts` files. This is why running `npx playwright test` outside a project still discovers tests but with all-default behaviour.

> **Hidden behaviour:** Playwright resolves the config path **before** loading any tests, so the config can dynamically set `testDir`. If your config file lives in `apps/web/`, but you run from the repo root, pass `--config apps/web/playwright.config.ts` — relative `testDir` then resolves against the config file's directory, not the CWD.

### 1.2 `defineConfig()` — what it actually does

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // ...
});
```

`defineConfig()` is a no-op at runtime — it returns its argument unchanged. Its only purpose is to attach the `PlaywrightTestConfig` TypeScript type to your object so your IDE autocompletes fields and catches typos. You can technically write:

```typescript
export default { testDir: "./tests" }; // works, but no type checking
```

It will execute identically but every config field becomes `any`, and every typo becomes a silent runtime failure. Always use `defineConfig()`.

### 1.3 Config as code — every field is JavaScript

Because the config file is regular TypeScript, you can compute fields at evaluation time:

```typescript
import { defineConfig, devices } from "@playwright/test";
import * as os from "node:os";

const isCI = !!process.env.CI;
const cpuCount = os.cpus().length;

export default defineConfig({
  retries: isCI ? 2 : 0,
  workers: isCI ? Math.min(cpuCount, 4) : undefined, // cap CI to 4 even on big runners
  fullyParallel: !process.env.SERIAL_DEBUG,

  use: {
    baseURL: process.env.APP_URL ?? "http://localhost:3000",
    trace: process.env.PW_TRACE === "on" ? "on" : "retain-on-failure",
  },
});
```

The config evaluates once per Playwright invocation, in the main process before workers spawn. Workers receive the resolved object. Side effects in the config file (e.g., `fs.writeFileSync`) run once, not per worker — but they run synchronously and block test startup, so keep them cheap.

### 1.4 Environment variable interpolation

Playwright does **not** interpolate `${ENV_VAR}` syntax in the config object. Every env reference is plain `process.env.NAME` — full JavaScript. Common patterns:

```typescript
// Fail-fast pattern (recommended for required envs)
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`[config] Missing required env: ${name}`);
  return value;
}

// Layered defaults
const baseURL =
  process.env.APP_URL ?? process.env.STAGING_URL ?? "http://localhost:3000";

// Boolean parsing (process.env values are always strings)
const headless = process.env.HEADLESS !== "false"; // default true, only 'false' disables

// Number parsing with default
const timeout = Number.parseInt(process.env.TIMEOUT_MS ?? "60000", 10);
```

> **Pitfall:** `process.env.SOMETHING` is `undefined` if unset, NOT empty string. Truthy checks (`if (process.env.X)`) are safe; falsy fallbacks (`process.env.X || 'default'`) treat empty string and undefined the same; nullish (`??`) only fallbacks for null/undefined, not empty string.

### 1.5 `dotenv` integration

Playwright does NOT auto-load `.env` files. If you want `.env` support, load it at the top of the config:

```typescript
import "dotenv/config"; // loads .env from CWD
// OR
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // explicit path
dotenv.config({ path: ".env" }); // layered loading

import { defineConfig } from "@playwright/test";
// ... rest of config now has process.env.* populated
```

Layered loading semantics: dotenv only sets a variable if it's not already set. So `.env.local` loaded first wins over `.env` loaded second. To override, pass `{ override: true }`.

### 1.6 Loading order — the complete lifecycle

```
1. Node starts.
2. CLI parses args (--config, --project, --shard, --grep, --workers, etc.).
3. Config file is required(); top-level imports + side effects run.
4. defineConfig({...}) returns the resolved object.
5. Playwright validates the config object (catches type errors at runtime too).
6. CLI args override config fields (e.g., --workers=8 wins over config.workers=4).
7. The list of tests is built (testDir → testMatch → testIgnore → grep → grepInvert).
8. Tests are partitioned across workers.
9. Reporters are instantiated (one set per Playwright invocation, NOT per worker).
10. Workers fork. Each worker re-loads the config file (because it's a separate process).
11. Worker fixtures set up. Tests run. Teardown.
12. Reporter aggregates results. Final exit code.
```

> **Critical implication:** The config file is **re-required in every worker process.** Side effects (file writes, network calls, env mutations) at config top-level execute N+1 times for N workers. Keep config evaluation pure.

### 1.7 Where config CANNOT reach

| You can't put this in the config                     | Why                                                                                             | Where it goes instead            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------- |
| `beforeAll` / `afterAll` hooks                       | Hooks belong to test files                                                                      | `test.beforeAll()` inside a spec |
| Asynchronous setup (`await fetch(...)` at top level) | Config eval is synchronous in older Playwright; even in newer versions it can race fixture init | `globalSetup` or a setup project |
| Per-test data                                        | Config is global                                                                                | Fixtures                         |
| Conditional skip logic                               | Config sees nothing about tests                                                                 | `test.skip()` / `test.fixme()`   |

---

## 2. The complete field reference

Every field of `PlaywrightTestConfig`, alphabetised, with type, default, and notes.

| Field                  | Type                                                                   | Default                               | Notes                                                                                            |
| ---------------------- | ---------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `expect`               | `{ timeout?: number; toHaveScreenshot?: ...; toMatchSnapshot?: ...; }` | `{ timeout: 5_000 }`                  | Assertion retry budget. See [§3](#3-the-4-level-timeout-cascade).                                |
| `forbidOnly`           | `boolean`                                                              | `false`                               | Fail the run if any `test.only()` is present. **Set to `!!process.env.CI`.**                     |
| `fullyParallel`        | `boolean`                                                              | `false`                               | Run tests within a file in parallel, not just across files.                                      |
| `globalSetup`          | `string \| undefined`                                                  | undefined                             | Path to a function that runs once before all workers. Mostly superseded by setup projects.       |
| `globalTeardown`       | `string \| undefined`                                                  | undefined                             | Mirror of `globalSetup`.                                                                         |
| `globalTimeout`        | `number`                                                               | `0` (none)                            | Wall-clock limit for the entire test run (ms). Useful in CI to prevent stuck pipelines.          |
| `grep`                 | `RegExp \| RegExp[]`                                                   | `undefined`                           | Run only tests whose title matches. Combined with `--grep` CLI.                                  |
| `grepInvert`           | `RegExp \| RegExp[]`                                                   | `undefined`                           | Inverse of `grep`.                                                                               |
| `maxFailures`          | `number`                                                               | `0` (no limit)                        | Stop the run after N failures. Useful for fast-fail CI.                                          |
| `metadata`             | `object`                                                               | `{}`                                  | Free-form key/value pairs surfaced in HTML/JSON reports.                                         |
| `name`                 | `string`                                                               | filename                              | Suite name in reporters.                                                                         |
| `outputDir`            | `string`                                                               | `test-results`                        | Where traces, screenshots, videos, downloads land. Per-test subdirs.                             |
| `preserveOutput`       | `'always' \| 'never' \| 'failures-only'`                               | `'always'`                            | Whether to keep `outputDir` content from previous runs.                                          |
| `projects`             | `Project[]`                                                            | `[]`                                  | The core configuration model. See [§7](#7-projects).                                             |
| `quiet`                | `boolean`                                                              | `false`                               | Suppress stdout/stderr from test files.                                                          |
| `repeatEach`           | `number`                                                               | `1`                                   | Run each test N times. Used to surface flakiness (try 50).                                       |
| `reporter`             | `string \| Reporter \| (string \| Reporter)[]`                         | `'list'` (CI: `'dot'`)                | See [§4](#4-reporters).                                                                          |
| `reportSlowTests`      | `{ max: number; threshold: number; } \| null`                          | `{ max: 5, threshold: 15_000 }`       | Surface the N slowest tests over a duration threshold.                                           |
| `respectGitIgnore`     | `boolean`                                                              | `true`                                | Skip files matched by `.gitignore` when scanning for tests.                                      |
| `retries`              | `number`                                                               | `0`                                   | Per-test retry budget.                                                                           |
| `shard`                | `{ current: number; total: number; } \| null`                          | `null`                                | Split the suite into N shards; run shard `current`. Usually set via `--shard`.                   |
| `snapshotDir`          | `string`                                                               | `<spec>-snapshots`                    | Visual regression baseline directory.                                                            |
| `snapshotPathTemplate` | `string`                                                               | OS-dependent                          | Template for snapshot filenames, e.g. `'{snapshotDir}/{projectName}/{testFilePath}/{arg}{ext}'`. |
| `testDir`              | `string`                                                               | `.`                                   | Root for test discovery. Can be relative to config file.                                         |
| `testIgnore`           | `string \| string[]`                                                   | `[]`                                  | Glob patterns to exclude.                                                                        |
| `testMatch`            | `string \| string[]`                                                   | `**/*.@(spec\|test).?(c\|m)[jt]s?(x)` | Glob/regex for what counts as a test file.                                                       |
| `timeout`              | `number`                                                               | `30_000`                              | Per-test wall-clock limit (ms).                                                                  |
| `tsconfig`             | `string`                                                               | nearest `tsconfig.json`               | Resolves `paths` aliases for test files.                                                         |
| `updateSnapshots`      | `'all' \| 'changed' \| 'missing' \| 'none' \| 'default'`                | `'default'`                           | What `--update-snapshots` does. `'default'` creates missing snapshots but FAILS those tests (so CI can't pass silently); `'missing'` creates them and passes. Verified on 1.64.1.                                                                  |
| `use`                  | `Use`                                                                  | `{}`                                  | Default fixture options. See [§5](#5-the-use-block).                                             |
| `webServer`            | `WebServer \| WebServer[]`                                             | `undefined`                           | Spin up an app server before tests, kill it after.                                               |
| `workers`              | `number \| string`                                                     | `os.cpus().length / 2`, capped at 50% | Parallel worker process count. Accepts `'50%'`.                                                  |

### 2.1 Field interaction matrix

Some fields combine in non-obvious ways. The most important:

| Field A                               | Field B                           | Effect                                                                                                |
| ------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `workers > 1`                         | `fullyParallel: false`            | Files run in parallel; tests within a file run serially.                                              |
| `workers > 1`                         | `fullyParallel: true`             | Both files AND tests within files run in parallel.                                                    |
| `retries > 0`                         | `repeatEach > 1`                  | Each repeat gets its own retry budget — `repeatEach × (1 + retries)` runs max per test.               |
| `retries > 0`                         | `test.describe.serial()`          | If any test in the serial block fails, ALL tests in the block are retried (not just the failing one). |
| `shard`                               | `grep`                            | Sharding applies AFTER grep; small grep + sharding can leave some shards empty.                       |
| `globalSetup`                         | `dependencies` on a setup project | Both run; `globalSetup` first, then setup project, then dependent projects.                           |
| `webServer.reuseExistingServer: true` | CI environment                    | Set to `!process.env.CI` — never reuse on a clean CI runner.                                          |

### 2.2 The `webServer` field

Often the easiest way to test against a local app without managing it externally.

```typescript
webServer: [
  {
    command: 'npm run start:backend',
    port: 4000,
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL! },
  },
  {
    command: 'npm run start:frontend',
    url: 'http://localhost:3000/health',   // wait for this URL to return 2xx
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
],
```

Either `port` (TCP probe) or `url` (HTTP GET) — never both. `url` is more reliable because it waits for application-level readiness, not just socket open. The TCP probe will succeed as soon as the process binds, before the app is ready to serve requests.

`reuseExistingServer: true` makes dev iteration fast — the server stays up between test runs. Always `false` in CI to avoid "works on my machine" caused by leftover state.

### 2.3 `metadata` — propagating context to reports

The `metadata` object appears verbatim in HTML and JSON reports. Use it for environment fingerprinting:

```typescript
metadata: {
  environment: process.env.ENV ?? 'local',
  appVersion:  process.env.APP_VERSION ?? 'unknown',
  ciBuildId:   process.env.GITHUB_RUN_ID ?? null,
  triggeredBy: process.env.GITHUB_ACTOR ?? null,
  gitSha:      process.env.GITHUB_SHA?.slice(0, 8) ?? null,
},
```

Custom reporters (see [§4.5](#45-the-custom-reporter-api)) receive metadata in `onBegin(config, suite)` via `config.metadata`. Pipe it to Splunk/Datadog/Sentry tags so failures can be aggregated by environment, version, or commit.

---

## 3. The 4-level timeout cascade

Playwright timeouts compose. Understanding which one fires is essential to debugging "test failed at 30s" messages.

### 3.1 The hierarchy

| Level | Field                   | Default    | Scope                                                                                    |
| ----- | ----------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| 1     | `timeout`               | 30_000 ms  | Entire test body, including beforeEach + afterEach + fixture setup                       |
| 2     | `expect.timeout`        | 5_000 ms   | A single `expect(locator).toX()` retry budget                                            |
| 3     | `use.actionTimeout`     | 0 (no cap) | A single action: `click()`, `fill()`, `type()`, `check()`, `selectOption()`, etc.        |
| 4     | `use.navigationTimeout` | 30_000 ms  | `page.goto()`, `page.reload()`, `page.waitForURL()`, `page.goBack()`, `page.goForward()` |

### 3.2 Concrete timing diagram

A test that does login → assertion → click → assertion with default timeouts:

```
0s                              30s (timeout)
├─────────────────────────────────┤
│
├── page.goto('/login')               ← bounded by navigationTimeout (30s)
│   └── 0s ────── 30s
│
├── locator.fill('admin')             ← bounded by actionTimeout (0 = uses test timeout)
│
├── expect(locator).toHaveText(...)   ← bounded by expect.timeout (5s)
│   └── 0s ── 5s
│
├── locator.click()                   ← bounded by actionTimeout
│
└── expect(page).toHaveURL(/dashboard/) ← bounded by expect.timeout (5s)
    └── 0s ── 5s
```

If the test runs for 31 s total, you'll see: `Test timeout of 30000ms exceeded.` even if every individual assertion was under its own budget. The test timeout is the **wall clock**.

### 3.3 When each timeout fires — error messages decoded

| Error                                                                      | Which timeout                         |
| -------------------------------------------------------------------------- | ------------------------------------- |
| `Test timeout of 30000ms exceeded.`                                        | Level 1 (`timeout`)                   |
| `Timeout 5000ms exceeded while waiting for expect(received).toBeVisible()` | Level 2 (`expect.timeout`)            |
| `locator.click: Timeout 15000ms exceeded.`                                 | Level 3 (`use.actionTimeout`)         |
| `page.goto: Timeout 30000ms exceeded.`                                     | Level 4 (`use.navigationTimeout`)     |
| `Test timeout of 30000ms exceeded while running "afterEach" hook.`         | Level 1, but charged to afterEach     |
| `Test timeout of 30000ms exceeded while setting up "page".`                | Level 1, fixture setup ate the budget |

### 3.4 Per-test overrides

```typescript
test("long-running data import", async ({ page }) => {
  test.slow(); // 3× the default timeout
  // OR
  test.setTimeout(120_000); // explicit override

  await page.goto("/admin/import");
  await page.locator("#csv").setInputFiles("huge.csv");
  await expect(page.locator(".progress-done")).toBeVisible({ timeout: 90_000 });
});
```

`test.slow()` is a soft tag — it gives you 3× budget AND shows up in the HTML report's "slow tests" section so you can plan to optimise it.

### 3.5 Per-assertion overrides

```typescript
// Default 5s — fine for fast assertions
await expect(page.locator(".button")).toBeVisible();

// 30s — for D365 spinner waits
await expect(page.locator(".ms-Spinner")).toHaveCount(0, { timeout: 30_000 });

// 0 — disable the retry budget entirely; use for "must be true RIGHT NOW"
await expect(page.locator(".error")).not.toBeVisible({ timeout: 0 });
```

`{ timeout: 0 }` is rarely correct. It's an instant snapshot — if the DOM hasn't rendered yet, it fails. Use it only when you genuinely want a single-shot check (e.g., asserting an element is NOT visible immediately after navigation).

### 3.6 `actionTimeout: 0` is special

The default `actionTimeout` is `0`, which means "no cap" — actions fall through to the test-level `timeout`. This is the right default because:

- If you set `actionTimeout: 5_000`, a slow click on a real-world site (loading a heavy SPA) fails with a confusing "click timeout" message.
- The test timeout already bounds total runtime, so individual actions don't need their own clock.

Set `actionTimeout` explicitly when:

- You have many actions per test and want to fail fast on a specific stuck step (e.g., `actionTimeout: 15_000` for 10 actions in a 60s test budget).
- You're running in an unreliable network environment and want to fail individual actions rather than hang the whole test.

### 3.7 `expect.toHaveScreenshot` and `toMatchSnapshot`

These visual assertions have their own sub-timeout:

```typescript
expect: {
  timeout: 5_000,             // default for all assertions
  toHaveScreenshot: {
    maxDiffPixelRatio: 0.02,
    threshold: 0.2,
    animations: 'disabled',
    caret: 'hide',
  },
  toMatchSnapshot: { threshold: 0.2 },
},
```

Visual assertions auto-retry up to `expect.timeout` like other assertions, but the retry compares fresh screenshots each time — so a 5s timeout on a slow-rendering page can capture pre-render snapshots and false-positive fail. Increase to 15–30s for SPAs.

### 3.8 Real timing scenario — diagnosing a 30s test failure

Symptom: A login test fails with `Test timeout of 30000ms exceeded.` after exactly 30 seconds.

Diagnostic path:

1. Check the trace: `npx playwright show-trace test-results/<test>/trace.zip`. The trace timeline shows where time was spent.
2. Look at the last completed action. If it's `page.goto('/login')` at 28s, your network is slow or the page is heavy — increase `navigationTimeout` or fix the page.
3. If the last action is `locator.fill()` and there's a 25s gap before it, an earlier `expect()` is silently retrying — check the assertion's effective timeout.
4. If `beforeEach` ate 15s, your auth fixture is the bottleneck. Move it to worker scope.

The trace's timing chart is the single most useful debugging tool in Playwright — every reference doc on this site points at it for a reason.

---

## 4. Reporters

Reporters consume the test event stream and produce output. Playwright ships 8 built-in reporters and a TypeScript interface for custom ones.

### 4.1 The built-in reporters

| Name     | Output target      | Format                                                             | Default in                         |
| -------- | ------------------ | ------------------------------------------------------------------ | ---------------------------------- |
| `list`   | stdout             | One line per test, with status + duration                          | Local dev                          |
| `dot`    | stdout             | One character per test (`·` pass, `F` fail, `T` timeout, `°` skip) | CI                                 |
| `line`   | stdout             | Single updating line with running stats                            | Long CI runs where stdout is noisy |
| `html`   | filesystem         | Interactive HTML report with trace links, screenshots, video       | All environments                   |
| `json`   | filesystem         | Machine-readable JSON of all results                               | Analytics pipelines                |
| `junit`  | filesystem         | JUnit XML (Jenkins, Azure DevOps, GitLab CI)                       | Legacy CI dashboards               |
| `blob`   | filesystem         | Intermediate format for merge across shards                        | Sharded CI                         |
| `null`   | none               | No output                                                          | Programmatic / agent use           |
| `github` | GitHub Actions log | Annotations + log groups                                           | Inside a GitHub Actions workflow   |

### 4.2 Configuration syntax

A reporter is `string` (use defaults), `[string, options]` (named with config), or an array of either:

```typescript
reporter: 'list',                              // single reporter, defaults

reporter: ['list', { printSteps: true }],      // single reporter with options

reporter: [                                    // multiple reporters
  ['list'],
  ['html', { outputFolder: 'playwright-report', open: 'never', host: '0.0.0.0', port: 9323 }],
  ['junit', { outputFile: 'test-results/junit.xml', stripANSIControlSequences: true }],
  ['json', { outputFile: 'test-results/results.json' }],
  ['blob', { outputDir: 'blob-report' }],      // for sharded CI; merge with `merge-reports`
  ['./custom-reporter.ts'],                    // your own reporter
],
```

### 4.3 Reporter-specific options

#### 4.3.1 `list`

```typescript
[
  "list",
  {
    printSteps: false, // print each test.step() — verbose
  },
];
```

#### 4.3.2 `html`

```typescript
[
  "html",
  {
    outputFolder: "playwright-report", // default
    open: "on-failure", // 'always' | 'never' | 'on-failure' (default)
    host: "127.0.0.1", // host to bind when running show-report
    port: 9323, // port for show-report
    attachmentsBaseURL: "", // CDN/S3 base if you upload attachments separately
  },
];
```

The HTML report includes:

- Trace files (clickable to open in browser viewer)
- Screenshots at failure
- Video recordings
- `console.log` output per test
- Network HAR if captured
- Step timing chart
- Per-test attachments via `testInfo.attach()`

It's static — you can commit it to a GitHub Pages branch for review across the team.

#### 4.3.3 `junit`

```typescript
[
  "junit",
  {
    outputFile: "test-results/junit.xml",
    stripANSIControlSequences: true, // recommended — colours break some XML parsers
    includeProjectInTestName: true, // adds [project] prefix to test names
    embedAttachmentsAsProperty: "attachments", // attach screenshots into XML as base64
    embedAnnotationsAsProperty: "annotations",
  },
];
```

The JUnit XML format is well-defined but not extensible. Many CI dashboards only render the basics (suite, name, status, duration, failure message). Embed attachments only if your CI consumes them.

#### 4.3.4 `json`

```typescript
["json", { outputFile: "test-results/results.json" }];
```

The JSON output includes the full event tree, attachments, errors, retries, and step timing — everything the HTML report has. Use it for custom analytics:

```typescript
// scripts/analyse-failures.ts
import results from "./test-results/results.json";
const flakyTests = results.suites
  .flatMap((s) => s.specs)
  .filter((spec) =>
    spec.tests.some((t) =>
      t.results.some((r) => r.retry > 0 && r.status === "passed"),
    ),
  );
```

#### 4.3.5 `blob` — for sharded CI

When you shard, each shard produces a separate JSON. The `blob` reporter writes a binary format optimised for merging. After all shards complete:

```bash
npx playwright merge-reports --reporter=html ./all-blob-reports
```

This produces a single HTML report covering all shards. The merged report shows tests in the order they appear in `testDir`, not the order they ran.

### 4.4 Reporter selection logic

The default reporter depends on environment:

```typescript
// Playwright source equivalent (simplified):
if (process.env.CI) {
  reporter = "dot";
} else {
  reporter = "list";
}
```

CI gets `dot` because long stdout (one line per test × 500 tests) burdens log storage and is hard to scroll. Local dev gets `list` because you want to see test names.

You almost always override this. Production-grade default:

```typescript
reporter: [
  ['list'],                                                          // human-readable
  ['html', { outputFolder: 'playwright-report', open: 'never' }],    // post-mortem
  ['junit', { outputFile: 'test-results/junit.xml' }],               // CI dashboard
],
```

### 4.5 The custom reporter API

A reporter implements the `Reporter` interface from `@playwright/test/reporter`:

```typescript
// reporters/console-tagger.ts
import type {
  Reporter,
  FullConfig,
  FullResult,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from "@playwright/test/reporter";

class ConsoleTagger implements Reporter {
  private startTime = 0;

  onBegin(config: FullConfig, suite: Suite): void {
    this.startTime = Date.now();
    const total = suite.allTests().length;
    console.log(
      `▶ Starting ${total} tests across ${config.projects.length} projects`,
    );
    console.log(
      `▶ Environment: ${(config.metadata as { environment?: string }).environment ?? "unknown"}`,
    );
  }

  onTestBegin(test: TestCase): void {
    console.log(`  ▷ ${test.titlePath().join(" › ")}`);
  }

  onStepBegin(test: TestCase, result: TestResult, step: TestStep): void {
    if (step.category === "test.step") {
      console.log(`     ⤷ ${step.title}`);
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const status = result.status === "passed" ? "✓" : "✗";
    const duration = `${result.duration}ms`;
    console.log(
      `  ${status} ${test.title} (${duration}, retry ${result.retry})`,
    );

    if (result.status === "failed") {
      for (const error of result.errors) {
        console.log(`     ${error.message}`);
      }
    }
  }

  onEnd(result: FullResult): void | Promise<void> {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log(`▶ Done in ${elapsed}s — ${result.status}`);
  }

  // Optional — for streaming attachment uploads, telemetry, etc.
  onError(error: TestError): void {
    console.error(`ERROR (config-level): ${error.message}`);
  }

  // Optional — control output flush
  printsToStdio(): boolean {
    return true;
  }
}

export default ConsoleTagger;
```

Register it:

```typescript
reporter: [['./reporters/console-tagger.ts']],
```

### 4.6 Reporter event order

For a single test, events fire in this order:

```
onBegin(config, suite)                  ← once per run, before any test
onTestBegin(test, result)               ← once per test attempt
  onStepBegin(test, result, step)       ← potentially many per test
    onStdOut(chunk, test, result)       ← console.log from the test
    onStdErr(chunk, test, result)       ← console.error from the test
  onStepEnd(test, result, step)
onTestEnd(test, result)
onEnd(result)                           ← once per run, after all tests
```

If a test is retried, `onTestBegin → onTestEnd` fires once per retry, with `result.retry` incrementing.

### 4.7 Custom reporter use cases

| Use case                            | Reporter responsibility                                                                |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| Slack notifications on failure      | `onEnd` — POST to Slack webhook with failed test summary                               |
| Failed-test screenshot upload to S3 | `onTestEnd` — when `result.status === 'failed'`, find attachments and upload           |
| Flakiness dashboard                 | `onTestEnd` — when `result.retry > 0 && result.status === 'passed'`, POST to analytics |
| Datadog test runs                   | `onTestEnd` — emit metrics + tags from `config.metadata`                               |
| GitHub PR comment                   | `onEnd` — collect failures, post via `gh pr comment`                                   |
| Live LED build status               | `onTestBegin/End` — toggle GPIO via MQTT                                               |

The full Reporter interface is exported from `@playwright/test/reporter` — see [framework/CAP_C2_Custom_Reporter](../../challenges/CAP_C2_Custom_Reporter.md) for a portfolio-grade implementation.

---

## 5. The `use{}` block

The `use` field is the default set of fixture options applied to every test, every project. Project-level `use` merges over it (project wins on conflict).

### 5.1 The complete field list

```typescript
use: {
  // ── Browser ────────────────────────────────────────────────────────────
  headless: true,                            // boolean
  viewport: { width: 1440, height: 900 },    // { width, height } | null (use window size)
  deviceScaleFactor: 1,                      // number — for retina/HiDPI simulation
  isMobile: false,                           // boolean — affects meta viewport, touch events
  hasTouch: false,                           // boolean — enables touch event dispatch
  defaultBrowserType: 'chromium',            // 'chromium' | 'firefox' | 'webkit'
  channel: undefined,                        // 'chrome' | 'msedge' | 'chrome-beta' | 'msedge-beta' | 'chrome-dev'
  userAgent: undefined,                      // string — overrides browser default
  locale: 'en-US',                           // string — affects Accept-Language, Date.toLocaleString, etc.
  timezoneId: 'America/Los_Angeles',         // string — affects Date.getTimezoneOffset, server-side timestamps
  geolocation: { longitude: -122.4194, latitude: 37.7749 },
  permissions: ['geolocation', 'clipboard-read', 'clipboard-write', 'notifications'],
  colorScheme: 'light',                      // 'light' | 'dark' | 'no-preference' — prefers-color-scheme media query
  reducedMotion: 'no-preference',            // 'reduce' | 'no-preference' — prefers-reduced-motion
  forcedColors: 'none',                      // 'active' | 'none' — Windows high-contrast simulation

  // ── Network ────────────────────────────────────────────────────────────
  baseURL: 'https://app.example.com',
  extraHTTPHeaders: { 'x-test-run': 'true', 'x-correlation-id': process.env.RUN_ID! },
  httpCredentials: { username: 'user', password: 'pass' },   // HTTP Basic Auth
  ignoreHTTPSErrors: false,                  // accept self-signed certs (test envs only)
  offline: false,                            // simulate offline state
  proxy: { server: 'http://proxy.corp:8080', bypass: 'localhost', username: '', password: '' },
  serviceWorkers: 'allow',                   // 'allow' | 'block' — block to test SW-less behaviour

  // ── Timeouts ───────────────────────────────────────────────────────────
  actionTimeout: 0,                          // 0 = no cap (use test timeout)
  navigationTimeout: 30_000,

  // ── Artifacts ──────────────────────────────────────────────────────────
  screenshot: 'only-on-failure',             // 'off' | 'on' | 'only-on-failure'
  video: 'retain-on-failure',                // 'off' | 'on' | 'retain-on-failure' | 'on-first-retry' | { mode, size }
  trace: 'retain-on-failure',                // see §6

  // ── Locators ───────────────────────────────────────────────────────────
  testIdAttribute: 'data-testid',            // change to 'data-automation-id' for D365 etc.

  // ── Auth ───────────────────────────────────────────────────────────────
  storageState: 'auth-states/admin.json',    // path | { cookies, origins }
  clientCertificates: [
    {
      origin: 'https://api.example.com',
      certPath: 'certs/client.crt',
      keyPath: 'certs/client.key',
      passphrase: process.env.MTLS_PASSPHRASE,
      pfxPath: undefined,                    // alternative to cert+key — single PKCS#12 bundle
    },
  ],

  // ── Internal — for advanced use ────────────────────────────────────────
  bypassCSP: false,                          // bypass Content Security Policy (for injecting test scripts)
  javaScriptEnabled: true,                   // disable JS — for accessibility/SEO smoke tests
  acceptDownloads: true,                     // false → page.waitForEvent('download') will time out
  contextOptions: { /* advanced — passed directly to browser.newContext() */ },
  launchOptions: { /* advanced — passed to browser.launch() */ },
  connectOptions: { /* if connecting to a remote browser */ },
},
```

### 5.2 `use` merging algorithm

When a project specifies `use`, Playwright merges it over the root `use` field by **shallow override**:

```typescript
// Root
use: {
  baseURL: 'https://staging.example.com',
  extraHTTPHeaders: { 'x-env': 'staging' },
  trace: 'retain-on-failure',
}

// Project
projects: [{
  name: 'chromium',
  use: {
    baseURL: 'https://production.example.com',     // overrides root
    extraHTTPHeaders: { 'x-project': 'chromium' }, // REPLACES root headers entirely!
  }
}]

// Effective use for the chromium project:
{
  baseURL: 'https://production.example.com',
  extraHTTPHeaders: { 'x-project': 'chromium' },    // 'x-env' is GONE
  trace: 'retain-on-failure',
}
```

> **Critical pitfall:** `extraHTTPHeaders` is a single object, and shallow merge replaces it whole. If you set headers at root AND project level, the root headers are silently dropped in that project. To merge, use a helper:

```typescript
const commonHeaders = {
  "x-env": process.env.ENV!,
  "x-correlation-id": process.env.RUN_ID!,
};

projects: [
  {
    name: "chromium",
    use: {
      extraHTTPHeaders: { ...commonHeaders, "x-project": "chromium" },
    },
  },
];
```

### 5.3 Device emulation — what `devices['Desktop Chrome']` actually contains

```typescript
import { devices } from "@playwright/test";

console.log(devices["Desktop Chrome"]);
// {
//   userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ...',
//   viewport: { width: 1280, height: 720 },
//   deviceScaleFactor: 1,
//   isMobile: false,
//   hasTouch: false,
//   defaultBrowserType: 'chromium',
// }

console.log(devices["iPhone 13"]);
// {
//   userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 ...)',
//   viewport: { width: 390, height: 664 },
//   deviceScaleFactor: 3,
//   isMobile: true,
//   hasTouch: true,
//   defaultBrowserType: 'webkit',
// }
```

When you spread `...devices['iPhone 13']`, you get all six fields. To override one:

```typescript
{ name: 'iphone-landscape', use: { ...devices['iPhone 13'], viewport: { width: 664, height: 390 } } }
```

Available devices list: see `node_modules/playwright-core/lib/server/deviceDescriptorsSource.json` — there are ~130 device presets covering iPhones, iPads, Pixel, Galaxy, Surface, Kindle, and a few feature phones.

### 5.4 Device emulation accuracy — what's faked vs real

| Aspect                       | Real device | Playwright emulation                                       |
| ---------------------------- | ----------- | ---------------------------------------------------------- |
| Viewport size                | Native      | ✅ Identical                                               |
| User agent string            | Native      | ✅ Identical                                               |
| `navigator.platform`         | `iPhone`    | ⚠️ Reports `MacIntel` on macOS host (Chromium fingerprint) |
| Touch events                 | Native      | ✅ Dispatched as touch when `hasTouch: true`               |
| Pinch / multi-touch gestures | Native      | ❌ Cannot simulate multi-touch (Playwright limitation)     |
| GPS / sensor APIs            | Native      | ⚠️ `geolocation` static only; no accelerometer             |
| Network conditions (3G, 4G)  | Native      | ⚠️ Not built in; use `route.continue({ delay })`           |
| Battery / vibration API      | Native      | ❌ Not emulated                                            |
| App-store-installed PWAs     | Native      | ❌ Browser only — not the PWA shell                        |
| Safari quirks (WebKit)       | Native      | ✅ Real WebKit (not Chromium with UA spoofing)             |

> **Implication:** Device emulation is great for layout testing and basic touch interaction. It is **not** a substitute for real-device testing for performance, sensor APIs, or PWA shell behaviour. For that, use a device farm (BrowserStack, Sauce Labs, AWS Device Farm) — see [`./14_tool_comparison.md`](./14_tool_comparison.md).

### 5.5 `launchOptions` and `contextOptions` escape hatches

When `use` doesn't expose a field you need, you can drop directly into browser launch / context options:

```typescript
use: {
  launchOptions: {
    args: ['--disable-web-security', '--disable-features=BlockInsecurePrivateNetworkRequests'],
    slowMo: 100,                          // throttle every action by 100ms — debug only
    // devtools: true  — REMOVED from launch options (no longer compiles); use `npx playwright test --debug` or `PWDEBUG=1`
    handleSIGINT: false,                  // let your own SIGINT handler run
  },
  contextOptions: {
    permissions: ['camera', 'microphone'],
    recordHar: { path: 'trace.har', mode: 'minimal' },
  },
},
```

These pass through to `browser.launch(options)` and `browser.newContext(options)` respectively. Anything Playwright exposes at the browser API level is reachable here.

---

## 6. Trace internals

The trace file is the single most valuable test artifact Playwright produces. Understanding what's in it explains both the cost and the debugging power.

### 6.1 Trace modes — when files are written

| Mode                  | Trace written when      | Cost per test                   |
| --------------------- | ----------------------- | ------------------------------- |
| `'off'`               | Never                   | 0 KB, 0 ms                      |
| `'on'`                | Every test              | 100 KB–10 MB, +50–200 ms        |
| `'on-first-retry'`    | Only on retried runs    | Cost only on retries            |
| `'retain-on-failure'` | Only kept if test fails | Always written, deleted on pass |
| `'on-all-retries'`    | Every retry attempt     | Cost per retry                  |

`'retain-on-failure'` actually writes the trace on every test (so it can be retained if needed), then deletes it on pass. This adds the recording cost to every test, but you only pay disk storage for failures. Almost always the right CI default.

`'on'` is for local debugging — never for CI, where it can produce gigabytes of artifacts.

### 6.2 What's inside a trace file (`trace.zip`)

A trace zip contains:

| File              | Contents                                                               | Typical size |
| ----------------- | ---------------------------------------------------------------------- | ------------ |
| `0-trace.network` | All network events: request URL, method, status, response size, timing | 5–500 KB     |
| `0-trace.stacks`  | Stack traces for every Playwright API call                             | 1–50 KB      |
| `0-trace.trace`   | The event log: action start/end, navigation, console messages          | 50 KB–2 MB   |
| `*.png`           | Screenshots before and after every action (low-res)                    | 5–50 KB each |
| `0.snapshot`      | DOM snapshots at every action — enables time-travel inspection         | 100 KB–5 MB  |
| `resources/*`     | Embedded CSS, fonts, images for the snapshots                          | 50 KB–5 MB   |

A typical short test produces a ~200 KB trace. A long test with many DOM snapshots can hit 50 MB.

### 6.3 Trace lifecycle — when each event is captured

The trace records:

1. **Every Playwright API call** — `page.click()`, `page.locator()`, `expect()`, etc. with arguments, timing, and stack trace.
2. **Every navigation** — URL, status, redirects, response size.
3. **Every network request** — including request/response bodies (truncated if huge).
4. **Console messages** — log/info/warn/error from the page, with source location.
5. **Page errors** — uncaught exceptions from the page.
6. **DOM snapshots** — taken before AND after every action, plus on navigation.
7. **Screenshots** — taken before AND after every action (low-res).
8. **Source code locations** — Playwright reads your spec file source and includes line/column info.

### 6.4 The viewer — what you can do with a trace

```bash
npx playwright show-trace test-results/<test-id>/trace.zip
```

The viewer opens in your browser (port 8000 by default — pass `--port=N` to change). You can:

| Tab               | What it shows                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| Actions           | Step-by-step list of every Playwright call. Click any action to time-travel to that moment.      |
| Snapshot (Action) | Live DOM as it was right before the action. **Pickable** — hover any element to see its locator. |
| Snapshot (After)  | Live DOM right after the action. Comparing before/after shows what changed.                      |
| Source            | Your spec file at the line that produced the selected action.                                    |
| Console           | All console messages from the page, with timestamps.                                             |
| Network           | Waterfall of every request, with status, size, and timing.                                       |
| Errors            | Stack traces from page-side errors.                                                              |
| Metadata          | Test name, project, retry count, browser version, viewport, ...                                  |

### 6.5 Trace size optimization

For high-volume CI suites, trace size matters. Options:

```typescript
use: {
  trace: {
    mode: 'retain-on-failure',
    screenshots: false,                   // skip per-action screenshots (smaller traces)
    snapshots: true,
    sources: false,                       // skip embedding source code
  },
},
```

`screenshots: false` typically cuts trace size by 50–80% but makes the viewer's before/after comparison much harder. `sources: false` saves a few KB and is reasonable if you only inspect traces in a CI artifact viewer.

### 6.6 Trace performance impact

Measured on a 30-action test:

| Trace mode               | Test wall-clock | Disk write  |
| ------------------------ | --------------- | ----------- |
| `'off'`                  | 6.0 s           | 0           |
| `'retain-on-failure'`    | 6.2 s (+3%)     | 0 (on pass) |
| `'on'`                   | 6.4 s (+7%)     | ~250 KB     |
| `'on'` + heavy snapshots | 7.5 s (+25%)    | ~5 MB       |

The 3% retain-on-failure overhead is the price you pay for being able to debug any future failure. Always worth it in CI.

---

## 7. Projects

The `projects` array is where Playwright's flexibility lives. Each project is a separate test configuration — its own `testDir`, `use`, `name`, optional `dependencies` and `teardown` — that produces an independent run.

### 7.1 What a project actually is

```typescript
projects: [
  {
    name: 'chromium',                     // unique identifier
    testDir: './tests/web',               // overrides root testDir
    testMatch: /.*\.spec\.ts$/,           // overrides root testMatch
    testIgnore: ['**/legacy/**'],         // adds to root testIgnore
    use: { ...devices['Desktop Chrome'] }, // merges over root use
    grep: /@smoke/,                       // run only @smoke-tagged tests in this project
    grepInvert: /@flaky/,
    timeout: 90_000,                      // overrides root timeout (in this project only)
    expect: { timeout: 10_000 },          // overrides root expect.timeout
    retries: 3,                           // overrides root retries
    repeatEach: 1,                        // overrides root repeatEach
    dependencies: ['setup'],              // run these projects first
    teardown: 'cleanup',                  // run this project after, even on failure
    metadata: { layer: 'smoke' },
  },
],
```

### 7.2 Resolution algorithm — how Playwright picks tests for each project

For every project:

1. Start with `testDir` (project-level or fallback to root).
2. Filter by `testMatch` (project-level or root).
3. Subtract `testIgnore` (project + root, both apply).
4. Apply `grep` (project-level intersected with `--grep` CLI flag).
5. Apply `grepInvert`.
6. Tag each test with the project name. The same spec file can run under multiple projects — each is a separate test in the report.

A test running under both `chromium` and `firefox` projects shows up as two test instances. They're independent — one can pass while the other fails.

### 7.3 The project dependency graph

`dependencies: ['setup']` means "run all tests in the `setup` project before running tests in this project". This is how shared authentication works.

```typescript
projects: [
  {
    name: 'setup',
    testMatch: /global\.setup\.ts$/,
  },
  {
    name: 'admin-tests',
    dependencies: ['setup'],
    use: { storageState: 'auth-states/admin.json' },
    testDir: './tests/admin',
  },
  {
    name: 'user-tests',
    dependencies: ['setup'],
    use: { storageState: 'auth-states/user.json' },
    testDir: './tests/user',
  },
  {
    name: 'api-tests',
    testDir: './tests/api',                    // no dependency — runs in parallel with setup
  },
],
```

Run order:

```
Time →
setup ──┐
        ├─→ admin-tests ┐
        │               │
        └─→ user-tests ─┤
                        │
api-tests ──────────────┴─→ done
```

`setup` and `api-tests` start simultaneously (api-tests has no dependency). After `setup` finishes, `admin-tests` and `user-tests` start. Workers are shared across all running projects.

### 7.4 Setup failure semantics

If the `setup` project fails:

- All projects that depend on it are **not run** (status: `did not run`).
- Projects without that dependency continue normally.
- Exit code is non-zero — CI fails the build.

This is the right behaviour: there's no point running tests that depend on a logged-in state when login failed.

### 7.5 `teardown` projects

The `teardown` field on a project runs another project's tests **after** the current project completes, regardless of pass/fail.

```typescript
projects: [
  {
    name: 'chromium',
    teardown: 'cleanup',                      // ← runs the 'cleanup' project after chromium
  },
  {
    name: 'cleanup',
    testMatch: /global\.teardown\.ts$/,
  },
],
```

Use cases:

- Delete test data created during the run
- Send a summary notification
- Reset a database to a known state

`teardown` projects always run, even if the parent project fails. They're skipped only if the project itself was skipped (e.g., its dependency failed).

### 7.6 Project filtering at the CLI

```bash
npx playwright test --project=chromium               # run only chromium
npx playwright test --project=chromium --project=api # run multiple
npx playwright test --project="!firefox"             # run all except firefox
```

The `--project` flag overrides any `grep` in the config. Dependencies are still automatically included — `--project=admin-tests` will also run `setup`.

### 7.7 Real-world project patterns

#### Pattern A — Cross-browser matrix

```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome']  } },
  { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit',   use: { ...devices['Desktop Safari']  } },
],
```

Same tests, three browsers. Useful for cross-browser regression.

#### Pattern B — Tag-driven subsets

```typescript
projects: [
  { name: 'smoke',      grep: /@smoke/,      retries: 0 },
  { name: 'regression', grep: /@regression/, retries: 2 },
  { name: 'nightly',    grep: /@nightly/,    timeout: 300_000 },
],
```

Run in CI as `--project=smoke` on PRs, `--project=regression` on main, `--project=nightly` on a schedule.

#### Pattern C — App matrix

```typescript
projects: [
  { name: 'crm',     testDir: './tests/crm',     use: { baseURL: env.CRM_URL    } },
  { name: 'portal',  testDir: './tests/portal',  use: { baseURL: env.PORTAL_URL } },
  { name: 'mobile',  testDir: './tests/mobile',  use: { ...devices['iPhone 13'] } },
],
```

Different apps, different baseURLs, sometimes different devices.

#### Pattern D — Setup + Teardown

```typescript
projects: [
  { name: 'setup',    testMatch: /global\.setup\.ts$/ },
  { name: 'chromium', dependencies: ['setup'], teardown: 'cleanup',
    use: { storageState: 'auth.json' } },
  { name: 'cleanup',  testMatch: /global\.teardown\.ts$/ },
],
```

#### Pattern E — Authenticated + Unauthenticated split

```typescript
projects: [
  { name: 'setup', testMatch: /global\.setup\.ts$/ },
  { name: 'authenticated',
    dependencies: ['setup'],
    use: { storageState: 'auth.json' },
    testIgnore: '**/unauth.spec.ts' },
  { name: 'unauthenticated',
    testMatch: '**/unauth.spec.ts',
    use: { storageState: { cookies: [], origins: [] } } },   // empty state
],
```

---

## 8. `globalSetup` vs setup project

Both run code before tests. The setup project pattern is newer and almost always better. The full comparison:

|                                    | `globalSetup`                                 | Setup project (`dependencies: ['setup']`)            |
| ---------------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| Introduced in                      | v1.0                                          | v1.31 (March 2023)                                   |
| Runs in                            | One isolated Node process, before any workers | A regular Playwright test                            |
| Number of files                    | 1 function, exported as default               | N test files in a project                            |
| Access to fixtures                 | ❌ Only `process.env` and `fs`                | ✅ Full `page`, `request`, custom fixtures           |
| Retries on failure                 | ❌ Single attempt                             | ✅ Uses project `retries` setting                    |
| Visible in HTML report             | ❌ Hidden                                     | ✅ Shows as a test with steps + screenshots + trace  |
| Captures trace                     | ❌ Never                                      | ✅ Per project's trace setting                       |
| Can mutate `process.env` for tests | ✅ Yes — exports apply to workers             | ⚠️ No — runs in separate process from test workers   |
| Can write `storageState`           | ✅ Via `context.storageState({ path })`       | ✅ Via `context.storageState({ path })`              |
| Can parallelise multi-step setup   | ❌ Single function, single thread             | ✅ Multiple setup tests, parallel within the project |
| Skippable per-test                 | ❌ Always runs                                | ✅ Skip the entire project with `--project=!setup`   |
| Use for environment validation     | ✅ Good fit                                   | ✅ Also good                                         |
| Use for UI login                   | ⚠️ Verbose, no retries                        | ✅ Idiomatic                                         |
| Use for cache warming              | ✅ Good fit                                   | ⚠️ Overkill                                          |
| Use for one-shot env mutation      | ✅ Only choice                                | ❌ Can't mutate the test workers' env                |

### 8.1 The `globalSetup` signature

```typescript
// global.setup.ts
import { type FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig): Promise<void | (() => void)> {
  console.log(`Setting up ${config.projects.length} projects`);

  // Optional — return a function that runs as teardown
  return async () => {
    console.log("Tearing down");
  };
}

export default globalSetup;
```

Reference it in `playwright.config.ts`:

```typescript
import { defineConfig } from "@playwright/test";
export default defineConfig({
  globalSetup: require.resolve("./global.setup.ts"),
  // ...
});
```

### 8.2 The setup project pattern

```typescript
// global.setup.ts (a spec file, not a function!)
import { test as setup, expect } from "@playwright/test";

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/dashboard/);
  await page.context().storageState({ path: "auth-states/admin.json" });
});

setup("authenticate as user", async ({ page }) => {
  // ... different credentials
  await page.context().storageState({ path: "auth-states/user.json" });
});
```

These run in parallel within the setup project (because they're independent tests in the same file). The result is two storage state files, ready for the dependent projects.

### 8.3 When to keep `globalSetup`

The one case where `globalSetup` is uniquely useful: when you need to mutate `process.env` for ALL workers, not just one project. Example: writing a generated correlation ID to env so every test attaches it to HTTP headers via `extraHTTPHeaders`.

```typescript
// global.setup.ts
export default async function () {
  process.env.RUN_ID = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
```

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: require.resolve("./global.setup.ts"),
  use: {
    extraHTTPHeaders: { "x-run-id": process.env.RUN_ID ?? "" }, // resolved per worker
  },
});
```

Wait — actually, this doesn't work cleanly: `process.env.RUN_ID` is read in the config file, which is re-evaluated per worker. Each worker would generate its own ID. The right fix is to call `process.env.RUN_ID = ...` inside `globalSetup`, then read it at the top of the config file. But workers re-run the config, so they re-import `global.setup.ts`'s side effects.

This is exactly why setup projects are recommended now. Use them for everything except this rare case, and even here a setup project that writes to a file (then read by workers) is often cleaner.

---

## 9. Device emulation

### 9.1 What devices `Playwright` ships

`devices` is a JSON dictionary exported from `@playwright/test`. It contains presets for:

- iPhones — 8 through latest, in portrait and landscape variants
- iPads — Mini, Air, Pro, in multiple sizes/orientations
- Pixel — 2 through latest, portrait/landscape
- Galaxy — S series, Tab variants
- Surface — Pro, Duo
- Desktop — Chrome, Firefox, Safari, Edge (Windows, Mac, Linux variants)
- Misc — Kindle Fire, Nokia Lumia, BlackBerry

Inspect what's available:

```typescript
import { devices } from "@playwright/test";
console.log(Object.keys(devices).filter((k) => k.includes("Pixel")));
// [ 'Pixel 4', 'Pixel 4 landscape', 'Pixel 4a (5G)', 'Pixel 4a (5G) landscape',
//   'Pixel 5', 'Pixel 5 landscape', 'Pixel 7', 'Pixel 7 landscape' ]
```

### 9.2 What each device spec contains

```typescript
{
  userAgent: string,           // browser fingerprint
  viewport: { width, height }, // CSS pixels
  deviceScaleFactor: number,   // DPR for retina simulation
  isMobile: boolean,           // affects meta viewport handling
  hasTouch: boolean,           // enables PointerEvent of type 'touch'
  defaultBrowserType: string,  // 'chromium' | 'firefox' | 'webkit'
}
```

### 9.3 The default browser type

Each device specifies its `defaultBrowserType`. iPhones and iPads default to `webkit` (Safari's engine). Pixels default to `chromium`. Galaxy defaults to `chromium`. Desktop Safari defaults to `webkit`.

When you write:

```typescript
{ name: 'iphone-13', use: { ...devices['iPhone 13'] } }
```

Playwright auto-launches WebKit for this project — you don't need to specify a browser. This is more accurate than running iPhone tests in Chromium with a UA spoof.

### 9.4 Browser channels

Beyond the three core engines (Chromium, Firefox, WebKit), Playwright supports running the actual installed Chrome / Edge:

```typescript
{ name: 'chrome',          use: { ...devices['Desktop Chrome'],  channel: 'chrome'      } },
{ name: 'edge',            use: { ...devices['Desktop Edge'],    channel: 'msedge'      } },
{ name: 'chrome-beta',     use: { channel: 'chrome-beta'      } },
{ name: 'chrome-dev',      use: { channel: 'chrome-dev'       } },
{ name: 'msedge-beta',     use: { channel: 'msedge-beta'      } },
```

When `channel` is set, Playwright uses the system-installed browser instead of its bundled Chromium. This matters because:

- Chromium ≠ Chrome — Chrome has proprietary codecs (H.264, AAC), DRM (Widevine), Google services, and a different update cycle.
- For media testing, you need real Chrome.
- For DRM testing, you need Chrome with Widevine.
- For "does it work in the actual browser our customers use?", you need Chrome, not Chromium.

The CI runner needs that browser installed. The Playwright Docker image includes Chrome alongside Chromium for this reason.

---

## 10. Multi-environment strategy

Real projects test against `local`, `dev`, `staging`, and sometimes `prod`. The config must support all of them without forking.

### 10.1 The `.env` layering pattern

```
.env.example         ← Committed. Shows the shape, never has real values.
.env                 ← Gitignored. Local overrides.
.env.staging         ← Gitignored or committed without secrets.
.env.local           ← Gitignored. Highest priority — your machine.
```

Load order (highest priority first):

```typescript
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", override: true });
dotenv.config({ path: `.env.${process.env.ENV ?? "local"}`, override: false });
dotenv.config({ path: ".env", override: false });
```

`override: true` for `.env.local` means a developer's local file beats everything. `override: false` for the env-specific and base files means later files only fill missing values, not overwrite.

### 10.2 The `env.loader.ts` pattern

Centralise env access:

```typescript
// config/env.loader.ts
import "dotenv/config";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[env] Missing required variable: ${name}\n→ Copy .env.example to .env and fill ${name}.`,
    );
  }
  return value;
}

export function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export function boolEnv(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined) return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

export function numberEnv(name: string, fallback: number): number {
  const v = process.env[name];
  return v ? Number.parseInt(v, 10) : fallback;
}

// Domain-grouped envs
export const envConfig = {
  env: optionalEnv("ENV", "local"),
  orangehrm: {
    baseUrl: requireEnv("ORANGEHRM_BASE_URL"),
    username: optionalEnv("ORANGEHRM_DEMO_USERNAME", "Admin"),
    password: optionalEnv("ORANGEHRM_DEMO_PASSWORD", "admin123"),
  },
  api: {
    baseUrl: requireEnv("API_BASE_URL"),
  },
  headless: boolEnv("HEADLESS", true),
  logApiSteps: boolEnv("LOG_API_STEPS", false),
} as const;
```

Then in the config:

```typescript
import { envConfig } from "./config/env.loader";

export default defineConfig({
  use: {
    headless: envConfig.headless,
  },
  projects: [
    { name: "orangehrm", use: { baseURL: envConfig.orangehrm.baseUrl } },
    { name: "api", use: { baseURL: envConfig.api.baseUrl } },
  ],
});
```

Two benefits:

- Fail-fast: if `ORANGEHRM_BASE_URL` is missing, you get a clear error at config load, not a confusing 404 mid-test.
- Single source of truth: every env reference goes through `envConfig`, not scattered `process.env.X` calls.

### 10.3 Switching environments

```bash
ENV=staging npx playwright test
ENV=local   npx playwright test --project=orangehrm
```

The `ENV` variable selects which `.env.${ENV}` file loads. Combined with the layering above, it's clean: one variable changes everything.

### 10.4 CI secret injection

CI platforms (GitHub Actions, Azure DevOps, GitLab CI) inject secrets as env vars. Never load `.env` files in CI — secrets come from the platform's secrets manager:

```yaml
# .github/workflows/playwright.yml
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      ORANGEHRM_BASE_URL: ${{ secrets.ORANGEHRM_BASE_URL }}
      ORANGEHRM_PASSWORD: ${{ secrets.ORANGEHRM_PASSWORD }}
      ENV: staging
    steps:
      - run: npx playwright test
```

Your `dotenv.config()` calls become no-ops in CI because the files don't exist — the env vars are already set by the runner.

### 10.5 Per-project environment overrides

```typescript
projects: [
  {
    name: 'staging-smoke',
    use: { baseURL: 'https://staging.example.com' },
    grep: /@smoke/,
  },
  {
    name: 'production-smoke',
    use: { baseURL: 'https://app.example.com' },
    grep: /@smoke/,
    retries: 0,           // never retry against production
    workers: 1,           // serialise to avoid rate limits
  },
],
```

A single command can hit both: `npx playwright test --project=staging-smoke --project=production-smoke` runs the same smoke suite against both environments.

---

## 11. Performance tuning

### 11.1 Memory footprint per worker

A Playwright worker is a Node.js process with one browser context attached. Approximate memory:

| Component                                    | Memory                                        |
| -------------------------------------------- | --------------------------------------------- |
| Node.js process overhead                     | ~50 MB                                        |
| Chromium browser process                     | ~150–300 MB idle, up to 1 GB+ under heavy DOM |
| WebKit browser process                       | ~80–200 MB idle                               |
| Firefox browser process                      | ~150–350 MB idle                              |
| Test file + dependencies (require'd modules) | ~50–150 MB                                    |
| One worker total                             | ~300–600 MB                                   |

On a 4 GB CI runner, 8 parallel workers will OOM. Optimal worker counts:

| CI tier                | Available RAM | CPU cores | Recommended workers                               |
| ---------------------- | ------------- | --------- | ------------------------------------------------- |
| GitHub Actions free    | 7 GB          | 2         | 2                                                 |
| GitHub Actions large   | 16 GB         | 4         | 4                                                 |
| GitHub Actions XL      | 32 GB         | 8         | 8                                                 |
| Self-hosted m5.xlarge  | 16 GB         | 4         | 4                                                 |
| Self-hosted c5.4xlarge | 32 GB         | 16        | 8 (CPU-bound — workers exceed cores rarely helps) |

### 11.2 Workers vs cores

Past `workers === cores`, contention degrades performance. Setting `workers: 16` on a 4-core machine doesn't quadruple speed — it adds context-switching overhead and the wall-clock often gets WORSE.

The sweet spot is typically `workers = min(cores, RAM / 600MB)`.

### 11.3 Worker ramp-up cost

Each worker pays a startup cost:

| Cost                                          | Time          |
| --------------------------------------------- | ------------- |
| Node process fork                             | ~150 ms       |
| Config file re-evaluation                     | ~50–500 ms    |
| Module loading (your fixtures, page objects)  | ~200–1000 ms  |
| Worker fixture setup (e.g. OAuth token fetch) | varies        |
| Browser launch                                | ~500–2000 ms  |
| First page navigation                         | ~1000–3000 ms |

A worker can take 2–5 seconds before running its first test. For very small suites (<20 tests), the worker count optimum is often LOWER than CPU count because ramp-up dominates total time.

### 11.4 Sharding sizing

```bash
npx playwright test --shard=1/4
```

splits the suite into 4 fragments and runs the 1st. Combined with CI matrix:

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
```

Four CI jobs run simultaneously. Wall-clock = (total / 4) + per-shard ramp-up.

The optimal shard count is bounded by:

- CI parallelism limits (free tiers cap at ~5 concurrent jobs)
- Per-shard ramp-up cost (don't shard so finely that ramp-up dominates)
- Whether reports need to merge (each shard produces a separate report)

Rule of thumb: shard so each shard runs for 3–10 minutes. Shorter than 3 min and ramp-up overhead dominates. Longer than 10 min and you're not getting much parallelism.

### 11.5 `fullyParallel` impact

```typescript
fullyParallel: false; // default
```

With `false`, only files run in parallel. Within a file, tests run serially. This is safe but slow.

```typescript
fullyParallel: true;
```

Tests within a file also run in parallel. Each test gets its own worker. Faster, but exposes shared-state bugs immediately.

When NOT to use `fullyParallel: true`:

- A `describe.serial` block exists in any file (the serial constraint overrides `fullyParallel`)
- Tests share module-level mutable state (see [Q03 in quiz_02_solutions](../../09_Practice_And_Quizzes/quiz_02_solutions/Q03_module_level_state_parallel.ts))
- The app under test has DB-level state that can collide (use account pools — see [04_fixtures.md](./04_fixtures.md))

For new code, `fullyParallel: true` is the default and the right choice.

### 11.6 Trace overhead at scale

On a 500-test suite with `trace: 'on'`:

| Setting                      | Wall-clock    | Disk artifacts         |
| ---------------------------- | ------------- | ---------------------- |
| `trace: 'off'`               | 25 min        | 0                      |
| `trace: 'retain-on-failure'` | 26 min (+4%)  | ~50 MB (only failures) |
| `trace: 'on'`                | 28 min (+12%) | ~2.5 GB                |

In CI, `'on'` will exhaust artifact storage in days. Always `'retain-on-failure'` in CI.

### 11.7 Headless vs headed

Headed mode (`headless: false`) is 10–30% slower because:

- The browser process must render to a real X server / Cocoa window
- GPU compositing actually happens
- Display refresh rate caps frame production

For local debugging, headed is essential. For CI, always headless. The wall-clock difference on a 500-test suite is ~5 minutes.

### 11.8 Network throttling — be deliberate

By default, Playwright doesn't throttle. Tests run as fast as the network allows, which in a Docker container with the app on the same host means LAN speeds. This is unrealistic for end-user perf, but appropriate for functional tests.

If you want realistic throttling for perf-sensitive tests:

```typescript
// In a test or fixture
const client = await context.newCDPSession(page);
await client.send("Network.enable");
await client.send("Network.emulateNetworkConditions", {
  offline: false,
  downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps
  uploadThroughput: (750 * 1024) / 8, // 750 Kbps
  latency: 40, // 40 ms RTT
});
```

CDP-only — not available in WebKit/Firefox without equivalent protocols.

---

## 12. Common production failures

Real bugs we've seen in production CI. Each one with the symptom, the root cause, and the fix.

### Failure 1 — Tests pass locally, fail in CI with "Browser not found"

**Symptom:** `Error: Executable doesn't exist at /home/runner/.cache/ms-playwright/chromium-1108/chrome-linux/chrome`

**Cause:** The CI image doesn't have browsers installed. Default `npm ci` runs `playwright install` via postinstall, but only if the cache directory is writable and the network allows downloading 500MB.

**Fix:** Either:

- Use the official image `mcr.microsoft.com/playwright:v1.49.0-jammy` (browsers pre-installed)
- Add `RUN npx playwright install --with-deps chromium` to your Dockerfile
- Add `- run: npx playwright install --with-deps chromium` to your GitHub Action

### Failure 2 — Random "Test timeout of 30000ms exceeded" in CI only

**Symptom:** Tests time out at exactly 30s in CI, never locally.

**Cause:** CI runner CPU is shared. Tests that pass in 2s locally take 35s under contention from other tenants.

**Fix:** Increase `timeout: 60_000` AND reduce parallelism (`workers: 2` instead of `4`). Faster runs from less contention beat parallelism in shared environments.

### Failure 3 — `storageState` file is empty after setup

**Symptom:** All tests start unauthenticated. The `auth.json` file exists but its `cookies` array is empty.

**Cause:** Setup wrote storageState too early — before the login POST response set cookies.

**Fix:** Wait for a post-login URL or selector before saving. See [`05_auth.md`](./05_auth.md#storagestate-the-default) and [Q06](../../09_Practice_And_Quizzes/quiz_02_solutions/Q06_storage_state_saved_early.ts).

### Failure 4 — Tests pass in `chromium` project, fail in `firefox`

**Symptom:** `.getByRole('button')` finds the element in Chromium but errors `strict mode violation: locator resolved to 2 elements` in Firefox.

**Cause:** Firefox includes additional implicit ARIA roles for certain HTML elements. A `<summary>` element has role `button` in Firefox but not in Chromium.

**Fix:** Either disambiguate the locator (`getByRole('button', { name: 'Save' })`) or scope to a parent (`page.locator('.dialog').getByRole('button')`).

### Failure 5 — `workers: 8` makes tests SLOWER

**Symptom:** 4 workers complete in 6 min; 8 workers take 9 min.

**Cause:** Memory pressure causes OS swapping. Each worker is 500 MB; 8 × 500 = 4 GB; CI runner has 4 GB → OS swap to disk → 100× slowdown.

**Fix:** Cap workers to `Math.floor(availableRAM / 600)`. For a 7 GB CI runner, max ~11 workers — but CPU cores limit useful parallelism well before that.

### Failure 6 — `extraHTTPHeaders` mysteriously missing in one project

**Symptom:** Root-level `use.extraHTTPHeaders: { 'x-env': 'staging' }` works in projects A and B but not in project C.

**Cause:** Project C set its own `extraHTTPHeaders`, which shallow-overrides root entirely. The `x-env` header is silently dropped.

**Fix:** Always spread root headers when overriding at project level:

```typescript
{ name: 'C', use: { extraHTTPHeaders: { ...rootHeaders, 'x-project': 'C' } } }
```

### Failure 7 — `--shard=1/4` produces empty results

**Symptom:** Running `--shard=1/4 --grep=@nightly` reports 0 tests in shard 1.

**Cause:** Shard splitting happens AFTER grep. If only 3 tests match `@nightly`, shards 1, 2, 3 get one test each and shard 4 is empty.

**Fix:** Don't shard small filtered suites. Either run unsharded or shard the broader suite and let grep apply within each shard.

### Failure 8 — Trace viewer crashes on a 500 MB trace

**Symptom:** `npx playwright show-trace huge.zip` hangs the browser tab.

**Cause:** A test with `trace: 'on'`, 200 actions, and a complex SPA produces enormous DOM snapshot data.

**Fix:** Switch to `'retain-on-failure'`. If the trace is from a failure you can't reproduce, use `trace: { screenshots: false, snapshots: false, sources: false }` to slim future captures.

### Failure 9 — `webServer` says "ready" but tests get 502

**Symptom:** The `webServer.url` health check passes but the first `page.goto()` returns 502 Bad Gateway from an upstream reverse proxy.

**Cause:** The health check probed `localhost:3000`, but tests go through nginx at `localhost:80`, which is not started yet.

**Fix:** Either probe through the same path tests will use, OR add a second `webServer` entry for nginx with its own health check.

### Failure 10 — Setup project runs but `storageState` is from yesterday

**Symptom:** Tests fail with 401 even though `setup` passed.

**Cause:** Two CI runs overlapping, both writing to `auth.json`. One run's setup completes after the other run's tests start. Tests load the wrong file.

**Fix:** Path-scope storage state to the run: `storageState: \`auth-states/${process.env.GITHUB_RUN_ID}.json\``. Add to `outputDir` for automatic cleanup.

### Failure 11 — `forbidOnly: true` doesn't catch `test.only()` in node_modules

**Symptom:** A vendored test fixture has `test.only` deep in `node_modules`. CI keeps running it.

**Cause:** `forbidOnly` only checks files matched by `testMatch` from `testDir`. Vendored tests outside `testDir` aren't checked.

**Fix:** Either scope your `testDir` tightly or use a separate `npm run lint:no-only` step that greps:

```bash
grep -r "test\.only\|fit\|describe\.only" tests/ && exit 1 || exit 0
```

### Failure 12 — Tests pass with `workers: 4`, fail with `workers: 1`

**Symptom:** Setting workers down to 1 surfaces failures.

**Cause:** A shared cache (e.g., session storage on a real domain) persisted from a previous test's state. With 4 workers, tests landed in different workers and got fresh contexts. With 1 worker, they share the worker's context lifecycle.

**Fix:** Tests must be context-isolated. If you need per-test context, your fixture should call `browser.newContext()` and dispose. Don't share `storageState` if any test mutates it.

---

## 13. Migration history

Things that changed between Playwright versions and what to update.

### v1.20 (Feb 2022) — Fixture scoping introduced

Worker-scoped fixtures with `[fn, { scope: 'worker' }]` syntax. Before, all fixtures were test-scoped.

### v1.25 (Aug 2022) — `testProject` introduced

The `projects[]` array became the primary configuration model. Before, single-config projects were the norm. Tag projects with `name` and use `--project=name` in CLI.

### v1.28 (Nov 2022) — Soft assertions

`expect.soft()` — accumulate assertion failures without bailing out of the test. Useful for testing many properties of a single response.

### v1.31 (Mar 2023) — Setup projects with `dependencies`

The recommended pattern for authentication shifted from `globalSetup` to setup projects. `globalSetup` still works but is no longer the default in docs.

### v1.32 (Mar 2023) — `expect.poll().toBe()` formal syntax

```typescript
await expect.poll(async () => /* fetch value */, { timeout: 30_000 }).toBe('expected');
```

Before, `expect.poll` existed but was less ergonomic.

### v1.34 (May 2023) — `test.step` returns the step value

```typescript
const id = await test.step("create user", async () => {
  const user = await api.createUser();
  return user.id;
});
```

Before, you had to assign to a variable inside the step body and access from outside.

### v1.38 (Sep 2023) — `clientCertificates` (mTLS)

Native mTLS support landed. Before, you needed a proxy with cert injection (e.g., mitmproxy with a client cert).

### v1.39 (Oct 2023) — Component testing GA

`@playwright/experimental-ct-react/vue/svelte/solid` were usable but always labelled experimental. **Update (1.62–1.63):** Playwright replaced this with a stories + gallery model, and the `experimental-ct-*` packages are no longer published after 1.62.1 — see [Ch52](../../07_Specialised_Testing/52_Component_Testing_With_Playwright_CT.md) and [Ch69](../../07_Specialised_Testing/69_Whats_New_Playwright_1_57_to_1_64.md).

### v1.41 (Jan 2024) — Test annotations

```typescript
test("flaky test", async () => {
  test.info().annotations.push({ type: "flaky", description: "JIRA-1234" });
});
```

Annotations appear in HTML report and JSON output.

### v1.43 (Apr 2024) — `expect(callback).toPass()`

```typescript
await expect(async () => {
  expect(await page.locator(".status").textContent()).toBe("Done");
}).toPass({ timeout: 30_000 });
```

A polling assertion that retries the whole callback block until it passes.

### v1.45 (Jul 2024) — Storage state cookie filtering

```typescript
await page.context().storageState({ path: "auth.json", indexedDB: false });
```

Control whether IndexedDB state is captured. Default `false` (was previously included).

### v1.46 (Aug 2024) — `mergeReports` improvements

`npx playwright merge-reports` handles attachments better and produces a single HTML report covering all shards.

### v1.48 (Oct 2024) — `aria-snapshot` matcher

```typescript
await expect(page).toMatchAriaSnapshot(`
  - heading "Welcome"
  - button "Sign in"
`);
```

Snapshot the accessibility tree instead of a DOM screenshot. Useful for cross-browser regression testing.

### v1.49 (Dec 2024) — Current at time of writing

- `request.fetch()` retry support: `await request.get(url, { maxRetries: 3 })`.
- Improved trace viewer performance for large snapshots.
- WebKit on Linux improvements (Playwright runs WebKit by patching it for Linux; v1.49 fixes several rendering bugs).

---

## 14. Comparison with other tools

How `playwright.config.ts` compares structurally to Cypress, Jest, and Vitest.

### 14.1 Cypress

```javascript
// cypress.config.js
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.{ts,tsx}",
    setupNodeEvents(on, config) {
      // Node event registration — plugins go here
    },
  },
  component: {
    devServer: { framework: "react", bundler: "vite" },
  },
});
```

| Aspect          | Playwright                     | Cypress                                 |
| --------------- | ------------------------------ | --------------------------------------- |
| Config model    | Projects[] with `dependencies` | Single e2e + component blocks           |
| Per-test config | `test.use({ ... })`            | `Cypress.config({ ... })` (runtime)     |
| Env vars        | `process.env` directly         | `Cypress.env('NAME')` (sandboxed)       |
| Parallel        | Built-in workers               | Requires Cypress Cloud (paid) or manual |
| Cross-browser   | First-class projects           | Browser flag per run; not in config     |
| Plugins         | Reporter + fixture system      | `setupNodeEvents()` hook                |

Playwright's config is more powerful per-line; Cypress's is simpler. For multi-browser, multi-environment matrices, Playwright wins.

### 14.2 Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.{ts,js}"],
  setupFilesAfterEach: ["./jest.setup.ts"],
  reporters: ["default", ["jest-junit", { outputDirectory: "test-results" }]],
  maxWorkers: "50%",
  testTimeout: 30000,
};
```

Jest is a unit/integration test runner, not a browser tool. Configuration is simpler because there's no browser context, no trace, no project matrix.

Shared concepts:

- `maxWorkers` ↔ Playwright `workers`
- `testTimeout` ↔ Playwright `timeout`
- `reporters` ↔ Playwright `reporter`
- `testMatch` ↔ Playwright `testMatch`

Playwright's `use` block has no Jest equivalent — Jest tests don't share a runtime context.

### 14.3 Vitest

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.{test,spec}.ts"],
    globals: true,
    coverage: { reporter: ["text", "lcov"] },
    pool: "threads", // or 'forks' for isolation
    poolOptions: { threads: { maxThreads: 4 } },
  },
});
```

Vitest is Jest-compatible but built on Vite. Like Jest, no browser concerns. The `pool: 'threads' | 'forks'` choice is interesting: threads share memory (faster) but lose isolation; forks are slower but safer. Playwright is forks-only (a worker = a Node process) for safety.

### 14.4 Verdict

Playwright's config is the most feature-rich of these four because it manages:

- Browser launch + context configuration
- Trace and screenshot artifacts
- Cross-browser projects
- Authentication state files
- Network interception defaults

Cypress, Jest, and Vitest don't have to do most of this. Their configs are simpler because their domain is simpler. The complexity isn't gratuitous — it reflects what end-to-end browser testing actually requires.

---

## Quick reference card

Paste-ready production config:

```typescript
import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 4 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],

  use: {
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
    testIdAttribute: "data-testid",
    extraHTTPHeaders: {
      "x-correlation-id": process.env.RUN_ID ?? "",
    },
  },

  metadata: {
    environment: process.env.ENV ?? "local",
    appVersion: process.env.APP_VERSION ?? "unknown",
    ciBuildId: process.env.GITHUB_RUN_ID ?? null,
    gitSha: process.env.GITHUB_SHA?.slice(0, 8) ?? null,
  },

  projects: [
    { name: "setup", testMatch: /global\.setup\.ts$/ },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "auth-states/admin.json",
        baseURL: process.env.APP_URL,
      },
    },
    {
      name: "firefox",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Firefox"],
        storageState: "auth-states/admin.json",
        baseURL: process.env.APP_URL,
      },
    },
    {
      name: "mobile-chrome",
      dependencies: ["setup"],
      use: {
        ...devices["Pixel 7"],
        storageState: "auth-states/admin.json",
        baseURL: process.env.APP_URL,
      },
    },
    {
      name: "api",
      testDir: "./tests/api",
      use: { baseURL: process.env.API_URL },
    },
  ],

  webServer: process.env.START_LOCAL_APP
    ? [
        {
          command: "npm run start",
          url: "http://localhost:3000/health",
          timeout: 120_000,
          reuseExistingServer: !isCI,
        },
      ]
    : undefined,
});
```

---

## Cross-references

- Fixtures (test/worker scope, options pattern): [`./04_fixtures.md`](./04_fixtures.md)
- Auth (storageState, OAuth, MFA, mTLS): [`./05_auth.md`](./05_auth.md)
- Parallel execution + sharding: [`./07_parallelism.md`](./07_parallelism.md)
- Reporting deep-dive (Allure, custom reporters, trace viewer): [`./11_reporting.md`](./11_reporting.md)
- CI integration + Docker: [`./10_ci_docker.md`](./10_ci_docker.md)
- Visual regression configuration: [`../deep_dives/visual_regression.md`](../topic_summaries/visual_regression.md)
- Emulation project matrix (devices, locale/timezone, colorScheme, permissions): [`../03_Real_World_Scenarios/61_Emulation_Clock_Network_And_Devices.md`](../../03_Real_World_Scenarios/61_Emulation_Clock_Network_And_Devices.md)
