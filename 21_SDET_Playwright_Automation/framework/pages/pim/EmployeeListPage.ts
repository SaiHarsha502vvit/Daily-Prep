import { type Page } from '@playwright/test';

import { EmployeeResultsGrid } from '../../components/pim/EmployeeResultsGrid';
import { EmployeeSearchForm } from '../../components/pim/EmployeeSearchForm';
import { endpoints } from '../../constants/endpoints';
import { Timeouts } from '../../constants/timeouts';
import { clickElement } from '../../utilities/helpers/action.helpers';
import { OrangeHRMBasePage } from '../OrangeHRMBasePage';

export class EmployeeListPage extends OrangeHRMBasePage {
  readonly searchForm: EmployeeSearchForm;
  readonly resultsGrid: EmployeeResultsGrid;

  constructor(page: Page) {
    super(page);
    this.searchForm = new EmployeeSearchForm(page);
    this.resultsGrid = new EmployeeResultsGrid(page);
  }

  async navigate(): Promise<void> {
    await this.goto(endpoints.orangehrm.PIM_LIST, 'OrangeHRM employee list');
  }

  async expectLoaded(): Promise<void> {
    await this.header.expectHeader('PIM');
    await this.searchForm.searchButton.waitFor({ state: 'visible', timeout: Timeouts.TEN_SECONDS });
  }

  async clickAddEmployee(): Promise<void> {
    const addButton = this.page.getByRole('button', { name: 'Add' });
    await clickElement(addButton, { description: 'add employee button' });
  }
}
