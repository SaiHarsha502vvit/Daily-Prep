/**
 * QUIZ 02 — Challenge 2 [HARD]: The New Tab Race Condition
 *
 * ORIGINAL BUGGY CODE:
 *   const newTab = await context.waitForEvent('page');   // registered AFTER
 *   await page.locator('#viewOrderBtn').click();          // click fires first
 *
 * QUESTION: Find the bug. What happens in real execution?
 */

import { test, expect } from '@playwright/test';

// ❌ BUGGY — waitForEvent is registered AFTER the click.
// If the browser opens the new tab before waitForEvent attaches the listener
// (common in fast local envs), the 'page' event fires and is missed.
// The await then hangs until the default timeout and the test fails with
// "waitForEvent('page') exceeded timeout".
test('view order in new tab — BUGGY', async ({ page, context }) => {
  // The click happens first ...
  await page.locator('#viewOrderBtn').click(); // tab may already be open here
  // ... then we try to listen — but the event already fired.
  const newTab = await context.waitForEvent('page');

  await newTab.waitForLoadState('domcontentloaded');
  await expect(newTab.locator('.order-id')).toHaveText('ORD-001');
});

// ✅ FIX — wrap in Promise.all so the listener is registered BEFORE the click.
// Promise.all starts both promises simultaneously in the same microtask queue
// flush, but because waitForEvent attaches synchronously before click() fires
// its first microtask, the listener is always in place when the tab opens.
test('view order in new tab — FIXED', async ({ page, context }) => {
  const [newTab] = await Promise.all([
    context.waitForEvent('page'), // 1 — register listener FIRST (synchronous registration)
    page.locator('#viewOrderBtn').click(), // 2 — trigger SECOND
  ]);

  await newTab.waitForLoadState('domcontentloaded');
  await expect(newTab.locator('.order-id')).toHaveText('ORD-001');
});

// ✅ REUSABLE HELPER — same pattern extracted for shared use across tests.
import { type Locator, type Page } from '@playwright/test';

async function openInNewTab(triggerLocator: Locator): Promise<Page> {
  const parentPage = triggerLocator.page();
  const [newTab] = await Promise.all([
    parentPage.context().waitForEvent('page'),
    triggerLocator.click(),
  ]);
  await newTab.waitForLoadState('domcontentloaded');
  return newTab;
}

test('view order in new tab — with helper', async ({ page }) => {
  const orderTab = await openInNewTab(page.locator('#viewOrderBtn'));
  await expect(orderTab.locator('.order-id')).toHaveText('ORD-001');
  await orderTab.close();
});

// WHY
// Event listeners in Node.js (and Playwright's event system) are synchronous —
// they register immediately when you call waitForEvent().  The trick is that
// Promise.all() starts BOTH promises in the same synchronous evaluation pass.
// Node processes the first item first: `context.waitForEvent('page')` registers
// the listener synchronously, THEN returns a pending Promise.  Only after that
// does `click()` begin executing and potentially open a new tab.
//
// The golden rule: "register before trigger" — any time you expect an event
// caused by an action (popup, download, dialog, filechooser), the listener
// must be registered in the same Promise.all before the triggering action.
