import { test as base, type Page } from '@playwright/test';

import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { LeaveListPage } from '../pages/leave/LeaveListPage';
import { LoginPage } from '../pages/login/LoginPage';
import { AddEmployeePage } from '../pages/pim/AddEmployeePage';
import { EmployeeListPage } from '../pages/pim/EmployeeListPage';
import { EmployeePersonalDetailsPage } from '../pages/pim/EmployeePersonalDetailsPage';
import type { PooledAccount } from '../types/user.types';
import { APIUtils } from '../utilities/api/APIUtils';
import type { EmployeeData } from '../utilities/data/employee.factory';
import { BridgeKeys, TestDataBridge } from '../utilities/data/test-data.bridge';

import { acquireAccount, releaseAccount } from './auth.fixture';

type OrangeHRMFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  employeeListPage: EmployeeListPage;
  addEmployeePage: AddEmployeePage;
  employeePersonalDetailsPage: EmployeePersonalDetailsPage;
  leaveListPage: LeaveListPage;
  apiUtils: APIUtils;
  bridge: TestDataBridge;
  pooledAccount: PooledAccount;
  testEmployee: EmployeeData | null;
};

export const test = base.extend<OrangeHRMFixtures>({
  loginPage: async ({ page }: { page: Page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }: { page: Page }, use) => {
    await use(new DashboardPage(page));
  },

  employeeListPage: async ({ page }: { page: Page }, use) => {
    await use(new EmployeeListPage(page));
  },

  addEmployeePage: async ({ page }: { page: Page }, use) => {
    await use(new AddEmployeePage(page));
  },

  employeePersonalDetailsPage: async ({ page }: { page: Page }, use) => {
    await use(new EmployeePersonalDetailsPage(page));
  },

  leaveListPage: async ({ page }: { page: Page }, use) => {
    await use(new LeaveListPage(page));
  },

  apiUtils: async ({ request }, use, testInfo) => {
    await use(new APIUtils(request, testInfo));
  },

  bridge: async ({}, use) => {
    const bridge = new TestDataBridge();
    await use(bridge);
    bridge.clear();
  },

  pooledAccount: async ({}, use) => {
    const account = await acquireAccount();
    try {
      await use(account);
    } finally {
      await releaseAccount(account.id);
    }
  },

  testEmployee: [async ({ loginPage, employeeListPage, addEmployeePage, bridge }, use) => {
    const { generateEmployeeData } = await import('../utilities/data/employee.factory');
    const employee = generateEmployeeData();

    // Setup: create employee via UI
    await loginPage.navigate();
    await loginPage.loginWith({
      username: process.env.ORANGEHRM_DEMO_USERNAME ?? 'Admin',
      password: process.env.ORANGEHRM_DEMO_PASSWORD ?? 'admin123',
    });
    await employeeListPage.navigate();
    await employeeListPage.clickAddEmployee();
    await addEmployeePage.expectLoaded();
    await addEmployeePage.fillEmployeeDetails(employee);
    await addEmployeePage.save();

    // Store employeeId if available from the page after redirect
    try {
      const id = await addEmployeePage.page.locator('.orangehrm-employee-card .oxd-input').first().inputValue();
      if (id) employee.employeeId = id;
    } catch {
      // keep generated id if not found
    }

    bridge.set(BridgeKeys.CREATED_RECORD, employee);

    await use(employee);

    // Teardown: attempt to delete the created employee
    try {
      await employeeListPage.navigate();
      await employeeListPage.searchForm.searchById(employee.employeeId);
      const count = await employeeListPage.resultsGrid.getRecordsCount();
      if (count > 0) {
        await employeeListPage.resultsGrid.deleteFirstRecord();
        await employeeListPage.resultsGrid.confirmDeletion();
      }
    } catch {
      // Best-effort cleanup; don't fail the test on teardown issues
    }
  }, { scope: 'test', auto: false }],
});

export { expect } from '@playwright/test';
