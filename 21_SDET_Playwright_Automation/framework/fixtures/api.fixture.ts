import { test as base, request } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { UsersClient } from '../clients/UsersClient';
import { ResourcesClient } from '../clients/ResourcesClient';
import { envConfig } from '../config/env.loader';

type ApiFixtures = {
  /** Worker-scoped isolated APIRequestContext. */
  apiContext: APIRequestContext;
  /** Test-scoped UsersClient built over apiContext. */
  usersClient: UsersClient;
  /** Test-scoped ResourcesClient built over apiContext. */
  resourcesClient: ResourcesClient;
};

export const test = base.extend<ApiFixtures>({
  apiContext: [
    async ({}, use) => {
      const context = await request.newContext({
        baseURL: envConfig.api.baseUrl,
      });
      await use(context);
      await context.dispose();
    },
    { scope: 'worker' },
  ],

  usersClient: async ({ apiContext }, use) => {
    await use(new UsersClient(apiContext));
  },

  resourcesClient: async ({ apiContext }, use) => {
    await use(new ResourcesClient(apiContext));
  },
});

export { expect } from '@playwright/test';
