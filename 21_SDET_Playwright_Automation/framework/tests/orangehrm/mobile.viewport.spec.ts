import { test, expect } from '../../fixtures/orangehrm.fixture';

/**
 * Smoke spec for the `mobile-chromium` project (Pixel 5 device descriptor).
 *
 * Run with:
 *   npx playwright test --project=mobile-chromium
 *
 * Tagged @mobile so the default `orangehrm` project (which has no `grep`)
 * still runs it as part of its scope, but the dedicated mobile-chromium
 * project — which only matches `@mobile` — runs ONLY this.
 *
 * NOTE: This is mobile-viewport emulation in Chromium, not native iOS/Android.
 * For real device testing see `23_Mobile_Dev_And_Testing/` per `CONTEXT.md`.
 */
test('@mobile login page renders correctly at mobile viewport', async ({ loginPage }) => {
  await loginPage.navigate();

  // The login form must be visible regardless of viewport.
  await expect(loginPage.usernameInput).toBeVisible();
  await expect(loginPage.passwordInput).toBeVisible();
  await expect(loginPage.submitButton).toBeVisible();

  // Mobile viewport should not require horizontal scroll for the login form.
  const viewport = loginPage.page.viewportSize();
  expect(viewport).not.toBeNull();
  expect(viewport!.width).toBeLessThanOrEqual(500); // Pixel 5 is 393×851

  // Verify the form does not overflow horizontally.
  const formBox = await loginPage.submitButton.boundingBox();
  expect(formBox).not.toBeNull();
  expect(formBox!.x + formBox!.width).toBeLessThanOrEqual(viewport!.width);
});
