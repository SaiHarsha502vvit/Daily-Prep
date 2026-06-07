import { test, expect } from '../../fixtures/auth.oauth.fixture';

const oauthConfigured = Boolean(
  process.env.OAUTH_TOKEN_URL && process.env.OAUTH_CLIENT_ID && process.env.OAUTH_CLIENT_SECRET
);

test.describe('OAuth fixture smoke', () => {
  test.skip(
    !oauthConfigured,
    'OAuth not configured. Set OAUTH_TOKEN_URL, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET to run.'
  );

  test('oauthToken is non-empty and worker-cached @auth', async ({ oauthToken }) => {
    expect(oauthToken).toBeTruthy();
    expect(typeof oauthToken).toBe('string');
    expect(oauthToken.length).toBeGreaterThan(10);
  });
});
