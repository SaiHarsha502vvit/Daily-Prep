import { test } from '../../fixtures/orangehrm.fixture';
import { loadTestData } from '../../utilities/data/data.loader';

interface NegativeCredentials {
  negative: {
    wrongPassword: { username: string; password: string };
    wrongUsername: { username: string; password: string };
    empty: { username: string; password: string };
  };
}

interface TestData {
  lastLoginStatus: 'success' | 'failure' | 'idle';
}

const testData: TestData = { lastLoginStatus: 'idle' };

test.describe('OrangeHRM Login', () => {
  const credentials = loadTestData<NegativeCredentials>('orangehrm/credentials');

  test('@smoke valid credentials land on dashboard', async ({
    loginPage,
    dashboardPage,
    pooledAccount,
  }) => {
    await loginPage.navigate();
    await loginPage.loginWith({
      username: pooledAccount.username,
      password: pooledAccount.password,
    });
    await dashboardPage.expectLoaded();
    testData.lastLoginStatus = 'success';
  });

  test('@regression wrong password shows invalid credentials alert', async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.loginWith(credentials.negative.wrongPassword);
    await loginPage.expectInvalidCredentials();
    testData.lastLoginStatus = 'failure';
  });

  test('@regression unknown username shows invalid credentials alert', async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.loginWith(credentials.negative.wrongUsername);
    await loginPage.expectInvalidCredentials();
    testData.lastLoginStatus = 'failure';
  });

  test('@regression empty fields show required errors', async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.loginWith(credentials.negative.empty);
    await loginPage.expectRequiredFieldErrors();
    testData.lastLoginStatus = 'failure';
  });

  test('@smoke logout redirects to login', async ({ loginPage, dashboardPage, pooledAccount }) => {
    await loginPage.navigate();
    await loginPage.loginWith({
      username: pooledAccount.username,
      password: pooledAccount.password,
    });
    await dashboardPage.expectLoaded();
    await dashboardPage.header.logout();
    await dashboardPage.header.expectLoggedOut();
    testData.lastLoginStatus = 'idle';
  });
});
