import { test, expect } from '@playwright/test';
import { endpoints } from '../../constants/endpoints';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_STATE_PATH = path.resolve(__dirname, '..', '..', '.locks', 'broken-auth-demo.json');

/**
 * BROKEN TEST — Anti-Pattern: storageState called before confirming login
 * Curriculum Reference: Ch06 — Authentication, Ch05 — State Management
 * Why it fails: `storageState()` snapshots cookies / localStorage immediately.
 * If the login POST is still in flight or the SPA hasn't finished writing
 * session data, the snapshot contains pre-auth (or partially-auth) state.
 * Subsequent tests that reuse the file will hit the login screen again.
 */
test('broken: save storage state before navigation settles', async ({ page }) => {
  await page.goto(endpoints.orangehrm.LOGIN);
  await page.locator("input[name='username']").fill('Admin');
  await page.locator("input[name='password']").fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();

  // BUG: We save storageState WITHOUT first confirming that the browser has
  // actually landed on the dashboard. On a slow network the cookies may not
  // yet reflect the authenticated session, producing an invalid auth file.
  await page.context().storageState({ path: AUTH_STATE_PATH });

  // Verify the file exists (it always will), but its *contents* may be useless.
  expect(fs.existsSync(AUTH_STATE_PATH)).toBe(true);

  // Clean-up for next run
  fs.rmSync(AUTH_STATE_PATH, { force: true });
});

/**
 * FIXED VERSION
 * Fix: Wait for a URL pattern or a post-login element BEFORE calling
 * storageState. This guarantees the auth handshake is complete.
 */
test('fixed: waitForURL before storageState', async ({ page }) => {
  await page.goto(endpoints.orangehrm.LOGIN);
  await page.locator("input[name='username']").fill('Admin');
  await page.locator("input[name='password']").fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();

  // FIXED: Confirm we are on the dashboard before snapshotting state.
  await page.waitForURL(/dashboard\/index/, { timeout: 15000 });
  await expect(page.locator('h6.oxd-text--h6')).toHaveText('Dashboard');

  await page.context().storageState({ path: AUTH_STATE_PATH });

  expect(fs.existsSync(AUTH_STATE_PATH)).toBe(true);

  // Optional sanity check: the file should contain non-empty cookies.
  const state = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf-8'));
  expect(state.cookies.length).toBeGreaterThan(0);

  fs.rmSync(AUTH_STATE_PATH, { force: true });
});
