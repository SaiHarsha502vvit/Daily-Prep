// challenge-15-component-split/OrdersPage.ts

/**
 * Quiz 02 — Challenge 15: Component Split (3 of 3)
 * OrdersPage — Orchestrator page object that composes components.
 *
 * The orchestrator DOES NOT contain selectors. It delegates to components.
 * This keeps the page object thin and makes the components reusable/testable.
 */

import { type Page } from '@playwright/test';

import { OrderResultsGrid } from './OrderResultsGrid';
import { OrderSearchForm } from './OrderSearchForm';

export class OrdersPage {
  readonly page: Page;

  // Components — each owns one section of the page.
  readonly searchForm: OrderSearchForm;
  readonly resultsGrid: OrderResultsGrid;

  constructor(page: Page) {
    this.page = page;
    this.searchForm = new OrderSearchForm(page);
    this.resultsGrid = new OrderResultsGrid(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('https://example.com/orders');
  }

  /**
   * High-level workflow: search and verify results in one fluent call.
   * This is the value of the orchestrator — it wires components together
   * into business-relevant actions.
   */
  async searchForOrderAndExpectResults(orderId: string, minResults: number): Promise<void> {
    await this.searchForm.searchByOrderId(orderId);
    await this.resultsGrid.expectVisible();
    const count = await this.resultsGrid.getRowCount();
    expect(count).toBeGreaterThanOrEqual(minResults);
  }
}
