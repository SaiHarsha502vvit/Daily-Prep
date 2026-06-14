/**
 * QUIZ 02 — Challenge 4 [MEDIUM]: Wrong Wait Strategy
 *
 * ORIGINAL BUGGY CODE:
 *   await adminPortal.navigateToCustomer('C-001');
 *   await page.waitForTimeout(5000);   // <-- hard sleep
 *   const status = await statusField.textContent();
 *   expect(status?.trim()).toBe('Active');
 *
 * QUESTION: Three things are wrong. Find them all.
 */

import { test, expect, type Page } from "@playwright/test";

// ============================================================
// BUG 1 — waitForTimeout(5000): hard sleeps are always wrong
// ============================================================
// • Too slow in fast environments (needlessly adds 5 s per test).
// • Still flaky in slow CI environments (5 s may not be enough).
// • Hides real timing problems instead of surfacing them.
//
// BUG 2 — textContent() called without confirming the page has settled
// ============================================================
// textContent() queries the DOM ONCE and returns whatever is there right
// now.  After navigation the DOM might still show the PREVIOUS record's
// data (stale render) while the OData request for C-001 is in flight.
//
// BUG 3 — No navigation confirmation before reading the status
// ============================================================
// navigateToCustomer('C-001') might navigate, but if the record hasn't
// fully loaded the field may be blank, showing a loading skeleton, or
// still displaying C-000's value.

// ❌ BUGGY
test("verify customer status — BUGGY", async ({ page }) => {
  const statusField = page.locator('[data-automation-key="statecode"]');

  // Pretend adminPortal.navigateToCustomer('C-001') is this:
  await page.goto("https://example.com/customers/C-001");

  await page.waitForTimeout(5000); // ❌ hard sleep

  const status = await statusField.textContent(); // ❌ point-in-time read
  expect(status?.trim()).toBe("Active"); // ❌ might be stale or blank
});

// ✅ FIX — content-based waits with Playwright's built-in auto-retry
test("verify customer status — FIXED", async ({ page }) => {
  const statusField = page.locator('[data-automation-key="statecode"]');

  // Navigate
  await page.goto("https://example.com/customers/C-001");

  // 1 — Confirm we landed on the right record (anti-stale-render guard)
  await expect(page.locator('[data-automation-key="fullname"]')).toHaveText(
    "Expected Customer Name",
    { timeout: 30_000 },
  );

  // 2 — Wait for loading spinners to clear (D365 / SPA pattern)
  await expect(page.locator(".ms-Spinner")).toHaveCount(0, {
    timeout: 30_000,
  });

  // 3 — Assert on the specific field; toHaveText auto-retries until timeout
  await expect(statusField).toHaveText("Active", { timeout: 30_000 });
  // No textContent() needed — toHaveText is both the wait AND the assertion.
});

// ✅ REUSABLE D365-STYLE HELPER
async function waitForD365Load(
  page: Page,
  expectedTitle?: string,
): Promise<void> {
  await expect(page.locator(".ms-Spinner")).toHaveCount(0, {
    timeout: 45_000,
  });
  if (expectedTitle) {
    const titleArea = page
      .locator(".ms-CommandBar, .ms-PageHeader, h1[title]")
      .first();
    await expect(titleArea).toContainText(expectedTitle, {
      timeout: 30_000,
    });
  }
}

test("verify customer status — with D365 helper", async ({ page }) => {
  await page.goto("https://crm.example.com/customers/C-001");
  await waitForD365Load(page, "Expected Customer Name");
  await expect(page.locator('[data-automation-key="statecode"]')).toHaveText(
    "Active",
    { timeout: 30_000 },
  );
});

// WHY
// Playwright's expect() auto-retries assertions for you.  Every toHaveText /
// toBeVisible / toHaveCount call polls the DOM on a tight interval until the
// assertion passes OR the timeout expires.  This is always more reliable than
// a fixed sleep, because:
//   • Fast environments finish in milliseconds instead of sleeping the full N s.
//   • Slow environments are automatically accommodated up to the full timeout.
//   • Failures surface the REAL element state in the error message.
//
// textContent() is a "snapshot" call — use it only when you need the raw string
// for further logic.  For assertions, always prefer toHaveText / toContainText.
