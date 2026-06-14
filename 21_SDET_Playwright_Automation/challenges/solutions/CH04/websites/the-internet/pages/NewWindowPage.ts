import { expect } from "@playwright/test";

/**
 * Page Object Model for the new window content page served by the-internet.
 * URL: https://the-internet.herokuapp.com/windows/new
 */
export class NewWindowPage {
  constructor(private readonly page: Page) {}

  private get heading() {
    return this.page.locator("h3", { hasText: "New Window" });
  }

  /**
   * Asserts the new window has loaded and the expected heading is visible.
   */
  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }
}
