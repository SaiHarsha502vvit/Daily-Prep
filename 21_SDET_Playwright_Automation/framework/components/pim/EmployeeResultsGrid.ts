import { expect, type Locator, type Page } from '@playwright/test';

import { Timeouts } from '../../constants/timeouts';
import { clickElement } from '../../utilities/helpers/action.helpers';

export class EmployeeResultsGrid {
  readonly page: Page;

  readonly recordsFoundLabel: Locator;
  readonly gridRow: Locator;
  readonly editIcon: Locator;
  readonly deleteIcon: Locator;
  readonly noRecordsFound: Locator;
  readonly checkbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.recordsFoundLabel = page.locator('.orangehrm-horizontal-padding .oxd-text--span');
    this.gridRow = page.locator('.oxd-table-body .oxd-table-card');
    this.editIcon = page.locator('.oxd-table-body .bi-pencil-fill');
    this.deleteIcon = page.locator('.oxd-table-body .bi-trash-fill');
    this.noRecordsFound = page.getByText('No Records Found');
    this.checkbox = page.locator('.oxd-table-body .oxd-checkbox-wrapper');
  }

  async expectAtLeastOneRecord(): Promise<void> {
    await expect(this.noRecordsFound).not.toBeVisible({ timeout: Timeouts.TEN_SECONDS });
    await expect(this.gridRow.first()).toBeVisible({ timeout: Timeouts.TEN_SECONDS });
  }

  async expectNoRecords(): Promise<void> {
    await expect(this.noRecordsFound).toBeVisible({ timeout: Timeouts.TEN_SECONDS });
  }

  async getRecordsCount(): Promise<number> {
    if (await this.noRecordsFound.isVisible().catch(() => false)) return 0;
    return this.gridRow.count();
  }

  async getRecordsFoundText(): Promise<string> {
    return this.recordsFoundLabel.innerText();
  }

  async editFirstRecord(): Promise<void> {
    await clickElement(this.editIcon.first(), { description: 'edit first record' });
  }

  async deleteFirstRecord(): Promise<void> {
    await clickElement(this.deleteIcon.first(), { description: 'delete first record' });
  }

  async confirmDeletion(): Promise<void> {
    const confirmButton = this.page.getByRole('button', { name: 'Yes, Delete' });
    await clickElement(confirmButton, { description: 'confirm deletion' });
    // Wait for the spinner (OrangeHRM shows one during the DELETE request) to
    // settle, then for the confirmation dialog to be gone. Replaces
    // `waitForLoadState('networkidle')` — see EmployeeSearchForm for rationale.
    await this.page
      .locator('.oxd-loading-spinner')
      .waitFor({ state: 'hidden', timeout: 10_000 })
      .catch(() => undefined);
    await confirmButton.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => undefined);
  }

  async rowContainsText(text: string): Promise<boolean> {
    const row = this.gridRow.filter({ hasText: text }).first();
    return row.isVisible().catch(() => false);
  }
}
