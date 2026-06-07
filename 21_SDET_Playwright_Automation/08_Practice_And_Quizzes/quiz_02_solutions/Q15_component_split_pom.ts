/**
 * QUIZ 02 — Challenge 15 [HARD]: Write the Component Split
 *
 * REQUIREMENT: Split the monolithic OrdersPage POM into:
 *   - OrdersPage.ts        (orchestrator, ~15 lines)
 *   - OrderSearchForm.ts   (component, ~25 lines)
 *   - OrderResultsGrid.ts  (component, ~20 lines)
 *
 * ORIGINAL MONOLITH (do not change):
 *   export class OrdersPage {
 *     readonly orderIdInput, statusDropdown, searchButton, resetButton,
 *              resultRows, resultCount, pagination: Locator;
 *     async searchById(id)    { ... }
 *     async waitForResults()  { ... }
 *     async getRowCount()     { ... }
 *   }
 */

import { type Page, type Locator, expect } from '@playwright/test';

// ============================================================
// FILE: components/orders/OrderSearchForm.ts
// ============================================================
// Owns ONLY the search form inputs and actions.
// Knows nothing about the results grid.

class OrderSearchForm {
  private readonly page: Page;
  readonly orderIdInput: Locator;
  readonly statusDropdown: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.orderIdInput = page.locator('#orderSearch_id');
    this.statusDropdown = page.locator('#orderSearch_status');
    this.searchButton = page.locator('#orderSearch_submit');
    this.resetButton = page.locator('#orderSearch_reset');
  }

  async searchById(id: string): Promise<void> {
    await this.orderIdInput.fill(id);
    await this.searchButton.click();
  }

  async searchByStatus(status: string): Promise<void> {
    await this.statusDropdown.selectOption(status);
    await this.searchButton.click();
  }

  async reset(): Promise<void> {
    await this.resetButton.click();
    // Optionally wait for the inputs to clear:
    await expect(this.orderIdInput).toHaveValue('');
  }
}

// ============================================================
// FILE: components/orders/OrderResultsGrid.ts
// ============================================================
// Owns ONLY the results table and pagination.
// Knows nothing about how the search was triggered.

class OrderResultsGrid {
  private readonly page: Page;
  readonly resultRows: Locator;
  readonly resultCount: Locator;
  readonly pagination: Locator;

  constructor(page: Page) {
    this.page = page;
    this.resultRows = page.locator('.order-results-row');
    this.resultCount = page.locator('.order-results-count');
    this.pagination = page.locator('.order-results-pagination');
  }

  async waitForResults(timeout = 20_000): Promise<void> {
    await expect(this.resultRows.first()).toBeVisible({ timeout });
  }

  async waitForNoResults(timeout = 10_000): Promise<void> {
    await expect(this.resultRows).toHaveCount(0, { timeout });
  }

  async getRowCount(): Promise<number> {
    return this.resultRows.count();
  }

  async clickRowByIndex(index: number): Promise<void> {
    await this.resultRows.nth(index).click();
  }

  async clickRowByText(text: string): Promise<void> {
    // Use filter instead of nth loop — see Challenge 19
    await this.resultRows.filter({ hasText: text }).click();
  }
}

// ============================================================
// FILE: pages/OrdersPage.ts — the ORCHESTRATOR
// ============================================================
// Composes the two components.  Exposes high-level user-journey methods.
// Tests interact with OrdersPage; they should NOT need to reach into
// searchForm or resultsGrid directly for common operations.

class OrdersPage {
  readonly page: Page;
  readonly searchForm: OrderSearchForm;
  readonly resultsGrid: OrderResultsGrid;

  constructor(page: Page) {
    this.page = page;
    this.searchForm = new OrderSearchForm(page);
    this.resultsGrid = new OrderResultsGrid(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(`${process.env.APP_URL ?? ''}/orders`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** High-level: search by ID and wait for the grid to update. */
  async searchAndWait(orderId: string): Promise<void> {
    await this.searchForm.searchById(orderId);
    await this.resultsGrid.waitForResults();
  }

  /** High-level: reset the form and verify the grid is empty. */
  async resetAndClear(): Promise<void> {
    await this.searchForm.reset();
    await this.resultsGrid.waitForNoResults();
  }
}

// ============================================================
// Usage in tests
// ============================================================

import { test } from '@playwright/test';

test('search for an order by ID', async ({ page }) => {
  const ordersPage = new OrdersPage(page);
  await ordersPage.goto();

  await ordersPage.searchAndWait('ORD-001');

  expect(await ordersPage.resultsGrid.getRowCount()).toBe(1);
  await ordersPage.resultsGrid.clickRowByText('ORD-001');
});

test('search form reset clears results', async ({ page }) => {
  const ordersPage = new OrdersPage(page);
  await ordersPage.goto();

  await ordersPage.searchAndWait('ORD-001');
  expect(await ordersPage.resultsGrid.getRowCount()).toBe(1);

  await ordersPage.resetAndClear();
  // Grid should now show all results or be empty, depending on app behaviour
});

export { OrdersPage, OrderSearchForm, OrderResultsGrid };

// WHY
// The Single Responsibility Principle applied to POMs:
//
//   Monolithic POM:  1 class owns 8 locators + all methods
//   After split:     3 classes, each owns only its domain
//
// Benefits of the component split:
//
//   1. Independent changes — adding a column to the grid doesn't risk
//      breaking the search form class.
//   2. Reuse — OrderResultsGrid can be reused in CustomerOrdersPage,
//      InvoicesPage, etc. without copy-pasting.
//   3. Readability — tests express intent at a high level (searchAndWait)
//      without knowing which locator to click.
//   4. Testability — OrderSearchForm can be unit-tested independently.
//
// Orchestrator pattern:
//   OrdersPage.goto() + searchAndWait() + resetAndClear() are "user journeys"
//   expressed as single method calls.  This is the correct place for
//   cross-component coordination — not inside the component classes themselves.
