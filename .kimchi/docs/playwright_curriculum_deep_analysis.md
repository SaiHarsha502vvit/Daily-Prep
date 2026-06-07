# Playwright SDET Curriculum — Deep Analysis

**Document Purpose:** A comprehensive synthesis of the `21_SDET_Playwright_Automation` curriculum, capturing architectural patterns, gotchas, enterprise practices, and production-grade insights for reference and interview preparation.

**Coverage:** 48 files across 8 sections (Ch00–Ch45, quizzes, problem sets), plus cross-referenced content from `23_Mobile_Dev_And_Testing`.

**Estimated Study Time:** 95–110 hours (44 chapters × 60–90 min + quizzes + practice)

---

## 1. Curriculum Overview

This is a **44-chapter, production-grade SDET curriculum** targeting Playwright + TypeScript automation on Dynamics 365 CRM, JSP, and ASP.NET ASPX applications. It is explicitly **not** a beginner programming course — it assumes proficiency in JavaScript/TypeScript and testing fundamentals, then builds directly on those foundations toward enterprise architecture.

### Target Audience
- Working SDETs on D365/enterprise SPA+MPA hybrid stacks
- Manual QA transitioning to automation engineering
- Mid-level SDETs preparing for senior roles or SDE transition

### The Curriculum's Core Philosophy (from Ch00)
> "An SDET is a software engineer whose product is the **quality infrastructure** of the application. The 'user' of an SDET's code is another engineer. That changes everything about how you design it."

### Module Structure

| Section | Chapters | Core Theme |
|---|---|---|
| Foundations (Ch00–04) | 5 | Testing pyramid, mindset, JS/TS for automation |
| Core Architecture (Ch05–09) | 5 | POM, fixtures, E2E 15-step structure, browser internals, parallel execution |
| D365 & Cross-Site Patterns (Ch10–17) | 8 | D365-specific automation, 6 cross-site patterns, timing traps |
| Enterprise Architecture (Ch18, Ch21–24) | 5 | Mega POM, project structure, headers/payloads/endpoints, APIUtils, test script anatomy |
| Advanced Topics (Ch19, Ch25–31, Ch42–44) | 15 | Security, CI/CD, flakiness, TS patterns, test data, visual regression, DB verification, API mocking, polling, war stories, enterprise API client |
| SDET→SDE Bridge (Ch32–36) | 5 | Interview prep, CS thinking, algorithms, OOP patterns, TS type system |
| Specialised Testing (Ch37–41) | 5 | Performance (Lighthouse/k6), contract (Pact), accessibility (axe-core), security (OWASP ZAP), GraphQL/WebSocket |
| Practice & Quizzes | 3 | MCQ quiz (40 questions), code challenge quiz (20 challenges), practice resources + 10-week roadmap |

### The Three Pillars of Reliable Automation (Ch00)
1. **Idempotency** — a test can run N times with the same result (unique identity + reliable cleanup)
2. **Isolation** — each test is an island; order never matters
3. **Wait for State, Not Time** — never `waitForTimeout`; always wait for observable application state

---

## 2. Section-by-Section Breakdown

### 2.1 Foundations (Ch00–04)

**Ch00 — SDET Foundations & Mindset**
- Core concept: The SDET is a software engineer whose product is quality infrastructure, not test scripts.
- Teaches the testing pyramid (60-70% unit / 20-30% integration / 5-10% E2E), the "ice cream cone" anti-pattern, and the 3 pillars.
- Introduces professional vocabulary: idempotency, determinism, state, seeding, teardown, contracts.
- Contains the 7-step debugging pipeline: read message → trace → locator → timing → data → environment → real bug.
- Interview litmus test: five questions that separate script-runners from engineers.

**Ch01 — Playwright & TypeScript Basics**
- Project setup, first test, config baseline.

**Ch02 — Enterprise Locators & XPath**
- CSS, XPath, `getByRole`, `getByText`, locator chaining.
- **Key rule:** Never use generated CSS classes (`.css-1a2b3c`) — they change every build.
- **Hierarchy of selector stability:** `data-testid` / `data-automation-key` > `getByRole` > `getByLabel` > `getByText` > XPath > CSS class.

**Ch03 — Browser Console Scripting**
- DevTools console, DOM scripts, XPath in console.
- 12 runnable console scripts for rapid locator discovery on D365 pages.

**Ch04 — JS & TS for Automation**
- The most critical prerequisite chapter.
- **Async/await rules (memorize):** `await` needed for navigation, click, fill, type, check, hover, waitFor, isVisible(), count(), textContent(). NO await for `page.locator()`, `getByRole()`, `getByText()`, `.nth()`, `.filter()`.
- **`forEach` + `async` trap:** `forEach` does NOT await async callbacks. Use `for...of` for sequential, `Promise.all` + `map` for parallel.
- **`Promise.all` race condition pattern:** `const [newTab] = await Promise.all([context.waitForEvent('page'), page.click('#open')])`.
- **`as const` requirement:** Any ARIA role stored in a variable must use `as const` or TypeScript rejects it (string != AriaRole union).
- **`?.` optional chaining + `??` nullish coalescing** for safe API response navigation.
- **Discriminated unions** for type-safe test data factories (PendingCitation vs PaidCitation vs DisputedCitation).

### 2.2 Core Architecture (Ch05–09)

**Ch05 — POM Architecture Deep Dive**
- Core concept: Page Object Model separates locators/interactions from test logic.
- **Two POM styles in real codebases:**
  - Style 1: Typed `Locator` properties (constructor assigns `page.locator(...)`)
  - Style 2: Raw selector string dictionary (`this.locators = { dropdown: '#id' }`)
- **Clean hybrid recommendation:** Stable/frequent = typed Locator properties. Dynamic/parametric = methods returning Locator.
- **Lazy evaluation superpower:** `page.locator()` in constructor does NOT query the DOM. The DOM is only touched when an action/assertion runs.
- **The `.nth(2)` problem:** Fragile — DOM order changes break it. Fix: scope to parent container, use `data-testid`, or parameterized methods.
- **`as const` deep-dive:** Why `static readonly BUTTON_ROLE = 'button' as const` is required for ARIA roles.
- **Inheritance vs Composition:** Inheritance for simple shared behaviour (< 5 pages). Composition (inject `WaitHelper`) for large codebases.
- **War Stories:** `.nth(1)` modal trap, two-phase render "empty text" trap, "Save" vs "Save & Close" ambiguity.

**Ch06 — Custom Fixtures Architecture**
- Core concept: Fixtures are Playwright's built-in dependency injection system.
- **`test.extend<T>()` pattern:** Define fixture shape, implement setup/yield/teardown.
- **Fixture scope:** `scope: 'test'` (default, once per test) vs `scope: 'worker'` (once per worker process).
- **Worker-scoped `account` fixture pattern:** Login once per worker → 20 tests run with no re-login overhead.
- **`yield` / `use(value)` pattern:** Everything before `use()` is setup; everything after is teardown (runs even if test fails).
- **`mergeTests` pattern:** Combine `auth.fixture.ts`, `db.fixture.ts`, `api.fixture.ts`, `page.fixture.ts` into one `test` object.
- **Global setup pattern:** `globalSetup` runs ONCE before all tests — use for saving auth state to disk.

**Ch07 — E2E Test Architecture (15-Step Pattern)**
- Core concept: The **Data Accumulator** pattern — a typed `const data: TestData` object that accumulates IDs across steps.
- **Why not `let` variables:** TypeScript "possibly unassigned" errors across step closures. Object properties are always "assigned" (to `null`).
- **Step naming convention:** Business-action descriptions, not technical operations. Include runtime values: `Search for citation CIT-001`.
- **Cross-app flow patterns:** Same tab navigation, new tab (`Promise.all`), new BrowserContext (dual user sessions).
- **Soft assertions:** `expect.soft()` lets all checks run even if one fails. Final `expect(test.info().errors).toHaveLength(0)` hard-fails.
- **`test.info().attach()`** for diagnostics: screenshots, DOM HTML, accumulator state on failure.
- **`test.skip()`, `test.fixme()`, `test.slow()`** for test management.
- **Timeout cascade:** Suite → Test → Step → Action, each bounding the next.

**Ch08 — Browser Internals for SDETs**
- Core concept: Understanding the 4 browser trees explains why waits fail.
  1. **DOM Tree** — `page.locator()` queries this
  2. **CSSOM Tree** — `display: none` removes from render tree
  3. **Render Tree** — what `{ state: 'visible' }` checks
  4. **Accessibility Tree** — what `getByRole()` queries (NOT the DOM!)
- **D365 two-phase render:** Phase 1 = empty shell renders. Phase 2 = OData API returns, React re-renders with data. `waitFor({ state: 'visible' })` passes during Phase 1 with empty text.
- **SPA vs MPA waits:** SPA tab clicks do NOT trigger navigation — wait for `aria-selected="true"` + content visibility. JSP/ASPX use `waitForNavigation`.
- **Actionability checks:** Before every click, Playwright checks: visible, stable, enabled, receives events.
- **CDP (Chrome DevTools Protocol):** Every Playwright action is a WebSocket JSON round-trip (~2-5ms minimum).
- **Reflow/Repaint/Composite:** Why D365 grid load is slow (full reflow per row).

**Ch09 — Parallel Execution & Workers**
- Core concept: Each worker is a separate Node.js process with its own browser.
- **`fullyParallel: true`** — individual tests parallelize. Default `false` — file-level parallelism only.
- **Data collision problem:** Hardcoded test data → 409 Conflict across workers. Fix: unique IDs per test (`Date.now()`, `randomUUID()`, `workerIndex + timestamp`).
- **Module-level mutable state is banned in parallel suites.** Use fixtures or `test.describe.serial()`.
- **Worker-scoped fixtures + `workerIndex`:** Each worker gets a deterministically unique account.
- **Sharding:** `--shard=1/4` splits test files across 4 CI jobs.
- **Worker count tuning:** `workers = min(CPUs, RAM_GB / 1.5)`. D365 needs fewer workers (heavy JS).

### 2.3 D365 & Cross-Site Patterns (Ch10–17)

**Ch10 — Dynamics 365 CRM Testing**
- Core concept: D365 UCI is a React SPA on Fluent UI with IFrames and a two-phase render.
- **IFrame trap:** Main content is inside `iframe[name="contentIFrame0"]`. Use `page.frameLocator()`.
- **Fluent UI `.ms-*` class reference:** `.ms-Button`, `.ms-TextField-field`, `.ms-Spinner`, `.ms-DetailsList-row`, `.ms-Pivot`, `.ms-Dialog`.
- **`menuitem` vs `button` ARIA trap:** D365 CommandBar wraps buttons in `<li role="menuitem">`. `getByRole('button')` fails; use `getByRole('menuitem')`.
- **`data-automation-key`:** Microsoft's testing hook — more stable than CSS classes.
- **Tab navigation:** Click tab → verify `aria-selected="true"` → wait for spinner → verify content.
- **"Unsaved changes" dialog trap:** Form transitions mark dirty state; navigation triggers a blocking dialog.
- **`storageState` pattern:** Login once via `globalSetup`, save cookies, reuse across all tests.

**Ch11–16 — Six Cross-Site Patterns**
1. **Sequential Flow** — same page, data accumulator carries IDs
2. **New Tab + Shared Context** — `Promise.all([waitForEvent('page'), click])`
3. **Dual Browser Contexts** — admin + customer simultaneously, `try/finally` cleanup
4. **Token & Magic Link** — email interception, OAuth redirect, token expiry testing
5. **UI-API Side Effects** — "success theatre" anti-pattern; verify with `expect.poll()` on notifications
6. **StorageState Chaining** — `globalSetup` saves per-role auth states

**Ch17 — D365 Advanced Timing Patterns**
- 7 failure modes: element in DOM but text not loaded, stale render, hidden but in DOM, structure loads but text takes 10s+, tab unmount/remount, IFrame inside IFrame, React StrictMode double-render.
- **Complete diagnostic flowchart:** count()=0 → check IFrame → check component render → check selector. count()>0, isVisible()=false → check CSS hidden. count()>0, isVisible()=true, text wrong → check stale render / data loading.
- **Wait strategy decision table:** `toHaveText()` for specific text, `not.toHaveText('')` for any non-empty, `toHaveCount(0)` for spinner gone, `waitForFunction()` for custom DOM conditions.
- **CommandBar disabled state:** Fluent UI uses `aria-disabled="true"`, not HTML `disabled`. `toBeDisabled()` fails — check `toHaveAttribute('aria-disabled', 'true')`.
- **Lookup field interaction:** Most complex D365 control. Requires `.type()` with delay (not `.fill()`), wait for `role="listbox"`, click `role="option"`, verify `toHaveValue()`.
- **OData interception:** `page.route('**/api/data/v9.2/**', ...)` to speed up UI-only tests.
- **OData performance measurement:** `measureODataCalls()` utility attaching timing metrics to test reports.

### 2.4 Enterprise Architecture (Ch18, Ch21–24)

**Ch18 — Mega POM Architecture**
- Core concept: How a 5000-line POM is born (12 months of "I'll add it at the bottom") and how to split it.
- **Component POM Pattern:** `MasterSearchPage` composes `SearchPanel`, `ResultsGrid`, `DetailPanel` — each a separate class.
- **Locator Dictionary Pattern:** Namespaced typed object `this.loc.customerSearch.firstName()` for 400+ locators.
- **7-step safe refactoring:** Create empty components → copy locators → compose in original → migrate one test → migrate all → delete old locators.
- **Module Registry Pattern:** Central `CRMApp` fixture grouping POMs by business domain.
- **Lazy-loaded POM Strategy:** TypeScript getters instead of constructor assignments avoid creating 8000 Locator objects for unused pages.

**Ch21–24 — The Enterprise "Why"**
- **Folder justification:** `config/`, `data/headers+payloads+enums`, `clients/`, `utils/` — each folder's purpose documented.
- **Enum rule:** `CitationStatus.PENDING` — never the string `'PENDING'`.
- **Endpoints as functions:** `Endpoints.citations.getById(id)` — parameterized, not string constants.
- **Headers as static factories:** `HeadersCrm.auth(accessToken, testId)` — token is a param, never hardcoded.
- **Payload override pattern:** `PayloadsCitation.pending({ customerId: account.userId })` — defaults + specific overrides.
- **APIUtils:** Generic HTTP wrapper around `APIRequestContext`. Handles auth, error taxonomy, retry, logging.
- **Test script anatomy:** POMs at top → accumulator → steps. NEVER data/credentials in spec files.

### 2.5 Advanced Topics (Ch19, Ch25–31, Ch42–44)

**Ch19 — Console Scripts & Security Testing**
- 12 runnable CDP scripts for cookie audits, header inspection, auth enforcement, IDOR, XSS.

**Ch25 — CI/CD Integration**
- GitHub Actions YAML, sharding, secrets management, HTML reports, environment check scripts.

**Ch26 — Flakiness Diagnosis & Fixing**
- **9-type flakiness taxonomy:** Timing/race, data pollution, order dependency, environment/network, browser/platform, locator ambiguity, token expiry, animation/transition, third-party service.
- **Systematic diagnosis protocol:** Reproduce locally → get trace → compare pass/fail traces → classify → apply fix → `--repeat-each=50`.
- **Quarantine pattern:** `test.skip(true, 'ISSUE-1234: ...')` with 2-sprint max duration.
- **Flakiness metrics script:** Parse JSON report, calculate retry rate. Target: < 2% healthy, > 5% crisis.
- **Statistical confidence:** A 5% failure rate test needs ~59 consecutive passes for 95% confidence, ~90 for 99%.

**Ch27 — Advanced TypeScript Patterns**
- Generics, discriminated unions, template literal types, mapped types, `satisfies`.

**Ch28 — Test Data Lifecycle**
- 5 seeding strategies: per-test API create/delete, worker-scoped shared, DB seed, globalSetup, synthetic UUID.
- `TestDataManager` class for orchestrated cleanup.
- Orphan sweeper pattern for when tests crash mid-run.

**Ch29 — Visual Regression Testing**
- `toHaveScreenshot()`, masking dynamic content, D365 pitfalls (spinners, timestamps), baseline workflow.

**Ch30 — Database Verification**
- PostgreSQL/SQL Server client, 3-layer verification (UI + API + DB), audit log assertions, DB fixture.

**Ch31 — API Mocking**
- `page.route()` for error states, empty states, timeout simulation, HAR replay.
- **Golden rule:** Don't mock what you're trying to test.

**Ch42 — Polling & Async Data Patterns**
- **`expect.poll()` is the official replacement for ALL polling loops.**
- Priority hierarchy: `expect(locator).toHaveText()` → `expect.poll()` → `waitForResponse()` → `waitForFunction()` → `locator.waitFor()` → NEVER `waitForTimeout`.
- **8 anti-patterns:** sleeping loop, safety sleep after every action, `textContent()` without waiting, `networkidle` on SPAs, `waitForNavigation` in React, missing `await` on `expect.poll`, not throwing on permanent failures, fixed timeout wrong for CI.
- **`pollUntil()` utility** with progressive intervals, progress logging, retryable error classification, `PollTimeoutError` with last value.

**Ch43 — Real-World War Stories (15 stories)**
- Ghost click (invisible overlay), stale session (JWT expiry mid-run), silent 200 (only status asserted), parallel collision (shared module state), ARIA impostor (wrong role found), timezone trap (`toLocaleDateString()`), frame trap (element inside IFrame), cookie monster (shared context contaminates tests), network race (low timeout in CI), selector cemetery (CSS classes in 50 files), assertion that always passes (`toBeVisible()` on always-there element), retry lie (retries masking real bugs), dynamic ID trap (D365 generated IDs), false positive (test passes with wrong data), clipboard permissions (headless CI denies).

**Ch44 — Enterprise API Client Library**
- **5-layer architecture:** Playwright `request` → `ApiCore` → `HeadersBuilder` → `Endpoints` → `DomainClient`.
- **Error hierarchy:** `ApiError` → `CitationNotFoundError`, `CitationAlreadyPaidError`, `PaymentValidationError`, `RateLimitError`, `ServerError`.
- **Zod schema validation** catches API contract drift at runtime.
- **Retry middleware** with exponential backoff + jitter.
- Tests call `citationsClient.create(...)` — never see URLs, headers, or raw JSON.

### 2.6 SDET→SDE Bridge (Ch32–36)

**Ch32 — Interview Prep**
- LADDER framework, STAR answers, live coding challenges, ask-backs.

**Ch33 — CS Thinking**
- HashMap in `TestDataManager`, Stack cleanup order, DOM as tree, GoF patterns map.

**Ch34 — Algorithms in Test Automation**
- Sliding window (pagination), two-pointer (dual context), binary search (status polling), greedy (test scheduling).

**Ch35 — OOP Design Patterns**
- SOLID in POM, Factory, Observer, Strategy, Template Method, Proxy, Composite.

**Ch36 — TypeScript Type System Mastery**
- Impossible states, generic constraints, conditional types, mapped types, `infer`, `satisfies`.

### 2.7 Specialised Testing (Ch37–41)

**Ch37 — Performance Testing**
- Lighthouse CI, k6, Core Web Vitals, Navigation Timing API, perf budgets.

**Ch38 — Contract Testing (Pact)**
- Consumer pacts, provider verification, Pact Broker, `can-i-deploy`, CI workflow.

**Ch39 — Accessibility (axe-core)**
- POUR principles, axe fixture, keyboard nav, colour contrast, A11y debt tracking.

**Ch40 — Security Testing (OWASP ZAP)**
- OWASP Top 10, auth enforcement, IDOR tests, injection payloads, ZAP CI scan.

**Ch41 — GraphQL & WebSocket**
- GQL always-200 errors, typed client, cursor pagination, WS capture.

### 2.8 AI & Modern Tooling (Ch45)

**Ch45 — AI Agents, MCP, and Playwright**
- **MCP (Model Context Protocol):** Gives AI models structured access to external tools (browsers, files, APIs).
- **Playwright MCP Server:** `npx @playwright/mcp@latest` — AI can navigate real apps, read DOM, take screenshots, generate locators based on observation not hallucination.
- **AI workflow:** Context-rich prompt → AI scaffolds → identify violations (waitForTimeout, inline locators, hardcoded tokens, `any` types) → apply enterprise patterns.
- **What AI cannot replace:** D365 timing trap knowledge, fixture architecture design, typed API client libraries, validating its own API references.
- **Agentic testing boundary (2025):** Discovery and scaffolding only. Production tests require human architectural judgment.

---

## 3. Key Architectural Patterns

### 3.1 The Data Accumulator Pattern
```typescript
interface TestData {
  citationId: string | null;
  customerId: string | null;
}
const data: TestData = { citationId: null, customerId: null };
// Steps fill data.citationId; subsequent steps read it with data.citationId!
```
- Why object over `let`: avoids TypeScript "possibly unassigned" across step closures.
- Every field starts `null`; steps assert before subsequent steps depend on them.

### 3.2 The 15-Step E2E Skeleton
```typescript
test('Flow', async ({ page, account, citationsClient }) => {
  const masterSearch = new MasterSearchPage(page);  // POMs at top
  const data = { citationId: null as string | null };  // accumulator
  
  await test.step('1. API: Create citation', async () => { ... });
  await test.step('2. UI: Navigate to search', async () => { ... });
  // ... steps 3-15
});
```

### 3.3 Worker-Scoped Account Fixture
```typescript
account: [async ({ request }, use) => {
  const login = await apiLogin(request);
  await use(login);  // test runs here
  await apiLogout(login.refreshToken);  // teardown
}, { scope: 'worker' }]
```
- Login once per worker, 20 tests share the session. Saves 108s vs test-scoped (3s × 36 extra logins).

### 3.4 Component POM Pattern
```typescript
// MasterSearchPage.ts — orchestrator
export class MasterSearchPage {
  readonly searchPanel: SearchPanel;
  readonly resultsGrid: ResultsGrid;
  constructor(page: Page) {
    this.searchPanel = new SearchPanel(page);
    this.resultsGrid = new ResultsGrid(page);
  }
}
```
- Split mega-POMs by functional component. Orchestrator composes; components encapsulate.

### 3.5 The Five-Layer API Library
```
Layer 5: Domain Clients (CitationsClient.pay(id, amount))
Layer 4: Endpoint Registry (Endpoints.citations.pay(id))
Layer 3: Header Builder (HeadersBuilder.new().withBearer(token).build())
Layer 2: ApiCore (generic get/post/patch/delete with typed response<T>)
Layer 1: Playwright APIRequestContext
```

### 3.6 Factory Pattern for Headers/Payloads
```typescript
HeadersCrm.auth(accessToken, testId)  // token is param, never hardcoded
PayloadsCitation.pending({ customerId: account.userId })  // defaults + override
Endpoints.citations.getById(id)  // function, not constant
```

### 3.7 Cross-Site Pattern 2 (New Tab)
```typescript
const [newTab] = await Promise.all([
  page.context().waitForEvent('page'),  // listener FIRST
  page.click('#openButton'),             // trigger SECOND
]);
```
- **Critical:** Listener must be registered before the trigger fires, or the event is missed.

### 3.8 D365 Two-Phase Render Wait
```typescript
// ❌ Wrong: passes on empty shell
await page.locator('.ms-DetailsList-row').waitFor({ state: 'visible' });

// ✅ Correct: waits for actual data
await expect(page.locator('.ms-DetailsList-row').first())
  .toContainText('CIT-', { timeout: 45000 });
```

---

## 4. Critical Gotchas & Anti-Patterns

### 4.1 The "Never Do" List

| # | Anti-Pattern | Why It Fails | Fix |
|---|---|---|---|
| 1 | `await page.waitForTimeout(N)` | Slows tests, still flaky on slow CI | `expect(locator).toHaveText()` |
| 2 | `items.forEach(async () => { await click() })` | Fires all callbacks without awaiting | `for...of` sequential or `Promise.all` |
| 3 | `await page.click(); await context.waitForEvent('page')` | Race condition — event fires before listener | `Promise.all([listener, click])` |
| 4 | `let sharedId` at module level | Worker processes don't share memory | Use accumulator object inside test or fixture |
| 5 | Hardcoded test credentials in spec files | Security breach, breaks on rotation | `process.env` + fixtures |
| 6 | Asserting only `response.status() == 201` | Silent 200 — data may be wrong | Assert response body fields + DB layer |
| 7 | `page.getByRole('button', { name: 'Edit' })` in D365 CommandBar | D365 uses `menuitem`, not `button` | `getByRole('menuitem', { name: 'Edit' })` |
| 8 | `await statusField.textContent()` after `waitFor({ state: 'visible' })` | Phase 1 render has empty text | `await expect(statusField).not.toHaveText('')` |
| 9 | `page.waitForLoadState('networkidle')` on D365 | Background polling prevents idle | Wait for spinner gone + content visible |
| 10 | `expect(await locator.isVisible()).toBe(true)` | One-shot check, no retry | `await expect(locator).toBeVisible()` |
| 11 | `.nth(2)` for targeting buttons | Index shifts when DOM changes | Scope to parent container or use data attributes |
| 12 | Using CSS class names as locators (`.blue-button`) | Change every build → breaks 50 tests | `data-testid` or `getByRole` |
| 13 | `expect.soft()` without final hard assertion | Failures collected but never thrown | `expect(test.info().errors).toHaveLength(0)` |
| 14 | Mocking the API in an integration test | Tests mock instead of real system | Mock only for UI-isolation tests |
| 15 | `new Date().toLocaleDateString()` in assertions | Timezone-dependent flakiness | Use fixed test dates in UTC |
| 16 | Missing `await` on `expect.poll()` | Poll runs but test moves on | `await expect.poll(...)` |
| 17 | Not throwing on permanent failure inside `expect.poll()` | Polls for 10 min on FAILED job | `throw new Error()` when status === 'FAILED' |

### 4.2 D365-Specific Traps
- **menuitem role:** CommandBar buttons are `<li role="menuitem">`, not `<button>`.
- **IFrames:** Main content lives in `contentIFrame0`. Use `page.frameLocator(...)`.
- **Two-phase render:** Grid shell appears empty, then OData populates. Wait for CONTENT, not visibility.
- **Stale render:** Navigating to Customer B shows Customer A's data briefly. Assert on expected text, not just visibility.
- **Tab unmount/remount:** React unmounts previous tab's component. Re-create locators after tab click.
- **Lookup fields:** Use `.type()` with delay (not `.fill()`) because OData debounce requires keyboard events.
- **PCF controls:** Custom React components with independent lifecycle. Wait for `.pcf-initialized-marker`.
- **React StrictMode double-render:** Elements flash appear→disappear→appear. `expect().toBeVisible()` retries through this.

---

## 5. Enterprise Patterns for Large-Scale Test Automation

### 5.1 Project Structure
```
tests/
├── fixtures/
│   ├── index.ts           # mergeTests barrel export
│   ├── auth.fixture.ts    # worker-scoped account
│   ├── db.fixture.ts      # DB connection pool
│   └── api.fixture.ts     # domain clients
├── pages/
│   ├── crm/
│   │   ├── MasterSearchPage.ts
│   │   └── components/
│   │       ├── SearchPanel.ts
│   │       └── ResultsGrid.ts
│   └── legacy-jsp/
├── clients/
│   ├── CitationsApiClient.ts
│   └── NotificationsClient.ts
├── data/
│   ├── endpoints.ts
│   ├── headers/
│   │   └── HeadersCrm.ts
│   ├── payloads/
│   │   └── PayloadsCitation.ts
│   └── enums/
│       └── citation.enums.ts
├── utils/
│   ├── APIUtils.ts
│   └── polling.ts
└── specs/
    └── crm/
```

### 5.2 The Test Import Rule
```typescript
// ✅ Import from YOUR fixtures, never from @playwright/test directly
import { test, expect } from '../../fixtures';
```
This gives tests access to custom fixtures (`account`, `citationsClient`, `dbPool`) automatically.

### 5.3 The Import Order Convention
```typescript
// 1. Framework (fixtures)
// 2. Page Objects (UI layer)
// 3. Data layer (payloads, enums)
// 4. Types (interfaces)
// 5. Utilities
```

### 5.4 Test Data Cleanup
- **Fixture teardown:** `try { ... } finally { deleteTestData() }` — runs even if test fails.
- **Orphan sweeper:** Query DB for `isTestData=true` records older than 1 hour, delete them.
- **Cleanup BEFORE, not after:** In `beforeEach`, clean known test data IDs so previous crashes don't pollute.

### 5.5 CI/CD Pipeline Structure
```yaml
# GitHub Actions example pattern
jobs:
  smoke:      # PR gate — 30 tagged tests, < 5 min
    grep: /@smoke/
    workers: 4
    retries: 0
  regression: # Nightly — all 300 tests
    grepInvert: /@smoke/
    workers: 6
    retries: 2
    sharding: 1/4, 2/4, 3/4, 4/4
```

### 5.6 Flakiness Management
- Quarantine test with `test.skip(true, 'ISSUE-1234: root cause. Fix by YYYY-MM-DD.')`
- Max quarantine: 2 sprints (4 weeks). Escalate if not fixed.
- Track quarantine count in weekly SDET report.
- If quarantine > 5% of suite, freeze new test additions until < 2%.

---

## 6. Advanced Techniques

### 6.1 API Mocking with `page.route()`
- Mock BEFORE navigation: `await page.route(...)` then `await page.goto(...)`.
- Three handler options: `route.fulfill()` (mock), `route.continue()` (passthrough), `route.abort()` (network failure).
- **When to mock:** UI-only tests (error states, empty states, loading states). **When NOT to mock:** Integration tests verifying real API behaviour.

### 6.2 Database Verification (3-Layer)
```typescript
// Layer 1: API response
const citation = await citationsClient.create(payload);
// Layer 2: UI reflection
await expect(statusBadge).toHaveText('PENDING');
// Layer 3: DB ground truth
const row = await dbPool.queryOne('SELECT status FROM citations WHERE id = $1', [citation.id]);
expect(row?.status).toBe('PENDING');
```

### 6.3 Visual Regression
- `toHaveScreenshot()` with `maxDiffPixelRatio: 0.01` for anti-aliasing tolerance.
- Mask dynamic content (timestamps, spinners) with `mask: [locator]`.
- Disable CSS animations before screenshots: `page.addStyleTag({ content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }' })`.

### 6.4 Polling with `expect.poll()`
```typescript
await expect.poll(
  async () => (await citationsClient.getById(id)).status,
  {
    message: `Citation ${id} never reached PAID`,
    timeout: 120_000,
    intervals: [1000, 2000, 5000, 10000],  // progressive backoff
  }
).toBe('PAID');
```
- Stops immediately on success. Throws immediately on permanent failure (throw inside poll function).
- Never use `for` loop + `waitForTimeout` again.

### 6.5 CDP Network Throttling
```typescript
const client = await context.newCDPSession(page);
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  downloadThroughput: 1.5 * 1024 * 1024 / 8,
  uploadThroughput: 750 * 1024 / 8,
  latency: 100,
});
```

---

## 7. AI & Modern Tooling

### 7.1 MCP (Model Context Protocol)
- Open protocol by Anthropic for AI ↔ tool communication.
- Playwright MCP Server: `npx @playwright/mcp@latest`.
- AI can navigate real apps, read DOM, take screenshots, discover locators based on observation.
- Configuration: Claude Desktop `claude_desktop_config.json`, Cursor MCP panel, VS Code `.vscode/mcp.json`.

### 7.2 AI-Assisted Workflow
1. **Context-rich prompt** (POM classes, fixture shapes, patterns used)
2. **AI generates scaffolding** (test shape, locator suggestions)
3. **Identify violations:** `waitForTimeout`, inline locators, hardcoded tokens, `any` types, missing POM, no cleanup
4. **Apply enterprise patterns** from Ch05–Ch07, Ch23–Ch24
5. **Validate with Playwright Inspector** before committing

### 7.3 GitHub Copilot Integration
- Open relevant POM/fixture/APIUtils files in tabs — Copilot uses them as context.
- Comments-to-code workflow: write descriptive comment → Tab for completion.
- **Reject suggestions containing:** `waitForTimeout`, raw `.ms-*` CSS selectors, imports from `@playwright/test` (bypassing fixtures), `as any`, hallucinated APIs.

### 7.4 Current Boundary (2025)
- ✅ AI good for: locator discovery, test inventory/journey discovery, flakiness hypothesis generation, first-draft scaffolding, selector alternatives.
- ❌ AI cannot replace: D365-specific timing knowledge, fixture architecture design, typed API client libraries, trace-based diagnosis, production test review.
- **Mental model:** "AI is a fast junior who scaffolds. You are the senior who designs and reviews."

---

## 8. Interview Prep Content

### 8.1 What the Quizzes Prepare You For

**Quiz 01 (40 MCQ):**
- `await` rules (Q1), `forEach` trap (Q2), `Promise.all` (Q3–Q5)
- POM patterns (Q6–Q8), fixture scope (Q9–Q11)
- D365 timing (Q12–Q14), D365 menuitem role (Q15), two-phase render (Q16)
- Parallel workers (Q18–Q20), new tab handling (Q5, Q22)
- CDP (Q26), route vs request (Q27), `expect.poll` (Q29)
- Visual regression (Q30), GraphQL (Q32), CAPTCHA bypass (Q33)
- File download race condition (Q37), SPA networkidle (Q38)

**Quiz 02 (20 Code Challenges):**
- Spot the bug (forEach async, new tab race, module state, wrong wait, missing `as const`, storageState too early)
- Explain why (POM lazy eval, worker scope savings, optional chaining)
- Write it yourself (new tab handler, D365 spinner wait, typed response, `objectContaining`, fixture with teardown, component split, API retry, GraphQL operation mocking, `filter` anti-pattern rewrite, dynamic fixture options)

**SDET Problem Sets:**
- JUnit5 + Mockito fundamentals (mock vs spy, AAA pattern, parameterized tests)
- Playwright bug identification and fixes
- Test strategy design (food delivery — unit/integration/E2E split)

### 8.2 Interview-Ready Knowledge Areas
| Area | Chapters | Key Talking Points |
|---|---|---|
| Testing Pyramid | Ch00 | 60/30/10 split, why UI tests are expensive, push down the pyramid |
| Idempotency & Isolation | Ch00, Ch06 | Unique identity (`Date.now()`, UUID) + `try/finally` cleanup = run 100x safely |
| POM Architecture | Ch05, Ch18 | Lazy eval, composition over inheritance, component split, locator dictionary |
| Fixtures & DI | Ch06 | `test.extend()`, worker vs test scope, `mergeTests`, yield teardown |
| D365 Specifics | Ch10, Ch17 | Two-phase render, menuitem role, iframe boundary, lookup field, aria-disabled |
| Async Patterns | Ch04, Ch08, Ch42 | `Promise.all` race-free, `expect.poll` vs loops, `waitForResponse` |
| Flakiness Diagnosis | Ch26 | 9-type taxonomy, trace-first debugging, `--repeat-each=50` |
| API Client Design | Ch23, Ch44 | 5-layer architecture, typed errors, Zod validation, retry middleware |
| Parallel Execution | Ch09 | Workers are separate processes, data collision prevention, sharding |
| AI/MCP Integration | Ch45 | MCP gives AI real browser access, scaffold→review pattern, current limitations |

### 8.3 LADDER Interview Framework (Ch32)
- **L**earn the problem — restate the scenario
- **A**sk clarifying questions — edge cases, constraints
- **D**esign the approach — architecture, trade-offs
- **D**efend decisions — why POM over inline, why fixture over beforeEach
- **E**valuate alternatives — what if scale 10x?
- **R**eflect — what would you do differently?

---

## 9. Comparison with Industry Standards

### 9.1 How This Curriculum Maps to Real-World SDET Needs

| Industry Need | Curriculum Coverage | Match |
|---|---|---|
| Playwright automation | Ch01–Ch18, Ch25–Ch31 | Complete — from first test to production architecture |
| TypeScript type safety | Ch04, Ch27, Ch36 | Deep — generics, unions, mapped types, `satisfies` |
| CI/CD integration | Ch25 | GitHub Actions + Azure DevOps, sharding, secrets |
| Parallel execution | Ch09 | Worker model, data collision prevention, unique IDs |
| API testing | Ch22–Ch24, Ch44 | REST client library design, typed errors, retry, Zod |
| Database verification | Ch30 | Direct SQL assertions, 3-layer verify, DB fixture |
| Visual regression | Ch29 | `toHaveScreenshot`, masking, baseline workflow |
| Performance testing | Ch37 | Lighthouse CI, k6, Core Web Vitals |
| Accessibility | Ch39 | axe-core, keyboard nav, WCAG 2.1, POUR |
| Security testing | Ch19, Ch40 | OWASP Top 10, ZAP CI, IDOR, XSS, auth enforcement |
| Contract testing | Ch38 | Pact consumer/provider, Pact Broker, `can-i-deploy` |
| GraphQL/WebSocket | Ch41 | Typed GQL client, cursor pagination, WS capture |
| D365/enterprise SPA | Ch10, Ch17 | Two-phase render, IFrames, Fluent UI, OData |
| Flakiness management | Ch26 | 9-type taxonomy, quarantine, metrics, trace-first |
| Test data lifecycle | Ch28 | 5 seeding strategies, cleanup, orphan sweeper |
| SDE skill bridge | Ch33–Ch36 | CS thinking, algorithms, OOP patterns, type system |
| AI-assisted testing | Ch45 | MCP, agentic scaffolding, Copilot integration |

### 9.2 Gap Analysis
- **Mobile native testing:** Covered in `23_Mobile_Dev_And_Testing` (Playwright vs Appium comparison), but not hands-on Appium coding within the Playwright module.
- **Accessibility testing depth:** axe-core coverage is solid but could expand with screen reader testing (NVDA/JAWS automation).
- **Chaos engineering:** Not covered (e.g., Gremlin-style failure injection).
- **Observability/APM integration:** No coverage of integrating Playwright with Datadog/New Relic for test observability.
- **BDD/Cucumber:** Not mentioned — some enterprises use Cucumber + Playwright.

---

## 10. Gaps or Areas for Extension

### 10.1 Within the Curriculum
1. **Real-world hybrid app testing** — How to combine Playwright (WebView) + Appium (native shell) in a single test for true hybrid apps.
2. **Cloud device farm integration** — BrowserStack, Sauce Labs, AWS Device Farm integration patterns.
3. **Test impact analysis** — Selecting only tests affected by code changes (changed files → affected POMs → test subset).
4. **Mutation testing** — Using Stryker to verify test quality (are tests actually catching bugs?).
5. **Property-based testing** — Fast-check or similar for generating random test data patterns.
6. **Tracing integration with APM** — Correlating Playwright test traces with backend APM traces (OpenTelemetry).

### 10.2 Suggested Extensions
1. **Chapter 46: Test Impact Analysis & Smart Test Selection** — How to use dependency graphs to run only affected tests on PR.
2. **Chapter 47: Observability in Test Automation** — Integrating Playwright traces with distributed tracing (OpenTelemetry, Jaeger).
3. **Chapter 48: BDD with Playwright** — Cucumber/Gherkin integration with the existing POM/fixture architecture.
4. **Chapter 49: Chaos Testing with Playwright** — Simulating network partitions, API degradation, and browser crashes.
5. **Hands-on Appium module** — A follow-up module for native mobile testing (Android Kotlin + iOS Swift).

---

## Cross-Module Links

| Topic | External Module |
|---|---|
| API Testing (REST, SOAP, DB) | `22_Advanced_API_Testing/` |
| TypeScript foundations | `17_TypeScript/` |
| Browser internals | `16_JavaScript/09_Browser_Internals_Rendering.md` |
| React rendering lifecycle | `15_React_Frontend/` |
| SQL/DB JOINs, CTEs | `08_SQL/` |
| DevOps/CI pipelines | `22_DevOps/19_CICD_Pipelines.md` |
| DSA/Algorithms | `03_Algorithms/` |
| OOP design patterns | `06_OOP_Design/` |
| Mobile testing comparison | `23_Mobile_Dev_And_Testing/01_Playwright_vs_Appium_Full_Comparison.md` |

---

*Document generated: 2026-06-06*
*Source: `/mnt/e/Dev_World/04_Practice/Daily-Prep/21_SDET_Playwright_Automation/` (48 files)*
*Coverage: Ch00–Ch45, both quizzes, problem sets, practice resources, Playwright vs Appium comparison*
