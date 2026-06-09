# Deliberately Broken Tests — Flakiness Training Suite

This folder contains **10 intentionally flawed Playwright tests**, each demonstrating a distinct anti-pattern that causes flakiness, false-positives, or brittle automation. Every file contains:

1. A **BROKEN** test that fails intermittently (or silently passes when it should fail).
2. A detailed curriculum comment explaining **why** it fails.
3. A **FIXED** test showing the correct pattern.

---

## Quick Start

### Prerequisites
Ensure dependencies are installed in the framework root:

```bash
cd /framework
npm install
```

### Run the entire broken suite 10 times
The `--repeat-each=10` flag is the fastest way to surface intermittent failures:

```bash
npx playwright test tests/broken --repeat-each=10
```

### Run a single broken file
```bash
npx playwright test tests/broken/01-forEach-async-trap.spec.ts --repeat-each=10
```

### Run the fixed versions only
Append the `fixed:` test name filter:

```bash
npx playwright test tests/broken --grep "fixed:"
```

### Run the broken versions only
```bash
npx playwright test tests/broken --grep "broken:"
```

---

## Failure-Rate Cheat Sheet

| # | File | Anti-Pattern | Expected Broken Failure Rate | Failure Mode |
|---|------|--------------|------------------------------|--------------|
| 01 | `01-forEach-async-trap.spec.ts` | `forEach` + async | ~90% | Clicks never awaited; assertion runs against stale DOM |
| 02 | `02-new-tab-race-condition.spec.ts` | `waitForEvent` after `click` | ~30–50% | Misses `page` event when popup opens faster than listener attaches |
| 03 | `03-module-level-state.spec.ts` | Module-level mutable state | ~80% (parallel) | Workers overwrite shared `sharedUserId`; 404s or mismatched data |
| 04 | `04-waitForTimeout-anti-pattern.spec.ts` | Hard `waitForTimeout` | ~20–40% (slow nets) | Arbitrary sleep too short; DOM not ready when assertion fires |
| 05 | `05-missing-as-const.spec.ts` | `role: string` typing | Compile-time risk | No runtime failure, but demonstrates type-safety anti-pattern |
| 06 | `06-storageState-too-early.spec.ts` | `storageState` before confirm | ~50% (slow nets) | Snapshot taken before auth cookies fully written; invalid auth file |
| 07 | `07-assert-status-only.spec.ts` | Status-code-only assertion | Silent false-positive | Passes on 200 even when payload is wrong or corrupted |
| 08 | `08-nth-anti-pattern.spec.ts` | `.nth(i)` loop over table | ~40–60% | Row indices shift on re-render; clicks wrong row or fails to find target |
| 09 | `09-soft-assertion-without-hard-fail.spec.ts` | Soft assertions unchecked | Silent false-positive | `expect.soft` failures hidden because `test.info().errors` never checked |
| 10 | `10-poll-without-throw.spec.ts` | `expect.poll` swallows errors | 100% (timeout) | Swallowed 404 causes generic poll timeout instead of fast meaningful failure |

---

## Workshop Usage Guide

### 1. Ice-Breaker (5 min)
Run the broken suite once with `--repeat-each=10` and show participants the HTML report. Count how many "Expected to fail but passed" vs "Flaky" markers appear. Ask: *"Which anti-patterns are the worst?"*

### 2. Pair Programming (20 min)
Split into pairs. Each pair picks **one** anti-pattern file.
- First, run the broken test 5 times and record pass/fail.
- Then, read the `FIXED` version and predict what will change.
- Finally, run the fixed version 5 times to confirm stability.

### 3. Group Discussion (10 min)
Each pair presents:
- What was the root cause?
- What is the earliest signal that catches this failure?
- How would you detect this in code review?

### 4. Regression Prevention (5 min)
Show your `eslint` / `prettier` / CI pipeline. Discuss which rules catch these patterns:
- `no-unused-vars` catches unused `Page` imports.
- Custom lint rules can ban `waitForTimeout` in favor of content waits.
- `playwright` built-in retries surface failures but do not fix root causes.

---

## Solutions Checklist

Use this checklist after the workshop to confirm every anti-pattern has been internalized:

- [ ] **forEach trap**: Always use `for...of` for sequential async work, or `Promise.all(arr.map(...))` for true parallel.
- [ ] **Race conditions**: Register event listeners *before* triggering the action (`Promise.all([listener, action])`).
- [ ] **Module state**: Never share mutable state between tests. Use `test.describe.configure({ mode: 'serial' })` only when order is truly required; prefer fixtures or inline assertions.
- [ ] **Hard waits**: Replace every `waitForTimeout(N)` with a content-based assertion (`toBeVisible()`, `toHaveText()`, `waitForURL()`).
- [ ] **Type safety**: Use `as const` on literal option objects so TypeScript narrows types and provides autocomplete.
- [ ] **Storage state**: Confirm navigation/state mutation is complete (`waitForURL`, `toBeVisible`) before snapshotting state.
- [ ] **Deep assertions**: Assert status **plus** content-type **plus** at least one body field on every API response.
- [ ] **Dynamic locators**: Use `.filter({ hasText })` or `.getByText()` instead of `.nth()` loops over unstable indices.
- [ ] **Soft assertions**: Always end a soft-assertion block with `expect(test.info().errors).toHaveLength(0)`.
- [ ] **Polling**: Throw terminal errors inside `expect.poll` so the root cause is surfaced immediately instead of timing out cryptically.

---

## Curriculum Chapter Mapping

| Anti-Pattern | Primary Curriculum Reference |
|--------------|------------------------------|
| forEach + async | Ch04 — Control Flow, Ch07 — Async Pitfalls |
| New-tab race | Ch04 — Event Handling, Ch06 — Browser Contexts |
| Module-level state | Ch05 — Test Isolation, Ch07 — Parallel Execution |
| waitForTimeout | Ch04 — Waiting Strategies, Ch06 — Page Lifecycle |
| Missing `as const` | Ch03 — Type Safety, Ch06 — Locator Construction |
| storageState too early | Ch06 — Authentication, Ch05 — State Management |
| Status-only assertion | Ch05 — API Contracts, Ch03 — Assertion Depth |
| `.nth()` loop | Ch06 — Locator Strategies, Ch04 — Iteration |
| Soft without hard fail | Ch03 — Assertion Patterns, Ch05 — Fail-Fast vs Soft |
| Poll without throw | Ch04 — Polling, Ch05 — API Resilience |

---

## Maintainer Notes

- These tests target **public demo sites** only (`opensource-demo.orangehrmlive.com` and `reqres.in`).
- Because `fullyParallel: true` is set in `playwright.config.ts`, anti-patterns that rely on shared state (e.g., #03) will be especially flaky.
- The broken tests are **not** part of any project in `playwright.config.ts`, so they do not run during `npm test` by default. This prevents CI contamination.
