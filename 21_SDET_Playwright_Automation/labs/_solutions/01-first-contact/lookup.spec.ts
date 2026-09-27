// REFERENCE SOLUTION — Lab 01. Open only after the grader says you caught every bug.
// It's one good answer, not the only one. Compare the reasoning, not the syntax.
import { test, expect, type Page } from '@playwright/test';

// Small helper: the one action every test repeats. Keeps tests about behaviour.
async function search(page: Page, id: string) {
  await page.getByLabel('Citation ID').fill(id);
  await page.getByRole('button', { name: 'Search' }).click();
}

const result = (page: Page) => page.getByRole('region', { name: 'Result' });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// R1 — exact values, and more than one row of data: £50.00 alone could never reveal a
// formatting bug that only drops a trailing zero (£125.5).
for (const [id, status, amount] of [
  ['CIT-001', 'PAID', '£50.00'],
  ['CIT-002', 'PENDING', '£125.50'],
  ['CIT-003', 'DISPUTED', '£9.99'],
] as const) {
  test(`R1: ${id} shows ${status} and ${amount}`, async ({ page }) => {
    await search(page, id);
    // Web-first assertions retry until the slow backend answers — no sleeps needed.
    await expect(result(page).getByText('Status:')).toHaveText(`Status: ${status}`);
    await expect(result(page).getByText('Amount:')).toHaveText(`Amount: ${amount}`);
  });
}

test('R2: IDs are case-insensitive', async ({ page }) => {
  await search(page, 'cit-002');
  await expect(result(page).getByText('Status:')).toHaveText('Status: PENDING');
  await expect(page.getByRole('alert')).toBeEmpty();
});

test('R3: empty search asks for an ID', async ({ page }) => {
  await search(page, '');
  await expect(page.getByRole('alert')).toHaveText('Enter a citation ID');
  await expect(result(page)).toBeHidden();
});

test('R4: unknown ID says no citation found', async ({ page }) => {
  await search(page, 'CIT-999');
  await expect(page.getByRole('alert')).toHaveText('No citation found');
  await expect(result(page)).toBeHidden();
});

test('R5: a successful search clears the previous error', async ({ page }) => {
  await search(page, 'CIT-999');
  await expect(page.getByRole('alert')).toHaveText('No citation found');
  await search(page, 'CIT-001');
  await expect(result(page).getByText('Status:')).toHaveText('Status: PAID');
  await expect(page.getByRole('alert')).toBeEmpty();   // assert what should be GONE
});
