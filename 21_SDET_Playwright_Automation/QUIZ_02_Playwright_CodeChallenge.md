# Quiz 02 — Playwright Code Challenges (Explain + Write It Yourself)

**Navigation**: [← Quiz 01: MCQ](QUIZ_01_Playwright_MCQ.md) | [Index](00_INDEX.md)

> 15 challenges. Budget 4 minutes per challenge. Look at the code, form your answer, THEN reveal.
> Difficulty: [EASY] [MEDIUM] [HARD]

---

## PART A — Spot the Bug (Challenges 1–6)

### Challenge 1 [MEDIUM] — The forEach Async Trap

```typescript
test('click all menu items', async ({ page }) => {
  const menuItems = ['Home', 'Orders', 'Reports', 'Settings'];

  menuItems.forEach(async (item) => {
    await page.getByRole('menuitem', { name: item }).click();
    await expect(page).toHaveURL(new RegExp(item.toLowerCase()));
    await page.goBack();
  });

  // Test passes? Fails? Something else?
  console.log('Done');
});
```

**What is wrong? What will actually happen?**

<details><summary>Answer</summary>

**The bug:** `forEach` does not await async callbacks. Each `async (item) => { ... }` call returns a Promise, but `forEach` ignores those Promises entirely. The loop completes synchronously (launches all 4 async operations without waiting), the `console.log('Done')` runs immediately, and the test ends — potentially BEFORE any click has happened.

**What actually happens:** The test might pass (if Playwright's afterEach cleanup runs before the async callbacks resolve) or fail with "context destroyed" errors. Either way, the assertions are NOT properly executed.

**Fix:**
```typescript
// Option 1: for...of loop (sequential)
for (const item of menuItems) {
  await page.getByRole('menuitem', { name: item }).click();
  await expect(page).toHaveURL(new RegExp(item.toLowerCase()));
  await page.goBack();
}

// Option 2: Promise.all (parallel — careful: all clicks fire simultaneously)
await Promise.all(menuItems.map(async (item) => {
  // ⚠ parallel clicks on the same page would cause issues — use sequential for same-page navigation
}));
```
</details>

---

### Challenge 2 [HARD] — The New Tab Race Condition

```typescript
test('view order in new tab', async ({ page, context }) => {
  await customerPortal.goto();
  await customerPortal.login(testAccount);
  await customerPortal.navigateToOrders();

  const newTab = await context.waitForEvent('page');
  await page.locator('#viewOrderBtn').click();

  await newTab.waitForLoadState('domcontentloaded');
  await expect(newTab.locator('.order-id')).toHaveText('ORD-001');
});
```

**Find the bug. What happens in real execution?**

<details><summary>Answer</summary>

**The race condition:** `waitForEvent('page')` starts AFTER the click fires. If the new tab opens within a few milliseconds (which is common in fast local environments), the `'page'` event fires BEFORE `waitForEvent` registers its listener. The event is missed. `waitForEvent` then hangs until its timeout and the test fails.

**What happens:** 50–80% of the time in fast environments, the test hangs and times out with "waitForEvent('page') exceeded timeout".

**Fix:**
```typescript
// waitForEvent MUST start before the click — use Promise.all
const [newTab] = await Promise.all([
  context.waitForEvent('page'),              // register listener FIRST
  page.locator('#viewOrderBtn').click(),     // THEN trigger click
]);

await newTab.waitForLoadState('domcontentloaded');
await expect(newTab.locator('.order-id')).toHaveText('ORD-001');
```
</details>

---

### Challenge 3 [HARD] — Module-Level State in Parallel Tests

```typescript
// spec-file.ts
let createdOrderId: string;
let createdCustomerId: string;

test('Create customer and order', async ({ page }) => {
  const customer = await adminPortal.createCustomer();
  createdCustomerId = customer.id;
  const order = await adminPortal.createOrder(createdCustomerId);
  createdOrderId = order.id;
});

test('Verify order exists for customer', async ({ page }) => {
  await customerPortal.navigateToOrder(createdOrderId);
  await expect(customerPortal.orderDetails).toBeVisible();
});

test('Delete order', async ({ page }) => {
  await adminPortal.deleteOrder(createdOrderId);
});
```

**What are the two bugs that cause intermittent failures in CI?**

<details><summary>Answer</summary>

**Bug 1 — Module-level variables in parallel workers:**  
Playwright runs tests in parallel across multiple worker processes. Module-level variables (`createdOrderId`, `createdCustomerId`) are NOT shared between worker processes. If "Verify order exists" runs in Worker 2, `createdOrderId` is `undefined` in Worker 2's memory.

**Bug 2 — Test order not guaranteed:**  
Even within one worker, Playwright doesn't guarantee test execution order unless you use `test.describe.serial()`. "Delete order" might run BEFORE "Verify order exists", causing "Verify" to fail.

**Fix:**
```typescript
test.describe.serial('Order lifecycle', () => {
  // State IS shared within the describe.serial block (same worker, sequential)
  const data = { customerId: '', orderId: '' };

  test('Create customer and order', async ({ page }) => {
    const customer = await adminPortal.createCustomer();
    data.customerId = customer.id;    // same object, same worker
    const order = await adminPortal.createOrder(data.customerId);
    data.orderId = order.id;
  });

  test('Verify order', async ({ page }) => {
    await customerPortal.navigateToOrder(data.orderId); // works!
  });

  test('Delete order', async ({ page }) => {
    await adminPortal.deleteOrder(data.orderId);
  });
});
```
</details>

---

### Challenge 4 [MEDIUM] — Wrong Wait Strategy

```typescript
test('D365: verify customer status after update', async ({ page }) => {
  const statusField = page.locator('[data-automation-key="statecode"]');

  await adminPortal.navigateToCustomer('C-001');
  await page.waitForTimeout(5000);  // wait for D365 to load

  const status = await statusField.textContent();
  expect(status?.trim()).toBe('Active');
});
```

**Three things are wrong. Find them all.**

<details><summary>Answer</summary>

**Bug 1 — `waitForTimeout(5000)` (never acceptable):**  
Hard sleep is fragile. In a fast environment, 5 seconds is too long (test is slow for no reason). In a slow environment, 5 seconds might not be enough. The correct approach is content-based waiting.

**Bug 2 — Reading `textContent()` immediately after the hard sleep:**  
Even if we replaced the sleep with a proper wait, reading `textContent()` directly could get empty text if the OData API hasn't returned yet.

**Bug 3 — No navigation confirmation before reading:**  
`navigateToCustomer('C-001')` might navigate to C-001, but if the page still shows C-000's data during transition (stale render), `textContent()` reads the wrong customer's status.

**Fix:**
```typescript
await adminPortal.navigateToCustomer('C-001');

// Confirm we're on the right record (anti-stale-render):
await expect(
  page.locator('[data-automation-key="fullname"]')
).toHaveText('Expected Customer Name', { timeout: 30000 });

// Wait for spinners to clear:
await expect(page.locator('.ms-Spinner')).toHaveCount(0, { timeout: 30000 });

// Wait for the specific status text:
await expect(statusField).toHaveText('Active', { timeout: 30000 });
```
</details>

---

### Challenge 5 [MEDIUM] — Missing `as const` TypeScript Error

```typescript
async function clickByRole(page: Page, role: string, name: string) {
  await page.getByRole(role, { name }).click();
  //                  ↑ TypeScript error here
}

// Called as:
await clickByRole(page, 'menuitem', 'Save');
await clickByRole(page, 'button', 'Submit');
```

**What is the TypeScript error? How do you fix it?**

<details><summary>Answer</summary>

**The error:** `page.getByRole()` expects the first argument to be of type `AriaRole` — a string union: `'button' | 'checkbox' | 'combobox' | 'menuitem' | ...`. The parameter `role: string` is too broad — TypeScript won't allow a plain `string` where an `AriaRole` is expected.

**Error message:** `Argument of type 'string' is not assignable to parameter of type 'AriaRole'`

**Fix — import and use the AriaRole type:**
```typescript
import { type Page } from '@playwright/test';

type AriaRole = Parameters<Page['getByRole']>[0]; // extract from Playwright types

async function clickByRole(page: Page, role: AriaRole, name: string): Promise<void> {
  await page.getByRole(role, { name }).click();
}

// OR: use the Playwright export directly
import { type Page } from '@playwright/test';
// AriaRole is not directly exported but can be:
type AriaRole = 'button' | 'checkbox' | 'combobox' | 'dialog' | 'figure' | 
                'heading' | 'img' | 'link' | 'list' | 'listitem' | 'main' | 
                'menuitem' | 'menuitemcheckbox' | 'menuitemradio' | 'navigation' |
                'option' | 'progressbar' | 'radio' | 'radiogroup' | 'row' |
                'rowgroup' | 'rowheader' | 'scrollbar' | 'search' | 'searchbox' |
                'separator' | 'slider' | 'spinbutton' | 'status' | 'switch' |
                'tab' | 'tablist' | 'tabpanel' | 'textbox' | 'timer' |
                'tooltip' | 'tree' | 'treegrid' | 'treeitem';
```
</details>

---

### Challenge 6 [HARD] — StorageState Saved Too Early

```typescript
export default async function globalSetup() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://crm.company.com/login');
  await page.fill('#username', process.env.ADMIN_EMAIL!);
  await page.fill('#password', process.env.ADMIN_PASSWORD!);
  await page.locator('#loginBtn').click();

  await context.storageState({ path: 'auth-states/admin.json' });
  await browser.close();
}
```

**What is the bug? What does the saved state file contain?**

<details><summary>Answer</summary>

**The bug:** `storageState` is called immediately after `loginBtn.click()` — BEFORE the login POST request has completed and BEFORE the server has set the auth cookies in the response.

**What the file contains:** The pre-login state (no auth cookies, no session tokens). When tests load this state, they start unauthenticated and get redirected to login.

**How to spot it:** Open `admin.json` — the `cookies` array is empty or only has pre-login tracking cookies.

**Fix:**
```typescript
await page.locator('#loginBtn').click();

// Wait for successful navigation — THEN cookies are set
await page.waitForURL(/\/(dashboard|home|main)/, { timeout: 30_000 });

// NOW save the state — auth cookies are in the context
await context.storageState({ path: 'auth-states/admin.json' });
await browser.close();
```
</details>

---

## PART B — Explain This Code (Challenges 7–9)

### Challenge 7 [MEDIUM] — Why Doesn't This POM Constructor Query the DOM?

```typescript
export class CustomerDetailsPage {
  readonly page: Page;
  readonly customerName: Locator;
  readonly customerEmail: Locator;
  readonly editButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.customerName = page.locator('[data-automation-key="fullname"]');
    this.customerEmail = page.locator('[data-automation-key="emailaddress1"]');
    this.editButton = page.getByRole('menuitem', { name: 'Edit' });
    // Nothing queries the DOM — no await, no async, no selector resolution
  }
}
```

**Explain: What does `page.locator(...)` actually do here? When does the DOM get queried?**

<details><summary>Answer</summary>

`page.locator('[data-automation-key="fullname"]')` does NOT touch the browser DOM. It creates a **Locator** object — a description of WHERE to find elements. Think of it like writing a note that says "the element matching this CSS selector" without actually looking for it yet.

**The DOM is queried only when an action or assertion is called:**

```typescript
// These create Locator objects (no DOM access):
const locator = page.locator('#myElement');

// These QUERY the DOM (and auto-wait):
await locator.click();                     // queries + waits + clicks
await locator.fill('text');                // queries + waits + fills
await expect(locator).toBeVisible();       // queries + retries + asserts
const text = await locator.textContent();  // queries + returns text
```

**Why this design matters for POMs:**
The POM constructor runs once. If it queried the DOM, it would capture element references that might become stale (detached from the DOM) after navigation. Lazy locators always query the CURRENT DOM state at the moment of action.
</details>

---

### Challenge 8 [MEDIUM] — Explain the scope: 'worker' Savings

```typescript
// playwright.config.ts
workers: 4

// fixtures/index.ts
account: [
  async ({}, use) => {
    const acc = await createTestAccount(apiCredentials);
    await use(acc);
    await deleteTestAccount(acc.id);
  },
  { scope: 'worker' }  // ← this line
],
```

**There are 4 workers and 40 tests. Explain: how many times does `createTestAccount` run? How many times without `scope: 'worker'`?**

<details><summary>Answer</summary>

**With `scope: 'worker'`:**  
`createTestAccount` runs **4 times** — once per worker when it starts.  
Each of the 40 tests shares the account from its worker (10 tests per worker).  
`deleteTestAccount` runs 4 times (when each worker finishes).

**Without `scope: 'worker'` (default test scope):**  
`createTestAccount` runs **40 times** — before EVERY test.  
`deleteTestAccount` runs **40 times** — after every test.

**Real-world impact:**  
If `createTestAccount` takes 3 seconds (API call + DB write):
- With worker scope: 4 × 3s = 12 seconds total setup time
- With test scope: 40 × 3s = 120 seconds total setup time

**108 seconds saved** just from adding `{ scope: 'worker' }`.

**When to use worker scope:** For data that tests READ but don't MODIFY (account info, pre-created reference data, auth tokens).  
**When to use test scope:** For data that tests MODIFY (a record that test A changes and test B checks).
</details>

---

### Challenge 9 [HARD] — Explain This Optional Chaining Chain

```typescript
async function getPrimaryPhoneNumber(
  response: { customer?: { contact?: { addresses?: Array<{ type: string; phones: Array<{ number: string; primary: boolean }> }> } } }
): Promise<string | null> {
  const primaryPhone = response
    ?.customer
    ?.contact
    ?.addresses
    ?.find(addr => addr.type === 'HOME')
    ?.phones
    ?.find(phone => phone.primary);

  return primaryPhone?.number ?? null;
}
```

**What does each `?.` do? What happens if `addresses` is undefined? What does `?? null` do?**

<details><summary>Answer</summary>

Each `?.` is the **optional chaining operator**. It short-circuits if the left side is `null` or `undefined` — returning `undefined` instead of throwing `TypeError: Cannot read property X of undefined`.

**Step by step:**
```
response?.customer           → if response is null/undefined, return undefined; else return response.customer
?.contact                    → if .customer was undefined, return undefined; else return .contact
?.addresses                  → if .contact was undefined, return undefined; else return .addresses
?.find(addr => ...)          → if .addresses was undefined, return undefined; else call .find()
?.phones                     → if .find() returned undefined (no HOME address), return undefined; else return .phones
?.find(phone => phone.primary) → if .phones was undefined, return undefined; else find primary phone
```

**If `addresses` is undefined:**  
The entire expression evaluates to `undefined` without throwing. No error.

**`?? null`:**  
The nullish coalescing operator. If `primaryPhone?.number` is `null` or `undefined`, return `null` (explicit). If it has a value (e.g., `'555-1234'`), return that value.

**Why this matters for API testing:**  
Enterprise APIs often return optional/nullable nested fields. Optional chaining lets you safely navigate deeply nested structures without 5 levels of `if (response && response.customer && ...)` checks.
</details>

---

## PART C — Write It Yourself (Challenges 10–15)

### Challenge 10 [MEDIUM] — Write the Correct New Tab Handler

**Requirement:** Write a reusable helper `openInNewTab(page, triggerLocator)` that:
- Uses `Promise.all` correctly
- Waits for `domcontentloaded` on the new tab
- Returns the new tab's `Page` object

<details><summary>Answer</summary>

```typescript
import { type Page, type Locator } from '@playwright/test';

async function openInNewTab(page: Page, triggerLocator: Locator): Promise<Page> {
  const [newTab] = await Promise.all([
    page.context().waitForEvent('page'),  // register listener FIRST
    triggerLocator.click(),               // trigger the click SECOND
  ]);

  await newTab.waitForLoadState('domcontentloaded');
  return newTab;
}

// Usage:
const orderTab = await openInNewTab(page, page.locator('#viewOrderBtn'));
const orderPage = new OrderTrackingPage(orderTab);
await expect(orderPage.orderIdDisplay).toBeVisible();
// Cleanup:
await orderTab.close();
```
</details>

---

### Challenge 11 [MEDIUM] — Write the D365 Spinner Wait

**Requirement:** Write a function `waitForD365Load(page, expectedTitle?)` that:
1. Waits for all `.ms-Spinner` elements to disappear
2. If `expectedTitle` is provided, waits for the page title area to contain that text
3. Uses timeouts of 45 seconds for spinner, 30 seconds for title

<details><summary>Answer</summary>

```typescript
import { type Page, expect } from '@playwright/test';

async function waitForD365Load(
  page: Page,
  expectedTitle?: string
): Promise<void> {
  // 1. Wait for all spinners to disappear
  await expect(
    page.locator('.ms-Spinner')
  ).toHaveCount(0, { timeout: 45_000 });

  // 2. If an expected title is provided, verify it
  if (expectedTitle) {
    const titleArea = page.locator('.ms-CommandBar, .ms-PageHeader, h1[title]').first();
    await expect(titleArea).toContainText(expectedTitle, { timeout: 30_000 });
  }
}

// Usage:
await adminPortal.navigateToCustomer('C-001');
await waitForD365Load(page, 'John Smith'); // waits for spinner AND correct title
const status = await page.locator('[data-automation-key="statecode"]').textContent();
```
</details>

---

### Challenge 12 [EASY] — Write the Typed Response Interface

**Given this API response JSON, write the complete TypeScript interface:**

```json
{
  "orderId": "ORD-2026-001",
  "status": "PROCESSING",
  "totalAmount": 299.99,
  "currency": "USD",
  "lineItems": [
    {
      "sku": "PROD-A",
      "description": "Widget Pro",
      "quantity": 2,
      "unitPrice": 149.995,
      "discountApplied": true,
      "discountCode": "SAVE10"
    }
  ],
  "shippingAddress": {
    "line1": "123 Main St",
    "city": "Austin",
    "state": "TX",
    "postalCode": "78701",
    "country": "US"
  },
  "createdAt": "2026-05-28T09:00:00Z",
  "estimatedDelivery": "2026-06-02",
  "trackingNumber": null
}
```

<details><summary>Answer</summary>

```typescript
type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface LineItem {
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountApplied: boolean;
  discountCode: string | null;  // could be null if no discount
}

interface ShippingAddress {
  line1: string;
  line2?: string;    // optional — not in example but typical
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface OrderResponse {
  orderId: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  lineItems: LineItem[];
  shippingAddress: ShippingAddress;
  createdAt: string;            // ISO 8601 string — could use Date if you parse it
  estimatedDelivery: string;    // Date string (YYYY-MM-DD)
  trackingNumber: string | null; // explicitly nullable
}
```

**Note:** `discountCode` could be `string | null` (null when no discount) or `string | undefined` (field absent). Which you choose depends on your API's behavior — check with the backend team. The safer choice for APIs that always include the field is `string | null`.
</details>

---

### Challenge 13 [MEDIUM] — Write `expect.objectContaining` Assertion

**Given:**
```typescript
const body = await response.json(); // Returns { citations: CitationObj[] }
```

Write an assertion that verifies the `citations` array:
1. Has at least 1 item
2. Contains an item with `citationId: 'CIT-001'`, `status: 'PAID'`, and `amount` being any positive number
3. Does NOT contain any item with `status: 'DELETED'`

<details><summary>Answer</summary>

```typescript
// 1. At least 1 item
expect(body.citations.length).toBeGreaterThan(0);
// OR: expect(body.citations).not.toHaveLength(0);

// 2. Contains the specific item (partial match — other properties ignored)
expect(body.citations).toContainEqual(
  expect.objectContaining({
    citationId: 'CIT-001',
    status: 'PAID',
    amount: expect.any(Number), // any number
  })
);

// 3. No DELETED items
expect(body.citations).not.toContainEqual(
  expect.objectContaining({ status: 'DELETED' })
);

// BONUS: Also verify the specific item's amount is positive
const paidCitation = body.citations.find((c: { citationId: string }) => c.citationId === 'CIT-001');
expect(paidCitation).toBeDefined();
expect(paidCitation!.amount).toBeGreaterThan(0);
```
</details>

---

### Challenge 14 [HARD] — Write a Fixture That Creates and Tears Down Test Data

**Requirement:** Write a `test.extend` fixture called `testCitation` that:
1. Calls a (given) `CitationsApiClient` to create a citation with status `PENDING` and amount `150`
2. Provides the created `CitationResponse` to the test
3. Deletes the citation after the test ends — even if the test FAILS
4. Is test-scoped (not worker-scoped)

<details><summary>Answer</summary>

```typescript
import { test as base } from '@playwright/test';
import { CitationsApiClient, type CitationResponse } from '../clients/CitationsApiClient';

interface TestCitationFixtures {
  testCitation: CitationResponse;
  citationsClient: CitationsApiClient;
}

export const test = base.extend<TestCitationFixtures>({

  citationsClient: async ({ request }, use) => {
    const client = new CitationsApiClient(request);
    await use(client);
    // No teardown needed — client is stateless
  },

  // test-scoped (default — no { scope: 'worker' })
  testCitation: async ({ citationsClient }, use) => {
    // Setup — create the citation
    const citation = await citationsClient.createCitation({
      status: 'PENDING',
      amount: 150,
      type: 'PARKING',
      testFlag: true, // marks as test data
    });

    // Provide to the test
    await use(citation);

    // Teardown — runs after the test, even if the test threw an error
    try {
      await citationsClient.deleteCitation(citation.citationId);
    } catch (error) {
      console.warn(`[fixture] Failed to delete test citation ${citation.citationId}:`, error);
      // Don't rethrow — teardown failures shouldn't mask the actual test failure
    }
  },
});

// Usage in tests:
test('citation can be paid', async ({ testCitation, citationsClient }) => {
  expect(testCitation.status).toBe('PENDING');
  await citationsClient.updateStatus(testCitation.citationId, 'PAID');
  const updated = await citationsClient.getById(testCitation.citationId);
  expect(updated.status).toBe('PAID');
  // ← testCitation.citationId is deleted automatically after this
});
```
</details>

---

### Challenge 15 [HARD] — Write the Component Split

**Requirement:** Given this monolithic POM (simplified), split it into:
- `OrdersPage.ts` (orchestrator, ~15 lines)
- `OrderSearchForm.ts` (component, ~25 lines)
- `OrderResultsGrid.ts` (component, ~20 lines)

```typescript
// EXISTING (monolithic — do not change this):
export class OrdersPage {
  readonly page: Page;
  readonly orderIdInput: Locator;
  readonly statusDropdown: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly resultRows: Locator;
  readonly resultCount: Locator;
  readonly pagination: Locator;

  constructor(page: Page) {
    this.page = page;
    this.orderIdInput = page.locator('#orderSearch_id');
    this.statusDropdown = page.locator('#orderSearch_status');
    this.searchButton = page.locator('#orderSearch_submit');
    this.resetButton = page.locator('#orderSearch_reset');
    this.resultRows = page.locator('.order-results-row');
    this.resultCount = page.locator('.order-results-count');
    this.pagination = page.locator('.order-results-pagination');
  }

  async searchById(id: string): Promise<void> {
    await this.orderIdInput.fill(id);
    await this.searchButton.click();
  }

  async waitForResults(): Promise<void> {
    await expect(this.resultRows.first()).toBeVisible({ timeout: 20000 });
  }

  async getRowCount(): Promise<number> {
    return this.resultRows.count();
  }
}
```

<details><summary>Answer</summary>

```typescript
// components/orders/OrderSearchForm.ts
import { type Page, type Locator, expect } from '@playwright/test';

export class OrderSearchForm {
  private readonly page: Page;
  readonly orderIdInput: Locator;
  readonly statusDropdown: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.orderIdInput = page.locator('#orderSearch_id');
    this.statusDropdown = page.locator('#orderSearch_status');
    this.searchButton = page.locator('#orderSearch_submit');
    this.resetButton = page.locator('#orderSearch_reset');
  }

  async searchById(id: string): Promise<void> {
    await this.orderIdInput.fill(id);
    await this.searchButton.click();
  }

  async searchByStatus(status: string): Promise<void> {
    await this.statusDropdown.selectOption(status);
    await this.searchButton.click();
  }

  async reset(): Promise<void> {
    await this.resetButton.click();
  }
}

// components/orders/OrderResultsGrid.ts
import { type Page, type Locator, expect } from '@playwright/test';

export class OrderResultsGrid {
  private readonly page: Page;
  readonly resultRows: Locator;
  readonly resultCount: Locator;
  readonly pagination: Locator;

  constructor(page: Page) {
    this.page = page;
    this.resultRows = page.locator('.order-results-row');
    this.resultCount = page.locator('.order-results-count');
    this.pagination = page.locator('.order-results-pagination');
  }

  async waitForResults(timeout = 20000): Promise<void> {
    await expect(this.resultRows.first()).toBeVisible({ timeout });
  }

  async getRowCount(): Promise<number> {
    return this.resultRows.count();
  }

  async clickRowByIndex(index: number): Promise<void> {
    await this.resultRows.nth(index).click();
  }
}

// pages/OrdersPage.ts — the orchestrator
import { type Page } from '@playwright/test';
import { OrderSearchForm } from '../components/orders/OrderSearchForm';
import { OrderResultsGrid } from '../components/orders/OrderResultsGrid';

export class OrdersPage {
  readonly page: Page;
  readonly searchForm: OrderSearchForm;
  readonly resultsGrid: OrderResultsGrid;

  constructor(page: Page) {
    this.page = page;
    this.searchForm = new OrderSearchForm(page);
    this.resultsGrid = new OrderResultsGrid(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(`${process.env.APP_URL}/orders`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  // High-level: combine search + wait for results
  async searchAndWait(id: string): Promise<void> {
    await this.searchForm.searchById(id);
    await this.resultsGrid.waitForResults();
  }
}
```
</details>

---

**Scoring:**
- 13–15 challenges fully correct: 🏆 Expert SDET — architecture-ready
- 10–12: ✅ Strong — review the challenges you missed
- 7–9: 📖 Good progress — re-read relevant chapters
- Below 7: 🔁 Back to basics — Chapters 4, 5, 6 need revisiting

---
**Navigation**: [← Quiz 01: MCQ](QUIZ_01_Playwright_MCQ.md) | [Index](00_INDEX.md)
