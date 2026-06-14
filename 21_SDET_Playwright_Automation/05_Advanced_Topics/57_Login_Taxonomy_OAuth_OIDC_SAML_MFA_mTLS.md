# 57. Login Taxonomy — OAuth2 / OIDC / SAML / MFA / mTLS

**Navigation**: [← 56. Playwright Config Deep-Dive](../02_Core_Architecture/56_Playwright_Config_Deep_Dive.md) | [Index](../00_INDEX.md) | [→ 58. File Uploads & Downloads](./58_File_Uploads_Downloads.md)

---

## 5W1H

- **WHAT**: A field guide to the five auth flows you'll meet in enterprise apps — OAuth2 + PKCE, OIDC, SAML, MFA (TOTP), and mTLS — and the Playwright pattern for each.
- **WHY**: Ch 16 covered `storageState` (login once, reuse the cookies). That solves ~70% of cases. The other 30% break it — IdP redirects, MFA codes, client certs, federated SSO. This chapter is the rest of the picture.
- **WHO**: Anyone whose test suite logs in. Especially: anyone who's hit "works in incognito, fails in Playwright" — usually a SAML or OIDC quirk.
- **WHEN**: Before you wire up auth for a new app. Picking the wrong flow first means rewriting fixtures later.
- **HOW**: Read Section 2 (the taxonomy) to find your flow; jump to the matching section for the recipe; read Sections 9–10 for the worker-scoped token cache that ties it all together. Code lives in [`framework/fixtures/auth.oauth.fixture.ts`](../framework/fixtures/auth.oauth.fixture.ts) and [`framework/utilities/auth/totp.helper.ts`](../framework/utilities/auth/totp.helper.ts).

---

## 1. The honest pitch

> "We just need to log in" is the single most-underestimated sentence in automation.

A real enterprise app rarely has username + password posted to `/login`. What you actually get:

- A redirect to an Identity Provider (Okta, Azure AD, Auth0, Ping, ADFS)
- Possibly a second redirect for federation (org → IdP → upstream IdP)
- A consent screen on first run
- A TOTP / push prompt
- A client certificate prompt (banks, healthcare)
- A magic link sent by email
- A 24-hour SSO token that expires mid-test-run

`page.fill('#username', ...).fill('#password', ...).click('#login')` covers about 5% of production apps. The rest need one of the patterns below.

---

## 2. The taxonomy — pick your flow

```
                    ┌──────────────────────────────────────────┐
                    │  Where does the session token come from? │
                    └────────────────┬─────────────────────────┘
                                     │
            ┌────────────────────────┼────────────────────────┐
            ▼                        ▼                        ▼
     Username/password         IdP redirect            Cryptographic
     posted to your app       (browser bounces)          handshake
            │                        │                        │
       ┌────┴───┐              ┌─────┴──────┐                 │
       │        │              │            │                 │
   Session    Session +     OAuth2 /      SAML 2.0          mTLS /
   cookie     TOTP/MFA       OIDC                          client cert
       │        │              │            │                 │
   Ch 16:    §6:              §3, §4:      §5:               §7:
   storage   TOTP+storage     fixture +    page.fill         use.clientCertificates
   State     State            storage
                              State
```

Five flows, one decision tree. Pick the row that matches your app and follow the section.

---

## 3. OAuth2 — Authorization Code with PKCE (the interactive case)

**When you see it**: User clicks "Sign in" → browser redirects to `accounts.google.com` (or Okta, Auth0) → user enters credentials → IdP redirects back with `?code=...` → your app exchanges the code for a token.

**Why automation is hard**: The redirect chain leaves your app's domain, so cookies, CSP, and locators all change context.

### Pattern: drive the IdP UI inline

```typescript
test("login via Okta", async ({ page }) => {
  await page.goto("/"); // your app
  await page.getByRole("button", { name: "Sign in" }).click();
  // → browser is now on https://acme.okta.com/oauth2/...

  await page.fill('input[name="username"]', envConfig.okta.username);
  await page.fill('input[name="password"]', envConfig.okta.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  // → browser returns to /, with the session cookie set
  await expect(page).toHaveURL(/\/dashboard/);
});
```

**Gotchas**:

- ❌ Don't use `page.waitForURL('https://acme.okta.com/**')` — Playwright already waits for navigation on `.click()`. The explicit wait causes flake on fast IdPs.
- ✅ Use `await expect(page).toHaveURL(/dashboard/)` at the end as the **synchronization point** — the cookie is set when the redirect lands on your app.
- ❌ Don't `storageState` before the redirect lands. Same trap as Quiz 02 Q6.
- ✅ After a successful run, capture state for all subsequent tests via `setup` project.

### Pattern: skip the UI entirely (resource owner password / client credentials)

If the IdP supports the **Client Credentials** grant (machine-to-machine) or **Resource Owner Password** grant (legacy, but common in test envs), you can grab the token via a single HTTP call — no UI at all.

```typescript
// 1. Get a token directly from the IdP token endpoint
const res = await request.post(`${envConfig.okta.tokenUrl}`, {
  form: {
    grant_type: "client_credentials",
    client_id: envConfig.okta.clientId,
    client_secret: envConfig.okta.clientSecret,
    scope: "api:read api:write",
  },
});
const { access_token } = await res.json();

// 2. Inject the token into the browser before navigating
await context.addCookies([
  { name: "session", value: access_token, domain: "acme.test", path: "/" },
]);
```

This is the basis of `framework/fixtures/auth.oauth.fixture.ts` — a **worker-scoped** fixture that fetches one token per worker process, caches it, and shares it across all tests in that worker. See Section 10 for the implementation walkthrough.

### PKCE in one paragraph

PKCE (RFC 7636) adds a `code_challenge` + `code_verifier` to the Authorization Code flow so that mobile / SPA clients can use OAuth2 without a client secret. **For test automation it changes nothing about the UI flow** — the IdP screen looks identical. PKCE matters when you're calling the token endpoint directly (Client Credentials, Resource Owner Password) — you generate a random verifier, hash it, send the hash with the auth request, then send the verifier with the token request. If you're using Client Credentials (server-to-server), you skip PKCE entirely.

---

## 4. OIDC — OAuth2 + an ID token

**When you see it**: OAuth2 but the response includes an `id_token` (a signed JWT containing `sub`, `email`, `name`, etc.). Every modern enterprise IdP supports OIDC.

**Why it matters for tests**: Some apps validate the `id_token` signature against the IdP's JWKS endpoint. If you mock the token, you must also mock the JWKS (or use a real IdP — usually simpler).

**Pattern**: Identical to OAuth2 Section 3, but the token-endpoint response has an extra field:

```typescript
const { access_token, id_token } = await res.json();
// Pass id_token to the app via cookie or Authorization header, depending on your app
```

**Gotcha**: `id_token` is a JWT with a short expiry (often 1 hour). For long test runs, refresh before expiry:

```typescript
async function tokenIsExpired(jwt: string): Promise<boolean> {
  const [, payload] = jwt.split(".");
  if (!payload) return true;
  const { exp } = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
  return Date.now() / 1000 >= exp - 30; // refresh 30s before expiry
}
```

---

## 5. SAML 2.0 — the federated case

**When you see it**: Big enterprises (banks, hospitals, federal). User clicks "SSO" → app POSTs a `SAMLRequest` to the IdP → user authenticates → IdP POSTs a `SAMLResponse` back as a hidden form. No URL fragments, no JSON — just XML inside an HTML form.

**Why automation is hard**:

1. The form is auto-submitted via JavaScript on body load; you can't intercept the POST in the browser.
2. The `SAMLResponse` is signed; you can't fake it.
3. Some IdPs have **HOK (Holder-of-Key)** SAML, which adds a client cert layer on top.

### Pattern: drive the IdP UI (same as Section 3)

For most SAML apps, the IdP page is just a username/password screen. You drive it inline:

```typescript
test("SAML SSO login", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in with SSO" }).click();
  // → browser is on https://idp.corp.com/login (or ADFS, or Ping)

  await page.fill("#userNameInput", envConfig.saml.username);
  await page.fill("#passwordInput", envConfig.saml.password);
  await page.click("#submitButton");

  // SAML POST happens automatically via JS; we just wait for the landing page
  await expect(page).toHaveURL(/\/dashboard/);
});
```

### Gotcha: IdP-initiated vs SP-initiated SAML

- **SP-initiated** (above): user starts at the app, app redirects to IdP, IdP redirects back. Easy.
- **IdP-initiated**: user starts at the IdP (e.g., an Okta dashboard tile), clicks the app tile, lands on the app with no prior context. The app trusts whatever the IdP sent. **For tests, always use SP-initiated** — same end-state, fewer moving parts.

### Gotcha: the `RelayState` parameter

Some apps put the post-login URL in `RelayState`. If you mis-encode it, you land on the wrong page after SSO. Don't manually construct SAML URLs — let the app generate them.

---

## 6. MFA — TOTP automation

**When you see it**: After username/password, the app asks for a 6-digit code from Google Authenticator / Authy / Microsoft Authenticator.

**The misconception**: "MFA is impossible to automate." Wrong — TOTP (RFC 6238) is a deterministic function of `(secret, timestamp)`. If you have the secret (the seed used to generate the QR code at enrollment), you can generate the same code the authenticator app would.

**The right answer**: Provision a test user whose MFA seed is checked into your secrets manager. Use [`otplib`](https://github.com/yeojz/otplib) to generate the code.

```typescript
// framework/utilities/auth/totp.helper.ts
import { authenticator } from "otplib";

export function generateTotp(secret: string): string {
  return authenticator.generate(secret);
}
```

```typescript
// In your test
import { generateTotp } from "../../utilities/auth/totp.helper";

await page.fill("#username", envConfig.mfa.username);
await page.fill("#password", envConfig.mfa.password);
await page.click("#login");

const code = generateTotp(envConfig.mfa.totpSecret); // 6-digit string
await page.fill("#mfaCode", code);
await page.click("#verify");
```

**Critical timing window**: TOTP codes change every 30 seconds. If your test grabs the code at second 29 and types it at second 31, the IdP rejects it. The `otplib` library exposes `authenticator.timeRemaining()` — if it's < 5 seconds, wait for the next window:

```typescript
import { authenticator } from "otplib";

function generateFreshTotp(secret: string): string {
  if (authenticator.timeRemaining() < 5) {
    // Wait for the next 30-second window
    return new Promise<string>((resolve) => {
      setTimeout(
        () => resolve(authenticator.generate(secret)),
        (authenticator.timeRemaining() + 1) * 1000,
      );
    }) as unknown as string;
  }
  return authenticator.generate(secret);
}
```

(The helper in `framework/utilities/auth/totp.helper.ts` ships both: the simple version and the window-aware version.)

### When NOT to automate MFA

- **Push notifications** (Duo, Microsoft Authenticator push). You can't fake those — they require a real device decision. Either disable push for the test user, or use a real test device with the IdP's mock-push feature.
- **WebAuthn / Passkeys**. Playwright's `addInitScript` can stub `navigator.credentials`, but it's fragile. Provision a test user with WebAuthn disabled instead.

---

## 7. mTLS — client certificates

**When you see it**: Banking, healthcare, government. The browser presents a `.p12`/`.pfx` cert during the TLS handshake, before any HTTP traffic happens.

**The wrong way**: Trying to handle the cert in JS or via DevTools. The cert is presented at the TLS layer; the page doesn't see it.

**The right way**: Configure Playwright's `use.clientCertificates`:

```typescript
// playwright.config.ts
use: {
  clientCertificates: [
    {
      origin: 'https://secure.bank.test',
      certPath: './certs/test-client.crt',
      keyPath: './certs/test-client.key',
      passphrase: process.env.CERT_PASSPHRASE,
    },
  ],
}
```

**Gotchas**:

- ❌ Don't commit `.p12`/`.pfx` files to git. Even test certs.
- ✅ Pull from a secret store at CI runtime; write to a temp directory before the run starts.
- ❌ Don't reuse a long-lived cert across all tests. If it expires mid-CI run, every test fails.
- ✅ Rotate test certs in CI, or use a CI-only test CA and short-lived (1-week) certs.

### What about `forceHTTPS / ignoreHTTPSErrors`?

That's a separate setting (Section 11 of Ch 56). It lets you accept **self-signed** server certs in dev environments. Orthogonal to mTLS — you can need both.

---

## 8. The `storageState` chain — putting it all together

The five flows above all end with the **same state**: a browser context with the cookies / localStorage entries needed for an authenticated session. The most expensive part is _getting there_. Don't repeat it per test.

Reuse pattern (also covered in Ch 16, expanded here):

1. A `setup` project runs once: drives the auth flow, calls `context.storageState({ path: 'auth/admin.json' })`.
2. The main project loads that state via `use.storageState: 'auth/admin.json'`.
3. Tests start authenticated; no UI login, no IdP hop, no TOTP.

For multi-role suites, capture one state per role:

```
auth/
├── admin.json
├── manager.json
├── readonly-user.json
└── customer.json
```

Each role gets its own project (or each test gets its own `test.use({ storageState })`).

---

## 9. The worker-scoped token cache pattern

For **API tests** (no UI), `storageState` doesn't apply — there's no browser context. Instead, cache the access token at **worker scope**:

```typescript
// framework/fixtures/auth.oauth.fixture.ts (see file for the typed version)
import { test as base, request as playwrightRequest } from "@playwright/test";

type OAuthFixtures = { oauthToken: string };

export const test = base.extend<{}, OAuthFixtures>({
  oauthToken: [
    async ({}, use) => {
      const ctx = await playwrightRequest.newContext();
      try {
        const response = await ctx.post(process.env.OAUTH_TOKEN_URL!, {
          form: {
            grant_type: "client_credentials",
            client_id: process.env.OAUTH_CLIENT_ID!,
            client_secret: process.env.OAUTH_CLIENT_SECRET!,
          },
        });
        if (!response.ok()) {
          throw new Error(`OAuth token endpoint returned ${response.status()}`);
        }
        const body = (await response.json()) as { access_token: string };
        await use(body.access_token);
      } finally {
        await ctx.dispose();
      }
    },
    { scope: "worker" },
  ],
});

export { expect } from "@playwright/test";
```

With `scope: 'worker'`, the token endpoint is hit **once per worker**, regardless of how many tests share that worker. If you have 4 workers and 100 tests, you fetch 4 tokens instead of 100. (Same savings calculation as Quiz 02 Q8.)

### When the token expires mid-run

`scope: 'worker'` runs once when the worker starts. If your test run takes longer than the token's lifetime, **the token expires and every test starts failing 401**. Two fixes:

1. **Refresh on use** — wrap the token in a function that re-fetches if `exp - now < 30s`. Trade simplicity for resilience.
2. **Short test runs** — if your full suite finishes in < 30 min and tokens last 1 h, you're fine. This is the framework's default assumption.

---

## 10. Anti-patterns — the auth hall of shame

❌ **Hardcoded credentials in spec files**

```typescript
await page.fill("#username", "admin@acme.com");
await page.fill("#password", "Admin123!");
```

Anyone with read access to the repo has prod creds. **Fix**: env vars + secrets manager (Ch 51).

❌ **Logging in inside `beforeEach`**

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.fill("#username", envConfig.username);
  await page.fill("#password", envConfig.password);
  await page.click("#login");
});
```

60 tests × 3 s login = 3 minutes of overhead per CI run. **Fix**: `storageState` + `setup` project (Section 8).

❌ **Sharing one user across all parallel workers**

```typescript
// Worker 1 logs in as admin → cookie set
// Worker 2 logs in as admin → IdP invalidates worker 1's session
// Worker 1's next request: 401
```

Some IdPs (Okta, Azure AD) enforce single-session-per-user. **Fix**: account pool with file locking — see `framework/fixtures/auth.fixture.ts` for the existing OrangeHRM-style implementation.

❌ **TOTP secret in plain text in `.env`**

```
TOTP_SECRET=JBSWY3DPEHPK3PXP
```

That's a permanent backdoor into the test user's account. **Fix**: short-lived secrets from Vault / Doppler / GitHub Actions secrets; rotated weekly.

❌ **Not handling token expiry**

```typescript
oauthToken: [async ({}, use) => {
  const token = await fetchToken();
  await use(token);  // good for 1 hour... what if the suite takes 2 hours?
}, { scope: 'worker' }],
```

**Fix**: Either time-box the run < token lifetime, or wrap the token in a function that re-fetches near expiry.

❌ **Mocking the IdP for production tests**

```typescript
await page.route("**/oauth/token", (route) =>
  route.fulfill({ body: '{"access_token":"fake"}' }),
);
```

You're now testing that your app accepts a fake token. **Fix**: Mock the IdP only for unit/integration tests of the auth middleware itself. For end-to-end suites, use a real test IdP tenant.

---

## 11. The framework's auth code, mapped

| File                                                                                            | Purpose                                                                                |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [`framework/fixtures/auth.fixture.ts`](../framework/fixtures/auth.fixture.ts)                   | OrangeHRM account pool — file-locked, parallel-safe. Pattern: Section 10 sharing rule. |
| [`framework/fixtures/auth.oauth.fixture.ts`](../framework/fixtures/auth.oauth.fixture.ts)       | OAuth2 Client Credentials token cache. Pattern: Section 9.                             |
| [`framework/utilities/auth/totp.helper.ts`](../framework/utilities/auth/totp.helper.ts)         | TOTP generation (window-aware). Pattern: Section 6.                                    |
| [`framework/tests/auth-demo/oauth.api.spec.ts`](../framework/tests/auth-demo/oauth.api.spec.ts) | Smoke test for the OAuth fixture. Skips if `OAUTH_*` env vars aren't set.              |

### Running the OAuth smoke test

```bash
# In framework/.env (or your shell):
export OAUTH_TOKEN_URL=https://your-idp.example.com/oauth/token
export OAUTH_CLIENT_ID=test-client
export OAUTH_CLIENT_SECRET=<secret>

# Then:
npx playwright test --project=api tests/auth-demo
```

If the env vars aren't set, the test skips with a clear message — no failures, no false signals.

---

## 12. Practice

<details>
<summary><strong>Practice 1 — Pick the flow</strong></summary>

Match the description to the flow:

1. "Our SSO redirects through Okta, then back to our app. The app stores a session cookie."
2. "We need to test the API as a service principal — no human in the loop."
3. "Banking app, every request requires a `.p12` client cert."
4. "The login screen asks for a 6-digit code after the password."
5. "ADFS-based SSO, the IdP POSTs a signed XML to our app."

**Answers**:

1. OAuth2 / OIDC Authorization Code (Section 3 or 4)
2. OAuth2 Client Credentials (Section 3, second pattern) — and the worker-scoped fixture (Section 9)
3. mTLS (Section 7)
4. MFA TOTP (Section 6)
5. SAML 2.0 (Section 5)
</details>

<details>
<summary><strong>Practice 2 — Why worker scope?</strong></summary>

The OAuth fixture is `scope: 'worker'`. What goes wrong if you change it to test scope?

**Answer**: Every test fetches a new token. With 4 workers and 100 tests, that's 100 token endpoint calls instead of 4 — 25× the IdP load and the latency. Worse, most IdPs rate-limit (Okta: 100 token requests/minute by default), so you start hitting 429s and the suite goes red intermittently.

</details>

<details>
<summary><strong>Practice 3 — Spot the bug</strong></summary>

```typescript
test("TOTP login", async ({ page }) => {
  await page.fill("#username", user);
  await page.fill("#password", pass);
  await page.click("#login");

  const code = generateTotp(secret);
  await page.fill("#mfaCode", code); // 28 seconds later
  await page.click("#verify");
});
```

**Bug**: There's a race condition — `code` is generated at second 2 (of the 30s window), then typed at second 30 (window has rolled over). The IdP rejects the now-stale code.

**Fix**: Generate the code _immediately before_ typing it:

```typescript
// Type other fields first, then generate at the last moment
await page.click("#login");
await page.waitForSelector("#mfaCode");
const code = generateTotp(secret);
await page.fill("#mfaCode", code);
await page.click("#verify");
```

…or use the window-aware version that waits if `timeRemaining() < 5s`.

</details>

<details>
<summary><strong>Practice 4 — Multi-role storageState</strong></summary>

You need to run the same E2E flow as both `admin` and `readonly-user` against the same test suite. Sketch the `playwright.config.ts` `projects[]` for this.

**Answer**:

```typescript
projects: [
  { name: "admin-setup", testMatch: /admin\.setup\.ts/ },
  { name: "readonly-setup", testMatch: /readonly\.setup\.ts/ },
  {
    name: "admin",
    dependencies: ["admin-setup"],
    use: { ...devices["Desktop Chrome"], storageState: "auth/admin.json" },
  },
  {
    name: "readonly",
    dependencies: ["readonly-setup"],
    use: { ...devices["Desktop Chrome"], storageState: "auth/readonly.json" },
  },
];
```

Run all: `npx playwright test`. Run admin only: `--project=admin`.

</details>

---

## What's next

- **Ch 16** — `storageState` chaining (the foundation this chapter extends).
- **Ch 25** — CI/CD integration (where the IdP secrets actually live).
- **Ch 28** — Test data lifecycle (the data-side counterpart to auth).
- **Ch 51** — Secrets management (Doppler, Vault, GitHub Actions — where TOTP seeds and OAuth secrets belong).
- **Ch 56** — Playwright config (the `use.clientCertificates`, `use.storageState`, and project-dependency fields).
- **Ch 58** — File uploads & downloads (the next sharp-edge feature).

**Navigation**: [← 56. Playwright Config Deep-Dive](../02_Core_Architecture/56_Playwright_Config_Deep_Dive.md) | [Index](../00_INDEX.md) | [→ 58. File Uploads & Downloads](./58_File_Uploads_Downloads.md)
