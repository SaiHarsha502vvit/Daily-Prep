# Playwright TS Enterprise Framework

A runnable, opinionated Playwright + TypeScript starter that demonstrates the **Seven Laws** taught in this module — production-grade structure you can actually `npm install && npx playwright test`.

> **First time?** Open [`CONTRIBUTING.md`](./CONTRIBUTING.md) for setup, then come back here for the map.

## Why this exists

The chapters explain the patterns. This folder _is_ the patterns. Every law has at least one file that proves it. Every module (visual, a11y, perf, analytics, telemetry, matchers) has a working reference impl you can copy-paste into a real project.

## The Seven Laws (re-stated as code locations)

| Law                                  | What it means                                                                 | Where to look                                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1. Tests describe behavior only      | No locators, data, or URLs in spec files                                      | [tests/orangehrm/login.spec.ts](tests/orangehrm/login.spec.ts)                               |
| 2. Nothing is hardcoded              | URLs from `env.loader`, data from JSON, timeouts from enum                    | [config/env.loader.ts](config/env.loader.ts), [constants/timeouts.ts](constants/timeouts.ts) |
| 3. Every layer uses the layer below  | Tests → POMs → Utilities → Config; API: Client → ApiCore → APIUtils → request | Folder structure itself                                                                      |
| 4. Every action wrapped with logging | `clickElement(locator, { description })` not raw `.click()`                   | [utilities/helpers/action.helpers.ts](utilities/helpers/action.helpers.ts)                   |
| 5. Parallel safety                   | File-locked account pool — workers never collide                              | [fixtures/auth.fixture.ts](fixtures/auth.fixture.ts)                                         |
| 6. UI + API cross-validation         | Spec asserts what user sees AND what backend stored                           | [tests/orangehrm/employee.crud.spec.ts](tests/orangehrm/employee.crud.spec.ts)               |
| 7. TypeScript strict everywhere      | No `any` in framework code, every response typed                              | [types/api.types.ts](types/api.types.ts), [tsconfig.json](tsconfig.json)                     |

## Folder map (current)

```
framework/
├── .github/workflows/         ← ci.yml (multi-OS matrix), nightly.yml,
│                                 pr.yml, gitleaks.yml
├── .husky/                    ← pre-commit (lint-staged) + commit-msg
│                                 (POSIX Conventional Commits validator)
├── docs/adrs/                 ← architecture decision records
│   ├── adr-template.md
│   └── ADR-001-why-playwright.md
├── config/
│   └── env.loader.ts          ← reads .env, validates, exports typed config
├── constants/
│   ├── app.constants.ts       ← feature flags, HTTP status codes
│   ├── endpoints.ts           ← all API endpoints assembled from envConfig
│   ├── messages.ts            ← user-visible strings (assertions reference these)
│   └── timeouts.ts            ← Timeouts enum + PollIntervals
├── clients/                   ← Layer 5 — domain API clients
│   ├── UsersClient.ts         ← reqres.in /users CRUD with response validation
│   └── ResourcesClient.ts     ← reqres.in /resources read patterns
├── components/                ← Component POMs (Mega-POM split, Ch18)
│   ├── common/                ← HeaderNav, SideMenu
│   └── pim/                   ← EmployeeSearchForm, EmployeeResultsGrid
├── fixtures/
│   ├── auth.fixture.ts        ← file-based account pool locking
│   ├── auth.oauth.fixture.ts  ← OAuth2 client-credentials token cache
│   ├── api.fixture.ts         ← worker-scoped APIRequestContext + clients
│   ├── orangehrm.fixture.ts   ← composed POM set + testEmployee auto-fixture
│   ├── page.fixture.ts        ← extends base test with POMs + bridge
│   └── index.ts               ← barrel export
├── pages/                     ← Feature POMs (top of the hierarchy)
│   ├── OrangeHRMBasePage.ts   ← abstract base (navigate/expectLoaded)
│   ├── login/LoginPage.ts
│   ├── dashboard/DashboardPage.ts
│   ├── leave/LeaveListPage.ts
│   └── pim/                   ← AddEmployeePage, EmployeeListPage,
│                                 EmployeePersonalDetailsPage
├── tests/
│   ├── orangehrm/             ← UI smoke + regression + workflow specs
│   ├── api/                   ← Users/Resources CRUD, error taxonomy, retry
│   ├── auth-demo/             ← OAuth fixture smoke
│   ├── file-io/               ← Upload/download via setInputFiles + events
│   └── broken/                ← 10 intentional anti-patterns (excluded from
│                                 CI, study only — do NOT copy these)
├── test-data/
│   └── orangehrm/credentials.json
├── types/
│   ├── api.types.ts           ← typed reqres.in responses + request payloads
│   ├── user.types.ts          ← UserData, UserRole enum, PooledAccount
│   └── lockfile.d.ts          ← proper-lockfile module declaration
├── utilities/
│   ├── api/                   ← The 5-layer API client architecture
│   │   ├── APIUtils.ts        ← L1 — request wrapper, logging
│   │   ├── ApiCore.ts         ← L2 — retry+backoff, typed errors, OTel spans
│   │   ├── HeadersBuilder.ts  ← L3 — fluent header construction
│   │   ├── Endpoints.ts       ← L4 — typed URL assembly
│   │   ├── errors.ts          ← typed error hierarchy
│   │   ├── telemetry.ts       ← OpenTelemetry tracer (no-op without SDK)
│   │   └── TELEMETRY_README.md
│   ├── auth/totp.helper.ts    ← TOTP code generation for MFA tests
│   ├── data/
│   │   ├── data.loader.ts
│   │   ├── employee.factory.ts
│   │   └── test-data.bridge.ts
│   ├── helpers/
│   │   ├── action.helpers.ts  ← clickElement, fillInput, selectOption, etc.
│   │   └── file.helpers.ts    ← setInputFiles, download trigger, CSV parser
│   ├── matchers/              ← Custom expect-extensions
│   │   ├── to-be-readable-to.ts    ← WCAG AA contrast + font size
│   │   ├── to-respond-within.ts    ← API response-time budget
│   │   ├── to-match-schema-zod.ts  ← Zod schema response validation
│   │   └── index.ts                ← registerCustomMatchers()
│   └── analytics/             ← Test-trend analytics CLI
│       ├── cli.ts             ← --insert / --flake-report / --slowest
│       ├── report-parser.ts   ← Playwright JSON → TestResult[]
│       └── trend-store.ts     ← in-memory store with flake-rate queries
├── visual/                    ← Visual-regression module
│   ├── config.ts              ← maxDiffPixels, masked regions
│   ├── helpers.ts             ← maskDynamicElements, buildScreenshotOptions
│   └── tests/visual/login.visual.spec.ts
├── a11y/                      ← Accessibility module
│   ├── runner.ts              ← runAxe(page, { tags }) + assertNoViolations
│   └── tests/a11y/login.a11y.spec.ts
├── perf/                      ← Performance module
│   ├── budgets.ts             ← per-page FCP/LCP/TTFB thresholds
│   ├── helpers.ts             ← measurePageLoad via Navigation Timing API
│   └── tests/perf/login.perf.spec.ts
├── websites/orangehrm/pages/  ← per-product POM layout (Ch21)
├── scripts/ci-env-check.js    ← fail-fast env validation in CI
├── .env.example               ← every key documented; required keys flagged
├── .env.ci                    ← CI-specific overrides
├── .eslintrc.cjs              ← strict TS rules + Playwright + import-order
├── .prettierrc.json
├── .prettierignore
├── .gitleaks.toml             ← secret-scan allowlist for demo creds
├── CONTRIBUTING.md            ← setup, conventions, PR process
├── Dockerfile                 ← MCR playwright image, non-root user
├── docker-compose.yml         ← sharding-ready compose service
├── package.json
├── playwright.config.ts       ← projects: orangehrm | api | firefox-ci |
│                                 file-io | mobile-chromium
└── tsconfig.json              ← strict + noUncheckedIndexedAccess
```

## Quick start

```bash
cd 21_SDET_Playwright_Automation/framework
cp .env.example .env            # then fill in any missing keys
npm install
npx playwright install --with-deps
npm run verify                  # lint + typecheck
npm run test:smoke              # 7 OrangeHRM smoke tests, ~30s
```

## Scripts

### Daily-use

| Command                                     | What it does                                                          |
| ------------------------------------------- | --------------------------------------------------------------------- |
| `npm run verify`                            | Lint + typecheck — run before pushing                                 |
| `npm run test`                              | All projects (orangehrm + api + file-io + firefox-ci)                 |
| `npm run test:smoke`                        | `@smoke`-tagged tests only                                            |
| `npm run test:regression`                   | `@regression`-tagged tests only                                       |
| `npm run test:orangehrm`                    | Only the OrangeHRM project                                            |
| `npm run test:api`                          | Only the API project (auto-skips reqres specs without REQRES_API_KEY) |
| `npm run test:ui`                           | Playwright UI mode — time-travel debugging                            |
| `npm run test:debug`                        | Inspector / step-through                                              |
| `npm run test:headed`                       | Tests with browser visible                                            |
| `npm run report`                            | Open last HTML report                                                 |
| `npm run lint` / `lint:fix` / `lint:strict` | ESLint variants                                                       |
| `npm run format` / `format:check`           | Prettier write / verify                                               |
| `npm run typecheck`                         | `tsc --noEmit`                                                        |

### Per-project

```bash
npx playwright test --project=mobile-chromium      # Pixel 5 viewport
npx playwright test --project=firefox-ci           # @cross-browser tests
ALLURE=1 npm test                                  # write allure-results/
```

### Analytics CLI

```bash
npm run flake:insert -- --report ./test-results/results.json
npm run flake:report --since 7d
npm run flake:slowest --limit 10
```

### Capstones

```bash
npm run capstone:c1            # Flaky-Test Detector CLI tests
npm run capstone:c2            # Custom HTML Reporter tests
npm run capstone:c3:dev        # Test Analytics Dashboard dev server
```

### Reporting

```bash
npm run report                 # last Playwright HTML report
npm run report:allure          # needs ALLURE=1 env on the test run
```

### Docker

```bash
npm run test:docker:build
npm run test:docker            # runs the suite in the MCR Playwright image
```

## Environment variables

Copy `.env.example` to `.env` and fill in:

```
ENV=local
ORANGEHRM_BASE_URL=https://opensource-demo.orangehrmlive.com
API_BASE_URL=https://reqres.in
REQRES_API_KEY=                # optional; specs auto-skip without it
LOG_API_STEPS=true
LOG_ACTIONS=false
HEADLESS=true
DEFAULT_TIMEOUT_MS=30000
```

Missing required vars cause **fail-fast** at startup (see [`config/env.loader.ts`](config/env.loader.ts)) — you find out at boot, not 20 minutes into a test run.

## CI / Reporting

- **CI workflow** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)): lint + typecheck + sharded test matrix on Ubuntu (3 shards) + single-shard cross-platform smoke on macOS + Windows.
- **Nightly workflow** ([`.github/workflows/nightly.yml`](.github/workflows/nightly.yml)): visual + a11y + perf jobs.
- **PR workflow** ([`.github/workflows/pr.yml`](.github/workflows/pr.yml)): changed-only tests.
- **Gitleaks workflow** ([`.github/workflows/gitleaks.yml`](.github/workflows/gitleaks.yml)): secret scan on every PR; allowlist in [`.gitleaks.toml`](./.gitleaks.toml).
- **Reporters**: list + HTML + JUnit + JSON (always). Allure conditional on `ALLURE=1`.
- **Traces**: `on-first-retry`. **Screenshots**: `only-on-failure`. **Video**: `retain-on-failure`.

## Observability (OpenTelemetry)

`utilities/api/ApiCore.ts` emits OTel spans for every outbound HTTP call and propagates trace context via headers. No exporter is wired by default — set up a local Jaeger / OTLP collector to see traces. See [`utilities/api/TELEMETRY_README.md`](utilities/api/TELEMETRY_README.md) and chapter Ch69 (P10).

## Custom matchers

Three `expect.extend` matchers in [`utilities/matchers/`](utilities/matchers/):

```typescript
await expect(locator).toBeReadableTo(); // WCAG AA contrast + font ≥ 12px
await expect(apiResponse).toRespondWithin(500); // 200 OK in ≤500ms
await expect(json).toMatchSchemaZod(UserSchema); // Zod schema validation
```

Register them via `registerCustomMatchers()` in a global-setup file or test fixture.

## Known limitations

| Issue                                                    | Reason                                                                        | Workaround                                                                                |
| -------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 2 `@smoke` specs marked `test.fixme`                     | OrangeHRM open-source demo doesn't reliably persist custom Employee Id values | Un-fixme when running against a real OrangeHRM instance you own                           |
| All reqres-based API specs skip without `REQRES_API_KEY` | reqres.in introduced mandatory auth in mid-2024                               | Get a free key from app.reqres.in/api-keys; set REQRES_API_KEY                            |
| Allure deps installed but reporter opt-in only           | Keeps local runs lean                                                         | `ALLURE=1 npm test`                                                                       |
| Visual baselines not committed                           | First-run captures them                                                       | `npx playwright test --project=visual --update-snapshots` (once you've added the project) |

## What to build on top

When you finish a chapter, come back here and add the file the chapter demonstrates. Examples:

- Finished Ch13 (Dual Browser Contexts) → add `fixtures/dual-context.fixture.ts`
- Finished Ch44 (Enterprise API Client) → extend `utilities/api/` with your domain client
- Finished Ch46 (BDD with Cucumber) → add `features/` + `step-definitions/`
- Finished Ch52 (Component Testing) → add `tests/ct/` per Playwright CT setup
- Finished Ch68 (Chaos Engineering) → add `chaos/` with `page.route()` degradation specs
- Finished Ch69 (Observability) → wire an OTel exporter (Jaeger, Tempo, or OTLP)

The framework grows as you learn. That's the point.

## What this framework deliberately does NOT include

- Real production credentials → use `.env`, never commit. The Husky `commit-msg` hook + gitleaks workflow catch the obvious mistakes.
- Microsoft Dynamics 365 specifics → those go in `websites/admin/` once you're on a D365 site (covered in Chapters 10–17).
- Native mobile testing (Appium) → out of scope; the `mobile-chromium` project is browser-mobile viewport emulation only. See `23_Mobile_Dev_And_Testing/` for native.
- BDD layer → add Cucumber per Ch46.

Keep the core skinny. Add when a chapter asks for it.
