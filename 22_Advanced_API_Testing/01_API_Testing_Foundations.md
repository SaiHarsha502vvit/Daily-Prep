# 01. API Testing Foundations (REST & SOAP)

**Navigation**: [Index](../00_MASTER_INDEX.md) | [Next: Complex JSON & SOAP →](02_Complex_JSON_and_SOAP.md)

---

## 5W1H — Why This Chapter?

* **WHAT**: The fundamental architecture of REST and SOAP APIs, and how to test them using Playwright.
* **WHY**: Before you can handle deeply nested JSON arrays or complex authentication headers, you must understand how data travels over the network.
* **WHO**: SDETs moving from UI automation into API testing.
* **WHEN**: Before writing any backend or integration tests.
* **HOW**: By dissecting HTTP methods, status codes, and the Playwright `request` context.

---

## 1. Why Test APIs? (The Testing Pyramid Revisited)

In the previous module, we learned that UI tests are slow and brittle. API tests are the "sweet spot" of automation.

1. **They are fast:** An API test takes 50-200 milliseconds. A UI test takes 5-15 seconds.
2. **They are reliable:** There is no UI rendering, no loading spinners, and no CSS changes to break your locators.
3. **They bypass the UI:** If the UI team hasn't finished the frontend yet, you can still test the backend business logic.

---

## 2. REST vs SOAP: The Executive Summary

Enterprise systems like Dynamics 365 often use a mix of both.

### REST (Representational State Transfer)
* **Format:** Usually JSON (JavaScript Object Notation), which looks exactly like TypeScript objects.
* **Architecture:** Uses standard HTTP Methods (`GET`, `POST`, `PUT`, `DELETE`).
* **State:** Stateless. The server forgets you exist between requests (unless you pass an Auth token).
* **Modernity:** The standard for almost all modern web applications.

### SOAP (Simple Object Access Protocol)
* **Format:** STRICTLY XML (Extensible Markup Language).
* **Architecture:** Everything is usually a `POST` request sent to a single endpoint (e.g., `/api/Service.svc`). You tell the server what to do inside the XML body (the "Envelope").
* **Rigidity:** Extremely strict. It uses a WSDL (Web Services Description Language) file to define exactly what requests must look like. If you miss a single tag, it fails.
* **Modernity:** Legacy, but incredibly common in banking, ERPs (like older SAP/Dynamics versions), and massive enterprise systems.

---

## 3. The Anatomy of an HTTP Request

When your browser (or Playwright script) talks to an API, it sends a package of text.

### The Request (What you send)
1. **Method/Verb:** What action are you taking? (`GET` = Read, `POST` = Create, `PUT` = Update, `DELETE` = Delete).
2. **URL/Endpoint:** Where are you sending it? (`https://api.dynamics.com/users`)
3. **Headers:** Metadata. (e.g., `Authorization: Bearer xyz123`, `Content-Type: application/json`).
4. **Body:** The actual data payload (only used in `POST` and `PUT`).

### The Response (What the server replies)
1. **Status Code:** Was it successful? 
   * `2xx`: Success (e.g., `200 OK`, `201 Created`).
   * `4xx`: Client Error — YOU messed up. (e.g., `400 Bad Request`, `401 Unauthorized`, `404 Not Found`).
   * `5xx`: Server Error — THEY messed up. (e.g., `500 Internal Server Error`).
2. **Headers:** Metadata (e.g., `Set-Cookie`).
3. **Body:** The requested data (usually JSON or XML).

---

## 4. Playwright API Testing: `request` Context

Playwright isn't just for UI testing. It has a built-in API testing library that is incredibly fast and powerful. It uses the `request` fixture instead of the `page` fixture.

### A Basic REST GET Request
```typescript
import { test, expect } from '@playwright/test';

test('Should fetch a user successfully', async ({ request }) => {
  // 1. Send the GET request
  const response = await request.get('https://jsonplaceholder.typicode.com/users/1');

  // 2. Verify the Status Code
  expect(response.status()).toBe(200);

  // 3. Parse the JSON body
  const responseBody = await response.json();

  // 4. Assert the data
  expect(responseBody.name).toBe('Leanne Graham');
  expect(responseBody.email).toContain('@');
});
```

### A Basic REST POST Request
When creating data, you must send a payload in the `data` object. Playwright automatically sets the `Content-Type: application/json` header for you!

```typescript
test('Should create a new user', async ({ request }) => {
  const response = await request.post('https://jsonplaceholder.typicode.com/users', {
    data: {
      name: 'John Doe',
      job: 'SDET'
    }
  });

  expect(response.status()).toBe(201); // 201 = Created
  
  const responseBody = await response.json();
  expect(responseBody.id).toBeDefined(); // The server should generate an ID
});
```

---

## 5. Setting Up Global API Contexts

If every single API request requires an authentication token and a specific base URL, you shouldn't type it in every test. You can configure it globally in `playwright.config.ts`.

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: 'https://api.dynamics-test-env.com/v1.0/',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${process.env.TEST_TOKEN}`,
      'x-client-version': '2.4.1'
    },
  }
});
```
Now, in your tests, you just write: `request.get('users/1')` and Playwright handles the base URL and headers automatically!

---

## ðŸ‹ï¸ Practice & Interview Questions

**Q1.** What is the primary difference between how REST and SOAP handle actions?
<details><summary>Answer</summary>

REST uses standard HTTP methods (GET, POST, PUT, DELETE) on different URLs to signify actions. SOAP typically uses a single endpoint and sends all requests as POST methods, defining the action inside the XML body Envelope.
</details>

**Q2.** You send a POST request to create a user and receive a `400 Bad Request` status code. Whose fault is it, the client (your test) or the server?
<details><summary>Answer</summary>

The client (your test). A 4xx series error indicates a client error. A 400 Bad Request usually means your JSON payload was malformed, missing a required field, or violated a validation rule (e.g., sending an integer when a string was expected).
</details>

**Q3.** Why should you use `request.post()` instead of writing your own `fetch()` calls inside a Playwright test?
<details><summary>Answer</summary>

Playwright's `request` context automatically handles cookies, respects the `baseURL` and headers defined in `playwright.config.ts`, automatically parses JSON, and integrates perfectly with Playwright's reporting and tracing tools.
</details>


---

## 🏋️ Practice Challenges

### Challenge 1 [MCQ] — HTTP Method Semantics

Which HTTP method is idempotent AND has no defined body semantics?

A) POST  
B) PUT  
C) GET  
D) PATCH

<details><summary>Answer</summary>

**C — GET**.

- **Idempotent**: calling it N times has the same effect as calling it once.
- **No body**: GET requests MUST NOT include a body (RFC 7231 §4.3.1). Some servers silently ignore it; strict servers return 400.

| Method | Idempotent? | Has body? | Safe? |
|---|---|---|---|
| GET | ✅ | ❌ | ✅ |
| POST | ❌ | ✅ | ❌ |
| PUT | ✅ | ✅ | ❌ |
| PATCH | ❌ | ✅ | ❌ |
| DELETE | ✅ | Rarely | ❌ |

**SDET impact**: If a PUT or DELETE is accidentally re-run in cleanup, it should be safe. A POST must NOT be re-run without deliberate intent.

</details>

---

### Challenge 2 [Spot the Bug — Status Code Assertion]

```typescript
test('Create citation returns success', async ({ request }) => {
  const response = await request.post('/api/citations', {
    data: { customerId: 'USR-001', amount: 150 }
  });
  expect(response.ok()).toBe(true);
});
```

The test passes. Two months later a developer changes the API to return `202 Accepted` instead of `201 Created` (the job is now async). The test still passes. What is the hidden risk?

<details><summary>Answer</summary>

**`response.ok()` returns `true` for any 2xx status** — it does not distinguish between 200, 201, 202, 204, etc. If the API semantics changed from synchronous creation (`201`) to async queue (`202`), the behaviour contract changed but the test kept passing silently.

**Fix**: Assert the exact status code that matches the documented API contract:
```typescript
expect(response.status()).toBe(201); // precise: fails if contract changes to 202
```

This forces a deliberate test update when the contract changes — which is the point of API testing.

</details>

---

### Challenge 3 [Write It Yourself — Error Shape Assertion]

The API returns this body on a `400 Bad Request`:
```json
{ "code": "VALIDATION_ERROR", "fields": ["amount", "customerId"] }
```

Write a Playwright assertion that: (a) checks the status is 400, (b) checks `code === 'VALIDATION_ERROR'`, (c) checks both `amount` and `customerId` are in the `fields` array.

<details><summary>Answer</summary>

```typescript
test('Missing required fields return 400 with validation shape', async ({ request }) => {
  const response = await request.post('/api/citations', {
    data: {}  // deliberately empty — triggers validation error
  });

  // (a) status
  expect(response.status()).toBe(400);

  // (b) + (c) parse and assert
  const body = await response.json();
  expect(body.code).toBe('VALIDATION_ERROR');
  expect(body.fields).toContain('amount');
  expect(body.fields).toContain('customerId');
});
```

**Why `.toContain` and not `.toEqual(['amount', 'customerId'])`?**  
Field order in the error response is not guaranteed. `.toContain` checks membership regardless of position — making the test resilient to API implementation changes.

</details>

---

### Challenge 4 [MCQ] — `extraHTTPHeaders` Scope

You configure `extraHTTPHeaders: { 'x-tenant-id': 'ACME' }` in `playwright.config.ts`. Which requests does this header apply to?

A) Only `request.get()` calls  
B) Only requests made by `page.goto()` and `page.click()` (browser navigation)  
C) All requests made through both the `request` fixture and the browser `page` context  
D) Only requests to the configured `baseURL`

<details><summary>Answer</summary>

**C** — `extraHTTPHeaders` in `playwright.config.ts > use` is injected into **all requests** made by that project — both the API `request` context and browser-level `page` requests.

This is both powerful and dangerous:
- ✅ Power: you set the tenant ID once and every test and every navigation includes it.
- ⚠️ Risk: if a third-party CDN request inadvertently picks up your auth header, you're leaking credentials.

For headers that should only go to *your* API, set them in your `ApiClient` class or per-request rather than globally.

</details>

---

### Challenge 5 [Spot the Bug — Global Setup Token Timing]

```typescript
// global.setup.ts
setup('Authenticate', async ({ request }) => {
  const res = await request.post('/auth/token', {
    data: { client_id: process.env.CLIENT_ID, client_secret: process.env.CLIENT_SECRET }
  });
  const { access_token } = await res.json();
  process.env.TEST_TOKEN = access_token;
});

// playwright.config.ts
export default defineConfig({
  use: {
    extraHTTPHeaders: {
      Authorization: `Bearer ${process.env.TEST_TOKEN}`  // ← evaluated HERE
    }
  }
});
```

The Authorization header is always `Bearer undefined` in tests. Explain why.

<details><summary>Answer</summary>

**Root cause**: `playwright.config.ts` is **evaluated (imported) before global setup runs**. When Node.js evaluates `` `Bearer ${process.env.TEST_TOKEN}` ``, `TEST_TOKEN` hasn't been set yet. The template literal captures `undefined` at config-load time, not at test-run time.

**Fix**: Use a lazy token approach — read the env var inside a fixture, not inside the config object literal:

```typescript
// playwright.config.ts — store the raw env reference, not the evaluated string
export default defineConfig({
  use: {
    // Don't interpolate here. Instead inject per-request in your ApiClient fixture.
  }
});

// fixtures/api.fixture.ts
apiClient: async ({ request }, use) => {
  const token = process.env.TEST_TOKEN; // read lazily at fixture time, after global setup
  await use(new ApiClient(request, token!));
}
```

</details>

---
**Navigation**: [Index](../00_MASTER_INDEX.md) | [Next: Complex JSON & SOAP →](02_Complex_JSON_and_SOAP.md)
