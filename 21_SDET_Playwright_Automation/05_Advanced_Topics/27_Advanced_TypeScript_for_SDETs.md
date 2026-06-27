# 27. Advanced TypeScript Patterns for SDETs

**Navigation**: [← Chapter 26: Flakiness Diagnosis](./26_Flakiness_Diagnosis_and_Fixing.md) | [Index](../00_INDEX.md) | [→ Chapter 28: Test Data Lifecycle](./28_Test_Data_Lifecycle_and_Cleanup.md)

**Cross-links:**

- [`04_JS_TS_For_Automation.md`](../01_Foundations/04_JS_TS_For_Automation.md) — TypeScript fundamentals
- [`22_Headers_Payloads_Endpoints_Factory.md`](../04_Enterprise_Architecture/22_Headers_Payloads_Endpoints_Factory.md) — Where these patterns are used
- [`23_APIUtils_HTTP_Library.md`](../04_Enterprise_Architecture/23_APIUtils_HTTP_Library.md) — Generic API clients

---

## 5W1H

- **WHAT**: Advanced TypeScript type system features that make test code safer, more readable, and harder to misuse — generics, discriminated unions, template literal types, conditional types, the `satisfies` operator, and mapped types.
- **WHY**: Junior SDETs write TypeScript like JavaScript (everything is `any` or `string`). Senior SDETs use the type system to make entire classes of test bugs impossible at compile time. These patterns are what you see in real enterprise test frameworks.
- **WHO**: SDETs who know basic TypeScript and want to write code that their colleagues can't misuse.
- **WHEN**: When you're building shared utilities, client classes, or payload factories that many tests will use.
- **HOW**: Each pattern with a real automation use case, before/after comparison, and a practice challenge.

---

## 1. Generics — The Foundation of Reusable Clients

### The Problem Without Generics

```typescript
// Without generics — you'd need a separate method for every response type:
async getCitation(): Promise<CitationApiResponse> { ... }
async getUser(): Promise<UserApiResponse> { ... }
async getNotification(): Promise<NotificationApiResponse> { ... }
// Each method is identical except for the return type annotation.
// That's duplication. The type system can handle this for you.
```

### Generic Client Method

```typescript
// The generic <T> parameter means: "the caller specifies the return type"
async get<T>(url: string): Promise<T> {
  const response = await this.request.get(url, { headers: this.headers });
  return response.json() as T;
}

// Usage: caller specifies T at the call site
const citation = await apiUtils.get<CitationApiResponse>(Endpoints.citations.getById('CIT-001'));
//                                  ↑ TypeScript knows `citation` is CitationApiResponse
const user = await apiUtils.get<UserApiResponse>(Endpoints.users.getById('USR-001'));
//                              ↑ TypeScript knows `user` is UserApiResponse
```

### Generic Fixture Factory

One of the most powerful uses — a generic test data creator:

```typescript
// utils/TestDataFactory.ts
// Creates and tracks test data, ensuring cleanup even if the test fails

export class TestDataFactory<TCreate, TResponse> {
  private created: TResponse[] = [];

  constructor(
    private readonly createFn: (payload: TCreate) => Promise<TResponse>,
    private readonly deleteFn: (item: TResponse) => Promise<void>,
    private readonly getId: (item: TResponse) => string,
  ) {}

  async create(payload: TCreate): Promise<TResponse> {
    const item = await this.createFn(payload);
    this.created.push(item); // Track for cleanup
    return item;
  }

  async cleanup(): Promise<void> {
    // Delete all created items in reverse order (respects dependencies)
    for (const item of [...this.created].reverse()) {
      try {
        await this.deleteFn(item);
        console.log(`[TestDataFactory] Deleted ${this.getId(item)}`);
      } catch (error) {
        console.warn(
          `[TestDataFactory] Failed to delete ${this.getId(item)}:`,
          error,
        );
      }
    }
    this.created = [];
  }
}

// Usage: citation factory
const citationFactory = new TestDataFactory<
  CreateCitationPayload,
  CitationApiResponse
>(
  (payload) => citationsClient.create(payload),
  (citation) => citationsClient.delete(citation.citationId),
  (citation) => citation.citationId,
);

const c1 = await citationFactory.create(
  PayloadsCitation.pending({ customerId: account.userId }),
);
const c2 = await citationFactory.create(
  PayloadsCitation.paid({ customerId: account.userId }),
);

// After the test:
await citationFactory.cleanup(); // Deletes c2 then c1 (reverse order)
```

---

## 2. Discriminated Unions — Type-Safe Test Scenarios

### The Problem

```typescript
// Without discriminated unions:
interface TestScenario {
  type: string;
  userId?: string; // only for logged-in scenarios
  guestEmail?: string; // only for guest scenarios
  errorExpected?: boolean;
  errorMessage?: string;
}
// This is unsafe: you can create { type: 'GUEST', userId: 'USR-001' } — contradictory
```

### Discriminated Unions Solution

```typescript
// With discriminated unions: each variant has ONLY its relevant fields

type CitationTestScenario =
  | { kind: "logged-in"; userId: string; expectedCount: number }
  | { kind: "guest"; email: string; expectRedirectToLogin: true }
  | { kind: "suspended"; userId: string; expectedError: "ACCOUNT_SUSPENDED" }
  | { kind: "no-results"; userId: string; searchTerm: string };

// TypeScript narrows the type based on `kind`:
function runScenario(scenario: CitationTestScenario) {
  if (scenario.kind === "logged-in") {
    scenario.userId; // ✅ TypeScript knows this exists
    scenario.email; // ❌ TypeScript error: property doesn't exist on this variant
  }
  if (scenario.kind === "guest") {
    scenario.email; // ✅ TypeScript knows this exists
    scenario.userId; // ❌ TypeScript error
  }
}

// Practical test use:
const scenarios: CitationTestScenario[] = [
  { kind: "logged-in", userId: "USR-001", expectedCount: 5 },
  { kind: "guest", email: "guest@test.com", expectRedirectToLogin: true },
  { kind: "suspended", userId: "USR-002", expectedError: "ACCOUNT_SUSPENDED" },
];

for (const scenario of scenarios) {
  test(`Citation search: ${scenario.kind} user`, async ({
    page,
    citationsClient,
  }) => {
    switch (scenario.kind) {
      case "logged-in":
        // scenario.userId is definitely a string here — TypeScript knows
        const results = await citationsClient.search({
          userId: scenario.userId,
        });
        expect(results.length).toBe(scenario.expectedCount);
        break;

      case "guest":
        await page.goto(`/citations?email=${scenario.email}`);
        await expect(page).toHaveURL(/\/login/);
        break;

      case "suspended":
        const response = await citationsClient.search({
          userId: scenario.userId,
        });
        expect(response).toMatchObject({ error: scenario.expectedError });
        break;
    }
  });
}
```

---

## 3. Template Literal Types — Endpoint Type Safety

### The Problem

```typescript
// Without template literal types:
// Any string is a valid endpoint — you can typo the path and TypeScript won't catch it
async function callEndpoint(path: string) {
  return request.get(path);
}
callEndpoint("/api/v2/citations/CIT-001"); // ✅
callEndpoint("/api/v2/citaions/CIT-001"); // ✅ TypeScript: no error. Runtime: 404
callEndpoint("not-even-a-path"); // ✅ TypeScript: no error. Runtime: error
```

### Template Literal Types Solution

```typescript
// Define which methods and versions are valid:
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
type ApiVersion = 'v1' | 'v2' | 'v3';
type ServiceName = 'citations' | 'users' | 'notifications' | 'ivr';

// Compose a type-safe path format:
type ApiPath = `/api/${ApiVersion}/${ServiceName}` | `/api/${ApiVersion}/${ServiceName}/${string}`;

// Now the function only accepts valid-format paths:
async function callTypeSafeEndpoint(method: HttpMethod, path: ApiPath) {
  return request[method.toLowerCase() as Lowercase<HttpMethod>](../path);
}

callTypeSafeEndpoint('GET', '/api/v2/citations/CIT-001');   // ✅
callTypeSafeEndpoint('GET', '/api/v2/citaions/CIT-001');    // ❌ TypeScript error: 'citaions' not in ServiceName
callTypeSafeEndpoint('FETCH', '/api/v2/citations');          // ❌ TypeScript error: 'FETCH' not in HttpMethod
```

### Template Literal Types for Event Names

```typescript
// Typed event names for Playwright's waitForEvent
type PageEventName =
  | "close"
  | "console"
  | "crash"
  | "dialog"
  | "domcontentloaded"
  | "download"
  | "filechooser"
  | "frameattached"
  | "framedetached"
  | "framenavigated"
  | "load"
  | "pageerror"
  | "popup"
  | "request"
  | "requestfailed"
  | "requestfinished"
  | "response"
  | "websocket"
  | "worker";

// Better: use Playwright's own types
import { type Page } from "@playwright/test";
type PageEvent = Parameters<Page["waitForEvent"]>[0];

async function waitForPageEvent(
  page: Page,
  event: PageEvent,
): Promise<unknown> {
  return page.waitForEvent(event as any);
}
```

---

## 4. Conditional Types — Smart Return Types

### The Problem

```typescript
// Without conditional types: you sometimes want the raw response, sometimes just the body
async getById(id: string): Promise<CitationApiResponse> { ... }
// But for 404 tests, you want the raw response to check the status code:
// You end up writing two separate methods — getById() and getByIdRaw()
```

### Conditional Types Solution

```typescript
// The return type depends on a parameter at compile time:
type ResponseFormat = "body" | "raw";

type GetResult<F extends ResponseFormat, T> = F extends "body"
  ? T // If format is 'body', return T
  : F extends "raw"
    ? ApiResponse<T> // If format is 'raw', return ApiResponse<T>
    : never;

class CitationsApiClient {
  async getById<F extends ResponseFormat = "body">(
    citationId: string,
    format?: F,
  ): Promise<GetResult<F, CitationApiResponse>> {
    const response = await this.api.get<CitationApiResponse>(
      Endpoints.citations.getById(citationId),
    );

    if (format === "raw") {
      return response as GetResult<F, CitationApiResponse>;
    }
    return response.body as GetResult<F, CitationApiResponse>;
  }
}

// Usage:
const citation = await citationsClient.getById("CIT-001");
//    ↑ TypeScript knows this is CitationApiResponse (default: 'body')

const rawResponse = await citationsClient.getById("CIT-001", "raw");
//    ↑ TypeScript knows this is ApiResponse<CitationApiResponse>
expect(rawResponse.status).toBe(200);
expect(rawResponse.body.citationId).toBe("CIT-001");

// 404 test:
const notFound = await citationsClient.getById("DOES-NOT-EXIST", "raw");
//    ↑ TypeScript knows this is ApiResponse<CitationApiResponse>
expect(notFound.status).toBe(404);
```

---

## 5. The `satisfies` Operator — Config Validation

### The Problem

```typescript
// Without satisfies: TypeScript widens the type and loses specificity
const config = {
  crmUrl: "https://staging-crm.company.com",
  roles: ["ADMIN", "AGENT"],
};
// config.roles is string[] — TypeScript lost that it's specifically ['ADMIN', 'AGENT']
// config.crmUrl is string — TypeScript lost that it's this specific URL
```

### `satisfies` Solution

```typescript
// satisfies validates that the object matches a type
// but KEEPS the literal types (doesn't widen to string[])

type EnvironmentConfig = {
  crmUrl: string;
  apiBaseUrl: string;
  roles: string[];
  timeouts: { default: number; d365: number; api: number };
};

const stagingConfig = {
  crmUrl: "https://staging-crm.company.com",
  apiBaseUrl: "https://staging-api.company.com",
  roles: ["ADMIN", "AGENT", "SUPERVISOR"] as const,
  timeouts: { default: 30_000, d365: 60_000, api: 15_000 },
} satisfies EnvironmentConfig;
// ↑ TypeScript validates: does this match EnvironmentConfig? Yes ✅
// And also: stagingConfig.crmUrl is the exact literal string (not just "string")
//           stagingConfig.roles is readonly ['ADMIN', 'AGENT', 'SUPERVISOR'] (not string[])

// Why this matters for tests:
stagingConfig.roles[0]; // TypeScript: 'ADMIN' — the exact literal, not string
// You can use this to generate typed test scenarios from the roles list
```

### `satisfies` for Payload Validation

```typescript
type CreateCitationPayload = {
  customerId: string;
  amount: number;
  status: "PENDING" | "PAID" | "DISPUTED";
  citationType: "PARKING" | "SPEEDING" | "BUS_LANE";
};

// Validate payload shape at definition time, keep literals:
const testPayload = {
  customerId: "USR-001",
  amount: 150,
  status: "PENDING",
  citationType: "PARKING",
  // Imagine a typo here: citationType: 'PRKING'
  // satisfies catches it at definition time ← not at runtime
} satisfies CreateCitationPayload;
//  ↑ TypeScript error if 'PRKING' is not in the union — instant feedback in VS Code
```

---

## 6. Mapped Types — Generating POM Locator Registries

### The Problem

```typescript
// For large POMs with 200+ locators, you want to:
// 1. Define locator names as a type-safe registry
// 2. Ensure every registered locator name has a corresponding selector
// 3. Provide type completion when accessing locators

// Without mapped types: you duplicate the registry as both interface + object
interface LocatorNames {
  searchInput: string;
  searchButton: string;
  resultsGrid: string;
  firstResultRow: string;
  // ...200 more...
}
// Then you implement it:
const selectors: LocatorNames = {
  searchInput: "#searchInput",
  searchButton: "#searchBtn",
  // TypeScript checks these match LocatorNames — but it's still verbose
};
```

### Mapped Types Solution

```typescript
// A typed locator dictionary that enforces completeness

// Step 1: Define the valid locator names
const LOCATOR_NAMES = [
  "searchInput",
  "searchButton",
  "resultsGrid",
  "firstResultRow",
  "paginationNext",
  "statusDropdown",
  "dateFromPicker",
  "dateToPicker",
  "exportButton",
  "filterPanel",
] as const;

type LocatorName = (typeof LOCATOR_NAMES)[number];
// = 'searchInput' | 'searchButton' | 'resultsGrid' | 'firstResultRow' | ...

// Step 2: Create a MAPPED type that requires a selector for every locator name
type LocatorMap = {
  [K in LocatorName]: string; // Every key in LocatorName must map to a string (the CSS selector)
};

// Step 3: Implement — TypeScript enforces ALL names are present
const MasterSearchLocators: LocatorMap = {
  searchInput: '[data-automation-key="searchInput"]',
  searchButton: '[data-automation-key="searchButton"]',
  resultsGrid: ".ms-DetailsList",
  firstResultRow: ".ms-DetailsList-row:first-child",
  paginationNext: ".pager-next",
  statusDropdown: "#statusFilter",
  dateFromPicker: "#dateFrom",
  dateToPicker: "#dateTo",
  exportButton: '[data-testid="exportBtn"]',
  filterPanel: ".filter-panel",
  // If you forget one, TypeScript error: "Property 'exportButton' is missing"
};

// Step 4: Build locators from the map in the POM
class MasterSearchPage {
  readonly locators: Record<LocatorName, Locator>;

  constructor(page: Page) {
    // Build all locators from the map — type-safe, completeness enforced
    this.locators = Object.fromEntries(
      Object.entries(MasterSearchLocators).map(([name, selector]) => [
        name,
        page.locator(selector),
      ]),
    ) as Record<LocatorName, Locator>;
  }

  // Access with full TypeScript autocomplete:
  get searchInput(): Locator {
    return this.locators.searchInput;
  }
  //                                                ↑ TypeScript shows all valid names
}
```

---

## 7. Utility Types for Test Data

TypeScript's built-in utility types are extremely useful in test payloads:

```typescript
// ── Required<T> ── All optional fields become required ──────────────────────
interface CreateCitationPayload {
  customerId: string;
  amount?: number; // optional
  status?: CitationStatus; // optional
}

type FullCitationPayload = Required<CreateCitationPayload>;
// { customerId: string; amount: number; status: CitationStatus }
// Useful for complete test payloads where you want EVERY field

// ── Partial<T> ── All required fields become optional ───────────────────────
// Used for update payloads (PATCH — only send what changes):
type UpdateCitationPayload = Partial<CreateCitationPayload>;
// { customerId?: string; amount?: number; status?: CitationStatus }

// ── Pick<T, K> ── Take only specific fields ──────────────────────────────────
type CitationStatusUpdate = Pick<CreateCitationPayload, "status">;
// { status?: CitationStatus }
// Useful when an endpoint only accepts certain fields

// ── Omit<T, K> ── Exclude specific fields ───────────────────────────────────
type CitationPayloadWithoutId = Omit<CreateCitationPayload, "customerId">;
// { amount?: number; status?: CitationStatus }
// Useful when the endpoint derives the ID from the URL, not the body

// ── Readonly<T> ── Prevent mutation ──────────────────────────────────────────
const testConfig: Readonly<EnvironmentConfig> = stagingConfig;
// testConfig.crmUrl = 'other';  // ❌ TypeScript error: cannot assign to read-only
// Ensures test configuration is never accidentally mutated during a test run
```

---

## 8. The `Extract` and `Exclude` Utility Types

Useful for narrowing existing union types:

```typescript
type CitationStatus = "PENDING" | "PAID" | "OVERDUE" | "DISPUTED" | "CANCELLED";

// Extract: keep only the statuses that represent "closed" states
type ClosedStatus = Extract<CitationStatus, "PAID" | "CANCELLED">;
// = 'PAID' | 'CANCELLED'

// Exclude: remove specific statuses from the union
type ActiveStatus = Exclude<CitationStatus, "CANCELLED">;
// = 'PENDING' | 'PAID' | 'OVERDUE' | 'DISPUTED'

// Practical use: test data factories typed to specific subsets
function createTestCitation(status: ActiveStatus): CreateCitationPayload {
  // TypeScript prevents: createTestCitation('CANCELLED')
  // Only active statuses are valid for this factory
  return PayloadsCitation.pending({ status });
}

// Extract response fields you care about for assertions:
type CitationAssertionData = Pick<
  CitationApiResponse,
  Extract<
    keyof CitationApiResponse,
    "citationId" | "status" | "amount" | "customerId"
  >
>;
// = { citationId: string; status: string; amount: number; customerId: string }
```

---

## 9. `infer` — Extracting Types from Function Return Values

```typescript
// Sometimes you need the return type of an existing function
// without manually duplicating the interface

// Example: Your APIUtils.get<T> returns Promise<ApiResponse<T>>
// You want a type that represents "whatever get() returns for citations"

type CitationGetResult = Awaited<ReturnType<typeof citationsClient.getById>>;
// Step 1: ReturnType<...> extracts the return type → Promise<CitationApiResponse>
// Step 2: Awaited<...> unwraps the Promise → CitationApiResponse

// This way, if getById's return type changes, CitationGetResult updates automatically
// No manual maintenance needed

// Using infer directly:
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type BodyOf<T extends (...args: any[]) => Promise<ApiResponse<any>>> =
  T extends (...args: any[]) => Promise<ApiResponse<infer B>> ? B : never;

// Practical: extract the body type from a client method
type CitationBody = BodyOf<typeof citationsClient.getById>;
// = CitationApiResponse
```

---

## 10. Branded Types — Preventing ID Mix-ups

### The Problem

```typescript
// All IDs are just strings.
function getCitation(citationId: string, customerId: string) { ... }

// You can accidentally swap them, and TypeScript won't complain:
const customerId = 'CUST-123';
const citationId = 'CIT-456';

getCitation(customerId, citationId); // ❌ Logic bug, but TypeScript says ✅
```

### Branded Types Solution

We can "brand" strings so TypeScript treats them as distinct, incompatible types without changing their runtime behaviour.

```typescript
// Define a utility type for branding
type Brand<K, T> = K & { __brand: T };

// Create distinct types for our IDs
type CitationId = Brand<string, 'CitationId'>;
type CustomerId = Brand<string, 'CustomerId'>;

// Now update the function:
function getCitation(citationId: CitationId, customerId: CustomerId) { ... }

// You MUST cast when initially creating the IDs, usually at the API/Factory boundary
const customerId = 'CUST-123' as CustomerId;
const citationId = 'CIT-456' as CitationId;

// Type safety in action:
getCitation(citationId, customerId); // ✅ Correct
getCitation(customerId, citationId); // ❌ TypeScript Error: Argument of type 'CustomerId' is not assignable to parameter of type 'CitationId'.
```

---

## 11. Type Narrowing Deep Dive

### The Problem

When interacting with APIs or the DOM, you often get a broad type like `unknown` or a wide union like `Element | null`. You need to safely "narrow" it to a specific type before using it.

### Solution: Type Guards & `in` Operator

```typescript
type ErrorResponse = { error: string; code: number };
type SuccessResponse = { data: any[]; total: number };

// 1. Using the 'in' operator to narrow unions
function processResponse(response: ErrorResponse | SuccessResponse) {
  if ("error" in response) {
    // TypeScript now knows `response` is ErrorResponse
    console.log(`Failed with code ${response.code}`);
  } else {
    // TypeScript knows `response` is SuccessResponse
    console.log(`Got ${response.total} items`);
  }
}

// 2. Custom Type Guards (User-Defined Type Guards)
// Returns a boolean, but also tells TypeScript the type if true
function isErrorResponse(res: any): res is ErrorResponse {
  return (
    res !== null && typeof res === "object" && "error" in res && "code" in res
  );
}

async function testApi() {
  const apiResult: unknown = await fetch("/api").then((r) => r.json());

  if (isErrorResponse(apiResult)) {
    // apiResult is now strongly typed as ErrorResponse
    console.log(apiResult.code); // ✅ TypeScript knows code exists
  }
}
```

This is heavily used when intercepting raw network payloads (`route.fulfill()`), validating `storageState` files, or parsing test configuration files where the initial type is `unknown`.

---

## 🏋️ Practice Challenges

### Challenge 1 [MCQ] — Generic vs `any`

```typescript
// Option A:
async get(url: string): Promise<any> {
  return (await this.request.get(url)).json();
}

// Option B:
async get<T>(url: string): Promise<T> {
  return (await this.request.get(url)).json() as T;
}
```

What does Option A lose compared to Option B?

A) Option A is slower at runtime  
B) Option A compiles fine, but the caller gets type `any` — no autocomplete, no type checking on the result, errors compile silently  
C) Option A throws if the response isn't valid JSON  
D) Option A requires more memory

<details><summary>Answer</summary>

**B** — With `Promise<any>`, the caller receives an `any` value. TypeScript treats `any` as "I don't know the type" and disables all type checking on it. You can write `result.notARealField.deeplynested` and TypeScript won't warn you — it only fails at runtime. With `Promise<T>`, the caller specifies the expected type and gets full autocomplete and compile-time checks.

```typescript
// With any:
const result = await client.get("/api/citations/CIT-001");
result.citationID; // ✅ TypeScript: no error. Runtime: undefined (it's citationId)

// With generic T:
const result = await client.get<CitationApiResponse>("/api/citations/CIT-001");
result.citationID; // ❌ TypeScript error: Property 'citationID' does not exist
result.citationId; // ✅ TypeScript: fine. Correct field name.
```

</details>

---

### Challenge 2 [Spot the Bug — Discriminated Union Exhaustiveness]

```typescript
type SearchMode =
  | { mode: "byId"; citationId: string }
  | { mode: "byUser"; userId: string }
  | { mode: "byDate"; dateFrom: string; dateTo: string };

function buildSearchQuery(search: SearchMode): string {
  if (search.mode === "byId") return `?citationId=${search.citationId}`;
  if (search.mode === "byUser") return `?userId=${search.userId}`;
  // ← What happens if someone adds a new variant to SearchMode?
}
```

**What's the bug? How do you make this future-proof?**

<details><summary>Answer</summary>

If a new variant is added to `SearchMode` (e.g., `{ mode: 'byStatus'; status: string }`), the function silently returns `undefined` for that case — TypeScript won't warn you because the return type is implicitly `string | undefined`.

Fix — use an exhaustiveness check with `never`:

```typescript
function buildSearchQuery(search: SearchMode): string {
  if (search.mode === "byId") return `?citationId=${search.citationId}`;
  if (search.mode === "byUser") return `?userId=${search.userId}`;
  if (search.mode === "byDate")
    return `?dateFrom=${search.dateFrom}&dateTo=${search.dateTo}`;

  // This line is only reachable if a new mode was added but not handled above
  const exhaustiveCheck: never = search;
  //    ↑ TypeScript error if search has any remaining variants
  //    Error: "Type '{ mode: 'byStatus'; ... }' is not assignable to type 'never'"
  throw new Error(`Unhandled search mode: ${exhaustiveCheck}`);
}
```

</details>

---

### Challenge 3 [Write It Yourself]

Write a `createTypedTest` generic helper that creates a test with a pre-created API resource:

- Takes a `createFn: () => Promise<T>` and a `deleteFn: (item: T) => Promise<void>`
- Returns a test that provides the created resource as a fixture named `resource`
- Cleans up after the test

<details><summary>Answer</summary>

```typescript
// utils/typed-test-builder.ts

import { test as base } from "@playwright/test";

export function createTypedTest<T>(
  createFn: () => Promise<T>,
  deleteFn: (item: T) => Promise<void>,
) {
  return base.extend<{ resource: T }>({
    resource: async ({}, use) => {
      const item = await createFn();
      await use(item);
      // Cleanup runs after the test, even on failure
      try {
        await deleteFn(item);
      } catch (e) {
        console.warn("[createTypedTest] Cleanup failed:", e);
      }
    },
  });
}

// Usage:
const citationTest = createTypedTest(
  () =>
    citationsClient.create(PayloadsCitation.pending({ customerId: "USR-001" })),
  (citation) => citationsClient.delete(citation.citationId),
);

// In spec:
citationTest("verify citation details", async ({ resource: citation }) => {
  expect(citation.status).toBe("PENDING");
  // citation is CitationApiResponse — fully typed
});
```

</details>

---

**Navigation**: [← Chapter 26: Flakiness Diagnosis](./26_Flakiness_Diagnosis_and_Fixing.md) | [Index](../00_INDEX.md) | [→ Chapter 28: Test Data Lifecycle](./28_Test_Data_Lifecycle_and_Cleanup.md)

### Challenge 4 [MCQ] — `satisfies` vs Type Annotation

```typescript
// Option A: type annotation
const config: EnvironmentConfig = {
  crmUrl: "https://staging-crm.company.com",
  roles: ["ADMIN", "AGENT"],
};

// Option B: satisfies
const config = {
  crmUrl: "https://staging-crm.company.com",
  roles: ["ADMIN", "AGENT"],
} satisfies EnvironmentConfig;
```

Both validate against `EnvironmentConfig`. What is the key difference in how TypeScript infers types for each?

A) Option A is checked at runtime; Option B is checked at compile time
B) Option A widens `config.crmUrl` to `string` and `config.roles` to `string[]`; Option B retains the literal types `'https://staging-crm.company.com'` and `readonly ['ADMIN', 'AGENT']`
C) Option B is only valid in TypeScript 5.0+; Option A works in all versions
D) There is no difference — both produce identical types

<details><summary>Answer</summary>

**B** — This is the key distinction:

With type annotation (Option A):

```typescript
config.crmUrl; // type: string  (widened — all specificity lost)
config.roles; // type: string[] (widened — could be any strings)
```

TypeScript validates the SHAPE matches `EnvironmentConfig` but then widens the inferred types to match the annotation. You lose the literal values.

With `satisfies` (Option B):

```typescript
config.crmUrl; // type: 'https://staging-crm.company.com'  (literal retained)
config.roles; // type: string[]  (not narrowed further without `as const`)
```

`satisfies` validates the shape AND preserves the most specific type the compiler can infer. The annotation doesn't overwrite the inferred type — it only checks compatibility.

For test configuration, the practical benefit: literal types enable exhaustive switch statements and prevent invalid values at compile time, rather than only discovering them at runtime when the wrong URL is used.

Note: `satisfies` was introduced in TypeScript 4.9 (November 2022).

</details>

---

### Challenge 5 [Spot the Bug — Generic Constraint]

```typescript
async function createAndAssert<T>(
  createFn: () => Promise<T>,
  expectedId: string,
): Promise<T> {
  const result = await createFn();
  expect(result.id).toBe(expectedId); // ← TypeScript error here
  return result;
}
```

TypeScript reports: `Property 'id' does not exist on type 'T'`. What is the fix, and why does this error occur?

<details><summary>Answer</summary>

The error occurs because `T` is unconstrained — it could be `string`, `number`, `boolean`, or any type. TypeScript cannot guarantee that type `T` has an `id` property. The generic is too wide.

The fix is to add a **constraint** to `T` using `extends`:

```typescript
// Define a minimum shape that T must satisfy:
interface HasId {
  id: string;
}

// Constrain T to only types that have an `id` field:
async function createAndAssert<T extends HasId>(
  createFn: () => Promise<T>,
  expectedId: string,
): Promise<T> {
  const result = await createFn();
  expect(result.id).toBe(expectedId); // ✅ TypeScript knows T has .id
  return result;
}
```

Now TypeScript guarantees:

- `T` must have at least `{ id: string }` — any additional fields are allowed
- The function works with `CitationApiResponse` (which has `.citationId`, not `.id`)? No — you'd need to adapt to the actual field name. The real pattern uses a key extractor:

```typescript
async function createAndAssert<T>(
  createFn: () => Promise<T>,
  getId: (result: T) => string, // caller specifies how to extract the ID
  expectedId: string,
): Promise<T> {
  const result = await createFn();
  expect(getId(result)).toBe(expectedId); // ✅ no constraint needed
  return result;
}

// Usage:
await createAndAssert(
  () =>
    citationsClient.create(PayloadsCitation.pending({ customerId: "USR-001" })),
  (citation) => citation.citationId, // caller provides the extractor
  "CIT-001",
);
```

This is the pattern used by the `TestDataFactory` from Section 1 — it takes a `getId` function rather than assuming a specific property name.

</details>

---

**Navigation**: [← Chapter 26: Flakiness Diagnosis](./26_Flakiness_Diagnosis_and_Fixing.md) | [Index](../00_INDEX.md) | [→ Chapter 28: Test Data Lifecycle](./28_Test_Data_Lifecycle_and_Cleanup.md)


---

## Reality Check

**"TypeScript types are runtime checks"** ? TypeScript types are COMPILE-TIME only. They are completely erased during transpilation to JavaScript. A function typed as accepting a string will happily receive a number at runtime if the value comes from an untyped source (API response, environment variable, JSON.parse). Use runtime validation (Zod, io-ts) at system boundaries where untyped data enters your typed code.

**"any type is acceptable when you are stuck"** ? Every any annotation disables TypeScript's entire type checking chain for that value. A function returning any infects every consumer: const user: any = getUser(); user.nonExistent.method() compiles successfully but crashes at runtime. Use unknown for values whose type you do not know � it forces you to narrow the type before using it, catching errors at compile time.

**"Generics are an advanced feature most SDETs do not need"** ? Generics make test utilities type-safe: a createFixture<T> function that returns a typed T instead of any, a Page Object base class that types its locators, or an API client that types its responses. Without generics, test utilities return any, losing all type safety benefits. Generics are essential for building reusable, type-safe test infrastructure.

**"Type assertions (as Type) are safe"** ? Type assertions tell the compiler to trust you, not verify you. const data = JSON.parse(input) as UserData compiles regardless of what input actually contains. If input is malformed, you get runtime errors at usage sites far from the assertion. Use type guards (if ('name' in data)) or validation libraries for safe narrowing.

**"Strict TypeScript configuration slows development"** ? strict mode (strictNullChecks, noImplicitAny, strictFunctionTypes) catches bugs at compile time that would otherwise surface as flaky tests at runtime. A locator method that might return null throws a compile error instead of a runtime TypeError in CI at 2 AM. The upfront cost of satisfying the compiler saves debugging time that is 10x more expensive.
