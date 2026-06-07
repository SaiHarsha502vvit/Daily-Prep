/**
 * QUIZ 02 — Challenge 16 [HARD]: The API Mocking Trap
 *
 * ORIGINAL BUGGY CODE:
 *   await page.route('**\/api/v1/orders', route => {
 *     intercepted = true;
 *     // We just want to spy — so we do nothing here
 *   });
 *
 * QUESTION: What happens when this test runs?
 *           What is the correct way to "spy" without breaking the request?
 */

import { test, expect } from '@playwright/test';

// ============================================================
// BUG — route handler does nothing → request hangs forever
// ============================================================
// page.route() INTERCEPTS the network request.  Playwright's browser holds
// the request open, waiting for one of three signals from your handler:
//   - route.continue()  → forward to the real server
//   - route.fulfill()   → respond with mock data
//   - route.abort()     → reject the request with a network error
//
// If your handler does NONE of these, the request hangs indefinitely.
// The UI never receives a response, the page freezes, and the test times out.

// ❌ BUGGY — silent interception causes a hung request
test('intercept API — BUGGY', async ({ page }) => {
  let intercepted = false;

  await page.route('**/api/v1/orders', (route) => {
    intercepted = true;
    // ❌ Missing route.continue() — request hangs forever
    // (route itself is now blocking the browser)
  });

  await page.goto('/dashboard');
  await page.locator('#loadOrdersBtn').click();
  // The orders API call hangs; the page may freeze or throw a timeout error

  expect(intercepted).toBe(true);
});

// ============================================================
// FIX 1 — route.continue() for spy-only interception
// ============================================================

test('spy on API without breaking it — FIX 1', async ({ page }) => {
  let intercepted = false;
  let requestPayload: unknown = null;

  await page.route('**/api/v1/orders', async (route) => {
    intercepted = true;
    const request = route.request();
    requestPayload = request.postDataJSON?.() ?? null;

    await route.continue(); // ✅ let the request reach the real server
  });

  await page.goto('/dashboard');
  await page.locator('#loadOrdersBtn').click();

  expect(intercepted).toBe(true);
  console.log('Captured payload:', requestPayload);
});

// ============================================================
// FIX 2 — page.waitForResponse (no interception needed for spying)
// ============================================================
// If you only need to observe responses/requests, page.route is overkill.
// Use page.waitForResponse — it attaches to the network event stream
// WITHOUT intercepting; the request flows normally.

test('spy on API with waitForResponse — FIX 2 (preferred for read-only)', async ({
  page,
}) => {
  // Register the listener BEFORE triggering the action (same race-condition
  // rule as waitForEvent — see Challenge 2)
  const [response] = await Promise.all([
    page.waitForResponse('**/api/v1/orders'), // ← register first
    page.locator('#loadOrdersBtn').click(),   // ← trigger second
  ]);

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(Array.isArray(body.orders)).toBe(true);
  // ✅ No interception — request went to the real server normally
});

// ============================================================
// WHEN to use page.route vs page.waitForResponse
// ============================================================
//
// page.route:          Modify, block, or mock the response
//                      → return fake data without a real server
//                      → block ads/analytics in E2E tests
//                      → inject error conditions (500, 429, timeout)
//
// page.waitForResponse: Observe the real response without touching it
//                       → assert on the actual server response
//                       → capture request/response for debugging
//                       → no interception side-effects

// ============================================================
// Advanced: route.fulfill — mock a complete response
// ============================================================

test('mock orders API response — route.fulfill', async ({ page }) => {
  await page.route('**/api/v1/orders', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        orders: [
          { id: 'ORD-001', status: 'PROCESSING', amount: 99.99 },
          { id: 'ORD-002', status: 'SHIPPED', amount: 49.99 },
        ],
        total: 2,
      }),
    });
    // ✅ No route.continue() needed — we fulfilled it ourselves
  });

  await page.goto('/dashboard');
  await page.locator('#loadOrdersBtn').click();

  await expect(page.locator('.order-row')).toHaveCount(2);
});

// WHY
// page.route() is an interception hook — not an observer.  It REPLACES the
// browser's normal request handling with your function.  If your function
// doesn't signal what to do with the request, the browser's internal promise
// never resolves, causing the page to hang.
//
// The three valid route disposals:
//   route.continue()  → same as no interception; passes request through
//   route.fulfill()   → respond with your own body/headers/status
//   route.abort()     → reject with a network error (use for error-path tests)
//
// Tip: always call exactly ONE of these per route handler.  Calling two (e.g.,
// continue() then fulfill()) will throw an error.
