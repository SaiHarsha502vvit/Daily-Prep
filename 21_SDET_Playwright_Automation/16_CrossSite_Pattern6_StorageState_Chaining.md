# 16. Cross-Website Pattern 6 — StorageState Chaining (Login Once, Use Everywhere)

**Navigation**: [← Chapter 15: UI-API Side Effects](15_CrossSite_Pattern5_UI_API_Side_Effects.md) | [Index](00_INDEX.md) | [→ Chapter 17: D365 Advanced Timing](17_D365_Advanced_Timing_Patterns.md)

**Cross-links:**
- [`06_Custom_Fixtures_Architecture.md`](06_Custom_Fixtures_Architecture.md) — Worker-scoped fixtures
- [`09_Parallel_Execution_Workers.md`](09_Parallel_Execution_Workers.md) — Why state must not be shared between workers

---

## 5W1H

- **WHAT**: The pattern of logging in once before your test suite runs, saving the entire browser state (cookies, localStorage, sessionStorage) to a JSON file, and restoring it at the start of each test — so tests skip the login UI entirely.
- **WHY**: Login is the most common test setup step. If you have 200 tests and each takes 5 seconds to log in, that's 1000 seconds of login time per suite run. With storageState, login happens once per role per suite.
- **WHO**: Every SDET running more than 10 tests. This is not optional — it's standard practice.
- **WHEN**: As soon as you have more than one test that requires authentication.
- **HOW**: Via `globalSetup.ts` (runs once before all tests) + `playwright.config.ts` project configuration that loads the saved state.

---

## 1. What `storageState` Captures

```json
// auth-states/admin-state.json — example structure
{
  "cookies": [
    {
      "name": "sso_token",
      "value": "eyJhbGciOiJSUzI1NiJ9...",
      "domain": ".company.com",
      "path": "/",
      "expires": 1748123456.789,
      "httpOnly": false,
      "secure": true,
      "sameSite": "Lax"
    },
    {
      "name": ".AspNet.ApplicationCookie",
      "value": "CfDJ8...",
      "domain": "crm.company.com",
      "path": "/",
      "expires": 1748123456.789,
      "httpOnly": true,
      "secure": true,
      "sameSite": "Lax"
    }
  ],
  "origins": [
    {
      "origin": "https://admin.company.com",
      "localStorage": [
        { "name": "currentUserId", "value": "admin-user-123" },
        { "name": "lastLoginTime", "value": "2026-05-28T12:00:00Z" }
      ]
    }
  ]
}
```

**What IS captured:** Cookies (all, including HttpOnly flags), localStorage per origin.

**What is NOT captured:**
- `sessionStorage` (per-tab, not serializable across sessions)
- `IndexedDB` (Playwright limitation)
- In-memory state (JavaScript objects in the page's memory)

**Implication:** If your app uses sessionStorage for auth tokens, storageState won't work. You'll need a workaround (inject the token via `page.addInitScript`).

### Cookie Domain Matching — Why Cross-Site SSO Works

Understanding cookie domain rules is critical for multi-site auth:

```
Cookie domain:  .company.com          (leading dot = all subdomains)
Matches:        auth.company.com       ✅
                crm.company.com        ✅
                portal.company.com     ✅
                billing.company.com    ✅
                partner.company.com    ✅
Does NOT match: company.co.uk          ❌ (different TLD)
                otherdomain.com        ❌ (different domain)

Cookie domain:  crm.company.com       (exact subdomain, no leading dot)
Matches:        crm.company.com        ✅
Does NOT match: admin.crm.company.com  ❌ (sub-subdomain)
                portal.company.com     ❌ (different subdomain)
```

**Practical implication**: Your SSO login at `auth.company.com` sets a cookie with domain `.company.com`. All subdomains get this cookie automatically. One `storageState` file works for all connected sites.

But if Site A sets domain `crm.company.com` (no leading dot) and Site B is `billing.company.com`, the cookie does NOT cross. You'd need to visit both sites in globalSetup.

```typescript
// Checking which cookies your app actually sets:
// After login, inspect your auth-states/*.json:
const state = JSON.parse(fs.readFileSync('auth-states/admin-state.json', 'utf-8'));
console.table(state.cookies.map(c => ({
  name: c.name.substring(0, 20),
  domain: c.domain,
  path: c.path,
  sameSite: c.sameSite,
  httpOnly: c.httpOnly,
  secure: c.secure,
  expires: c.expires ? new Date(c.expires * 1000).toISOString() : 'session',
})));
```

---

## 2. The `globalSetup.ts` — Login Once, Save State

```typescript
// globalSetup.ts — runs ONCE before the entire test suite

import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

interface AuthCredentials {
  email: string;
  password: string;
  role: string;
  authStateFile: string;
}

const credentialSets: AuthCredentials[] = [
  {
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_PASSWORD!,
    role: 'admin',
    authStateFile: 'auth-states/admin-state.json',
  },
  {
    email: process.env.CUSTOMER_EMAIL!,
    password: process.env.CUSTOMER_PASSWORD!,
    role: 'customer',
    authStateFile: 'auth-states/customer-state.json',
  },
  {
    email: process.env.SUPERVISOR_EMAIL!,
    password: process.env.SUPERVISOR_PASSWORD!,
    role: 'supervisor',
    authStateFile: 'auth-states/supervisor-state.json',
  },
];

export default async function globalSetup(config: FullConfig): Promise<void> {
  console.log('[globalSetup] Starting authentication for all roles...');

  // Ensure auth-states directory exists
  const authStatesDir = path.resolve('auth-states');
  if (!fs.existsSync(authStatesDir)) {
    fs.mkdirSync(authStatesDir, { recursive: true });
  }

  const browser = await chromium.launch();

  try {
    // Login all roles in parallel for speed
    await Promise.all(
      credentialSets.map(creds => loginAndSaveState(browser, creds))
    );
  } finally {
    await browser.close();
  }

  console.log('[globalSetup] All auth states saved ✓');
}

async function loginAndSaveState(
  browser: import('@playwright/test').Browser,
  creds: AuthCredentials
): Promise<void> {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`[globalSetup] Logging in as ${creds.role} (${creds.email})...`);

    await page.goto(process.env.AUTH_PORTAL_URL!);
    await page.waitForLoadState('domcontentloaded');

    await page.locator('#username').fill(creds.email);
    await page.locator('#password').fill(creds.password);
    await page.locator('#loginBtn').click();

    // Wait for successful login — URL changes to dashboard
    await page.waitForURL(/\/(dashboard|home|main)/, { timeout: 30_000 });

    // Save the entire context state
    await context.storageState({ path: creds.authStateFile });

    console.log(`[globalSetup] ✓ Saved: ${creds.authStateFile}`);
  } finally {
    await context.close();
  }
}
```

---

## 2b. API-Based Auth in globalSetup — Skip the UI Login Loop

Logging in via UI in globalSetup works but is slow (30-60s per role for D365). If your auth server supports OAuth password grant or has a test token endpoint, use the API instead:

```typescript
// globalSetup.ts — API-based auth (10x faster than UI login)

import { chromium, request, type FullConfig } from '@playwright/test';
import fs from 'fs';

export default async function globalSetup(config: FullConfig): Promise<void> {
  // Step 1: Get access token from OAuth endpoint (no UI needed)
  const apiContext = await request.newContext();

  const tokenResponse = await apiContext.post(process.env.TOKEN_URL!, {
    form: {
      grant_type:    'password',
      username:      process.env.ADMIN_EMAIL!,
      password:      process.env.ADMIN_PASSWORD!,
      client_id:     process.env.OAUTH_CLIENT_ID!,
      client_secret: process.env.OAUTH_CLIENT_SECRET!,
      scope:         'openid profile email',
    },
  });

  if (!tokenResponse.ok()) {
    throw new Error(`Token request failed: ${tokenResponse.status()} — ${await tokenResponse.text()}`);
  }

  const { access_token, refresh_token, expires_in } = await tokenResponse.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  await apiContext.dispose();

  // Step 2: Create a browser context, inject the token as a cookie, and save state
  // (The app uses the token as an httpOnly cookie set by the auth server)
  const browser = await chromium.launch();
  const context = await browser.newContext();

  // Manually set the auth cookie (mimics what the auth server would set)
  await context.addCookies([{
    name:     'access_token',
    value:    access_token,
    domain:   '.company.com',
    path:     '/',
    expires:  Math.floor(Date.now() / 1000) + expires_in,
    httpOnly: false,  // must be false for Playwright to handle cross-origin
    secure:   true,
    sameSite: 'Lax',
  }]);

  // Optionally visit the app to let it initialize localStorage
  const page = await context.newPage();
  await page.goto(process.env.CRM_URL + '/dashboard');
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

  await context.storageState({ path: 'auth-states/admin-state.json' });
  await browser.close();

  console.log(`[globalSetup] API auth complete. Token valid for ${expires_in}s`);
}
```

**Performance comparison:**
```
UI login in globalSetup:   3 roles × 30s each = 90s overhead
API auth in globalSetup:   3 roles × 2s each  = 6s overhead
Savings: 84 seconds per suite run
With 10 CI runs per day: 840 seconds = 14 minutes saved daily
```

---

## 3. `playwright.config.ts` — Projects Per Role

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  globalSetup: './globalSetup.ts',  // ← runs once before all tests

  projects: [
    // Admin tests — automatically use admin auth state
    {
      name: 'admin-tests',
      testMatch: '**/tests/admin/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'auth-states/admin-state.json',
      },
    },

    // Customer tests — automatically use customer auth state
    {
      name: 'customer-tests',
      testMatch: '**/tests/customer/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'auth-states/customer-state.json',
      },
    },

    // Cross-website tests — no pre-loaded state (they manage their own)
    {
      name: 'cross-site-tests',
      testMatch: '**/tests/cross-website/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // No storageState here — these tests create their own contexts
      },
    },
  ],
});
```

Now every test in `admin-tests` starts ALREADY LOGGED IN as admin. No `loginWith()` in `beforeEach`.

---

## 4. Cross-Website StorageState: Login on Site A, Use on Site B

The powerful scenario: one login on the Auth portal carries to all connected sites:

```typescript
async function loginOnAuthPortalAndSaveState(browser: Browser): Promise<void> {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login on Auth portal (https://auth.company.com)
  await page.goto('https://auth.company.com/login');
  await page.locator('#username').fill(process.env.ADMIN_EMAIL!);
  await page.locator('#password').fill(process.env.ADMIN_PASSWORD!);
  await page.locator('#loginBtn').click();
  await page.waitForURL(/\/dashboard/);

  // The SSO cookie is set on domain .company.com
  // This means crm.company.com, portal.company.com, billing.company.com all get it

  // Save the state — it includes the .company.com SSO cookie
  await context.storageState({ path: 'auth-states/admin-state.json' });

  await context.close();
}

// Now in tests:
test('admin accesses CRM portal without re-login', async ({ page }) => {
  // storageState is loaded from admin-state.json into the test's context
  // The SSO cookie is already there
  await page.goto('https://crm.company.com/');
  // No login prompt — SSO cookie is accepted
  await expect(page.locator('.ms-Spinner')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.locator('.ms-Nav')).toBeVisible();
});
```

---

## 5. When StorageState FAILS — Debugging Guide

| Symptom | Root Cause | Fix |
|---|---|---|
| Test navigates to login page despite storageState | Token expired between globalSetup and test run | Add token refresh in a worker-scoped fixture |
| Works locally, fails in CI | CI takes longer → token expiry window exceeded | Increase token TTL in test config, or refresh tokens in fixtures |
| One test passes, next test fails | Shared mutable session state (one test modifies it) | Use `storageState: undefined` on tests that modify state |
| Site B doesn't recognize the state | Auth uses sessionStorage (not captured) | Inject token via `page.addInitScript()` |
| Cross-domain cookie not carried | Cookie domain is exact (`.crm.company.com`), not wildcard | Save state after visiting Site B in globalSetup too |

---

## 6. Refreshing Tokens — Worker-Scoped Fixture (Production Grade)

For long-running suites where tokens expire during the run. The naive approach (check `#logoutBtn`) requires a full page load. The production approach reads the JWT `exp` claim directly from the saved state file — no browser needed:

```typescript
// fixtures/auth.fixture.ts

import * as fs from 'fs';
import { test as base, chromium } from '@playwright/test';

/** Decode JWT payload without signature verification */
function getJWTExpiry(token: string): number {
  const parts = token.split('.');
  if (parts.length !== 3) return 0;
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
  return (payload.exp as number) ?? 0;  // Unix timestamp in seconds
}

/** Read the sso_token cookie from the saved state file */
function readSavedToken(statePath: string): string | null {
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    const cookie = (state.cookies as { name: string; value: string }[])
      .find(c => c.name === 'sso_token');
    return cookie?.value ?? null;
  } catch {
    // File missing or corrupted — trigger re-auth
    return null;
  }
}

const REFRESH_BUFFER_SECONDS = 300; // refresh 5 minutes before actual expiry

export const test = base.extend<{}, { authToken: string }>({
  authToken: [
    async ({}, use) => {
      const statePath = 'auth-states/admin-state.json';

      let token = readSavedToken(statePath);
      const now = Math.floor(Date.now() / 1000);
      const expiry = token ? getJWTExpiry(token) : 0;

      if (!token || expiry - now < REFRESH_BUFFER_SECONDS) {
        // Token missing, corrupted, or expiring within 5 minutes → re-auth
        console.log(
          token
            ? `[auth fixture] Token expires in ${expiry - now}s — refreshing proactively`
            : '[auth fixture] No valid token found — performing fresh login'
        );

        const browser = await chromium.launch();
        const context = await browser.newContext();
        const page    = await context.newPage();

        await page.goto(process.env.AUTH_PORTAL_URL!);
        await page.locator('#username').fill(process.env.ADMIN_EMAIL!);
        await page.locator('#password').fill(process.env.ADMIN_PASSWORD!);
        await page.locator('#loginBtn').click();
        await page.waitForURL(/\/(dashboard|home)/, { timeout: 30_000 });

        // Atomic write: write to temp file first, then rename
        // Prevents other workers from reading a partially written file
        const tmpPath = `${statePath}.tmp`;
        await context.storageState({ path: tmpPath });
        fs.renameSync(tmpPath, statePath);  // atomic on most OSes

        await browser.close();

        token = readSavedToken(statePath);
      }

      await use(token!);
    },
    { scope: 'worker' }, // runs once per worker process — shared across all tests in worker
  ],
});
```

```typescript
// Why 5-minute buffer matters:
//
// Token expires at: 10:00:00 AM
// Worker starts:    09:58:00 AM  (2 min before expiry)
// Without buffer:   Token is "valid" → no refresh → tests start
// Test at 10:01:00: Token is expired → all tests fail
//
// With 5-min buffer:
// Worker starts at 09:58 → expiry - now = 2min < 5min → triggers refresh
// New token valid until 11:58 → tests run safely

// Atomic write (rename trick) prevents this race condition:
// Worker A writes admin-state.json (takes 500ms)
// Worker B reads admin-state.json at 250ms → reads HALF of the file → corrupt JSON
// With rename: Worker B reads the old complete file until Worker A's rename completes
```

---

## 7. Debugging StorageState — Read the JSON

```typescript
// A one-off script to inspect your saved state (run from terminal)
// scratch/inspect-auth-state.ts

import * as fs from 'fs';

const state = JSON.parse(fs.readFileSync('auth-states/admin-state.json', 'utf-8'));

console.log('\n=== COOKIES ===');
state.cookies.forEach((cookie: Record<string, unknown>) => {
  const expiresDate = cookie.expires
    ? new Date((cookie.expires as number) * 1000).toISOString()
    : 'session';
  const isExpired = cookie.expires
    ? (cookie.expires as number) * 1000 < Date.now()
    : false;
  console.log(
    `  ${cookie.name}: domain=${cookie.domain} expires=${expiresDate}` +
    (isExpired ? ' ⚠ EXPIRED' : ' ✓')
  );
});

console.log('\n=== LOCAL STORAGE ===');
state.origins.forEach((origin: { origin: string; localStorage: { name: string; value: string }[] }) => {
  console.log(`  Origin: ${origin.origin}`);
  origin.localStorage.forEach(item => {
    const preview = item.value.substring(0, 60);
    const hasToken = item.name.toLowerCase().includes('token')
      || item.name.toLowerCase().includes('auth');
    console.log(`    ${item.name}: ${preview}...${hasToken ? ' 🔑' : ''}`);
  });
});
```

---

## 8. The sessionStorage Problem — Workaround via `addInitScript`

If your app stores auth tokens in `sessionStorage` (which storageState does NOT capture), use `addInitScript` to inject them before the page loads:

```typescript
// fixtures/auth.fixture.ts — sessionStorage injection

export const test = base.extend<{ authToken: string }>({{
  authToken: async ({ request }, use) => {
    // Get a fresh token from the API
    const tokenResp = await request.post(process.env.TOKEN_URL!, {
      form: {
        grant_type: 'client_credentials',
        client_id:  process.env.OAUTH_CLIENT_ID!,
        client_secret: process.env.OAUTH_CLIENT_SECRET!,
      },
    });
    const { access_token } = await tokenResp.json() as { access_token: string };
    await use(access_token);
  },
});

// In the test:
test('access protected page', async ({ page, authToken }) => {
  // Inject the token into sessionStorage BEFORE the page loads
  await page.addInitScript((token: string) => {
    // This runs in the browser before any page script
    sessionStorage.setItem('access_token', token);
    sessionStorage.setItem('token_type', 'Bearer');
  }, authToken);  // authToken is passed as an argument

  // Now navigate — the app reads sessionStorage and finds the token
  await page.goto('/dashboard');
  await expect(page.locator('.user-menu')).toBeVisible();
  // No login redirect!
});
```

### When This Is Needed

```
App stores auth in:         Solution:
  Cookie (default)          → storageState works out of the box
  localStorage              → storageState captures localStorage per origin
  sessionStorage            → addInitScript injection (this section)
  In-memory (React state)   → addInitScript + navigate to trigger re-auth
  Both cookie + memory      → storageState for cookie + addInitScript for memory
```

---

## 9. `globalTeardown.ts` — Clean Up After All Tests

```typescript
// globalTeardown.ts — runs ONCE after all tests complete

import fs from 'fs';

export default async function globalTeardown(): Promise<void> {
  // Clean up auth state files (they contain real credentials)
  // ⚠ Only in CI — don't delete locally (useful for debugging)
  if (process.env.CI) {
    const files = ['auth-states/admin-state.json', 'auth-states/customer-state.json'];
    for (const file of files) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`[globalTeardown] Deleted: ${file}`);
      }
    }
  }

  // Clean up any test data created during globalSetup
  // (e.g., test users created via API)
  if (process.env.CLEANUP_TEST_DATA === 'true') {
    const apiContext = await (await import('@playwright/test')).request.newContext();
    // delete test users, reset seeded data, etc.
    await apiContext.dispose();
  }
}
```

```typescript
// playwright.config.ts — register teardown
export default defineConfig({
  globalSetup:    './globalSetup.ts',
  globalTeardown: './globalTeardown.ts',   // ← add this
  // ...
});
```

---

## 10. Security: Never Commit auth-states to Git

```bash
# .gitignore — critical security rule
auth-states/
*.json  # if all JSON files in auth-states should be excluded

# Or more specific:
auth-states/admin-state.json
auth-states/customer-state.json
auth-states/supervisor-state.json

# WHY: These files contain real auth tokens and cookies.
# Anyone with access to the git repo could use them to impersonate users.
# Even in a private repo, this is a security risk.

# In CI: auth-states are generated fresh by globalSetup.
# The files never leave the CI runner.
# They're deleted by globalTeardown when CI=true.
```

```yaml
# .github/workflows/playwright.yml — ensure no auth state in artifacts
- name: Upload test report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
    # NEVER include auth-states/ in the artifact path!
    # Only upload playwright-report/ and test-results/
```

---

## 🏋️ Practice Challenges

### Challenge 1 [MCQ] — Token Expiry

`globalSetup` runs at 9:00 AM. Auth tokens expire after 8 hours. Tests run at 9:00 PM (12 hours later in a slow CI pipeline). What happens?

A) Tests all pass because storageState is saved as-is  
B) Tests fail with 401/403 errors or redirect to login  
C) Playwright automatically refreshes expired tokens  
D) Tests fail with a Playwright error about invalid storageState  

<details><summary>Answer</summary>

**B** — The saved cookies are expired. When the test context loads the storageState, the browser sends the expired cookies with each request. The server rejects them (401/403) or ignores them and treats the user as unauthenticated, causing a redirect to the login page. Playwright does not refresh tokens automatically (C). The storageState JSON is syntactically valid so no Playwright error (D) — the cookies are just rejected by the server.

Fix: Worker-scoped fixture that checks token validity and re-authenticates if needed.
</details>

---

### Challenge 2 [Spot the Bug]

```typescript
export default async function globalSetup() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(process.env.AUTH_PORTAL_URL!);
  await page.locator('#username').fill(process.env.ADMIN_EMAIL!);
  await page.locator('#password').fill(process.env.ADMIN_PASSWORD!);
  await page.locator('#loginBtn').click();

  await context.storageState({ path: 'auth-states/admin-state.json' });
  await browser.close();
}
```

<details><summary>Answer</summary>

`storageState` is saved immediately after `loginBtn.click()`, before the login completes. The page is still loading (or the server is still processing). The saved state may not have the auth cookies yet.

Fix: Wait for successful login before saving:
```typescript
await page.locator('#loginBtn').click();
// Wait for navigation to dashboard — login has completed
await page.waitForURL(/\/(dashboard|home)/, { timeout: 30_000 });
// NOW the cookies are set
await context.storageState({ path: 'auth-states/admin-state.json' });
```
</details>

---

### Challenge 3 [Write It Yourself]

Write a `playwright.config.ts` project setup with 3 projects: `admin-chrome`, `customer-chrome`, `customer-firefox`. Each uses the appropriate auth state, with customer tests running on both browsers.

<details><summary>Answer</summary>

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  globalSetup: './globalSetup.ts',

  projects: [
    {
      name: 'admin-chrome',
      testMatch: '**/tests/admin/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'auth-states/admin-state.json',
        baseURL: process.env.ADMIN_PORTAL_URL,
      },
    },
    {
      name: 'customer-chrome',
      testMatch: '**/tests/customer/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'auth-states/customer-state.json',
        baseURL: process.env.CUSTOMER_PORTAL_URL,
      },
    },
    {
      name: 'customer-firefox',
      testMatch: '**/tests/customer/**/*.spec.ts',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'auth-states/customer-state.json',
        baseURL: process.env.CUSTOMER_PORTAL_URL,
      },
    },
  ],
});
```
</details>

---

### Challenge 4 [Deep Design]

Your app has 3 sites: `auth.company.com` (SSO login), `crm.company.com` (D365), `billing.company.com` (a separate vendor system with its own `billing_session` cookie on domain `billing.company.com`). Design a `globalSetup` that creates one auth state file covering all 3 sites.

<details><summary>Answer</summary>

```typescript
// globalSetup.ts — multi-site auth state

export default async function globalSetup(): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page    = await context.newPage();

  // Step 1: Login on SSO — sets .company.com cookie
  await page.goto('https://auth.company.com/login');
  await page.locator('#username').fill(process.env.ADMIN_EMAIL!);
  await page.locator('#password').fill(process.env.ADMIN_PASSWORD!);
  await page.locator('#loginBtn').click();
  await page.waitForURL(/\/dashboard/);
  // cookie 'sso_token' domain='.company.com' is now in the context

  // Step 2: Visit the billing site — triggers its own session setup
  // The billing site accepts the SSO token and creates its own session cookie
  await page.goto('https://billing.company.com/auth/sso-callback');
  await page.waitForURL(/\/billing\/dashboard/, { timeout: 30_000 });
  // cookie 'billing_session' domain='billing.company.com' is now in the context

  // Step 3: Visit CRM (D365) — same SSO token, separate app init
  await page.goto('https://crm.company.com/');
  await expect(page.locator('.ms-Spinner')).toHaveCount(0, { timeout: 45_000 });
  // D365 sets its own session cookies for crm.company.com

  // Step 4: Save ALL cookies + localStorage from ALL sites visited
  await context.storageState({ path: 'auth-states/admin-state.json' });
  // The state now contains:
  // cookies: [sso_token (.company.com), billing_session (billing.company.com), D365 cookies...]
  // origins: [auth.company.com localStorage, crm.company.com localStorage...]

  await browser.close();
}
```

Key insight: One `BrowserContext` accumulates cookies from ALL domains visited. The saved state captures all of them. When loaded in a test, all sites see their respective cookies.
</details>

---

### Challenge 5 [MCQ] — API Auth Performance

Your suite has 5 test roles (admin, customer, supervisor, auditor, agent). UI login takes 45 seconds per role in globalSetup. API token endpoint takes 2 seconds per role. How much time does switching to API auth save per CI run?

A) 43 seconds
B) 215 seconds (3m 35s)
C) 175 seconds (2m 55s)
D) 225 seconds (3m 45s)

<details><summary>Answer</summary>

**B — 215 seconds**.

UI auth:  5 roles × 45s = 225s
API auth: 5 roles × 2s  = 10s  (parallelized with Promise.all → effectively ~2s total)
Savings:  225s - 10s = **215 seconds per run**

With CI running 10 times per day: **2150 seconds = 36 minutes saved daily**.

Note: Even better when parallelized — with `Promise.all` for all 5 API calls, the total is ~2s regardless of role count (bounded by the slowest individual call).
</details>

---

**Navigation**: [← Chapter 15: UI-API Side Effects](15_CrossSite_Pattern5_UI_API_Side_Effects.md) | [Index](00_INDEX.md) | [→ Chapter 17: D365 Advanced Timing](17_D365_Advanced_Timing_Patterns.md)
