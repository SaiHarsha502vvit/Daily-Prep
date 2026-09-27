/**
 * QUIZ 02 — Challenge 11 [MEDIUM]: Write the D365 Spinner Wait
 *
 * REQUIREMENT:
 *   Write waitForD365Load(page, expectedTitle?) that:
 *   1. Waits for all .ms-Spinner elements to disappear
 *   2. If expectedTitle is provided, waits for the page title area to
 *      contain that text
 *   3. Uses timeouts: 45 s for spinners, 30 s for title
 */

import { test, expect, type Page } from "@playwright/test";

// ============================================================
// ✅ SOLUTION
// ============================================================

/**
 * Wait for a D365/Fluent-UI page to fully load.
 *
 * @param page          - The Playwright Page object.
 * @param expectedTitle - Optional: text that must appear in the page header
 *                        before the function resolves.  Use this to guard
 *                        against stale-render (seeing data from the previous
 *                        record during navigation).
 */
async function waitForD365Load(
  page: Page,
  expectedTitle?: string,
): Promise<void> {
  // Step 1 — Wait for all spinners to disappear.
  // toHaveCount(0) retries until count is 0 or the timeout expires.
  await expect(page.locator(".ms-Spinner")).toHaveCount(0, {
    timeout: 45_000,
  });

  // Step 2 — If an expected title is given, verify the header area contains it.
  // This guards against stale-render: D365 sometimes shows the previous
  // record's data while fetching the new one.
  if (expectedTitle) {
    const titleArea = page
      .locator(".ms-CommandBar, .ms-PageHeader, h1[title]")
      .first();
    await expect(titleArea).toContainText(expectedTitle, {
      timeout: 30_000,
    });
  }
}

// ============================================================
// Usage examples
// ============================================================

test("navigate to customer and check status", async ({ page }) => {
  await page.goto("https://crm.example.com/customers/C-001");

  // Basic wait — just spinners
  await waitForD365Load(page);

  const status = page.locator('[data-automation-key="statecode"]');
  await expect(status).toHaveText("Active", { timeout: 30_000 });
});

test("navigate to customer with title guard", async ({ page }) => {
  await page.goto("https://crm.example.com/customers/C-001");

  // Full wait — spinners AND confirm we see the right customer name
  await waitForD365Load(page, "Harsha Alasai");

  const status = page.locator('[data-automation-key="statecode"]');
  await expect(status).toHaveText("Active", { timeout: 30_000 });
});

// ============================================================
// EXTENDED — IFrame-aware D365 load wait
// ============================================================
// Some D365 pages render content inside an IFrame (e.g. model-driven forms).
// In that case the .ms-Spinner elements live inside the frame, not in the
// top-level DOM.

import { type FrameLocator } from "@playwright/test";

async function waitForD365FormLoad(
  frameOrPage: Page | FrameLocator,
  expectedTitle?: string,
): Promise<void> {
  // Works with both Page and FrameLocator — both expose .locator()
  const loc = (selector: string) => frameOrPage.locator(selector);

  await expect(loc(".ms-Spinner")).toHaveCount(0, { timeout: 45_000 });

  if (expectedTitle) {
    const titleArea = loc(".ms-CommandBar, .ms-PageHeader, h1[title]").first();
    await expect(titleArea).toContainText(expectedTitle, { timeout: 30_000 });
  }
}

test("D365 form inside IFrame", async ({ page }) => {
  await page.goto("https://crm.example.com/entity/account/C-001");

  // The form is inside the main IFrame
  const formFrame: FrameLocator = page.frameLocator(
    'iframe[name="main-iframe"]',
  );

  await waitForD365FormLoad(formFrame, "Contoso Ltd");

  const ownerField = formFrame.locator('[data-automation-key="ownerid"]');
  await expect(ownerField).not.toBeEmpty();
});

export { waitForD365Load, waitForD365FormLoad };

// WHY
// D365 (and other Fluent-UI apps) use client-side rendering with OData API
// calls.  After navigating to a record URL:
//
//   1. The page shell loads (fast) — but data fields may still be blank.
//   2. OData fetch fires asynchronously.
//   3. Spinners appear while the fetch is in-flight.
//   4. Spinners disappear AFTER the data is rendered.
//
// Waiting for spinners to reach count 0 is the most reliable signal that the
// page has finished rendering.  The optional expectedTitle guard catches the
// "stale render" case — where D365 briefly shows the previous record's data
// during navigation before the new record arrives.
//
// toHaveCount(0) auto-retries unlike count() which is a point-in-time snapshot.
// Always use assertion-based waits (toHaveCount, toBeVisible, toHaveText) over
// snapshot reads (count(), isVisible(), textContent()).
