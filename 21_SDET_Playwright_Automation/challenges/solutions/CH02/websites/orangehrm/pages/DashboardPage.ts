import { type Page, type Locator, expect } from "@playwright/test";
import { Timeouts } from "../../../framework/constants/timeouts";

export class DashboardPage {
  readonly page: Page;
  readonly header: Locator;
  readonly sidebar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator(".oxd-topbar-header");
    this.sidebar = page.locator(".oxd-sidepanel");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.header).toBeVisible({ timeout: Timeouts.TEN_SECONDS });
    await expect(this.sidebar).toBeVisible({ timeout: Timeouts.TEN_SECONDS });
  }

  async logout(): Promise<void> {
    await this.page.locator(".oxd-userdropdown-tab").click();
    await this.page.locator("text=Logout").click();
    await expect(this.page.locator('h5:has-text("Login")')).toBeVisible();
  }
}
