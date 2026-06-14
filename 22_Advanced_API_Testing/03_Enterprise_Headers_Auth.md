# 03. Enterprise Headers, Auth, and Interception

**Navigation**: [â† Previous: Complex JSON & SOAP](02_Complex_JSON_and_SOAP.md) | [Index](../00_MASTER_INDEX.md)

---

## 5W1H — Why This Chapter?

- **WHAT**: Handling complex HTTP headers, OAuth2 flows, and intercepting network traffic using Playwright.
- **WHY**: Enterprise APIs (Dynamics 365, Salesforce) reject your requests immediately if you don't provide the exact combination of Authentication tokens, Accept headers, and Correlation IDs. Furthermore, sometimes you need to mock an API response to test a UI edge case.
- **WHO**: SDETs integrating UI automation with backend services.
- **WHEN**: When your API calls return `401 Unauthorized` or `406 Not Acceptable`, or when you need to bypass a slow UI login screen.
- **HOW**: By configuring Playwright's global headers and using `page.route()` to intercept traffic.

---

## 1. Demystifying Enterprise Headers

A header is just a key-value pair of metadata attached to a request or response.

### Common Enterprise Headers You Will Encounter:

1. **`Authorization: Bearer eyJhb...`**
   - The most common authentication mechanism (OAuth2 JWT tokens).
2. **`Accept: application/json`**
   - Tells the server: "I only understand JSON. If you try to send me XML, I will reject it."
3. **`Content-Type: application/json`**
   - Tells the server: "The body I am sending you right now is formatted as JSON." (Playwright sets this automatically when you use `data:`).
4. **`x-correlation-id: 12345-abcde`**
   - A custom header (starts with `x-`) used by enterprise logging systems (like Splunk or Datadog) to trace a single request as it jumps between 10 different microservices.

### Setting Headers in Playwright

You can set headers for a single request:

```typescript
const response = await request.get("/api/users", {
  headers: {
    Accept: "application/json",
    "x-correlation-id": "TEST-RUN-123",
  },
});
```

---

## 2. API Authentication (Bypassing UI Logins)

The #1 rule of UI testing: **Do not use the UI to log in for every test.** It is incredibly slow and prone to breaking (e.g., CAPTCHAs, MFA prompts).

Instead, you use the API to grab the authentication token/cookies, and instantly inject them into the browser.

### The Playwright "Global Setup" Pattern

Playwright allows you to run a script _once_ before the entire test suite starts.

**Step 1: Write a `global.setup.ts` file.**

```typescript
import { test as setup, expect } from "@playwright/test";

setup("Authenticate via API", async ({ request }) => {
  // 1. Send credentials directly to the auth API
  const response = await request.post("https://api.dynamics.com/auth/token", {
    data: {
      username: "admin@company.com",
      password: process.env.ADMIN_PASSWORD,
    },
  });

  const authData = await response.json();
  const token = authData.access_token;

  // 2. Save the token to a local JSON file!
  process.env.TEST_TOKEN = token;
});
```

**Step 2: Use the token in your API tests (via `playwright.config.ts`)**

```typescript
export default defineConfig({
  use: {
    extraHTTPHeaders: {
      Authorization: `Bearer ${process.env.TEST_TOKEN}`,
    },
  },
});
```

_(Note: For UI testing, you would save the actual Browser Cookies to a state file using `page.context().storageState()`, allowing the browser to skip the login screen entirely)._

---

## 3. Network Interception (Mocking)

Sometimes you need to test how the UI reacts to an API error (e.g., what does the app do if the database is down and returns a `500 Server Error`?).

It is very hard to intentionally break a production database. Instead, you can tell Playwright to **intercept** the outgoing API call from the browser and fake the response!

```typescript
test("UI should show an error banner when the API fails", async ({ page }) => {
  // Intercept any request ending in /api/customers
  await page.route("**/api/customers", async (route) => {
    // Fake the response! The actual API is never hit.
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Database Timeout" }),
    });
  });

  // Navigate to the page. The page will try to load customers,
  // but Playwright will instantly return the 500 error we defined above.
  await page.goto("/customers");

  // Verify the UI handles it gracefully
  await expect(
    page.getByText("An unexpected error occurred. Please try again later."),
  ).toBeVisible();
});
```

### Why is this powerful?

1. **Edge Cases:** You can mock extremely rare API scenarios (like returning an empty array, or returning malformed data).
2. **Speed:** Mocked requests return instantly.
3. **Isolation:** If the staging API is down, your UI tests can still pass because they are mocking the data.

---

## ðŸ‹ï¸ Practice & Interview Questions

**Q1.** What is the difference between the `Accept` header and the `Content-Type` header?

<details><summary>Answer</summary>

`Content-Type` describes the format of the data you are _sending_ to the server in the request body. `Accept` tells the server what format of data you are willing to _receive_ back in the response body.

</details>

**Q2.** Why should an SDET avoid logging in via the UI for every single Playwright test?

<details><summary>Answer</summary>

UI logins are slow, repetitive, and susceptible to flakiness caused by network latency, third-party authentication services, or CAPTCHAs. Instead, tests should authenticate once via the API, store the session state/token, and inject it into the browser context for subsequent tests.

</details>

**Q3.** You need to verify that a React application properly displays a "No Results Found" graphic when a search returns zero items. However, the test database always has data. How do you test this using Playwright?

<details><summary>Answer</summary>

Use Playwright's network interception (`page.route()`). Intercept the search API call and use `route.fulfill()` to return a `200 OK` status with an empty array `[]` as the JSON body. Then assert that the "No Results Found" graphic becomes visible in the UI.

</details>

---

## 🏋️ Practice Challenges

### Challenge 1 [MCQ] — OAuth2 Token vs Session Cookie

Your enterprise system supports two auth mechanisms: OAuth2 Bearer tokens for machine-to-machine API calls, and Session cookies for browser-based UI sessions. In Playwright tests, which should you use for API request fixtures vs browser page fixtures?

A) Bearer tokens for both — cookies are legacy  
B) Session cookies for both — Playwright's `storageState` is optimized for cookies  
C) Bearer tokens in `request` fixtures; `storageState` (cookies) in `page` fixtures  
D) Always re-authenticate per test regardless of mechanism

<details><summary>Answer</summary>

**C** — Use the right mechanism for the right layer:

- **API `request` fixtures**: use Bearer tokens. They are stateless, easily injected via `Authorization: Bearer ${token}`, and work across workers without cookie domain concerns.
- **Browser `page` fixtures**: use `storageState` to inject the session cookie. This allows the browser to skip the login page entirely.

```typescript
// playwright.config.ts
projects: [
  {
    name: "api-tests",
    use: { extraHTTPHeaders: { Authorization: `Bearer ${token}` } },
  },
  { name: "browser-tests", use: { storageState: "auth.json" } }, // session cookie injected
];
```

Mixing them creates maintenance problems: if you use cookies for API calls, you must manage cookie expiry and domain scoping; if you use Bearer tokens in the browser, you need custom headers on every navigation.

</details>

---

### Challenge 2 [Spot the Bug — `x-correlation-id` Hardcoded]

```typescript
const response = await request.get("/api/citations", {
  headers: {
    Authorization: `Bearer ${token}`,
    "x-correlation-id": "TEST-12345", // ← hardcoded
    Accept: "application/json",
  },
});
```

Your CI runs 8 parallel workers. Each worker sends this request. What problem does the hardcoded correlation ID cause in your Splunk/Datadog logs?

<details><summary>Answer</summary>

**All 8 parallel test workers send the same `x-correlation-id: TEST-12345`**. In Splunk, when you search for `x-correlation-id=TEST-12345` to debug a failure, you get log entries from all 8 workers interleaved — making it impossible to trace which specific worker's request caused the failure.

**Fix**: generate a unique ID per test run:

```typescript
import { randomUUID } from "crypto";

const response = await request.get("/api/citations", {
  headers: {
    Authorization: `Bearer ${token}`,
    "x-correlation-id": `test-${randomUUID()}`, // unique per request
    Accept: "application/json",
  },
});
```

Better still, inject the test title into the correlation ID so the log entry is self-describing:

```typescript
'x-correlation-id': `test-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}`
```

</details>

---

### Challenge 3 [Write It Yourself — Route Interception for Token Expiry]

Write a Playwright test that simulates an expired Bearer token scenario: intercept any request to `**/api/**`, respond with a `401 Unauthorized`, and assert that the UI shows a `"Session expired. Please log in again."` message.

<details><summary>Answer</summary>

```typescript
test("UI shows session-expired message on 401", async ({ page }) => {
  // Intercept ALL requests to the API and return 401
  await page.route("**/api/**", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        error: "TOKEN_EXPIRED",
        message: "Token has expired",
      }),
    });
  });

  // Navigate — the page will fire API calls which all return 401
  await page.goto("/dashboard");

  // Assert the UI shows the correct user-facing error
  await expect(
    page.getByText("Session expired. Please log in again."),
  ).toBeVisible({ timeout: 5000 });

  // Assert that the page does NOT show any data (since all API calls failed)
  await expect(page.locator(".citation-table")).not.toBeVisible();
});
```

**Why `page.route` pattern over faking the token?**  
Generating an intentionally expired JWT is complex (requires time manipulation). Intercepting at the network layer is simpler, faster, and tests exactly what you want: the UI's response to a 401, regardless of HOW it occurred.

</details>

---

### Challenge 4 [MCQ] — `page.route` vs `page.unroute`

After using `page.route('**/api/**', handler)` in a test to mock API responses, the next test in the same worker fails because the API mock is still active. Why?

A) `page.route` handlers persist across tests by default when tests share a browser context  
B) `page.route` handlers are automatically cleared between tests in isolated contexts  
C) `page.route` only affects the first matching request  
D) Workers share route handlers globally

<details><summary>Answer</summary>

**B is the expected behavior** when using Playwright's built-in `page` fixture — each test gets an isolated `BrowserContext` and `Page`, so routes do NOT persist.

**But if you're seeing persistence**, the likely cause is that tests are inadvertently sharing a `BrowserContext` (e.g., the team manually called `browser.newPage()` instead of using the `page` fixture, placing both pages in the same context).

The fix for manual context sharing:

```typescript
// Option 1: Always use the page fixture (recommended)
test("...", async ({ page }) => {
  /* isolated context */
});

// Option 2: If using manual contexts, unroute explicitly after the test
await page.unroute("**/api/**", handler);
// OR clear all routes:
await page.unrouteAll();
```

</details>

---

### Challenge 5 [Architecture — Service-to-Service Auth]

Your test suite needs to call Service A, which internally calls Service B. Service B is authenticated with mTLS (mutual TLS client certificates). The SDET doesn't have access to the client certificate. What are the two architecturally sound approaches?

<details><summary>Answer</summary>

**Approach 1 — Test at the Service A boundary only (recommended for integration tests)**

Don't test through Service A → B directly. In integration tests, mock Service B at the network level:

```typescript
await page.route("**/service-b/**", (route) =>
  route.fulfill({ status: 200, body: JSON.stringify(serviceBMockResponse) }),
);
```

Test what Service A does with Service B's response — without needing the mTLS cert.

**Approach 2 — Use a service account with elevated access (for E2E/contract tests)**

In staging, provision a dedicated service account that is whitelisted to bypass or hold the mTLS cert. The SDET team never handles the cert directly; the DevOps/platform team stores it in CI secrets and injects it:

```typescript
// playwright.config.ts (injected by CI)
clientCertificates: [
  {
    origin: "https://service-b.internal",
    pfxPath: process.env.CLIENT_CERT_PFX_PATH!,
    passphrase: process.env.CLIENT_CERT_PASSPHRASE!,
  },
];
```

**SDE principle**: SDETs should not own security credentials. They should consume them via CI secrets injection. mTLS cert management is a platform/DevSecOps concern.

</details>

---

**Navigation**: [← Previous: Complex JSON & SOAP](02_Complex_JSON_and_SOAP.md) | [Index](../00_MASTER_INDEX.md)
