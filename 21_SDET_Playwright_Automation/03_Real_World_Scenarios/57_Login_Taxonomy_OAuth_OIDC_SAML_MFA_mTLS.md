# 57. Login Taxonomy — OAuth2 / OIDC / SAML / MFA / mTLS

**Navigation**: [← 56. Playwright Config Deep-Dive](../01_Foundations/56_Playwright_Config_Deep_Dive.md) | [Index](../00_INDEX.md) | [→ 58. File Uploads & Downloads](./58_File_Uploads_Downloads.md)

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

Filling a username field, filling a password field and clicking one login button (`locator.fill()`, `locator.fill()`, `locator.click()`) covers about 5% of production apps. The rest need one of the patterns below.

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
   storage   TOTP+storage     fixture +    inline UI         use.clientCertificates
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

  await page.locator('input[name="username"]').fill(envConfig.okta.username);
  await page.locator('input[name="password"]').fill(envConfig.okta.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  // → browser returns to /, with the session cookie set
  await expect(page).toHaveURL(/\/dashboard/);
});
```

**Gotchas**:

- ⚠️ **`waitForURL` on the IdP page is usually redundant, and sometimes harmful.** Measured on Playwright 1.64.1 against a local app + IdP on two origins (302 chain, JS redirect, silent-SSO, slow-asset cases):

  | Situation | `click()` alone | Adding `page.waitForURL('<idp>/**')` |
  | --- | --- | --- |
  | Plain 302 redirect chain (app → IdP, or IdP → callback → dashboard) | Returns only after the **final** document commits (`page.url()` was already `/dashboard` after a 1.7 s chain) | Passes instantly — adds nothing |
  | Next step is `getByLabel(...).fill()` | Auto-waits for the field | Not needed |
  | **Silent SSO** (IdP already has a session, so it 302s straight back and the IdP page never renders) | Fine — lands on the dashboard | **Times out**: the IdP URL is never the committed URL |
  | IdP page with a slow sub-resource (3 s image) | `fill()` ran after 84 ms | **3.1 s** — `waitForURL` defaults to `waitUntil: 'load'`; `{ waitUntil: 'commit' }` takes 96 ms |
  | **Redirect started by page JavaScript** (`setTimeout(() => location.href = …)`, or after a `fetch`) | Returns *before* the navigation starts (`page.url()` still the app) | **This is where you need a wait** |
  | Same-URL round trip (POST → 303 → same URL) | Waits for the new document to commit | `waitForURL(/form$/)` passes immediately — it can't tell old from new document |

  So: never wait for an intermediate IdP URL you don't strictly need; wait for the **state you actually need** (`toHaveURL` on the landing page, or a landing-page element). Use `waitForURL` only for a JS-initiated redirect where the next step is *not* itself an auto-waiting locator action, and then prefer `{ waitUntil: 'commit' }` for third-party pages you don't control. Intermediate URLs that exist only inside a 302 chain (`/callback?code=…`) are never observable as a committed URL at all.
- ✅ Use `await expect(page).toHaveURL(/dashboard/)` at the end as the **synchronization point** — the cookie is set when the redirect lands on your app. To assert *what the app sent to the IdP* (state, nonce, PKCE), observe the request instead: see "Asserting the authorize request" below.
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

> **Which grant to choose.** Client Credentials is the supported machine-to-machine grant. The Resource Owner Password grant is a legacy shortcut that the current security BCP forbids: *"The resource owner password credentials grant MUST NOT be used"* ([RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html) §2.4, Jan 2025, BCP 240). Many test tenants still allow it, but treat it as a convenience that can disappear when the tenant is hardened. Also note the cookie in the snippet above is **app-specific** — it only works if your app reads a session cookie holding the raw access token. For most apps you'd instead put the token in an `Authorization` header (API tests) or seed whatever storage the SPA's auth library reads.

### PKCE — what it is, and what a test can say about it

PKCE ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636.html)) protects the **Authorization Code** grant against a stolen authorization code. The client invents a random `code_verifier`, sends only its hash (`code_challenge = BASE64URL(SHA256(verifier))`, `code_challenge_method=S256`) on the browser redirect to `/authorize`, then proves it knows the verifier when it redeems the code at `/token`. RFC 9700 §2.1.1: public clients **MUST** use PKCE; for confidential clients it is RECOMMENDED. It does **not** apply to Client Credentials or Resource Owner Password (no authorization code exists), so an API-only token fixture never needs it. And for a UI test it changes nothing about what you type into the IdP screen — your test *drives* the flow but the app generates and holds the verifier.

What a test **can** do is verify the app/IdP honour the contract. This helper reproduces S256 and is checked against the **RFC 7636 Appendix B test vector** (verifier `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk` → challenge `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`; the Node one-liner `createHash("sha256").update(v).digest("base64url")` reproduces it exactly):

```typescript
import { createHash, randomBytes } from "node:crypto";

export function challengeFor(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url"); // 43 chars; RFC 7636 §4.1 allows 43-128
  return { verifier, challenge: challengeFor(verifier) };
}
```

### Asserting the authorize request

You can't read the verifier (it lives in the app), but you can see exactly what the browser sends to the IdP. Register the wait **before** the click that triggers it:

```typescript
test("app sends a PKCE + state + nonce authorize request", async ({ page }) => {
  await page.goto("/");
  const authorize = page.waitForRequest((r) => r.url().startsWith(`${idpOrigin}/authorize`));
  await page.getByRole("link", { name: "Sign in" }).click();

  const q = new URL((await authorize).url()).searchParams;
  expect(q.get("code_challenge_method")).toBe("S256");           // not "plain"
  expect(q.get("code_challenge")).toMatch(/^[A-Za-z0-9_-]{43}$/); // SHA-256 -> 43 base64url chars
  expect(q.get("state")).toBeTruthy();                            // CSRF protection on the redirect
  expect(q.get("nonce")).toBeTruthy();                            // replay protection for the id_token (OIDC)

  await page.getByLabel("Username").fill(user);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});
```

And two server-side negatives you can run through `request` against a test IdP (verified against a local IdP that implements the check): redeeming a code with a **wrong `code_verifier`** returns `400 {"error":"invalid_grant"}`, and a **second redemption of the same code is rejected even with the right verifier** (codes are single-use). Run on 1.64.1 with a local IdP + relying party that does the real S256 comparison, RS256 `id_token` signing and nonce check; the four tests (vector, UI flow, wrong verifier, missing PKCE) all pass.

---

## 4. OIDC — OAuth2 + an ID token

**When you see it**: OAuth2 but the response includes an `id_token` (a signed JWT containing `sub`, `email`, `name`, etc.). Every modern enterprise IdP supports OIDC.

**Why it matters for tests**: The app (the *relying party*) validates the `id_token`: signature against the IdP's JWKS, plus `iss`, `aud`, `exp`, and the `nonce` it sent in the authorize request. Two consequences:

- A forged or hand-edited token fails the signature check, so "mock the token" means standing up an IdP that signs with a key the app trusts — not editing a JWT.
- That JWKS fetch is normally **server-to-server**, so `page.route()` can never see or mock it (route handlers only intercept requests made by the browser context, not by your backend). To control it, point the app's issuer/JWKS URL at a stub IdP in the test environment. Otherwise use a real test tenant — usually simpler.

**Pattern**: Identical to OAuth2 Section 3 for the code flow; the token-endpoint response has an extra field. (A Client Credentials response has **no** `id_token` — there is no end user to identify.)

```typescript
const { access_token, id_token } = await res.json();
// Pass id_token to the app via cookie or Authorization header, depending on your app
```

**Gotcha**: a JWT has a short expiry (often 1 hour) and is **base64url**, not base64. Keep the helper **synchronous** — an earlier draft declared it `async` with no `await`, so `if (tokenIsExpired(jwt))` (no `await`) tested a Promise, which is always truthy:

```typescript
export function jwtExpiry(jwt: string): number {
  const payload = jwt.split(".")[1];
  if (!payload) throw new Error("not a JWT");
  const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
  if (typeof exp !== "number") throw new Error("JWT has no numeric exp claim"); // missing exp must not read as "never expires"
  return exp;
}

export function isExpiringSoon(jwt: string, skewSeconds = 30): boolean {
  return Date.now() / 1000 >= jwtExpiry(jwt) - skewSeconds;
}
```

(Compiled under `strict` + `noUncheckedIndexedAccess`; run against an RS256 token from the local IdP and against a payload containing `-`/`_` characters. Decoding does **not** verify the signature — fine for reading `exp` in a test, never for trusting the token.)

---

## 5. SAML 2.0 — the federated case

**When you see it**: Big enterprises (banks, hospitals, federal). User clicks "SSO" → app POSTs a `SAMLRequest` to the IdP → user authenticates → IdP POSTs a `SAMLResponse` back as a hidden form. No URL fragments, no JSON — just XML inside an HTML form.

**Why automation is hard**:

1. The form is auto-submitted via JavaScript on body load, so `click()` on the IdP's login button returns while you're still on the IdP's interstitial page (measured: `page.url()` was still the IdP and the session cookie not yet set; both flipped a moment later). Synchronise on the landing page, not on the click.
2. The `SAMLResponse` is signed; you can't fake it.
3. Some IdPs have **HOK (Holder-of-Key)** SAML, which adds a client cert layer on top.

### Pattern: drive the IdP UI (same as Section 3)

For most SAML apps, the IdP page is just a username/password screen. You drive it inline:

```typescript
test("SAML SSO login", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in with SSO" }).click();
  // → browser is on https://idp.corp.com/login (or ADFS, or Ping)

  await page.locator("#userNameInput").fill(envConfig.saml.username);
  await page.locator("#passwordInput").fill(envConfig.saml.password);
  await page.locator("#submitButton").click();

  // SAML POST happens automatically via JS; we just wait for the landing page
  await expect(page).toHaveURL(/\/dashboard/);
});
```

### Observing both legs (you *can* see the POST)

The auto-submitted form is an ordinary browser request, so Playwright sees it. Useful when the SSO is misbehaving ("lands on the wrong page", "ACS returns 400"): decode the `SAMLRequest` the SP sent (HTTP-Redirect binding = raw DEFLATE + base64, in the URL) and read the form fields the IdP posted to the ACS (HTTP-POST binding):

```typescript
import { inflateRawSync } from "node:zlib";

test("SP-initiated SAML: inspect both legs, land on RelayState", async ({ page }) => {
  await page.goto("/");
  const idpLeg = page.waitForRequest((r) => r.url().startsWith(`${idpOrigin}/sso`) && r.method() === "GET");
  const acsLeg = page.waitForRequest((r) => r.url() === `${spOrigin}/acs` && r.method() === "POST");

  await page.getByRole("link", { name: "Sign in with SSO" }).click();

  const q = new URL((await idpLeg).url()).searchParams;
  const authnRequest = inflateRawSync(Buffer.from(q.get("SAMLRequest")!, "base64")).toString("utf8");
  expect(authnRequest).toContain(`AssertionConsumerServiceURL="${spOrigin}/acs"`);

  await page.locator("#userNameInput").fill(username);
  await page.locator("#submitButton").click();

  const post = new URLSearchParams((await acsLeg).postData() ?? "");
  expect(post.get("SAMLResponse")).toBeTruthy();              // base64 XML; the signature is the SP's job to verify
  expect(post.get("RelayState")).toBe(q.get("RelayState"));   // IdP must echo it back unchanged

  await expect(page).toHaveURL(`${spOrigin}/reports/42`);     // SP honoured RelayState
});
```

Run against a local SAML-shaped SP + IdP (redirect-binding request, auto-submitting POST form, 302 to `RelayState`) on 1.64.1; strict-TS clean. It checks the **plumbing** (what was sent, echoed and where you landed). It does not validate XML signatures — the SP does that, and you can't usefully reimplement it in a test.

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

await page.locator("#username").fill(envConfig.mfa.username);
await page.locator("#password").fill(envConfig.mfa.password);
await page.locator("#login").click();

const code = generateTotp(envConfig.mfa.totpSecret); // 6-digit string
await page.locator("#mfaCode").fill(code);
await page.locator("#verify").click();
```

**Critical timing window**: TOTP codes change every 30 seconds. If your test grabs the code at second 29 and types it at second 31, the IdP rejects it. The `otplib` library exposes `authenticator.timeRemaining()` — if it's < 5 seconds, wait for the next window:

```typescript
// framework/utilities/auth/totp.helper.ts — the real, shipped version
import { authenticator } from "otplib";

export async function generateFreshTotp(secret: string): Promise<string> {
  if (authenticator.timeRemaining() < 5) {
    // Wait for the next 30-second window, THEN generate
    const waitMs = (authenticator.timeRemaining() + 1) * 1000;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  return authenticator.generate(secret);
}

// Caller must await it:
await page
  .locator("#mfaCode")
  .fill(await generateFreshTotp(envConfig.mfa.totpSecret));
```

> **otplib version trap (checked Oct 2026).** The snippets above use the **v12** API (`authenticator`), and the framework pins `otplib@^12.0.1`. A bare `npm i otplib` now installs **v13.5.0**, a rewrite that has no `authenticator` export (`typeof authenticator === "undefined"`) and no `timeRemaining()`. The v13 equivalent is `import { generateSync } from "otplib"; generateSync({ secret })` (default strategy is TOTP; there is also an async `generate`). Verified both versions against the RFC 6238 SHA-1 vector (secret `GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ`, T=59, 8 digits → `94287082`). v13 also enforces a **minimum secret length of 16 bytes** (`SecretTooShortError`), so the 10-byte demo seed `JBSWY3DPEHPK3PXP` used in the anti-pattern below works on v12 but throws on v13. Pin the major you coded against, and compute the window yourself on v13: `30 - (Math.floor(Date.now() / 1000) % 30)` seconds remain.

> **An earlier version of this snippet was itself a flaky test.** It declared the
> helper as synchronous (`: string`) and, near a window boundary, returned a `Promise`
> forced through `as unknown as string`. The double cast silenced the type checker, so
> `locator.fill()` received a Promise object at runtime. Reproduced against the framework's
> `otplib` 12.0.1 and Playwright 1.60.0; re-checked on 1.64.1 with the locator form, which
> prints:
>
> ```
> typeof code (near window edge): object (a Promise!)
> locator.fill: value: expected string, got object
> ```
>
> The branch only fires when fewer than 5 of the window's 30 seconds remain, so the test
> failed about **1 run in 6** — a textbook intermittent failure, written to *prevent* an
> intermittent failure. The lesson generalises: `as unknown as T` is not a conversion, it
> is an instruction to stop checking, and here it hid a `Promise<string>`/`string`
> mismatch the compiler would otherwise have reported immediately. The framework file
> (`framework/utilities/auth/totp.helper.ts`) was always correct — the chapter's copy had
> drifted from it.

### When NOT to automate MFA

- **Push notifications** (Duo, Microsoft Authenticator push). You can't fake those — they require a real device decision. Either disable push for the test user, or use a real test device with the IdP's mock-push feature.
- **WebAuthn / Passkeys** — *do* automate these, but not by stubbing `navigator.credentials` with `addInitScript` (fragile, and it tests your stub rather than the ceremony). Playwright 1.61+ has a first-class virtual authenticator, `context.credentials`; Chromium additionally exposes one over CDP. See §6.1.

- **CAPTCHA on the login or sign-up form** — don't try to solve it; configure the vendor's published test keys in the test environment, and test that the *server* rejects a missing token. See [Ch68 §5](./68_Consent_Overlays_And_CAPTCHA.md).

### 6.1 WebAuthn / passkeys — virtual authenticators

Passkeys are routinely described as untestable. They aren't. There are two ways in, and
since Playwright 1.61 the first is the default choice.

**A. `context.credentials` (Playwright 1.61+, no CDP).** A virtual authenticator scoped to
a `BrowserContext`; the page runs the real `navigator.credentials.create()` / `.get()`
ceremonies. The 1.61 release notes say it works in all browsers; I could only run it on
Chromium here, so treat Firefox/WebKit as cited, not verified.

```typescript
test("register a passkey, capture it, sign in with it", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  await context.credentials.install();             // REQUIRED, before the page first touches navigator.credentials
  const page = await context.newPage();

  await page.goto(`${baseURL}/account/security`);
  await page.getByRole("button", { name: "Create a passkey" }).click();
  await expect(page.getByText("Passkey created")).toBeVisible();

  const [passkey] = await context.credentials.get({ rpId: new URL(baseURL!).hostname });
  expect(passkey?.signCount).toBeGreaterThanOrEqual(0);

  // Persist cookies + localStorage + IndexedDB + the passkey (private key included!) for later tests:
  await context.storageState({ path: "playwright/.auth/user.json", credentials: true });
});
```

Verified on 1.64.1 (Chromium, localhost): `install()` then page-driven register → `credentials.get()`
returned 1 credential whose `id` matched the one the page saw; two sign-ins reported
`signCount` 1 then 2; `storageState({ credentials: true })` produced a `credentials` key, and a
fresh context built from it signed in with the same credential (counter 3). Seeding with
`credentials.create("localhost", { signCount: 41 })` made the first assertion report 42
(`signCount` option is 1.64+). Without `install()` the page sees no authenticator
(`NotSupportedError`), and credentials seeded but not installed are invisible to the page.
The returned credential carries its **private key**: keep that JSON out of git exactly like a
`storageState` file ([Playwright auth guide](https://playwright.dev/docs/auth) says the same
about `playwright/.auth`).

**B. Chromium's CDP `WebAuthn` domain.** Still works on 1.64.1 (re-verified) and gives
knobs `context.credentials` doesn't — toggling user verification, transports, resident-key
mode — at the price of being Chromium-only. The rest of this section uses it.

Chromium exposes a `WebAuthn` domain over CDP that installs a software authenticator the
page cannot tell apart from a platform one. The page runs the real
`navigator.credentials.create()` / `.get()` ceremonies, and the test can inspect what the
authenticator stored.

```typescript
test("register and sign in with a passkey", async ({ page, context }) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  const { authenticatorId } = await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",          // a platform authenticator (Touch ID / Windows Hello)
      hasResidentKey: true,           // discoverable credentials = passkeys
      hasUserVerification: true,
      isUserVerified: true,           // the "biometric" succeeds
      automaticPresenceSimulation: true,
    },
  });

  await page.goto("/account/security");
  await page.getByRole("button", { name: "Create a passkey" }).click();
  await expect(page.getByText("Passkey created")).toBeVisible();

  const { credentials } = await cdp.send("WebAuthn.getCredentials", { authenticatorId });
  expect(credentials).toHaveLength(1);
  expect(credentials[0]!.rpId).toBe(new URL(page.url()).hostname);
});
```

Verified end to end in Chromium (Playwright 1.60.0), driving the real browser APIs
rather than a stub:

```
isSecureContext on http://localhost: true
REGISTER  -> { id: 'YTArhwf1f5VFq-GKX7msMAu1RqdO6x9lPUkuWaD_M5I', type: 'public-key' }
authenticator now holds 1 credential(s); rpId = localhost signCount = 1
LOGIN     -> { id: 'YTArhwf1f5VFq-...', hasSignature: true } | same credential: true
signCount after login = 2
UV FAIL   -> NotAllowedError: The operation either timed out or was not allowed.
NO virtual authenticator -> NotSupportedError
```

What that transcript gives you as test cases:

- **Sign-in uses the credential that was registered** (same `id`) and the authenticator's
  **signature counter increments** (1 → 2). Relying parties use the counter to detect
  cloned authenticators, so "server rejects a counter that went backwards" is a real
  security test you can now write.
- **Failed biometric**: `cdp.send("WebAuthn.setUserVerified", { authenticatorId, isUserVerified: false })`
  makes the next ceremony reject with `NotAllowedError` — assert your UI offers a fallback
  instead of hanging.
- **No authenticator at all** yields `NotSupportedError` — the "device has no passkey
  support" path, which your sign-in page must also handle.

Two constraints, both verified above. WebAuthn requires a **secure context**:
`http://localhost` qualifies, a plain-HTTP staging hostname does not. And the `WebAuthn`
domain is **CDP, so Chromium-only** — the same limit [Ch03](../01_Foundations/03_Browser_Console_Scripting.md)
documents for every CDP technique. Run passkey tests in a Chromium project only.

### 6.2 Email / SMS OTP — retrieval, and the negative paths that matter

Unlike TOTP, an emailed or texted code is generated server-side and delivered out of
band, so the test must *fetch* it. In order of preference:

| Strategy | How | Trade-off |
| --- | --- | --- |
| Test-only lookup endpoint | Backend exposes `GET /test-support/otp?user=…`, compiled out of production | Fast, deterministic; needs dev team buy-in and a guard that it never ships |
| Test inbox / test number | Mail catcher (see [Ch50](./50_Email_Service_Testing.md)) or an SMS-receiving test number, read via its API | Exercises real delivery; slower, adds a dependency |
| Fixed code for test accounts | e.g. `000000` accepted only for `@test.example` users in non-prod | Simplest; tests nothing about generation or delivery |

Retrieving the code is the easy half. The OTP bugs that reach production live in the
**negative paths**, and each is a short test:

| Scenario | Expected |
| --- | --- |
| Code used twice | Second use rejected (single-use) |
| Code after expiry | Rejected, with a "request a new code" path |
| Resend, then submit the **old** code | Old code rejected — resend must invalidate it |
| N wrong attempts | Lockout or step-up after the configured limit, not unlimited guessing |
| Resend during cooldown | Rejected (e.g. 429) by the **server**, not merely hidden by the UI |
| Code for user A submitted in user B's session | Rejected — codes are bound to the account/session |

**The `page.clock` trap on cooldown and expiry tests.** Faking time in the browser is the
obvious way to test a "Resend code in 30s" button without waiting 30 seconds. Two things
go wrong, both measured:

```
fastForward(31s): countdown shows 29, button disabled = true   [wall time 27ms]
runFor     (31s): countdown shows 0,  button disabled = false  [wall time 155ms]
```

`clock.fastForward()` "only fires due timers at most once" — Playwright's own docs liken it
to closing the laptop lid — so a countdown driven by a 1-second `setInterval` ticks once
(30 → 29) and the button stays disabled. `clock.runFor()` fires every timer in between,
which is what a countdown needs.

The second trap is the important one. With `runFor(31_000)` the button enables — and the
click still fails:

```
after clock.runFor(31s)  : disabled = false | real ms elapsed: 122
server response to resend: 429 cooldown | codes actually sent: 1
```

`page.clock` changes time **in the browser only**. The server's cooldown and the OTP's
expiry are enforced with the server's clock, which moved 122 ms. So a clock-faked test
proves the *UI* countdown works, and nothing about expiry or rate limiting. Test the
server's rules at the API level with a server-side time control (a test hook, or a short
expiry configured for the test environment), and keep `page.clock` for what it can actually
reach.

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

Each entry takes `origin` (scheme + host + optional port, exact match) plus **either** PEM (`certPath`+`keyPath`, or in-memory `cert`+`key` Buffers) **or** PKCS#12 (`pfxPath` or `pfx` Buffer), with an optional `passphrase`. Shape checked against `playwright-core@1.64.1` `types.d.ts`. It works in `use` (config), in `browser.newContext({ clientCertificates })`, and in `request.newContext(...)`; the `request` fixture presents the cert too.

**Measured against a local HTTPS server with `requestCert: true` and a private test CA (Chromium, 1.64.1):**

| Setup | Result |
| --- | --- |
| No `clientCertificates` | `page.goto` throws `net::ERR_BAD_SSL_CLIENT_AUTH_CERT`; `request.get` fails with TLS alert 116 `certificate required` |
| PEM cert + key, `ignoreHTTPSErrors: true` | Page renders; server sees the client cert's CN |
| `pfxPath` + correct `passphrase` / in-memory Buffers / `origin` with trailing `/` | Same success |
| `pfxPath` + **wrong** `passphrase` | `browser.newContext` throws `Failed to load client certificate: mac verify failure` |
| `origin` doesn't match the URL (`127.0.0.1` vs `localhost`) | No cert presented: `net::ERR_EMPTY_RESPONSE` — a confusing symptom, check `origin` first |
| Valid client cert, but the **server** cert is signed by a private CA and `ignoreHTTPSErrors` is **not** set | `goto` returns **HTTP 503** with an empty page — not a certificate error. With `clientCertificates`, Playwright's own TLS layer fails the server-trust check and the browser only sees a 503 |

The last row is the trap: "I configured the cert and now get 503" usually means *server* trust, not your client cert. Set `ignoreHTTPSErrors: true` for a private-CA server in test environments, or install the CA where Node/Chromium will trust it. These two settings are independent; an mTLS test against a private CA typically needs both.

**Gotchas**:

- ❌ Don't commit `.p12`/`.pfx` files to git. Even test certs.
- ✅ Pull from a secret store at CI runtime; write to a temp directory before the run starts.
- ❌ Don't reuse a long-lived cert across all tests. If it expires mid-CI run, every test fails.
- ✅ Rotate test certs in CI, or use a CI-only test CA and short-lived (1-week) certs.

### What about `forceHTTPS / ignoreHTTPSErrors`?

That's a separate setting (`ignoreHTTPSErrors`, in the [Ch 56 §12 field reference](../01_Foundations/56_Playwright_Config_Deep_Dive.md#12-the-full-field-reference-cheat-sheet)). It lets you accept **self-signed / private-CA** server certs in dev environments. Orthogonal to mTLS — you can need both (see the 503 row above).

---

## 8. The `storageState` chain — putting it all together

The five flows above all end with the **same state**: a browser context with the cookies / localStorage entries needed for an authenticated session. The most expensive part is _getting there_. Don't repeat it per test.

**What `storageState` does and does not capture** (measured on 1.64.1: write to `localStorage`, `sessionStorage` and an IndexedDB store, snapshot, restore into a new context):

| Store | In the snapshot? |
| --- | --- |
| Cookies (incl. `HttpOnly`) | Yes |
| `localStorage` | Yes |
| IndexedDB | **Only with `context.storageState({ indexedDB: true })`** — restored correctly when present |
| `sessionStorage` | **No** — came back `null`. Auth libraries that default to it (MSAL.js's default cache location is `sessionStorage`) need the save/restore-by-hand snippet in the [Playwright auth guide](https://playwright.dev/docs/auth), or configure the library to use `localStorage` in the test environment |
| Virtual passkeys | Only with `storageState({ credentials: true })` (1.61+, §6.1) |
| HTTP Basic/NTLM, client certs, in-memory tokens | No — configure `httpCredentials` / `clientCertificates` instead, or re-acquire the token |

(Ch 16's 5W1H lists `sessionStorage` among the captured stores; its own later note at ~line 93 says the opposite. The table above is the measured behaviour.) Treat the saved file like a password: it holds live session cookies, so keep `playwright/.auth/` (or your `auth/`) in `.gitignore`.

Reuse pattern (also covered in [Ch 16](../04_Cross_Site_Patterns_And_D365/16_CrossSite_Pattern6_StorageState_Chaining.md), expanded here):

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

With `scope: 'worker'`, the token endpoint is hit **once per worker**, regardless of how many tests share that worker. If you have 4 workers and 100 tests, you fetch 4 tokens instead of 100 — **at best**. Playwright discards a worker after a failed test and starts a fresh one, which re-runs the worker fixture. Measured: 4 tests in one worker where the third fails → the IdP served **2** token grants, and the fourth test ran in a different PID. A suite with many failures or retries fetches many more tokens than workers. (Same savings calculation as Quiz 02 Q8.)

### When the token expires mid-run

`scope: 'worker'` runs once when the worker starts. If your test run takes longer than the token's lifetime, **the token expires and every test starts failing 401**. Two fixes:

1. **Refresh on use** — expose a *getter* from the worker fixture rather than the string, and re-fetch when `exp - now < 30s`. De-duplicate concurrent refreshes with a shared in-flight promise:

   ```typescript
   type TokenResponse = { access_token: string; expires_in: number };

   export const test = base.extend<{}, { getToken: () => Promise<string> }>({
     getToken: [
       async ({}, use) => {
         let cached: { token: string; expiresAt: number } | undefined;
         let inflight: Promise<string> | undefined;

         async function fetchToken(): Promise<string> {
           const ctx = await playwrightRequest.newContext();
           try {
             const res = await ctx.post(process.env.OAUTH_TOKEN_URL!, {
               form: { grant_type: "client_credentials", client_id: process.env.OAUTH_CLIENT_ID!, client_secret: process.env.OAUTH_CLIENT_SECRET! },
             });
             if (!res.ok()) throw new Error(`token endpoint returned ${res.status()}`);
             const body = (await res.json()) as TokenResponse;
             cached = { token: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
             return body.access_token;
           } finally {
             await ctx.dispose();
           }
         }

         await use(async () => {
           if (cached && Date.now() < cached.expiresAt - 30_000) return cached.token;
           inflight ??= fetchToken().finally(() => { inflight = undefined; });
           return inflight;
         });
       },
       { scope: "worker" },
     ],
   });
   ```

   Verified with a local IdP issuing 32-second tokens: the second call reused the cache, then after 2.5 s (inside the 30 s skew) two concurrent `getToken()` calls produced exactly one new grant and returned the same new token. Compiles under `strict` + `noUncheckedIndexedAccess` + `noUnusedLocals`.
2. **Short test runs** — if your full suite finishes in < 30 min and tokens last 1 h, you're fine. This is the framework's default assumption.

---

## 10. Anti-patterns — the auth hall of shame

❌ **Hardcoded credentials in spec files**

```typescript
await page.locator("#username").fill("admin@acme.com");
await page.locator("#password").fill("Admin123!");
```

Anyone with read access to the repo has prod creds. **Fix**: env vars + secrets manager (Ch 51).

❌ **Logging in inside `beforeEach`**

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.locator("#username").fill(envConfig.username);
  await page.locator("#password").fill(envConfig.password);
  await page.locator("#login").click();
});
```

60 tests × 3 s login = 3 minutes of overhead per CI run. **Fix**: `storageState` + `setup` project (Section 8).

❌ **Sharing one user across all parallel workers**

```typescript
// Worker 1 logs in as admin → cookie set
// Worker 2 logs in as admin → IdP invalidates worker 1's session
// Worker 1's next request: 401
```

Some apps and IdP policies enforce a single concurrent session per user (it is a configurable policy, not a universal default). **Fix**: account pool with file locking — see `framework/fixtures/auth.fixture.ts` for the existing OrangeHRM-style implementation.

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

**Answer**: Every test fetches a new token. With 4 workers and 100 tests, that's 100 token endpoint calls instead of 4 — 25× the IdP load and the latency. Worse, IdPs rate-limit token endpoints (Okta documents per-org, per-endpoint buckets whose values vary by plan — check Reports > Rate Limits in your org — plus a separate 4-requests-per-second cap per user on `/oauth2/v1/token`), so you start hitting 429s and the suite goes red intermittently. A failed test also restarts the worker, so the real count is workers + failures.

</details>

<details>
<summary><strong>Practice 3 — Spot the bug</strong></summary>

```typescript
test("TOTP login", async ({ page }) => {
  await page.locator("#username").fill(user);
  await page.locator("#password").fill(pass);
  await page.locator("#login").click();

  const code = generateTotp(secret);
  await page.locator("#mfaCode").fill(code); // 28 seconds later
  await page.locator("#verify").click();
});
```

**Bug**: There's a race condition — `code` is generated at second 2 (of the 30s window), then typed at second 30 (window has rolled over). The IdP rejects the now-stale code.

**Fix**: Generate the code _immediately before_ typing it:

```typescript
// Type other fields first, then generate at the last moment
await page.locator("#login").click();
await expect(page.locator("#mfaCode")).toBeVisible(); // web-first wait, not page.waitForSelector()
const code = generateTotp(secret);
await page.locator("#mfaCode").fill(code);
await page.locator("#verify").click();
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
- **Ch 56** — Playwright config (`use.storageState`, `ignoreHTTPSErrors` and project-dependency fields; `clientCertificates` is covered here in §7, not there).
- **Ch 69** — what changed in Playwright 1.57-1.64 ([`context.credentials`, `storageState` options](../07_Specialised_Testing/69_Whats_New_Playwright_1_57_to_1_64.md)).
- **[Lab 05 — OTP login](../labs/05-otp-login/README.md)** — practise §6.2 against a graded app.
- **Ch 58** — File uploads & downloads (the next sharp-edge feature).

**Navigation**: [← 56. Playwright Config Deep-Dive](../01_Foundations/56_Playwright_Config_Deep_Dive.md) | [Index](../00_INDEX.md) | [→ 58. File Uploads & Downloads](./58_File_Uploads_Downloads.md)


---

## Reality Check

**"OAuth 2.0 and OpenID Connect are the same thing"** → OAuth 2.0 is an authorization framework: grants third-party apps limited access to a resource (your Google contacts). It does NOT tell the app WHO the user is. OpenID Connect (OIDC) is an identity layer on top of OAuth 2.0: it adds an `id_token` (JWT containing the user's identity) and a `/userinfo` endpoint. "Login with Google" is OIDC — it provides identity. "Access my Google Drive files" is OAuth 2.0 — it provides authorization. Many systems use "OAuth for login" loosely meaning OIDC. The distinction matters when you need to understand what tokens contain and what they prove.

**"Storing OAuth access tokens in localStorage is fine because they're short-lived"** → Access tokens in localStorage are accessible to ANY JavaScript on the page — including injected malicious scripts via XSS. Short lifetime (1 hour) reduces but doesn't eliminate the risk. Best practice: store tokens in memory (JavaScript variable) or in httpOnly cookies (not accessible to JavaScript). httpOnly cookies are sent automatically by the browser, can't be stolen via XSS, and are protected from CSRF with SameSite=Strict. If XSS is possible in your app, localStorage tokens are vulnerable; httpOnly cookies are not.

**"SAML is legacy and everyone has moved to OIDC"** → Enterprise software, especially Microsoft products and large corporations, still heavily uses SAML. Salesforce, Okta, Azure AD, and most enterprise SSO systems support both. You'll encounter SAML when: testing enterprise line-of-business apps (D365, SharePoint, SAP), integrating with government or banking systems, working with older authentication infrastructure. In test automation: SAML SSO flows often redirect through a corporate IdP, which requires handling the SAML redirect, form-posting to the IdP, and receiving the SAML assertion callback. Different Playwright approach than OIDC flows.

**"storageState captures authentication for all types of login"** → `page.context().storageState()` saves cookies and localStorage. This works for: cookie-based sessions, OAuth tokens stored in localStorage. It does NOT work for: browser Basic Auth (not stored state — set `httpCredentials` on the context/config, which also answers NTLM challenges), certificate-based auth (mTLS — requires browser client certificate configuration), windows-based auth (NTLM/Kerberos — integrated with the OS), or in-memory tokens that aren't persisted to storage. For each auth type, Playwright has a different configuration approach.

**"MFA (multi-factor auth) makes automation impossible"** → MFA can be handled in tests: TOTP (time-based one-time passwords like Google Authenticator): generate the code programmatically using the TOTP secret (`otpauth://...` URI). Libraries like `otplib` (mind the v12/v13 API break in §6) generate valid TOTP codes; `speakeasy` still works but is unmaintained. Email/SMS OTP: intercept the OTP from a test email service (Mailosaur, Mailpit — see [Ch 50](./50_Email_Service_Testing.md); MailHog is unmaintained) or test phone number, then enter it. Hardware security keys: bypass with a test user that has a known TOTP seed or with an API that generates bypass tokens. Most enterprise apps have a test/automation bypass for MFA configured for service accounts.
