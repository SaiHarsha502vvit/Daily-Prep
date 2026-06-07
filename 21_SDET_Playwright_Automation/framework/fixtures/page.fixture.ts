import { test as base, type Page } from '@playwright/test';
import { LoginPage } from '../websites/orangehrm/pages/LoginPage';
import { DashboardPage } from '../websites/orangehrm/pages/DashboardPage';
import { APIUtils } from '../utilities/api/APIUtils';
import { TestDataBridge } from '../utilities/data/test-data.bridge';
import { acquireAccount, releaseAccount } from './auth.fixture';
import type { PooledAccount } from '../types/user.types';

type AppFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  apiUtils: APIUtils;
  bridge: TestDataBridge;
  pooledAccount: PooledAccount;
};

export const test = base.extend<AppFixtures>({
  loginPage: async ({ page }: { page: Page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }: { page: Page }, use) => {
    await use(new DashboardPage(page));
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
});

export { expect } from '@playwright/test';
