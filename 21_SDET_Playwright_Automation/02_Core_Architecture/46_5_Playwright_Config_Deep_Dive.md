<!-- Navigation -->
<div align="center">

[&#9664; 46. BDD with Cucumber](../05_Advanced_Topics/46_BDD_With_Cucumber.md) | [Index](../00_INDEX.md) | [&#9654; 47. Allure & ReportPortal](../05_Advanced_Topics/47_Allure_ReportPortal.md)

</div>

---

# 46.5. Playwright Config Deep-Dive — Every Field Explained

> ### ⚠️ Read the canonical chapter first
>
> For most readers, the right entry point is [**Ch56 — Playwright Config Deep-Dive (framework-anchored)**](./56_Playwright_Config_Deep_Dive.md). Ch56 walks the real [`framework/playwright.config.ts`](../framework/playwright.config.ts) field-by-field with concrete CI examples.
>
> This file (Ch46.5) is a **long theoretical reference (~1460 lines)** that catalogues every config field abstractly. It overlaps Ch56 substantially. Open it only if Ch56 didn't answer your specific question.
>
> A shorter brief overview also exists at [`05_Advanced_Topics/46_5_Playwright_Config_Deep_Dive.md`](../05_Advanced_Topics/46_5_Playwright_Config_Deep_Dive.md).

---

## 5W1H

| Question | Answer |
|----------|--------|
| **What** | A comprehensive breakdown of every configuration option in `playwright.config.ts`, including projects, reporters, timeouts, workers, and lifecycle hooks. |
| **Why** | One misconfigured field can multiply CI costs, hide test failures, or create flakiness. Understanding config deeply is what separates junior testers from senior SDETs. |
| **Who** | SDETs, QA Engineers, DevOps, and Lead Engineers responsible for test infrastructure. |
| **When** | From day one of test automation setup, and again when scaling from hundreds to thousands of tests. |
| **Where** | The `playwright.config.ts` (or `.js`) file at the root of your project. |
| **How** | Through `defineConfig()`, project arrays, environment-based conditionals, and TypeScript strict typing. |

---

## Table of Contents

1. [Why Config Matters](#1-why-config-matters)
2. [The Full Config Object Anatomy](#2-the-full-config-object-anatomy)
3. [Project Configuration Deep-Dive](#3-project-configuration-deep-dive)
4. [Global Setup vs Global Teardown vs Dependencies](#4-globalsetup-vs-globalteardown-vs-dependencies)
5. [Worker and Parallel Execution Config](#5-worker-and-parallel-execution-config)
6. [Timeout Configuration Hierarchy](#6-timeout-configuration-hierarchy)
7. [Reporter Configuration](#7-reporter-configuration)
8. [Trace and Screenshot Modes](#8-trace-and-screenshot-modes)
9. [Browser and Device Configuration](#9-browser-and-device-configuration)
10. [WebServer Configuration](#10-webserver-configuration)
11. [Environment Variables in Config](#11-environment-variables-in-config)
12. [TypeScript Config Tips](#12-typescript-config-tips)
13. [Common Config Mistakes](#13-common-config-mistakes)
14. [Decision Matrix: Config Choices](#14-decision-matrix-config-choices)
15. [Exercise: Optimize a Slow Config](#15-exercise-optimize-a-slow-config)

---

## 1. Why Config Matters

Playwright's `playwright.config.ts` is not a side file you set once and forget. It is the central nervous system of your entire test suite. A single misconfiguration can have cascading effects:

| Misconfiguration | Cost |
|-----------------|------|
| `workers: 1` on CI | 10x slower pipelines, engineers waiting, context switching loss |
| `trace: 'on'` everywhere | Gigabytes of artifacts stored daily, storage bills explode |
| `retries: 0` with flaky async tests | False CI failures, developer fatigue, "just re-run it" culture |
| `forbidOnly: false` in CI | `.only()` tests slipping through means entire suites may never run |
| No project separation | You run Chromium tests 3 times because you forgot to shard by browser |
| Hardcoded `baseURL` | Tests fail when switching from `localhost:3000` to staging, or worse: test against production |
| Missing `globalSetup` | Database seeds not applied, tests pass locally but fail in CI |
| `fullyParallel: false` by default | Serial execution wastes CI minutes on independent tests |

> **Golden Rule:** The config file is production code. Review it in PRs, version control it, and audit it quarterly.

---

## 2. The Full Config Object Anatomy

Playwright exports `defineConfig` from `@playwright/test`. This helper provides IntelliSense and type safety.

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // ===== TOP-LEVEL OPTIONS =====

  // Directory where test files live. Defaults to current dir.
  testDir: './tests',

  // Glob patterns for test files. Defaults to '**/*.spec.{ts,js}'.
  testMatch: '**/*.spec.ts',

  // Patterns to exclude (node_modules excluded by default).
  testIgnore: '**/legacy-tests/**',

  // Run all tests in every file in parallel. Default: false.
  fullyParallel: true,

  // Fail the build on .only() in CI. CRITICAL for CI safety.
  forbidOnly: !!process.env.CI,

  // Number of retries for failed tests.
  retries: process.env.CI ? 2 : 0,

  // Number of parallel workers. Default: half of CPU cores.
  workers: process.env.CI ? 4 : undefined,

  // Reporter configuration (see Section 7).
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'results.json' }],
  ],

  // Shared settings for all projects.
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Global setup module (runs once before all tests).
  globalSetup: require.resolve('./global-setup'),

  // Global teardown module (runs once after all tests).
  globalTeardown: require.resolve('./global-teardown'),

  // Project configurations (see Section 3).
  projects: [
    /* defined below */
  ],

  // Web server to auto-start (see Section 10).
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },

  // Expect matchers config (see Section 6).
  expect: {
    timeout: 5000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
    toMatchSnapshot: {
      threshold: 0.2,
    },
  },

  // Output directory for test artifacts (screenshots, videos, traces).
  outputDir: './test-results',

  // Preserve output even on success? 'always' | 'never' | 'failures-only'
  preserveOutput: 'failures-only',

  // Max failures before bailing out. Prevents burning CI minutes on broken builds.
  maxFailures: process.env.CI ? 10 : undefined,

  // Quiet mode suppresses live test output. Good for CI with reporters.
  quiet: !!process.env.CI,

  // Shard configuration for distributed CI (see Section 5).
  shard: undefined,

  // Update snapshots automatically. NEVER on CI.
  updateSnapshots: process.env.CI ? 'none' : 'missing',

  // Metadata attached to the test report.
  metadata: {
    commit: process.env.GITHUB_SHA,
    branch: process.env.GITHUB_REF_NAME,
  },
});
```

### Field-by-Field Breakdown

| Field | Type | Default | What It Controls |
|-------|------|---------|-----------------|
| `testDir` | `string` | `'.'` | Root directory for test discovery. |
| `testMatch` | `string \| RegExp \| Array` | `'**/*.spec.{ts,js,mjs}'` | File patterns to include. |
| `testIgnore` | `string \| RegExp \| Array` | `'**/node_modules/**'` | File patterns to exclude. |
| `fullyParallel` | `boolean` | `false` | If `true`, tests in the same file run in parallel. |
| `forbidOnly` | `boolean` | `false` | Fails if `.only()` is found. |
| `retries` | `number \| { mode: 'default' \| 'each', when: string }` | `0` | Retry count for flaky tests. |
| `workers` | `number \| string` | `half of CPU cores` | Parallel worker processes. |
| `reporter` | `string \| Array` | `'list'` | Test result output format. |
| `use` | `object` | `{}` | Default options for all tests. |
| `globalSetup` | `string` | `undefined` | Module path run once before all tests. |
| `globalTeardown` | `string` | `undefined` | Module path run once after all tests. |
| `projects` | `Array<Project>` | `[{ name: '', use: {} }]` | Browser/environment configurations. |
| `webServer` | `object` | `undefined` | Command to start a dev server before tests. |
| `expect` | `object` | `{ timeout: 5000 }` | Default timeout and options for expect. |
| `outputDir` | `string` | `'test-results'` | Directory for artifacts. |
| `preserveOutput` | `string` | `'failures-only'` | When to keep screenshots/videos. |
| `maxFailures` | `number` | `undefined` | Stop after N failures. |
| `quiet` | `boolean` | `false` | Suppress live progress output. |
| `shard` | `{ total: number, current: number }` | `undefined` | Distributed test execution. |
| `updateSnapshots` | `string` | `'missing'` | Whether to update reference images. |
| `metadata` | `object` | `{}` | Custom data in reports. |

---

## 3. Project Configuration Deep-Dive

Projects are Playwright's most powerful feature for cross-browser and cross-environment testing. Each project is an isolated execution context with its own browser, viewport, permissions, and more.

```typescript
projects: [
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      channel: 'chromium', // or 'chrome', 'msedge'
    },
  },
  {
    name: 'firefox',
    use: {
      ...devices['Desktop Firefox'],
    },
  },
  {
    name: 'webkit',
    use: {
      ...devices['Desktop Safari'],
    },
  },
  {
    name: 'Mobile Chrome',
    use: {
      ...devices['Pixel 7'],
    },
  },
  {
    name: 'Mobile Safari',
    use: {
      ...devices['iPhone 14'],
    },
  },
  {
    name: 'setup',
    testMatch: '**/setup/*.setup.ts',
    teardown: 'teardown',
  },
  {
    name: 'teardown',
    testMatch: '**/setup/*.teardown.ts',
  },
  {
    name: 'e2e-chromium',
    dependencies: ['setup'],
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'storageState.json',
    },
  },
],
```

### Project Name Conventions

Naming matters because names appear in reports and CI logs:

| Naming Pattern | Use Case |
|---------------|----------|
| `browser-env` (e.g., `chromium-staging`) | Cross-browser testing in specific environments. |
| `role-browser` (e.g., `admin-chromium`) | Same app tested with different user roles. |
| `device-orientation` (e.g., `mobile-portrait`) | Responsive design testing. |
| `setup` / `teardown` | Reserved for dependency projects. |

### Project Merging and Dependencies

Projects can declare `dependencies` to enforce execution order. This replaces the old pattern of manually sequencing tests.

```typescript
projects: [
  {
    name: 'db-seed',
    testMatch: '**/seed/**/*.spec.ts',
  },
  {
    name: 'api-tests',
    dependencies: ['db-seed'],
    testMatch: '**/api/**/*.spec.ts',
  },
  {
    name: 'e2e-tests',
    dependencies: ['api-tests'],
    testMatch: '**/e2e/**/*.spec.ts',
  },
],
```

Key rules:
- Dependency projects run **before** dependents, fully.
- Workers for dependent projects wait until all dependency projects complete.
- Use `teardown` property to schedule cleanup after a project finishes.

### Project-Level `use` Overrides

Top-level `use` is the default. Project `use` overrides it. Test-level `use` overrides project. This cascade matters:

```typescript
// Top-level: all tests
use: { baseURL: 'http://localhost:3000' },

projects: [
  {
    name: 'staging',
    // Override for staging environment
    use: { baseURL: 'https://staging.example.com' },
  },
],

// In a specific test:
test.use({ baseURL: 'https://api.example.com' });
```

---

## 4. Global Setup vs Global Teardown vs Dependencies

These three mechanisms solve similar but distinct problems. Choosing wrong leads to leaked state, race conditions, or wasted time.

### Global Setup

**When to use:** One-time initialization needed before ANY test runs.

```typescript
// global-setup.ts
import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Start a test database container
  await dockerComposeUp('test-db');

  // Seed shared data
  await seedTestData();

  // Authenticate once and store state for all tests
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login');
  await page.fill('[name="email"]', 'admin@test.com');
  await page.fill('[name="password"]', 'secret');
  await page.click('button[type="submit"]');
  await page.context().storageState({ path: 'storageState.json' });
  await browser.close();
}

export default globalSetup;
```

Register in config:
```typescript
globalSetup: require.resolve('./global-setup'),
```

### Global Teardown

**When to use:** Cleanup that must run after ALL tests complete, regardless of pass/fail.

```typescript
// global-teardown.ts
import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  // Stop test database
  await dockerComposeDown('test-db');

  // Archive test artifacts to S3 in CI
  if (process.env.CI) {
    await uploadArtifacts('./test-results');
  }

  // Clean up temp files
  await fs.rm('./storageState.json', { force: true });
}

export default globalTeardown;
```

### Dependencies (Project-Level)

**When to use:** Setup that should be scoped to specific projects, not global.

```typescript
projects: [
  {
    name: 'setup',
    testMatch: '**/*.setup.ts',
  },
  {
    name: 'e2e',
    dependencies: ['setup'],
    use: {
      storageState: 'storageState.json',
    },
  },
],
```

### Comparison Table

| Feature | Global Setup | Global Teardown | Dependencies |
|---------|-------------|-----------------|--------------|
| **Scope** | All projects | All projects | Specific projects |
| **Runs when** | Once before all | Once after all | Per dependent project group |
| **Failure behavior** | Aborts entire run | Always runs (via try/finally) | Blocks dependents |
| **Best for** | DB containers, auth state seeding | Cleanup, artifact upload | Per-project auth, data setup |
| **Can use browser** | Yes (manual launch) | Yes | Yes (via tests) |
| **Return value** | Anything (passed to teardown) | Receives setup's return | N/A |

### Lifecycle Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      TEST RUN STARTS                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  GLOBAL SETUP runs once (all projects)                       │
│  → Launch DB container, seed data, create storageState       │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Setup Project │   │ Setup Project │   │ Setup Project │
│ (dependency)  │   │ (dependency)  │   │ (dependency)  │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Dependent     │   │ Dependent     │   │ Dependent     │
│ Projects run  │   │ Projects run  │   │ Projects run  │
│ with workers  │   │ with workers  │   │ with workers  │
└───────────────┘   └───────────────┘   └───────────────┘
            │                   │                   │
            └─────────────────┼─────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  GLOBAL TEARDOWN runs once (all projects)                    │
│  → Stop DB container, upload artifacts, cleanup              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      TEST RUN COMPLETE                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Worker and Parallel Execution Config

Playwright runs tests in worker processes. Understanding worker configuration is critical for speed and correctness.

### `fullyParallel`

```typescript
fullyParallel: true,
```

When `true`, tests within the SAME file run in parallel. Default is `false` for backward compatibility.

| `fullyParallel` | Behavior |
|-----------------|----------|
| `false` (default) | Tests in a file run sequentially. Files run in parallel. |
| `true` | Both tests and files run in parallel. Requires tests to be independent. |

> **Warning:** Enabling `fullyParallel` without ensuring test isolation causes flaky failures from shared state.

### `workers`

```typescript
// Fixed number
workers: 4,

// Percentage of CPU cores (useful for CI with shared runners)
workers: '50%',

// CI-optimized: use more workers, local: use defaults
workers: process.env.CI ? 6 : undefined,
```

Worker count trade-offs:

| Workers | Speed | Memory | CPU | When to Use |
|---------|-------|--------|-----|-------------|
| 1 | Slowest | Lowest | Lowest | Debugging, ordered execution |
| 2-4 | Moderate | Moderate | Moderate | Local development |
| 6-8 | Fast | High | High | CI with dedicated runner |
| 50% | Adaptive | Adaptive | Adaptive | Shared CI runners |

### `shard`

Sharding splits tests across multiple CI jobs for horizontal scaling:

```typescript
// playwright.config.ts
shard: {
  total: 4,     // Total number of shards
  current: 1,   // This shard's index (1-based)
},
```

CI matrix example (GitHub Actions):

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: npx playwright test --shard=${{ matrix.shard }}/4
```

Sharding algorithm is deterministic based on test name. Same test always lands on same shard.

### Retries with `retries.when`

```typescript
// Simple retry count
retries: 2,

// Conditional retries (Playwright 1.40+)
retries: {
  mode: 'default',  // 'default' | 'each' — each retries every project, default retries once per test
  when: 'fail',     // 'fail' | 'pass' | always' — when to retry
},
```

| Retry Mode | Description |
|-----------|-------------|
| `mode: 'default'` | Retry the test, and if ANY retry passes, the test passes. Best for flaky tests. |
| `mode: 'each'` | Retry in each project independently. A test must pass in ALL projects. |
| `when: 'fail'` | Retry only when the test fails. |
| `when: 'always'` | Always retry (useful for stress testing). |

### Combining sharding and retries

```typescript
globalSetup: './global-setup.ts',
workers: process.env.CI ? 6 : 4,
retries: process.env.CI ? 2 : 0,
shard: process.env.CI
  ? { total: Number(process.env.SHARD_TOTAL), current: Number(process.env.SHARD_INDEX) }
  : undefined,
fullyParallel: true,
```

---

## 6. Timeout Configuration Hierarchy

Playwright has a layered timeout system. Understanding precedence prevents premature failures or wasted time on stuck tests.

### The Hierarchy (Highest Priority First)

```
test.setTimeout()     ← Overrides everything (per-test)
  ↓
test.slow()           ← Multiplies timeout by 3
  ↓
Project use: { actionTimeout }  ← Per-action override
  ↓
Project use: { navigationTimeout }  ← Navigation override
  ↓
Config expect: { timeout }  ← Expect assertion timeout
  ↓
Config timeout            ← Global per-test timeout (30s default)
```

### Config-Level Timeouts

```typescript
export default defineConfig({
  // Global timeout for each test. Default: 30000ms
  timeout: 60000,

  expect: {
    // Timeout for expect() assertions. Default: 5000ms
    timeout: 10000,
  },

  use: {
    // Timeout for click(), fill(), etc. Default: no limit (uses test timeout)
    actionTimeout: 15000,

    // Timeout for goto(), reload(), etc. Default: no limit
    navigationTimeout: 30000,
  },
});
```

### Per-Test Timeout Overrides

```typescript
import { test, expect } from '@playwright/test';

// Override for this single test
test('slow import test', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/bulk-import');
  // ... lengthy operation
});

// Mark test as slow (multiplies timeout by 3)
test('another slow test', async ({ page }) => {
  test.slow();
  await page.goto('/heavy-report');
});
```

### Timeout Recommendations by Test Type

| Test Type | `timeout` | `actionTimeout` | `navigationTimeout` |
|-----------|-----------|-----------------|---------------------|
| Unit-style component | 10000ms | 5000ms | 5000ms |
| Standard E2E | 30000ms | 15000ms | 15000ms |
| File upload / import | 60000ms | 30000ms | 30000ms |
| Report generation | 120000ms | 60000ms | 30000ms |
| API integration | 15000ms | N/A | N/A |

---

## 7. Reporter Configuration

Playwright comes with built-in reporters and supports custom reporters.

### Built-in Reporters

```typescript
reporter: [
  // 1. LIST — human-readable live output (default)
  ['list'],

  // 2. LINE — single line progress, good for CI
  ['line'],

  // 3. DOT — minimal dots, fastest output
  ['dot'],

  // 4. HTML — rich self-contained report
  ['html', {
    outputFolder: 'playwright-report',
    open: 'never',       // 'always' | 'never' | 'on-failure'
  }],

  // 5. JSON — machine-parseable
  ['json', {
    outputFile: 'test-results/results.json',
  }],

  // 6. JUNIT — CI system integration
  ['junit', {
    outputFile: 'test-results/junit.xml',
    strip ANSI control characters: true,
  }],

  // 7. BLOB — for merging sharded results
  ['blob', {
    outputDir: 'blob-report',
  }],
],
```

### Reporter Comparison

| Reporter | Best For | Output | Performance |
|----------|---------|--------|-------------|
| `list` | Local development | Detailed per-test | Moderate |
| `line` | CI logs | One line updating | Fast |
| `dot` | Minimal CI noise | Dots only | Fastest |
| `html` | Interactive debugging | Rich HTML with traces | Slow (generates artifacts) |
| `json` | Programmatic analysis | JSON file | Fast |
| `junit` | Jenkins, Azure DevOps | XML file | Fast |
| `blob` | Shard merging | Binary blob | Fast |

### HTML Reporter Configuration

```typescript
['html', {
  outputFolder: 'playwright-report',
  open: process.env.CI ? 'never' : 'on-failure',
  host: '0.0.0.0',
  port: 9323,
}],
```

Serve the HTML report after a run:
```bash
npx playwright show-report playwright-report
```

### Blob Reporter for Sharded CI

When tests run across multiple shards, the blob reporter captures results that can be merged:

```typescript
// In each shard's config
reporter: [['blob', { outputDir: 'blob-report' }]],
```

Merge after all shards complete:
```bash
npx playwright merge-reports blob-report --reporter html
```

### Custom Reporter

```typescript
// custom-reporter.ts
import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

class SlackReporter implements Reporter {
  onBegin(config, suite) {
    console.log(`Starting ${suite.allTests().length} tests`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'failed') {
      this.notifySlack(`Test failed: ${test.title}`);
    }
  }

  onEnd(result) {
    console.log(`Run finished: ${result.status}`);
  }

  private notifySlack(message: string) {
    // Slack webhook call
  }
}

export default SlackReporter;
```

Register:
```typescript
import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  reporter: [
    ['list'],
    [path.resolve('./custom-reporter.ts')],
  ],
});
```

---

## 8. Trace and Screenshot Modes

Traces are Playwright's most powerful debugging tool, capturing DOM snapshots, network, console logs, and actions.

### Trace Modes

```typescript
use: {
  trace: 'on',               // Trace every test (expensive)
  trace: 'off',              // No tracing (default)
  trace: 'on-first-retry',   // Trace only on first retry (recommended)
  trace: 'on-all-retries',   // Trace on every retry attempt
  trace: 'retain-on-failure', // Trace on failure, keep it
},
```

| Mode | When to Use | Storage Cost |
|------|-------------|--------------|
| `off` | Stable suites in CI, local fast runs | None |
| `on-first-retry` | Default recommendation. Captures flakiness without daily cost. | Moderate |
| `on-all-retries` | Debugging specific flaky tests | Higher |
| `retain-on-failure` | When you need traces for every failure | High |
| `on` | Local debugging only. Never in CI. | Very High |

### Screenshot Modes

```typescript
use: {
  screenshot: 'off',            // No screenshots
  screenshot: 'on',             // Screenshot every test
  screenshot: 'only-on-failure', // Screenshot failed tests only (recommended)
},
```

### Video Modes

```typescript
use: {
  video: 'off',
  video: 'on',
  video: 'retain-on-failure',   // Keep video only for failures (recommended)
  video: 'on-first-retry',
},
```

### Cost-Aware Configuration

```typescript
use: {
  // Local: full debugging
  trace: process.env.CI ? 'on-first-retry' : 'on',
  screenshot: process.env.CI ? 'only-on-failure' : 'on',
  video: process.env.CI ? 'retain-on-failure' : 'on',

  // Context options captured in trace
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  locale: 'en-US',
  timezoneId: 'America/New_York',
  geolocation: { longitude: -74.006, latitude: 40.7128 },
  permissions: ['geolocation'],
},
```

### Viewing Traces

```bash
# Open trace viewer
npx playwright show-trace test-results/trace.zip

# Or use the online viewer (no upload, local only)
# https://trace.playwright.dev/
```

The trace viewer includes:
- Action timeline with before/after DOM snapshots
- Network tab with all requests/responses
- Console logs
- Source code of test actions
- Attachments (screenshots, videos)

---

## 9. Browser and Device Configuration

### Using Predefined Devices

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile devices
    {
      name: 'Pixel 7',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'iPhone 14',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'iPad Pro 11',
      use: { ...devices['iPad Pro 11'] },
    },
  ],
});
```

### Custom Device Definition

```typescript
projects: [
  {
    name: 'custom-tablet',
    use: {
      viewport: { width: 1024, height: 768 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
    },
  },
],
```

### Browser Channel Configuration

Channels use installed browser versions instead of Playwright's bundled ones:

```typescript
projects: [
  {
    name: 'chrome',
    use: {
      channel: 'chrome',  // Uses system Google Chrome
    },
  },
  {
    name: 'msedge',
    use: {
      channel: 'msedge',  // Uses system Microsoft Edge
    },
  },
],
```

Available channels: `'chrome'`, `'chrome-beta'`, `'chrome-dev'`, `'chrome-canary'`, `'msedge'`, `'msedge-beta'`, `'msedge-dev'`, `'msedge-canary'`.

### Locale, Timezone, and Geolocation

```typescript
use: {
  // Browser locale affects number/date formatting and Accept-Language header
  locale: 'de-DE',

  // Timezone affects `new Date()` in the page
  timezoneId: 'Europe/Berlin',

  // Geolocation for location-based features
  geolocation: { longitude: 13.405, latitude: 52.52 },
  permissions: ['geolocation'],

  // Color scheme preference
  colorScheme: 'dark',  // 'light' | 'dark' | 'no-preference'

  // Reduced motion preference
  reducedMotion: 'reduce',  // 'reduce' | 'no-preference'
},
```

### Viewport and Screen

```typescript
use: {
  // Browser viewport size
  viewport: { width: 1920, height: 1080 },

  // Screen size (affects media queries)
  screen: { width: 1920, height: 1080 },

  // Device pixel ratio
  deviceScaleFactor: 2,
},
```

---

## 10. WebServer Configuration

Playwright can automatically start your dev server before running tests.

### Basic WebServer

```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  timeout: 120000,
  reuseExistingServer: !process.env.CI,
},
```

### WebServer with Health Check

```typescript
webServer: {
  command: 'npm run start:test',
  url: 'http://localhost:3000/api/health',
  timeout: 120000,
  reuseExistingServer: !process.env.CI,

  // Custom health check function
  // If URL returns non-2xx, Playwright polls until timeout
  // You can also use: waitForPort: 3000
},
```

### Multiple WebServers

```typescript
webServer: [
  {
    command: 'npm run api-server',
    url: 'http://localhost:4000/health',
    name: 'API Server',
  },
  {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    name: 'Frontend',
    // Depend on API being ready first
    timeout: 120000,
  },
],
```

### WebServer Options Reference

| Option | Type | Description |
|--------|------|-------------|
| `command` | `string` | Shell command to start the server. |
| `url` | `string` | URL to poll for readiness. |
| `timeout` | `number` | Max time to wait for server (ms). |
| `reuseExistingServer` | `boolean` | If `true`, reuses already-running server. |
| `cwd` | `string` | Working directory for the command. |
| `env` | `object` | Environment variables for the command. |
| `stdout` | `string` | `'pipe'` or `'ignore'` |
| `stderr` | `string` | `'pipe'` or `'ignore'` |

> **CI Tip:** Set `reuseExistingServer: false` in CI to ensure a clean state. Set to `true` locally to avoid restarting your dev server constantly.

---

## 11. Environment Variables in Config

Environment-aware configuration is essential for running the same suite across local, staging, and CI.

### CI Detection

```typescript
const isCI = !!process.env.CI;
const isStaging = process.env.ENV === 'staging';
const isProduction = process.env.ENV === 'production';
```

### Conditional Config Pattern

```typescript
import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const baseURL = process.env.BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',

  // Strict in CI, lenient locally
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 4 : undefined,
  maxFailures: isCI ? 10 : undefined,

  // Reporters: minimal in CI, full locally
  reporter: isCI
    ? [['github'], ['blob', { outputDir: 'blob-report' }]]
    : [['list'], ['html', { open: 'on-failure' }]],

  use: {
    baseURL,
    trace: isCI ? 'on-first-retry' : 'on',
    screenshot: isCI ? 'only-on-failure' : 'on',
    headless: isCI,  // Headless in CI, headed locally (optional)
  },

  // Different projects per environment
  projects: isCI
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
      ]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      ],

  webServer: isCI
    ? {
        command: 'npm run start:ci',
        url: baseURL,
        reuseExistingServer: false,
      }
    : {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: true,
      },
});
```

### Environment File Support

```typescript
import dotenv from 'dotenv';
import path from 'path';

// Load .env.test before config evaluation
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  use: {
    baseURL: process.env.TEST_BASE_URL,
    extraHTTPHeaders: {
      'X-API-Key': process.env.API_KEY!,
    },
  },
});
```

---

## 12. TypeScript Config Tips

### Strict Type Checking

Enable strict mode in `tsconfig.json` to catch config errors at compile time:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@tests/*": ["tests/*"],
      "@fixtures/*": ["tests/fixtures/*"]
    }
  }
}
```

### Path Aliases in Playwright

Path aliases work in test files but require `tsconfig-paths` for runtime resolution in global setup/teardown:

```typescript
// playwright.config.ts
// No special config needed for test files — Playwright handles tsconfig paths

// For globalSetup/globalTeardown that imports aliased modules:
// Use tsx or ts-node with tsconfig-paths/register
```

### Type-Safe Fixtures

```typescript
// fixtures.ts
import { test as base, expect } from '@playwright/test';

interface MyFixtures {
  apiClient: ApiClient;
  testUser: User;
}

export const test = base.extend<MyFixtures>({
  apiClient: async ({ request }, use) => {
    const client = new ApiClient(request);
    await use(client);
  },
  testUser: async ({}, use) => {
    const user = await createTestUser();
    await use(user);
    await cleanupTestUser(user.id);
  },
});

export { expect };
```

### Declaration Merging for Custom Matcher

```typescript
// types.d.ts
import '@playwright/test';

declare module '@playwright/test' {
  interface Matchers<R> {
    toBeWithinRange(floor: number, ceiling: number): R;
  }
}
```

---

## 13. Common Config Mistakes

### Mistake 1: Wrong Timeout Nesting

```typescript
// WRONG: actionTimeout is inside use, not at top level
export default defineConfig({
  actionTimeout: 5000,  // ❌ Ignored! Must be inside use:{}
  use: {
    // actionTimeout belongs HERE
  },
});

// CORRECT:
export default defineConfig({
  use: {
    actionTimeout: 5000,
    navigationTimeout: 10000,
  },
});
```

### Mistake 2: Forgetting `forbidOnly` in CI

```typescript
// WRONG: .only() tests will skip your entire suite silently
forbidOnly: false,

// CORRECT:
forbidOnly: !!process.env.CI,
```

### Mistake 3: Not Using Projects for Cross-Browser

```typescript
// WRONG: Running one browser, manually switching configs
use: { browserName: 'chromium' },

// CORRECT: Define all browsers as projects
projects: [
  { name: 'chromium', use: { browserName: 'chromium' } },
  { name: 'firefox', use: { browserName: 'firefox' } },
  { name: 'webkit', use: { browserName: 'webkit' } },
],
```

### Mistake 4: Ignoring Trace Storage Cost

```typescript
// WRONG: Traces for every test in CI
trace: 'on',

// CORRECT: Trace only on retry where flakiness matters
trace: 'on-first-retry',
```

### Mistake 5: Hardcoding Paths

```typescript
// WRONG: Breaks on Windows, different CI environments
testDir: './tests',
outputDir: 'test-results',

// CORRECT: Use path.join for cross-platform
testDir: path.join(__dirname, 'tests'),
outputDir: path.join(__dirname, 'test-results'),
```

### Mistake 6: Not Separating Local vs CI Config

```typescript
// WRONG: Same config everywhere, suboptimal everywhere
retries: 2,
workers: 4,

// CORRECT: Environment-aware
default defineConfig({
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 6 : undefined,
  trace: process.env.CI ? 'on-first-retry' : 'on',
});
```

### Mistake 7: Not Configuring Screenshot on Failure

```typescript
// WRONG: Debug blind when CI tests fail
use: {},

// CORRECT:
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
},
```

### Mistake 8: Running All Tests in Headed Mode

```typescript
// WRONG: Headed mode wastes CI resources and fails in headless environments
use: { headless: false },

// CORRECT: Headless in CI, optionally headed locally
use: {
  headless: !!process.env.CI,
},
```

---

## 14. Decision Matrix: Config Choices

| Team Size | Test Count | Workers | Projects | Retries | Trace | Reporter |
|-----------|-----------|---------|----------|---------|-------|----------|
| Solo dev | < 50 | default (half CPU) | 1 (chromium) | 0 | `on` locally | `list` + `html` |
| Small team | 50-200 | 4 | 2 (chromium, webkit) | 1 in CI | `on-first-retry` in CI | `line` + `html` |
| Mid-size team | 200-1000 | 6-8 | 4+ (browsers + mobile) | 2 in CI | `on-first-retry` | `junit` + `blob` |
| Enterprise | 1000+ | 50% or shard | 6+ (browsers, roles, staging) | 2 in CI | `on-first-retry` | `blob` + custom |

### Config Decision Tree

```
Does the test suite run in CI?
├── No (local only)
│   ├── trace: 'on'
│   ├── screenshot: 'on'
│   ├── workers: default
│   └── reporter: ['list', 'html']
└── Yes (CI)
    ├── forbidOnly: true
    ├── retries: 1-2
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

## 15. Exercise: Optimize a Slow Config

### Baseline (Suboptimal Config)

```typescript
// playwright.config.ts — BASELINE (SLOW)
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,                    // ❌ Serial execution
  retries: 0,                    // ❌ No retries in CI
  fullyParallel: false,          // ❌ Sequential within files
  timeout: 120000,               // ❌ Too long for most tests
  use: {
    headless: false,             // ❌ Headed in CI
    trace: 'on',                 // ❌ Traces for every test
    screenshot: 'on',            // ❌ Screenshots for passing tests
    video: 'on',                 // ❌ Videos for passing tests
    baseURL: 'http://localhost:3000',
  },
  reporter: 'list',              // ❌ Minimal CI reporting
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    // ❌ Missing firefox and webkit
    // ❌ Missing mobile testing
  ],
  // ❌ No globalSetup for database seeding
  // ❌ No webServer configuration
});
```

### Your Task

Create an optimized version of this config for:

1. **CI environment:** Fast, cost-effective, comprehensive reporting
2. **Local development:** Maximum debugging capability

Requirements:
- Must support Chromium, Firefox, and WebKit
- Must include mobile emulation (at least one device)
- Must auto-start the dev server
- Must seed database before tests via globalSetup
- Must not waste storage on passing test artifacts in CI
- Must retry flaky tests in CI
- Must fail if `.only()` is present in CI
- Must use appropriate worker count per environment
- Must generate HTML and JUnit reports in CI

Write both config versions (or a unified conditional config) and explain each change.

### Self-Grading Rubric

| Criteria | Points | Self-Assessment |
|---------|--------|-----------------|
| Environment-aware workers (`process.env.CI`) | 5 | ___ / 5 |
| `forbidOnly` for CI safety | 5 | ___ / 5 |
| Appropriate retries (CI vs local) | 5 | ___ / 5 |
| Cost-aware trace/screenshot/video config | 5 | ___ / 5 |
| Cross-browser projects (Chromium, Firefox, WebKit) | 10 | ___ / 10 |
| Mobile device project included | 5 | ___ / 5 |
| `webServer` configured with `reuseExistingServer` | 5 | ___ / 5 |
| `globalSetup` / `globalTeardown` or dependencies used | 5 | ___ / 5 |
| Timeout hierarchy reasonable (not all 120s) | 5 | ___ / 5 |
| Reporters: `html` + `junit` or `blob` in CI | 5 | ___ / 5 |
| `fullyParallel` with awareness of test isolation | 5 | ___ / 5 |
| TypeScript types used correctly (`defineConfig`) | 5 | ___ / 5 |
| **Total** | **65** | ___ / 65 |

### Pass Thresholds

| Level | Score | Meaning |
|-------|-------|---------|
| Junior SDET | 40-49 | Understands basics, misses CI optimization |
| Mid-Level SDET | 50-59 | Comprehensive config, minor gaps |
| Senior SDET | 60-65 | Production-ready, cost-conscious, fully environment-aware |

---

## Quick Reference Card

```typescript
// Production-ready template
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: path.join(__dirname, 'tests'),
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 6 : undefined,
  maxFailures: isCI ? 10 : undefined,

  reporter: isCI
    ? [['github'], ['junit', { outputFile: 'results.xml' }], ['blob']]
    : [['list'], ['html', { open: 'on-failure' }]],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: isCI ? 'on-first-retry' : 'on',
    screenshot: isCI ? 'only-on-failure' : 'on',
    video: isCI ? 'retain-on-failure' : 'on',
    headless: isCI,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !isCI,
    timeout: 120000,
  },

  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
});
```

---

<!-- Navigation -->
<div align="center">

[&#9664; 46. BDD with Cucumber](../05_Advanced_Topics/46_BDD_With_Cucumber.md) | [Index](../00_INDEX.md) | [&#9654; 47. Allure & ReportPortal](../05_Advanced_Topics/47_Allure_ReportPortal.md)

</div>
