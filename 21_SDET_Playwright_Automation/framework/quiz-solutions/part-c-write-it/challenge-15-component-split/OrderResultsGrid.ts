// challenge-15-component-split/OrderResultsGrid.ts

/**
 * Quiz 02 — Challenge 15: Component Split (2 of 3)
 * OrderResultsGrid — Isolated component for the results table/grid.
 */

import { type Locator, type Page, expect } from '@playwright/test';

export interface OrderRow {
  orderId: string;
  customer: string;
  status: string;
  total: string;
}

export class OrderResultsGrid {
  readonly page: Page;

  readonly gridContainer: Locator;
  readonly rows: Locator;
  readonly emptyStateMessage: Locator;
  readonly paginationNext: Locator;
  readonly paginationPrevious: Locator;

  constructor(page: Page) {
    this.page = page;

    this.gridContainer = page.locator('[data-testid="orders-grid"]');
    this.rows = page.locator('[data-testid="orders-grid"] tbody tr');
    this.emptyStateMessage = page.locator('[data-testid="no-results-message"]');
    this.paginationNext = page.getByRole('button', { name: 'Next' });
    this.paginationPrevious = page.getByRole('button', { name: 'Previous' });
  }

  async expectVisible(): Promise<void> {
    await expect(this.gridContainer).toBeVisible();
  }

  async getRowCount(): Promise<number> {
    return this.rows.count();
  }

  async getRow(index: number): Promise<OrderRow> {
    const row = this.rows.nth(index);
    const cells = row.locator('td');

    return {
      orderId: (await cells.nth(0).textContent()) ?? '',
      customer: (await cells.nth(1).textContent()) ?? '',
      status: (await cells.nth(2).textContent()) ?? '',
      total: (await cells.nth(3).textContent()) ?? '',
    };
  }

  async expectRowContains(index: number, expected: Partial<OrderRow>): Promise<void> {
    const row = await this.getRow(index);
    if (expected.orderId !== undefined) {
      expect(row.orderId).toContain(expected.orderId);
    }
    if (expected.customer !== undefined) {
      expect(row.customer).toContain(expected.customer);
    }
    if (expected.status !== undefined) {
      expect(row.status).toContain(expected.status);
    }
  }

  async expectEmpty(): Promise<void> {
    await expect(this.emptyStateMessage).toBeVisible();
    expect(await this.getRowCount()).toBe(0);
  }

  async goToNextPage(): Promise<void> {
    await this.paginationNext.click();
  }

  async goToPreviousPage(): Promise<void> {
    await this.paginationPrevious.click();
  }
}
