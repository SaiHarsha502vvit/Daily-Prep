import { test, expect } from '@playwright/test';
import { endpoints } from '../../constants/endpoints';

/**
 * BROKEN TEST — Anti-Pattern: Missing `as const` on role literals
 * Curriculum Reference: Ch03 — Type Safety, Ch06 — Locator Construction
 * Why it fails: When the role is typed as `string` instead of a string literal,
 * the editor loses autocomplete/intellisense for valid ARIA roles, and a typo
 * (e.g. 'buton') becomes a runtime error rather than a compile-time error.
 * Even though the cast below lets it compile, the *pattern* is unsafe.
 */
test('broken: getByRole with loose string typing', async ({ page }) => {
  await page.goto(endpoints.orangehrm.LOGIN);

  // BUG: `role` is typed as the general `string` type. A future refactor
  // could accidentally assign an invalid ARIA role, and TypeScript would
  // not flag it because the cast suppresses the check.
  const role: string = 'button';
  const name = 'Login';

  // The `as any` (or explicit ARIA cast) is required to compile, which is
  // itself a smell — the type system is being bypassed.
  await page.getByRole(role as any, { name }).click();

  // Same anti-pattern repeated for the logout button on the dashboard.
  await page.locator("input[name='username']").fill('Admin');
  await page.locator("input[name='password']").fill('admin123');
  await page.getByRole(role as any, { name }).click();
  await expect(page.locator('h6.oxd-text--h6')).toHaveText('Dashboard');
});

/**
 * FIXED VERSION
 * Fix: Declare the object with `as const` so TypeScript narrows the type
 * to the exact literal. Playwright's `getByRole` then accepts it directly
 * with full autocomplete and compile-time validation.
 */
test('fixed: getByRole with as-const narrowing', async ({ page }) => {
  await page.goto(endpoints.orangehrm.LOGIN);

  // FIXED: `as const` makes `config.role` typed as the literal `'button'`.
  const config = {
    role: 'button' as const,
    name: 'Login',
  };

  await page.getByRole(config.role, { name: config.name }).click();

  await page.locator("input[name='username']").fill('Admin');
  await page.locator("input[name='password']").fill('admin123');
  await page.getByRole(config.role, { name: config.name }).click();
  await expect(page.locator('h6.oxd-text--h6')).toHaveText('Dashboard');
});
