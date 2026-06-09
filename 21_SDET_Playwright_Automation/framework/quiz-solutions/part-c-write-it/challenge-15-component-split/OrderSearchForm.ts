// challenge-15-component-split/OrderSearchForm.ts

/**
 * Quiz 02 — Challenge 15: Component Split (1 of 3)
 * OrderSearchForm — Isolated component for the search/filter section.
 *
 * Principle: Each component owns ONE area of the page. It exposes
 *            actions (methods) and assertions, hiding selector details.
 */

import { type Locator, type Page, expect } from '@playwright/test';

export class OrderSearchForm {
  readonly page: Page;

  readonly orderIdInput: Locator;
  readonly customerNameInput: Locator;
  readonly statusDropdown: Locator;
  readonly dateFromInput: Locator;
  readonly dateToInput: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.orderIdInput = page.locator('[data-testid="search-order-id"]');
    this.customerNameInput = page.locator('[data-testid="search-customer-name"]');
    this.statusDropdown = page.locator('[data-testid="search-status-dropdown"]');
    this.dateFromInput = page.locator('[data-testid="search-date-from"]');
    this.dateToInput = page.locator('[data-testid="search-date-to"]');
    this.searchButton = page.getByRole('button', { name: 'Search', exact: true });
    this.resetButton = page.getByRole('button', { name: 'Reset', exact: true });
  }

  async searchByOrderId(orderId: string): Promise<void> {
    await this.orderIdInput.fill(orderId);
    await this.searchButton.click();
  }

  async searchByCustomer(customerName: string): Promise<void> {
    await this.customerNameInput.fill(customerName);
    await this.searchButton.click();
  }

  async filterByStatus(status: string): Promise<void> {
    await this.statusDropdown.selectOption(status);
    await this.searchButton.click();
  }

  async setDateRange(from: string, to: string): Promise<void> {
    await this.dateFromInput.fill(from);
    await this.dateToInput.fill(to);
    await this.searchButton.click();
  }

  async reset(): Promise<void> {
    await this.resetButton.click();
  }

  async expectVisible(): Promise<void> {
    await expect(this.orderIdInput).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }
}
