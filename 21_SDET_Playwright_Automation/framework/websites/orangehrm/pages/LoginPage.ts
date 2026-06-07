import { expect, type Locator, type Page } from '@playwright/test';
import { clickElement, fillInput, safeNavigate } from '../../../utilities/helpers/action.helpers';
import { endpoints } from '../../../constants/endpoints';
import { Timeouts } from '../../../constants/timeouts';
import { Messages } from '../../../constants/messages';

export class LoginPage {
  readonly page: Page;

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly requiredFieldError: Locator;

  readonly locators = {
    usernameInput: "input[name='username']",
    passwordInput: "input[name='password']",
    submitButton: { role: 'button' as const, name: 'Login' },
    errorAlert: '.oxd-alert-content-text',
    requiredFieldError: '.oxd-input-field-error-message',
  };

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator(this.locators.usernameInput);
    this.passwordInput = page.locator(this.locators.passwordInput);
    this.submitButton = page.getByRole(
      this.locators.submitButton.role,
      { name: this.locators.submitButton.name }
    );
    this.errorAlert = page.locator(this.locators.errorAlert);
    this.requiredFieldError = page.locator(this.locators.requiredFieldError);
  }

  async goto(): Promise<void> {
    await safeNavigate(this.page, endpoints.orangehrm.LOGIN, 'OrangeHRM login page');
    await this.usernameInput.waitFor({ state: 'visible', timeout: Timeouts.THIRTY_SECONDS });
  }

  async loginWith(credentials: { username: string; password: string }): Promise<void> {
    await fillInput(this.usernameInput, credentials.username, {
      description: 'login username',
    });
    await fillInput(this.passwordInput, credentials.password, {
      description: 'login password',
    });
    await clickElement(this.submitButton, { description: 'login submit' });
  }

  async expectInvalidCredentials(): Promise<void> {
    await expect(this.errorAlert).toBeVisible({ timeout: Timeouts.TEN_SECONDS });
    await expect(this.errorAlert).toHaveText(Messages.orangehrm.INVALID_CREDENTIALS);
  }

  async expectRequiredFieldErrors(): Promise<void> {
    await expect(this.requiredFieldError.first()).toBeVisible({
      timeout: Timeouts.TEN_SECONDS,
    });
  }
}
