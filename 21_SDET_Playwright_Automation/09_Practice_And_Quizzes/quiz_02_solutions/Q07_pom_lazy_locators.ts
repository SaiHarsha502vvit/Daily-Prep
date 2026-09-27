/**
 * QUIZ 02 — Challenge 7 [MEDIUM]: Why Doesn't This POM Constructor Query the DOM?
 *
 * GIVEN CODE:
 *   constructor(page: Page) {
 *     this.customerName  = page.locator('[data-automation-key="fullname"]');
 *     this.customerEmail = page.locator('[data-automation-key="emailaddress1"]');
 *     this.editButton    = page.getByRole('menuitem', { name: 'Edit' });
 *   }
 *   // No await, no async, no selector resolution
 *
 * QUESTION: What does page.locator(...) actually do here?
 *           When does the DOM get queried?
 */

import { type Locator, type Page, expect } from "@playwright/test";

// ============================================================
// EXPLANATION — Locators are lazy descriptions, not DOM references
// ============================================================
// page.locator('[data-automation-key="fullname"]') does NOT touch the browser.
// It creates a Locator object — a recipe that says "the element(s) matching
// this CSS selector in this page at the moment of action".
//
// The DOM is NOT queried at construction time.  There is no await because
// there is nothing asynchronous happening.  The locator is just metadata.

class CustomerDetailsPage {
  readonly page: Page;
  readonly customerName: Locator;
  readonly customerEmail: Locator;
  readonly editButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // ↓ These lines create Locator objects (pure JS, zero browser round-trips)
    this.customerName = page.locator('[data-automation-key="fullname"]');
    this.customerEmail = page.locator('[data-automation-key="emailaddress1"]');
    this.editButton = page.getByRole("menuitem", { name: "Edit" });
  }

  // ============================================================
  // The DOM is queried HERE — when an action or assertion is called
  // ============================================================

  async verifyCustomerName(expected: string): Promise<void> {
    // toHaveText: queries DOM + retries + asserts (all in one)
    await expect(this.customerName).toHaveText(expected);
  }

  async clickEdit(): Promise<void> {
    // click(): queries DOM, waits for actionability, dispatches click
    await this.editButton.click();
  }

  async getEmail(): Promise<string | null> {
    // textContent(): queries DOM once and returns the raw string
    return this.customerEmail.textContent();
  }
}

// ============================================================
// WHY LAZY LOCATORS MATTER — stale element problem
// ============================================================
//
// In Selenium / WebDriver you call driver.findElement() which returns an
// actual DOM reference (WebElement).  If the DOM re-renders (e.g. a React
// reconciliation), that reference becomes stale and throws StaleElementReferenceException.
//
// Playwright Locators solve this by NEVER holding a DOM reference.  Every
// action re-queries the selector against the current DOM.  In a D365 app
// that frequently re-renders (IFrames, virtual lists, React re-mounts),
// this is critical.
//
// Demo of what does / does NOT query the DOM:
async function demonstrateLaziness(page: Page) {
  // --- Zero DOM queries (just object creation) ---
  const locator = page.locator("#myElement"); // no query
  const filtered = locator.filter({ hasText: "Active" }); // no query
  const first = filtered.first(); // no query

  // --- DOM queries happen here ---
  await first.click(); // queries, waits for visible/enabled, clicks
  await expect(first).toBeVisible(); // queries, retries until visible or timeout
  await first.textContent(); // queries once, returns text
  await first.count(); // queries, returns count
}

export { CustomerDetailsPage, demonstrateLaziness };

// WHY (summary)
// Playwright's Locator API is lazily evaluated:
//   Construction  → describes WHERE to find the element (no browser I/O)
//   Action/Assert → finds the element in the CURRENT DOM and acts on it
//
// Benefits:
//   1. No stale element exceptions — re-queried on every use.
//   2. Synchronous constructors — POMs are cheap to instantiate.
//   3. Composable — chain .filter(), .first(), .nth() without extra queries.
//   4. Auto-waiting built in — every action waits for the element to be
//      actionable before proceeding.
