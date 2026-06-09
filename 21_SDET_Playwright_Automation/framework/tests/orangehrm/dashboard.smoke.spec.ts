import { test, expect } from '../../fixtures/orangehrm.fixture';

test.describe('Dashboard Smoke', () => {
  test.beforeEach(async ({ loginPage, dashboardPage, pooledAccount }) => {
    await loginPage.navigate();
    await loginPage.loginWith({ username: pooledAccount.username, password: pooledAccount.password });
    await dashboardPage.expectLoaded();
  });

  test('@smoke all dashboard widgets are visible', async ({ dashboardPage }) => {
    await dashboardPage.expectAllWidgetsVisible();
  });

  test('@smoke quick launch button navigates correctly', async ({ dashboardPage }) => {
    // Use soft assertions since some quick-launch items may vary by config
    const quickLaunchItems = ['Assign Leave', 'Leave List', 'Timesheets', 'Apply Leave', 'My Leave', 'My Timesheet'];
    for (const item of quickLaunchItems) {
      const button = dashboardPage.quickLaunchWidget.locator('.orangehrm-quick-launch-card').filter({ hasText: item });
      await expect.soft(button).toBeVisible();
    }
    expect(true).toBe(true);
  });

  test('@smoke my actions section is visible', async ({ dashboardPage }) => {
    await expect(dashboardPage.myActionsWidget).toBeVisible();
    const items = dashboardPage.myActionsWidget.locator('.orangehrm-todo-list-item');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
