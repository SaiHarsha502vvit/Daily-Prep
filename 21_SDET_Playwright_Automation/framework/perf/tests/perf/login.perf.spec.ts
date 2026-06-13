import { test, expect } from '@playwright/test';

import { PERF_BUDGETS } from '../../budgets';
import { measurePageLoad, assertWithinBudget } from '../../helpers';

test('@perf login page load performance', async ({ page }) => {
  await page.goto('/web/index.php/auth/login');

  const metrics = await measurePageLoad(page);

  // Log metrics for CI reporting
  console.log(`Login page metrics: FCP=${metrics.fcp.toFixed(0)}ms, LCP=${metrics.lcp.toFixed(0)}ms, TTFB=${metrics.ttfb.toFixed(0)}ms`);

  // Assert within orangehrm login budget
  assertWithinBudget(metrics, PERF_BUDGETS.orangehrm.loginLoad);
});

test('@perf login page FCP under 2000ms', async ({ page }) => {
  await page.goto('/web/index.php/auth/login');

  const metrics = await measurePageLoad(page);

  expect(metrics.fcp).toBeLessThan(2000);
});

test('@perf login page LCP under 3000ms', async ({ page }) => {
  await page.goto('/web/index.php/auth/login');

  const metrics = await measurePageLoad(page);

  expect(metrics.lcp).toBeLessThan(3000);
});