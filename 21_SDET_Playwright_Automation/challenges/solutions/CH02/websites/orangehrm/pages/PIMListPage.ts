import { type Page, type Locator, expect } from '@playwright/test';
import { clickElement, fillInput } from '../../../framework/utilities/helpers/action.helpers';
import { Timeouts } from '../../../framework/constants/timeouts';

export class PIMListPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly resultRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('input[placeholder="Type for hints..."]').first();
    this.searchButton = page.locator('button[type="submit"]').first();
    this.resultRows = page.locator('.oxd-table-card');
  }

  async goto(): Promise<void> {
    await this.page.goto('/web/index.php/pim/viewEmployeeList');
    await this.searchInput.waitFor({ state: 'visible', timeout: Timeouts.THIRTY_SECONDS });
  }

  async searchByEmployeeName(name: string): Promise<void> {
    await fillInput(this.searchInput, name, { description: 'search employee name', timeout: Timeouts.TEN_SECONDS });
    const responsePromise = this.page.waitForResponse(
      (resp) => resp.url().includes('/api/v2/pim/employees')
    );
    await clickElement(this.searchButton, { description: 'click search', timeout: Timeouts.TEN_SECONDS });
    await responsePromise;
    await this.resultRows.first().waitFor({ state: 'visible', timeout: Timeouts.TEN_SECONDS }).catch(() => {});
  }

  async getResultCount(): Promise<number> {
    return this.resultRows.count();
  }
}