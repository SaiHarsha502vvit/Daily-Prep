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
test.describe('Citation Search Flow', () => {
  //            ↑ Groups related tests together.
  //              Shows as a header in the HTML report.
  //              Shared hooks (beforeEach, afterEach) apply to all tests inside.

  test('Agent can find paid citation by ID', async ({ page, request, account }) => {
    //  ↑ A single test scenario.

    await test.step('Fetch citation ID from API', async () => {
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

test('test A', async () => {
  citationId = 'CIT-001'; // sets it
});

test('test B', async () => {
  console.log(citationId); // 'CIT-001' — contaminated by test A!
  // In parallel mode: citationId is undefined or from a different worker's run!
});
```

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

test('Full citation E2E flow', async ({ page, request, account, dbPool }) => {

  // Initialize empty — fields filled in by each step
  const data: CitationTestData = {
    citationId: null,
    customerId: null,
    customerName: null,
    newTabPage: null,
    dbVerificationStatus: null,
  };

  // Step 1 sets data.citationId
  await test.step('Fetch citation from API', async () => {
    const response = await request.post('/api/citations/search', {
      data: { startDate: '2024-01-01', endDate: '2024-12-31' }
    });
    const body = await response.json();
    data.citationId = body?.citations?.[0]?.citationId ?? null;
    expect(data.citationId).not.toBeNull();
  });

  // Step 5 uses data.citationId from Step 1
  await test.step(`Enter citation ID ${data.citationId} into search form`, async () => {
    await page.fill('#citationNumberInput', data.citationId!);
    // The ! (non-null assertion) is safe here because Step 1 asserted it's not null
  });

  // Step 8 sets data.customerId
  await test.step('Extract customer ID from search results', async () => {
    const resultRow = page.locator('.ms-DetailsList-row').first();
    data.customerId = await resultRow.getAttribute('data-customer-id');
  });

  // Step 15 uses data from Steps 1 and 8
  await test.step('Verify DB record matches API and UI data', async () => {
    const result = await dbPool.request()
      .input('id', data.citationId)
      .query('SELECT customer_id, status FROM Citations WHERE citation_id = @id');
    
    expect(result.recordset[0].customer_id).toBe(data.customerId);
    expect(result.recordset[0].status).toBe('PAID');
  });
});
```

---

## 3. Cross-App Flows — Single Tab vs New Tab vs New Context

Your applications are interlinked. Understanding which pattern to use is critical.

### Pattern A: Same Tab Navigation

When clicking a button takes you to another page within the SAME browser session:

```typescript
await test.step('Click customer name to open customer details', async () => {
  await page.click('.customer-name-link');
  // Page navigates within the same tab
  await page.waitForURL('**/customer-details/**');
  // OR wait for a specific element on the new page:
  await page.locator('#customerDetailsHeader').waitFor({ state: 'visible' });
});
```

### Pattern B: New Tab Opens (target="_blank")

When a button opens a new browser tab. **This requires `Promise.all`.**

```typescript
await test.step('Click Edit opens Order details in new tab', async () => {
  // ❌ WRONG — race condition: tab might open and "close" before listener starts
  await page.click('#editButton');
  const newPage = await page.context().waitForEvent('page'); // might miss it!

  // ✅ CORRECT — listener starts BEFORE the click fires
  const [newTabPage] = await Promise.all([
    page.context().waitForEvent('page'),  // start listening
    page.click('#editButton'),             // trigger the open
  ]);
  
  // Store the new tab's Page object for later steps
  data.newTabPage = newTabPage;
  
  // Wait for the new tab to load
  await newTabPage.waitForLoadState('domcontentloaded');
  await newTabPage.locator('#orderDetailsHeader').waitFor({ state: 'visible' });
});

// Later steps interact with the new tab:
await test.step('Verify order status in new tab', async () => {
  await expect(data.newTabPage!.locator('.order-status')).toHaveText('ACTIVE');
});

// Always close the new tab in teardown:
// (Or handle in afterEach if applicable)
await data.newTabPage?.close();
```

### Pattern C: New BrowserContext (Completely Isolated Session)

When App A and App B need completely different cookies/sessions — different users logged in simultaneously:

```typescript
test('Admin approves what Agent submitted', async ({ browser }) => {
  // Note: use "browser" fixture, not "page" — you need to create contexts manually

  // Context 1: Agent session
  const agentContext = await browser.newContext({
    storageState: 'fixtures/agent-auth-state.json'
  });
  const agentPage = await agentContext.newPage();

  // Context 2: Admin session (different cookies, different user)
  const adminContext = await browser.newContext({
    storageState: 'fixtures/admin-auth-state.json'
  });
  const adminPage = await adminContext.newPage();

  await test.step('Agent submits citation request', async () => {
    await agentPage.goto(process.env.AGENT_APP_URL!);
    await agentPage.click('#submitCitation');
    // ...
  });

  await test.step('Admin reviews and approves the submission', async () => {
    await adminPage.goto(process.env.ADMIN_APP_URL!);
    await adminPage.locator('#pendingApprovals').waitFor({ state: 'visible' });
    await adminPage.click('#approveButton');
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
test('verify all elements on master search page', async ({ page }) => {
  await page.goto('/master-search');

  // Soft assertions — all of these run regardless of which ones fail
  await expect.soft(page.locator('#MasterSearchDropdown-option')).toBeVisible();
  await expect.soft(page.getByText('Card', { exact: true })).toBeVisible();
  await expect.soft(page.getByText('Smartcard')).toBeVisible();
  await expect.soft(page.getByRole('button', { name: 'Reset' })).toBeVisible();
  await expect.soft(page.locator('#serialNumberLabel')).toBeVisible();

  // Hard assertion at the end — fails the test if ANY soft assertion above failed
  // The error message lists ALL failed assertions, not just the first one
  expect(test.info().errors).toHaveLength(0);
});
```

**When to use soft assertions:**
- Page-wide validation (like your `verifyMasterSearchPageElementsAreVisible()`)
- Checking multiple independent fields on a form
- Reporting completeness at the end of a long test

**When NOT to use soft assertions:**
- When Step 5 data is required by Step 6 — a hard assertion in Step 5 prevents Step 6 from running with null data (which would cause a confusing error)

---

## 5. Full 15-Step Skeleton — Exactly Your Codebase Style

```typescript
import { test, expect } from '../fixtures';
import { MasterSearchPage } from '../pages/crm/MasterSearchPage';
import { CustomerDetailsTab } from '../pages/crm/CustomerDetailsTab';

// ─── Types ───────────────────────────────────────────────────────────────────
interface CitationFlowData {
  // From Step 1 (API)
  citationId: string | null;
  citationStatus: string | null;
  // From Step 4 (UI — search results)
  customerId: string | null;
  customerName: string | null;
  // From Step 8 (UI — new tab)
  newTabPage: import('@playwright/test').Page | null;
  orderStatus: string | null;
  // From Step 12 (DB)
  dbRecordConfirmed: boolean;
}

// ─── Test Suite ───────────────────────────────────────────────────────────────
test.describe('Citation — Full E2E Flow @crm @regression', () => {

  test.describe.configure({ timeout: 120000 }); // 2 min for the whole suite

  test('Agent searches citation, opens order, verifies DB', async ({
    page,
    request,
    account,
    masterSearchPage,
  }) => {

    const data: CitationFlowData = {
      citationId: null, citationStatus: null,
      customerId: null, customerName: null,
      newTabPage: null, orderStatus: null,
      dbRecordConfirmed: false,
    };

    // ── STEP 1 ── Fetch citation ID from API ─────────────────────────────
    await test.step('Fetch active citation ID from IVR API', async () => {
      const response = await request.post(
        `${process.env.API_HOST}/api/ivr/citations/search`,
        {
          headers: { Authorization: `Bearer ${account.accessToken}`, Accept: 'application/json' },
          data: { startDate: '2024-01-01', endDate: '2024-12-31', status: 'PAID' }
        }
      );
      expect(response.status()).toBe(200);
      const body = await response.json();
      data.citationId = body?.citations?.[0]?.citationId ?? null;
      data.citationStatus = body?.citations?.[0]?.status ?? null;
      expect(data.citationId, 'No citations returned from API').not.toBeNull();
    });

    // ── STEP 2 ── Navigate to app ─────────────────────────────────────────
    await test.step('Navigate to CRM Master Search', async () => {
      await page.goto(process.env.CRM_URL!);
      await masterSearchPage.waitForPageLoad();
    });

    // ── STEP 3 ── Verify page elements ────────────────────────────────────
    await test.step('Verify Master Search page loads correctly', async () => {
      await masterSearchPage.verifyMasterSearchPageElementsAreVisible();
    });

    // ── STEP 4 ── Enter citation ID in form ───────────────────────────────
    await test.step(`Enter citation ID: ${data.citationId}`, async () => {
      await page.fill('#citationNumberInput', data.citationId!);
    });

    // ── STEP 5 ── Click search ────────────────────────────────────────────
    await test.step('Click Search (3rd Search button)', async () => {
      await masterSearchPage.searchButton(2).click();
    });

    // ── STEP 6 ── Wait for and verify results ─────────────────────────────
    await test.step('Verify search results table appears', async () => {
      await page.locator('.ms-DetailsList-row').first().waitFor({
        state: 'visible', timeout: 30000
      });
      const rowCount = await page.locator('.ms-DetailsList-row').count();
      expect(rowCount, 'Expected at least 1 result row').toBeGreaterThan(0);
    });

    // ── STEP 7 ── Extract customer info from results ───────────────────────
    await test.step('Extract customer details from result row', async () => {
      const firstRow = page.locator('.ms-DetailsList-row').first();
      data.customerId = await firstRow.getAttribute('data-customer-id');
      data.customerName = await firstRow.locator('[data-col="customerName"]').textContent();
      expect(data.customerId, 'Customer ID missing from result row').not.toBeNull();
    });

    // ── STEP 8 ── Click customer name — opens in new tab ──────────────────
    await test.step('Click customer name to open Customer Details in new tab', async () => {
      const [newTabPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.locator(`//div[contains(text(),'${data.customerName}')]`).click(),
      ]);
      data.newTabPage = newTabPage;
      await newTabPage.waitForLoadState('domcontentloaded');
    });

    // ── STEP 9 ── Interact with new tab ───────────────────────────────────
    await test.step('Verify Customer Details tab loads in new tab', async () => {
      const customerDetails = new CustomerDetailsTab(data.newTabPage!);
      await customerDetails.waitForPageLoad();
      await expect(data.newTabPage!.getByRole('tab', { name: 'Customer Details' }))
        .toHaveAttribute('aria-selected', 'true');
    });

    // ── STEP 10 ── Navigate sub-tab ───────────────────────────────────────
    await test.step('Navigate to Phones sub-tab', async () => {
      await data.newTabPage!.getByRole('tab', { name: 'Phones' }).click();
      // Wait for tab content to render (SPA tab switch — no page navigation)
      await data.newTabPage!.locator('.phone-list-container').waitFor({
        state: 'visible', timeout: 15000
      });
    });

    // ── STEPS 11-13: Further UI verification ──────────────────────────────
    // ... (your application-specific steps)

    // ── STEP 14 ── API cross-verification ─────────────────────────────────
    await test.step('Cross-verify customer via API matches UI data', async () => {
      const response = await request.get(
        `${process.env.API_HOST}/api/customers/${data.customerId}`,
        { headers: { Authorization: `Bearer ${account.accessToken}` } }
      );
      const body = await response.json();
      expect(body.name).toBe(data.customerName!.trim());
    });

    // ── STEP 15 ── DB verification ────────────────────────────────────────
    await test.step('Verify citation record exists in database with PAID status', async () => {
      // DB verification — see 22_Advanced_API_Testing/06_DB_Testing_SQL_Bridge.md
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
test('Full citation E2E flow', async ({ page, request, account }, testInfo) => {
  const data: CitationFlowData = { citationId: null, /* ... */ };

  // Attach the accumulator state on EVERY failure (runs after test finishes)
  // This gives you the data snapshot at the point of failure
  testInfo.annotations.push({ type: 'data-snapshot', description: JSON.stringify(data, null, 2) });

  await test.step('Fetch citation from API', async () => {
    // ...
    data.citationId = 'CIT-001';
    // Attach the raw API response to the report:
    await testInfo.attach('api-response-step1', {
      body: JSON.stringify({ citationId: data.citationId }),
      contentType: 'application/json',
    });
  });

  await test.step('Take screenshot of search results', async () => {
    // ...
    // Attach a screenshot to the report inline:
    const screenshot = await page.screenshot({ fullPage: false });
    await testInfo.attach('search-results-screenshot', {
      body:        screenshot,
      contentType: 'image/png',
    });
  });
});
```

### `afterEach` Failure Diagnostic Hook

```typescript
// In your fixture or test.describe block:
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    // Only run on failure — attach diagnostic info
    await testInfo.attach('page-url-on-failure', {
      body:        page.url(),
      contentType: 'text/plain',
    });
    await testInfo.attach('screenshot-on-failure', {
      body:        await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await testInfo.attach('dom-html-on-failure', {
      body:        await page.content(),
      contentType: 'text/html',
    });
    // Log network errors:
    const consoleMessages: string[] = [];
    page.on('console', m => {
      if (m.type() === 'error') consoleMessages.push(m.text());
    });
    if (consoleMessages.length) {
      await testInfo.attach('console-errors', {
        body:        consoleMessages.join('\n'),
        contentType: 'text/plain',
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
  timeout:   120_000,  // 1. Global default: each TEST has 120s
  expect: {
    timeout: 10_000,   // 2. Default assertion timeout (toBeVisible etc.)
  },
  use: {
    actionTimeout: 30_000,  // 3. Default action timeout (click, fill, etc.)
  },
});

// Per-test override:
test('Long multi-step flow', async ({ page }) => {
  test.setTimeout(300_000);  // 4. This test gets 5 minutes

  // Per-step timeout (Playwright v1.39+):
  await test.step('Heavy D365 load', async () => {
    // ...
  }, { timeout: 60_000 });  // 5. This step has 60s budget

  // Per-assertion override:
  await expect(page.locator('.results')).toBeVisible({ timeout: 45_000 });  // 6.

  // Per-action override:
  await page.click('#slowButton', { timeout: 20_000 });  // 7.
});

// How the cascade works:
// If the step timeout (60s) fires first → step fails, test continues if possible
// If the test timeout (300s) fires first → entire test fails immediately
// If the action timeout (30s) fires → action throws, step fails
// Step timeout MUST be < test timeout to be meaningful
```

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
  stepName:    string,
  stepFn:      () => Promise<T>,
  maxAttempts  = 3,
  delayMs      = 2000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await test.step(
        attempt === 1 ? stepName : `${stepName} [retry ${attempt}/${maxAttempts}]`,
        stepFn
      );
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        console.warn(`[retryStep] "${stepName}" failed (attempt ${attempt}/${maxAttempts}): ${err}`);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  throw lastError;
}

// Usage: wrap steps that are inherently flaky (e.g., D365 slow renders)
await retryStep(
  'Click Edit button in D365 command bar',
  async () => {
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(page.locator('.edit-form')).toBeVisible({ timeout: 15_000 });
  },
  3,    // up to 3 attempts
  3000  // 3s between attempts
);
```

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
await test.step('Fetch citation', async () => {
  const citationId = body.citations[0].citationId; // ← new local variable!
  // outer citationId is still null
});
```

Fix: use `data.citationId = ...` on the accumulator object, or ensure the assignment targets the outer-scope variable:
```typescript
await test.step('Fetch citation', async () => {
  citationId = body.citations[0].citationId; // ← assigns to outer scope
});
```
The Data Accumulator pattern (a typed `data` object) avoids this entire class of bugs.
</details>

**Challenge 2 (New Tab Race Condition):** This code occasionally fails with "Event 'page' was not received." Why?
```typescript
await page.click('#openDetailsButton');
const [newTab] = await page.context().waitForEvent('page');
```
<details><summary>Answer</summary>

The click fires and the new tab opens before `waitForEvent('page')` starts listening. The event is emitted and never heard — so `waitForEvent` waits until its timeout and throws. Fix: use `Promise.all` to start listening before triggering the click:
```typescript
const [newTab] = await Promise.all([
  page.context().waitForEvent('page'),
  page.click('#openDetailsButton'),
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

  // Final hard check — fails the test once with all failures listed:
  expect(test.info().errors).toHaveLength(0);
}
```
</details>

---

**Challenge 4 [Timeout Cascade]:** A test has `test.setTimeout(60_000)`. A step inside has `{ timeout: 90_000 }`. The step takes 70 seconds. What happens?

<details><summary>Answer</summary>

The **test timeout fires at 60 seconds** and kills the entire test — even though the step's own timeout was 90s. The step timeout is bounded by the parent test timeout. Setting `step.timeout > test.timeout` is meaningless: the test will always die first.

Rule: `step timeout` ≤ `test timeout` ≤ `suite timeout (via test.describe.configure)`.

**Fix:**
```typescript
test('Long step test', async () => {
  test.setTimeout(120_000);  // 1. Increase test timeout first
  await test.step('Slow operation', async () => {
    // ...
  }, { timeout: 90_000 });  // 2. Now step timeout (90s) < test timeout (120s)
});
```
</details>

---

**Challenge 5 [Data Accumulator Debug]:** A 12-step test fails at Step 8 with `TypeError: Cannot read properties of null (reading 'click')`. The accumulator field involved is `data.newTabPage`. What information would you attach in `afterEach` to diagnose this faster next time?

<details><summary>Answer</summary>

```typescript
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    // 1. The accumulator state at failure time
    await testInfo.attach('accumulator-snapshot', {
      body:        JSON.stringify(data, null, 2),
      contentType: 'application/json',
    });
    // 2. List of all open pages in the context — was the new tab ever opened?
    const openPages = page.context().pages().map((p, i) => `Tab ${i}: ${p.url()}`);
    await testInfo.attach('open-pages-on-failure', {
      body:        openPages.join('\n'),
      contentType: 'text/plain',
    });
    // 3. Screenshot from EACH open page
    for (const [i, p] of page.context().pages().entries()) {
      await testInfo.attach(`screenshot-tab-${i}`, {
        body:        await p.screenshot({ fullPage: true }).catch(() => Buffer.from('')),
        contentType: 'image/png',
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
