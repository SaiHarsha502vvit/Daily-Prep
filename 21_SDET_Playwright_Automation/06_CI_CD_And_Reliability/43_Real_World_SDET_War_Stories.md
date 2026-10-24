# 43. Real-World SDET War Stories — Problems, Diagnoses & Solutions

**Navigation**: [← Chapter 42: Polling Patterns](../03_Real_World_Scenarios/42_Polling_Async_Data_Patterns.md) | [Index](../00_INDEX.md) | [→ Chapter 44: Enterprise API Client Library](../05_Enterprise_Framework/44_Enterprise_API_Client_Library.md)

**Cross-links:**

- [`26_Flakiness_Diagnosis_and_Fixing.md`](./26_Flakiness_Diagnosis_and_Fixing.md) — Systematic flakiness framework
- [`08_Browser_Internals_for_SDETs.md`](../02_Test_Architecture/08_Browser_Internals_for_SDETs.md) — The internals behind ghost click problems
- [`09_Parallel_Execution_Workers.md`](../02_Test_Architecture/09_Parallel_Execution_Workers.md) — Data collision war stories

---

## 5W1H

> **Provenance and version note.** The 15 stories below are **illustrative composites**: each is a pattern that recurs in enterprise suites, written as a scenario. They are not reports of specific, citable incidents, and the numbers (token TTLs, suite durations, retry rates, ids, ticket counts) are invented to make the arithmetic concrete. The names `citationsClient`, `paymentsClient`, `dbClient`, `PayloadsCitation`, `masterSearch` and the D365 markup are this module's fictional framework; the Playwright and Node calls are real. Where a story's mechanism is a claim about how Playwright or a browser behaves, it was **run on `@playwright/test` 1.64.1 / Chromium** and the result is marked "measured". Where the first draft of a story described behaviour that does not happen (Stories 1, 5, 7, 12 and Challenge 5 each had one), the story now describes the behaviour that does. Breaking changes between Playwright 1.50 and 1.64 are in [Chapter 69](../07_Specialised_Testing/69_Whats_New_Playwright_1_57_to_1_64.md).

- **WHAT**: 15 SDET problems typical of enterprise test automation — each with the symptom, the diagnostic steps, the root cause, the fix, and the prevention rule.
- **WHY**: Text-book patterns teach you the theory. War stories teach you what goes wrong in reality. Each story below is a pattern that costs teams hours before anyone finds the root cause. You don't have to.
- **WHO**: SDETs working on D365/CRM, enterprise SPA/MPA hybrid environments, CI/CD pipelines, and parallel test execution.
- **WHEN**: Read this when you encounter a test failure you can't explain. Come back to it as a reference when diagnosing flaky tests.
- **HOW**: Each story follows the same format: **Situation → Symptoms → Root Cause → Fix → Prevention Rule**.

---

## War Story 1: The Ghost Click — Button Visible, Click Does Nothing

### Situation

D365 CRM, CommandBar toolbar (illustrative composite). A test clicks "Edit Customer". The step passes (no error thrown). But the Customer Edit form never opens.

### Symptoms

```
✓ test.step('Click Edit Customer') — PASSES (no exception)
✗ test.step('Fill in First Name') — FAILS: Timeout 30000ms exceeded
  locator: [data-id="firstname"]
  waiting for visible...

Debugging: page.getByRole('menuitem', { name: 'Edit Customer' }).isVisible() → true
```

### Two different causes look identical from the outside

A "click that did nothing" has two very different mechanics, and only one of them is an overlay. **Measure which one you have before you fix anything.**

**Cause A: an overlay covers the button.** Playwright's actionability checks include "receives events": it hit-tests the click point and, if another element would receive the click, it **does not click**. It logs the interceptor and retries until the timeout. So with a covering overlay the step does **not** pass silently; it fails (measured on 1.64.1, overlay `div.ms-Layer` with `pointer-events: auto` over a button):

```
TimeoutError: locator.click: Timeout 2500ms exceeded.
  - <div class="ms-Layer"></div> intercepts pointer events
  - retrying click action
```

The diagnostic for this case is the log line itself, or `elementFromPoint` when you want to know what the overlay is:

```typescript
const box = await page.getByRole("menuitem", { name: "Edit Customer" }).boundingBox();
if (!box) throw new Error("not rendered");
const hit = await page.evaluate(
  ({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    return { tag: el?.tagName, class: el?.className, id: el?.id };
  },
  { x: box.x + box.width / 2, y: box.y + box.height / 2 }, // the centre, which is where click() aims
);
console.log(hit); // e.g. { tag: 'DIV', class: 'ms-Layer', id: 'layer-panel-overlay' }
```

**Cause B: the click lands on the right element, but nothing is listening yet.** This is the one that produces a passing step followed by a missing form. The button is in the DOM, visible, enabled, stable and un-obscured, so every actionability check passes and the click is delivered; the framework just has not attached the handler yet (server-rendered markup before hydration, or a ribbon whose command bindings load after the markup). Measured: a button whose `onclick` is attached by a script 1500 ms after load; `click()` returned immediately with no error and the handler never ran (page title stayed `""`).

Playwright cannot see this: "is there a listener on that node?" is not an actionability check.

### Root cause (for the composite)

The CommandBar renders the buttons first and binds the commands after a data call. The step passed because the click was delivered to the real button, 1.5 seconds before the button did anything.

### Fix

Make the test wait for an **observable ready signal** instead of retrying the click blindly. In order of preference:

```typescript
// 1. Best: wait for something the app does when the commands are bound (a class, aria-disabled
//    flipping, a network call that loads the ribbon). Whatever your app actually exposes.
await expect(page.locator('[data-id="commandbar"]')).not.toHaveAttribute("aria-busy", "true");

// 2. When there is no such signal: retry the click AND its effect as one unit.
//    (Measured: with a handler attached 1500 ms late, the first click is lost and a later one lands.)
await expect(async () => {
  await page.getByRole("menuitem", { name: "Edit Customer" }).click({ timeout: 1_000 });
  await expect(page.locator('[data-id="firstname"]')).toBeVisible({ timeout: 500 });
}).toPass({ timeout: 10_000 });
```

Caveat on option 2: it re-clicks, so it is only safe when a lost click is harmless and an extra click is also harmless (opening a form: yes; "Delete": no, never). For an overlay (cause A) none of this is needed: Playwright already waits for it, and if it never goes away the error names it, so fix the overlay or wait for the thing that dismisses it (`await expect(overlay).toHaveCount(0)`).

### Prevention Rule

> **Rule**: When a click "succeeds" but nothing happens, first ask which of two things happened. If the log says `intercepts pointer events`, something is covering the target (`elementFromPoint` names it). If the click returned cleanly, the target received it and was not ready: assert on the click's **effect**, not on the click, and wait on a ready signal. See [Chapter 8](../02_Test_Architecture/08_Browser_Internals_for_SDETs.md) for the render phases behind this.

---

## War Story 2: The Stale Session — Tests Fail After 45 Minutes

### Situation

Large regression suite (illustrative composite): 200 tests, one worker, about 55 minutes end to end. Tests 1–163 pass. Test 164 suddenly fails with `401 Unauthorized`, and so does every test after it.

### Symptoms

```
Test 164/200 — FAILED
  Error: API call returned 401
  URL: POST /api/v2/citations
  Response body: { "error": "Token expired", "code": "AUTH_TOKEN_EXPIRED" }

Test 165/200 — FAILED (same error)
...
Test 200/200 — FAILED (same error)
```

No network error. No application error. Just `401` from test 164 onward.

### Root Cause Diagnosis

```typescript
// Decode the JWT from the stored auth token (diagnostics only: this does not verify the signature)
const token = process.env.TEST_AUTH_TOKEN!;
const payloadPart = token.split(".")[1];
if (payloadPart === undefined) throw new Error("not a JWT");
const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as {
  iat: number;
  exp: number;
};

console.log({
  issuedAt: new Date(payload.iat * 1000).toISOString(),
  expiresAt: new Date(payload.exp * 1000).toISOString(),
  ttlMinutes: (payload.exp - payload.iat) / 60,
});
// Output:
// issuedAt:  2026-05-28T08:00:00.000Z
// expiresAt: 2026-05-28T08:45:00.000Z
// ttlMinutes: 45

// The token expires 45 minutes after issue.
// The suite starts at 08:00 and averages 16.5 s per test (55 min / 200).
// Test 164 starts at 08:00 + 163 x 16.5 s = 08:44:50, then runs and calls the API after 08:45.
```

(A JWT payload is **base64url**, not plain base64. Node's `"base64"` decoder happens to accept the URL-safe alphabet too, which is why the sloppy version works, but `"base64url"` says what you mean.)

**Root Cause**: The OAuth access token created in `globalSetup` (and stored in `storageState.json` or an env var) has a 45-minute TTL. The suite takes 55 minutes. The token dies mid-run, and nothing in the suite ever asks for a new one. With several workers the same thing happens, just at a different test number per worker, which is why you should key the diagnosis on wall-clock time, not on "test N".

### Fix

Put the expiry check where it will really run: **a test-scoped fixture that executes before every test**, backed by a worker-scoped holder that remembers the current tokens. (An earlier draft of this story defined a `getValidAccount()` helper but never called it, so nothing ever refreshed. The version below was run against a local token endpoint with a 125 s lifetime: test 1 and 2 used token `a1`, test 3 started inside the 2-minute buffer and was handed a refreshed `a2`.)

```typescript
// utils/auth.ts
export interface Account {
  userId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
}

/** Decode the `exp` claim of a JWT without verifying it (diagnostics only). */
export function decodeJwtExpiry(token: string): Date {
  const payloadPart = token.split(".")[1];
  if (payloadPart === undefined) throw new Error("Invalid JWT format");
  const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as { exp?: number };
  if (typeof payload.exp !== "number") throw new Error("JWT has no exp claim");
  return new Date(payload.exp * 1000);
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
}

function toAccount(body: TokenResponse): Account {
  return {
    userId: body.user_id,
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    tokenExpiresAt: new Date(Date.now() + body.expires_in * 1000),
  };
}

async function tokenRequest(params: Record<string, string>): Promise<Account> {
  const response = await fetch(process.env.TOKEN_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.OAUTH_CLIENT_ID!,
      client_secret: process.env.OAUTH_CLIENT_SECRET!, // fake placeholder in .env, never committed
      ...params,
    }),
  });
  if (!response.ok) throw new Error(`Token request failed: ${response.status}`);
  return toAccount((await response.json()) as TokenResponse);
}

export const loginAndGetAccount = (): Promise<Account> =>
  tokenRequest({ grant_type: "password", username: process.env.TEST_USER!, password: process.env.TEST_PASSWORD! });

export const refreshAccessToken = (refreshToken: string): Promise<Account> =>
  tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken });
```

```typescript
// fixtures/auth.fixture.ts
import { test as base } from "@playwright/test";
import { loginAndGetAccount, refreshAccessToken, type Account } from "../utils/auth";

const REFRESH_BUFFER_MS = 2 * 60 * 1000; // refresh when < 2 min of life remain

class AccountHolder {
  constructor(private current: Account) {}

  async get(): Promise<Account> {
    const remainingMs = this.current.tokenExpiresAt.getTime() - Date.now();
    if (remainingMs < REFRESH_BUFFER_MS) {
      console.log(`[auth] token has ${Math.round(remainingMs / 1000)}s left, refreshing`);
      this.current = await refreshAccessToken(this.current.refreshToken);
    }
    return this.current;
  }
}

export const test = base.extend<{ account: Account }, { accountHolder: AccountHolder }>({
  // Worker scope: one login per worker, and the holder outlives every test in that worker.
  accountHolder: [
    async ({}, use) => {
      await use(new AccountHolder(await loginAndGetAccount()));
    },
    { scope: "worker" },
  ],
  // Test scope: runs before EVERY test, so the check actually happens.
  account: async ({ accountHolder }, use) => {
    await use(await accountHolder.get());
  },
});
```

Limits to know about:

- The check runs **at the start of each test**. A single test that itself outlives the token needs the refresh inside its API client (check before each request, or retry once on `401` after refreshing).
- If your identity provider **rotates refresh tokens**, never share one refresh token between workers; each worker logs in on its own, as above, or the second worker's refresh invalidates the first's.
- Compile note: these files type-check under `strict` + `noUncheckedIndexedAccess` + `noUnusedLocals` (the `split(".")[1]` is `string | undefined`, which is why it is guarded).

### Prevention Rule

> **Rule**: ALWAYS decode your JWT token and log its expiry time during `globalSetup`. Compare `ttlMinutes` to your estimated suite duration. If `suite duration > token TTL × 0.9`, implement token refresh in a **test-scoped** fixture (so it runs per test), not in a helper nobody calls. For how storage state, tokens and refresh interact, see [Chapter 57](../03_Real_World_Scenarios/57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md).

---

## War Story 3: The Silent 200 — API Says Success, Data Is Wrong

### Situation

(Illustrative composite.) A citation creation test has been in the suite for 3 months. Always green. Production incident: 50 citations were created with the wrong `customerId` — they were assigned to the wrong customer. Investigation reveals the issue has been happening for 2 weeks.

### Symptoms

```
Test "Create citation — API returns 201" → PASSES for 3 months
Production incident: Citations created via bulk upload have wrong customerId
Postmortem question: "Why didn't the tests catch this?"
```

### Root Cause Diagnosis

```typescript
// The existing test that "passed":
test("Create citation returns 201", async ({ citationsClient, account }) => {
  // createRaw() returns Playwright's APIResponse (this module's fictional client wraps request.post)
  const response = await citationsClient.createRaw({
    customerId: account.userId,
    amount: 150.0,
    type: "PARKING",
  });

  // ❌ Only asserted on status code!
  expect(response.status()).toBe(201);
  // Never checked: body.customerId === account.userId
  // Never checked: body.amount === 150.00
  // Never checked: body.type === 'PARKING'
});
```

**Root Cause** (invented for the composite): The API had a race condition in the bulk upload handler. When multiple citations were created simultaneously, the handler sometimes used the wrong `customerId` from a shared cache. The API still returned `201` with the correct `citationId` — but the `customerId` in the database was wrong.

The test was asserting on the wrong layer: HTTP status tells you the API received the request. It doesn't tell you the data was stored correctly.

### Fix

```typescript
// ✅ Three-layer verification — the correct pattern
test("Create citation — verified at API + DB level", async ({
  citationsClient,
  dbClient,
  account,
}) => {
  const payload = PayloadsCitation.parking({ customerId: account.userId });

  // Layer 1: API response — check BODY, not just status
  const citation = await citationsClient.create(payload);

  expect(citation.citationId).toMatch(/^CIT-/);
  expect(citation.customerId).toBe(account.userId); // ← THE CRITICAL CHECK
  expect(citation.amount).toBe(payload.amount);
  expect(citation.type).toBe("PARKING");
  expect(citation.status).toBe("PENDING");

  // Layer 2: DB verification — ground truth
  const dbRow = await dbClient.queryOne<{
    customer_id: string;
    status: string;
    amount: string; // NUMERIC columns arrive as strings from most drivers (pg does this)
  }>(
    "SELECT customer_id, status, amount FROM citations WHERE citation_id = $1",
    [citation.citationId],
  );
  expect(dbRow?.customer_id).toBe(account.userId); // ← DB must agree with API
  expect(dbRow?.status).toBe("PENDING");
  expect(Number(dbRow?.amount)).toBe(payload.amount);
});
```

### Prevention Rule

> **Rule**: HTTP `2xx` ≠ correct data. Always assert on the **response body** fields that matter to your business logic. For write operations (POST/PUT/PATCH), add DB verification as the ground-truth layer. A test that only checks status codes is a false sense of security.

---

## War Story 4: The Parallel Collision — Tests Pass Solo, Fail in CI

### Situation

(Illustrative composite.) Test suite runs fine locally (single worker). In CI with 4 workers, random failures every run. Different tests fail each time. No consistent pattern.

### Symptoms

```
CI Run 1:  Tests 3, 15, 42 fail with "Citation already exists for customer"
CI Run 2:  Tests 7, 23, 51 fail with "Duplicate email address"
CI Run 3:  Tests 1, 39 fail with "Customer account at maximum citations limit"
```

Complete randomness. None of these errors appear locally.

### Root Cause Diagnosis

```typescript
// The problematic test file (many tests use same customer):
const TEST_CUSTOMER_ID = "CUS-TEST-001"; // module-level — shared across ALL tests

test("Create citation for test customer", async ({ citationsClient }) => {
  await citationsClient.create({
    customerId: TEST_CUSTOMER_ID, // ← ALL workers hit the same customer!
    amount: 150,
  });
});

test("Get citations for test customer", async ({ citationsClient }) => {
  const citations = await citationsClient.getAll({
    customerId: TEST_CUSTOMER_ID,
  });
  expect(citations.length).toBe(1); // ← Worker 2 created 3 citations → this fails
});

test("Delete all test citations", async ({ citationsClient }) => {
  await citationsClient.deleteAll({ customerId: TEST_CUSTOMER_ID });
  // ← Worker 3 is still creating while Worker 1 deletes!
});
```

**Root Cause**: Shared **backend** test data. `TEST_CUSTOMER_ID` is a `const`, so it is not mutable state in the test process; the problem is that every worker process reads the same constant and then mutates the same customer on the server. Workers simultaneously create, assert on, and delete data for that one customer. Classic race condition. (Each worker is its own Node process, so module-level JS variables are *not* shared across workers; the shared thing is the row behind the id.)

### Fix

```typescript
// ✅ Worker-scoped unique customer — no collision possible
export const test = base.extend<object, { account: TestAccount }>({
  account: [
    // NOT `{ request }`: `request` is test-scoped and Playwright refuses to start with
    // `worker fixture "account" cannot depend on a test fixture "request"` (measured, 1.64.1).
    // A worker fixture builds its own context from the worker-scoped `playwright` fixture.
    async ({ playwright }, use, workerInfo) => {
      const request = await playwright.request.newContext({
        baseURL: process.env.API_BASE_URL, // a test-scoped `baseURL` is not available here either
      });

      // Each worker creates its OWN isolated test account
      const uniqueEmail = `test-w${workerInfo.parallelIndex}-${crypto.randomUUID()}@testenv.com`;

      const createResponse = await request.post("/api/v2/users", {
        data: {
          email: uniqueEmail,
          name: "Playwright Test User",
          role: "CUSTOMER",
          isTestUser: true, // flagged for easy cleanup
        },
      });
      const testAccount = (await createResponse.json()) as TestAccount;

      await use(testAccount);

      // Teardown: delete this worker's account and all its data
      await request.delete(`/api/v2/users/${testAccount.userId}?cascade=true`);
      await request.dispose();
    },
    { scope: "worker" },
  ],
});

// Now each test file gets its own isolated customer:
test("Create citation", async ({ citationsClient, account }) => {
  await citationsClient.create({
    customerId: account.userId, // Worker 1's unique customer
    amount: 150,
  });
  // Worker 2 creates for its own unique customer — zero collision
});
```

### Prevention Rule

> **Rule**: **A hard-coded id that tests write to is banned** in parallel suites (and so is anything mutable at module level that a fixture shares, which is only safe within one worker). Every piece of backend data that is written to must be unique per test (or per worker). Generate identifiers with `crypto.randomUUID()` (`Date.now()` alone can collide across workers in the same millisecond), and include `workerInfo.parallelIndex` (stable across worker restarts; `workerIndex` changes when a failed test's worker is replaced) when you want them traceable. Playwright also sets `TEST_PARALLEL_INDEX` / `TEST_WORKER_INDEX` env vars in each worker. See [Chapter 9](../02_Test_Architecture/09_Parallel_Execution_Workers.md) and [Chapter 28](../03_Real_World_Scenarios/28_Test_Data_Lifecycle_and_Cleanup.md).

---

## War Story 5: The ARIA Impostor — Wrong Element Found

### Situation

(Illustrative composite.) A D365 CRM page has a customer header section with "Edit" in the CommandBar, and a citation details section with its own "Edit" button. A test uses `page.getByRole('button', { name: 'Edit' })`. First it throws; then somebody "fixes" it, and it clicks the wrong "Edit".

### Symptoms

```
Run 1 (the plain locator):
  Error: locator.click: Error: strict mode violation:
  getByRole('button', { name: 'Edit' }) resolved to 3 elements:
    1) <button aria-label="Edit">Edit</button> aka getByLabel('Edit')
    2) <button>Edit</button> aka getByRole('button', { name: 'Edit' }).nth(1)
    ...

Run 2 (after someone added .first() to make the error go away):
  Test "Edit citation status" fails:
    Expected: Citation status form to open
    Actual:   Customer edit form opened instead
```

A locator that matches several elements does **not** click "the first one"; `click()` refuses with a strict-mode violation (measured, 1.64.1). The wrong click only happens because `.first()` / `.nth()` was bolted on to silence that error, which is the real anti-pattern here.

### Root Cause Diagnosis

```typescript
// Debug: how many elements match, and what are they?
const editButtons = page.getByRole("button", { name: "Edit" });
const count = await editButtons.count();
console.log(`Found ${count} matches`); // Found 3

for (let i = 0; i < count; i++) {
  const html = await editButtons.nth(i).evaluate((el) => el.outerHTML);
  console.log(`[${i}]: ${html.substring(0, 100)}`);
}
// [0]: <button class="ms-Button customer-edit" aria-label="Edit">Edit</button>      ← header section
// [1]: <button class="ms-Button citation-edit" aria-label="Edit">Edit</button>      ← the one we want
// [2]: <button class="ms-Button" aria-label="Edit Customer Notes">...</button>      ← substring match
```

Two independent reasons it matches more than you meant:

1. **`name` is a case-insensitive substring match by default.** `{ name: 'Edit' }` also matches "Edit Customer Notes". `exact: true` makes it a whole-string, case-sensitive match (measured: 3 matches become 2 for the same DOM).
2. **The same label legitimately appears in two sections.** That is a scoping problem, not a role problem.

A D365 CommandBar item that is exposed as `role="menuitem"` is **not** a match for `getByRole('button')` at all; asking for the wrong role gives you *fewer* matches (or zero), not an impostor. So check the role in DevTools' Accessibility pane before choosing between `button` and `menuitem`.

### Fix

```typescript
// ❌ BEFORE: ambiguous, then silenced with .first()
await page.getByRole("button", { name: "Edit" }).first().click();

// ✅ AFTER: Scope + exact name + the correct role
// Approach 1: Scope to the specific panel/section
const citationPanel = page.getByTestId("citation-detail-panel");
await citationPanel.getByRole("button", { name: "Edit", exact: true }).click();

// Approach 2: If it's in a CommandBar and exposed as a menuitem, use that role
await page
  .locator('[data-id="commandbar"]')
  .getByRole("menuitem", { name: "Edit Citation" })
  .click();

// Approach 3: a test id (most stable, needs a developer to add it)
await page.getByTestId("citation-edit-btn").click();

// How to find the real ARIA role:
// Chrome DevTools → Elements tab → click element → Accessibility tab (right side)
// Role field shows the exact ARIA role Playwright will use
```

### Prevention Rule

> **Rule**: Treat a strict-mode violation as information, not as an obstacle: it is telling you the locator is ambiguous. Never "fix" it with `.first()` / `.nth()` unless the order is itself what you are testing. Scope to a container, add `exact: true`, and pick the role DevTools reports (`menuitem` for many CommandBar entries). `expect(locator).toHaveCount(1)` is a good diagnostic step while you narrow it.

---

## War Story 6: The Time Zone Trap — Tests Fail on CI on Specific Days

### Situation

(Illustrative composite.) Tests run fine on developer machines (IST, UTC+5:30). In CI (a container whose clock is UTC), most tests pass but date-related tests fail intermittently. Failures cluster in the hours around midnight IST and on the last day of the month.

### Symptoms

```
Local (IST):  PASSES at any time
CI (UTC):     FAILS between 18:30 and 24:00 UTC (= 00:00-05:30 IST the next day)
CI (UTC):     FAILS on the last day of a 31-day month for "last month's records" tests
```

### Root Cause Diagnosis

```typescript
// The problematic code:
const today = new Date().toLocaleDateString("en-GB"); // DD/MM/YYYY in the HOST's time zone
// The instant 2026-05-31T19:00:00Z (all outputs measured with Node 22):
//   host in IST: Mon Jun 01 2026 00:30  -> '01/06/2026'
//   host in UTC: Sun May 31 2026 19:00  -> '31/05/2026'
// Same instant, DIFFERENT DATES -> an assertion written on one machine fails on the other

// The assertion that fails:
await expect(page.locator('[data-testid="issue-date"]')).toHaveText("01/06/2026");
// CI sees '31/05/2026' because its host clock is UTC

// End-of-month failure, which is NOT a time-zone bug at all:
const lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1);
// On 31 May, setMonth(3) asks for "31 April", which does not exist, so JS rolls it over to 1 MAY.
//   new Date(2026, 4, 31).setMonth(3)  ->  Fri May 01 2026   (measured; on any host zone)
// "Last month" is now THIS month, and the test asserts on this month's data as if it were last month's.
// Combine the two: at 2026-05-31T19:00Z both machines compute "1 May", but on the IST box it is already
// 1 June, so 1 May really is last month (correct), while on the UTC box it is still 31 May, so last month
// is April (wrong). Same code, same instant, opposite verdicts.
```

### Fix

```typescript
// utils/date.ts — Timezone-safe date utilities for tests

/**
 * Returns today's date as a string, in the application's display timezone.
 * Never use `new Date().toLocaleDateString()` — depends on where the test runs.
 */
export function appDateString(date: Date = new Date()): string {
  // Always format in UTC for consistent test results
  // Change to your app's actual timezone if needed
  return date.toLocaleDateString("en-GB", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }); // Returns 'DD/MM/YYYY' consistently regardless of where test runs
}

/**
 * Returns a fixed test date (not today) to avoid any time-of-day issues.
 * Use for assertions where the exact date matters but shouldn't vary.
 */
export function stableTestDate(
  year: number,
  month: number,
  day: number,
): { iso: string; display: string } {
  const d = new Date(Date.UTC(year, month - 1, day));
  return {
    iso: d.toISOString().slice(0, 10), // '2026-05-15' (slice, not split(): [0] is string | undefined under noUncheckedIndexedAccess)
    display: appDateString(d), // '15/05/2026'
  };
}

// Usage in test:
const testDate = stableTestDate(2026, 5, 15);

// Create citation with a specific date (not today)
const citation = await citationsClient.create(
  PayloadsCitation.parking({ issueDate: testDate.iso }),
);

// Assert the UI shows the date in the expected format
await expect(page.locator('[data-testid="issue-date"]')).toHaveText(
  testDate.display,
);
// Passes everywhere: London, IST, UTC-5 — because we're not using "today"
```

### Prevention Rule

> **Rule**: **Never use `new Date()` in test assertions** without timezone normalization. Tests that pass or fail based on what time it is in what timezone are lying. Either: (1) use a fixed, explicit date in test data (`stableTestDate`); (2) format with an explicit zone (`appDateString`, or `Intl` with `timeZone`); (3) freeze the clock and the zone in the browser: `page.clock.setFixedTime(...)` plus `use: { timezoneId, locale }`, which governs the **browser** only (measured: with `TZ=UTC` on the Node side, the page reported IST and Node reported UTC, so the Node-side `new Date()` in your test code still needs the rules above); (4) never do month arithmetic with `setMonth`; build the date from `Date.UTC(y, m - 1, 1)` parts. See [Chapter 61](../03_Real_World_Scenarios/61_Emulation_Clock_Network_And_Devices.md) for the clock APIs.

---

## War Story 7: The Frame Trap — Element Exists, Cannot Interact

### Situation

(Illustrative composite.) A test uses `page.locator('#submitBtn')` on a page that embeds a payment form. The button is plainly on screen, yet the click times out.

### Symptoms

```typescript
await page.locator("#submitBtn").count(); // → 0   (measured: the main-frame query finds nothing)
await page.locator("#submitBtn").click();
// → TimeoutError: locator.click: Timeout 30000ms exceeded.
//   Call log:
//     - waiting for locator('#submitBtn')
```

Nothing is "not attached": the locator never resolves at all. A plain `page.locator()` query runs in the main frame's document and does **not** pierce `<iframe>` boundaries (measured on 1.64.1, with `<iframe src="/f">` containing `#submitBtn`: `page.locator` count 0, `page.frameLocator('iframe[src*="/f"]').locator('#submitBtn')` count 1). The "Element is not attached to the DOM" error is a different failure, the detached-`ElementHandle` one in Challenge 1.

### Root Cause Diagnosis

```typescript
// Is the element inside an iframe?
const iframes = await page.locator("iframe").count();
console.log(`Found ${iframes} iframes`); // → Found 2

// Get iframe sources
const frameSources = await page
  .locator("iframe")
  .evaluateAll((frames) =>
    frames.map((f) => (f as HTMLIFrameElement).src || f.getAttribute("name") || f.id),
  );
console.log(frameSources);
// ['https://forms.company.com/embedded-payment-form', '']

// Check if #submitBtn is IN the iframe
const inIframe = await page
  .frames()
  .find((f) => f.url().includes("forms.company.com"))
  ?.locator("#submitBtn")
  .count();
console.log(`Element in iframe: ${inIframe}`); // → 1
```

**Root Cause**: `page.locator()` queries the main frame's DOM tree. The `<iframe>` element is in that tree, but `#submitBtn` lives inside the iframe's own, separate document. The locator can never resolve it, so every action waits until the timeout. (Contrast CSS-style piercing of **open shadow roots**, which Playwright locators *do* do automatically.)

### Fix

```typescript
// ❌ BEFORE: queries the main frame only, times out waiting for a locator that cannot resolve
await page.locator("#submitBtn").click();

// ✅ AFTER: explicitly target the iframe
const paymentFrame = page.frameLocator('iframe[src*="forms.company.com"]');
await paymentFrame.locator("#submitBtn").click();

// For dynamic iframes (src changes):
await paymentFrame
  .locator("#submitBtn")
  .waitFor({ state: "visible", timeout: 30_000 });
await paymentFrame.locator("#submitBtn").click();

// Same pattern for any iframe-hosted content, e.g. a D365 web resource or an embedded
// third-party form (the iframe selector is whatever your app renders; inspect the DOM):
const resourceFrame = page.frameLocator('iframe[title="Citation history"]');
await resourceFrame.getByLabel("Notes").fill("New Value");

// Getting all frame URLs for debugging:
page.frames().forEach((f) => console.log(`Frame: ${f.name()} | ${f.url()}`));
```

```typescript
// POM pattern for iframed forms
export class PaymentFormIFrame {
  private readonly frame: FrameLocator;

  constructor(page: Page) {
    // frameLocator() is lazy: it resolves on use, so there is nothing to wait for here
    this.frame = page.frameLocator('iframe[src*="forms.company.com"]');
  }

  // All locators use this.frame, not page
  get cardNumber() {
    return this.frame.locator("#card-number");
  }
  get expiry() {
    return this.frame.locator("#expiry");
  }
  get cvv() {
    return this.frame.locator("#cvv");
  }
  get submitBtn() {
    return this.frame.locator("#submitBtn");
  }

  async fillAndSubmit(card: CardDetails): Promise<void> {
    await this.cardNumber.fill(card.number);
    await this.expiry.fill(card.expiry);
    await this.cvv.fill(card.cvv);
    await this.submitBtn.click();
  }
}
```

### Prevention Rule

> **Rule**: If an element is visibly on screen but `count()` is 0 and actions just time out on "waiting for locator", **check for iframes**. Run `page.frames().forEach(f => console.log(f.url()))` to list all frames. Use `page.frameLocator(selector)` to interact with iframe content. Cross-origin iframes are fine for `frameLocator` (it works out of process); what breaks is using `page.evaluate` or `document.querySelector` to reach into them.

---

## War Story 8: The Cookie Monster — Tests Fail After Specific Test Order

### Situation

(Illustrative composite.) Test B passes when run alone. When Test A runs first, Test B fails with wrong user data — it gets Test A's customer's data instead of its own.

### Symptoms

```
Run: Test A alone → PASS
Run: Test B alone → PASS
Run: Test A, then Test B → Test B FAILS
  Expected: customerId = 'CUS-B-001'
  Actual:   customerId = 'CUS-A-001'
```

### Root Cause Diagnosis

```typescript
// Test A code (the polluter):
test("Test A — Admin sets test cookies", async ({ page, context }) => {
  // Test A manually sets a session cookie for impersonating a customer
  await context.addCookies([
    {
      name: "X-Impersonate-Customer",
      value: "CUS-A-001",
      domain: ".crm.company.com",
      path: "/",
      // ❌ No expiry set! Cookie lives for the session
    },
  ]);

  await page.goto("/admin/dashboard");
  // ... test runs ...
  // ❌ FORGOT TO CLEAR THE COOKIE AFTER TEST
});

// Test B code (the victim):
test("Test B — Customer sees own data", async ({ page }) => {
  await page.goto("/customer/profile");
  // The browser still has the X-Impersonate-Customer cookie from Test A!
  // The app uses this cookie to show CUS-A-001's data instead of Test B's user
  const customerId = await page
    .locator('[data-testid="customer-id"]')
    .textContent();
  expect(customerId).toBe("CUS-B-001"); // ← FAILS: shows 'CUS-A-001'
});
```

**Root Cause**: Playwright gives every test its own BrowserContext through the `page`/`context` fixtures, so with the stock fixtures this cannot happen (even `browser.newPage()` creates a fresh context per call; see Challenge 5). It happens only if somebody built a context that outlives a test, and cookies set in Test A then persist for Test B. In this codebase a helper did exactly that to "save login time":

```typescript
// ❌ the polluter: one context for every test in the file
let sharedContext: BrowserContext;
test.beforeAll(async ({ browser }) => {
  sharedContext = await browser.newContext({ storageState: "auth/admin.json" });
});
test("Test A", async () => {
  const page = await sharedContext.newPage(); // inherits, and leaves behind, every cookie
  /* ... */
});
```

If you want to save login time, share the **storage state file** (`storageState`), which seeds a fresh context per test, not the live context.

### Fix

```typescript
// ✅ Fix 1: Never share a live BrowserContext across tests that modify cookies.
// Use the built-in `page`/`context` fixtures (fresh context per test) and seed login via a file:
export default defineConfig({
  use: { storageState: "auth/admin.json" }, // copied into each NEW context; tests can't write back to it
});

// ✅ Fix 2: If you MUST keep a context alive across tests (you rarely must), clean up in afterEach.
// With the default per-test context this is redundant, because the context is discarded anyway.
test.afterEach(async ({ context }) => {
  await context.clearCookies(); // Clean all cookies after every test
});

// ✅ Fix 3: The cookie audit assertion — detect contamination early
async function assertCleanCookieState(
  page: Page,
  expectedDomains: string[] = [],
): Promise<void> {
  const cookies = await page.context().cookies();
  const unexpectedCookies = cookies.filter(
    (c) =>
      !expectedDomains.includes(c.domain) || c.name.startsWith("X-Impersonate"), // never want impersonation in test start
  );

  expect(
    unexpectedCookies,
    `Test started with unexpected cookies: ${JSON.stringify(unexpectedCookies)}`,
  ).toHaveLength(0);
}

// Use in beforeEach for tests that are sensitive to cookie state
test.beforeEach(async ({ page }) => {
  await assertCleanCookieState(page);
});
```

### Prevention Rule

> **Rule**: Prefer Playwright's default fresh-context-per-test behaviour; share a `storageState` file, never a live context. If you do keep a context alive across tests, tests that call `context.addCookies()` MUST clear them in `afterEach`. Audit your worker setup for any context that persists between tests.

---

## War Story 9: The Network Race — Passes Locally, Fails in CI

### Situation

(Illustrative composite.) `page.waitForResponse()` timeout of 5000ms. Works perfectly locally. In CI, intermittent timeouts on this specific assertion.

### Symptoms

```
Local:  PASSES consistently
CI:     FAILS ~30% of runs
  TimeoutError: page.waitForResponse: Timeout 5000ms exceeded while waiting for event "response"
```
(Measured on 1.64.1: the message carries no call log, so it does not say *which* response it was waiting for. Log the URL you expect yourself.)

### Root Cause Diagnosis

```typescript
// The test code:
const [response] = await Promise.all([
  page.waitForResponse(
    (r) =>
      r.url().includes("/api/citations") && r.request().method() === "POST",
    { timeout: 5000 }, // ← only 5 seconds!
  ),
  page.getByRole("button", { name: "Save" }).click(),
]);
```

**Root Cause**: Local dev runs against `localhost:3000`. Round-trip time: 50ms. CI runs against `staging.crm.company.com` — a real server in a different region. Round-trip time: 300-900ms (variable). The POST + server processing + response can take up to 4 seconds in CI vs 200ms locally. The 5000ms timeout is too tight for CI.

### Fix

```typescript
// ✅ Fix: Environment-aware timeouts
const API_RESPONSE_TIMEOUT = process.env.CI ? 30_000 : 10_000;

const [response] = await Promise.all([
  page.waitForResponse(
    (r) =>
      r.url().includes("/api/citations") && r.request().method() === "POST",
    { timeout: API_RESPONSE_TIMEOUT },
  ),
  page.getByRole("button", { name: "Save" }).click(),
]);

// ✅ Even better: don't hard-code at all. With no `timeout` option, waitForResponse uses the context default:
// 30 s, or `use.actionTimeout` when the config sets one (measured: actionTimeout 700 -> "Timeout 700ms exceeded").
// So a low `actionTimeout` quietly makes every bare waitForResponse in the suite tight.
//
// If you do want a ceiling tied to the test, derive it from the test timeout
// playwright.config.ts: timeout: 60_000 per test
// In your fixture or test: use testInfo.timeout as the ceiling
test("Save citation", async ({ page }, testInfo) => {
  const apiTimeout = Math.min(testInfo.timeout * 0.4, 30_000); // 40% of test timeout, max 30s

  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/citations"), {
      timeout: apiTimeout,
    }),
    page.getByRole("button", { name: "Save" }).click(),
  ]);
});
```

### Prevention Rule

> **Rule**: Never hardcode a low timeout (< 15s) for `waitForResponse/Request` in tests that run against real staging servers, and remember that a low `actionTimeout` in the config is inherited by bare `waitForResponse` calls. Staging APIs have real network latency. Use `process.env.CI ? 30_000 : 10_000` patterns or derive from `testInfo.timeout`.

---

## War Story 10: The Selector Cemetery — 50 Tests Break After One UI Change

### Situation

(Illustrative composite.) A designer renames CSS classes as part of a redesign. They change `.blue-button` to `.primary-action-btn`, `.form-container` to `.form-wrapper`. 50 tests break overnight.

### Symptoms

```
After UI deploy:
  Test 1/200:  FAILED — locator: .blue-button not found
  Test 2/200:  FAILED — locator: .blue-button not found
  Test 5/200:  FAILED — locator: .form-container not found
  ... (50 failures total)
```

The issue isn't hard to fix — but it takes 3 hours to find and update every occurrence.

### Root Cause Diagnosis

```typescript
// The problem: CSS class names scattered across 50 test files
// tests/specs/citations/create.spec.ts
await page.locator(".blue-button").click();

// tests/specs/citations/edit.spec.ts
await page.locator(".blue-button").click();

// tests/specs/customers/create.spec.ts
await page.locator(".blue-button").click();

// ... 47 more files
```

**Root Cause**: CSS class names were used as locators directly. CSS classes are implementation details — they change when designs change. Tests should be coupled to **intent** (what the element IS), not **style** (how it looks).

### Fix (3 layers)

```typescript
// ✅ Layer 1: Immediately fix — add data-testid to HTML (work with developers)
// In the component:
// <button class="primary-action-btn" data-testid="citation-save-btn">Save</button>

// ✅ Layer 2: Use role-based locators (works without code changes)
// Instead of: page.locator('.blue-button')
// Use: page.getByRole('button', { name: 'Save' })
// CSS classes change; the button's accessible name (text) rarely changes

// ✅ Layer 3: Centralize in POM (single point of change)
export class CitationFormPage {
  readonly saveBtn: Locator;

  constructor(private readonly page: Page) {
    // Assigned in the constructor on purpose: `readonly saveBtn = this.page.getByRole(...)` together
    // with a `private readonly page` parameter property fails `tsc` on a modern target with
    // TS2729 "Property 'page' is used before its initialization" (measured, TS 5.x, target ES2022),
    // even though Playwright's own transform happens to run it.
    this.saveBtn = page.getByRole("button", { name: "Save Citation" });
    // OR with a test id:
    // this.saveBtn = page.getByTestId("citation-save-btn");
  }
}
// Now when the designer renames classes → only CitationFormPage.ts needs updating
// NOT 50 spec files
```

```typescript
// ✅ Automated selector audit — find lone CSS class locators in tests
// Run this before deploying UI changes to understand the blast radius:

// scripts/audit-selectors.ts - fail CI when specs use a lone CSS-class locator.
// Run: node --experimental-strip-types scripts/audit-selectors.ts tests   (Node 22.13; compiled under strict + noUncheckedIndexedAccess; no `glob` dependency;
// `readdirSync(..., { recursive: true })` needs Node 20+). The first draft's regex was corrupted and matched nothing.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] ?? "tests";
const testFiles = (readdirSync(root, { recursive: true }) as string[])
  .filter((f) => f.endsWith(".spec.ts"))
  .map((f) => join(root, f));

// page.locator(".blue-button") / locator('.form-container') : a lone class selector
const cssClassPattern = /\.locator\(\s*['"`](\.[a-zA-Z][\w-]*)['"`]\s*[,)]/g;

const findings: Array<{ file: string; selector: string; line: number }> = [];

for (const file of testFiles) {
  readFileSync(file, "utf-8")
    .split("\n")
    .forEach((text, idx) => {
      for (const match of text.matchAll(cssClassPattern)) {
        findings.push({ file, selector: match[1] ?? "", line: idx + 1 });
      }
    });
}

if (findings.length > 0) {
  console.error("CSS class selectors found in tests (fragile):");
  findings.forEach((f) => console.error(`  ${f.file}:${f.line} - ${f.selector}`));
  process.exit(1);
}
console.log("No CSS class selectors found in tests");
```

### Prevention Rule

> **Rule**: CSS class names are styling artifacts — they belong in `.css` files, not test files. Use the selector hierarchy: `data-testid` → `getByRole()` → `getByLabel()` → `getByText()`. Never use `.class-name` selectors in production tests. Run the selector audit script in CI.

---

## War Story 11: The Assertion That Always Passes

### Situation

(Illustrative composite.) A payment processing test has been in the suite for 6 months. Never fails. A developer introduces a bug where the payment amount is silently rounded down. `$151.99` becomes `$151.00`. The test still passes.

### Symptoms

```
Test "Process payment for citation" → PASSES for 6 months ✓
Production bug: Customers underpay by cents → financial discrepancy
Postmortem: "Why didn't the tests catch the rounding bug?"
```

### Root Cause

```typescript
// The insufficient test:
test("Process payment", async ({ page, citationsClient }) => {
  await citationDetail.paymentPanel.fillAmount("151.99");
  await citationDetail.paymentPanel.clickPayNow();

  // ❌ Only checks visibility — does not verify the AMOUNT processed
  await expect(page.locator(".payment-success")).toBeVisible();
  // The success banner is ALWAYS visible after any payment, regardless of amount
});
```

**Root Cause**: `toBeVisible()` only checks that the element exists on screen. It tells you nothing about what data is displayed or stored. The payment amount was never asserted.

### Fix

```typescript
// ✅ Assertion must verify BUSINESS-MEANINGFUL values
test("Process payment — amount verified at UI + API + DB", async ({
  page,
  citationsClient,
  paymentsClient,
  dbClient,
  account,
}) => {
  const expectedAmount = 151.99;

  await citationDetail.paymentPanel.fillAmount(expectedAmount.toString());

  // Capture the payment API response at submit time
  const [paymentResp] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes("/api/payments") && r.request().method() === "POST", // Response has no .method()
    ),
    citationDetail.paymentPanel.clickPayNow(),
  ]);

  const paymentBody = (await paymentResp.json()) as {
    paymentId: string;
    amount: number;
  };

  // Layer 1: UI shows correct amount
  await expect(page.locator('[data-testid="payment-amount"]')).toHaveText(
    `$${expectedAmount.toFixed(2)}`,
  );

  // Layer 2: API response carries correct amount
  expect(paymentBody.amount).toBe(expectedAmount); // ← would catch rounding bug

  // Layer 3: DB stores correct amount
  const dbRow = await dbClient.queryOne<{ amount: string }>(
    "SELECT amount FROM payments WHERE payment_id = $1",
    [paymentBody.paymentId],
  );
  expect(parseFloat(dbRow!.amount)).toBe(expectedAmount); // ← DB ground truth
  // Money note: 151.99 survives a float round-trip, but arithmetic on money in floats does not.
  // Prefer integer minor units (15199) in the API and in the assertion where you control the contract.
});
```

### Prevention Rule

> **Rule**: Every test must assert on **business-meaningful values** — not just element visibility. Ask: "If the wrong data was stored, would this test catch it?" If the answer is "No," you need a stronger assertion. Visibility checks are necessary but never sufficient for financial or data-correctness tests.

---

## War Story 12: The Retry Lie — Retries Mask Real Failures

### Situation

(Illustrative composite.) CI is green. `retries: 2` in `playwright.config.ts`. A production incident reveals a race condition that makes some payment attempts process twice (double charge). Investigation reveals: the test was CATCHING this bug on many runs, but the retry masked it, and nobody read the "flaky" line in the report.

### Symptoms

```
CI log (list reporter):
  2 flaky
    payments.spec.ts › Payment idempotency
  48 passed
  -> process exit code 0, so the pipeline step is green

HTML report, Payment idempotency:
  Attempt 1: FAILED — expected 409, got 200
  Attempt 2: FAILED — expected 409, got 200
  Attempt 3: PASSED (different timing, race not triggered)
```

Playwright does not hide this: a test that fails and then passes on retry is classified **flaky**, counted separately (`stats.flaky` in the JSON report), and listed in the summary. What it does **not** do, by default, is fail the run. That is the lie: green exit code, a flaky count nobody reads. (Measured on 1.64.1: three tests, two flaky: exit code 0; with `failOnFlakyTests: true` the same run exits 1.)

**Root Cause**: The test verifies that submitting a payment twice returns `409 Conflict` (idempotency). A race condition sometimes makes the second submit return `200 OK` (double charge). Attempts 1 and 2 failed (correctly detecting the bug); attempt 3 passed because the race was not triggered.

### Fix

```typescript
// Fix 1: tests that expose race conditions must not be retried into green.
// Per file or describe block (test.describe.configure exists; there is no per-test `retries` option):
test.describe("payment idempotency", () => {
  test.describe.configure({ retries: 0 });
  test("second submit returns 409", async ({ paymentsClient }) => { /* ... */ });
});

// or per project in playwright.config.ts: a separate project for critical tests
projects: [
  {
    name: "critical-no-retry",
    testMatch: "**/*.critical.spec.ts",
    retries: 0, // ← Never retry critical business-logic tests
  },
  {
    name: "general",
    testMatch: "**/*.spec.ts",
    testIgnore: "**/*.critical.spec.ts", // testIgnore, not `ignore` (measured: this pair partitions the files)
    retries: 2,
  },
],

// Fix 2: make flaky a CI failure, or at least a visible number
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
  failOnFlakyTests: !!process.env.CI, // flaky => non-zero exit (CLI: --fail-on-flaky-tests)
});
```

Failing the whole run on any flake is strict. The softer, common version is a threshold on the JSON report:

```yaml
# .github/workflows/playwright.yml  (reporter: [['json', { outputFile: 'playwright-report/results.json' }]])
- name: Check flaky rate
  run: |
    # stats counts TESTS (not attempts) and, unlike .suites[].specs[], includes tests inside describe blocks
    jq -e '
      (.stats.expected + .stats.unexpected + .stats.flaky + .stats.skipped) as $total
      | ($total > 0) and ((.stats.flaky / $total) > 0.05)
      | not
    ' playwright-report/results.json || { echo "flaky rate above 5%"; exit 1; }
```

(The first draft's `jq` walked `.suites[].specs[].tests[].results[]`, which silently skips every test declared inside a `describe`: measured 4 attempts counted of 6 in a small run. It also divided with `bc`, which is not on every runner; `jq` does the arithmetic. Verified: `jq` stats totals matched the run, `-e` exits 1 above the threshold.)

### Prevention Rule

> **Rule**: Retries are for **infrastructure flakiness** (network blip, browser crash), NOT for **application bugs**. A pass-on-retry is a *flaky* result, and flaky results are failures you have not read yet. Turn them into a number (`stats.flaky`) or a failure (`failOnFlakyTests`), disable retries for tests whose job is to catch races, and investigate every flaky test. See [Chapter 26](./26_Flakiness_Diagnosis_and_Fixing.md).

---

## War Story 13: The Dynamic ID Trap — Test Breaks Every D365 Update

### Situation

(Illustrative composite; the id format and counter are invented, and I could not check them against a live tenant.) A test uses the locator `#DynCtrl_fieldControl_MscrmControls_citationStatus_99847`. Works perfectly for 3 months. After a D365 platform update, the test breaks on every machine.

### Symptoms

```
After D365 update:
  Error: locator: '#DynCtrl_fieldControl_MscrmControls_citationStatus_99847' not found
  selector: visible=true, timeout: 30000ms

New DOM inspection shows:
  <div id="DynCtrl_fieldControl_MscrmControls_citationStatus_100213" ...>
```

**Root Cause** (for the composite): the id embeds a generated number, and the number changed with the platform update, from `_99847` to `_100213`. An id with a generated suffix is not a contract.

### Fix

```typescript
// ❌ Selector using generated D365 ID
await page
  .locator("#DynCtrl_fieldControl_MscrmControls_citationStatus_99847")
  .click();

// ✅ Stable selector strategies for D365:

// Option 1: data-id built from the field's logical name. Microsoft's own Playwright sample for
// model-driven apps selects a text field as:
//   input[data-id="nwind_ordernumber.fieldControl-text-box-text"]   (logical name + "." + control suffix)
// https://learn.microsoft.com/power-platform/developer/playwright-samples/model-driven-application
// The suffix differs per control type, so match the stable logical-name prefix and inspect the DOM for the rest:
await page.locator('[data-id^="citation_status"]').click();

// Option 2: getByLabel (accessibility-based, most semantic, survives markup changes)
await page.getByLabel("Citation Status").click();

// Option 3: label + sibling CSS (last resort; depends on DOM order)
await page.locator('label:has-text("Citation Status") + div').click();

// Avoid inventing a stable attribute you have not seen: `data-automation-key` appears on Fluent UI list/grid
// cells, but I found no D365 documentation promising it on form fields. Treat it as unproven.
```

```bash
# Automated audit: find all generated D365 IDs in test files
# Run this BEFORE any D365 update to identify fragile selectors
grep -rn "DynCtrl_\|MscrmControls_" tests/ --include="*.ts"
# Output:
# tests/specs/citations/edit.spec.ts:45: page.locator('#DynCtrl_fieldControl_MscrmControls_...')
# Fix before D365 updates!
```

### Prevention Rule

> **Rule**: Any locator containing `DynCtrl_`, `_fieldControl_`, generated numbers, or GUIDs is a time bomb. Run a selector audit before every D365 platform update. Replace with a `data-id` keyed on the logical name, `getByLabel()`, or `getByRole()`. Where Microsoft ships a toolkit for the surface you test (the Power Platform Playwright samples wrap grids and forms), prefer it to hand-rolled DOM selectors.

---

## War Story 14: The False Positive — Test Always Passes, Bug Ships to Production

### Situation

(Illustrative composite.) A "search citation by ID" test has been green for a year. A developer introduces a bug: the search endpoint now ignores the `citationId` parameter and returns ALL citations. The test still passes.

### Symptoms

```
Production bug: "Search by Citation ID returns all records"
CI tests: All green ✓

Developer: "But the tests were passing!"
SDET Lead: "The tests were asserting on the wrong thing."
```

### Root Cause

```typescript
// The misleading test:
test("Search by citation ID returns one result", async ({
  citationsClient,
  account,
}) => {
  // Create a citation
  const citation = await citationsClient.create(
    PayloadsCitation.pending({ customerId: account.userId }),
  );

  // Search for it
  await masterSearch.searchByCitationId(citation.citationId);
  await masterSearch.resultsGrid.waitForResults();

  // ❌ Only checked that SOME row is visible — not that it's the RIGHT row
  await expect(masterSearch.resultsGrid.firstRow).toBeVisible();
  // If search returns 50 results, the first row is still visible → test passes!
});
```

### Fix

```typescript
// ✅ Assert on EXACT search results
test("Search by citation ID returns EXACTLY ONE specific result", async ({
  citationsClient,
  account,
}) => {
  const citation = await citationsClient.create(
    PayloadsCitation.pending({ customerId: account.userId }),
  );

  await masterSearch.searchByCitationId(citation.citationId);
  await masterSearch.resultsGrid.waitForResults();

  // Assert count = 1 (not "at least 1")
  await expect(masterSearch.resultsGrid.allRows).toHaveCount(1);

  // Assert the specific citation ID appears in the result
  await expect(masterSearch.resultsGrid.firstRow).toContainText(
    citation.citationId,
  );

  // Assert it shows the RIGHT customer
  await expect(masterSearch.resultsGrid.firstRow).toContainText(account.userId);

  // Also verify via API: search API returns only this citation
  const searchResults = await citationsClient.search({
    citationId: citation.citationId,
  });
  expect(searchResults).toHaveLength(1);
  expect(searchResults[0]?.citationId).toBe(citation.citationId); // ?. : noUncheckedIndexedAccess
});
```

### Prevention Rule

> **Rule**: "The element is visible" is almost never a sufficient assertion. Always ask: **"If the wrong data was here, would this assertion still pass?"** Search tests must assert on **count = N** and **content = specific values**, not just visibility.

---

## War Story 15: The Clipboard Permissions Trap — Passes Locally, Fails in Headless CI

### Situation

(Illustrative composite.) A new "Share" feature has a "Copy Link" button that copies a URL to the system clipboard. The test clicks the button, reads the clipboard, and asserts the URL. The developer runs it headed, watches the copy happen, and answers the browser's clipboard prompt by hand. In CI, nobody can answer it.

### Symptoms

```
Local (headed): the click copies fine; the readText() call sits on a permission prompt until a human clicks Allow
CI (headless):  fails immediately
  page.evaluate: NotAllowedError: Failed to execute 'readText' on 'Clipboard': Read permission denied.
```

A second, unrelated failure has a different message: on a **non-secure origin** (plain `http://` on anything other than `localhost`/`127.0.0.1`), `navigator.clipboard` is `undefined`, so you get `TypeError: Cannot read properties of undefined (reading 'writeText')`. No permission grant can fix that one; serve the app over HTTPS.

### Root Cause Diagnosis

```typescript
// The failing test code:
test("Copy link to clipboard", async ({ page }) => {
  await page.getByRole("button", { name: "Copy Link" }).click();

  // Read clipboard to verify
  const clipboardText = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  expect(clipboardText).toBe("https://crm.company.com/citations/CIT-001");
});
```

**Root Cause**: The Async Clipboard API (`navigator.clipboard`) needs a Secure Context (HTTPS, `localhost`, `127.0.0.1`) AND a permission. Playwright does not grant it for you. **Measured** on `@playwright/test` 1.64.1 / Chromium against a local `127.0.0.1` page, `writeText` called from a click handler and `readText` called from `page.evaluate`:

| Mode | Permissions granted | `writeText` (after a click) | `readText` |
| --- | --- | --- | --- |
| headless | none | `NotAllowedError: Write permission denied` | `NotAllowedError: Read permission denied` |
| headless | `clipboard-read`, `clipboard-write` | works | works |
| headed | none | works (user gesture) | **never settles** (waits on a permission prompt) |
| headed | `clipboard-read`, `clipboard-write` | works | works |

So "passes locally" is not Playwright bypassing anything: headed Chromium lets a click-triggered write through and holds `readText` on a prompt that a human can answer. Headless has no prompt, so it denies. The same `isSecureContext === false` / `navigator.clipboard === undefined` result was measured for a page served from `http://insecure.test/` even with both permissions granted.

**Other browsers: not run here.** The `grantPermissions` docs list `clipboard-read` and `clipboard-write` only among "permissions that may be supported by some browsers" and warn that supported permissions differ between browsers and between versions of the same browser ([BrowserContext.grantPermissions](https://playwright.dev/docs/api/class-browsercontext#browser-context-grant-permissions)). If the project runs Firefox or WebKit, check the grant on each rather than assuming the Chromium result carries over.

### Fix

```typescript
// ✅ Fix: Explicitly grant clipboard permissions to the BrowserContext
test("Copy link to clipboard", async ({ page, context }) => {
  // Grant for every origin in this context; pass { origin } to scope it to one
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.goto("/citations/CIT-001"); // needs baseURL; a secure origin is still required
  await page.getByRole("button", { name: "Copy Link" }).click();

  // Now the evaluate block succeeds in headless CI
  const clipboardText = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  expect(clipboardText).toBe("https://crm.company.com/citations/CIT-001");
});
```

### Prevention Rule

> **Rule**: Any feature that interacts with permission-gated browser APIs (Clipboard, Geolocation, Notifications, Camera/Microphone) MUST explicitly use `context.grantPermissions()`. A headed run where you click "Allow" by hand proves nothing about CI, and the grant does not fix a non-secure origin.

---

## The Anti-Pattern Compendium

All 15 war stories, distilled into rules:

| #   | Anti-Pattern              | Root Cause                                           | Prevention Rule                                                          |
| --- | ------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | Ghost click               | Invisible overlay at click coordinates               | `document.elementFromPoint(x,y)` to verify click target                  |
| 2   | Stale session             | OAuth token TTL < suite duration                     | Decode JWT expiry, implement token refresh fixture                       |
| 3   | Silent 200                | Asserting status code, not body content              | Always assert response body fields, add DB layer for writes              |
| 4   | Parallel collision        | Hardcoded shared test data IDs                       | Unique IDs per test/worker, never hardcode entity IDs                    |
| 5   | ARIA impostor             | Wrong role, multiple matches                         | Check Accessibility panel, scope locators, verify count=1                |
| 6   | Time zone trap            | `new Date().toLocaleDateString()` varies by server   | Use UTC normalization, never use "today" in assertions                   |
| 7   | Frame trap                | Element inside iframe, queried from main frame       | List all frames, use `frameLocator()` for iframe content                 |
| 8   | Cookie monster            | Shared context contaminates subsequent tests         | Clear cookies in afterEach, never share context across tests             |
| 9   | Network race              | Low timeout not accounting for staging latency       | Environment-aware timeouts: CI=30s, local=10s                            |
| 10  | Selector cemetery         | CSS class selectors scattered across 50 files        | `data-testid` + POMs for single point of change                          |
| 11  | Always-passing assertion  | `toBeVisible()` on element that's always there       | Assert business-meaningful values: text, counts, amounts                 |
| 12  | Retry lie                 | Retries hiding real race conditions                  | Track retry rate; retries > 5% = unfixed bug                             |
| 13  | Dynamic ID trap           | D365 generated IDs change on platform update         | `data-id`, `data-automation-key`, or semantic locators                   |
| 14  | False positive            | Test passes even with wrong data returned            | Count assertions + content assertions; never just visibility             |
| 15  | Clipboard permission trap | Headless CI defaults clipboard permissions to Denied | Always `context.grantPermissions(['clipboard-read', 'clipboard-write'])` |

---

## 🏋️ Practice Questions

### Q1. [Scenario Diagnosis]

A test intermittently fails in CI with "Expected count 1, received 2" on a search results assertion. It always passes locally. The test is run with 4 workers in CI. What are the THREE most likely root causes and how would you diagnose each?

<details><summary>Answer</summary>

**Root Cause 1: Shared test customer (War Story 4 — Parallel Collision)**
Two workers are both creating citations for the same hardcoded customer. The search finds 2 because both workers' data appears.

Diagnosis: Log `account.userId` in every test. If multiple tests log the same userId, you have shared data.

**Root Cause 2: Orphaned data from previous test run (cleanup issue — see [Chapter 28](../03_Real_World_Scenarios/28_Test_Data_Lifecycle_and_Cleanup.md))**
A previous CI run failed mid-test and didn't clean up its test data. A new run creates a citation, searches, and finds the current one PLUS the orphaned one.

Diagnosis: Check the creation timestamps of the 2 results. If one is from a previous test run session, you have orphaned data.

**Root Cause 3: Race condition in search indexing**
An index that updates asynchronously can briefly serve a stale entry: a previous test's citation that was deleted, or re-assigned to another customer, is still in the index while the new one is already visible. Lag on a plain *insert* would give 0 results, not 2, so this cause only explains "2" when something was removed or changed just before.

Diagnosis: do not add a sleep. Poll the search API for the result count and log each sample with a timestamp: `expect.poll(() => citationsClient.search({ citationId }).then((r) => r.length), { timeout: 15_000 }).toBe(1)`. If the count goes 2 → 1 within seconds, it is index lag, and that poll is also the proper fix. If it stays at 2, the cause is shared data or orphans (causes 1 and 2).

</details>

---

### Q2. [Write It]

Write a test for the double-payment guard: once `POST /api/citations/{id}/pay` has succeeded, a second payment attempt for the same citation returns `409 Conflict`. The test must handle the payment processing time (30 second async job) between the two calls.

<details><summary>Answer</summary>

Be precise about what is being tested. Re-sending the **same** idempotency key is a *replay* and should return the original response, not 409. A **new** key for an already-paid citation is a second payment attempt, and the business rule rejects it with 409. The test below covers the second case.

```typescript
test("Second payment for a paid citation returns 409", async ({
  citationsClient,
  paymentsClient,
  dbClient,
  account,
}) => {
  // The 120 s poll below is longer than the 30 s default test timeout, which
  // would end the test first (measured: "Test timeout of 30000ms exceeded").
  test.setTimeout(150_000);

  const citation = await citationsClient.create(
    PayloadsCitation.pending({ customerId: account.userId }),
  );

  // First payment — should be accepted. rawPay returns the APIResponse.
  const first = await paymentsClient.rawPay(citation.citationId, {
    amount: citation.amount,
    idempotencyKey: "test-payment-key-001",
  });
  expect(first.status()).toBe(202); // APIResponse.status is a METHOD
  const { jobId, paymentId } = (await first.json()) as {
    jobId: string;
    paymentId: string;
  };

  // Wait for the async payment job to finish
  await expect
    .poll(async () => (await paymentsClient.getJobStatus(jobId)).status, {
      timeout: 120_000,
      intervals: [2000, 5000, 10000],
      message: "First payment never completed",
    })
    .toBe("COMPLETED");

  // Second attempt: NEW key, same citation — must be rejected
  const second = await paymentsClient.rawPay(citation.citationId, {
    amount: citation.amount,
    idempotencyKey: "test-payment-key-002",
  });
  expect(second.status()).toBe(409);

  const errorBody = (await second.json()) as {
    code: string;
    existingPaymentId: string;
  };
  expect(errorBody.code).toBe("PAYMENT_ALREADY_PROCESSED");
  expect(errorBody.existingPaymentId).toBe(paymentId);

  // DB verification: only ONE payment record exists. COUNT(*) comes back as a
  // string from most drivers, and queryOne returns undefined for no row.
  const row = await dbClient.queryOne<{ count: string }>(
    "SELECT COUNT(*) AS count FROM payments WHERE citation_id = $1",
    [citation.citationId],
  );
  expect(Number(row?.count)).toBe(1); // exactly 1, not 2
});
```

`expect.poll`'s `timeout` and the test timeout are independent clocks: the poll gives up at its own `timeout` or when the test times out, whichever comes first (see [Chapter 42](../03_Real_World_Scenarios/42_Polling_Async_Data_Patterns.md#2-the-right-tool--expectpoll) for the engine details).

</details>

---

### Q3. [Root Cause Identification]

This test passes locally but fails in CI with "Expected 'PAID', received ''" (empty string). Identify the root cause.

```typescript
test('Citation shows PAID after payment', async ({ page, citationsClient, paymentsClient }) => {
  const citation = await citationsClient.create(PayloadsCitation.pending({ ... }));
  await paymentsClient.pay(citation.citationId, { amount: citation.amount });

  await page.goto(`/citations/${citation.citationId}`);

  const status = await page.locator('[data-testid="status"]').textContent();
  expect(status).toBe('PAID');  // fails in CI with empty string
});
```

<details><summary>Answer — 3 Root Causes Combined</summary>

**Root Cause 1: D365 Two-Phase Render (War Story in Ch08)**
`page.goto()` completes when DOM is ready. But in D365, `[data-testid="status"]` renders as an EMPTY container during Phase 1. The OData API call to populate it fires AFTER the DOM loads. In local (fast local API, fast rendering), Phase 2 completes in 100ms. In CI (staging API, slower), Phase 2 takes 2-8 seconds.

`textContent()` is called immediately after `goto()` — before the data arrives → gets empty string.

**Root Cause 2: Payment Processing Not Awaited**
`paymentsClient.pay()` returns immediately (202 Accepted). The payment processes asynchronously. When the page loads in CI (which is slower), the payment might not be PAID yet — the status could be PROCESSING or PENDING.

**Root Cause 3: No Polling**
Reading `textContent()` synchronously is a one-shot read, not a retry. Even if the element was eventually going to show PAID, the test reads it once at an undefined point in time.

**Fix:**

```typescript
// Step 1: Wait for payment to process
// (a 120 s poll needs test.setTimeout(150_000) at the top of the test,
//  otherwise the 30 s default test timeout ends it first)
await expect
  .poll(
    () => citationsClient.getById(citation.citationId).then((c) => c.status),
    {
      timeout: 120_000,
      intervals: [2000, 5000],
      message: "Citation never reached PAID",
    },
  )
  .toBe("PAID");

// Step 2: Navigate and wait for data, not just DOM
await page.goto(`/citations/${citation.citationId}`);
await expect(page.locator('[data-testid="status"]')).toHaveText("PAID", {
  timeout: 30_000,
});
// toHaveText() auto-retries — it will wait until the text populates
```

</details>

---

## 🏋️ Practice Challenges

### Challenge 1 [Spot the Bug — The "Randomly Passing" ElementHandle]

```typescript
test("Click dynamic loading button", async ({ page }) => {
  await page.goto("/dashboard");

  // Wait for the button to appear in DOM
  const button = await page.$(".dynamic-btn");

  // ... test does some other things for 2 seconds ...

  // Click the button
  await button?.click();
});
```

Why is `ElementHandle` (`page.$`) discouraged in modern Playwright, and what exactly goes wrong in this code? There are two separate failures, and the second is the one that makes the test "randomly pass".

<details><summary>Answer</summary>

**Bug 1 — `page.$` does not wait, so the comment "Wait for the button to appear" is false.** `page.$` queries the DOM once and resolves to `null` straight away when nothing matches (measured: `null` after ~40 ms, no retry). Then `button?.click()` on `null` is a silent no-op: no error, the test goes on, and it can finish green without ever clicking. Whether the button was in the DOM at that instant decides whether the click happens, which is the "randomly passing" behaviour.

**Bug 2 — a stale handle.** If the button was found and the app then re-rendered it (measured with a script that replaces the container's `innerHTML` 500 ms after load), the handle points at the removed node and the click throws:

```
elementHandle.click: Element is not attached to the DOM
```

(The wording `Element is detached from DOM` that circulates is not the message on 1.64.1.)

**Fix**: use a `Locator`. It re-queries on every action, auto-waits for the element to exist, be visible, stable and enabled, and fails loudly on timeout instead of no-op'ing. The Playwright typings mark `page.$` itself as "Use locator-based page.locator() instead".

```typescript
await page.goto("/dashboard");
// ... other work ...
await page.locator(".dynamic-btn").click(); // or getByRole("button", { name: ... })
```

</details>

---

### Challenge 2 [Architecture — The 429 Too Many Requests War Story]

Your team runs 50 Playwright workers in CI against a shared Staging environment. Every afternoon, tests start failing randomly with `429 Too Many Requests` or `502 Bad Gateway` from the Staging API.

What is the architectural root cause, and what is the proper SDET solution?

- A) Playwright is too fast. You should add `await page.waitForTimeout(2000)` before every API call.
- B) The Staging environment is accurately simulating production rate limits, but the test suite's burst traffic (50 workers × 10 requests/sec = 500 RPS) exceeds the limit. The solution is to whitelist the CI IP in the API Gateway or spin up isolated ephemeral environments for CI runs.
- C) The tests are creating infinite loops.
- D) The API client lacks a try-catch block.

<details><summary>Answer</summary>

**B** — Shared Staging environments are almost always the bottleneck for parallel automation.
Adding timeouts (A) ruins your CI pipeline speed. The enterprise solution is either IP whitelisting for CI (if testing functionality, not rate limiting), or migrating to Ephemeral Environments (where each PR gets its own isolated database and API instance, meaning zero collision and zero rate limiting).

</details>

---

### Challenge 3 [Write It Yourself — The Timezone Boundary Bug]

Your CI runs in UTC. Developers are in India (IST, UTC+5:30). A test selects "Today" on a calendar widget. At 1:00 AM IST (which is 7:30 PM UTC the previous day), the test fails because the API rejects the date as "in the past."

Write the Playwright configuration setting to force the browser context to use a specific timezone (e.g., `Asia/Kolkata`), ensuring local and CI executions match.

<details><summary>Answer</summary>

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    // Forces the browser to use a specific timezone, regardless of the host OS
    timezoneId: "Asia/Kolkata",

    // Optional but related: forcing locale for date formats
    locale: "en-IN",
  },
});
```

**It affects the browser only.** `timezoneId` changes `Date`/`Intl` inside the page and nothing else. Measured with the host set to `TZ=UTC`: the browser reported `Asia/Calcutta` (`getTimezoneOffset()` = -330) while the Node test process still reported `UTC` (offset 0). With the clock fixed at 2026-10-17 19:30 UTC, `new Date().toLocaleDateString("en-CA")` in the page returned `2026-10-17` for a `UTC` context and `2026-10-18` for an `Asia/Kolkata` context. So any date your **test code** computes in Node (seeding via API, an expected value in an assertion) must use the same zone explicitly; `new Date().toISOString().slice(0, 10)` gives the UTC date and reintroduces the bug:

```typescript
const todayInIst = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
}).format(new Date()); // "2026-10-18" at 19:30 UTC on 2026-10-17
```

**War Story**: Unset timezones cause "Timezone Boundary Flakiness." A test passes all day, then consistently fails during a 5-hour window every night depending on the delta between the CI server's UTC clock and the developer's local timezone assumption. Force `timezoneId` to neutralize this.

</details>

---

### Challenge 4 [MCQ — The Stale Test Data War Story]

A test logs in and asserts `expect(userName).toBe('John Doe')`. Six months later, another developer renames the user in the database to 'Johnathan Doe' while testing a bug manually. The automation suite fails on the `main` branch.

What core test data principle was violated?

- A) Manual testing should not be allowed in Staging.
- B) Tests should never assert on names, only IDs.
- C) The test relied on shared, pre-existing state instead of creating its own isolated state (Arrange-Act-Assert).
- D) The database should be read-only.

<details><summary>Answer</summary>

**C** — The test violated the rule of independent test data.
If a test needs a user named 'John Doe', the test (or its fixture) must _create_ that user via API at the start of the test, and ideally delete it at the end. Relying on seeded data in a shared environment guarantees that the data will eventually be mutated by humans or other tests, leading to brittle, unpredictable suites.

</details>

---

### Challenge 5 [Spot the Bug — The Shared Browser Context War Story]

```typescript
import { test, chromium, Browser, BrowserContext } from "@playwright/test";

let browser: Browser;
let context: BrowserContext;

test.beforeAll(async () => {
  browser = await chromium.launch();
  context = await browser.newContext({ baseURL: "http://localhost:3000" });
});

test("Test A", async () => {
  const page = await context.newPage();
  await page.goto("/admin"); // redirects to login
  await page.fill("#user", "admin");
  await page.fill("#pass", "secret");
  await page.click("#loginBtn");
  // ... verify admin
});

test("Test B", async () => {
  const page = await context.newPage();
  await page.goto("/customer");
  // Fails! The page expects to be logged out, but the session is active!
});
```

Why does Test B inherit Test A's logged-in state, and how do you fix it? (There are also defects in the setup that have nothing to do with the cookie.)

<details><summary>Answer</summary>

**Bug**: both pages come from the **same `BrowserContext`**. Cookies and localStorage are scoped to the context, not the page, so the auth cookie Test A earned is sent by Test B. (Measured: two pages from one `browser.newContext()`: the second page's request carried `sid=abc`.)

A common wrong diagnosis worth ruling out: `browser.newPage()` does **not** share a context. Each call creates a *new* one (measured: `a.context() === b.context()` is `false` and `browser.contexts().length` is 2), and a cookie set in the first page was not sent by the second. The bug above only exists because the code shares one context deliberately.

**Fix**: use the built-in `page` fixture, which creates a fresh context per test.

```typescript
test("Test A", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("User").fill("admin");
  await page.getByLabel("Password").fill("secret");
  await page.getByRole("button", { name: "Log in" }).click();
});

test("Test B", async ({ page }) => {
  // zero cookies, fresh storage
  await page.goto("/customer");
});
```

**Other defects in hand-rolled setup like this** (true of the original `browser.newPage()` version too):

- **Leaked browser**: nothing calls `browser.close()`, so every worker leaves a Chromium process running. Add `test.afterAll(() => browser.close())`, or use the `browser` fixture.
- **Relative `goto` without a `baseURL`**: `browser.newPage()` and `chromium.launch()` do not read the config's `use` block. Measured: `page.goto("/admin")` fails with `Protocol error (Page.navigate): Cannot navigate to invalid URL`. The `page` fixture applies `baseURL`; here it has to be passed to `newContext({ baseURL })` by hand.
- **Bypassed config `use` options**: the same goes for `timezoneId`, `locale`, `storageState`, `trace`, `video`, `screenshot` and `ignoreHTTPSErrors`. Hand-made contexts silently drop them, and no trace is recorded on failure.
- **String-selector `page.fill(...)` / `page.click(...)`**: discouraged in favour of locators (`getByLabel`, `getByRole`), which auto-wait and are strict. See [Chapter 02 — Enterprise Locators](../01_Foundations/02_Enterprise_Locators_XPath.md).

**War Story**: Manually managing `chromium.launch()` in `beforeAll` is a hangover from Puppeteer/Selenium. Playwright's fixtures give each test its own context cheaply, and that isolation is the default you should keep.

</details>

---

## Reality Check

**"War stories are entertainment, not education"**→ Every war story encodes a PATTERN: the environment misconfiguration that wasted a sprint, the race condition that only appeared under load, the test data dependency that caused cascading failures. Extract the pattern: what category of problem was it? What detection mechanism would have caught it earlier? What prevention mechanism avoids it entirely?

**"Flaky tests are inevitable and should be tolerated"**→ Flaky tests are symptoms of real problems: race conditions in the application, shared mutable state between tests, time-dependent logic, or network dependency. Each flaky test is a diagnostic opportunity. Track flaky tests separately (quarantine), investigate root causes, and fix them. A suite with 5 percent flaky rate means 5 percent of runs waste CI time and erode team confidence in tests.

**"Production incidents are ops problems, not SDET problems"**→ SDETs who learn from production incidents write tests that PREVENT recurrence. Every incident report describes: a scenario that was not tested, an assertion that was missing, or a monitoring gap. An SDET reading incident reports with the question could my test suite have caught this? turns incidents into test coverage improvements.

**"Environment differences do not cause test failures"**→ Environment differences cause the most confusing test failures: tests pass locally but fail in CI because of different timezone settings, different locale formats (date as MM/DD vs DD/MM), different screen resolutions (element hidden below fold), different network latency (timeout thresholds too tight), or different file system case sensitivity (Linux vs macOS paths).

**"Test automation reduces testing effort"**→ Test automation SHIFTS effort from execution to maintenance. Writing, debugging, and maintaining automated tests requires engineering effort. The ROI is positive when: tests run frequently (daily CI), cover regression-prone areas, and are maintained by engineers who understand both the tests and the application. Unmaintained automation becomes a cost center that produces unreliable results.

---

**Navigation**: [← Chapter 42: Polling Patterns](../03_Real_World_Scenarios/42_Polling_Async_Data_Patterns.md) | [Index](../00_INDEX.md) | [→ Chapter 44: Enterprise API Client Library](../05_Enterprise_Framework/44_Enterprise_API_Client_Library.md)
