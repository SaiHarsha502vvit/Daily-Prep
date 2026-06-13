# Pathway 03 — Office lookup

For when something is broken, due tomorrow, or you need an answer in the next 15 minutes. **Not** a curriculum — a problem index.

Each entry follows the same shape:

```
### "Problem statement"
→ Primary chapter (start here)
→ Secondary chapter (deepen)
→ Framework code (reference impl)
→ Anti-pattern to avoid (if applicable)
```

For the fastest answers, [`reference/`](./reference/) has 10 cheat-sheet cards that complement this file.

> **Index format:** problems are alphabetized within a section. Use Ctrl/Cmd-F to find a phrase.

---

## Test reliability & flakiness

### "My test is flaky"
→ Ch26 [Flakiness Diagnosis and Fixing](./05_Advanced_Topics/26_Flakiness_Diagnosis_and_Fixing.md) — the 9 flake types and how to identify which one you have
→ Ch55 [Inspector, Trace Viewer & UI Mode](./02_Core_Architecture/55_Inspector_TraceViewer_UIMode_Walkthrough.md) — use the trace to see exactly what happened
→ [`framework/utilities/analytics/cli.ts`](./framework/utilities/analytics/cli.ts) — `npm run flake:report --since 7d` to rank flakies
→ [`framework/tests/broken/`](./framework/tests/broken/) — 10 reference anti-patterns to compare against

### "My test passes locally but fails in CI"
→ Ch26 [Flakiness](./05_Advanced_Topics/26_Flakiness_Diagnosis_and_Fixing.md) — the environment-vs-network section
→ Ch59 [Docker for Playwright](./05_Advanced_Topics/59_Docker_For_Playwright.md) — reproduce CI locally with `docker compose run`
→ Ch25 [CI/CD Integration](./05_Advanced_Topics/25_CICD_Integration_GitHub_Azure.md) — env-var mismatch checklist
→ Anti-pattern: assuming `localhost` works in CI — use `.env.ci` for explicit CI config

### "A test hangs / times out"
→ Ch26 [Flakiness](./05_Advanced_Topics/26_Flakiness_Diagnosis_and_Fixing.md) — the timing & race section
→ Ch46.5 [Playwright Config Deep-Dive](./05_Advanced_Topics/46_5_Playwright_Config_Deep_Dive.md) — timeout hierarchy (test / expect / action / navigation)
→ [`framework/constants/timeouts.ts`](./framework/constants/timeouts.ts) — named timeout enum to replace magic numbers
→ Anti-pattern: `await page.waitForTimeout(N)` — use `expect.poll`, `waitForResponse`, or `waitFor({state:'visible'})` instead

### "Tests pass individually but fail when run together"
→ Ch09 [Parallel Execution & Workers](./02_Core_Architecture/09_Parallel_Execution_Workers.md) — worker isolation rules
→ Ch28 [Test Data Lifecycle and Cleanup](./05_Advanced_Topics/28_Test_Data_Lifecycle_and_Cleanup.md) — find data pollution
→ Anti-pattern: module-level `let sharedId` — see [`tests/broken/03-module-level-state.spec.ts`](./framework/tests/broken/)

---

## Authentication

### "I need to reuse a login across many tests (storageState)"
→ Ch16 [Cross-site Pattern 6 — storageState chaining](./03_D365_And_Patterns/16_CrossSite_Pattern6_StorageState_Chaining.md)
→ Ch46.5 [Config Deep-Dive](./05_Advanced_Topics/46_5_Playwright_Config_Deep_Dive.md) — `globalSetup` vs `dependencies: [setup]`
→ [`framework/fixtures/auth.fixture.ts`](./framework/fixtures/auth.fixture.ts) — file-locked account pool (better than naive storageState for multi-role suites)
→ Anti-pattern: writing `storageState` before login completes — see [`tests/broken/06-storageState-too-early.spec.ts`](./framework/tests/broken/)

### "I need to test an OAuth 2.0 login"
→ Ch57 [Auth Taxonomy — OAuth, OIDC, SAML, MFA, mTLS](./05_Advanced_Topics/57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md)
→ [`framework/fixtures/auth.oauth.fixture.ts`](./framework/fixtures/auth.oauth.fixture.ts) — worker-scoped client-credentials token fetch
→ [`framework/tests/auth-demo/oauth.api.spec.ts`](./framework/tests/auth-demo/oauth.api.spec.ts) — runnable example

### "I need to test SAML / SSO"
→ Ch57 [Auth Taxonomy](./05_Advanced_Topics/57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md) — SAML section with IdP-initiated and SP-initiated flows

### "I need to test MFA / TOTP"
→ Ch57 [Auth Taxonomy](./05_Advanced_Topics/57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md) — TOTP section
→ [`framework/utilities/auth/totp.helper.ts`](./framework/utilities/auth/totp.helper.ts) — time-based code generation via `otplib`

### "I need multiple user roles in the same test run"
→ Ch16 [StorageState Chaining](./03_D365_And_Patterns/16_CrossSite_Pattern6_StorageState_Chaining.md)
→ [`framework/fixtures/auth.fixture.ts`](./framework/fixtures/auth.fixture.ts) — pooled accounts via worker-index round-robin

---

## API testing

### "I need to test a REST API endpoint"
→ Ch23 [APIUtils HTTP Library](./04_Enterprise_Architecture/23_APIUtils_HTTP_Library.md)
→ Ch44 [Enterprise API Client Library](./05_Advanced_Topics/44_Enterprise_API_Client_Library.md) — 5-layer architecture explained
→ [`framework/clients/UsersClient.ts`](./framework/clients/UsersClient.ts) — typed client with response validation

### "I need to mock an API response in a UI test"
→ Ch31 [API Mocking](./05_Advanced_Topics/31_API_Mocking_page_route.md) — `page.route()`, fulfill, abort, HAR replay
→ Anti-pattern: mocking APIs in integration tests — use real APIs in integration; mock only in unit/contract tests

### "I need to verify a UI action by checking the backend"
→ Ch15 [Cross-site Pattern 5 — UI-API side effects](./03_D365_And_Patterns/15_CrossSite_Pattern5_UI_API_Side_Effects.md) — beware of "success theatre"
→ [`framework/clients/UsersClient.ts`](./framework/clients/UsersClient.ts) — typed client to call after UI action

### "I need to test pagination / cursor-based APIs"
→ Ch41 [GraphQL & WebSocket Testing](./07_Specialised_Testing/41_GraphQL_WebSocket_Testing.md) — cursor pagination patterns
→ Ch44 [Enterprise API Client](./05_Advanced_Topics/44_Enterprise_API_Client_Library.md)

### "I need to test a rate-limited endpoint"
→ Ch26 [Flakiness](./05_Advanced_Topics/26_Flakiness_Diagnosis_and_Fixing.md) — retry-with-backoff section
→ [`framework/utilities/api/ApiCore.ts`](./framework/utilities/api/ApiCore.ts) — built-in exponential backoff with jitter
→ [`framework/tests/api/retry.api.spec.ts`](./framework/tests/api/retry.api.spec.ts) — runnable retry assertion

### "I need to test GraphQL"
→ Ch41 [GraphQL & WebSocket Testing](./07_Specialised_Testing/41_GraphQL_WebSocket_Testing.md) — typed client, the always-200 trap, cursor pagination

### "I need to test contract conformance (Pact)"
→ Ch38 [Contract Testing — Pact](./07_Specialised_Testing/38_Contract_Testing_Pact.md) — consumer pacts, provider verification, `can-i-deploy`

---

## Test data

### "I need to seed test data"
→ Ch28 [Test Data Lifecycle and Cleanup](./05_Advanced_Topics/28_Test_Data_Lifecycle_and_Cleanup.md) — 5 seeding strategies
→ [`framework/utilities/data/employee.factory.ts`](./framework/utilities/data/employee.factory.ts) — factory pattern

### "My tests leak data between runs"
→ Ch28 [Test Data Lifecycle](./05_Advanced_Topics/28_Test_Data_Lifecycle_and_Cleanup.md) — try/finally teardown discipline + orphan sweeper
→ [`framework/fixtures/orangehrm.fixture.ts`](./framework/fixtures/orangehrm.fixture.ts) — `testEmployee` auto-cleanup fixture pattern

### "I need PII-safe synthetic data"
→ P7 (Ch66) [Data Anonymization & PII Masking](./05_Advanced_Topics/66_Data_Anonymization_And_PII_Masking.md) — GDPR/CCPA-compliant patterns, Faker presets

### "Multiple workers need different test data"
→ Ch09 [Parallel Execution](./02_Core_Architecture/09_Parallel_Execution_Workers.md) — worker isolation
→ [`framework/fixtures/auth.fixture.ts`](./framework/fixtures/auth.fixture.ts) — file-locked pool with worker-index round-robin

---

## CI/CD

### "I need to set up GitHub Actions for Playwright"
→ Ch25 [CI/CD Integration — GitHub & Azure](./05_Advanced_Topics/25_CICD_Integration_GitHub_Azure.md)
→ [`framework/.github/workflows/ci.yml`](./framework/.github/workflows/ci.yml) — copy-pasteable working workflow
→ [`reference/10_ci_docker.md`](./reference/10_ci_docker.md) — quick reference

### "I need to shard the suite to run faster"
→ Ch48 [Sharding & Test Selection](./05_Advanced_Topics/48_Sharding_And_Test_Selection.md)
→ Ch46.5 [Config Deep-Dive](./05_Advanced_Topics/46_5_Playwright_Config_Deep_Dive.md) — shard config field
→ P8 (Ch67) [Test Impact Analysis](./05_Advanced_Topics/67_Test_Impact_Analysis.md) — smart selection beyond brute-force sharding

### "I need to use Docker for tests"
→ Ch59 [Docker for Playwright](./05_Advanced_Topics/59_Docker_For_Playwright.md) — MCR image, /dev/shm gotcha, non-root user
→ [`framework/Dockerfile`](./framework/Dockerfile), [`framework/docker-compose.yml`](./framework/docker-compose.yml)

### "I need Allure / ReportPortal integration"
→ Ch47 [Allure & ReportPortal](./05_Advanced_Topics/47_Allure_ReportPortal.md) — annotations (epic/feature/severity/owner), auto-analyzer, trends API

### "My PM is asking why our tests cost $X/month"
→ P3 (Ch62) [Cost Governance & FinOps for Test Infra](./05_Advanced_Topics/62_Cost_Governance_And_FinOps.md) — cost-per-test calculation, sharding ROI, BrowserStack/Sauce pricing math

---

## Specialized testing

### "I need to test accessibility (a11y)"
→ Ch39 [Accessibility Testing with axe-core](./07_Specialised_Testing/39_Accessibility_Testing_axe_core.md) — WCAG 2.1, POUR principles
→ [`framework/a11y/runner.ts`](./framework/a11y/runner.ts) — `runAxe(page)` + `assertNoViolations`
→ [`framework/utilities/matchers/to-be-readable-to.ts`](./framework/utilities/matchers/to-be-readable-to.ts) — custom contrast-ratio matcher

### "I need to test performance"
→ Ch37 [Performance Testing — Lighthouse & k6](./07_Specialised_Testing/37_Performance_Testing_Lighthouse_k6.md) — Core Web Vitals + load
→ [`framework/perf/budgets.ts`](./framework/perf/budgets.ts), [`framework/perf/helpers.ts`](./framework/perf/helpers.ts) — budget assertion
→ [`framework/utilities/matchers/to-respond-within.ts`](./framework/utilities/matchers/to-respond-within.ts) — API response-time matcher

### "I need visual regression testing"
→ Ch29 [Visual Regression Testing](./05_Advanced_Topics/29_Visual_Regression_Testing.md) — pixel comparison + masking dynamic content
→ [`framework/visual/`](./framework/visual/) — config, helpers, sample spec

### "I need security testing (OWASP)"
→ Ch40 [Security Testing — OWASP](./07_Specialised_Testing/40_Security_Testing_OWASP.md) — auth enforcement, IDOR, injection payloads, ZAP CI scan
→ Ch19 [Console Scripts & Security](./05_Advanced_Topics/19_Advanced_Console_Scripts_Security.md) — 12 runnable browser-console security scripts

### "I need mutation testing"
→ Ch53 [Mutation Testing with Stryker](./07_Specialised_Testing/53_Mutation_Testing_With_Stryker.md) — interpret mutation scores, fix surviving mutants

### "I need to test emails (sign-up, password reset)"
→ Ch50 [Email Service Testing](./05_Advanced_Topics/50_Email_Service_Testing.md) — Mailosaur, MailHog, Mailpit, OTP flows
→ Ch14 [Cross-site Pattern 4 — Token & magic link](./03_D365_And_Patterns/14_CrossSite_Pattern4_Token_Magic_Link.md)

### "I need to test file upload/download"
→ Ch58 [File Uploads & Downloads](./05_Advanced_Topics/58_File_Uploads_Downloads.md) — `setInputFiles`, drag-drop, download event race
→ [`framework/utilities/helpers/file.helpers.ts`](./framework/utilities/helpers/file.helpers.ts)
→ [`framework/tests/file-io/upload-download.spec.ts`](./framework/tests/file-io/upload-download.spec.ts)

### "I need BDD / Gherkin / Cucumber"
→ Ch46 [BDD with Cucumber](./05_Advanced_Topics/46_BDD_With_Cucumber.md) — feature files, step defs, World pattern, when NOT to use

### "I need feature-flag testing"
→ Ch49 [Feature Flag Testing](./05_Advanced_Topics/49_Feature_Flag_Testing.md) — LaunchDarkly / GrowthBook patterns, flag-matrix, fixture override

### "I need a component test (not full E2E)"
→ Ch52 [Component Testing with Playwright CT](./05_Advanced_Topics/52_Component_Testing_With_Playwright_CT.md) — CT vs E2E trade-offs

---

## Architecture & code structure

### "I need to design a POM for a new app"
→ Ch05 [POM Architecture Deep Dive](./02_Core_Architecture/05_POM_Architecture_Deep_Dive.md)
→ Ch18 [Mega POM splitting](./04_Enterprise_Architecture/18_Mega_POM_Architecture.md) — composition pattern
→ [`framework/pages/`](./framework/pages/) + [`framework/components/`](./framework/components/) — reference impl

### "My POMs are getting huge — how do I split?"
→ Ch18 [Mega POM splitting](./04_Enterprise_Architecture/18_Mega_POM_Architecture.md) — component POM, locator dictionary, refactor steps

### "I need to write custom fixtures"
→ Ch06 [Custom Fixtures Architecture](./02_Core_Architecture/06_Custom_Fixtures_Architecture.md) — `test.extend`, scope, auto, yield/teardown
→ [`framework/fixtures/orangehrm.fixture.ts`](./framework/fixtures/orangehrm.fixture.ts) — full example with auto-fixture
→ [`reference/04_fixtures.md`](./reference/04_fixtures.md) — quick reference

### "I need to write a custom matcher"
→ [`framework/utilities/matchers/index.ts`](./framework/utilities/matchers/index.ts) — `expect.extend` + `declare global` augmentation pattern
→ Ch36 [TypeScript Type System Mastery](./06_SDET_to_SDE_Bridge/36_TypeScript_Type_System_Mastery.md) — declaration merging

### "How do I structure the project at scale (multi-product)?"
→ Ch21 [Enterprise Project Structure](./04_Enterprise_Architecture/21_Enterprise_Project_Structure.md)
→ [`framework/websites/orangehrm/pages/`](./framework/websites/orangehrm/pages/) — per-product layout

---

## Career & process

### "I need to write a test strategy doc"
→ P6 (Ch65) [Architecture Decision Records](./05_Advanced_Topics/65_Architecture_Decision_Records.md) — ADR + test-strategy doc anatomy
→ [`career/TEST_STRATEGY_TEMPLATE.md`](./career/TEST_STRATEGY_TEMPLATE.md) — fill-in template

### "I need to write an RFC for a testing change"
→ P6 (Ch65) [Architecture Decision Records](./05_Advanced_Topics/65_Architecture_Decision_Records.md) — RFC-lite process
→ [`career/RFC_TEMPLATE.md`](./career/RFC_TEMPLATE.md)

### "I need to do a code review of test PRs"
→ [`career/CODE_REVIEW_RUBRIC.md`](./career/CODE_REVIEW_RUBRIC.md)
→ P2 (Ch61) [Leadership & Mentoring Playbook](./05_Advanced_Topics/61_Leadership_And_Mentoring_Playbook.md)

### "I need to mentor a junior SDET"
→ P2 (Ch61) [Leadership & Mentoring Playbook](./05_Advanced_Topics/61_Leadership_And_Mentoring_Playbook.md) — 1:1 frameworks, pair-programming structure

### "I need to define SLOs for the test platform"
→ P4 (Ch63) [SLOs & Error Budgets](./05_Advanced_Topics/63_SLOs_And_Error_Budgets.md) — p95 runtime, pass-rate, flake-rate, time-to-feedback

### "I have an interview soon"
→ Ch32 [SDET Interview Prep](./06_SDET_to_SDE_Bridge/32_SDET_Interview_Prep.md) — LADDER + STAR + live-coding
→ [`career/mock_interviews/`](./career/mock_interviews/) — 5 worked LADDER transcripts
→ [`career/INTERVIEW_BANK.md`](./career/INTERVIEW_BANK.md)

### "I need to assess where I am in my career"
→ [`READINESS_RUBRIC.md`](./READINESS_RUBRIC.md) — 12 competencies × 5 bands (Junior/Mid/Senior/Staff/Principal) self-scorecard

### "I need a portfolio piece to show in interviews"
→ [`challenges/CAP_C1_Flaky_Test_Detector.md`](./challenges/CAP_C1_Flaky_Test_Detector.md), [CAP_C2 Custom Reporter](./challenges/CAP_C2_Custom_Reporter.md), [CAP_C3 Analytics Dashboard](./challenges/CAP_C3_Test_Analytics_Dashboard.md)
→ [`career/PORTFOLIO_PLAN.md`](./career/PORTFOLIO_PLAN.md)

---

## Advanced / Principal SDET problems

### "We have 10,000 tests and selection is hurting us"
→ P8 (Ch67) [Test Impact Analysis](./05_Advanced_Topics/67_Test_Impact_Analysis.md) — `madge`/`ts-morph` dependency graphs, git-diff selection
→ P1 (Ch60) [Test Analytics & Flake Detection](./05_Advanced_Topics/60_Test_Analytics_And_Flake_Detection.md) — historical duration optimization

### "We need self-healing locators / AI test repair"
→ P5 (Ch64) [Self-Healing Locators](./05_Advanced_Topics/64_Self_Healing_Locators.md) — Playwright suggestions, commercial tools, rule-based fallback chains
→ Ch45 [AI Agents, MCP & Playwright](./05_Advanced_Topics/45_AI_Agents_MCP_And_Playwright.md) — agentic boundaries

### "We need chaos / resilience testing"
→ P9 (Ch68) [Chaos Engineering & Resilience Testing](./05_Advanced_Topics/68_Chaos_Engineering_And_Resilience_Testing.md) — Toxiproxy, Gremlin, `page.route()` degradation injection

### "We need distributed tracing of tests"
→ P10 (Ch69) [Observability for Tests](./05_Advanced_Topics/69_Observability_For_Tests.md) — OpenTelemetry, test-to-log correlation
→ [`framework/utilities/api/telemetry.ts`](./framework/utilities/api/telemetry.ts) — OTel span emission in API client

---

## When the answer isn't here

- For sequential learning: open [`PATHWAY_01_LEARNING.md`](./PATHWAY_01_LEARNING.md) or [`PATHWAY_02_PROFESSIONAL.md`](./PATHWAY_02_PROFESSIONAL.md).
- For the canonical full chapter list: [`00_INDEX.md`](./00_INDEX.md).
- For framework code → chapter mapping: [`MAP_CODE_TO_CHAPTER.md`](./MAP_CODE_TO_CHAPTER.md).
- For a single-topic deep dive: [`deep_dives/`](./deep_dives/).
- For a 5-minute cheat sheet: [`reference/`](./reference/).
