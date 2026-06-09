import { expect, type Locator, type Page } from '@playwright/test';
import { Timeouts } from '../constants/timeouts';
import { HeaderNav } from '../components/common/HeaderNav';
import { SideMenu } from '../components/common/SideMenu';
import { safeNavigate } from '../utilities/helpers/action.helpers';

export abstract class OrangeHRMBasePage {
  readonly page: Page;
  readonly header: HeaderNav;
  readonly sideMenu: SideMenu;
  readonly spinner: Locator;

  protected constructor(page: Page) {
    this.page = page;
    this.header = new HeaderNav(page);
    this.sideMenu = new SideMenu(page);
    this.spinner = page.locator('.oxd-loading-spinner');
  }

  abstract navigate(): Promise<void>;
  abstract expectLoaded(): Promise<void>;

  protected async goto(url: string, description: string): Promise<void> {
    await safeNavigate(this.page, url, description);
    await this.waitForSpinnerHidden();
  }

  protected async waitForSpinnerHidden(): Promise<void> {
    try {
      await this.spinner.waitFor({ state: 'hidden', timeout: Timeouts.TEN_SECONDS });
    } catch {
      // spinner may not appear; that's fine
    }
  }

  async expectTitle(title: string): Promise<void> {
    await expect(this.page).toHaveTitle(new RegExp(title));
  }

  async waitForUrl(route: RegExp | string): Promise<void> {
    await expect(this.page).toHaveURL(route, { timeout: Timeouts.THIRTY_SECONDS });
  }
}
