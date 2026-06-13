# Contributing to the Playwright TS Enterprise Framework

Thanks for contributing. This document explains how to set up the project locally, the conventions we enforce, and how to ship a change end-to-end.

This framework is a **teaching artifact and a production reference**. Every change is read by future learners. Optimize for clarity, not cleverness.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Local Setup](#2-local-setup)
3. [Branch & Commit Conventions](#3-branch--commit-conventions)
4. [Code Style](#4-code-style)
5. [Test Conventions](#5-test-conventions)
6. [Writing Page Objects & Fixtures](#6-writing-page-objects--fixtures)
7. [Architecture Decision Records (ADRs)](#7-architecture-decision-records-adrs)
8. [Pull Request Process](#8-pull-request-process)
9. [Running the Test Matrix](#9-running-the-test-matrix)
10. [Reporting Issues](#10-reporting-issues)
11. [Release & Versioning](#11-release--versioning)

---

## 1. Quick Start

```bash
# Clone, install, set up env, run smoke tests
cd 21_SDET_Playwright_Automation/framework
npm install
cp .env.example .env             # then edit values
npx playwright install --with-deps
npm run verify                   # lint + typecheck + format check
npm run test:smoke               # quick gate before pushing
```

If `npm run verify` is green and `npm run test:smoke` is green, you are ready to open a PR.

---

## 2. Local Setup

### Prerequisites

| Tool       | Version  | Why                                           |
| ---------- | -------- | --------------------------------------------- |
| Node.js    | ≥ 18.0.0 | Playwright requires it; enforced in `engines` |
| npm        | ≥ 9      | `lint-staged` and Husky 9 expect modern npm   |
| Git        | ≥ 2.40   | Husky hooks rely on modern Git hooks layout   |
| Docker     | ≥ 24     | Optional — for `npm run test:docker`          |
| PowerShell | 5.1+     | Windows users — required for some scripts     |

### One-time setup

```bash
npm install                       # installs deps + runs Husky's prepare script
npx playwright install --with-deps
cp .env.example .env
```

Open `.env` and supply real values for any keys marked **required** in [`config/env.loader.ts`](./config/env.loader.ts). Missing required keys cause a **fail-fast error at module load** — not at first test — so you know immediately.

### Verifying setup

```bash
npm run verify          # lint + typecheck + format check
npm run test:smoke      # run the @smoke-tagged subset (~30s)
```

Both should be green on a fresh clone with default `.env.example` values.

---

## 3. Branch & Commit Conventions

### Branches

Use **type/short-kebab-name**:

```
feat/users-client-retry-budget
fix/login-page-spinner-race
docs/ch52-component-testing-expansion
chore/upgrade-playwright-1-50
ci/add-nightly-perf-job
```

Long-lived branches: `main` (protected) and `release/*`. Never push directly to `main`.

### Commits — Conventional Commits, enforced

Format (the `commit-msg` hook will reject anything else):

```
<type>(<scope>)!?: <subject>

[optional body]

[optional footer(s)]
```

| Type       | When to use                                            |
| ---------- | ------------------------------------------------------ |
| `feat`     | New user-visible behavior or new public utility/POM    |
| `fix`      | Bug fix in framework code or test reliability fix      |
| `docs`     | Markdown, READMEs, comments-only                       |
| `style`    | Formatting only — no logic change                      |
| `refactor` | Code change that neither fixes a bug nor adds behavior |
| `perf`     | Performance improvement                                |
| `test`     | Adding or fixing tests                                 |
| `chore`    | Tooling, deps, config maintenance                      |
| `ci`       | CI configuration changes                               |
| `build`    | Build system / package manifest                        |
| `revert`   | Reverts a previous commit                              |

**Scope** is the affected area (`api`, `pom`, `fixture`, `ci`, `docs`, `ch52`, etc.) — lowercase, hyphen-separated.

**Breaking change** suffix `!` is required for any API change that breaks downstream tests.

**Subject** is imperative present tense, ≤ 100 chars, no trailing period. "Add retry budget" — not "Added a retry budget."

**Examples**

```
feat(api): add UsersClient retry budget with exponential backoff
fix(pom)!: rename LoginPage.submit to LoginPage.login
docs(ch52): expand component testing chapter to 800 lines
chore(deps): upgrade Playwright to 1.50.0
ci: add nightly accessibility job
```

### Bypassing the hook

Almost never appropriate. If you must (true emergency), `git commit --no-verify` works but should be followed by a clean-up commit that fixes the violations.

---

## 4. Code Style

### Formatting — Prettier

Prettier owns formatting decisions. Settings live in [`.prettierrc.json`](./.prettierrc.json). Do not argue with Prettier in PR review.

```bash
npm run format         # write
npm run format:check   # verify
```

### Linting — ESLint

ESLint owns correctness rules. Settings live in [`.eslintrc.cjs`](./.eslintrc.cjs). Key rules:

- `@typescript-eslint/no-explicit-any` — `any` is banned. Use `unknown` + narrowing, or define the type.
- `@typescript-eslint/no-floating-promises` — every Promise must be awaited or explicitly chained.
- `playwright/no-wait-for-timeout` — `waitForTimeout` is banned in framework code. Use `expect.poll`, `waitForResponse`, or a domain-specific wait.
- `playwright/no-focused-test` — `test.only` blocked from landing on `main`.
- `playwright/missing-playwright-await` — assertions and actions must be awaited.
- `import/order` — imports grouped, alphabetized, separated by blank lines.
- `import/no-cycle` — circular imports rejected.

Auto-fix what you can:

```bash
npm run lint:fix
```

### TypeScript — strict everywhere

`tsconfig.json` has `strict: true`, `noUncheckedIndexedAccess: true`, `noUnusedLocals: true`. Do not relax these to make a change land — fix the underlying issue.

If a type is genuinely unknown at a boundary (e.g., a third-party SDK response), use `unknown` and narrow with a Zod schema or type guard.

### Naming

| Concept                            | Convention                                      |
| ---------------------------------- | ----------------------------------------------- |
| Files containing classes           | `PascalCase.ts` — `LoginPage.ts`, `UsersClient.ts` |
| Files containing functions/helpers | `kebab-case.ts` or `dot.case.ts` — `data.loader.ts`, `action.helpers.ts` |
| Classes                            | `PascalCase`                                    |
| Methods, variables                 | `camelCase`                                     |
| Constants                          | `SCREAMING_SNAKE_CASE` if truly immutable global; `PascalCase` for enums |
| Types & interfaces                 | `PascalCase` — no `I` prefix                    |
| Page object classes                | `<Feature>Page` — `LoginPage`, `DashboardPage`  |
| Component object classes           | `<Feature><Component>` — `EmployeeSearchForm`, `HeaderNav` |
| Test files                         | `<feature>.<kind>.spec.ts` — `login.smoke.spec.ts`, `users.api.spec.ts` |

---

## 5. Test Conventions

### Tagging — uniform vocabulary

Every test gets one or more tags so CI can route work. Apply tags as **inline title suffixes** so Playwright's `--grep` matches them.

| Tag                | When to apply                                        |
| ------------------ | ---------------------------------------------------- |
| `@smoke`           | < 30s; covers the critical path for a feature        |
| `@regression`      | Full feature coverage; runs on every PR              |
| `@nightly`         | Slow; runs on the nightly schedule only              |
| `@visual`          | Pixel diff test                                      |
| `@a11y`            | Accessibility check                                  |
| `@perf`            | Performance budget assertion                         |
| `@security`        | Security control assertion                           |
| `@flake-candidate` | Tracked as flaky; triaged before merge to `main`     |

Example:

```typescript
test('admin can log in @smoke @regression', async ({ loginPage }) => { /* ... */ });
```

Run a subset:

```bash
npm run test:smoke              # @smoke only
npx playwright test --grep '@a11y'
```

### What belongs in a spec file

- **Yes**: behavior assertions, calls to POM methods, calls to API clients, data setup via fixtures.
- **No**: raw locators, raw `page.click()` or `page.fill()`, hardcoded credentials, `waitForTimeout`, `if`/`else` branches that change assertions.

If you find yourself writing logic in a spec, it belongs in a POM, a fixture, or a helper.

### Anti-patterns blocked by lint or convention

The framework intentionally includes [`tests/broken/`](./tests/broken) — specs that demonstrate forbidden patterns. They are **excluded from CI** and exist for learner study. **Do not copy patterns from `tests/broken/`** into other directories.

---

## 6. Writing Page Objects & Fixtures

### Page Object Model — three-tier hierarchy

1. **Base page** (`OrangeHRMBasePage`, etc.) — extends `BasePage`, owns navigation, spinner waits, common headers/menus.
2. **Feature page** (`LoginPage`, `DashboardPage`, `EmployeeListPage`) — extends a base page; owns locators and high-level behaviors for one screen.
3. **Component object** (`EmployeeSearchForm`, `HeaderNav`, `EmployeeResultsGrid`) — owns a reusable sub-section; instantiated as a property of a feature page.

Rules:

- A page method describes **what the user does**, not what you click. `searchByName('John')` ✅; `fillSearchInputThenClickSearchButton('John')` ❌.
- Locators are **`readonly`** members; resolved lazily by Playwright (cheap to construct).
- Waits live **inside the page method**, not in the spec. `searchByName` waits for results to render before returning.
- Methods that navigate return `Promise<void>`; methods that read state return `Promise<T>`.
- No raw `expect()` inside a page method. The page method changes state; the spec asserts state.

### Fixtures — four scopes

| Scope     | Use for                                                                 |
| --------- | ----------------------------------------------------------------------- |
| `test`    | POMs, data factories, per-test API context, the data bridge             |
| `worker`  | Account pool acquisition, expensive auth setup, shared API token caches |
| `session` | Cross-worker singletons (rare — usually OS-level resources)             |
| `auto`    | Auto-cleanup fixtures (`testEmployee`); declared with `auto: false` to opt-in |

When you add a fixture, document **why** the chosen scope is correct — especially for `worker`-scoped fixtures that have parallel-safety implications.

### File-locked account pool — extending safely

The auth pool in [`fixtures/auth.fixture.ts`](./fixtures/auth.fixture.ts) uses [`proper-lockfile`](https://www.npmjs.com/package/proper-lockfile) because `--workers=N` spawns N **separate Node processes** — JS in-memory locks do not coordinate across them. If you add a new poolable resource (e.g., test tenants, test datasets), follow the same pattern: file lock, stale timeout, worker-index offset.

---

## 7. Architecture Decision Records (ADRs)

Any architectural choice that future contributors might reasonably question gets an ADR.

- ADRs live in [`docs/adrs/`](./docs/adrs/).
- Use [`docs/adrs/adr-template.md`](./docs/adrs/adr-template.md).
- Number sequentially: `ADR-NNN-short-kebab-title.md`.
- Status starts at `Proposed` → moves to `Accepted` after merge.
- Superseding an ADR: mark the old one `Superseded by ADR-XYZ` and link both ways.

When to write one:

- Choosing or replacing a tool (Playwright vs Cypress, Allure vs ReportPortal).
- Changing a core pattern (POM hierarchy, fixture scoping, API client architecture).
- A decision that costs > 1 day to reverse.

When **not** to write one: implementation details that any contributor could change without coordination.

---

## 8. Pull Request Process

### Before opening a PR

1. `npm run verify` — green
2. `npm run test:smoke` — green
3. Conventional commit messages on every commit
4. Branch rebased on latest `main` (no merge commits from `main` into your branch)
5. If your change is architectural — ADR included
6. If your change affects docs or examples — corresponding chapter file updated

### PR title and body

PR title follows the same Conventional Commits format as commit messages.

PR body should answer:

- **What** changed (one short paragraph; the diff explains the rest)
- **Why** — link an issue, a chapter exercise, a flake report, or a learner-experience problem
- **How tested** — which commands you ran, with what env, what passed
- **Risk** — what could break, and how a reviewer can spot it
- **Out of scope** — what you considered but deferred (link a follow-up issue)

### Review

- At least one approving review required.
- All status checks green: lint, typecheck, format, sharded test, Allure publish.
- Squash-merge by default. Merge commits only when preserving multi-commit history is important (and you can justify it in the PR).

---

## 9. Running the Test Matrix

| Command                                   | Scope                                  |
| ----------------------------------------- | -------------------------------------- |
| `npm test`                                | Everything                             |
| `npm run test:orangehrm`                  | OrangeHRM UI project only              |
| `npm run test:api`                        | API project only                       |
| `npm run test:smoke`                      | `@smoke` tag                           |
| `npm run test:regression`                 | `@regression` tag                      |
| `npm run test:ui`                         | Playwright UI mode                     |
| `npm run test:headed`                     | Run with browsers visible              |
| `npm run test:debug`                      | Step-by-step in inspector              |
| `PLAYWRIGHT_SHARD_INDEX=1 PLAYWRIGHT_SHARD_TOTAL=4 npm run test:shard` | One of four shards (used in CI)        |
| `npm run test:docker`                     | Inside the project Docker image        |

After a run:

```bash
npm run report             # opens the HTML report
npm run report:allure      # generates + opens the Allure report (Phase 2+)
```

---

## 10. Reporting Issues

Open an issue with:

- **Repro** — exact `git sha`, exact command, exact `.env` (redact secrets), Node + npm version, OS.
- **Expected** — what should have happened, with a citation to the chapter or spec that says so.
- **Actual** — what happened, including the trace viewer screenshot or attached `trace.zip`.
- **Triage signal** — does it reproduce on `main` with default `.env.example`?

Flaky test reports: open with tag `flake`. Include the run URL and the last three commit shas that ran the test.

---

## 11. Release & Versioning

This framework is currently `0.x` and treated as an internal teaching artifact — no public consumers. When we cut a `1.x`, this section will document:

- Semantic Versioning policy
- Changelog generation from Conventional Commits
- Tagging and release workflow

For now: keep `main` shippable at all times.

---

## Questions

- Architectural questions → open a Discussion or write a draft ADR.
- Bug reports → open an Issue with the template above.
- Learner-experience problems (a chapter is unclear, an exercise is impossible) → open an Issue tagged `learner-experience`.

Thanks for shipping work that future SDETs will learn from.
