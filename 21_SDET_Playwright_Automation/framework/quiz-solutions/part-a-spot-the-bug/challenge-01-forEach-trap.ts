// challenge-01-forEach-trap.ts

/**
 * Quiz 02 — Challenge 1: The forEach Async Trap
 * Curriculum: Ch04 — JS & TS for Automation
 * Difficulty: MEDIUM
 *
 * Problem: Array.prototype.forEach does NOT await async callbacks.
 *          It fires all callbacks synchronously and ignores returned Promises.
 * Solution: Use for...of for sequential execution, or Promise.all + map for parallel.
 */

import { test, expect, type Page } from '@playwright/test';

/* ───────────────────────────────────────────────────────────────────────────
   ❌ BROKEN VERSION — demonstrates the trap
   ─────────────────────────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function brokenLoop(page: Page): Promise<void> {
  const menuItems = ['Home', 'Admin', 'PIM', 'Leave', 'Time'];

  // TRAP: forEach does not await the async arrow function.
  // All five clicks start simultaneously, and the function returns immediately.
  // Result: race conditions, flaky navigation assertions, possible timeouts.
  menuItems.forEach(async (item) => {
    await page.getByRole('link', { name: item }).click();
    await expect(page).toHaveURL(/.*\/(dashboard|admin|pim|leave|time)/);
  });
  // Execution reaches here BEFORE any click finishes!
}

/* ───────────────────────────────────────────────────────────────────────────
   ✅ FIXED VERSION — sequential for...of loop
   ─────────────────────────────────────────────────────────────────────────── */
test('quiz-02-ch01: click menu items sequentially with for...of', async ({ page }) => {
  await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');

  const menuItems = ['Admin', 'PIM', 'Leave', 'Time'];

  // FIXED: for...of awaits each iteration before starting the next.
  // This is deterministic, readable, and safe for navigation flows.
  for (const item of menuItems) {
    await page.getByRole('link', { name: item, exact: true }).first().click();
    await expect(page.getByRole('heading', { name: item })).toBeVisible();
  }
});

/* ───────────────────────────────────────────────────────────────────────────
   ✅ ALTERNATIVE — parallel execution with Promise.all + map (when safe)
   ─────────────────────────────────────────────────────────────────────────── */
test('quiz-02-ch01-alt: parallel Promise.all + map for non-interacting ops', async ({ page }) => {
  await page.goto('https://demoqa.com/links');

  const links = page.locator('a');
  const count = await links.count();

  // FIXED: When operations are independent (e.g., collecting attributes),
  // Promise.all + map is correct AND fast.
  const hrefs: (string | null)[] = await Promise.all(
    Array.from({ length: count }, async (_, i) => {
      return links.nth(i).getAttribute('href');
    }),
  );

  expect(hrefs.length).toBeGreaterThan(0);
});
