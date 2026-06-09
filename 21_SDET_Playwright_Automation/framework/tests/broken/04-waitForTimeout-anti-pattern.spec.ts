import { test, expect } from '@playwright/test';
import { endpoints } from '../../constants/endpoints';

/**
 * BROKEN TEST — Anti-Pattern: Hard waitForTimeout
 * Curriculum Reference: Ch04 — Waiting Strategies, Ch06 — Page Lifecycle
 * Why it fails: `waitForTimeout(5000)` sleeps the test thread regardless of
 * whether the DOM is ready. On fast networks the test waste time; on slow
 * networks 5 s may not be enough, producing flaky timeouts later.
 */
test('broken: wait for dashboard with hard sleep', async ({ page }) => {
  await page.goto(endpoints.orangehrm.LOGIN);
  await page.locator("input[name='username']").fill('Admin');
  await page.locator("input[name='password']").fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();

  // BUG: Arbitrary sleep. The page might finish loading in 500 ms or need
  // 6 000 ms — we have no way to know. This is the classic definition of
  // flakiness through non-deterministic timing.
  await page.waitForTimeout(5000);

  // On a slow connection this assertion may fire before the header is ready.
  await expect(page.locator('h6.oxd-text--h6')).toHaveText('Dashboard');
});

/**
 * FIXED VERSION
 * Fix: Ask Playwright to wait until the *content* signals readiness.
 * Use auto-retrying assertions (`toBeVisible`, `toHaveText`) which poll the
 * DOM until the condition is met or the expect timeout expires.
 */
test('fixed: wait for dashboard with content-based assertion', async ({ page }) => {
  await page.goto(endpoints.orangehrm.LOGIN);
  await page.locator("input[name='username']").fill('Admin');
  await page.locator("input[name='password']").fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();

  // Content-based wait: auto-retries every 100 ms until the header text
  // matches or the default expect timeout (10 s) is reached.
  await expect(page.locator('h6.oxd-text--h6')).toHaveText('Dashboard');

  // Also assert the sidebar is visible to confirm full dashboard load.
  await expect(page.locator('.oxd-sidepanel')).toBeVisible();
});
