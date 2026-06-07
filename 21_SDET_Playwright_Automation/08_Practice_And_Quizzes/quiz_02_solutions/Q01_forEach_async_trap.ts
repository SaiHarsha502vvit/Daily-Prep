/**
 * QUIZ 02 — Challenge 1 [MEDIUM]: The forEach Async Trap
 *
 * ORIGINAL BUGGY CODE:
 *   menuItems.forEach(async (item) => {
 *     await page.getByRole('menuitem', { name: item }).click();
 *     await expect(page).toHaveURL(new RegExp(item.toLowerCase()));
 *     await page.goBack();
 *   });
 *
 * QUESTION: What is wrong? What will actually happen at runtime?
 */

import { test, expect } from '@playwright/test';

// ❌ BUGGY — forEach ignores the Promise returned by each async callback.
// All 4 iterations fire immediately; the test body finishes synchronously
// before any click has actually resolved.  The assertions may never run.
test('click all menu items — BUGGY', async ({ page }) => {
  const menuItems = ['Home', 'Orders', 'Reports', 'Settings'];

  menuItems.forEach(async (item) => {
    await page.getByRole('menuitem', { name: item }).click();
    await expect(page).toHaveURL(new RegExp(item.toLowerCase()));
    await page.goBack();
  }); // <-- forEach returns void; every Promise is dropped on the floor

  console.log('Done'); // runs IMMEDIATELY — before any click resolves
});

// ✅ FIX OPTION 1 — for...of (sequential, correct for same-page navigation)
test('click all menu items — FIXED with for...of', async ({ page }) => {
  const menuItems = ['Home', 'Orders', 'Reports', 'Settings'];

  for (const item of menuItems) {
    await page.getByRole('menuitem', { name: item }).click();
    await expect(page).toHaveURL(new RegExp(item.toLowerCase()));
    await page.goBack();
  }

  console.log('Done'); // runs AFTER all iterations have awaited
});

// ✅ FIX OPTION 2 — Promise.all (parallel) — only safe when operations
//   target DIFFERENT pages/contexts and do not share navigation state.
//   Do NOT use Promise.all for sequential same-page navigation.
test('parallel operations on independent contexts — FIXED with Promise.all', async ({
  browser,
}) => {
  const menuItems = ['Home', 'Orders', 'Reports', 'Settings'];

  await Promise.all(
    menuItems.map(async (item) => {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(`https://example.com/${item.toLowerCase()}`);
      await expect(page).toHaveURL(new RegExp(item.toLowerCase()));
      await ctx.close();
    }),
  );
});

// WHY
// forEach is a synchronous method designed for side-effectful loops.  When you
// pass an async callback it still returns nothing — each async call produces a
// Promise that forEach silently discards.  The result is that:
//   1. All iterations START in the same event-loop tick (no sequential await).
//   2. The test function itself resolves before any iteration COMPLETES.
//   3. Playwright tears down the browser context immediately, causing
//      "Target crashed" / "context destroyed" errors — or, in a best case,
//      a passing test that never actually ran the assertions.
//
// Rule: whenever you need to await inside a loop, use:
//   • for...of   — sequential, simplest, always safe
//   • Promise.all — parallel, only when operations are truly independent
//   • Never forEach/map with async unless you manually await Promise.all(arr.map(...))
