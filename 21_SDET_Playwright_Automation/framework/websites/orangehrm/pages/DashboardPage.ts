import { expect, type Locator, type Page } from '@playwright/test';

import { Messages } from '../../../constants/messages';
import { Timeouts } from '../../../constants/timeouts';

export class DashboardPage {
  readonly page: Page;

  readonly header: Locator;
  readonly userDropdown: Locator;
  readonly logoutLink: Locator;
  readonly sidebarMenu: Locator;

  readonly locators = {
    header: 'h6.oxd-text--h6',
    userDropdown: '.oxd-userdropdown-tab',
    logoutLink: { role: 'menuitem' as const, name: 'Logout' },
    sidebarMenu: '.oxd-sidepanel',
  };

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator(this.locators.header).first();
    this.userDropdown = page.locator(this.locators.userDropdown);
    this.logoutLink = page.getByRole(
      this.locators.logoutLink.role,
      { name: this.locators.logoutLink.name }
    );
    this.sidebarMenu = page.locator(this.locators.sidebarMenu);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.header).toBeVisible({ timeout: Timeouts.THIRTY_SECONDS });
    await expect(this.header).toHaveText(Messages.orangehrm.DASHBOARD_HEADER);
    await expect(this.sidebarMenu).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.userDropdown.click();
    await this.logoutLink.click();
  }
}
