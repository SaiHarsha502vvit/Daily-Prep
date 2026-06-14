import { test, expect } from '@playwright/test';

import { maskDynamicElements } from '../../helpers';

test('@visual login page baseline', async ({ page }) => {
  await page.goto('/web/index.php/auth/login');
  await maskDynamicElements(page);
  await expect(page).toHaveScreenshot('login-page.png', { maxDiffPixels: 100 });
});
