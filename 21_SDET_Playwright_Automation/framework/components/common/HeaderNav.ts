import { expect, type Locator, type Page } from '@playwright/test';
import { Timeouts } from '../../constants/timeouts';
import { Messages } from '../../constants/messages';

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
    this.headerTitle = page.locator('h6.oxd-text--h6');
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
