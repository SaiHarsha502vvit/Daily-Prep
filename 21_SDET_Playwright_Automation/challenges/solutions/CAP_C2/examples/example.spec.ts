import { test, expect } from "@playwright/test";

// Annotations are set via test.info().annotations.push(...)
// In practice, use @owner and @jira annotations like below.

test.describe("Smoke Tests @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("https://example.com");
  });

  test("homepage loads @smoke @regression", async ({ page }) => {
    await expect(page).toHaveTitle(/Example/i);
  });

  test("login button visible @smoke", async ({ page }) => {
    // @owner alice
    // @jira https://jira.example.com/browse/TEST-123
    const loginBtn = page.locator('button:has-text("Login")');
    await expect(loginBtn).toBeVisible();
  });
});

test.describe("Regression Tests @regression", () => {
  test("form submission works @regression", async ({ page }) => {
    // @owner bob
    await page.goto("https://example.com/form");
    await page.fill('input[name="email"]', "test@example.com");
    await page.click('button[type="submit"]');
    await expect(page.locator(".success")).toBeVisible();
  });

  test("api returns 200 @regression", async ({ request }) => {
    // @owner carol
    const resp = await request.get("https://example.com/api/health");
    expect(resp.status()).toBe(200);
  });
});

test("unannotated test", async ({ page }) => {
  await page.goto("https://example.com");
  await expect(page.locator("h1")).toBeVisible();
});
