# API Testing

> The authoritative reference for HTTP-level testing with Playwright's `APIRequestContext`. The wire-level model, the factory pattern that scales to 100+ endpoints, typed domain clients, schema validation, request/response inspection, retries, timeouts, performance, and every production failure mode that's bitten teams.

---

## Table of contents

1. [Why API testing in a UI tool](#1-why-api-testing-in-a-ui-tool)
2. [`APIRequestContext` — the model](#2-apirequestcontext--the-model)
3. [The built-in `request` fixture](#3-the-built-in-request-fixture)
4. [Custom request contexts](#4-custom-request-contexts)
5. [HTTP verbs in depth](#5-http-verbs-in-depth)
6. [Request body formats](#6-request-body-formats)
7. [Response handling](#7-response-handling)
8. [Headers — factory pattern](#8-headers--factory-pattern)
9. [Endpoints — function factories](#9-endpoints--function-factories)
10. [Payloads — override factory pattern](#10-payloads--override-factory-pattern)
11. [The `APIUtils` wrapper](#11-the-apiutils-wrapper)
12. [Typed domain clients](#12-typed-domain-clients)
13. [Schema validation with Zod](#13-schema-validation-with-zod)
14. [The 5-layer enterprise API library](#14-the-5-layer-enterprise-api-library)
15. [Authentication strategies](#15-authentication-strategies)
16. [Retries and timeouts](#16-retries-and-timeouts)
17. [HAR recording and inspection](#17-har-recording-and-inspection)
18. [Performance considerations](#18-performance-considerations)
19. [API ↔ UI cross-validation patterns](#19-api--ui-cross-validation-patterns)
20. [Common production failures](#20-common-production-failures)
21. [Anti-pattern catalog](#21-anti-pattern-catalog)

---

## 1. Why API testing in a UI tool

Three reasons teams put API tests alongside UI tests:

| Reason                        | Detail                                                                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Setup is faster via API**   | Creating a customer + order + invoice via UI takes 30s. Via API: 200ms. UI tests can use the API to seed data, then test only the UI behaviour. |
| **Shared session**            | The `request` fixture inherits the browser's cookies. UI logs in → API requests are automatically authenticated.                                |
| **Same language, same types** | One TypeScript codebase, one fixture system, one reporter for both UI and API tests. No second framework to learn.                              |
| **Cross-validation**          | UI says "Saved." The API confirms the record actually exists in the DB. Catches success-theatre bugs.                                           |

Playwright's API testing is not as deep as dedicated tools (Postman, REST Assured, k6) — it's a competent HTTP client integrated with the test runner. For most teams that's the right trade-off.

### 1.1 When NOT to use Playwright for API tests

| Scenario                                 | Better tool                 |
| ---------------------------------------- | --------------------------- |
| Load testing 1000+ RPS                   | k6, Gatling                 |
| Performance benchmarking with statistics | k6, Locust                  |
| Contract testing (consumer-driven)       | Pact, Spring Cloud Contract |
| Interactive API exploration              | Postman, Insomnia, Bruno    |
| Spec-driven tests from OpenAPI/Swagger   | Schemathesis, Dredd         |

For functional + integration API tests in the same suite as UI tests, Playwright wins.

---

## 2. `APIRequestContext` — the model

`APIRequestContext` is Playwright's HTTP client. One interface, multiple ways to obtain one:

| Source                            | Cookie sharing                | Use for                           |
| --------------------------------- | ----------------------------- | --------------------------------- |
| The `request` test fixture        | Inherits the browser context  | UI + API in same test             |
| `page.request`                    | Same as above (alias)         | API calls in a UI test            |
| `playwright.request.newContext()` | Isolated — no browser cookies | Pure API tests with custom config |
| `browser.newContext().request`    | Inherits new context          | Multi-session tests               |

### 2.1 What `APIRequestContext` provides

```typescript
interface APIRequestContext {
  // HTTP verbs
  get(url: string, options?: RequestOptions): Promise<APIResponse>;
  post(url: string, options?: RequestOptions): Promise<APIResponse>;
  put(url: string, options?: RequestOptions): Promise<APIResponse>;
  patch(url: string, options?: RequestOptions): Promise<APIResponse>;
  delete(url: string, options?: RequestOptions): Promise<APIResponse>;
  head(url: string, options?: RequestOptions): Promise<APIResponse>;
  fetch(
    url: string,
    options?: RequestOptions & { method?: string },
  ): Promise<APIResponse>;

  // State
  storageState(options?: { path?: string }): Promise<StorageState>;
  dispose(): Promise<void>;
}
```

### 2.2 What `APIResponse` provides

```typescript
interface APIResponse {
  status(): number;
  statusText(): string;
  ok(): boolean; // true if status in [200, 299]
  url(): string; // final URL after redirects
  headers(): Record<string, string>;
  headersArray(): { name: string; value: string }[];

  // Body access
  body(): Promise<Buffer>;
  text(): Promise<string>;
  json(): Promise<any>;

  // Failure path
  dispose(): Promise<void>;
}
```

### 2.3 Common pattern — full request/response cycle

```typescript
test("GET /citations/:id returns citation", async ({ request }) => {
  const response = await request.get("/api/citations/CIT-001", {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.status()).toBe(200);
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("application/json");

  const body = await response.json();
  expect(body.id).toBe("CIT-001");
  expect(body.status).toBe("PAID");
});
```

---

## 3. The built-in `request` fixture

Playwright provides `request` as a default fixture. It's test-scoped and shares cookies with the browser context.

### 3.1 Configuration via `playwright.config.ts`

```typescript
use: {
  baseURL: 'https://api.example.com',
  extraHTTPHeaders: {
    'x-test-run': 'true',
    'x-correlation-id': process.env.RUN_ID ?? '',
  },
  httpCredentials: { username: 'user', password: 'pass' },   // HTTP Basic
  ignoreHTTPSErrors: true,                                    // accept self-signed
  proxy: { server: 'http://proxy.corp:8080' },
}
```

These options apply to BOTH `request` and `page.request`. They merge with per-call options (per-call wins).

### 3.2 Cookie inheritance from browser

```typescript
test("UI login, API uses session", async ({ page, request }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("admin");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/dashboard/);

  // request inherits the browser's cookies
  const response = await request.get("/api/me");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.email).toBe("admin@example.com");
});
```

### 3.3 When the inheritance becomes a trap

If your test starts with `storageState`, the browser context has cookies but `request` may not — depends on Playwright version and how storageState was loaded.

```typescript
// Always-safe pattern: use page.request, which guarantees cookie sharing
const response = await page.request.get("/api/me");
```

`page.request` is identical to `request` but explicitly attached to the page's context.

---

## 4. Custom request contexts

For tests that need different settings (different base URL, different auth, no cookie sharing):

```typescript
import { test as base, request as playwrightRequest } from "@playwright/test";

const test = base.extend<{ adminApi: APIRequestContext }>({
  adminApi: async ({}, use) => {
    const ctx = await playwrightRequest.newContext({
      baseURL: "https://admin-api.example.com",
      extraHTTPHeaders: {
        Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
        "x-admin-mode": "true",
      },
      timeout: 60_000,
    });
    await use(ctx);
    await ctx.dispose();
  },
});

test("admin API call", async ({ adminApi }) => {
  const response = await adminApi.post("/users", {
    data: { email: "new@example.com" },
  });
  expect(response.ok()).toBeTruthy();
});
```

### 4.1 Worker-scoped context

For a request context that's expensive to create (e.g., one with mTLS certs loaded):

```typescript
const test = base.extend<{}, { apiCtx: APIRequestContext }>({
  apiCtx: [
    async ({}, use) => {
      const ctx = await playwrightRequest.newContext({
        baseURL: process.env.API_URL,
        clientCertificates: [
          {
            origin: process.env.API_URL!,
            certPath: "/etc/certs/client.crt",
            keyPath: "/etc/certs/client.key",
          },
        ],
      });
      await use(ctx);
      await ctx.dispose();
    },
    { scope: "worker" },
  ],
});
```

One context per worker. All tests in that worker reuse it. Cookies persist across tests — usually fine for read-only API tests.

---

## 5. HTTP verbs in depth

All verbs share the same option shape; differences are semantic.

### 5.1 GET

```typescript
const response = await request.get("/api/citations", {
  params: { status: "PAID", limit: 50 }, // adds ?status=PAID&limit=50
  headers: { Accept: "application/json" },
  timeout: 30_000,
});
```

GET MUST NOT have a body per spec. Playwright will reject `data` on a GET. If your API requires it, use `fetch` with `method: 'GET'`.

### 5.2 POST — multiple body formats

```typescript
// JSON body (default for `data`)
await request.post("/citations", {
  data: { status: "PENDING", amount: 150 },
});

// Form-urlencoded body
await request.post("/oauth/token", {
  form: {
    grant_type: "client_credentials",
    client_id: "x",
    client_secret: "y",
  },
});

// Multipart form data (file upload)
import * as fs from "node:fs";
await request.post("/upload", {
  multipart: {
    file: {
      name: "invoice.pdf",
      mimeType: "application/pdf",
      buffer: fs.readFileSync("invoice.pdf"),
    },
    description: "Q4 invoice", // text fields
  },
});

// Raw body (strings, buffers)
await request.post("/raw", {
  data: "plain text body",
  headers: { "Content-Type": "text/plain" },
});
```

### 5.3 PUT — idempotent update

```typescript
await request.put(`/citations/${id}`, {
  data: { status: "PAID", amount: 150, paidAt: new Date().toISOString() },
});
```

PUT replaces the resource. Send the full representation, not partial.

### 5.4 PATCH — partial update

```typescript
await request.patch(`/citations/${id}`, {
  data: { status: "PAID" },
  headers: { "Content-Type": "application/merge-patch+json" }, // RFC 7396
});
```

JSON Merge Patch is the most common; JSON Patch (RFC 6902) is also supported by some APIs.

### 5.5 DELETE

```typescript
const response = await request.delete(`/citations/${id}`);
expect(response.status()).toBe(204); // No Content
```

DELETE typically returns 204 (success, no body) or 200 (success, with body). Both are correct per spec.

### 5.6 HEAD — metadata only

```typescript
const response = await request.head(`/citations/${id}`);
expect(response.status()).toBe(200);
expect(response.headers()["etag"]).toBeDefined();
```

Useful for existence checks and cache validation. The body is always empty.

### 5.7 OPTIONS — CORS preflight

```typescript
const response = await request.fetch(`/citations/${id}`, { method: "OPTIONS" });
expect(response.headers()["access-control-allow-origin"]).toBe("*");
```

OPTIONS isn't exposed as a method but `fetch` accepts any verb. Use for testing CORS configuration.

---

## 6. Request body formats

The `RequestOptions` interface accepts:

| Option               | Format              | Content-Type set                    | Notes                          |
| -------------------- | ------------------- | ----------------------------------- | ------------------------------ |
| `data` (object)      | JSON-stringified    | `application/json`                  | Default for non-string data    |
| `data` (string)      | Sent as-is          | (caller must set)                   | For raw text bodies            |
| `data` (Buffer)      | Sent as-is          | (caller must set)                   | For binary uploads             |
| `form` (object)      | URL-encoded         | `application/x-www-form-urlencoded` | Each value coerced to string   |
| `multipart` (object) | Multipart/form-data | `multipart/form-data; boundary=...` | For file uploads + text fields |

### 6.1 Charset handling

JSON bodies are encoded UTF-8 by default. For non-UTF-8 systems (legacy SOAP, Japanese mainframes):

```typescript
import iconv from "iconv-lite";

const sjisBody = iconv.encode(JSON.stringify({ name: "テスト" }), "shift_jis");
await request.post("/legacy", {
  data: sjisBody,
  headers: { "Content-Type": "application/json; charset=Shift_JIS" },
});
```

### 6.2 Multipart deep dive

```typescript
await request.post("/api/documents", {
  multipart: {
    // Text field
    title: "Q4 Report",

    // File from disk
    document: fs.createReadStream("q4-report.pdf"),

    // File from buffer
    cover: {
      name: "cover.png",
      mimeType: "image/png",
      buffer: fs.readFileSync("cover.png"),
    },

    // Multiple files for one field — pass an array
    attachments: [
      { name: "a.csv", mimeType: "text/csv", buffer: csvBufferA },
      { name: "b.csv", mimeType: "text/csv", buffer: csvBufferB },
    ],
  },
});
```

### 6.3 Streaming bodies

For large uploads (>100 MB), use a stream to avoid loading the whole file into memory:

```typescript
import * as fs from "node:fs";

await request.post("/upload", {
  data: fs.createReadStream("large-file.bin"),
  headers: {
    "Content-Type": "application/octet-stream",
    "Content-Length": fs.statSync("large-file.bin").size.toString(),
  },
});
```

---

## 7. Response handling

### 7.1 Status checks

```typescript
const response = await request.get("/api/citations/CIT-001");

response.status(); // 200
response.statusText(); // 'OK'
response.ok(); // true for 200–299

// Common pattern
expect(response.ok()).toBeTruthy();
// Or with custom message
expect(
  response.ok(),
  `GET citation failed: ${response.status()} ${await response.text()}`,
).toBeTruthy();
```

### 7.2 Body extraction

```typescript
// JSON — parsed
const body = await response.json(); // any (or your typed cast)
const typed = (await response.json()) as Citation;

// Text — UTF-8 string
const text = await response.text();

// Binary — raw bytes
const buffer = await response.body(); // Buffer
console.log(buffer.length, "bytes");
```

> **Important:** `json()` / `text()` / `body()` can only be called ONCE per response (the underlying stream is consumed). If you need both bytes and JSON, read once and parse:
>
> ```typescript
> const buf = await response.body();
> const text = buf.toString("utf8");
> const json = JSON.parse(text);
> ```

### 7.3 Header inspection

```typescript
const headers = response.headers(); // { 'content-type': '...', ... }
const allValues = response.headersArray(); // [{name, value}, ...] — preserves duplicates

// Common assertions
expect(response.headers()["content-type"]).toContain("application/json");
expect(response.headers()["cache-control"]).toBe("no-store");
expect(response.headers()["x-correlation-id"]).toBe(correlationId);
```

### 7.4 Redirect handling

Default behaviour: follow up to 20 redirects. To inspect redirects:

```typescript
const response = await request.get("/api/v1/users", {
  maxRedirects: 0, // don't follow
});
expect(response.status()).toBe(301);
expect(response.headers()["location"]).toBe("/api/v2/users");
```

To capture the redirect chain (Playwright doesn't expose redirect history on `APIResponse`; use `page.route` interception for that).

### 7.5 Error body inspection

```typescript
const response = await request.post("/api/citations", { data: invalidPayload });
if (!response.ok()) {
  const errorBody = (await response.json()) as {
    error: string;
    details: string[];
  };
  console.error(`API rejected: ${errorBody.error}`, errorBody.details);
  expect(errorBody.error).toBe("VALIDATION_ERROR");
}
```

### 7.6 Always dispose

`APIResponse` should be disposed when you're done with it, especially for binary bodies. Playwright auto-disposes at test end, but explicit disposal frees memory sooner:

```typescript
const response = await request.get("/large-file");
const buf = await response.body();
await response.dispose(); // release stream resources
```

For test code this is rarely necessary; for utilities that loop over many responses, it matters.

---

## 8. Headers — factory pattern

Hardcoding headers in test bodies leads to drift. Use static factories.

### 8.1 The factory class

```typescript
// constants/headers.crm.ts
export class HeadersCrm {
  static auth(token: string, testId?: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      "x-test-run": "true",
      "x-correlation-id": testId ?? randomUUID(),
      Accept: "application/json",
    };
  }

  static jsonContent(token: string): Record<string, string> {
    return {
      ...HeadersCrm.auth(token),
      "Content-Type": "application/json",
    };
  }

  static formContent(token: string): Record<string, string> {
    return {
      ...HeadersCrm.auth(token),
      "Content-Type": "application/x-www-form-urlencoded",
    };
  }

  static withTenant(token: string, tenantId: string): Record<string, string> {
    return {
      ...HeadersCrm.auth(token),
      "x-tenant-id": tenantId,
    };
  }
}
```

### 8.2 Usage in tests

```typescript
await request.post("/citations", {
  headers: HeadersCrm.jsonContent(token),
  data: payload,
});

await request.get("/admin/users", {
  headers: HeadersCrm.withTenant(token, "tenant-acme"),
});
```

### 8.3 Why this matters at scale

When the API team adds a required `x-api-version` header, you update ONE file. Without factories, you grep 200 test files for the missing header and update each one.

---

## 9. Endpoints — function factories

Same idea for URLs. Never inline string-templating in tests.

### 9.1 The factory module

```typescript
// constants/endpoints.ts
const API = process.env.API_BASE_URL ?? "https://api.example.com";

export const Endpoints = {
  citations: {
    list: () => `${API}/v1/citations`,
    getById: (id: string) => `${API}/v1/citations/${id}`,
    create: () => `${API}/v1/citations`,
    update: (id: string) => `${API}/v1/citations/${id}`,
    delete: (id: string) => `${API}/v1/citations/${id}`,
    pay: (id: string) => `${API}/v1/citations/${id}/payments`,
    waveFee: (id: string) => `${API}/v1/citations/${id}/fee-waiver`,
  },
  customers: {
    list: () => `${API}/v1/customers`,
    getById: (id: string) => `${API}/v1/customers/${id}`,
    create: () => `${API}/v1/customers`,
  },
  auth: {
    token: () => `${API}/oauth/token`,
    refresh: () => `${API}/oauth/refresh`,
    revoke: () => `${API}/oauth/revoke`,
  },
} as const;
```

### 9.2 Usage

```typescript
await request.get(Endpoints.citations.getById("CIT-001"));
await request.post(Endpoints.citations.pay("CIT-001"), {
  data: { amount: 150 },
});
```

### 9.3 Why functions, not constants

A constant has no parameters: `Endpoints.CITATION_GET = '/v1/citations/{id}'` requires manual templating in every call. Functions provide:

- Parameter naming (`id` is explicit).
- Encoding (you can `encodeURIComponent` in one place).
- Composition (`Endpoints.payments.byCustomer(customerId)` calls into `Endpoints.customers`).
- Type safety (TypeScript narrows `id: string`).

### 9.4 Path encoding

```typescript
getById: (id: string) => `${API}/v1/citations/${encodeURIComponent(id)}`,
```

For IDs that might contain special characters (e.g., GUIDs with `/`, or RFC 4122 UUIDs). Always encode.

---

## 10. Payloads — override factory pattern

Test data builders that compose defaults with overrides.

### 10.1 The pattern

```typescript
// constants/payloads.citation.ts
export class PayloadsCitation {
  static pending(
    overrides: Partial<CitationCreatePayload> = {},
  ): CitationCreatePayload {
    return {
      type: "PARKING",
      status: "PENDING",
      amount: 150,
      currency: "USD",
      customerId: "cust-default",
      issuedAt: new Date().toISOString(),
      testFlag: true, // marks as test data
      ...overrides, // caller fields win
    };
  }

  static paid(
    overrides: Partial<CitationCreatePayload> = {},
  ): CitationCreatePayload {
    return PayloadsCitation.pending({
      status: "PAID",
      paidAt: new Date().toISOString(),
      ...overrides,
    });
  }

  static disputed(
    overrides: Partial<CitationCreatePayload> = {},
  ): CitationCreatePayload {
    return PayloadsCitation.pending({
      status: "DISPUTED",
      disputeReason: "Test dispute",
      ...overrides,
    });
  }
}
```

### 10.2 Usage

```typescript
// Default — all fields populated
const default_ = PayloadsCitation.pending();

// Override one field
const custom = PayloadsCitation.pending({
  amount: 9999,
  customerId: "cust-vip",
});

// Stack overrides
const myPaid = PayloadsCitation.paid({ amount: 250, paymentMethod: "CARD" });

await request.post(Endpoints.citations.create(), {
  headers: HeadersCrm.jsonContent(token),
  data: PayloadsCitation.pending({ customerId: account.userId }),
});
```

### 10.3 Why factories over fixtures files

| Approach                                 | Pros                           | Cons                                        |
| ---------------------------------------- | ------------------------------ | ------------------------------------------- |
| JSON fixtures (`citation-pending.json`)  | Stable, version-controlled     | Static; can't compose; verbose for variants |
| Factories (`PayloadsCitation.pending()`) | Dynamic, composable, type-safe | Code, not data                              |
| Faker.js + factories                     | Random, realistic              | Non-deterministic — flakiness vector        |

The factory pattern hits the sweet spot for most enterprise teams.

### 10.4 Faker integration

```typescript
import { faker } from '@faker-js/faker';

static withRandomCustomer(): CitationCreatePayload {
  return PayloadsCitation.pending({
    customerId: faker.string.uuid(),
    customerName: faker.person.fullName(),
    customerEmail: faker.internet.email(),
  });
}
```

For tests that should NOT collide on data (e.g., parallel customer creation), random suffixes prevent unique-key violations. Seed `faker` with `testInfo.testId` for reproducibility:

```typescript
faker.seed(testInfo.testId.charCodeAt(0)); // deterministic per test
```

---

## 11. The `APIUtils` wrapper

A thin wrapper over `APIRequestContext` that adds logging, timing, and assertion.

### 11.1 The implementation (excerpt)

```typescript
// utilities/api/APIUtils.ts
import {
  type APIRequestContext,
  type APIResponse,
  expect,
} from "@playwright/test";

export class APIUtils {
  constructor(private readonly request: APIRequestContext) {}

  async get(
    endpoint: string,
    headers: Record<string, string>,
    expectedStatus = 200,
  ): Promise<APIResponse> {
    const start = Date.now();
    const response = await this.request.get(endpoint, { headers });
    this.log("GET", endpoint, response.status(), Date.now() - start);
    expect(
      response.status(),
      `GET ${endpoint} expected ${expectedStatus}, got ${response.status()}`,
    ).toBe(expectedStatus);
    return response;
  }

  async post<T>(
    endpoint: string,
    headers: Record<string, string>,
    payload: T,
    expectedStatus = 201,
  ): Promise<APIResponse> {
    const start = Date.now();
    const response = await this.request.post(endpoint, {
      headers,
      data: payload,
    });
    this.log("POST", endpoint, response.status(), Date.now() - start);
    expect(response.status()).toBe(expectedStatus);
    return response;
  }

  // ... PUT, PATCH, DELETE follow the same pattern

  private log(
    method: string,
    endpoint: string,
    status: number,
    ms: number,
  ): void {
    if (process.env.LOG_API_STEPS === "true") {
      console.log(`[${method}] ${endpoint}`);
      console.log(`  Status: ${status}`);
      console.log(`  Time:   ${ms}ms`);
    }
  }
}
```

### 11.2 Why wrap

| Benefit                                         | Detail                                 |
| ----------------------------------------------- | -------------------------------------- |
| Default status assertion                        | One line per call instead of two       |
| Timing for performance budgets                  | Catch slow APIs before they break SLOs |
| Conditional logging                             | Off in CI; on locally for debugging    |
| Annotation for trace viewer                     | Steps appear in HTML report            |
| Single place to add retries, headers, telemetry | Cross-cutting concerns isolated        |

### 11.3 Composition over inheritance

```typescript
// ❌ Don't inherit
class MyClient extends APIUtils {
  /* ... */
}

// ✅ Compose
class MyClient {
  constructor(
    private readonly api: APIUtils,
    private readonly token: string,
  ) {}
  async list() {
    return this.api.get(Endpoints.list(), HeadersCrm.auth(this.token));
  }
}
```

Inheritance ties you to APIUtils's surface. Composition lets you swap implementations (real, mock, recording).

---

## 12. Typed domain clients

The next layer up. Tests speak the business domain, not HTTP.

### 12.1 The implementation

```typescript
// clients/CitationsClient.ts
import { type APIRequestContext, expect } from "@playwright/test";
import { HeadersCrm } from "../constants/headers.crm";
import { Endpoints } from "../constants/endpoints";

export interface Citation {
  id: string;
  status: "PENDING" | "PAID" | "DISPUTED" | "DELETED";
  amount: number;
  customerId: string;
  issuedAt: string;
}

export interface CreateCitationPayload {
  status: "PENDING" | "DISPUTED";
  amount: number;
  customerId: string;
  testFlag?: boolean;
}

export class CitationsClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly token: string,
  ) {}

  async create(payload: CreateCitationPayload): Promise<Citation> {
    const response = await this.request.post(Endpoints.citations.create(), {
      headers: HeadersCrm.jsonContent(this.token),
      data: payload,
    });
    expect(response.status()).toBe(201);
    return response.json();
  }

  async getById(id: string): Promise<Citation> {
    const response = await this.request.get(Endpoints.citations.getById(id), {
      headers: HeadersCrm.auth(this.token),
    });
    expect(response.status()).toBe(200);
    return response.json();
  }

  async pay(id: string, amount: number): Promise<Citation> {
    const response = await this.request.post(Endpoints.citations.pay(id), {
      headers: HeadersCrm.jsonContent(this.token),
      data: { amount },
    });
    expect(response.status()).toBe(200);
    return response.json();
  }

  async waitForStatus(
    id: string,
    expected: Citation["status"],
    timeoutMs = 120_000,
  ): Promise<Citation> {
    return (await expect
      .poll(async () => (await this.getById(id)).status, {
        timeout: timeoutMs,
        intervals: [500, 1000, 2000, 5000],
      })
      .toBe(expected)) as unknown as Citation; // poll resolves when condition met
  }
}
```

### 12.2 Tests speak business

```typescript
test("citation lifecycle", async ({ request, oauthToken }) => {
  const citations = new CitationsClient(request, oauthToken);

  const citation = await citations.create({
    status: "PENDING",
    amount: 150,
    customerId: "cust-001",
  });
  expect(citation.status).toBe("PENDING");

  const paid = await citations.pay(citation.id, 150);
  expect(paid.status).toBe("PAID");

  await citations.waitForStatus(citation.id, "PAID");
});
```

No URLs, no headers, no JSON parsing in the test body. Pure business logic.

### 12.3 Client construction as a fixture

```typescript
const test = base.extend<{ citations: CitationsClient }>({
  citations: async ({ request, oauthToken }, use) => {
    await use(new CitationsClient(request, oauthToken));
  },
});

test("uses citations client", async ({ citations }) => {
  const c = await citations.create({
    /* ... */
  });
});
```

---

## 13. Schema validation with Zod

Catch API contract drift before it cascades into mysterious test failures.

### 13.1 Define the schema

```typescript
import { z } from "zod";

export const CitationStatus = z.enum([
  "PENDING",
  "PAID",
  "DISPUTED",
  "DELETED",
]);

export const CitationSchema = z.object({
  id: z.string(),
  status: CitationStatus,
  amount: z.number().positive(),
  currency: z.string().length(3), // ISO 4217
  customerId: z.string(),
  customerName: z.string().optional(),
  issuedAt: z.string().datetime(), // ISO 8601
  paidAt: z.string().datetime().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

export type Citation = z.infer<typeof CitationSchema>;
```

### 13.2 Validate on every response

```typescript
async getById(id: string): Promise<Citation> {
  const response = await this.request.get(Endpoints.citations.getById(id), {
    headers: HeadersCrm.auth(this.token),
  });
  expect(response.status()).toBe(200);

  const raw = await response.json();
  const parsed = CitationSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Schema validation failed for GET /citations/${id}: ${JSON.stringify(parsed.error.format(), null, 2)}\n` +
      `Raw response: ${JSON.stringify(raw, null, 2)}`,
    );
  }
  return parsed.data;
}
```

### 13.3 Why this matters

Without schema validation, an API change that drops a field still passes type-checks (TypeScript trusts the cast). Tests fail later in obscure ways (`Cannot read properties of undefined`). With schema validation, the failure happens at the request boundary with a clear message:

```
Schema validation failed for GET /citations/CIT-001:
{
  "amount": { "_errors": ["Required"] }
}
```

You immediately know the API dropped `amount`. Fix the API contract or update the schema.

### 13.4 The `parseResponse` helper

```typescript
function parseResponse<T>(
  schema: z.ZodSchema<T>,
  raw: unknown,
  context: string,
): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new SchemaValidationError(
      `Schema validation failed at ${context}`,
      result.error,
      raw,
    );
  }
  return result.data;
}

class SchemaValidationError extends Error {
  constructor(
    message: string,
    public readonly zodError: z.ZodError,
    public readonly raw: unknown,
  ) {
    super(message);
  }
}
```

Catch `SchemaValidationError` separately to distinguish API contract issues from test logic bugs.

---

## 14. The 5-layer enterprise API library

Real-world architecture stacks these layers:

```
┌─────────────────────────────────────┐
│ 5. Test body                        │  ← business actions; no HTTP
├─────────────────────────────────────┤
│ 4. Domain clients (CitationsClient) │  ← typed methods; Zod validation
├─────────────────────────────────────┤
│ 3. Header / Endpoint / Payload      │  ← static factories
│    factories                        │
├─────────────────────────────────────┤
│ 2. APIUtils wrapper                 │  ← logging, timing, status check
├─────────────────────────────────────┤
│ 1. APIRequestContext (Playwright)   │  ← raw HTTP
└─────────────────────────────────────┘
```

### 14.1 Why 5 layers

Each layer has one job. The trade-off: more files, but each is small and stable. Refactoring becomes localised — change the auth header in `HeadersCrm`, every client picks it up automatically.

### 14.2 Where retries live

Retries can live at any layer:

| Layer           | When                                                                           |
| --------------- | ------------------------------------------------------------------------------ |
| Domain client   | For idempotent operations only (GET, DELETE) — retry the whole business action |
| APIUtils        | For network errors only — retry the HTTP call                                  |
| HTTP middleware | For 429 rate limits with backoff                                               |

The framework convention: domain client owns retries because it knows what's idempotent. APIUtils retries only on connection errors.

```typescript
async getById(id: string): Promise<Citation> {
  return retry(async () => {
    const response = await this.request.get(...);
    if (response.status() === 429) {
      const retryAfter = parseInt(response.headers()['retry-after'] ?? '5');
      throw new RateLimitError(retryAfter);
    }
    if (!response.ok()) throw new ApiError(response.status(), await response.text());
    return parseResponse(CitationSchema, await response.json(), 'getById');
  }, {
    retries: 3,
    onRetry: (err, n) => console.log(`Retry ${n}: ${err.message}`),
  });
}
```

### 14.3 Where errors are typed

Custom error classes per operation:

```typescript
class CitationAlreadyPaidError extends Error {
  constructor(public readonly id: string) {
    super(`Citation ${id} is already paid`);
  }
}

async pay(id: string, amount: number): Promise<Citation> {
  const response = await this.request.post(Endpoints.citations.pay(id), { /* ... */ });
  if (response.status() === 409) throw new CitationAlreadyPaidError(id);
  if (!response.ok()) throw new ApiError(response.status());
  return response.json();
}
```

Tests catch specific errors:

```typescript
try {
  await citations.pay(alreadyPaidId, 100);
} catch (e) {
  if (e instanceof CitationAlreadyPaidError) {
    // Expected — test this path
  } else throw e;
}
```

---

## 15. Authentication strategies

### 15.1 Bearer token (most common)

```typescript
await request.get("/api/me", {
  headers: { Authorization: `Bearer ${token}` },
});
```

Token typically from OAuth fixture — see [`./05_auth.md`](./05_auth.md).

### 15.2 HTTP Basic

```typescript
// Per-call
await request.get('/api/admin', {
  headers: { Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}` },
});

// Per-config
use: {
  httpCredentials: { username: 'user', password: 'pass' },
}
```

### 15.3 API key in header

```typescript
await request.get("/api/data", {
  headers: { "x-api-key": process.env.API_KEY! },
});
```

### 15.4 API key in query param

```typescript
await request.get("/api/data", {
  params: { api_key: process.env.API_KEY! },
});
```

> URL parameters appear in logs, CDN caches, and browser history. Never use this for production-grade API keys.

### 15.5 Session cookie (from browser)

```typescript
// UI login first
await loginViaUi(page);

// API calls inherit session
const response = await page.request.get("/api/me");
```

### 15.6 mTLS (client cert)

Configured in `playwright.config.ts` — see [`./05_auth.md#16-mtls`](./05_auth.md#16-mtls).

---

## 16. Retries and timeouts

### 16.1 Per-call timeout

```typescript
await request.get("/api/slow", { timeout: 60_000 });
```

Default is 30s. For slow endpoints, increase per-call (don't change the global default).

### 16.2 maxRedirects

```typescript
await request.get("/api/maybe-redirected", { maxRedirects: 5 });
// Default: 20
// 0 = don't follow redirects
```

### 16.3 maxRetries (built-in since v1.49)

```typescript
await request.get("/api/flaky", { maxRetries: 3 });
```

Retries on network errors (`ECONNRESET`, `ETIMEDOUT`, etc.). Does NOT retry on HTTP errors (5xx, 429). For that, use domain client logic.

### 16.4 Manual retry with backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  max: number = 3,
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < max; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e as Error;
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
```

### 16.5 Conditional retry — only on 429

```typescript
async function with429Retry<T>(
  fn: () => Promise<APIResponse>,
): Promise<APIResponse> {
  for (let i = 0; i < 5; i++) {
    const response = await fn();
    if (response.status() !== 429) return response;
    const retryAfter = parseInt(response.headers()["retry-after"] ?? "5");
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
  }
  throw new Error("Exceeded 429 retry limit");
}
```

---

## 17. HAR recording and inspection

HTTP Archive (HAR) is a JSON format that captures all HTTP traffic. Useful for debugging and replay.

### 17.1 Recording

```typescript
use: {
  recordHar: { path: 'test-results/network.har', mode: 'minimal' },
}
```

Modes:

- `'minimal'` — request/response headers, no bodies
- `'full'` — everything including request and response bodies
- `false` (default) — no recording

### 17.2 Per-test recording

```typescript
const context = await browser.newContext({
  recordHar: { path: `test-results/${testInfo.title}.har` },
});
```

### 17.3 Inspecting a HAR

```bash
# View as JSON
cat test-results/network.har | jq '.log.entries[0]'

# Visual viewer
npx har-viewer test-results/network.har
```

The HAR file can be replayed by `routeFromHAR`:

```typescript
await page.routeFromHAR("test-results/network.har", { update: false });
// Now navigations match recorded entries — no real network calls
```

Useful for offline testing or mocking with realistic traffic.

---

## 18. Performance considerations

### 18.1 Connection reuse

`APIRequestContext` uses HTTP keep-alive by default. Sequential requests to the same host reuse the TCP connection.

For 100 requests to the same API:

- Without keep-alive: ~30s (50ms TLS handshake × 100 + transit)
- With keep-alive: ~5s (single handshake + transit)

This is automatic. Don't disable keep-alive unless you have a specific reason.

### 18.2 Parallel requests

```typescript
// Sequential — 5s total
const a = await request.get("/a");
const b = await request.get("/b");
const c = await request.get("/c");

// Parallel — 1.5s total
const [a, b, c] = await Promise.all([
  request.get("/a"),
  request.get("/b"),
  request.get("/c"),
]);
```

Limited by the connection pool (default 6 per host). For >6 parallel requests, some queue.

### 18.3 Response body memory

`response.body()` loads the entire response into memory. For large responses (>100 MB), the worker may OOM.

Workarounds:

- Use `request.fetch` with streaming.
- Test only the response headers + status; don't read the body.
- Save to disk and inspect a sample:

```typescript
const fs = require("fs");
const buf = await response.body();
fs.writeFileSync("/tmp/response.bin", buf);
console.log(`Size: ${buf.length}`);
console.log(`First 100 bytes: ${buf.slice(0, 100).toString("hex")}`);
```

### 18.4 Worker-scoped request contexts

If many tests need the same authenticated context, use a worker-scoped fixture (see [`./04_fixtures.md`](./04_fixtures.md)). One auth setup per worker instead of per test.

---

## 19. API ↔ UI cross-validation patterns

The killer pattern Playwright enables: a UI action plus an API verification, in the same test.

### 19.1 The success theatre anti-pattern

```typescript
// ❌ Success theatre
test("citation can be paid", async ({ page }) => {
  await page.goto("/citations/CIT-001");
  await page.getByRole("button", { name: "Pay" }).click();
  await expect(page.getByText("Payment successful")).toBeVisible();
  // Test passes — but did the citation actually get paid?
});
```

The UI says "successful" but maybe the API call returned 200 with no DB write. Race conditions, async processing, or buggy UI.

### 19.2 The fix — verify via API

```typescript
test("citation is paid in backend", async ({ page, citations }) => {
  await page.goto("/citations/CIT-001");
  await page.getByRole("button", { name: "Pay" }).click();
  await expect(page.getByText("Payment successful")).toBeVisible();

  // Cross-check via API
  await citations.waitForStatus("CIT-001", "PAID", 30_000);
  const citation = await citations.getById("CIT-001");
  expect(citation.paidAt).toBeDefined();
});
```

### 19.3 API setup, UI assertion

```typescript
test("newly-created citation appears in dashboard", async ({
  page,
  citations,
}) => {
  // Setup via API — fast (200ms instead of 30s of UI)
  const c = await citations.create(
    PayloadsCitation.pending({ amount: 999.99 }),
  );

  // Test the UI behaviour
  await page.goto("/dashboard");
  await expect(page.getByText(c.id)).toBeVisible();
  await expect(page.getByText("$999.99")).toBeVisible();
});
```

### 19.4 UI mutation, API verification (DB-level)

```typescript
test("editing customer name persists", async ({ page, customers, db }) => {
  await page.goto("/customers/CUST-001");
  await page.getByLabel("Name").fill("New Name");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved")).toBeVisible();

  // Verify at the API layer
  const apiCustomer = await customers.getById("CUST-001");
  expect(apiCustomer.name).toBe("New Name");

  // Verify at the DB layer (the ground truth)
  const dbRow = await db.query("SELECT name FROM customers WHERE id = $1", [
    "CUST-001",
  ]);
  expect(dbRow[0].name).toBe("New Name");
});
```

Three layers of verification: UI, API, DB. Catches bugs at every abstraction.

---

## 20. Common production failures

### Failure 1 — Test passes but API actually returned 500

**Symptom:** UI shows success but the API call failed silently. Tests pass.

**Cause:** Status check was assumed but not asserted. `response.json()` was called on a 500 response and returned an error object that didn't throw.

**Fix:** Use `APIUtils` which asserts status by default. Never skip the status check.

### Failure 2 — Token from worker fixture is undefined in API call

**Symptom:** All tests get 401 in CI; locally fine.

**Cause:** Worker fixture for the token errored silently; `process.env` reference was wrong.

**Fix:** Add fail-fast logging in the fixture. Validate `token.length > 0` before yielding.

### Failure 3 — Schema validation fails after API deploy

**Symptom:** Tests start failing en masse with `SchemaValidationError`.

**Cause:** API deployed a new version that dropped a deprecated field.

**Fix:** Update the schema. Coordinate with the API team for breaking changes.

### Failure 4 — Test data orphans accumulate in staging DB

**Symptom:** Staging DB has 50,000 test citations; queries are slow.

**Cause:** Test fixture creates records but cleanup fixture silently fails.

**Fix:** Cleanup fixture must log failures. Add a nightly sweep for `testFlag=true` records older than 1 day.

### Failure 5 — `POST /citations` returns 201 with empty body

**Symptom:** `await response.json()` throws `SyntaxError: Unexpected end of JSON input`.

**Cause:** API returns 201 No Content with empty body (some legacy APIs).

**Fix:** Check `response.headers()['content-length']` before parsing. Or use `text()` and `JSON.parse` conditionally:

```typescript
const text = await response.text();
const body = text ? JSON.parse(text) : null;
```

### Failure 6 — Cookies set by API call not in `page.request`

**Symptom:** `await page.request.post('/login')` sets a cookie, but subsequent `page.goto('/dashboard')` is redirected to login.

**Cause:** `request` cookies and `page` cookies are separate in older Playwright (<1.40). Newer versions share.

**Fix:** Either upgrade to v1.40+, or do the login via `page.goto` instead.

### Failure 7 — 429 rate limit from OAuth IdP

**Symptom:** Tests start failing with 429 from `/oauth/token`.

**Cause:** Each worker fetches a token; CI has 8 workers; IdP rate-limits at 5 RPS.

**Fix:** Cross-worker file-cached token (see [`./05_auth.md#194-cross-worker-caching-file-based`](./05_auth.md#194-cross-worker-caching-file-based)).

### Failure 8 — Multipart upload corrupted at server

**Symptom:** Server receives the upload but rejects it as "invalid PDF."

**Cause:** Filename had non-ASCII characters; Playwright UTF-8-encoded the filename header without proper RFC 5987 escaping; server parses with strict ASCII.

**Fix:** Use ASCII-safe filenames in tests. Or specify the encoding header explicitly.

### Failure 9 — Test data race in parallel

**Symptom:** Two tests both creating customer "test-customer-001" both succeed in 1 worker but one fails in 4 workers.

**Cause:** Hardcoded ID. Parallel workers create the same ID and the second hits a uniqueness constraint.

**Fix:** Use UUIDs or timestamp-suffixed IDs. See [`./12_data.md`](./12_data.md).

### Failure 10 — Auth header in URL appears in logs

**Symptom:** CI logs show bearer tokens.

**Cause:** Logging the request URL was fine, but someone added `?token=...` to the URL for debugging.

**Fix:** Auth in `Authorization` header only. Audit logs for token-shaped strings.

---

## 21. Anti-pattern catalog

| ❌                                               | ✅                                                   |
| ------------------------------------------------ | ---------------------------------------------------- |
| Hardcoded URLs in test bodies                    | Endpoint factories                                   |
| Hardcoded headers everywhere                     | Header factories                                     |
| Hardcoded payloads                               | Payload factories with overrides                     |
| `response.json()` without status check           | `APIUtils` or explicit `expect(response.ok())`       |
| Casting response to typed shape (no validation)  | Zod schema validation                                |
| Calling `body()` twice on the same response      | Read once, parse multiple times                      |
| API setup via UI (30s) for tests that test UI    | API setup (200ms) + UI assertion                     |
| Manual `Promise.all` for sequential operations   | Sequential `await` chain                             |
| Inline string-template URLs                      | Endpoint factory functions                           |
| Catching all errors in API client                | Type-specific errors; rethrow unknown                |
| Token in URL query string                        | Token in `Authorization: Bearer` header              |
| `request.delete(...)` without expecting 204      | Assert specific success status                       |
| Polling with `for + waitForTimeout`              | `expect.poll`                                        |
| Fixture that creates data without cleanup        | Always pair create with delete in fixture teardown   |
| Schema definition in test file                   | Schemas in shared module, imported by clients        |
| Domain client with 50 methods                    | Split by resource (CitationsClient, CustomersClient) |
| `baseURL` hardcoded in client constructor        | Read from env config                                 |
| Worker token shared between read and write tests | Separate tokens by intended use                      |

---

## Cross-references

- Auth fixtures: [`./05_auth.md`](./05_auth.md)
- Mocking (page.route): [`./13_mocking.md`](./13_mocking.md)
- Test data lifecycle: [`./12_data.md`](./12_data.md)
- Real implementations: [`../framework/utilities/api/APIUtils.ts`](../framework/utilities/api/APIUtils.ts)
- 5-layer architecture deep dive: [`Ch44 Enterprise API Client Library`](../05_Advanced_Topics/44_Enterprise_API_Client_Library.md)
