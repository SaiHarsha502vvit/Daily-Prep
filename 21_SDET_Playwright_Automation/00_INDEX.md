# 21. SDET & Playwright Automation — Module Index

> **New here? Start at the [module front door (README.md)](./README.md)** — it gives one ordered
> learning path through nine stages. **This file is the full catalogue:** every chapter by number,
> with reading time, key concepts and prerequisites. Keep it open as a reference while you work.
>
> **Chapter numbers are permanent IDs, not reading order.** Each chapter now lives in the stage
> folder where it belongs in the learning sequence (e.g. Ch55 Trace Viewer is in Stage 1,
> `01_Foundations/`). Follow the stage order in the README; use this table to look things up.
>
> | Stage folder | Chapters |
> |---|---|
> | [`01_Foundations/`](./01_Foundations/README.md) | 00–04, 55, 56 |
> | [`02_Test_Architecture/`](./02_Test_Architecture/README.md) | 05–09, 64 |
> | [`03_Real_World_Scenarios/`](./03_Real_World_Scenarios/README.md) | 28, 30, 31, 41, 42, 49, 50, 57, 58, 61, 67, 68 |
> | [`04_Cross_Site_Patterns_And_D365/`](./04_Cross_Site_Patterns_And_D365/README.md) | 10–17 |
> | [`05_Enterprise_Framework/`](./05_Enterprise_Framework/README.md) | 18, 21–24, 27, 44, 63 |
> | [`06_CI_CD_And_Reliability/`](./06_CI_CD_And_Reliability/README.md) | 25, 26, 43, 47, 48, 51, 54, 59, 62, 65 |
> | [`07_Specialised_Testing/`](./07_Specialised_Testing/README.md) | 19, 29, 37–40, 45, 46, 52, 53 |
> | [`08_SDET_to_SDE_Bridge/`](./08_SDET_to_SDE_Bridge/README.md) | 32–36, 60, 66 |
> | [`09_Practice_And_Quizzes/`](./09_Practice_And_Quizzes/README.md) | quizzes & problem sets |
> | [`appendix/`](./appendix/README.md) | quick reference, topic summaries, short course, learning paths, maps (secondary; each names its canonical chapter) |
>
> Also: [`framework/`](./framework/README.md) (runnable scaffold, incl. [6 ADRs](./framework/docs/adrs/README.md)) ·
> [`challenges/`](./challenges/README.md) (7 challenges + 3 capstones) · [`career/`](./career/README.md) (rubric, interviews, portfolio).
> Gaps in numbering are deliberate: Ch20 (a practice-resources link list) and a Ch57 config companion were removed in an earlier audit (commit `fb51502b`) — the latter merged into Ch56; Ch57 is now Login Taxonomy.

> **Version stamp:** curriculum verified against **Playwright 1.60 / Node 20** (2026-07-25). The Clock API (Ch61) needs ≥ 1.45; aria snapshots need ≥ 1.49. When bumping `@playwright/test`, re-verify Ch56 (config), Ch61 (emulation), and the framework's `npm run verify` gate, then update this stamp.

**Module Goal:** Take you from zero to a production-grade SDET / SDE who can architect, build, and maintain enterprise test automation systems — covering Playwright, TypeScript, real-world async patterns, API client library design, enterprise CI/CD, performance, security, and accessibility testing.

---

## Reading Order & Time Estimates

| #      | Chapter                                                                                                                                                                                   | Time   | Key Topics                                                                                                                    | Cross-links                           |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 00     | [SDET Foundations & Mindset](./01_Foundations/00_SDET_Foundations_Mindset.md)                                                                                                             | 30 min | What SDETs do, testing pyramid, SDET vs developer                                                                             | `13_Dev/06_Testing_Fundamentals`      |
| 01     | [Playwright & TypeScript Basics](./01_Foundations/01_Playwright_TS_Basics.md)                                                                                                             | 45 min | Project setup, first test, config, locators intro                                                                             | `17_TS/01_TS_Foundations`             |
| 02     | [Enterprise Locators & XPath](./01_Foundations/02_Enterprise_Locators_XPath.md)                                                                                                           | 45 min | CSS, XPath, getByRole, getByText, locator chaining                                                                            | `18_CSS/01_CSS_Foundations`           |
| 03     | [Browser Console Scripting](./01_Foundations/03_Browser_Console_Scripting.md)                                                                                                             | 30 min | DevTools console, DOM scripts, XPath in console                                                                               | `16_JS/05_JS_DOM_BrowserAPIs`         |
| 04     | [JS & TS for Automation](./01_Foundations/04_JS_TS_For_Automation.md)                                                                                                                     | 60 min | **async/await, Promise.all, TypeScript types, ES6**                                                                           | `16_JS/04`, `17_TS/01`, `17_TS/02`    |
| 05     | [POM Architecture Deep Dive](./02_Test_Architecture/05_POM_Architecture_Deep_Dive.md)                                                                                                     | 50 min | **MasterSearchPage dissected, lazy eval, typed dicts**                                                                        | `17_TS/01`, `15_React/07`             |
| 06     | [Custom Fixtures Architecture](./02_Test_Architecture/06_Custom_Fixtures_Architecture.md)                                                                                                 | 50 min | **test.extend, scope:worker, yield teardown, account fixture**                                                                | `17_TS/01 Generics`, `06_OOP/02`      |
| 07     | [E2E Test Architecture](./02_Test_Architecture/07_test_step_E2E_Architecture.md)                                                                                                          | 60 min | **15-step skeleton, Data Accumulator, cross-tab Promise.all**                                                                 | `16_JS/04_Async`                      |
| 08     | [Browser Internals for SDETs](./02_Test_Architecture/08_Browser_Internals_for_SDETs.md)                                                                                                   | 45 min | **4 browser trees, D365 two-phase render, SPA vs JSP waits**                                                                  | `16_JS/09`, `15_React/01`             |
| 09     | [Parallel Execution & Workers](./02_Test_Architecture/09_Parallel_Execution_Workers.md)                                                                                                   | 45 min | **Worker model, fullyParallel, data collision prevention**                                                                    | `13_Dev/19_Concurrency`               |
| 10     | [Dynamics 365 CRM Testing](./04_Cross_Site_Patterns_And_D365/10_Dynamics365_CRM_Testing.md)                                                                                                          | 60 min | **IFrames, .ms-\* classes, menuitem trap, data-automation-key**                                                               | `18_CSS/01`, `15_React/01`            |
| 11     | [Cross-Site Pattern 1: Sequential Flow](./04_Cross_Site_Patterns_And_D365/11_CrossSite_Pattern1_Sequential_Flow.md)                                                                                  | 60 min | **Data Accumulator across sites, mixed D365/JSP waits, API cross-validation**                                                 | Ch07, Ch08, Ch10                      |
| 12     | [Cross-Site Pattern 2: New Tab + Shared Context](./04_Cross_Site_Patterns_And_D365/12_CrossSite_Pattern2_NewTab_SharedContext.md)                                                                    | 45 min | **Promise.all race condition, OrderTrackingPage POM, tab cleanup**                                                            | Ch04, Ch08                            |
| 13     | [Cross-Site Pattern 3: Dual Browser Contexts](./04_Cross_Site_Patterns_And_D365/13_CrossSite_Pattern3_Dual_BrowserContext.md)                                                                        | 50 min | **Admin+Customer simultaneous sessions, try/finally cleanup**                                                                 | Ch06, Ch16                            |
| 14     | [Cross-Site Pattern 4: Token & Magic Link](./04_Cross_Site_Patterns_And_D365/14_CrossSite_Pattern4_Token_Magic_Link.md)                                                                              | 50 min | **Email interception, OAuth redirect, token expiry/reuse testing**                                                            | Ch22/01, Ch19                         |
| 15     | [Cross-Site Pattern 5: UI-API Side Effects](./04_Cross_Site_Patterns_And_D365/15_CrossSite_Pattern5_UI_API_Side_Effects.md)                                                                          | 45 min | **Success theatre anti-pattern, notification verification, expect.poll**                                                      | Ch22/05, Ch07                         |
| 16     | [Cross-Site Pattern 6: StorageState Chaining](./04_Cross_Site_Patterns_And_D365/16_CrossSite_Pattern6_StorageState_Chaining.md)                                                                      | 45 min | **globalSetup, per-role auth states, cross-domain SSO, token refresh fixture**                                                | Ch06, Ch09                            |
| 17     | [D365 Advanced: Timing Traps & Hidden DOM](./04_Cross_Site_Patterns_And_D365/17_D365_Advanced_Timing_Patterns.md)                                                                                    | 60 min | **7 failure modes, diagnostic flowchart, wait strategy table**                                                                | Ch08, Ch10                            |
| 18     | [Mega POM Architecture](./05_Enterprise_Framework/18_Mega_POM_Architecture.md)                                                                                                         | 60 min | **Component POM pattern, Locator Dictionary, 7-step refactoring strategy**                                                    | Ch05                                  |
| 19     | [Console Scripts & Security Testing](./07_Specialised_Testing/19_Advanced_Console_Scripts_Security.md)                                                                                        | 45 min | **12 runnable scripts, cookie audit, headers, auth enforcement, IDOR, XSS**                                                   | Ch03                                  |
| 20     | [Practice Resources & Learning Path](./appendix/learning_paths/PATHWAY_01_LEARNING.md)                                                                                    | 30 min | **D365 trial, OrangeHRM, JSONPlaceholder, 10-week challenges**                                                                | All                                   |
| 21     | [Enterprise Project Structure — The Why](./05_Enterprise_Framework/21_Enterprise_Project_Structure.md)                                                                                 | 60 min | **Folder justification, enums, endpoints, headers, payload factories, clients**                                               | Ch05, Ch06                            |
| &nbsp; | ↳ Worked examples: [`framework/docs/adrs/`](./framework/docs/adrs/README.md) (6 real ADRs) then write your own with [`career/RFC_TEMPLATE.md`](./career/RFC_TEMPLATE.md) | 45 min | **Real documented tradeoffs for this exact framework, then practice documenting one of your own** | Ch21 |
| 22     | [Headers, Payloads & Endpoints — Factory Pattern](./05_Enterprise_Framework/22_Headers_Payloads_Endpoints_Factory.md)                                                                  | 60 min | **Static factories, override pattern, call chain traced end-to-end**                                                          | Ch21                                  |
| 23     | [APIUtils — Your HTTP Library](./05_Enterprise_Framework/23_APIUtils_HTTP_Library.md)                                                                                                  | 60 min | **Generic wrapper, composition vs inheritance, fixture injection chain**                                                      | Ch06, Ch22                            |
| 24     | [Test Script Architecture — POMs Before Steps](./05_Enterprise_Framework/24_Test_Script_Architecture.md)                                                                               | 60 min | **Why POMs at top, data accumulator vs let, step naming, no data in specs**                                                   | Ch05, Ch07, Ch23                      |
| &nbsp; | ↳ Plan at this scale: [`career/TEST_STRATEGY_TEMPLATE.md`](./career/TEST_STRATEGY_TEMPLATE.md) | 45 min | **Every layer you've now seen (pyramid, tools, environments, CI, data, flakiness, cost) as one planning document** | Ch01-24 |
| 25     | [CI/CD — Playwright in GitHub Actions & Azure DevOps](./06_CI_CD_And_Reliability/25_CICD_Integration_GitHub_Azure.md)                                                                           | 60 min | **Workflow YAML, sharding, secrets, HTML reports, env check script**                                                          | Ch09, Ch16                            |
| 26     | [Flakiness — Diagnose & Fix Unstable Tests](./06_CI_CD_And_Reliability/26_Flakiness_Diagnosis_and_Fixing.md)                                                                                    | 60 min | **9 flakiness types, trace viewer guide, quarantine pattern, flakiness metrics**                                              | Ch08, Ch17                            |
| 27     | [Advanced TypeScript Patterns for SDETs](./05_Enterprise_Framework/27_Advanced_TypeScript_for_SDETs.md)                                                                                        | 60 min | **Generics, discriminated unions, template literal types, mapped types, satisfies**                                           | Ch04, Ch22                            |
| 28     | [Test Data Lifecycle — Seeding, Isolation & Cleanup](./03_Real_World_Scenarios/28_Test_Data_Lifecycle_and_Cleanup.md)                                                                          | 60 min | **5 seeding strategies, TestDataManager, try/finally teardown, orphan sweeper**                                               | Ch06, Ch09, Ch21                      |
| 29     | [Visual Regression Testing — `toHaveScreenshot()`](./07_Specialised_Testing/29_Visual_Regression_Testing.md)                                                                                  | 60 min | **Pixel comparison, masking dynamic content, D365 pitfalls, baseline workflow**                                               | Ch17, Ch25, Ch26                      |
| 30     | [Database Verification — Direct SQL Assertions](./03_Real_World_Scenarios/30_Database_Verification_Direct_SQL.md)                                                                              | 60 min | **PostgreSQL/SQL Server client, 3-layer verify, audit log assertions, DB fixture**                                            | Ch07, Ch15, Ch28                      |
| 31     | [API Mocking with `page.route()`](./03_Real_World_Scenarios/31_API_Mocking_page_route.md)                                                                                                      | 60 min | **Error states, empty states, timeout simulation, HAR replay, when NOT to mock**                                              | Ch08, Ch15                            |
| 32     | [SDET Interview Prep — System Design, Technical & Behavioral](./08_SDET_to_SDE_Bridge/32_SDET_Interview_Prep.md)                                                                          | 90 min | **LADDER framework, deep-dives, STAR answers, live coding challenges, ask-backs**                                             | All                                   |
| &nbsp; | ↳ Self-assess now: [`career/READINESS_RUBRIC.md`](./career/READINESS_RUBRIC.md) (12 competencies, Junior→Principal) + [`career/mock_interviews/`](./career/mock_interviews/ladder_system.md) (5 transcripts — start with the system-design one) | 90 min | **Where you actually are vs. where you think you are; senior reasoning modeled, not just described** | Ch32 |
| &nbsp; | **——— SDET → SDE BRIDGE ——— Cross-referenced with DSA / OOP / TypeScript guides**                                                                                                         |        |                                                                                                                               |                                       |
| 33     | [SDET→SDE CS Thinking — Data Structures, Graphs, Patterns](./08_SDET_to_SDE_Bridge/33_SDET_to_SDE_CS_Thinking.md)                                                                         | 90 min | **HashMap in TestDataManager, Stack cleanup order, DOM as tree, GoF patterns map**                                            | `02_DS`, `03_Algo`, `06_OOP`, `14_MM` |
| 34     | [Algorithms in Test Automation — Search, Sort, Pattern Recognition](./08_SDET_to_SDE_Bridge/34_Algorithms_in_Test_Automation.md)                                                          | 135 min | **Sliding window pagination, two-pointer dual context, binary search, greedy scheduling, heap-based CI triage (benchmarked), Union-Find failure clustering, property-based testing's shrink search (verified with fast-check)** | `03_Algo`, `14_MM`, `20_IM`           |
| 35     | [OOP Design Patterns Deep-Dive for SDETs](./08_SDET_to_SDE_Bridge/35_OOP_Design_Patterns_for_SDETs.md)                                                                                    | 90 min | **SOLID in POM, Factory, Observer, Strategy, Template Method, Proxy, Composite**                                              | `06_OOP`                              |
| 36     | [TypeScript Type System Mastery for SDETs](./08_SDET_to_SDE_Bridge/36_TypeScript_Type_System_Mastery.md)                                                                                  | 90 min | **Impossible states, generic constraints, conditional types, mapped types, infer, satisfies**                                 | `17_TS`                               |
| &nbsp; | **——— OPEN-SOURCE & SPECIALISED TESTING ——— Real tools, online references throughout**                                                                                                    |        |                                                                                                                               |                                       |
| 37     | [Performance Testing — Lighthouse CI, k6 & Core Web Vitals](./07_Specialised_Testing/37_Performance_Testing_Lighthouse_k6.md)                                                             | 75 min | **Navigation Timing API, web-vitals, LHCI config, k6 load test, perf budget**                                                 | Ch25                                  |
| 38     | [Contract Testing with Pact — Prevent API Breaking Changes](./07_Specialised_Testing/38_Contract_Testing_Pact.md)                                                                         | 75 min | **Consumer pacts, provider verification, Pact Broker, can-i-deploy, CI workflow**                                             | Ch22, Ch23                            |
| 39     | [Accessibility Testing — axe-core & WCAG 2.1](./07_Specialised_Testing/39_Accessibility_Testing_axe_core.md)                                                                              | 75 min | **POUR principles, axe fixture, keyboard nav, colour contrast, A11y debt tracking**                                           | Ch25                                  |
| 40     | [Security Test Automation — OWASP ZAP, IDOR & Auth](./07_Specialised_Testing/40_Security_Testing_OWASP.md)                                                                                | 90 min | **OWASP Top 10, auth enforcement, IDOR tests, injection payloads, ZAP CI scan**                                               | Ch19, Ch31                            |
| 41     | [GraphQL & WebSocket Testing](./03_Real_World_Scenarios/41_GraphQL_WebSocket_Testing.md)                                                                                                   | 75 min | **GQL always-200 errors, typed client, cursor pagination, WS capture, Faker.js**                                              | Ch31                                  |
| Q1     | [Quiz 01: MCQ (25 Questions)](./09_Practice_And_Quizzes/quiz_01_solutions/README.md)                                                                                                        | 30 min | **Self-test: Chapters 01–16 fundamentals**                                                                                    | —                                     |
| Q2     | [Quiz 02: Code Challenges (15)](./09_Practice_And_Quizzes/quiz_02_solutions/README.md)                                                                                            | 60 min | **Spot the bug, explain this, write it yourself**                                                                             | —                                     |
| &nbsp; | **——— REAL-WORLD ADVANCED ——— Polling, War Stories, API Library Design**                                                                                                                  |        |                                                                                                                               |                                       |
| 42     | [Polling & Async Data Patterns](./03_Real_World_Scenarios/42_Polling_Async_Data_Patterns.md)                                                                                                   | 75 min | **expect.poll(), waitForResponse, pollUntil() utility, anti-pattern hall of shame**                                           | Ch15, Ch26                            |
| 43     | [Real-World SDET War Stories](./06_CI_CD_And_Reliability/43_Real_World_SDET_War_Stories.md)                                                                                                     | 60 min | **14 real problems: ghost click, stale session, silent 200, parallel collision, frame trap**                                  | Ch08, Ch09, Ch26                      |
| 44     | [Enterprise API Client Library](./05_Enterprise_Framework/44_Enterprise_API_Client_Library.md)                                                                                                 | 90 min | **5-layer architecture, typed domain clients, Zod validation, retry middleware, error hierarchy**                             | Ch22, Ch23, Ch27                      |
| 45     | [AI Agents, MCP & Playwright](./07_Specialised_Testing/45_AI_Agents_MCP_And_Playwright.md)                                                                                                    | 90 min | **MCP protocol, Playwright MCP server, AI scaffolding, Copilot integration, agentic boundaries, self-healing locators both ways (LLM offline healing + runtime similarity-scoring)** | Ch05, Ch06, Ch21                      |
| &nbsp; | **——— ENTERPRISE TOOLING ——— BDD, observability, test selection, feature flags, email, secrets**                                                                                          |        |                                                                                                                               |                                       |
| 46     | [BDD with Cucumber](./07_Specialised_Testing/46_BDD_With_Cucumber.md)                                                                                                                         | 60 min | **Cucumber-js, Gherkin, step definitions, Playwright hooks, reporting**                                                       | Ch06, Ch07                            |
| 47     | [Allure & ReportPortal](./06_CI_CD_And_Reliability/47_Allure_ReportPortal.md)                                                                                                                   | 45 min | **Allure 2 annotations, custom steps, screenshots, ReportPortal CI integration**                                              | Ch25                                  |
| 48     | [Sharding & Test Selection](./06_CI_CD_And_Reliability/48_Sharding_And_Test_Selection.md)                                                                                                       | 45 min | **--shard N/M, shard-aware CI matrix, test tagging, selective re-run strategy**                                               | Ch09, Ch25                            |
| 49     | [Feature Flag Testing](./03_Real_World_Scenarios/49_Feature_Flag_Testing.md)                                                                                                                   | 60 min | **LaunchDarkly, env-based overrides, fixture-driven flag injection, matrix coverage**                                         | Ch06, Ch28                            |
| 50     | [Email Service Testing](./03_Real_World_Scenarios/50_Email_Service_Testing.md)                                                                                                                 | 60 min | **Mailosaur, MailHog, inbox polling fixture, OTP flows, attachment assertions**                                               | Ch06, Ch14                            |
| 51     | [Secrets Management for SDETs](./06_CI_CD_And_Reliability/51_Secrets_Management_For_SDETs.md)                                                                                               | 45 min | **gitleaks, Doppler, HashiCorp Vault, GitHub Actions secrets, .env discipline**                                               | Ch25, Ch40                            |
| &nbsp; | **——— DEPTH TESTING ——— Component isolation, mutation score, synthetic monitoring**                                                                                                       |        |                                                                                                                               |                                       |
| 52     | [Component Testing with Playwright CT](./07_Specialised_Testing/52_Component_Testing_With_Playwright_CT.md)                                                                                   | 60 min | **@playwright/experimental-ct-react, mount(), props/events, CT vs E2E trade-offs**                                            | Ch05, Ch06, Ch39                      |
| 53     | [Mutation Testing with Stryker](./07_Specialised_Testing/53_Mutation_Testing_With_Stryker.md)                                                                                             | 60 min | **Stryker mutator, mutation score, surviving mutants, assertion quality**                                                     | Ch27                                  |
| 54     | [Synthetic Monitoring](./06_CI_CD_And_Reliability/54_Synthetic_Monitoring.md)                                                                                                                   | 45 min | **Checkly, cron-based Playwright monitors, alerting, SLA reporting**                                                          | Ch25, Ch48                            |
| &nbsp; | **——— DEBUGGING SURFACES ——— Inspector, Trace Viewer, UI Mode**                                                                                                                           |        |                                                                                                                               |                                       |
| 55     | [Inspector, Trace Viewer & UI Mode — Walk-Through](./01_Foundations/55_Inspector_TraceViewer_UIMode_Walkthrough.md)                                                                 | 30 min | **Step-through live, time-travel past runs, UI Mode watch loop — hands-on only**                                              | Ch26                                  |
| &nbsp; | **——— CONFIG, AUTH, FILE I/O, DOCKER, TOOL COMPARISON ——— Reader-requested fills**                                                                                                        |        |                                                                                                                               |                                       |
| 56     | [Playwright Config Deep-Dive](./01_Foundations/56_Playwright_Config_Deep_Dive.md)                                                                                                   | 75 min | **Every config field: projects, use-merging, reporters, timeouts, retries, trace, devices, globalSetup vs dependencies**      | Ch09, Ch26, Ch55                      |
| 57     | [Login Taxonomy — OAuth2 / OIDC / SAML / MFA / mTLS](./03_Real_World_Scenarios/57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md)                                                                  | 90 min | **5 production auth flows beyond storageState — OAuth2+PKCE, OIDC, SAML, TOTP, client certs; worker-scoped token caches**     | Ch06, Ch16                            |
| 58     | [File Uploads & Downloads](./03_Real_World_Scenarios/58_File_Uploads_Downloads.md)                                                                                                             | 60 min | **setInputFiles single/multi/buffer, drag-drop, download event race, CSV/XLSX/PDF assertion helpers**                         | Ch04, Ch07                            |
| 59     | [Docker for Playwright](./06_CI_CD_And_Reliability/59_Docker_For_Playwright.md)                                                                                                                 | 60 min | **mcr.microsoft.com/playwright base image, multi-stage builds, sharding via docker-compose, /dev/shm gotcha, CI integration** | Ch09, Ch25, Ch48                      |
| 60     | [Tool Comparison — Cypress / Selenium / WebdriverIO](./08_SDET_to_SDE_Bridge/60_Tool_Comparison_Cypress_Selenium_WDIO.md)                                                                 | 60 min | **Honest trade-offs, architecture, locator model, cross-domain, parallel, API testing, when to pick what — interview prep**   | Ch32, `23_Mobile_Dev_And_Testing/01`  |
| 61     | [Emulation & Environment Simulation — Devices, Clock, Network, Locale](./03_Real_World_Scenarios/61_Emulation_Clock_Network_And_Devices.md)                                                    | 75 min | **devices[] matrix, page.clock time travel, CDP throttling, offline, geolocation/permissions, locale/timezone, aria snapshots** | Ch26, Ch29, Ch49, Ch56                |
| 62     | [Enterprise Test Operations — Running Automation at Scale](./06_CI_CD_And_Reliability/62_Enterprise_Test_Operations.md)                                                                 | 105 min | **Environment tiers, ephemeral PR envs, test data as a service, flake SLA, SRE-derived error budgets & burn-rate escalation, CODEOWNERS federation, gate tiers, metrics that keep suites funded** | Ch25, Ch26, Ch28, Ch48                |
| &nbsp; | ↳ Ship it publicly: [`career/PORTFOLIO_PLAN.md`](./career/PORTFOLIO_PLAN.md) (4-tier plan: framework repo, capstone tool, OSS PR, writing) | 30 min | **Turning what you've learned into evidence a hiring manager can click on** | Ch62 |
| 63     | [Static Analysis — ESLint for TypeScript & Playwright](./05_Enterprise_Framework/63_Static_Analysis_ESLint_TypeScript_Playwright.md)                                                          | 60 min | **Type-aware linting mechanism, error/warn/off rule tiers, overrides per file glob, editor→pre-commit→CI enforcement layers** | Ch26, Ch36                            |
| 64     | [Dynamic Locators & Data Structures in POMs](./02_Test_Architecture/64_Dynamic_Locators_And_Data_Structures_In_POMs.md)                                                                     | 60 min | **hasText substring trap, XPath-injection-by-apostrophe, parse-then-compare pattern, Set for dedup, Map for O(1) UI-vs-API cross-reference** | Ch02, Ch34                            |
| 65     | [Chaos Engineering for Playwright — Fault Injection, Not Fixed Scenarios](./06_CI_CD_And_Reliability/65_Chaos_Engineering_For_Playwright.md)                                                    | 90 min | **Steady-state hypothesis harness, mid-flight network partition, chaos-proxy API degradation, simulated browser crash via CDP** | Ch08, Ch61, Ch26                      |
| 66     | [Senior SDET Decision-Making — Deriving the Reasoning, Not Just the Labels](./08_SDET_to_SDE_Bridge/66_Senior_SDET_Decision_Making.md)                                                    | 90 min | **Risk-based prioritization quadrant, automate/don't-automate inequality, a real ADR walked as a cost/benefit case study, the RFC template derived section-by-section** | Ch00, Ch62, career/                   |
| 67     | [Payment Gateway Testing — Hosted Fields, 3-D Secure, Idempotency, Webhooks & Money](./03_Real_World_Scenarios/67_Payment_Gateway_Testing.md) | 90 min | **Cross-origin card iframes via frameLocator, nested 3DS challenge, idempotency (assert charges not requests), webhook signature matrix verified against Stripe's SDK, minor-unit rounding** | Ch42, Ch57, Ch30 |
| 68     | [Consent Banners, Overlays & CAPTCHA](./03_Real_World_Scenarios/68_Consent_Overlays_And_CAPTCHA.md) | 60 min | **`page.addLocatorHandler` and its non-dismissing-handler trap, pre-seeded consent, GDPR no-tracking-before-consent tests, CAPTCHA test keys verified against live siteverify endpoints** | Ch26, Ch57, Ch16 |

**Bolded chapters** = Advanced content built on your real codebase.
**Ch33–36** = Read alongside the corresponding guide folder (DSA, OOP, TypeScript) for maximum cross-pollination.
**Ch37–41** = Industry-standard open-source tools (Lighthouse, k6, Pact, axe-core, OWASP ZAP, GraphQL).
**Ch42–44** = Real-world depth: the async waiting patterns, actual war stories, and the API library architecture that separates SDETs from senior SDEs.
**Ch45** = AI & MCP: the frontier of agentic test automation and what AI can (and cannot) replace.
**Ch46–51** = Enterprise tooling: BDD, Allure/ReportPortal, sharding, feature flags, email testing, secrets management.
**Ch52–54** = Depth testing: component isolation, mutation score, synthetic monitoring — the upper tier of SDET competency.
**Ch55** = Debugging surfaces: Inspector, Trace Viewer, UI Mode — hands-on only, no shortcuts.
**Ch56–60** = Reader-requested fills: config deep-dive (with companion theory catalog at Ch57), auth taxonomy beyond storageState, file I/O, Docker, and an honest tool comparison for interview prep.
**Staff/Principal extension:** the competencies below are real and already assessed in [`career/READINESS_RUBRIC.md`](./career/READINESS_RUBRIC.md) (12 competency areas, Junior→Principal bands), but not every one has a matching teaching chapter yet. Confirmed already covered: observability/OpenTelemetry ([`framework/utilities/api/TELEMETRY_README.md`](./framework/utilities/api/TELEMETRY_README.md) — real OTel spans + W3C traceparent propagation on `ApiCore`), test impact analysis (Ch48 §11, "Test Impact Analysis with madge"), **chaos engineering** ([Ch65](./06_CI_CD_And_Reliability/65_Chaos_Engineering_For_Playwright.md) — fault injection built on Ch08's CDP model and Ch61's network APIs, verified against Netflix's real Chaos Monkey origin and the 2017 Principles of Chaos Engineering), and **self-healing locators, mechanism-level** ([Ch45](./07_Specialised_Testing/45_AI_Agents_MCP_And_Playwright.md) §6.1 — a runtime fallback-and-similarity-scoring algorithm verified against Healenium's real documented approach, distinct from and complementary to the chapter's existing LLM-based offline healing script), **SLO/error-budget-driven testing** ([Ch62](./06_CI_CD_And_Reliability/62_Enterprise_Test_Operations.md) §3.3 — the real Google SRE error-budget and burn-rate formulas, verified by citation, applied to formalize the chapter's own pre-existing flake-rate target), and **senior decision-making itself** ([Ch66](./08_SDET_to_SDE_Bridge/66_Senior_SDET_Decision_Making.md) — risk-based prioritization, when not to automate, and a real ADR plus a real filled RFC walked as worked case studies, rather than just naming the competency). ADRs are covered too, as real worked examples: [`framework/docs/adrs/`](./framework/docs/adrs/README.md) (6 real Playwright-specific ADRs). Every gap this section originally opened with is now closed — see the Roadmap table below, which is why it's short.

> **Total estimated study time: ~175–210 hours** (60 core chapters + 10 Module II chapters x 60–90 min + quizzes)

---

> **Principal-level note:** Chapter 62 (Enterprise Test Operations), [Chapter 65](./06_CI_CD_And_Reliability/65_Chaos_Engineering_For_Playwright.md) (Chaos Engineering), [Chapter 45 §6.1](./07_Specialised_Testing/45_AI_Agents_MCP_And_Playwright.md) (self-healing locators, mechanism-level), [Chapter 66](./08_SDET_to_SDE_Bridge/66_Senior_SDET_Decision_Making.md) (senior decision-making), and the `career/` folder (READINESS_RUBRIC, RFC_TEMPLATE, TEST_STRATEGY_TEMPLATE, mock interviews) represent competencies expected at staff and principal SDET levels — platform ownership, cross-team leadership, and infrastructure resilience. They assume mastery of Chapters 01–48.

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
                       ↓
         career/TEST_STRATEGY_TEMPLATE.md ← you've now seen every layer
                                             this template asks you to plan for

Quiz 01 → after Chapters 01–16
Quiz 02 → after Chapters 01–18
Quiz 02 Solutions → after attempting Quiz 02 (self-check)

career/RFC_TEMPLATE.md + framework/docs/adrs/ → after Ch21 (Project Structure) — the ADRs are
  6 real, worked examples of exactly the kind of tradeoff Ch21 discusses; read them as case
  studies, then use RFC_TEMPLATE.md to write your own for a decision in your own codebase

career/READINESS_RUBRIC.md + career/mock_interviews/ → after Ch32 (interview prep) — self-assess
  where you actually are across 12 competencies (don't skip straight to Principal), then read
  the mock interviews to see senior-level thinking modeled in real dialogue, not just described

career/PORTFOLIO_PLAN.md → after Ch62 (Enterprise Test Operations) — turn what you've learned
  into public proof; the plan's own 6-month milestone table assumes you've reached about here

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
Ch65 (Chaos Engineering)   → after Ch08+Ch61 (CDP crash signature + network APIs to inject non-deterministically)
Ch66 (Senior Decision-Making) → after Ch00+Ch62+career/ (Testing Pyramid economics, flake SLA/error budget, RFC+ADR artifacts to derive from)
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
  page.context().waitForEvent("page"),
  page.click("#openButton"),
]);
```

### The D365 `menuitem` Fix

```typescript
// ❌ page.getByRole('button', { name: 'Edit' })
// ✅ page.getByRole('menuitem', { name: 'Edit' })
```

### The D365 Wait Pattern

```typescript
await expect(page.locator(".ms-Spinner")).toHaveCount(0, { timeout: 30000 });
await expect(fieldLocator).toHaveText("Expected Value", { timeout: 30000 });
```

### The Data Accumulator

```typescript
interface TestData {
  citationId: string | null; /* ... */
}
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
await expect
  .poll(async () => citationsClient.getById(id).then((c) => c.status), {
    message: "Citation never reached PAID",
    timeout: 120_000,
    intervals: [1000, 2000, 5000, 10000],
  })
  .toBe("PAID");

// 2. waitForResponse() — capture API call AT MOMENT of user action
const [response] = await Promise.all([
  page.waitForResponse(
    (r) => r.url().includes("/api/payments") && r.method() === "POST",
  ),
  page.click("#pay-now-btn"),
]);

// 3. throw inside expect.poll() to stop immediately on permanent failure
// if (status === 'FAILED') throw new Error('Job permanently failed');

// 4. Domain client helper:
const citation = await citationsClient.waitForStatus(id, "PAID", 120_000);

// Priority order:
// expect(locator).toHaveText() → expect.poll() → waitForResponse → waitForFunction → locator.waitFor()
// NEVER: waitForTimeout, for-loop, while-loop with sleep
```

### API Client Library Quick Reference (Ch44)

```typescript
// 5-layer hierarchy:
// request (Playwright) → ApiCore → HeadersBuilder → Endpoints → Domain Client

// Domain client usage (tests never see URLs or raw HTTP):
const citation = await citationsClient.create(
  PayloadsCitation.pending({ customerId }),
);
const payment = await citationsClient.pay(citationId, { amount: 150.99 });
await citationsClient.waitForStatus(citationId, "PAID");

// Typed errors — catch specific failure modes:
try {
  await citationsClient.pay(alreadyPaidId, { amount: 100 });
} catch (e) {
  if (e instanceof CitationAlreadyPaidError) {
    expect(e.status).toBe(409); // expected — test this case
  } else {
    throw e;
  } // unexpected — rethrow
}

// Schema validation with Zod — catches API contract drift:
// const citation = parseResponse(CitationSchema, rawBody, 'citations.create');
// → throws SchemaValidationError with field-level details if shape is wrong

// Header builder:
// HeadersCrm.auth(token, testId)  ← standard CRM headers
// HeadersBuilder.new().withBearer(token).withTenantId(id).build()
```

---

- **API Testing**: [`24_Advanced_API_Testing/`](../24_Advanced_API_Testing/00_INDEX.md) — REST, SOAP, APIUtils, DB testing, nested assertions (Ch07)
- **TypeScript**: [`17_TypeScript/`](../17_TypeScript/00_INDEX.md) — TS foundations and advanced types
- **Browser Internals**: [`16_JavaScript/09_Browser_Internals_Rendering.md`](../16_JavaScript/09_Browser_Internals_Rendering.md) — Deep rendering pipeline
- **React/SPA**: [`15_React_Frontend/`](../15_React_Frontend/00_INDEX.md) — React rendering lifecycle
- **SQL/DB**: [`08_SQL/`](../08_SQL/00_INDEX.md) — JOIN, CTE, transactions for DB testing
- **DevOps/CI**: [`22_DevOps/19_CICD_Pipelines.md`](../22_DevOps/19_CICD_Pipelines.md) — Running Playwright in GitHub Actions

---

## Roadmap — Not Yet Covered (Deliberately Deferred)

These are real gaps, verified empty by grepping the whole module before listing them here (this table previously listed two items — OpenTelemetry/APM and Test Impact Analysis — that were actually already written; that's now fixed below, and the lesson is: verify against the filesystem before trusting this table, including this update). Each remaining item is large enough to deserve its own session and is captured here so readers know what's deliberate vs. what's missing.

**Already covered, previously miscategorized as missing:**
- **OpenTelemetry / APM integration** — real, working: [`framework/utilities/api/TELEMETRY_README.md`](./framework/utilities/api/TELEMETRY_README.md) (OTel spans on `ApiCore`, W3C traceparent propagation, OTLP exporter config for Grafana Tempo/Jaeger)
- **Test impact analysis** — real, working: Ch48 §11, "Test Impact Analysis with madge"
- **Chaos engineering** — real, working: [Ch65](./06_CI_CD_And_Reliability/65_Chaos_Engineering_For_Playwright.md), "Chaos Engineering for Playwright" (mid-flight network partitions, chaos-proxy API degradation, and simulated browser crashes, all built on Ch08's CDP model and Ch61's network APIs; the browser/application layer only — Gremlin/Toxiproxy/Chaos Mesh remain the honest answer for infrastructure-level chaos, named as such in the chapter)
- **Property-based testing** — real, working: [Ch34](./08_SDET_to_SDE_Bridge/34_Algorithms_in_Test_Automation.md) §11 (the shrink-search algorithm derived from a real, executed `fast-check` counterexample against Section 2's pagination example, plus an async Playwright usage pattern)
- **Self-healing locators, mechanism-level** — real, working: [Ch45](./07_Specialised_Testing/45_AI_Agents_MCP_And_Playwright.md) §6.1 (a runtime fallback-and-similarity-scoring algorithm, verified against Healenium's real documented approach and demonstrated against an actual renamed-id scenario — distinct from and complementary to §6's pre-existing LLM-based offline healing script)
- **SLO / error-budget-driven testing** — real, working: [Ch62](./06_CI_CD_And_Reliability/62_Enterprise_Test_Operations.md) §3.3 (the real SLI/SLO/error-budget/burn-rate formulas from Google's SRE workbook, verified by citation, applied with an exactly-checked worked example to formalize §6's pre-existing "flake rate < 0.5%" target and add a burn-rate escalation trigger alongside §3.1's flat 10-day SLA)
- **Senior decision-making, derived rather than labeled** — real, working: [Ch66](./08_SDET_to_SDE_Bridge/66_Senior_SDET_Decision_Making.md) (a risk-based prioritization quadrant and an automate/don't-automate inequality, both derived from Ch00's own real Testing Pyramid exercise; a real ADR and a real filled RFC each walked as worked case studies rather than invented scenarios)

**Genuinely not yet written** (unrelated to the beginner→senior upgrade plan above — pre-existing, still-honest gaps):

| Topic                                                                                 | Why deferred                                                                                            | When to revisit                                                          |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Cloud device farms** (BrowserStack, Sauce Labs, AWS Device Farm)                    | Vendor-specific config; quickly stale                                                                   | On demand — when CI capacity becomes a bottleneck                        |
| **Mobile / Appium hands-on**                                                          | Cross-module concern; lives in `23_Mobile_Dev_And_Testing/`                                             | Expand that module instead                                               |
| **Screen-reader automation** (NVDA / JAWS)                                            | Beyond axe-core; requires OS-level tooling                                                              | Pair with Ch39 a11y when the team has a screen-reader user-research need |

If you need any of these urgently, open an issue or ping the maintainer — the absence is intentional but not permanent.
