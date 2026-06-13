// challenge-06-storagestate.ts

/**
 * Quiz 02 — Challenge 6: StorageState Saved Too Early
 * Curriculum: Ch07 — Browser Context & State
 * Difficulty: HIGH
 *
 * Problem: Calling context.storageState() immediately after the login click
 *          captures cookies/localStorage BEFORE the server has responded and
 *          set the auth tokens. The saved state file is incomplete.
 * Solution: Wait for the post-login page indicator (URL, element, network idle)
 *          BEFORE saving storageState.
 */

import * as fs from 'fs';
import * as path from 'path';

import { test, expect, type BrowserContext, type Page } from '@playwright/test';

const AUTH_STATE_PATH = path.resolve(__dirname, '..', '..', '.auth', 'user.json');

/* ───────────────────────────────────────────────────────────────────────────
   ❌ BROKEN VERSION — save state before login completes
   ─────────────────────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function brokenSaveAuth(context: BrowserContext, page: Page): Promise<void> {
  await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  await page.locator("input[name='username']").fill('Admin');
  await page.locator("input[name='password']").fill('admin123');

  // TRAP: Click returns when the navigation starts, NOT when the page finishes loading.
  await page.locator("button[type='submit']").click();

  // 🐛 Saving state here captures cookies BEFORE the server sets the session cookie!
  await context.storageState({ path: AUTH_STATE_PATH });

  // The next test reuses this state file and is redirected back to login.
}

/* ───────────────────────────────────────────────────────────────────────────
   ✅ FIXED VERSION — wait for login completion indicator before saving
   ─────────────────────────────────────────────────────────────────────────── */

async function saveAuthStateFixed(context: BrowserContext, page: Page): Promise<void> {
  await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  await page.locator("input[name='username']").fill('Admin');
  await page.locator("input[name='password']").fill('admin123');

  // FIXED: Wait for navigation to the dashboard URL AND the page to be fully loaded.
  await Promise.all([
    page.waitForURL(/dashboard/),
    page.locator("button[type='submit']").click(),
  ]);
  await page.waitForLoadState('networkidle');

  // NOW the session cookies/auth tokens are settled. Safe to save.
  await context.storageState({ path: AUTH_STATE_PATH });
}

// Export the fixed helper so the demo spec can call it.
export { saveAuthStateFixed };

/* ───────────────────────────────────────────────────────────────────────────
   ✅ DEMO TEST — shows the correct sequence end-to-end
   ─────────────────────────────────────────────────────────────────────────── */
test('quiz-02-ch06: save auth state after confirming login success', async ({ browser }) => {
  // Use a fresh context (no existing auth) to simulate first-time login.
  const context = await browser.newContext();
  const page = await context.newPage();

  // Ensure .auth dir exists
  fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });

  await saveAuthStateFixed(context, page);

  // Verify the state file was written and contains cookies
  const stateContent = fs.readFileSync(AUTH_STATE_PATH, 'utf-8');
  const state = JSON.parse(stateContent) as { cookies: unknown[] };
  expect(state.cookies.length).toBeGreaterThan(0);

  // Prove the state is reusable: new context with this state should NOT redirect to login.
  const newContext = await browser.newContext({ storageState: AUTH_STATE_PATH });
  const newPage = await newContext.newPage();
  await newPage.goto('https://opensource-demo.orangehrmlive.com/web/index.php/dashboard/index');

  // If storageState was saved too early, this would redirect to login and fail.
  await expect(newPage.locator('h6')).toContainText('Dashboard');

  await newContext.close();
  await context.close();
});

/**
 * CHECKLIST FOR SAVING STORAGE STATE:
 * □ Wait for URL change to authenticated page
 * □ Wait for load state 'networkidle' (all XHR/fetch settled)
 * □ Wait for a DOM element that ONLY appears when logged in
 * □ Only THEN call context.storageState({ path })
 *
 * COMMON PITFALLS:
 * - Saving after click() but before waitForURL()
 * - Saving after API login but before verifying the token response
 * - Race condition: two setup scripts saving to the same file simultaneously
 */
