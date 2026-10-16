# 44. Building an Enterprise API Client Library from Scratch

**Navigation**: [← Chapter 43: Real-World War Stories](../06_CI_CD_And_Reliability/43_Real_World_SDET_War_Stories.md) | [Index](../00_INDEX.md) | [→ Chapter 45: AI Agents, MCP & Playwright](../07_Specialised_Testing/45_AI_Agents_MCP_And_Playwright.md)

**Cross-links:**

- [`23_APIUtils_HTTP_Library.md`](./23_APIUtils_HTTP_Library.md) — The foundational APIUtils pattern this chapter builds on
- [`22_Headers_Payloads_Endpoints_Factory.md`](./22_Headers_Payloads_Endpoints_Factory.md) — The factory layer
- [`27_Advanced_TypeScript_for_SDETs.md`](./27_Advanced_TypeScript_for_SDETs.md) — Generics and conditional types used here

---

## 5W1H

- **WHAT**: A layered, typed, production-grade HTTP client library for test automation — from raw `APIRequestContext` to domain-specific, fully typed client methods with error handling, schema validation, retry logic, and request logging with header masking.
- **WHY**: Every time an SDET writes `await request.post('/api/...')` directly in a test file, they are: (a) duplicating auth header logic, (b) creating untypable response handling, (c) making the test brittle to URL changes, (d) hiding what the test is actually verifying. A proper library separates concerns and makes tests read like requirements.
- **WHO**: SDETs who have seen `request.get(...)` scattered across 50 test files and understand that it's technical debt, but haven't built the alternative yet.
- **WHEN**: The moment you write the same `Authorization: Bearer ${token}` header in a second test file.
- **HOW**: By building the library layer by layer — each layer solving a specific problem.

---

## 1. The Architecture — 5 Layers

```mermaid
graph TD
    A[Layer 5: Domain Clients<br>CitationsClient, PaymentsClient] -->|Throws Domain Errors| B[Layer 4: Endpoint Registry<br>Endpoints.citations.pay]
    A --> C[Layer 3: Header Builder<br>HeadersBuilder]
    B --> D[Layer 2: HTTP Core<br>ApiCore]
    C --> D
    D -->|Throws ApiHttpError| E[Layer 1: Playwright APIRequestContext<br>request.post]
```

```
Layer 5: Domain Clients
  CitationsClient, UsersClient, PaymentsClient, NotificationsClient
  → Business-language methods: citationsClient.pay(id, amount)
  → Throws typed domain errors: PaymentAlreadyProcessedError
  → Returns typed domain objects: Citation, Payment, Notification

Layer 4: Endpoint Registry
  Endpoints.citations.pay(id)  →  '/api/v2/citations/{id}/payments'
  → Function-based (not string constants) for type safety
  → Parameterized: no string concatenation in tests

Layer 3: Header Builder
  HeadersBuilder.new().withBearer(token).withCorrelationId(testId).build()
  → Fluent and composable; build() returns a fresh copy
  → Header names normalised to lower case (HTTP header names are case-insensitive),
    which is what lets ApiCore mask them reliably in logs

Layer 2: HTTP Core (ApiCore)
  apiCore.post<Citation>(url, body, headers)
  → Generic type parameter for response body
  → Normalized error handling (all errors same shape)
  → Automatic JSON serialization
  → Request/response logging with timing

Layer 1: Playwright APIRequestContext
  request.post(url, { data, headers })
  → The actual HTTP engine provided by Playwright
  → Fixture-injected — no global state
```

**Why this layer separation?**

```
Problem: You change the API path from /api/v1/citations to /api/v2/citations
With no library:    Update 50 test files manually
With Layer 4:       Update Endpoints.citations.list() once → all tests get the fix

Problem: Your API adds a required header x-tenant-id
With no library:    Update every test that calls the API
With Layer 3:       Update HeadersBuilder.withTenantId() once → all clients use it

Problem: You need to add retry logic for 503 responses
With no library:    Add retry to every API call in every test
With Layer 2:       Add retry middleware to ApiCore → all calls retry automatically

Problem: You need to trace every API call in CI for debugging
With no library:    Wrap every test.step manually
With ApiCore:       Turn on logRequests in one place → every call is logged (secrets masked)
```

---

## 2. Layer 1 — Understanding Playwright's APIRequestContext

Before building abstractions, understand what you're wrapping.

```typescript
// What Playwright's APIRequestContext provides:
import { type APIRequestContext } from "@playwright/test";

// In a fixture:
async ({ request }, use) => {
  // request IS the APIRequestContext — a fetch-like HTTP client
  // It manages cookies, sessions, and headers per context

  const response = await request.get("https://api.example.com/data");
  // Returns: APIResponse (not a fetch Response)

  const status: number = response.status();
  const headers: Record<string, string> = response.headers();
  const body: Buffer = await response.body();
  const text: string = await response.text();
  const json: unknown = await response.json(); // json() is Promise<any>; `unknown` is YOUR annotation
  const ok: boolean = response.ok(); // status 200-299

  // URL and request info:
  const url: string = response.url();
};

// Key differences from fetch():
// 1. response.json() is declared `Promise<Serializable>` and `Serializable` is an
//    alias for `any` (playwright-core/types/structs.d.ts) — NOTHING forces you to
//    type it. Annotating `unknown` yourself, or validating (§7), is the discipline.
// 2. response.headers() returns all headers as a plain object (lowercase keys)
// 3. Playwright handles cookie jar automatically (within the same context)
// 4. Supports: get, post, put, patch, delete, head, fetch
// 5. Global request: doesn't share cookies with page (use page.request for that)
```

Three behaviours of `APIRequestContext` the rest of this chapter depends on (each measured against a local `node:http` server on Playwright 1.60):

| You pass | What goes over the wire | Consequence |
| --- | --- | --- |
| `data: { a: 1 }` (an object) | the **JSON string** `{"a":1}` — even if you also set `Content-Type: application/x-www-form-urlencoded` (the server saw the form content-type on a JSON body) | For an OAuth token call use the `form: { grant_type: "password", ... }` option, which produces `grant_type=password&...`. Object `data` is always JSON |
| `data: "<string>"` or a `Buffer` | exactly those bytes | The way to sign or hash a body: serialise once, sign that string, send that string. [Lab 04 — Webhook Receiver](../labs/04-webhook-receiver/README.md) is a pure API-testing lab built on this (an object `data` re-serialises and breaks the HMAC) |
| a `204`, a `HEAD`, or an empty `200` that still says `Content-Type: application/json` | zero body bytes | `response.json()` throws `SyntaxError: Unexpected end of JSON input` — the status is lost behind a parse error. `ApiCore` (§3) reads the bytes first and only parses non-empty bodies |

---

## 3. Layer 2 — The HTTP Core

```typescript
// lib/core/ApiCore.ts

import type { APIRequestContext, APIResponse } from "@playwright/test";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiCoreConfig {
  baseUrl: string;
  defaultTimeoutMs: number;
  logRequests: boolean;
  maskHeaders: string[]; // Headers whose values are masked in logs: ['Authorization', 'x-api-key']
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeoutMs?: number;
  // No body here — use post/put/patch methods which add the body
}

export interface ApiResponse<T> {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: T;
  url: string;
  durationMs: number;
}

export class ApiHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = "ApiHttpError";
  }
}

// ─── ApiCore ─────────────────────────────────────────────────────────────────

export class ApiCore {
  constructor(
    private readonly ctx: APIRequestContext,
    private readonly config: ApiCoreConfig,
  ) {}

  // ── Core generic request method ──────────────────────────────────────────

  async request<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD",
    path: string,
    options: RequestOptions & { body?: unknown } = {},
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, options.params);
    const headers = options.headers ?? {};
    const start = Date.now();

    if (this.config.logRequests) {
      this.logRequest(method, url, headers, options.body);
    }

    let raw: APIResponse;
    try {
      raw = await this.ctx.fetch(url, {
        method,
        headers,
        data: options.body !== undefined ? options.body : undefined,
        timeout: options.timeoutMs ?? this.config.defaultTimeoutMs,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ApiHttpError(0, url, null, `Network error: ${msg}`);
    }

    const durationMs = Date.now() - start;
    const responseHeaders = raw.headers();

    // Read the bytes ONCE, then decide how to interpret them. Calling raw.json()
    // directly throws "Unexpected end of JSON input" on a 204 / empty body and
    // hides the status code behind a SyntaxError.
    const bytes = await raw.body();
    const contentType = responseHeaders["content-type"] ?? "";

    let body: T;
    if (bytes.length === 0) {
      body = undefined as T; // 204, HEAD, empty 200
    } else if (contentType.includes("json")) {
      // "json" (not "application/json") also matches application/problem+json (RFC 9457)
      const text = bytes.toString("utf8");
      try {
        body = JSON.parse(text) as T;
      } catch {
        // A gateway that labels an HTML error page as JSON: keep the text so the
        // caller still sees the status code, not a SyntaxError.
        body = text as unknown as T;
      }
    } else if (contentType.includes("text/")) {
      body = bytes.toString("utf8") as unknown as T;
    } else {
      body = bytes as unknown as T;
    }

    if (this.config.logRequests) {
      this.logResponse(raw.status(), url, durationMs, body);
    }

    return {
      status: raw.status(),
      ok: raw.ok(),
      headers: responseHeaders,
      body,
      url,
      durationMs,
    };
  }

  // ── Convenience methods ───────────────────────────────────────────────────

  get<T>(path: string, opts?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path, opts);
  }

  post<T>(
    path: string,
    body: unknown,
    opts?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, { ...opts, body });
  }

  put<T>(
    path: string,
    body: unknown,
    opts?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", path, { ...opts, body });
  }

  patch<T>(
    path: string,
    body: unknown,
    opts?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", path, { ...opts, body });
  }

  delete<T = void>(
    path: string,
    opts?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path, opts);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean>,
  ): string {
    const base = this.config.baseUrl.replace(/\/$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${base}${normalizedPath}`;

    if (!params || Object.keys(params).length === 0) return url;

    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    );
    return `${url}?${qs.toString()}`;
  }

  private logRequest(
    method: string,
    url: string,
    headers: Record<string, string>,
    body: unknown,
  ): void {
    const maskedHeaders = this.maskSensitiveHeaders(headers);
    const bodyStr = body
      ? `\n  Body: ${JSON.stringify(body).substring(0, 200)}`
      : "";
    console.log(
      `→ ${method} ${url}\n  Headers: ${JSON.stringify(maskedHeaders)}${bodyStr}`,
    );
  }

  private logResponse(
    status: number,
    url: string,
    durationMs: number,
    body: unknown,
  ): void {
    const bodyStr =
      typeof body === "object"
        ? JSON.stringify(body).substring(0, 200)
        : String(body);
    const icon = status < 400 ? "←" : "✗";
    console.log(
      `${icon} ${status} ${url} (${durationMs}ms)\n  Body: ${bodyStr}`,
    );
  }

  // Header names are case-insensitive (RFC 9110 §5.1), so compare lower-cased.
  // Looking up result["authorization"] on an object that holds "Authorization"
  // (what a naive builder produces) masks NOTHING and leaks the bearer token.
  private maskSensitiveHeaders(
    headers: Record<string, string>,
  ): Record<string, string> {
    const masked = new Set(this.config.maskHeaders.map((h) => h.toLowerCase()));
    return Object.fromEntries(
      Object.entries(headers).map(([name, value]) => [
        name,
        masked.has(name.toLowerCase()) ? "***MASKED***" : value,
      ]),
    );
  }
}
```

---

## 4. Layer 3 — The Header Builder

```typescript
// lib/headers/HeadersBuilder.ts

export class HeadersBuilder {
  private readonly _headers: Record<string, string> = {};

  private constructor() {}

  /** Start building a new headers object */
  static new(): HeadersBuilder {
    return new HeadersBuilder();
  }

  /**
   * Single write path. Header names are case-insensitive (RFC 9110 §5.1), so we
   * store them lower-cased: "Authorization" and "authorization" can never end up
   * as two entries, and ApiCore's log masking can match by lower-cased name.
   */
  private set(name: string, value: string): this {
    this._headers[name.toLowerCase()] = value;
    return this;
  }

  /** Add Bearer token authorization */
  withBearer(token: string): this {
    return this.set("Authorization", `Bearer ${token}`);
  }

  /** Add API key authentication */
  withApiKey(key: string, headerName = "x-api-key"): this {
    return this.set(headerName, key);
  }

  /**
   * Add content-type header. For multipart uploads do NOT set it by hand:
   * pass Playwright's `multipart` option instead, which adds the boundary.
   */
  withContentType(type = "application/json"): this {
    return this.set("Content-Type", type);
  }

  /** Add accept header */
  withAccept(type = "application/json"): this {
    return this.set("Accept", type);
  }

  /** Add correlation ID for request tracing */
  withCorrelationId(id: string): this {
    return this.set("x-correlation-id", id);
  }

  /** Mark request as coming from the test suite */
  withTestMetadata(testId: string, workerIndex: number): this {
    return this.set("x-test-id", testId)
      .set("x-test-worker", String(workerIndex))
      .set("x-test-client", "playwright-automation");
  }

  /** Add tenant ID for multi-tenant systems */
  withTenantId(tenantId: string): this {
    return this.set("x-tenant-id", tenantId);
  }

  /** Add arbitrary header */
  with(name: string, value: string): this {
    return this.set(name, value);
  }

  /** Merge another headers object (later values win, names normalised) */
  merge(additional: Record<string, string>): this {
    for (const [name, value] of Object.entries(additional)) this.set(name, value);
    return this;
  }

  /** Build and return the headers object (a copy — later builder calls don't change it) */
  build(): Record<string, string> {
    return { ...this._headers };
  }
}

// ─── Pre-configured header factories for your specific system ────────────────

export class HeadersCrm {
  /** Standard authenticated CRM API headers */
  static auth(accessToken: string, testId?: string): Record<string, string> {
    const builder = HeadersBuilder.new()
      .withBearer(accessToken)
      .withContentType()
      .withAccept()
      .withTenantId(process.env.CRM_TENANT_ID ?? "default");

    if (testId) {
      builder.withCorrelationId(`test-${testId}`);
    }

    return builder.build();
  }

  /** Unauthenticated headers for public endpoints */
  static public(): Record<string, string> {
    return HeadersBuilder.new().withContentType().withAccept().build();
  }

  /** File upload headers (no content-type — Playwright's `multipart` option sets it, with the boundary) */
  static fileUpload(accessToken: string): Record<string, string> {
    return HeadersBuilder.new().withBearer(accessToken).withAccept().build();
  }
}
```

---

## 5. Layer 4 — The Endpoint Registry

```typescript
// lib/endpoints/Endpoints.ts

// ─── Parameter types ──────────────────────────────────────────────────────────

export interface CitationSearchParams {
  customerId?: string;
  status?: "PENDING" | "PAID" | "OVERDUE" | "DISPUTED" | "CANCELLED";
  from?: string; // ISO date: '2026-01-01'
  to?: string;
  page?: number;
  limit?: number;
}

export interface UserSearchParams {
  email?: string;
  name?: string;
  role?: string;
  page?: number;
  limit?: number;
}

// ─── Endpoint registry ────────────────────────────────────────────────────────

export const Endpoints = {
  citations: {
    list: (params?: CitationSearchParams) =>
      buildUrl("/api/v2/citations", params),
    getById: (id: string) => `/api/v2/citations/${encodeURIComponent(id)}`,
    create: () => "/api/v2/citations",
    update: (id: string) => `/api/v2/citations/${encodeURIComponent(id)}`,
    updateStatus: (id: string) =>
      `/api/v2/citations/${encodeURIComponent(id)}/status`,
    delete: (id: string) => `/api/v2/citations/${encodeURIComponent(id)}`,
    payments: {
      create: (citationId: string) =>
        `/api/v2/citations/${encodeURIComponent(citationId)}/payments`,
      getById: (citationId: string, pid: string) =>
        `/api/v2/citations/${encodeURIComponent(citationId)}/payments/${encodeURIComponent(pid)}`,
      list: (citationId: string) =>
        `/api/v2/citations/${encodeURIComponent(citationId)}/payments`,
    },
    disputes: {
      create: (citationId: string) =>
        `/api/v2/citations/${encodeURIComponent(citationId)}/disputes`,
      getById: (citationId: string, did: string) =>
        `/api/v2/citations/${encodeURIComponent(citationId)}/disputes/${encodeURIComponent(did)}`,
    },
  },
  users: {
    list: (params?: UserSearchParams) => buildUrl("/api/v2/users", params),
    getById: (id: string) => `/api/v2/users/${encodeURIComponent(id)}`,
    create: () => "/api/v2/users",
    update: (id: string) => `/api/v2/users/${encodeURIComponent(id)}`,
    delete: (id: string) => `/api/v2/users/${encodeURIComponent(id)}`,
    roles: {
      list: (userId: string) =>
        `/api/v2/users/${encodeURIComponent(userId)}/roles`,
      assign: (userId: string) =>
        `/api/v2/users/${encodeURIComponent(userId)}/roles`,
    },
  },
  notifications: {
    getForUser: (userId: string) =>
      `/api/v2/notifications?userId=${encodeURIComponent(userId)}`,
    getById: (id: string) => `/api/v2/notifications/${encodeURIComponent(id)}`,
    markRead: (id: string) =>
      `/api/v2/notifications/${encodeURIComponent(id)}/read`,
  },
  reports: {
    generate: () => "/api/v2/reports",
    getById: (id: string) => `/api/v2/reports/${encodeURIComponent(id)}`,
    download: (id: string) =>
      `/api/v2/reports/${encodeURIComponent(id)}/download`,
  },
  health: () => "/api/health",
  version: () => "/api/version",
} as const;

// ─── URL builder utility ──────────────────────────────────────────────────────

// `params?: object`, not `Record<string, unknown>`: an *interface* such as
// CitationSearchParams has no implicit index signature, so it is not assignable
// to Record<string, unknown> (TS2345) — a type alias would be, an interface is not.
function buildUrl(base: string, params?: object): string {
  if (!params) return base;

  const validParams = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => [k, String(v)]);

  if (validParams.length === 0) return base;
  return `${base}?${new URLSearchParams(validParams).toString()}`;
}
```

---

## 6. Layer 5 — Domain Clients

### The Error Hierarchy First

```mermaid
graph TD
    Error[Error] --> ApiError
    Error --> SchemaValidationError[Zod parse failure: SchemaValidationError]

    ApiError --> NotFoundError[404: NotFoundError]
    ApiError --> ConflictError[409: ConflictError]
    ApiError --> RequestValidationError[422: RequestValidationError]
    ApiError --> RateLimitError[429: RateLimitError]
    ApiError --> ServerError[5xx: ServerError keeps the real status]

    NotFoundError --> CitationNotFoundError
    ConflictError --> CitationAlreadyPaidError
    RequestValidationError --> PaymentValidationError
```

```typescript
// lib/errors/ApiErrors.ts

export class ApiError extends Error {
  constructor(
    public readonly operation: string,
    public readonly status: number,
    public readonly url: string,
    public readonly body: unknown,
    message: string,
  ) {
    super(`[${operation}] HTTP ${status} at ${url}: ${message}`);
    this.name = "ApiError";
  }

  /** Format for structured logging */
  toJson(): Record<string, unknown> {
    return {
      name: this.name,
      operation: this.operation,
      status: this.status,
      url: this.url,
      body: this.body,
      message: this.message,
    };
  }
}

// ─── Generic, status-keyed errors: reusable by EVERY domain client ───────────
// (A 404 from /users must not become a "CitationNotFoundError".)

export class NotFoundError extends ApiError {
  constructor(operation: string, url: string, body: unknown = null, message = "Resource not found") {
    super(operation, 404, url, body, message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ApiError {
  constructor(operation: string, url: string, body: unknown = null, message = "Conflict") {
    super(operation, 409, url, body, message);
    this.name = "ConflictError";
  }
}

export class RequestValidationError extends ApiError {
  constructor(
    operation: string,
    url: string,
    public readonly validationErrors: string[],
  ) {
    super(
      operation,
      422,
      url,
      validationErrors,
      `Validation failed: ${validationErrors.join(", ")}`,
    );
    this.name = "RequestValidationError";
  }
}

export class RateLimitError extends ApiError {
  constructor(
    operation: string,
    url: string,
    public readonly retryAfterSeconds: number,
  ) {
    super(operation, 429, url, null, `Rate limited. Retry after ${retryAfterSeconds}s`);
    this.name = "RateLimitError";
  }
}

export class ServerError extends ApiError {
  // status is a parameter: a 502 or 503 must stay a 502 or 503 — retry policy,
  // dashboards and bug reports all key off the real code.
  constructor(operation: string, status: number, url: string, body: unknown) {
    super(operation, status, url, body, `Server error (${status})`);
    this.name = "ServerError";
  }
}

// ─── Domain-specific errors: subclasses that carry business meaning ──────────

export class CitationNotFoundError extends NotFoundError {
  constructor(id: string, url: string, operation = "citations.getById") {
    super(operation, url, null, `Citation '${id}' not found`);
    this.name = "CitationNotFoundError";
  }
}

export class CitationAlreadyPaidError extends ConflictError {
  constructor(id: string, url: string, body: unknown) {
    super("citations.pay", url, body, `Citation '${id}' has already been paid`);
    this.name = "CitationAlreadyPaidError";
  }
}

export class PaymentValidationError extends RequestValidationError {
  constructor(url: string, validationErrors: string[]) {
    super("citations.pay", url, validationErrors);
    this.name = "PaymentValidationError";
  }
}

// ─── Error factory ────────────────────────────────────────────────────────────

/** Pulls `errors: string[]` out of a 422 body; falls back to the body itself. */
export function extractValidationErrors(body: unknown): string[] {
  if (typeof body === "object" && body !== null && "errors" in body) {
    const errors = (body as { errors: unknown }).errors;
    if (Array.isArray(errors)) return errors.map(String);
  }
  // String(body) would print "[object Object]" for a JSON body
  return [typeof body === "string" ? body : JSON.stringify(body)];
}

/**
 * Maps an HTTP status to the generic error class. Domain clients upgrade the
 * ones they care about (404 → CitationNotFoundError, 409 → CitationAlreadyPaidError)
 * BEFORE falling through to this factory.
 */
export function createApiError(
  operation: string,
  status: number,
  url: string,
  body: unknown,
): ApiError {
  switch (status) {
    case 404:
      return new NotFoundError(operation, url, body);
    case 409:
      return new ConflictError(operation, url, body);
    case 422:
      return new RequestValidationError(operation, url, extractValidationErrors(body));
    case 429: {
      // Real servers send the delay in the `Retry-After` header (seconds or an
      // HTTP-date, RFC 9110 §10.2.3). Reading body.retryAfter is this chapter's
      // simplification — pass response.headers in if your API uses the header.
      const raw = (body as { retryAfter?: unknown } | null)?.retryAfter;
      const retryAfter = Number(raw ?? 60);
      return new RateLimitError(operation, url, Number.isFinite(retryAfter) ? retryAfter : 60);
    }
    default:
      if (status >= 500) return new ServerError(operation, status, url, body);
      return new ApiError(operation, status, url, body, `Unexpected status ${status}`);
  }
}
```

### The CitationsClient — Full Implementation

```typescript
// lib/clients/CitationsClient.ts

import { ApiHttpError, type ApiCore } from "../core/ApiCore";
import { Endpoints } from "../endpoints/Endpoints";
import {
  createApiError,
  extractValidationErrors,
  CitationAlreadyPaidError,
  CitationNotFoundError,
  PaymentValidationError,
  RateLimitError,
  ServerError,
} from "../errors/ApiErrors";
import type {
  Citation,
  CreateCitationPayload,
  UpdateCitationStatusPayload,
  PayCitationPayload,
  Payment,
} from "../types/domain";

export class CitationsClient {
  constructor(
    private readonly api: ApiCore,
    private readonly getHeaders: () => Record<string, string>,
    // ↑ lazy function — called per request (ensures fresh auth token)
  ) {}

  // ── Read operations ───────────────────────────────────────────────────────

  async getById(id: string): Promise<Citation> {
    const url = Endpoints.citations.getById(id);
    const response = await this.api.get<Citation>(url, {
      headers: this.getHeaders(),
    });

    if (response.status === 404) throw new CitationNotFoundError(id, url);
    if (!response.ok)
      throw createApiError(
        "citations.getById",
        response.status,
        url,
        response.body,
      );

    return response.body;
  }

  async getAll(
    params?: Parameters<typeof Endpoints.citations.list>[0],
  ): Promise<Citation[]> {
    const url = Endpoints.citations.list(params);
    const response = await this.api.get<{ data: Citation[]; total: number }>(
      url,
      {
        headers: this.getHeaders(),
      },
    );

    if (!response.ok)
      throw createApiError(
        "citations.list",
        response.status,
        url,
        response.body,
      );
    return response.body.data;
  }

  async search(
    params: Parameters<typeof Endpoints.citations.list>[0],
  ): Promise<Citation[]> {
    return this.getAll(params);
  }

  // ── Write operations ──────────────────────────────────────────────────────

  async create(payload: CreateCitationPayload): Promise<Citation> {
    const url = Endpoints.citations.create();
    const response = await this.api.post<Citation>(url, payload, {
      headers: this.getHeaders(),
    });

    if (!response.ok)
      throw createApiError(
        "citations.create",
        response.status,
        url,
        response.body,
      );
    if (response.status !== 201) {
      console.warn(`citations.create: expected 201, got ${response.status}`);
    }

    return response.body;
  }

  async updateStatus(
    id: string,
    payload: UpdateCitationStatusPayload,
  ): Promise<Citation> {
    const url = Endpoints.citations.updateStatus(id);
    const response = await this.api.patch<Citation>(url, payload, {
      headers: this.getHeaders(),
    });

    if (response.status === 404)
      throw new CitationNotFoundError(id, url, "citations.updateStatus");
    if (!response.ok)
      throw createApiError(
        "citations.updateStatus",
        response.status,
        url,
        response.body,
      );

    return response.body;
  }

  async delete(id: string): Promise<void> {
    const url = Endpoints.citations.delete(id);
    const response = await this.api.delete(url, { headers: this.getHeaders() });

    if (response.status === 404) {
      // Idempotent delete — 404 means already gone, that's fine
      return;
    }
    if (!response.ok)
      throw createApiError(
        "citations.delete",
        response.status,
        url,
        response.body,
      );
  }

  // ── Payment operations ────────────────────────────────────────────────────

  async pay(citationId: string, payload: PayCitationPayload): Promise<Payment> {
    const url = Endpoints.citations.payments.create(citationId);
    const response = await this.api.post<Payment>(url, payload, {
      headers: this.getHeaders(),
    });

    // Upgrade the statuses with business meaning, then fall through to the generic factory
    if (response.status === 409)
      throw new CitationAlreadyPaidError(citationId, url, response.body);
    if (response.status === 422)
      throw new PaymentValidationError(url, extractValidationErrors(response.body));
    if (!response.ok)
      throw createApiError("citations.pay", response.status, url, response.body);

    return response.body;
  }

  async getPayments(citationId: string): Promise<Payment[]> {
    const url = Endpoints.citations.payments.list(citationId);
    const response = await this.api.get<Payment[]>(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok)
      throw createApiError(
        "citations.payments.list",
        response.status,
        url,
        response.body,
      );
    return response.body;
  }

  // ── Bulk operations ───────────────────────────────────────────────────────

  /**
   * Creates multiple citations in parallel (concurrent API calls).
   * Returns all created citations, or throws if any individual creation fails.
   */
  async bulkCreate(payloads: CreateCitationPayload[]): Promise<Citation[]> {
    const results = await Promise.allSettled(
      payloads.map((p) => this.create(p)),
    );

    const failures = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => r.reason);

    if (failures.length > 0) {
      const messages = failures
        .map((e) => e?.message ?? String(e))
        .join("\n  ");
      throw new Error(
        `bulkCreate: ${failures.length}/${payloads.length} citations failed:\n  ${messages}`,
      );
    }

    return results
      .filter(
        (r): r is PromiseFulfilledResult<Citation> => r.status === "fulfilled",
      )
      .map((r) => r.value);
  }

  /**
   * Deletes all citations matching the given parameters.
   * Returns the number of deleted records.
   */
  async bulkDelete(
    params: Parameters<typeof Endpoints.citations.list>[0],
  ): Promise<number> {
    const citations = await this.getAll(params);
    const results = await Promise.allSettled(
      citations.map((c) => this.delete(c.citationId)),
    );
    const failed = results.filter((r) => r.status === "rejected");

    if (failed.length > 0) {
      console.warn(
        `bulkDelete: ${failed.length}/${citations.length} deletions failed`,
      );
    }

    return citations.length - failed.length;
  }

  /**
   * Waits for a citation to reach the expected status via polling.
   * This is the correct alternative to for-loops with waitForTimeout.
   *
   * expect.poll semantics (measured on Playwright 1.60): a callback that RETURNS
   * keeps polling until the matcher passes; a callback that THROWS aborts the
   * poll at once with the thrown error. So: throw for permanent failures (404,
   * 401, schema drift, terminal status), RETURN for transient ones — otherwise a
   * single 503 in a two-minute wait fails the test.
   */
  async waitForStatus(
    id: string,
    expectedStatus: Citation["status"],
    timeoutMs: number = 120_000,
  ): Promise<Citation> {
    const { expect } = await import("@playwright/test");
    let lastCitation: Citation | null = null;

    await expect
      .poll(
        async () => {
          try {
            lastCitation = await this.getById(id);
          } catch (error) {
            const transient =
              error instanceof ServerError ||
              error instanceof RateLimitError ||
              (error instanceof ApiHttpError && error.status === 0); // network
            if (transient) return `unavailable: ${(error as Error).message}`;
            throw error; // permanent: fail now with the real error
          }
          if (
            lastCitation.status === "CANCELLED" &&
            expectedStatus !== "CANCELLED"
          ) {
            throw new Error(
              `Citation ${id} reached terminal status 'CANCELLED', expected '${expectedStatus}'`,
            );
          }
          return lastCitation.status;
        },
        {
          message: `Citation ${id} never reached status '${expectedStatus}'`,
          timeout: timeoutMs,
          intervals: [1000, 2000, 5000, 10000],
        },
      )
      .toBe(expectedStatus);

    return lastCitation!;
  }
}
```

---

## 7. Response Schema Validation with Zod

Raw API responses are `unknown` in TypeScript. Adding runtime schema validation catches API contract violations immediately.

### The Typed Response Chain

```mermaid
sequenceDiagram
    participant Test
    participant Client as Domain Client
    participant Zod as Zod Schema
    participant Core as ApiCore
    participant PW as Playwright

    Test->>Client: getById('CIT-001')
    Client->>Core: get<unknown>('/api/...')
    Core->>PW: fetch()
    PW-->>Core: APIResponse (Buffer)
    Core-->>Client: raw json (unknown)
    Client->>Zod: parse(json)

    alt Schema Matches
        Zod-->>Client: Validated Citation object
        Client-->>Test: Typed Citation
    else Schema Mismatch
        Zod-->>Client: ZodError
        Client-->>Test: throws SchemaValidationError
    end
```

```typescript
// lib/types/domain.ts — the module CitationsClient imports its types from.
// npm install zod   (written and run against Zod 4.x)
import { z } from 'zod';

// ─── Define schemas ───────────────────────────────────────────────────────────

export const CitationStatusEnum = z.enum(['PENDING', 'PAID', 'OVERDUE', 'DISPUTED', 'CANCELLED']);

// Zod 4 idioms: z.iso.datetime() and z.strictObject()/z.looseObject() replace the
// Zod 3 forms z.string().datetime() and .strict()/.passthrough(), which still run
// but are marked @deprecated in 4.x.
export const CitationSchema = z.strictObject({
  citationId:   z.string().regex(/^CIT-[A-Z0-9]+$/, 'citationId must start with CIT-'),
  customerId:   z.string().min(1),
  status:       CitationStatusEnum,
  amount:       z.number().positive('amount must be positive'),
  type:         z.string(),
  issueDate:    z.iso.datetime({ offset: true }),  // ISO 8601 with timezone
  dueDate:      z.iso.datetime({ offset: true }).nullable(),
  officerId:    z.string().nullable().optional(),
  notes:        z.string().nullable().optional(),
  createdAt:    z.iso.datetime({ offset: true }),
  updatedAt:    z.iso.datetime({ offset: true }),
});  // strictObject = fail on unknown fields (see the warning below)

export type Citation = z.infer<typeof CitationSchema>;

export const CreateCitationPayloadSchema = z.looseObject({
  customerId: z.string(),
  amount:     z.number().positive(),
  type:       z.string(),
  issueDate:  z.string().optional(),
  notes:      z.string().optional(),
});  // looseObject = allow extra fields (payloads can be extended)

export type CreateCitationPayload = z.infer<typeof CreateCitationPayloadSchema>;

// ─── Validated response helper ────────────────────────────────────────────────

export class SchemaValidationError extends Error {
  constructor(
    public readonly operation: string,
    public readonly issues:    z.core.$ZodIssue[],
    public readonly rawBody:   unknown
  ) {
    const formatted = issues.map(i => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    super(`[${operation}] API response schema validation failed:\n${formatted}\nRaw body: ${JSON.stringify(rawBody).substring(0, 500)}`);
    this.name = 'SchemaValidationError';
  }
}

export function parseResponse<T>(
  schema:    z.ZodType<T>,
  body:      unknown,
  operation: string
): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new SchemaValidationError(operation, result.error.issues, body);
  }
  return result.data;
}

// ─── Usage in CitationsClient ─────────────────────────────────────────────────

// In CitationsClient.create():
async create(payload: CreateCitationPayload): Promise<Citation> {
  const url      = Endpoints.citations.create();
  const response = await this.api.post<unknown>(url, payload, { headers: this.getHeaders() });

  if (!response.ok) throw createApiError('citations.create', response.status, url, response.body);

  // Validate the response matches the expected schema
  return parseResponse(CitationSchema, response.body, 'citations.create');
  //                   ↑ If the API returns unexpected shape, test fails HERE
  //                     with a clear "schema validation failed" message
}
```

**Two cautions about the schemas above:**

- **`z.strictObject` on a *response* is a policy choice with a cost.** An unknown key makes `safeParse` fail with `Unrecognized key` (verified), so every backwards-compatible *additive* change by the API team — a new optional field — turns into a red test. Default to the plain `z.object` (unknown keys stripped) and reserve `strictObject` for endpoints whose exact shape is a pinned contract. For drift detection that doesn't break unrelated tests, use [Chapter 38 — Contract Testing with Pact](../07_Specialised_Testing/38_Contract_Testing_Pact.md).
- **The framework hand-rolls its validators instead.** [`framework/clients/UsersClient.ts`](../framework/clients/UsersClient.ts) checks shapes with small `assertNumber` / `assertString` helpers and throws its own `ValidationError`; `framework/package.json` has no `zod` dependency, and [`utilities/matchers/to-match-schema-zod.ts`](../framework/utilities/matchers/to-match-schema-zod.ts) accepts any object with a `safeParse` method, so it works with Zod without importing it. Zod is the better default once you have more than a handful of endpoints.

---

## 8. Retry Middleware

Retry is the one layer where a plausible-looking implementation silently does nothing. Three rules decide whether it works:

1. **Retry must look at what the layer below actually throws.** `ApiCore` returns every HTTP response (it throws `ApiHttpError` only for a network failure, status `0`), and the domain client throws `ApiError` subclasses. A retry wrapper that checks `error instanceof ApiHttpError && retryableStatuses.includes(error.status)` around a *domain-client* call never fires — the thing thrown is a `ServerError`, not an `ApiHttpError`. (That version, run against a server answering `503, 503, 201`, made 1 attempt and threw a `ServerError`.)
2. **Never retry a non-idempotent request blindly.** A `POST` that timed out may have been processed. Retrying it can create the citation twice. Retry `POST` only on responses that mean "not processed" (`429`, and `503` from a server that documents it), never on a network error, unless the API takes an idempotency key — see [Chapter 23 §3b](./23_APIUtils_HTTP_Library.md#3b-advanced-apiutils-retry-with-exponential-backoff) and [Chapter 67 §5](../03_Real_World_Scenarios/67_Payment_Gateway_Testing.md#5-double-submit-and-idempotency--assert-effects-not-requests).
3. **Backoff needs jitter and a cap**, or every client that failed together retries together.

```typescript
// lib/core/retry.ts

import { ApiError } from "../errors/ApiErrors";
import { ApiHttpError } from "./ApiCore";

export interface RetryConfig {
  maxAttempts:       number;
  retryableStatuses: number[];  // HTTP status codes to retry on
  retryNetworkErrors: boolean;  // ApiHttpError status 0 — only safe for idempotent calls
  baseDelayMs:       number;    // Initial delay
  maxDelayMs:        number;    // Maximum delay (for exponential backoff)
  onRetry?:          (attempt: number, reason: unknown, delayMs: number) => void;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts:        3,
  retryableStatuses:  [429, 502, 503, 504],
  retryNetworkErrors: true,
  baseDelayMs:        500,
  maxDelayMs:         30_000,
};

export async function withRetry<T>(
  operation: string,
  fn:        () => Promise<T>,
  config:    RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const outOfAttempts = attempt >= config.maxAttempts;
    let reason: unknown;

    try {
      const result = await fn();

      // Works for both layers: an ApiResponse-shaped result (calling ApiCore
      // directly) is retried on a retryable status; anything else is returned.
      const status = statusOf(result);
      if (status === undefined || !config.retryableStatuses.includes(status) || outOfAttempts) {
        return result; // success, non-retryable, or out of attempts: hand it back as-is
      }
      reason = `HTTP ${status}`;
    } catch (error) {
      if (outOfAttempts || !isRetryable(error, config)) throw error;
      reason = error;
    }

    const delay = calculateDelay(attempt, config);
    (config.onRetry ?? defaultOnRetry(operation))(attempt, reason, delay);
    await sleep(delay);
  }
}

function statusOf(result: unknown): number | undefined {
  if (typeof result === "object" && result !== null && "status" in result) {
    const status = (result as { status: unknown }).status;
    if (typeof status === "number") return status;
  }
  return undefined;
}

function isRetryable(error: unknown, config: RetryConfig): boolean {
  if (error instanceof ApiError) return config.retryableStatuses.includes(error.status);
  if (error instanceof ApiHttpError) {
    return error.status === 0
      ? config.retryNetworkErrors
      : config.retryableStatuses.includes(error.status);
  }
  return false; // SchemaValidationError, TypeError, assertion failures: never retry
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff plus 0-10% jitter (jitter is only ever added), capped
  const exponential = config.baseDelayMs * Math.pow(2, attempt - 1);
  const jitter      = Math.random() * 0.1 * exponential;
  return Math.min(exponential + jitter, config.maxDelayMs);
}

function defaultOnRetry(operation: string) {
  return (attempt: number, reason: unknown, delayMs: number): void => {
    console.warn(`[retry] ${operation} attempt ${attempt} failed (${String(reason)}); waiting ${Math.round(delayMs)}ms`);
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Usage in domain client ───────────────────────────────────────────────────

// In CitationsClient (needs: import { withRetry } from "../core/retry"):
async createWithRetry(payload: CreateCitationPayload): Promise<Citation> {
  return withRetry(
    'citations.create',
    () => this.create(payload),
    {
      maxAttempts:        3,
      retryableStatuses:  [503, 429],
      retryNetworkErrors: false,   // a timed-out POST may have been processed: never replay it blindly
      baseDelayMs:        1000,
      maxDelayMs:         10_000,
    }
  );
}
```

Verified against a local server that answers `503, 503, 201`: `createWithRetry` makes exactly 3 POSTs and returns the citation; a `500` is thrown after 1 attempt; a `400` is thrown after 1 attempt. The framework's own `ApiCore` ([`framework/utilities/api/ApiCore.ts`](../framework/utilities/api/ApiCore.ts)) retries *inside the core* instead (§11) — which is why it can also see network errors, and also why it replays `POST`/`PATCH` without asking (see §11).

---

## 9. Fixture Integration — Wiring the Library

```typescript
// fixtures/index.ts — Complete fixture wiring

import { test as base } from "@playwright/test";
import { ApiCore } from "../lib/core/ApiCore";
import { CitationsClient } from "../lib/clients/CitationsClient";
import { UsersClient } from "../lib/clients/UsersClient";
import { NotificationsClient } from "../lib/clients/NotificationsClient";
import { HeadersCrm } from "../lib/headers/HeadersBuilder";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestFixtures {
  apiCore: ApiCore;
  citationsClient: CitationsClient;
  usersClient: UsersClient;
  notificationsClient: NotificationsClient;
}

interface WorkerFixtures {
  account: { userId: string; accessToken: string; refreshToken: string };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Worker-scoped: login once per worker
  account: [
    async ({ playwright }, use) => {
      // A token call needs an HTTP client, not a browser: a standalone request
      // context is cheaper than browser.newContext() + a page we never use.
      const request = await playwright.request.newContext();

      const loginResponse = await request.post(
        `${process.env.AUTH_URL}/token`,
        {
          // `form`, NOT `data`: an object passed as `data` is always sent as JSON,
          // even with a form Content-Type header set (see the table in §2).
          // `form` sends grant_type=password&... with the right Content-Type.
          form: {
            grant_type: "password",
            username: process.env.TEST_USER_EMAIL!,
            password: process.env.TEST_USER_PASSWORD!,
            client_id: process.env.OAUTH_CLIENT_ID!,
          },
        },
      );

      if (!loginResponse.ok()) {
        const detail = await loginResponse.text();
        await request.dispose();
        throw new Error(`Login failed: ${loginResponse.status()} — ${detail}`);
      }

      const tokens = (await loginResponse.json()) as {
        access_token: string;
        refresh_token: string;
        user_id: string;
      };

      await request.dispose();

      await use({
        userId: tokens.user_id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });
    },
    { scope: "worker" },
  ],

  // Test-scoped: ApiCore (wraps Playwright's request context)
  apiCore: async ({ request }, use) => {
    const core = new ApiCore(request, {
      baseUrl: process.env.CRM_API_URL!,
      defaultTimeoutMs: 30_000,
      logRequests: process.env.LOG_API_REQUESTS === "true",
      maskHeaders: ["authorization", "x-api-key"],
    });
    await use(core);
  },

  // Test-scoped: CitationsClient
  citationsClient: async ({ apiCore, account }, use, testInfo) => {
    // getHeaders is a function so it is evaluated per request. Be clear about what
    // that buys: `account` above is a snapshot from the worker's one login, so the
    // token only changes if something mutates `account` (e.g. a refresh helper
    // that updates account.accessToken). Without that, a token that expires
    // mid-run still 401s. Passing a plain token string to the constructor
    // (Challenge 4) is equivalent until you add refresh.
    const getHeaders = () =>
      HeadersCrm.auth(account.accessToken, testInfo.testId);
    await use(new CitationsClient(apiCore, getHeaders));
  },

  // Test-scoped: UsersClient
  usersClient: async ({ apiCore, account }, use, testInfo) => {
    const getHeaders = () =>
      HeadersCrm.auth(account.accessToken, testInfo.testId);
    await use(new UsersClient(apiCore, getHeaders));
  },

  // Test-scoped: NotificationsClient
  notificationsClient: async ({ apiCore, account }, use, testInfo) => {
    const getHeaders = () =>
      HeadersCrm.auth(account.accessToken, testInfo.testId);
    await use(new NotificationsClient(apiCore, getHeaders));
  },
});

export { expect } from "@playwright/test";
```

---

## 10. What Tests Look Like With the Library

```typescript
// tests/specs/citations/payment.spec.ts
// Import from YOUR fixtures, not from @playwright/test
//
// Project-specific pieces this snippet assumes (they are not defined in this chapter):
//   PayloadsCitation   — payload factory, Chapter 22
//   CitationDetailPage — a page object, Chapter 18
//   dbClient           — a DB fixture added to the fixture list from §9, Chapter 30
import { test, expect } from "../../fixtures";
import { PayloadsCitation } from "../../data/payloads/PayloadsCitation";
import { CitationDetailPage } from "../../pages/CitationDetailPage";
import { CitationAlreadyPaidError } from "../../lib/errors/ApiErrors";
import type { Citation } from "../../lib/types/domain";

test.describe("Citation Payment", () => {
  test("Full payment flow — API + UI + DB verified", async ({
    page,
    citationsClient,
    notificationsClient,
    dbClient,
    account,
  }) => {
    const testStart = new Date();
    let citation: Citation;

    await test.step("API: Create pending citation", async () => {
      citation = await citationsClient.create(
        PayloadsCitation.parking({ customerId: account.userId }),
      );
      expect(citation.status).toBe("PENDING");
      expect(citation.customerId).toBe(account.userId);
    });

    await test.step("UI: Submit payment", async () => {
      const citationPage = new CitationDetailPage(page);
      await citationPage.goto(citation.citationId);
      await citationPage.payNow(citation.amount);
    });

    await test.step("API: Wait for citation to reach PAID", async () => {
      // The RIGHT way — uses expect.poll internally
      const paidCitation = await citationsClient.waitForStatus(
        citation.citationId,
        "PAID",
        120_000,
      );
      expect(paidCitation.amount).toBe(citation.amount);
    });

    await test.step("API: Notification was sent", async () => {
      await expect
        .poll(
          async () => {
            const notifs = await notificationsClient.getForUser(
              account.userId,
              { after: testStart },
            );
            return notifs.some(
              (n) =>
                n.type === "PAYMENT_CONFIRMED" &&
                n.metadata?.citationId === citation.citationId,
            );
          },
          {
            message: "Payment confirmation notification never sent",
            timeout: 60_000,
          },
        )
        .toBe(true);
    });

    await test.step("DB: Citation and payment recorded correctly", async () => {
      const row = await dbClient.queryOne<{ status: string; paid_at: Date }>(
        "SELECT status, paid_at FROM citations WHERE citation_id = $1",
        [citation.citationId],
      );
      expect(row?.status).toBe("PAID");
      expect(row?.paid_at.getTime()).toBeGreaterThan(testStart.getTime());
    });
  });

  test("Paying an already-paid citation returns 409", async ({
    citationsClient,
    account,
  }) => {
    // Create + pay a citation
    const citation = await citationsClient.create(
      PayloadsCitation.parking({ customerId: account.userId }),
    );
    await citationsClient.pay(citation.citationId, { amount: citation.amount });
    await citationsClient.waitForStatus(citation.citationId, "PAID");

    // Attempt to pay again — should get CitationAlreadyPaidError
    await expect(
      citationsClient.pay(citation.citationId, { amount: citation.amount }),
    ).rejects.toThrow(CitationAlreadyPaidError);
  });
});
```

**The test reads like requirements**:

- "Create pending citation" — plain English
- "Wait for PAID" — no implementation detail (no for-loops, no waits)
- Error cases are domain exceptions, not HTTP status codes
- Every assertion checks business values, not HTTP plumbing

---

## 🏋️ Practice Questions

### Q1. [Write It] — BulkOperationsClient

Write a `BulkCitationsHelper` class that extends CitationsClient's capabilities with:

1. `createAndPay(payload, paymentAmount): Promise<{ citation: Citation, payment: Payment }>` — creates a citation and immediately submits payment, returning both
2. `cleanupByCustomer(customerId): Promise<number>` — deletes all citations for a customer (using bulkDelete), returns count
3. `verifyAllStatus(ids: string[], expectedStatus: string): Promise<void>` — verifies all citations in the list have the expected status using parallel API calls

<details><summary>Answer</summary>

```typescript
export class BulkCitationsHelper {
  constructor(private readonly citations: CitationsClient) {}

  async createAndPay(
    payload: CreateCitationPayload,
    paymentAmount: number,
  ): Promise<{ citation: Citation; payment: Payment }> {
    const citation = await this.citations.create(payload);
    const payment = await this.citations.pay(citation.citationId, {
      amount: paymentAmount,
    });
    return { citation, payment };
  }

  async cleanupByCustomer(customerId: string): Promise<number> {
    return this.citations.bulkDelete({ customerId });
  }

  async verifyAllStatus(
    ids: string[],
    expectedStatus: Citation["status"],
  ): Promise<void> {
    // Fetch all citations in parallel
    const results = await Promise.allSettled(
      ids.map((id) => this.citations.getById(id)),
    );

    const failures: string[] = [];

    results.forEach((result, idx) => {
      if (result.status === "rejected") {
        failures.push(`${ids[idx]}: fetch failed — ${result.reason}`);
      } else if (result.value.status !== expectedStatus) {
        failures.push(
          `${ids[idx]}: expected '${expectedStatus}', got '${result.value.status}'`,
        );
      }
    });

    if (failures.length > 0) {
      throw new Error(
        `verifyAllStatus failed for ${failures.length}/${ids.length} citations:\n${failures.join("\n")}`,
      );
    }
  }
}
```

</details>

---

### Q2. [MCQ] — Error Handling Design

Which approach is BEST for handling a 404 response from `GET /api/citations/{id}`?

A) `if (!response.ok()) return null;`  
B) `if (response.status() === 404) throw new Error('Not found');`  
C) `if (response.status() === 404) throw new CitationNotFoundError(id, url);`  
D) `expect(response.status()).toBe(200); // let it fail as an assertion`

<details><summary>Answer</summary>

**C** — `throw new CitationNotFoundError(id, url)`.

Why C is best:

- The error message tells you WHICH citation was not found and WHERE the call went
- Tests can use `catch (e) { if (e instanceof CitationNotFoundError) { ... } }` to handle expected 404s gracefully
- The error is part of your domain language, not generic HTTP

Why not A: Returning `null` forces every caller to null-check. Easy to forget. Silences real errors.
Why not B: Generic `Error('Not found')` loses the citation ID and URL — harder to debug.
Why not D: A test assertion failure gives no information about why the citation wasn't found.

</details>

---

### Q3. [Design Question] — When to Add Zod Validation

Your API client has 50 methods. Adding Zod schemas to all of them would take 3 weeks. Prioritize: which 10 should get Zod validation first and why?

<details><summary>Answer</summary>

**Priority order** (highest to lowest):

1. **Create/POST responses** — These return newly created data. Schema drift here causes cascading failures across the test suite because `citationId`, `customerId`, etc. are used in subsequent steps.

2. **The core entity `getById`** — `citationsClient.getById()`, `usersClient.getById()`. All tests depend on these. Schema failures here are caught early.

3. **Status enum fields** — Any field that is an enum (status, type, channel). If the API adds a new status like 'IN_REVIEW', unvalidated code silently treats it as an unknown string. Zod catches this immediately.

4. **Financial fields** — `amount`, `balance`, `total`. Type coercion bugs (string "150.99" vs number 150.99) are subtle and cause test failures that look like logic errors.

5. **Timestamp fields** — `createdAt`, `updatedAt`, `processedAt`. These are often compared to `new Date()` in assertions. Schema validation catches format changes (epoch vs ISO string) early.

**Skip for now:**

- Simple string fields (name, description) — low value
- List responses — validate the individual item schema; the list wrapper rarely changes
- Error response bodies — these already fail on `response.ok === false`

The 20/80 rule: 20% of fields carry 80% of the validation value. Start with IDs, statuses, amounts, and timestamps.

</details>

---

## 🏋️ Practice Challenges

### Challenge 1 [MCQ] — Why hide raw Playwright `request` behind a facade?

What is the primary architectural benefit of wrapping Playwright's `APIRequestContext` inside an `ApiClient` class instead of calling `request.post()` directly in spec files?

A) It speeds up the test execution because classes run faster than raw function calls.
B) It centralizes endpoint URLs, payload construction, header injection, and response parsing, keeping spec files strictly focused on business logic assertions.
C) It prevents Playwright from logging the API calls.
D) It allows the tests to bypass network proxies.

<details><summary>Answer</summary>

**B** — Centralization and Separation of Concerns.
When URLs or headers change, you update one class, not 50 spec files. Specs remain readable, containing only the _intent_ of the test.

</details>

---

### Challenge 2 [Spot the Bug — Silent failure in API Error Wrapper]

```typescript
class ApiClient {
  async get(url: string) {
    const response = await this.request.get(url);
    if (!response.ok()) {
      console.error(`API failed: ${response.status()}`);
      return null;
    }
    return response.json();
  }
}

// In test:
const data = await client.get("/api/config");
expect(data.theme).toBe("dark");
```

What is the danger of this error handling pattern?

<details><summary>Answer</summary>

**Bug**: Returning `null` on an HTTP error is a classic anti-pattern.
If the API returns a 500 Internal Server Error, `data` becomes `null`. The test then attempts `data.theme`, throwing `TypeError: Cannot read properties of null (reading 'theme')`.

The test fails with a generic JavaScript error instead of telling the developer _why_ it failed (the 500 error).

**Fix**: Throw a descriptive error containing the HTTP status and response body.

```typescript
if (!response.ok()) {
  const body = await response.text();
  throw new Error(`API GET ${url} failed with ${response.status()}: ${body}`);
}
```

This forces the test to fail immediately at the API step, putting the exact HTTP error in the CI logs.

</details>

---

### Challenge 3 [Write It Yourself — Generic Retry Interceptor]

Write a `requestWithRetry` wrapper method inside your `ApiClient` that takes a closure (e.g., `() => this.request.get(url)`), executes it, and if it returns a 502, 503, or 504 status code, retries it up to 3 times with a 1-second delay.

<details><summary>Answer</summary>

```typescript
  private async requestWithRetry(
    operation: () => Promise<APIResponse>,
    maxRetries = 3
  ): Promise<APIResponse> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const response = await operation();

      // If success or a non-retryable error (like 400 or 404), return immediately
      if (![502, 503, 504].includes(response.status())) {
        return response;
      }

      if (attempt === maxRetries) {
        return response; // Out of retries, return the failing response
      }

      console.warn(`Attempt ${attempt} failed with ${response.status()}. Retrying...`);
      // Wait 1 second before next attempt (using a standard Promise-based delay)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Unreachable');
  }

  // Usage:
  async get(url: string) {
    const response = await this.requestWithRetry(() => this.request.get(url));
    // ... proceed with response.ok() check
  }
```

</details>

---

### Challenge 4 [Architecture — Centralizing Auth Headers]

Where is the most secure and maintainable place to inject an Authorization token into the `ApiClient` so that every method (`get`, `post`, `put`) uses it automatically?

A) Pass the token as a parameter to every method: `client.get('/url', token)`.
B) Pass the token into the `ApiClient` constructor and store it as a private readonly class property.
C) Read the token from `process.env.TOKEN` inside the `get()` method.
D) Put the token in a global variable.

<details><summary>Answer</summary>

**B** — Passing the token into the constructor via a Playwright fixture.

```typescript
// Client class
export class ApiClient {
  constructor(
    private request: APIRequestContext,
    private token: string,
  ) {}

  async get(url: string) {
    return this.request.get(url, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
  }
}

// Fixture setup
export const test = base.extend<{ apiClient: ApiClient }>({
  apiClient: async ({ request, loginToken }, use) => {
    // Inject the isolated, test-specific token into the client
    const client = new ApiClient(request, loginToken);
    await use(client);
  },
});
```

This ensures the client is perfectly encapsulated, thread-safe (no global variables), and DRY (don't repeat the header in every test).

</details>

---

### Challenge 5 [Spot the Bug — Generics turning into `any`]

```typescript
class ApiClient {
  async get<T>(url: string): Promise<T> {
    const response = await this.request.get(url);
    return response.json();
  }
}

// In test:
const user = await client.get<User>("/api/users/1");
```

While this looks like excellent TypeScript, what false sense of security does `response.json()` returning `T` give you at runtime?

<details><summary>Answer</summary>

**Bug**: TypeScript types are erased at compile time. `response.json()` returns an `any` at runtime. By casting it to `Promise<T>`, you are telling TypeScript "trust me, the API returned the `User` shape."

If the API actually returned `{ error: "User not found" }`, TypeScript won't catch it, and the test will crash later when you try to access `user.firstName`.

**SDE Fix**: To achieve true runtime type safety, you must parse the response through a schema validator like Zod.

```typescript
import { z } from "zod";

class ApiClient {
  async get<T>(url: string, schema: z.ZodSchema<T>): Promise<T> {
    const response = await this.request.get(url);
    const json = await response.json();

    // Throws a clear runtime error if the API payload doesn't match the expected type
    return schema.parse(json);
  }
}

// In test:
const user = await client.get("/api/users/1", UserSchema);
```

</details>

---

**Navigation**: [← Chapter 43: Real-World War Stories](../06_CI_CD_And_Reliability/43_Real_World_SDET_War_Stories.md) | [Index](../00_INDEX.md) | [→ Chapter 45: AI Agents, MCP & Playwright](../07_Specialised_Testing/45_AI_Agents_MCP_And_Playwright.md)


---

## Reality Check

**"A generic HTTP wrapper is a good API client library"**→ A wrapper around fetch that adds headers and parses JSON is a utility, not a client library. An enterprise API client library includes: typed request and response interfaces, endpoint-specific methods (getUser, createOrder), error type mapping (404 → UserNotFoundError), retry policies per endpoint, and authentication token management. The typing and domain semantics are the value, not the HTTP abstraction.

**"API client libraries should be auto-generated from OpenAPI specs"**→ Auto-generated clients from OpenAPI work when: the spec is complete and accurate (not always true), the spec is versioned and published (not always done), and the generated code matches your style and patterns (never true). Generated clients are a starting point. Production clients need: custom error handling, caching strategies, and test-specific overrides that generators cannot produce.

**"One API client instance per test suite"**→ A shared client instance may accumulate state: authentication tokens that expire, request interceptors added by previous tests, or connection pools at capacity. Create client instances per test or per worker with fresh configuration. The creation cost is negligible compared to the debugging cost of shared state interference.

**"API client errors should be caught and returned as null"**→ Swallowing errors and returning null hides failures: a test that checks if (user !== null) passes when the API is down because null is falsy. Let API errors propagate as exceptions so tests fail with clear error messages. Only catch errors when the test specifically tests error handling: expect(apiClient.getUser(999)).rejects.toThrow(NotFoundError).

**"Type safety in the API client is optional for tests"**→ Without types, a test calling apiClient.createUser({ nmae: 'John' }) (typo in name) sends a request with a wrong field and gets a 400 error that looks like a test failure rather than a test BUG. TypeScript interfaces on the client catch this at compile time. The investment in typing the API client pays for itself in the first week of use.
