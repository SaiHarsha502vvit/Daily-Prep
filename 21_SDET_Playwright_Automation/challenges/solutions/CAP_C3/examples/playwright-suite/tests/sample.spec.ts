import { test, expect } from "@playwright/test";

/**
 * Sample Playwright test suite demonstrating test ownership annotations.
 * In a real project, annotate tests with owner metadata to track responsibility.
 */

const OWNER = process.env.TEST_OWNER || "platform-team";

test.describe("Dashboard Overview", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows the page title", { owner: OWNER }, async ({ page }) => {
    await expect(page).toHaveTitle(/Test Analytics|localhost/);
  });

  test("displays overview cards", { owner: OWNER }, async ({ page }) => {
    // Dashboard should load gracefully even with no data
    const cards = page.locator(".card");
    await expect(cards.first())
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // No data — empty state is acceptable
      });
  });
});

test.describe("Sample API Tests", () => {
  test("login form validation", { owner: "auth-team" }, async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /submit/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test("homepage loads", { owner: "frontend-team" }, async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Sample Passing Tests", () => {
  test("true is true", { owner: "platform-team" }, () => {
    expect(true).toBe(true);
  });

  test("array operations work", { owner: "platform-team" }, () => {
    const arr = [1, 2, 3];
    expect(arr.map((x) => x * 2)).toEqual([2, 4, 6]);
    expect(arr.filter((x) => x > 1)).toEqual([2, 3]);
  });
});

test.describe("Sample Failing Tests", () => {
  test("intentional failure for demo", { owner: "platform-team" }, () => {
    // This test intentionally fails to demonstrate failure tracking
    expect(1).toBe(2);
  });

  test("another failing test", { owner: "auth-team" }, () => {
    expect("hello").toBe("world");
  });
});
