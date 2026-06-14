import { test as base, request as playwrightRequest } from '@playwright/test';

type OAuthFixtures = { oauthToken: string };

interface OAuthTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

function requireOAuthEnv(): {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
} {
  const tokenUrl = process.env.OAUTH_TOKEN_URL;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  if (!tokenUrl || !clientId || !clientSecret) {
    throw new Error(
      '[auth.oauth.fixture] Missing OAuth env. Set OAUTH_TOKEN_URL, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET.',
    );
  }
  return { tokenUrl, clientId, clientSecret, scope: process.env.OAUTH_SCOPE };
}

export const test = base.extend<NonNullable<unknown>, OAuthFixtures>({
  oauthToken: [
    async ({}, use) => {
      const { tokenUrl, clientId, clientSecret, scope } = requireOAuthEnv();

      const ctx = await playwrightRequest.newContext();
      try {
        const form: Record<string, string> = {
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        };
        if (scope) form.scope = scope;

        const response = await ctx.post(tokenUrl, { form });
        if (!response.ok()) {
          throw new Error(
            `[auth.oauth.fixture] Token endpoint returned ${response.status()} ${response.statusText()}`,
          );
        }
        const body = (await response.json()) as OAuthTokenResponse;
        if (!body.access_token) {
          throw new Error('[auth.oauth.fixture] Token response missing access_token.');
        }
        await use(body.access_token);
      } finally {
        await ctx.dispose();
      }
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
