# Pathway 02 — Professional (Mid → Senior → Staff → Principal SDET)

A curated, ordered reading sequence for a **working** SDET who wants to level up. Assumes Playwright fluency and a real day-job that involves writing and maintaining tests.

> **Not this pathway if:**
>
> - You're new to test automation → use [`PATHWAY_01_LEARNING.md`](./PATHWAY_01_LEARNING.md) first.
> - You have one specific problem to solve → use [`PATHWAY_03_OFFICE.md`](./PATHWAY_03_OFFICE.md).

---

## Who this is for

You can already:

- Write a stable Playwright POM-based test suite.
- Run tests in CI with sharding and reports.
- Debug a flaky test with the trace viewer.
- Read and write modern TypeScript.

You want to:

- Architect a test platform for multiple teams, not just write tests.
- Influence test culture on your team / org.
- Pass a senior, staff, or principal SDET interview.
- Score Senior+ on [`READINESS_RUBRIC.md`](../career/READINESS_RUBRIC.md) in most of the 12 competency areas.

---

## How this pathway is shaped

**6 sections + a final readiness gate.** Each chapter row in the tables below carries a **`#Rx`** tag — the rubric competency areas the chapter helps you unlock. The 12 competency areas are:

| Rubric # | Area                                          |
| -------- | --------------------------------------------- |
| R1       | Playwright Fundamentals                       |
| R2       | Page Object Model & Architecture              |
| R3       | Fixtures & Test Isolation                     |
| R4       | API Testing & Client Design                   |
| R5       | CI/CD & Test Infrastructure                   |
| R6       | Performance, Accessibility & Security Testing |
| R7       | Flakiness Diagnosis & Prevention              |
| R8       | Test Analytics & Smart Selection              |
| R9       | Reporting & Observability                     |
| R10      | Leadership & Mentoring                        |
| R11      | Cost Governance & SLOs                        |
| R12      | AI-Assisted Testing & Tooling                 |

**Total time:** ~130–180 hours, spread over 12–24 weeks. Don't try to do it in a sprint — most of this is about doing the labs at work, not just reading.

---

## Section 1 — Enterprise architecture (≈ 18 hours)

The "junior writes tests, senior writes the architecture that makes tests cheap to write" gap. Close it here.

| #   | Read                                                                                                                                           | Rubric | Why now                                                                                                            | Est  | Lab (do at work if you can)                                                                                                                                                                                                                                                                                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [`04_Enterprise_Architecture/18_Mega_POM_Architecture.md`](../04_Enterprise_Architecture/18_Mega_POM_Architecture.md)                           | R2     | Splitting a 4000-line `OrdersPage` into composable component objects.                                              | 3 hr | Pick one fat POM at work. Sketch the split.                                                                                                                                                                                                                                                                                           |
| 2   | [`04_Enterprise_Architecture/21_Enterprise_Project_Structure.md`](../04_Enterprise_Architecture/21_Enterprise_Project_Structure.md)             | R2     | Why every folder exists. Use it as a checklist for new repos.                                                      | 2 hr | Map your work repo to the structure. Note divergences and ask "why?" for each.                                                                                                                                                                                                                                                        |
| 3   | [`04_Enterprise_Architecture/22_Headers_Payloads_Endpoints_Factory.md`](../04_Enterprise_Architecture/22_Headers_Payloads_Endpoints_Factory.md) | R4     | Three-factor decomposition of an HTTP request — the layer below APIUtils.                                          | 2 hr | Refactor one suite's API helpers into the factory pattern.                                                                                                                                                                                                                                                                            |
| 4   | [`04_Enterprise_Architecture/23_APIUtils_HTTP_Library.md`](../04_Enterprise_Architecture/23_APIUtils_HTTP_Library.md)                           | R4     | Layer 1 of the 5-layer API client.                                                                                 | 2 hr | Read [`framework/utilities/api/APIUtils.ts`](../framework/utilities/api/APIUtils.ts) alongside.                                                                                                                                                                                                                                        |
| 5   | [`04_Enterprise_Architecture/24_Test_Script_Architecture.md`](../04_Enterprise_Architecture/24_Test_Script_Architecture.md)                     | R2, R3 | "POMs before steps" + the data accumulator pattern.                                                                | 2 hr | Pick one ugly test at work. Apply the pattern.                                                                                                                                                                                                                                                                                        |
| 6   | [`05_Advanced_Topics/44_Enterprise_API_Client_Library.md`](../05_Advanced_Topics/44_Enterprise_API_Client_Library.md)                           | R4     | The full 5-layer client with retry, typed errors, schema validation. The single longest chapter in the curriculum. | 5 hr | Read [`framework/utilities/api/ApiCore.ts`](../framework/utilities/api/ApiCore.ts), [`HeadersBuilder.ts`](../framework/utilities/api/HeadersBuilder.ts), [`Endpoints.ts`](../framework/utilities/api/Endpoints.ts), [`errors.ts`](../framework/utilities/api/errors.ts), [`UsersClient.ts`](../framework/clients/UsersClient.ts) in order. |
| 7   | [`02_Core_Architecture/57_Playwright_Config_Theory_Catalog.md`](../02_Core_Architecture/56_Playwright_Config_Deep_Dive.md)                 | R1, R5 | Every config field and how to reason about its blast radius. (Renamed from `46_5_Playwright_Config_Deep_Dive.md`.) | 2 hr | Audit your work's `playwright.config.ts` field by field. Note 3 things you'd change.                                                                                                                                                                                                                                                  |

### Checkpoint 1

- Can you walk a colleague through the 5 layers of the API client and explain why each one exists?
- Can you justify (in writing) every folder in your work's test repo?
- Can you point at a config field and say what would happen if you changed it?

---

## Section 2 — Reliability, data, advanced TS (≈ 18 hours)

The level where you stop fighting fires and start preventing them.

| #   | Read                                                                                                                         | Rubric  | Why now                                                                                                         | Est  | Lab                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------ |
| 8   | [`05_Advanced_Topics/26_Flakiness_Diagnosis_and_Fixing.md`](../05_Advanced_Topics/26_Flakiness_Diagnosis_and_Fixing.md)       | R7      | The 9-type taxonomy + diagnosis flowchart. Re-read even if you've seen it.                                      | 4 hr | Triage the last 3 flakes at work. Tag each by type.                                  |
| 9   | [`05_Advanced_Topics/28_Test_Data_Lifecycle_and_Cleanup.md`](../05_Advanced_Topics/28_Test_Data_Lifecycle_and_Cleanup.md)     | R3      | 5 seeding strategies, orphan sweeper, try/finally discipline.                                                   | 3 hr | Add an orphan sweeper to one suite at work.                                          |
| 10  | [`05_Advanced_Topics/30_Database_Verification_Direct_SQL.md`](../05_Advanced_Topics/30_Database_Verification_Direct_SQL.md)   | R3, R4  | 3-layer verification (API → DB → audit log) for high-trust assertions.                                          | 2 hr | Add one direct-SQL verification to a critical-path test.                             |
| 11  | [`05_Advanced_Topics/27_Advanced_TypeScript_for_SDETs.md`](../05_Advanced_Topics/27_Advanced_TypeScript_for_SDETs.md)         | R1, R2  | Generics, discriminated unions, conditional types — the parts you'll actually use.                              | 3 hr | Type one of your factories with `satisfies` + a discriminated union.                 |
| 12  | [`06_SDET_to_SDE_Bridge/36_TypeScript_Type_System_Mastery.md`](../06_SDET_to_SDE_Bridge/36_TypeScript_Type_System_Mastery.md) | R1      | Mapped types, template literal types, `infer` — for when you're designing the framework, not just consuming it. | 3 hr | Pick one duplicate type-shape in your work repo. Replace with a mapped type.         |
| 13  | [`05_Advanced_Topics/42_Polling_Async_Data_Patterns.md`](../05_Advanced_Topics/42_Polling_Async_Data_Patterns.md)             | R7      | `expect.poll` deep dive + `waitForResponse` + custom polling utility.                                           | 2 hr | Audit your suite for any `waitForTimeout`. Replace each.                             |
| 14  | [`05_Advanced_Topics/43_Real_World_SDET_War_Stories.md`](../05_Advanced_Topics/43_Real_World_SDET_War_Stories.md)             | R7, R10 | 14 stories — read for pattern recognition, not facts.                                                           | 2 hr | Pick the one closest to a story from your own job. Share with a junior on your team. |

### Checkpoint 2

- Given a flake report, can you write up a 3-step triage plan?
- Can you write a `mapped type` that transforms one of your config interfaces?

---

## Section 3 — CI/CD, sharding, specialized testing (≈ 18 hours)

The infrastructure layer below tests.

| #   | Read                                                                                                                                 | Rubric | Why now                                                                          | Est    | Lab                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 15  | [`05_Advanced_Topics/25_CICD_Integration_GitHub_Azure.md`](../05_Advanced_Topics/25_CICD_Integration_GitHub_Azure.md)                 | R5     | Matrix builds, secrets, artifacts, sharded jobs.                                 | 3 hr   | Compare your work's CI to [`framework/.github/workflows/ci.yml`](../framework/.github/workflows/ci.yml). List 3 improvements. |
| 16  | [`05_Advanced_Topics/48_Sharding_And_Test_Selection.md`](../05_Advanced_Topics/48_Sharding_And_Test_Selection.md)                     | R5, R8 | `--shard`, blob reporter, `merge-reports`, selection heuristics.                 | 2 hr   | Add sharding to one suite at work.                                                                                           |
| 17  | [`05_Advanced_Topics/59_Docker_For_Playwright.md`](../05_Advanced_Topics/59_Docker_For_Playwright.md)                                 | R5     | MCR base image, multi-stage builds, `/dev/shm` gotcha.                           | 2 hr   | Pull [`framework/Dockerfile`](../framework/Dockerfile) and adapt to your stack.                                               |
| 18  | [`07_Specialised_Testing/37_Performance_Testing_Lighthouse_k6.md`](../07_Specialised_Testing/37_Performance_Testing_Lighthouse_k6.md) | R6     | Lighthouse CI + k6 load testing + perf budgets.                                  | 3 hr   | Add 1 perf assertion to a critical-path test at work.                                                                        |
| 19  | [`07_Specialised_Testing/38_Contract_Testing_Pact.md`](../07_Specialised_Testing/38_Contract_Testing_Pact.md)                         | R4, R6 | Consumer pacts, provider verification, `can-i-deploy`.                           | 3 hr   | Sketch a contract-test integration plan for one consumer/provider pair at work.                                              |
| 20  | [`07_Specialised_Testing/39_Accessibility_Testing_axe_core.md`](../07_Specialised_Testing/39_Accessibility_Testing_axe_core.md)       | R6     | WCAG 2.1, POUR, keyboard nav, a11y debt tracking.                                | 2 hr   | Add `@axe-core/playwright` to your suite. Triage the violations.                                                             |
| 21  | [`07_Specialised_Testing/40_Security_Testing_OWASP.md`](../07_Specialised_Testing/40_Security_Testing_OWASP.md)                       | R6     | OWASP Top 10, IDOR, injection, CSP headers, cookie flags.                        | 2 hr   | Run [`framework/tests/`] reasoning: which 3 OWASP categories matter most for your product?                                   |
| 22  | [`05_Advanced_Topics/47_Allure_ReportPortal.md`](../05_Advanced_Topics/47_Allure_ReportPortal.md)                                     | R9     | Annotations (epic/feature/severity/owner), auto-analyzer, defect classification. | 1.5 hr | Configure Allure with proper annotations for your team's quarterly review.                                                   |
| 23  | [`05_Advanced_Topics/29_Visual_Regression_Testing.md`](../05_Advanced_Topics/29_Visual_Regression_Testing.md)                         | R6     | Pixel comparison, masking, baseline workflow.                                    | 1.5 hr | Add 1 visual baseline for your main page.                                                                                    |
| 24  | [`05_Advanced_Topics/61_Emulation_Clock_Network_And_Devices.md`](../05_Advanced_Topics/61_Emulation_Clock_Network_And_Devices.md)     | R1, R6 | Device matrix, `page.clock`, network throttling, locale/timezone — the environment axis of coverage. | 2.5 hr | Add one mobile project + one `page.clock` session-expiry test to your suite at work.                                        |
| 25  | [`04_Enterprise_Architecture/62_Enterprise_Test_Operations.md`](../04_Enterprise_Architecture/62_Enterprise_Test_Operations.md)       | R5, R8, R12 | Environment tiers, flake SLA, gate tiers, ownership, the metrics that keep suites funded. | 3 hr   | Write your team's one-page flake SLA (Ch62 Challenge 1) and get a lead to review it.                                          |

### Checkpoint 3

- Your CI pipeline takes 25 minutes for 800 tests. Where do you look first?
- Can you write a one-page proposal for adding contract testing to your stack?
- How would you defend a perf budget number to a skeptical PM?

---

## Section 4 — Platform & governance: the principal-scope work (≈ 22 hours)

The work that separates a senior from a principal is not more test code — it is owning the *system* around the tests: decisions on record, processes with teeth, and platform tooling other engineers rely on. (The former "P1–P10 extension" chapters were folded into the material below during the Phase 6 audit.)

| #   | Read                                                                                                                                     | Rubric  | Why now                                                                                                  | Est    | Lab                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| 26  | [`framework/docs/adrs/`](../framework/docs/adrs/README.md) — all 6 ADRs                                                                  | R2, R12 | Decisions-on-record is the governance habit; these 6 show the format applied to real framework choices.  | 2 hr   | Write ADR-007 for a decision your team made implicitly (e.g., "why we retry twice in CI").                  |
| 27  | [`career/TEST_STRATEGY_TEMPLATE.md`](../career/TEST_STRATEGY_TEMPLATE.md)                                                                 | R12     | Checkpoint 4 asks you to draft a strategy doc — this is the scaffold.                                    | 2 hr   | Fill it in for one real product line at work; keep it to one page.                                          |
| 28  | [`career/RFC_TEMPLATE.md`](../career/RFC_TEMPLATE.md)                                                                                     | R12     | Platform changes land through RFCs, not surprise PRs.                                                    | 1.5 hr | Write the RFC for one improvement from your Ch62 flake-SLA lab.                                             |
| 29  | [`career/CODE_REVIEW_RUBRIC.md`](../career/CODE_REVIEW_RUBRIC.md)                                                                         | R2, R8  | Federated ownership (Ch62 §4) only works if review standards are explicit.                               | 1.5 hr | Review one teammate PR against the rubric; note where the rubric itself needs a rule your team keeps re-litigating. |
| 30  | [`challenges/CAP_C1_Flaky_Test_Detector.md`](../challenges/CAP_C1_Flaky_Test_Detector.md)                                                 | R8      | Build the detection half of the flake SLA — platform tooling, not test code.                             | 5 hr   | Complete the capstone; wire its output to the Ch62 §3 quarantine flow on paper.                              |
| 31  | [`challenges/CAP_C3_Test_Analytics_Dashboard.md`](../challenges/CAP_C3_Test_Analytics_Dashboard.md)                                       | R8, R9  | The Ch62 §6 metrics need a surface leadership can see — build it.                                        | 6 hr   | Complete the capstone; present one week of real (or framework-generated) data to a peer as if to a director. |
| 32  | [`05_Advanced_Topics/54_Synthetic_Monitoring.md`](../05_Advanced_Topics/54_Synthetic_Monitoring.md)                                       | R5, R9  | Production-facing checks are the platform team's outward face (Ch62 §1's production tier).               | 2 hr   | Define the 5 monitors you would run against your product's money path, with alert thresholds.               |
| 33  | [`07_Specialised_Testing/51_Secrets_Management_For_SDETs.md`](../07_Specialised_Testing/51_Secrets_Management_For_SDETs.md)               | R7, R12 | Governance includes what must never leak; test infra handles real credentials.                           | 2 hr   | Audit your suite's secret flow end-to-end: where each credential lives, rotates, and could leak.             |

### Checkpoint 4

- Can you draft a 1-page test-strategy doc for a new product line?
- Can you defend a test-platform SLO to a director-level stakeholder?
- Can you explain when self-healing locators are appropriate vs when they hide real bugs?

---

## Section 5 — SDE crossover (≈ 12 hours)

The "I want to interview as a Staff+ SDET" content — and the breadth that makes principal SDETs respected by SDEs.

| #   | Read                                                                                                                                       | Rubric | Why now                                                                                       | Est  | Lab                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------- |
| 34  | [`06_SDET_to_SDE_Bridge/33_SDET_to_SDE_CS_Thinking.md`](../06_SDET_to_SDE_Bridge/33_SDET_to_SDE_CS_Thinking.md)                             | R10    | Data structures, graphs, design patterns through a testing lens.                              | 3 hr | Identify a CS concept from your last sprint.                                          |
| 35  | [`06_SDET_to_SDE_Bridge/34_Algorithms_in_Test_Automation.md`](../06_SDET_to_SDE_Bridge/34_Algorithms_in_Test_Automation.md)                 | R10    | Sliding window, binary search, greedy scheduling — applied to tests.                          | 3 hr | Identify the algorithm behind a heuristic in your suite (e.g., flaky-test scheduler). |
| 36  | [`06_SDET_to_SDE_Bridge/35_OOP_Design_Patterns_for_SDETs.md`](../06_SDET_to_SDE_Bridge/35_OOP_Design_Patterns_for_SDETs.md)                 | R2     | Factory, Observer, Strategy, Template, Proxy, Composite — and SOLID applied to POMs.          | 3 hr | Identify 3 patterns already in [`framework/`](../framework/).                          |
| 37  | [`06_SDET_to_SDE_Bridge/60_Tool_Comparison_Cypress_Selenium_WDIO.md`](../06_SDET_to_SDE_Bridge/60_Tool_Comparison_Cypress_Selenium_WDIO.md) | R1     | Honest cross-tool comparison — useful for interview answers and tool-selection conversations. | 2 hr | Draft a 1-pager on "why we picked Playwright" using the chapter's trade-off matrix.   |
| 38  | [`05_Advanced_Topics/45_AI_Agents_MCP_And_Playwright.md`](../05_Advanced_Topics/45_AI_Agents_MCP_And_Playwright.md)                         | R12    | Model Context Protocol, agentic scaffolding, where AI can and can't replace SDETs.            | 2 hr | None — read for vocabulary.                                                           |

### Checkpoint 5

- Can you explain why your team chose Playwright over Cypress/Selenium/WebdriverIO, with reasons that survive pushback?
- Can you name 3 OOP patterns that show up in your work test code, with their trade-offs?

---

## Section 6 — Prove it: capstones + self-assessment (≈ 30 hours)

You've read enough. Show that you can ship.

| #   | Do                                                                                                                                                                                                                                                               | Rubric | Why                                                                                                                                                | Est   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 39  | [`challenges/CH05_Cross_Website_Data_Bridge.md`](../challenges/CH05_Cross_Website_Data_Bridge.md), [`CH06_Understand_Auth_Fixture.md`](../challenges/CH06_Understand_Auth_Fixture.md), [`CH07_Full_Cross_Site_Flow.md`](../challenges/CH07_Full_Cross_Site_Flow.md) | R2–R4  | The harder graded challenges. Reference impls in [`challenges/solutions/CH05..CH07`](../challenges/solutions/).                                     | 6 hr  |
| 40  | [`challenges/CAP_C1_Flaky_Test_Detector.md`](../challenges/CAP_C1_Flaky_Test_Detector.md)                                                                                                                                                                         | R7, R8 | Build a CLI that ranks flaky tests from JSON reports. Reference: [`framework/utilities/analytics/cli.ts`](../framework/utilities/analytics/cli.ts). | 8 hr  |
| 41  | [`challenges/CAP_C2_Custom_Reporter.md`](../challenges/CAP_C2_Custom_Reporter.md)                                                                                                                                                                                 | R9     | Build a Playwright `Reporter` implementation.                                                                                                      | 8 hr  |
| 42  | [`challenges/CAP_C3_Test_Analytics_Dashboard.md`](../challenges/CAP_C3_Test_Analytics_Dashboard.md)                                                                                                                                                               | R8, R9 | Full-stack analytics dashboard consuming the Capstone C1 store.                                                                                    | 12 hr |
| 43  | [`READINESS_RUBRIC.md`](../career/READINESS_RUBRIC.md)                                                                                                                                                                                                                   | All    | Self-score across all 12 competencies. Don't grade up — grade where you are.                                                                       | 1 hr  |
| 44  | [`career/PROGRESS.md`](../career/PROGRESS.md), [`career/INTERVIEW_BANK.md`](../career/INTERVIEW_BANK.md), [`career/PORTFOLIO_PLAN.md`](../career/PORTFOLIO_PLAN.md)                                                                                                 | R10    | Wire your capstones to your portfolio + interview narrative.                                                                                       | 2 hr  |

---

## Final readiness gate — when are you done?

You've finished this pathway when:

- ✅ You scored at least **Senior (3)** in 8 of 12 rubric competencies, with concrete evidence for each.
- ✅ At least one capstone (CAP_C1, C2, or C3) is shippable — code green, tests passing, README explains design choices.
- ✅ You've authored one ADR or RFC for a real decision at work using [`career/RFC_TEMPLATE.md`](../career/RFC_TEMPLATE.md) or [`career/TEST_STRATEGY_TEMPLATE.md`](../career/TEST_STRATEGY_TEMPLATE.md).
- ✅ You've mentored at least one junior through one full review cycle using [`career/CODE_REVIEW_RUBRIC.md`](../career/CODE_REVIEW_RUBRIC.md).
- ✅ You can confidently walk a hiring panel through the 5-layer API client architecture in [`framework/utilities/api/`](../framework/utilities/api/) and explain _why_ each layer exists.

For **Principal-target**, raise the bar to **8 of 12 at Staff (4) or Principal (5)**.

---

## Where to switch / branch

- "I have a real specific problem at work" → [`PATHWAY_03_OFFICE.md`](./PATHWAY_03_OFFICE.md). Pause this pathway; come back later.
- "I want to focus on interview prep specifically" → [`WHERE_TO_START.md`](../WHERE_TO_START.md) Section E + [`career/mock_interviews/`](../career/mock_interviews/).
- "I want to understand the framework code I'm reading" → [`MAP_CODE_TO_CHAPTER.md`](../00_Navigation/MAP_CODE_TO_CHAPTER.md).

---

## Honest notes

- **You won't finish in 6 weeks.** Plan for 3–6 months of part-time effort. The work is in the labs, not the reading.
- **Skipping labs voids the warranty.** Reading 30 chapters in a weekend will not move your rubric score.
- **Some chapters won't apply.** If your company doesn't use D365 or Pact, those chapters are vocabulary, not action items. That's fine — log them as "I know this exists" rather than skipping the rubric area entirely.
- **The Principal Extension (P1–P10) is the hardest section.** Not because the content is hard, but because the labs require organizational context. Do them with a real product team, not in isolation.
- **The rubric is harder to lie to than this pathway.** Read [`READINESS_RUBRIC.md`](../career/READINESS_RUBRIC.md) honestly, with a peer reviewer. That's the actual measure.
