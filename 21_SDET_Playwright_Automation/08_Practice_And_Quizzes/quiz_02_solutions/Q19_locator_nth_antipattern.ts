/**
 * QUIZ 02 — Challenge 19 [MEDIUM]: The Locator "nth" Anti-Pattern
 *
 * ORIGINAL BUGGY CODE:
 *   const count = await this.rows.count();
 *   for (let i = 0; i < count; i++) {
 *     const text = await this.rows.nth(i).textContent();
 *     if (text?.includes(customerName)) {
 *       await this.rows.nth(i).click();
 *       return;
 *     }
 *   }
 *   throw new Error('Customer not found');
 *
 * QUESTION: Why is this an anti-pattern? Rewrite clickCustomerRow in one line.
 */

import { type Page, type Locator, expect, test } from '@playwright/test';

// ============================================================
// WHY it is an anti-pattern
// ============================================================
// 1. SLOW — count() is one browser round-trip; each nth(i).textContent()
//    is ANOTHER round-trip.  For a 20-row table: 1 + 20 = 21 round-trips.
//
// 2. FLAKY — if the DOM re-renders between count() and nth(i).textContent()
//    (React reconciliation, virtual scroll, WebSocket update), nth(i) may
//    point to a DIFFERENT row or a detached element.
//
// 3. IGNORES PLAYWRIGHT — Playwright's locator engine already knows how to
//    filter by text, attribute, or child element.  Reimplementing that in
//    JS is always slower and less reliable.

// ❌ BUGGY — manual loop over nth(i)
class CustomerGrid_BAD {
  readonly page: Page;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.rows = page.locator('table > tbody > tr');
  }

  async clickCustomerRow(customerName: string): Promise<void> {
    await expect(this.rows.first()).toBeVisible();

    const count = await this.rows.count(); // 1 round-trip
    for (let i = 0; i < count; i++) {
      const text = await this.rows.nth(i).textContent(); // N round-trips
      if (text?.includes(customerName)) {
        await this.rows.nth(i).click(); // another round-trip
        return;
      }
    }
    throw new Error(`Customer "${customerName}" not found`);
  }
}

// ============================================================
// ✅ FIX — one line using filter({ hasText })
// ============================================================

class CustomerGrid_GOOD {
  readonly page: Page;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.rows = page.locator('table > tbody > tr');
  }

  async clickCustomerRow(customerName: string): Promise<void> {
    await this.rows.filter({ hasText: customerName }).click();
    // ↑ One call.  Playwright:
    //   1. Finds all <tr> elements
    //   2. Filters to those containing customerName (client-side in the engine)
    //   3. Auto-waits for the matching row to be actionable
    //   4. Clicks it
    //   → Strict mode: if >1 row matches, throws (surfaces ambiguity)
  }
}

// ============================================================
// Advanced filter patterns
// ============================================================

class CustomerGrid_Advanced {
  readonly page: Page;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.rows = page.locator('table > tbody > tr');
  }

  /** Click a row by exact cell text (e.g. customer name). */
  async clickByName(name: string): Promise<void> {
    await this.rows.filter({ hasText: name }).click();
  }

  /** Click a row whose STATUS cell equals a specific value. */
  async clickByStatus(status: string): Promise<void> {
    // Filter by a child element's text — more precise than hasText
    await this.rows.filter({ has: this.page.locator('[data-col="status"]', { hasText: status }) }).click();
  }

  /** Get a row by name and assert a specific column value. */
  async assertRowStatus(name: string, expectedStatus: string): Promise<void> {
    const row = this.rows.filter({ hasText: name });
    await expect(row.locator('[data-col="status"]')).toHaveText(expectedStatus);
  }

  /** Count rows matching a filter. */
  async countByStatus(status: string): Promise<number> {
    return this.rows
      .filter({ has: this.page.locator('[data-col="status"]', { hasText: status }) })
      .count();
  }
}

// ============================================================
// Usage in tests
// ============================================================

test('click customer row — one-liner', async ({ page }) => {
  const grid = new CustomerGrid_GOOD(page);
  await page.goto('https://example.com/customers');
  await grid.clickCustomerRow('Harsha Alasai');
  await expect(page).toHaveURL(/\/customers\/C-\d+/);
});

test('advanced row assertions', async ({ page }) => {
  const grid = new CustomerGrid_Advanced(page);
  await page.goto('https://example.com/customers');

  await grid.assertRowStatus('Harsha Alasai', 'Active');
  expect(await grid.countByStatus('Active')).toBeGreaterThan(0);
});

export { CustomerGrid_BAD, CustomerGrid_GOOD, CustomerGrid_Advanced };

// WHY
// filter({ hasText }) delegates matching to Playwright's C++ locator engine
// running INSIDE the browser process.  It evaluates the entire table in a
// single pass without needing JavaScript round-trips per row.
//
// It also auto-waits — if the table is still loading, filter retries until
// the matching row appears or the timeout expires.  The manual nth() loop
// doesn't retry: if count() returns 0 before the data loads, the loop
// exits immediately with "Customer not found".
//
// Strict mode bonus: if filter({ hasText: name }) matches MORE than one row,
// click() throws "strict mode violation: locator resolved to 2 elements".
// This surfaces data ambiguity (duplicate customer names) that the loop
// would silently hide by clicking the first match.
//
// When IS nth() acceptable?
//   - Asserting on a specific positional item (e.g. "first row is sorted
//     correctly"): expect(rows.nth(0)).toHaveText('A...')  ← positional, not data-driven
//   - Iterating to collect ALL values: for counting or building a list
//   - NEVER for data-driven selection in dynamic tables
