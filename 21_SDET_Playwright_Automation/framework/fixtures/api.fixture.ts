import { test as base, request } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

import { ResourcesClient } from '../clients/ResourcesClient';
import { UsersClient } from '../clients/UsersClient';
import { envConfig } from '../config/env.loader';

type ApiTestFixtures = {
  /** Test-scoped UsersClient built over apiContext. */
  usersClient: UsersClient;
  /** Test-scoped ResourcesClient built over apiContext. */
  resourcesClient: ResourcesClient;
};

type ApiWorkerFixtures = {
  /** Worker-scoped isolated APIRequestContext. */
  apiContext: APIRequestContext;
};

export const test = base.extend<ApiTestFixtures, ApiWorkerFixtures>({
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
