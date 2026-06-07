import { test, expect } from '../../fixtures/page.fixture';
import { loadTestData } from '../../utilities/data/data.loader';

interface NegativeCredentials {
  negative: {
    wrongPassword: { username: string; password: string };
    wrongUsername: { username: string; password: string };
    empty: { username: string; password: string };
  };
}

const data = loadTestData<NegativeCredentials>('orangehrm/credentials');

test.describe('OrangeHRM login', () => {
  test('@smoke valid credentials land on dashboard', async ({
    loginPage,
    dashboardPage,
    pooledAccount,
  }) => {
    await loginPage.goto();
    await loginPage.loginWith({
      username: pooledAccount.username,
      password: pooledAccount.password,
    });
    await dashboardPage.expectLoaded();
  });

  test('@regression wrong password shows invalid credentials alert', async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.loginWith(data.negative.wrongPassword);
    await loginPage.expectInvalidCredentials();
  });

  test('@regression empty fields show required errors', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.loginWith(data.negative.empty);
    await loginPage.expectRequiredFieldErrors();
  });

  test('@regression unknown username shows invalid credentials alert', async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.loginWith(data.negative.wrongUsername);
    await loginPage.expectInvalidCredentials();
  });
});

test('@meta first test asserts the framework wiring (sanity)', async ({ apiUtils }) => {
  expect(apiUtils).toBeDefined();
});
