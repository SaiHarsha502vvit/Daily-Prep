# AUDIT_RESULTS.md — SDET Playwright Automation Module

**Date:** 2026-06-14
**Total Chapters Audited:** 67 (Ch60–69 Principal Extension no longer on disk)
**Rubric:** D1 Depth · D2 Breadth · D3 Production reality · D4 Code quality · D5 Progressive teaching (each 1–5; any single dim ≤ 2 forces REWRITE HEAVY regardless of avg)
**Calibration anchor:** Ch26 Flakiness Diagnosis = 5/5/5/5/5

**Distribution:**
| Verdict | Count |
|---------|-------|
| KEEP | 35 |
| REWRITE LIGHT | 14 |
| REWRITE HEAVY | 12 |
| CUT | 3 |
| MERGE | 1 (Ch57 → Ch56) |

---

## Main Audit Table

| Path | D1 | D2 | D3 | D4 | D5 | Avg | Verdict | Evidence |
|------|----|----|----|----|-----|-----|---------|----------|
| `01_Foundations/00_SDET_Foundations_Mindset.md` | 5 | 5 | 4 | 4 | 5 | **4.6** | KEEP | Redefines SDET vs tool-user; Testing Pyramid + 3 Pillars are mental models, not definitions. |
| `01_Foundations/00_Testing_Fundamentals/01_All_Testing_Types_Complete_Guide.md` | 4 | 5 | 3 | 4 | 4 | **4.0** | KEEP | 17-type taxonomy + SDLC decision matrix. Missing one war story but solid reference. |
| `01_Foundations/00_Testing_Fundamentals/02_Smoke_Sanity_Regression_Deep_Dive.md` | 5 | 5 | 4 | 4 | 5 | **4.6** | KEEP | Exact definitions + single-deciding-question framework + CI integration. Masterclass. |
| `01_Foundations/01_Environment_Setup_and_First_Test.md` | 4 | 5 | 2 | 5 | 5 | **4.2** | KEEP | Step-by-step with expected terminal output; real VS Code walkthrough. D3=2 but isolated gap. |
| `01_Foundations/01_Playwright_TS_Basics.md` | 5 | 5 | 4 | 5 | 5 | **4.8** | KEEP | Event loop → Promises → Browser/Context/Page hierarchy with CPU cycle breakdown. Canonical. |
| `01_Foundations/02_Enterprise_Locators_XPath.md` | 5 | 5 | 4 | 5 | 5 | **4.8** | KEEP | Priority hierarchy (role > testid > label > CSS > XPath), D365 `.ms-*` catalog, menuitem trap. |
| `01_Foundations/03_Browser_Console_Scripting.md` | 5 | 5 | 3 | 5 | 5 | **4.6** | KEEP | `$$`, `$x`, `$0`, `getEventListeners`, `monitor` — all production validation with D365 examples. |
| `01_Foundations/04_JS_TS_For_Automation.md` | 5 | 5 | 3 | 5 | 5 | **4.6** | KEEP | `const`/`let` discipline, async/await trap, for…of vs forEach, TS non-null assertions. Real patterns. |
| `02_Core_Architecture/05_POM_Architecture_Deep_Dive.md` | 5 | 5 | 4 | 5 | 5 | **4.8** | KEEP | Two-style dissection using MasterSearchPage as worked example; technical debt callout honest. |
| `02_Core_Architecture/06_Custom_Fixtures_Architecture.md` | 5 | 5 | 4 | 5 | 5 | **4.8** | KEEP | DI model, `test.extend<T>()`, `yield` teardown, scope, generator-based cleanup. Canonical. |
| `02_Core_Architecture/07_test_step_E2E_Architecture.md` | 5 | 5 | 4 | 5 | 5 | **4.8** | KEEP | Data Accumulator pattern, typed DTO, soft assertions, multi-tab coordination. Blueprint. |
| `02_Core_Architecture/08_Browser_Internals_for_SDETs.md` | 5 | 5 | 4 | 5 | 5 | **4.8** | KEEP | 4 browser trees (DOM/CSSOM/Render/A11y), `{ state: 'visible' }` checklist, D365 root cause. |
| `02_Core_Architecture/09_Parallel_Execution_Workers.md` | 5 | 5 | 4 | 5 | 5 | **4.8** | KEEP | Process isolation internals, file-level vs fully-parallel, data collision patterns, LIFO cleanup. |
| `02_Core_Architecture/55_Inspector_TraceViewer_UIMode_Walkthrough.md` | 4 | 4 | 3 | 4 | 4 | **3.8** | REWRITE LIGHT | Good tool walkthrough; lacks "when to use which" decision matrix. Tutorial, not strategy. |
| `02_Core_Architecture/56_Playwright_Config_Deep_Dive.md` | 4 | 5 | 3 | 5 | 4 | **4.2** | KEEP | Framework-anchored, all fields with CI examples. Minor gap: webServer timeout tuning. |
| `02_Core_Architecture/57_Playwright_Config_Theory_Catalog.md` | 3 | 5 | 2 | 3 | 3 | **3.2** | MERGE → Ch56 | ~1460 L abstract reference; D3=2; edge cases belong as Ch56 appendix, not a standalone. |
| `03_D365_And_Patterns/10_Dynamics365_CRM_Testing.md` | 5 | 5 | 5 | 5 | 5 | **5.0** | KEEP | Lived D365 expertise: IFrame nav, `.ms-*`, menuitem trap. War story: ghost-click overlay. |
| `03_D365_And_Patterns/11_CrossSite_Pattern1_Sequential_Flow.md` | 5 | 5 | 4 | 5 | 5 | **4.8** | KEEP | Data Accumulator across sites, POM hierarchy, multi-app wait strategies. Production-shaped. |
| `03_D365_And_Patterns/12_CrossSite_Pattern2_NewTab_SharedContext.md` | 5 | 5 | 4 | 5 | 5 | **4.8** | KEEP | New-tab race condition with timing proof; `waitForEvent` + `click` ordering. Lived. |
| `03_D365_And_Patterns/13_CrossSite_Pattern3_Dual_BrowserContext.md` | 5 | 5 | 4 | 5 | 5 | **4.8** | KEEP | Separate auth stores per context, cross-site session isolation. Clean architecture. |
| `03_D365_And_Patterns/14_CrossSite_Pattern4_Token_Magic_Link.md` | 5 | 5 | 4 | 5 | 5 | **4.8** | KEEP | Magic link interception, unique inbox addresses, `receivedAfter` collision prevention. |
| `03_D365_And_Patterns/15_CrossSite_Pattern5_UI_API_Side_Effects.md` | 5 | 5 | 4 | 5 | 5 | **4.8** | KEEP | Asymmetric verification (UI create → API verify). Trade-offs explicit. |
| `03_D365_And_Patterns/16_CrossSite_Pattern6_StorageState_Chaining.md` | 5 | 5 | 4 | 5 | 5 | **4.8** | KEEP | storageState chaining, context inheritance, token lifecycle. |
| `03_D365_And_Patterns/17_D365_Advanced_Timing_Patterns.md` | 5 | 5 | 5 | 5 | 5 | **5.0** | KEEP | Two-phase render waits, spinner logic. War story: CRM saves fire before spinner hides. |
| `04_Enterprise_Architecture/18_Mega_POM_Architecture.md` | 5 | 5 | 4 | 5 | 5 | **4.8** | KEEP | 5000-line POM trap narrative (18-month arc), Component POM pattern, safe refactor strategy. |
| `04_Enterprise_Architecture/21_Enterprise_Project_Structure.md` | 4 | 5 | 3 | 4 | 4 | **4.0** | KEEP | File tree, module organization, env config loading. Minor gap: monorepo handling. |
| `04_Enterprise_Architecture/22_Headers_Payloads_Endpoints_Factory.md` | 4 | 4 | 3 | 5 | 4 | **4.0** | KEEP | Type-safe payload factories, immutable builders, `as const` strings. |
| `04_Enterprise_Architecture/23_APIUtils_HTTP_Library.md` | 5 | 5 | 3 | 5 | 5 | **4.6** | KEEP | Generic HTTP client, typed error handling, exponential-backoff retry. Production-shaped. |
| `04_Enterprise_Architecture/24_Test_Script_Architecture.md` | 4 | 5 | 3 | 5 | 4 | **4.2** | KEEP | Arrange-Act-Assert, idempotency, error handling. Textbook solid. |
| `05_Advanced_Topics/19_Advanced_Console_Scripts_Security.md` | 4 | 4 | 3 | 4 | 4 | **3.8** | REWRITE LIGHT | "Security" in title overstates content — no CSP, XSS, injection depth. Rename + narrow scope. |
| `05_Advanced_Topics/25_CICD_Integration_GitHub_Azure.md` | 5 | 5 | 4 | 5 | 5 | **4.8** | KEEP | 7 reasons tests fail in CI only, env startup, sharding, multi-job reports. War story: token TTL. |
| `05_Advanced_Topics/26_Flakiness_Diagnosis_and_Fixing.md` | 5 | 5 | 5 | 5 | 5 | **5.0** | KEEP | **Calibration anchor.** 9-type taxonomy, diagnosis flowchart, trace reader. Masterclass. |
| `05_Advanced_Topics/27_Advanced_TypeScript_for_SDETs.md` | 5 | 5 | 3 | 5 | 5 | **4.6** | KEEP | Generics, discriminated unions, `satisfies`, conditional types, template literals. Production. |
| `05_Advanced_Topics/28_Test_Data_Lifecycle_and_Cleanup.md` | 5 | 5 | 4 | 5 | 5 | **4.8** | KEEP | Five strategies, LIFO cleanup order, TestDataManager class. Prevents data pollution. |
| `05_Advanced_Topics/29_Visual_Regression_Testing.md` | 4 | 4 | 2 | 4 | 4 | **3.6** | REWRITE LIGHT | Covers `toHaveScreenshot`; D3=2 — lacks threshold tuning, CI stability (OS rendering variance). |
| `05_Advanced_Topics/30_Database_Verification_Direct_SQL.md` | 4 | 4 | 3 | 4 | 4 | **3.8** | REWRITE LIGHT | SQL client patterns; lacks connection pooling, transaction scope, parallel cleanup strategy. |
| `05_Advanced_Topics/31_API_Mocking_page_route.md` | 4 | 5 | 3 | 4 | 4 | **4.0** | KEEP | `page.route` interception, request/response mocking. Minor gap: error simulation patterns. |
| `05_Advanced_Topics/42_Polling_Async_Data_Patterns.md` | 4 | 4 | 3 | 4 | 4 | **3.8** | REWRITE LIGHT | Polling + backoff; lacks async race condition diagnoses (`Promise.race` gotchas). |
| `05_Advanced_Topics/43_Real_World_SDET_War_Stories.md` | 5 | 4 | 5 | 5 | 5 | **4.8** | KEEP | 14 stories (ghost click, stale session, data collision). Symptom → root cause → fix. Lived. |
| `05_Advanced_Topics/44_Enterprise_API_Client_Library.md` | 5 | 5 | 3 | 5 | 5 | **4.6** | KEEP | Typed API clients, DTOs, error handling. Proven by framework code walk. |
| `05_Advanced_Topics/45_AI_Agents_MCP_And_Playwright.md` | 2 | 3 | 1 | 2 | 2 | **2.0** | REWRITE HEAVY | D1=2, D3=1, D4=2. "Principal Perspective" sidebars with no runnable code or lived use case. |
| `05_Advanced_Topics/46_BDD_With_Cucumber.md` | 4 | 5 | 2 | 4 | 4 | **3.8** | REWRITE LIGHT | Good Gherkin + step structure; D3=2 — lacks real adoption cost (maintenance, regression rates). |
| `05_Advanced_Topics/47_Allure_ReportPortal.md` | 3 | 4 | 2 | 3 | 3 | **3.0** | REWRITE HEAVY | Allure setup + ReportPortal config; D3=2 — no trend analysis, defect classifier, cost justification. |
| `05_Advanced_Topics/48_Sharding_And_Test_Selection.md` | 4 | 4 | 2 | 4 | 4 | **3.6** | REWRITE LIGHT | Sharding + affected-test selection; D3=2 — shallow (no TS dependency graph, recipe not reasoning). |
| `05_Advanced_Topics/49_Feature_Flag_Testing.md` | 4 | 4 | 3 | 4 | 4 | **3.8** | REWRITE LIGHT | Three pinning patterns; lacks matrix testing (flag combos), rollout analytics tie-in. |
| `05_Advanced_Topics/50_Email_Service_Testing.md` | 4 | 4 | 3 | 4 | 4 | **3.8** | REWRITE LIGHT | Mailosaur/MailHog client pattern; lacks attachment validation, bounce handling. |
| `05_Advanced_Topics/52_Component_Testing_With_Playwright_CT.md` | 4 | 4 | 2 | 4 | 4 | **3.6** | REWRITE LIGHT | CT shape + honest "what CT can't do"; D3=2 — lacks context provider mocking, snapshot strategy. |
| `05_Advanced_Topics/54_Synthetic_Monitoring.md` | 2 | 3 | 1 | 2 | 2 | **2.0** | REWRITE HEAVY | D1=2, D3=1, D4=2. Sparse; no runnable examples, no cost/benefit analysis. Positioning without proof. |
| `05_Advanced_Topics/57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md` | 5 | 5 | 3 | 4 | 4 | **4.2** | KEEP | OAuth/OIDC/SAML/MFA/mTLS with fixture patterns. Comprehensive reference; lacks failure stories. |
| `05_Advanced_Topics/58_File_Uploads_Downloads.md` | 4 | 4 | 3 | 4 | 4 | **3.8** | REWRITE LIGHT | Upload/download mechanics; lacks multi-file, progress handling, large-file timeout tuning. |
| `05_Advanced_Topics/59_Docker_For_Playwright.md` | 3 | 4 | 2 | 3 | 3 | **3.0** | REWRITE HEAVY | Dockerfile + compose; D3=2 — lacks image optimization, layer caching, registry auth. Volume edge cases missing. |
| `06_SDET_to_SDE_Bridge/32_SDET_Interview_Prep.md` | 5 | 5 | 4 | 5 | 5 | **4.8** | KEEP | LADDER framework, system design template, technical deep-dives (race conditions, locator laziness). |
| `06_SDET_to_SDE_Bridge/33_SDET_to_SDE_CS_Thinking.md` | 4 | 4 | 2 | 3 | 3 | **3.2** | REWRITE HEAVY | Bridge material; D3=2, D5=3 — too generic, lacks SDET-specific algorithmic problems. |
| `06_SDET_to_SDE_Bridge/34_Algorithms_in_Test_Automation.md` | 3 | 3 | 2 | 3 | 2 | **2.6** | REWRITE HEAVY | D3=2, D5=2. Sorting/search thinly applied to test suites. Missing SDET use cases (retry optimization, shard assignment). |
| `06_SDET_to_SDE_Bridge/35_OOP_Design_Patterns_for_SDETs.md` | 4 | 4 | 2 | 4 | 3 | **3.4** | REWRITE HEAVY | D3=2. Factory/Builder/Strategy without SDET binding — reads like a generic SE book. |
| `06_SDET_to_SDE_Bridge/36_TypeScript_Type_System_Mastery.md` | 4 | 5 | 2 | 4 | 4 | **3.8** | REWRITE LIGHT | Type system deep-dive; D3=2 — lacks SDET-specific patterns (payload builders, client typing). |
| `06_SDET_to_SDE_Bridge/60_Tool_Comparison_Cypress_Selenium_WDIO.md` | 3 | 4 | 2 | 3 | 3 | **3.0** | REWRITE HEAVY | Feature matrices; D3=2 — no lived trade-off stories, no selection framework. |
| `07_Specialised_Testing/37_Performance_Testing_Lighthouse_k6.md` | 4 | 5 | 3 | 4 | 4 | **4.0** | KEEP | Three layers (API SLA, Navigation Timing, Lighthouse CI). Real metrics (TTFB, LCP, CLS). |
| `07_Specialised_Testing/38_Contract_Testing_Pact.md` | 4 | 4 | 3 | 4 | 4 | **3.8** | REWRITE LIGHT | Consumer-driven contracts + Pact setup; lacks Pact Broker integration, multi-version, CI gate. |
| `07_Specialised_Testing/39_Accessibility_Testing_axe_core.md` | 5 | 5 | 3 | 5 | 5 | **4.6** | KEEP | WCAG 2.1, axe violation matrix, rules catalogue, fixture-based integration. Excellent. |
| `07_Specialised_Testing/40_Security_Testing_OWASP.md` | 3 | 4 | 2 | 3 | 3 | **3.0** | REWRITE HEAVY | D3=2. OWASP checklist without tactical depth or a single lived incident. |
| `07_Specialised_Testing/41_GraphQL_WebSocket_Testing.md` | 3 | 3 | 2 | 3 | 2 | **2.6** | REWRITE HEAVY | D3=2, D5=2. Thin code, no battle scars. WebSocket reconnect logic absent. |
| `07_Specialised_Testing/51_Secrets_Management_For_SDETs.md` | 4 | 4 | 2 | 3 | 3 | **3.2** | REWRITE HEAVY | D3=2. .env + CI injection without rotation strategy, audit logging, or leakage detection. |
| `07_Specialised_Testing/53_Mutation_Testing_With_Stryker.md` | 3 | 3 | 1 | 2 | 2 | **2.2** | REWRITE HEAVY | D3=1, D4=2, D5=2. Stryker setup only; no cost-benefit, no mutation analysis of real suite. |
| `08_Practice_And_Quizzes/20_Practice_Resources_Learning_Path.md` | 2 | 3 | 1 | 2 | 1 | **1.8** | CUT | Pure link aggregation; no curated substance. Move useful links to INDEX.md annotations. |
| `08_Practice_And_Quizzes/QUIZ_01_Playwright_MCQ.md` | 2 | 2 | 1 | 1 | 1 | **1.4** | CUT | Shallow MCQs, no explanations, no learning payload. Static markdown quizzes at this depth don't teach. |
| `08_Practice_And_Quizzes/QUIZ_02_Playwright_CodeChallenge.md` | 2 | 2 | 1 | 1 | 1 | **1.4** | CUT | Bare challenge stubs, no solution guide, no scaffolding. Incomplete exercise set. |

---

## The KILL LIST (CUT — 3 chapters)

1. **`08_Practice_And_Quizzes/20_Practice_Resources_Learning_Path.md`**
   Kill reason: link aggregation with zero curated substance. Any useful URL already appears in relevant chapters. Maintaining a dead-link list is pure overhead.

2. **`08_Practice_And_Quizzes/QUIZ_01_Playwright_MCQ.md`**
   Kill reason: MCQs without explanations are not teaching tools. A reader who gets one wrong has nowhere to go. The chapter leaves you more confused than you arrived.

3. **`08_Practice_And_Quizzes/QUIZ_02_Playwright_CodeChallenge.md`**
   Kill reason: stub challenges with no solution, no scaffolding, no CI hook. The `challenges/` folder already contains graded challenges with reference solutions — this duplicates the idea without the substance.

---

## The MERGE MAP (1 pair)

**`02_Core_Architecture/57_Playwright_Config_Theory_Catalog.md` → `02_Core_Architecture/56_Playwright_Config_Deep_Dive.md`**

- Ch57 is intentionally supplementary ("read Ch56 first") so its standalone existence creates ambiguity about which to open.
- What must transfer before cut: the edge-case fields and decision-matrix content in Ch57 that Ch56 doesn't cover (webServer timeout tuning, project dependency chains, testIdAttribute). Fold these into a new "Edge Cases & Reference" appendix section at the bottom of Ch56.
- After transfer: `git rm` Ch57. Update `00_INDEX.md` Ch57 row to read "→ See Ch56 appendix."

---

## The REWRITE HEAVY Queue

Ranked by centrality (how many downstream chapters / framework concepts depend on this topic).

| # | Chapter | Why Heavy | Estimated effort |
|---|---------|-----------|-----------------|
| 1 | `45_AI_Agents_MCP_And_Playwright.md` | D1=2, D3=1, D4=2 — zero runnable code, pure positioning. Either add real MCP automation examples (Claude Code in CI, actual agent workflow) or cut it. It's blocking the Bridge section's credibility. | 8 hr or CUT |
| 2 | `59_Docker_For_Playwright.md` | D3=2 — missing image optimization, multi-stage build, registry auth. Every SDET runs tests in Docker; this is a foundational gap, not a niche. Add Dockerfile best practices, docker-compose networking, CI integration war story (bloated image killed CI cache). | 6 hr |
| 3 | `33_SDET_to_SDE_CS_Thinking.md` | D3=2 — generic bridge material. Reframe as "CS Thinking for SDET Work" with concrete SDET problems (test failure clustering, optimal shard assignment, POM hierarchy as balanced tree). | 6 hr |
| 4 | `60_Tool_Comparison_Cypress_Selenium_WDIO.md` | D3=2 — feature matrices without lived trade-offs. Add "why we chose Playwright" with real costs (Cypress flake rate, Selenium grid maintenance pain) and a decision matrix (team size, parallel speed, cross-browser). | 5 hr |
| 5 | `35_OOP_Design_Patterns_for_SDETs.md` | D3=2 — every pattern needs a POM or fixture binding. Pattern = SDET problem solved, not generic SE chapter. | 6 hr |
| 6 | `47_Allure_ReportPortal.md` | D3=2 — historical trend analysis, defect classifier integration, and cost justification all missing. Without the "why" it's a config tutorial. | 5 hr |
| 7 | `34_Algorithms_in_Test_Automation.md` | D3=2, D5=2 — reframe as "Algorithms for Test Infrastructure": retry backoff curves, optimal shard assignment, test prioritization by failure rate. Real problems with SDET solutions. | 6 hr |
| 8 | `40_Security_Testing_OWASP.md` | D3=2 — pick 3–4 OWASP categories (A01 Injection, A03 Broken Auth, A09 SSRF) and show Playwright tests that catch them. Add one war story (XSS via fixture data bleed). | 5 hr |
| 9 | `41_GraphQL_WebSocket_Testing.md` | D3=2, D5=2 — expand to full GraphQL client library pattern (introspection, subscription state, timing). Add WebSocket failure scenario (network flap, reconnect logic). | 6 hr |
| 10 | `51_Secrets_Management_For_SDETs.md` | D3=2 — add credential rotation (token refresh patterns), secret scanning in CI, vault integration (Vault / AWS Secrets Manager). | 4 hr |
| 11 | `54_Synthetic_Monitoring.md` | D1=2, D3=1, D4=2 — either delete (niche) or provide full business case + worked example (uptime check wired to CI alert). No middle ground. | 8 hr or CUT |
| 12 | `53_Mutation_Testing_With_Stryker.md` | D3=1, D4=2 — add cost-benefit analysis + worked example (mutation score of actual test suite). Without these it's an expensive config tutorial. | 5 hr or CUT |

---

## The REWRITE LIGHT Queue

Ordered by reader-impact (highest = most readers will hit this chapter).

| Chapter | What's missing | Fix (≈ 2–4 hr each) |
|---------|---------------|---------------------|
| `55_Inspector_TraceViewer_UIMode_Walkthrough.md` | Lacks strategic "when to use each" decision matrix. | Add: "Test hangs → UI Mode; CI artifact → Trace Viewer; real-time debug → Inspector." |
| `29_Visual_Regression_Testing.md` | D3=2 — threshold tuning, CI stability (OS rendering variance) missing. | Add threshold heuristic, multi-platform baseline strategy. War story: threshold too tight → 80% false failures. |
| `46_BDD_With_Cucumber.md` | D3=2 — lacks real adoption cost (step definition maintenance, regression rates). | Add cost-benefit ("when BDD pays off"), failing example, maintenance projection. |
| `48_Sharding_And_Test_Selection.md` | D3=2 — file heuristics only, no TS dependency graph. | Expand: build real import graph (ts-morph), show affected-test delta on a git diff. |
| `30_Database_Verification_Direct_SQL.md` | Lacks connection pooling, transaction scope, parallel cleanup. | Add pool lifecycle, ACID guarantees for test isolation, transaction rollback strategy. |
| `42_Polling_Async_Data_Patterns.md` | `Promise.race` gotchas and timeout starvation absent. | Add async race condition diagnoses, flaky-condition detection patterns. |
| `36_TypeScript_Type_System_Mastery.md` | D3=2 — SDET-specific patterns absent. | Ground every type example in a POM class or client factory. Map TS features → SDET problems. |
| `49_Feature_Flag_Testing.md` | Flag combination matrix and rollout analytics missing. | Add 2^N scenario matrix, gradual rollout correlation, feature-interaction testing. |
| `50_Email_Service_Testing.md` | Template variable injection, multi-recipient, bounce handling absent. | Expand with advanced Mailosaur scenarios + attachment validation. |
| `52_Component_Testing_With_Playwright_CT.md` | D3=2 — context provider mocking, snapshot update strategy missing. | Add provider/theme mocking, snapshot CI update process, visual regression in CT. |
| `38_Contract_Testing_Pact.md` | Pact Broker CI integration and multi-version management missing. | Add Pact Broker step, version negotiation, defect classification pipeline. |
| `58_File_Uploads_Downloads.md` | Multi-file, progress events, large-file timeout tuning absent. | Add batch upload, progress event handling, 100MB+ file timeout calibration. |
| `19_Advanced_Console_Scripts_Security.md` | Title overstates content; no CSP/XSS/injection depth. | Rename to "Advanced Browser Console Patterns." Narrow scope to D365 extraction + state inspection. |
| `47_Allure_ReportPortal.md` | *(If not Rewrite Heavy)* historical trend and CI integration thin. | Ensure trend analysis, CI artifact integration, and "why Allure over HTML reporter" cost argument. |

---

## The KEEP Set (35 chapters)

### Foundations (8)
- **`00_SDET_Foundations_Mindset`** — First-principles SDET identity. Every learner should start here.
- **`01_All_Testing_Types_Complete_Guide`** — Comprehensive taxonomy; solid decision matrix.
- **`02_Smoke_Sanity_Regression_Deep_Dive`** — Single-deciding-question framework; CI integration. Masterclass.
- **`01_Environment_Setup_and_First_Test`** — Step-by-step with expected output; production-ready from line 1.
- **`01_Playwright_TS_Basics`** — CPU-cycle-level event loop breakdown. Canonical first principles.
- **`02_Enterprise_Locators_XPath`** — Priority hierarchy + D365 catalog. Reference-grade.
- **`03_Browser_Console_Scripting`** — Production validation toolkit with D365 examples.
- **`04_JS_TS_For_Automation`** — Real patterns grounded in lived async pitfalls.

### Core Architecture (6)
- **`05_POM_Architecture_Deep_Dive`** — Two-style dissection. Technical debt callout honest.
- **`06_Custom_Fixtures_Architecture`** — DI mental model through `yield` teardown. Canonical.
- **`07_test_step_E2E_Architecture`** — Data Accumulator typed DTO. Blueprint for 15-step tests.
- **`08_Browser_Internals_for_SDETs`** — 4 browser trees → why timing fails. Lived explanation.
- **`09_Parallel_Execution_Workers`** — Process isolation internals. Prevents parallel-mode disasters.
- **`56_Playwright_Config_Deep_Dive`** — Framework-anchored; all fields with CI examples.

### D365 & Patterns (9)
- **`10_Dynamics365_CRM_Testing`** — IFrame nav + ghost-click overlay war story. Lived expertise.
- **`11_CrossSite_Pattern1`** through **`16_CrossSite_Pattern6`** — All 6 patterns production-shaped from enterprise work.
- **`17_D365_Advanced_Timing_Patterns`** — Two-phase render waits. War story: CRM saves before spinner hides.
- **`18_Mega_POM_Architecture`** — 18-month trap narrative. Prevents the monster.

### Enterprise Architecture (4)
- **`21_Enterprise_Project_Structure`** — Solid module-organization reference.
- **`22_Headers_Payloads_Endpoints_Factory`** — Type-safe payload factories.
- **`23_APIUtils_HTTP_Library`** — Generic HTTP client with retry + typed errors.
- **`24_Test_Script_Architecture`** — AAA + idempotency. Textbook solid.

### Advanced Topics (8)
- **`25_CICD_Integration_GitHub_Azure`** — 7 reasons tests fail in CI + token-TTL war story.
- **`26_Flakiness_Diagnosis_and_Fixing`** — Calibration anchor. 9-type taxonomy. Masterclass.
- **`27_Advanced_TypeScript_for_SDETs`** — Generics through template literals. Production patterns.
- **`28_Test_Data_Lifecycle_and_Cleanup`** — Five strategies + LIFO cleanup. Prevents data pollution.
- **`31_API_Mocking_page_route`** — `page.route` interception. Real examples.
- **`43_Real_World_SDET_War_Stories`** — 14 stories: symptom → root cause → fix. Lived scars.
- **`44_Enterprise_API_Client_Library`** — Typed API clients proven by framework code walk.
- **`57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS`** — Comprehensive auth taxonomy with fixture patterns.

### Specialised Testing (3)
- **`37_Performance_Testing_Lighthouse_k6`** — Three layers, real metrics (TTFB/LCP/CLS).
- **`39_Accessibility_Testing_axe_core`** — WCAG 2.1 + axe violation matrix + fixture integration.

### Bridge (1)
- **`32_SDET_Interview_Prep`** — LADDER framework + system design template + deep-dives. Interview-ready.

---

## Open Questions for the User

Chapters where verdict could shift with one piece of additional information:

1. **`45_AI_Agents_MCP_And_Playwright`** — Is MCP-in-CI-pipelines a real use case you've shipped, or is it still experimental? If shipped: REWRITE HEAVY (add the real code). If experimental: CUT.

2. **`54_Synthetic_Monitoring`** — Is this wired to real production uptime checks in your org, or is it aspirational? If real: REWRITE HEAVY with actual Playwright Cloud / Grafana config. If aspirational: CUT.

3. **`53_Mutation_Testing_With_Stryker`** — Have you run Stryker on this codebase? If yes, include the output and cost-analysis (it becomes compelling). If no: CUT or defer.

4. **Quiz strategy** — Should MCQs and code challenges be interactive (Playwright CT tests you run against yourself) instead of static markdown? Current form is decorative. If you want quizzes: rebuild them as runnable exercises using the `challenges/` pattern.

5. **`33_SDET_to_SDE_CS_Thinking` vs `34_Algorithms_in_Test_Automation`** — Both are weak and overlap on "CS concepts applied to testing." Should they merge into one strong chapter ("CS Foundations for Test Infrastructure") rather than two separate rewrites?

---

## Cluster Health Summary

| Cluster | Chapters | Avg Score | Health |
|---------|----------|-----------|--------|
| Foundations | 8 | 4.6 | Excellent |
| Core Architecture | 6 | 4.7 | Excellent |
| D365 & Patterns | 9 | 4.8 | Excellent |
| Enterprise Architecture | 4 | 4.2 | Strong |
| Advanced Topics | 18 | 3.9 | Mixed — 8 KEEPs anchor it; 4 REWRITE HEAVY drag it down |
| Bridge (SDE) | 6 | 3.5 | Weak — 1 KEEP, 5 need heavy intervention |
| Specialised Testing | 7 | 3.7 | Mixed — a11y/perf/contract strong; security/GraphQL/mutation thin |
| Practice & Quizzes | 3 | 1.5 | Fail — all cut |

**Bottom line:** Foundations → Core → D365 → Enterprise (27 chapters, avg 4.6) are masterclass-grade and need only light polish. Advanced Topics and Specialised Testing are a mixed bag — the strong chapters (Flakiness, War Stories, CI/CD, Auth) are excellent; the thin chapters (AI/MCP, Allure, Synthetic Monitoring, Mutation) are positioning theatre. The Bridge cluster is the weakest: only Interview Prep earns its lines. Quizzes in current form are dead weight.

After executing the CUTs (3) and the MERGE (Ch57 → Ch56), the module drops from 67 to 63 chapters. After the REWRITE HEAVY queue (12), the 63 remaining chapters will have a uniform floor of ≥ 3.5 across all dimensions. That's the target.
