import { chromium, type FullConfig } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * ─── GLOBAL SETUP ─────────────────────────────────────────────────────────
 * Pre-seeds authentication state ONCE before all tests.
 * If state is fresh (< 1 hour), skips re-login.
 */

const AUTH_DIR = path.join(__dirname, "..", "..", "playwright", ".auth");

async function globalSetup(config: FullConfig): Promise<void> {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const statePath = path.join(AUTH_DIR, "storageState.admin.json");

  if (isFresh(statePath)) {
    console.log("[globalSetup] Auth state is fresh — skipping login");
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(process.env.BASE_URL ?? "https://portal.acme.com");
    await page
      .locator("#username")
      .fill(process.env.ADMIN_EMAIL ?? "admin@acme.com");
    await page
      .locator("#password")
      .fill(process.env.ADMIN_PASSWORD ?? "admin123");
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForURL("**/dashboard", { timeout: 30_000 });

    await page.context().storageState({ path: statePath });
    console.log(`[globalSetup] Saved auth state: ${statePath}`);
  } finally {
    await browser.close();
  }
}

function isFresh(filePath: string): boolean {
  try {
    const { mtime } = fs.statSync(filePath);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return mtime.getTime() > oneHourAgo;
  } catch {
    return false;
  }
}

export default globalSetup;
