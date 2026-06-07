# 52. UI Flow Fixtures — Encapsulating End-to-End Journeys

**Navigation**: [← Previous: Login Fixture Architecture](./51_Login_Fixture_Architecture.md) | [Index](../../00_MASTER_INDEX.md) | [Next: Handling Dynamic Tables →](./53_Handling_Dynamic_Tables.md)

**Cross-links:**
- [`Ch07: E2E Test Architecture`](../02_Core_Architecture/07_test_step_E2E_Architecture.md) — 15-step skeleton, data accumulator
- [`Ch06: Custom Fixtures`](../02_Core_Architecture/06_Custom_Fixtures_Architecture.md) — `test.extend()`, scope
- [`Ch50: Real-World SPA`](../05_Advanced_Topics/50_Real_World_SPA_Tabs_Menuitems_No_IDs.md) — Multi-page, menuitems, tab content

---

## 5W1H — Why This Chapter?

- **WHAT**: A fixture pattern that turns an entire multi-step E2E flow (navigate → search → select → fill form → submit → verify) into a single `await` call that your tests consume.
- **WHY**: When 10 tests all start with "navigate to Invoices → search for customer → select first result → open payment form", you are copy-pasting 8 lines into every test. A **Flow Fixture** moves that journey into reusable plumbing.
- **WHO**: SDETs writing tests against forms, wizards, or checkout flows that have a repetitive "setup" sequence before the actual assertion.
- **WHEN**: After you have 5+ tests that share the same first 3–5 steps.
- **HOW**: By showing the Fixture-as-Journey pattern, when to use it vs when it becomes a black-box anti-pattern.

---

## 1. The Repetition Problem

```typescript
// ❌ Every test repeats the same journey
test('pay invoice', async ({ adminPage }) => {
  await adminPage.goto('/invoices');
  await adminPage.getByPlaceholder('Search').fill('Alice Corp');
  await adminPage.getByRole('button', { name: 'Search' }).click();
  await expect(adminPage.locator('.result-row')).toHaveCount.greaterThan(0);
  await adminPage.locator('.result-row').first().click();
  await adminPage.getByRole('button', { name: 'Pay Now' }).click();
  // ... actual test logic ...
});

test('dispute invoice', async ({ adminPage }) => {
  await adminPage.goto('/invoices');
  await adminPage.getByPlaceholder('Search').fill('Alice Corp');
  await adminPage.getByRole('button', { name: 'Search' }).click();
  await expect(adminPage.locator('.result-row')).toHaveCount.greaterThan(0);
  await adminPage.locator('.result-row').first().click();
  await adminPage.getByRole('button', { name: 'Dispute' }).click();
  // ... actual test logic ...
});
```

**Count:** The first 6 lines are identical. Copy-paste invites drift — one test gets updated, the other doesn't.

---

## 2. Level 1 — Journey Helper Function

The simplest fix: extract a helper.

```typescript
// helpers/invoiceJourney.ts
import { type Page, expect } from '@playwright/test';

interface NavigateToInvoiceOptions {
  customerName: string;
  selectFirstResult?: boolean;
}

export async function navigateToInvoice(
  page: Page,
  options: NavigateToInvoiceOptions
): Promise<void> {
  const { customerName, selectFirstResult = true } = options;

  await page.goto('/invoices');
  await page.getByPlaceholder('Search').fill(customerName);
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.locator('.result-row')).toHaveCount.greaterThan(0);

  if (selectFirstResult) {
    await page.locator('.result-row').first().click();
  }
}
```

```typescript
// In your test
test('pay invoice', async ({ adminPage }) => {
  await navigateToInvoice(adminPage, { customerName: 'Alice Corp' });

  await adminPage.getByRole('button', { name: 'Pay Now' }).click();
  // ... actual assertion ...
});
```

**This is GOOD for:** Simple shared navigation with no side effects.
**This is NOT enough for:** Multi-page flows with data passing (IDs, tokens) between steps.

---

## 3. Level 2 — Flow Fixture with Data Accumulator

When the journey PRODUCES data that the test needs (invoice ID, customer ID, confirmation number), a fixture returns a typed accumulator.

```typescript
import { test as base, expect } from '@playwright/test';
import { InvoicePortalPage } from '../pages/InvoicePortalPage';

// ─── FLOW RESULT TYPE ─────────────────────────────────────────────────────
interface InvoiceFlowResult {
  invoiceId: string;
  customerId: string;
  page: InvoicePortalPage;
}

// ─── FIXTURE ──────────────────────────────────────────────────────────────
interface FlowFixtures {
  withInvoiceSelected: (customerName: string) => Promise<InvoiceFlowResult>;
}

export const test = base.extend<FlowFixtures>({
  withInvoiceSelected: async ({ page }, use) => {
    const portal = new InvoicePortalPage(page);

    const flow = async (customerName: string): Promise<InvoiceFlowResult> => {
      // Step 1: Navigate
      await portal.goto();

      // Step 2: Search
      await portal.searchForCustomer(customerName);
      await expect(portal.resultsTable.rows).toHaveCount.greaterThan(0);

      // Step 3: Extract data BEFORE clicking (clicking may navigate)
      const invoiceId = await portal.resultsTable
        .first()
        .locator('[data-column="id"]')
        .textContent()
        .then(t => t?.trim() ?? '');

      const customerId = await portal.resultsTable
        .first()
        .locator('[data-column="customerId"]')
        .textContent()
        .then(t => t?.trim() ?? '');

      // Step 4: Select row
      await portal.resultsTable.first().click();

      // Step 5: Wait for detail view
      await portal.detailPanel.waitForVisible();

      return { invoiceId, customerId, page: portal };
    };

    await use(flow);
  },
});
```

```typescript
// ─── USAGE ────────────────────────────────────────────────────────────────
test('pay invoice', async ({ withInvoiceSelected }) => {
  const { invoiceId, customerId, page } = await withInvoiceSelected('Alice Corp');

  // invoiceId and customerId are available for assertions
  expect(invoiceId).toMatch(/INV-\d+/);

  await page.payButton.click();
  await expect(page.toast).toHaveText(`Invoice ${invoiceId} marked as paid`);
});

test('dispute invoice', async ({ withInvoiceSelected }) => {
  const { invoiceId, page } = await withInvoiceSelected('Alice Corp');

  await page.disputeButton.click();
  await page.disputeReason.fill('Duplicate charge');
  await page.submitDispute.click();

  await expect(page.toast).toHaveText(`Invoice ${invoiceId} disputed`);
});
```

---

## 4. Level 3 — Multi-Step Wizard Flow Fixture

For complex flows (checkout wizard, onboarding, multi-page form):

```typescript
import { test as base, expect } from '@playwright/test';

// ─── WIZARD STEP TYPE ─────────────────────────────────────────────────────
type WizardStep =
  | 'customer-info'
  | 'shipping-address'
  | 'payment-details'
  | 'review-and-submit';

interface CheckoutFlowResult {
  orderId: string;
  confirmationNumber: string;
}

interface FlowFixtures {
  checkoutFlow: {
    runToStep: (targetStep: WizardStep, data: CheckoutData) => Promise<Page>;
    complete: (data: CheckoutData) => Promise<CheckoutFlowResult>;
  };
}

export const test = base.extend<FlowFixtures>({
  checkoutFlow: async ({ page }, use) => {
    const checkoutPage = new CheckoutPage(page);

    const flow = {
      async runToStep(targetStep: WizardStep, data: CheckoutData): Promise<Page> {
        await checkoutPage.goto();

        // Step: customer-info
        await checkoutPage.fillCustomerInfo(data.customer);
        if (targetStep === 'customer-info') return page;
        await checkoutPage.nextButton.click();

        // Step: shipping-address
        await checkoutPage.fillShipping(data.shipping);
        if (targetStep === 'shipping-address') return page;
        await checkoutPage.nextButton.click();

        // Step: payment-details
        await checkoutPage.fillPayment(data.payment);
        if (targetStep === 'payment-details') return page;
        await checkoutPage.nextButton.click();

        // Step: review-and-submit
        return page;
      },

      async complete(data: CheckoutData): Promise<CheckoutFlowResult> {
        await this.runToStep('review-and-submit', data);
        await checkoutPage.submitButton.click();

        const confirmation = await checkoutPage.confirmationNumber.textContent();
        const orderId = await checkoutPage.orderId.textContent();

        return {
          orderId: orderId?.trim() ?? '',
          confirmationNumber: confirmation?.trim() ?? '',
        };
      },
    };

    await use(flow);
  },
});
```

```typescript
// Test: verify payment step validation
test('payment step rejects expired card', async ({ checkoutFlow }) => {
  const page = await checkoutFlow.runToStep('payment-details', {
    customer: { name: 'Alice', email: 'alice@test.com' },
    shipping: { address: '123 Main St', city: 'NYC', zip: '10001' },
    payment: { cardNumber: '4111111111111111', expiry: '01/20', cvv: '123' },
  });

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Card has expired')).toBeVisible();
});

// Test: complete checkout happy path
test('successful checkout creates order', async ({ checkoutFlow }) => {
  const result = await checkoutFlow.complete({
    customer: { name: 'Alice', email: 'alice@test.com' },
    shipping: { address: '123 Main St', city: 'NYC', zip: '10001' },
    payment: { cardNumber: '4111111111111111', expiry: '12/25', cvv: '123' },
  });

  expect(result.orderId).toMatch(/ORD-\d+/);
  expect(result.confirmationNumber).toHaveLength(16);
});
```

---

## 5. When Flow Fixtures Become an Anti-Pattern

### ⚠️ Warning Sign 1: The fixture hides the assertion target

```typescript
// ❌ BAD: fixture does TOO MUCH — the test has nothing left to assert
const result = await completeEverythingFixture();
expect(result.success).toBe(true);  // What was tested? Who knows.
```

**Fix:** The fixture should STOP one step before the action being tested. The test itself performs the click/assertion.

### ⚠️ Warning Sign 2:.fixture has its own assertions

```typescript
// ❌ BAD: fixture asserts internally — test failures are cryptic
async function navigateToInvoice(...) {
  // ... steps ...
  await expect(page.locator('.results')).toHaveCount.greaterThan(0);
  // If this fails, the test name says "pay invoice" but fails at "search"
}
```

**Fix:** Fixtures should navigate and return state. Tests should assert.

### ⚠️ Warning Sign 3: Data is hardcoded inside the fixture

```typescript
// ❌ BAD: fixture always searches for "Alice Corp"
const result = await withInvoiceSelected();  // no params!
```

**Fix:** All variable data (customer names, amounts, IDs) must be parameters.

---

## 6. The Decision Matrix

| Situation | Use | Don't Use |
|---|---|---|
| Simple navigation (goto + wait) | Helper function | Flow fixture |
| 3+ steps with data extraction | Flow fixture | Inline repetition |
| Multi-page wizard | Flow fixture with `runToStep` | 10 `test.step()` blocks |
| The "journey" IS the test | Test itself | Flow fixture |
| Need to assert mid-journey | Flow fixture that stops early | Fixture that completes everything |

---

## Quick Reference

```typescript
// ✅ Good flow fixture: navigates, extracts data, returns control
const { invoiceId, page } = await withInvoiceSelected('Alice Corp');

// ❌ Bad flow fixture: does the assertion too
const { success } = await withInvoiceSelectedAndPaid('Alice Corp');
// The test has nothing left to verify. Is the payment logic tested? Unclear.
```

---

## Navigation

**Previous:** [← Login Fixture Architecture](./51_Login_Fixture_Architecture.md)
**Next:** [→ Index](../../00_INDEX.md)
