import { expect, type Locator, type Page } from '@playwright/test';

import { Timeouts } from '../../constants/timeouts';
import { clickElement } from '../../utilities/helpers/action.helpers';
import { OrangeHRMBasePage } from '../OrangeHRMBasePage';

export class LeaveListPage extends OrangeHRMBasePage {
  readonly fromDateInput: Locator;
  readonly toDateInput: Locator;
  readonly showStatusDropdown: Locator;
  readonly leaveTypeDropdown: Locator;
  readonly employeeNameInput: Locator;
  readonly subUnitDropdown: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly addButton: Locator;
  readonly recordsTable: Locator;
  readonly noRecordsFound: Locator;
  readonly scheduleLeaveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.fromDateInput = page.locator('.oxd-form-row .oxd-date-input input').first();
    this.toDateInput = page.locator('.oxd-form-row .oxd-date-input input').nth(1);
    this.showStatusDropdown = page.locator('.oxd-form-row .oxd-select-wrapper').first();
    this.leaveTypeDropdown = page.locator('.oxd-form-row .oxd-select-wrapper').nth(1);
    this.employeeNameInput = page.locator('.oxd-form-row input[placeholder="Type for hints..."]').first();
    this.subUnitDropdown = page.locator('.oxd-form-row .oxd-select-wrapper').nth(2);
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.resetButton = page.getByRole('button', { name: 'Reset' });
    this.addButton = page.getByRole('button', { name: 'Add' });
    this.recordsTable = page.locator('.oxd-table-body');
    this.noRecordsFound = page.getByText('No Records Found');
    this.scheduleLeaveButton = page.locator('.orangehrm-header-container').getByRole('button', { name: 'Add' });
  }

  async navigate(): Promise<void> {
    await this.sideMenu.navigateTo('Leave');
    await this.searchButton.waitFor({ state: 'visible', timeout: Timeouts.TEN_SECONDS });
  }

  async expectLoaded(): Promise<void> {
    await this.header.expectHeader('Leave');
    await this.searchButton.waitFor({ state: 'visible', timeout: Timeouts.TEN_SECONDS });
  }

  async clickAdd(): Promise<void> {
    await clickElement(this.addButton, { description: 'add leave' });
  }

  async search(): Promise<void> {
    await clickElement(this.searchButton, { description: 'search leave' });
    // Wait for spinner to settle, then for either a result row or "No Records Found".
    await this.page
      .locator('.oxd-loading-spinner')
      .waitFor({ state: 'hidden', timeout: 10_000 })
      .catch(() => undefined);
    const anyRow = this.page.locator('.oxd-table-body .oxd-table-card').first();
    const noResults = this.page.getByText('No Records Found', { exact: false });
    await Promise.race([
      anyRow.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined),
      noResults.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined),
    ]);
  }

  async expectAtLeastOneRecord(): Promise<void> {
    await expect(this.noRecordsFound).not.toBeVisible({ timeout: Timeouts.TEN_SECONDS });
    await expect(this.recordsTable).toBeVisible({ timeout: Timeouts.TEN_SECONDS });
  }

  async applyLeaveByDateRange(fromDate: string, toDate: string): Promise<void> {
    // This is a best-effort abstraction for the leave application flow on the demo site
    await clickElement(this.fromDateInput, { description: 'from date' });
    await this.fromDateInput.fill(fromDate);
    await clickElement(this.toDateInput, { description: 'to date' });
    await this.toDateInput.fill(toDate);
    await this.clickAdd();
  }
}
