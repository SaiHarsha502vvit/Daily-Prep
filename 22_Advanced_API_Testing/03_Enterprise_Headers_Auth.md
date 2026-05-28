# 03. Enterprise Headers, Auth, and Interception

**Navigation**: [← Previous: Complex JSON & SOAP](02_Complex_JSON_and_SOAP.md) | [Index](../00_MASTER_INDEX.md)

---

## 5W1H — Why This Chapter?

* **WHAT**: Handling complex HTTP headers, OAuth2 flows, and intercepting network traffic using Playwright.
* **WHY**: Enterprise APIs (Dynamics 365, Salesforce) reject your requests immediately if you don't provide the exact combination of Authentication tokens, Accept headers, and Correlation IDs. Furthermore, sometimes you need to mock an API response to test a UI edge case.
* **WHO**: SDETs integrating UI automation with backend services.
* **WHEN**: When your API calls return `401 Unauthorized` or `406 Not Acceptable`, or when you need to bypass a slow UI login screen.
* **HOW**: By configuring Playwright's global headers and using `page.route()` to intercept traffic.

---

## 1. Demystifying Enterprise Headers

A header is just a key-value pair of metadata attached to a request or response.

### Common Enterprise Headers You Will Encounter:

1. **`Authorization: Bearer eyJhb...`** 
   * The most common authentication mechanism (OAuth2 JWT tokens).
2. **`Accept: application/json`** 
   * Tells the server: "I only understand JSON. If you try to send me XML, I will reject it."
3. **`Content-Type: application/json`** 
   * Tells the server: "The body I am sending you right now is formatted as JSON." (Playwright sets this automatically when you use `data:`).
4. **`x-correlation-id: 12345-abcde`** 
   * A custom header (starts with `x-`) used by enterprise logging systems (like Splunk or Datadog) to trace a single request as it jumps between 10 different microservices.

### Setting Headers in Playwright
You can set headers for a single request:
```typescript
const response = await request.get('/api/users', {
  headers: {
    'Accept': 'application/json',
    'x-correlation-id': 'TEST-RUN-123'
  }
});
```

---

## 2. API Authentication (Bypassing UI Logins)

The #1 rule of UI testing: **Do not use the UI to log in for every test.** It is incredibly slow and prone to breaking (e.g., CAPTCHAs, MFA prompts).

Instead, you use the API to grab the authentication token/cookies, and instantly inject them into the browser.

### The Playwright "Global Setup" Pattern
Playwright allows you to run a script *once* before the entire test suite starts.

**Step 1: Write a `global.setup.ts` file.**
```typescript
import { test as setup, expect } from '@playwright/test';

setup('Authenticate via API', async ({ request }) => {
  // 1. Send credentials directly to the auth API
  const response = await request.post('https://api.dynamics.com/auth/token', {
    data: {
      username: 'admin@company.com',
      password: process.env.ADMIN_PASSWORD
    }
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
      'Authorization': `Bearer ${process.env.TEST_TOKEN}`,
    },
  }
});
```

*(Note: For UI testing, you would save the actual Browser Cookies to a state file using `page.context().storageState()`, allowing the browser to skip the login screen entirely).*

---

## 3. Network Interception (Mocking)

Sometimes you need to test how the UI reacts to an API error (e.g., what does the app do if the database is down and returns a `500 Server Error`?). 

It is very hard to intentionally break a production database. Instead, you can tell Playwright to **intercept** the outgoing API call from the browser and fake the response!

```typescript
test('UI should show an error banner when the API fails', async ({ page }) => {
  
  // Intercept any request ending in /api/customers
  await page.route('**/api/customers', async (route) => {
    
    // Fake the response! The actual API is never hit.
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Database Timeout' })
    });
  });

  // Navigate to the page. The page will try to load customers, 
  // but Playwright will instantly return the 500 error we defined above.
  await page.goto('/customers');

  // Verify the UI handles it gracefully
  await expect(page.getByText('An unexpected error occurred. Please try again later.')).toBeVisible();
});
```

### Why is this powerful?
1. **Edge Cases:** You can mock extremely rare API scenarios (like returning an empty array, or returning malformed data).
2. **Speed:** Mocked requests return instantly.
3. **Isolation:** If the staging API is down, your UI tests can still pass because they are mocking the data.

---

## 🏋️ Practice & Interview Questions

**Q1.** What is the difference between the `Accept` header and the `Content-Type` header?
<details><summary>Answer</summary>

`Content-Type` describes the format of the data you are *sending* to the server in the request body. `Accept` tells the server what format of data you are willing to *receive* back in the response body.
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
**Navigation**: [← Previous: Complex JSON & SOAP](02_Complex_JSON_and_SOAP.md) | [Index](../00_MASTER_INDEX.md)
