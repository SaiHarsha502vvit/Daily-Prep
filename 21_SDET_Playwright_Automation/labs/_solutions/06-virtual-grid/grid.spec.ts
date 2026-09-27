// REFERENCE SOLUTION — Lab 06. Open only after catching every bug.
import { test, expect, type Page } from '@playwright/test';

const ROW_HEIGHT = 32;   // measured in DevTools during Explore -- every row is the same height

const grid = (page: Page) => page.getByRole('grid', { name: 'Citations' });
const row = (page: Page, id: string) => grid(page).getByRole('row', { name: id });

/** Put row `index` (0-based) at the top of the viewport. Jumping beats scrolling step by step (Ch64 §6). */
async function jumpToRow(page: Page, index: number) {
  await grid(page).evaluate((el, top) => { el.scrollTop = top; }, index * ROW_HEIGHT);
}
async function jumpToEnd(page: Page) {
  await grid(page).evaluate((el) => { el.scrollTop = el.scrollHeight; });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Showing 10,000 citations');
});

test('R1: the grid exposes its true size and every row its true position', async ({ page }) => {
  await expect(grid(page)).toHaveAttribute('aria-rowcount', '10000');
  await expect(row(page, 'CIT-00001')).toHaveAttribute('aria-rowindex', '1');
  await jumpToRow(page, 4999);
  await expect(row(page, 'CIT-05000')).toHaveAttribute('aria-rowindex', '5000');   // deep, not just the first screen
});

test('R2: the last citation is reachable', async ({ page }) => {
  await jumpToEnd(page);
  await expect(row(page, 'CIT-10000')).toBeVisible();
  await expect(row(page, 'CIT-10000')).toHaveAttribute('aria-rowindex', '10000');
});

test('R3: a deep row shows its own data', async ({ page }) => {
  await jumpToRow(page, 7341);
  await expect(row(page, 'CIT-07342').getByRole('gridcell')).toHaveText(['CIT-07342', 'DISPUTED', '£74.46']);
});

test('R4: filtering by status finds every match, not just the loaded ones', async ({ page, request }) => {
  const { byStatus } = await (await request.get('/api/citations/summary')).json();   // the oracle
  const expected: number = byStatus.DISPUTED;

  await page.getByLabel('Status').selectOption('DISPUTED');
  await expect(page.getByRole('status')).toHaveText(`Showing ${expected.toLocaleString('en-GB')} citations`);
  await expect(grid(page)).toHaveAttribute('aria-rowcount', String(expected));

  const rows = grid(page).getByRole('row');
  await expect(rows.first()).toContainText('DISPUTED');                     // not vacuous: rows exist...
  await expect(rows.filter({ hasNotText: 'DISPUTED' })).toHaveCount(0);    // ...and none of them is anything else

  await jumpToEnd(page);                                                    // the last match is really there
  await expect(row(page, 'CIT-09998')).toHaveAttribute('aria-rowindex', String(expected));
});
