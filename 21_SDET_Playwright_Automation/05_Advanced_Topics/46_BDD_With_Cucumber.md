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
import { Before, After } from "@cucumber/cucumber";
import { World } from "./world";

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

When the Gherkin step uses a `|` table, Playwright receives it as a `DataTable` object. You can transform it to a row object for cleaner POM calls:

```typescript
import { Given, When, Then, DataTable } from "@cucumber/cucumber";
import { World } from "../support/world";

When(
  "the admin submits a new employee with:",
  async function (this: World, dataTable: DataTable) {
    // Convert DataTable to array of plain objects
    // The first row is treated as headers by hashes()
    const rows = dataTable.hashes();
    const employee = rows[0]; // only one row per scenario run

    await this.employeePage.create({
      name: employee.name,
      role: employee.role,
      department: employee.department,
    });
  },
);
```

Each `Examples` row runs as a separate test iteration. Cucumber handles the looping — your step definition runs once per row.

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

export class World extends CucumberWorld {
  browser!: Browser;
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

    await this.context.close();
    await this.browser.close();
  }
}

setWorldConstructor(World);
```

### 13.2 Tagged Hooks

Use tag-based hooks to control which scenarios trigger which setup:

```typescript
// Browser-only scenarios (@ui, @smoke, @regression)
Before({ tags: "@ui or @smoke or @regression" }, async function (this: World) {
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

AfterStep({ tags: "@ui" }, async function (this: World, { result }) {
  if (result?.status === "FAILED") {
    await this.attach(await this.page.screenshot(), "image/png");
  }
});

After(async function (this: World) {
  await this.dispose();
});
```

---

## 14. Cucumber + Playwright Reporter Integration

Cucumber emits JSON events for every test lifecycle. You can bridge this to Playwright's reporter interface to get unified HTML reports with screenshots, traces, and Cucumber's BDD data in one place.

### 14.1 Cucumber JSON Reporter

First, configure Cucumber to emit the `json` formatter:

```typescript
// cucumber.config.ts
import { defineConfig } from "@cucumber/ cucumber";

export default defineConfig({
  parallel: 2,
  format: [
    "html:test-results/cucumber-report.html",
    "json:test-results/cucumber.json",
  ],
  paths: ["features/**/*.feature"],
  require: ["step-definitions/**/*.ts", "support/**/*.ts"],
  worldParameters: {
    baseUrl:
      process.env.BASE_URL ?? "https://opensource-demo.orangehrmlive.com",
  },
});
```

### 14.2 Custom Cucumber Event Listener

Cucumber's `IWorld` and `Pickle` objects carry full test context. A custom listener can emit Playwright-compatible events:

```typescript
import { EventEmitter } from "events";
import {
  Pickle,
  ITestCase,
  ITestStep,
  ITestCaseStarted,
  ITestCaseFinished,
  ITestStepStarted,
  ITestStepFinished,
} from "@cucumber/messages";
import { writeFileSync } from "fs";

class CucumberPlaywrightBridge extends EventEmitter {
  private results: TestResult[] = [];
  private currentScenario = "";
  private currentStep = "";
  private stepStartTime = 0;

  constructor() {
    super();
  }

  // Called before a pickle (scenario) starts
  pickleStarted(pickle: Pickle, testCase: ITestCase): void {
    this.currentScenario = pickle.name;
    this.results.push({
      name: this.currentScenario,
      tags: pickle.tags.map((t) => t.name),
      steps: [],
      status: "passed",
      duration: 0,
    });
    console.log(
      `[Cucumber→Playwright] Scenario started: ${this.currentScenario}`,
    );
  }

  // Called before each test step runs
  stepStarted(testStep: ITestStep): void {
    this.currentStep = testStep.text;
    this.stepStartTime = Date.now();
    this.emit("step:started", {
      step: this.currentStep,
      scenario: this.currentScenario,
    });
  }

  // Called after each test step completes
  stepFinished(
    testStep: ITestStep,
    result: "passed" | "failed" | "skipped",
  ): void {
    const duration = Date.now() - this.stepStartTime;
    const lastResult = this.results[this.results.length - 1];
    if (lastResult) {
      lastResult.steps.push({
        name: this.currentStep,
        duration,
        status: result,
      });
      if (result === "failed") {
        lastResult.status = "failed";
      }
    }
    this.emit("step:finished", {
      step: this.currentStep,
      status: result,
      duration,
    });
  }

  // Called after the entire scenario finishes
  scenarioFinished(pickle: Pickle, passed: boolean): void {
    const status = passed ? "passed" : "failed";
    console.log(
      `[Cucumber→Playwright] Scenario finished: ${pickle.name} → ${status}`,
    );
    this.emit("scenario:finished", { name: pickle.name, status });
  }

  // Flush results to disk for Playwright reporter to consume
  flush(outputPath = "test-results/bridge-results.json"): void {
    writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    console.log(`[Cucumber→Playwright] Results written to ${outputPath}`);
  }
}

interface TestResult {
  name: string;
  tags: string[];
  steps: { name: string; duration: number; status: string }[];
  status: "passed" | "failed";
  duration: number;
}

export const bridge = new CucumberPlaywrightBridge();
```

Wire the bridge to Cucumber via the hooks file — call `bridge.flush()` in `After` to write results to disk. Then consume `test-results/bridge-results.json` in any Node.js script or Playwright custom reporter to build unified HTML output.

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

### 16.5 Scenario Descriptions as Code Comments

**Root cause:** Gherkin's free-text doesn't need inline comments explaining what the code does.

**Bad:** `# This step logs the user in using credentials from the config`
**Good:** The Gherkin is self-documenting — if a step needs a comment to be understood, rewrite it.

### 16.6 Not Tagging Scenarios

**Root cause:** Tags feel like overhead. Without them you can't selectively run smoke vs. regression.

Minimum tag set: `@smoke` (per commit), `@regression` (nightly), `@slow` (weekly), `@api` (no browser), `@ui` (browser required). Run with: `cucumber --tags "@smoke and not @slow"`.

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
| `cucumber.config.ts`                              | Paths, `require`, format (HTML + JSON), parallel=2, `worldParameters`                |

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
  await this.pimPage.goto();
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
    const emp = table.hashes()[0];
    await this.pimPage.addEmployee(emp);
  },
);

Then(
  "the employee {string} appears in the employee list",
  async function (this: World, name: string) {
    await this.pimPage.searchEmployee(name);
    expect(await this.pimPage.employeeVisibleInList(name)).toBeTruthy();
  },
);

Then(
  "the system shows the success message {string}",
  async function (this: World, msg: string) {
    await this.pimPage.expectSuccessMessage(msg);
  },
);

Then(
  "the system shows the error message {string}",
  async function (this: World, msg: string) {
    await this.pimPage.expectErrorMessage(msg);
  },
);

Then(
  "the system shows a validation error for {string}",
  async function (this: World, field: string) {
    await this.pimPage.expectValidationError(field);
  },
);

Then("the employee is NOT saved", async function (this: World) {
  expect(await this.pimPage.isOnAddPage()).toBeTruthy();
});
```

### 19.4 package.json Script

```json
{
  "scripts": {
    "test:bdd": "cucumber-js --config=cucumber.config.ts"
  }
}
```

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
