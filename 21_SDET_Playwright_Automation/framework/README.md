# Playwright TS Enterprise Framework

A runnable, opinionated Playwright + TypeScript starter that demonstrates the **Seven Laws** taught in this module — production-grade structure you can actually `npm install && npx playwright test`.

## Why this exists

The chapters explain the patterns. This folder *is* the patterns. Every law has at least one file that proves it.

## The Seven Laws (re-stated as code locations)

| Law | What it means | Where to look |
|---|---|---|
| 1. Tests describe behavior only | No locators, data, or URLs in spec files | [tests/orangehrm/login.spec.ts](tests/orangehrm/login.spec.ts) |
| 2. Nothing is hardcoded | URLs from `env.loader`, data from JSON, timeouts from enum | [config/env.loader.ts](config/env.loader.ts), [constants/timeouts.ts](constants/timeouts.ts) |
| 3. Every layer uses the layer below | Tests → POMs → Utilities → Config | Folder structure itself |
| 4. Every action wrapped with logging | `clickElement(locator, { description })` not raw `.click()` | [utilities/helpers/action.helpers.ts](utilities/helpers/action.helpers.ts) |
| 5. Parallel safety | File-locked account pool — workers never collide | [fixtures/auth.fixture.ts](fixtures/auth.fixture.ts) |
| 6. UI + API cross-validation | Spec asserts what user sees AND what backend stored | [tests/orangehrm/login.spec.ts](tests/orangehrm/login.spec.ts) (extend pattern) |
| 7. TypeScript strict everywhere | No `any`, every response typed | [types/](types/) |

## Folder map

```
framework/
├── config/
│   └── env.loader.ts          ← reads .env, validates, exports typed config
├── constants/
│   ├── app.constants.ts       ← feature flags, HTTP status codes
│   ├── endpoints.ts           ← all API endpoints assembled from envConfig
│   ├── messages.ts            ← user-visible strings (assertions reference these)
│   └── timeouts.ts            ← Timeouts enum
├── fixtures/
│   ├── auth.fixture.ts        ← file-based account pool locking
│   └── page.fixture.ts        ← extends base test with POMs
├── tests/
│   └── orangehrm/
│       └── login.spec.ts      ← happy + negative path
├── test-data/
│   └── orangehrm/
│       └── credentials.json   ← no test data inside spec files
├── types/
│   ├── api.types.ts           ← ApiResponse<T>, PaginationMeta
│   └── user.types.ts          ← UserData, UserRole enum
├── utilities/
│   ├── api/
│   │   └── APIUtils.ts        ← typed HTTP wrapper with logging
│   ├── data/
│   │   ├── data.loader.ts     ← loadTestData<T>('orangehrm/credentials')
│   │   └── test-data.bridge.ts ← cross-step data bridge
│   └── helpers/
│       └── action.helpers.ts  ← clickElement, fillInput, selectOption
├── websites/
│   └── orangehrm/
│       └── pages/
│           ├── LoginPage.ts
│           └── DashboardPage.ts
├── .env.example
├── .gitignore
├── package.json
├── playwright.config.ts
└── tsconfig.json
```

## Quick start

```bash
cd 21_SDET_Playwright_Automation/framework
cp .env.example .env
npm install
npx playwright install --with-deps
npm run test
```

## Scripts

| Command | What it does |
|---|---|
| `npm run test` | All tests, headless |
| `npm run test:headed` | All tests with browser visible |
| `npm run test:ui` | Playwright UI mode — time-travel debugging |
| `npm run test:debug` | Inspector / step-through |
| `npm run test:orangehrm` | Only the OrangeHRM project |
| `npm run report` | Open last HTML report |
| `npm run typecheck` | TypeScript strict check, no test run |
| `npm run lint` | ESLint (if installed) |

## Environment variables

Copy `.env.example` to `.env` and fill in:

```
ENV=local
ORANGEHRM_BASE_URL=https://opensource-demo.orangehrmlive.com
API_BASE_URL=https://reqres.in
LOG_API_STEPS=true
```

Missing required vars cause **fail-fast** at startup (see `env.loader.ts`) — you find out at boot, not 20 minutes into a test run.

## What to build on top

When you finish a chapter, come back here and add the file the chapter demonstrates. Examples:

- Finished Ch 13 (Browser Contexts) → add `fixtures/dual-context.fixture.ts`
- Finished Ch 19 (API Testing) → add `applications/notifications-service/api/NotificationsClient.ts`
- Finished Ch 20 (Cucumber) → add `features/` and `step-definitions/`

The framework grows as you learn. That's the point.

## What this framework deliberately does NOT include

- Real production credentials → use `.env`, never commit
- Microsoft Dynamics 365 specifics → those go in `websites/admin/` once you're on a D365 site
- Test data fakery libraries → add Faker.js when you need it (Ch 28)
- BDD layer → add Cucumber per Ch 20

Keep the core skinny. Add when a chapter asks for it.
