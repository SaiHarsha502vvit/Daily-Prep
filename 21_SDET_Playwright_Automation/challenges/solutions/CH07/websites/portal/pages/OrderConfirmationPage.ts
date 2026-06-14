/**
 * OrderConfirmationPage — Page Object for the order confirmation screen.
 *
 * In a real system this would be a dedicated page at /order/{id}/confirmation.
 * Here we model it as a page that receives a customer+order from the test-data bridge
 * and verifies the confirmation state.
 */
import { type Page, type Locator, expect } from "@playwright/test";
import { Timeouts } from "../../../constants/timeouts";

export class OrderConfirmationPage {
  readonly page: Page;

  private readonly locators = {
    confirmationBanner: ".confirmation-banner",
    orderIdText: ".order-id",
    customerNameText: ".customer-name",
    statusBadge: ".status-badge",
    confirmationCodeText: ".confirmation-code",
  };

  readonly confirmationBanner: Locator;
  readonly orderIdText: Locator;
  readonly statusBadge: Locator;
  readonly confirmationCodeText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.confirmationBanner = page.locator(this.locators.confirmationBanner);
    this.orderIdText = page.locator(this.locators.orderIdText);
    this.statusBadge = page.locator(this.locators.statusBadge);
    this.confirmationCodeText = page.locator(
      this.locators.confirmationCodeText,
    );
  }

  /**
   * Confirms the page is showing a valid order confirmation.
   * Called after the customer portal places an order.
   */
  async expectValidConfirmation(orderId: number): Promise<void> {
    await this.confirmationBanner.waitFor({
      state: "visible",
      timeout: Timeouts.THIRTY_SECONDS,
    });
    await expect(this.statusBadge).toContainText(/confirmed|success/i, {
      timeout: Timeouts.TEN_SECONDS,
    });
    await expect(this.orderIdText).toBeVisible({
      timeout: Timeouts.TEN_SECONDS,
    });
  }
}
