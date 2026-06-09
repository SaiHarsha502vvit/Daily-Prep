import { test, expect } from '@playwright/test';
import { endpoints } from '../../constants/endpoints';

/**
 * BROKEN TEST — Anti-Pattern: forEach + async
 * Curriculum Reference: Ch04 — Control Flow, Ch07 — Async Pitfalls
 * Why it fails: Array.prototype.forEach does NOT await async callbacks.
 * The test function returns before any click completes, so assertions run
 * against stale state. In parallel mode this can also create overlapping
 * navigation races between workers.
 */
test('broken: click menu items with forEach', async ({ page }) => {
  await page.goto(endpoints.orangehrm.LOGIN);
  await page.locator("input[name='username']").fill('Admin');
  await page.locator("input[name='password']").fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.locator('h6.oxd-text--h6')).toHaveText('Dashboard');

  const menuItems = ['Admin', 'PIM', 'Leave', 'Time', 'Recruitment'];

  // BUG: forEach iterates synchronously; the async arrow functions are
  // scheduled but not awaited. The test ends while clicks are still pending.
  menuItems.forEach(async (label) => {
    await page.getByText(label, { exact: false }).first().click();
  });

  // This assertion almost always runs before the last click finishes,
  // producing flaky failures depending on event-loop timing.
  await expect(page.getByText('Dashboard', { exact: false }).first()).toBeVisible();
});

/**
 * FIXED VERSION
 * Fix: Use a `for...of` loop so each `await` actually blocks the test
 * until the navigation / click settles. For parallel execution, use
 * `Promise.all(menuItems.map(...))` instead.
 */
test('fixed: click menu items sequentially', async ({ page }) => {
  await page.goto(endpoints.orangehrm.LOGIN);
  await page.locator("input[name='username']").fill('Admin');
  await page.locator("input[name='password']").fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.locator('h6.oxd-text--h6')).toHaveText('Dashboard');

  const menuItems = ['Admin', 'PIM', 'Leave', 'Time', 'Recruitment'];

  for (const label of menuItems) {
    await page.getByText(label, { exact: false }).first().click();
    // Optional: wait for any spinner or transition to settle
    await expect(page.locator('.oxd-topbar-header-breadcrumb')).toBeVisible();
  }

  await expect(page.getByText('Dashboard', { exact: false }).first()).toBeVisible();
});
