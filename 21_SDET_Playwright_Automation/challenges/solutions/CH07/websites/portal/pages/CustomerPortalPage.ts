/**
 * CustomerPortalPage — Page Object for the customer-facing portal.
 *
 * Uses the-internet.herokuapp.com login page as a stand-in for a customer portal.
 * Customer logs in and places an order (interacts with a form on the internet.herokuapp.com).
 */
import { type Page, type Locator, expect } from '@playwright/test';
import { clickElement, fillInput, safeNavigate } from '../../../utilities/helpers/action.helpers';
import { APP } from '../../../constants/app.constants';
import { Timeouts } from '../../../constants/timeouts';

export class CustomerPortalPage {
  readonly page: Page;

  private readonly locators = {
    usernameInput: '#username',
    passwordInput: '#password',
    loginButton: 'button[type="submit"]',
    flashBanner: '#flash',
    orderLink: 'a:has-text("Form Authentication")', // proxy navigation
    orderForm: 'form',
    productSelect: '#dropdown',
    quantityInput: '#quantity',
    submitOrderButton: 'button:has-text("Order")',
    orderConfirmation: '#order-confirmation',
  };

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly productSelect: Locator;
  readonly quantityInput: Locator;
  readonly submitOrderButton: Locator;
  readonly orderConfirmation: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator(this.locators.usernameInput);
    this.passwordInput = page.locator(this.locators.passwordInput);
    this.loginButton = page.locator(this.locators.loginButton);
    this.productSelect = page.locator(this.locators.productSelect);
    this.quantityInput = page.locator(this.locators.quantityInput);
    this.submitOrderButton = page.locator(this.locators.submitOrderButton);
    this.orderConfirmation = page.locator(this.locators.orderConfirmation);
  }

  async gotoLogin(): Promise<void> {
    const url = `${APP.internet.baseUrl}/login`;
    await safeNavigate(this.page, url, 'Customer portal login page');
    await this.usernameInput.waitFor({ state: 'visible', timeout: Timeouts.THIRTY_SECONDS });
  }

  async loginAsCustomer(username: string, password: string): Promise<void> {
    await fillInput(this.usernameInput, username, { description: 'customer portal username' });
    await fillInput(this.passwordInput, password, { description: 'customer portal password' });
    await clickElement(this.loginButton, { description: 'customer portal login submit' });
  }

  async expectLoginSuccess(): Promise<void> {
    const banner = this.page.locator(this.locators.flashBanner);
    await expect(banner).toBeVisible({ timeout: Timeouts.TEN_SECONDS });
  }

  async navigateToOrderPage(): Promise<void> {
    const secureLink = this.page.locator('a:has-text("Secure")');
    await clickElement(secureLink, { description: 'navigate to secure area' });
    await this.page.waitForURL(/secure/, { timeout: Timeouts.THIRTY_SECONDS });
  }

  async selectProduct(productName: string): Promise<void> {
    await clickElement(this.productSelect, { description: 'product dropdown' });
    await this.productSelect.selectOption(productName);
  }

  async enterQuantity(quantity: string): Promise<void> {
    await this.quantityInput.waitFor({ state: 'visible', timeout: Timeouts.FIVE_SECONDS });
    await this.quantityInput.clear();
    await fillInput(this.quantityInput, quantity, { description: 'order quantity' });
  }

  async placeOrder(): Promise<string> {
    await clickElement(this.submitOrderButton, { description: 'submit order button' });

    // Wait for confirmation element and extract code
    await this.orderConfirmation.waitFor({ state: 'visible', timeout: Timeouts.THIRTY_SECONDS });
    const confirmationText = await this.orderConfirmation.textContent();
    return confirmationText ?? '';
  }
}