/**
 * QUIZ 02 — Challenge 10 [MEDIUM]: Write the Correct New Tab Handler
 *
 * REQUIREMENT:
 *   Write a reusable helper openInNewTab(page, triggerLocator) that:
 *   - Uses Promise.all correctly
 *   - Waits for 'domcontentloaded' on the new tab
 *   - Returns the new tab's Page object
 */

import { test, expect, type Page, type Locator } from '@playwright/test';

// ============================================================
// ✅ SOLUTION — openInNewTab helper
// ============================================================

/**
 * Click a trigger that opens a new browser tab and return the new tab's Page.
 *
 * Uses Promise.all so the context 'page' listener is registered BEFORE
 * the click fires (avoids the race condition from Challenge 2).
 */
async function openInNewTab(page: Page, triggerLocator: Locator): Promise<Page> {
  const [newTab] = await Promise.all([
    page.context().waitForEvent('page'), // 1 — register listener FIRST
    triggerLocator.click(),              // 2 — trigger click SECOND
  ]);

  await newTab.waitForLoadState('domcontentloaded');
  return newTab;
}

// ============================================================
// Usage examples
// ============================================================

test('view order detail in new tab', async ({ page }) => {
  // Setup: navigate to orders list
  await page.goto('https://example.com/orders');

  // Open the new tab via the reusable helper
  const orderTab = await openInNewTab(page, page.locator('#viewOrderBtn'));

  // Assertions on the new tab
  await expect(orderTab.locator('.order-id')).toHaveText('ORD-001');
  await expect(orderTab.locator('.order-status')).toBeVisible();

  // Clean up (optional — Playwright closes all contexts on test end anyway)
  await orderTab.close();
});

test('open download PDF link in new tab', async ({ page }) => {
  await page.goto('https://example.com/invoices');

  // Trigger locator can be any Locator — not just buttons
  const pdfTab = await openInNewTab(page, page.locator('a[href$=".pdf"]').first());

  // Wait for PDF viewer or content
  await pdfTab.waitForLoadState('load');
  await expect(pdfTab).toHaveURL(/\.pdf/);

  await pdfTab.close();
});

// ============================================================
// EXTENDED VERSION — with optional waitForSelector guard
// ============================================================

/**
 * Extended version: accepts an optional selector to wait for in the new tab
 * before returning.  Useful when domcontentloaded is too early (SPAs).
 */
async function openInNewTabAndWait(
  page: Page,
  triggerLocator: Locator,
  waitForSelector?: string,
): Promise<Page> {
  const [newTab] = await Promise.all([
    page.context().waitForEvent('page'),
    triggerLocator.click(),
  ]);

  await newTab.waitForLoadState('domcontentloaded');

  if (waitForSelector) {
    await newTab.locator(waitForSelector).waitFor({
      state: 'visible',
      timeout: 30_000,
    });
  }

  return newTab;
}

test('open order with SPA content guard', async ({ page }) => {
  await page.goto('https://example.com/orders');

  const orderTab = await openInNewTabAndWait(
    page,
    page.locator('#viewOrderBtn'),
    '.order-details-loaded', // wait for SPA to finish rendering
  );

  await expect(orderTab.locator('.order-id')).toHaveText('ORD-001');
  await orderTab.close();
});

export { openInNewTab, openInNewTabAndWait };

// WHY
// The key constraint is ordering: the event listener MUST be registered before
// the action that triggers the event.
//
// Promise.all starts all items in its array synchronously in order:
//   1. context.waitForEvent('page') — registers the listener (sync) and
//      returns a pending Promise.
//   2. triggerLocator.click() — starts the click sequence.
//
// Because step 1 is synchronous and step 2 requires at least one async I/O
// round-trip (click → browser → response), the listener is always in place
// before the tab can open.
//
// Destructure the result as const [newTab] because waitForEvent returns the
// event object (the new Page), and we only care about the first item.
