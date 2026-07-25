# 56. Playwright Config Deep-Dive — Every Field, In Context

**Navigation**: [← 55. Inspector & Trace Viewer](./55_Inspector_TraceViewer_UIMode_Walkthrough.md) | [Index](../00_INDEX.md) | [→ 57. Login Taxonomy](../05_Advanced_Topics/57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md)

---

> ### 📍 This is the canonical config chapter
>
> A companion reference also exists:
>
> - **Theory catalog merged into this chapter** — the former `57_Playwright_Config_Theory_Catalog.md` now lives in the "Edge Cases & Reference" appendix at the bottom of this file.
>
> **Open this chapter (Ch56) first** — it walks the real [`framework/playwright.config.ts`](../framework/playwright.config.ts) field-by-field. Use Ch57 as supplementary reading only.

---

## 5W1H

- **WHAT**: Every field of `playwright.config.ts` — what it does, when it matters, what defaults break in CI, and how the existing [`framework/playwright.config.ts`](../framework/playwright.config.ts) wires it all together.
- **WHY**: The config file is the single biggest source of "works on my machine" pain. A misconfigured `retries`, `workers`, or `trace` masks bugs in CI; the wrong `projects[]` structure makes cross-browser runs impossible; missing `reporter` entries break downstream dashboards.
- **WHO**: Anyone who has typed `npx playwright test` and hit something they didn't expect — different timing, missing report, surprise retry, mystery flake. Especially: anyone wiring Playwright into a real CI pipeline for the first time.
- **WHEN**: Before you start writing the third test. Config debt compounds — fix the shape before the suite is 200 specs deep.
- **HOW**: Read the worked example top-to-bottom (Section 2), then jump to the field you care about. Each subsection ends with a ❌/✅ pair so you can grep the file for the mistake you're making.

---

## 1. The honest pitch

`playwright.config.ts` is a TypeScript module that exports a `PlaywrightTestConfig` via `defineConfig({...})`. That's it. There is no magic — every behaviour you see in `npx playwright test` is driven by a field in this object.

The trap: the defaults are tuned for a single developer running tests on a laptop. They are **not** tuned for CI. If you ship the default config to GitHub Actions, you get:

- 1 worker (slow)
- 0 retries (every flake is a build failure)
- Trace `off` (no debugging artifacts when CI fails)
- Reporter `list` only (no JUnit for the PR check, no HTML for humans)

This chapter walks the existing [`framework/playwright.config.ts`](../framework/playwright.config.ts) field-by-field so you understand why each line is there, then catalogues the fields you'll _also_ need as the suite grows.

---

## 2. The worked example — `framework/playwright.config.ts`

Here's the file in production (lightly reformatted for the chapter):

```typescript
import { defineConfig, devices } from "@playwright/test";
import { envConfig } from "./config/env.loader";
import { Timeouts } from "./constants/timeouts";

export default defineConfig({
  testDir: "./tests",

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,

  timeout: Timeouts.SIXTY_SECONDS,
  expect: { timeout: Timeouts.TEN_SECONDS },

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],

  use: {
    actionTimeout: Timeouts.FIFTEEN_SECONDS,
    navigationTimeout: Timeouts.THIRTY_SECONDS,
    headless: envConfig.headless,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
  },

  projects: [
    {
      name: "orangehrm",
      testDir: "./tests/orangehrm",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: envConfig.orangehrm.baseUrl,
      },
    },
    {
      name: "api",
      testDir: "./tests",
      testMatch: /.*\.api\.spec\.ts$/,
      use: { baseURL: envConfig.api.baseUrl },
    },
    {
      name: "firefox-ci",
      testDir: "./tests/orangehrm",
      use: {
        ...devices["Desktop Firefox"],
        baseURL: envConfig.orangehrm.baseUrl,
      },
      grep: /@cross-browser/,
    },
  ],
});
```

Three things to notice up front:

1. **No hardcoded URLs or credentials.** `envConfig` is a typed env-loader; URLs come from `.env`. Compare your real config: every URL should chase a `process.env.*`.
2. **`process.env.CI` switches behaviour.** Retries, workers, and (elsewhere) trace mode all change in CI. This is the single most important pattern in the file.
3. **`projects[]` is the unit of scaling.** Three projects = three independent suites (UI smoke, API, cross-browser) that share `use:` defaults but override the bits that differ.

The rest of this chapter explains why each section is shaped that way.

---

## 3. `testDir` and discovery

```typescript
testDir: './tests',
```

The root for test discovery. By default, Playwright picks up every file matching `testMatch` (default `/.*\.(test|spec)\.(ts|js|mjs)/`) under this directory.

You can override per-project (see `projects[]` below). The `api` project sets a stricter `testMatch: /.*\.api\.spec\.ts$/` so it only picks up API-shaped files, even though it shares the same `testDir`.

❌ **Wrong** — single sprawling test directory with mixed UI and API specs:

```typescript
testDir: './tests',
// 200 specs, half UI, half API, no way to run just one half
```

✅ **Right** — narrow per-project `testDir` or `testMatch`:

```typescript
projects: [
  { name: "ui", testDir: "./tests/ui" },
  { name: "api", testDir: "./tests/api", testMatch: /.*\.api\.spec\.ts$/ },
];
```

---

## 4. `fullyParallel`, `workers`, `retries`, `forbidOnly`

These four fields determine the **runtime shape** of a test run.

### `fullyParallel: true`

By default, Playwright parallelizes **file-level only** — tests within a file run serially. With `fullyParallel: true`, **every test** in the suite parallelizes across the worker pool.

The cost: any module-level mutable state shared between tests in the same file is now a parallelism bug. (Ch 09 has the full taxonomy.)

### `workers: process.env.CI ? 4 : undefined`

`undefined` means "use the default" (currently half the available CPU cores). On a laptop that's usually 4–8; in CI that's often 2 — too few.

The pattern in `framework/playwright.config.ts` pins CI to **4 workers** and lets the laptop pick. If the CI runner has more cores, bump it; if it's RAM-constrained (D365-style heavy pages), drop it. Rough formula from Ch 09: `workers = min(CPUs, RAM_GB / 1.5)`.

❌ **Wrong** — same worker count locally and in CI:

```typescript
workers: 8,  // your laptop is fine; CI runner has 2 cores and dies
```

✅ **Right** — CI-aware:

```typescript
workers: process.env.CI ? 4 : undefined,
```

### `retries: process.env.CI ? 2 : 0`

The most contentious field in the config.

**`retries: 0` locally** is non-negotiable — if a test is flaky on your laptop, fix it before pushing. Retries hide the signal.

**`retries: 2` in CI** is pragmatic — network blips, browser-version mismatches, and provider degradation cause one-shot failures that aren't worth blocking a PR over. But **track the retry rate** (Ch 26 has the metrics script). If retries > 5% of test count, you have a real flakiness problem; freeze new tests until it's < 2%.

❌ **Wrong** — using retries to mask known bugs:

```typescript
retries: 5,  // "the team will look at it later" — they won't
```

✅ **Right** — minimum retries needed to absorb infra noise, with a metric that pages someone if retries spike:

```typescript
retries: process.env.CI ? 2 : 0,
```

### `forbidOnly: !!process.env.CI`

`test.only(...)` is a developer convenience that **must never reach CI** — it silently skips the rest of the suite. `forbidOnly: true` makes the CI build fail if any `test.only` slips through. The `!!process.env.CI` pattern leaves `forbidOnly` off locally (so `test.only` still works for focused debugging) and on in CI.

---

## 5. The `timeout` cascade

There are **four** timeout fields, and they nest:

```
Suite total ─→ test.timeout ─→ test.step.timeout ─→ action/expect timeout
   (config            (config              (per step                 (per call)
   testTimeout?        timeout)              override)                 use.actionTimeout,
   not directly)                                                       expect.timeout)
```

The framework example sets:

| Field                   | Value (via `Timeouts` constants) | Purpose                                        |
| ----------------------- | -------------------------------- | ---------------------------------------------- |
| `timeout`               | 60s                              | Maximum runtime for any single test            |
| `expect.timeout`        | 10s                              | Maximum for `await expect(locator)...` retries |
| `use.actionTimeout`     | 15s                              | Maximum for `click`, `fill`, etc.              |
| `use.navigationTimeout` | 30s                              | Maximum for `goto`, `waitForURL`, etc.         |

Why action timeout < expect timeout? Because `expect(locator).toHaveText(...)` polls (retries) the underlying read for 10s, whereas a `click` is a single round-trip. 15s for an action is generous; if a click takes longer than 15s, something is fundamentally wrong (modal blocking, navigation pending, etc.).

❌ **Wrong** — one giant timeout everywhere:

```typescript
timeout: 5 * 60 * 1000,  // 5 minutes per test — flaky tests hang the suite
use: { actionTimeout: 60_000 },
```

✅ **Right** — tight action timeouts, generous test budget:

```typescript
timeout: Timeouts.SIXTY_SECONDS,
expect: { timeout: Timeouts.TEN_SECONDS },
use: { actionTimeout: Timeouts.FIFTEEN_SECONDS, navigationTimeout: Timeouts.THIRTY_SECONDS },
```

---

## 6. The `reporter` matrix

```typescript
reporter: [
  ['list'],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['junit', { outputFile: 'test-results/junit.xml' }],
  ['json', { outputFile: 'test-results/results.json' }],
],
```

Each reporter serves a different audience:

| Reporter | Who reads it                                         | Format                                                     |
| -------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `list`   | The human running `npx playwright test`              | Streaming terminal output                                  |
| `html`   | The human investigating a CI failure                 | Static HTML with embedded traces and screenshots           |
| `junit`  | The CI system (GitHub Actions, Azure DevOps, GitLab) | XML — required for the PR check to show pass/fail per test |
| `json`   | Custom dashboards, the analytics capstone CAP_C3     | Machine-readable run summary                               |

`open: 'never'` on the HTML reporter is important — without it, Playwright launches a browser at the end of the run, which hangs CI.

Other reporters you'll see in the wild: `dot` (single character per test — good for big suites in noisy CI logs), `line` (single line per file — quieter than `list`), and custom reporters (Ch 47 Allure, CAP_C2 Custom Reporter capstone).

❌ **Wrong** — single reporter, missing CI integration:

```typescript
reporter: 'list',  // GitHub Actions can't parse this for the PR check
```

✅ **Right** — one reporter per audience:

```typescript
reporter: [
  ['list'],          // humans live
  ['html', ...],     // humans post-mortem
  ['junit', ...],    // CI gate
  ['json', ...],     // dashboards
]
```

---

## 7. The `use:` block — what every test inherits

`use:` is the **default** for everything in `projects[]`. Project-level `use:` blocks override or extend it (see `...devices['Desktop Chrome']` below).

### `actionTimeout` & `navigationTimeout`

Covered in Section 5.

### `headless`

```typescript
headless: envConfig.headless,
```

In CI it's always `true`. Locally it's a choice — `false` is invaluable when debugging. Don't hardcode either; let `envConfig` read the env var.

### `trace`

```typescript
trace: 'retain-on-failure',
```

The trace is a `.zip` file containing the DOM, network log, console, screenshots, and timing data for every step. You open it in Trace Viewer (Ch 55) and time-travel through the failure.

| Mode                        | When trace is kept                                               |
| --------------------------- | ---------------------------------------------------------------- |
| `'off'`                     | Never — don't use this; you'll regret it the first time CI fails |
| `'on'`                      | Always — disk-heavy; use only for debugging                      |
| `'on-first-retry'`          | First retry only (default for CI templates) — good middle ground |
| `'retain-on-failure'`       | Only when the test fails — the framework's choice                |
| `'retain-on-first-failure'` | First failure only across retries                                |

✅ The framework default `'retain-on-failure'` keeps the disk small in green runs and gives you a trace for every red test.

### `screenshot` & `video`

```typescript
screenshot: 'only-on-failure',
video: 'retain-on-failure',
```

Both default to `'off'`. The framework keeps them on-failure for the same reason as trace: zero cost when green, full forensics when red.

### `viewport`

```typescript
viewport: { width: 1440, height: 900 },
```

Default is `1280×720`. Production apps often have layouts that break above the fold at 720 (sidebar overlaps content, hamburger menu activates). `1440×900` matches a 14" MacBook — close enough to real users that you catch real layout bugs.

---

## 8. `projects[]` — the scaling unit

```typescript
projects: [
  { name: 'orangehrm', testDir: './tests/orangehrm', use: { ...devices['Desktop Chrome'], baseURL: envConfig.orangehrm.baseUrl } },
  { name: 'api',       testDir: './tests', testMatch: /.*\.api\.spec\.ts$/, use: { baseURL: envConfig.api.baseUrl } },
  { name: 'firefox-ci', testDir: './tests/orangehrm', use: { ...devices['Desktop Firefox'], baseURL: envConfig.orangehrm.baseUrl }, grep: /@cross-browser/ },
],
```

**A `project` is a named (sub-)suite with its own `use:` merge, its own `testDir`/`testMatch`, and its own `grep`.** Three patterns to learn:

### Pattern 1 — Browser × suite matrix

```typescript
{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
{ name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
{ name: 'webkit',   use: { ...devices['Desktop Safari'] } },
```

Run all three: `npx playwright test`. Run one: `npx playwright test --project=chromium`.

### Pattern 2 — Tagged subset for cross-browser

The `framework`'s `firefox-ci` project uses `grep: /@cross-browser/`. Only tests tagged `@cross-browser` in their title run on Firefox; the rest run chromium-only. This is the **80/20 cross-browser strategy** — run everything on chromium fast, run the 20 truly-browser-sensitive tests on the others.

### Pattern 3 — `setup` + `dependencies`

```typescript
projects: [
  { name: 'setup',    testMatch: /global\.setup\.ts/ },
  { name: 'chromium', dependencies: ['setup'], use: { ...devices['Desktop Chrome'], storageState: 'auth/admin.json' } },
],
```

This is how [`projects/starter-playwright-ts/playwright.config.ts`](../projects/starter-playwright-ts/playwright.config.ts) wires the auth setup. The `setup` project runs `global.setup.ts`, writes a `storageState` JSON, and the `chromium` project loads that state — so every test starts authenticated, with no per-test login overhead.

❌ **Wrong** — using `globalSetup` (the older API) when `dependencies` is available:

```typescript
globalSetup: './auth.ts',  // runs ONCE, opaque to the test runner, no per-project control
```

✅ **Right** — `dependencies: ['setup']` makes setup a first-class project with its own retries, traces, and parallelism:

```typescript
{ name: 'setup', testMatch: /global\.setup\.ts/ },
{ name: 'chromium', dependencies: ['setup'], use: { storageState: 'auth/admin.json' } },
```

(There are still cases where `globalSetup` is the right tool — see Section 10.)

---

## 9. Device emulation — `devices[...]`

```typescript
use: { ...devices['Desktop Chrome'] }
```

`devices` is a built-in dictionary of preset `use:` blocks. Each preset bundles:

- `userAgent`
- `viewport`
- `deviceScaleFactor`
- `isMobile`
- `hasTouch`
- `defaultBrowserType`

Common picks:

| Preset                                                      | What you're testing      |
| ----------------------------------------------------------- | ------------------------ |
| `'Desktop Chrome'`, `'Desktop Firefox'`, `'Desktop Safari'` | Standard desktop layouts |
| `'iPhone 13'`, `'iPhone 14 Pro'`, `'iPad Pro'`              | Mobile responsive        |
| `'Pixel 7'`, `'Galaxy S9+'`                                 | Android responsive       |

Spread them with `...devices['...']` so you can still override fields (e.g., `viewport` for a custom canvas).

⚠️ **Device presets are emulation, not actual mobile testing.** They change `userAgent`, viewport, and touch — they do **not** run on the real mobile browser, do **not** test the real iOS Safari rendering quirks. Real mobile testing needs Appium or a device farm. Ch 60 covers the trade-offs.

---

## 10. `globalSetup` vs `dependencies: [setup]`

|                   | `globalSetup`                                                                                            | `dependencies: ['setup']`                |
| ----------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Runs              | Once before any project                                                                                  | As a real project; reruns if invalidated |
| Visible in report | No                                                                                                       | Yes — shows up as a test                 |
| Retries           | None (one shot)                                                                                          | Honours project `retries`                |
| Trace on failure  | No                                                                                                       | Yes                                      |
| Per-project       | No (truly global)                                                                                        | Yes (different setup per project)        |
| When to use       | Spinning up a docker network, seeding a DB, writing a single shared state file consumed by every project | Per-project auth (most cases)            |

**Rule of thumb**: if the setup writes a file that one specific project loads, use `dependencies`. If it's truly shared infrastructure (DB seeded once), `globalSetup`.

---

## 11. Honest mistakes I see often

❌ **`baseURL` hardcoded in `use:`**

```typescript
use: {
  baseURL: "https://staging.example.com";
}
```

Now every developer runs against staging. PR previews are unreachable.

✅ Pull it from env:

```typescript
use: {
  baseURL: envConfig.app.baseUrl;
}
```

❌ **`testIdAttribute` not set** — your team uses `data-test-id` but Playwright's `getByTestId` looks for `data-testid`:

```typescript
// Tests do: page.getByTestId('save-btn')
// HTML has:  <button data-test-id="save-btn">
// Result:    locator times out
```

✅ Tell Playwright what attribute you use:

```typescript
use: {
  testIdAttribute: "data-test-id";
}
```

❌ **`outputDir` not set** — Playwright drops `test-results/` wherever you ran from, polluting your repo root:

```typescript
// (no outputDir) → garbage scattered across cwd
```

✅ Pin it:

```typescript
outputDir: './test-results',
```

❌ **`grep` and `grepInvert` confused with file matching** — `grep` matches the **test title**, not the file path:

```typescript
grep: /smoke/; // matches any test whose title contains 'smoke', from any file
```

If you want file-path matching, use `testMatch`:

```typescript
testMatch: /.*smoke\.spec\.ts$/;
```

❌ **Per-test `test.use({ video: 'on' })` for debugging that gets committed** — slows everyone down forever.

✅ Set per-run via CLI:

```bash
npx playwright test --trace on --video on
```

---

## 12. The full field reference (cheat sheet)

Fields you'll actually use (most are optional):

```typescript
defineConfig({
  // ───── Discovery ─────
  testDir: "./tests",
  testMatch: /.*\.(spec|test)\.(ts|js)$/,
  testIgnore: ["**/fixtures/**"],
  testIdAttribute: "data-testid",

  // ───── Runtime ─────
  fullyParallel: true,
  workers: process.env.CI ? 4 : undefined,
  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,
  maxFailures: process.env.CI ? 10 : 0, // stop suite after N failures

  // ───── Timeouts ─────
  timeout: 60_000,
  expect: { timeout: 10_000 },
  globalTimeout: 30 * 60 * 1000, // whole suite cap

  // ───── Output ─────
  outputDir: "./test-results",
  reporter: [["list"], ["html"], ["junit", { outputFile: "junit.xml" }]],
  preserveOutput: "failures-only",
  quiet: false,

  // ───── Defaults for every test ─────
  use: {
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    baseURL: process.env.BASE_URL,
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
    locale: "en-GB",
    timezoneId: "Europe/London",
    permissions: ["clipboard-read"],
    storageState: "auth/state.json",
    extraHTTPHeaders: { "X-Test-Run": "true" },
    ignoreHTTPSErrors: true, // self-signed certs in dev
    bypassCSP: true, // when you need to inject scripts
    colorScheme: "dark",
    reducedMotion: "reduce",
  },

  // ───── Projects ─────
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts$/ },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // ───── Global hooks ─────
  globalSetup: require.resolve("./global-setup"),
  globalTeardown: require.resolve("./global-teardown"),

  // ───── Web server (Playwright starts your app) ─────
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

Cross-reference: every field above is documented at <https://playwright.dev/docs/test-configuration>.

---

## 13. Practice

<details>
<summary><strong>Practice 1 — Why 4 reporters?</strong></summary>

The framework uses `list + html + junit + json`. Could you collapse them to just `html`?

**No.** Each serves a different audience:

- `list` — humans watching the run
- `html` — humans investigating a failure
- `junit` — the CI system parsing for the PR check
- `json` — downstream dashboards (the CAP_C3 capstone consumes this)

Removing `junit` breaks the GitHub Actions check. Removing `json` breaks the analytics dashboard. Removing `list` makes local runs silent. Removing `html` removes the trace browser.

</details>

<details>
<summary><strong>Practice 2 — Pick the right trace mode</strong></summary>

You have a 200-test suite, run in CI 50× per day. Disk space is constrained. You also need to be able to debug any failure.

Pick: `'off'` / `'on'` / `'on-first-retry'` / `'retain-on-failure'` / `'retain-on-first-failure'`.

**`'retain-on-failure'`** — trace is captured for every test, but only kept when the test failed. Zero disk cost on green runs, full forensics on red. `'on-first-retry'` is also defensible if you want even smaller artifacts and accept that the _first_ failure (before retry) loses its trace.

</details>

<details>
<summary><strong>Practice 3 — Spot the bug</strong></summary>

```typescript
projects: [
  { name: 'auth-setup', testMatch: /auth\.setup\.ts/ },
  { name: 'chromium', use: { storageState: 'auth/state.json' } },
],
```

A reader reports: "Tests fail on the very first run because `auth/state.json` doesn't exist."

**Bug**: `chromium` doesn't declare `dependencies: ['auth-setup']`, so the two projects run in parallel — `chromium` tries to load the state file before `auth-setup` has written it.

**Fix**:

```typescript
{ name: 'chromium', dependencies: ['auth-setup'], use: { storageState: 'auth/state.json' } }
```

</details>

<details>
<summary><strong>Practice 4 — Convert `globalSetup` to `dependencies`</strong></summary>

Convert this:

```typescript
globalSetup: require.resolve('./auth.global.ts'),
projects: [{ name: 'chromium', use: { storageState: 'auth/state.json' } }],
```

…to use the `dependencies` pattern.

**Solution**:

```typescript
projects: [
  { name: 'auth-setup', testMatch: /auth\.setup\.ts/ },
  { name: 'chromium', dependencies: ['auth-setup'], use: { storageState: 'auth/state.json' } },
],
```

And rename `auth.global.ts` → `auth.setup.ts`, wrapping its content in a `test('authenticate', ...)` call so it's a real Playwright test. You now get retries, trace, and a visible row in the report when auth breaks.

</details>

---

## Appendix A — Lifecycle Diagram (globalSetup vs Dependencies vs globalTeardown)

```
TEST RUN STARTS
       │
       ▼
GLOBAL SETUP — runs once, all projects
→ Launch DB container, seed data, create storageState
       │
  ┌────┴────┐
  ▼         ▼
Setup    Setup       (dependency projects, run before their dependents)
Project  Project
  │         │
  ▼         ▼
E2E      E2E         (dependent projects, workers run in parallel)
Tests    Tests
  └────┬────┘
       │
       ▼
GLOBAL TEARDOWN — runs once, always
→ Stop DB container, upload artifacts, cleanup
       │
       ▼
TEST RUN COMPLETE
```

| Feature | Global Setup | Global Teardown | Dependencies |
|---------|-------------|----------------|-------------|
| Scope | All projects | All projects | Specific projects |
| Runs when | Once before all | Once after all | Per dependent group |
| Failure behaviour | Aborts entire run | Always runs | Blocks dependents |
| Best for | DB containers, shared auth seeding | Cleanup, artifact upload | Per-project auth, data setup |

---

## Appendix B — 9 Common Config Mistakes

### 1. `actionTimeout` outside `use`

```typescript
// ❌ Ignored — must be inside use:{}
export default defineConfig({ actionTimeout: 5000 });

// ✅
export default defineConfig({ use: { actionTimeout: 5000 } });
```

### 2. Missing `forbidOnly` in CI

```typescript
forbidOnly: !!process.env.CI  // ✅ — prevents .only() from silently skipping the suite
```

### 3. `trace: 'on'` in CI

Produces gigabytes of artifacts daily. Use `'on-first-retry'` instead. `'on'` is local-debug only.

### 4. `workers: 1` (the default) on CI

Turns a 6-minute parallel run into a 60-minute serial one. Set `workers: process.env.CI ? 6 : undefined`.

### 5. Hardcoded `baseURL`

Breaks when switching to staging. Use `process.env.BASE_URL || 'http://localhost:3000'`.

### 6. Missing `reuseExistingServer: !process.env.CI` in webServer

In CI you want a fresh server; locally you want to reuse the running dev server. Always make this conditional.

### 7. Same config everywhere

Retries, workers, trace, and reporter should all be `CI ? x : y`. One size serves no environment well.

### 8. `screenshot: 'off'` in CI

Blind debugging. Set `'only-on-failure'` — no storage cost for passing tests, full evidence when it breaks.

### 9. `webServer.timeout` left at default while the app cold-starts slowly

This is the mistake behind the CI error `Error: Timed out waiting 60000ms from config.webServer` — so let's remove the abstraction and trace exactly what that timeout measures.

What Playwright actually does with a `webServer` block, step by step:

1. Runs `command` as a child process (in `cwd`, with your `env`).
2. Starts polling the `url` (or `port`) — an HTTP GET roughly every 100 ms.
3. **Any** response counts as "up" — including 404 and 500. It is a *socket-level liveness check*, not a health check. (This surprises people: a server that answers `500 Internal Server Error` on `/` still "passes" the wait.)
4. If nothing answers within `timeout` (default **60 000 ms**), it kills the child process and fails the whole run before a single test executes.

So the timeout must cover the **worst cold start**, which in CI includes things your laptop never does: `npm run build` inside the start command, database migrations, JIT/bundler warm-up on a 2-vCPU runner. The tuning procedure, not a guess:

```typescript
webServer: {
  command: 'npm run start:test',
  url: 'http://localhost:3000/healthz',   // a route that only answers when ACTUALLY ready
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,                        // = measured worst CI cold start × 2
  stdout: 'pipe',                          // ← the diagnostic: see WHAT the server printed
  stderr: 'pipe',                          //    while Playwright was waiting
},
```

- **Measure, then double**: time `npm run start:test` until first response on three cold CI runs; set `timeout` to twice the slowest. Twice — because CI runners have noisy neighbors, and a timeout that fires on the p99 cold start costs you a full pipeline re-run to "fix" nothing.
- **Point `url` at a readiness route**, not `/`. Because of step 3 above, `/` answering during boot (some frameworks serve a splash/loading page early) ends the wait *before* the API behind it is ready — and your first three tests fail with connection errors that look like flake. A `/healthz` that returns 200 only after DB connect closes that hole.
- **`stdout: 'pipe'` when diagnosing**: the timeout error alone tells you nothing. The piped server log tells you whether the app crashed (stack trace), is still compiling (bundler output), or bound to the wrong port (the second most common cause: the app read `PORT` from an env you didn't pass — the server is healthy on 3001 while Playwright polls 3000 forever).

---

## Appendix C — Team-Size Decision Matrix

| Team | Test Count | Workers | Projects | Retries | Trace | Reporter |
|------|-----------|---------|---------|---------|-------|---------|
| Solo dev | < 50 | default | 1 (chromium) | 0 | `on` locally | `list` + `html` |
| Small team | 50–200 | 4 | 2 (chromium, webkit) | 1 in CI | `on-first-retry` | `line` + `html` |
| Mid-size | 200–1000 | 6–8 | 4+ (browsers + mobile) | 2 in CI | `on-first-retry` | `junit` + `blob` |
| Enterprise | 1000+ | 50% or shard | 6+ (browsers, roles, staging) | 2 in CI | `on-first-retry` | `blob` + custom |

### Config decision tree

```
Does the suite run in CI?
├── No (local only)
│   ├── trace: 'on'
│   ├── screenshot: 'on'
│   ├── workers: default
│   └── reporter: ['list', 'html']
└── Yes (CI)
    ├── forbidOnly: true
    ├── retries: 1–2
    ├── trace: 'on-first-retry'
    ├── screenshot: 'only-on-failure'
    ├── video: 'retain-on-failure'
    ├── workers: based on runner CPU
    ├── reporter: ['blob'] or ['junit']
    └── shard if tests > 500
        ├── total shards = ceil(test_count / 250)
        └── merge with: npx playwright merge-reports
```

---

## What's next

- **Ch 09** — Parallel Execution & Workers. The runtime model behind `fullyParallel`, `workers`, and project parallelism.
- **Ch 25** — CI/CD Integration. How the `junit` and `html` reporters wire into GitHub Actions / Azure DevOps.
- **Ch 26** — Flakiness. The metrics script that catches when your `retries: 2` is masking real bugs.
- **Ch 55** — Inspector & Trace Viewer. How to actually use the trace files this config produces.
- **Ch 57** — Login Taxonomy. Where the `storageState` pattern fits into the bigger auth picture.
- **Ch 59** — Docker for Playwright. Where the config has to change for container runs (`/dev/shm`, headless, browser deps).

**Navigation**: [← 55. Inspector & Trace Viewer](./55_Inspector_TraceViewer_UIMode_Walkthrough.md) | [Index](../00_INDEX.md) | [→ 57. Login Taxonomy](../05_Advanced_Topics/57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md)


---

## Reality Check

**"One playwright.config.ts works for all environments"** ? Different environments require different configs: baseURL changes per environment, timeout values differ between local (fast) and CI (needs longer timeouts), browser count differs between development (one) and cross-browser verification (three), and workers count depends on CI runner CPU count. Use environment variables and config spread patterns to handle multiple environments from one config file.

**"Default timeouts are appropriate"** ? Playwright defaults to 30 seconds for navigation and 5 seconds (or the configured expect timeout) for assertions. On slow CI runners, 5 seconds may not be enough for dynamic content. On fast local machines, 30 seconds masks slow page loads that should be optimized. Set timeouts based on your application performance requirements: if a page should load in 2 seconds, set navigation timeout to 5 seconds, not 30.

**"Running all browsers in CI catches more bugs"** ? Cross-browser bugs account for less than 5 percent of test failures in modern web applications using standard HTML and CSS. Running 3 browsers triples CI time and cost. Run Chromium in every CI pipeline for speed, and schedule weekly cross-browser runs to catch rendering and behavior differences without paying the daily cost.

**"testDir should point to the root"** ? A testDir pointing to the project root makes Playwright scan every .spec.ts file in the entire project, including unit tests, component tests, and utility files. Set testDir to a specific directory like tests/e2e. Use the projects config to separate E2E, API, and visual tests with different configurations.

**"Reporter configuration does not affect test execution"** ? Some reporters buffer all results in memory until the suite completes (JSON reporter, HTML reporter). With 1000+ tests, this consumes significant memory. The list reporter streams output incrementally. In CI, use a reporter that streams results to avoid out-of-memory errors on large suites. The HTML reporter generates files that need artifact storage � plan for reporter output size in CI.
