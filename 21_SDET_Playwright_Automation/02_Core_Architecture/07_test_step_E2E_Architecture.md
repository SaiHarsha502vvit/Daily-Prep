# 07. E2E Test Architecture — Structuring 15-Step Tests

**Navigation**: [← Chapter 06: Custom Fixtures](./06_Custom_Fixtures_Architecture.md) | [Index](../00_INDEX.md) | [→ Chapter 08: Browser Internals](./08_Browser_Internals_for_SDETs.md)

**Cross-links:**

- [`16_JavaScript/04_JS_Async_Promises.md`](../../16_JavaScript/04_JS_Async_Promises.md) — `Promise.all` for multi-tab flows
- [`21_SDET/06_Custom_Fixtures_Architecture.md`](./06_Custom_Fixtures_Architecture.md) — fixtures providing `account`, `masterSearchPage`

---

## 5W1H — Why This Chapter?

- **WHAT**: How to architect a clean, readable, debuggable 15-step E2E test when data flows from an API in Step 1 all the way to a DB verification in Step 15.
- **WHY**: Long tests written without structure become unreadable within weeks. When Step 9 fails, you need to know instantly: what data was in the accumulator? What was the application state? Without structure, debugging takes hours.
- **WHO**: SDETs writing multi-step E2E tests that cross multiple applications, tabs, or BrowserContexts.
- **WHEN**: Any time a test has more than 4 steps or more than one data dependency between steps.
- **HOW**: By learning `test.step()`, the Data Accumulator pattern, multi-tab/context flow patterns, and soft assertions.

---

## 1. The `test.describe` + `test.step` Mental Model

### What They Are

```typescript
test.describe("Citation Search Flow", () => {
  //            ↑ Groups related tests together.
  //              Shows as a header in the HTML report.
  //              Shared hooks (beforeEach, afterEach) apply to all tests inside.

  test("Agent can find paid citation by ID", async ({
    page,
    request,
    account,
  }) => {
    //  ↑ A single test scenario.

    await test.step("Fetch citation ID from API", async () => {
      //             ↑ A named phase of the test.
      //               Shows in the HTML report with individual timing and pass/fail.
      //               If this step throws, the test stops here (unless you use soft assertions).
    });
  });
});
```

### Why `test.step()` Matters Beyond Grouping

1. **HTML Report visibility:** Each step appears as an expandable row in the Playwright HTML report, with its own timing and screenshot on failure.
2. **Debugging speed:** When a 15-step test fails, the report shows you EXACTLY which step failed and how long each step took.
3. **Living documentation:** Step names should read like a user story. Future you (or a new teammate) can understand the test flow without reading the code.

### Step Naming Convention

```typescript
// ❌ Vague — tells you nothing
await test.step('step 1', async () => { ... });
await test.step('do stuff', async () => { ... });

// ✅ Descriptive — reads like a user action
await test.step('Navigate to Master Search page', async () => { ... });
await test.step(`Search for citation ${data.citationId}`, async () => { ... });
await test.step('Verify result row shows status PAID', async () => { ... });
await test.step('Click Edit opens new tab with Order details', async () => { ... });
```

---

## 2. The Data Accumulator Pattern

The most important architectural decision in a multi-step test: **how do you pass data from Step 1 to Step 9?**

### The Wrong Way — Module-Level Variables

```typescript
// ❌ WRONG — module-level variable
let citationId: string; // shared across ALL tests in the file!

test("test A", async () => {
  citationId = "CIT-001"; // sets it
});

test("test B", async () => {
  console.log(citationId); // 'CIT-001' — contaminated by test A!
  // In parallel mode: citationId is undefined or from a different worker's run!
});
```

This is the exact shared-mutable-state failure [Ch33 Section 10](../06_SDET_to_SDE_Bridge/33_SDET_to_SDE_CS_Thinking.md#10-concurrency--test-race-conditions-and-parallel-execution) names formally, one concrete instance in a growing list — the same class of bug as two parallel workers modifying one test account, and structurally the same as [Ch04's `forEach` trap](../01_Foundations/04_JS_TS_For_Automation.md): different symptom (data leaking between tests vs. actions firing out of order), identical root cause (a variable that outlives the single execution it should have been scoped to).

### The Right Way — Per-Test Accumulator Object

```typescript
// ✅ CORRECT — typed accumulator scoped to ONE test

// Define the shape of all data this test will collect:
interface CitationTestData {
  citationId: string | null;
  customerId: string | null;
  customerName: string | null;
  newTabPage: Page | null;
  dbVerificationStatus: string | null;
}

test("Full citation E2E flow", async ({ page, request, account, dbPool }) => {
  // Initialize empty — fields filled in by each step
  const data: CitationTestData = {
    citationId: null,
    customerId: null,
    customerName: null,
    newTabPage: null,
    dbVerificationStatus: null,
  };

  // Step 1 sets data.citationId
  await test.step("Fetch citation from API", async () => {
    const response = await request.post("/api/citations/search", {
      data: { startDate: "2024-01-01", endDate: "2024-12-31" },
    });
    const body = await response.json();
    data.citationId = body?.citations?.[0]?.citationId ?? null;
    expect(data.citationId).not.toBeNull();
  });

  // Step 5 uses data.citationId from Step 1
  await test.step(`Enter citation ID ${data.citationId} into search form`, async () => {
    await page.fill("#citationNumberInput", data.citationId!);
    // The ! (non-null assertion) is safe here because Step 1 asserted it's not null
  });

  // Step 8 sets data.customerId
  await test.step("Extract customer ID from search results", async () => {
    const resultRow = page.locator(".ms-DetailsList-row").first();
    data.customerId = await resultRow.getAttribute("data-customer-id");
  });

  // Step 15 uses data from Steps 1 and 8
  await test.step("Verify DB record matches API and UI data", async () => {
    const result = await dbPool
      .request()
      .input("id", data.citationId)
      .query(
        "SELECT customer_id, status FROM Citations WHERE citation_id = @id",
      );

    expect(result.recordset[0].customer_id).toBe(data.customerId);
    expect(result.recordset[0].status).toBe("PAID");
  });
});
```

---

## 3. Cross-App Flows — Single Tab vs New Tab vs New Context

Your applications are interlinked. Understanding which pattern to use is critical.

### Pattern A: Same Tab Navigation

When clicking a button takes you to another page within the SAME browser session:

```typescript
await test.step("Click customer name to open customer details", async () => {
  await page.click(".customer-name-link");
  // Page navigates within the same tab
  await page.waitForURL("**/customer-details/**");
  // OR wait for a specific element on the new page:
  await page.locator("#customerDetailsHeader").waitFor({ state: "visible" });
});
```

### Pattern B: New Tab Opens (target="\_blank")

When a button opens a new browser tab. **This requires `Promise.all`.**

```typescript
await test.step("Click Edit opens Order details in new tab", async () => {
  // ❌ WRONG — race condition: tab might open and "close" before listener starts
  await page.click("#editButton");
  const newPage = await page.context().waitForEvent("page"); // might miss it!

  // ✅ CORRECT — listener starts BEFORE the click fires
  const [newTabPage] = await Promise.all([
    page.context().waitForEvent("page"), // start listening
    page.click("#editButton"), // trigger the open
  ]);

  // Store the new tab's Page object for later steps
  data.newTabPage = newTabPage;

  // Wait for the new tab to load
  await newTabPage.waitForLoadState("domcontentloaded");
  await newTabPage.locator("#orderDetailsHeader").waitFor({ state: "visible" });
});

// Later steps interact with the new tab:
await test.step("Verify order status in new tab", async () => {
  await expect(data.newTabPage!.locator(".order-status")).toHaveText("ACTIVE");
});

// Always close the new tab in teardown:
// (Or handle in afterEach if applicable)
await data.newTabPage?.close();
```

### Pattern C: New BrowserContext (Completely Isolated Session)

When App A and App B need completely different cookies/sessions — different users logged in simultaneously:

```typescript
test("Admin approves what Agent submitted", async ({ browser }) => {
  // Note: use "browser" fixture, not "page" — you need to create contexts manually

  // Context 1: Agent session
  const agentContext = await browser.newContext({
    storageState: "fixtures/agent-auth-state.json",
  });
  const agentPage = await agentContext.newPage();

  // Context 2: Admin session (different cookies, different user)
  const adminContext = await browser.newContext({
    storageState: "fixtures/admin-auth-state.json",
  });
  const adminPage = await adminContext.newPage();

  await test.step("Agent submits citation request", async () => {
    await agentPage.goto(process.env.AGENT_APP_URL!);
    await agentPage.click("#submitCitation");
    // ...
  });

  await test.step("Admin reviews and approves the submission", async () => {
    await adminPage.goto(process.env.ADMIN_APP_URL!);
    await adminPage.locator("#pendingApprovals").waitFor({ state: "visible" });
    await adminPage.click("#approveButton");
    // ...
  });

  // Teardown
  await agentContext.close();
  await adminContext.close();
});
```

---

## 4. Soft Assertions — Don't Abort on the First Failure

By default, if Step 3 fails in a 15-step test, Steps 4–15 never run. You get no information about whether those steps would have passed.

**Soft assertions** record the failure but let the test continue:

```typescript
test("verify all elements on master search page", async ({ page }) => {
  await page.goto("/master-search");

  // Soft assertions — all of these run regardless of which ones fail
  await expect.soft(page.locator("#MasterSearchDropdown-option")).toBeVisible();
  await expect.soft(page.getByText("Card", { exact: true })).toBeVisible();
  await expect.soft(page.getByText("Smartcard")).toBeVisible();
  await expect.soft(page.getByRole("button", { name: "Reset" })).toBeVisible();
  await expect.soft(page.locator("#serialNumberLabel")).toBeVisible();

  // See below: what this line actually does is more specific than "fails the test."
  expect(test.info().errors).toHaveLength(0);
});
```

**Verified, not assumed — what that last line actually does.** Ran this exact shape (a failing `expect.soft`, then this check, inside a `test.step`) through a real Playwright run with the JSON reporter and compared it against the same test *without* the check:

| | Without the check | With `expect(test.info().errors).toHaveLength(0)` |
|---|---|---|
| Does the test fail overall? | Yes | Yes |
| Errors in the report | 1 — the original soft-assertion failure, with its own clear expected/received message | 2 — the same original failure, **plus** a second, less specific `Expected length: 0, Received length: 1` |
| Steps *after* this point | Still run, each individually recorded pass/fail | **Skipped entirely** — they never start, and never appear in the report |

The test already fails without the extra line — Playwright collects every `expect.soft` failure and marks the test failed at the end automatically, no manual check required ([Playwright docs: assertions](https://playwright.dev/docs/test-assertions#soft-assertions)). So the check isn't what causes failure, and its own error message doesn't "list all failed assertions" either — that list is what Playwright was already going to print regardless; this line just adds one more, vaguer entry on top of it. What the check actually does is throw *synchronously, right there* — which only matters if something would otherwise run afterward that you want to prevent. In this exact example there's nothing after it, so it's inert. It stops being inert the moment it gates something real — which is exactly what it's doing back in Challenge 3 below.

**When to use soft assertions:**

- Page-wide validation (like your `verifyMasterSearchPageElementsAreVisible()`)
- Checking multiple independent fields on a form
- Reporting completeness at the end of a long test

**When NOT to use soft assertions:**

- When Step 5 data is required by Step 6 — a hard assertion in Step 5 prevents Step 6 from running with null data (which would cause a confusing error)

---

## 5. Full 15-Step Skeleton — Exactly Your Codebase Style

```typescript
import { test, expect } from "../fixtures";
import { MasterSearchPage } from "../pages/crm/MasterSearchPage";
import { CustomerDetailsTab } from "../pages/crm/CustomerDetailsTab";

// ─── Types ───────────────────────────────────────────────────────────────────
interface CitationFlowData {
  // From Step 1 (API)
  citationId: string | null;
  citationStatus: string | null;
  // From Step 4 (UI — search results)
  customerId: string | null;
  customerName: string | null;
  // From Step 8 (UI — new tab)
  newTabPage: import("@playwright/test").Page | null;
  orderStatus: string | null;
  // From Step 12 (DB)
  dbRecordConfirmed: boolean;
}

// ─── Test Suite ───────────────────────────────────────────────────────────────
test.describe("Citation — Full E2E Flow @crm @regression", () => {
  test.describe.configure({ timeout: 120000 }); // 2 min for the whole suite

  test("Agent searches citation, opens order, verifies DB", async ({
    page,
    request,
    account,
    masterSearchPage,
  }) => {
    const data: CitationFlowData = {
      citationId: null,
      citationStatus: null,
      customerId: null,
      customerName: null,
      newTabPage: null,
      orderStatus: null,
      dbRecordConfirmed: false,
    };

    // ── STEP 1 ── Fetch citation ID from API ─────────────────────────────
    await test.step("Fetch active citation ID from IVR API", async () => {
      const response = await request.post(
        `${process.env.API_HOST}/api/ivr/citations/search`,
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
            Accept: "application/json",
          },
          data: {
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            status: "PAID",
          },
        },
      );
      expect(response.status()).toBe(200);
      const body = await response.json();
      data.citationId = body?.citations?.[0]?.citationId ?? null;
      data.citationStatus = body?.citations?.[0]?.status ?? null;
      expect(data.citationId, "No citations returned from API").not.toBeNull();
    });

    // ── STEP 2 ── Navigate to app ─────────────────────────────────────────
    await test.step("Navigate to CRM Master Search", async () => {
      await page.goto(process.env.CRM_URL!);
      await masterSearchPage.waitForPageLoad();
    });

    // ── STEP 3 ── Verify page elements ────────────────────────────────────
    await test.step("Verify Master Search page loads correctly", async () => {
      await masterSearchPage.verifyMasterSearchPageElementsAreVisible();
    });

    // ── STEP 4 ── Enter citation ID in form ───────────────────────────────
    await test.step(`Enter citation ID: ${data.citationId}`, async () => {
      await page.fill("#citationNumberInput", data.citationId!);
    });

    // ── STEP 5 ── Click search ────────────────────────────────────────────
    await test.step("Click Search (3rd Search button)", async () => {
      await masterSearchPage.searchButton(2).click();
    });

    // ── STEP 6 ── Wait for and verify results ─────────────────────────────
    await test.step("Verify search results table appears", async () => {
      await page.locator(".ms-DetailsList-row").first().waitFor({
        state: "visible",
        timeout: 30000,
      });
      const rowCount = await page.locator(".ms-DetailsList-row").count();
      expect(rowCount, "Expected at least 1 result row").toBeGreaterThan(0);
    });

    // ── STEP 7 ── Extract customer info from results ───────────────────────
    await test.step("Extract customer details from result row", async () => {
      const firstRow = page.locator(".ms-DetailsList-row").first();
      data.customerId = await firstRow.getAttribute("data-customer-id");
      data.customerName = await firstRow
        .locator('[data-col="customerName"]')
        .textContent();
      expect(
        data.customerId,
        "Customer ID missing from result row",
      ).not.toBeNull();
    });

    // ── STEP 8 ── Click customer name — opens in new tab ──────────────────
    await test.step("Click customer name to open Customer Details in new tab", async () => {
      const [newTabPage] = await Promise.all([
        page.context().waitForEvent("page"),
        page.locator(`//div[contains(text(),'${data.customerName}')]`).click(),
      ]);
      data.newTabPage = newTabPage;
      await newTabPage.waitForLoadState("domcontentloaded");
    });

    // ── STEP 9 ── Interact with new tab ───────────────────────────────────
    await test.step("Verify Customer Details tab loads in new tab", async () => {
      const customerDetails = new CustomerDetailsTab(data.newTabPage!);
      await customerDetails.waitForPageLoad();
      await expect(
        data.newTabPage!.getByRole("tab", { name: "Customer Details" }),
      ).toHaveAttribute("aria-selected", "true");
    });

    // ── STEP 10 ── Navigate sub-tab ───────────────────────────────────────
    await test.step("Navigate to Phones sub-tab", async () => {
      await data.newTabPage!.getByRole("tab", { name: "Phones" }).click();
      // Wait for tab content to render (SPA tab switch — no page navigation)
      await data.newTabPage!.locator(".phone-list-container").waitFor({
        state: "visible",
        timeout: 15000,
      });
    });

    // ── STEPS 11-13: Further UI verification ──────────────────────────────
    // ... (your application-specific steps)

    // ── STEP 14 ── API cross-verification ─────────────────────────────────
    await test.step("Cross-verify customer via API matches UI data", async () => {
      const response = await request.get(
        `${process.env.API_HOST}/api/customers/${data.customerId}`,
        { headers: { Authorization: `Bearer ${account.accessToken}` } },
      );
      const body = await response.json();
      expect(body.name).toBe(data.customerName!.trim());
    });

    // ── STEP 15 ── DB verification ────────────────────────────────────────
    await test.step("Verify citation record exists in database with PAID status", async () => {
      // DB verification — see 24_Advanced_API_Testing/06_DB_Testing_SQL_Bridge.md
      // const result = await dbPool.request()...
      // expect(result.recordset[0].status).toBe('PAID');
      data.dbRecordConfirmed = true; // placeholder
    });

    // ── CLEANUP ───────────────────────────────────────────────────────────
    await data.newTabPage?.close();
  });
});
```

---

## 6. `test.skip()`, `test.fixme()`, `test.slow()`

```typescript
// Skip: don't run this test at all — use when a feature isn't built yet
test.skip('Payment flow — not implemented in staging', async () => { ... });

// Skip conditionally
test('D365-specific test', async ({ page }) => {
  test.skip(process.env.APP_TYPE !== 'dynamics', 'Only runs against D365 apps');
  // ...
});

// Fixme: marks a test as known-broken — it will run but is expected to fail
test.fixme('Transit account search shows wrong count — bug #4521', async () => { ... });

// Slow: triples the default timeout for this test
test.slow('Full E2E citation flow — 15 steps across 3 apps', async () => { ... });
// Equivalent to: test.setTimeout(3 * defaultTimeout)
```

---

## 7. `test.info()` — Attach Data to the HTML Report

When a 15-step test fails at Step 12, you need to know what data was in the accumulator at that point. Attach it to the report:

```typescript
test("Full citation E2E flow", async ({ page, request, account }, testInfo) => {
  const data: CitationFlowData = { citationId: null /* ... */ };

  // Attach the accumulator state on EVERY failure (runs after test finishes)
  // This gives you the data snapshot at the point of failure
  testInfo.annotations.push({
    type: "data-snapshot",
    description: JSON.stringify(data, null, 2),
  });

  await test.step("Fetch citation from API", async () => {
    // ...
    data.citationId = "CIT-001";
    // Attach the raw API response to the report:
    await testInfo.attach("api-response-step1", {
      body: JSON.stringify({ citationId: data.citationId }),
      contentType: "application/json",
    });
  });

  await test.step("Take screenshot of search results", async () => {
    // ...
    // Attach a screenshot to the report inline:
    const screenshot = await page.screenshot({ fullPage: false });
    await testInfo.attach("search-results-screenshot", {
      body: screenshot,
      contentType: "image/png",
    });
  });
});
```

### `afterEach` Failure Diagnostic Hook

```typescript
// In your fixture or test.describe block:
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== "passed") {
    // Only run on failure — attach diagnostic info
    await testInfo.attach("page-url-on-failure", {
      body: page.url(),
      contentType: "text/plain",
    });
    await testInfo.attach("screenshot-on-failure", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
    await testInfo.attach("dom-html-on-failure", {
      body: await page.content(),
      contentType: "text/html",
    });
    // Log network errors:
    const consoleMessages: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleMessages.push(m.text());
    });
    if (consoleMessages.length) {
      await testInfo.attach("console-errors", {
        body: consoleMessages.join("\n"),
        contentType: "text/plain",
      });
    }
  }
});
```

---

## 8. Timeout Cascade — Suite → Test → Step → Action

Timeouts apply at multiple levels. Understanding the cascade prevents silent hangs:

```typescript
// playwright.config.ts:
export default defineConfig({
  timeout: 120_000, // 1. Global default: each TEST has 120s
  expect: {
    timeout: 10_000, // 2. Default assertion timeout (toBeVisible etc.)
  },
  use: {
    actionTimeout: 30_000, // 3. Default action timeout (click, fill, etc.)
  },
});

// Per-test override:
test("Long multi-step flow", async ({ page }) => {
  test.setTimeout(300_000); // 4. This test gets 5 minutes

  // Per-step timeout (Playwright v1.39+):
  await test.step(
    "Heavy D365 load",
    async () => {
      // ...
    },
    { timeout: 60_000 },
  ); // 5. This step has 60s budget

  // Per-assertion override:
  await expect(page.locator(".results")).toBeVisible({ timeout: 45_000 }); // 6.

  // Per-action override:
  await page.click("#slowButton", { timeout: 20_000 }); // 7.
});

// How the cascade works:
// If the step timeout (60s) fires first → step fails, test continues if possible
// If the test timeout (300s) fires first → entire test fails immediately
// If the action timeout (30s) fires → action throws, step fails
// Step timeout MUST be < test timeout to be meaningful
```

**This cascade is a tree of budgets, same shape as [Ch01's](../01_Foundations/01_Playwright_TS_Basics.md#3-the-architecture--browser-context-page-locator) `Browser → Context → Page → Locator` containment — just measuring time instead of DOM position.** Suite bounds test, test bounds step, step bounds action: each level's budget is a *child* of the level above, and Challenge 4's rule (a child's timeout is meaningless if it exceeds its parent's) is the general invariant for any tree of bounded scopes, not a Playwright-specific quirk — the same constraint shows up anywhere resource budgets nest (a function's own deadline can't outlive the deadline of whatever called it with a deadline).

---

## 9. Test Tags and Grep — Running Subsets of Your Suite

```typescript
// Tag tests using @-prefixed strings in the title:
test.describe('Citation Search @regression @crm @smoke', () => {
  test('Basic search @smoke', async () => { /* ... */ });
  test('Advanced filter @regression', async () => { /* ... */ });
  test('Export CSV @regression @slow', async () => { /* ... */ });
});

// playwright.config.ts: default grep for CI:
export default defineConfig({
  grep: /@regression/,          // only run @regression tests in CI
  grepInvert: /@slow/,          // exclude @slow tests from regression run
});

// CLI: override at runtime:
npx playwright test --grep "@smoke"          # only smoke tests
npx playwright test --grep-invert "@slow"    # skip slow tests
npx playwright test --grep "@crm.*@smoke"    # crm AND smoke (regex AND)

// Programmatic tag (Playwright v1.43+):
test('Login flow', { tag: ['@smoke', '@auth'] }, async ({ page }) => {
  // ...
});
```

---

## 10. Step-Level Retry Utility

Playwright tests don't have per-step retry out of the box, but you can implement a lightweight wrapper:

```typescript
// utils/step-retry.util.ts

/**
 * Retries a test.step up to maxAttempts times.
 * Useful for steps that hit flaky third-party services or slow D365 renders.
 */
async function retryStep<T>(
  stepName: string,
  stepFn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 2000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await test.step(
        attempt === 1
          ? stepName
          : `${stepName} [retry ${attempt}/${maxAttempts}]`,
        stepFn,
      );
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        console.warn(
          `[retryStep] "${stepName}" failed (attempt ${attempt}/${maxAttempts}): ${err}`,
        );
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastError;
}

// Usage: wrap steps that are inherently flaky (e.g., D365 slow renders)
await retryStep(
  "Click Edit button in D365 command bar",
  async () => {
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(page.locator(".edit-form")).toBeVisible({ timeout: 15_000 });
  },
  3, // up to 3 attempts
  3000, // 3s between attempts
);
```

**A third point on the retry-delay spectrum this curriculum has now covered all of:** `retryStep`'s `delayMs = 2000` used unchanged across every attempt is **constant delay** — attempt 1, 2, 3 all wait the same 2s. That's a real, deliberate third option alongside [Ch04's linear backoff](../01_Foundations/04_JS_TS_For_Automation.md) (`2000 * attempt` — grows by a fixed amount each time) and [Ch34's exponential backoff with jitter](../06_SDET_to_SDE_Bridge/34_Algorithms_in_Test_Automation.md#8-dynamic-programming--optimal-retry-backoff) (doubles each time, randomized to avoid synchronized retries). Constant delay is the right choice here specifically because the target isn't a struggling shared service under load — it's one browser waiting for one D365 render to finish, where "back off more aggressively over time" buys nothing; the render either finishes in a roughly fixed window or it's actually broken, and a growing delay would just make the flaky-but-working case slower to detect.

---

**Challenge 1 (Data Accumulator):** A test does:

- Step 2: Gets `citationId` from the API
- Step 7: Uses `citationId` to fill a form
- Step 7 crashes because `citationId` is `null`

But Step 2 logged `"citationId = CIT-001"` to the console. What likely went wrong?

<details><summary>Answer</summary>

The `citationId` variable was declared outside the `test.step()` callbacks as `let citationId: string | null = null`, but Step 2 assigned it inside its callback using a locally scoped variable instead of the shared one. Example:

```typescript
// BUG: local variable shadows the outer one
await test.step("Fetch citation", async () => {
  const citationId = body.citations[0].citationId; // ← new local variable!
  // outer citationId is still null
});
```

Fix: use `data.citationId = ...` on the accumulator object, or ensure the assignment targets the outer-scope variable:

```typescript
await test.step("Fetch citation", async () => {
  citationId = body.citations[0].citationId; // ← assigns to outer scope
});
```

The Data Accumulator pattern (a typed `data` object) avoids this entire class of bugs.

</details>

**Challenge 2 (New Tab Race Condition):** This code occasionally fails with "Event 'page' was not received." Why?

```typescript
await page.click("#openDetailsButton");
const [newTab] = await page.context().waitForEvent("page");
```

<details><summary>Answer</summary>

The click fires and the new tab opens before `waitForEvent('page')` starts listening. The event is emitted and never heard — so `waitForEvent` waits until its timeout and throws. Fix: use `Promise.all` to start listening before triggering the click:

```typescript
const [newTab] = await Promise.all([
  page.context().waitForEvent("page"),
  page.click("#openDetailsButton"),
]);
```

</details>

**Challenge 3 (Soft Assertions):** Convert `verifyMasterSearchPageElementsAreVisible` to use soft assertions so all elements are checked even if the first one fails. What should the final line of the method be?

<details><summary>Answer</summary>

```typescript
async verifyMasterSearchPageElementsAreVisible(): Promise<void> {
  await this.masterSearchDropdown.waitFor({ state: 'visible', timeout: 60000 });

  await expect.soft(this.cardTextLocator).toBeVisible();
  await expect.soft(this.smartcardTextLocator).toBeVisible();
  await expect.soft(this.transitAccountLocator.first()).toBeVisible();
  await expect.soft(this.resetButtonLocator).toBeVisible();

  const searchCount = await this.page.getByRole('button', { name: 'Search' }).count();
  expect.soft(searchCount).toBeGreaterThan(0);

  // This does real work here, unlike in Section 4's example — see below.
  expect(test.info().errors).toHaveLength(0);
}
```

**Why this line earns its place here, unlike in Section 4's standalone example:** Section 4 already established that this check doesn't cause the *overall test* to fail — Playwright does that automatically — and that its own error message just adds a vaguer duplicate on top of the real one. What it actually does is throw immediately, synchronously, at this exact point. In Section 4's example that was inert, because nothing followed it. Here it isn't: Section 5's 15-step skeleton calls this exact method as **Step 3**, with Steps 4–15 following. If the page's own elements aren't visible, filling in a citation ID (Step 4) and clicking search (Step 5) against a broken page produces confusing, unrelated failures that bury the real problem. Throwing here — inside Step 3 — stops the flow before that happens, which is precisely the "When NOT to use soft assertions" guidance above: Step 4 depends on Step 3 having actually succeeded, so Step 3 needs a hard failure boundary even though it's built entirely out of soft checks internally. The soft assertions get you a complete picture of *which* elements are missing; the hard check at the end decides whether it's safe to keep going.

</details>

---

**Challenge 4 [Timeout Cascade]:** A test has `test.setTimeout(60_000)`. A step inside has `{ timeout: 90_000 }`. The step takes 70 seconds. What happens?

<details><summary>Answer</summary>

The **test timeout fires at 60 seconds** and kills the entire test — even though the step's own timeout was 90s. The step timeout is bounded by the parent test timeout. Setting `step.timeout > test.timeout` is meaningless: the test will always die first.

Rule: `step timeout` ≤ `test timeout` ≤ `suite timeout (via test.describe.configure)`.

**Fix:**

```typescript
test("Long step test", async () => {
  test.setTimeout(120_000); // 1. Increase test timeout first
  await test.step(
    "Slow operation",
    async () => {
      // ...
    },
    { timeout: 90_000 },
  ); // 2. Now step timeout (90s) < test timeout (120s)
});
```

</details>

---

**Challenge 5 [Data Accumulator Debug]:** A 12-step test fails at Step 8 with `TypeError: Cannot read properties of null (reading 'click')`. The accumulator field involved is `data.newTabPage`. What information would you attach in `afterEach` to diagnose this faster next time?

<details><summary>Answer</summary>

```typescript
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== "passed") {
    // 1. The accumulator state at failure time
    await testInfo.attach("accumulator-snapshot", {
      body: JSON.stringify(data, null, 2),
      contentType: "application/json",
    });
    // 2. List of all open pages in the context — was the new tab ever opened?
    const openPages = page
      .context()
      .pages()
      .map((p, i) => `Tab ${i}: ${p.url()}`);
    await testInfo.attach("open-pages-on-failure", {
      body: openPages.join("\n"),
      contentType: "text/plain",
    });
    // 3. Screenshot from EACH open page
    for (const [i, p] of page.context().pages().entries()) {
      await testInfo.attach(`screenshot-tab-${i}`, {
        body: await p
          .screenshot({ fullPage: true })
          .catch(() => Buffer.from("")),
        contentType: "image/png",
      });
    }
  }
});
```

The open-pages list immediately tells you: "Was `data.newTabPage` ever set?" If Tab 1 never appears, the `#openDetailsButton` click didn't trigger a new tab — that's your real bug location.

</details>

---

## 📚 References & Further Reading

### Official Documentation — Playwright

- [Test Steps (`test.step`)](https://playwright.dev/docs/api/class-test#test-step) — API reference and best practices for creating visible steps in HTML reports
- [Soft Assertions](https://playwright.dev/docs/test-assertions#soft-assertions) — Documentation on how soft assertions aggregate failures without stopping the test
- [Test Timeouts](https://playwright.dev/docs/test-timeouts) — The timeout cascade: test, expect, action, and global timeouts

### Advanced E2E Testing Strategies

- [Handling Multiple Pages & Contexts](https://playwright.dev/docs/pages) — How to correctly handle new tabs, popup windows, and completely isolated browser contexts
- [Global Setup and Teardown](https://playwright.dev/docs/test-global-setup-teardown) — Storing authentication state globally across tests to bypass UI login overhead
- [Test Info API (`test.info()`)](https://playwright.dev/docs/api/class-testinfo) — How to programmatically attach screenshots, raw data, or diagnostic logs on failure

---

**Navigation**: [← Chapter 06: Custom Fixtures](./06_Custom_Fixtures_Architecture.md) | [Index](../00_INDEX.md) | [→ Chapter 08: Browser Internals](./08_Browser_Internals_for_SDETs.md)


---

## Reality Check

**"test.step is just for organizing test code"**→ test.step creates named sections in the HTML report and trace viewer that make debugging failures drastically easier. Without steps, a failed test shows a flat list of actions with no logical grouping. With steps, you see: Given user is logged in (passed), When user submits order (FAILED at line 42). The reporting value far exceeds the code organization value.

**"Every action should be its own test.step"**→ Over-granular steps create noise: Step 1: Click username field. Step 2: Type username. Step 3: Click password field. These should be one step: Fill login credentials. Steps should map to BUSINESS ACTIONS (log in, add item to cart, submit order), not UI interactions (click, type, select). The report consumer cares about what the user did, not which DOM elements were manipulated.

**"E2E tests should cover every page"**→ E2E tests are expensive (slow, flaky, hard to maintain). Cover CRITICAL USER JOURNEYS: signup, login, purchase, payment. Cover HIGH-RISK FLOWS: checkout, data export, admin operations. Leave LOW-RISK pages (about us, static content, help pages) to visual regression or manual spot checks. The ROI of an E2E test is proportional to the business impact of the flow it covers.

**"E2E architecture means Page Object Model"**→ POM is one architectural pattern. Other valid patterns: screenplay pattern (actor-task-interaction model), component-based fixtures (composable test helpers), and action-based utilities (function libraries grouped by business action). POM works well for form-heavy applications with clear page boundaries. For single-page applications with dynamic components, component-based fixtures often produce more maintainable code.

**"Longer E2E tests are more efficient because they test more"**→ A 50-step E2E test that fails at step 47 tells you step 47 failed but not steps 48-50. The failed step might mask failures in later steps. Shorter focused tests (5-10 steps) fail independently, enabling parallel execution and providing clearer failure signals. The debugging cost of a failed 50-step test exceeds the setup cost of 5 independent 10-step tests.
