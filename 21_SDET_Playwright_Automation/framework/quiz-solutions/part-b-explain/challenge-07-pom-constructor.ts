// challenge-07-pom-constructor.ts

/**
 * Quiz 02 — Challenge 7: Why POM Constructor Does Not Query the DOM
 * Curriculum: Ch08 — Page Object Model
 * Difficulty: EASY
 *
 * Question: "If my constructor calls page.locator('.btn'), does it fail when the
 *            element isn't on the page yet?"
 *
 * Answer: NO. `page.locator()` does NOT query the DOM. It only creates a lazy
 *         Locator object. The actual DOM query happens when you call an action
 *         (click, fill, isVisible) or assertion on that locator.
 */

import { test, expect, type Page, type Locator } from '@playwright/test';

/* ───────────────────────────────────────────────────────────────────────────
   Minimal POM demonstrating lazy locator evaluation
   ─────────────────────────────────────────────────────────────────────────── */

class LoginPage {
  readonly page: Page;

  // These are declared here but NO network request or DOM query happens yet.
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // ✅ SAFE TO CALL: `locator()` is purely a factory method.
    // It builds a selector description (role + name, or CSS, or XPath).
    // The browser is NOT touched at this moment.
    this.usernameInput = page.locator("input[name='username']");
    this.passwordInput = page.locator("input[name='password']");
    this.submitButton = page.locator("button[type='submit']");
  }

  async goto(): Promise<void> {
    // Navigation happens here. The constructor already ran, but that's fine
    // because locators were only "descriptions" at that point.
    await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  }

  async loginWith(credentials: { username: string; password: string }): Promise<void> {
    // NOW the first actual DOM operation happens. Playwright resolves the
    // locator description to real elements at this exact moment.
    await this.usernameInput.fill(credentials.username);
    await this.passwordInput.fill(credentials.password);
    await this.submitButton.click();
  }
}

/* ───────────────────────────────────────────────────────────────────────────
   Test demonstrating constructor safety before page load
   ─────────────────────────────────────────────────────────────────────────── */
test('quiz-02-ch07: POM constructor is safe before page loads', async ({ page }) => {
  // Create the page object BEFORE any navigation.
  // The constructor ran successfully even though the login page is NOT loaded.
  // This proves locators are lazy.
  const loginPage = new LoginPage(page);

  // Only now do we navigate.
  await loginPage.goto();

  // And only now do the locators resolve to real DOM elements.
  await loginPage.loginWith({ username: 'Admin', password: 'admin123' });

  await expect(page).toHaveURL(/dashboard/);
});

/* ───────────────────────────────────────────────────────────────────────────
   Contrast: what WOULD break in a constructor
   ─────────────────────────────────────────────────────────────────────────── */

class BrokenLoginPage {
  readonly page: Page;
  readonly usernameValue: string;

  constructor(page: Page) {
    this.page = page;

    // 🐛 TRAP: This would NOT work in a constructor because the page is blank.
    // Playwright would wait briefly, then throw because the element doesn't exist.
    // await page.locator("input[name='username']").inputValue(); // cannot `await` in constructor!

    // Even without await, calling an action synchronously returns a Promise
    // that is ignored — an unhandled promise and a broken POM.
    // page.locator(...).click(); // 🐛 Constructor can't be async in class syntax

    // The ONLY safe operation in a constructor is creating Locator references.
    this.usernameValue = '';
  }
}

/**
 * WHY THIS MATTERS FOR FRAMEWORK DESIGN:
 * 1. You can instantiate ALL page objects at test start without worrying about load order.
 * 2. Fixtures can eagerly inject POMs before any navigation.
 * 3. You never need `await` in constructors — constructors are synchronous by design.
 * 4. Lazy evaluation means locators automatically re-query the DOM on every action,
 *    so if the page changes (SPA navigation), the same locator object still works.
 */
