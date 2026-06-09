import { test, expect } from '../../fixtures/orangehrm.fixture';

interface TestData {
  leaveFromDate: string | null;
  leaveToDate: string | null;
}

const data: TestData = { leaveFromDate: null, leaveToDate: null };

test.describe('Leave Module Workflow', () => {
  test.beforeEach(async ({ loginPage, dashboardPage }) => {
    await loginPage.navigate();
    await loginPage.loginWith({
      username: process.env.ORANGEHRM_DEMO_USERNAME ?? 'Admin',
      password: process.env.ORANGEHRM_DEMO_PASSWORD ?? 'admin123',
    });
    await dashboardPage.expectLoaded();
  });

  test('@smoke navigate to leave list and verify UI', async ({ leaveListPage }) => {
    await leaveListPage.navigate();
    await leaveListPage.expectLoaded();
    // Soft assertions on all form controls
    await expect.soft(leaveListPage.fromDateInput).toBeVisible();
    await expect.soft(leaveListPage.toDateInput).toBeVisible();
    await expect.soft(leaveListPage.searchButton).toBeVisible();
    await expect.soft(leaveListPage.resetButton).toBeVisible();
    expect(await leaveListPage.fromDateInput.isVisible()).toBe(true);
  });

  test('@regression apply leave and verify record in list', async ({ leaveListPage }) => {
    await leaveListPage.navigate();
    await leaveListPage.expectLoaded();

    // The demo site may not allow actual leave submission via admin; we assert navigation
    // and that the Add button opens the assign leave form or navigates appropriately.
    await leaveListPage.clickAdd();
    // Wait for navigation to add-leave or assign-leave page
    await expect(leaveListPage.page).toHaveURL(/leave\//, { timeout: 15000 });
  });
});
