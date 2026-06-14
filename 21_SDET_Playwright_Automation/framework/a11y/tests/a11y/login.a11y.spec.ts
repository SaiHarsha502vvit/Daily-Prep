import { test, expect } from '@playwright/test';

import { runAxe, assertNoViolations } from '../../runner';

test('@a11y login page has no accessibility violations', async ({ page }) => {
  await page.goto('/web/index.php/auth/login');

  const results = await runAxe(page);
  assertNoViolations(results);
});

test('@a11y login form container is accessible', async ({ page }) => {
  await page.goto('/web/index.php/auth/login');

  // Target specific container for focused scan
  const appContainer = page.locator('#app');
  await expect(appContainer).toBeAttached();

  const results = await runAxe(page);
  assertNoViolations(results);
});
