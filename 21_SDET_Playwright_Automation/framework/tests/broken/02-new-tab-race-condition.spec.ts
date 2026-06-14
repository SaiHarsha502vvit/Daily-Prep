import { test, expect } from '@playwright/test';

/**
 * BROKEN TEST — Anti-Pattern: waitForEvent('page') AFTER click
 * Curriculum Reference: Ch04 — Event Handling, Ch06 — Browser Contexts
 * Why it fails: The 'popup' / 'page' event may fire before the listener is
 * attached if the click navigates quickly. Playwright then times out waiting
 * for an event that already happened, producing an intermittent hang.
 */
test('broken: open new tab with waitForEvent after click', async ({ page, context }) => {
  // Navigate to ReqRes and inject a link that opens in a new tab
  await page.goto('https://reqres.in/');
  await page.evaluate(() => {
    const a = document.createElement('a');
    a.id = 'open-new-tab';
    a.href = 'https://reqres.in/api/users?page=2';
    a.target = '_blank';
    a.textContent = 'Open API in new tab';
    document.body.appendChild(a);
  });

  const link = page.locator('#open-new-tab');

  // BUG: `click()` resolves *after* the navigation completes. If the new page
  // opens fast enough, `waitForEvent('page')` misses it entirely.
  await link.click();
  const newPage = await context.waitForEvent('page', { timeout: 5000 });

  await expect(newPage).toBeDefined();
});

/**
 * FIXED VERSION
 * Fix: Race the `waitForEvent` and `click` inside `Promise.all` so the
 * listener is registered *before* the click is dispatched.
 */
test('fixed: open new tab with Promise.all', async ({ page, context }) => {
  await page.goto('https://reqres.in/');
  await page.evaluate(() => {
    const a = document.createElement('a');
    a.id = 'open-new-tab-fixed';
    a.href = 'https://reqres.in/api/users?page=2';
    a.target = '_blank';
    a.textContent = 'Open API in new tab';
    document.body.appendChild(a);
  });

  const link = page.locator('#open-new-tab-fixed');

  const [newPage] = await Promise.all([context.waitForEvent('page'), link.click()]);

  await expect(newPage).toBeDefined();
  await expect(newPage).toHaveURL(/api\/users/);
});
