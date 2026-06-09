import { type Locator, type Page } from '@playwright/test';
import { Timeouts } from '../../constants/timeouts';

export interface MenuItem {
  label: string;
  route: string;
}

export class SideMenu {
  readonly page: Page;
  readonly container: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('.oxd-sidepanel');
    this.searchInput = page.locator('.oxd-sidepanel-body input');
  }

  private menuItem(label: string): Locator {
    return this.page.locator('.oxd-main-menu-item-wrapper').filter({ hasText: label });
  }

  async navigateTo(label: string): Promise<void> {
    const item = this.menuItem(label);
    await item.waitFor({ state: 'visible', timeout: Timeouts.TEN_SECONDS });
    await item.click();
  }

  async expectMenuVisible(): Promise<void> {
    await this.container.waitFor({ state: 'visible', timeout: Timeouts.TEN_SECONDS });
  }

  async searchAndSelect(label: string): Promise<void> {
    await this.searchInput.fill(label);
    await this.navigateTo(label);
  }
}
