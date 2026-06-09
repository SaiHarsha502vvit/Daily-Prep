import { expect, type Locator, type Page } from '@playwright/test';
import { Timeouts } from '../../constants/timeouts';
import { OrangeHRMBasePage } from '../OrangeHRMBasePage';
import { fillInput, clickElement } from '../../utilities/helpers/action.helpers';
import type { EmployeeData } from '../../utilities/data/employee.factory';

export class AddEmployeePage extends OrangeHRMBasePage {
  readonly firstNameInput: Locator;
  readonly middleNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly employeeIdInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly createLoginDetailsSwitch: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator("input[name='firstName']");
    this.middleNameInput = page.locator("input[name='middleName']");
    this.lastNameInput = page.locator("input[name='lastName']");
    // The employeeId input is inside the Add Employee form and visible as a plain input
    this.employeeIdInput = page.locator('.oxd-form-row .oxd-input').first();
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.createLoginDetailsSwitch = page.locator('.oxd-switch-input');
    this.usernameInput = page.locator('.oxd-form-row input.oxd-input').nth(1);
    this.passwordInput = page.locator("input[type='password']").first();
    this.confirmPasswordInput = page.locator("input[type='password']").nth(1);
  }

  async expectLoaded(): Promise<void> {
    await this.header.expectHeader('PIM');
    await this.firstNameInput.waitFor({ state: 'visible', timeout: Timeouts.TEN_SECONDS });
    await this.lastNameInput.waitFor({ state: 'visible', timeout: Timeouts.TEN_SECONDS });
  }

  async fillEmployeeDetails(data: EmployeeData): Promise<void> {
    await fillInput(this.firstNameInput, data.firstName, { description: 'first name' });
    await fillInput(this.middleNameInput, data.middleName, { description: 'middle name' });
    await fillInput(this.lastNameInput, data.lastName, { description: 'last name' });
    // Clear employee ID and type the generated one
    await this.employeeIdInput.click();
    await this.employeeIdInput.fill('');
    await fillInput(this.employeeIdInput, data.employeeId, { description: 'employee id' });
  }

  async toggleCreateLoginDetails(): Promise<void> {
    await clickElement(this.createLoginDetailsSwitch, { description: 'toggle create login details' });
  }

  async setLoginCredentials(username: string, password: string): Promise<void> {
    await fillInput(this.usernameInput, username, { description: 'username' });
    await fillInput(this.passwordInput, password, { description: 'password' });
    await fillInput(this.confirmPasswordInput, password, { description: 'confirm password' });
  }

  async save(): Promise<void> {
    await clickElement(this.saveButton, { description: 'save employee' });
    await this.waitForSpinnerHidden();
    // After save, the URL should transition to personal details
    await expect(this.page).toHaveURL(/pim\/viewPersonalDetails\/empNumber\//, {
      timeout: Timeouts.THIRTY_SECONDS,
    });
  }

  async cancel(): Promise<void> {
    await clickElement(this.cancelButton, { description: 'cancel add employee' });
  }
}
