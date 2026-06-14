import { type Locator, type Page } from '@playwright/test';

import { Timeouts } from '../../constants/timeouts';
import type { EmployeeUpdateData } from '../../utilities/data/employee.factory';
import { fillInput, clickElement } from '../../utilities/helpers/action.helpers';
import { OrangeHRMBasePage } from '../OrangeHRMBasePage';

export class EmployeePersonalDetailsPage extends OrangeHRMBasePage {
  readonly firstNameInput: Locator;
  readonly middleNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly employeeIdDisplay: Locator;
  readonly nationalityDropdown: Locator;
  readonly maritalStatusDropdown: Locator;
  readonly dateOfBirthInput: Locator;
  readonly genderMaleRadio: Locator;
  readonly genderFemaleRadio: Locator;
  readonly savePersonalDetailsButton: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator("input[name='firstName']");
    this.middleNameInput = page.locator("input[name='middleName']");
    this.lastNameInput = page.locator("input[name='lastName']");
    this.employeeIdDisplay = page.locator('.orangehrm-employee-form .oxd-input').first();
    this.nationalityDropdown = page
      .locator('.orangehrm-edit-employee-content .oxd-select-wrapper')
      .first();
    this.maritalStatusDropdown = page
      .locator('.orangehrm-edit-employee-content .oxd-select-wrapper')
      .nth(1);
    this.dateOfBirthInput = page
      .locator('.orangehrm-edit-employee-content .oxd-date-input input')
      .first();
    // Click the label (`.oxd-radio-wrapper`) rather than the visually-hidden
    // radio input — clicking the input directly requires `{ force: true }`,
    // which Playwright's lint config (rightly) blocks.
    this.genderMaleRadio = page.locator('.oxd-radio-wrapper').filter({ hasText: 'Male' }).first();
    this.genderFemaleRadio = page
      .locator('.oxd-radio-wrapper')
      .filter({ hasText: 'Female' })
      .first();
    this.savePersonalDetailsButton = page
      .locator('.orangehrm-edit-employee-content form')
      .getByRole('button', { name: 'Save' });
  }

  async navigate(): Promise<void> {
    // Personal details is reached via clicking an employee row in the PIM list;
    // navigating directly requires an employee id, which is caller-supplied.
    throw new Error(
      'EmployeePersonalDetailsPage.navigate() requires an employee id — use navigateForEmployee(id) instead, or reach this page by clicking an employee row.',
    );
  }

  async navigateForEmployee(employeeId: number | string): Promise<void> {
    await this.goto(
      `/web/index.php/pim/viewPersonalDetails/empNumber/${employeeId}`,
      'employee personal details',
    );
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await this.header.expectHeader('PIM');
    await this.firstNameInput.waitFor({ state: 'visible', timeout: Timeouts.TEN_SECONDS });
  }

  async getEmployeeId(): Promise<string> {
    const value = await this.employeeIdDisplay.inputValue();
    return value;
  }

  async updatePersonalDetails(data: EmployeeUpdateData): Promise<void> {
    if (data.nationality) {
      await this.selectDropdown(this.nationalityDropdown, data.nationality);
    }
    if (data.maritalStatus) {
      await this.selectDropdown(this.maritalStatusDropdown, data.maritalStatus);
    }
    if (data.dateOfBirth) {
      await fillInput(this.dateOfBirthInput, data.dateOfBirth, { description: 'date of birth' });
    }
    if (data.gender === 'Male') {
      await this.genderMaleRadio.click();
    } else if (data.gender === 'Female') {
      await this.genderFemaleRadio.click();
    }
  }

  private async selectDropdown(dropdownLocator: Locator, value: string): Promise<void> {
    await clickElement(dropdownLocator, { description: 'open dropdown' });
    const option = this.page.locator('.oxd-select-dropdown').getByText(value, { exact: true });
    await clickElement(option, { description: `select ${value}` });
  }

  async save(): Promise<void> {
    await clickElement(this.savePersonalDetailsButton, { description: 'save personal details' });
    await this.waitForSpinnerHidden();
  }
}
