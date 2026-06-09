# Cross-Site Patterns — The 6-Pattern Catalog

> Specialised compositions of locator + fixture + auth + parallelism primitives for multi-site, multi-domain, multi-tab, multi-role test scenarios. The reference layer covers each primitive in isolation — this layer shows the COMPOSED patterns that actually appear in production CRM/portal/admin testing.
>
> Read first: [`reference/02_config.md`](../reference/02_config.md), [`reference/04_fixtures.md`](../reference/04_fixtures.md), [`reference/05_auth.md`](../reference/05_auth.md), [`reference/13_mocking.md`](../reference/13_mocking.md). The patterns below assume you know the primitives.

---

## Table of contents

1. [Why these patterns exist](#1-why-these-patterns-exist)
2. [The 6 patterns at a glance](#2-the-6-patterns-at-a-glance)
3. [Pattern 1 — Sequential Flow (Data Accumulator)](#3-pattern-1--sequential-flow)
4. [Pattern 2 — New Tab / Shared Context](#4-pattern-2--new-tab--shared-context)
5. [Pattern 3 — Dual Browser Contexts](#5-pattern-3--dual-browser-contexts)
6. [Pattern 4 — Token / Magic Link / Email](#6-pattern-4--token--magic-link)
7. [Pattern 5 — UI ↔ API Side Effects](#7-pattern-5--ui--api-side-effects)
8. [Pattern 6 — storageState Chaining](#8-pattern-6--storagestate-chaining)
9. [Mixing patterns — real workflows](#9-mixing-patterns)
10. [Per-pattern reliability concerns](#10-per-pattern-reliability)
11. [When patterns become anti-patterns](#11-when-patterns-go-wrong)

---

## 1. Why these patterns exist

Enterprise apps span domains:
- A CRM (admin.example.com) creates a customer.
- A portal (portal.example.com) gives that customer access.
- An auth IdP (auth.example.com) issues a session.
- A payments system (pay.example.com) settles transactions.
- An email service delivers confirmations.

A real E2E test may touch ALL FIVE. Each touch has timing, isolation, and cleanup concerns. These 6 patterns are the recurring shapes.

### 1.1 The cost of getting them wrong

| Pattern misuse | Symptom |
|---|---|
| Data accumulator with `let` instead of object | Cross-step closure bugs; mysterious null |
| New tab without `Promise.all` | 50–80% timeout rate in fast envs |
| Dual context without try/finally | Browser leak on test failure |
| Magic link race | "Token expired" errors |
| API verify before UI commit | Success-theatre passes; real bug ships |
| storageState saved before login complete | Empty cookies; all tests get 401 |

Each pattern has a canonical structure. Deviate at your peril.

---

## 2. The 6 patterns at a glance

| # | Pattern | Primary concern | Compose with |
|---|---|---|---|
| 1 | Sequential flow | Cross-step state across multiple `test.step` | Data accumulator, factories |
| 2 | New tab / shared context | Listener-before-trigger race | `Promise.all`, `context.waitForEvent('page')` |
| 3 | Dual browser contexts | Simultaneous sessions; cleanup order | `browser.newContext()` × 2, try/finally |
| 4 | Token / magic link | Email/SMS-mediated handoff | Email API, polling, expiry handling |
| 5 | UI ↔ API side effects | Verifying UI claims against truth | Three-layer verification, `expect.poll` |
| 6 | storageState chaining | Multi-role authenticated state | Setup project, dependencies, multi-state file |

---

## 3. Pattern 1 — Sequential Flow

**The scenario:** A single test does multi-step work that crosses systems. Each step produces output used by the next.

**Example workflow:**
1. Admin creates a customer in CRM.
2. CRM emits an event; portal provisions an account.
3. Portal sends a welcome email.
4. Test confirms the customer can log in.

### 3.1 The Data Accumulator

The wrong shape:

```typescript
// ❌ — let-primitive pattern
test('flow', async ({ page }) => {
  let customerId: string;          // module-level-feeling state
  let portalUserId: string;
  let confirmationLink: string;

  await test.step('create customer in CRM', async () => {
    customerId = await crmApi.createCustomer();
  });

  await test.step('verify portal user', async () => {
    portalUserId = await portalApi.findUser(customerId);
    // If step 1 failed, customerId is `let` undefined — type error or weird crash
  });
});
```

Problems:
- `let` is awkward to type (`string | undefined`).
- Inside-step closures don't catch the cross-step relationship.
- If a step throws, subsequent steps run with undefined state.

The right shape:

```typescript
// ✅ — object accumulator
interface FlowData {
  customerId: string | null;
  portalUserId: string | null;
  confirmationLink: string | null;
}

test('customer onboarding end-to-end', async ({ crmApi, portalApi, emailService }) => {
  const data: FlowData = {
    customerId: null,
    portalUserId: null,
    confirmationLink: null,
  };

  await test.step('CRM: create customer', async () => {
    const customer = await crmApi.createCustomer(PayloadsCustomer.default());
    data.customerId = customer.id;
  });

  await test.step('Portal: verify user provisioned', async () => {
    if (!data.customerId) throw new Error('customerId not set; previous step failed');
    data.portalUserId = await expect.poll(
      () => portalApi.findUserByCrmId(data.customerId!),
      { timeout: 30_000 },
    ).not.toBeNull() as unknown as string;
  });

  await test.step('Email: poll for welcome message', async () => {
    const email = await emailService.waitForEmail({
      to: `customer-${data.customerId}@test.com`,
      subject: /Welcome/,
      timeoutMs: 60_000,
    });
    const match = email.html.match(/href="(https:\/\/portal\.example\.com\/activate\?token=[^"]+)"/);
    data.confirmationLink = match?.[1] ?? null;
  });

  // ... continued
});
```

### 3.2 Why the object accumulator wins

| Aspect | `let` primitives | Object accumulator |
|---|---|---|
| Type | Every var `T \| undefined` | One typed `FlowData` interface |
| Forgetting to set | Subtle runtime error | Type-system caught |
| Passing to helpers | Need to pass each var | Pass the whole object |
| Debugging | Scattered `console.log(varA, varB)` | One `console.log(data)` |
| Cross-step relationship | Implicit | Explicit interface |

### 3.3 Naming conventions

Step names should describe the SYSTEM and the ACTION:

```typescript
await test.step('CRM API: create PENDING citation for customer', async () => { /* ... */ });
await test.step('Payments API: post payment for citation', async () => { /* ... */ });
await test.step('CRM UI: verify citation status is PAID', async () => { /* ... */ });
```

In trace viewer and reports, step names appear as a tree. Good names make failures grep-able and the trace navigable.

### 3.4 The "step depends on previous step" guard

```typescript
await test.step('verify citation', async () => {
  if (!data.citationId) {
    throw new Error('citationId not set — previous step likely failed');
  }
  await crmApi.assertCitationStatus(data.citationId, 'PAID');
});
```

Without the guard, a step's failure looks like "TypeError: Cannot read properties of null" — not actionable. With it, the error tells you WHERE the chain broke.

### 3.5 When sequential flows belong in `describe.serial`

If the data outlives a single test:

```typescript
test.describe.serial('Citation lifecycle', () => {
  const data: { citationId: string | null } = { citationId: null };

  test('Create citation', async ({ api }) => {
    data.citationId = (await api.createCitation()).id;
  });

  test('Pay citation', async ({ api }) => {
    if (!data.citationId) throw new Error('No citationId');
    await api.payCitation(data.citationId, 150);
  });

  test('Verify payment in CRM', async ({ page }) => {
    if (!data.citationId) throw new Error('No citationId');
    await page.goto(`/citations/${data.citationId}`);
    await expect(page.getByText('PAID')).toBeVisible();
  });
});
```

See [`reference/07_parallelism.md §5`](../reference/07_parallelism.md#5-serial-and-parallel) for the semantics of `describe.serial`.

### 3.6 Sequential flow vs single-test E2E

Usually prefer one large test with `test.step` over multiple small tests in `describe.serial`. Why:

| Single test + steps | `describe.serial` block |
|---|---|
| One trace, one HTML report entry | N traces |
| One retry restarts the whole flow | Retry restarts the block |
| One test timeout | Many timeouts to budget |
| Failure isolation: limited | Better — failing step is clear |

Pick based on:
- Steps are deeply coupled → single test.
- Steps could be reused (e.g., "create citation" used by 5 different tests) → factor into fixtures, keep as one test.

---

## 4. Pattern 2 — New Tab / Shared Context

**The scenario:** A user clicks "Open in new tab" — the test must drive the new tab.

### 4.1 The canonical pattern

```typescript
test('view order detail in new tab', async ({ page }) => {
  await page.goto('/orders');

  // CRITICAL — listener registered BEFORE click
  const [orderTab] = await Promise.all([
    page.context().waitForEvent('page'),
    page.getByRole('link', { name: 'Order ORD-001' }).click(),
  ]);

  await orderTab.waitForLoadState('domcontentloaded');
  await expect(orderTab.getByRole('heading', { name: 'Order ORD-001' })).toBeVisible();
  await orderTab.close();
});
```

The Promise.all pattern is exhaustively explained in [`reference/08_reliability.md §12`](../reference/08_reliability.md#12-race-conditions).

### 4.2 The new tab inherits context state

Both tabs share:
- Cookies
- localStorage / sessionStorage
- IndexedDB (per origin)
- Service workers

So if the original tab is logged in, the new tab is logged in too. No re-auth needed.

### 4.3 The new tab has its own page object

```typescript
class OrderTrackingPage {
  constructor(private readonly page: Page) {}
  readonly trackingNumber = this.page.locator('[data-testid="tracking-number"]');
  // ...
}

const [orderTab] = await Promise.all([
  page.context().waitForEvent('page'),
  page.getByRole('link', { name: 'Track' }).click(),
]);

const orderPom = new OrderTrackingPage(orderTab);
await expect(orderPom.trackingNumber).toHaveText('TRK-12345');
```

### 4.4 Multiple new tabs in sequence

```typescript
const [tab1] = await Promise.all([
  page.context().waitForEvent('page'),
  page.getByRole('link', { name: 'Tab 1' }).click(),
]);

// Switch focus back to original
await page.bringToFront();

const [tab2] = await Promise.all([
  page.context().waitForEvent('page'),
  page.getByRole('link', { name: 'Tab 2' }).click(),
]);

// Now you have three pages in the same context
await expect(tab1.locator('h1')).toBeVisible();
await expect(tab2.locator('h1')).toBeVisible();
```

### 4.5 Cleanup

```typescript
try {
  // ... test using orderTab
} finally {
  if (!orderTab.isClosed()) await orderTab.close();
}
```

Or rely on Playwright's automatic cleanup at test end — the context closes everything. Manual close is faster within multi-tab tests where memory matters.

### 4.6 When the new tab doesn't open

A button might fire `window.open(...)` only on `target="_blank"` + JS handler. If JS handler errors or popup blocker triggers:

```typescript
const [newTab] = await Promise.all([
  page.context().waitForEvent('page', { timeout: 5_000 }),
  page.click('#open-new-tab'),
]).catch(async (err) => {
  // The new tab didn't open — diagnose
  const errors = await page.evaluate(() => (window as any).__capturedErrors ?? []);
  throw new Error(`New tab failed to open: ${err}. Page errors: ${JSON.stringify(errors)}`);
});
```

---

## 5. Pattern 3 — Dual Browser Contexts

**The scenario:** Test admin + customer in the same test, simultaneously.

E.g., admin disables a feature flag → customer's UI changes in real-time.

### 5.1 Why not just two tabs?

Two tabs share auth state. Admin and customer use DIFFERENT auth states. You need two CONTEXTS, not two tabs.

### 5.2 The canonical pattern

```typescript
test('admin disabling feature reflects on customer', async ({ browser }) => {
  // ── Two independent contexts ─────────────────────────────
  const adminContext = await browser.newContext({ storageState: 'auth-states/admin.json' });
  const customerContext = await browser.newContext({ storageState: 'auth-states/customer.json' });

  const adminPage = await adminContext.newPage();
  const customerPage = await customerContext.newPage();

  try {
    // Setup: both users on their dashboards
    await adminPage.goto('/admin/feature-flags');
    await customerPage.goto('/dashboard');
    await expect(customerPage.getByText('Beta feature available')).toBeVisible();

    // Admin action
    await adminPage.getByLabel('Beta feature').uncheck();
    await adminPage.getByRole('button', { name: 'Save' }).click();

    // Customer sees the change (after re-fetch / polling)
    await customerPage.reload();
    await expect(customerPage.getByText('Beta feature available')).not.toBeVisible({ timeout: 30_000 });
  } finally {
    // ALWAYS cleanup — even on test failure
    await adminContext.close();
    await customerContext.close();
  }
});
```

### 5.3 The try/finally cleanup is mandatory

Without it, a test failure leaks contexts. After 100 failed runs, the runner has 200 leaked browser processes — slowdown, OOM, eventual crash.

### 5.4 The fixture refactor

The pattern repeated 10× in tests is begging for a fixture:

```typescript
const test = base.extend<{ adminPage: Page; customerPage: Page }>({
  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: 'auth-states/admin.json' });
    const page = await ctx.newPage();
    try { await use(page); } finally { await ctx.close(); }
  },
  customerPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: 'auth-states/customer.json' });
    const page = await ctx.newPage();
    try { await use(page); } finally { await ctx.close(); }
  },
});

// Tests now just take the fixtures:
test('admin / customer', async ({ adminPage, customerPage }) => {
  // Both are pre-authenticated; cleanup is automatic
});
```

See [`reference/04_fixtures.md`](../reference/04_fixtures.md).

### 5.5 Multi-context performance

Each context is a separate browser tab process. 2 contexts × N workers = up to 2N concurrent browser processes. Memory budget accordingly.

For 4 workers with dual contexts: 8 browser processes. At ~300 MB each, that's 2.4 GB. Fine on a 16 GB CI runner; OOM on a 4 GB runner.

### 5.6 Three or more contexts

```typescript
const contexts = await Promise.all([
  browser.newContext({ storageState: 'auth-states/admin.json' }),
  browser.newContext({ storageState: 'auth-states/manager.json' }),
  browser.newContext({ storageState: 'auth-states/user.json' }),
]);

const [adminPage, managerPage, userPage] = await Promise.all(
  contexts.map(c => c.newPage())
);

try {
  // Three-role test
} finally {
  await Promise.all(contexts.map(c => c.close()));
}
```

Rare but useful for permission-tier verification.

---

## 6. Pattern 4 — Token / Magic Link

**The scenario:** App sends a one-time link via email/SMS; user clicks it to complete an action (signup, password reset, MFA bypass).

### 6.1 The asynchronous handoff

```
Test ─────► API: trigger send
            │
            ▼
            Email queue (~1–30s)
            │
            ▼
Test ─────► Email API: poll for message
            │
            ▼
            Parse link from email body
            │
            ▼
Test ─────► Browser: navigate to link
            │
            ▼
            Verify the action completed
```

### 6.2 The email service abstraction

For test envs, use a real test email service (Mailosaur, MailHog) — see [`./email_testing.md`](./email_testing.md).

```typescript
interface EmailService {
  waitForEmail(opts: { to: string; subject: RegExp; timeoutMs: number }): Promise<{
    html: string;
    text: string;
    subject: string;
    receivedAt: Date;
  }>;
}
```

### 6.3 The pattern

```typescript
test('password reset via email link', async ({ page, request, emailService }) => {
  const testEmail = `reset-${randomUUID()}@inbox.mailosaur.net`;

  await test.step('trigger password reset', async () => {
    const response = await request.post('/api/auth/reset', { data: { email: testEmail } });
    expect(response.status()).toBe(202);
  });

  let resetLink: string;
  await test.step('wait for reset email', async () => {
    const email = await emailService.waitForEmail({
      to: testEmail,
      subject: /Reset your password/,
      timeoutMs: 60_000,
    });

    const match = email.html.match(/href="(https:\/\/app\.example\.com\/reset\?token=[^"]+)"/);
    if (!match) throw new Error(`No reset link in email body:\n${email.html}`);
    resetLink = match[1];
  });

  await test.step('complete reset via link', async () => {
    await page.goto(resetLink!);
    await page.getByLabel('New password').fill('NewSecret123!');
    await page.getByLabel('Confirm').fill('NewSecret123!');
    await page.getByRole('button', { name: 'Reset password' }).click();
    await expect(page.getByText('Password updated')).toBeVisible();
  });
});
```

### 6.4 Token expiry — the race window

Many reset/magic links expire in 5–15 minutes. In CI, tests can be slow. If the email takes 30s to arrive + 30s for the test to consume it, you're using 1 minute of the budget.

Mitigations:
- Poll the email service with short interval (1s); don't wait the full N seconds.
- Ensure tests don't sleep unnecessarily between getting the link and using it.
- Test config — use a long expiry in test env (e.g., 1 hour) configured by feature flag.

### 6.5 Email server-side delay

```typescript
emailService.waitForEmail({
  to: testEmail,
  subject: /Welcome/,
  timeoutMs: 60_000,
  // Internally polls every 1s
});
```

Mail servers can take 1–30 seconds to deliver. The poll interval matters more than the timeout for tail latency.

### 6.6 OTP flows (SMS / authenticator)

For SMS: most test orgs use Twilio test sandbox.
For TOTP authenticator codes: generate with `otplib` — see [`reference/05_auth.md §14`](../reference/05_auth.md#14-mfa-totp).

### 6.7 Magic links pattern in real apps

The most common use cases:
- Email verification on signup.
- Password reset.
- "Sign in with email link" (passwordless).
- Invite acceptance.
- Authorization step-up.

All follow the same pattern. Build one email-handoff helper; reuse everywhere.

---

## 7. Pattern 5 — UI ↔ API Side Effects

**The scenario:** UI says "Saved." Test verifies the API/DB actually committed the change.

### 7.1 The success theatre anti-pattern

```typescript
// ❌
test('citation can be paid', async ({ page }) => {
  await page.goto('/citations/CIT-001');
  await page.getByRole('button', { name: 'Pay' }).click();
  await expect(page.getByText('Payment successful')).toBeVisible();
  // Test passes — but did the payment actually post?
});
```

The UI saying "successful" is necessary but not sufficient. Bugs we've seen:
- API returned 200 with `{ "success": true, "id": null }` (silent failure).
- Payment was queued, never processed.
- Race condition: assertion ran during a brief render of stale state.

### 7.2 Three-layer verification

```typescript
test('payment is persisted end-to-end', async ({ page, citationsApi, db }) => {
  // ── UI: trigger ──────────────────────────────────────────
  await page.goto('/citations/CIT-001');
  await page.getByRole('button', { name: 'Pay' }).click();
  await expect(page.getByText('Payment successful')).toBeVisible();

  // ── API: verify the service layer ────────────────────────
  await expect.poll(
    async () => (await citationsApi.getById('CIT-001')).status,
    { timeout: 30_000 },
  ).toBe('PAID');

  // ── DB: verify the storage layer ─────────────────────────
  const dbResult = await db.query(
    'SELECT status, paid_at FROM citations WHERE id = $1',
    ['CIT-001'],
  );
  expect(dbResult.rows[0].status).toBe('PAID');
  expect(dbResult.rows[0].paid_at).not.toBeNull();
});
```

Three assertions instead of one. Each catches a different bug class.

### 7.3 The notification verification antipattern

Some teams add a "notifications" panel verification:

```typescript
// Trigger
await page.getByRole('button', { name: 'Pay' }).click();

// UI says success
await expect(page.getByText('Payment successful')).toBeVisible();

// "Notification" appeared
await expect(page.getByRole('alert')).toContainText('Payment posted');
```

The notification is STILL UI — same surface as the original "Success" toast. It doesn't add a verification layer. Don't conflate notification = ground truth.

### 7.4 The async backend pattern

If the backend processes asynchronously:

```typescript
// UI shows "Processing..."
await expect(page.getByText('Processing')).toBeVisible();

// Poll for the actual completion
await expect.poll(
  async () => (await citationsApi.getById('CIT-001')).status,
  { timeout: 120_000, intervals: [1_000, 2_000, 5_000] },
).toBe('PAID');

// UI updates after backend signals completion
await expect(page.getByText('Paid')).toBeVisible({ timeout: 30_000 });
```

### 7.5 Inverted verification — when API succeeds but UI doesn't update

```typescript
// API succeeds
await page.getByRole('button', { name: 'Pay' }).click();
await expect.poll(() => citationsApi.getById('CIT-001').then(c => c.status))
  .toBe('PAID');

// But the UI must also reflect it
await expect(page.getByText('Paid')).toBeVisible({ timeout: 30_000 });
```

If the API verifies first but the UI doesn't update, you've found a real bug: backend committed; frontend never re-fetched.

### 7.6 Don't over-verify

For simple cosmetic changes (theme toggle, sidebar collapse), three-layer verification is overkill. Reserve it for:

- Money flows (payments, refunds, fees).
- Identity changes (role, permission, account state).
- Compliance-relevant actions (consent, terms acceptance, audit-logged events).
- Cross-system effects (CRM → portal sync, etc.).

For everything else, UI-only is fine.

---

## 8. Pattern 6 — storageState Chaining

**The scenario:** Multiple roles share a global setup; each test uses a specific role's pre-authenticated state.

### 8.1 The setup project

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
    name: 'manager-tests',
    dependencies: ['setup'],
    use: { storageState: 'auth-states/manager.json' },
    grep: /@manager/,
  },
  {
    name: 'user-tests',
    dependencies: ['setup'],
    use: { storageState: 'auth-states/user.json' },
    grep: /@user/,
  },
],
```

### 8.2 The setup spec

```typescript
// global.setup.ts
import { test as setup } from '@playwright/test';

setup('auth as admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel('Password').fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL(/\/dashboard/);
  await page.context().storageState({ path: 'auth-states/admin.json' });
});

setup('auth as manager', async ({ page }) => {
  // Similar
  await page.context().storageState({ path: 'auth-states/manager.json' });
});

setup('auth as user', async ({ page }) => {
  // Similar
  await page.context().storageState({ path: 'auth-states/user.json' });
});
```

Three setup tests run in parallel (independent), producing three state files.

### 8.3 Token refresh

If your sessions expire mid-run (long suites + short tokens):

```typescript
const test = base.extend<{}, { refreshSession: () => Promise<void> }>({
  refreshSession: [async ({ browser }, use) => {
    const refresher = async () => {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto('/login');
      await page.getByLabel('Email').fill(process.env.ADMIN_EMAIL!);
      await page.getByLabel('Password').fill(process.env.ADMIN_PASSWORD!);
      await page.getByRole('button', { name: 'Log in' }).click();
      await page.waitForURL(/\/dashboard/);
      await page.context().storageState({ path: 'auth-states/admin.json' });
      await ctx.close();
    };
    await use(refresher);
  }, { scope: 'worker' }],
});

test('long-running test that may exceed session lifetime', async ({ page, refreshSession }) => {
  // ... 30 minutes of test work
  // Mid-test refresh
  await refreshSession();
  // ... continue
});
```

### 8.4 Cross-domain SSO

When admin.example.com and portal.example.com share an SSO cookie, both can be in the same storageState:

```typescript
setup('SSO login', async ({ page }) => {
  await page.goto('https://idp.example.com');
  await login(page);

  // Visit each app once to populate origin-specific storage
  await page.goto('https://admin.example.com');
  await page.goto('https://portal.example.com');

  await page.context().storageState({ path: 'auth-states/sso.json' });
});

// Then any test using this state is logged into BOTH apps
```

### 8.5 Multi-storageState in one test

Combined with Pattern 3 (dual contexts):

```typescript
test('admin and user interact', async ({ browser }) => {
  const admin = await browser.newContext({ storageState: 'auth-states/admin.json' });
  const user = await browser.newContext({ storageState: 'auth-states/user.json' });

  // ... see Pattern 3 for details
});
```

---

## 9. Mixing patterns

Real tests combine several patterns.

### 9.1 Onboarding flow (1 + 4)

```typescript
test('end-to-end customer onboarding', async ({ page, crmApi, emailService }) => {
  const data: { customerId: string | null; activationLink: string | null } = {
    customerId: null,
    activationLink: null,
  };

  // Pattern 1: data accumulator across steps

  await test.step('CRM: create customer', async () => {
    const c = await crmApi.createCustomer(PayloadsCustomer.default());
    data.customerId = c.id;
  });

  // Pattern 4: email handoff
  await test.step('Email: get activation link', async () => {
    const email = await emailService.waitForEmail({ /* ... */ });
    data.activationLink = parseLink(email.html);
  });

  // ... continue
});
```

### 9.2 Dual-role real-time test (3 + 5 + 6)

```typescript
test('admin disables feature; user sees update', async ({ browser, request }) => {
  // Pattern 6: pre-authenticated dual contexts via storageState
  const admin = await browser.newContext({ storageState: 'auth-states/admin.json' });
  const user = await browser.newContext({ storageState: 'auth-states/user.json' });

  const adminPage = await admin.newPage();
  const userPage = await user.newPage();

  try {
    // Pattern 3: simultaneous sessions
    await adminPage.goto('/admin/flags');
    await userPage.goto('/dashboard');

    // Pattern 5: UI + API verification
    await adminPage.getByLabel('Beta feature').uncheck();
    await adminPage.getByRole('button', { name: 'Save' }).click();

    // Verify backend committed
    await expect.poll(
      async () => (await request.get('/api/flags')).json().then((j: any) => j.beta),
      { timeout: 10_000 },
    ).toBe(false);

    // Then verify customer UI updates
    await userPage.reload();
    await expect(userPage.getByText('Beta feature')).not.toBeVisible({ timeout: 30_000 });
  } finally {
    await admin.close();
    await user.close();
  }
});
```

### 9.3 New tab driven by email link (2 + 4)

```typescript
test('email link opens detail in new tab', async ({ page, emailService }) => {
  await triggerEmailSend(page);
  const email = await emailService.waitForEmail({ /* ... */ });
  const link = parseLink(email.html);

  // Pattern 2: new tab
  const [detailTab] = await Promise.all([
    page.context().waitForEvent('page'),
    page.goto(link),  // some apps open links in new tab
  ]);

  await detailTab.waitForLoadState('domcontentloaded');
  await expect(detailTab.getByRole('heading', { name: 'Detail' })).toBeVisible();
});
```

---

## 10. Per-pattern reliability

Each pattern has its own flake vectors. The full reference is [`reference/08_reliability.md`](../reference/08_reliability.md). Per-pattern highlights:

| Pattern | Most common flake |
|---|---|
| 1 — Sequential flow | Step dependency unrecognised; null propagation |
| 2 — New tab | `waitForEvent` after trigger |
| 3 — Dual context | Leak on test failure (try/finally missing) |
| 4 — Magic link | Token expiry race; email server delay |
| 5 — UI ↔ API | UI assertion runs before API commit |
| 6 — storageState | Saved before login complete; cookies missing |

### 10.1 Pattern 1 flake — the silent step

```typescript
await test.step('create customer', async () => {
  try {
    data.customerId = await api.createCustomer();
  } catch (e) {
    // ❌ Swallowed
    console.log('skipping', e);
  }
});

// Next step assumes data.customerId is set
await test.step('verify', async () => {
  await api.getCustomer(data.customerId!);  // BOOM
});
```

Never swallow step errors. If a step fails, let it throw — the test reports failure clearly.

### 10.2 Pattern 2 flake — Promise.all order

```typescript
// ❌ click first
await page.click('#open');
const newPage = await context.waitForEvent('page');

// ✅ Promise.all
const [newPage] = await Promise.all([
  context.waitForEvent('page'),
  page.click('#open'),
]);
```

### 10.3 Pattern 3 flake — context not closed

```typescript
// ❌
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto('/');
await ctx.close();  // doesn't run if a prior await throws

// ✅
const ctx = await browser.newContext();
try {
  const page = await ctx.newPage();
  await page.goto('/');
} finally {
  await ctx.close();
}
```

### 10.4 Pattern 4 flake — looking for an email before it's there

```typescript
// ❌
const inbox = await emailService.getInbox(testEmail);
expect(inbox.messages.length).toBeGreaterThan(0);

// ✅
await emailService.waitForEmail({ to: testEmail, subject: /.../, timeoutMs: 60_000 });
```

Polling APIs are essential for async-delivery systems.

### 10.5 Pattern 5 flake — async backend, UI cached

```typescript
// ❌
await page.getByRole('button', { name: 'Pay' }).click();
await expect.poll(() => api.getStatus()).toBe('PAID');
await expect(page.getByText('Paid')).toBeVisible();  // page hasn't refetched

// ✅
await page.getByRole('button', { name: 'Pay' }).click();
await expect.poll(() => api.getStatus()).toBe('PAID');
await page.reload();  // or wait for the UI's own polling cycle
await expect(page.getByText('Paid')).toBeVisible();
```

### 10.6 Pattern 6 flake — saving state too early

Covered exhaustively in [`reference/05_auth.md §3.6`](../reference/05_auth.md#36-the-saved-too-early-pitfall).

---

## 11. When patterns go wrong

### 11.1 Sequential flow becoming a monster

A 15-step test isn't a "pattern" — it's a script that's hard to maintain. Sign your test is overgrown:

- 15+ `test.step` calls.
- The `FlowData` interface has 20+ fields.
- The test spans 4+ systems.

Refactor by:
- Extracting common segments into helper functions.
- Splitting into multiple tests (with the same setup factored into fixtures).
- Reducing scope (maybe steps 1-5 don't NEED to be in the same test as steps 10-15).

### 11.2 Dual context becoming a swarm

If you're spawning 5+ contexts per test, you're probably testing the wrong layer. The app's permission system is better tested with API-level role assertions than 5 simultaneous browsers.

### 11.3 storageState chaining becoming brittle

If you have 8 storageState files for 8 roles, you're maintaining 8 setup specs that can each break differently. Consolidate:

- One setup spec with a parameterised loop.
- Fewer roles (test only the roles you actually have business cases for).
- API-only tests for the role × permission matrix; UI tests only for role-specific UX.

### 11.4 Magic links breaking everywhere

If half your tests depend on email and each email handoff adds 30–60 seconds, your suite is slow. Mitigations:

- API-side bypass for tests that don't need the email flow (test the email separately).
- Mailosaur with regional endpoints (US/EU) — faster than generic test addresses.
- For password reset specifically: have a dev-only `/api/test/reset-password` endpoint that bypasses email.

---

## Cross-references

- Fixture primitives: [`../reference/04_fixtures.md`](../reference/04_fixtures.md)
- Auth primitives: [`../reference/05_auth.md`](../reference/05_auth.md)
- Parallelism + scope rules: [`../reference/07_parallelism.md`](../reference/07_parallelism.md)
- Reliability deep dive: [`../reference/08_reliability.md`](../reference/08_reliability.md)
- Data accumulator example in code: [`../framework/utilities/data/test-data.bridge.ts`](../framework/utilities/data/test-data.bridge.ts)
- Email handoff: [`./email_testing.md`](./email_testing.md)
- D365 multi-entity workflows: [`./d365.md §16`](./d365.md#16-per-entity-cookbook)
