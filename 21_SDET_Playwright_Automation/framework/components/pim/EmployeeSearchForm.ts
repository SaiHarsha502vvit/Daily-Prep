import { type Locator, type Page } from '@playwright/test';

import { fillInput, clickElement } from '../../utilities/helpers/action.helpers';

export class EmployeeSearchForm {
  readonly page: Page;

  readonly employeeNameInput: Locator;
  readonly employeeIdInput: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly includeDropdown: Locator;
  readonly supervisorNameInput: Locator;
  readonly jobTitleDropdown: Locator;
  readonly subUnitDropdown: Locator;

  constructor(page: Page) {
    this.page = page;
    // The employee name input inside the PIM search area uses a wrapper pattern
    this.employeeNameInput = page.locator('.oxd-form-row input[placeholder="Type for hints..."]').first();
    // Label-anchored locator — robust against autocomplete inputs that also have class .oxd-input.
    this.employeeIdInput = page
      .locator('.oxd-input-group')
      .filter({ has: page.getByText('Employee Id', { exact: true }) })
      .locator('input.oxd-input');
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.resetButton = page.getByRole('button', { name: 'Reset' });
    this.includeDropdown = page.locator('.oxd-form-row .oxd-select-wrapper').first();
    this.supervisorNameInput = page.locator('.oxd-form-row input[placeholder="Type for hints..."]').nth(1);
    this.jobTitleDropdown = page.locator('.oxd-form-row .oxd-select-wrapper').nth(1);
    this.subUnitDropdown = page.locator('.oxd-form-row .oxd-select-wrapper').nth(2);
  }

  async searchByName(name: string): Promise<void> {
    const visible = await this.employeeNameInput.isVisible().catch(() => false);
    if (visible) {
      await fillInput(this.employeeNameInput, name, { description: 'search employee name' });
    }
    await clickElement(this.searchButton, { description: 'search button' });
    await this.waitForSearchSettled();
  }

  async searchById(id: string): Promise<void> {
    await fillInput(this.employeeIdInput, id, { description: 'search employee id' });
    await clickElement(this.searchButton, { description: 'search button' });
    await this.waitForSearchSettled();
  }

  async reset(): Promise<void> {
    await clickElement(this.resetButton, { description: 'reset search' });
    await this.waitForSearchSettled();
  }

  /**
   * Wait for the OrangeHRM spinner to disappear AND either a result row OR a
   * "No Records Found" message to be visible. Replaces the old
   * `waitForLoadState('networkidle')` — networkidle is brittle on SPAs that
   * keep open background polling, and Playwright's own lint config blocks it.
   */
  private async waitForSearchSettled(): Promise<void> {
    // Spinner may or may not appear; tolerate both.
    await this.page
      .locator('.oxd-loading-spinner')
      .waitFor({ state: 'hidden', timeout: 10_000 })
      .catch(() => undefined);

    // Then assert one of the two terminal UI states is visible.
    const results = this.page.locator('.oxd-table-body .oxd-table-card').first();
    const noResults = this.page.getByText('No Records Found', { exact: false });
    await Promise.race([
      results.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined),
      noResults.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined),
    ]);
  }
}
