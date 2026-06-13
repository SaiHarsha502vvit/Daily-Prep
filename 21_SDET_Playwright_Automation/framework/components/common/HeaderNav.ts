import { expect, type Locator, type Page } from '@playwright/test';

import { Timeouts } from '../../constants/timeouts';

export class HeaderNav {
  readonly page: Page;

  readonly headerTitle: Locator;
  readonly userDropdown: Locator;
  readonly logoutLink: Locator;
  readonly aboutLink: Locator;
  readonly supportLink: Locator;
  readonly changePasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use the breadcrumb class to target the module name (e.g., "PIM"),
    // not the sub-page main title (e.g., "Add Employee") which is also an h6.oxd-text--h6.
    this.headerTitle = page.locator('h6.oxd-topbar-header-breadcrumb-module');
    this.userDropdown = page.locator('.oxd-userdropdown-tab');
    this.logoutLink = page.getByRole('menuitem', { name: 'Logout' });
    this.aboutLink = page.getByRole('menuitem', { name: 'About' });
    this.supportLink = page.getByRole('menuitem', { name: 'Support' });
    this.changePasswordLink = page.getByRole('menuitem', { name: 'Change Password' });
  }

  async expectHeader(title: string): Promise<void> {
    await expect(this.headerTitle).toBeVisible({ timeout: Timeouts.TEN_SECONDS });
    await expect(this.headerTitle).toHaveText(title);
  }

  async openUserDropdown(): Promise<void> {
    await this.userDropdown.click();
  }

  async logout(): Promise<void> {
    await this.openUserDropdown();
    await this.logoutLink.click();
  }

  async expectLoggedOut(): Promise<void> {
    await expect(this.page).toHaveURL(/auth\/login/);
    await expect(this.page.getByRole('heading', { name: 'Login' })).toBeVisible({
      timeout: Timeouts.TEN_SECONDS,
    });
  }
}
