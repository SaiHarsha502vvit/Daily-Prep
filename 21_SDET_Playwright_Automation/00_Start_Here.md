# SDET & Playwright Automation — Start Here

> **What's the difference between this and [00_INDEX.md](./00_INDEX.md)?**
> **Start_Here** = reading paths (you pick one based on your background). Use this on first day.
> **INDEX**     = chapter-by-chapter time/topic table + dependency map + quick-reference snippets. Use as ongoing reference.

> **New in this module (post-upgrade):**
> - [`framework/`](./framework/README.md) — runnable Playwright + TS scaffold proving the Seven Laws.
> - [`challenges/`](./challenges/README.md) — 7 graded challenges + 3 portfolio capstones.
> - [`career/`](./career/README.md) — progress tracker, interview bank, portfolio plan, résumé bullets, DevSecOps thread.
> - Chapters 46–55 — BDD, Allure/ReportPortal, sharding, feature flags, email testing, secrets, component testing, mutation testing, synthetics, Inspector/Trace/UI Mode.

This module is a **55-chapter** production-grade curriculum for working SDETs on Dynamics 365 CRM, JSP, and ASP.NET ASPX applications. It assumes you are already writing tests professionally and want to go deeper into enterprise Playwright architecture, TypeScript patterns, CI/CD, API client library design, performance/security/accessibility tooling, and the SDET→SDE skill bridge. It is **not** a beginner intro to programming or testing concepts — it builds on those foundations immediately.

---

## Prerequisites

Read these **before** starting this module:

| What | Where |
|---|---|
| JavaScript (async, promises, DOM, closures) | [`16_JavaScript/`](../16_JavaScript) |
| TypeScript (types, generics, interfaces) | [`17_TypeScript/`](../17_TypeScript) |
| Testing fundamentals (pyramid, smoke vs regression, test types) | [`21_SDET_Playwright_Automation/00_Testing_Fundamentals/`](./01_Foundations/00_Testing_Fundamentals) |
| Node.js + Playwright install | [`01_Environment_Setup_and_First_Test.md`](./01_Foundations/01_Environment_Setup_and_First_Test.md) |

---

## Environment Setup

If you haven't installed Node.js and Playwright yet, start with [`01_Environment_Setup_and_First_Test.md`](./01_Foundations/01_Environment_Setup_and_First_Test.md) before anything else.

---

## Reading Paths by Background

### I'm new to automation testing

> Get foundations first, then advance chapter-by-chapter.

1. [`01_Environment_Setup_and_First_Test.md`](./01_Foundations/01_Environment_Setup_and_First_Test.md)
2. [`00_SDET_Foundations_Mindset.md`](./01_Foundations/00_SDET_Foundations_Mindset.md)
3. [`00_Testing_Fundamentals/`](./01_Foundations/00_Testing_Fundamentals)
4. [`01_Playwright_TS_Basics.md`](./01_Foundations/01_Playwright_TS_Basics.md)
5. [`02_Enterprise_Locators_XPath.md`](./01_Foundations/02_Enterprise_Locators_XPath.md)
6. [`03_Browser_Console_Scripting.md`](./01_Foundations/03_Browser_Console_Scripting.md)
7. [`04_JS_TS_For_Automation.md`](./01_Foundations/04_JS_TS_For_Automation.md)
8. [`05_POM_Architecture_Deep_Dive.md`](./02_Core_Architecture/05_POM_Architecture_Deep_Dive.md)
9. [`06_Custom_Fixtures_Architecture.md`](./02_Core_Architecture/06_Custom_Fixtures_Architecture.md)
10. [`07_test_step_E2E_Architecture.md`](./02_Core_Architecture/07_test_step_E2E_Architecture.md)
11. [`08_Browser_Internals_for_SDETs.md`](./02_Core_Architecture/08_Browser_Internals_for_SDETs.md)
12. [`09_Parallel_Execution_Workers.md`](./02_Core_Architecture/09_Parallel_Execution_Workers.md)
13. [`20_Practice_Resources_Learning_Path.md`](./08_Practice_And_Quizzes/20_Practice_Resources_Learning_Path.md) ← do the 10-week challenge

---

### I know Playwright basics, new to my D365/enterprise job

> Skip fundamentals. Go straight into enterprise architecture and D365 patterns.

1. [`00_SDET_Foundations_Mindset.md`](./01_Foundations/00_SDET_Foundations_Mindset.md)
2. [`04_JS_TS_For_Automation.md`](./01_Foundations/04_JS_TS_For_Automation.md)
3. [`05_POM_Architecture_Deep_Dive.md`](./02_Core_Architecture/05_POM_Architecture_Deep_Dive.md)
4. [`06_Custom_Fixtures_Architecture.md`](./02_Core_Architecture/06_Custom_Fixtures_Architecture.md)
5. [`07_test_step_E2E_Architecture.md`](./02_Core_Architecture/07_test_step_E2E_Architecture.md)
6. [`08_Browser_Internals_for_SDETs.md`](./02_Core_Architecture/08_Browser_Internals_for_SDETs.md)
7. [`09_Parallel_Execution_Workers.md`](./02_Core_Architecture/09_Parallel_Execution_Workers.md)
8. [`10_Dynamics365_CRM_Testing.md`](./03_D365_And_Patterns/10_Dynamics365_CRM_Testing.md)
9. [`11_CrossSite_Pattern1_Sequential_Flow.md`](./03_D365_And_Patterns/11_CrossSite_Pattern1_Sequential_Flow.md)
10. [`16_CrossSite_Pattern6_StorageState_Chaining.md`](./03_D365_And_Patterns/16_CrossSite_Pattern6_StorageState_Chaining.md)
11. [`17_D365_Advanced_Timing_Patterns.md`](./03_D365_And_Patterns/17_D365_Advanced_Timing_Patterns.md)
12. [`18_Mega_POM_Architecture.md`](./04_Enterprise_Architecture/18_Mega_POM_Architecture.md)
13. [`21_Enterprise_Project_Structure.md`](./04_Enterprise_Architecture/21_Enterprise_Project_Structure.md) → [`22_Headers_Payloads_Endpoints_Factory.md`](./04_Enterprise_Architecture/22_Headers_Payloads_Endpoints_Factory.md) → [`23_APIUtils_HTTP_Library.md`](./04_Enterprise_Architecture/23_APIUtils_HTTP_Library.md) → [`24_Test_Script_Architecture.md`](./04_Enterprise_Architecture/24_Test_Script_Architecture.md)

---

### Preparing for SDET interview

> Anchor on fundamentals, interview prep, then technical depth for credibility.

1. [`00_SDET_Foundations_Mindset.md`](./01_Foundations/00_SDET_Foundations_Mindset.md)
2. [`32_SDET_Interview_Prep.md`](./06_SDET_to_SDE_Bridge/32_SDET_Interview_Prep.md)
3. [`33_SDET_to_SDE_CS_Thinking.md`](./06_SDET_to_SDE_Bridge/33_SDET_to_SDE_CS_Thinking.md) → [`34_Algorithms_in_Test_Automation.md`](./06_SDET_to_SDE_Bridge/34_Algorithms_in_Test_Automation.md) → [`35_OOP_Design_Patterns_for_SDETs.md`](./06_SDET_to_SDE_Bridge/35_OOP_Design_Patterns_for_SDETs.md) → [`36_TypeScript_Type_System_Mastery.md`](./06_SDET_to_SDE_Bridge/36_TypeScript_Type_System_Mastery.md)
4. [`07_test_step_E2E_Architecture.md`](./02_Core_Architecture/07_test_step_E2E_Architecture.md)
5. [`09_Parallel_Execution_Workers.md`](./02_Core_Architecture/09_Parallel_Execution_Workers.md)
6. [`25_CICD_Integration_GitHub_Azure.md`](./05_Advanced_Topics/25_CICD_Integration_GitHub_Azure.md)
7. [`26_Flakiness_Diagnosis_and_Fixing.md`](./05_Advanced_Topics/26_Flakiness_Diagnosis_and_Fixing.md)

---

### Senior SDET / architect

> Straight to enterprise architecture, production quality, and specialised tooling.

1. [`21_Enterprise_Project_Structure.md`](./04_Enterprise_Architecture/21_Enterprise_Project_Structure.md) → [`22_Headers_Payloads_Endpoints_Factory.md`](./04_Enterprise_Architecture/22_Headers_Payloads_Endpoints_Factory.md) → [`23_APIUtils_HTTP_Library.md`](./04_Enterprise_Architecture/23_APIUtils_HTTP_Library.md) → [`24_Test_Script_Architecture.md`](./04_Enterprise_Architecture/24_Test_Script_Architecture.md)
2. [`25_CICD_Integration_GitHub_Azure.md`](./05_Advanced_Topics/25_CICD_Integration_GitHub_Azure.md) → [`26_Flakiness_Diagnosis_and_Fixing.md`](./05_Advanced_Topics/26_Flakiness_Diagnosis_and_Fixing.md) → [`27_Advanced_TypeScript_for_SDETs.md`](./05_Advanced_Topics/27_Advanced_TypeScript_for_SDETs.md) → [`28_Test_Data_Lifecycle_and_Cleanup.md`](./05_Advanced_Topics/28_Test_Data_Lifecycle_and_Cleanup.md) → [`29_Visual_Regression_Testing.md`](./05_Advanced_Topics/29_Visual_Regression_Testing.md) → [`30_Database_Verification_Direct_SQL.md`](./05_Advanced_Topics/30_Database_Verification_Direct_SQL.md) → [`31_API_Mocking_page_route.md`](./05_Advanced_Topics/31_API_Mocking_page_route.md)
3. [`37_Performance_Testing_Lighthouse_k6.md`](./07_Specialised_Testing/37_Performance_Testing_Lighthouse_k6.md) → [`38_Contract_Testing_Pact.md`](./07_Specialised_Testing/38_Contract_Testing_Pact.md) → [`39_Accessibility_Testing_axe_core.md`](./07_Specialised_Testing/39_Accessibility_Testing_axe_core.md) → [`40_Security_Testing_OWASP.md`](./07_Specialised_Testing/40_Security_Testing_OWASP.md) → [`41_GraphQL_WebSocket_Testing.md`](./07_Specialised_Testing/41_GraphQL_WebSocket_Testing.md)
4. [`42_Polling_Async_Data_Patterns.md`](./05_Advanced_Topics/42_Polling_Async_Data_Patterns.md) → [`43_Real_World_SDET_War_Stories.md`](./05_Advanced_Topics/43_Real_World_SDET_War_Stories.md) → [`44_Enterprise_API_Client_Library.md`](./05_Advanced_Topics/44_Enterprise_API_Client_Library.md)
5. [`45_AI_Agents_MCP_And_Playwright.md`](./05_Advanced_Topics/45_AI_Agents_MCP_And_Playwright.md)
6. [`46_BDD_With_Cucumber.md`](./05_Advanced_Topics/46_BDD_With_Cucumber.md) → [`47_Allure_ReportPortal.md`](./05_Advanced_Topics/47_Allure_ReportPortal.md) → [`48_Sharding_And_Test_Selection.md`](./05_Advanced_Topics/48_Sharding_And_Test_Selection.md) → [`49_Feature_Flag_Testing.md`](./05_Advanced_Topics/49_Feature_Flag_Testing.md) → [`50_Email_Service_Testing.md`](./05_Advanced_Topics/50_Email_Service_Testing.md) → [`51_Secrets_Management_For_SDETs.md`](./07_Specialised_Testing/51_Secrets_Management_For_SDETs.md) → [`52_Component_Testing_With_Playwright_CT.md`](./05_Advanced_Topics/52_Component_Testing_With_Playwright_CT.md) → [`53_Mutation_Testing_With_Stryker.md`](./07_Specialised_Testing/53_Mutation_Testing_With_Stryker.md) → [`54_Synthetic_Monitoring.md`](./05_Advanced_Topics/54_Synthetic_Monitoring.md) → [`55_Inspector_TraceViewer_UIMode_Walkthrough.md`](./02_Core_Architecture/55_Inspector_TraceViewer_UIMode_Walkthrough.md)

---

## File Map by Theme

| # | File | What it teaches |
|---|---|---|
| — | [00_Start_Here.md](./00_Start_Here.md) | Navigation only — reading paths, prereqs, cross-links (this file) |
| — | [00_INDEX.md](./00_INDEX.md) | Full chapter index with time estimates, dependency map, quick-reference snippets |
| — | [00_Testing_Fundamentals/](./01_Foundations/00_Testing_Fundamentals) | Testing pyramid, all 14 test types, smoke vs sanity vs regression deep-dive |
| — | [01_Environment_Setup_and_First_Test.md](./01_Foundations/01_Environment_Setup_and_First_Test.md) | Node.js, Playwright install, first test run, config baseline |
| — | [framework/](./framework/README.md) | Runnable Playwright + TS scaffold: Seven Laws, POM, fixtures, account pool |
| — | [challenges/](./challenges/README.md) | 7 graded challenges (CH01–CH07) + 3 portfolio capstones (C1–C3) |
| — | [career/](./career/README.md) | Progress tracker, interview bank, portfolio plan, résumé bullets, DevSecOps thread |
| 00 | [00_SDET_Foundations_Mindset.md](./01_Foundations/00_SDET_Foundations_Mindset.md) | SDET role, testing pyramid, 3 pillars, professional vocabulary |
| 01 | [01_Playwright_TS_Basics.md](./01_Foundations/01_Playwright_TS_Basics.md) | Project setup, first test, config, locators intro |
| 02 | [02_Enterprise_Locators_XPath.md](./01_Foundations/02_Enterprise_Locators_XPath.md) | CSS, XPath, getByRole, getByText, locator chaining |
| 03 | [03_Browser_Console_Scripting.md](./01_Foundations/03_Browser_Console_Scripting.md) | DevTools console, DOM scripts, XPath in console |
| 04 | [04_JS_TS_For_Automation.md](./01_Foundations/04_JS_TS_For_Automation.md) | async/await, Promise.all, TypeScript types, ES6 for tests |
| 05 | [05_POM_Architecture_Deep_Dive.md](./02_Core_Architecture/05_POM_Architecture_Deep_Dive.md) | MasterSearchPage dissected, lazy eval, typed dicts |
| 06 | [06_Custom_Fixtures_Architecture.md](./02_Core_Architecture/06_Custom_Fixtures_Architecture.md) | test.extend, scope:worker, yield teardown, account fixture |
| 07 | [07_test_step_E2E_Architecture.md](./02_Core_Architecture/07_test_step_E2E_Architecture.md) | 15-step skeleton, Data Accumulator, cross-tab Promise.all |
| 08 | [08_Browser_Internals_for_SDETs.md](./02_Core_Architecture/08_Browser_Internals_for_SDETs.md) | 4 browser trees, D365 two-phase render, SPA vs JSP waits |
| 09 | [09_Parallel_Execution_Workers.md](./02_Core_Architecture/09_Parallel_Execution_Workers.md) | Worker model, fullyParallel, data collision prevention |
| 10 | [10_Dynamics365_CRM_Testing.md](./03_D365_And_Patterns/10_Dynamics365_CRM_Testing.md) | IFrames, .ms-* classes, menuitem trap, data-automation-key |
| 11 | [11_CrossSite_Pattern1_Sequential_Flow.md](./03_D365_And_Patterns/11_CrossSite_Pattern1_Sequential_Flow.md) | Data Accumulator across sites, mixed D365/JSP waits, API cross-validation |
| 12 | [12_CrossSite_Pattern2_NewTab_SharedContext.md](./03_D365_And_Patterns/12_CrossSite_Pattern2_NewTab_SharedContext.md) | Promise.all race condition, OrderTrackingPage POM, tab cleanup |
| 13 | [13_CrossSite_Pattern3_Dual_BrowserContext.md](./03_D365_And_Patterns/13_CrossSite_Pattern3_Dual_BrowserContext.md) | Admin+Customer simultaneous sessions, try/finally cleanup |
| 14 | [14_CrossSite_Pattern4_Token_Magic_Link.md](./03_D365_And_Patterns/14_CrossSite_Pattern4_Token_Magic_Link.md) | Email interception, OAuth redirect, token expiry/reuse testing |
| 15 | [15_CrossSite_Pattern5_UI_API_Side_Effects.md](./03_D365_And_Patterns/15_CrossSite_Pattern5_UI_API_Side_Effects.md) | Success theatre anti-pattern, notification verification, expect.poll |
| 16 | [16_CrossSite_Pattern6_StorageState_Chaining.md](./03_D365_And_Patterns/16_CrossSite_Pattern6_StorageState_Chaining.md) | globalSetup, per-role auth states, cross-domain SSO, token refresh fixture |
| 17 | [17_D365_Advanced_Timing_Patterns.md](./03_D365_And_Patterns/17_D365_Advanced_Timing_Patterns.md) | 7 failure modes, diagnostic flowchart, wait strategy table |
| 18 | [18_Mega_POM_Architecture.md](./04_Enterprise_Architecture/18_Mega_POM_Architecture.md) | Component POM pattern, Locator Dictionary, 7-step refactoring strategy |
| 19 | [19_Advanced_Console_Scripts_Security.md](./05_Advanced_Topics/19_Advanced_Console_Scripts_Security.md) | 12 runnable scripts, cookie audit, headers, auth enforcement, IDOR, XSS |
| 20 | [20_Practice_Resources_Learning_Path.md](./08_Practice_And_Quizzes/20_Practice_Resources_Learning_Path.md) | D365 trial, OrangeHRM, JSONPlaceholder, 10-week challenge map |
| 21 | [21_Enterprise_Project_Structure.md](./04_Enterprise_Architecture/21_Enterprise_Project_Structure.md) | Folder justification, enums, endpoints, headers, payload factories, clients |
| 22 | [22_Headers_Payloads_Endpoints_Factory.md](./04_Enterprise_Architecture/22_Headers_Payloads_Endpoints_Factory.md) | Static factories, override pattern, call chain traced end-to-end |
| 23 | [23_APIUtils_HTTP_Library.md](./04_Enterprise_Architecture/23_APIUtils_HTTP_Library.md) | Generic wrapper, composition vs inheritance, fixture injection chain |
| 24 | [24_Test_Script_Architecture.md](./04_Enterprise_Architecture/24_Test_Script_Architecture.md) | Why POMs at top, data accumulator vs let, step naming, no data in specs |
| 25 | [25_CICD_Integration_GitHub_Azure.md](./05_Advanced_Topics/25_CICD_Integration_GitHub_Azure.md) | Workflow YAML, sharding, secrets, HTML reports, env check script |
| 26 | [26_Flakiness_Diagnosis_and_Fixing.md](./05_Advanced_Topics/26_Flakiness_Diagnosis_and_Fixing.md) | 9 flakiness types, trace viewer guide, quarantine pattern, flakiness metrics |
| 27 | [27_Advanced_TypeScript_for_SDETs.md](./05_Advanced_Topics/27_Advanced_TypeScript_for_SDETs.md) | Generics, discriminated unions, template literal types, mapped types, satisfies |
| 28 | [28_Test_Data_Lifecycle_and_Cleanup.md](./05_Advanced_Topics/28_Test_Data_Lifecycle_and_Cleanup.md) | 5 seeding strategies, TestDataManager, try/finally teardown, orphan sweeper |
| 29 | [29_Visual_Regression_Testing.md](./05_Advanced_Topics/29_Visual_Regression_Testing.md) | Pixel comparison, masking dynamic content, D365 pitfalls, baseline workflow |
| 30 | [30_Database_Verification_Direct_SQL.md](./05_Advanced_Topics/30_Database_Verification_Direct_SQL.md) | PostgreSQL/SQL Server client, 3-layer verify, audit log assertions, DB fixture |
| 31 | [31_API_Mocking_page_route.md](./05_Advanced_Topics/31_API_Mocking_page_route.md) | Error states, empty states, timeout simulation, HAR replay, when NOT to mock |
| 32 | [32_SDET_Interview_Prep.md](./06_SDET_to_SDE_Bridge/32_SDET_Interview_Prep.md) | LADDER framework, deep-dives, STAR answers, live coding challenges, ask-backs |
| 33 | [33_SDET_to_SDE_CS_Thinking.md](./06_SDET_to_SDE_Bridge/33_SDET_to_SDE_CS_Thinking.md) | HashMap in TestDataManager, Stack cleanup order, DOM as tree, GoF patterns map |
| 34 | [34_Algorithms_in_Test_Automation.md](./06_SDET_to_SDE_Bridge/34_Algorithms_in_Test_Automation.md) | Sliding window pagination, two-pointer dual context, binary search, greedy scheduling |
| 35 | [35_OOP_Design_Patterns_for_SDETs.md](./06_SDET_to_SDE_Bridge/35_OOP_Design_Patterns_for_SDETs.md) | SOLID in POM, Factory, Observer, Strategy, Template Method, Proxy, Composite |
| 36 | [36_TypeScript_Type_System_Mastery.md](./06_SDET_to_SDE_Bridge/36_TypeScript_Type_System_Mastery.md) | Impossible states, generic constraints, conditional types, mapped types, infer, satisfies |
| 37 | [37_Performance_Testing_Lighthouse_k6.md](./07_Specialised_Testing/37_Performance_Testing_Lighthouse_k6.md) | Navigation Timing API, web-vitals, LHCI config, k6 load test, perf budget |
| 38 | [38_Contract_Testing_Pact.md](./07_Specialised_Testing/38_Contract_Testing_Pact.md) | Consumer pacts, provider verification, Pact Broker, can-i-deploy, CI workflow |
| 39 | [39_Accessibility_Testing_axe_core.md](./07_Specialised_Testing/39_Accessibility_Testing_axe_core.md) | POUR principles, axe fixture, keyboard nav, colour contrast, A11y debt tracking |
| 40 | [40_Security_Testing_OWASP.md](./07_Specialised_Testing/40_Security_Testing_OWASP.md) | OWASP Top 10, auth enforcement, IDOR tests, injection payloads, ZAP CI scan |
| 41 | [41_GraphQL_WebSocket_Testing.md](./07_Specialised_Testing/41_GraphQL_WebSocket_Testing.md) | GQL always-200 errors, typed client, cursor pagination, WS capture, Faker.js |
| Q1 | [QUIZ_01_Playwright_MCQ.md](./08_Practice_And_Quizzes/QUIZ_01_Playwright_MCQ.md) | Self-test: 25 MCQ covering Ch01–16 fundamentals |
| Q2 | [QUIZ_02_Playwright_CodeChallenge.md](./08_Practice_And_Quizzes/QUIZ_02_Playwright_CodeChallenge.md) | 15 code challenges: spot the bug, explain this, write it yourself |
| 42 | [42_Polling_Async_Data_Patterns.md](./05_Advanced_Topics/42_Polling_Async_Data_Patterns.md) | expect.poll(), waitForResponse, pollUntil() utility, anti-pattern hall of shame |
| 43 | [43_Real_World_SDET_War_Stories.md](./05_Advanced_Topics/43_Real_World_SDET_War_Stories.md) | 14 real problems: ghost click, stale session, silent 200, parallel collision, frame trap |
| 44 | [44_Enterprise_API_Client_Library.md](./05_Advanced_Topics/44_Enterprise_API_Client_Library.md) | 5-layer architecture, typed domain clients, Zod validation, retry middleware, error hierarchy |
| 45 | [45_AI_Agents_MCP_And_Playwright.md](./05_Advanced_Topics/45_AI_Agents_MCP_And_Playwright.md) | MCP protocol, Playwright MCP server, AI scaffolding, Copilot integration |
| 46 | [46_BDD_With_Cucumber.md](./05_Advanced_Topics/46_BDD_With_Cucumber.md) | BDD with Cucumber-js, Gherkin scenarios, step definitions, Playwright hooks |
| 47 | [47_Allure_ReportPortal.md](./05_Advanced_Topics/47_Allure_ReportPortal.md) | Allure 2 annotations, custom steps, screenshots, ReportPortal CI integration |
| 48 | [48_Sharding_And_Test_Selection.md](./05_Advanced_Topics/48_Sharding_And_Test_Selection.md) | --shard N/M, shard-aware CI matrix, test tagging, selective re-run strategy |
| 49 | [49_Feature_Flag_Testing.md](./05_Advanced_Topics/49_Feature_Flag_Testing.md) | LaunchDarkly, env-based overrides, fixture-driven flag injection, matrix coverage |
| 50 | [50_Email_Service_Testing.md](./05_Advanced_Topics/50_Email_Service_Testing.md) | Mailosaur, MailHog, inbox polling fixture, OTP flows, attachment assertions |
| 51 | [51_Secrets_Management_For_SDETs.md](./07_Specialised_Testing/51_Secrets_Management_For_SDETs.md) | gitleaks, Doppler, HashiCorp Vault, GitHub Actions secrets, .env discipline |
| 52 | [52_Component_Testing_With_Playwright_CT.md](./05_Advanced_Topics/52_Component_Testing_With_Playwright_CT.md) | @playwright/experimental-ct-react, mount(), props/events, CT vs E2E trade-offs |
| 53 | [53_Mutation_Testing_With_Stryker.md](./07_Specialised_Testing/53_Mutation_Testing_With_Stryker.md) | Stryker mutator, mutation score, surviving mutants, assertion quality |
| 54 | [54_Synthetic_Monitoring.md](./05_Advanced_Topics/54_Synthetic_Monitoring.md) | Checkly, cron-based Playwright monitors, alerting, SLA reporting |
| 55 | [55_Inspector_TraceViewer_UIMode_Walkthrough.md](./02_Core_Architecture/55_Inspector_TraceViewer_UIMode_Walkthrough.md) | Inspector step-through, Trace Viewer time-travel, UI Mode watch loop |

---

## Cross-Module Links

| Topic | Where |
|---|---|
| API Testing (REST, SOAP, APIUtils, DB assertions) | [`22_Advanced_API_Testing/00_INDEX.md`](../22_Advanced_API_Testing/00_INDEX.md) |
| TypeScript foundations and advanced types | [`17_TypeScript/00_INDEX.md`](../17_TypeScript/00_INDEX.md) |
| DevOps / CI-CD pipelines | [`22_DevOps/19_CICD_Pipelines.md`](../22_DevOps/19_CICD_Pipelines.md) |
| SQL / Database (JOINs, CTEs, transactions for DB testing) | [`08_SQL/00_INDEX.md`](../08_SQL/00_INDEX.md) |
| DSA / Algorithms (for SDET→SDE bridge, Ch33–34) | [`03_Algorithms/00_INDEX.md`](../03_Algorithms/00_INDEX.md) |
