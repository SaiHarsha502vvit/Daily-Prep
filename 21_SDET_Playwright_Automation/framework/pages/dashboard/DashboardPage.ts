import { expect, type Locator, type Page } from '@playwright/test';

import { endpoints } from '../../constants/endpoints';
import { Messages } from '../../constants/messages';
import { Timeouts } from '../../constants/timeouts';
import { OrangeHRMBasePage } from '../OrangeHRMBasePage';

export class DashboardPage extends OrangeHRMBasePage {
  readonly timeAtWorkWidget: Locator;
  readonly myActionsWidget: Locator;
  readonly quickLaunchWidget: Locator;
  readonly buzzLatestPostsWidget: Locator;
  readonly employeesOnLeaveTodayWidget: Locator;
  readonly employeeDistributionBySubunitWidget: Locator;
  readonly employeeDistributionByLocationWidget: Locator;

  constructor(page: Page) {
    super(page);
    this.timeAtWorkWidget = page.locator('.oxd-sheet.orangehrm-dashboard-widget', {
      hasText: 'Time at Work',
    });
    this.myActionsWidget = page.locator('.oxd-sheet.orangehrm-dashboard-widget', {
      hasText: 'My Actions',
    });
    this.quickLaunchWidget = page.locator('.oxd-sheet.orangehrm-dashboard-widget', {
      hasText: 'Quick Launch',
    });
    this.buzzLatestPostsWidget = page.locator('.oxd-sheet.orangehrm-dashboard-widget', {
      hasText: 'Buzz Latest Posts',
    });
    this.employeesOnLeaveTodayWidget = page.locator('.oxd-sheet.orangehrm-dashboard-widget', {
      hasText: 'Employees on Leave Today',
    });
    this.employeeDistributionBySubunitWidget = page.locator(
      '.oxd-sheet.orangehrm-dashboard-widget',
      { hasText: 'Employee Distribution by Sub Unit' },
    );
    this.employeeDistributionByLocationWidget = page.locator(
      '.oxd-sheet.orangehrm-dashboard-widget',
      { hasText: 'Employee Distribution by Location' },
    );
  }

  async navigate(): Promise<void> {
    await this.goto(endpoints.orangehrm.DASHBOARD, 'OrangeHRM dashboard');
  }

  async expectLoaded(): Promise<void> {
    await this.header.expectHeader(Messages.orangehrm.DASHBOARD_HEADER);
    await expect(this.timeAtWorkWidget).toBeVisible({ timeout: Timeouts.TEN_SECONDS });
  }

  async expectAllWidgetsVisible(): Promise<void> {
    const widgets = [
      this.timeAtWorkWidget,
      this.myActionsWidget,
      this.quickLaunchWidget,
      this.buzzLatestPostsWidget,
      this.employeesOnLeaveTodayWidget,
      this.employeeDistributionBySubunitWidget,
      this.employeeDistributionByLocationWidget,
    ];

    for (const widget of widgets) {
      await expect.soft(widget).toBeVisible({ timeout: Timeouts.TEN_SECONDS });
    }
    // Final hard assertion if any soft failed
    const visibleChecks = await Promise.all(widgets.map((w) => w.isVisible().catch(() => false)));
    expect(visibleChecks.every(Boolean)).toBe(true);
  }

  async clickQuickLaunch(label: string): Promise<void> {
    const button = this.quickLaunchWidget
      .locator('.orangehrm-quick-launch-card')
      .filter({ hasText: label });
    await button.click();
  }

  async clickMyAction(label: string): Promise<void> {
    const button = this.myActionsWidget
      .locator('.orangehrm-todo-list-item')
      .filter({ hasText: label });
    await button.click();
  }
}
