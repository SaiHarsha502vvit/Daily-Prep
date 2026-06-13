# Mock Interview Transcript: Coding Round (45 min)

**Role:** Senior SDET (L6/L7)  
**Interviewer:** Senior Engineer  
**Prompt:** "Write a test for a checkout flow with inventory validation."

**Constraints:** Use TypeScript and Playwright. The checkout should validate that the ordered item is in stock before completing.

---

## Starter Code Skeleton

```typescript
import { test, expect } from '@playwright/test';

// TODO: Define test data for the checkout scenario
const TEST_PRODUCT = {
  // fill in
};

// TODO: Implement a helper to seed inventory (or mock API)
async function seedInventory(page, productId: string, quantity: number) {
  // fill in
}

// TODO: Write the test below
/**
 * Test: Complete checkout flow with inventory validation
 * Steps:
 * 1. Seed inventory so product is in stock
 * 2. Navigate to product page
 * 3. Add to cart
 * 4. Go to checkout
 * 5. Enter shipping details
 * 6. Submit order
 * 7. Assert order confirmation and inventory reduced
 */
test('complete checkout with valid inventory', async ({ page }) => {
  // TODO: implement
});

// TODO: Write a negative test for out-of-stock scenario
test('checkout fails when item is out of stock', async ({ page }) => {
  // TODO: implement
});
```

---

## Expected Completed Solution

```typescript
import { test, expect, Page } from '@playwright/test';

const TEST_PRODUCT = {
  id: 'SKU-BOOK-001',
  name: 'Test Automation Handbook',
  price: 4999, // cents
  initialStock: 10,
};

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

async function seedInventory(productId: string, quantity: number) {
  const res = await fetch(`${BASE_URL}/api/inventory/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) throw new Error(`Failed to seed inventory: ${await res.text()}`);
}

async function getInventory(productId: string): Promise<number> {
  const res = await fetch(`${BASE_URL}/api/inventory/${productId}`);
  if (!res.ok) throw new Error(`Failed to get inventory: ${await res.text()}`);
  const data = await res.json();
  return data.quantity;
}

async function addToCart(page: Page, productId: string) {
  await page.goto(`${BASE_URL}/product/${productId}`);
  await page.getByRole('button', { name: /add to cart/i }).click();
  await page.waitForURL(/\/cart/);
}

async function fillShipping(page: Page) {
  await page.getByLabel(/first name/i).fill('Jane');
  await page.getByLabel(/last name/i).fill('Doe');
  await page.getByLabel(/address/i).fill('123 Test Lane');
  await page.getByLabel(/city/i).fill('Testville');
  await page.getByLabel(/zip/i).fill('12345');
}

test.describe('Checkout Flow', () => {
  test.beforeEach(async () => {
    await seedInventory(TEST_PRODUCT.id, TEST_PRODUCT.initialStock);
  });

  test('complete checkout with valid inventory', async ({ page }) => {
    const stockBefore = await getInventory(TEST_PRODUCT.id);
    expect(stockBefore).toBe(TEST_PRODUCT.initialStock);

    await addToCart(page, TEST_PRODUCT.id);
    await page.getByRole('button', { name: /checkout/i }).click();

    await page.waitForURL(/\/checkout/);
    await fillShipping(page);

    await page.getByRole('button', { name: /place order/i }).click();

    await expect(page.getByText(/order confirmed/i)).toBeVisible();

    const stockAfter = await getInventory(TEST_PRODUCT.id);
    expect(stockAfter).toBe(stockBefore - 1);
  });

  test('checkout fails when item is out of stock', async ({ page }) => {
    await seedInventory(TEST_PRODUCT.id, 0);

    await page.goto(`${BASE_URL}/product/${TEST_PRODUCT.id}`);

    const message = await page.getByText(/out of stock/i);
    if (await message.isVisible().catch(() => false)) {
      // UI gracefully handles out-of-stock
      await expect(page.getByRole('button', { name: /add to cart/i })).toBeDisabled();
      return;
    }

    // Race condition: product went out of stock between add-to-cart and checkout
    await addToCart(page, TEST_PRODUCT.id);
    await page.getByRole('button', { name: /checkout/i }).click();
    await page.waitForURL(/\/checkout/);
    await fillShipping(page);

    await page.getByRole('button', { name: /place order/i }).click();

    await expect(page.getByText(/item no longer available/i)).toBeVisible();

    const stockAfter = await getInventory(TEST_PRODUCT.id);
    expect(stockAfter).toBe(0);
  });

  test('multiple concurrent checkouts do not oversell', async ({ page, browser }) => {
    await seedInventory(TEST_PRODUCT.id, 1);

    const shopperA = page;
    const contextB = await browser.newContext();
    const shopperB = await contextB.newPage();

    await Promise.all([
      addToCart(shopperA, TEST_PRODUCT.id),
      addToCart(shopperB, TEST_PRODUCT.id),
    ]);

    await shopperA.getByRole('button', { name: /checkout/i }).click();
    await shopperA.waitForURL(/\/checkout/);
    await fillShipping(shopperA);

    await shopperB.getByRole('button', { name: /checkout/i }).click();
    await shopperB.waitForURL(/\/checkout/);
    await fillShipping(shopperB);

    const confirmA = shopperA.getByRole('button', { name: /place order/i }).click();
    const confirmB = shopperB.getByRole('button', { name: /place order/i }).click();

    // Wait for both to finish handling
    await Promise.all([confirmA, confirmB]);

    const successCount = await Promise.all([
      shopperA.locator('text=/order confirmed/i').isVisible().catch(() => false),
      shopperB.locator('text=/order confirmed/i').isVisible().catch(() => false),
    ]).then(results => results.filter(Boolean).length);

    const stockAfter = await getInventory(TEST_PRODUCT.id);
    expect(successCount + stockAfter).toBe(1);

    await contextB.close();
  });
});
```

---

## Evaluation Rubric

| Dimension | Exceeds Expectations | Meets Expectations | Below Expectations |
|-----------|----------------------|--------------------|--------------------|
| **Correctness** | Happy path and negative path both tested; oversell race condition covered with multi-page approach | Happy path works; at least one negative test exists | Only happy path; no negative coverage |
| **Test Design** | Clear helper functions; beforeEach for setup; logical grouping with test.describe | Some helpers or grouping but inconsistent | Single long test or no helpers; duplicated code |
| **Error Handling** | Seeds inventory before each test; validates pre-condition (stockBefore); handles API failures | Basic setup but no pre-condition assertions | No setup/teardown; assumes external state |
| **Assertions** | Asserts on UI confirmation AND backend state (inventory count) | Asserts UI confirmation only | Assertions missing or trivial |
| **TypeScript Quality** | Types on helpers (Page param); strong typing on inventory API; no any | Some types but inconsistencies or implicit any | Heavy use of any; missing types on key functions |
