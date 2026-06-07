# Capstone C2 — Custom HTML Reporter for Playwright

> Write your own Playwright reporter from scratch. Output an HTML dashboard your team would actually use.

## Why this exists

Playwright's HTML reporter is great. It is also not yours. Building a reporter teaches you Playwright's reporter API, the test lifecycle, and how to inject organisational context (owner, JIRA links, suite ownership) that the default reporter can't.

## What you ship

A reporter package, installable via npm or as a local file in your suite:

```
playwright-team-reporter/
├── src/
│   ├── reporter.ts            ← implements Playwright's Reporter interface
│   ├── render/html.ts         ← html template with embedded JS
│   ├── render/css.ts          ← inline styles
│   ├── data/aggregate.ts      ← per-suite / per-owner aggregation
│   └── types.ts
├── tests/
├── examples/                  ← demo suite that uses the reporter
└── README.md
```

## Required features

1. Implements Playwright's `Reporter` interface (`onBegin`, `onTestEnd`, `onEnd`).
2. Outputs a single self-contained `index.html` (CSS + JS inlined — no external deps).
3. Dashboard shows:
   - Top bar: total / passed / failed / flaky / skipped counts + pass rate
   - Per-project breakdown (since `playwright.config.ts` has multiple projects)
   - Top 10 slowest tests
   - Failed tests with first error line + stack snippet
   - Filter buttons: failed only, by tag (`@smoke`, `@regression`)
4. Reads `metadata` on each test for `owner` and `jiraLink` (you'll add these via `test.info().annotations`).

## Stretch features

- **Diff vs previous run** — read prior `index.json`, show "newly failing" tests.
- **Embedded trace links** — open Playwright trace viewer URLs.
- **Slack / Teams payload** — emit a JSON the CI can POST as a summary message.
- **Dark mode toggle.**

## Acceptance criteria

- Drop-in: `reporter: [['playwright-team-reporter']]` in any `playwright.config.ts`.
- Works on the [`framework/`](../framework/) folder's existing suite.
- HTML opens in any browser, no server needed.
- Reporter itself has unit tests (mock `TestCase` / `TestResult` and assert aggregation math).
- README explains the design choices in 200 words.

## What this teaches

- Playwright internals — the reporter API maps directly to test lifecycle events.
- HTML/CSS skills you'll need when you slide toward dev.
- That building your own "small thing" is faster than evaluating five vendor tools.

## Portfolio value

Demonstrate this in an interview: "Our team needed JIRA links in every test row. I shipped a reporter in two days." It signals you can extend tooling, not just configure it.
