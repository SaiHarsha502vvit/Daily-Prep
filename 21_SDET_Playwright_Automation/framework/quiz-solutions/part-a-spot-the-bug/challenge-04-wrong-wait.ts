// challenge-04-wrong-wait.ts

/**
 * Quiz 02 — Challenge 4: Wrong Wait Strategy (waitForTimeout)
 * Curriculum: Ch06 — Waits & Synchronization
 * Difficulty: MEDIUM
 *
 * Problem: Using page.waitForTimeout(ms) creates brittle, slow tests that either
 *          sleep too long (waste CI time) or not long enough (flaky on slow machines).
 * Solution: Wait for the actual condition — visibility, network idle, element state.
 */

import { test, expect, type Page } from '@playwright/test';

/* ───────────────────────────────────────────────────────────────────────────
   ❌ BROKEN VERSION — arbitrary sleep
   ─────────────────────────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function brokenWait(_page: Page): Promise<void> {
  // TRAP: Hard-coded sleep. On fast machines it wastes 3s. On slow machines
  // the element may still not be ready, causing a flaky failure on the next line.
  // The test author guessed "3 seconds should be enough" — a classic anti-pattern.
}

test.describe('broken wait examples (commented)', () => {
  test('do not use waitForTimeout for synchronization @antiPattern', async ({ page }) => {
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');

    // ❌ WRONG: Blind sleep
    await page.waitForTimeout(3_000);
    await page.locator("input[name='username']").fill('Admin');

    // ❌ WRONG: Another blind sleep after an action
    await page.locator("button[type='submit']").click();
    await page.waitForTimeout(5_000); // 🐛 Might be too short on CI, too long locally.
    await expect(page.locator('.oxd-alert')).toBeVisible();
  });
});

/* ───────────────────────────────────────────────────────────────────────────
   ✅ FIXED VERSION — wait for the actual DOM condition
   ─────────────────────────────────────────────────────────────────────────── */
test('quiz-02-ch04: wait for element visibility', async ({ page }) => {
  await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');

  // FIXED: Wait for the INPUT to be actionable, then interact immediately.
  const usernameInput = page.locator("input[name='username']");
  await usernameInput.waitFor({ state: 'visible', timeout: 10_000 });
  await usernameInput.fill('Admin');
});

test('quiz-02-ch04: wait for navigation + network idle', async ({ page }) => {
  await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');

  const usernameInput = page.locator("input[name='username']");
  const passwordInput = page.locator("input[name='password']");
  const submitBtn = page.locator("button[type='submit']");

  await usernameInput.fill('Admin');
  await passwordInput.fill('admin123');

  // FIXED: Wait for navigation to complete AND network to be idle.
  // This means the page has fully loaded, not just that N milliseconds passed.
  await Promise.all([page.waitForURL(/dashboard/), submitBtn.click()]);
  await page.waitForLoadState('networkidle');

  await expect(page.locator('h6')).toContainText('Dashboard');
});

test('quiz-02-ch04: wait for API response instead of sleep', async ({ page }) => {
  await page.goto('https://reqres.in/');

  // FIXED: Intercept the API call and wait for its response.
  // The test proceeds the instant the data is ready — no wasted time.
  const responsePromise = page.waitForResponse('**/api/users?page=1');

  await page.getByRole('button', { name: 'List users' }).click();

  const response = await responsePromise;
  expect(response.status()).toBe(200);

  const body = (await response.json()) as { page: number };
  expect(body.page).toBe(1);
});

/**
 * DECISION TREE FOR WAITS:
 * 1. Is the element already in the DOM but hidden? → locator.waitFor({ state: 'visible' })
 * 2. Is the element dynamically injected?          → locator.waitFor({ state: 'attached' })
 * 3. Did an action trigger navigation?              → Promise.all([page.waitForURL(...), action])
 * 4. Does the page load data via XHR/fetch?         → page.waitForResponse(url)
 * 5. Is there a spinner/loading overlay?            → locator.waitFor({ state: 'detached' })
 * 6. None of the above apply?                       → page.waitForLoadState('networkidle')
 * 7. STILL stuck?                                   → Only then consider a short waitForTimeout
 *                                                     as a last resort with a generous comment.
 */
