# BDD with Cucumber

> **Canonical lesson:** [46 BDD With Cucumber](../../07_Specialised_Testing/46_BDD_With_Cucumber.md). This page is a shorter summary kept for quick lookup; the chapter is the maintained version — if the two disagree, trust the chapter.

> Specialised reference for Gherkin / Cucumber.js integration with Playwright. When BDD helps, when it hurts, the step definition pattern, hooks, world objects, scenario outlines.

---

## Table of contents

1. [When BDD actually pays off](#1-when-bdd-pays-off)
2. [The Gherkin model](#2-gherkin)
3. [Setup — Cucumber.js + Playwright](#3-setup)
4. [Step definitions](#4-step-defs)
5. [World objects](#5-world)
6. [Hooks](#6-hooks)
7. [Scenario outlines](#7-outlines)
8. [Tags and filtering](#8-tags)
9. [Reporting](#9-reporting)
10. [Anti-patterns](#10-anti-patterns)

---

## 1. When BDD pays off

BDD is a methodology, not a tool. Gherkin / Cucumber is the artifact.

| Use BDD when                                 | Don't use BDD when                              |
| -------------------------------------------- | ----------------------------------------------- |
| Business stakeholders write/read scenarios   | Engineers write scenarios for engineers         |
| Living documentation is a real goal          | Specs live in JIRA; no one reads .feature files |
| Acceptance criteria → tests is a tight loop  | Tests are written after the fact                |
| Multiple personas share scenarios            | Single team owns the whole stack                |
| Regulatory environment requires traceability | No traceability requirement                     |

If non-engineers don't touch the `.feature` files, you're paying BDD's overhead for none of its benefit. Use Playwright tests directly.

---

## 2. Gherkin

```gherkin
Feature: User can pay a citation
  As a customer
  I want to pay a parking citation online
  So that I don't have to mail a check

  Background:
    Given I am signed in as a customer
    And I have a pending citation worth $150

  Scenario: Successful payment
    When I navigate to the citations page
    And I click "Pay" for citation "CIT-001"
    And I submit valid credit card "4111111111111111"
    Then I should see "Payment successful"
    And the citation status should be "PAID"

  Scenario: Declined card
    When I navigate to the citations page
    And I click "Pay" for citation "CIT-001"
    And I submit declined credit card "4000000000000002"
    Then I should see "Payment declined"
    And the citation status should remain "PENDING"
```

Keywords: `Given` (state), `When` (action), `Then` (assertion), `And` (continuation), `But` (negative continuation).

---

## 3. Setup

```bash
npm i -D @cucumber/cucumber playwright-bdd
```

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  features: "./features/*.feature",
  steps: "./step-definitions/*.ts",
});

export default defineConfig({
  testDir,
  // ... rest of config
});
```

`playwright-bdd` compiles `.feature` files to Playwright test files. Each scenario becomes a test.

---

## 4. Step defs

```typescript
// step-definitions/payment.steps.ts
import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";

Given("I am signed in as a customer", async function () {
  await this.page.goto("/login");
  await this.page.getByLabel("Email").fill(process.env.CUSTOMER_EMAIL!);
  await this.page.getByLabel("Password").fill(process.env.CUSTOMER_PASSWORD!);
  await this.page.getByRole("button", { name: "Log in" }).click();
  await this.page.waitForURL(/\/dashboard/);
});

Given(
  "I have a pending citation worth ${int}",
  async function (amount: number) {
    this.citationId = await this.api.createCitation({
      status: "PENDING",
      amount,
    });
  },
);

When("I navigate to the citations page", async function () {
  await this.page.goto("/citations");
});

When(
  "I click {string} for citation {string}",
  async function (action: string, citationId: string) {
    await this.page
      .getByRole("row", { name: citationId })
      .getByRole("button", { name: action })
      .click();
  },
);

When(
  "I submit valid credit card {string}",
  async function (cardNumber: string) {
    await this.page.getByLabel("Card number").fill(cardNumber);
    await this.page.getByRole("button", { name: "Submit payment" }).click();
  },
);

Then("I should see {string}", async function (text: string) {
  await expect(this.page.getByText(text)).toBeVisible({ timeout: 30_000 });
});

Then("the citation status should be {string}", async function (status: string) {
  const fresh = await this.api.getCitation(this.citationId);
  expect(fresh.status).toBe(status);
});
```

### 4.1 Parameter types

Gherkin's built-in `{string}` and `{int}` parameter types map to TypeScript types. Custom types:

```typescript
import { defineParameterType } from "@cucumber/cucumber";

defineParameterType({
  name: "citationStatus",
  regexp: /PENDING|PAID|DISPUTED|DELETED/,
  transformer: (s) => s as CitationStatus,
});

Then(
  "the status should be {citationStatus}",
  async function (status: CitationStatus) {
    // status is typed as CitationStatus
  },
);
```

---

## 5. World

`this` in step definitions is a "world" object. Shared per-scenario.

```typescript
// world.ts
import { setWorldConstructor, World } from "@cucumber/cucumber";
import { Page, BrowserContext } from "@playwright/test";
import { ApiClient } from "./api-client";

interface CustomWorld extends World {
  page: Page;
  context: BrowserContext;
  api: ApiClient;
  citationId?: string;
}

setWorldConstructor(
  class extends World implements CustomWorld {
    page!: Page;
    context!: BrowserContext;
    api!: ApiClient;
    citationId?: string;
  },
);
```

Each scenario gets a fresh world. State persists step → step within a scenario; doesn't bleed across scenarios.

---

## 6. Hooks

```typescript
import { Before, After, BeforeAll, AfterAll } from "@cucumber/cucumber";
import { chromium, Browser } from "@playwright/test";

let browser: Browser;

BeforeAll(async function () {
  browser = await chromium.launch();
});

AfterAll(async function () {
  await browser.close();
});

Before(async function () {
  this.context = await browser.newContext();
  this.page = await this.context.newPage();
  this.api = new ApiClient();
});

After(async function () {
  if (this.citationId) {
    await this.api.deleteCitation(this.citationId).catch(() => {});
  }
  await this.context.close();
});
```

Per-scenario context — equivalent to a fresh Playwright test.

### 6.1 Tagged hooks

```typescript
Before({ tags: "@admin" }, async function () {
  // Only runs for scenarios tagged @admin
  await loginAsAdmin(this.page);
});
```

---

## 7. Scenario outlines

```gherkin
Scenario Outline: Payment with different amounts
  Given I have a pending citation worth $<amount>
  When I pay the full amount
  Then the receipt should show $<amount>

  Examples:
    | amount |
    | 50     |
    | 150    |
    | 500    |
    | 1000   |
```

Cucumber generates 4 tests, one per row. Useful for parameterized scenarios — but they're separate tests, each runs the full Given+When+Then.

---

## 8. Tags

```gherkin
@smoke @payment
Scenario: Successful payment
  ...

@regression @payment
Scenario: Declined card
  ...
```

Run subset:

```bash
npx cucumber-js --tags "@smoke"
npx cucumber-js --tags "@payment and @smoke"
npx cucumber-js --tags "@payment and not @flaky"
```

---

## 9. Reporting

Cucumber's HTML / JSON reporter:

```bash
npx cucumber-js --format html:cucumber-report.html
```

Or use playwright-bdd's Playwright HTML report — integrates with the normal Playwright report.

---

## 10. Anti-patterns

| ❌                                           | ✅                                            |
| -------------------------------------------- | --------------------------------------------- |
| Engineers writing Gherkin for themselves     | Use Playwright directly; skip BDD overhead    |
| Step defs with raw selectors                 | POMs in step defs; selectors in page objects  |
| Long scenarios (50 steps)                    | Decompose into smaller scenarios              |
| Sharing `this.X` across scenarios            | World is per-scenario by design               |
| Outline with 100 rows                        | Move to data-driven tests in JS, not Gherkin  |
| `.feature` file no one reads                 | Drop BDD — you're paying overhead for nothing |
| Imperative steps ("I click the email field") | Declarative steps ("I fill in my email")      |

The declarative-vs-imperative split is crucial. Imperative steps couple to UI; rewriting breaks them. Declarative steps capture intent; UI changes only break the implementation.

```gherkin
# Imperative — bad
When I click the button with id "submit"
And I wait 2 seconds
And I see text "Success"

# Declarative — good
When I submit the form
Then I see the confirmation message
```

---

## Cross-references

- Fixtures + worlds: [`../reference/04_fixtures.md`](../quick_reference/04_fixtures.md)
- Reporting integration: [`../reference/11_reporting.md`](../quick_reference/11_reporting.md)
- WebdriverIO has stronger Cucumber: [`../reference/14_tool_comparison.md`](../quick_reference/14_tool_comparison.md)
