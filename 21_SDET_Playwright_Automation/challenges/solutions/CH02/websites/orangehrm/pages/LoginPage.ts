import { type Page, type Locator, expect } from '@playwright/test';
import { clickElement, fillInput } from '../../../framework/utilities/helpers/action.helpers';
import { Timeouts } from '../../../framework/constants/timeouts';

export class LoginPage {
  readonly page: Page;
  readonly locators = {
    usernameInput: 'input[name="username"]',
    passwordInput: 'input[name="password"]',
    loginButton: 'button[type="submit"]',
    forgotPasswordLink: 'text=Forgot your password?',
    invalidCredentialsAlert: '[role="alert"]',
    requiredError: '.oxd-input-field-error-message',
  };

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator(this.locators.usernameInput);
    this.passwordInput = page.locator(this.locators.passwordInput);
    this.loginButton = page.locator(this.locators.loginButton);
  }

  async goto(): Promise<void> {
    await this.page.goto('/web/index.php/auth/login');
    await this.usernameInput.waitFor({ state: 'visible', timeout: Timeouts.THIRTY_SECONDS });
  }

  async loginWith(credentials: { username: string; password: string }): Promise<void> {
    await fillInput(this.usernameInput, credentials.username, { description: 'fill username', timeout: Timeouts.TEN_SECONDS });
    await fillInput(this.passwordInput, credentials.password, { description: 'fill password', timeout: Timeouts.TEN_SECONDS });
    await clickElement(this.loginButton, { description: 'click login', timeout: Timeouts.TEN_SECONDS });
  }

  async expectInvalidCredentials(): Promise<void> {
    const alert = this.page.locator(this.locators.invalidCredentialsAlert);
    await expect(alert).toBeVisible({ timeout: Timeouts.TEN_SECONDS });
    await expect(alert).toContainText('Invalid credentials');
  }

  async expectRequiredFieldErrors(): Promise<void> {
    const errors = this.page.locator(this.locators.requiredError);
    await expect(errors.first()).toBeVisible({ timeout: Timeouts.TEN_SECONDS });
  }
}