# 05. Data From API To Test — The Bridge Pattern

**Navigation**: [â† Previous: APIUtils & Factory Pattern](04_API_Utils_Factory_Pattern.md) | [Index](../00_MASTER_INDEX.md) | [Next: DB Testing SQL Bridge →](06_DB_Testing_SQL_Bridge.md)

**Cross-links:**
- [`21_SDET/07_test_step_E2E_Architecture.md`](../21_SDET_Playwright_Automation/07_test_step_E2E_Architecture.md) — Data Accumulator pattern in E2E tests
- [`17_TypeScript/02_TS_Advanced_Types.md`](../17_TypeScript/02_TS_Advanced_Types.md) — Typed interfaces for response bodies

---

## 5W1H — Why This Chapter?

- **WHAT**: How to correctly extract data from an API response, store it in a typed TypeScript structure, and use it in subsequent test steps — including UI interactions, further API calls, and DB verification.
- **WHY**: The most common SDET mistake is accessing response data unsafely (no type checking, no null guards) or storing it in variables that get corrupted by parallel test execution. Both create flaky tests that are hard to debug.
- **WHO**: SDETs who fetch data from APIs in early test steps and need it available later in the same test.
- **WHEN**: In any test with more than 2 steps where Step N uses data from Step 1.
- **HOW**: By dissecting your exact `getCitationIdFromDateRangeResponse` and `fetchCitationDetails` patterns, typing them, and extending them to real multi-step scenarios.

---

## 1. The Core Problem — Unsafe Data Extraction

```typescript
// âŒ DANGEROUS — no type safety, no null protection
const response = await request.post('/api/citations/search', { data: payload });
const body = await response.json(); // type: any

const citationId = body.citations[0].citationId;
// If citations is empty: TypeError: Cannot read properties of undefined (reading 'citationId')
// If citations key is renamed in the API: returns undefined, test fails somewhere else
// If the API changes the response shape: you find out at runtime, not compile time
```

```typescript
// ✅ SAFE — typed + null-guarded
interface Citation {
  citationId: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'DISPUTED';
  amount: number;
  customerId: string;
  issueDate: string;
}

interface CitationSearchResponse {
  citations: Citation[];
  totalCount: number;
  pageNumber: number;
  hasNextPage: boolean;
}

const response = await request.post('/api/citations/search', { data: payload });
const body: CitationSearchResponse = await response.json();
//           ↑ TypeScript now enforces the shape

const citationId = body?.citations?.[0]?.citationId ?? null;
// Optional chaining: returns null if any part is missing — never throws
// TypeScript knows citationId is: string | null
```

---

## 2. Your `getCitationIdFromDateRangeResponse` — Full Analysis

```typescript
// Your function — analysed:
export async function getCitationIdFromDateRangeResponse(
  request: APIRequestContext,
  daysBefore: number,
  daysAfter: number,
  testInfo?: TestInfo
): Promise<string | null> {

  // Step 1: Fetch all citations in the date range
  const responseBody = await fetchCitationsBasedOnDateRange(request, daysBefore, daysAfter, testInfo);
  // responseBody is the full API response

  // Step 2: Extract the first citation ID safely
  if (responseBody.citations && responseBody.citations.length > 0) {
    const firstCitationId = responseBody.citations[0].citationId;
    return firstCitationId;
  }

  // Step 3: Return null if no citations found (instead of throwing)
  return null;
}
```

**Issues with this code (and how to improve it):**

```typescript
// Issue 1: responseBody.citations could be undefined
// if (responseBody.citations && ...) handles this, but optional chaining is cleaner:
const citationId = responseBody?.citations?.[0]?.citationId ?? null;

// Issue 2: You often need MORE than just the first citation ID
// What if you need status, customerId, amount too?
// Return the whole Citation object, not just the ID:
export async function getFirstCitationFromDateRange(
  request: APIRequestContext,
  daysBefore: number,
  daysAfter: number,
  testInfo?: TestInfo
): Promise<Citation | null> {
  const body = await fetchCitationsBasedOnDateRange(request, daysBefore, daysAfter, testInfo);
  return body?.citations?.[0] ?? null;
}

// Issue 3: What if you need citations matching a specific status?
// Add a filter parameter:
export async function getFirstCitationByStatus(
  request: APIRequestContext,
  status: Citation['status'], // â† TypeScript: only 'PAID' | 'PENDING' | 'OVERDUE' | 'DISPUTED'
  daysBefore = 30,
  daysAfter = 0,
  testInfo?: TestInfo
): Promise<Citation | null> {
  const body = await fetchCitationsBasedOnDateRange(request, daysBefore, daysAfter, testInfo);
  return body?.citations?.find(c => c.status === status) ?? null;
}
```

---

## 3. Type-Safe Response Interfaces — Build These First

Before writing any API function, define the TypeScript interface. This forces you to understand the API contract.

```typescript
// interfaces/ApiResponses.ts

// ─── Citation API ──────────────────────────────────────────────────────────
export interface Citation {
  citationId: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'DISPUTED';
  amount: number;
  customerId: string;
  vehicleId: string;
  issueDate: string;          // ISO date string: '2024-01-15'
  dueDate: string;
  history?: CitationHistoryEntry[];  // optional — not always returned
}

export interface CitationHistoryEntry {
  eventDate: string;
  eventType: 'CREATED' | 'UPDATED' | 'PAID' | 'APPEALED';
  agentId: string;
  notes?: string;
}

export interface CitationSearchResponse {
  citations: Citation[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  hasNextPage: boolean;
}

// ─── Customer API ──────────────────────────────────────────────────────────
export interface Customer {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addresses: Address[];
}

export interface Address {
  type: 'HOME' | 'BILLING' | 'MAILING';
  street: string;
  city: string;
  state: string;
  zip: string;
}

// ─── Complex nested response (real enterprise shape) ───────────────────────
export interface OrderDetailsResponse {
  order: {
    orderId: string;
    status: string;
    customer: {
      customerId: string;
      name: string;
    };
    lineItems: Array<{
      itemId: string;
      quantity: number;
      unitPrice: number;
      discounts?: Array<{
        code: string;
        percentage: number;
      }>;
    }>;
    payments: Array<{
      paymentId: string;
      amount: number;
      method: 'CARD' | 'CASH' | 'BANK_TRANSFER';
      processedAt: string;
    }>;
  };
}
```

---

## 4. Extracting Data From Complex Nested Responses

Real enterprise APIs return deeply nested objects. Here is how to extract safely:

```typescript
// Given this complex response:
const body: OrderDetailsResponse = await response.json();

// âŒ UNSAFE chains:
const customerId = body.order.customer.customerId;              // throws if order is null
const firstPaymentAmount = body.order.payments[0].amount;      // throws if payments is empty
const firstDiscount = body.order.lineItems[0].discounts[0].code; // throws at MULTIPLE points

// ✅ SAFE with optional chaining:
const customerId = body?.order?.customer?.customerId ?? 'UNKNOWN';
const firstPaymentAmount = body?.order?.payments?.[0]?.amount ?? 0;
const firstDiscount = body?.order?.lineItems?.[0]?.discounts?.[0]?.code ?? 'NO_DISCOUNT';

// ✅ Extracting arrays with type safety:
const allPaymentAmounts: number[] = body?.order?.payments?.map(p => p.amount) ?? [];
const paidItems = body?.order?.lineItems?.filter(item => item.quantity > 0) ?? [];

// ✅ Using find() to locate a specific item:
const bankTransfer = body?.order?.payments?.find(p => p.method === 'BANK_TRANSFER');
if (bankTransfer) {
  console.log(`Bank transfer amount: ${bankTransfer.amount}`);
}
```

---

## 5. Storing Multiple IDs — Working With Arrays

Sometimes you need to fetch multiple records and use each one in a test step:

```typescript
interface TestData {
  citationIds: string[];           // multiple IDs
  paidCitations: Citation[];       // multiple full objects
  citationsByStatus: Map<string, Citation[]>;  // grouped by status
}

const data: TestData = {
  citationIds: [],
  paidCitations: [],
  citationsByStatus: new Map(),
};

await test.step('Fetch all citations for the month', async () => {
  const body: CitationSearchResponse = await fetchCitationsForMonth(request);

  // Extract all IDs
  data.citationIds = body.citations.map(c => c.citationId);

  // Filter to only paid citations
  data.paidCitations = body.citations.filter(c => c.status === 'PAID');

  // Group by status using Map (faster than repeated .filter calls)
  body.citations.forEach(citation => {
    const existing = data.citationsByStatus.get(citation.status) ?? [];
    data.citationsByStatus.set(citation.status, [...existing, citation]);
  });

  expect(data.citationIds.length).toBeGreaterThan(0);
});

// Use the collected data across subsequent steps:
await test.step(`Verify ${data.citationIds.length} citations appear in UI search`, async () => {
  for (const id of data.citationIds.slice(0, 5)) { // first 5 only, for performance
    await page.fill('#citationSearch', id);
    await page.click('#searchButton');
    await expect(page.locator('.result-row')).toBeVisible();
  }
});

await test.step('Verify paid citation count in UI summary', async () => {
  const paidCount = data.paidCitations.length;
  await expect(page.locator('#paidCountSummary')).toHaveText(`${paidCount} Paid`);
});
```

---

## 6. The API → UI Bridge — Using API Data in UI Steps

The most common E2E pattern: **get data from API, use it in the UI, verify the UI matches the API**.

```typescript
interface E2EData {
  // From API
  citation: Citation | null;
  // From UI (extracted after search)
  uiCitationStatus: string | null;
  uiCitationAmount: string | null;
}

const data: E2EData = { citation: null, uiCitationStatus: null, uiCitationAmount: null };

// Step 1: Get citation from API
await test.step('Get citation details from IVR API', async () => {
  const apilib = new APIUtils(request, testInfo);
  const response = await apilib.postCallWithResponseCodeValidation(
    endpoints.IVRAPI_CITATION_SEARCH,
    HeadersCrm.getCrmHeader(),
    PayloadCrm.createCitationSearchByIdPayload('CIT-001'),
    200
  );
  const body: CitationSearchResponse = await response.json();
  data.citation = body?.citations?.[0] ?? null;
  expect(data.citation, 'Citation not found in API').not.toBeNull();
});

// Step 2-4: UI navigation (using data.citation from Step 1)
await test.step(`Search for citation ${data.citation!.citationId} in Master Search`, async () => {
  await page.fill('#citationNumberInput', data.citation!.citationId);
  await page.getByRole('button', { name: 'Search' }).nth(2).click();
});

await test.step('Wait for search results to load', async () => {
  await expect(page.locator('.ms-DetailsList-row')).toHaveCount({ minimum: 1 }, { timeout: 30000 });
});

// Step 5: Extract what the UI shows and store it
await test.step('Read citation details from UI result row', async () => {
  const resultRow = page.locator('.ms-DetailsList-row').first();
  data.uiCitationStatus = await resultRow.locator('[data-col="status"]').textContent();
  data.uiCitationAmount = await resultRow.locator('[data-col="amount"]').textContent();
});

// Step 6: Cross-verify — API data matches UI data
await test.step('Verify UI displays data matching the API response', async () => {
  expect(data.uiCitationStatus?.trim()).toBe(data.citation!.status);
  expect(data.uiCitationAmount?.replace(/[^0-9.]/g, '')).toBe(
    data.citation!.amount.toString()
  );
});
```

---

## 7. Parameterised Tests — Running Against Multiple APIs

Your codebase tests the same citation search against 3 APIs (IVR, ASD, NW). Use `test.each()`:

```typescript
// test.each — run the same test with different parameters
const apiTestCases = [
  { apiType: ApiType.IVRAPI, endpoint: endpoints.IVRAPI_CITATION_SEARCH, name: 'IVR API' },
  { apiType: ApiType.ASDAPI, endpoint: endpoints.ASDAPI_CITATION_SEARCH, name: 'ASD API' },
  { apiType: ApiType.NWAPI,  endpoint: endpoints.NWAPI_CITATION_SEARCH,  name: 'NW API' },
] as const;

test.describe('Citation search — all API endpoints', () => {

  for (const { apiType, endpoint, name } of apiTestCases) {
    test(`Citation search via ${name}`, async ({ request, account }) => {
      const apilib = new APIUtils(request);
      const response = await apilib.postCallWithResponseCodeValidation(
        endpoint,
        HeadersCrm.getCrmHeader(),
        PayloadCrm.createCitationSearchByIdPayload('CIT-001'),
        200
      );
      const body: CitationSearchResponse = await response.json();
      expect(body.citations.length).toBeGreaterThan(0);
      expect(body.citations[0].citationId).toBe('CIT-001');
    });
  }

});
// Generates 3 tests: "Citation search via IVR API", "via ASD API", "via NW API"
// All 3 run in parallel across workers
```

---

## 8. Validating Complex API Responses

Your `validateCitationResponse(body)` function. Here is how to build robust validators:

```typescript
// utils/validators.ts

// Simple existence check
export function validateCitationResponse(body: unknown): body is CitationSearchResponse {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return Array.isArray(b.citations) && typeof b.totalCount === 'number';
}
// Usage: if (validateCitationResponse(body)) { body.citations... } â† typed!

// Deep validation with Playwright's expect
export async function assertCitationSearchResponse(
  body: CitationSearchResponse,
  expectedCitationId: string
): Promise<void> {
  // Top-level structure
  expect(body.citations, 'citations array missing').toBeDefined();
  expect(body.citations.length, 'citations array is empty').toBeGreaterThan(0);

  // Find the specific citation
  const target = body.citations.find(c => c.citationId === expectedCitationId);
  expect(target, `Citation ${expectedCitationId} not found in response`).toBeDefined();

  // Validate its fields
  expect(['PAID', 'PENDING', 'OVERDUE', 'DISPUTED']).toContain(target!.status);
  expect(target!.amount).toBeGreaterThan(0);
  expect(target!.customerId).toMatch(/^C-\d+$/); // expects format: C-12345
}
```

---

## ðŸ‹ï¸ Practice Challenges

**Challenge 1 (Optional Chaining):** An API sometimes returns:
- `{ data: { orders: [{ id: 'ORD-1', payment: { amount: 150 } }] } }`
- `{ data: { orders: [] } }` (empty)
- `{ data: null }`
- `{}` (completely empty)

Write a single safe expression to extract the first order's payment amount, returning `0` as the default.
<details><summary>Answer</summary>

```typescript
const amount = body?.data?.orders?.[0]?.payment?.amount ?? 0;
```
The `?.` handles null/undefined at each step. The `??` provides the default when the final result is null or undefined (including when `amount` is `0`, use `?? 0` carefully — `??` only triggers on null/undefined, not on `0`, which is correct here since `0` is a valid amount in some cases, but `0` as a default makes sense if amount is absent).
</details>

**Challenge 2 (Type Safety):** Your function signature is:
```typescript
async function getCitation(request, api, citationId): Promise<any>
```
Improve this function signature using:
1. A TypeScript enum for `api`
2. A typed return type instead of `Promise<any>`
3. An optional `testInfo` parameter
<details><summary>Answer</summary>

```typescript
async function getCitation(
  request: APIRequestContext,
  api: ApiType,              // enum: IVRAPI | ASDAPI | NWAPI
  citationId: string,
  testInfo?: TestInfo        // optional
): Promise<Citation | null> { // returns typed Citation or null — never any
  // implementation...
}
```
</details>

**Challenge 3 (Parameterised Testing):** You need to verify that citation status `'PAID'` appears correctly in the UI for 5 different citation IDs: `['CIT-001', 'CIT-002', 'CIT-003', 'CIT-004', 'CIT-005']`. Write the `test.each` structure (not the full implementation) that creates 5 separate tests, each with its own citation ID.
<details><summary>Answer</summary>

```typescript
const citationIds = ['CIT-001', 'CIT-002', 'CIT-003', 'CIT-004', 'CIT-005'];

for (const citationId of citationIds) {
  test(`PAID status displays correctly for ${citationId}`, async ({ page, request }) => {
    // 1. Fetch from API — verify it's PAID
    const body = await fetchCitationDetails(request, ApiType.IVRAPI, citationId);
    expect(body?.citations?.[0]?.status).toBe('PAID');
    
    // 2. Search in UI — verify UI shows PAID
    await page.fill('#citationSearch', citationId);
    await page.click('#searchButton');
    await expect(page.locator('[data-col="status"]').first()).toHaveText('PAID');
  });
}
// Creates 5 named tests, can run in parallel
```
</details>


---

### Challenge 4 [Spot the Bug — Shared Mutable State Between Tests]

```typescript
// fixtures/citations.fixture.ts
let citationId: string;  // ← module-level mutable state

export const test = base.extend({
  createdCitation: async ({ request }, use) => {
    const res = await request.post('/api/citations', { data: { amount: 100 } });
    citationId = (await res.json()).id;  // stored in module-level var
    await use(citationId);
  }
});

// Worker 1: test A sets citationId = 'CIT-001'
// Worker 2: test B simultaneously sets citationId = 'CIT-002'
// Worker 1: test A now reads citationId and gets 'CIT-002' ← WRONG
```

Why does this cause subtle data corruption in parallel runs, and what is the correct fix?

<details><summary>Answer</summary>

**Root cause**: `citationId` is a module-level variable. In a Playwright multi-worker setup, Node.js workers are separate processes so the module variable isn't actually shared across *workers*. However, if tests within the **same worker** are running sequentially and the fixture doesn't clean up properly, subsequent tests in that worker inherit the previous test's `citationId`.

More critically: this pattern breaks if `createdCitation` is called twice in the same test or fixture chain — the second call silently overwrites `citationId`.

**Fix**: Store the fixture data inside the fixture closure — never in module-level mutable state:
```typescript
export const test = base.extend<{ createdCitation: string }>({
  createdCitation: async ({ request }, use) => {
    const res = await request.post('/api/citations', { data: { amount: 100 } });
    const { id } = await res.json();
    // 'id' is scoped to this fixture invocation — safe, isolated, parallel-proof
    await use(id);
    // Teardown: clean up after ourselves
    await request.delete(`/api/citations/${id}`);
  }
});
```

Each test gets its own fresh `id` in its own fixture scope. No mutation, no leakage.

</details>

---

### Challenge 5 [MCQ — Data Accumulator Pattern]

You are writing a multi-step E2E test:
1. Create a customer via POST `/api/customers` → get `customerId`
2. Create a citation for that customer via POST `/api/citations` → get `citationId`
3. Process payment via POST `/api/payments` → need both `customerId` + `citationId`
4. Verify notification via GET `/api/notifications?userId=X` → need `customerId`

What is the cleanest way to pass `customerId` and `citationId` through all 4 steps?

A) Use `let` variables declared at the top of the test function and mutate them in each step.  
B) Chain Promises and pass data through `.then()` callbacks.  
C) Use a typed accumulator object declared once and progressively populated inside the test body.  
D) Store them in `process.env` so all steps can access them.

<details><summary>Answer</summary>

**C** — A typed accumulator object:

```typescript
test('Full citation payment flow', async ({ request }) => {
  // Accumulator: typed, mutable within this test scope only
  const testData: {
    customerId?: string;
    citationId?: string;
    paymentRef?: string;
  } = {};

  // Step 1
  const customerRes = await request.post('/api/customers', { data: { name: 'Test User' } });
  testData.customerId = (await customerRes.json()).id;

  // Step 2
  const citationRes = await request.post('/api/citations', {
    data: { customerId: testData.customerId, amount: 150 }
  });
  testData.citationId = (await citationRes.json()).id;

  // Step 3
  const paymentRes = await request.post('/api/payments', {
    data: { citationId: testData.citationId, amount: 150 }
  });
  testData.paymentRef = (await paymentRes.json()).reference;

  // Step 4 — verify
  const notifRes = await request.get(`/api/notifications?userId=${testData.customerId}`);
  const body = await notifRes.json();
  expect(body.notifications.some((n: any) => n.reference === testData.paymentRef)).toBe(true);
});
```

Why not A? `let` works but is syntactically noisier and doesn't type-check the shape of accumulated data.  
Why not D? `process.env` is global, not test-scoped — it leaks between parallel workers.

</details>

---
**Navigation**: [← Previous: APIUtils & Factory Pattern](04_API_Utils_Factory_Pattern.md) | [Index](../00_MASTER_INDEX.md) | [Next: DB Testing SQL Bridge →](06_DB_Testing_SQL_Bridge.md)
