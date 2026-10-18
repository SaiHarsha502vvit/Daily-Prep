# 46. BDD with Cucumber — When and How to Use It With Playwright

**Navigation**: [← 45. AI Agents & MCP](./45_AI_Agents_MCP_And_Playwright.md) | [Index](../00_INDEX.md) | [→ 47. Allure & ReportPortal](../06_CI_CD_And_Reliability/47_Allure_ReportPortal.md)

---

## 5W1H

- **WHAT**: BDD (Behaviour-Driven Development) using Cucumber on top of Playwright — `.feature` files written in Gherkin, glued to step definitions that drive POMs.
- **WHY**: Lets non-engineers (QA leads, BAs, product) read and contribute to test specifications. Forces teams to clarify acceptance criteria before code is written.
- **WHO**: Teams with strong PO/BA involvement, regulated industries (finance, healthcare), and contracts where acceptance is BDD-shaped.
- **WHEN**: At project start, or when the team decides specs need to be human-readable. **Not** for retrofitting onto an existing 5,000-test suite — the migration cost dwarfs the benefit.
- **HOW**: `@cucumber/cucumber` runs the test file, calls into step definitions, which use a custom Playwright `Browser`/`Context`/`Page` lifecycle you wire up via `Before`/`After` hooks.

---

> **Provenance and version note.** The two stories in section 0 are illustrative composites (the years, counts and team are invented to make the cost concrete). Every code and config block below was run against a local login app with `@cucumber/cucumber` **13.3.0** (Node `22 || 24 || >=26`), `@playwright/test` **1.64.1**, `tsx` 4.23 and Chromium, then type-checked under `strict` + `noUncheckedIndexedAccess` + `noUnusedLocals`. Where the first draft's code did not run (a config helper that does not exist, a TypeScript loader that was never configured, a hook that crashed API-only scenarios), the code now shown is the version that does.

## 0. War Stories — What BDD Actually Costs in Practice

### Story 1: The 200-step definition orphan problem

A healthcare product team adopted BDD in year 1 of the product. The rationale: clinical users would validate scenarios. Year 1: devs wrote 60 `.feature` files, 200 step definitions. The clinical team read and approved them. BDD delivered its value.

Year 2: the product pivoted. The clinical team was absorbed into a new department. Step definitions stopped being reviewed. The `.feature` files kept growing but the human-readable promise evaporated — now only engineers read them.

Year 3: the app's UI was redesigned. The step definitions broke. Updating them was twice the work of updating a plain Playwright spec because there were two layers: the Gherkin phrase AND the step definition implementation. A refactor that would have taken 2 days took 4.

Year 4: a new SDET joined and saw 200 step definitions. He said: "I have no idea what most of these are testing — the Gherkin is too abstract to map to the UI without reading the step definition, and the step definition is too opaque to understand without reading the Gherkin."

**The cost:** 4 years of double-layer maintenance for zero ongoing stakeholder value. BDD solved a year-1 communication problem, but the team never re-evaluated whether BDD still made sense in years 2–4.

**Lesson:** Set an explicit re-evaluation milestone (e.g., "after 6 months, confirm stakeholders are still reading the feature files"). If they're not, migrate to native Playwright before the step definition count becomes a stranded asset.

### Story 2: The orphaned step definition that silently passed for 3 months

During a redesign, a developer renamed a page element. She updated the POM. She updated the spec. But there was also a Gherkin step that used the old element:

```gherkin
Then I should see the "Save Changes" button
```

```typescript
Then('I should see the {string} button', async function (buttonText: string) {
  // Old locator — no longer valid
  await expect(this.page.locator(`button:has-text("${buttonText}")`)).toBeVisible();
});
```

The new design used ARIA attributes, not `button:has-text`. The old locator matched a DIFFERENT button — one that was always visible on the page. The step continued to pass. The real "Save Changes" button was missing from the UI for 3 months, caught only when a real user filed a bug.

**The mechanism:** the Gherkin step was too abstract to notice the locator drift. A named Playwright method (`await savePage.expectSaveButtonVisible()`) would have been specific enough to catch the mismatch. The Cucumber abstraction hid the broken locator.

**Lesson:** BDD's indirection between spec and implementation is also indirection between spec and failure detection. When a locator drifts, the failure message from a named POM method is "expectSaveButtonVisible failed at pom.ts:42" — specific. The failure from a generic Gherkin step is "I should see the 'Save Changes' button" — which matched something else and passed.

---

## 1. The honest pitch

BDD is sold as "stakeholders can write tests." That almost never happens. What _does_ happen is:

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
tsx-register.mjs                        ← lets Node load the .ts files (section 6.1)
cucumber.mjs                            ← cucumber-js config (section 6.1)
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
import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { World } from "../support/world";

Given("the user is on the login page", async function (this: World) {
  await this.loginPage.goto();
});

When(
  "the user logs in with valid admin credentials",
  async function (this: World) {
    await this.loginPage.loginWith({ username: "Admin", password: "admin123" });
  },
);

When(
  "the user logs in with username {string} and password {string}",
  async function (this: World, username: string, password: string) {
    await this.loginPage.loginWith({ username, password });
  },
);

Then("the dashboard is displayed", async function (this: World) {
  await this.dashboardPage.expectLoaded();
});

Then("an invalid credentials alert is shown", async function (this: World) {
  await this.loginPage.expectInvalidCredentials();
});
```

## 5. The `World` — per-scenario state

```typescript
import {
  setWorldConstructor,
  World as CucumberWorld,
} from "@cucumber/cucumber";
import { Browser, BrowserContext, Page, chromium } from "@playwright/test";
import { LoginPage } from "../../websites/orangehrm/pages/LoginPage";
import { DashboardPage } from "../../websites/orangehrm/pages/DashboardPage";

// Cucumber's World is generic over the `worldParameters` object from the config
export class World extends CucumberWorld<{ baseUrl: string }> {
  browser?: Browser; // optional: API-only scenarios never launch one (section 13.2)
  context!: BrowserContext;
  page!: Page;
  loginPage!: LoginPage;
  dashboardPage!: DashboardPage;

  async init(): Promise<void> {
    this.browser = await chromium.launch();
    // Library code does not read playwright.config.ts: without baseURL here,
    // page.goto("/") fails with "Cannot navigate to invalid URL" (measured).
    this.context = await this.browser.newContext({
      baseURL: this.parameters.baseUrl,
    });
    this.page = await this.context.newPage();
    this.loginPage = new LoginPage(this.page);
    this.dashboardPage = new DashboardPage(this.page);
  }

  async dispose(): Promise<void> {
    await this.context?.close(); // undefined if init() never ran
    await this.browser?.close();
  }
}

setWorldConstructor(World);
```

Three things the World cannot inherit from `@playwright/test`, because `cucumber-js` is the runner and Playwright is only a library here: the config's `use` options (`baseURL`, `timezoneId`, `storageState`, `trace`, `screenshot`...), the `page`/`context` fixtures, and the retry/timeout machinery. Every one has to be wired by hand, as above.

## 6. Hooks — browser per scenario

```typescript
import { Before, After, setDefaultTimeout } from "@cucumber/cucumber";
import { World } from "./world";

// Cucumber has its OWN timeout on every step and hook: 5000 ms by default.
setDefaultTimeout(30_000);

Before(async function (this: World) {
  await this.init();
});

After(async function (this: World) {
  await this.dispose();
});
```

**Why `setDefaultTimeout` is not optional.** Measured with the default left alone: a `toBeVisible()` that cannot find its element fails after exactly 5 s with `Error: function timed out, ensure the promise resolves within 5000 milliseconds`, which hides Playwright's useful message (locator, expected state, call log). `expect` outside the Playwright test runner also defaults to 5 s (the config's `expect.timeout` does not exist here), so the two clocks tie and Cucumber's wins. With `setDefaultTimeout(30_000)` the same failure reads `expect(locator).toBeVisible() failed ... Timeout: 5000ms ... element(s) not found`. The same 5 s limit applies to `Before` hooks, and a cold Chromium launch can exceed it.

### 6.1 Config and the TypeScript loader

`cucumber-js` runs plain Node. Pointing it at `.ts` files without a loader fails (measured): `TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts"`. The Cucumber docs ([transpiling](https://github.com/cucumber/cucumber-js/blob/main/docs/transpiling.md)) recommend `tsx`: register it in a tiny file, then list that file **first** in `import`.

```bash
npm install --save-dev @cucumber/cucumber tsx
```

```javascript
// tsx-register.mjs
import { register } from "tsx/esm/api";
register();
```

```javascript
// cucumber.mjs  (auto-discovered; also cucumber.js / .cjs / .json / .yaml)
export default {
  paths: ["features/**/*.feature"],
  import: ["./tsx-register.mjs", "support/**/*.ts", "step-definitions/**/*.ts"],
  format: ["progress", "html:out/cucumber-report.html", "json:out/cucumber.json"],
  parallel: 2, // 2 workers (worker_threads in 13.x); each loads all support code
  worldParameters: { baseUrl: "http://127.0.0.1:4173" },
};
```

That is the `"type": "module"` form. For a CommonJS project the docs use `requireModule: ["tsx/cjs"]` plus `require: [...]`. Two traps:

- **`support/world.ts` must be in `import`.** A step file that only uses `World` as a type annotation (`this: World`) has that import erased by the transpiler, so `setWorldConstructor(World)` never runs. Measured symptom: `TypeError: this.init is not a function`. The `support/**/*.ts` glob above is what guarantees the file loads.
- **There is no `defineConfig`** in `@cucumber/cucumber` (its exports include `Before`, `After`, `Status`, `World`, `setDefaultTimeout`, `Formatter`..., not `defineConfig`). Settings live under a `default` key in JSON/YAML/CommonJS, or as the default export in ESM. A `cucumber.config.ts` is not auto-discovered, and loading a TS config needs a Node with built-in TypeScript support (the docs say the `tsconfig.json` is then not applied); on Node 22.13 use `cucumber.mjs`.

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

---

## 12. Data Tables in Gherkin

Scenario Outlines with data tables let you run the same scenario against multiple input sets without duplicating the feature file. The `Examples` section defines the parameter matrix, and Cucumber injects each row into the step definition as a `DataTable` or as individual named parameters.

### 12.1 Employee Onboarding Feature

```gherkin
Feature: Employee Onboarding

  As an HR administrator
  I want to onboard new employees
  So that the system has an accurate employee roster

  @smoke @regression
  Scenario Outline: onboard employee with valid data
    Given the admin is on the employee creation page
    When the admin submits a new employee with:
      | name       | role        | department   |
      | <name>     | <role>      | <department> |
    Then the employee "<name>" appears in the employee list
    And the system shows a success message

    Examples:
      | name      | role        | department    |
      | Jane Doe  | Software Eng| Engineering   |
      | John Smith| QA Engineer | Quality       |
      | Alex Lee  | DevOps Eng  | Infrastructure|

  @negative
  Scenario Outline: onboard employee with missing required field
    Given the admin is on the employee creation page
    When the admin submits a new employee with:
      | name     | role        | department |
      | <name>   | <role>      |            |  # department missing
    Then the system shows a validation error for department
    And the employee is NOT saved

    Examples:
      | name      | role        |
      | Jane Doe  | Software Eng|
      | John Smith| QA Engineer |
```

### 12.2 Step Definition with DataTable

When the Gherkin step is followed by a `|` table, Cucumber passes it to the step function as a `DataTable` (the last argument, after any `{string}` parameters). You can transform it to a row object for cleaner POM calls:

```typescript
import { When, DataTable } from "@cucumber/cucumber";
import { World } from "../support/world";

When(
  "the admin submits a new employee with:",
  async function (this: World, dataTable: DataTable) {
    // hashes() treats the first row as headers: Record<string, string>[]
    const [employee] = dataTable.hashes();
    // noUncheckedIndexedAccess: the array may be empty, so guard once
    if (!employee) throw new Error("expected one data row in the table");

    await this.employeePage.create({
      name: employee.name,
      role: employee.role,
      department: employee.department,
    });
  },
);
```

Each `Examples` row becomes its own scenario, so the step runs once per row (measured: an outline with 2 rows ran 2 scenarios, and `hashes()` returned a single row each time). A cell left empty, as in the `@negative` outline above, arrives as the empty string `""`, not `undefined`; and the trailing `# department missing` after a table row is accepted by the Gherkin parser.

### 12.3 Named Parameters as an Alternative

Cucumber Expressions (`{string}`, `{int}`) are an alternative to `DataTable`. They read cleanly when there are only 1–3 parameters:

```typescript
When(
  "the admin submits a new employee with name {string} and role {string}",
  async function (this: World, name: string, role: string) {
    await this.employeePage.create({ name, role });
  },
);
```

Use `DataTable` for 4+ columns. Use named parameters for 1–3. Both approaches are valid — pick the one that makes the Gherkin most readable.

---

## 13. More Complex World Setup

The World object is the per-scenario state container. In a real SDET framework, the World goes beyond just holding browser instances — it integrates with the API client, authentication fixtures, and data factories so steps can coordinate across UI and API layers.

### 13.1 World with API Client Integration

> `EmployeePage`, `AuthTokens` and the `APIUtils(baseUrl)` constructor below are illustrative names, not files in this repo. The repo's real [`framework/utilities/api/APIUtils.ts`](../framework/utilities/api/APIUtils.ts) is constructed from a Playwright `APIRequestContext` (`constructor(request, testInfo?)`), and its `LoginPage`/`DashboardPage` live in `framework/websites/orangehrm/pages/`. Adapt the imports to your own project; the World structure is the point.

```typescript
import {
  setWorldConstructor,
  World as CucumberWorld,
} from "@cucumber/cucumber";
import { Browser, BrowserContext, Page, chromium } from "@playwright/test";
import { LoginPage } from "../../websites/orangehrm/pages/LoginPage";
import { DashboardPage } from "../../websites/orangehrm/pages/DashboardPage";
import { EmployeePage } from "../../websites/orangehrm/pages/EmployeePage";
import { APIUtils } from "../../framework/api/APIUtils";
import { AuthTokens } from "../../framework/api/AuthTokens";

export class World extends CucumberWorld<{ baseUrl: string }> {
  browser?: Browser;
  context!: BrowserContext;
  page!: Page;

  // Page Object Models
  loginPage!: LoginPage;
  dashboardPage!: DashboardPage;
  employeePage!: EmployeePage;

  // API layer
  apiContext!: APIUtils;
  authTokens!: AuthTokens;

  // Shared test data factory
  testData!: {
    employeeId: string;
    employeeName: string;
  };

  async init(): Promise<void> {
    // 1. Launch browser
    this.browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    this.context = await this.browser.newContext({
      baseURL: this.parameters.baseUrl,
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: "test-results/videos" },
    });
    this.page = await this.context.newPage();

    // 2. Initialize POMs
    this.loginPage = new LoginPage(this.page);
    this.dashboardPage = new DashboardPage(this.page);
    this.employeePage = new EmployeePage(this.page);

    // 3. Initialize API client (base URL + auth token)
    this.apiContext = new APIUtils(
      "https://opensource-demo.orangehrmlive.com/webapi",
    );
    this.authTokens = new AuthTokens();

    // 4. Seed auth tokens via API (so UI login can be skipped)
    const tokenResponse = await this.apiContext.getAuthToken(
      "Admin",
      "admin123",
    );
    this.authTokens.setAccessToken(tokenResponse.token);

    // 5. Set base storage state so UI sessions are pre-authenticated
    await this.context.addInitScript(
      async (params) => {
        await window.localStorage.setItem("authToken", params.token);
      },
      { token: this.authTokens.accessToken },
    );

    // 6. Reset shared test data
    this.testData = { employeeId: "", employeeName: "" };
  }

  async dispose(): Promise<void> {
    // Cleanup: delete any test employees created during scenario
    if (this.testData.employeeId) {
      try {
        await this.apiContext.deleteEmployee(
          this.testData.employeeId,
          this.authTokens.accessToken,
        );
      } catch (err) {
        console.warn(
          `Cleanup: failed to delete employee ${this.testData.employeeId}:`,
          err,
        );
      }
    }

    await this.context?.close(); // undefined for @api scenarios
    await this.browser?.close();
  }
}

setWorldConstructor(World);
```

### 13.2 Tagged Hooks

Use tag-based hooks to control which scenarios trigger which setup. Select the **exception** (`not @api`), not the browser tags: a scenario carrying only `@negative` (like the second outline in section 12.1) matches none of `@ui or @smoke or @regression`, gets no browser, and fails on its first `this.page` access.

```typescript
import { Before, After, AfterStep, Status } from "@cucumber/cucumber";

// Every scenario except API-only ones gets a browser
Before({ tags: "not @api" }, async function (this: World) {
  await this.init();
});

// API-only — skip browser entirely
Before({ tags: "@api" }, async function (this: World) {
  this.apiContext = new APIUtils(
    "https://opensource-demo.orangehrmlive.com/webapi",
  );
  const { token } = await this.apiContext.getAuthToken("Admin", "admin123");
  this.authTokens = new AuthTokens(token);
});

AfterStep({ tags: "not @api" }, async function (this: World, { result }) {
  if (result.status === Status.FAILED) {
    await this.attach(await this.page.screenshot(), "image/png");
  }
});

After(async function (this: World) {
  await this.dispose();
});
```

Measured: with a guard-less `dispose()` (`await this.context.close()`), an `@api` scenario passed its steps and then failed in `After` with `TypeError: Cannot read properties of undefined (reading 'close')`, which is why `dispose()` above uses `?.`. The `AfterStep` screenshot is attached to the failing step: the JSON report showed the step as `failed` with an `image/png` embedding.

---

## 14. Reports and Traces When Cucumber Is the Runner

Playwright's reporters (`html`, `list`, `json`, blob/merge-reports) plug into `@playwright/test`; `cucumber-js` never goes through them. Under Cucumber you get **Cucumber's formatters** and whatever you wire up yourself with the Playwright library. Do not try to "bridge" the two event streams; use each tool's own output.

### 14.1 Built-in formatters

The formatters are listed in `format`, each optionally with an output path (`name:path`). Section 6.1's `cucumber.mjs` already requests `html:` and `json:`; both files were produced in the run (`out/cucumber-report.html`, `out/cucumber.json`). `--format summary` or `progress` write to the terminal. The `json` formatter embeds attachments such as the failure screenshot from section 13.2.

### 14.2 A custom formatter (the supported extension point)

In current Cucumber a formatter is a plugin object that listens to Cucumber Messages envelopes ([custom formatters](https://github.com/cucumber/cucumber-js/blob/main/docs/custom_formatters.md)). This one writes a flat `[{ name, tags, status, durationMs }]` file you can feed to any script or dashboard. It type-checks under `strict` and ran against the login feature:

```typescript
// support/results-formatter.ts
import type { FormatterPlugin } from "@cucumber/cucumber/api";

interface ScenarioResult {
  name: string;
  tags: string[];
  status: string;
  durationMs: number;
}

const toMs = (t: { seconds: number | string; nanos: number }): number =>
  Number(t.seconds) * 1000 + t.nanos / 1e6;

const resultsFormatter: FormatterPlugin = {
  type: "formatter",
  formatter: ({ on, write }) => {
    const pickles = new Map<string, { name: string; tags: string[] }>();
    const testCases = new Map<string, string>(); // testCaseId -> pickleId
    const started = new Map<string, { testCaseId: string; at: number }>();
    const worst = new Map<string, string>(); // testCaseStartedId -> status
    const results: ScenarioResult[] = [];

    on("message", (envelope) => {
      if (envelope.pickle) {
        pickles.set(envelope.pickle.id, {
          name: envelope.pickle.name,
          tags: envelope.pickle.tags.map((t) => t.name),
        });
      } else if (envelope.testCase) {
        testCases.set(envelope.testCase.id, envelope.testCase.pickleId);
      } else if (envelope.testCaseStarted) {
        const s = envelope.testCaseStarted;
        started.set(s.id, { testCaseId: s.testCaseId, at: toMs(s.timestamp) });
      } else if (envelope.testStepFinished) {
        const f = envelope.testStepFinished;
        const status = f.testStepResult.status;
        if (status === "FAILED" || status === "UNDEFINED" || status === "AMBIGUOUS") {
          worst.set(f.testCaseStartedId, status);
        }
      } else if (envelope.testCaseFinished) {
        const f = envelope.testCaseFinished;
        const s = started.get(f.testCaseStartedId);
        const pickle = s && pickles.get(testCases.get(s.testCaseId) ?? "");
        if (s && pickle) {
          results.push({
            ...pickle,
            status: worst.get(f.testCaseStartedId) ?? "PASSED",
            durationMs: Math.round(toMs(f.timestamp) - s.at),
          });
        }
      } else if (envelope.testRunFinished) {
        write(JSON.stringify(results, null, 2));
      }
    });
  },
};

export default resultsFormatter;
```

Register it by path with an output file: `format: ["summary", "./support/results-formatter.ts:out/results.json"]`. Measured output for the 3-scenario login feature: three objects such as `{ "name": "valid credentials land on dashboard", "tags": ["@smoke"], "status": "PASSED", "durationMs": 3292 }`. Because `tsx` is registered through `import`, the `.ts` formatter loads without a build step.

### 14.3 Traces on failure: build the Playwright-runner behaviour yourself

The native runner's `trace: "retain-on-failure"` does not exist here. Start tracing per scenario and keep the zip only when the scenario failed (measured: a failed scenario produced a 54 KB `out/traces/<pickle-id>.zip`, openable with `npx playwright show-trace`):

```typescript
import { Before, After, Status } from "@cucumber/cucumber";
import type { World } from "../support/world";

Before(async function (this: World) {
  await this.init();
  await this.context.tracing.start({ screenshots: true, snapshots: true, sources: true });
});

After(async function (this: World, { result, pickle }) {
  if (result?.status === Status.FAILED) {
    await this.context.tracing.stop({ path: `out/traces/${pickle.id}.zip` });
  } else {
    await this.context.tracing.stop(); // discard
  }
  await this.dispose();
});
```

(If you also keep the section 6 hooks, merge these into them rather than registering two `Before`/`After` pairs.) This is the cost the exercise in section 11 asks you to compare: with `@playwright/test` the traces, retries, sharding, `baseURL`, fixtures and reporters come with the runner; under Cucumber each is code you own. Section 20 shows the option that keeps the runner.

---

## 15. Decision Matrix — When BDD Wins

Use this table to evaluate whether BDD with Cucumber is the right tool for your project or team. There is no universally correct answer — context determines fitness.

| Factor                       | BDD Good Fit                                             | BDD Bad Fit                                      |
| ---------------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| **Team size**                | 5+ people across QA, BA, and dev                         | Solo dev or 2-person team                        |
| **PO/BA involvement**        | High — reads .feature files regularly                    | None — never opens feature files                 |
| **Domain complexity**        | Business-readable processes (onboarding, claims, orders) | Low-level infra, dev tooling, compilers          |
| **Regulatory domain**        | Finance, healthcare, government — specs are contracts    | Internal tooling with no compliance need         |
| **Existing test suite size** | <200 tests — migration is feasible                       | 2,000+ tests already in `@playwright/test`       |
| **Sprint structure**         | Grooming → AC → dev → BDD test → verify                  | "Just ship it" — no ceremony                     |
| **CI pipeline maturity**     | Separate branch gates, quality gates per stage           | Single-stage push to main                        |
| **Reporting requirements**   | Stakeholders need human-readable test reports            | Team only cares about CI pass/fail               |
| **Parallelization need**     | Moderate — 2–4 workers sufficient                        | High — needs 8+ workers with minimal overhead    |
| **Tooling budget**           | Time to configure Cucumber + reporters properly          | Need to ship features fast, no time for ceremony |

---

## 16. Anti-patterns (Expanded)

These eight patterns appear repeatedly on BDD projects and cause long-term maintainability damage. Each one has a root cause and a concrete fix.

### 16.1 Selectors Leaking into Step Definitions

**Root cause:** Engineers take the fastest path and call `page.locator()` directly in steps.

**Bad:**

```typescript
When("the user clicks save", async function (this: World) {
  await this.page.locator("#btn-save").click(); // selector in step
});
```

**Good:**

```typescript
When("the user clicks save", async function (this: World) {
  await this.employeePage.clickSave(); // selector lives in POM
});
```

The discipline: if a selector changes, it should break the POM test, not the feature file or step definition.

### 16.2 One Step Per UI Action

**Root cause:** Teams map steps directly to button clicks rather than business intent.

**Bad (40 steps for one workflow):**

```gherkin
When the user clicks the menu
When the user clicks the employees submenu
When the user clicks the add button
When the user types "Jane" in the name field
...
```

**Good (3 steps for the same workflow):**

```gherkin
When the user navigates to the employee list
And the user creates a new employee with name "Jane Doe" and role "Engineer"
Then the employee appears in the list
```

Let the POM compose the 40 low-level actions. Keep steps at the business level.

### 16.3 No Shared State Management Between Steps

**Root cause:** Trying to avoid Cucumber's `this` context or not knowing about the World object.

**Bad:**

```typescript
let createdEmployeeId: string; // module-level global

When("the employee is created", async function () {
  createdEmployeeId = await api.createEmployee("Jane");
});

Then("the employee record is accessible", async function () {
  const emp = await api.getEmployee(createdEmployeeId); // fragile, not thread-safe
  expect(emp).toBeTruthy();
});
```

**Good:**

```typescript
// World holds the state
When("the employee is created", async function (this: World) {
  this.testData.employeeId = await this.apiContext.createEmployee("Jane");
});

Then("the employee record is accessible", async function (this: World) {
  const emp = await this.apiContext.getEmployee(this.testData.employeeId);
  expect(emp).toBeTruthy();
});
```

### 16.4 Running Cucumber and Playwright in the Same CI Pipeline

**Root cause:** Gradual adoption without a migration strategy — both runners coexist.

This creates two test runners with different reporting formats, different retry logic, different parallelization strategies, and different failure modes. CI engineers end up maintaining two configurations. Pick one runner and migrate all tests to it.

If you need BDD for stakeholder communication, run Cucumber in a pre-merge quality gate. If you need maximum execution speed and Playwright's full feature set, stay on `@playwright/test`. Don't run both in the same pipeline unless you have dedicated engineering time to maintain the integration.

There is a third option that removes most of the two-runner cost: keep the Gherkin but run it **on the Playwright runner** with `playwright-bdd` (section 20).

### 16.5 Scenario Descriptions as Code Comments

**Root cause:** Gherkin's free-text doesn't need inline comments explaining what the code does.

**Bad:** `# This step logs the user in using credentials from the config`
**Good:** The Gherkin is self-documenting — if a step needs a comment to be understood, rewrite it.

### 16.6 Not Tagging Scenarios

**Root cause:** Tags feel like overhead. Without them you can't selectively run smoke vs. regression.

Minimum tag set: `@smoke` (per commit), `@regression` (nightly), `@slow` (weekly), `@api` (no browser), `@ui` (browser required). Run with: `npx cucumber-js --tags "@smoke and not @slow"` (the binary is `cucumber-js`; tag expressions use `and`/`or`/`not` and parentheses; measured: `@smoke and not @slow` selected the one `@smoke` scenario).

### 16.7 Steps That Are Too Generic

**Root cause:** Writing steps before understanding the domain, or over-generalizing for reuse.

**Bad:** `When the user does something` / `Then something happens`
**Good:** `When the user submits the expense report for "Q1 2026"` / `Then the report status changes to "Pending Approval"`

Specific step names make failures self-documenting. When the step fails, the name tells you what broke.

### 16.8 Not Using Before/After Hooks for Setup

**Root cause:** Putting browser/page init in the first `Given` step of every scenario duplicates setup across every scenario.

**Bad:** Each scenario's first step opens the browser — duplicated across 50 scenarios.
**Good:** A `Before` hook in `hooks.ts` opens the browser once per scenario. Feature files contain only business-level steps.

Use `Background` for navigation to a shared page. Use hooks for browser, context, and API initialization.

---

## 17. Senior SDET Perspective

BDD is most valuable as a **boundary contract** between the engineering team and the business. The `.feature` file is not a test file — it is a living document that captures the agreed behavior of the system in language the business can read. When a product owner signs off on a feature file, they are signing off on the behavior of the system. This is a fundamentally different activity than writing test cases, and it changes how you think about failures: when a Cucumber scenario fails, it is not just a test that broke — it is a contract that was violated.

Gherkin works best when `Given/When/Then` maps to **business events**, not UI interactions. A step like `When the user clicks the submit button` tells you nothing about the business intent. A step like `When the user submits the insurance claim` tells the reader exactly what the system should do. The Senior SDET enforces this discipline from the first feature file onward: if a step cannot be explained to a product owner without referring to a button or a form field, the step text needs to be rewritten. The UI is an implementation detail. The behavior is what matters.

The practical enforcement mechanism is a **step definition review** in the PR process. Every new step definition goes through a review that asks: can a non-engineer read this step and understand what the system does? If the answer is no, the step text or the underlying POM method needs to be redesigned. This review discipline is what separates BDD teams that get value from the approach from BDD teams that go through the motions and wonder why stakeholders never read the feature files.

---

## 18. DevSecOps Seed

BDD is underutilized in security regression testing. Security acceptance criteria written in Gherkin read naturally and are reviewable by security engineers who may not read code. A feature file like:

```gherkin
Feature: JWT Security

  @security
  Scenario: expired token returns 401
    Given a user with an expired JWT token
    When the user requests the /admin/employees endpoint
    Then the response status is 401 Unauthorized
    And the response body contains "Token has expired"

  @security
  Scenario: missing auth header returns 403
    Given no authentication token is provided
    When the user requests any protected endpoint
    Then the response status is 403 Forbidden
```

These scenarios serve as **security regression gates**: they run in CI, they are human-readable in the report, and they make security behavior a first-class acceptance criterion rather than a post-hoc testing activity. Pair with OWASP ZAP integration in an `After` hook to automatically scan the pages visited during a scenario for common vulnerabilities.

---

## 19. Exercise — Complete Deliverable

Build a Cucumber implementation for OrangeHRM Employee Creation covering: valid case, duplicate ID error, and missing required fields.

### 19.1 Files to Produce

| File                                              | Purpose                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `features/pim/employee-creation.feature`          | 4 scenarios with data table: valid, duplicate, missing first name, missing last name |
| `step-definitions/pim/employee-creation.steps.ts` | `Given/When/Then` glue calling POMs; receives `DataTable` for employee data          |
| `support/world.ts`                                | Per-scenario state: browser + context + page + API client + `testData` for cleanup   |
| `support/hooks.ts`                                | `Before` → `init()`, `After` → `dispose()`, `AfterStep` screenshot on failure        |
| `cucumber.mjs` + `tsx-register.mjs`               | Paths, `import` (tsx first), format (HTML + JSON), parallel=2, `worldParameters`     |

### 19.2 Feature File Skeleton

```gherkin
Feature: Employee Creation — PIM Module

  Background:
    Given the admin is logged in to the PIM module

  @smoke @regression
  Scenario: create employee with all required fields
    When the admin creates an employee with:
      | firstName | lastName | employeeId |
      | Jane      | Doe      | EMP_001    |
    Then the employee "Jane Doe" appears in the employee list
    And the system shows the success message "Successfully Saved"

  @regression
  Scenario: create employee with duplicate ID shows error
    Given an employee with ID "EMP_001" already exists
    When the admin creates an employee with:
      | firstName | lastName | employeeId |
      | John      | Smith    | EMP_001    |
    Then the system shows the error message "Employee Id already exists"

  @regression @negative
  Scenario: create employee with missing first name
    When the admin creates an employee with:
      | firstName | lastName | employeeId |
      |           | Smith    | EMP_002    |
    Then the system shows a validation error for "First Name"
    And the employee is NOT saved
```

### 19.3 Step Definitions Skeleton

```typescript
import { Given, When, Then, DataTable } from "@cucumber/cucumber";
import { World } from "../support/world";

Given("the admin is logged in to the PIM module", async function (this: World) {
  await this.loginPage.goto();
  await this.loginPage.loginWith({ username: "Admin", password: "admin123" });
  await this.employeePage.goto();
});

Given(
  "an employee with ID {string} already exists",
  async function (this: World, id: string) {
    await this.apiContext.createEmployee(
      { firstName: "X", lastName: "Y", employeeId: id },
      this.authTokens.accessToken,
    );
    this.testData.employeeId = id;
  },
);

When(
  "the admin creates an employee with:",
  async function (this: World, table: DataTable) {
    const [emp] = table.hashes();
    if (!emp) throw new Error("expected one data row in the table");
    await this.employeePage.addEmployee(emp);
  },
);

Then(
  "the employee {string} appears in the employee list",
  async function (this: World, name: string) {
    await this.employeePage.searchEmployee(name);
    // web-first assertion inside the POM: it retries; expect(await x).toBeTruthy() reads once
    await this.employeePage.expectEmployeeInList(name);
  },
);

Then(
  "the system shows the success message {string}",
  async function (this: World, msg: string) {
    await this.employeePage.expectSuccessMessage(msg);
  },
);

Then(
  "the system shows the error message {string}",
  async function (this: World, msg: string) {
    await this.employeePage.expectErrorMessage(msg);
  },
);

Then(
  "the system shows a validation error for {string}",
  async function (this: World, field: string) {
    await this.employeePage.expectValidationError(field);
  },
);

Then("the employee is NOT saved", async function (this: World) {
  await this.employeePage.expectOnAddPage();
});
```

### 19.4 package.json Script

```json
{
  "scripts": {
    "test:bdd": "cucumber-js"
  }
}
```

`cucumber-js` auto-discovers `cucumber.mjs` (section 6.1). Add `--config <file>` only for a non-default name, and note that a `.ts` config is not in the auto-discovery list.

### 19.5 Self-Grading Rubric

| Criterion            | 0 pts   | 1 pt                      | 2 pts                    | 3 pts                         |
| -------------------- | ------- | ------------------------- | ------------------------ | ----------------------------- |
| **Feature file**     | Missing | Exists, no tables         | Data table on valid case | All 4 scenarios + tagging     |
| **Step definitions** | Missing | `page.locator()` in steps | Calls POM methods        | Handles valid + invalid cases |
| **World**            | Missing | Browser/page only         | Browser + POM            | Browser + POM + API + cleanup |
| **Hooks**            | Missing | `Before` only             | `Before` + `After`       | + screenshot on failure       |
| **npm script**       | Missing | Wrong command             | Right command            | + config file                 |
| **Report**           | None    | HTML only                 | HTML + JSON              | All three                     |

**Total: 18 points** — 0–6: incomplete · 7–12: functional · 13–18: production-ready

---

## 20. Option: Gherkin on the Playwright runner (`playwright-bdd`)

Sections 5, 6, 13 and 14 are the price of using `cucumber-js` as the runner: you re-create `baseURL`, the browser lifecycle, timeouts, traces and reports by hand. [`playwright-bdd`](https://github.com/vitalets/playwright-bdd) (a third-party package, not part of Playwright or Cucumber) takes the other route: it parses the same `.feature` files and **generates ordinary Playwright specs**, so `@playwright/test` stays the runner and keeps its fixtures, config `use` options, retries, sharding, trace/video/screenshot options and reporters.

Verified with `playwright-bdd` 9.2.1 and `@playwright/test` 1.64.1, running the exact `login.feature` from section 3 against the same app (3 scenarios passed; `--grep @smoke` ran only the `@smoke` one):

```bash
npm install --save-dev playwright-bdd @playwright/test
npx bddgen            # reads features + steps, writes .features-gen/*.spec.js
npx playwright test   # the normal runner executes the generated specs
```

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  features: "features/*.feature",
  steps: "steps/*.ts",
});

export default defineConfig({
  testDir, // points at the generated .features-gen directory
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
});
```

```typescript
// steps/fixtures.ts — POMs as ordinary Playwright fixtures, no World class
import { test as base, createBdd } from "playwright-bdd";
import { LoginPage } from "../pages/LoginPage";

export const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});
export const { Given, When, Then } = createBdd(test);
```

```typescript
// steps/login.steps.ts — the first argument is the fixtures object, then {string} params
import { Given, When } from "./fixtures";

Given("the user is on the login page", async ({ loginPage }) => {
  await loginPage.goto();
});
When(
  "the user logs in with username {string} and password {string}",
  async ({ loginPage }, username: string, password: string) => {
    await loginPage.loginWith({ username, password });
  },
);
```

Trade-offs to weigh against section 8: you add a generation step (`bddgen`) and a generated `.features-gen` directory to keep out of git; the step-definition API is `playwright-bdd`'s `createBdd`, not Cucumber's `Given` from `@cucumber/cucumber`, so existing Cucumber step files do not run unchanged; and the specs that run are generated ones (the Gherkin scenario and example appear in the test title, e.g. `invalid credentials show an alert › Example #1 @regression`). In exchange, the "two runners, two reports, two flake profiles" objection (section 7 item 4 and section 16.4) mostly disappears, and everything in [Chapter 56](../01_Foundations/56_Playwright_Config_Deep_Dive.md) applies as written. Check the package's own docs for the Cucumber features it does not cover before committing to it.

---

## Reality Check

**"BDD means writing tests in Gherkin (Given/When/Then)"** → BDD (Behavior-Driven Development) is a development PROCESS: product owners, developers, and QA collaborate to write concrete examples (scenarios) of behavior BEFORE coding — these examples drive the implementation. Gherkin is one notation for recording these examples. The value is in the CONVERSATION (Three Amigos: business, dev, test) and shared understanding, not the syntax. Many teams use Gherkin syntax without BDD (they write Gherkin after the fact to document finished features) — this gets the formatting but misses the process benefit. Real BDD: scenarios are written before implementation, and they reveal unclear requirements.

**"Cucumber/Playwright integration means all my Playwright tests are now BDD"** → Integrating `@cucumber/cucumber` with Playwright gives you Gherkin syntax over Playwright steps. It does NOT automatically make your process BDD. You still need: collaborative scenario writing, three-amigos meetings, scenarios as living documentation. The integration is a formatting choice — you can write E2E tests in Gherkin that are no more collaborative than non-Gherkin Playwright tests. BDD is a team practice; the tool stack is secondary.

**"Step definitions should be highly reusable across all features"** → Over-generalising step definitions creates fragile, hard-to-read scenarios. `When I click the button` is too generic — which button? Scenarios should be business-readable, not generic: `When the customer submits their order`. Step definitions that are too reusable force the Gherkin to contain implementation details (`When I click element with id "submit-order-btn"`) — this defeats BDD's readable documentation goal. Write steps that read like business scenarios; accept some duplication in step definitions rather than forcing artificial generalization.

**"Scenario Outlines replace parameterized tests"** → Scenario Outlines: one scenario template with multiple example rows — Cucumber runs the scenario once per row. Playwright's parameterized tests (`test.each([...])`) do the same. The choice: Scenario Outlines for business-level data variation (test with different customer types: gold/silver/bronze), Playwright test.each for implementation-level parameterization (test the same component with different props). Mixing both adds complexity without value. If you're already using Cucumber, use Scenario Outlines. If you're not using BDD, test.each is simpler.

**"Cucumber tags are just for filtering which tests run"** → Cucumber tags serve multiple purposes: filtering (`--tags "@smoke"` runs only smoke tests), reporting (Allure can group by tags), conditional hooks (`Before('@admin') { loginAsAdmin() }` runs only for admin-tagged scenarios), and documentation (tags as living metadata about what each scenario covers). Tag strategy: `@smoke` (critical path), `@regression` (full regression), `@feature-name` (feature grouping), `@JIRA-1234` (ticket traceability), `@wip` (work in progress — excluded from CI), `@skip` (temporarily disabled). Tag discipline compounds over time — establish conventions early.
