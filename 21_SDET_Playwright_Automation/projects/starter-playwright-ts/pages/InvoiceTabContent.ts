import { type FrameLocator, type Locator } from "@playwright/test";

/**
 * ─── INVOICE TAB CONTENT (iframe-scoped) ──────────────────────────────────
 * Demonstrates how to write POMs for content inside IFrames.
 * All locators are scoped to the FrameLocator passed in construction.
 */
export class InvoiceTabContent {
  readonly frame: FrameLocator;
  readonly searchField: Locator;
  readonly resultsTable: Locator;
  readonly rows: Locator;
  readonly noResultsMessage: Locator;
  readonly payButton: Locator;

  constructor(frame: FrameLocator) {
    this.frame = frame;
    this.searchField = frame.getByPlaceholder(/search invoices/i);
    this.resultsTable = frame.locator(".ag-center-cols-viewport");
    this.rows = frame.locator(".ag-row");
    this.noResultsMessage = frame.getByText(
      /no (invoices|records|results) found/i,
    );
    this.payButton = frame.getByRole("button", { name: "Pay" });
  }

  async searchForInvoice(query: string): Promise<void> {
    await this.searchField.fill(query);
    await this.frame.waitForResponse(
      (resp) => resp.url().includes("/api/invoices") && resp.status() === 200,
    );
    const spinner = this.frame.locator(".spinner-overlay");
    if ((await spinner.count()) > 0) {
      await expect(spinner).toHaveCount(0, { timeout: 15_000 });
    }
  }

  async getRowCount(): Promise<number> {
    return this.rows.count();
  }
}

import { expect } from "@playwright/test";
