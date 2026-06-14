import type { Page } from "@playwright/test";
import { openTabFrom } from "../../../utilities/browser/tab-manager";

/**
 * Page Object Model for https://the-internet.herokuapp.com/windows
 */
export class WindowsPage {
  constructor(private readonly page: Page) {}

  private get openWindowLink() {
    return this.page.locator("#redirect");
  }

  /**
   * Triggers the "Open Window" link and returns the newly opened tab.
   * Uses openTabFrom to guarantee the event listener is registered before the click fires.
   */
  async clickOpenWindowLink(): Promise<Page> {
    return openTabFrom(this.page, () => this.openWindowLink.click());
  }
}
