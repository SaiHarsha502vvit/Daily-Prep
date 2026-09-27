# Quickstart

> **Canonical lesson:** [01 Environment Setup and First Test](../../01_Foundations/01_Environment_Setup_and_First_Test.md). This page is a shorter summary kept for quick lookup; the chapter is the maintained version — if the two disagree, trust the chapter.

> Install, first test, project layout. Five minutes.

## Install

```bash
# Node 18+ required (check: node --version)
npm init -y
npm i -D @playwright/test typescript @types/node
npx playwright install              # downloads Chromium, Firefox, WebKit binaries
npx playwright install-deps         # Linux only: installs OS dependencies
```

## Minimal `playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  timeout: 60_000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

## First test

```typescript
// tests/smoke.spec.ts
import { test, expect } from "@playwright/test";

test("playwright.dev loads and has expected heading", async ({ page }) => {
  await page.goto("https://playwright.dev/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Playwright",
  );
});
```

```bash
npx playwright test                 # runs all tests, headless
npx playwright test --ui            # interactive UI mode (best for dev)
npx playwright test --headed        # see the browser
npx playwright test --debug         # step through with Inspector
npx playwright show-report          # open last HTML report
```

## Project layout — what each folder is for

The runnable reference is in [`../framework/`](../../framework/). Mirror this for production work:

```
framework/
├── playwright.config.ts          ← projects, reporters, timeouts, trace settings
├── config/
│   └── env.loader.ts             ← typed env reader (requireEnv / optionalEnv)
├── constants/                    ← endpoints, timeouts, messages, app constants
├── fixtures/                     ← test.extend — page fixtures, auth fixtures
├── tests/                        ← spec files, organised by app
├── test-data/                    ← static JSON/CSV inputs
├── types/                        ← shared type declarations
├── utilities/
│   ├── api/                      ← APIUtils HTTP wrapper
│   ├── auth/                     ← TOTP, OAuth helpers
│   ├── data/                     ← data.loader, test-data.bridge
│   └── helpers/                  ← action.helpers, file.helpers
└── websites/                     ← page objects, grouped by app
    └── orangehrm/
        └── pages/
```

Why this shape:

- **Config** at the root — one source of truth for runner behaviour.
- **`fixtures/` separate from `tests/`** — tests import from a fixtures barrel, not from `@playwright/test`.
- **POMs in `websites/{app}/pages/`** — when you support 4 apps, each has its own page object family.
- **`utilities/` flat** — small helpers that don't need their own folder.

Full architecture rationale: [`learn/06_enterprise_structure.md`](../short_course/06_enterprise_structure.md).

## Where to go next

| You want to…                                     | Open                                             |
| ------------------------------------------------ | ------------------------------------------------ |
| Configure timeouts, retries, projects, reporters | [02_config.md](./02_config.md)                   |
| Pick the right locator (`getByRole` vs CSS)      | [03_locators.md](./03_locators.md)               |
| Set up shared test setup (auth, account pool)    | [04_fixtures.md](./04_fixtures.md)               |
| Authenticate with OAuth / SAML / MFA             | [05_auth.md](./05_auth.md)                       |
| Run tests in parallel + CI shards                | [07_parallelism.md](./07_parallelism.md)         |
| Run inside Docker                                | [10_ci_docker.md](./10_ci_docker.md)             |
| Learn architecture from scratch                  | [../learn/01_mindset.md](../short_course/01_mindset.md) |

## Common day-one gotchas

| Symptom                                                | Cause                                     | Fix                                                                                    |
| ------------------------------------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------- |
| `Cannot find module '@playwright/test'`                | Missing install                           | `npm i -D @playwright/test`                                                            |
| `Executable doesn't exist at ...`                      | Browsers not downloaded                   | `npx playwright install`                                                               |
| Tests pass locally, fail on Linux CI                   | Missing OS libs                           | `npx playwright install-deps` or use Docker (see [10_ci_docker.md](./10_ci_docker.md)) |
| `TypeError: page.locator(...).click is not a function` | Wrong import (`@playwright/test/lib/...`) | Always `import { test } from '@playwright/test'`                                       |
| Test times out at 30 s with no clear reason            | Default action timeout exceeded           | Increase `use.actionTimeout` or fix the underlying selector                            |
