# ADR-004: Fixtures (test.extend) Over beforeEach Hooks and Globals

## Status

- Accepted (2026-07-25) — documents the framework's founding architecture

## Context

Every suite needs setup: authenticated pages, API clients, seeded data. Three idioms compete:

1. **`beforeEach` hooks + module-level variables** — the Selenium/Jest inheritance. Familiar, but setup is invisible at the test signature, ordering across files is implicit, module state leaks between parallel workers (Ch09's data-collision class), and a test cannot opt out of setup it doesn't need.
2. **Base-class inheritance** (`class CheckoutTest extends AuthenticatedTest`) — common in Java/TestNG shops. Single-inheritance strangles composition: a test needing auth + seeded-employee + API client needs a diamond.
3. **Playwright fixtures** (`test.extend<T>()`) — declarative dependency injection. A test *names* what it needs in its arguments; Playwright builds the dependency graph, instantiates only what's used, tears down in reverse (LIFO) order, and scopes per-test or per-worker.

## Decision

All shared setup is a **fixture** in `fixtures/`. Hooks (`beforeEach`) are permitted only for spec-local concerns (navigating to the page under test). Concretely:

- `auth.fixture.ts` — storageState-based sessions, per role
- `api.fixture.ts` — typed `APIUtils` client, worker-scoped
- `orangehrm.fixture.ts` — composed POM entry points
- Data creation/teardown pairs live in the fixture (`yield`-based), never split between `beforeEach`/`afterEach`

Composition happens via `mergeTests` / chained `test.extend`, exported from `fixtures/index.ts` as the single `test` every spec imports.

## Consequences

### Positive

- **Explicit dependencies**: `async ({ page, apiClient, seededEmployee })` documents setup at the signature; reviewers see cost at a glance.
- **Parallel-safe by construction**: fixture state is per-test/per-worker — the module-level-state trap (quiz challenge 03) is structurally impossible.
- **Guaranteed teardown**: code after `yield` runs even on test failure, in LIFO order — the Ch28 cleanup contract for free.
- **Lazy**: a spec not using `seededEmployee` never pays for seeding.

### Negative

- Learning curve: generator-style fixtures (`yield` as the handoff point) confuse newcomers for roughly a day; mitigated by Ch06 and quiz challenges 08/14/17/20.
- Debugging indirection: a failure inside a deep fixture chain has a longer stack than an inline `beforeEach`. Mitigated by small single-purpose fixtures and `test.step` inside them.
- Worker-scope mistakes (test-scoped data in a worker-scoped fixture) create subtle sharing bugs — hence the dedicated quiz challenge 17 and lint-review attention.

### Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Fixture graph grows tangled | Medium | Medium | One fixture = one responsibility; `fixtures/index.ts` is the only composition point; platform team owns the directory (CODEOWNERS) |
| Contributors regress to hooks | Medium | Low | eslint-plugin-playwright rules + code-review rubric item |

## Related

- Ch06 Custom Fixtures Architecture — the teaching companion
- Ch09 Parallel Execution — why module state is fatal
- ADR-006 — API clients are injected via these fixtures
