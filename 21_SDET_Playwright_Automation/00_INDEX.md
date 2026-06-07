# 21. SDET & Playwright Automation — Module Index

> **What's the difference between this and [00_Start_Here.md](./00_Start_Here.md)?**
> **Start_Here** = reading paths by background. Read once on day one.
> **INDEX** (this file) = chapter table + dependency map + quick-reference snippets. Keep open while you work.

> **Module add-ons (post-upgrade):**
> | Folder | Purpose |
> |---|---|
> | [`framework/`](./framework/README.md) | Runnable enterprise Playwright + TS scaffold |
> | [`challenges/`](./challenges/README.md) | 7 graded challenges + 3 portfolio capstones |
> | [`career/`](./career/README.md) | Progress, interview bank, portfolio, résumé, DevSecOps thread |
> | Chapters 46–54 | BDD, Allure/ReportPortal, sharding, feature flags, email, secrets, CT, mutation testing, synthetics |

**Module Goal:** Take you from zero to a production-grade SDET / SDE who can architect, build, and maintain enterprise test automation systems — covering Playwright, TypeScript, real-world async patterns, API client library design, enterprise CI/CD, performance, security, and accessibility testing.

---

## Reading Order & Time Estimates

| # | Chapter | Time | Key Topics | Cross-links |
|---|---|---|---|---|
| 00 | [SDET Foundations & Mindset](./01_Foundations/00_SDET_Foundations_Mindset.md) | 30 min | What SDETs do, testing pyramid, SDET vs developer | `13_Dev/06_Testing_Fundamentals` |
| 01 | [Playwright & TypeScript Basics](./01_Foundations/01_Playwright_TS_Basics.md) | 45 min | Project setup, first test, config, locators intro | `17_TS/01_TS_Foundations` |
| 02 | [Enterprise Locators & XPath](./01_Foundations/02_Enterprise_Locators_XPath.md) | 45 min | CSS, XPath, getByRole, getByText, locator chaining | `18_CSS/01_CSS_Foundations` |
| 03 | [Browser Console Scripting](./01_Foundations/03_Browser_Console_Scripting.md) | 30 min | DevTools console, DOM scripts, XPath in console | `16_JS/05_JS_DOM_BrowserAPIs` |
| 04 | [JS & TS for Automation](./01_Foundations/04_JS_TS_For_Automation.md) | 60 min | **async/await, Promise.all, TypeScript types, ES6** | `16_JS/04`, `17_TS/01`, `17_TS/02` |
| 05 | [POM Architecture Deep Dive](./02_Core_Architecture/05_POM_Architecture_Deep_Dive.md) | 50 min | **MasterSearchPage dissected, lazy eval, typed dicts** | `17_TS/01`, `15_React/07` |
| 06 | [Custom Fixtures Architecture](./02_Core_Architecture/06_Custom_Fixtures_Architecture.md) | 50 min | **test.extend, scope:worker, yield teardown, account fixture** | `17_TS/01 Generics`, `06_OOP/02` |
| 07 | [E2E Test Architecture](./02_Core_Architecture/07_test_step_E2E_Architecture.md) | 60 min | **15-step skeleton, Data Accumulator, cross-tab Promise.all** | `16_JS/04_Async` |
| 08 | [Browser Internals for SDETs](./02_Core_Architecture/08_Browser_Internals_for_SDETs.md) | 45 min | **4 browser trees, D365 two-phase render, SPA vs JSP waits** | `16_JS/09`, `15_React/01` |
| 09 | [Parallel Execution & Workers](./02_Core_Architecture/09_Parallel_Execution_Workers.md) | 45 min | **Worker model, fullyParallel, data collision prevention** | `13_Dev/19_Concurrency` |
| 10 | [Dynamics 365 CRM Testing](./03_D365_And_Patterns/10_Dynamics365_CRM_Testing.md) | 60 min | **IFrames, .ms-* classes, menuitem trap, data-automation-key** | `18_CSS/01`, `15_React/01` |
| 11 | [Cross-Site Pattern 1: Sequential Flow](./03_D365_And_Patterns/11_CrossSite_Pattern1_Sequential_Flow.md) | 60 min | **Data Accumulator across sites, mixed D365/JSP waits, API cross-validation** | Ch07, Ch08, Ch10 |
| 12 | [Cross-Site Pattern 2: New Tab + Shared Context](./03_D365_And_Patterns/12_CrossSite_Pattern2_NewTab_SharedContext.md) | 45 min | **Promise.all race condition, OrderTrackingPage POM, tab cleanup** | Ch04, Ch08 |
| 13 | [Cross-Site Pattern 3: Dual Browser Contexts](./03_D365_And_Patterns/13_CrossSite_Pattern3_Dual_BrowserContext.md) | 50 min | **Admin+Customer simultaneous sessions, try/finally cleanup** | Ch06, Ch16 |
| 14 | [Cross-Site Pattern 4: Token & Magic Link](./03_D365_And_Patterns/14_CrossSite_Pattern4_Token_Magic_Link.md) | 50 min | **Email interception, OAuth redirect, token expiry/reuse testing** | Ch22/01, Ch19 |
| 15 | [Cross-Site Pattern 5: UI-API Side Effects](./03_D365_And_Patterns/15_CrossSite_Pattern5_UI_API_Side_Effects.md) | 45 min | **Success theatre anti-pattern, notification verification, expect.poll** | Ch22/05, Ch07 |
| 16 | [Cross-Site Pattern 6: StorageState Chaining](./03_D365_And_Patterns/16_CrossSite_Pattern6_StorageState_Chaining.md) | 45 min | **globalSetup, per-role auth states, cross-domain SSO, token refresh fixture** | Ch06, Ch09 |
| 17 | [D365 Advanced: Timing Traps & Hidden DOM](./03_D365_And_Patterns/17_D365_Advanced_Timing_Patterns.md) | 60 min | **7 failure modes, diagnostic flowchart, wait strategy table** | Ch08, Ch10 |
| 18 | [Mega POM Architecture](./04_Enterprise_Architecture/18_Mega_POM_Architecture.md) | 60 min | **Component POM pattern, Locator Dictionary, 7-step refactoring strategy** | Ch05 |
| 19 | [Console Scripts & Security Testing](./05_Advanced_Topics/19_Advanced_Console_Scripts_Security.md) | 45 min | **12 runnable scripts, cookie audit, headers, auth enforcement, IDOR, XSS** | Ch03 |
| 20 | [Practice Resources & Learning Path](./08_Practice_And_Quizzes/20_Practice_Resources_Learning_Path.md) | 30 min | **D365 trial, OrangeHRM, JSONPlaceholder, 10-week challenges** | All |
| 21 | [Enterprise Project Structure — The Why](./04_Enterprise_Architecture/21_Enterprise_Project_Structure.md) | 60 min | **Folder justification, enums, endpoints, headers, payload factories, clients** | Ch05, Ch06 |
| 22 | [Headers, Payloads & Endpoints — Factory Pattern](./04_Enterprise_Architecture/22_Headers_Payloads_Endpoints_Factory.md) | 60 min | **Static factories, override pattern, call chain traced end-to-end** | Ch21 |
| 23 | [APIUtils — Your HTTP Library](./04_Enterprise_Architecture/23_APIUtils_HTTP_Library.md) | 60 min | **Generic wrapper, composition vs inheritance, fixture injection chain** | Ch06, Ch22 |
| 24 | [Test Script Architecture — POMs Before Steps](./04_Enterprise_Architecture/24_Test_Script_Architecture.md) | 60 min | **Why POMs at top, data accumulator vs let, step naming, no data in specs** | Ch05, Ch07, Ch23 |
| 25 | [CI/CD — Playwright in GitHub Actions & Azure DevOps](./05_Advanced_Topics/25_CICD_Integration_GitHub_Azure.md) | 60 min | **Workflow YAML, sharding, secrets, HTML reports, env check script** | Ch09, Ch16 |
| 26 | [Flakiness — Diagnose & Fix Unstable Tests](./05_Advanced_Topics/26_Flakiness_Diagnosis_and_Fixing.md) | 60 min | **9 flakiness types, trace viewer guide, quarantine pattern, flakiness metrics** | Ch08, Ch17 |
| 27 | [Advanced TypeScript Patterns for SDETs](./05_Advanced_Topics/27_Advanced_TypeScript_for_SDETs.md) | 60 min | **Generics, discriminated unions, template literal types, mapped types, satisfies** | Ch04, Ch22 |
| 28 | [Test Data Lifecycle — Seeding, Isolation & Cleanup](./05_Advanced_Topics/28_Test_Data_Lifecycle_and_Cleanup.md) | 60 min | **5 seeding strategies, TestDataManager, try/finally teardown, orphan sweeper** | Ch06, Ch09, Ch21 |
| 29 | [Visual Regression Testing — `toHaveScreenshot()`](./05_Advanced_Topics/29_Visual_Regression_Testing.md) | 60 min | **Pixel comparison, masking dynamic content, D365 pitfalls, baseline workflow** | Ch17, Ch25, Ch26 |
| 30 | [Database Verification — Direct SQL Assertions](./05_Advanced_Topics/30_Database_Verification_Direct_SQL.md) | 60 min | **PostgreSQL/SQL Server client, 3-layer verify, audit log assertions, DB fixture** | Ch07, Ch15, Ch28 |
| 31 | [API Mocking with `page.route()`](./05_Advanced_Topics/31_API_Mocking_page_route.md) | 60 min | **Error states, empty states, timeout simulation, HAR replay, when NOT to mock** | Ch08, Ch15 |
| 32 | [SDET Interview Prep — System Design, Technical & Behavioral](./06_SDET_to_SDE_Bridge/32_SDET_Interview_Prep.md) | 90 min | **LADDER framework, deep-dives, STAR answers, live coding challenges, ask-backs** | All |
| &nbsp; | **——— SDET → SDE BRIDGE ——— Cross-referenced with DSA / OOP / TypeScript guides** | | | |
| 33 | [SDET→SDE CS Thinking — Data Structures, Graphs, Patterns](./06_SDET_to_SDE_Bridge/33_SDET_to_SDE_CS_Thinking.md) | 90 min | **HashMap in TestDataManager, Stack cleanup order, DOM as tree, GoF patterns map** | `02_DS`, `03_Algo`, `06_OOP`, `14_MM` |
| 34 | [Algorithms in Test Automation — Search, Sort, Pattern Recognition](./06_SDET_to_SDE_Bridge/34_Algorithms_in_Test_Automation.md) | 90 min | **Sliding window pagination, two-pointer dual context, binary search, greedy scheduling** | `03_Algo`, `14_MM`, `20_IM` |
| 35 | [OOP Design Patterns Deep-Dive for SDETs](./06_SDET_to_SDE_Bridge/35_OOP_Design_Patterns_for_SDETs.md) | 90 min | **SOLID in POM, Factory, Observer, Strategy, Template Method, Proxy, Composite** | `06_OOP` |
| 36 | [TypeScript Type System Mastery for SDETs](./06_SDET_to_SDE_Bridge/36_TypeScript_Type_System_Mastery.md) | 90 min | **Impossible states, generic constraints, conditional types, mapped types, infer, satisfies** | `17_TS` |
| &nbsp; | **——— OPEN-SOURCE & SPECIALISED TESTING ——— Real tools, online references throughout** | | | |
| 37 | [Performance Testing — Lighthouse CI, k6 & Core Web Vitals](./07_Specialised_Testing/37_Performance_Testing_Lighthouse_k6.md) | 75 min | **Navigation Timing API, web-vitals, LHCI config, k6 load test, perf budget** | Ch25 |
| 38 | [Contract Testing with Pact — Prevent API Breaking Changes](./07_Specialised_Testing/38_Contract_Testing_Pact.md) | 75 min | **Consumer pacts, provider verification, Pact Broker, can-i-deploy, CI workflow** | Ch22, Ch23 |
| 39 | [Accessibility Testing — axe-core & WCAG 2.1](./07_Specialised_Testing/39_Accessibility_Testing_axe_core.md) | 75 min | **POUR principles, axe fixture, keyboard nav, colour contrast, A11y debt tracking** | Ch25 |
| 40 | [Security Test Automation — OWASP ZAP, IDOR & Auth](./07_Specialised_Testing/40_Security_Testing_OWASP.md) | 90 min | **OWASP Top 10, auth enforcement, IDOR tests, injection payloads, ZAP CI scan** | Ch19, Ch31 |
| 41 | [GraphQL & WebSocket Testing](./07_Specialised_Testing/41_GraphQL_WebSocket_Testing.md) | 75 min | **GQL always-200 errors, typed client, cursor pagination, WS capture, Faker.js** | Ch31 |
| Q1 | [Quiz 01: MCQ (25 Questions)](./08_Practice_And_Quizzes/QUIZ_01_Playwright_MCQ.md) | 30 min | **Self-test: Chapters 01–16 fundamentals** | — |
| Q2 | [Quiz 02: Code Challenges (15)](./08_Practice_And_Quizzes/QUIZ_02_Playwright_CodeChallenge.md) | 60 min | **Spot the bug, explain this, write it yourself** | — |
| &nbsp; | **——— REAL-WORLD ADVANCED ——— Polling, War Stories, API Library Design** | | | |
| 42 | [Polling & Async Data Patterns](./05_Advanced_Topics/42_Polling_Async_Data_Patterns.md) | 75 min | **expect.poll(), waitForResponse, pollUntil() utility, anti-pattern hall of shame** | Ch15, Ch26 |
| 43 | [Real-World SDET War Stories](./05_Advanced_Topics/43_Real_World_SDET_War_Stories.md) | 60 min | **14 real problems: ghost click, stale session, silent 200, parallel collision, frame trap** | Ch08, Ch09, Ch26 |
| 44 | [Enterprise API Client Library](./05_Advanced_Topics/44_Enterprise_API_Client_Library.md) | 90 min | **5-layer architecture, typed domain clients, Zod validation, retry middleware, error hierarchy** | Ch22, Ch23, Ch27 |

**Bolded chapters** = Advanced content built on your real codebase.
**Ch33–36** = Read alongside the corresponding guide folder (DSA, OOP, TypeScript) for maximum cross-pollination.
**Ch37–41** = Industry-standard open-source tools (Lighthouse, k6, Pact, axe-core, OWASP ZAP, GraphQL).
**Ch42–44** = Real-world depth: the async waiting patterns, actual war stories, and the API library architecture that separates SDETs from senior SDEs.

> **⏱ Total estimated study time: ~95–110 hours** (44 chapters × 60–90 min + quizzes)

---

## Dependency Map

```
Chapters 00-03 (Foundations — read first)
       ↓
Chapter 04 (JS/TS for Automation — prerequisite for everything)
       ↓
    ┌──────────────────────────────────────┐
    ↓                                      ↓
Chapter 05 (POM)             Chapter 06 (Fixtures)
    ↓                                      ↓
    └──────────────┬───────────────────────┘
                   ↓
            Chapter 07 (E2E Architecture)
                   ↓
    ┌──────────────┴───────────────────────┐
    ↓                                      ↓
Chapter 08 (Browser Internals)   Chapter 09 (Parallel)
    ↓
Chapter 10 (D365 CRM) ← requires Chapter 08
    ↓
Chapters 11-16 (Cross-Website Patterns) ← requires 05, 06, 07, 08
    ↓
    ┌──────────────────────────────────────┐
    ↓                                      ↓
Chapter 17 (D365 Advanced)     Chapter 18 (Mega POM)
    ↓
Chapter 19 (Console + Security)
    ↓
Chapter 20 (Practice Resources) ← read last, do the challenges
    ↓
Chapters 21-24 (Enterprise Architecture — the "Why") ← can read anytime after Ch05+Ch06
    ↓
    ┌──────────────────────────────────────────┐
    ↓                                          ↓
Ch21 (Project Structure)       Ch22 (Headers/Payloads/Endpoints)
    ↓                                          ↓
    └──────────────────┬───────────────────────┘
                       ↓
                  Ch23 (APIUtils)
                       ↓
              Ch24 (Test Script Architecture)

Quiz 01 → after Chapters 01–16
Quiz 02 → after Chapters 01–18
```

---

## Quick Reference — The Most Common Playwright Patterns

### The `await` Rule
```typescript
// Needs await: navigate, click, fill, type, check, hover, waitFor,
//              isVisible(), count(), textContent(), response.json()
// No await: page.locator(), getByRole(), getByText(), .nth(), .filter()
```

### The New Tab Pattern (Always Use This)
```typescript
const [newTab] = await Promise.all([
  page.context().waitForEvent('page'),
  page.click('#openButton'),
]);
```

### The D365 `menuitem` Fix
```typescript
// ❌ page.getByRole('button', { name: 'Edit' })
// ✅ page.getByRole('menuitem', { name: 'Edit' })
```

### The D365 Wait Pattern
```typescript
await expect(page.locator('.ms-Spinner')).toHaveCount(0, { timeout: 30000 });
await expect(fieldLocator).toHaveText('Expected Value', { timeout: 30000 });
```

### The Data Accumulator
```typescript
interface TestData { citationId: string | null; /* ... */ }
const data: TestData = { citationId: null };
// Steps fill and use data.citationId
```

### Cross-Website Pattern Quick Reference
```typescript
// Pattern 1: Sequential flow — same page object, data accumulator carries IDs
// Pattern 2: New tab — Promise.all([waitForEvent('page'), click])
// Pattern 3: Dual context — browser.newContext() × 2, try/finally close both
// Pattern 4: Token/magic link — poll email API, navigate to reset URL
// Pattern 5: UI side effects — expect.poll(notificationsClient.get...)
// Pattern 6: StorageState — globalSetup saves, playwright.config loads
```

### Enterprise Architecture Quick Reference (Ch21-24)
```typescript
// Folder rule:   config/ → URLs/env | data/headers+payloads+enums | clients/ | utils/
// Enums:         CitationStatus.PENDING — never the string 'PENDING'
// Endpoints:     Endpoints.citations.getById(id) — function not constant
// Headers:       HeadersCrm.auth(accessToken) — token is a PARAM not hardcoded
// Payloads:      PayloadsCitation.pending({ customerId: account.userId }) — override pattern
// Clients:       citationsClient.create(payload) — test never sees URL or headers
// Fixtures:      import { test } from '../../fixtures' — NEVER from @playwright/test
// Test body:     const pom = new MyPage(page) → BEFORE test.step()
// Accumulator:   const data = { id: null as string | null } → object, not `let`
// Step names:    'API: Verify CIT-001 is PENDING' — specific, searchable in reports
```

---

### Polling & Async Waiting Quick Reference (Ch42)
```typescript
// RULE: Never for-loop + waitForTimeout. Always use:

// 1. expect.poll() — for any async condition (API, UI, notifications)
await expect.poll(
  async () => citationsClient.getById(id).then(c => c.status),
  { message: 'Citation never reached PAID', timeout: 120_000, intervals: [1000, 2000, 5000, 10000] }
).toBe('PAID');

// 2. waitForResponse() — capture API call AT MOMENT of user action
const [response] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/payments') && r.method() === 'POST'),
  page.click('#pay-now-btn'),
]);

// 3. throw inside expect.poll() to stop immediately on permanent failure
// if (status === 'FAILED') throw new Error('Job permanently failed');

// 4. Domain client helper:
const citation = await citationsClient.waitForStatus(id, 'PAID', 120_000);

// Priority order:
// expect(locator).toHaveText() → expect.poll() → waitForResponse → waitForFunction → locator.waitFor()
// NEVER: waitForTimeout, for-loop, while-loop with sleep
```

### API Client Library Quick Reference (Ch44)
```typescript
// 5-layer hierarchy:
// request (Playwright) → ApiCore → HeadersBuilder → Endpoints → Domain Client

// Domain client usage (tests never see URLs or raw HTTP):
const citation = await citationsClient.create(PayloadsCitation.pending({ customerId }));
const payment  = await citationsClient.pay(citationId, { amount: 150.99 });
await citationsClient.waitForStatus(citationId, 'PAID');

// Typed errors — catch specific failure modes:
try {
  await citationsClient.pay(alreadyPaidId, { amount: 100 });
} catch (e) {
  if (e instanceof CitationAlreadyPaidError) {
    expect(e.status).toBe(409);  // expected — test this case
  } else { throw e; }  // unexpected — rethrow
}

// Schema validation with Zod — catches API contract drift:
// const citation = parseResponse(CitationSchema, rawBody, 'citations.create');
// → throws SchemaValidationError with field-level details if shape is wrong

// Header builder:
// HeadersCrm.auth(token, testId)  ← standard CRM headers
// HeadersBuilder.new().withBearer(token).withTenantId(id).build()
```

---



- **API Testing**: [`22_Advanced_API_Testing/`](../22_Advanced_API_Testing/00_INDEX.md) — REST, SOAP, APIUtils, DB testing, nested assertions (Ch07)
- **TypeScript**: [`17_TypeScript/`](../17_TypeScript/00_INDEX.md) — TS foundations and advanced types
- **Browser Internals**: [`16_JavaScript/09_Browser_Internals_Rendering.md`](../16_JavaScript/09_Browser_Internals_Rendering.md) — Deep rendering pipeline
- **React/SPA**: [`15_React_Frontend/`](../15_React_Frontend/00_INDEX.md) — React rendering lifecycle
- **SQL/DB**: [`08_SQL/`](../08_SQL/00_INDEX.md) — JOIN, CTE, transactions for DB testing
- **DevOps/CI**: [`22_DevOps/19_CICD_Pipelines.md`](../22_DevOps/19_CICD_Pipelines.md) — Running Playwright in GitHub Actions
