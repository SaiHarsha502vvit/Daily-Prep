import { type Locator, type Page } from '@playwright/test';
import { endpoints } from '../../constants/endpoints';
import { Timeouts } from '../../constants/timeouts';
import { Messages } from '../../constants/messages';
import { OrangeHRMBasePage } from '../OrangeHRMBasePage';
import { clickElement, fillInput } from '../../utilities/helpers/action.helpers';

export class LoginPage extends OrangeHRMBasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorAlert: Locator;
  readonly requiredFieldErrors: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator("input[name='username']");
    this.passwordInput = page.locator("input[name='password']");
    this.submitButton = page.getByRole('button', { name: 'Login' });
    this.forgotPasswordLink = page.getByText('Forgot your password?');
    this.errorAlert = page.locator('.oxd-alert-content-text');
    this.requiredFieldErrors = page.locator('.oxd-input-field-error-message');
  }

  async navigate(): Promise<void> {
    await this.goto(endpoints.orangehrm.LOGIN, 'OrangeHRM login page');
    await this.usernameInput.waitFor({ state: 'visible', timeout: Timeouts.THIRTY_SECONDS });
  }

  async expectLoaded(): Promise<void> {
    await this.usernameInput.waitFor({ state: 'visible', timeout: Timeouts.TEN_SECONDS });
    await this.passwordInput.waitFor({ state: 'visible', timeout: Timeouts.TEN_SECONDS });
  }

  async loginWith(credentials: { username: string; password: string }): Promise<void> {
    await fillInput(this.usernameInput, credentials.username, { description: 'login username' });
    await fillInput(this.passwordInput, credentials.password, { description: 'login password' });
    await clickElement(this.submitButton, { description: 'login submit' });
  }

  async expectInvalidCredentials(): Promise<void> {
    await this.errorAlert.waitFor({ state: 'visible', timeout: Timeouts.TEN_SECONDS });
    const text = await this.errorAlert.innerText();
    if (!text.includes(Messages.orangehrm.INVALID_CREDENTIALS)) {
      throw new Error(`Expected invalid credentials message, got: ${text}`);
    }
  }

  async expectRequiredFieldErrors(): Promise<void> {
    const count = await this.requiredFieldErrors.count();
    if (count === 0) {
      throw new Error('Expected required field errors, but none were visible.');
    }
  }
}
