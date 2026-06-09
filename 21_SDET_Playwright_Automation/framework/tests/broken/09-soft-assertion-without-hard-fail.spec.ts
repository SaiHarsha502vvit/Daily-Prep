import { test, expect } from '@playwright/test';
import { endpoints } from '../../constants/endpoints';

/**
 * BROKEN TEST — Anti-Pattern: soft assertions without terminal check
 * Curriculum Reference: Ch03 — Assertion Patterns, Ch05 — Fail-Fast vs Soft
 * Why it fails: `expect.soft()` captures errors but does NOT fail the test.
 * If the developer forgets to inspect `test.info().errors` at the end, a
 * test riddled with soft failures will report as PASSED, hiding regressions.
 */
test('broken: soft assertions never checked for residual errors', async ({ page }) => {
  await page.goto(endpoints.orangehrm.LOGIN);

  // Intentionally submit empty form to trigger validation errors.
  await page.getByRole('button', { name: 'Login' }).click();

  // BUG: These are soft — they log errors but do NOT fail the test.
  // If the selectors are wrong (e.g., a UI redesign), the test still passes.
  await expect.soft(page.locator('.oxd-input-field-error-message').nth(0)).toHaveText('Required');
  await expect.soft(page.locator('.oxd-input-field-error-message').nth(1)).toHaveText('Required');

  // Missing: `expect(test.info().errors).toHaveLength(0)`
  // Result: test reports PASS even when the above soft assertions fail.
});

/**
 * FIXED VERSION
 * Fix: After all soft assertions, perform a hard assertion on the error
 * collection. If any soft assertion failed, the test now correctly fails.
 */
test('fixed: soft assertions followed by hard error count check', async ({ page }) => {
  await page.goto(endpoints.orangehrm.LOGIN);
  await page.getByRole('button', { name: 'Login' }).click();

  // Soft assertions allow us to collect ALL field errors in one go.
  await expect.soft(page.locator('.oxd-input-field-error-message').nth(0)).toHaveText('Required');
  await expect.soft(page.locator('.oxd-input-field-error-message').nth(1)).toHaveText('Required');

  // FIXED: Terminal assertion that converts accumulated soft failures into
  // a hard test failure. This is the correct pattern for form validation.
  expect(test.info().errors).toHaveLength(0);
});
