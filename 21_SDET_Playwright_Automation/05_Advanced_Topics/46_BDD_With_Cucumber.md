# 46. BDD with Cucumber — When and How to Use It With Playwright

**Navigation**: [← 45. AI Agents & MCP](./45_AI_Agents_MCP_And_Playwright.md) | [Index](../00_INDEX.md) | [→ 47. Allure & ReportPortal](./47_Allure_ReportPortal.md)

---

## 5W1H

- **WHAT**: BDD (Behaviour-Driven Development) using Cucumber on top of Playwright — `.feature` files written in Gherkin, glued to step definitions that drive POMs.
- **WHY**: Lets non-engineers (QA leads, BAs, product) read and contribute to test specifications. Forces teams to clarify acceptance criteria before code is written.
- **WHO**: Teams with strong PO/BA involvement, regulated industries (finance, healthcare), and contracts where acceptance is BDD-shaped.
- **WHEN**: At project start, or when the team decides specs need to be human-readable. **Not** for retrofitting onto an existing 5,000-test suite — the migration cost dwarfs the benefit.
- **HOW**: `@cucumber/cucumber` runs the test file, calls into step definitions, which use a custom Playwright `Browser`/`Context`/`Page` lifecycle you wire up via `Before`/`After` hooks.

---

## 1. The honest pitch

BDD is sold as "stakeholders can write tests." That almost never happens. What *does* happen is:

- Engineers write the steps.
- BAs/POs **read** them and catch mismatches early.
- Acceptance criteria stop being a Confluence page everyone ignores.

If your team won't read the `.feature` files, **don't adopt BDD.** You'll get all the indirection cost and none of the communication benefit.

---

## 2. Architecture

```
features/
├── login.feature                       ← Gherkin — readable by everyone
└── pim/employee-search.feature
step-definitions/
├── login.steps.ts                      ← TypeScript glue, talks to POMs
└── pim/employee-search.steps.ts
support/
├── world.ts                            ← per-scenario state (page, context)
└── hooks.ts                            ← Before/After: browser lifecycle
cucumber.config.ts
```

```
        feature file (Gherkin)
                │
                │  matched by regex/cucumber expression
                ▼
        step definition (TS)
                │
                │  uses
                ▼
              POM
                │
                ▼
       Playwright actions
```

The crucial discipline: **steps own the orchestration, POMs own the page**. Don't put waits or selectors in steps.

---

## 3. Example feature file

```gherkin
Feature: OrangeHRM login

  Background:
    Given the user is on the login page

  @smoke
  Scenario: valid credentials land on dashboard
    When the user logs in with valid admin credentials
    Then the dashboard is displayed

  @regression
  Scenario Outline: invalid credentials show an alert
    When the user logs in with username "<username>" and password "<password>"
    Then an invalid credentials alert is shown

    Examples:
      | username | password         |
      | Admin    | definitely-wrong |
      | NotAdmin | admin123         |
```

## 4. Step definition (TypeScript)

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { World } from '../support/world';

Given('the user is on the login page', async function (this: World) {
  await this.loginPage.goto();
});

When('the user logs in with valid admin credentials', async function (this: World) {
  await this.loginPage.loginWith({ username: 'Admin', password: 'admin123' });
});

When(
  'the user logs in with username {string} and password {string}',
  async function (this: World, username: string, password: string) {
    await this.loginPage.loginWith({ username, password });
  }
);

Then('the dashboard is displayed', async function (this: World) {
  await this.dashboardPage.expectLoaded();
});

Then('an invalid credentials alert is shown', async function (this: World) {
  await this.loginPage.expectInvalidCredentials();
});
```

## 5. The `World` — per-scenario state

```typescript
import { setWorldConstructor, World as CucumberWorld } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import { LoginPage } from '../../websites/orangehrm/pages/LoginPage';
import { DashboardPage } from '../../websites/orangehrm/pages/DashboardPage';

export class World extends CucumberWorld {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  loginPage!: LoginPage;
  dashboardPage!: DashboardPage;

  async init(): Promise<void> {
    this.browser = await chromium.launch();
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    this.loginPage = new LoginPage(this.page);
    this.dashboardPage = new DashboardPage(this.page);
  }

  async dispose(): Promise<void> {
    await this.context.close();
    await this.browser.close();
  }
}

setWorldConstructor(World);
```

## 6. Hooks — browser per scenario

```typescript
import { Before, After } from '@cucumber/cucumber';
import { World } from './world';

Before(async function (this: World) {
  await this.init();
});

After(async function (this: World) {
  await this.dispose();
});
```

---

## 7. Common mistakes

1. **Selectors in steps.** Step files start carrying `page.locator(...)`. Now the spec layer leaks into glue. Fix: every step calls into a POM method only.
2. **Step explosion.** Junior teams write a step per UI action: "the user clicks the X button." After three sprints there are 400 steps. Fix: write business-level steps ("the user creates a customer") and let the POM compose UI actions.
3. **Sharing data via globals.** Tempting because Cucumber's `this` is awkward at first. Use the World object. Always.
4. **Running BDD and "regular" Playwright in the same pipeline.** Two test runners, two report formats, two flake profiles. Either commit fully or stay on `@playwright/test`.

---

## 8. When NOT to use BDD

- The team is two engineers who already understand the requirements.
- The product domain isn't business-readable (low-level dev tooling, infra).
- You're retrofitting BDD onto an existing 1,000+ test suite. Massive cost, marginal benefit.

---

## 9. Senior SDET perspective

A senior SDET treats Gherkin as a **boundary contract**, not a test runner choice. Even on non-Cucumber projects they write test names like Gherkin: `"@regression user with expired token gets 401 on protected route"`. The clarity discipline survives even when the syntax doesn't.

---

## 10. DevSecOps seed

Acceptance criteria for security flows — `Given the JWT is expired / When the user requests /admin / Then the response is 401` — read beautifully in Gherkin. Pair BDD with your auth fixtures for security regression tests stakeholders can review.

---

## 11. Exercise

Convert [`framework/tests/orangehrm/login.spec.ts`](../framework/tests/orangehrm/login.spec.ts) into a Cucumber feature + step definitions. Wire `@cucumber/cucumber` into a separate `npm run test:bdd` script. Compare the trace, report, and parallel-execution story to the native runner. Decide for yourself whether the indirection is worth it for your team.
