// REFERENCE SOLUTION — Lab 02. Open only after catching every bug.
import { test, expect, type Page } from '@playwright/test';

const isTracking = (url: string) => /\/(analytics\.js|collect)$/.test(new URL(url).pathname);

/** Start recording tracking requests. Call BEFORE the first navigation. */
function recordTracking(page: Page): string[] {
  const seen: string[] = [];
  page.on('request', (r) => { if (isTracking(r.url())) seen.push(r.url()); });
  return seen;
}

const banner = (page: Page) => page.getByRole('dialog', { name: 'Cookie consent' });

test.describe('consent behaviour (the banner is the feature under test)', () => {
  test('R1: first visit shows the consent dialog with both choices', async ({ page }) => {
    await page.goto('/');
    await expect(banner(page)).toBeVisible();
    await expect(banner(page).getByRole('button', { name: 'Accept all' })).toBeVisible();
    await expect(banner(page).getByRole('button', { name: 'Reject all' })).toBeVisible();
  });

  test('R2: nothing is tracked before the visitor chooses', async ({ page }) => {
    const tracking = recordTracking(page);
    await page.goto('/');
    // Wait until the page has demonstrably had its chance: banner up, products loaded.
    await expect(banner(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add to cart' })).toBeEnabled();
    expect(tracking, 'tracking fired before any choice').toEqual([]);
  });

  test('R3: Reject is honoured now and after reload, and the dialog stays gone', async ({ page }) => {
    const tracking = recordTracking(page);
    await page.goto('/');
    await banner(page).getByRole('button', { name: 'Reject all' }).click();
    await expect(banner(page)).toBeHidden();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Add to cart' })).toBeEnabled();
    // The banner would appear within 900 ms if the choice had been forgotten.
    // expect.poll keeps it hidden-checking for the whole window instead of checking once.
    await expect.poll(async () => banner(page).count(), { timeout: 1500, intervals: [100] }).toBe(0);
    await page.waitForLoadState('networkidle');
    expect(tracking, 'tracking fired after Reject').toEqual([]);
  });

  test('R4: Accept starts tracking and is remembered', async ({ page }) => {
    const tracking = recordTracking(page);
    await page.goto('/');
    await banner(page).getByRole('button', { name: 'Accept all' }).click();
    await expect.poll(() => tracking.some((u) => u.includes('/collect'))).toBe(true);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Add to cart' })).toBeEnabled();
    await expect.poll(async () => banner(page).count(), { timeout: 1500, intervals: [100] }).toBe(0);
  });
});

test.describe('shopping (the banner is just in the way)', () => {
  test('R5: a visitor can add to cart whatever the banner does', async ({ page }) => {
    // Let the banner appear whenever it likes, and dismiss it the moment it blocks us.
    // (Pre-setting the consent cookie would also make this pass -- and would hide any
    //  bug that only happens when the banner is present. That's R5's whole point.)
    await page.addLocatorHandler(banner(page), async (dialog) => {
      await dialog.getByRole('button', { name: 'Reject all' }).click();
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.getByText('Cart:')).toHaveText('Cart: 1 item');
  });
});
