import { test, expect } from '@playwright/test';
import { LoginPage } from '../../websites/orangehrm/pages/LoginPage';
import { DashboardPage } from '../../websites/orangehrm/pages/DashboardPage';
import { PIMListPage } from '../../websites/orangehrm/pages/PIMListPage';
import credentials from '../../test-data/orangehrm/credentials.json';

const searchData = {
  knownEmployee: 'John',
  nonsense: 'xyznonexistent12345',
};

test.describe('PIM Employee Search', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    await loginPage.goto();
    await loginPage.loginWith(credentials.valid);
    await dashboardPage.expectLoaded();
    const pimPage = new PIMListPage(page);
    await pimPage.goto();
  });

  test('@regression search for nonsense returns zero results', async ({ page }) => {
    const pimPage = new PIMListPage(page);
    await pimPage.searchByEmployeeName(searchData.nonsense);
    const count = await pimPage.getResultCount();
    expect(count).toBe(0);
  });

  test('@smoke @regression search for known employee returns results', async ({ page }) => {
    const pimPage = new PIMListPage(page);
    await pimPage.searchByEmployeeName(searchData.knownEmployee);
    const count = await pimPage.getResultCount();
    expect(count).toBeGreaterThan(0);
  });
});