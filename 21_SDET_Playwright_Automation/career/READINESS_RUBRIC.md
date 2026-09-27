# Principal SDET Readiness Rubric

> **Purpose**: This rubric maps the 12 core competency areas required for a Principal SDET role focused on Playwright-based test automation, infrastructure, and organizational enablement. Use it for self-assessment, 1:1 growth tracking, and interview preparation.

---

## How to Use This Rubric

1. **Self-Assess Honestly**: For each competency, identify the band that best describes your current capabilities. Do not select the band you aspire to -- select where you are today.
2. **Gather Evidence**: For each band you claim, have at least one concrete artifact, system, or behavior you can point to (e.g., "I designed the POM layer for the checkout service" or "I reduced flaky-test rate by 40% in Q2").
3. **Identify Gaps**: Highlight bands where you are one level below where you want to be. These are your growth areas.
4. **Set a Timeline**: Pick 2-3 competencies to level up per quarter. Tie each goal to a deliverable (e.g., "Staff-level in CI/CD = own the migration to GitHub Actions").
5. **Validate with Peers**: Ask a mentor or manager to calibrate your self-rating. Principal-level is often calibrated against org-wide or industry impact, which is hard to self-judge.
6. **Revisit Quarterly**: Update your ratings as you produce evidence. The rubric is a living document.

**Scoring Shortcut**: Count how many competencies you rate at each band. A Principal SDET should have:

- At least **8 competencies at Principal or Staff level**
- No competency below **Senior level**

---

## Competency Areas

---

### 1. Playwright Fundamentals

| Band          | Description                                                                                                                                    | Evidence Examples                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Junior**    | Can write basic page interactions (click, fill, assert). Needs guidance on selectors and waits.                                                | Simple smoke tests, inline selectors                                          |
| **Mid**       | Proficient with locators, auto-waiting, assertions, test hooks. Can debug basic failures independently.                                        | Full test suites for a feature, uses `data-testid` consistently               |
| **Senior**    | Deep knowledge of Playwright internals (browser contexts, tracing, codegen, route interception). Optimizes tests for speed and stability.      | Custom fixtures, harnesses, debugging flaky tests, mentoring juniors          |
| **Staff**     | Shapes how the org uses Playwright -- enforces patterns, drives framework design, contributes upstream or maintains internal wrappers          | Org-wide test framework, custom reporters, contribution to Playwright project |
| **Principal** | Industry voice: publishes talks, articles, or open-source tools around Playwright. Defines the future direction of browser automation strategy | Keynote talks, widely adopted open-source tools, standards body participation |

---

### 2. Page Object Model & Architecture

| Band          | Description                                                                                                                             | Evidence Examples                                              |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Junior**    | Understands what POM is but mixes selectors with test logic.                                                                            | Simple page classes with hardcoded locators                    |
| **Mid**       | Implements POM consistently. Separates page logic from test logic. Uses composition over inheritance.                                   | Clean POMs for 3+ feature areas, reusable components           |
| **Senior**    | Designs multi-layer architectures: POM, services, fixtures, decorators, builders. Balances DRY vs. readability.                         | Framework with component library, service layer, test builders |
| **Staff**     | Architects test frameworks for multi-team adoption. Decides when POM is not enough (e.g., Screenplay pattern). Drives standardization.  | Cross-team adopted framework, ADRs on architecture decisions   |
| **Principal** | Innovates on test architecture at industry scale. Designs patterns that adapt to new UI paradigms (e.g., micro-frontends, WebAssembly). | Published architecture patterns adopted beyond own org         |

---

### 3. Fixtures & Test Isolation

| Band          | Description                                                                                                                     | Evidence Examples                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Junior**    | Uses basic `test.beforeEach` / `afterEach`. Tests have hidden dependencies.                                                     | Tests pass/fail in isolation vs. full suite                 |
| **Mid**       | Leverages Playwright fixtures for consistent setup/teardown. Understands worker-vs-test scope.                                  | Custom fixtures for auth, db seed, feature flags            |
| **Senior**    | Designs complex fixture hierarchies with dependency injection. Ensures zero test leakage across workers.                        | Multi-worker parallel suite with zero shared mutable state  |
| **Staff**     | Makes test isolation the default for hundreds of engineers. Builds self-service tooling for environment provisioning.           | Platform that spins up isolated preview envs per PR         |
| **Principal** | Defines isolation patterns for emerging compute models (serverless, WASM, WebGPU). Publishes research on deterministic testing. | Industry publications, conference talks on test determinism |

---

### 4. API Testing & Client Design

| Band          | Description                                                                                                                           | Evidence Examples                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Junior**    | Can write basic API calls with `fetch` or `axios` inside tests. Does not separate API from UI concerns.                               | `request.get()` calls inside UI tests                                     |
| **Mid**       | Uses Playwright's `APIRequestContext` properly. Separates API setup from UI validation.                                               | API fixtures, pre-seeding data before UI flows                            |
| **Senior**    | Designs multi-layer API clients -- typed wrappers, error handling, retry logic, auth management. Builds hybrid UI+API test patterns.  | Internal API SDK with TypeScript types, parallel API+UI validation suites |
| **Staff**     | Architectures org-wide API testing platform. Defines contract testing strategy (OpenAPI, Pact). Unifies API and E2E coverage metrics. | Centralized API testing service, contract-test integration in CI          |
| **Principal** | Innovates on API client design for emerging protocols (gRPC-Web, GraphQL batching, WebSockets). Industry thought leader.              | Published client patterns, standards proposals for API testability        |

---

### 5. CI/CD & Test Infrastructure

| Band          | Description                                                                                                                                          | Evidence Examples                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Junior**    | Runs tests locally. Understands that CI exists but does not configure it.                                                                            | Manual test runs, reads CI logs                                           |
| **Mid**       | Configures test jobs in CI (GitHub Actions, Jenkins, etc.). Understands matrix builds and artifact uploads.                                          | Working CI pipeline for test suite, basic parallelism                     |
| **Senior**    | Designs sharded, parallel, deterministic CI pipelines. Optimizes for cost and feedback latency. Integrates with container orchestration.             | 10-min full-suite pipeline, cost-optimized sharding, Docker-based runners |
| **Staff**     | Owns the test infrastructure platform. Self-service for teams to onboard tests. Builds dashboards for pipeline health.                               | Platform team managing test infra for 500+ engineers                      |
| **Principal** | Shapes industry CI/CD patterns. Designs next-gen test execution platforms (distributed runners, spot-instance orchestration, predictive scheduling). | Conference talks, open-source infra projects, standards committees        |

---

### 6. Performance, Accessibility & Security Testing

| Band          | Description                                                                                                                                       | Evidence Examples                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Junior**    | Aware that performance/a11y/security matter. Can run Lighthouse or basic scans.                                                                   | Manual Lighthouse runs, reads a11y reports                 |
| **Mid**       | Integrates Lighthouse, axe-core, or OWASP ZAP into Playwright tests. Understands basic thresholds.                                                | Automated a11y checks in CI, basic perf regression gates   |
| **Senior**    | Designs comprehensive non-functional test suites. Custom metrics, budgets, and regression detection.                                              | Performance budgets, custom axe rules, security scan gates |
| **Staff**     | Defines org-wide non-functional testing strategy. Balances coverage vs. noise. Integrates with production SLOs.                                   | Org-wide a11y mandate, perf SLOs tied to releases          |
| **Principal** | Industry leader on holistic quality. Publishes research integrating automated testing with SRE practices (SLO-driven testing, chaos engineering). | Keynotes, published frameworks for SLO-driven testing      |

---

### 7. Flakiness Diagnosis & Prevention

| Band          | Description                                                                                                                                     | Evidence Examples                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Junior**    | Frustrated by flaky tests. Retries blindly or disables tests.                                                                                   | Disabled tests, `--retries` as primary fix                    |
| **Mid**       | Can diagnose common flakiness causes (timing, selectors, state). Applies standard fixes.                                                        | Refactored 10 flaky tests to be stable                        |
| **Senior**    | Systematically reduces flakiness at scale. Builds detection tooling (flaky-test dashboards, bisect runners). Teaches teams prevention patterns. | Reduced flakiness rate from 5% to 0.5%, built flaky-test bot  |
| **Staff**     | Makes flakiness a first-class metric. Drives org-wide prevention culture. Designs deterministic execution guarantees.                           | Org-wide flakiness SLA, deterministic test execution platform |
| **Principal** | Industry expert on test determinism. Publishes research on root causes of flakiness in distributed systems. Shapes tooling at ecosystem level.  | Academic papers, widely adopted flaky-test detection tools    |

---

### 8. Test Analytics & Smart Selection

| Band          | Description                                                                                                                                         | Evidence Examples                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Junior**    | Counts pass/fail manually. Does not track trends.                                                                                                   | Reads test output, no dashboards                                       |
| **Mid**       | Uses CI dashboards or basic reports. Can identify trends over days.                                                                                 | Basic test trend dashboards, weekly flakiness reports                  |
| **Senior**    | Designs custom analytics pipelines. Tracks coverage, flakiness, runtime, cost per test. Implements smart test selection (impacted tests, ML-based). | Custom analytics pipeline, 50% reduction in test runtime via selection |
| **Staff**     | Org-wide test intelligence platform. Predictive failure detection, automatic test prioritization, cost allocation per team.                         | Central test intelligence service used by all teams                    |
| **Principal** | Publishes research on test-selection algorithms, coverage optimization, and cost-aware testing. Defines the state of the art.                       | Published algorithms, open-source test-selection tools                 |

---

### 9. Reporting & Observability

| Band          | Description                                                                                                                                                 | Evidence Examples                                               |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Junior**    | Reads console output. Uses basic HTML reports if available.                                                                                                 | Default Playwright HTML report                                  |
| **Mid**       | Customizes reporters, integrates with Slack/email. Stores trace files for failures.                                                                         | Slack notifications, trace.zip in CI artifacts                  |
| **Senior**    | Builds rich reporting systems: trace indexing, video gallery, diff viewers, historical comparison. Integrates with observability stacks (Datadog, Grafana). | Custom report portal, trace indexing, observability integration |
| **Staff**     | Unified observability for tests and production. Correlates test failures with production incidents. Single pane of glass for quality.                       | Unified quality dashboard, test-to-incident correlation         |
| **Principal** | Defines observability standards for the industry. Unifies testing and production telemetry into holistic quality signals.                                   | Industry standards, open-source observability projects          |

---

### 10. Leadership & Mentoring

| Band          | Description                                                                                                           | Evidence Examples                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Junior**    | Receives mentoring. Learns from senior team members.                                                                  | Active 1:1s with mentor                                         |
| **Mid**       | Occasionally pairs with juniors. Writes documentation.                                                                | Onboarding docs, paired programming sessions                    |
| **Senior**    | Formal mentoring. Leads test guilds. Drives code review culture. Defines team standards.                              | 2+ mentees at mid-level, test guild lead, style guide author    |
| **Staff**     | Org-wide enablement. Designs apprenticeship programs. Influences hiring rubrics. Shapes engineering culture.          | SDET apprenticeship program, org-wide hiring rubric             |
| **Principal** | Industry mentorship. Keynotes, books, open-source community leadership. Shapes the next generation of SDETs globally. | Published books, widely read blog, conference program committee |

---

### 11. Cost Governance & SLOs

| Band          | Description                                                                                                                           | Evidence Examples                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Junior**    | Unaware of test infrastructure costs.                                                                                                 | No cost tracking                                            |
| **Mid**       | Aware of CI minutes / cloud costs. Makes basic optimizations (parallelism, runner sizing).                                            | Reduced CI minutes by 20%                                   |
| **Senior**    | Designs cost-aware test strategies. Right-sizes infrastructure. Balances coverage with execution cost.                                | 40% cost reduction while maintaining coverage               |
| **Staff**     | Org-wide cost governance. Showback/chargeback models. Test SLOs aligned with business priorities.                                     | Cost allocation per team, test SLOs in executive dashboards |
| **Principal** | Industry thought leader on sustainable testing. Publishes cost-models for quality engineering. Advises C-suite on quality investment. | Published cost models, advisory roles, board presentations  |

---

### 12. AI-Assisted Testing & Tooling

| Band          | Description                                                                                                                                             | Evidence Examples                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Junior**    | Has heard of AI testing tools. Does not use them.                                                                                                       | Awareness only                                               |
| **Mid**       | Uses AI assistants (Copilot, ChatGPT) for basic test generation. Validates outputs.                                                                     | AI-assisted test writing, code review with AI suggestions    |
| **Senior**    | Integrates AI into testing workflows: self-healing selectors, test generation from user journeys, anomaly detection.                                    | Self-healing test framework, AI-generated regression suites  |
| **Staff**     | Org-wide AI testing strategy. Governance for AI-generated tests. Balances automation with human oversight.                                              | AI test governance policy, org-wide self-healing platform    |
| **Principal** | Defines the future of AI in testing. Publishes research on LLM-based test synthesis, formal verification hybrids, and AI ethics in quality engineering. | Published research, patents, advisory to AI testing startups |

---

## Portfolio Mapping

Each real challenge/artifact in this curriculum maps to specific competency areas. Fixed to reference actual filenames in [`../challenges/`](../challenges/README.md) and this folder — the previous version of this table used placeholder IDs (`L1`–`L8`) that didn't correspond to any real file. Where no real challenge exists yet for a row, that's said plainly rather than implied:

| Challenge / Artifact                                                                     | Proven Competencies | Status                                                                                     |
| ----------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------ |
| [`CH01_Core_Infrastructure.md`](../challenges/CH01_Core_Infrastructure.md)                | 1, 3                 | Real                                                                                        |
| [`CH02_Single_Website_POM.md`](../challenges/CH02_Single_Website_POM.md)                  | 1, 2                 | Real                                                                                        |
| [`CH06_Understand_Auth_Fixture.md`](../challenges/CH06_Understand_Auth_Fixture.md)        | 3, 5                 | Real                                                                                        |
| [`CH03_API_UI_Cross_Validation.md`](../challenges/CH03_API_UI_Cross_Validation.md)        | 4, 5                 | Real                                                                                        |
| [`CAP_C1_Flaky_Test_Detector.md`](../challenges/CAP_C1_Flaky_Test_Detector.md)             | 1, 3, 7              | Real                                                                                        |
| [`CAP_C2_Custom_Reporter.md`](../challenges/CAP_C2_Custom_Reporter.md)                     | 8, 9                 | Real                                                                                        |
| [`CAP_C3_Test_Analytics_Dashboard.md`](../challenges/CAP_C3_Test_Analytics_Dashboard.md)   | 8, 9                 | Real                                                                                        |
| [`RFC_TEMPLATE.md`](./RFC_TEMPLATE.md)'s filled example (Puppeteer→Playwright)             | 2, 5, 10             | Real                                                                                        |
| [`mock_interviews/ladder_system.md`](./mock_interviews/ladder_system.md)                  | 2, 5, 7, 8           | Real                                                                                        |
| [`mock_interviews/ladder_coding.md`](./mock_interviews/ladder_coding.md)                  | 1, 2, 3, 4           | Real                                                                                        |
| Accessibility testing with axe-core                                                       | 6, 9                 | **No dedicated challenge yet** — practice via Ch39's own exercises instead                  |
| CI/CD pipeline optimization                                                               | 5, 8, 11             | **No dedicated challenge yet** — practice via Ch25/Ch48's own exercises instead             |
| Mentorship program design                                                                 | 10                   | **No artifact yet** — write your own using the RFC template as a structural guide           |
| Cost optimization initiative                                                              | 8, 11                | **No artifact yet** — Ch62's SLO/error-budget section (planned) gives you the math for one  |
| [`45_AI_Agents_MCP_And_Playwright.md`](../07_Specialised_Testing/45_AI_Agents_MCP_And_Playwright.md) §6/§6.1 (self-healing locators) | 12 | Real — both the LLM-based offline approach and a from-scratch runtime similarity-scoring mechanism, verified against Healenium's real documented approach |

---

## Scoring Guide

### Rating Yourself

For each competency, assign a number: Junior=1, Mid=2, Senior=3, Staff=4, Principal=5.

**Principal SDET Target Profile**:

- Total score: 48+ out of 60
- Minimum of 8 competencies rated 4 or 5
- No competency rated below 3

**Staff SDET Target Profile**:

- Total score: 40+ out of 60
- Minimum of 6 competencies rated 4 or 5
- No competency rated below 3

**Senior SDET Target Profile**:

- Total score: 32+ out of 60
- Minimum of 8 competencies rated 3 or above
- No competency rated below 2

### Action Plan Template

```markdown
### Q3 Growth Plan

**Focus Competency**: 5. CI/CD & Test Infrastructure
**Current Level**: Senior (3)
**Target Level**: Staff (4)
**Evidence Goal**: Design and ship self-service GitHub Actions reusable workflow for 5+ teams
**Milestone 1 (Week 2)**: Audit current CI setup across teams
**Milestone 2 (Week 4)**: Design reusable workflow with matrix sharding
**Milestone 3 (Week 8)**: Pilot with 2 teams, gather feedback
**Milestone 4 (Week 12)**: GA rollout to 5+ teams, measure adoption and cost delta
**Reviewer**: Staff/Principal engineer for calibration
```

### Calibration Tips

1. **Beware Dunning-Kruger**: Most people overrate themselves at Senior and underrate at Principal. Ask for external calibration.
2. **Evidence Over Confidence**: If you cannot point to a concrete artifact or system, you are not at that level.
3. **Scope Matters**: Staff-level impact is cross-team. Principal-level impact is cross-org or industry-wide.
4. **Teaching Is Required**: To claim Senior+, you must have taught someone else to do what you do.
5. **Revisit Annually**: The industry moves fast. A Principal in 2024 needed Kubernetes knowledge; in 2026, AI-assisted testing is table stakes.
