# Reporting

> The authoritative reference for reporters, trace viewer, UI mode, Allure / ReportPortal integration, custom reporter development, attachment handling, and production patterns for surfacing test results to humans and dashboards.

---

## Table of contents

1. [The reporting model](#1-the-reporting-model)
2. [Built-in reporters — all 9](#2-built-in-reporters)
3. [HTML report internals](#3-html-report-internals)
4. [JUnit XML for CI dashboards](#4-junit-xml)
5. [JSON for analytics](#5-json-for-analytics)
6. [Blob and merge for sharded CI](#6-blob-and-merge)
7. [The Reporter interface (custom reporters)](#7-the-reporter-interface)
8. [Trace Viewer — exhaustive walkthrough](#8-trace-viewer)
9. [UI Mode — the dev loop](#9-ui-mode)
10. [Inspector — pause and step](#10-inspector)
11. [Allure integration](#11-allure-integration)
12. [ReportPortal integration](#12-reportportal-integration)
13. [Custom reporters — 5 real-world examples](#13-custom-reporters)
14. [Attachments](#14-attachments)
15. [Test annotations](#15-test-annotations)
16. [Slow test reporting](#16-slow-test-reporting)
17. [Flakiness detection via reporter](#17-flakiness-detection)
18. [Common production failures](#18-common-production-failures)
19. [Anti-pattern catalog](#19-anti-pattern-catalog)

---

## 1. The reporting model

Playwright separates execution from reporting. The test runner emits events; reporters consume them and produce output.

### 1.1 The event stream

```
onBegin(config, suite)                       — once, before any test
  onTestBegin(test, result)                  — per test attempt
    onStepBegin(test, result, step)          — per test.step()
      onStdOut(chunk, test, result)          — console.log from test
      onStdErr(chunk, test, result)          — console.error from test
    onStepEnd(test, result, step)
  onTestEnd(test, result)
onEnd(result)                                — once, after all tests
```

For a retried test, `onTestBegin → onTestEnd` fires once per attempt.

### 1.2 The two surfaces

| Surface | Who consumes | Examples |
|---|---|---|
| Human-readable | Developers, QA, PMs triaging | HTML report, list, dot |
| Machine-readable | CI dashboards, analytics | JUnit, JSON, blob, custom |

Production-grade configs use BOTH:

```typescript
reporter: [
  ['list'],                                                    // human, in CI logs
  ['html', { outputFolder: 'playwright-report', open: 'never' }], // human, downloadable
  ['junit', { outputFile: 'test-results/junit.xml' }],        // CI dashboard
  ['json', { outputFile: 'test-results/results.json' }],      // analytics
],
```

### 1.3 Where reporters run

Reporters run in the MAIN process (not workers). They have access to:
- The full config
- All test results across all workers and shards (in a single run)
- The filesystem

They CANNOT access:
- Live browser state
- In-flight requests
- Worker memory

Workers send events to the main process via the standard Playwright IPC.

---

## 2. Built-in reporters

| Reporter | Output | Audience | Use when |
|---|---|---|---|
| `list` | stdout | Dev | Local development, default when not CI |
| `dot` | stdout | CI | Short feedback for very long suites |
| `line` | stdout | CI | One updating line; for tight CI log budgets |
| `html` | filesystem | All | Always include |
| `junit` | filesystem | CI dashboards | Jenkins, Azure DevOps, GitLab |
| `json` | filesystem | Analytics | Custom tooling, dashboards |
| `blob` | filesystem | Sharded CI | Merged into HTML/junit after run |
| `null` | none | Programmatic | Agentic / scripted runs |
| `github` | annotations | GitHub PR | When running in GitHub Actions |

### 2.1 `list`

```
  ok 1 [chromium] › auth › login with valid creds (2.3s)
  ok 2 [chromium] › auth › logout clears session (1.1s)
  x  3 [chromium] › admin › edit user — Error: timeout (30.0s)
```

One line per test with status, path, duration. Most readable for humans.

Options:
```typescript
['list', { printSteps: true }]      // also print test.step() entries
```

### 2.2 `dot`

```
······x·······S···
```

`·` pass, `x` fail, `S` skip, `T` timeout. Compact but uninformative — only useful when you have hundreds of tests and want to see overall progress.

### 2.3 `line`

```
Running 247/500 [chromium] › admin › update profile
```

A single line that updates in place. Saves CI log space.

### 2.4 `html`

```typescript
['html', {
  outputFolder: 'playwright-report',
  open: 'on-failure',                  // 'always' | 'never' | 'on-failure'
  host: '127.0.0.1',                   // for `show-report`
  port: 9323,
  attachmentsBaseURL: '',              // if you host attachments separately
}]
```

Produces a static HTML site at `playwright-report/`. View with `npx playwright show-report`.

See §3 for internals.

### 2.5 `junit`

```typescript
['junit', {
  outputFile: 'test-results/junit.xml',
  stripANSIControlSequences: true,     // remove color codes; some parsers break
  includeProjectInTestName: true,      // [chromium] prefix in test names
  embedAttachmentsAsProperty: 'attachments',
  embedAnnotationsAsProperty: 'annotations',
}]
```

See §4.

### 2.6 `json`

```typescript
['json', { outputFile: 'test-results/results.json' }]
```

See §5.

### 2.7 `blob`

```typescript
['blob', { outputDir: 'blob-report' }]
```

Binary intermediate format for sharded CI. See §6.

### 2.8 `null`

```typescript
['null']
```

No output. Use for programmatic runs where you read results from `onEnd` in a custom reporter.

### 2.9 `github`

```typescript
['github']
```

When running in GitHub Actions:
- Test failures appear as inline annotations in PR "Files changed".
- Logs are grouped collapsibly.
- Step durations appear in the workflow timing.

Auto-enabled when `process.env.GITHUB_ACTIONS === 'true'` if you don't specify a reporter. With explicit reporters, add it: `['github'], ['html'], ...`.

---

## 3. HTML report internals

The HTML report is a static React SPA bundled with Playwright. After running tests:

```
playwright-report/
├── index.html             # the SPA shell
├── trace/                 # extracted Playwright trace viewer
├── data/                  # JSON files with test results
└── ...
```

### 3.1 Opening

```bash
npx playwright show-report                    # default port 9323
npx playwright show-report --host 0.0.0.0     # accessible to other machines
npx playwright show-report --port 8080
npx playwright show-report path/to/folder     # report from a specific folder
```

The server is a simple static file server with one endpoint for the trace viewer.

### 3.2 The view

| Section | Shows |
|---|---|
| Top — summary | Total, passed, failed, flaky, skipped, duration |
| Filter bar | Filter by status, project, name |
| Test list | All tests with timing |
| Selected test | Each step with timing, error messages, attachments |
| Trace viewer | Embedded — see §8 |
| Source view | Your spec file with the failing line highlighted |
| Network tab | All HTTP requests during the test |
| Console tab | console.log/error from the page |

### 3.3 Attachments in HTML report

Anything `testInfo.attach()`'d appears under the test:

```typescript
test('my test', async ({ page }, testInfo) => {
  // ...
  await testInfo.attach('screenshot', { path: 'manual-screenshot.png' });
  await testInfo.attach('payload', { body: JSON.stringify(data), contentType: 'application/json' });
});
```

PNG attachments show inline. JSON/text shows as expandable text. Binary downloads as files.

### 3.4 Hosting

The HTML report is static — host on:
- GitHub Pages (commit `playwright-report/` to a `gh-pages` branch)
- S3 bucket with static website hosting
- Vercel/Netlify (drag-and-drop deploy)
- Internal artifact server

Permanent link to each test run becomes shareable.

### 3.5 Customisation limits

The HTML report's CSS and layout are not directly customisable. To brand:
- Wrap in an iframe in your own dashboard.
- Or use a custom reporter (see §7) that produces HTML you control.
- Or use Allure / ReportPortal which are designed for customisation.

---

## 4. JUnit XML

The lowest-common-denominator format. Every CI dashboard parses JUnit.

### 4.1 The schema

```xml
<testsuites>
  <testsuite name="example.spec.ts" tests="3" failures="1" errors="0" skipped="0" time="5.2">
    <testcase name="example › passes" classname="example.spec" time="1.2"/>
    <testcase name="example › fails" classname="example.spec" time="2.0">
      <failure message="Expected 1, got 2" type="AssertionError">
        ...stack trace...
      </failure>
    </testcase>
    <testcase name="example › skipped" classname="example.spec" time="0.0">
      <skipped/>
    </testcase>
  </testsuite>
</testsuites>
```

### 4.2 What CI dashboards do with it

- Display per-test pass/fail/skip
- Track historical pass rates (e.g., GitLab "Test Reports")
- Surface failure messages in the PR UI
- Compute test count deltas across commits

### 4.3 Attachment embedding

```typescript
['junit', {
  outputFile: 'test-results/junit.xml',
  embedAttachmentsAsProperty: 'attachments',   // base64-embed
}]
```

Includes attachments in the XML. Useful if your CI dashboard supports inline screenshots; bloats the XML otherwise.

### 4.4 The `stripANSIControlSequences` option

```typescript
['junit', { stripANSIControlSequences: true }]
```

Removes ANSI color codes from error messages. Some XML parsers choke on them. Set to `true` unless you're confident your parser handles ANSI.

### 4.5 `includeProjectInTestName`

```typescript
['junit', { includeProjectInTestName: true }]
```

Test names become `[chromium] login passes` instead of `login passes`. Useful when running multiple projects (e.g., Chromium + Firefox + WebKit) — distinguishes which project failed.

---

## 5. JSON

Machine-readable everything.

### 5.1 Structure

```typescript
{
  config: { /* full config */ },
  suites: [
    {
      title: 'example.spec.ts',
      file: '/repo/tests/example.spec.ts',
      specs: [
        {
          title: 'passes',
          tests: [
            {
              projectName: 'chromium',
              results: [
                {
                  status: 'passed',
                  duration: 1200,
                  retry: 0,
                  startTime: '2026-06-09T12:34:56.000Z',
                  attachments: [...],
                  errors: [],
                  stdout: [...],
                  stderr: [],
                  steps: [
                    { title: 'page.goto', duration: 200, ... },
                    { title: 'expect.toBeVisible', duration: 50, ... },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  errors: [],
}
```

### 5.2 Analytics use case

```typescript
import results from './test-results/results.json';

const flakyTests = results.suites
  .flatMap(s => s.specs.flatMap(sp => sp.tests))
  .filter(t => t.results.some(r => r.retry > 0 && r.status === 'passed'));

console.log(`Flaky tests: ${flakyTests.length}`);

const slowTests = results.suites
  .flatMap(s => s.specs.flatMap(sp => sp.tests))
  .filter(t => t.results.some(r => r.duration > 30_000))
  .sort((a, b) => b.results[0].duration - a.results[0].duration);

console.log(`Slowest tests:`, slowTests.slice(0, 10).map(t => ({ title: t.title, duration: t.results[0].duration })));
```

### 5.3 Pipe to Splunk/Datadog/Grafana

```bash
# Send to Splunk HEC
jq -c '.suites[].specs[].tests[].results[]' test-results/results.json | \
  while read line; do
    curl -X POST -H "Authorization: Splunk $SPLUNK_TOKEN" \
      -d "$line" $SPLUNK_HEC_URL
  done
```

### 5.4 JSON vs `blob` for sharded CI

JSON is per-shard; merging requires custom logic. `blob` is purpose-built for merging. Use `blob` for sharded CI, JSON for analytics pipelines on the merged result.

---

## 6. Blob and merge

### 6.1 Why blob exists

Sharded CI produces N JSON files. Merging them naively into one HTML report loses inter-shard ordering, breaks attachment paths, and can't reconstruct the trace links.

`blob` is a binary format optimised for merging. Each shard produces one zip. The merge step reconstructs a unified report.

### 6.2 Per-shard config

```typescript
// playwright.config.ts
reporter: process.env.CI
  ? [['blob', { outputDir: 'blob-report' }]]
  : [['list'], ['html']],
```

Each shard's job artifact is `blob-report/`.

### 6.3 The merge command

```bash
npx playwright merge-reports --reporter html ./all-blob-reports
```

Where `all-blob-reports/` contains the downloaded `blob-report` from each shard.

### 6.4 Multiple output reporters from merge

```bash
npx playwright merge-reports --reporter html,junit ./all-blob-reports
```

Produces both `playwright-report/` (HTML) AND `test-results/junit.xml`. Useful for CI that consumes both.

### 6.5 The `--config` option

```bash
npx playwright merge-reports --config playwright.config.ts --reporter html ./all-blob-reports
```

Uses the config's `reporter` setting (rather than the CLI arg). Lets you parameterise reporter options.

---

## 7. The Reporter interface

For custom reporters, implement `Reporter` from `@playwright/test/reporter`.

### 7.1 The interface

```typescript
interface Reporter {
  onBegin?(config: FullConfig, suite: Suite): void;
  onTestBegin?(test: TestCase, result: TestResult): void;
  onStepBegin?(test: TestCase, result: TestResult, step: TestStep): void;
  onStdOut?(chunk: string | Buffer, test?: TestCase, result?: TestResult): void;
  onStdErr?(chunk: string | Buffer, test?: TestCase, result?: TestResult): void;
  onStepEnd?(test: TestCase, result: TestResult, step: TestStep): void;
  onTestEnd?(test: TestCase, result: TestResult): void;
  onError?(error: TestError): void;
  onEnd?(result: FullResult): void | Promise<void | { status?: FullResult['status'] }>;
  
  printsToStdio?(): boolean;
  onExit?(): void | Promise<void>;
  
  // Lifecycle hooks
  onConfigure?(config: FullConfig): void;
}
```

All methods optional. Implement only what you need.

### 7.2 The key types

```typescript
interface FullConfig {
  projects: Project[];
  metadata: any;
  workers: number;
  // ... and more
}

interface Suite {
  title: string;
  location?: Location;
  parent?: Suite;
  suites: Suite[];
  tests: TestCase[];
  allTests(): TestCase[];
}

interface TestCase {
  title: string;
  titlePath(): string[];     // ['describe1', 'describe2', 'test name']
  location: Location;
  parent: Suite;
  retries: number;
  timeout: number;
  expectedStatus: TestStatus;
  results: TestResult[];     // one per attempt
}

interface TestResult {
  retry: number;             // 0 = first attempt
  startTime: Date;
  duration: number;
  status: 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';
  errors: TestError[];
  attachments: { name: string; path?: string; body?: Buffer; contentType: string }[];
  stdout: (string | Buffer)[];
  stderr: (string | Buffer)[];
  workerIndex: number;
}

interface FullResult {
  status: 'passed' | 'failed' | 'timedout' | 'interrupted';
  startTime: Date;
  duration: number;
}
```

### 7.3 Registering a custom reporter

```typescript
// playwright.config.ts
reporter: [
  ['./reporters/my-reporter.ts'],                          // path
  ['./reporters/with-options.ts', { verbose: true }],      // path + options
],
```

### 7.4 Receiving options

```typescript
// reporters/with-options.ts
export default class MyReporter implements Reporter {
  constructor(private options: { verbose?: boolean }) {}

  onTestEnd(test: TestCase, result: TestResult): void {
    if (this.options.verbose) {
      console.log(`Detailed: ${test.title} - ${result.status}`);
    }
  }
}
```

The constructor receives the options object from the array form.

---

## 8. Trace Viewer

The single most valuable debugging tool in Playwright.

### 8.1 What's in a trace

A trace zip contains:

| File | Contents |
|---|---|
| `0-trace.network` | All HTTP requests/responses with timings |
| `0-trace.stacks` | Stack traces for every Playwright API call |
| `0-trace.trace` | The event log |
| `*.png` | Pre/post screenshots for every action |
| `*.snapshot` | DOM snapshots at every action |
| `resources/*` | Embedded CSS, fonts, images for snapshots |

### 8.2 Capturing traces

```typescript
// playwright.config.ts
use: {
  trace: 'retain-on-failure',
}
```

Modes:
- `'off'` — no trace
- `'on'` — trace every test
- `'retain-on-failure'` — write every test, keep only failures
- `'on-first-retry'` — only retried runs
- `'on-all-retries'` — every retry

### 8.3 Opening a trace

```bash
npx playwright show-trace test-results/<test-id>/trace.zip
```

Opens in browser at `http://localhost:8000` (or `--port=N`).

### 8.4 The viewer

| Tab | Shows |
|---|---|
| Actions | Step-by-step list of Playwright calls. Click to time-travel. |
| Snapshot — Before | DOM state right before the selected action |
| Snapshot — After | DOM state right after the action |
| Snapshot — Action | Action-frame snapshot if available |
| Source | Spec file at the line that produced the action |
| Console | console.log/error from the page at that time |
| Network | HTTP requests with status, size, timing |
| Errors | Page-side exceptions |
| Metadata | Test name, project, retry, browser, viewport |

### 8.5 The "Pick locator" feature

Hover any element in the snapshot view. Playwright shows the locator it would use to find that element. Click to copy.

This is the FASTEST way to write a new locator — open the trace, find the element visually, copy the suggested locator.

### 8.6 Time travel

The timeline at the bottom shows all actions. Click anywhere to see the DOM at that moment. You can:
- Scrub forward and backward.
- Compare before/after a specific action.
- See exactly when the element appeared / disappeared.

### 8.7 Network inspection

The Network tab is fully interactive:
- Click a request to see headers, body (if captured), status, timing.
- Filter by URL pattern.
- See which response correlates with which action.

For diagnosing "the API didn't return" or "the request was malformed."

### 8.8 Trace size optimization

```typescript
use: {
  trace: {
    mode: 'retain-on-failure',
    screenshots: false,         // skip per-action screenshots
    snapshots: true,            // keep DOM snapshots
    sources: false,             // skip embedding source code
  },
},
```

Disabling screenshots cuts trace size 50–80% but loses before/after visual comparison.

### 8.9 Trace overhead

On a 30-action test:

| Trace mode | Wall-clock | Disk |
|---|---|---|
| `'off'` | 6.0 s | 0 |
| `'retain-on-failure'` | 6.2 s | 0 (on pass) |
| `'on'` | 6.4 s | 250 KB |
| `'on'` heavy SPA | 7.5 s | 5 MB |

The 4% overhead of `'retain-on-failure'` is always worth it for the debugging power.

---

## 9. UI Mode

Interactive test runner with watch mode, time travel, and instant feedback.

### 9.1 Launching

```bash
npx playwright test --ui
```

Opens a desktop app (technically: an Electron-like view in your default browser via Playwright's own UI).

### 9.2 What it shows

| Panel | Shows |
|---|---|
| Test list (left) | All your tests, with status indicators |
| Pickable selector | Top right — auto-generates locators when you click in the live page |
| Live page | The browser instance running the selected test |
| Timeline | Visual timeline of the test run |
| Actions list | Every Playwright call, time-travel-able |
| Source | Your spec file, highlightable |
| Watch | File watcher rerun on save |

### 9.3 Watch mode

UI mode auto-reruns tests when their spec file changes. Edit → save → see the test re-run instantly.

You can scope:
- "Watch this test only" — only the currently-selected test reruns.
- "Watch this file only" — all tests in the file rerun.
- "Watch all" — entire suite reruns.

### 9.4 The dev loop

```
1. Open UI Mode (`npx playwright test --ui`)
2. Click your test
3. Edit your spec
4. Save
5. See it run instantly
6. Click on a failing action
7. See the DOM at that moment
8. Pick a locator if needed
9. Edit, save, rerun
```

This is the fastest test-writing experience in any framework. Use it constantly during development.

### 9.5 Pickable locators

Click "Pick locator" → click any element in the live page → Playwright generates and copies the locator.

The generated locators are smart:
- Prefers `getByRole`, `getByText`, `getByLabel`.
- Falls back to `getByTestId` if available.
- Falls back to CSS only when nothing else uniquely identifies.

Always pick locators this way instead of manually writing CSS — the suggestions are usually better.

### 9.6 When NOT to use UI Mode

- CI runs (no display).
- Headless-only testing (UI mode runs headed).
- Quick targeted tests (`npx playwright test --grep` is faster for one-off runs).

For everything else — use UI Mode.

---

## 10. Inspector

Pause execution and step through.

### 10.1 Launching

```bash
PWDEBUG=1 npx playwright test
# OR
npx playwright test --debug
```

Both pause at the start of the first test and open the Inspector.

### 10.2 The Inspector window

A separate window with:
- Step / Resume controls
- Action history
- The page being tested
- Pickable locator

### 10.3 Stepping through

- **Step over** — execute the next Playwright call.
- **Resume** — continue to the next breakpoint or end of test.
- **Pause** — pause execution at the current point.

### 10.4 Inserting a programmatic pause

```typescript
test('debug me', async ({ page }) => {
  await page.goto('/login');
  await page.pause();   // pauses ONLY when PWDEBUG=1 or --debug
  await page.fill('#username', 'admin');
});
```

`page.pause()` is a no-op in headless mode. In Inspector mode, it stops execution and waits for you to step.

### 10.5 When to use Inspector vs Trace

| Inspector | Trace |
|---|---|
| During test development | After a failure happened |
| Live debugging | Post-mortem |
| Need to interact with browser | Just inspecting state |
| Single test in isolation | Failures from CI |

UI Mode supersedes the Inspector for most cases. Use the standalone Inspector mainly when you need a specific debug scenario UI Mode doesn't support.

---

## 11. Allure integration

Allure is a popular reporting framework with rich UI, history, trend graphs, and team dashboards.

### 11.1 Installation

```bash
npm i -D allure-playwright allure-commandline
```

### 11.2 Config

```typescript
reporter: [
  ['list'],
  ['allure-playwright', {
    outputFolder: 'allure-results',
    detail: true,
    suiteTitle: false,
  }],
],
```

### 11.3 Generate the report

```bash
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

### 11.4 Allure annotations

```typescript
import { allure } from 'allure-playwright';

test('placing an order', async ({ page }) => {
  await allure.feature('Checkout');
  await allure.story('Place order with credit card');
  await allure.severity('critical');
  await allure.owner('jane@example.com');
  await allure.tag('regression', 'checkout');
  await allure.link('JIRA-1234', 'https://jira.example.com/JIRA-1234', 'issue');
  await allure.parameter('payment_method', 'card');

  // ... test body

  await allure.attachment('order-confirmation', JSON.stringify(orderJson), 'application/json');
});
```

### 11.5 What Allure adds over Playwright HTML

- Trend graphs (pass rate over time)
- Categorisation by feature/story
- Custom fields and tags
- Team-level dashboards (when paired with `allure-tools-server`)
- Historical data — see flake trends, performance regressions

### 11.6 When to use

- Large teams (50+ engineers) needing shared dashboards.
- Long-running suites where trend analysis matters.
- Stakeholders who need non-developer-facing reports.
- Compliance / audit (Allure can produce signed reports).

### 11.7 When NOT to use

- Small teams — overhead isn't worth it.
- Don't need historical trends.
- CI cost-sensitive (Allure adds steps, storage).

---

## 12. ReportPortal integration

ReportPortal is a server-based reporting platform with ML-powered failure analysis.

### 12.1 Setup

```bash
npm i -D @reportportal/agent-js-playwright
```

```typescript
reporter: [
  ['list'],
  ['@reportportal/agent-js-playwright', {
    apiKey: process.env.RP_API_KEY,
    endpoint: 'https://reportportal.example.com/api/v1',
    project: 'qa-team',
    launch: 'Playwright Suite',
    description: `Run on ${process.env.GITHUB_SHA}`,
    attributes: [
      { key: 'env', value: process.env.ENV ?? 'local' },
      { key: 'build', value: process.env.BUILD_ID ?? 'manual' },
    ],
  }],
],
```

### 12.2 What ReportPortal does

- Aggregates results across many runs.
- ML-based failure classification (clusters similar failures).
- Auto-quarantine: flags tests with high flakiness for review.
- Historical comparison (this run vs last week).
- Slack/Teams notifications on failure patterns.

### 12.3 When to use

- Multi-team, multi-project orgs.
- Need ML-based failure triage.
- Already running ReportPortal for other test frameworks.

### 12.4 When NOT to use

- Single team < 20 engineers.
- Self-hosting is operationally heavy.
- The cost of running RP exceeds the time saved.

---

## 13. Custom reporters — 5 examples

### 13.1 Slack notifier

```typescript
// reporters/slack-reporter.ts
import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';

export default class SlackReporter implements Reporter {
  private failures: { test: string; error: string }[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === 'failed') {
      this.failures.push({
        test: test.titlePath().join(' › '),
        error: result.errors[0]?.message ?? 'Unknown error',
      });
    }
  }

  async onEnd(result: FullResult): Promise<void> {
    if (this.failures.length === 0) return;

    const text = `❌ Playwright run ${result.status}: ${this.failures.length} failures\n\n` +
      this.failures.slice(0, 10).map(f => `• ${f.test}\n   ${f.error}`).join('\n');

    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  }
}
```

### 13.2 Flake detector

```typescript
export default class FlakeDetector implements Reporter {
  private flakes: { test: string; retries: number }[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === 'passed' && result.retry > 0) {
      this.flakes.push({
        test: test.titlePath().join(' › '),
        retries: result.retry,
      });
    }
  }

  onEnd(): void {
    if (this.flakes.length > 0) {
      console.warn(`\n⚠️  ${this.flakes.length} flaky tests detected:`);
      for (const f of this.flakes) {
        console.warn(`  • ${f.test} (passed on retry ${f.retries})`);
      }
    }
  }
}
```

### 13.3 GitHub PR commenter

```typescript
import { Octokit } from '@octokit/rest';

export default class PRCommenter implements Reporter {
  private results: { total: number; passed: number; failed: number; flaky: number } = { total: 0, passed: 0, failed: 0, flaky: 0 };

  onTestEnd(test: TestCase, result: TestResult): void {
    this.results.total++;
    if (result.status === 'passed' && result.retry > 0) this.results.flaky++;
    else if (result.status === 'passed') this.results.passed++;
    else if (result.status === 'failed') this.results.failed++;
  }

  async onEnd(): Promise<void> {
    if (!process.env.GITHUB_TOKEN || !process.env.PR_NUMBER) return;

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    await octokit.issues.createComment({
      owner: 'myorg',
      repo: 'myrepo',
      issue_number: parseInt(process.env.PR_NUMBER),
      body: `## Playwright Results\n\n` +
        `✅ Passed: ${this.results.passed}\n` +
        `❌ Failed: ${this.results.failed}\n` +
        `⚠️ Flaky: ${this.results.flaky}\n` +
        `**Total: ${this.results.total}**\n\n` +
        `[Full report](https://reports.example.com/run/${process.env.GITHUB_RUN_ID})`,
    });
  }
}
```

### 13.4 Datadog metrics emitter

```typescript
export default class DatadogReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult): void {
    // Async fire-and-forget; don't block test runs
    const tags = [
      `project:${test.parent.project()?.name}`,
      `status:${result.status}`,
      `retry:${result.retry}`,
    ];

    fetch('https://api.datadoghq.com/api/v1/series', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': process.env.DD_API_KEY!,
      },
      body: JSON.stringify({
        series: [{
          metric: 'playwright.test.duration',
          points: [[Math.floor(Date.now() / 1000), result.duration]],
          tags,
        }],
      }),
    }).catch(e => console.warn('DD emit failed:', e));
  }
}
```

### 13.5 S3 trace uploader

```typescript
import { S3 } from '@aws-sdk/client-s3';
import * as fs from 'node:fs';

export default class S3TraceUploader implements Reporter {
  private s3 = new S3({ region: 'us-east-1' });

  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    if (result.status !== 'failed') return;

    const traceAttachment = result.attachments.find(a => a.name === 'trace');
    if (!traceAttachment?.path) return;

    const key = `traces/${process.env.GITHUB_SHA}/${test.id}.zip`;
    await this.s3.putObject({
      Bucket: 'playwright-traces',
      Key: key,
      Body: fs.readFileSync(traceAttachment.path),
    });

    console.log(`Trace uploaded: s3://playwright-traces/${key}`);
  }
}
```

---

## 14. Attachments

`testInfo.attach()` surfaces files and data in the HTML report and JSON.

### 14.1 Path-based

```typescript
await testInfo.attach('Screenshot at error', { path: '/tmp/screenshot.png' });
```

The HTML report shows it inline (if image) or as a download link.

### 14.2 Body-based

```typescript
await testInfo.attach('Request payload', {
  body: JSON.stringify(payload, null, 2),
  contentType: 'application/json',
});
```

Inline content, no temp file needed.

### 14.3 Common content types

| Content type | Renders as |
|---|---|
| `image/png`, `image/jpeg` | Inline image |
| `text/plain`, `text/html` | Expandable text |
| `application/json` | Pretty-printed JSON |
| `application/pdf` | Download link + inline preview (browser-dependent) |
| `application/zip` | Download link |
| `video/webm` | Inline video player |

### 14.4 Use cases

- Captured API responses for debugging
- Generated test data files
- DOM snapshots for visual comparison
- Performance profile dumps
- Console error logs from page

```typescript
test('debug attachable info', async ({ page }, testInfo) => {
  const response = await page.request.get('/api/me');
  const body = await response.json();

  // Attach for debugging
  await testInfo.attach('API response', {
    body: JSON.stringify(body, null, 2),
    contentType: 'application/json',
  });

  // Continue with assertions
  expect(body.id).toBeDefined();
});
```

---

## 15. Test annotations

Annotations surface metadata in reports.

### 15.1 Basic syntax

```typescript
test('important test', { tag: ['@regression', '@checkout'] }, async ({ page }) => {
  test.info().annotations.push({ type: 'owner', description: 'jane@example.com' });
  test.info().annotations.push({ type: 'issue', description: 'JIRA-1234' });
  test.info().annotations.push({ type: 'severity', description: 'high' });
  // ...
});
```

### 15.2 Where they appear

- HTML report: dedicated annotations section per test.
- JSON: in the `annotations` array of each result.
- JUnit (with `embedAnnotationsAsProperty`): as XML properties.

### 15.3 The `@` tag syntax

```typescript
test('checkout flow @smoke @regression', async ({ page }) => {
  // ...
});
```

Tags after `@` are picked up by `--grep` filtering:

```bash
npx playwright test --grep @smoke
```

Combine with config:

```typescript
projects: [
  { name: 'smoke', grep: /@smoke/, retries: 0 },
  { name: 'regression', grep: /@regression/, retries: 2 },
],
```

### 15.4 Programmatic tags

```typescript
test('dynamic tag', async ({ page }, testInfo) => {
  if (process.env.RUN_AS_FLAKY) {
    testInfo.annotations.push({ type: 'flaky', description: 'Known issue' });
  }
});
```

---

## 16. Slow test reporting

```typescript
// playwright.config.ts
reportSlowTests: {
  max: 5,                  // surface up to 5 slow tests
  threshold: 15_000,       // any test over 15s is "slow"
},
```

After every run, the list reporter shows:

```
Slow test file: tests/checkout.spec.ts (32s)
Slow test file: tests/admin.spec.ts (28s)
...
```

Use to find tests worth optimising.

### 16.1 Marking known-slow tests

```typescript
test('long-running data import', async ({ page }) => {
  test.slow();                       // multiplies test timeout by 3
  // ...
});
```

`test.slow()` does three things:
- Multiplies the test timeout by 3 (default 30s → 90s).
- Marks the test as slow in reports.
- Tells Playwright's shard algorithm to balance slow tests across shards.

---

## 17. Flakiness detection

### 17.1 In Playwright (built-in)

Tests that pass on a retry are reported as "flaky" in the HTML report:

```
Test Suites: 50
Tests:       247 (235 passed, 5 failed, 7 flaky)
```

The flaky count = passed-on-retry. They didn't fail, but they didn't pass first time.

### 17.2 In CI dashboards

Many CI dashboards highlight flakiness:
- GitHub Actions: shows retry count.
- GitLab: "Test Reports" tab shows flake history.
- Azure DevOps: built-in "Flaky tests" view.

### 17.3 Via JSON analysis

```typescript
import results from './test-results/results.json';

const flakyTests = results.suites
  .flatMap(s => s.specs)
  .flatMap(sp => sp.tests)
  .filter(t => t.results.some(r => r.retry > 0 && r.status === 'passed'));

for (const t of flakyTests) {
  console.log(`${t.title}: passed on retry ${t.results.find(r => r.status === 'passed')?.retry}`);
}
```

### 17.4 Quarantine policy

```typescript
// fixtures/quarantine.ts
const QUARANTINED = ['tests/known-flake.spec.ts:23'];

test.beforeEach(async ({}, testInfo) => {
  if (QUARANTINED.includes(`${testInfo.file}:${testInfo.line}`)) {
    test.skip(true, 'QUARANTINED — see issue #1234');
  }
});
```

Codifies which flakes are known + tracked. Don't let "quarantine" become a permanent hospice.

---

## 18. Common production failures

### Failure 1 — HTML report doesn't open after CI

**Symptom:** `npx playwright show-report` on artifact opens but shows no data.

**Cause:** Downloaded only `playwright-report/index.html`, not the full folder.

**Fix:** Upload the entire `playwright-report/` directory as the artifact.

### Failure 2 — Sharded reports don't merge

**Symptom:** `merge-reports` errors with "Invalid blob".

**Cause:** Playwright version mismatch across shards.

**Fix:** Pin version in `package.json`; `npm ci` ensures consistency.

### Failure 3 — JUnit XML breaks Jenkins parser

**Symptom:** Jenkins shows 0 tests despite results existing.

**Cause:** ANSI color codes in error messages confuse the XML parser.

**Fix:** `stripANSIControlSequences: true`.

### Failure 4 — Custom reporter not invoked

**Symptom:** Tests run but reporter's `onTestEnd` never fires.

**Cause:** Path to reporter file is wrong, OR reporter file has a syntax error and silently fails to load.

**Fix:** Check path is correct relative to config. Run `node -e "require('./reporters/my-reporter.ts')"` to surface load errors.

### Failure 5 — Trace viewer crashes on huge trace

**Symptom:** `show-trace` hangs the browser tab.

**Cause:** Trace > 500 MB. Common when `trace: 'on'` + SPA with many DOM snapshots.

**Fix:** Slim future traces (`trace: { mode: 'on', screenshots: false, snapshots: true }`). For the existing huge one, extract specific files manually:
```bash
unzip trace.zip -d /tmp/trace
# Inspect individual files
```

### Failure 6 — UI Mode shows old test list

**Symptom:** Added a new test; UI Mode doesn't show it.

**Cause:** UI mode caches the test list.

**Fix:** Press the refresh icon at the top of the list pane, or restart UI Mode.

### Failure 7 — Reporter blocks `onEnd` indefinitely

**Symptom:** Tests finish but the run hangs.

**Cause:** Custom reporter `onEnd` awaits a Slack webhook that timed out.

**Fix:** Use `Promise.race` with a timeout, or fire-and-forget for non-critical reporting:
```typescript
async onEnd(): Promise<void> {
  await Promise.race([
    fetch(slackUrl, ...),
    new Promise(resolve => setTimeout(resolve, 5000)),  // max 5s
  ]);
}
```

### Failure 8 — Attachments missing in merged report

**Symptom:** Per-shard reports show attachments; merged doesn't.

**Cause:** Attachments were absolute paths to per-shard worker temp dirs.

**Fix:** Use `testInfo.outputPath()` for attachments. Then merge correctly copies them.

### Failure 9 — `github` reporter not annotating PR

**Symptom:** Test fails in CI but no PR annotation appears.

**Cause:** Either not running in `pull_request` context, OR `permissions` not set in workflow.

**Fix:** Add permissions:
```yaml
permissions:
  pull-requests: write
  contents: read
  checks: write
```

### Failure 10 — Allure report shows wrong test count

**Symptom:** Allure says 100 tests; Playwright HTML says 150.

**Cause:** Allure plugin missed tests due to early termination or worker crash.

**Fix:** Compare with `results.json` (ground truth). Investigate plugin compatibility with Playwright version.

---

## 19. Anti-pattern catalog

| ❌ | ✅ |
|---|---|
| Only `list` reporter in CI | Include `html`, `junit`, optionally `json` |
| `trace: 'on'` in CI | `trace: 'retain-on-failure'` |
| No JUnit XML for CI dashboard | `junit` reporter for dashboard integration |
| Massive `console.log` per test for debugging | `testInfo.attach()` — appears in HTML report |
| Custom reporter that blocks tests on slow webhook | Fire-and-forget OR `Promise.race` with timeout |
| Reporter that throws on missing env vars | Log warning, continue |
| Reporter with secrets in `console.log` | Mask credentials in logs |
| `show-report` without uploading full folder | Upload entire `playwright-report/` dir |
| Allure on a 20-test suite | Built-in HTML is enough |
| Manual annotation entry in test bodies | Use the `tag` option in `test()` |
| Trace viewer in production CI logs | Upload as artifact; viewer needs full zip |
| Quarantine forever without owner | Quarantine has an expiry; assigned to a person |
| `reportSlowTests: null` | Always surface slow tests for awareness |

---

## Cross-references

- Reporter config: [`./02_config.md#4-reporters`](./02_config.md#4-reporters)
- Trace artifacts in CI: [`./10_ci_docker.md#12-artifact-handling`](./10_ci_docker.md)
- Reliability + trace diagnosis: [`./08_reliability.md#14-trace-viewer-diagnostic`](./08_reliability.md)
- Custom reporter capstone: [`../challenges/CAP_C2_Custom_Reporter.md`](../challenges/CAP_C2_Custom_Reporter.md)
