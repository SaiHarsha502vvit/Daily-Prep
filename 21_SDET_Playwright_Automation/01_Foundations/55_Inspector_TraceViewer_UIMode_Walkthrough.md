# 55. Inspector, Trace Viewer & UI Mode — A Hands-On Walk-Through

**Navigation**: [← 54. Synthetic Monitoring](../06_CI_CD_And_Reliability/54_Synthetic_Monitoring.md) | [Index](../00_INDEX.md) | [→ 56. Playwright Config Deep-Dive](./56_Playwright_Config_Deep_Dive.md)

> This chapter is meant to be done at a terminal, with the [`framework/`](../framework/) project installed. It's 30 minutes of clicking around. Don't just read it.

---

## 5W1H

- **WHAT**: The three debugging surfaces Playwright ships — Inspector (step through live), Trace Viewer (time-travel into a past run), UI Mode (interactive REPL with watch mode).
- **WHY**: Every "why is this test failing?" question becomes 10× cheaper to answer when you know which surface to open. New SDETs stare at console output for hours when one of these tools would have shown them the answer in 30 seconds.
- **WHO**: You, the first time a test fails and you don't immediately know why.
- **WHEN**: Now, before you accumulate the "I'll figure this out next time" debt.
- **HOW**: Run each command below against the framework. Take screenshots of anything that surprises you.

---

## Setup check

You should have:

```
21_SDET_Playwright_Automation/framework/
├── node_modules/         ← from npm install
├── .env                  ← from cp .env.example .env
├── playwright.config.ts
└── tests/orangehrm/login.spec.ts
```

`npm run test` runs **every** project in the framework config (UI, API, Firefox, mobile …) — far more than this chapter needs, and the UI projects hit a live demo site. Scope every command in this chapter to the login spec; arguments after `--` are passed through to `playwright test`:

```
npm run test -- --project=orangehrm login.spec.ts
```

You will see something like (shape from the 1.64.1 `list` reporter; timings and worker count vary):

```
Running 5 tests using 4 workers
  ok 1 [orangehrm] › tests\orangehrm\login.spec.ts:21:7 › OrangeHRM Login › @smoke valid credentials land on dashboard (3.2s)
  ok 2 [orangehrm] › tests\orangehrm\login.spec.ts:35:7 › OrangeHRM Login › @regression wrong password shows invalid credentials alert (1.9s)
  ...
  5 passed (12.3s)
```

If everything is green, deliberately break it for the rest of this chapter. Edit `tests/orangehrm/login.spec.ts`:

```typescript
await dashboardPage.expectLoaded(); // ← change to .expectTotallyWrongMethod()
```

Save. Now the test will fail with `TypeError: dashboardPage.expectTotallyWrongMethod is not a function` — Playwright transpiles TypeScript without type-checking (verified: a call to a non-existent method on a typed class only fails when that line executes), so run `npm run verify` / `tsc --noEmit` separately if you want the compiler to catch this class of typo. Good.

---

## Surface 1 — Inspector (step-through, while it runs)

```
npm run test:debug -- --project=orangehrm login.spec.ts:21
```

`test:debug` is `playwright test --debug`. Per `npx playwright test --help` on 1.64.1 that is a shortcut for `PWDEBUG=1` plus `--timeout=0 --max-failures=1 --headed --workers=1` — so it runs **one test at a time with no timeout and stops after the first failure**, and the `file:line` suffix (the line of a `test(` call) picks the single test to debug instead of walking the whole suite. It:

- Opens a headed Chromium window **and** the Inspector window
- Starts **paused at the first action** (measured: the process prints `The test is currently paused at the start`); from there you advance with Step over (`F10`) / Resume (`F8`) — both labels are in the 1.64.1 Inspector bundle
- Offers **Pick locator** and **Record** in the toolbar

Two variants worth knowing: `await page.pause();` inside a test pauses there when run with `--debug` (Resume runs up to it), and `--debug=cli` (listed in the 1.64.1 `--help`: `--debug [mode]`, choices `inspector` / `cli`) skips the GUI — it pauses at the start and prints `Run "playwright-cli attach <session>" to attach to this test`, which is the entry point for terminal- or agent-driven debugging ([Ch45](../07_Specialised_Testing/45_AI_Agents_MCP_And_Playwright.md)).

### What to try

1. Click "Step over" once. The test advances one action; the line that is *about to run* is highlighted.
2. Click "Step over" again. The browser navigates. The next action highlights.
3. Click **"Pick locator"** at the top of the Inspector. Hover over a UI element in the page. Click it. Playwright proposes a locator for it (it prefers role/text/test-id locators — treat it as a starting point, not gospel).
4. Open the Inspector's side panel. Its tabs are **Locator** (edit a locator and see matches highlighted), **Log** (the actionability log — which checks passed or are blocking the current action) and **Aria** (an aria snapshot you can turn into an assertion).

### When to reach for Inspector

- You're writing a new POM method and the locator might not be right.
- A test is failing at a specific click and you want to see the page state at that moment.
- You're learning Playwright and want to feel the cadence of actions.

### When NOT to reach for it

- The test failed in CI. Inspector can't help with past runs — use Trace Viewer.
- The test runs in 0.4s. Stepping through it manually is slower than reading the code.

---

## Surface 2 — Trace Viewer (time-travel through a past run)

This is the killer feature. Even most working SDETs underuse it.

The framework's `playwright.config.ts` has:

```typescript
use: {
  trace: "on-first-retry",
}
```

That records a trace **only on the first retry** — and the framework's retries are `isCI ? 2 : 0`. So on your laptop (retries `0`) a failing test produces **no trace at all** (measured: `trace: 'on-first-retry'`, `retries: 0`, failing test → `test-results/` held only `error-context.md`). For this walk-through, override the mode on the command line (CLI `--trace` accepts all seven modes, [Ch56 §7](./56_Playwright_Config_Deep_Dive.md#trace)):

```
npm run test -- --project=orangehrm login.spec.ts --trace retain-on-failure
```

It fails. The summary now includes (1.64.1 output, path will differ):

```
    attachment #2: trace (application/zip) ───────────────────────────
    test-results\...\trace.zip
    Usage:
        npx playwright show-trace test-results\...\trace.zip
```

(`attachment #1` is the `error-context.md` file: a ready-made prompt — failure text, aria snapshot of the page, and the test source — you can paste into an LLM.)

Now run that suggested command. A web page opens. You can also open a trace you downloaded from CI at <https://trace.playwright.dev> (processed in the browser, nothing is uploaded — per the [Trace Viewer docs](https://playwright.dev/docs/trace-viewer), which also describe passing a remote trace URL).

### What you see in Trace Viewer

Layout as rendered by 1.64.1 (checked by loading a real trace in the viewer):

```
┌──────────────────────────────────────────────────────────────┐
│ Timeline filmstrip  (action markers; red = error)            │
├─────────────┬────────────────────────────────────────────────┤
│ Actions     │ [Action | Before | After]   ◎ Pick locator  ◀ ▶ │
│ Metadata    │                                                │
│  Before     │      DOM snapshot of the page (live DOM,       │
│  Hooks      │      inspectable) at the selected action       │
│  Navigate   │                                                │
│  Click      │                                                │
│  Expect ✗   │                                                │
├─────────────┴────────────────────────────────────────────────┤
│ Locator | Call | Log | Errors | Console | Network | Source |  │
│ Attachments | Annotations                                    │
└──────────────────────────────────────────────────────────────┘
```

### What to try

1. Click an action in the Actions list. The centre panel shows the **DOM snapshot at that moment** — a real DOM you can inspect, not a screenshot.
2. Flip between the **Action / Before / After** tabs above the snapshot — the page immediately before the action, at the instant it ran (with the hit point highlighted), and immediately after.
3. Click the **Network** tab. Every HTTP call with headers, request/response bodies and timing.
4. Click the **Console** tab. Page `console.*` output is marked `[browser]`, and your Node-side `console.log` from specs/POMs appears as `[stdout]` (both seen with `npx playwright trace console` on a real trace).
5. Click the **Source** tab for the TS line that ran, **Errors** for the failure with its call log, **Call** for the action's parameters and timing, and **Log** for Playwright's internal steps (actionability checks, retries).
6. **Pick locator** (the ◎ icon beside Action/Before/After) works on the snapshot — the same locator suggestion as in the Inspector, but against a past run.

### Reading a trace without a GUI

On a server, in an SSH session, or from an AI agent there is no window to open. `npx playwright trace` (listed in 1.64.1's `npx playwright --help`) inspects a trace from the terminal — it is stateful: `open` extracts the trace, the other subcommands read it, `close` cleans up:

```bash
npx playwright trace open test-results/.../trace.zip
npx playwright trace actions     # numbered action list with durations; failed action marked ✗
npx playwright trace errors      # failures with stack traces
npx playwright trace requests    # network requests (method, status, duration)
npx playwright trace console     # [stdout] / [browser] messages with timestamps
npx playwright trace close
```

(Also `action <id>`, `request <id>`, `snapshot <id>`, `screenshot <id>`, `attachments`; `--help` lists them. Output of all four above was checked on a 1.64.1 trace of the failing example.)

### The mental shift

Before Trace Viewer, "the test failed in CI" means SSH-ing into something, re-running, hoping. With Trace Viewer, you open a zip from CI artifacts and have the **full forensic record**.

Save Trace Viewer screenshots to your interview notes. "I diagnose CI failures using Trace Viewer's DOM snapshots and network panel" is a credible answer to "how do you debug flaky tests."

### Always-on tracing for local dev

For local development, override:

```bash
npx playwright test --trace on
```

`on` (always) vs `retain-on-failure` (only on fail) — the former eats disk, the latter is what CI uses.

---

## Surface 3 — UI Mode (the interactive REPL)

```
npm run test:ui
```

A standalone Playwright app opens. It is the most efficient way to write a new test.

### What UI Mode gives you

```
┌──────────────────┬─────────────────────────────────────────┐
│ Test sidebar     │ Live browser + Trace Viewer combined    │
│                  │                                         │
│  ▸ orangehrm     │  ┌─────────────────────────────────────┐│
│    □ valid login │  │ Real browser, last-run state         ││
│    □ wrong pwd   │  │                                      ││
│    ...           │  └─────────────────────────────────────┘│
│                  │                                         │
│ ▸ filters        │  Actions   |  Source  |  Network        │
│   smoke|reg|...  │                                         │
└──────────────────┴─────────────────────────────────────────┘
```

### What to try

1. Click one test in the sidebar. Click ▶ Run.
2. After it finishes, click the actions timeline. Same time-travel as Trace Viewer, but live.
3. Click 👁 "Watch" on a test. Edit the test file in VS Code. UI Mode **re-runs automatically** on save.
4. Filter by `@smoke` tag — only smoke tests visible.
5. Click "Pick Locator" in the toolbar — same as Inspector's pick.

### The actual workflow

When you're writing a new test:

1. Open UI Mode.
2. Pin the test to Watch.
3. Edit the spec / POM in VS Code.
4. Save → UI Mode re-runs in ~2 seconds.
5. Step through actions → fix → save → see green.

This loop is roughly **10× faster** than `npm run test` per cycle. New SDETs who don't use UI Mode are working with one hand tied.

### When NOT to use UI Mode

- CI — it's interactive only.
- When you need to test something that requires a clean process state (rare).
- When you want to see the final report — use HTML reporter instead.

---

## War Stories — The Wrong Tool Costs Hours

### Story 1: 4 hours of console.log vs 12 minutes of Trace Viewer

A senior SDET spent a morning debugging a flaky test. The symptom: a `page.click()` on a "Save" button occasionally threw `Target closed` — the page navigated away before the click landed. The test passed locally 9/10 times; in CI it failed 4/10 times.

Debugging approach: added `console.log` statements before every action, ran locally, watched logs. The timing varied but the log never showed anything wrong. Tried adding `await page.waitForLoadState('networkidle')` before the click. Still flaky.

After 4 hours: a colleague suggested opening the CI trace artifact. Two clicks in, the Network tab showed the root cause: a `POST /api/save-draft` request was firing on every keystroke. The auto-save was triggering a page reload mid-test. The `console.log` approach had no visibility into network calls. The trace had captured it in the very first failed run.

Fix: `await page.waitForResponse('**/api/save-draft')` before the click. Done in 12 minutes.

**The lesson:** `console.log` is blind to network calls, async state, and frame-level events. Trace Viewer records all of these with zero setup. The 4 hours were lost because the right tool was available and unused.

### Story 2: Inspector chosen for CI failure (wrong tool)

A junior SDET saw a test fail in CI. Their debugging instinct: run `npm run test:debug` locally (Inspector). The test passed. Run again — still passes. "It works locally." This cycle repeated for three days. The bug was a timing issue specific to the CI machine's CPU speed.

The trace artifact from the CI run was sitting in the GitHub Actions artifacts tab the whole time. It showed exactly which action timed out and the exact DOM state when it happened. The junior didn't know about Trace Viewer.

The rule: **Inspector = live debugging on your machine. Trace Viewer = forensics on what already happened.**

CI failures are forensic problems. Inspector is a surgery tool for live problems. Using surgery tools for forensics is why "it works on my machine" takes 3 days instead of 20 minutes.

---

## Surface comparison — when to use which

| Symptom                                                    | Tool                                | Why                                |
| ---------------------------------------------------------- | ----------------------------------- | ---------------------------------- |
| "Test fails in CI, works locally"                          | **Trace Viewer** on the CI artifact | Time-travel is the only honest way |
| "I'm writing a new test from scratch"                      | **UI Mode** + Watch                 | Edit-save-replay loop              |
| "I need to know what locator to use"                       | **Inspector** Pick Locator          | Live DOM inspection                |
| "Test passes but is slow"                                  | **Trace Viewer**                    | Timeline shows what took the time  |
| "Network call returns wrong data"                          | **Trace Viewer** Network tab        | Headers, payloads, response shapes |
| "Page is weird state, need to inspect"                     | **Inspector** pause                 | Step through to that moment        |
| "I changed the locator strategy, want to re-test 20 specs" | **UI Mode** filtered                | Bulk re-run with watch             |

---

## Common mistakes

1. **`console.log` debugging.** This is the SDET equivalent of "have you tried turning it off." Reach for Trace Viewer first.
2. **Running CI tests locally to reproduce a failure.** The trace from CI already has the answer — no reproduction needed.
3. **Not retaining traces in CI.** Add `trace: 'retain-on-failure'` and upload `test-results/` as artifacts. Without that, post-mortems are blind.
4. **Using UI Mode for the final test run.** UI Mode is the dev loop. The "real" run is `npm run test`.

---

## Senior SDET perspective

How a senior debugs a flaky CI test:

```
1. CI Slack post → "test X failed"
2. Click the GitHub Actions run → download the trace artifact
3. Open trace, click failing action
4. 80% of the time: locator hit a stale element / wait was wrong / race condition
5. Fix the wait, push, watch CI go green
6. Add the war story to the team wiki
```

That whole loop is under 15 minutes when traces are wired right. Without them, the same loop is 2 hours of guessing.

---

## DevSecOps seed

The Network panel in Trace Viewer is the single most useful place to check whether your tests are leaking secrets in request headers or payloads. Run one test with `trace: 'on'`, open it, and **scan every request's Authorization header**. If you see a literal token instead of `***`, your `describeForLog` discipline (Ch 51) needs work.

---

## Exercise

1. Run `npm run test` against the broken login test. It fails. Open the trace.
2. Click through every action. Note exactly which one failed and what the DOM looked like at that moment.
3. Fix the spec, re-run, see green.
4. Now run `npm run test:ui`. Pin the same test to Watch. Edit the assertion message, save. Confirm it re-runs.
5. Run `npm run test:debug`. Step through the test manually. Note how slow this is compared to UI Mode for the same diagnostic.

Result: you now know which of the three to reach for in any future failure. That's the actual skill.


---

## Reality Check

**"Playwright Inspector is only for generating locators"**→ Inspector is a real-time debugging tool: pause tests mid-execution, step through actions one at a time, modify locators and test them against the live page, and inspect the DOM state at any point. Using Inspector only for codegen misses its primary value as a debugging environment for understanding why tests fail.

**"Trace Viewer is only useful after a test fails"**→ Trace files capture: every DOM snapshot, network request and response, console log, and action with timing. Even for PASSING tests, traces reveal: unnecessary waits, slow network requests, redundant navigations, and race conditions that happened to resolve favorably. Review traces of slow-passing tests to find optimization opportunities.

**"UI Mode replaces the CLI test runner"**→ UI Mode is a DEVELOPMENT tool for writing and debugging tests interactively. It reruns tests on file change, shows live browser preview, and provides instant feedback. But CI/CD must use the CLI runner (npx playwright test) for headless execution, parallel distribution, and artifact collection. UI Mode is your inner development loop; CLI is your outer CI/CD loop.

**"Screenshots are enough for debugging test failures"**→ Screenshots capture ONE moment — the state when the failure was detected. But the failure cause may have happened BEFORE the screenshot: a brief error toast that disappeared, a network request that timed out, or a race condition where an element appeared and disappeared. Traces capture the ENTIRE timeline, making them far more valuable than point-in-time screenshots.

**"codegen produces production-ready test code"**→ codegen generates locators and actions based on your interactions, but: it uses whatever locator is most specific (often fragile CSS selectors or text content), it does not add assertions (tests without assertions verify nothing), and it does not organize code into page objects or reusable functions. Use codegen to discover locator strategies, then rewrite the test with proper architecture and assertions.
