import { test as base, type Page } from "@playwright/test";

/**
 * ─── LEVEL 2: TEST-SCOPED AUTH FIXTURE ────────────────────────────────────
 * Each test gets a clean browser context with a UI login.
 * Suitable for: < 20 tests, single role, learning phase.
 * See Ch51 for the full taxonomy.
 */

async function uiLogin(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.locator("#username").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("**/dashboard");
}

interface AuthFixtures {
  adminPage: Page;
}

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await uiLogin(page, process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!);
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
