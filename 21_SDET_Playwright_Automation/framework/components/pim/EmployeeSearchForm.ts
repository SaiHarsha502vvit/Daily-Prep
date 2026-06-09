import { type Locator, type Page } from '@playwright/test';
import { Timeouts } from '../../constants/timeouts';
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
    this.employeeIdInput = page.locator('.oxd-form-row input.oxd-input').first();
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
    await this.page.waitForLoadState('networkidle');
  }

  async searchById(id: string): Promise<void> {
    await fillInput(this.employeeIdInput, id, { description: 'search employee id' });
    await clickElement(this.searchButton, { description: 'search button' });
    await this.page.waitForLoadState('networkidle');
  }

  async reset(): Promise<void> {
    await clickElement(this.resetButton, { description: 'reset search' });
    await this.page.waitForLoadState('networkidle');
  }
}
