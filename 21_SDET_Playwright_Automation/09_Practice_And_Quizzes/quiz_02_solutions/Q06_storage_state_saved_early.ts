/**
 * QUIZ 02 — Challenge 6 [HARD]: StorageState Saved Too Early
 *
 * ORIGINAL BUGGY CODE:
 *   await page.locator('#loginBtn').click();
 *   await context.storageState({ path: 'auth-states/admin.json' });
 *   // storageState called immediately after click — BEFORE cookies arrive
 *
 * QUESTION: What is the bug? What does the saved state file contain?
 */

import { chromium } from "@playwright/test";
import * as path from "node:path";

// ============================================================
// BUG — storageState captured before the POST response arrives
// ============================================================
// Clicking #loginBtn fires a POST /login request.  The server validates
// credentials and sends back Set-Cookie headers.  But:
//   click() resolves as soon as the click event fires — it does NOT wait
//   for any resulting network round-trip to complete.
// So storageState() runs while the /login response is still in-flight.
// The saved file contains: pre-login cookies (maybe none, maybe tracking),
// an empty localStorage, no session token.  Every test using this state
// will start unauthenticated and be redirected to /login.

// ❌ BUGGY globalSetup
async function globalSetup_BAD() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://crm.example.com/login");
  await page.fill("#username", process.env.ADMIN_EMAIL!);
  await page.fill("#password", process.env.ADMIN_PASSWORD!);
  await page.locator("#loginBtn").click(); // ❌ fires click — does NOT await auth
  await context.storageState({ path: "auth-states/admin.json" }); // ❌ cookies missing

  await browser.close();
}

// ============================================================
// ✅ FIX — wait for a URL that only appears AFTER login succeeds
// ============================================================

async function globalSetup_FIXED() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://crm.example.com/login");
  await page.fill("#username", process.env.ADMIN_EMAIL!);
  await page.fill("#password", process.env.ADMIN_PASSWORD!);
  await page.locator("#loginBtn").click();

  // Wait until navigation confirms the server accepted the credentials.
  // waitForURL retries until the URL pattern matches or the timeout expires.
  await page.waitForURL(/\/(dashboard|home|main)/, { timeout: 30_000 });
  // ↑ At this point the browser has received all Set-Cookie headers.

  const statePath = path.resolve("auth-states/admin.json");
  await context.storageState({ path: statePath }); // ✅ cookies are in the context

  await browser.close();
}

// ============================================================
// ✅ ALTERNATIVE FIX — wait for a landmark element on the post-login page
// ============================================================

async function globalSetup_FixedWithLocator() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://crm.example.com/login");
  await page.fill("#username", process.env.ADMIN_EMAIL!);
  await page.fill("#password", process.env.ADMIN_PASSWORD!);
  await page.locator("#loginBtn").click();

  // Wait for a post-login element (e.g. dashboard header or user avatar)
  await page.locator('[data-testid="dashboard-header"]').waitFor({
    state: "visible",
    timeout: 30_000,
  });

  await context.storageState({ path: "auth-states/admin.json" }); // ✅

  await browser.close();
}

// Suppress unused-variable errors
export { globalSetup_BAD, globalSetup_FIXED, globalSetup_FixedWithLocator };

// WHY
// Playwright's click() resolves after the click event is dispatched to the
// element — it does NOT wait for any resulting navigation or network activity.
// Auth cookies are sent by the server in the HTTP response to the login POST.
// That round-trip happens asynchronously after the click.
//
// You must give Playwright a CONTENT-BASED signal that the login POST has
// completed and the server's response has been processed.  The two idiomatic
// approaches are:
//
//   1. waitForURL — wait for the browser to navigate to a URL that only exists
//      after successful login (e.g. /dashboard, /home).
//
//   2. waitForSelector / locator.waitFor — wait for a DOM element that only
//      appears after login (e.g. the user menu, the sidebar).
//
// How to spot the bug after the fact: open admin.json and check if the
// "cookies" array is empty or missing the session cookie.  If so, storageState
// was called too early.
