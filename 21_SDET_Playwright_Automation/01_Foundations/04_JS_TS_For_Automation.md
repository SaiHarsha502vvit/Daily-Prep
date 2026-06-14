# 04. JavaScript & TypeScript for Test Automation — Zero to Production

**Navigation**: [← Previous: Browser Console Scripting](./03_Browser_Console_Scripting.md) | [Index](../../00_MASTER_INDEX.md) | [Next: POM Architecture →](../02_Core_Architecture/05_POM_Architecture_Deep_Dive.md)

**Cross-links (read these alongside this chapter):**

- [`16_JavaScript/04_JS_Async_Promises.md`](../../16_JavaScript/04_JS_Async_Promises.md) — deep dive on the event loop
- [`17_TypeScript/01_TS_Foundations.md`](../../17_TypeScript/01_TS_Foundations.md) — complete TypeScript reference
- [`17_TypeScript/02_TS_Advanced_Types.md`](../../17_TypeScript/02_TS_Advanced_Types.md) — `as const`, union types

---

## 5W1H — Why This Chapter?

- **WHAT**: Every JavaScript and TypeScript concept you need to read, write, and debug Playwright tests confidently.
- **WHY**: If you don't understand `async/await`, your tests will have silent bugs that pass when they shouldn't. If you don't understand TypeScript types, you'll be guessing at what Playwright expects.
- **WHO**: SDETs who can read code but aren't sure _why_ it is written the way it is.
- **WHEN**: Before writing any test code of your own.
- **HOW**: By grounding every concept in code you have already seen in your real codebase.

---

## Part 1 — The JavaScript You Must Know

### 1.1 Variables: `const`, `let`, and Why `var` Is Banned

```typescript
// const — value never reassigns. Use this for everything by default.
const baseUrl = "https://crm.dynamics.com";
const page = await browser.newPage(); // page object never reassigns

// let — value can change. Use when you need to update something.
let retryCount = 0;
retryCount = retryCount + 1; // ok

// var — NEVER use. It is function-scoped, not block-scoped.
// This creates subtle bugs inside for-loops and if-blocks.
```

> [!IMPORTANT]
> **The Playwright Rule:** Always `const` for locators, page objects, responses, and parsed bodies. Use `let` only when you explicitly need to update a variable — like building a URL string conditionally or accumulating data across `test.step()` calls.

---

### 1.2 Data Types — What You Will Actually Use in Tests

```typescript
// String — URLs, locator names, expected text values
const endpoint = "/api/citations/search";
const expectedStatus = "PAID";

// Number — timeouts, counts, status codes
const timeout = 60000; // 60 seconds in milliseconds
const expectedCount = 5;

// Boolean — visibility checks, conditional test logic
const isVisible: boolean = await locator.isVisible();
if (isVisible) {
  /* do something */
}

// Array — multiple locators, lists of test IDs, API response arrays
const citationIds: string[] = ["CIT-001", "CIT-002", "CIT-003"];
const rows = await page.locator("tr").all(); // returns Locator[]

// Object — locator dictionaries, API payloads, test data
const payload = {
  citationId: "CIT-001",
  startDate: "2024-01-01",
  filters: { status: "PAID", type: "PARKING" },
};

// null / undefined — "nothing here yet"
let citationId: string | null = null; // will be set in step 1
citationId = await getCitationIdFromApi(request);
```

---

### 1.3 Conditional Logic in Tests

```typescript
// if/else — branching test logic
const count = await page.locator(".ms-DetailsList-row").count();

if (count === 0) {
  console.log("No results found — skipping validation steps");
  return;
} else {
  await expect(page.locator(".ms-DetailsList-row").first()).toBeVisible();
}

// Ternary — compact inline condition
const searchButton = hasMultipleButtons
  ? page.getByRole("button", { name: "Search" }).nth(2)
  : page.getByRole("button", { name: "Search" });

// Optional chaining — safe access on possibly null/undefined values
// (covered in depth in TypeScript section below)
const status = responseBody?.citations?.[0]?.status;
```

---

### 1.4 Loops — Iterating Over API Data and DOM Elements

```typescript
// for...of — the standard loop for arrays in async test code
const citationIds = ["CIT-001", "CIT-002", "CIT-003"];

for (const id of citationIds) {
  await page.fill("#citationInput", id);
  await page.click("#searchButton");
  await expect(page.locator(".result-row")).toBeVisible();
}

// forEach — works, but CANNOT use await inside it properly
// ❌ WRONG — await inside forEach does NOT work as expected
citationIds.forEach(async (id) => {
  await page.fill("#citationInput", id); // This fires all at once, not in sequence!
});

// ✅ RIGHT — use for...of when you need sequential async operations
for (const id of citationIds) {
  await page.fill("#citationInput", id); // Each iteration waits for the previous
}

// map — transforming API response arrays into test data
const rows = await response.json();
const ids: string[] = rows.citations.map((c: any) => c.citationId);
// ids = ['CIT-001', 'CIT-002', 'CIT-003']

// filter — keeping only specific items
const paidCitations = rows.citations.filter((c: any) => c.status === "PAID");

// find — getting the first matching item (your exact pattern)
const targetCitation = rows.citations.find(
  (c: any) => c.citationId === "CIT-001",
);
```

> [!WARNING]
> **The `forEach` + `async` trap.** This is one of the most common bugs in Playwright test code. `forEach` does not know how to wait for a Promise returned by an `async` callback. It fires all iterations simultaneously and moves on. Always use `for...of` for sequential async operations.

---

### 1.5 Functions and Arrow Functions

```typescript
// Regular function
async function fetchCitationDetails(request, api, citationId) {
  // ...
}

// Arrow function — same thing, shorter syntax
const fetchCitationDetails = async (request, api, citationId) => {
  // ...
};

// Arrow function as a callback — this is everywhere in Playwright
test("verify citation search", async ({ page, request }) => {
  // The "async ({ page, request }) => {}" is an arrow function
  // passed as a callback to test()
});

// Arrow function in test.step
await test.step("Fill search form", async () => {
  await page.fill("#citationInput", citationId);
  await page.click("#searchButton");
});
```

**Why arrow functions everywhere in Playwright?**
Arrow functions inherit `this` from their surrounding context. Regular functions have their own `this`. In class-based Page Objects, using arrow functions in methods would break `this.page` references. In test callbacks, arrow functions are the convention because they are shorter and `this` is irrelevant in test contexts.

---

### 1.6 ES6 Features You Will Use Every Day

#### Template Literals — String Building

```typescript
// Instead of concatenation:
const url = "https://" + host + ":" + port + "/api/citations/" + citationId;

// Use template literals:
const url = `https://${host}:${port}/api/citations/${citationId}`;

// Multi-line strings (useful for SOAP envelopes):
const soapEnvelope = `
  <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
      <GetCitation>
        <CitationId>${citationId}</CitationId>
      </GetCitation>
    </soap:Body>
  </soap:Envelope>
`;
```

#### Destructuring — Extracting from Objects and Arrays

```typescript
// Object destructuring — pull specific fields out
const { citationId, status, amount } = responseBody.citations[0];
// Instead of: responseBody.citations[0].citationId, etc.

// Array destructuring — pull by position
const [firstRow, secondRow] = await page.locator("tr").all();

// Destructuring in function parameters — your fixture pattern
test("my test", async ({ page, request, account }) => {
  //                    ↑ these are destructured from the fixtures object
});

// Nested destructuring — from deep API responses
const {
  data: {
    customer: { name, email },
  },
} = responseBody;
```

#### Spread and Rest

```typescript
// Spread — expanding an object or array
const baseHeaders = { "Content-Type": "application/json" };
const authHeaders = { Authorization: `Bearer ${token}` };

// Merge headers: spread both objects into a new one
const headers = { ...baseHeaders, ...authHeaders };
// Result: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ...' }

// Rest — collecting remaining arguments
function buildPayload(citationId: string, ...additionalFields: string[]) {
  // additionalFields is an array of whatever extra args you passed
}
```

#### Import / Export — Your Module Pattern

```typescript
// endpoints.ts — named exports
export const IVRAPI_CITATION_SEARCH = '/api/ivr/citations/search';
export const ASDAPI_CITATION_SEARCH = '/api/asd/citations/search';

// In your test file — named imports
import { IVRAPI_CITATION_SEARCH, ASDAPI_CITATION_SEARCH } from './endpoints';

// Default export — one main thing per file
export default class MasterSearchPage { ... }

// Default import
import MasterSearchPage from './pages/MasterSearchPage';
```

---

## Part 2 — Async/Await: The Heart of Playwright

This is the most important section. If you get this wrong, your tests will be broken in ways that are very hard to debug.

### 2.1 Why Does Async Exist at All?

JavaScript runs on a **single thread**. It can only do one thing at a time. But many operations — like opening a browser, clicking a button, waiting for a network request — take TIME.

If JavaScript stopped and waited for every slow operation, the whole program would freeze. So instead, it uses a system of **callbacks and Promises** to schedule work for later.

**The simplest mental model:**

```
Think of JavaScript like a restaurant chef.

The chef (single thread) can only cook one dish at a time.
But while a dish is in the oven (waiting for network/browser),
the chef doesn't just stand there — they prep the next dish.

async/await is how you tell the chef:
"Wait for this oven dish to finish before plating it."
```

---

### 2.2 Synchronous vs Asynchronous — The Core Difference

```typescript
// SYNCHRONOUS — each line waits for the previous to complete
const a = 1 + 1; // done instantly, a = 2
const b = a * 3; // done instantly, b = 6

// ASYNCHRONOUS — some operations take time
// Without async/await, JavaScript doesn't wait:
page.goto("https://crm.dynamics.com"); // started, but NOT waited for
page.click("#submitButton"); // ❌ this fires BEFORE the page loads!
```

---

### 2.3 Promises — The Building Block

A **Promise** is an object that represents a value that will be available _eventually_. Think of it as a receipt:

- You order food (start an operation).
- You get a receipt (a Promise).
- The receipt promises your food will be ready eventually.
- When it's ready: Promise **resolves** (success).
- If something goes wrong: Promise **rejects** (failure).

```typescript
// A function that returns a Promise
function waitOneSecond(): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("Done!"); // Resolves after 1 second
    }, 1000);
  });
}

// EVERY Playwright method returns a Promise
const response: Promise<Response> = page.goto("https://example.com");
// response is a Promise<Response>, not a Response yet!
```

---

### 2.4 `async` and `await` — How You Actually Use Promises

`async/await` is **syntactic sugar** over Promises. It makes Promise-based code look and feel synchronous, which is much easier to read.

#### The Rules — Memorise These

**Rule 1: `async` before a function means it always returns a Promise.**

```typescript
async function getStatus(): Promise<string> {
  return "PAID"; // automatically wrapped in a Promise
}

// Equivalent to:
function getStatus(): Promise<string> {
  return Promise.resolve("PAID");
}
```

**Rule 2: `await` can ONLY be used inside an `async` function.**

```typescript
// ❌ WRONG — await outside async function
const result = await page.goto("https://example.com"); // SyntaxError!

// ✅ RIGHT — await inside async function
async function openPage() {
  const result = await page.goto("https://example.com"); // ok
}
```

**Rule 3: `await` unwraps the Promise and gives you the actual value.**

```typescript
async function test() {
  // Without await:
  const responsePromise = page.goto("https://example.com");
  // responsePromise is a Promise<Response> object — NOT the response itself

  // With await:
  const response = await page.goto("https://example.com");
  // response is now the actual Response object — we waited for it

  console.log(response.status()); // 200
}
```

**Rule 4: If you forget `await` on a Playwright action, the test MOVES ON immediately.**

```typescript
// ❌ THE MOST COMMON MISTAKE — Missing await
async function badTest({ page }) {
  page.goto("https://crm.dynamics.com"); // starts navigating, doesn't wait
  page.click("#loginButton"); // tries to click BEFORE page loads
  page.fill("#username", "admin"); // tries to fill BEFORE login button existed
  // Tests sometimes pass anyway (race condition), making this very hard to debug
}

// ✅ CORRECT
async function goodTest({ page }) {
  await page.goto("https://crm.dynamics.com"); // wait for page to load
  await page.click("#loginButton"); // then click
  await page.fill("#username", "admin"); // then fill
}
```

---

### 2.5 Where Specifically Do You Use `await` in Playwright?

Here is a complete map of EVERY place you need `await`:

```typescript
test("complete example", async ({ page, request }) => {
  // ─── NAVIGATION ─────────────────────────────────────────────
  await page.goto("https://crm.dynamics.com"); // await ✅
  await page.goBack(); // await ✅
  await page.reload(); // await ✅

  // ─── USER ACTIONS ────────────────────────────────────────────
  await page.click("#loginButton"); // await ✅
  await page.fill("#username", "admin@company.com"); // await ✅
  await page.type("#password", "Password123"); // await ✅
  await page.press("#search", "Enter"); // await ✅
  await page.selectOption("#dropdown", "Option1"); // await ✅
  await page.check("#checkbox"); // await ✅
  await page.hover(".ms-Button"); // await ✅

  // ─── LOCATOR ACTIONS ─────────────────────────────────────────
  const button = page.getByRole("button", { name: "Save" }); // NO await ✅
  //              ↑ getByRole returns a Locator (lazy, not a Promise)
  await button.click(); // await ✅ (action)
  await button.fill("text"); // await ✅ (action)

  const text = await button.textContent(); // await ✅ (reading value)
  const isVisible = await button.isVisible(); // await ✅ (reading state)
  const count = await page.locator("tr").count(); // await ✅ (reading count)

  // ─── WAITING ─────────────────────────────────────────────────
  await page.waitForSelector(".ms-DetailsList-row"); // await ✅
  await page.waitForLoadState("networkidle"); // await ✅
  await page.waitForResponse("**/api/citations*"); // await ✅
  await locator.waitFor({ state: "visible", timeout: 60000 }); // await ✅

  // ─── ASSERTIONS (expect) ─────────────────────────────────────
  await expect(page.locator(".result")).toBeVisible(); // await ✅
  await expect(page.locator(".status")).toHaveText("PAID"); // await ✅
  // Note: expect() itself doesn't need await, but the assertion methods do
  // because they auto-retry (which involves Promises internally)

  // ─── API CALLS ───────────────────────────────────────────────
  const response = await request.post("/api/search", {
    // await ✅
    data: { citationId: "CIT-001" },
  });
  const body = await response.json(); // await ✅

  // ─── test.step ───────────────────────────────────────────────
  await test.step("Step name here", async () => {
    // await ✅ outer
    await page.click("#something"); // await ✅ inner
  });

  // ─── What does NOT need await ─────────────────────────────────
  const locator = page.locator(".ms-Button"); // NO await — returns Locator
  const locator2 = page.getByRole("button"); // NO await — returns Locator
  const locator3 = page.getByText("Save"); // NO await — returns Locator
  const locator4 = locator.filter({ hasText: "Edit" }); // NO await — returns Locator
  const locator5 = locator.nth(2); // NO await — returns Locator
  // All locator CREATION is synchronous. Only ACTIONS on locators need await.
});
```

> [!TIP]
> **The simple rule:** If it _does something in the browser_ (navigate, click, type, wait, read a value), it needs `await`. If it just _describes what to look for_ (creating a Locator object), it does NOT need `await`.

---

### 2.6 `Promise.all` — Doing Multiple Things in Parallel

Sometimes you need to start two things at once and wait for both to finish.

**The critical use case in Playwright: new tab detection**

When your test clicks a button that opens a NEW TAB, you face a race condition:

- If you `await button.click()` first, the new tab might open and close before Playwright starts listening.
- The solution: start listening for the new tab AND click the button at the exact same moment.

```typescript
// ❌ WRONG — race condition
await page.click("#openInNewTab"); // tab opens...
const newTab = await context.waitForEvent("page"); // ...but might already be gone!

// ✅ CORRECT — Promise.all fires both simultaneously
const [newTabPage] = await Promise.all([
  page.context().waitForEvent("page"), // start listening BEFORE the click
  page.click("#openInNewTab"), // trigger the click
]);

// Now newTabPage is the second tab's Page object
await newTabPage.waitForLoadState("domcontentloaded");
await newTabPage.fill("#username", "admin");
```

**Understanding `Promise.all`:**

```typescript
// Promise.all takes an array of Promises
// It waits for ALL of them to resolve
// Returns an array of their results in the same order

const [result1, result2, result3] = await Promise.all([
  request.get("/api/users"), // fires immediately
  request.get("/api/citations"), // fires immediately (parallel!)
  request.get("/api/accounts"), // fires immediately (parallel!)
]);
// All 3 requests run at the SAME TIME — much faster than running sequentially
```

---

### 2.7 Error Handling with `try/catch`

When an awaited operation fails (network error, assertion failure, element not found), it throws an error. You catch it with `try/catch`.

```typescript
// In your APIUtils class pattern:
async function fetchCitationSafely(
  request,
  citationId: string,
): Promise<any | null> {
  try {
    const response = await request.get(`/api/citations/${citationId}`);

    if (!response.ok()) {
      console.log(
        `API returned ${response.status()} for citation ${citationId}`,
      );
      return null;
    }

    const body = await response.json();
    return body;
  } catch (error) {
    console.error(`Failed to fetch citation ${citationId}:`, error);
    return null;
  }
}

// The .catch(() => false) pattern in your MasterSearchPage:
const transitAccountVisible = await this.transitAccountLocator
  .filter({ visible: true })
  .first()
  .isVisible()
  .catch(() => false); // if isVisible() throws, return false instead of crashing
```

---

### 2.8 Async/Await in `test.step` — The 15-Step Pattern

Here is how async/await flows through your actual test structure:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Citation Search E2E", () => {
  test("Verify paid citation appears in customer account", async ({
    page,
    request,
    account,
  }) => {
    // TypeScript interface to accumulate data across steps
    interface TestData {
      citationId: string | null;
      customerId: string | null;
      verifiedStatus: string | null;
    }
    const data: TestData = {
      citationId: null,
      customerId: null,
      verifiedStatus: null,
    };

    // ── STEP 1: Get citation ID from API ───────────────────────
    await test.step("Fetch citation ID from API", async () => {
      // await inside test.step callback works exactly as you expect
      const response = await request.post("/api/citations/search", {
        data: { startDate: "2024-01-01", endDate: "2024-12-31" },
      });
      const body = await response.json();
      // Store in accumulator — will be used in Step 5
      data.citationId = body?.citations?.[0]?.citationId ?? null;

      expect(data.citationId).not.toBeNull();
    });

    // ── STEP 2: Navigate to Master Search ─────────────────────
    await test.step("Navigate to Master Search page", async () => {
      await page.goto(process.env.APP_URL + "/master-search");
      // Wait for D365 component to fully load (two-phase render)
      await page.locator("#MasterSearchDropdown-option").waitFor({
        state: "visible",
        timeout: 60000,
      });
    });

    // ── STEP 3: Search for the citation ───────────────────────
    await test.step(`Search for citation ${data.citationId}`, async () => {
      // data.citationId from Step 1 is available here
      await page.fill("#citationNumberInput", data.citationId!);
      await page.getByRole("button", { name: "Search" }).nth(2).click();
    });

    // ... steps 4–15 follow the same pattern
  });
});
```

---

## Part 3 — TypeScript for Automation Engineers

### 3.1 Why TypeScript in Playwright Codebases?

Playwright itself is written in TypeScript. The entire API is typed. Without TypeScript, you would constantly guess:

- "Does `getByRole` take a `name` or a `text` option?"
- "What does `response.json()` actually return?"
- "Is `testInfo` optional or required in this function?"

With TypeScript, your editor tells you instantly. And when you make a mistake, the compiler tells you BEFORE you run the test.

---

### 3.2 Types, Interfaces, and When to Use Each

```typescript
// Type — use for primitives, unions, computed shapes
type ApiType = "ivrapi" | "asdapi" | "nwapi"; // union of string literals
type Timeout = number;
type CitationId = string;

// Interface — use for object shapes, especially when a class will implement it
interface CitationResponse {
  citations: Citation[];
  totalCount: number;
  pageNumber: number;
}

interface Citation {
  citationId: string;
  status: "PAID" | "PENDING" | "OVERDUE"; // union type on a field
  amount: number;
  customerId: string;
}

// Using them:
async function fetchCitations(
  request: APIRequestContext,
): Promise<CitationResponse> {
  const response = await request.get("/api/citations");
  const body: CitationResponse = await response.json();
  //           ↑ TypeScript now knows body.citations is a Citation[]

  const paidOnes = body.citations.filter((c) => c.status === "PAID");
  //    ↑ TypeScript autocompletes .citationId, .status, .amount on c

  return body;
}
```

---

### 3.3 `as const` — Why It Is Required in Playwright

The single most confusing TypeScript feature in Playwright codebases.

```typescript
// Playwright's getByRole requires specific literal string types,
// not the general "string" type.

// ❌ This breaks:
const role = "tab"; // TypeScript infers type as: string (too broad)
const tab = page.getByRole(role); // Error: string is not assignable to AriaRole

// ✅ Fix 1: Inline literal
const tab = page.getByRole("tab"); // 'tab' is the literal type "tab"

// ✅ Fix 2: as const assertion
const role = "tab" as const; // type is now literally "tab", not "string"
const tab = page.getByRole(role); // works!

// This is why your CustomerDetailsTab uses it:
const locators = {
  phonesTab: { role: "tab" as const, options: { name: "Phones" } },
  // Without "as const" here, role would be typed as string
  // and page.getByRole(locators.phonesTab.role) would fail to compile
};
```

---

### 3.4 Optional Chaining (`?.`) — Navigating Dangerous API Responses

This is the single most useful operator for SDET work with complex API responses.

```typescript
// The problem: enterprise APIs return deeply nested data
const body = await response.json();

// ❌ DANGEROUS — any null/undefined in the chain throws an error
const status = body.data.customer.citations[0].status;
// TypeError: Cannot read properties of undefined (reading 'customer')

// ✅ SAFE — optional chaining stops at the first null/undefined
const status = body?.data?.customer?.citations?.[0]?.status;
// Returns undefined (not an error) if anything in the chain is null

// Combine with nullish coalescing ?? to provide a default:
const status = body?.data?.customer?.citations?.[0]?.status ?? "UNKNOWN";
// Returns 'UNKNOWN' if any part was null/undefined

// In your exact codebase pattern (from getCitationIdFromDateRangeResponse):
if (responseBody?.citations && responseBody.citations.length > 0) {
  const firstCitationId = responseBody.citations[0].citationId;
  return firstCitationId;
}
return null;
```

---

### 3.5 `Promise<T>` Return Types — Reading and Writing Them

```typescript
// Reading return types — what does this function give back?
async function getStatus(): Promise<string>; // gives back a string
async function getCount(): Promise<number>; // gives back a number
async function getCitation(): Promise<Citation>; // gives back a Citation object
async function findId(): Promise<string | null>; // gives back string OR null

// Writing return types on your test helper functions
export async function getCitationIdFromDateRangeResponse(
  request: APIRequestContext, // ← type of first param
  daysBefore: number, // ← type of second param
  daysAfter: number, // ← type of third param
  testInfo?: TestInfo, // ← optional param (the ? means optional)
): Promise<string | null> {
  // ← what this async function returns

  const responseBody = await fetchCitationsBasedOnDateRange(
    request,
    daysBefore,
    daysAfter,
    testInfo,
  );

  if (responseBody?.citations && responseBody.citations.length > 0) {
    return responseBody.citations[0].citationId; // returns string
  }
  return null; // returns null
}
```

---

### 3.6 Access Modifiers — Why `private` Matters in `APIUtils`

```typescript
export class APIUtils {
  private request: APIRequestContext;  // ← only accessible inside this class
  private testInfo?: TestInfo;         // ← optional, only inside this class

  constructor(request: APIRequestContext, testInfo?: TestInfo) {
    this.request = request;
    this.testInfo = testInfo;
  }

  // private helper — only this class can call it
  private getEndpointDescription(endpoint: string): string { ... }

  // public method — test files can call this
  async getCall(endpoint: string, headers: Record<string, string>): Promise<any> {
    const description = this.getEndpointDescription(endpoint); // ok — same class
    // ...
  }
}

// In a test file:
const apilib = new APIUtils(request, testInfo);
apilib.getCall('/api/citations', headers);   // ✅ public method
apilib.getEndpointDescription('/path');      // ❌ TypeScript error: private method
```

**Why `private`?** It enforces the design contract. `getEndpointDescription()` is an implementation detail — only `APIUtils` should call it. If it's `public`, a future engineer might call it directly in tests, which creates a dependency on an internal implementation detail that you might later change.

---

### 3.7 Enums — Replacing String Comparisons

```typescript
// Your current code uses a switch on raw strings:
switch (api.toLowerCase()) {
  case "ivrapi":
    endpoint = endpoints.IVRAPI_CITATION_SEARCH;
    break;
  case "asdapi":
    endpoint = endpoints.ASDAPI_CITATION_SEARCH;
    break;
  case "nwapi":
    endpoint = endpoints.NWAPI_CITATION_SEARCH;
    break;
  default:
    throw new Error(`Invalid API type: ${api}`);
}

// With an enum, TypeScript enforces valid values at compile time:
enum ApiType {
  IVRAPI = "ivrapi",
  ASDAPI = "asdapi",
  NWAPI = "nwapi",
}

// And a lookup map:
const endpointMap: Record<ApiType, string> = {
  [ApiType.IVRAPI]: endpoints.IVRAPI_CITATION_SEARCH,
  [ApiType.ASDAPI]: endpoints.ASDAPI_CITATION_SEARCH,
  [ApiType.NWAPI]: endpoints.NWAPI_CITATION_SEARCH,
};

// Now the function signature:
async function fetchCitationDetails(
  request: APIRequestContext,
  api: ApiType, // ← TypeScript won't let you pass 'invalid' here
  citationId: string,
): Promise<any> {
  const endpoint = endpointMap[api]; // no switch needed, no possible KeyError
  // ...
}

// Calling it:
await fetchCitationDetails(request, ApiType.IVRAPI, "CIT-001"); // ✅ compiled
await fetchCitationDetails(request, "invalid", "CIT-001"); // ❌ compile error!
```

---

## Part 4 — Async Patterns You Will See in Production

### 4.1 `async` Callback Hell vs Clean `await` Chain

```typescript
// ❌ Callback hell — hard to read, hard to debug
page.goto("/login").then(() => {
  page.fill("#user").then(() => {
    page.click("#submit").then(() => {
      expect(page.locator(".dashboard"))
        .toBeVisible()
        .then(() => {
          console.log("done");
        });
    });
  });
});

// ✅ Clean await chain — readable top to bottom
await page.goto("/login");
await page.fill("#user", "admin");
await page.click("#submit");
await expect(page.locator(".dashboard")).toBeVisible();
```

### 4.2 Sequential vs Parallel API Calls

```typescript
// Sequential — one after another (slow: 300ms + 300ms + 300ms = 900ms)
const citationResponse = await request.get("/api/citations");
const customerResponse = await request.get("/api/customers");
const accountResponse = await request.get("/api/accounts");

// Parallel — all at once (fast: 300ms total, they overlap)
const [citationResponse, customerResponse, accountResponse] = await Promise.all(
  [
    request.get("/api/citations"),
    request.get("/api/customers"),
    request.get("/api/accounts"),
  ],
);
```

### 4.3 Retry Logic with Async

```typescript
// When a D365 API is flaky and might return 503 temporarily:
async function fetchWithRetry(
  request,
  endpoint: string,
  maxRetries = 3,
): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await request.get(endpoint);

      if (response.ok()) {
        return await response.json();
      }

      console.log(`Attempt ${attempt} failed with status ${response.status()}`);

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt)); // backoff
      }
    } catch (error) {
      if (attempt === maxRetries) throw error;
    }
  }
}
```

---

## 🏋️ Practice Challenges

**Challenge 1 (Async Trap):** The following code is in a real Playwright test. Find the bug and explain exactly what will happen when it runs:

```typescript
test("search for citation", async ({ page }) => {
  page.goto("https://crm.dynamics.com/master-search");
  page.fill("#citationInput", "CIT-001");
  const count = await page.locator(".result-row").count();
  expect(count).toBeGreaterThan(0);
});
```

<details><summary>Answer</summary>

Two missing `await` statements. `page.goto()` starts navigation but doesn't wait — so `page.fill()` fires before the page is ready (probably throws "element not found"). Even if fill somehow worked, the `count()` check would run before any search was executed. The test might accidentally pass because of race conditions, making it an extremely hard-to-debug flaky test. Fix: add `await` before both `page.goto()` and `page.fill()`.

</details>

**Challenge 2 (forEach Trap):** Your team wrote this to verify 5 citations. It sometimes passes even when citations are missing. Why?

```typescript
const ids = ["CIT-001", "CIT-002", "CIT-003", "CIT-004", "CIT-005"];
ids.forEach(async (id) => {
  await page.fill("#input", id);
  await page.click("#search");
  await expect(page.locator(".result")).toBeVisible();
});
```

<details><summary>Answer</summary>

`forEach` does not await the async callback. It fires all 5 iterations essentially simultaneously without waiting for any of them to complete. The test function returns (and "passes") before any of the inner `await` chains finish. Playwright's assertions inside run asynchronously and their failures might not propagate back to the test. Fix: use `for (const id of ids) { ... }` which properly awaits each iteration before moving to the next.

</details>

**Challenge 3 (Promise.all):** Your test clicks a button that opens App B in a new tab. Write the correct code to capture the new tab's page object and then fill in a username field on it.

<details><summary>Answer</summary>

```typescript
const [newPage] = await Promise.all([
  page.context().waitForEvent("page"),
  page.click("#openAppBButton"),
]);
await newPage.waitForLoadState("domcontentloaded");
await newPage.fill("#username", "admin@company.com");
```

The key: `waitForEvent('page')` and the click must be started together via `Promise.all`. If you await the click first, the new tab might open and close before the event listener is registered.

</details>

**Challenge 4 (Optional Chaining):** An API returns `{ data: null }` sometimes and `{ data: { citations: [{ id: 'CIT-001' }] } }` other times. Write a safe one-liner to extract the first citation ID, returning `'NONE'` as a default if it doesn't exist.

<details><summary>Answer</summary>

```typescript
const citationId = body?.data?.citations?.[0]?.id ?? "NONE";
```

The `?.` chains safely stop at the first `null`/`undefined` and return `undefined`. The `??` then replaces `undefined` with `'NONE'`.

</details>

---

## Part 5 — Advanced TypeScript Patterns for SDET Work

### 5.1 Discriminated Unions — Type-Safe Test Data Factories

A discriminated union is a TypeScript pattern where a union of types shares a **common property** (the "discriminant") that tells TypeScript exactly which type you're working with. This is the pattern that makes test data factories bulletproof.

```typescript
// The discriminant is the 'status' field — each status has different allowed fields:

interface PendingCitation {
  status: "PENDING";
  citationId: string;
  amount: number;
  dueDate: string;
  // No paidDate — pending citations haven't been paid
}

interface PaidCitation {
  status: "PAID";
  citationId: string;
  amount: number;
  paidDate: string; // required for paid
  paymentMethod: string; // required for paid
  // No dueDate — already resolved
}

interface DisputedCitation {
  status: "DISPUTED";
  citationId: string;
  amount: number;
  disputeReason: string; // required for disputed
  disputeDate: string; // required for disputed
}

// The discriminated union — TypeScript knows ALL three shapes:
type Citation = PendingCitation | PaidCitation | DisputedCitation;

// WHY THIS MATTERS — TypeScript narrows automatically:
function getResolutionDate(citation: Citation): string {
  switch (citation.status) {
    case "PENDING":
      return citation.dueDate; // TS knows: PendingCitation → has dueDate
    case "PAID":
      return citation.paidDate; // TS knows: PaidCitation → has paidDate
    case "DISPUTED":
      return citation.disputeDate; // TS knows: DisputedCitation → has disputeDate
    // No default needed — TypeScript knows all cases are handled (exhaustive check)
  }
}

// Using it in a test data factory:
class CitationFactory {
  static pending(overrides?: Partial<PendingCitation>): PendingCitation {
    return {
      status: "PENDING",
      citationId: `CIT-${Date.now()}`,
      amount: 150,
      dueDate: "2025-12-31",
      ...overrides,
    };
  }

  static paid(overrides?: Partial<PaidCitation>): PaidCitation {
    return {
      status: "PAID",
      citationId: `CIT-${Date.now()}`,
      amount: 200,
      paidDate: new Date().toISOString(),
      paymentMethod: "CREDIT_CARD",
      ...overrides,
    };
  }
}

// In a test:
const citation = CitationFactory.pending({ amount: 500 });
// TypeScript knows: citation.status is 'PENDING', citation.dueDate exists
// TypeScript error: citation.paidDate — doesn't exist on PendingCitation ✅
```

---

### 5.2 `AbortController` — Timeout Management for API Tests

When making API calls in tests, you need to handle the case where the server doesn't respond. `AbortController` is the standard way to cancel a pending operation after a timeout.

```typescript
// Pattern 1: Abort a fetch after a custom timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10_000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal, // connect the abort signal
    });
    return response;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId); // clean up the timer
  }
}

// Pattern 2: Cancel parallel requests when one fails
async function fetchFirstAvailable(urls: string[]): Promise<Response> {
  const controller = new AbortController();

  try {
    // Race all URLs — first successful response wins
    const response = await Promise.any(
      urls.map((url) => fetch(url, { signal: controller.signal })),
    );
    controller.abort(); // cancel remaining requests
    return response;
  } catch {
    throw new Error("All endpoints failed");
  }
}

// Pattern 3: In Playwright tests — abort a polling loop
async function pollUntilStatus(
  request: APIRequestContext,
  citationId: string,
  targetStatus: string,
  timeoutMs: number = 30_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const response = await request.get(`/api/citations/${citationId}`);
    const body = await response.json();

    if (body.status === targetStatus) {
      return; // success — status reached
    }

    // Wait 1 second before next poll
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    `Citation ${citationId} did not reach status '${targetStatus}' within ${timeoutMs}ms`,
  );
}
```

---

### 5.3 `Record<K, V>` and Mapped Types — The Patterns You See Everywhere

```typescript
// Record<K, V> — an object where all keys are type K and all values are type V
// This is THE most common utility type in SDET codebases

// Headers dictionary:
const headers: Record<string, string> = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
  "X-Request-Id": requestId,
};

// Endpoint map (from Section 3.7):
const endpointMap: Record<ApiType, string> = {
  ivrapi: "/api/ivr/citations/search",
  asdapi: "/api/asd/citations/search",
  nwapi: "/api/nw/citations/search",
};

// Environment config:
type Environment = "dev" | "staging" | "prod";
const baseUrls: Record<Environment, string> = {
  dev: "https://dev.crm.dynamics.com",
  staging: "https://staging.crm.dynamics.com",
  prod: "https://crm.dynamics.com",
};

// Partial<T> — make all fields optional (for test data overrides):
interface Citation {
  citationId: string;
  status: string;
  amount: number;
}
function createCitation(overrides: Partial<Citation> = {}): Citation {
  return {
    citationId: `CIT-${Date.now()}`,
    status: "PENDING",
    amount: 100,
    ...overrides, // overrides replace defaults
  };
}
createCitation({ amount: 500 }); // only override amount, keep defaults for rest

// Pick<T, K> — select only specific fields:
type CitationSummary = Pick<Citation, "citationId" | "status">;
// Result: { citationId: string; status: string }

// Omit<T, K> — remove specific fields:
type CitationWithoutId = Omit<Citation, "citationId">;
// Result: { status: string; amount: number }
```

---

## Part 6 — Async Pitfalls Diagnostic Table

Every async bug in Playwright traces back to one of these patterns. Use this table when debugging.

| Symptom                                                 | Root Cause                                        | What's Happening                                                                                                                                                       | Fix                                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Test passes locally, fails in CI randomly               | Missing `await` on a Playwright action            | Without `await`, the action fires but your code proceeds immediately. On your fast machine the action completes quickly (race won). On slow CI it doesn't (race lost). | Add `await` before every `page.*` action and `expect()` assertion.                                    |
| All 5 iterations of a loop seem to run simultaneously   | `forEach` + `async` callback                      | `forEach` doesn't understand Promises — it fires all callbacks without waiting. All 5 iterations race against each other.                                              | Replace `forEach` with `for...of` loop.                                                               |
| `expect(text).toBe('PAID')` fails with `''`             | One-shot read on a loading element                | `textContent()` returns the text at THIS INSTANT. If the element is still in Phase 1 (empty container, data loading), you get `''`.                                    | Use `await expect(locator).toHaveText('PAID')` — this retries until the text matches.                 |
| `Promise.all` errors out and you lose the other results | One Promise rejects, `Promise.all` short-circuits | `Promise.all` rejects as soon as ANY Promise rejects. The other Promises keep running but their results are lost.                                                      | Use `Promise.allSettled()` if you need results from all, even failures.                               |
| New tab not captured after button click                 | `waitForEvent` registered AFTER the click         | The new tab opened before the event listener was ready. The event was emitted and nobody was listening.                                                                | Use `Promise.all([context.waitForEvent('page'), button.click()])` — listener starts BEFORE the click. |
| Test hangs forever, never completes                     | `await` on a Promise that never resolves          | A `waitForResponse()` waiting for an API call that the app never makes. A `waitForSelector()` waiting for an element that doesn't exist.                               | Always set explicit timeouts: `{ timeout: 15_000 }`. Never `await` without a timeout safety net.      |

---

## 📚 References & Further Reading

### Official Documentation — JavaScript (MDN)

- [Event Loop & Concurrency Model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop) — The core mechanism behind JS async behavior
- [Promise — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) — Complete Promise API reference
- [Promise.all() vs Promise.allSettled()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled) — When to use which for parallel test actions

### Official Documentation — TypeScript

- [TypeScript Handbook: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html) — `Partial`, `Pick`, `Omit`, `ReturnType`, etc.
- [TypeScript Handbook: Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) — The most powerful pattern for factory functions and API payloads
- [Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html) — Creating types dynamically from other types

### Advanced Patterns

- [AbortController — MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — How to cancel async operations (useful for custom network polling)
- [Playwright TypeScript Support](https://playwright.dev/docs/test-typescript) — Official guidance on TypeScript integration in Playwright

---

**Navigation**: [← Previous: Browser Console Scripting](./03_Browser_Console_Scripting.md) | [Index](../../00_MASTER_INDEX.md) | [Next: POM Architecture →](../02_Core_Architecture/05_POM_Architecture_Deep_Dive.md)
