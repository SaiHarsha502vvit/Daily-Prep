import { test, expect } from '@playwright/test';
import { LoginPage } from '../../websites/orangehrm/pages/LoginPage';
import { DashboardPage } from '../../websites/orangehrm/pages/DashboardPage';
import credentials from '../../test-data/orangehrm/credentials.json';

test.describe('OrangeHRM Login', () => {
  test('@smoke @regression valid credentials land on dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    await loginPage.goto();
    await loginPage.loginWith(credentials.valid);
    await dashboardPage.expectLoaded();
  });

  test('@regression wrong password shows invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWith(credentials.negative.wrongPassword);
    await loginPage.expectInvalidCredentials();
  });

  test('@regression wrong username shows invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWith(credentials.negative.wrongUsername);
    await loginPage.expectInvalidCredentials();
  });

  test('@regression empty fields show required errors', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWith(credentials.negative.empty);
    await loginPage.expectRequiredFieldErrors();
  });
});