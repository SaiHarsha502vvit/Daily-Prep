# Auth

> The authoritative reference for authentication in Playwright tests. Every flow Playwright is expected to handle in enterprise apps — storageState, OAuth 2.0 (all grant types), OIDC, SAML 2.0, MFA (TOTP/SMS/push/biometric), mTLS, cookie sessions, JWT — with internal mechanics, security trade-offs, real production failures, and the worker-scoped patterns that make them performant.

---

## Table of contents

1. [The authentication landscape](#1-the-authentication-landscape)
2. [The decision tree](#2-the-decision-tree)
3. [`storageState` — the file format, lifecycle, multi-role](#3-storagestate)
4. [OAuth 2.0 fundamentals](#4-oauth-20-fundamentals)
5. [Client Credentials grant](#5-client-credentials-grant)
6. [Authorization Code + PKCE](#6-authorization-code--pkce)
7. [Resource Owner Password Credentials (deprecated)](#7-rop-credentials)
8. [Device Code grant](#8-device-code-grant)
9. [Refresh token rotation](#9-refresh-token-rotation)
10. [OIDC — what it adds over OAuth](#10-oidc)
11. [ID token validation](#11-id-token-validation)
12. [SAML 2.0 fundamentals](#12-saml-20-fundamentals)
13. [SP-initiated vs IdP-initiated](#13-sp-initiated-vs-idp-initiated)
14. [MFA TOTP (RFC 6238)](#14-mfa-totp)
15. [MFA SMS, push, biometric — what's possible](#15-mfa-non-totp)
16. [mTLS — client certificates](#16-mtls)
17. [Cookie-based auth (legacy)](#17-cookie-based-auth)
18. [JWT in localStorage — the anti-pattern](#18-jwt-in-localstorage)
19. [Worker-scoped token caches](#19-worker-scoped-token-caches)
20. [Cross-domain SSO](#20-cross-domain-sso)
21. [Common production failures](#21-common-production-failures)
22. [Anti-pattern catalog](#22-anti-pattern-catalog)

---

## 1. The authentication landscape

Every test that needs auth has to choose:

- **What credentials?** Username/password, OAuth token, SAML assertion, mTLS cert, anonymous?
- **Where do credentials live?** `.env`, secrets manager, file system, hardcoded (never)?
- **How is the session represented?** Cookies, JWT in localStorage, bearer token in headers?
- **How is the test set up?** UI login per test, pre-authenticated storageState, programmatic token fetch?
- **How is parallel safety preserved?** One auth state per worker, shared state, account pool?

The "right" answer depends on what the app does, what the IdP expects, and what's cheapest to maintain.

### 1.1 The cost spectrum

| Approach                       | Setup time per test | Cost per worker                   | Cost per CI run |
| ------------------------------ | ------------------- | --------------------------------- | --------------- |
| UI login every test            | 5–15 s              | N/A                               | 5 s × tests     |
| Pre-authenticated storageState | 0 s                 | 5–15 s (setup project, once)      | 5–15 s          |
| OAuth client credentials       | 0 s                 | 100–500 ms (worker fixture, once) | 100–500 ms      |
| storageState + token refresh   | 0 s                 | 0 + occasional refresh            | minimal         |

For a 200-test suite: UI login adds 16+ minutes; storageState adds 15 seconds.

### 1.2 The security spectrum

| Pattern                                        | Credential exposure                                    |
| ---------------------------------------------- | ------------------------------------------------------ |
| Credentials in `.env`, gitignored              | Local-only — usually fine for dev creds                |
| Credentials in CI secrets, injected at runtime | Standard — secrets in vault, runner reads at job start |
| Credentials in code                            | NEVER — even rotation can't recover from this          |
| Credentials in CI logs (via `console.log`)     | Treat as compromised; rotate                           |
| Hardcoded in test data files committed to repo | NEVER                                                  |
| `.p12` / `.pfx` files in repo                  | NEVER, even for test certs                             |

---

## 2. The decision tree

```
Does the app use SSO with an external IdP?
├── No  → storageState  (default — 80% of cases)
│
└── Yes
    │
    Is the IdP a machine-to-machine service (no human user)?
    ├── Yes → OAuth Client Credentials grant
    │
    Is the IdP a SAML 2.0 IdP?
    ├── Yes → SAML SP-initiated → storageState
    │
    Is the IdP an OAuth/OIDC IdP (Auth0, Okta, Azure AD, Google)?
    ├── Yes
    │   ├── Does the user have MFA enabled?
    │   │   ├── No  → OAuth Auth Code + PKCE → storageState
    │   │   └── Yes
    │   │       ├── TOTP? → drive IdP UI + otplib + storageState
    │   │       ├── SMS?  → use a test-only account without SMS, OR API-side bypass
    │   │       ├── Push? → use a service account, OR API-side bypass
    │   │       └── Biometric? → use a service account
    │   │
    │   └── Is JIT user provisioning enabled?
    │       └── Yes → first login provisions; subsequent logins fast-path
    │
    Is the API mTLS-gated?
    └── Yes → configure `use.clientCertificates`
```

---

## 3. `storageState`

### 3.1 What is `storageState`

A serialised snapshot of:

- **Cookies** — all cookies set on the browser context
- **localStorage** — for every origin the context has visited
- **sessionStorage** — same (since v1.43; earlier versions captured only localStorage)
- **IndexedDB** — opt-in since v1.45 (with `indexedDB: true`)

Stored as JSON. Can be loaded into any new browser context to restore that authenticated state.

### 3.2 The file format

```json
{
  "cookies": [
    {
      "name": "session_id",
      "value": "abc123...",
      "domain": ".example.com",
      "path": "/",
      "expires": 1735689600,
      "httpOnly": true,
      "secure": true,
      "sameSite": "Strict"
    }
  ],
  "origins": [
    {
      "origin": "https://app.example.com",
      "localStorage": [
        { "name": "access_token", "value": "eyJhbGc..." },
        { "name": "user_preferences", "value": "{\"theme\":\"dark\"}" }
      ],
      "sessionStorage": [
        { "name": "session_correlation_id", "value": "9f8e7d..." }
      ]
    }
  ]
}
```

The file is human-readable JSON. You can manually inspect or edit it for debugging.

### 3.3 Writing storageState

```typescript
// tests/global.setup.ts
import { test as setup, expect } from "@playwright/test";

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Log in" }).click();

  // CRITICAL — wait for navigation BEFORE saving
  await page.waitForURL(/\/(dashboard|home)/, { timeout: 30_000 });

  // Optional but useful — verify the session by hitting an authenticated endpoint
  const me = await page.request.get("/api/users/me");
  expect(me.ok()).toBeTruthy();

  await page.context().storageState({ path: "auth-states/admin.json" });
});
```

### 3.4 Loading storageState

In the config:

```typescript
projects: [
  { name: 'setup', testMatch: /global\.setup\.ts$/ },
  {
    name: 'chromium',
    dependencies: ['setup'],
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'auth-states/admin.json',
    },
  },
],
```

Or inline in a test:

```typescript
test("authenticated test", async ({ browser }) => {
  const context = await browser.newContext({
    storageState: "auth-states/admin.json",
  });
  const page = await context.newPage();
  // page starts authenticated
  await context.close();
});
```

### 3.5 Multi-role storageState

```typescript
// global.setup.ts — runs multiple setup tests in parallel
setup("authenticate as admin", async ({ page }) => {
  await loginAs(page, "admin");
  await page.context().storageState({ path: "auth-states/admin.json" });
});

setup("authenticate as user", async ({ page }) => {
  await loginAs(page, "user");
  await page.context().storageState({ path: "auth-states/user.json" });
});

setup("authenticate as read-only", async ({ page }) => {
  await loginAs(page, "readonly");
  await page.context().storageState({ path: "auth-states/readonly.json" });
});
```

```typescript
// playwright.config.ts
projects: [
  { name: 'setup', testMatch: /global\.setup\.ts$/ },
  {
    name: 'admin-tests',
    dependencies: ['setup'],
    use: { storageState: 'auth-states/admin.json' },
    grep: /@admin/,
  },
  {
    name: 'user-tests',
    dependencies: ['setup'],
    use: { storageState: 'auth-states/user.json' },
    grep: /@user/,
  },
],
```

### 3.6 The "saved too early" pitfall

```typescript
// ❌ WRONG — saves PRE-LOGIN state
await page.locator("#loginBtn").click();
await page.context().storageState({ path: "auth-states/admin.json" });
// Click resolves before cookies arrive. File contains no session.
```

```typescript
// ✅ CORRECT — wait for post-login signal
await page.locator("#loginBtn").click();
await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
await page.context().storageState({ path: "auth-states/admin.json" });
```

Symptom of the bug: `admin.json` exists, has cookies, but tests fail with 401. Open the file — likely the only cookies are tracking cookies, not the session token.

### 3.7 storageState expiry

Session cookies eventually expire. When you write storageState today and use it next week, tests will start failing with 401.

Strategies:

| Strategy                                              | When to use                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| Always regenerate at start of run (via setup project) | Standard — `dependencies: ['setup']` ensures fresh state every run |
| Cache for 1 hour, regenerate on expiry                | When setup is slow (5+ seconds) and your CI runs frequently        |
| Commit storageState to repo                           | NEVER — cookies are secrets                                        |

The setup project pattern always regenerates. That's the right default.

### 3.8 Per-run isolation

For parallel CI runs (e.g., one per PR), separate storageState files prevent collision:

```typescript
storageState: `auth-states/${process.env.GITHUB_RUN_ID}-admin.json`,
```

Each run writes its own file. Setting `outputDir` to the run-specific path means the files auto-clean when the CI job completes.

### 3.9 Filtering — what gets saved

By default storageState saves cookies + localStorage + sessionStorage. To omit specific items:

```typescript
await page.context().storageState({
  path: "auth-states/admin.json",
  indexedDB: false, // default — IndexedDB not saved
});
```

To save IndexedDB (since v1.45):

```typescript
await page.context().storageState({
  path: "auth-states/admin.json",
  indexedDB: true, // captures all IndexedDB databases
});
```

IndexedDB can be large (MB or more for offline-capable apps). Only enable if your app actually depends on indexed data for session.

### 3.10 Programmatic storageState (no file)

```typescript
// Get as object
const state = await page.context().storageState();

// Apply to a new context
const newContext = await browser.newContext({ storageState: state });
```

Useful for in-memory state passing between contexts within a single test (e.g., cloning a session for a side-by-side comparison).

---

## 4. OAuth 2.0 fundamentals

OAuth 2.0 is a delegation framework defined by RFC 6749. Four parties:

| Role                 | Who it is                                                                      |
| -------------------- | ------------------------------------------------------------------------------ |
| Resource Owner       | The user                                                                       |
| Resource Server      | The API the user wants to access                                               |
| Client               | The app trying to act on behalf of the user (your SPA, mobile app, or service) |
| Authorization Server | The IdP that issues tokens (Auth0, Okta, Azure AD)                             |

The output of any OAuth flow is an **access token** — a string the client sends to the resource server (in the `Authorization: Bearer ...` header) to access user resources.

### 4.1 The four grant types still in use

| Grant                       | Who uses it                               | Has user UI? | Browser involved?          |
| --------------------------- | ----------------------------------------- | ------------ | -------------------------- |
| Authorization Code (+ PKCE) | SPAs, mobile apps, native apps with users | Yes          | Yes                        |
| Client Credentials          | Backend services with no user             | No           | No                         |
| Refresh Token               | Any flow that supports refresh            | No           | No                         |
| Device Code                 | TVs, IoT devices with no keyboard         | Yes          | Yes (on a separate device) |

Two more grants exist but are deprecated:

| Grant                               | Status                    | Why deprecated                                              |
| ----------------------------------- | ------------------------- | ----------------------------------------------------------- |
| Resource Owner Password Credentials | ❌ Don't use for new code | Defeats SSO; requires sharing passwords with the client     |
| Implicit                            | ❌ Don't use              | Tokens returned in URL fragment; vulnerable to interception |

### 4.2 Token types

| Token         | Purpose                                | Format             | Validation                                          |
| ------------- | -------------------------------------- | ------------------ | --------------------------------------------------- |
| Access token  | Authorize API calls                    | Opaque OR JWT      | Validated by resource server (or via introspection) |
| Refresh token | Get a new access token without re-auth | Opaque, long-lived | Validated only by authorization server              |
| ID token      | Authenticate user identity (OIDC)      | Always JWT         | Validated by client                                 |

### 4.3 Token lifetime norms

| Token                    | Typical lifetime               |
| ------------------------ | ------------------------------ |
| Access token (web)       | 5–60 minutes                   |
| Access token (mobile)    | 30 minutes–24 hours            |
| Refresh token (sliding)  | Days to months, rotates on use |
| Refresh token (absolute) | Days to months, fixed lifetime |
| ID token                 | Equal to access token, usually |

In Playwright tests, access tokens often outlive an entire test run. Refresh is rarely needed at test scale.

### 4.4 The bearer token convention

Once you have an access token:

```typescript
await page.request.get("/api/citations", {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

`Bearer` is the standard scheme (RFC 6750). Some legacy APIs use `Token` or just the token itself — match what the API expects.

---

## 5. Client Credentials grant

For service-to-service auth where no human user is involved.

### 5.1 The flow

```
   Client → Auth Server
   POST /oauth/token
     grant_type=client_credentials
     client_id=<id>
     client_secret=<secret>
     scope=<optional>

   Auth Server → Client
   {
     "access_token": "eyJ...",
     "token_type": "Bearer",
     "expires_in": 3600,
     "scope": "..."
   }
```

That's it — no UI, no redirects, no user interaction.

### 5.2 Implementation as a fixture

```typescript
// fixtures/auth.oauth.fixture.ts
import { test as base, request as playwrightRequest } from "@playwright/test";

interface OAuthFixtures {
  oauthToken: string;
}

export const test = base.extend<NonNullable<unknown>, OAuthFixtures>({
  oauthToken: [
    async ({}, use) => {
      const tokenUrl = process.env.OAUTH_TOKEN_URL!;
      const ctx = await playwrightRequest.newContext();
      try {
        const response = await ctx.post(tokenUrl, {
          form: {
            grant_type: "client_credentials",
            client_id: process.env.OAUTH_CLIENT_ID!,
            client_secret: process.env.OAUTH_CLIENT_SECRET!,
            scope: "api:read api:write",
          },
        });
        if (!response.ok()) {
          throw new Error(
            `Token endpoint returned ${response.status()}: ${await response.text()}`,
          );
        }
        const body = await response.json();
        await use(body.access_token);
      } finally {
        await ctx.dispose();
      }
    },
    { scope: "worker" },
  ],
});
```

Why worker scope:

- Each call is 200–500 ms.
- The token is opaque and not personalised — safe to share.
- A 100-test suite with worker-scope: 4 fetches (4 workers). With test-scope: 100 fetches. Saves 30+ seconds.

### 5.3 Tests using the token

```typescript
test("GET /citations", async ({ request, oauthToken }) => {
  const response = await request.get("/api/citations", {
    headers: { Authorization: `Bearer ${oauthToken}` },
  });
  expect(response.ok()).toBeTruthy();
});
```

Or, integrate into your API client:

```typescript
class CitationsApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly token: string,
  ) {}

  async list(): Promise<Citation[]> {
    const r = await this.request.get("/citations", {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    return r.json();
  }
}

// Fixture composes both:
const test = base.extend({
  citationsClient: async ({ request, oauthToken }, use) => {
    await use(new CitationsApiClient(request, oauthToken));
  },
});
```

### 5.4 Secret management

Client secrets are SECRETS. Never:

- Commit to repo
- Print to logs (even at debug level)
- Hardcode in tests

Always:

- Store in CI platform secrets (GitHub Actions secrets, Azure DevOps variable groups)
- Inject as env vars at runtime
- Rotate quarterly

### 5.5 Test-only OAuth client

Production OAuth clients usually have:

- Restricted scopes
- IP allowlists
- Tight rate limits

Create a SEPARATE test-only OAuth client:

- Limited scopes
- Test environment isolation
- Higher rate limits for CI
- Distinct client ID for log filtering

---

## 6. Authorization Code + PKCE

For human-user flows where the IdP redirects through a browser.

### 6.1 The flow (with PKCE)

```
1. Client generates code_verifier (random 43-128 char string)
   code_challenge = SHA256(code_verifier), base64url-encoded

2. Client → Auth Server (in browser)
   GET /authorize
     response_type=code
     client_id=<id>
     redirect_uri=<callback>
     code_challenge=<challenge>
     code_challenge_method=S256
     scope=openid profile email
     state=<random-csrf-token>

3. Auth Server shows login UI, user authenticates.

4. Auth Server → Client (redirect to callback URL)
   GET /callback?code=<auth_code>&state=<csrf-token>

5. Client → Auth Server (via HTTPS, server-side)
   POST /oauth/token
     grant_type=authorization_code
     code=<auth_code>
     redirect_uri=<callback>
     client_id=<id>
     code_verifier=<verifier>      ← server checks SHA256(verifier) == challenge

6. Auth Server → Client
   { access_token, refresh_token, id_token, expires_in }
```

### 6.2 What PKCE adds

PKCE (Proof Key for Code Exchange, RFC 7636) protects against authorization code interception:

- Without PKCE: a malicious app that intercepts the redirect can exchange the code for tokens.
- With PKCE: the malicious app doesn't have the `code_verifier`, so the token exchange fails.

PKCE is required for all public clients (SPAs, mobile apps) since OAuth 2.1.

### 6.3 Playwright's role

In a real test, you typically don't implement PKCE yourself — the SPA does it. Your test just:

1. Drives the browser to the SPA's login page.
2. The SPA generates PKCE values and redirects to the IdP.
3. Your test fills in the IdP login form.
4. The IdP redirects back to the SPA.
5. The SPA completes the token exchange.
6. The SPA stores the token in localStorage or cookies.
7. Your test saves storageState.

```typescript
setup("OAuth login", async ({ page }) => {
  await page.goto("https://app.example.com/login");

  // App redirects to IdP — Playwright follows
  await page.waitForURL(/auth\.example\.com/);

  // Fill in IdP UI
  await page.getByLabel("Email").fill(process.env.USER_EMAIL!);
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Password").fill(process.env.USER_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();

  // IdP redirects back to the SPA
  await page.waitForURL(/app\.example\.com/);

  // The SPA completes the token exchange in the background.
  // Verify the session is established before saving.
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();

  await page.context().storageState({ path: "auth-states/user.json" });
});
```

### 6.4 Reading the access token from localStorage

```typescript
const accessToken = await page.evaluate(() => {
  return localStorage.getItem("access_token");
  // OR — for OIDC apps using oidc-client-js:
  // const data = JSON.parse(localStorage.getItem('oidc.user:...'));
  // return data.access_token;
});
```

Useful if you want to call APIs directly (bypassing the UI) once logged in.

### 6.5 The implicit grant trap

Some legacy apps still use the implicit grant (`response_type=token`). Tokens come back in the URL fragment (`#access_token=...`).

If you're testing such an app:

- It works in Playwright (the browser handles fragments).
- Push back on the dev team to migrate to Auth Code + PKCE.
- Tokens in fragments leak to browser history and analytics scripts.

---

## 7. Resource Owner Password Credentials (deprecated)

The "give me your username and password so I can fetch a token" grant.

```
POST /oauth/token
  grant_type=password
  username=<user>
  password=<pass>
  client_id=<id>
  client_secret=<secret>
```

### 7.1 Why deprecated

- Defeats SSO — the client must handle passwords directly.
- Defeats MFA — there's no UI for the second factor.
- Defeats password manager autofill.
- OAuth 2.1 explicitly removes it.

### 7.2 When you'll still see it

- Legacy enterprise apps that haven't migrated to PKCE.
- Test-only auth endpoints that DOs (developers) created to bypass UI for automation.

If you need to use it for tests, treat it as a test-only convenience and ensure production apps don't expose this grant.

### 7.3 Implementation

```typescript
const test = base.extend<{}, { token: string }>({
  token: [
    async ({}, use) => {
      const ctx = await playwrightRequest.newContext();
      const r = await ctx.post(`${process.env.OAUTH_URL}/token`, {
        form: {
          grant_type: "password",
          username: process.env.TEST_USERNAME!,
          password: process.env.TEST_PASSWORD!,
          client_id: process.env.OAUTH_CLIENT_ID!,
        },
      });
      const body = await r.json();
      await use(body.access_token);
      await ctx.dispose();
    },
    { scope: "worker" },
  ],
});
```

---

## 8. Device Code grant

For TVs, IoT devices, CLI tools — anything without a keyboard or browser.

### 8.1 The flow

```
1. Device → Auth Server
   POST /oauth/device/code
     client_id=<id>
     scope=<scopes>

2. Auth Server → Device
   {
     "device_code": "...",
     "user_code": "WDJB-MJHT",
     "verification_uri": "https://example.com/device",
     "expires_in": 1800,
     "interval": 5
   }

3. Device shows user_code to user, instructs them to visit verification_uri.

4. User goes to another device (phone, laptop), enters user_code, authenticates.

5. Device polls Auth Server every `interval` seconds:
   POST /oauth/token
     grant_type=urn:ietf:params:oauth:grant-type:device_code
     device_code=...
     client_id=<id>

6. Once user completes auth, polling returns:
   { access_token, refresh_token, ... }
```

### 8.2 Testing device code flow

Playwright can drive both sides:

```typescript
test("device code authentication", async ({ context }) => {
  // Side 1 — the "device" requesting auth
  const deviceContext = await context.browser()!.newContext();
  const devicePage = await deviceContext.newPage();
  await devicePage.goto("https://device-app.example.com/login");
  const userCode = await devicePage.getByTestId("user-code").textContent();

  // Side 2 — the user "approving" on another device
  const userPage = await context.newPage();
  await userPage.goto(`https://example.com/device`);
  await userPage.getByLabel("Code").fill(userCode!);
  await userPage.getByRole("button", { name: "Continue" }).click();
  await userPage.getByLabel("Email").fill(process.env.USER_EMAIL!);
  await userPage.getByLabel("Password").fill(process.env.USER_PASSWORD!);
  await userPage.getByRole("button", { name: "Sign in" }).click();
  await userPage.getByRole("button", { name: "Approve" }).click();

  // The device should now be authenticated
  await expect(
    devicePage.getByRole("heading", { name: "Welcome" }),
  ).toBeVisible();
});
```

---

## 9. Refresh token rotation

When access tokens expire, clients use refresh tokens to get new ones without re-authenticating the user.

### 9.1 The flow

```
Client → Auth Server
  POST /oauth/token
    grant_type=refresh_token
    refresh_token=<old_refresh>
    client_id=<id>

Auth Server → Client
  {
    "access_token": "<new>",
    "refresh_token": "<new>",      ← rotated! old refresh is invalidated
    "expires_in": 3600
  }
```

### 9.2 Rotation policies

| Policy          | Behaviour                                                                |
| --------------- | ------------------------------------------------------------------------ |
| Static refresh  | Same refresh token returned every time                                   |
| Rotation        | New refresh token issued each use; old becomes invalid                   |
| Reuse detection | If old refresh is used twice, ALL tokens revoked (suspected token theft) |

Modern IdPs (Auth0, Okta) use rotation + reuse detection. Always handle the rotation in your fixture:

```typescript
let cachedToken: { access: string; refresh: string; expiresAt: number } | null = null;

oauthToken: [async ({}, use) => {
  if (!cachedToken || Date.now() > cachedToken.expiresAt - 30_000) {
    if (cachedToken) {
      // Refresh
      const r = await postToken({ grant_type: 'refresh_token', refresh_token: cachedToken.refresh });
      cachedToken = { access: r.access_token, refresh: r.refresh_token, expiresAt: Date.now() + r.expires_in * 1000 };
    } else {
      // First fetch
      const r = await postToken({ grant_type: 'client_credentials', client_id, client_secret });
      cachedToken = { access: r.access_token, refresh: r.refresh_token, expiresAt: Date.now() + r.expires_in * 1000 };
    }
  }
  await use(cachedToken.access);
}, { scope: 'worker' }],
```

The 30-second buffer accounts for clock skew between your test runner and the IdP.

---

## 10. OIDC — what it adds over OAuth

OpenID Connect (OIDC) is OAuth 2.0 + a layer for AUTHENTICATION (not just authorization).

### 10.1 What OIDC adds

| Feature                                        | OAuth 2.0 | OIDC                           |
| ---------------------------------------------- | --------- | ------------------------------ |
| Access token (API authorization)               | ✅        | ✅                             |
| Refresh token                                  | ✅        | ✅                             |
| ID token (user identity)                       | ❌        | ✅ — a JWT with user claims    |
| `/userinfo` endpoint                           | ❌        | ✅ — returns user profile data |
| Discovery (`.well-known/openid-configuration`) | ❌        | ✅                             |
| Standard scopes (`openid`, `profile`, `email`) | ❌        | ✅                             |

### 10.2 The ID token

The ID token is always a JWT and contains claims about the user:

```json
{
  "iss": "https://example.auth0.com/",
  "sub": "auth0|abc123",
  "aud": "your-client-id",
  "exp": 1735693200,
  "iat": 1735689600,
  "auth_time": 1735689500,
  "nonce": "random-string",
  "email": "user@example.com",
  "email_verified": true,
  "name": "Alice Smith",
  "given_name": "Alice",
  "family_name": "Smith",
  "picture": "https://...",
  "roles": ["admin"]
}
```

### 10.3 Why the access token isn't enough

Access tokens are opaque (or JWTs not meant for the client to read). Their purpose is to authorize API calls.

ID tokens are explicitly for the client to read user identity. Don't use the access token to identify the user — use the ID token.

---

## 11. ID token validation

If your tests need to verify the user's identity claims:

```typescript
import { decodeJwt } from "jose"; // npm i jose

const idToken = await page.evaluate(() => {
  return localStorage.getItem("id_token");
});

const claims = decodeJwt(idToken!) as {
  sub: string;
  email: string;
  roles: string[];
  exp: number;
  iat: number;
};

expect(claims.email).toBe(process.env.USER_EMAIL);
expect(claims.roles).toContain("admin");
expect(claims.exp * 1000).toBeGreaterThan(Date.now());
```

### 11.1 Verifying the signature (for security tests)

For SECURITY tests that need to verify the token signature:

```typescript
import { jwtVerify, createRemoteJWKSet } from "jose";

const JWKS = createRemoteJWKSet(
  new URL("https://example.auth0.com/.well-known/jwks.json"),
);

const { payload } = await jwtVerify(idToken, JWKS, {
  issuer: "https://example.auth0.com/",
  audience: "your-client-id",
});
```

This fetches the IdP's public keys, verifies the signature, and validates `iss`/`aud`. Use for tests that ensure the app is properly validating tokens.

### 11.2 Reading claims from cookies

If the ID token is in a cookie:

```typescript
const cookies = await page.context().cookies();
const idTokenCookie = cookies.find((c) => c.name === "id_token");
const claims = decodeJwt(idTokenCookie!.value);
```

---

## 12. SAML 2.0 fundamentals

SAML is older, XML-based, common in enterprise (Active Directory Federation Services, OneLogin, Ping).

### 12.1 The three parties

| Role                    | Who                                     |
| ----------------------- | --------------------------------------- |
| Identity Provider (IdP) | The auth server (AD FS, Okta, OneLogin) |
| Service Provider (SP)   | The app the user wants to access        |
| User                    | The user                                |

### 12.2 The SAML assertion

The output of SAML auth is a SAMLResponse — an XML document signed by the IdP, containing claims about the user.

```xml
<saml:Assertion>
  <saml:Subject>
    <saml:NameID>alice@example.com</saml:NameID>
  </saml:Subject>
  <saml:AttributeStatement>
    <saml:Attribute Name="email">
      <saml:AttributeValue>alice@example.com</saml:AttributeValue>
    </saml:Attribute>
    <saml:Attribute Name="role">
      <saml:AttributeValue>admin</saml:AttributeValue>
    </saml:Attribute>
  </saml:AttributeStatement>
</saml:Assertion>
```

The SP validates the signature and extracts claims to establish a session.

### 12.3 Bindings — how the assertion travels

| Binding       | Method                                                                    |
| ------------- | ------------------------------------------------------------------------- |
| HTTP-POST     | IdP returns an HTML form that auto-submits POST with SAMLResponse         |
| HTTP-Redirect | IdP redirects with SAMLResponse in URL (smaller assertions only)          |
| HTTP-Artifact | IdP sends an artifact ID; SP calls back-channel to get the real assertion |

Almost all modern integrations use HTTP-POST.

---

## 13. SP-initiated vs IdP-initiated

### 13.1 SP-initiated (most common)

```
1. User visits the SP (https://app.example.com)
2. SP redirects to IdP with SAMLRequest + RelayState
3. User authenticates at IdP
4. IdP auto-POSTs SAMLResponse + RelayState to SP's ACS URL
5. SP validates, creates session, redirects to RelayState (or default)
```

```typescript
setup("SAML login (SP-initiated)", async ({ page }) => {
  await page.goto("https://app.example.com");
  // SP redirects to IdP
  await page.waitForURL(/idp\.corp\.example\.com\/saml/);

  await page.getByLabel("Username").fill(process.env.SAML_USER!);
  await page.getByLabel("Password").fill(process.env.SAML_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();

  // IdP auto-POSTs back to SP. Wait for SP.
  await page.waitForURL(/app\.example\.com/);

  // Verify session
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();

  await page.context().storageState({ path: "auth-states/saml.json" });
});
```

### 13.2 IdP-initiated

User starts from the IdP's dashboard ("MyApps") and clicks an app icon.

```
1. User clicks app icon at IdP portal
2. IdP POSTs SAMLResponse to SP's ACS URL
3. SP validates, creates session
```

No SAMLRequest. The SP must accept unsolicited responses — many security-conscious SPs disable this.

```typescript
setup("SAML login (IdP-initiated)", async ({ page }) => {
  await page.goto("https://portal.idp.example.com");

  await page.getByLabel("Username").fill(process.env.SAML_USER!);
  await page.getByLabel("Password").fill(process.env.SAML_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Click the app tile
  await page.getByRole("link", { name: "My CRM App" }).click();

  // The IdP POSTs to the SP
  await page.waitForURL(/app\.example\.com/);
  await page.context().storageState({ path: "auth-states/saml.json" });
});
```

### 13.3 The RelayState pitfall

`RelayState` is an opaque string the SP includes in the SAMLRequest. The IdP returns it unchanged. The SP uses it to redirect to the originally-requested page after auth.

Common bug: SP encodes the URL in RelayState (e.g., `RelayState=/admin/users`). After auth, user lands at `/admin/users`. If RelayState is lost or empty, user lands at the default page (often `/`).

For tests, always validate the final URL after `waitForURL`:

```typescript
await page.waitForURL(/app\.example\.com/);
await expect(page).toHaveURL(/\/dashboard$/); // ensure we're at the right page
```

### 13.4 SAML cookie vs JWT

The session created after SAML is almost always a server-side session cookie, not a JWT. The SAML assertion is consumed once and discarded; the session lives in the SP's session store.

`storageState` captures the session cookie. That's all you need.

---

## 14. MFA TOTP

Time-based One-Time Password (RFC 6238). The 6-digit codes from Google Authenticator, Authy, 1Password.

### 14.1 How TOTP works

1. The IdP generates a random secret (Base32 string, ~20 bytes).
2. The user scans a QR code containing the secret with their authenticator app.
3. Both sides have the secret.
4. Code = HOTP(secret, floor(currentTime / 30)).
5. Codes rotate every 30 seconds.

### 14.2 Generating TOTP in tests with `otplib`

```typescript
// utilities/auth/totp.helper.ts
import { authenticator } from "otplib";

const REFRESH_WINDOW_SECONDS = 5;

export function generateTotp(secret: string): string {
  return authenticator.generate(secret);
}

export async function generateFreshTotp(secret: string): Promise<string> {
  // Avoid the boundary — if <5s remaining, wait for next window
  const remaining = authenticator.timeRemaining();
  if (remaining < REFRESH_WINDOW_SECONDS) {
    await new Promise((r) => setTimeout(r, (remaining + 1) * 1000));
  }
  return authenticator.generate(secret);
}

export function timeRemainingMs(): number {
  return authenticator.timeRemaining() * 1000;
}
```

### 14.3 Why `generateFreshTotp`

```
Time: ───────────── 30s window ─────────────|───── new window ─────|

If you generate at t=28s, the code is valid for 2 more seconds.
The IdP might receive the code at t=30.1s (network latency) — past validity.

The fix: if remaining < 5s, wait for the new window.
```

The IdP usually accepts the previous code too (1-window tolerance), so this is conservative. Without the buffer, ~5% of tests in CI will fail under load.

### 14.4 Driving the MFA UI

```typescript
import { generateFreshTotp } from "@/utilities/auth/totp.helper";

setup("OAuth login + MFA", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.USER_EMAIL!);
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Password").fill(process.env.USER_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();

  // MFA prompt
  await page.waitForURL(/\/mfa/);
  const code = await generateFreshTotp(process.env.USER_TOTP_SECRET!);
  await page.getByLabel("Authentication code").fill(code);
  await page.getByRole("button", { name: "Verify" }).click();

  await page.waitForURL(/\/dashboard/);
  await page.context().storageState({ path: "auth-states/user.json" });
});
```

### 14.5 TOTP secrets in CI

Treat TOTP secrets the same as passwords:

| Storage                                   | OK for tests?                          |
| ----------------------------------------- | -------------------------------------- |
| Plain `.env` committed to repo            | ❌ NEVER                               |
| `.env` gitignored, local only             | ⚠️ OK for dev, not for shared accounts |
| CI secrets vault (GitHub, Doppler, Vault) | ✅ Standard                            |
| Generated per-test via API                | ✅ Ideal but rarely possible           |

For a shared service account, the secret should be in a vault. The CI job pulls it at start. Local dev mirrors the same env var.

### 14.6 Rotation

TOTP secrets should rotate periodically:

- Service accounts: monthly to quarterly.
- Real user accounts used for tests: don't use real users; use service accounts.
- When a contractor leaves: rotate immediately.

Rotation breaks tests that have cached secrets locally. Notify the team.

---

## 15. MFA non-TOTP

### 15.1 SMS-based MFA

The IdP texts a code to a phone number.

Strategies:

| Strategy                                                          | Setup                                    | Reliability      |
| ----------------------------------------------------------------- | ---------------------------------------- | ---------------- |
| Use test-only account WITHOUT MFA enabled                         | Easiest; talk to IdP admin               | High             |
| Use an SMS testing service (Twilio test sandbox, etc.)            | Complex; service-specific                | Medium           |
| API-side bypass: an admin endpoint that issues a token without UI | Requires IdP cooperation                 | High once set up |
| MailHog-style local SMS gateway                                   | Only if you run the SMS gateway yourself | High             |

For most teams, the answer is: SMS tests use service accounts without MFA, or the test bypasses login entirely via storageState pre-seeded by the IdP team.

### 15.2 Push notification MFA

The IdP sends a push to the user's phone; user taps "Approve."

Playwright cannot interact with iOS/Android. Options:

- Service account with push MFA disabled.
- IdP-side "test mode" that auto-approves pushes for tagged accounts.
- A physical test device with a script that auto-taps Approve (very fragile).

### 15.3 Biometric (TouchID, FaceID, Windows Hello)

Same problem as push — Playwright cannot drive OS-level biometric prompts. Use service accounts that bypass biometrics.

### 15.4 WebAuthn / passkeys

WebAuthn is a browser API. Playwright has `context.addInitScript` and CDP support for `WebAuthn.addVirtualAuthenticator`. You can register a virtual authenticator and respond to WebAuthn challenges in tests:

```typescript
const client = await context.newCDPSession(page);
await client.send("WebAuthn.enable");
await client.send("WebAuthn.addVirtualAuthenticator", {
  options: {
    protocol: "ctap2",
    transport: "internal",
    hasResidentKey: true,
    hasUserVerification: true,
    isUserVerified: true,
  },
});

// Now WebAuthn flows work without a real authenticator
```

CDP-only — Chromium and Edge. WebKit and Firefox don't support this CDP method.

---

## 16. mTLS

Mutual TLS — both client and server present certificates.

### 16.1 Configuration

```typescript
// playwright.config.ts
use: {
  clientCertificates: [
    {
      origin: 'https://api.example.com',
      certPath: process.env.MTLS_CERT_PATH,
      keyPath: process.env.MTLS_KEY_PATH,
      passphrase: process.env.MTLS_PASSPHRASE,
    },
  ],
},
```

Or with PKCS#12 (a single .p12/.pfx file):

```typescript
clientCertificates: [
  {
    origin: 'https://api.example.com',
    pfxPath: process.env.MTLS_PFX_PATH,
    passphrase: process.env.MTLS_PFX_PASSPHRASE,
  },
],
```

### 16.2 Origin matching

`origin` is a strict origin string. The cert is presented ONLY for requests to that exact origin. Different ports or subdomains need separate entries.

```typescript
clientCertificates: [
  { origin: 'https://api.example.com',       pfxPath: '...' },
  { origin: 'https://admin-api.example.com', pfxPath: '...' },
  { origin: 'https://api.example.com:8443',  pfxPath: '...' },
],
```

### 16.3 Cert lifecycle

Test certs have expiry dates. Failures look like:

```
SSL_ERROR_BAD_CERT_DOMAIN (peer's certificate has an invalid hostname)
ERR_CERT_DATE_INVALID
ERR_BAD_SSL_CLIENT_AUTH_CERT
```

Renew before expiry. Automate:

```yaml
# .github/workflows/check-mtls-cert.yml
on:
  schedule:
    - cron: "0 0 * * 0" # weekly
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: |
          DAYS_LEFT=$(openssl x509 -in cert.pem -noout -enddate | sed 's/notAfter=//' | xargs -I {} date -d "{}" +%s)
          NOW=$(date +%s)
          REMAINING=$(( (DAYS_LEFT - NOW) / 86400 ))
          if [ $REMAINING -lt 30 ]; then
            echo "Cert expires in $REMAINING days — renew!"
            exit 1
          fi
```

### 16.4 Cert in CI

Never commit `.p12` / `.pfx` files. CI workflow:

```yaml
- name: Write client cert from secret
  run: |
    echo "${{ secrets.MTLS_CERT_BASE64 }}" | base64 -d > /tmp/client.p12
    chmod 600 /tmp/client.p12
  env:
    MTLS_PFX_PATH: /tmp/client.p12
    MTLS_PFX_PASSPHRASE: ${{ secrets.MTLS_PASSPHRASE }}
```

Store the cert base64-encoded in CI secrets.

---

## 17. Cookie-based auth (legacy)

The old-school approach: server validates credentials, sets a session cookie, browser sends it on every request.

### 17.1 The flow

```
1. POST /login {username, password}
2. Server validates, creates server-side session, sets cookie
3. Browser sends cookie on every subsequent request
4. Server looks up session by cookie value
```

### 17.2 Testing

```typescript
setup("legacy cookie login", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#user", process.env.USER!);
  await page.fill("#pass", process.env.PASS!);
  await page.click("#submit");
  await page.waitForURL(/\/home/);

  // Cookie is now set. Save state.
  await page.context().storageState({ path: "auth.json" });
});
```

storageState handles cookie-based sessions perfectly.

### 17.3 API-only cookie auth

For tests that don't need a browser:

```typescript
test("API session via cookie", async ({ request }) => {
  // Login — server sets cookie
  await request.post("/login", {
    form: { username: "admin", password: "admin" },
  });

  // Subsequent requests carry the cookie automatically (request maintains cookie jar)
  const me = await request.get("/api/me");
  expect(me.ok()).toBeTruthy();
});
```

The `request` fixture maintains cookies across calls within a test.

---

## 18. JWT in localStorage — the anti-pattern

A controversial pattern: SPA stores the access token in `localStorage` for cross-tab sharing.

### 18.1 Why it's an anti-pattern (security)

- `localStorage` is accessible to any JavaScript on the page.
- An XSS vulnerability anywhere on the site can exfiltrate the token.
- HttpOnly cookies are inaccessible to JS — XSS can't read them.

The OWASP recommendation: tokens in HttpOnly cookies, NEVER localStorage.

### 18.2 Why apps still do it

- Single-page apps wanting easy cross-tab sync.
- Mobile webview frameworks with quirky cookie handling.
- Stateless backends that don't want to manage cookies.

### 18.3 Testing localStorage tokens

If the app under test uses this pattern:

```typescript
const token = await page.evaluate(() => localStorage.getItem("access_token"));

// Use the token directly
await request.get("/api/users/me", {
  headers: { Authorization: `Bearer ${token}` },
});
```

storageState captures localStorage too, so this still works for session restoration.

### 18.4 Security test perspective

Write a security test asserting your app does NOT use localStorage for tokens:

```typescript
test("access token is not in localStorage", async ({ page }) => {
  await loginViaUi(page);
  const items = await page.evaluate(() =>
    Object.fromEntries(Object.entries(localStorage)),
  );
  for (const value of Object.values(items)) {
    expect(value).not.toMatch(/^eyJ/); // JWT prefix
  }
});
```

---

## 19. Worker-scoped token caches

For OAuth-based tests, fetching a token once per worker is essential.

### 19.1 Naive — re-fetch per test

```typescript
oauthToken: async ({}, use) => {
  const token = await fetchToken();
  await use(token);
},
// Test scope. 200 tests × 500ms fetch = 100 seconds wasted.
```

### 19.2 Worker scope — one fetch per worker

```typescript
oauthToken: [async ({}, use) => {
  const token = await fetchToken();
  await use(token);
}, { scope: 'worker' }],
// 4 workers × 500ms = 2 seconds total.
```

### 19.3 Worker scope + expiry handling

```typescript
let cached: { token: string; expiresAt: number } | null = null;

oauthToken: [async ({}, use) => {
  const now = Date.now();
  if (!cached || now > cached.expiresAt - 30_000) {
    const result = await fetchToken();
    cached = { token: result.access_token, expiresAt: now + result.expires_in * 1000 };
  }
  await use(cached.token);
}, { scope: 'worker' }],
```

For long test runs (10+ minutes) with short-lived tokens (5 minutes), this refreshes mid-run.

### 19.4 Cross-worker caching (file-based)

If even per-worker fetches are too many, cache across workers via a file:

```typescript
import * as fs from 'node:fs/promises';
import lockfile from 'proper-lockfile';

oauthToken: [async ({}, use) => {
  const cachePath = '.cache/oauth-token.json';
  const release = await lockfile.lock(cachePath, { retries: 50, realpath: false });
  try {
    let token: string;
    try {
      const cached = JSON.parse(await fs.readFile(cachePath, 'utf8'));
      if (cached.expiresAt - 30_000 > Date.now()) {
        token = cached.token;
      } else {
        const fresh = await fetchToken();
        await fs.writeFile(cachePath, JSON.stringify({ token: fresh.access_token, expiresAt: Date.now() + fresh.expires_in * 1000 }));
        token = fresh.access_token;
      }
    } catch {
      const fresh = await fetchToken();
      await fs.writeFile(cachePath, JSON.stringify({ token: fresh.access_token, expiresAt: Date.now() + fresh.expires_in * 1000 }));
      token = fresh.access_token;
    }
    await use(token);
  } finally {
    await release();
  }
}, { scope: 'worker' }],
```

For 8 workers and a 1-second fetch, this saves 7 seconds.

### 19.5 When NOT to share tokens

- When tokens are personalised (different user per worker for parallel-mutation testing).
- When tokens have low rate-limits and sharing exceeds them.
- When tokens grant different scopes per test.

For these cases, per-worker fresh tokens are correct.

---

## 20. Cross-domain SSO

When the user logs in at IdP, the SP, and a third app, all sharing a single session.

### 20.1 The mechanics

| Mechanism                | How it works                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| Shared domain cookies    | All apps under `*.example.com` share cookies (rare due to SameSite/Secure restrictions)      |
| Federation via SAML/OIDC | Each app re-authenticates to the IdP; IdP recognises existing session, auto-issues new token |
| Token federation         | Apps exchange tokens via service-to-service flows                                            |

### 20.2 Testing cross-domain SSO

```typescript
test("cross-app SSO", async ({ context }) => {
  // App 1 — login
  const app1 = await context.newPage();
  await app1.goto("https://app1.example.com");
  await loginAt(app1, "user@example.com", "password");

  // App 2 — should be auto-logged-in (federated session)
  const app2 = await context.newPage();
  await app2.goto("https://app2.example.com");
  await expect(app2.getByRole("button", { name: "Account" })).toBeVisible();
  // NOT redirected to login — federation worked
});
```

The two pages share the same context, so cookies set by the IdP during App 1 login are available when App 2 redirects to the IdP.

### 20.3 storageState for cross-domain SSO

```typescript
// setup: login at IdP, save state
// All apps that federate to the IdP will share this session
setup('SSO login', async ({ page }) => {
  await page.goto('https://idp.example.com');
  await loginAt(page, 'user@example.com', 'password');
  await page.context().storageState({ path: 'auth-states/sso.json' });
});

// All apps use the same storageState
projects: [
  { name: 'app1', dependencies: ['setup'], use: { storageState: 'auth-states/sso.json', baseURL: 'https://app1.example.com' } },
  { name: 'app2', dependencies: ['setup'], use: { storageState: 'auth-states/sso.json', baseURL: 'https://app2.example.com' } },
],
```

Each app's first navigation redirects to the IdP, which sees the federation cookie and immediately redirects back with a fresh token.

---

## 21. Common production failures

### Failure 1 — `storageState` saved before cookies arrived

**Symptom:** `auth.json` has empty cookies array.

**Cause:** Saved right after `click()` without waiting for navigation.

**Fix:** `await page.waitForURL(/dashboard/);` before saving.

### Failure 2 — TOTP code rejected as "invalid"

**Symptom:** Generated code is rejected; manual entry of the same code works.

**Cause:** Code generated at end of window; expired by IdP receive time.

**Fix:** Use `generateFreshTotp` with the 5-second buffer.

### Failure 3 — OAuth refresh token reuse detected; all sessions revoked

**Symptom:** Tests start passing then fail with "session revoked" after CI runs in parallel.

**Cause:** Two CI runs share a cached refresh token. Both use it; second use triggers reuse detection.

**Fix:** Don't cache refresh tokens across CI runs. Per-run cache (file in test artifacts, deleted on shutdown).

### Failure 4 — mTLS test fails with "Bad certificate" intermittently

**Symptom:** Cert works locally; CI sometimes fails with bad cert error.

**Cause:** Cert path resolution wrong in CI environment, or cert not chmodded 600.

**Fix:** Use absolute paths; verify file permissions in CI logs.

### Failure 5 — SAML test passes locally, fails in CI with redirect loop

**Symptom:** App ↔ IdP redirect loop until timeout.

**Cause:** Cookie SameSite policy. The IdP's cookies are `SameSite=Strict`, so cross-origin redirects don't send them. Local dev uses `localhost` which has different cookie rules.

**Fix:** Set cookie policies correctly on the IdP side, or use `SameSite=Lax` for the federation cookie.

### Failure 6 — `storageState` has 100+ cookies and tests slow down

**Symptom:** Page loads are slow; trace shows huge cookie payload per request.

**Cause:** Accumulated tracking cookies from analytics during login flow.

**Fix:** After login, programmatically delete unnecessary cookies before saving state:

```typescript
await page.context().clearCookies({ domain: "analytics.example.com" });
await page.context().storageState({ path: "auth.json" });
```

### Failure 7 — Worker fixture fetched a token; later tests fail with 401

**Symptom:** First N tests pass; subsequent tests get 401.

**Cause:** Token expired mid-run. Worker fixture cached the original.

**Fix:** Expiry check + refresh in the fixture (see [§19.3](#193-worker-scope--expiry-handling)).

### Failure 8 — OAuth client_credentials returns 429 from IdP

**Symptom:** `429 Too Many Requests` from token endpoint.

**Cause:** Too many workers, each fetching token independently. IdP rate-limits the client.

**Fix:** Cross-worker file cache (see [§19.4](#194-cross-worker-caching-file-based)).

### Failure 9 — Tests pass locally with port 3000, fail in CI with port 8080

**Symptom:** Auth-related tests redirect to wrong URL in CI.

**Cause:** Hardcoded `redirect_uri` doesn't match the runtime app URL.

**Fix:** Read `APP_URL` from env; pass to OAuth fixture; use to compute redirect_uri.

### Failure 10 — IdP UI added a new "Stay signed in?" checkbox; login times out

**Symptom:** Tests that worked yesterday now hang on the IdP page.

**Cause:** IdP added a UI element your test doesn't handle.

**Fix:** Use accessible selectors (`getByRole('button', { name: /Sign in/ })`) that survive UI tweaks. Add explicit handling for the new step.

---

## 22. Anti-pattern catalog

| ❌ Anti-pattern                                                           | ✅ Fix                                                      |
| ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Logging in via UI per test                                                | Pre-authenticate in setup project, load storageState        |
| `storageState` after `click()` without wait                               | Wait for post-login URL                                     |
| Hardcoded passwords in spec files                                         | `process.env` + secrets manager                             |
| TOTP secret in committed `.env`                                           | Vault / Doppler / GitHub Actions secrets                    |
| Shared storageState across roles                                          | One file per role                                           |
| Bearer token fetched per test                                             | Worker scope + expiry check                                 |
| `Stamper.use({ accountRole: 'admin' })` then forgetting to update fixture | Always read options from destructured fixture arg           |
| Token in `console.log` for debugging                                      | Use the trace viewer instead                                |
| Plain HTTP for OAuth requests                                             | TLS only                                                    |
| Test-only `/oauth/token` endpoint exposed in production                   | Strict gateway routing                                      |
| `.p12` files in repo                                                      | Base64 in CI secret, write to disk at runtime               |
| Reusing production credentials in tests                                   | Dedicated service accounts                                  |
| Driving SAML/OIDC UI when client_credentials would work                   | Machine-to-machine flow                                     |
| TOTP without time-window buffer                                           | `generateFreshTotp` waits if <5s remaining                  |
| `extraHTTPHeaders` with token in config root                              | Token might be undefined at config-load time — set per-test |
| Reading auth claims from access token directly                            | Use ID token for identity, access token for authz           |
| ID token validation without signature check (in security tests)           | Use `jwtVerify` with the IdP's JWKS                         |
| Sharing test accounts across many tests without account pool              | File-locked pool ensures parallel safety                    |
| `await page.goto('/login')` before `storageState` loaded                  | storageState only takes effect on context creation          |

---

## Cross-references

- Fixtures (worker scope, options, account pool): [`./04_fixtures.md`](./04_fixtures.md)
- Setup project pattern: [`./02_config.md`](./02_config.md#7-projects)
- Secrets management: [`../deep_dives/security.md`](../deep_dives/security.md)
- Auth-related practice problems: Q6 in [`../08_Practice_And_Quizzes/quiz_02_solutions/`](../08_Practice_And_Quizzes/quiz_02_solutions/)
- Real auth fixtures in code: [`../framework/fixtures/auth.fixture.ts`](../framework/fixtures/auth.fixture.ts) (account pool), [`../framework/fixtures/auth.oauth.fixture.ts`](../framework/fixtures/auth.oauth.fixture.ts) (OAuth client credentials), [`../framework/utilities/auth/totp.helper.ts`](../framework/utilities/auth/totp.helper.ts) (TOTP)
