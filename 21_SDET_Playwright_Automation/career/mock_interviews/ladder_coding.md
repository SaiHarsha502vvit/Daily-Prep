# Mock Interview Transcript: Coding Round (45 min)

**Role:** Senior SDET (L6/L7)  
**Interviewer:** Senior Engineer  
**Prompt:** "Write a test for a checkout flow with inventory validation."

**Constraints:** Use TypeScript and Playwright. The checkout should validate that the ordered item is in stock before completing.

---

## Starter Code Skeleton

```typescript
import { test, expect } from "@playwright/test";

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
test("complete checkout with valid inventory", async ({ page }) => {
  // TODO: implement
});

// TODO: Write a negative test for out-of-stock scenario
test("checkout fails when item is out of stock", async ({ page }) => {
  // TODO: implement
});
```

---

## Expected Completed Solution

```typescript
import { test, expect, Page } from "@playwright/test";

const TEST_PRODUCT = {
  id: "SKU-BOOK-001",
  name: "Test Automation Handbook",
  price: 4999, // cents
  initialStock: 10,
};

const BASE_URL = process.env.APP_URL || "http://localhost:3000";

async function seedInventory(productId: string, quantity: number) {
  const res = await fetch(`${BASE_URL}/api/inventory/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.waitForURL(/\/cart/);
}

async function fillShipping(page: Page) {
  await page.getByLabel(/first name/i).fill("Jane");
  await page.getByLabel(/last name/i).fill("Doe");
  await page.getByLabel(/address/i).fill("123 Test Lane");
  await page.getByLabel(/city/i).fill("Testville");
  await page.getByLabel(/zip/i).fill("12345");
}

test.describe("Checkout Flow", () => {
  test.beforeEach(async () => {
    await seedInventory(TEST_PRODUCT.id, TEST_PRODUCT.initialStock);
  });

  test("complete checkout with valid inventory", async ({ page }) => {
    const stockBefore = await getInventory(TEST_PRODUCT.id);
    expect(stockBefore).toBe(TEST_PRODUCT.initialStock);

    await addToCart(page, TEST_PRODUCT.id);
    await page.getByRole("button", { name: /checkout/i }).click();

    await page.waitForURL(/\/checkout/);
    await fillShipping(page);

    await page.getByRole("button", { name: /place order/i }).click();

    await expect(page.getByText(/order confirmed/i)).toBeVisible();

    const stockAfter = await getInventory(TEST_PRODUCT.id);
    expect(stockAfter).toBe(stockBefore - 1);
  });

  test("checkout fails when item is out of stock", async ({ page }) => {
    await seedInventory(TEST_PRODUCT.id, 0);

    await page.goto(`${BASE_URL}/product/${TEST_PRODUCT.id}`);

    const message = await page.getByText(/out of stock/i);
    if (await message.isVisible().catch(() => false)) {
      // UI gracefully handles out-of-stock
      await expect(
        page.getByRole("button", { name: /add to cart/i }),
      ).toBeDisabled();
      return;
    }

    // Race condition: product went out of stock between add-to-cart and checkout
    await addToCart(page, TEST_PRODUCT.id);
    await page.getByRole("button", { name: /checkout/i }).click();
    await page.waitForURL(/\/checkout/);
    await fillShipping(page);

    await page.getByRole("button", { name: /place order/i }).click();

    await expect(page.getByText(/item no longer available/i)).toBeVisible();

    const stockAfter = await getInventory(TEST_PRODUCT.id);
    expect(stockAfter).toBe(0);
  });

  test("multiple concurrent checkouts do not oversell", async ({
    page,
    browser,
  }) => {
    await seedInventory(TEST_PRODUCT.id, 1);

    const shopperA = page;
    const contextB = await browser.newContext();
    const shopperB = await contextB.newPage();

    await Promise.all([
      addToCart(shopperA, TEST_PRODUCT.id),
      addToCart(shopperB, TEST_PRODUCT.id),
    ]);

    await shopperA.getByRole("button", { name: /checkout/i }).click();
    await shopperA.waitForURL(/\/checkout/);
    await fillShipping(shopperA);

    await shopperB.getByRole("button", { name: /checkout/i }).click();
    await shopperB.waitForURL(/\/checkout/);
    await fillShipping(shopperB);

    const confirmA = shopperA
      .getByRole("button", { name: /place order/i })
      .click();
    const confirmB = shopperB
      .getByRole("button", { name: /place order/i })
      .click();

    // Wait for both to finish handling
    await Promise.all([confirmA, confirmB]);

    const successCount = await Promise.all([
      shopperA
        .locator("text=/order confirmed/i")
        .isVisible()
        .catch(() => false),
      shopperB
        .locator("text=/order confirmed/i")
        .isVisible()
        .catch(() => false),
    ]).then((results) => results.filter(Boolean).length);

    const stockAfter = await getInventory(TEST_PRODUCT.id);
    expect(successCount + stockAfter).toBe(1);

    await contextB.close();
  });
});
```

---

## Evaluation Rubric

| Dimension              | Exceeds Expectations                                                                               | Meets Expectations                                  | Below Expectations                               |
| ---------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| **Correctness**        | Happy path and negative path both tested; oversell race condition covered with multi-page approach | Happy path works; at least one negative test exists | Only happy path; no negative coverage            |
| **Test Design**        | Clear helper functions; beforeEach for setup; logical grouping with test.describe                  | Some helpers or grouping but inconsistent           | Single long test or no helpers; duplicated code  |
| **Error Handling**     | Seeds inventory before each test; validates pre-condition (stockBefore); handles API failures      | Basic setup but no pre-condition assertions         | No setup/teardown; assumes external state        |
| **Assertions**         | Asserts on UI confirmation AND backend state (inventory count)                                     | Asserts UI confirmation only                        | Assertions missing or trivial                    |
| **TypeScript Quality** | Types on helpers (Page param); strong typing on inventory API; no any                              | Some types but inconsistencies or implicit any      | Heavy use of any; missing types on key functions |

---

## Full Mock Transcript (Dialogue, ~45 min)

The sections above are the **artifacts** — what's on the screen at the end. This section is the **dialogue** — what's said between the interviewer (**I**) and candidate (**C**) along the way, including the wrong turn the candidate takes around minute 18 and corrects under questioning.

### [00:00–00:04] Setup, prompt, clarifying questions

**I:** Hi. Format: 45 minutes, one coding problem. You can use any editor, but I'd like you to share screen and narrate. I'll interrupt with questions. Last 10 minutes are reserved for follow-up scenarios. Cool?

**C:** Cool. Editor: VS Code with Copilot off?

**I:** Yes please. Treat it as if we were pair-programming.

**C:** Got it.

**I:** Prompt: write a test for a checkout flow with inventory validation. Use TypeScript and Playwright. The checkout should validate that the ordered item is in stock before completing.

**C:** Quick questions before I start. What's the deployed app look like? Is there a hosted instance I can hit, or do I assume the URL?

**I:** Assume the URL. Don't worry about deployment — I want to see the test design, not the infra.

**C:** OK. Second — is there an API for inventory state, or do I have to manipulate inventory through the UI?

**I:** There's an API. `POST /api/inventory/seed` takes `{productId, quantity}` to set stock. `GET /api/inventory/:id` reads current stock. I'll trust whatever I see you call.

**C:** Perfect. Third — is the framework a fresh project or should I assume the framework from the chapters? Specifically, do I have fixtures already, or am I writing this in a single file?

**I:** Single file. Treat it like a coding interview, not a framework integration.

**C:** Got it. Let me sketch.

### [00:04–00:08] Sketching the test shape

**C:** [opens a new file, types]

```typescript
import { test, expect } from "@playwright/test";
```

**C:** Two test cases minimum: happy path (item in stock → checkout succeeds), and negative (out of stock → checkout fails gracefully). I might add a third for the race condition where two people try to buy the last item. Let me write the happy path first.

I'll need helpers: `seedInventory(productId, qty)`, `addToCart(page, productId)`, and `fillShipping(page)`. Those keep the test body readable.

**I:** Why factor them out? It's one test.

**C:** Because I expect the negative test and the race test to use the same `addToCart` and `fillShipping`. If I inline them in the first test, I'll re-write them in the second, and they'll drift. Cheaper to factor now.

**I:** OK.

**C:** [starts typing]

```typescript
const TEST_PRODUCT = {
  id: "SKU-BOOK-001",
  name: "Test Automation Handbook",
  price: 4999,
  initialStock: 10,
};

async function seedInventory(productId: string, qty: number) {
  const res = await fetch(`/api/inventory/seed`, {
    method: "POST",
    body: JSON.stringify({ productId, quantity: qty }),
  });
}
```

**I:** Pause there. Why no `await fetch().then(r => r.ok)`? You don't check the response.

**C:** Good catch. If seed fails, every downstream test passes for the wrong reason. Let me fix.

```typescript
async function seedInventory(productId: string, qty: number) {
  const res = await fetch(`${BASE_URL}/api/inventory/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity: qty }),
  });
  if (!res.ok) {
    throw new Error(
      `Failed to seed inventory: ${res.status} ${await res.text()}`,
    );
  }
}
```

**C:** Threw a real error so beforeEach blows up instead of letting tests run on a bad fixture.

### [00:08–00:14] The happy-path test

**C:** [writes]

```typescript
test("complete checkout with valid inventory", async ({ page }) => {
  await seedInventory(TEST_PRODUCT.id, TEST_PRODUCT.initialStock);

  await page.goto(`${BASE_URL}/product/${TEST_PRODUCT.id}`);
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.waitForURL(/\/cart/);

  await page.getByRole("button", { name: /checkout/i }).click();
  await page.waitForURL(/\/checkout/);

  // shipping form
  await page.getByLabel(/first name/i).fill("Jane");
  await page.getByLabel(/last name/i).fill("Doe");
  await page.getByLabel(/address/i).fill("123 Test Lane");
  await page.getByLabel(/city/i).fill("Testville");
  await page.getByLabel(/zip/i).fill("12345");

  await page.getByRole("button", { name: /place order/i }).click();

  await expect(page.getByText(/order confirmed/i)).toBeVisible();
});
```

**I:** Two things. One — you've inlined the shipping form. You just said you'd factor that out.

**C:** Right, fix.

**I:** Two — your assertion is just on the UI message. The prompt said "validate inventory." Did you?

**C:** [pauses, reads the test] No. I clicked "place order" and asserted the UI said confirmed. I didn't actually check that inventory went down. If the backend silently failed and the UI still showed confirmation, my test would pass falsely.

**I:** Right. What do you do?

**C:** Add a backend assertion. Read inventory before and after, assert it decremented by 1.

```typescript
const stockBefore = await getInventory(TEST_PRODUCT.id);
expect(stockBefore).toBe(TEST_PRODUCT.initialStock);

// ... checkout flow ...

await expect(page.getByText(/order confirmed/i)).toBeVisible();

const stockAfter = await getInventory(TEST_PRODUCT.id);
expect(stockAfter).toBe(stockBefore - 1);
```

**C:** This is what Ch15 of the curriculum calls the "success theatre" anti-pattern. The UI saying "confirmed" doesn't prove the order persisted. You need a backend check too.

### [00:14–00:20] Refactor + the wrong turn

**C:** [extracts `addToCart` and `fillShipping` into helpers, refactors the test]

**C:** [writes the negative test]

```typescript
test("checkout fails when item is out of stock", async ({ page }) => {
  await seedInventory(TEST_PRODUCT.id, 0);

  await page.goto(`${BASE_URL}/product/${TEST_PRODUCT.id}`);
  await expect(
    page.getByRole("button", { name: /add to cart/i }),
  ).toBeDisabled();
});
```

**I:** That's a totally different scenario than the happy path. You're testing "out of stock at PDP." The prompt was "checkout should validate inventory." That implies the user can reach checkout and then it fails — not that the button is disabled upstream.

**C:** Hmm. Two interpretations of the spec. Let me think.

[pauses ~10 seconds]

**C:** OK, you're right. Asserting on the disabled button at the product page tests a different thing — "we prevent oversell from the UI." The interesting test is the race: user adds to cart while stock=1, but by the time they get to checkout, someone else has bought it. The checkout has to detect this server-side and fail gracefully.

So this test should actually exercise the checkout-validation path. Let me rewrite it to seed stock=1, add to cart, then seed stock=0 right before submitting, and confirm the checkout shows an error.

```typescript
test("checkout fails when item goes out of stock mid-flow", async ({
  page,
}) => {
  await seedInventory(TEST_PRODUCT.id, 1);

  await page.goto(`${BASE_URL}/product/${TEST_PRODUCT.id}`);
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.waitForURL(/\/cart/);

  await page.getByRole("button", { name: /checkout/i }).click();
  await page.waitForURL(/\/checkout/);

  // Simulate another buyer draining inventory
  await seedInventory(TEST_PRODUCT.id, 0);

  await fillShipping(page);
  await page.getByRole("button", { name: /place order/i }).click();

  await expect(page.getByText(/item no longer available/i)).toBeVisible();
  expect(await getInventory(TEST_PRODUCT.id)).toBe(0);
});
```

**I:** That's the test I wanted. What does this catch that the disabled-button test doesn't?

**C:** A server-side race. The disabled-button test would pass even if the server happily oversold — because the test only checks UI state at one moment. The mid-flow test catches the actual concurrency bug.

**I:** Good correction. Move on.

### [00:20–00:28] The race test

**C:** Now the multi-user race. I need two browser contexts because they need independent cookies.

```typescript
test("concurrent checkouts do not oversell", async ({ page, browser }) => {
  await seedInventory(TEST_PRODUCT.id, 1);

  const shopperA = page;
  const contextB = await browser.newContext();
  const shopperB = await contextB.newPage();

  await Promise.all([
    addToCart(shopperA, TEST_PRODUCT.id),
    addToCart(shopperB, TEST_PRODUCT.id),
  ]);

  await shopperA.getByRole("button", { name: /checkout/i }).click();
  await shopperA.waitForURL(/\/checkout/);
  await fillShipping(shopperA);

  await shopperB.getByRole("button", { name: /checkout/i }).click();
  await shopperB.waitForURL(/\/checkout/);
  await fillShipping(shopperB);

  // race the submits
  await Promise.all([
    shopperA.getByRole("button", { name: /place order/i }).click(),
    shopperB.getByRole("button", { name: /place order/i }).click(),
  ]);

  const aConfirmed = await shopperA
    .locator("text=/order confirmed/i")
    .isVisible()
    .catch(() => false);
  const bConfirmed = await shopperB
    .locator("text=/order confirmed/i")
    .isVisible()
    .catch(() => false);

  const successCount = [aConfirmed, bConfirmed].filter(Boolean).length;
  expect(successCount).toBe(1);

  await contextB.close();
});
```

**I:** Three questions on this. One — your assertion is `successCount === 1`. What if both succeed? What if both fail?

**C:** If both succeed, the system oversold — bug. If both fail, the system was so paranoid it locked both out — also a bug (worse UX than oversell). Both should fail the test. So `=== 1` is right.

**I:** Two — what if the timing is such that shopper A finishes the full checkout before shopper B even starts? Then there's no race.

**C:** That's a real risk. My current code has A finish typing shipping before B starts. I'd fix by typing shipping in parallel before the submit race, like this:

```typescript
await Promise.all([
  shopperA
    .getByRole("button", { name: /checkout/i })
    .click()
    .then(() => shopperA.waitForURL(/\/checkout/))
    .then(() => fillShipping(shopperA)),
  shopperB
    .getByRole("button", { name: /checkout/i })
    .click()
    .then(() => shopperB.waitForURL(/\/checkout/))
    .then(() => fillShipping(shopperB)),
]);
```

Now both shoppers reach the place-order step at roughly the same time. The actual race is then on the submit clicks, which is what we want to test.

**I:** Three — this test is racy. It might pass on a fast machine and fail on a slow one. Doesn't that mean it's flaky?

**C:** It's racy by design — we're explicitly testing a race condition. The flakiness risk comes from the assumption that both submits will hit the server within the critical window. In practice, real concurrency tests like this are run with a load-test harness (e.g., k6) for higher confidence. The Playwright version here is a smoke test for "the lock is at least at the server level." For a true production race-condition guarantee, I'd want a separate load test.

**I:** Good answer.

### [00:28–00:35] beforeEach + typing

**C:** [adds]

```typescript
test.describe("Checkout Flow", () => {
  test.beforeEach(async () => {
    await seedInventory(TEST_PRODUCT.id, TEST_PRODUCT.initialStock);
  });
  // ...
});
```

**C:** beforeEach resets to the canonical 10 units. Individual tests override via additional seed calls. That way each test is independent — no order dependency.

[adds types to helpers]

```typescript
async function addToCart(page: Page, productId: string): Promise<void> {
  ...
}

async function getInventory(productId: string): Promise<number> {
  ...
}
```

**I:** Why `Promise<void>` instead of just `Promise<unknown>` or no return type?

**C:** Explicitness. Reading the call site, I want to know whether I'm getting back a value. If you write `await addToCart(page, id)` and the function quietly returned the response object, you might write a follow-on test that assumes the return value. Stating `Promise<void>` makes "no return" intentional, not accidental.

### [00:35–00:42] Follow-up scenarios

**I:** Last section. Three quick scenarios.

**I:** Scenario one — the inventory API is unreliable in CI. Sometimes it takes 5 seconds to respond. How do you make your test resilient without making it flaky?

**C:** Two options. Option A: bake a sensible timeout into `seedInventory` — say 10 seconds. If it exceeds, fail with a clear message about the API, not the test. Option B: add a retry with exponential backoff (3 attempts, 200ms / 1s / 5s) at the seedInventory level — but with the _important caveat_ that retry is only safe on idempotent operations. Seeding to a known absolute quantity is idempotent. So retry is fine here.

I'd go with B: retry + clear error. The framework's `ApiCore.ts` already does this for application API calls; for test infrastructure calls like seed, you want the same pattern.

**I:** Scenario two — the dev team adds a "save shipping for later" feature. Now the form has 6 fields instead of 5. Your `fillShipping` breaks.

**C:** That's a maintainability concern. Two mitigations. One, organize `fillShipping` to fill named fields rather than positional ones — already done. Two, make `fillShipping` accept an `Partial<ShippingDetails>` so callers can opt out of new fields. Add the new field as optional in the helper, and existing callers don't break.

```typescript
interface ShippingDetails {
  firstName?: string;
  lastName?: string;
  // ...
  saveForLater?: boolean;
}
async function fillShipping(page: Page, opts: ShippingDetails = {}) {
  // fill provided fields; skip others
}
```

**I:** Scenario three — product wants you to add a `@smoke` tag to the happy path test only, so it runs on every PR. The negative tests should run only nightly.

**C:** Tagging.

```typescript
test('@smoke complete checkout with valid inventory', async ({ page }) => { ... });
test('@nightly checkout fails when item goes out of stock mid-flow', async ({ page }) => { ... });
test('@nightly concurrent checkouts do not oversell', async ({ page, browser }) => { ... });
```

Then PR jobs filter `--grep @smoke`, nightly jobs filter `--grep @nightly`. The framework's `playwright.config.ts` already has tagged projects we can mirror. I'd document the tag convention in the test file header so new contributors don't reinvent it.

### [00:42–00:45] Wrap

**I:** That's time. Anything you want to add?

**C:** Two notes on what I cut. One, I didn't actually run the test — in a real interview I'd hit `npx playwright test` and watch it pass. Two, I focused on the test side. In production I'd also lobby for the backend to use a Redis lock or postgres SELECT FOR UPDATE on the inventory row at the checkout endpoint — the test catches the symptom; the fix is server-side. I'd raise that in a follow-up PR with the backend team.

**I:** Good wrap. We'll be in touch.

---

## Calibration notes for the candidate

What the interviewer rewarded:

- **The course correction at minute 18** — when challenged on the wrong test interpretation, the candidate didn't defend; they re-thought and rewrote. That earned more points than a perfect first-pass would have.
- **The "success theatre" callback** — naming a known anti-pattern shows you've internalized the curriculum, not just memorized syntax.
- **The race-test pushback** — admitting Playwright isn't the right tool for production race-condition coverage shows judgment.
- **`Promise<void>` justification** — small details signal seriousness about types.

What the interviewer pushed on:

- **Inlined helpers** — the candidate self-corrected after one nudge.
- **Missing backend assertion** — single biggest signal, caught early.
- **The disabled-button vs race interpretation** — checks whether the candidate reads the spec literally vs interprets intent.

Common ways this round goes wrong:

- Candidate writes the happy path, the interviewer asks "is that enough?", and the candidate adds a `expect(page).toHaveURL` — that's a UI assertion masquerading as backend validation. Not the same thing.
- Candidate doesn't factor helpers out, then re-writes the same shipping fill three times, then runs out of time on the race test.
- Candidate writes the race test with a single page object, doesn't realize cookies are shared, doesn't catch why both shoppers always win or both always lose.
- Candidate doesn't have a story for "is this race test flaky?" Calibrate ahead of time.
