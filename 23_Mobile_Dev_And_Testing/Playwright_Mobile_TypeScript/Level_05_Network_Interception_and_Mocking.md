# Level 5 — Network Interception & Mocking

### Companion track: [Playwright Mobile Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 4](Level_04_Touch_and_Gesture_Interactions.md)

---

## Basics — `page.route()`, the One Method That Does Almost Everything

Per Playwright's own docs: *"You don't have to configure anything to mock network requests. Just define a custom Route that mocks network for a browser context."* One method, three things you can do with any intercepted request:

```typescript
// 1. Mock a response entirely — the real backend is never actually called
await page.route('**/api/products', route => route.fulfill({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify([{ id: 1, name: 'Test Product', price: 9.99 }]),
}));

// 2. Let it through, optionally modified
await page.route('**/api/products', async route => {
  const headers = route.request().headers();
  delete headers['x-experiment-flag']; // strip a header before it reaches the real server
  await route.continue({ headers });
});

// 3. Block it entirely
await page.route('**/*.png', route => route.abort()); // e.g., skip loading images for a faster test run
```

---

## Concept — Why Mobile Tests Need This More Than Desktop Ones

Mobile apps hit far more network-dependent states worth testing deliberately: a slow 3G connection, a request that times out mid-checkout, an API that returns a malformed response the app needs to handle gracefully. A real backend can't reliably reproduce any of these on demand — `page.route()` can, every single time, with zero flakiness.

```typescript
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['Pixel 7'] });

test('shows a friendly error when the product API returns 500', async ({ page }) => {
  await page.route('**/api/product/*', route => route.fulfill({
    status: 500,
    body: JSON.stringify({ error: 'Internal Server Error' }),
  }));

  await page.goto('/product/123');
  await expect(page.getByText('Something went wrong. Please try again.')).toBeVisible();
});
```

Without mocking, testing this error state would require either genuinely breaking your backend on demand (dangerous, disruptive to other work) or hoping a real failure happens to occur during a test run (unreliable, not repeatable). Mocking makes an edge case deterministic.

---

## Real-World Problem — Testing Offline Mode on a Mobile Checkout Flow

```typescript
test('offline banner appears mid-checkout and cart data survives reconnection', async ({ page, context }) => {
  await page.goto('/cart');
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(page.getByTestId('cart-count')).toHaveText('1');

  // Go offline
  await context.setOffline(true);
  await expect(page.getByTestId('offline-banner')).toBeVisible();

  // Attempt an action that requires network — it should queue, not crash
  await page.getByRole('button', { name: 'Checkout' }).click();
  await expect(page.getByText('Will retry when back online')).toBeVisible();

  // Reconnect
  await context.setOffline(false);
  await expect(page.getByTestId('offline-banner')).toBeHidden();

  // The queued action should now have gone through
  await expect(page.getByText('Order placed')).toBeVisible();
});
```

`context.setOffline(true)` sends a CDP `Network.emulateNetworkConditions` command under the hood — Chrome genuinely blocks all network requests and fires the browser's real `offline` event, which is exactly what a well-built app's own JavaScript listens for to show an offline banner. This is testing the *real* browser-level offline event mechanism, not a fake substitute for it.

---

## Solution — Capturing and Asserting on Request Payloads

Beyond mocking responses, `page.route()` lets you inspect what your app actually *sent* — critical for verifying a mobile-specific field made it into an API call:

```typescript
test('add-to-cart request includes mobile-specific source field', async ({ page }) => {
  let capturedBody: any = null;

  await page.route('**/api/cart/items', async route => {
    capturedBody = JSON.parse(route.request().postData() ?? '{}');
    await route.continue(); // let the real request through — we're only observing
  });

  await page.goto('/product/123');
  await page.getByRole('button', { name: 'Add to Cart' }).tap();

  expect(capturedBody).not.toBeNull();
  expect(capturedBody.productId).toBe('123');
  expect(capturedBody.source).toBe('mobile_web'); // a field only mobile clients should send
});
```

This pattern — capture into an outer-scope variable inside the route handler, assert on it after the action that triggers the request — is the standard shape for verifying *what your app sends*, not just what it *displays*.

---

## Challenges

### 🐛 Bug Hunt — The Mock That Never Actually Intercepts

```typescript
test('shows empty state when no products exist', async ({ page }) => {
  await page.goto('/products');

  await page.route('**/api/products', route => route.fulfill({
    status: 200,
    body: JSON.stringify([]),
  }));

  await expect(page.getByText('No products found')).toBeVisible();
});
```

This test fails — the empty state never appears, and real product data shows up instead, as if the mock were never registered at all. Find the ordering mistake.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `page.route()` is registered **after** `page.goto('/products')` — but the page's own initial API call to `/api/products` fires as part of loading that page, which already happened by the time the route handler gets set up. The mock genuinely works, it's just installed too late to catch the request it was meant to intercept. The fix is pure ordering — register the route **before** navigating:

```typescript
test('shows empty state when no products exist', async ({ page }) => {
  await page.route('**/api/products', route => route.fulfill({
    status: 200,
    body: JSON.stringify([]),
  }));

  await page.goto('/products'); // NOW the initial load hits the mock
  await expect(page.getByText('No products found')).toBeVisible();
});
```

This is a genuinely common mistake, and worth internalizing as a rule rather than re-deriving each time: **route handlers must be registered before whatever navigation or action would trigger the request they're meant to intercept.**

</details>

---

### 🎭 Two Truths and a Lie — Route Handler Semantics

**A.** `route.continue({ headers })` lets you modify a request's headers before it's sent to the real server; `route.fulfill()` skips the real server entirely and returns a response you construct yourself.

**B.** Once you call `page.route('**/api/products', handler)`, that handler intercepts every matching request for the rest of that test file's execution, across all tests, unless explicitly unregistered.

**C.** `context.setOffline(true)` and manually aborting every request via `page.route('**/*', route => route.abort())` produce a similar practical effect (no network succeeds) but are not the same mechanism — one fires the browser's real `offline` event, the other does not.

<details><summary>Which one's the lie</summary>

**B is the lie.** Route handlers registered via `page.route()` are scoped to the **page** (or context, if registered via `context.route()`) they were registered on, and Playwright's Test runner creates a fresh `page`/`context` for each test by default — meaning a route registered in one test does not leak into the next one. Treating routes as persisting across tests would be a genuinely dangerous assumption to carry forward, since it would mean forgetting to re-register a mock in a new test could silently let real network calls through where you expected mocked ones.

🔴 **Explanation:** A is true and is the core distinction this level opened with — `continue()` is "let it happen, maybe adjusted," `fulfill()` is "short-circuit entirely." C is true and matters specifically for testing offline UI: manually aborting requests stops network traffic but doesn't necessarily fire the same `window.addEventListener('offline', ...)` event a real connectivity loss does — `context.setOffline(true)`, per this level's own explanation, uses a real CDP network-condition command specifically to trigger that authentic browser-level event, which is what most real offline-banner implementations actually listen for.

</details>

---

**Next → [Level 6: Page Object Model for Mobile](Level_06_Page_Object_Model.md)**
