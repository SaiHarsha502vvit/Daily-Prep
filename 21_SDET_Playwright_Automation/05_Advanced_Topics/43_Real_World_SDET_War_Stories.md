# 43. Real-World SDET War Stories — Problems, Diagnoses & Solutions

**Navigation**: [← Chapter 42: Polling Patterns](./42_Polling_Async_Data_Patterns.md) | [Index](../00_INDEX.md) | [→ Chapter 44: Enterprise API Client Library](./44_Enterprise_API_Client_Library.md)

**Cross-links:**

- [`26_Flakiness_Diagnosis_and_Fixing.md`](./26_Flakiness_Diagnosis_and_Fixing.md) — Systematic flakiness framework
- [`08_Browser_Internals_for_SDETs.md`](../02_Core_Architecture/08_Browser_Internals_for_SDETs.md) — The internals behind ghost click problems
- [`09_Parallel_Execution_Workers.md`](../02_Core_Architecture/09_Parallel_Execution_Workers.md) — Data collision war stories

---

## 5W1H

- **WHAT**: 14 real-world SDET problems encountered in enterprise test automation — each with the symptom, the diagnostic steps, the root cause, the fix, and the prevention rule.
- **WHY**: Text-book patterns teach you the theory. War stories teach you what goes wrong in reality. Every engineer in this list wasted hours before finding the root cause. You don't have to.
- **WHO**: SDETs working on D365/CRM, enterprise SPA/MPA hybrid environments, CI/CD pipelines, and parallel test execution.
- **WHEN**: Read this when you encounter a test failure you can't explain. Come back to it as a reference when diagnosing flaky tests.
- **HOW**: Each story follows the same format: **Situation → Symptoms → Root Cause → Fix → Prevention Rule**.

---

## War Story 1: The Ghost Click — Button Visible, Click Does Nothing

### Situation

D365 CRM, CommandBar toolbar. A test clicks "Edit Customer" button. The test passes (no error thrown). But the Customer Edit form never opens.

### Symptoms

```
✓ test.step('Click Edit Customer') — PASSES (no exception)
✗ test.step('Fill in First Name') — FAILS: Timeout 30000ms exceeded
  locator: [data-id="firstname"]
  waiting for visible...

Debugging: page.locator('button.edit-customer').isVisible() → true
```

### Root Cause Diagnosis

```typescript
// Step 1: Is the element where we think it is?
const box = await page.locator('[aria-label="Edit Customer"]').boundingBox();
console.log(box); // { x: 100, y: 50, width: 120, height: 32 }

// Step 2: What element IS at those coordinates?
const elementAtPoint = await page.evaluate(
  ({ x, y }) => {
    const el = document.elementFromPoint(x + 60, y + 16); // center of button
    return { tag: el?.tagName, class: el?.className, id: el?.id };
  },
  { x: box!.x, y: box!.y },
);

console.log(elementAtPoint);
// Output: { tag: 'DIV', class: 'ms-Layer', id: 'layer-panel-overlay' }
// The click is hitting an INVISIBLE overlay div, NOT the button!
```

**Root Cause**: D365 CommandBar has a panel animation. During animation:

1. The panel slides in using CSS `transform: translateX()`
2. An overlay `<div class="ms-Layer">` exists at `pointer-events: auto`
3. The button's **bounding box** is correct (element stopped moving — passes "stable" check)
4. But the overlay sits on top at the pixel level → the click lands on the overlay
5. Playwright's `'receives events'` actionability check confirms the overlay receives the click
6. The click fires on the overlay — which does nothing

### Fix

```typescript
// ❌ BEFORE: just clicked and hoped
await page.getByRole("menuitem", { name: "Edit Customer" }).click();

// ✅ AFTER: wait for the overlay to DISAPPEAR first
// The overlay disappears when the animation completes
await expect(page.locator('.ms-Layer[id^="layer-panel"]')).toHaveCount(0, {
  timeout: 10_000,
});

// OR: use click with position retry (slower but more robust):
await page
  .getByRole("menuitem", { name: "Edit Customer" })
  .click({ timeout: 30_000 });
// Playwright's actionability keeps retrying 'receives events' until the button is unobscured
```

### Prevention Rule

> **Rule**: When a click "succeeds" but the expected result doesn't happen, check what element is ACTUALLY at the click coordinates. Use `page.evaluate(document.elementFromPoint(x, y))`. Invisible overlays are the #1 cause of ghost clicks in D365.

---

## War Story 2: The Stale Session — Tests Fail After 45 Minutes

### Situation

Large regression suite, 200 tests, estimated run time 55 minutes. Tests 1–85 pass. Test 86 suddenly fails with `401 Unauthorized`. All subsequent tests fail the same way.

### Symptoms

```
Test 86/200 — FAILED
  Error: API call returned 401
  URL: POST /api/v2/citations
  Response body: { "error": "Token expired", "code": "AUTH_TOKEN_EXPIRED" }

Test 87/200 — FAILED (same error)
Test 88/200 — FAILED (same error)
...
Test 200/200 — FAILED (same error)
```

No network error. No application error. Just `401` from test 86 onward.

### Root Cause Diagnosis

```typescript
// Decode the JWT from the stored auth token
const token = process.env.TEST_AUTH_TOKEN!;
const payload = JSON.parse(
  Buffer.from(token.split(".")[1], "base64").toString(),
);

console.log({
  issuedAt: new Date(payload.iat * 1000).toISOString(),
  expiresAt: new Date(payload.exp * 1000).toISOString(),
  ttlMinutes: (payload.exp - payload.iat) / 60,
});
// Output:
// issuedAt:  2026-05-28T08:00:00.000Z
// expiresAt: 2026-05-28T08:45:00.000Z
// ttlMinutes: 45

// The token expires 45 minutes after issue.
// The test suite starts at 08:00.
// Test 86 starts at 08:47 → token expired 2 minutes ago.
```

**Root Cause**: The OAuth token stored in `storageState.json` has a 45-minute TTL. The test suite takes 55 minutes. The token stored during `globalSetup` expires mid-run.

### Fix

```typescript
// fixtures/auth.fixture.ts
// Worker-scoped account fixture that automatically refreshes expired tokens

import { test as base } from "@playwright/test";
import { decodeJwtExpiry, refreshAccessToken } from "../utils/auth";

interface Account {
  userId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
}

export const test = base.extend<object, { account: Account }>({
  account: [
    async ({ browser }, use) => {
      // Initial login
      let account = await loginAndGetAccount(browser);

      // Before each test that uses this fixture, check token expiry
      const TOKEN_REFRESH_BUFFER_MS = 2 * 60 * 1000; // Refresh if < 2 min remaining

      const getValidAccount = async (): Promise<Account> => {
        const now = Date.now();
        const expiresAt = account.tokenExpiresAt.getTime();
        const remainingMs = expiresAt - now;

        if (remainingMs < TOKEN_REFRESH_BUFFER_MS) {
          console.log(
            `[AuthFixture] Token expires in ${Math.round(remainingMs / 1000)}s, refreshing...`,
          );
          account = await refreshAccessToken(account.refreshToken);
          console.log(
            `[AuthFixture] Token refreshed. New expiry: ${account.tokenExpiresAt.toISOString()}`,
          );
        }

        return account;
      };

      // Expose a proxy that auto-refreshes
      await use({
        get userId() {
          return account.userId;
        },
        get refreshToken() {
          return account.refreshToken;
        },
        get tokenExpiresAt() {
          return account.tokenExpiresAt;
        },
        get accessToken() {
          // Called synchronously — token should have been refreshed in beforeEach
          return account.accessToken;
        },
      } as Account);
    },
    { scope: "worker" },
  ],
});

// In playwright.config.ts:
// Add a beforeEach hook that refreshes the token if needed
// OR: call getValidAccount() at the start of each fixture that uses account
```

```typescript
// utils/auth.ts
import jwt from "jsonwebtoken";

export function decodeJwtExpiry(token: string): Date {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");
  const payload = JSON.parse(
    Buffer.from(parts[1], "base64url").toString("utf8"),
  );
  if (!payload.exp) throw new Error("JWT has no exp claim");
  return new Date(payload.exp * 1000);
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<Account> {
  const response = await fetch(process.env.TOKEN_REFRESH_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.OAUTH_CLIENT_ID!,
      client_secret: process.env.OAUTH_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) throw new Error(`Token refresh failed: ${response.status}`);

  const body = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user_id: string;
  };

  return {
    userId: body.user_id,
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    tokenExpiresAt: new Date(Date.now() + body.expires_in * 1000),
  };
}
```

### Prevention Rule

> **Rule**: ALWAYS decode your JWT token and log its expiry time during `globalSetup`. Compare `ttlMinutes` to your estimated suite duration. If `suite duration > token TTL × 0.9`, implement token refresh in the fixture.

---

## War Story 3: The Silent 200 — API Says Success, Data Is Wrong

### Situation

A citation creation test has been in the suite for 3 months. Always green. Production incident: 50 citations were created with the wrong `customerId` — they were assigned to the wrong customer. Investigation reveals the issue has been happening for 2 weeks.

### Symptoms

```
Test "Create citation — API returns 201" → PASSES for 3 months
Production incident: Citations created via bulk upload have wrong customerId
Postmortem question: "Why didn't the tests catch this?"
```

### Root Cause Diagnosis

```typescript
// The existing test that "passed":
test("Create citation returns 201", async ({ citationsClient }) => {
  const citation = await citationsClient.create({
    customerId: account.userId,
    amount: 150.0,
    type: "PARKING",
  });

  // ❌ Only asserted on status code!
  expect(response.status).toBe(201);
  // Never checked: citation.customerId === account.userId
  // Never checked: citation.amount === 150.00
  // Never checked: citation.type === 'PARKING'
});
```

**Root Cause**: The API had a race condition in the bulk upload handler. When multiple citations were created simultaneously, the handler sometimes used the wrong `customerId` from a shared cache. The API still returned `201` with the correct `citationId` — but the `customerId` in the database was wrong.

The test was asserting on the wrong layer: HTTP status tells you the API received the request. It doesn't tell you the data was stored correctly.

### Fix

```typescript
// ✅ Three-layer verification — the correct pattern
test("Create citation — verified at API + DB level", async ({
  citationsClient,
  dbClient,
  account,
}) => {
  const payload = PayloadsCitation.parking({ customerId: account.userId });

  // Layer 1: API response — check BODY, not just status
  const citation = await citationsClient.create(payload);

  expect(citation.citationId).toMatch(/^CIT-/);
  expect(citation.customerId).toBe(account.userId); // ← THE CRITICAL CHECK
  expect(citation.amount).toBe(payload.amount);
  expect(citation.type).toBe("PARKING");
  expect(citation.status).toBe("PENDING");

  // Layer 2: DB verification — ground truth
  const dbRow = await dbClient.queryOne<{
    customer_id: string;
    status: string;
  }>(
    "SELECT customer_id, status, amount FROM citations WHERE citation_id = $1",
    [citation.citationId],
  );
  expect(dbRow?.customer_id).toBe(account.userId); // ← DB must agree with API
  expect(dbRow?.status).toBe("PENDING");
  expect(Number(dbRow?.amount)).toBe(payload.amount);
});
```

### Prevention Rule

> **Rule**: HTTP `2xx` ≠ correct data. Always assert on the **response body** fields that matter to your business logic. For write operations (POST/PUT/PATCH), add DB verification as the ground-truth layer. A test that only checks status codes is a false sense of security.

---

## War Story 4: The Parallel Collision — Tests Pass Solo, Fail in CI

### Situation

Test suite runs fine locally (single worker). In CI with 4 workers, random failures every run. Different tests fail each time. No consistent pattern.

### Symptoms

```
CI Run 1:  Tests 3, 15, 42 fail with "Citation already exists for customer"
CI Run 2:  Tests 7, 23, 51 fail with "Duplicate email address"
CI Run 3:  Tests 1, 39 fail with "Customer account at maximum citations limit"
```

Complete randomness. None of these errors appear locally.

### Root Cause Diagnosis

```typescript
// The problematic test file (many tests use same customer):
const TEST_CUSTOMER_ID = "CUS-TEST-001"; // module-level — shared across ALL tests

test("Create citation for test customer", async ({ citationsClient }) => {
  await citationsClient.create({
    customerId: TEST_CUSTOMER_ID, // ← ALL workers hit the same customer!
    amount: 150,
  });
});

test("Get citations for test customer", async ({ citationsClient }) => {
  const citations = await citationsClient.getAll({
    customerId: TEST_CUSTOMER_ID,
  });
  expect(citations.length).toBe(1); // ← Worker 2 created 3 citations → this fails
});

test("Delete all test citations", async ({ citationsClient }) => {
  await citationsClient.deleteAll({ customerId: TEST_CUSTOMER_ID });
  // ← Worker 3 is still creating while Worker 1 deletes!
});
```

**Root Cause**: Module-level shared test data. `TEST_CUSTOMER_ID` is the same across all 4 workers. Workers simultaneously create, assert on, and delete data for the same customer. Classic race condition.

### Fix

```typescript
// ✅ Worker-scoped unique customer — no collision possible
export const test = base.extend<object, { account: TestAccount }>({
  account: [
    async ({ request }, use) => {
      // Each worker creates its OWN isolated test account
      const uniqueEmail = `test-worker-${process.env.TEST_PARALLEL_INDEX ?? 0}-${Date.now()}@testenv.com`;

      const createResponse = await request.post("/api/v2/users", {
        data: {
          email: uniqueEmail,
          name: "Playwright Test User",
          role: "CUSTOMER",
          isTestUser: true, // flagged for easy cleanup
        },
      });
      const testAccount = (await createResponse.json()) as TestAccount;

      await use(testAccount);

      // Teardown: delete this worker's account and all its data
      await request.delete(`/api/v2/users/${testAccount.userId}?cascade=true`);
    },
    { scope: "worker" },
  ],
});

// Now each test file gets its own isolated customer:
test("Create citation", async ({ citationsClient, account }) => {
  await citationsClient.create({
    customerId: account.userId, // Worker 1's unique customer
    amount: 150,
  });
  // Worker 2 creates for its own unique customer — zero collision
});
```

### Prevention Rule

> **Rule**: **Module-level variables with mutable state are banned** in parallel test suites. Every piece of test data that is written to must be unique per test (or per worker). Use `Date.now()`, `crypto.randomUUID()`, or `test.info().workerIndex` to generate unique identifiers.

---

## War Story 5: The ARIA Impostor — Wrong Element Found

### Situation

A D365 CRM page has two forms: a customer header section with "Edit" in the CommandBar, and a citation details section with its own "Edit" button. A test uses `page.getByRole('button', { name: 'Edit' })` — it clicks the wrong "Edit".

### Symptoms

```
Test "Edit citation status" fails:
  Expected: Citation status form to open
  Actual: Customer edit form opened instead

The element WAS clicked. The correct edit action did NOT happen.
```

### Root Cause Diagnosis

```typescript
// Debug: how many elements match?
const editButtons = page.getByRole("button", { name: "Edit" });
const count = await editButtons.count();
console.log(`Found ${count} 'Edit' buttons`); // Output: Found 3

// What are they?
for (let i = 0; i < count; i++) {
  const outerHTML = await editButtons.nth(i).evaluate((el) => el.outerHTML);
  console.log(`[${i}]: ${outerHTML.substring(0, 100)}`);
}
// [0]: <li class="ms-CommandBar-overflowButton" role="menuitem" ...>Edit</li>   ← WRONG ROLE
// [1]: <button class="ms-Button customer-edit" aria-label="Edit">Edit</button>  ← WRONG SECTION
// [2]: <button class="ms-Button citation-edit" aria-label="Edit">Edit</button>  ← CORRECT

// Problem 1: D365 wraps CommandBar items in <li role="menuitem"> — getByRole('button') misses these
// Problem 2: Multiple 'Edit' labels exist — first match is returned (not necessarily the right one)
```

### Fix

```typescript
// ❌ BEFORE: ambiguous, wrong role
await page.getByRole("button", { name: "Edit" }).click();

// ✅ AFTER: Scope + correct role
// Approach 1: Scope to the specific panel/section
const citationPanel = page.locator('[data-testid="citation-detail-panel"]');
await citationPanel.getByRole("button", { name: "Edit" }).click();

// Approach 2: If it's in a CommandBar (D365), use menuitem
await page
  .locator('[data-id="commandbar"]')
  .getByRole("menuitem", { name: "Edit Citation" })
  .click();

// Approach 3: Use data-testid (most stable)
await page.locator('[data-testid="citation-edit-btn"]').click();

// How to find the real ARIA role:
// Chrome DevTools → Elements tab → click element → Accessibility tab (right side)
// Role field shows the exact ARIA role Playwright will use
```

### Prevention Rule

> **Rule**: When using `getByRole()`, always **verify uniqueness**: `expect(locator).toHaveCount(1)` in your diagnostic step. D365 CommandBar wraps buttons in `role="menuitem"` li elements — the visual "button" is a child of the menuitem. Always check the Accessibility panel in DevTools for the real role.

---

## War Story 6: The Time Zone Trap — Tests Fail on CI on Specific Days

### Situation

Tests run fine on developer machines (IST, UTC+5:30). In CI (AWS us-east-1, UTC-5), most tests pass but date-related tests fail intermittently. Failures cluster around midnight UTC and end-of-month.

### Symptoms

```
Local:  PASSES at any time
CI:     FAILS after 18:30 UTC (= 00:00 IST next day)
CI:     FAILS first day of new month for "last month's records" tests
```

### Root Cause Diagnosis

```typescript
// The problematic code:
const today = new Date().toLocaleDateString("en-GB"); // Returns DD/MM/YYYY in IST locale
// At 18:30 UTC:
// Developer machine (IST): 00:00 on 2026-06-01 → '01/06/2026'
// CI server (UTC):         18:30 on 2026-05-31 → '31/05/2026'
// DIFFERENT DATES → assertion fails

// The assertion that fails:
await expect(page.locator('[data-testid="issue-date"]')).toHaveText(
  "01/06/2026",
);
// CI sees '31/05/2026' because the server is in UTC

// End-of-month failure:
const lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1); // getMonth() is local time
// Developer: May → April in IST
// CI at 18:30 UTC on May 31: UTC is still May → getMonth() - 1 = April ✓
// CI at 19:00 UTC on May 31: UTC = May 31, IST = June 1 → setMonth(6-1-1) = May!
// Now the test is looking at THIS month's data as if it's last month
```

### Fix

```typescript
// utils/date.ts — Timezone-safe date utilities for tests

/**
 * Returns today's date as a string, in the application's display timezone.
 * Never use `new Date().toLocaleDateString()` — depends on where the test runs.
 */
export function appDateString(date: Date = new Date()): string {
  // Always format in UTC for consistent test results
  // Change to your app's actual timezone if needed
  return date.toLocaleDateString("en-GB", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }); // Returns 'DD/MM/YYYY' consistently regardless of where test runs
}

/**
 * Returns a fixed test date (not today) to avoid any time-of-day issues.
 * Use for assertions where the exact date matters but shouldn't vary.
 */
export function stableTestDate(
  year: number,
  month: number,
  day: number,
): { iso: string; display: string } {
  const d = new Date(Date.UTC(year, month - 1, day));
  return {
    iso: d.toISOString().split("T")[0], // '2026-05-15'
    display: appDateString(d), // '15/05/2026'
  };
}

// Usage in test:
const testDate = stableTestDate(2026, 5, 15);

// Create citation with a specific date (not today)
const citation = await citationsClient.create(
  PayloadsCitation.parking({ issueDate: testDate.iso }),
);

// Assert the UI shows the date in the expected format
await expect(page.locator('[data-testid="issue-date"]')).toHaveText(
  testDate.display,
);
// Passes everywhere: London, IST, UTC-5 — because we're not using "today"
```

### Prevention Rule

> **Rule**: **Never use `new Date()` in test assertions** without timezone normalization. Tests that pass or fail based on what time it is in what timezone are lying. Either: (1) use a fixed, explicit date in test data; (2) use `appDateString(date, { timeZone: 'UTC' })` for consistent formatting; (3) avoid asserting on dates that could change between test start and assertion.

---

## War Story 7: The Frame Trap — Element Exists, Cannot Interact

### Situation

A test uses `page.locator('#submitBtn')`. Calling `.count()` returns 1. Calling `.click()` throws: `"Error: Element is not attached to the DOM"`.

### Symptoms

```typescript
await page.locator("#submitBtn").count(); // → 1 ✓
await page.locator("#submitBtn").click(); // → Error: not attached to DOM
```

The element clearly exists (count=1) but cannot be interacted with.

### Root Cause Diagnosis

```typescript
// Is the element inside an iframe?
const iframes = await page.locator("iframe").count();
console.log(`Found ${iframes} iframes`); // → Found 2

// Get iframe sources
const frameSources = await page
  .locator("iframe")
  .evaluateAll((frames) =>
    frames.map((f: HTMLIFrameElement) => f.src || f.name || f.id),
  );
console.log(frameSources);
// ['https://forms.company.com/embedded-payment-form', 'about:blank']

// Check if #submitBtn is IN the iframe
const inIframe = await page
  .frames()
  .find((f) => f.url().includes("forms.company.com"))
  ?.locator("#submitBtn")
  .count();
console.log(`Element in iframe: ${inIframe}`); // → 1
```

**Root Cause**: `page.locator()` queries the main frame's DOM tree. The iframe exposes its URL reference in the main frame's DOM (the `<iframe>` tag), but the `#submitBtn` is inside the iframe's own DOM — a completely separate document. Playwright's `page.locator('#submitBtn')` finds the element reference but any interaction tries to operate in the main frame context → "not attached".

### Fix

```typescript
// ❌ BEFORE: queries main frame, fails on interaction
await page.locator("#submitBtn").click();

// ✅ AFTER: explicitly target the iframe
const paymentFrame = page.frameLocator('iframe[src*="forms.company.com"]');
await paymentFrame.locator("#submitBtn").click();

// For dynamic iframes (src changes):
await paymentFrame
  .locator("#submitBtn")
  .waitFor({ state: "visible", timeout: 30_000 });
await paymentFrame.locator("#submitBtn").click();

// For D365 embedded control iframes:
const controlFrame = page.frameLocator(
  `iframe[data-lp-id="MscrmControls.FieldControls.TextBoxControl"]`,
);
await controlFrame.locator("input").fill("New Value");

// Getting all frame URLs for debugging:
page.frames().forEach((f) => console.log(`Frame: ${f.name()} | ${f.url()}`));
```

```typescript
// POM pattern for iframed forms
export class PaymentFormIFrame {
  private readonly frame: FrameLocator;

  constructor(page: Page) {
    // Wait for the iframe to load before constructing
    this.frame = page.frameLocator('iframe[src*="forms.company.com"]');
  }

  // All locators use this.frame, not page
  get cardNumber() {
    return this.frame.locator("#card-number");
  }
  get expiry() {
    return this.frame.locator("#expiry");
  }
  get cvv() {
    return this.frame.locator("#cvv");
  }
  get submitBtn() {
    return this.frame.locator("#submitBtn");
  }

  async fillAndSubmit(card: CardDetails): Promise<void> {
    await this.cardNumber.fill(card.number);
    await this.expiry.fill(card.expiry);
    await this.cvv.fill(card.cvv);
    await this.submitBtn.click();
  }
}
```

### Prevention Rule

> **Rule**: If a locator returns count > 0 but interaction throws "not attached", **check for iframes**. Run `page.frames().forEach(f => console.log(f.url()))` to list all frames. Use `page.frameLocator(selector)` to interact with iframe content.

---

## War Story 8: The Cookie Monster — Tests Fail After Specific Test Order

### Situation

Test B passes when run alone. When Test A runs first, Test B fails with wrong user data — it gets Test A's customer's data instead of its own.

### Symptoms

```
Run: Test A alone → PASS
Run: Test B alone → PASS
Run: Test A, then Test B → Test B FAILS
  Expected: customerId = 'CUS-B-001'
  Actual:   customerId = 'CUS-A-001'
```

### Root Cause Diagnosis

```typescript
// Test A code (the polluter):
test("Test A — Admin sets test cookies", async ({ page, context }) => {
  // Test A manually sets a session cookie for impersonating a customer
  await context.addCookies([
    {
      name: "X-Impersonate-Customer",
      value: "CUS-A-001",
      domain: ".crm.company.com",
      path: "/",
      // ❌ No expiry set! Cookie lives for the session
    },
  ]);

  await page.goto("/admin/dashboard");
  // ... test runs ...
  // ❌ FORGOT TO CLEAR THE COOKIE AFTER TEST
});

// Test B code (the victim):
test("Test B — Customer sees own data", async ({ page }) => {
  await page.goto("/customer/profile");
  // The browser still has the X-Impersonate-Customer cookie from Test A!
  // The app uses this cookie to show CUS-A-001's data instead of Test B's user
  const customerId = await page
    .locator('[data-testid="customer-id"]')
    .textContent();
  expect(customerId).toBe("CUS-B-001"); // ← FAILS: shows 'CUS-A-001'
});
```

**Root Cause**: Playwright provides isolated BrowserContext per test by default — BUT if Test A and Test B share the same worker AND the same context, cookies set in Test A persist. In this codebase, a shared BrowserContext was being used across tests to "save login time" — which also shared cookies.

### Fix

```typescript
// ✅ Fix 1: Never share BrowserContext across tests that modify cookies
// In playwright.config.ts — each test gets a fresh context:
export default defineConfig({
  use: {
    // Default: each test gets own BrowserContext (fresh cookies)
    // DO NOT do: storageState loaded from shared context
  },
});

// ✅ Fix 2: If you MUST use addCookies, clean up in afterEach
test.afterEach(async ({ context }) => {
  await context.clearCookies(); // Clean all cookies after every test
});

// ✅ Fix 3: The cookie audit assertion — detect contamination early
async function assertCleanCookieState(
  page: Page,
  expectedDomains: string[] = [],
): Promise<void> {
  const cookies = await page.context().cookies();
  const unexpectedCookies = cookies.filter(
    (c) =>
      !expectedDomains.includes(c.domain) || c.name.startsWith("X-Impersonate"), // never want impersonation in test start
  );

  expect(
    unexpectedCookies,
    `Test started with unexpected cookies: ${JSON.stringify(unexpectedCookies)}`,
  ).toHaveLength(0);
}

// Use in beforeEach for tests that are sensitive to cookie state
test.beforeEach(async ({ page }) => {
  await assertCleanCookieState(page);
});
```

### Prevention Rule

> **Rule**: Tests that call `context.addCookies()` MUST call `context.clearCookies()` in afterEach. Better: use Playwright's default fresh-context-per-test behavior. Audit your worker setup for any shared context that persists between tests.

---

## War Story 9: The Network Race — Passes Locally, Fails in CI

### Situation

`page.waitForResponse()` timeout of 5000ms. Works perfectly locally. In CI, intermittent timeouts on this specific assertion.

### Symptoms

```
Local:  PASSES consistently
CI:     FAILS ~30% of runs
  Error: page.waitForResponse: Timeout 5000ms exceeded.
  Call log:
    - waiting for response url contains "/api/citations"
    - method: POST
```

### Root Cause Diagnosis

```typescript
// The test code:
const [response] = await Promise.all([
  page.waitForResponse(
    (r) =>
      r.url().includes("/api/citations") && r.request().method() === "POST",
    { timeout: 5000 }, // ← only 5 seconds!
  ),
  page.getByRole("button", { name: "Save" }).click(),
]);
```

**Root Cause**: Local dev runs against `localhost:3000`. Round-trip time: 50ms. CI runs against `staging.crm.company.com` — a real server in a different region. Round-trip time: 300-900ms (variable). The POST + server processing + response can take up to 4 seconds in CI vs 200ms locally. The 5000ms timeout is too tight for CI.

### Fix

```typescript
// ✅ Fix: Environment-aware timeouts
const API_RESPONSE_TIMEOUT = process.env.CI ? 30_000 : 10_000;

const [response] = await Promise.all([
  page.waitForResponse(
    (r) =>
      r.url().includes("/api/citations") && r.request().method() === "POST",
    { timeout: API_RESPONSE_TIMEOUT },
  ),
  page.getByRole("button", { name: "Save" }).click(),
]);

// ✅ Even better: derive from playwright.config.ts timeout
// playwright.config.ts: timeout: 60_000 per test
// In your fixture or test: use testInfo.timeout as the ceiling
test("Save citation", async ({ page }, testInfo) => {
  const apiTimeout = Math.min(testInfo.timeout * 0.4, 30_000); // 40% of test timeout, max 30s

  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/citations"), {
      timeout: apiTimeout,
    }),
    page.getByRole("button", { name: "Save" }).click(),
  ]);
});
```

### Prevention Rule

> **Rule**: Never hardcode a low timeout (< 15s) for `waitForResponse/Request` in tests that run against real staging servers. Staging APIs have real network latency. Use `process.env.CI ? 30_000 : 10_000` patterns or derive from `testInfo.timeout`.

---

## War Story 10: The Selector Cemetery — 50 Tests Break After One UI Change

### Situation

A designer renames CSS classes as part of a redesign. They change `.blue-button` to `.primary-action-btn`, `.form-container` to `.form-wrapper`. 50 tests break overnight.

### Symptoms

```
After UI deploy:
  Test 1/200:  FAILED — locator: .blue-button not found
  Test 2/200:  FAILED — locator: .blue-button not found
  Test 5/200:  FAILED — locator: .form-container not found
  ... (50 failures total)
```

The issue isn't hard to fix — but it takes 3 hours to find and update every occurrence.

### Root Cause Diagnosis

```typescript
// The problem: CSS class names scattered across 50 test files
// tests/specs/citations/create.spec.ts
await page.locator(".blue-button").click();

// tests/specs/citations/edit.spec.ts
await page.locator(".blue-button").click();

// tests/specs/customers/create.spec.ts
await page.locator(".blue-button").click();

// ... 47 more files
```

**Root Cause**: CSS class names were used as locators directly. CSS classes are implementation details — they change when designs change. Tests should be coupled to **intent** (what the element IS), not **style** (how it looks).

### Fix (3 layers)

```typescript
// ✅ Layer 1: Immediately fix — add data-testid to HTML (work with developers)
// In the component:
// <button class="primary-action-btn" data-testid="citation-save-btn">Save</button>

// ✅ Layer 2: Use role-based locators (works without code changes)
// Instead of: page.locator('.blue-button')
// Use: page.getByRole('button', { name: 'Save' })
// CSS classes change; the button's accessible name (text) rarely changes

// ✅ Layer 3: Centralize in POM (single point of change)
export class CitationFormPage {
  readonly saveBtn = this.page.getByRole("button", { name: "Save Citation" });
  // OR with data-testid:
  // readonly saveBtn = this.page.locator('[data-testid="citation-save-btn"]');

  constructor(private readonly page: Page) {}
}
// Now when the designer renames classes → only CitationFormPage.ts needs updating
// NOT 50 spec files
```

```typescript
// ✅ Automated selector audit — find all CSS class selectors in tests
// Run this before deploying UI changes to understand the blast radius:

// audit-selectors.ts
import { glob } from 'glob';
import { readFileSync } from 'fs';

const testFiles = glob.sync('tests/**/*.spec.ts');
const cssClassPattern = /page\.locator\(['"](../../../../../.[a-zA-Z][a-zA-Z0-9_-]+)['"][ \)]/g;

const findings: Array<{ file: string; selector: string; line: number }> = [];

for (const file of testFiles) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const matches = [...line.matchAll(cssClassPattern)];
    for (const match of matches) {
      findings.push({ file, selector: match[1], line: idx + 1 });
    }
  });
}

if (findings.length > 0) {
  console.error('❌ CSS class selectors found in tests (fragile):');
  findings.forEach(f => console.error(`  ${f.file}:${f.line} — ${f.selector}`));
  process.exit(1);  // Fail CI if any CSS class selectors found
}
console.log('✅ No CSS class selectors found in tests');
```

### Prevention Rule

> **Rule**: CSS class names are styling artifacts — they belong in `.css` files, not test files. Use the selector hierarchy: `data-testid` → `getByRole()` → `getByLabel()` → `getByText()`. Never use `.class-name` selectors in production tests. Run the selector audit script in CI.

---

## War Story 11: The Assertion That Always Passes

### Situation

A payment processing test has been in the suite for 6 months. Never fails. A developer introduces a bug where the payment amount is silently rounded down. `$151.99` becomes `$151.00`. The test still passes.

### Symptoms

```
Test "Process payment for citation" → PASSES for 6 months ✓
Production bug: Customers underpay by cents → financial discrepancy
Postmortem: "Why didn't the tests catch the rounding bug?"
```

### Root Cause

```typescript
// The insufficient test:
test("Process payment", async ({ page, citationsClient }) => {
  await citationDetail.paymentPanel.fillAmount("151.99");
  await citationDetail.paymentPanel.clickPayNow();

  // ❌ Only checks visibility — does not verify the AMOUNT processed
  await expect(page.locator(".payment-success")).toBeVisible();
  // The success banner is ALWAYS visible after any payment, regardless of amount
});
```

**Root Cause**: `toBeVisible()` only checks that the element exists on screen. It tells you nothing about what data is displayed or stored. The payment amount was never asserted.

### Fix

```typescript
// ✅ Assertion must verify BUSINESS-MEANINGFUL values
test("Process payment — amount verified at UI + API + DB", async ({
  page,
  citationsClient,
  paymentsClient,
  dbClient,
  account,
}) => {
  const expectedAmount = 151.99;

  await citationDetail.paymentPanel.fillAmount(expectedAmount.toString());

  // Capture the payment API response at submit time
  const [paymentResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/payments") && r.method() === "POST",
    ),
    citationDetail.paymentPanel.clickPayNow(),
  ]);

  const paymentBody = (await paymentResp.json()) as {
    paymentId: string;
    amount: number;
  };

  // Layer 1: UI shows correct amount
  await expect(page.locator('[data-testid="payment-amount"]')).toHaveText(
    `$${expectedAmount.toFixed(2)}`,
  );

  // Layer 2: API response carries correct amount
  expect(paymentBody.amount).toBe(expectedAmount); // ← would catch rounding bug

  // Layer 3: DB stores correct amount
  const dbRow = await dbClient.queryOne<{ amount: string }>(
    "SELECT amount FROM payments WHERE payment_id = $1",
    [paymentBody.paymentId],
  );
  expect(parseFloat(dbRow!.amount)).toBe(expectedAmount); // ← DB ground truth
});
```

### Prevention Rule

> **Rule**: Every test must assert on **business-meaningful values** — not just element visibility. Ask: "If the wrong data was stored, would this test catch it?" If the answer is "No," you need a stronger assertion. Visibility checks are necessary but never sufficient for financial or data-correctness tests.

---

## War Story 12: The Retry Lie — Retries Mask Real Failures

### Situation

CI shows 100% pass rate. `retries: 2` in `playwright.config.ts`. A production incident reveals a race condition that causes 1 in 3 payment attempts to process twice (double charge). Investigation reveals: the test was CATCHING this bug every run — but always passing on the 3rd retry.

### Symptoms

```
CI Test Report:
  ✓ Payment idempotency test — 3 attempts, passed on attempt 3

Playwright HTML report:
  Test: Payment idempotency
  Attempt 1: FAILED — "Payment already processed" expected, got "200 OK"
  Attempt 2: FAILED — "Payment already processed" expected, got "200 OK"
  Attempt 3: PASSED (different timing, race condition not triggered)
```

**Root Cause**: The test was designed to verify that submitting a payment twice returns the correct `409 Conflict` (idempotency). Due to a race condition, submitting twice sometimes returns `200 OK` (double charge). Retries hid this: attempts 1 and 2 failed (correctly detecting the bug), attempt 3 passed because the race condition wasn't triggered.

### Fix

```typescript
// Fix 1: For tests that expose race conditions, DISABLE retries
test('Payment idempotency — must not allow double processing', async ({ citationsClient }) => {
  test.info().annotations.push({ type: 'no-retry', description: 'Race condition test — retries would mask failures' });
  // Note: Playwright doesn't have a built-in "no retry" per test.
  // Set retries to 0 in the specific project for idempotency tests:
});

// playwright.config.ts — separate project for critical/no-retry tests
projects: [
  {
    name: 'critical-no-retry',
    testMatch: '**/*.critical.spec.ts',
    retries: 0,   // ← Never retry critical business logic tests
    use: { ... }
  },
  {
    name: 'general',
    testMatch: '**/*.spec.ts',
    ignore: '**/*.critical.spec.ts',
    retries: 2,
  }
]
```

```typescript
// Fix 2: Track retry rate in CI — alert when retry rate > 5%
// .github/workflows/playwright.yml
- name: Check retry rate
  run: |
    TOTAL=$(cat playwright-report/results.json | jq '[.suites[].specs[].tests[].results[].status] | length')
    RETRIED=$(cat playwright-report/results.json | jq '[.suites[].specs[].tests[].results[] | select(.retry > 0)] | length')
    RATE=$(echo "scale=4; $RETRIED / $TOTAL" | bc)
    echo "Retry rate: $RATE ($RETRIED/$TOTAL tests needed retries)"
    if (( $(echo "$RATE > 0.05" | bc -l) )); then
      echo "❌ RETRY RATE TOO HIGH: $RATE > 5% threshold"
      exit 1
    fi
```

### Prevention Rule

> **Rule**: Retries are for **infrastructure flakiness** (network blip, browser crash), NOT for **application bugs**. Every retry should be investigated. A retry rate above 5% means you have unfixed bugs. Add retry rate tracking to CI and alert on threshold breaches.

---

## War Story 13: The Dynamic ID Trap — Test Breaks Every D365 Update

### Situation

A test uses the locator `#DynCtrl_fieldControl_MscrmControls_citationStatus_99847`. Works perfectly for 3 months. After a D365 platform update, the test breaks on every machine.

### Symptoms

```
After D365 update:
  Error: locator: '#DynCtrl_fieldControl_MscrmControls_citationStatus_99847' not found
  selector: visible=true, timeout: 30000ms

New DOM inspection shows:
  <div id="DynCtrl_fieldControl_MscrmControls_citationStatus_100213" ...>
```

**Root Cause**: D365 generates control IDs dynamically based on an internal counter. After a platform update, the counter resets or increments differently. The ID changed from `_99847` to `_100213`. These IDs are not stable across updates.

### Fix

```typescript
// ❌ Selector using generated D365 ID
await page
  .locator("#DynCtrl_fieldControl_MscrmControls_citationStatus_99847")
  .click();

// ✅ Stable selector strategies for D365:

// Option 1: data-id (D365's own stable attribute — usually the field logical name)
await page.locator('[data-id="citation_status"]').click();

// Option 2: data-automation-key (set by customizers in D365 Power Platform)
await page.locator('[data-automation-key="citationStatusField"]').click();

// Option 3: Combine field label + role (works when data attributes not available)
await page.locator('label:has-text("Citation Status") + div').click();

// Option 4: getByLabel (accessibility-based — most semantic)
await page.getByLabel("Citation Status").click();
```

```bash
# Automated audit: find all generated D365 IDs in test files
# Run this BEFORE any D365 update to identify fragile selectors
grep -rn "DynCtrl_\|MscrmControls_" tests/ --include="*.ts"
# Output:
# tests/specs/citations/edit.spec.ts:45: page.locator('#DynCtrl_fieldControl_MscrmControls_...')
# Fix before D365 updates!
```

### Prevention Rule

> **Rule**: Any locator containing `DynCtrl_`, `_fieldControl_`, generated numbers, or GUIDs is a time bomb. Run a selector audit before every D365 platform update. Replace with `data-id`, `data-automation-key`, `getByLabel()`, or `getByRole()`.

---

## War Story 14: The False Positive — Test Always Passes, Bug Ships to Production

### Situation

A "search citation by ID" test has been green for a year. A developer introduces a bug: the search endpoint now ignores the `citationId` parameter and returns ALL citations. The test still passes.

### Symptoms

```
Production bug: "Search by Citation ID returns all records"
CI tests: All green ✓

Developer: "But the tests were passing!"
SDET Lead: "The tests were asserting on the wrong thing."
```

### Root Cause

```typescript
// The misleading test:
test("Search by citation ID returns one result", async ({
  page,
  citationsClient,
}) => {
  // Create a citation
  const citation = await citationsClient.create(
    PayloadsCitation.pending({ customerId: account.userId }),
  );

  // Search for it
  await masterSearch.searchByCitationId(citation.citationId);
  await masterSearch.resultsGrid.waitForResults();

  // ❌ Only checked that SOME row is visible — not that it's the RIGHT row
  await expect(masterSearch.resultsGrid.firstRow).toBeVisible();
  // If search returns 50 results, the first row is still visible → test passes!
});
```

### Fix

```typescript
// ✅ Assert on EXACT search results
test("Search by citation ID returns EXACTLY ONE specific result", async ({
  page,
  citationsClient,
  account,
}) => {
  const citation = await citationsClient.create(
    PayloadsCitation.pending({ customerId: account.userId }),
  );

  await masterSearch.searchByCitationId(citation.citationId);
  await masterSearch.resultsGrid.waitForResults();

  // Assert count = 1 (not "at least 1")
  await expect(masterSearch.resultsGrid.allRows).toHaveCount(1);

  // Assert the specific citation ID appears in the result
  await expect(masterSearch.resultsGrid.firstRow).toContainText(
    citation.citationId,
  );

  // Assert it shows the RIGHT customer
  await expect(masterSearch.resultsGrid.firstRow).toContainText(account.userId);

  // Also verify via API: search API returns only this citation
  const searchResults = await citationsClient.search({
    citationId: citation.citationId,
  });
  expect(searchResults).toHaveLength(1);
  expect(searchResults[0].citationId).toBe(citation.citationId);
});
```

### Prevention Rule

> **Rule**: "The element is visible" is almost never a sufficient assertion. Always ask: **"If the wrong data was here, would this assertion still pass?"** Search tests must assert on **count = N** and **content = specific values**, not just visibility.

---

## War Story 15: The Clipboard Permissions Trap — Passes Locally, Fails in Headless CI

### Situation

A new "Share" feature allows users to click a "Copy Link" button, which copies a URL to the system clipboard. The test clicks the button, reads the clipboard, and asserts the URL is correct. It works 100% of the time locally on the developer's machine. In CI, it fails every time.

### Symptoms

```
Local (headed): PASSES
CI (headless): FAILS
  Error: page.evaluate: DOMException: Write permission denied.
  OR: Cannot read properties of undefined (reading 'writeText')
```

### Root Cause Diagnosis

```typescript
// The failing test code:
test("Copy link to clipboard", async ({ page }) => {
  await page.getByRole("button", { name: "Copy Link" }).click();

  // Read clipboard to verify
  const clipboardText = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  expect(clipboardText).toBe("https://crm.company.com/citations/CIT-001");
});
```

**Root Cause**: The modern Async Clipboard API (`navigator.clipboard`) is strictly gated by browser security policies. It requires a Secure Context (HTTPS or localhost) AND explicit user permission.
When you run locally in "headed" mode, Playwright often bypasses the prompt or the developer has previously allowed it. In "headless" mode in CI, there is no user to click "Allow," so the permission defaults to **Denied**. The API call throws `DOMException: Write permission denied`.

### Fix

```typescript
// ✅ Fix: Explicitly grant clipboard permissions to the BrowserContext
test("Copy link to clipboard", async ({ page, context }) => {
  // Grant permission for this specific origin
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.getByRole("button", { name: "Copy Link" }).click();

  // Now the evaluate block will succeed in headless CI
  const clipboardText = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  expect(clipboardText).toBe("https://crm.company.com/citations/CIT-001");
});
```

### Prevention Rule

> **Rule**: Any feature that interacts with restricted browser APIs (Clipboard, Geolocation, Notifications, Camera/Microphone) MUST explicitly use `context.grantPermissions()`. Do not rely on local headed-mode implicit permissions, as they will always fail in headless CI environments.

---

## The Anti-Pattern Compendium

All 15 war stories, distilled into rules:

| #   | Anti-Pattern              | Root Cause                                           | Prevention Rule                                                          |
| --- | ------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | Ghost click               | Invisible overlay at click coordinates               | `document.elementFromPoint(x,y)` to verify click target                  |
| 2   | Stale session             | OAuth token TTL < suite duration                     | Decode JWT expiry, implement token refresh fixture                       |
| 3   | Silent 200                | Asserting status code, not body content              | Always assert response body fields, add DB layer for writes              |
| 4   | Parallel collision        | Hardcoded shared test data IDs                       | Unique IDs per test/worker, never hardcode entity IDs                    |
| 5   | ARIA impostor             | Wrong role, multiple matches                         | Check Accessibility panel, scope locators, verify count=1                |
| 6   | Time zone trap            | `new Date().toLocaleDateString()` varies by server   | Use UTC normalization, never use "today" in assertions                   |
| 7   | Frame trap                | Element inside iframe, queried from main frame       | List all frames, use `frameLocator()` for iframe content                 |
| 8   | Cookie monster            | Shared context contaminates subsequent tests         | Clear cookies in afterEach, never share context across tests             |
| 9   | Network race              | Low timeout not accounting for staging latency       | Environment-aware timeouts: CI=30s, local=10s                            |
| 10  | Selector cemetery         | CSS class selectors scattered across 50 files        | `data-testid` + POMs for single point of change                          |
| 11  | Always-passing assertion  | `toBeVisible()` on element that's always there       | Assert business-meaningful values: text, counts, amounts                 |
| 12  | Retry lie                 | Retries hiding real race conditions                  | Track retry rate; retries > 5% = unfixed bug                             |
| 13  | Dynamic ID trap           | D365 generated IDs change on platform update         | `data-id`, `data-automation-key`, or semantic locators                   |
| 14  | False positive            | Test passes even with wrong data returned            | Count assertions + content assertions; never just visibility             |
| 15  | Clipboard permission trap | Headless CI defaults clipboard permissions to Denied | Always `context.grantPermissions(['clipboard-read', 'clipboard-write'])` |

---

## 🏋️ Practice Questions

### Q1. [Scenario Diagnosis]

A test intermittently fails in CI with "Expected count 1, received 2" on a search results assertion. It always passes locally. The test is run with 4 workers in CI. What are the THREE most likely root causes and how would you diagnose each?

<details><summary>Answer</summary>

**Root Cause 1: Shared test customer (War Story 4 — Parallel Collision)**
Two workers are both creating citations for the same hardcoded customer. The search finds 2 because both workers' data appears.

Diagnosis: Log `account.userId` in every test. If multiple tests log the same userId, you have shared data.

**Root Cause 2: Orphaned data from previous test run (War Story 10 / cleanup issue)**
A previous CI run failed mid-test and didn't clean up its test data. A new run creates a citation, searches, and finds the current one PLUS the orphaned one.

Diagnosis: Check the creation timestamps of the 2 results. If one is from a previous test run session, you have orphaned data.

**Root Cause 3: Race condition in search indexing**
The citation is created via API and immediately searched. In CI (slower DB), the search index hasn't caught up yet. Two results because a previous test's citation is still in the search window.

Diagnosis: Add `await page.waitForTimeout(500)` (diagnostic only) — if this fixes it, the search index has a lag. Fix properly using `expect.poll()` to wait for exactly 1 result.

</details>

---

### Q2. [Write It]

Write a test that verifies an API endpoint is idempotent: calling `POST /api/citations/{id}/pay` twice with the same data returns `409 Conflict` on the second call. The test must handle the payment processing time (30 second async job) between the two calls.

<details><summary>Answer</summary>

```typescript
test("Payment endpoint is idempotent — second call returns 409", async ({
  citationsClient,
  paymentsClient,
}) => {
  // Create a test citation
  const citation = await citationsClient.create(
    PayloadsCitation.pending({ customerId: account.userId }),
  );

  // First payment — should succeed
  const firstPayment = await paymentsClient.pay(citation.citationId, {
    amount: citation.amount,
    idempotencyKey: "test-payment-key-001", // idempotency key for deduplication
  });
  expect(firstPayment.status).toBe(202);
  const { jobId } = firstPayment;

  // Wait for payment to be processed
  await expect
    .poll(async () => (await paymentsClient.getJobStatus(jobId)).status, {
      timeout: 120_000,
      intervals: [2000, 5000, 10000],
      message: "First payment never completed",
    })
    .toBe("COMPLETED");

  // Second payment — must return 409 Conflict
  const secondPaymentResponse = await paymentsClient.rawPay(
    citation.citationId,
    {
      amount: citation.amount,
      idempotencyKey: "test-payment-key-002", // different key, same citation
    },
  );

  expect(secondPaymentResponse.status).toBe(409);

  const errorBody = await secondPaymentResponse.json();
  expect(errorBody.code).toBe("PAYMENT_ALREADY_PROCESSED");
  expect(errorBody.existingPaymentId).toBe(firstPayment.paymentId);

  // DB verification: only ONE payment record exists
  const dbPayments = await dbClient.query(
    "SELECT COUNT(*) as count FROM payments WHERE citation_id = $1",
    [citation.citationId],
  );
  expect(Number(dbPayments[0].count)).toBe(1); // must be exactly 1, not 2
});
```

</details>

---

### Q3. [Root Cause Identification]

This test passes locally but fails in CI with "Expected 'PAID', received ''" (empty string). Identify the root cause.

```typescript
test('Citation shows PAID after payment', async ({ page, citationsClient }) => {
  const citation = await citationsClient.create(PayloadsCitation.pending({ ... }));
  await paymentsClient.pay(citation.citationId, { amount: citation.amount });

  await page.goto(`/citations/${citation.citationId}`);

  const status = await page.locator('[data-testid="status"]').textContent();
  expect(status).toBe('PAID');  // fails in CI with empty string
});
```

<details><summary>Answer — 3 Root Causes Combined</summary>

**Root Cause 1: D365 Two-Phase Render (War Story in Ch08)**
`page.goto()` completes when DOM is ready. But in D365, `[data-testid="status"]` renders as an EMPTY container during Phase 1. The OData API call to populate it fires AFTER the DOM loads. In local (fast local API, fast rendering), Phase 2 completes in 100ms. In CI (staging API, slower), Phase 2 takes 2-8 seconds.

`textContent()` is called immediately after `goto()` — before the data arrives → gets empty string.

**Root Cause 2: Payment Processing Not Awaited**
`paymentsClient.pay()` returns immediately (202 Accepted). The payment processes asynchronously. When the page loads in CI (which is slower), the payment might not be PAID yet — the status could be PROCESSING or PENDING.

**Root Cause 3: No Polling**
Reading `textContent()` synchronously is a one-shot read, not a retry. Even if the element was eventually going to show PAID, the test reads it once at an undefined point in time.

**Fix:**

```typescript
// Step 1: Wait for payment to process
await expect
  .poll(
    () => citationsClient.getById(citation.citationId).then((c) => c.status),
    {
      timeout: 120_000,
      intervals: [2000, 5000],
      message: "Citation never reached PAID",
    },
  )
  .toBe("PAID");

// Step 2: Navigate and wait for data, not just DOM
await page.goto(`/citations/${citation.citationId}`);
await expect(page.locator('[data-testid="status"]')).toHaveText("PAID", {
  timeout: 30_000,
});
// toHaveText() auto-retries — it will wait until the text populates
```

</details>

---

**Navigation**: [← Chapter 42: Polling Patterns](./42_Polling_Async_Data_Patterns.md) | [Index](../00_INDEX.md) | [→ Chapter 44: Enterprise API Client Library](./44_Enterprise_API_Client_Library.md)

## 🏋️ Practice Challenges

### Challenge 1 [Spot the Bug — The "Randomly Passing" ElementHandle]

```typescript
test("Click dynamic loading button", async ({ page }) => {
  await page.goto("/dashboard");

  // Wait for the button to appear in DOM
  const button = await page.$(".dynamic-btn");

  // ... test does some other things for 2 seconds ...

  // Click the button
  await button?.click();
});
```

Why is `ElementHandle` (`page.$`) considered an anti-pattern in modern Playwright, and what exact failure does this code cause if the React app re-renders the button during the 2-second wait?

<details><summary>Answer</summary>

**Bug**: `page.$` captures a point-in-time reference to a specific DOM node. If React/Vue re-renders the component, the old DOM node is destroyed and a new one replaces it. When `button.click()` fires, Playwright throws an error: `Element is detached from DOM`.

**Fix**: Use `Locator` (`page.locator('.dynamic-btn')`). Locators are strict and lazily evaluated. When you call `locator.click()`, Playwright queries the DOM _at that exact moment_, automatically handling re-renders.

</details>

---

### Challenge 2 [Architecture — The 429 Too Many Requests War Story]

Your team runs 50 Playwright workers in CI against a shared Staging environment. Every afternoon, tests start failing randomly with `429 Too Many Requests` or `502 Bad Gateway` from the Staging API.

What is the architectural root cause, and what is the proper SDET solution?

A) Playwright is too fast. You should add `await page.waitForTimeout(2000)` before every API call.
B) The Staging environment is accurately simulating production rate limits, but the test suite's burst traffic (50 workers × 10 requests/sec = 500 RPS) exceeds the limit. The solution is to whitelist the CI IP in the API Gateway or spin up isolated ephemeral environments for CI runs.
C) The tests are creating infinite loops.
D) The API client lacks a try-catch block.

<details><summary>Answer</summary>

**B** — Shared Staging environments are almost always the bottleneck for parallel automation.
Adding timeouts (A) ruins your CI pipeline speed. The enterprise solution is either IP whitelisting for CI (if testing functionality, not rate limiting), or migrating to Ephemeral Environments (where each PR gets its own isolated database and API instance, meaning zero collision and zero rate limiting).

</details>

---

### Challenge 3 [Write It Yourself — The Timezone Boundary Bug]

Your CI runs in UTC. Developers are in India (IST, UTC+5:30). A test selects "Today" on a calendar widget. At 1:00 AM IST (which is 7:30 PM UTC the previous day), the test fails because the API rejects the date as "in the past."

Write the Playwright configuration setting to force the browser context to use a specific timezone (e.g., `Asia/Kolkata`), ensuring local and CI executions match.

<details><summary>Answer</summary>

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    // Forces the browser to use a specific timezone, regardless of the host OS
    timezoneId: "Asia/Kolkata",

    // Optional but related: forcing locale for date formats
    locale: "en-IN",
  },
});
```

**War Story**: Unset timezones cause "Timezone Boundary Flakiness." A test passes all day, then consistently fails during a 5-hour window every night depending on the delta between the CI server's UTC clock and the developer's local timezone assumption. Force `timezoneId` to neutralize this.

</details>

---

### Challenge 4 [MCQ — The Stale Test Data War Story]

A test logs in and asserts `expect(userName).toBe('John Doe')`. Six months later, another developer renames the user in the database to 'Johnathan Doe' while testing a bug manually. The automation suite fails on the `main` branch.

What core test data principle was violated?

A) Manual testing should not be allowed in Staging.
B) Tests should never assert on names, only IDs.
C) The test relied on shared, pre-existing state instead of creating its own isolated state (Arrange-Act-Assert).
D) The database should be read-only.

<details><summary>Answer</summary>

**C** — The test violated the rule of independent test data.
If a test needs a user named 'John Doe', the test (or its fixture) must _create_ that user via API at the start of the test, and ideally delete it at the end. Relying on seeded data in a shared environment guarantees that the data will eventually be mutated by humans or other tests, leading to brittle, unpredictable suites.

</details>

---

### Challenge 5 [Spot the Bug — The Shared Browser Context War Story]

```typescript
import { test, chromium, Browser } from "@playwright/test";

let browser: Browser;

test.beforeAll(async () => {
  browser = await chromium.launch();
});

test("Test A", async () => {
  const page = await browser.newPage();
  await page.goto("/admin"); // redirects to login
  await page.fill("#user", "admin");
  await page.fill("#pass", "secret");
  await page.click("#loginBtn");
  // ... verify admin
});

test("Test B", async () => {
  const page = await browser.newPage();
  await page.goto("/customer");
  // Fails! The page expects to be logged out, but the session is active!
});
```

Why does Test B inherit Test A's logged-in state, and how do you fix it?

<details><summary>Answer</summary>

**Bug**: `browser.newPage()` creates pages within the _same default browser context_. Cookies and LocalStorage are scoped to the Context, not the Page. Test A set the auth cookie, so Test B (running sequentially or in parallel in the same worker) gets the cookie.

**Fix**: Always use Playwright's built-in `page` fixture, which automatically creates an isolated `BrowserContext` for every single test.

```typescript
test("Test A", async ({ page }) => {
  // page is already isolated in its own context
  await page.goto("/admin");
  // ...
});

test("Test B", async ({ page }) => {
  // This page has zero cookies. Completely fresh.
  await page.goto("/customer");
});
```

**War Story**: Manually managing `chromium.launch()` in `beforeAll` is a hangover from Puppeteer/Selenium. Playwright's greatest strength is sub-millisecond Context isolation via fixtures. Use them!

</details>

---

**Navigation**: [← Chapter 42: Polling Patterns](./42_Polling_Async_Data_Patterns.md) | [Index](../00_INDEX.md) | [→ Chapter 44: Enterprise API Client Library](./44_Enterprise_API_Client_Library.md)
