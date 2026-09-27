# Mutation Testing — Stryker

> **Canonical lesson:** [53 Mutation Testing With Stryker](../../07_Specialised_Testing/53_Mutation_Testing_With_Stryker.md). This page is a shorter summary kept for quick lookup; the chapter is the maintained version — if the two disagree, trust the chapter.

> Specialised reference for measuring TEST quality (not code quality). Stryker mutates your code, runs your tests against each mutation, reports how many mutations are "killed."

---

## Table of contents

1. [Why mutation testing exists](#1-why)
2. [The mutation score](#2-the-score)
3. [Stryker setup](#3-setup)
4. [Mutators](#4-mutators)
5. [Killed vs survived vs no coverage](#5-statuses)
6. [Performance — and why it matters](#6-performance)
7. [Integrating with Playwright](#7-with-playwright)
8. [Anti-patterns](#8-anti-patterns)

---

## 1. Why

Code coverage measures "lines executed." A test that calls a function but doesn't assert anything has 100% coverage and zero value.

Mutation testing measures "lines whose change would be detected." A mutation is a small code change (e.g., `x > 0` → `x >= 0`). If your tests don't fail after that change, the test isn't testing that branch.

### 1.1 The classic example

```typescript
function isAdult(age: number): boolean {
  return age >= 18;
}

test("isAdult", () => {
  expect(isAdult(25)).toBe(true);
});
```

Coverage: 100%. Mutation testing reveals: change `>= 18` to `> 18` — test still passes. Bug hides.

A better test:

```typescript
test("isAdult boundary", () => {
  expect(isAdult(17)).toBe(false);
  expect(isAdult(18)).toBe(true);
});
```

---

## 2. The score

```
Mutation score = killed / (killed + survived) × 100%
```

Industry targets:

- 60% — minimal viable
- 75% — solid suite
- 85%+ — excellent

100% is unreachable (some mutations are equivalent to the original; tests can't distinguish).

---

## 3. Setup

```bash
npm i -D @stryker-mutator/core @stryker-mutator/typescript-checker
```

```javascript
// stryker.conf.js
export default {
  packageManager: "npm",
  reporters: ["html", "progress", "clear-text"],
  testRunner: "jest", // or other; see below for Playwright
  coverageAnalysis: "perTest",
  mutate: ["src/**/*.ts", "!src/**/*.spec.ts"],
  thresholds: { high: 80, low: 60, break: 50 },
};
```

```bash
npx stryker run
```

---

## 4. Mutators

Stryker applies various transforms:

| Mutator              | Example                         |
| -------------------- | ------------------------------- |
| Arithmetic           | `+` → `-`                       |
| Comparison           | `>` → `>=`, `==` → `!=`         |
| Boolean              | `&&` → `\|\|`, `true` → `false` |
| Conditional          | Always-true / always-false      |
| String literal       | "X" → ""                        |
| Array                | `[]` → `["Stryker"]`            |
| Method calls removed | `.map()` removed                |

Each mutation runs your full test suite once. For a large codebase: thousands of mutations × N seconds per test = very slow.

---

## 5. Statuses

| Status            | Meaning                                                                          |
| ----------------- | -------------------------------------------------------------------------------- |
| **Killed**        | At least one test failed after mutation. Good.                                   |
| **Survived**      | No test failed. Your tests don't cover this branch.                              |
| **No coverage**   | No test ever ran this code. Worse than survived.                                 |
| **Timeout**       | Test runner took too long; mutation likely caused infinite loop.                 |
| **Compile error** | TypeScript catches the mutation; doesn't run. Counted as killed in some configs. |

---

## 6. Performance

```
Time = (number of mutations) × (single test suite duration)
```

A 1000-mutation codebase with a 30-second suite = 8.3 hours. Solutions:

- **Per-test coverage tracking** — Stryker only runs tests that touched the mutated code.
- **Parallel runs** — multiple workers.
- **Incremental mode** — only re-analyze changed files.

### 6.1 In CI

Mutation testing is typically a NIGHTLY or WEEKLY job, not per-PR:

```yaml
on:
  schedule:
    - cron: "0 2 * * 0" # weekly

jobs:
  mutation:
    runs-on: ubuntu-latest
    timeout-minutes: 240
    steps:
      - run: npx stryker run
```

---

## 7. With Playwright

Stryker's default runners are Jest, Mocha, Jasmine. For Playwright:

```bash
npm i -D @stryker-mutator/playwright-runner   # community
```

Or run Playwright tests with a Stryker shell:

```javascript
testRunner: 'command',
commandRunner: { command: 'npx playwright test --grep @unit' },
```

Note: mutation testing is best paired with UNIT tests (Jest), not E2E. E2E mutations would take days. Use Stryker on the application code; let Playwright handle behaviour testing.

---

## 8. Anti-patterns

| ❌                                          | ✅                                          |
| ------------------------------------------- | ------------------------------------------- |
| Run mutation testing on every PR            | Nightly / weekly                            |
| Apply to E2E tests                          | Apply to unit tests                         |
| Aim for 100% mutation score                 | 75–85% is realistic                         |
| Treat surviving mutations as "broken tests" | Investigate — some surviving are equivalent |
| Mutate test code                            | Mutate ONLY production code                 |

---

## Cross-references

- Test quality vs coverage: [`./contract_testing.md`](./contract_testing.md)
- Component testing (where mutation testing is most useful): [`./component_testing.md`](./component_testing.md)
