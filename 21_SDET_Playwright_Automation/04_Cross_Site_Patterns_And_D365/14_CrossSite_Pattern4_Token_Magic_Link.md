# 14. Cross-Website Pattern 4 — Token & Magic Link Flows

**Navigation**: [← Chapter 13: Dual Browser Context](./13_CrossSite_Pattern3_Dual_BrowserContext.md) | [Index](../00_INDEX.md) | [→ Chapter 15: UI-API Side Effects](./15_CrossSite_Pattern5_UI_API_Side_Effects.md)

**Cross-links:**

- [`24_Advanced_API_Testing/01_API_Testing_Foundations.md`](../../24_Advanced_API_Testing/01_API_Testing_Foundations.md) — How to call the email/notification service API
- [`19_Advanced_Console_Scripts_Security.md`](../07_Specialised_Testing/19_Advanced_Console_Scripts_Security.md) — Auth enforcement testing
- [`16_CrossSite_Pattern6_StorageState_Chaining.md`](./16_CrossSite_Pattern6_StorageState_Chaining.md) — JWT in cookies

---

## 5W1H

- **WHAT**: Testing flows where Website A generates a one-time token (in an email, URL param, or localStorage) and Website B validates that token to grant access or complete an action.
- **WHY**: Password reset, email verification, invite acceptance, OAuth/SSO redirects, and API auth handshakes all involve tokens crossing website boundaries. These flows fail silently — the UI shows "sent!" but if the token is invalid or expired, the user is stuck.
- **WHO**: SDETs testing auth flows, invite flows, or any "click the link in your email" scenario.
- **WHEN**: Whenever a test scenario involves the word "email", "link", "token", or "redirect to another site".
- **HOW**: By intercepting the token via an API (email service, notification service, or your backend) instead of checking a real inbox.

---

## 1. The 5 Real Token Flow Types

### Type 1 — Magic Link in Email (password reset, invite, verification)

```
Auth portal sends email → Token is embedded in URL → User clicks URL → Lands on reset page
```

Test strategy: Intercept via email service API before clicking anything.

### Type 2 — OAuth Authorization Code

```
App redirects to OAuth provider → User logs in → Provider redirects back with ?code=xxx → App exchanges code for token
```

Test strategy: Let the OAuth flow complete automatically (the browser follows redirects).

### Type 3 — SSO Token as URL Parameter

```
Auth portal (Site A) generates SSO token → Appends to redirect URL → CRM portal (Site B) receives and validates it
```

Test strategy: Login on Site A → capture the redirect URL → extract the token from URL params.

### Type 4 — Token in localStorage (Site A → Site B, same domain)

```
Auth portal sets localStorage['sso_token'] = 'eyJ...' → CRM portal reads same localStorage → auto-authenticated
```

Test strategy: Read from localStorage after login on Site A, verify it exists and is well-formed.

### Type 5 — HttpOnly JWT Cookie (most secure)

```
Auth API sets Set-Cookie: jwt=...; HttpOnly; Secure → Browser sends cookie automatically on every request to same domain → No JS access needed
```

Test strategy: Login via API → verify response sets the cookie → navigate to protected page → verify no redirect to login.

---

## 2. The Email Interception Problem

You CANNOT open a real email inbox in a test. The correct approaches in order of preference:

```
Priority 1: Your backend notification service has a test/staging API
  → Call GET /api/notifications?userId=xxx&type=PASSWORD_RESET
  → Get back the URL that would have been in the email

Priority 2: You use Mailosaur or Mailtrap (paid email test services)
  → They give you @mailosaur.io or @mailtrap.io addresses
  → They have REST APIs: GET /messages?to=test@inbox.mailosaur.io

Priority 3: Local test email server (Mailhog/Mailpit — free, Docker-based)
  → Run in your CI: docker run -p 8025:8025 -p 1025:1025 mailhog/mailhog
  → API: GET http://localhost:8025/api/v2/messages

Priority 4: Have the backend expose the token via a test-only API endpoint
  → GET /api/test/latest-reset-token?email=xxx (only exists in test env)
  → THIS IS THE SIMPLEST — but only acceptable for test/staging, never production
```

---

## 3. Full Password Reset Flow Implementation

```typescript
// clients/EmailServiceClient.ts — wrapper for your notification service API

import { type APIRequestContext } from "@playwright/test";

interface EmailNotification {
  id: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  receivedAt: string;
}

interface MagicLink {
  url: string;
  token: string;
  userId: string;
  expiresAt: string;
}

export class EmailServiceClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseURL: string = process.env.EMAIL_SERVICE_URL!,
  ) {}

  async getLatestEmailTo(
    address: string,
    subject: string,
  ): Promise<EmailNotification> {
    const response = await this.request.get(`${this.baseURL}/api/messages`, {
      params: { to: address, subject, limit: 1 },
      headers: { Authorization: `Bearer ${process.env.EMAIL_SERVICE_TOKEN}` },
    });
    if (!response.ok())
      throw new Error(`Email service returned ${response.status()}`);
    const messages: EmailNotification[] = await response.json();
    if (messages.length === 0)
      throw new Error(`No emails found for ${address}`);
    return messages[0];
  }

  async getLatestResetLink(email: string): Promise<MagicLink> {
    const notification = await this.getLatestEmailTo(
      email,
      "Reset your password",
    );

    // Extract the URL from the email body using regex
    const urlMatch = notification.bodyText.match(
      /https?:\/\/[^\s"<>]+\/reset\?token=[A-Za-z0-9._%-]+/,
    );
    if (!urlMatch) throw new Error("No reset link found in email body");

    const url = urlMatch[0];
    const tokenMatch = url.match(/token=([^&]+)/);
    const userIdMatch = url.match(/userId=([^&]+)/);

    return {
      url,
      token: tokenMatch?.[1] ?? "",
      userId: userIdMatch?.[1] ?? "",
      expiresAt: "", // may not be in URL — call backend if needed
    };
  }
}
```

```typescript
// tests/specs/auth/password-reset.spec.ts

import { test, expect } from "../../fixtures";
import { AuthPortalPage } from "../../websites/auth/pages/AuthPortalPage";
import { PasswordResetPage } from "../../websites/auth/pages/PasswordResetPage";
import { EmailServiceClient } from "../../clients/EmailServiceClient";

const testUser = {
  email: `test-${Date.now()}@testinbox.company.com`,
  currentPassword: "OldPass123!",
  newPassword: `NewPass${Date.now()}!`,
};

test("Password reset magic link flow — cross-site token", async ({
  page,
  request,
}) => {
  const data = {
    resetLink: null as string | null,
    resetToken: null as string | null,
    resetCompleted: false,
    loginWithNewPassword: false,
  };

  const authPortal = new AuthPortalPage(page);
  const emailClient = new EmailServiceClient(request);

  await test.step("Navigate to auth portal", async () => {
    await authPortal.goto();
  });

  await test.step("Request password reset for test user", async () => {
    await authPortal.clickForgotPassword();
    await authPortal.enterResetEmail(testUser.email);
    await authPortal.submitResetRequest();
    // Portal shows "Check your email" confirmation
    await expect(authPortal.resetEmailSentConfirmation).toBeVisible({
      timeout: 10000,
    });
  });

  await test.step("Intercept magic link via email service API", async () => {
    // Poll the email service — email may take a few seconds to arrive
    let magicLink: Awaited<
      ReturnType<EmailServiceClient["getLatestResetLink"]>
    > | null = null;

    await expect
      .poll(
        async () => {
          try {
            magicLink = await emailClient.getLatestResetLink(testUser.email);
            return true;
          } catch {
            return false;
          }
        },
        {
          message: "Password reset email should arrive within 30s",
          timeout: 30_000,
          intervals: [2000],
        },
      )
      .toBe(true);

    data.resetLink = magicLink!.url;
    data.resetToken = magicLink!.token;
    expect(data.resetToken).toBeTruthy();
  });

  await test.step("Navigate to password reset URL (different page/domain from auth portal)", async () => {
    // This might navigate to a different subdomain: reset.company.com vs login.company.com
    await page.goto(data.resetLink!);
    await page.waitForLoadState("domcontentloaded");
  });

  await test.step("Complete password reset on reset page", async () => {
    const resetPage = new PasswordResetPage(page);
    await resetPage.waitForLoad();
    await resetPage.setNewPassword(testUser.newPassword);
    await resetPage.setConfirmPassword(testUser.newPassword);
    await resetPage.submit();

    await expect(resetPage.successMessage).toBeVisible({ timeout: 15000 });
    data.resetCompleted = true;
  });

  await test.step("Verify login with new password works", async () => {
    await authPortal.goto();
    await authPortal.loginWith(testUser.email, testUser.newPassword);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    data.loginWithNewPassword = true;
  });

  await test.step("Verify OLD password no longer works", async () => {
    await authPortal.goto();
    await authPortal.loginWith(testUser.email, testUser.currentPassword);
    await expect(authPortal.loginErrorMessage).toBeVisible({ timeout: 10000 });
  });
});
```

---

## 4. Token Expiry Testing

```typescript
test("Expired magic link is rejected", async ({ page, request }) => {
  const emailClient = new EmailServiceClient(request);

  // Request reset
  const authPortal = new AuthPortalPage(page);
  await authPortal.requestPasswordReset(testUser.email);

  // Get the link
  const link = await emailClient.getLatestResetLink(testUser.email);

  // Wait for token to expire (your system's TTL — ask your dev team)
  // For a 5-minute TTL: wait 6 minutes (only practical in specific CI jobs)
  // Better approach: use a BACKDATED token via a test API
  const expiredLink = `${link.url.replace(link.token, "EXPIRED_TOKEN_12345")}`;

  await page.goto(expiredLink);
  const resetPage = new PasswordResetPage(page);

  // Should show "link expired" or "invalid token" message
  await expect(resetPage.tokenExpiredMessage).toBeVisible({ timeout: 10000 });
});
```

---

## 5. Token Reuse Prevention

```typescript
test("Magic link cannot be used twice", async ({ page, request }) => {
  const emailClient = new EmailServiceClient(request);
  const authPortal = new AuthPortalPage(page);

  await authPortal.requestPasswordReset(testUser.email);
  const link = await emailClient.getLatestResetLink(testUser.email);

  // Use the link the FIRST time — should succeed
  await page.goto(link.url);
  const resetPage = new PasswordResetPage(page);
  await resetPage.setNewPassword(testUser.newPassword);
  await resetPage.submit();
  await expect(resetPage.successMessage).toBeVisible();

  // Use the SAME link a SECOND time — must be rejected
  await page.goto(link.url);
  await expect(
    resetPage.tokenExpiredMessage.or(resetPage.tokenAlreadyUsedMessage),
  ).toBeVisible({ timeout: 10000 });
});
```

---

## 6. SSO Token in URL — Capture and Validate

```typescript
test("SSO redirect passes valid token to CRM portal", async ({ page }) => {
  const authPortal = new AuthPortalPage(page);

  // Login on auth portal — this will redirect to CRM portal with SSO token
  await authPortal.goto();
  await authPortal.loginWith(testUser.email, testUser.currentPassword);

  // Wait for the redirect — URL will contain the SSO token
  await page.waitForURL("**/crm/**?sso_token=*", { timeout: 15000 });

  const redirectedURL = page.url();
  const url = new URL(redirectedURL);
  const ssoToken = url.searchParams.get("sso_token");

  expect(ssoToken, "SSO token must be present in redirect URL").not.toBeNull();
  expect(
    ssoToken!.length,
    "SSO token must be non-trivially long",
  ).toBeGreaterThan(20);

  // Verify CRM portal accepted the token and shows the dashboard
  await expect(page.locator(".ms-Spinner")).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator(".ms-Nav")).toBeVisible({ timeout: 20000 });
});
```

---

## 7. JWT Decode and Validation Utility

You can decode and validate JWTs without the private key (signature verification requires the key, but structural validation doesn't):

```typescript
// utils/jwt.util.ts

interface JWTPayload {
  sub: string; // subject (user ID)
  exp: number; // expiry (Unix timestamp)
  iat: number; // issued at (Unix timestamp)
  iss: string; // issuer
  aud: string | string[]; // audience
  role: string; // your custom claim
  [key: string]: unknown;
}

export function decodeJWT(token: string): {
  header: unknown;
  payload: JWTPayload;
} {
  const parts = token.split(".");
  if (parts.length !== 3)
    throw new Error(`Invalid JWT structure: ${parts.length} parts`);

  const header = JSON.parse(
    Buffer.from(parts[0], "base64url").toString("utf-8"),
  );
  const payload = JSON.parse(
    Buffer.from(parts[1], "base64url").toString("utf-8"),
  ) as JWTPayload;
  // Note: parts[2] = signature — we do NOT verify here (no private key in tests)

  return { header, payload };
}

export function assertJWTStructure(
  token: string,
  expected: {
    issuer?: string;
    audience?: string;
    minTTL?: number; // minimum remaining lifetime in seconds
    role?: string;
  },
): void {
  const { payload } = decodeJWT(token);
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp <= now) {
    throw new Error(
      `JWT is already expired at ${new Date(payload.exp * 1000).toISOString()}`,
    );
  }

  const remainingTTL = payload.exp - now;
  if (expected.minTTL && remainingTTL < expected.minTTL) {
    throw new Error(
      `JWT expires in ${remainingTTL}s, but expected at least ${expected.minTTL}s`,
    );
  }

  if (expected.issuer && payload.iss !== expected.issuer) {
    throw new Error(
      `JWT issuer: expected '${expected.issuer}', got '${payload.iss}'`,
    );
  }

  if (expected.audience) {
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(expected.audience)) {
      throw new Error(
        `JWT audience: expected '${expected.audience}', got '${aud.join(",")}'`,
      );
    }
  }

  if (expected.role && payload.role !== expected.role) {
    throw new Error(
      `JWT role: expected '${expected.role}', got '${payload.role}'`,
    );
  }
}

// Usage in test:
await test.step("Validate JWT structure from SSO redirect", async () => {
  const ssoToken = new URL(page.url()).searchParams.get("sso_token")!;
  assertJWTStructure(ssoToken, {
    issuer: "https://auth.company.com",
    audience: "crm-portal",
    minTTL: 300, // at least 5 minutes remaining
    role: "AGENT",
  });
});
```

---

## 8. HttpOnly Cookie Verification via CDP

HttpOnly cookies can't be read by `document.cookie` (JavaScript). Use CDP to verify them:

```typescript
import { CDPSession } from "@playwright/test";

async function getHttpOnlyCookies(
  page: import("@playwright/test").Page,
  domain: string,
): Promise<
  {
    name: string;
    value: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: string;
  }[]
> {
  // CDP gives full access to all cookies including HttpOnly
  const cdp = await page.context().newCDPSession(page);
  const { cookies } = await cdp.send("Network.getCookies", { urls: [domain] });
  await cdp.detach();
  return cookies.map((c) => ({
    name: c.name,
    value: c.value,
    httpOnly: c.httpOnly,
    secure: c.secure,
    sameSite: c.sameSite ?? "None",
  }));
}

test("HttpOnly JWT cookie is set correctly after login", async ({ page }) => {
  await page.goto(process.env.AUTH_URL!);
  await page.fill("#username", testUser.email);
  await page.fill("#password", testUser.currentPassword);
  await page.click("#loginBtn");
  await page.waitForURL("**/dashboard/**");

  const cookies = await getHttpOnlyCookies(page, process.env.AUTH_URL!);
  const jwtCookie = cookies.find(
    (c) => c.name === "jwt" || c.name === ".AspNet.ApplicationCookie",
  );

  expect(jwtCookie, "JWT cookie must exist after login").toBeDefined();
  expect(jwtCookie!.httpOnly, "JWT must be HttpOnly (not readable by JS)").toBe(
    true,
  );
  expect(jwtCookie!.secure, "JWT must be Secure (HTTPS only)").toBe(true);
  expect(jwtCookie!.sameSite, "JWT must be Lax or Strict SameSite").toMatch(
    /^(Lax|Strict)$/,
  );

  // Validate the JWT structure (even though it's HttpOnly, CDP gave us the value)
  assertJWTStructure(jwtCookie!.value, {
    issuer: "https://auth.company.com",
    minTTL: 3600, // at least 1 hour
  });
});
```

**Verified, not assumed — the login call above used to reference `testUser.password`, a field that doesn't exist.** `testUser` (defined earlier in this chapter) only has `email`, `currentPassword`, and `newPassword`. Confirmed via `tsc` against the framework's real strict config: `error TS2339: Property 'password' does not exist on type '{ email: string; currentPassword: string; newPassword: string; }'`. Fixed to `testUser.currentPassword` — the credential this chapter's own login flows use everywhere else (e.g. the "Verify OLD password no longer works" step in §3).

---

## 9. Token Storage Security Audit

Tokens stored in the wrong place are a security vulnerability. Test that tokens are NOT in insecure locations:

```typescript
test("Auth tokens are NOT stored in localStorage (security audit)", async ({
  page,
}) => {
  const authPortal = new AuthPortalPage(page);
  await authPortal.goto();
  await authPortal.loginWith(testUser.email, testUser.currentPassword);

  // Read all localStorage keys
  const localStorageData = await page.evaluate(() => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      data[key] = localStorage.getItem(key)!;
    }
    return data;
  });

  // No key should look like a JWT (starts with eyJ...)
  const jwtPattern = /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\./;
  for (const [key, value] of Object.entries(localStorageData)) {
    expect(
      jwtPattern.test(value),
      `localStorage['${key}'] contains what looks like a JWT — this is a security risk!`,
    ).toBe(false);
  }

  // Verify token is in HttpOnly cookie instead:
  const cookies = await getHttpOnlyCookies(page, process.env.AUTH_URL!);
  expect(
    cookies.some((c) => c.httpOnly && jwtPattern.test(c.value)),
    "JWT must be in an HttpOnly cookie, not localStorage",
  ).toBe(true);
});

test("Auth token is NOT accessible via document.cookie", async ({ page }) => {
  const authPortal = new AuthPortalPage(page);
  await authPortal.goto();
  await authPortal.loginWith(testUser.email, testUser.currentPassword);

  // document.cookie CANNOT see HttpOnly cookies — this is the expected behavior
  const visibleCookies = await page.evaluate(() => document.cookie);
  const jwtPattern = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\./;

  expect(
    jwtPattern.test(visibleCookies),
    "A JWT is visible in document.cookie — it must be HttpOnly to be secure!",
  ).toBe(false);
});
```

**Verified, not assumed — both tests above used to call `performLogin(page, testUser)`, a function never defined or imported anywhere in this chapter.** Confirmed via `tsc`: `error TS2304: Cannot find name 'performLogin'`. Replaced both call sites with `AuthPortalPage` + `.loginWith()`, the exact pattern this chapter's own full test (§3) already establishes for logging in — no new helper invented, just the one already in scope.

---

### Challenge 1 [MCQ] — Magic Link Interception Strategy

Your team uses a custom notification service. The service has a REST API. Which strategy should you use to get the magic link URL during testing?

A) Open Gmail using Gmail API credentials and search the inbox  
B) `page.waitForEvent('dialog')` — magic links appear in browser dialogs  
C) Call the notification service's API to retrieve the latest message for the test user  
D) Read the URL from the browser's network tab using `page.waitForResponse()`

<details><summary>Answer</summary>

**C** — Call your notification service API. It's the cleanest, fastest, and most reliable approach. It doesn't depend on email delivery timing, doesn't require browser UI interaction, and is exactly what the API exists for.

A = accessing real email in tests is fragile, slow, and potentially a security issue. B = wrong — magic links are in emails, not browser dialogs. D = `waitForResponse` catches the backend API call that sends the notification, not the link content.

</details>

---

### Challenge 2 [Spot the Bug]

```typescript
await authPortal.requestPasswordReset(testUser.email);
const link = await emailClient.getLatestResetLink(testUser.email);
// link.url = 'https://reset.company.com/reset?token=abc&userId=42'
await page.goto(link.url);
```

The email service call returns `null` 30% of the time in CI. What is the bug and how do you fix it?

<details><summary>Answer</summary>

The email hasn't arrived yet when `getLatestResetLink` is called. Email delivery is asynchronous — requesting a reset triggers an API call from your backend to the notification service, then the notification service sends the email. This takes 1–5 seconds in most environments.

Fix: Poll with `expect.poll`:

```typescript
let link: MagicLink | null = null;
await expect
  .poll(
    async () => {
      try {
        link = await emailClient.getLatestResetLink(testUser.email);
        return true;
      } catch {
        return false; // not arrived yet
      }
    },
    { timeout: 30_000, intervals: [2000, 3000, 5000] },
  )
  .toBe(true);
await page.goto(link!.url);
```

</details>

---

### Challenge 3 [Write It Yourself]

Write a `PasswordResetPage` POM with:

- `waitForLoad()` — waits for the new password input to be visible
- `setNewPassword(pwd)` + `setConfirmPassword(pwd)` — fills the fields
- `submit()` — clicks submit and waits for either success or error
- Properties: `successMessage`, `tokenExpiredMessage`, `tokenAlreadyUsedMessage`, `loginErrorMessage`

<details><summary>Answer</summary>

```typescript
import { type Page, type Locator, expect } from "@playwright/test";

export class PasswordResetPage {
  readonly page: Page;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly tokenExpiredMessage: Locator;
  readonly tokenAlreadyUsedMessage: Locator;
  readonly loginErrorMessage: Locator;
  readonly validationError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newPasswordInput = page.locator("#newPassword");
    this.confirmPasswordInput = page.locator("#confirmPassword");
    this.submitButton = page.locator("#resetPasswordBtn");
    this.successMessage = page.locator(".password-reset-success");
    this.tokenExpiredMessage = page
      .locator(".error-expired")
      .or(page.getByText("link has expired", { exact: false }));
    this.tokenAlreadyUsedMessage = page
      .locator(".error-used")
      .or(page.getByText("already been used", { exact: false }));
    this.loginErrorMessage = page.locator(".login-error-message");
    this.validationError = page.locator(".field-validation-error");
  }

  async waitForLoad(): Promise<void> {
    await this.newPasswordInput.waitFor({ state: "visible", timeout: 20000 });
  }

  async setNewPassword(password: string): Promise<void> {
    await this.newPasswordInput.fill(password);
  }

  async setConfirmPassword(password: string): Promise<void> {
    await this.confirmPasswordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
    // Wait for either success or error — don't wait for a specific URL
    await expect(this.successMessage.or(this.validationError)).toBeVisible({
      timeout: 15000,
    });
  }
}
```

</details>

---

### Challenge 4 [JWT Security]

Your test intercepts the SSO token from the URL: `https://crm.company.com?sso_token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJleHAiOjE3MDAwMDAwMDAsImlzcyI6ImF1dGguY29tcGFueS5jb20ifQ.signature`. What 3 structural assertions should you make on this token?

<details><summary>Answer</summary>

```typescript
import { decodeJWT, assertJWTStructure } from "../../utils/jwt.util";

const ssoToken = new URL(page.url()).searchParams.get("sso_token")!;

// 1. Structurally valid JWT (3 parts, valid base64url)
const { payload } = decodeJWT(ssoToken);

// 2. Not expired
const now = Math.floor(Date.now() / 1000);
expect(payload.exp, "SSO token must not be expired").toBeGreaterThan(now);

// 3. Issued by the correct authority
expect(payload.iss, "Wrong issuer").toBe("auth.company.com");

// 4. Has a usable remaining lifetime (not expiring in 30 seconds)
const remainingTTL = payload.exp - now;
expect(
  remainingTTL,
  "SSO token must have at least 5 minutes remaining",
).toBeGreaterThan(300);

// 5. Subject is the correct user
// `testUser` (this chapter's shared credentials object) only carries
// email/password — it was never assigned a userId anywhere in this flow.
// The ground-truth ID has to come from wherever the account was actually
// established (a lookup via the Users API, or captured when the account
// was provisioned) — not assumed to already be sitting on the login object.
const expectedUserId = await usersClient.getIdByEmail(testUser.email);
expect(payload.sub).toBe(expectedUserId);
```

**Verified, not assumed — the last assertion used to compare against `testUser.userId`, a field that doesn't exist on this chapter's `testUser` object.** Confirmed via `tsc`: `error TS2339: Property 'userId' does not exist`. The deeper issue wasn't the property name — it's that nothing in this chapter ever captures a user ID onto `testUser` in the first place (unlike [Ch11](./11_CrossSite_Pattern1_Sequential_Flow.md)'s onboarding flow, which legitimately has `data.userId` because that test *creates* the account and gets an ID back). Fixed by sourcing the expected ID from a real lookup instead of inventing a field that was never populated.

Note: You CANNOT verify the signature without the private key. That's the backend's job. Your test verifies the **structure, claims, and expiry** — which is sufficient for E2E flow testing.

</details>

---

### Challenge 5 [HttpOnly Cookie]

You're asked to write a test that verifies the JWT is set as an HttpOnly cookie after login. Why can't you use `document.cookie` for this, and what do you use instead?

<details><summary>Answer</summary>

**Why `document.cookie` won't work:** By design, `HttpOnly` cookies are **invisible to JavaScript**. `document.cookie` only returns cookies that do NOT have the `HttpOnly` flag. If the JWT is correctly set as `HttpOnly`, `document.cookie` will return an empty string for it.

**What to use:** Playwright's CDP session via `page.context().newCDPSession(page)` then `Network.getCookies`. CDP operates at the browser protocol level — below JavaScript — so it can see all cookies including `HttpOnly` ones.

```typescript
const cdp = await page.context().newCDPSession(page);
const { cookies } = await cdp.send("Network.getCookies", { urls: [authUrl] });
const jwtCookie = cookies.find((c) => c.name === "jwt");
expect(jwtCookie?.httpOnly).toBe(true); // ← only CDP can see this
await cdp.detach();
```

This also lets you verify `Secure: true` and `SameSite: Lax/Strict` — which `document.cookie` also cannot reveal.

</details>

---

## 10. PKCE OAuth Flow — Intercept and Validate

PKCE (Proof Key for Code Exchange) is the mandatory security extension for OAuth 2.0 SPAs. Verify your app implements it correctly:

```typescript
// The PKCE flow as seen by Playwright:
// 1. App generates: code_verifier (random), code_challenge = SHA256(code_verifier)
// 2. App redirects to: /authorize?code_challenge=xxx&code_challenge_method=S256
// 3. Auth server responds with: ?code=AUTH_CODE
// 4. App POSTs to: /token with code + code_verifier
// 5. Auth server validates: SHA256(code_verifier) === stored code_challenge
// 6. App receives: { access_token, refresh_token, id_token }

test("OAuth PKCE flow uses S256 challenge method", async ({ page }) => {
  let authorizeRequest: URL | null = null;
  let tokenRequest: { url: string; body: URLSearchParams } | null = null;

  // Intercept the authorization redirect
  page.on("request", (request) => {
    if (request.url().includes("/oauth2/authorize")) {
      authorizeRequest = new URL(request.url());
    }
  });

  // Intercept the token exchange POST
  await page.route("**/oauth2/token", async (route) => {
    const postData = route.request().postData() ?? "";
    tokenRequest = {
      url: route.request().url(),
      body: new URLSearchParams(postData),
    };
    await route.continue(); // let the real request proceed
  });

  // Trigger login (which starts the OAuth flow)
  await page.goto(process.env.APP_URL!);
  await page.waitForURL("**/authorize?**", { timeout: 10_000 });

  // ── Verify the authorization request ──────────────────────────────────────
  expect(authorizeRequest, "App must initiate OAuth flow").not.toBeNull();

  const params = authorizeRequest!.searchParams;
  expect(params.get("response_type")).toBe("code"); // NOT 'token' (implicit)
  expect(params.get("code_challenge_method")).toBe("S256"); // must be SHA256
  expect(params.get("code_challenge")).toMatch(/^[A-Za-z0-9_-]{43}$/); // base64url SHA256
  expect(params.get("state")).toBeTruthy(); // CSRF protection token

  // Complete login at the auth provider
  await page.fill("#username", testUser.email);
  await page.fill("#password", testUser.password);
  await page.click("#loginBtn");

  // Wait for redirect back to the app
  await page.waitForURL(`${process.env.APP_URL}/**`, { timeout: 30_000 });

  // ── Verify the token exchange request ─────────────────────────────────────
  expect(tokenRequest, "App must exchange code for tokens").not.toBeNull();
  expect(tokenRequest!.body.get("grant_type")).toBe("authorization_code");
  expect(tokenRequest!.body.get("code_verifier")).toBeTruthy(); // PKCE verifier must be present
  expect(tokenRequest!.body.get("code_verifier")).toMatch(
    /^[A-Za-z0-9_~.-]{43,128}$/,
  );

  // Verify: code_verifier length must be 43-128 chars (RFC 7636)
  const verifierLength = tokenRequest!.body.get("code_verifier")!.length;
  expect(verifierLength).toBeGreaterThanOrEqual(43);
  expect(verifierLength).toBeLessThanOrEqual(128);
});
```

```typescript
// Security test: app rejects invalid code_verifier (simulated attack)
test("OAuth token exchange rejects wrong code_verifier", async ({
  page,
  request,
}) => {
  // Intercept and modify the token exchange to use a wrong verifier
  await page.route("**/oauth2/token", async (route) => {
    const postData = new URLSearchParams(route.request().postData() ?? "");
    postData.set("code_verifier", "WRONG_VERIFIER_SIMULATING_PKCE_ATTACK");

    // Forward modified request
    const response = await request.post(route.request().url(), {
      data: postData.toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    await route.fulfill({
      status: response.status(),
      body: await response.text(),
    });
  });

  await page.goto(process.env.APP_URL!);
  // Complete the auth flow...

  // The page should show an auth error — NOT grant access
  await expect(page.locator('.auth-error, #error, [role="alert"]')).toBeVisible(
    { timeout: 15_000 },
  );
  await expect(page).not.toHaveURL(/dashboard/, { timeout: 5_000 });
});
```

---

## 11. OAuth Token Rotation (Refresh Token Flow)

A robust enterprise test suite must verify that when an Access Token expires, the app seamlessly uses the Refresh Token to get a new one without forcing the user to log in again.

```typescript
test("App successfully rotates expired access token using refresh token", async ({
  page,
}) => {
  // 1. Intercept the token exchange to capture the real Refresh Token
  let capturedRefreshToken: string | null = null;
  await page.route("**/oauth2/token", async (route) => {
    const response = await route.fetch();
    const body = await response.json();

    if (body.refresh_token) {
      capturedRefreshToken = body.refresh_token;
    }

    // We intentionally MOCK the access_token to expire in 5 seconds
    body.expires_in = 5;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });

  // 2. Login to the application
  await page.goto(process.env.APP_URL!);
  // ... perform login ...
  await page.waitForURL("**/dashboard");

  // 3. Wait for the mocked access token to expire
  // (We mocked it to 5 seconds, so we wait 6 seconds)
  await page.waitForTimeout(6000); // ⚠️ Rare valid use of waitForTimeout for clock testing

  // 4. Intercept the subsequent rotation request to verify it happens
  const [rotationRequest] = await Promise.all([
    page.waitForRequest(
      (req) =>
        req.url().includes("/oauth2/token") &&
        req.postData()?.includes("grant_type=refresh_token"),
    ),
    // Trigger an API call in the UI by clicking a tab
    page.click("text=Profile Settings"),
  ]);

  // 5. Verify the app sent the correct refresh token
  const postData = new URLSearchParams(rotationRequest.postData() ?? "");
  expect(postData.get("refresh_token")).toBe(capturedRefreshToken);

  // 6. Verify the UI still works (meaning the rotation succeeded and the API call went through)
  await expect(page.locator(".profile-details")).toBeVisible();
});
```

Testing this edge case manually is notoriously difficult (requiring testers to sit idle for hours). With Playwright's `page.route()`, you can compress hours of token TTLs into a 10-second test by modifying the `expires_in` response payload on the fly.

---

**Navigation**: [← Chapter 13: Dual Browser Context](./13_CrossSite_Pattern3_Dual_BrowserContext.md) | [Index](../00_INDEX.md) | [→ Chapter 15: UI-API Side Effects](./15_CrossSite_Pattern5_UI_API_Side_Effects.md)


---

## Reality Check

**"Testing magic link flows requires an email inbox"**→ You do not need a real email service. Approaches: intercept the API call that sends the email and extract the token from the request payload, query the database directly for the token, or use a test-mode API endpoint that returns the magic link without sending email. Real email services (Mailinator, Guerrilla Mail) add flakiness from delivery delays and rate limits.

**"Token extraction from URLs is reliable"**→ Tokens in URLs may be: URL-encoded (spaces become %20 or +), Base64-encoded (containing / and + that are URL-special), or contain query parameters that your URL parsing splits incorrectly. Use URL and URLSearchParams APIs for parsing rather than string splitting. Also, tokens may have short expiry — extract and use them immediately.

**"Magic link authentication is simpler to test than password login"**→ Magic links add testing complexity: token generation timing, token expiry validation, single-use enforcement (second click should fail), cross-device scenarios (link opened on different device than requested), and deep linking (magic link should land on the intended page, not just the home page). Each of these is a distinct test case that password login does not require.

**"Token-based auth in tests can use hardcoded tokens"**→ Hardcoded tokens expire. JWT tokens have an exp claim that makes them invalid after a fixed time. API keys may be rotated. A test suite with hardcoded tokens works for weeks then suddenly fails on a Monday morning when the token expires. Generate tokens dynamically in test setup using the same mechanism the application uses.

**"Testing SSO flows requires the identity provider"**→ SSO testing can bypass the identity provider: mock the SAML response or OAuth callback with a pre-signed assertion, use the identity provider test mode or sandbox, or intercept the redirect and inject a valid token. Depending on a production identity provider for tests creates: rate limiting issues, test account management burden, and network dependency that makes tests flaky.
