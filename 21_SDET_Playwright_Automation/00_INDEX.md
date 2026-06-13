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
| 45 | [AI Agents, MCP & Playwright](./05_Advanced_Topics/45_AI_Agents_MCP_And_Playwright.md) | 75 min | **MCP protocol, Playwright MCP server, AI scaffolding, Copilot integration, agentic boundaries** | Ch05, Ch06, Ch21 |
| &nbsp; | **——— ENTERPRISE TOOLING ——— BDD, observability, test selection, feature flags, email, secrets** | | | |
| 46 | [BDD with Cucumber](./05_Advanced_Topics/46_BDD_With_Cucumber.md) | 60 min | **Cucumber-js, Gherkin, step definitions, Playwright hooks, reporting** | Ch06, Ch07 |
| 47 | [Allure & ReportPortal](./05_Advanced_Topics/47_Allure_ReportPortal.md) | 45 min | **Allure 2 annotations, custom steps, screenshots, ReportPortal CI integration** | Ch25 |
| 48 | [Sharding & Test Selection](./05_Advanced_Topics/48_Sharding_And_Test_Selection.md) | 45 min | **--shard N/M, shard-aware CI matrix, test tagging, selective re-run strategy** | Ch09, Ch25 |
| 49 | [Feature Flag Testing](./05_Advanced_Topics/49_Feature_Flag_Testing.md) | 60 min | **LaunchDarkly, env-based overrides, fixture-driven flag injection, matrix coverage** | Ch06, Ch28 |
| 50 | [Email Service Testing](./05_Advanced_Topics/50_Email_Service_Testing.md) | 60 min | **Mailosaur, MailHog, inbox polling fixture, OTP flows, attachment assertions** | Ch06, Ch14 |
| 51 | [Secrets Management for SDETs](./07_Specialised_Testing/51_Secrets_Management_For_SDETs.md) | 45 min | **gitleaks, Doppler, HashiCorp Vault, GitHub Actions secrets, .env discipline** | Ch25, Ch40 |
| &nbsp; | **——— DEPTH TESTING ——— Component isolation, mutation score, synthetic monitoring** | | | |
| 52 | [Component Testing with Playwright CT](./05_Advanced_Topics/52_Component_Testing_With_Playwright_CT.md) | 60 min | **@playwright/experimental-ct-react, mount(), props/events, CT vs E2E trade-offs** | Ch05, Ch06, Ch39 |
| 53 | [Mutation Testing with Stryker](./07_Specialised_Testing/53_Mutation_Testing_With_Stryker.md) | 60 min | **Stryker mutator, mutation score, surviving mutants, assertion quality** | Ch27 |
| 54 | [Synthetic Monitoring](./05_Advanced_Topics/54_Synthetic_Monitoring.md) | 45 min | **Checkly, cron-based Playwright monitors, alerting, SLA reporting** | Ch25, Ch48 |
| &nbsp; | **——— DEBUGGING SURFACES ——— Inspector, Trace Viewer, UI Mode** | | | |
| 55 | [Inspector, Trace Viewer & UI Mode — Walk-Through](./02_Core_Architecture/55_Inspector_TraceViewer_UIMode_Walkthrough.md) | 30 min | **Step-through live, time-travel past runs, UI Mode watch loop — hands-on only** | Ch26 |
| &nbsp; | **——— CONFIG, AUTH, FILE I/O, DOCKER, TOOL COMPARISON ——— Reader-requested fills** | | | |
| 56 | [Playwright Config Deep-Dive](./02_Core_Architecture/56_Playwright_Config_Deep_Dive.md) | 75 min | **Every config field: projects, use-merging, reporters, timeouts, retries, trace, devices, globalSetup vs dependencies** | Ch09, Ch26, Ch55 |
| 57 | [Login Taxonomy — OAuth2 / OIDC / SAML / MFA / mTLS](./05_Advanced_Topics/57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md) | 90 min | **5 production auth flows beyond storageState — OAuth2+PKCE, OIDC, SAML, TOTP, client certs; worker-scoped token caches** | Ch06, Ch16 |
| 58 | [File Uploads & Downloads](./05_Advanced_Topics/58_File_Uploads_Downloads.md) | 60 min | **setInputFiles single/multi/buffer, drag-drop, download event race, CSV/XLSX/PDF assertion helpers** | Ch04, Ch07 |
| 59 | [Docker for Playwright](./05_Advanced_Topics/59_Docker_For_Playwright.md) | 60 min | **mcr.microsoft.com/playwright base image, multi-stage builds, sharding via docker-compose, /dev/shm gotcha, CI integration** | Ch09, Ch25, Ch48 |
| 60 | [Tool Comparison — Cypress / Selenium / WebdriverIO](./06_SDET_to_SDE_Bridge/60_Tool_Comparison_Cypress_Selenium_WDIO.md) | 60 min | **Honest trade-offs, architecture, locator model, cross-domain, parallel, API testing, when to pick what — interview prep** | Ch32, `23_Mobile_Dev_And_Testing/01` |
| &nbsp; | **——— PRINCIPAL SDET EXTENSION (Module II) ——— Test platform, leadership, governance, resilience** | | | |
| &nbsp; | _Filenames keep the 60–69 numbering for stability; logical chapter numbers are P1–P10 to avoid colliding with Ch60 Tool Comparison above._ | | | |
| P1 | [Test Analytics & Flake Detection](./05_Advanced_Topics/60_Test_Analytics_And_Flake_Detection.md) | 90 min | **Import graph analysis, ML flake detection, cost-per-test, dashboard build** | Ch48, Ch26 |
| P2 | [Leadership & Mentoring Playbook](./05_Advanced_Topics/61_Leadership_And_Mentoring_Playbook.md) | 90 min | **Career ladders, 1:1 frameworks, incident command, technical strategy, cross-team influence** | Ch32, Ch43 |
| P3 | [Cost Governance & FinOps](./05_Advanced_Topics/62_Cost_Governance_And_FinOps.md) | 75 min | **Cloud spend attribution, test infrastructure TCO, spot instances, budget alerts** | Ch25, Ch48 |
| P4 | [SLOs & Error Budgets](./05_Advanced_Topics/63_SLOs_And_Error_Budgets.md) | 75 min | **Defining test-platform SLOs, burn-rate alerts, release gates, error-budget policies** | Ch25, Ch26, Ch54 |
| P5 | [Self-Healing Locators](./05_Advanced_Topics/64_Self_Healing_Locators.md) | 90 min | **DOM stability scoring, ML-based locator repair, fallback chains, healing metrics** | Ch02, Ch05, Ch18 |
| P6 | [Architecture Decision Records](./05_Advanced_Topics/65_Architecture_Decision_Records.md) | 60 min | **ADR format, when to write one, deprecation strategies, RFC-lite process** | Ch21, Ch44 |
| P7 | [Data Anonymization & PII Masking](./05_Advanced_Topics/66_Data_Anonymization_And_PII_Masking.md) | 75 min | **GDPR/CCPA compliance, synthetic data generation, tokenization, audit trails** | Ch28, Ch40 |
| P8 | [Test Impact Analysis](./05_Advanced_Topics/67_Test_Impact_Analysis.md) | 75 min | **Dependency graph tooling, changed-files → affected-tests, monorepo optimization** | Ch09, Ch48 |
| P9 | [Chaos Engineering & Resilience Testing](./05_Advanced_Topics/68_Chaos_Engineering_And_Resilience_Testing.md) | 90 min | **Network degradation, API fault injection, graceful-failure assertions, GameDay process** | Ch31, Ch41, Ch44 |
| P10 | [Observability for Tests](./05_Advanced_Topics/69_Observability_For_Tests.md) | 90 min | **OpenTelemetry tracing, test-to-log correlation, SLO-based alerting, custom metrics** | Ch42, Ch47, Ch54 |

**Bolded chapters** = Advanced content built on your real codebase.
**Ch33–36** = Read alongside the corresponding guide folder (DSA, OOP, TypeScript) for maximum cross-pollination.
**Ch37–41** = Industry-standard open-source tools (Lighthouse, k6, Pact, axe-core, OWASP ZAP, GraphQL).
**Ch42–44** = Real-world depth: the async waiting patterns, actual war stories, and the API library architecture that separates SDETs from senior SDEs.
**Ch45** = AI & MCP: the frontier of agentic test automation and what AI can (and cannot) replace.
**Ch46–51** = Enterprise tooling: BDD, Allure/ReportPortal, sharding, feature flags, email testing, secrets management.
**Ch52–54** = Depth testing: component isolation, mutation score, synthetic monitoring — the upper tier of SDET competency.
**Ch55** = Debugging surfaces: Inspector, Trace Viewer, UI Mode — hands-on only, no shortcuts.
**Ch56–60** = Reader-requested fills: config deep-dive, auth taxonomy beyond storageState, file I/O, Docker, and an honest tool comparison for interview prep.
**P1–P10** (Module II — files named 60–69 inside `05_Advanced_Topics/`) = Principal SDET extension: analytics, leadership, FinOps, SLOs, self-healing locators, ADRs, data privacy, test impact analysis, chaos engineering, and observability. These cover the competencies expected at staff+ and principal SDET levels.

> **Total estimated study time: ~175–210 hours** (60 core chapters + 10 Module II chapters x 60–90 min + quizzes)

---

> **Principal-level note:** Chapters 60–69 represent competencies expected at staff and principal SDET levels — platform ownership, cross-team leadership, and infrastructure resilience. They assume mastery of Chapters 01–48.

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
Quiz 02 Solutions → after attempting Quiz 02 (self-check)

Ch45 (AI/MCP)              → after Ch05+Ch06+Ch21 (needs POM, fixtures, project structure)
Ch46 (BDD with Cucumber)   → after Ch06+Ch07 (steps wrap fixtures + POMs)
Ch47 (Allure/ReportPortal) → after Ch25 (CI/CD pipelines feed the reporter)
Ch48 (Sharding/Selection)  → after Ch09+Ch25 (parallel model + CI matrices)
Ch49 (Feature Flag Testing)→ after Ch06+Ch28 (flag-injection fixtures + data lifecycle)
Ch50 (Email Service)       → after Ch06+Ch14 (token/magic-link pattern)
Ch51 (Secrets Mgmt)        → after Ch25+Ch40 (CI secrets + security testing)
Ch52 (Playwright CT)       → after Ch05+Ch06+Ch39 (POMs, fixtures, a11y baselines)
Ch53 (Mutation Testing)    → after Ch27 (advanced TS for mutator config)
Ch54 (Synthetic Monitoring)→ after Ch25+Ch48 (CI + scheduled runs)
Ch55 (Debugging surfaces)  → after Ch26 (use trace viewer to diagnose flakiness)

Ch56 (Config Deep-Dive)    → read alongside Ch09 (workers + config together)
Ch57 (Login Taxonomy)      → after Ch06+Ch16+Ch28 (fixtures + storageState + data lifecycle)
Ch58 (Uploads/Downloads)   → after Ch07 (E2E steps)
Ch59 (Docker)              → after Ch25+Ch48 (CI + sharding)
Ch60 (Tool Comparison)     → after Ch32 (interview prep)
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

---

## Roadmap — Not Yet Covered (Deliberately Deferred)

These are real gaps. They have NOT been written yet — by design, not by oversight. Each is large enough to deserve its own session and is captured here so readers know what's deliberate vs. what's missing.

| Topic | Why deferred | When to revisit |
|---|---|---|
| **OpenTelemetry / APM integration** (Datadog, New Relic, Jaeger) | Each vendor needs its own walk-through; the patterns differ enough that one chapter would be misleading | When the team picks a primary APM |
| **Chaos engineering** (network partitions, API degradation, browser crash simulation) | Toolchain (Gremlin, Toxiproxy, Chaos Mesh) is still in flux for browser testing | Once a stable Playwright-friendly chaos tool emerges |
| **Cloud device farms** (BrowserStack, Sauce Labs, AWS Device Farm) | Vendor-specific config; quickly stale | On demand — when CI capacity becomes a bottleneck |
| **Property-based testing** (`fast-check` + Playwright) | Niche pattern, hard to motivate for UI tests | Add as a `08_Practice_And_Quizzes/` extension challenge |
| **Mobile / Appium hands-on** | Cross-module concern; lives in `23_Mobile_Dev_And_Testing/` | Expand that module instead |
| **Screen-reader automation** (NVDA / JAWS) | Beyond axe-core; requires OS-level tooling | Pair with Ch39 a11y when the team has a screen-reader user-research need |
| **Test impact analysis** (changed-files → affected-tests) | Real win for monorepos, but requires bespoke dependency-graph tooling | Once the suite exceeds ~500 tests |

If you need any of these urgently, open an issue or ping the maintainer — the absence is intentional but not permanent.
