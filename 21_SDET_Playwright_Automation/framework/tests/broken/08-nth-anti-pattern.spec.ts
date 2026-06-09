import { test, expect } from '@playwright/test';
import { endpoints } from '../../constants/endpoints';

/**
 * BROKEN TEST — Anti-Pattern: Looping with `.nth(i)` to find a grid row
 * Curriculum Reference: Ch06 — Locator Strategies, Ch04 — Iteration
 * Why it fails: `.nth()` resolves to a specific DOM index. If the table
 * re-sorts, paginates, or lazy-loads between `count()` and the click,
 * the index may point to a different row, or the row may have been
 * removed, causing a stale-element or wrong-element click.
 */
test('broken: loop nth() to find employee row', async ({ page }) => {
  // Log in and navigate to PIM employee list
  await page.goto(endpoints.orangehrm.LOGIN);
  await page.locator("input[name='username']").fill('Admin');
  await page.locator("input[name='password']").fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/dashboard/);

  // Navigate to PIM > Employee List
  await page.getByText('PIM', { exact: false }).first().click();
  await page.waitForURL(/pim\/viewEmployeeList/);

  // BUG: We grab the row count once, then iterate by index. If the grid
  // re-renders (e.g., due to a background data refresh), `nth(i)` may
  // resolve to a completely different employee row.
  const rows = page.locator('.oxd-table-row');
  const count = await rows.count();
  let found = false;

  for (let i = 0; i < count; i++) {
    const cellText = await rows.nth(i).textContent();
    if (cellText && cellText.includes('Charlie')) {
      await rows.nth(i).click();
      found = true;
      break;
    }
  }

  // Flaky: may be false because the row moved, or because `nth(i)` clicked
  // the wrong row whose text did NOT include 'Charlie'.
  expect(found).toBe(true);
});

/**
 * FIXED VERSION
 * Fix: Use Playwright's built-in `.filter({ hasText: ... })` which creates
 * a dynamic, re-evaluating locator. Even if the table re-renders, the
 * filtered locator will always resolve to the *first* row containing the
 * target text.
 */
test('fixed: use filter with hasText for employee row', async ({ page }) => {
  await page.goto(endpoints.orangehrm.LOGIN);
  await page.locator("input[name='username']").fill('Admin');
  await page.locator("input[name='password']").fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/dashboard/);

  await page.getByText('PIM', { exact: false }).first().click();
  await page.waitForURL(/pim\/viewEmployeeList/);

  // FIXED: One-shot locator that finds the row by content, not index.
  const charlieRow = page
    .locator('.oxd-table-row')
    .filter({ hasText: 'Charlie' })
    .first();

  // This is stable even if the table re-sorts or lazy-loads additional rows.
  await expect(charlieRow).toBeVisible();
  await charlieRow.click();
});
