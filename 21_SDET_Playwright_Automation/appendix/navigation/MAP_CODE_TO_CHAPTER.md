# Map — Framework code → chapter that teaches it

Reverse lookup. You're reading a file under [`framework/`](../../framework/) and want to know which chapter explains _why_ the code looks the way it does.

Format: file path → chapter(s) → one-line "what it demonstrates". `P1`–`P10` refer to the Principal SDET Extension (file numbers 60–69 in `05_Advanced_Topics/`).

> All paths below are relative to the module root.

---

## Configuration & infrastructure

| File                                                                                                               | Chapter(s)                                                                                                                                                                | What it demonstrates                                                                              |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [`framework/playwright.config.ts`](../../framework/playwright.config.ts)                                               | Ch09, Ch56 ([tutorial](../../01_Foundations/56_Playwright_Config_Deep_Dive.md)), Ch57 ([theory catalog](../../01_Foundations/56_Playwright_Config_Deep_Dive.md)) | Every config field with intent: projects, reporters, shard, retries, timeouts, trace, devices.    |
| [`framework/tsconfig.json`](../../framework/tsconfig.json)                                                             | Ch31 (TS for Tests), Ch36 (TS Mastery)                                                                                                                                    | Strict TS for tests: `noUncheckedIndexedAccess`, path aliases, project includes.                  |
| [`framework/config/env.loader.ts`](../../framework/config/env.loader.ts)                                               | Ch21 (Enterprise Project Structure), Ch28 (Test Data Lifecycle)                                                                                                           | Fail-fast env-var loader with `requireEnv` / `optionalEnv` / `boolEnv` / `numberEnv`.             |
| [`framework/Dockerfile`](../../framework/Dockerfile), [`framework/docker-compose.yml`](../../framework/docker-compose.yml) | Ch59 (Docker for Playwright)                                                                                                                                              | MCR base image, non-root user, shm_size, env injection.                                           |
| [`framework/.github/workflows/ci.yml`](../../framework/.github/workflows/ci.yml)                                       | Ch25 (CI/CD Integration), Ch48 (Sharding)                                                                                                                                 | Lint + typecheck + 3-shard test matrix + report merge + artifact upload.                          |
| [`framework/.github/workflows/nightly.yml`](../../framework/.github/workflows/nightly.yml)                             | Ch29 (Visual Regression), Ch37 (Performance), Ch39 (Accessibility)                                                                                                        | Nightly visual + perf + a11y jobs.                                                                |
| [`framework/.eslintrc.cjs`](../../framework/.eslintrc.cjs)                                                             | Ch63 (Static Analysis), Ch26 (Flakiness), Ch36 (TS Mastery)                                                                                                               | Bans wait-for-timeout, focused tests, networkidle; type-aware rules; external-boundary overrides. |
| [`framework/.husky/`](../../framework/.husky/)                                                                         | Ch63 (Static Analysis), Ch25 (CI/CD)                                                                                                                                      | Pre-commit (lint-staged → prettier+eslint) + commit-msg (Conventional Commits validator).         |
| [`framework/CONTRIBUTING.md`](../../framework/CONTRIBUTING.md)                                                         | P6 (ADRs / Test Strategy)                                                                                                                                                 | Branching, commit format, code style, PR process, ADR contribution flow.                          |
| [`framework/docs/adrs/`](../../framework/docs/adrs/)                                                                   | P6 (Architecture Decision Records)                                                                                                                                        | ADR template + ADR-001 (why Playwright).                                                          |

---

## Fixtures (test lifecycle, isolation, auth)

| File                                                                                     | Chapter(s)                                                                                                     | What it demonstrates                                                                                                                                                          |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`framework/fixtures/page.fixture.ts`](../../framework/fixtures/page.fixture.ts)             | Ch06 (Custom Fixtures), Ch07 (E2E Architecture)                                                                | Base extension wiring POMs, API clients, bridge, pooled account into test scope.                                                                                              |
| [`framework/fixtures/auth.fixture.ts`](../../framework/fixtures/auth.fixture.ts)             | Ch06 (Custom Fixtures), Ch16 (Pattern 6: storageState chaining), Ch57 (Auth Taxonomy), P7 (PII / Multi-tenant) | **File-locked account pool** for parallel-safe auth across worker processes — uses `proper-lockfile` because in-memory locks don't coordinate across `--workers=N` processes. |
| [`framework/fixtures/auth.oauth.fixture.ts`](../../framework/fixtures/auth.oauth.fixture.ts) | Ch57 (Auth Taxonomy — OAuth2 client credentials), Ch14 (Token & magic-link pattern)                            | Worker-scoped OAuth 2.0 client-credentials token fetch with fail-fast env validation.                                                                                         |
| [`framework/fixtures/api.fixture.ts`](../../framework/fixtures/api.fixture.ts)               | Ch06 (Custom Fixtures), Ch23 (APIUtils library), Ch44 (Enterprise API Client)                                  | Worker-scoped `APIRequestContext` + test-scoped typed clients (`<TestFixtures, WorkerFixtures>` split).                                                                       |
| [`framework/fixtures/orangehrm.fixture.ts`](../../framework/fixtures/orangehrm.fixture.ts)   | Ch06, Ch24 (Test Script Architecture), Ch28 (Test Data Lifecycle)                                              | Full POM set + `testEmployee` auto-fixture with setup/teardown via `generateEmployeeData`.                                                                                    |
| [`framework/fixtures/index.ts`](../../framework/fixtures/index.ts)                           | Ch21 (Enterprise Project Structure)                                                                            | Barrel export — single import surface for consumers.                                                                                                                          |

---

## API client (the 5-layer architecture)

| File                                                                                       | Chapter(s)                                                                                   | What it demonstrates                                                                                                  |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [`framework/utilities/api/APIUtils.ts`](../../framework/utilities/api/APIUtils.ts)             | Ch23 (APIUtils HTTP Library)                                                                 | **Layer 1** — thin wrapper over `APIRequestContext` with logging and assertion sugar.                                 |
| [`framework/utilities/api/ApiCore.ts`](../../framework/utilities/api/ApiCore.ts)               | Ch23, Ch44 (Enterprise API Client), Ch26 (Flakiness: retries), P10 (Observability for Tests) | **Layer 2** — exponential-backoff retry with jitter, typed error hierarchy, OTel span emission.                       |
| [`framework/utilities/api/HeadersBuilder.ts`](../../framework/utilities/api/HeadersBuilder.ts) | Ch22 (Headers/Payloads/Endpoints Factory), Ch44                                              | **Layer 3** — fluent header builder (auth, correlation-id, content-type, custom).                                     |
| [`framework/utilities/api/Endpoints.ts`](../../framework/utilities/api/Endpoints.ts)           | Ch22                                                                                         | **Layer 4** — typed endpoint constants, URL assembly.                                                                 |
| [`framework/utilities/api/errors.ts`](../../framework/utilities/api/errors.ts)                 | Ch23, Ch26 (Flakiness diagnosis)                                                             | Typed error hierarchy: `BadRequestError`, `Unauthorized`, `NotFound`, `RateLimit`, `Server`, `Validation`, `Network`. |
| [`framework/utilities/api/telemetry.ts`](../../framework/utilities/api/telemetry.ts)           | P10 (Observability for Tests)                                                                | OTel tracer with graceful degradation when `@opentelemetry/api` is absent.                                            |
| [`framework/clients/UsersClient.ts`](../../framework/clients/UsersClient.ts)                   | Ch44, Ch23                                                                                   | **Layer 5** — domain client with response validation (`assertString`, `assertObject`).                                |
| [`framework/clients/ResourcesClient.ts`](../../framework/clients/ResourcesClient.ts)           | Ch44, Ch23                                                                                   | Same pattern — second domain client showing it's reusable.                                                            |

---

## Test data & state

| File                                                                                             | Chapter(s)                                                                          | What it demonstrates                                                              |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`framework/utilities/data/test-data.bridge.ts`](../../framework/utilities/data/test-data.bridge.ts) | Ch24 (Test Script Architecture), Ch28 (Test Data Lifecycle), P9 (Chaos Engineering) | Typed key/value bridge passing data across test steps with enum-keyed safety.     |
| [`framework/utilities/data/employee.factory.ts`](../../framework/utilities/data/employee.factory.ts) | Ch28 (Test Data Lifecycle), P7 (PII Masking)                                        | Factory with timestamp + random suffix for parallel-safe uniqueness.              |
| [`framework/utilities/data/data.loader.ts`](../../framework/utilities/data/data.loader.ts)           | Ch28                                                                                | JSON loader with fail-fast on missing files; `uniqueEmail`/`uniqueId` generators. |
| [`framework/types/api.types.ts`](../../framework/types/api.types.ts)                                 | Ch31 (Advanced TS), Ch36 (TS Mastery)                                               | Discriminated unions, `as const`, response shape typing.                          |
| [`framework/types/user.types.ts`](../../framework/types/user.types.ts)                               | Ch31, Ch36                                                                          | `UserRole` / `UserStatus` enums; `PooledAccount` extends `UserData`.              |

---

## Page objects & components (Mega POM)

| File                                                                                                         | Chapter(s)                                          | What it demonstrates                                                                              |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [`framework/pages/OrangeHRMBasePage.ts`](../../framework/pages/OrangeHRMBasePage.ts)                             | Ch05 (POM Architecture), Ch18 (Mega POM)            | Abstract base with `header`, `sideMenu`, `spinner`; `navigate`/`expectLoaded` contracts.          |
| [`framework/pages/login/LoginPage.ts`](../../framework/pages/login/LoginPage.ts)                                 | Ch05, Ch07 (E2E Architecture)                       | Feature page with `loginWith()`, `expectInvalidCredentials()`, `expectRequiredFieldErrors()`.     |
| [`framework/pages/dashboard/DashboardPage.ts`](../../framework/pages/dashboard/DashboardPage.ts)                 | Ch05, Ch18                                          | 7 widget locators + `expectAllWidgetsVisible` with soft assertions.                               |
| [`framework/pages/pim/EmployeeListPage.ts`](../../framework/pages/pim/EmployeeListPage.ts)                       | Ch18 (Mega POM splitting), Ch52 (Component Testing) | Composition pattern — delegates to `EmployeeSearchForm` + `EmployeeResultsGrid`.                  |
| [`framework/pages/pim/AddEmployeePage.ts`](../../framework/pages/pim/AddEmployeePage.ts)                         | Ch05, Ch07                                          | Form-heavy POM with `fillEmployeeDetails`, `setLoginCredentials`, redirect-URL assertion on save. |
| [`framework/pages/pim/EmployeePersonalDetailsPage.ts`](../../framework/pages/pim/EmployeePersonalDetailsPage.ts) | Ch05, Ch15 (Cross-site Pattern 5: UI–API)           | `navigateForEmployee(id)` shows that pages with required input need a parameterized navigate.     |
| [`framework/pages/leave/LeaveListPage.ts`](../../framework/pages/leave/LeaveListPage.ts)                         | Ch05, Ch18                                          | Date-range search form with `applyLeaveByDateRange`.                                              |
| [`framework/components/common/HeaderNav.ts`](../../framework/components/common/HeaderNav.ts)                     | Ch18 (Mega POM Components)                          | Reusable header component injected into every feature page.                                       |
| [`framework/components/common/SideMenu.ts`](../../framework/components/common/SideMenu.ts)                       | Ch18                                                | `navigateTo(module)` — single nav surface.                                                        |
| [`framework/components/pim/EmployeeSearchForm.ts`](../../framework/components/pim/EmployeeSearchForm.ts)         | Ch18, Ch52                                          | Search form component with `searchByName`, `searchById`, `reset`.                                 |
| [`framework/components/pim/EmployeeResultsGrid.ts`](../../framework/components/pim/EmployeeResultsGrid.ts)       | Ch18, Ch52                                          | Grid component with `getRecordsCount`, `editFirstRecord`, `deleteFirstRecord`, `confirmDeletion`. |
| [`framework/websites/orangehrm/pages/`](../../framework/websites/orangehrm/pages/)                               | Ch21 (Enterprise Project Structure)                 | Per-website layout — proves the structure scales to multi-product test suites.                    |

---

## Helpers, utilities, custom matchers

| File                                                                                                           | Chapter(s)                      | What it demonstrates                                                                                                           |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [`framework/utilities/helpers/action.helpers.ts`](../../framework/utilities/helpers/action.helpers.ts)             | Ch05, Ch26                      | `clickElement`, `fillInput`, `selectOption`, `waitForVisible`, `isVisibleSafe`, `safeNavigate` — wrapped actions with logging. |
| [`framework/utilities/helpers/file.helpers.ts`](../../framework/utilities/helpers/file.helpers.ts)                 | Ch58 (File Uploads/Downloads)   | `uploadFile`, `uploadBuffer`, `triggerDownload`, CSV parsing, DataTransfer creation, BOM-stripping.                            |
| [`framework/utilities/auth/totp.helper.ts`](../../framework/utilities/auth/totp.helper.ts)                         | Ch57 (Auth Taxonomy — MFA TOTP) | Time-based one-time password generation via `otplib`.                                                                          |
| [`framework/utilities/matchers/to-be-readable-to.ts`](../../framework/utilities/matchers/to-be-readable-to.ts)     | Ch39 (Accessibility)            | Custom matcher: WCAG AA contrast ratio + font size check.                                                                      |
| [`framework/utilities/matchers/to-respond-within.ts`](../../framework/utilities/matchers/to-respond-within.ts)     | Ch37 (Performance), Ch26        | Custom matcher: response time + status assertion.                                                                              |
| [`framework/utilities/matchers/to-match-schema-zod.ts`](../../framework/utilities/matchers/to-match-schema-zod.ts) | Ch23, Ch38 (Contract Testing)   | Custom matcher: validate response against Zod schema.                                                                          |
| [`framework/utilities/matchers/index.ts`](../../framework/utilities/matchers/index.ts)                             | Ch36 (TS Mastery)               | `expect.extend` registration with `declare global` namespace augmentation.                                                     |

---

## Test analytics, visual, a11y, perf

| File                                                                                                 | Chapter(s)                            | What it demonstrates                                                            |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------- |
| [`framework/utilities/analytics/cli.ts`](../../framework/utilities/analytics/cli.ts)                     | P1 (Test Analytics & Flake Detection) | CLI: `--insert` JSON report, `--flake-report --since 7d`, `--slowest`.          |
| [`framework/utilities/analytics/report-parser.ts`](../../framework/utilities/analytics/report-parser.ts) | P1                                    | Recursive Playwright JSON report parser → `TestResult[]`.                       |
| [`framework/utilities/analytics/trend-store.ts`](../../framework/utilities/analytics/trend-store.ts)     | P1                                    | SQLite-style trend store with `queryFlakeRate`, `querySlowestTests`.            |
| [`framework/visual/config.ts`](../../framework/visual/config.ts)                                         | Ch29 (Visual Regression)              | `maxDiffPixels`, `maskRegions` for dynamic content.                             |
| [`framework/visual/helpers.ts`](../../framework/visual/helpers.ts)                                       | Ch29                                  | `maskDynamicElements`, `buildScreenshotOptions`.                                |
| [`framework/a11y/runner.ts`](../../framework/a11y/runner.ts)                                             | Ch39 (Accessibility)                  | `runAxe(page, { tags })` + `assertNoViolations` with detailed violation report. |
| [`framework/perf/budgets.ts`](../../framework/perf/budgets.ts)                                           | Ch37 (Performance)                    | Per-page performance budgets (FCP, LCP, TTFB).                                  |
| [`framework/perf/helpers.ts`](../../framework/perf/helpers.ts)                                           | Ch37                                  | `measurePageLoad`, `assertWithinBudget` via Navigation Timing API.              |

---

## Constants

| File                                                                             | Chapter(s) | What it demonstrates                                          |
| -------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------- |
| [`framework/constants/app.constants.ts`](../../framework/constants/app.constants.ts) | Ch21       | HTTP status codes as named constants; feature flags.          |
| [`framework/constants/endpoints.ts`](../../framework/constants/endpoints.ts)         | Ch22       | URL constants for OrangeHRM + Reqres APIs.                    |
| [`framework/constants/timeouts.ts`](../../framework/constants/timeouts.ts)           | Ch26       | Named timeout enum (`Timeouts.TEN_SECONDS`); `PollIntervals`. |
| [`framework/constants/messages.ts`](../../framework/constants/messages.ts)           | Ch21       | User-visible strings for assertions.                          |

---

## Specs (read these last — they demonstrate the whole stack)

| Spec                                                                                                         | Chapter(s)                                  | What it demonstrates                                                                         |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [`framework/tests/orangehrm/login.spec.ts`](../../framework/tests/orangehrm/login.spec.ts)                       | Ch07 (E2E Architecture)                     | Smoke + negative path tests using `LoginPage` fixture.                                       |
| [`framework/tests/orangehrm/dashboard.smoke.spec.ts`](../../framework/tests/orangehrm/dashboard.smoke.spec.ts)   | Ch07                                        | Widget visibility, quick-launch nav — pure smoke.                                            |
| [`framework/tests/orangehrm/employee.crud.spec.ts`](../../framework/tests/orangehrm/employee.crud.spec.ts)       | Ch07, Ch24 (Test Script Architecture), Ch28 | Cross-test data sharing via module-level state — note the anti-pattern caveat in Ch26.       |
| [`framework/tests/orangehrm/leave.workflow.spec.ts`](../../framework/tests/orangehrm/leave.workflow.spec.ts)     | Ch07, Ch24                                  | Multi-step workflow with `TestDataBridge`.                                                   |
| [`framework/tests/orangehrm/pim.search.spec.ts`](../../framework/tests/orangehrm/pim.search.spec.ts)             | Ch18 (Mega POM)                             | Search component composition test.                                                           |
| [`framework/tests/api/users.api.spec.ts`](../../framework/tests/api/users.api.spec.ts)                           | Ch44, Ch23                                  | List, get-by-id, create, update, patch, delete via typed client.                             |
| [`framework/tests/api/error-handling.api.spec.ts`](../../framework/tests/api/error-handling.api.spec.ts)         | Ch44, Ch26                                  | Exercises the typed error hierarchy.                                                         |
| [`framework/tests/api/retry.api.spec.ts`](../../framework/tests/api/retry.api.spec.ts)                           | Ch44, Ch26                                  | Mock APIRequestContext to assert retry-with-backoff behaviour.                               |
| [`framework/tests/auth-demo/oauth.api.spec.ts`](../../framework/tests/auth-demo/oauth.api.spec.ts)               | Ch57                                        | OAuth client-credentials token fetch demo.                                                   |
| [`framework/tests/file-io/upload-download.spec.ts`](../../framework/tests/file-io/upload-download.spec.ts)       | Ch58                                        | `setInputFiles`, download event, CSV assertion.                                              |
| [`framework/visual/tests/visual/login.visual.spec.ts`](../../framework/visual/tests/visual/login.visual.spec.ts) | Ch29                                        | `toHaveScreenshot` baseline + mask pattern.                                                  |
| [`framework/a11y/tests/a11y/login.a11y.spec.ts`](../../framework/a11y/tests/a11y/login.a11y.spec.ts)             | Ch39                                        | `runAxe` + `assertNoViolations`.                                                             |
| [`framework/perf/tests/perf/login.perf.spec.ts`](../../framework/perf/tests/perf/login.perf.spec.ts)             | Ch37                                        | FCP/LCP/TTFB budget assertion.                                                               |
| [`framework/tests/broken/`](../../framework/tests/broken/)                                                       | Ch26 (Flakiness — Hall of Shame)            | **10 anti-pattern demos** — excluded from CI; for study only. **Don't copy these patterns.** |

---

## Going the other way

If you want **chapter → code**, use [`00_INDEX.md`](../../00_INDEX.md) — each chapter row already cross-references `framework/`. Or open the chapter and look for "Hands-on exercise" sections.
