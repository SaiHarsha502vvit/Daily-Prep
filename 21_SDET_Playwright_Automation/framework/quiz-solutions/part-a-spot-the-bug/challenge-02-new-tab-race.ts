// challenge-02-new-tab-race.ts

/**
 * Quiz 02 — Challenge 2: New Tab Race Condition
 * Curriculum: Ch07 — Browser Context & Tabs
 * Difficulty: MEDIUM
 *
 * Problem: Attaching the 'popup' event listener AFTER the click that triggers it.
 *          The popup may open faster than the listener is registered, causing a hung promise.
 * Solution: Attach the listener BEFORE the click using Promise.race with a timeout,
 *           or simply start waiting before the action.
 */

import { test, expect, type Page } from '@playwright/test';

/* ───────────────────────────────────────────────────────────────────────────
   ❌ BROKEN VERSION — listener attached after click
   ─────────────────────────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function brokenNewTab(page: Page): Promise<Page> {
  const openButton = page.getByRole('button', { name: 'Open in new tab' });

  // TRAP: If the popup opens before waitForEvent starts, the promise never resolves.
  await openButton.click();
  const popup = await page.waitForEvent('popup'); // 🐛 Race condition!
  return popup;
}

/* ───────────────────────────────────────────────────────────────────────────
   ✅ FIXED VERSION — start listener BEFORE the click
   ─────────────────────────────────────────────────────────────────────────── */
test('quiz-02-ch02: race-free new tab handling', async ({ page, context }) => {
  await page.goto('https://demoqa.com/links');

  // FIXED: Start waiting for the popup event BEFORE triggering it.
  // page.waitForEvent('popup') returns a Promise that resolves when the event fires.
  const popupPromise = page.waitForEvent('popup');

  await page.getByRole('link', { name: 'Home' }).click();

  const popup = await popupPromise;
  await popup.waitForLoadState('networkidle');

  // Verify the new tab is functional
  await expect(popup).toHaveURL(/demoqa\.com/);

  // Clean up
  await popup.close();

  // Sanity: original page still active
  await expect(page.locator('body')).toBeVisible();
});

/* ───────────────────────────────────────────────────────────────────────────
   ✅ BULLETPROOF VERSION — with timeout race guard
   ─────────────────────────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function robustNewTab(page: Page): Promise<Page> {
  const popupPromise = page.waitForEvent('popup', { timeout: 10_000 });
  await page.getByRole('link', { name: 'Open new tab' }).click();
  return popupPromise;
}

/**
 * WHY IT MATTERS:
 * Playwright events are buffered for a short window, but relying on that is fragile.
 * In CI with slower machines, the gap between click() and waitForEvent() can be
 * long enough to miss the event entirely. Always wait first, act second.
 */
