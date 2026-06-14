# 04. APIUtils & Factory Pattern — Enterprise API Architecture

**Navigation**: [â† Previous: Enterprise Headers & Auth](03_Enterprise_Headers_Auth.md) | [Index](../00_MASTER_INDEX.md) | [Next: Data From API To Test →](05_Data_From_API_To_Test.md)

**Cross-links:**

- [`06_OOP_Design/02_Design_Patterns.md`](../06_OOP_Design/02_Design_Patterns.md) — Factory Pattern, Builder Pattern, Strategy Pattern
- [`17_TypeScript/03_TS_Patterns_BestPractices.md`](../17_TypeScript/03_TS_Patterns_BestPractices.md) — Static classes, `Record<K,V>` type
- [`22_DevOps/08_HTTP_Complete.md`](../22_DevOps/08_HTTP_Complete.md) — HTTP headers deep dive

---

## 5W1H — Why This Chapter?

- **WHAT**: The design patterns behind `APIUtils`, `HeadersCrm`, `PayloadCrm`, and your endpoint assembly system — explained from first principles and your real codebase.
- **WHY**: Your codebase separates headers, payloads, endpoints, and HTTP logic into different classes. This feels like extra complexity, but it is the only architecture that scales to 100+ API tests without collapsing into chaos.
- **WHO**: SDETs who write API tests but are copy-pasting headers and payloads into each test file manually.
- **WHEN**: As soon as more than 3 test files make API calls to the same service.
- **HOW**: By dissecting your real `APIUtils`, `HeadersCrm`, `PayloadCrm`, and endpoint patterns line by line.

---

## 1. Why Wrap `request.get()` At All?

Playwright's `request.get()` already works fine. Why does your team wrap it in `APIUtils`?

**Without a wrapper — what happens at scale:**

```typescript
// In test file A:
const response = await request.get("/api/citations/CIT-001", {
  headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
});
if (response.status() !== 200)
  throw new Error(`Expected 200, got ${response.status()}`);
const body = await response.json();
console.log(`Response: ${JSON.stringify(body, null, 2)}`);

// In test file B: (identical boilerplate — copied and pasted)
const response = await request.get("/api/customers/C-001", {
  headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
});
if (response.status() !== 200)
  throw new Error(`Expected 200, got ${response.status()}`);
const body = await response.json();
console.log(`Response: ${JSON.stringify(body, null, 2)}`);
```

After 50 test files: 50 copies of status validation, 50 copies of logging, 50 copies of header building. If the API adds a required header (`x-api-version: 2`), you update 50 files.

**With `APIUtils` — the wrapper pattern:**

The wrapper handles: status validation, logging, response timing, HTML report attachment, retry logic. Every test just calls one method and gets the result. Adding `x-api-version: 2` to the headers class fixes all 50 tests at once.

---

## 2. Your `APIUtils` Class — Full Dissection

```typescript
export class APIUtils {
  private request: APIRequestContext;
  private testInfo?: TestInfo;

  constructor(request: APIRequestContext, testInfo?: TestInfo) {
    this.request = request;
    this.testInfo = testInfo;
    // testInfo is optional — allows APIUtils to be used both in tests
    // (where testInfo is available) and in setup scripts (where it's not)
  }
```

### The `getEndpointDescription()` Method — Line by Line

```typescript
private getEndpointDescription(endpoint: string): string {
  // Split the URL path into segments: '/api/v1/citations/CIT-001/status'
  // → ['api', 'citations', 'CIT-001', 'status']
  // The filter removes empty strings and version segments like 'v1', 'v2'
  const parts = endpoint
    .split('/')
    .filter(part => part && !part.match(/^v\d+$/));
  //                              ↑ Removes 'v1', 'v2', 'v10' etc.
  //              ↑ Removes empty strings from leading '/'

  // Helper: is this segment an ID (not a resource name)?
  const isId = (part: string): boolean => {
    if (/^\d+$/.test(part)) return true;
    // ↑ Pure numbers: '12345', '9921' → IDs

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) return true;
    // ↑ UUID format: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' → ID

    if (/^[A-Z]{2,4}\d+$/i.test(part)) return true;
    // ↑ Alphanumeric codes: 'CIT-001'... wait, actually this regex matches 'CMS12345'
    //   (2-4 letters followed by digits). 'CIT-001' would NOT match because of the hyphen.
    //   This covers IDs like: 'PRG999', 'CMS12345', 'AC9921'

    return false;
  };

  // Strategy: scan from RIGHT to LEFT to find the last resource name.
  // URL pattern: /resource/{id} or /resource/{id}/sub-resource
  // We want the last meaningful resource word.

  let description = '';
  for (let i = parts.length - 1; i >= 0; i--) {
    if (!isId(parts[i])) {
      // Found a non-ID segment (a resource name like 'citations', 'customers')
      const resourceName = parts[i];

      if (i < parts.length - 1 && isId(parts[i + 1]) && i === parts.length - 2) {
        // Pattern: /resource/{id} (resource is second to last, ID is last)
        // Example: /citations/CIT-001 → "Citations CIT-001"
        const formatted = resourceName
          .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase → "camel Case"
          .replace(/[_-]/g, ' ')                  // underscores/hyphens → spaces
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');
        description = `${formatted} ${parts[i + 1]}`;

      } else if (i < parts.length - 1 && !isId(parts[i + 1])) {
        // Pattern: /resource/{id}/sub-resource (two non-IDs at the end)
        // Example: /citations/CIT-001/comments → "Comments"
        description = parts[parts.length - 1]
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/[_-]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');

      } else {
        // Pattern: /resource (just the resource name, no ID)
        // Example: /citations → "Citations"
        description = resourceName
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/[_-]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');
      }
      break;
    }
  }
  return description || endpoint; // fallback: return the raw URL if parsing fails
}
```

### The `getCall()` Method — Full Flow

```typescript
async getCall(
  endpoint: string,
  headers: Record<string, string>,
  expectedStatus: number,
  queryParams?: Record<string, string>
): Promise<any> {

  // Step 1: Build the full URL with query parameters
  let url = endpoint;
  if (queryParams && Object.keys(queryParams).length > 0) {
    const searchParams = new URLSearchParams(queryParams);
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}${searchParams.toString()}`;
    // Example: '/api/citations' + '?' + 'status=PAID&limit=10'
    // → '/api/citations?status=PAID&limit=10'
  }

  const startTime = Date.now();
  const response = await this.request.get(url, { headers });
  const responseTime = Date.now() - startTime;

  // Step 2: Log everything (appears in console and Playwright report)
  if (AppConstants.ENABLE_API_TEST_STEPS || !this.testInfo) {
    const functionality = this.getEndpointDescription(endpoint);
    console.log(`\nGET ${functionality}`);
    console.log(`URL: ${url}`);
    console.log(`Expected Status: ${expectedStatus}`);
    console.log(`Response Status: ${response.status()}`);
    console.log(`Response Time: ${responseTime}ms`);
    // ... log body
  }

  // Step 3: Validate status code
  // (your postCallWithResponseCodeValidation does this)
  expect(response.status()).toBe(expectedStatus);

  return response;
}
```

---

## 3. The Static Factory Pattern for Headers

Your `HeadersCrm.getCrmHeader()` is a **Static Factory Method**. Here is the full architecture:

```typescript
// data/headers/HeadersCrm.ts

export class HeadersCrm {
  // Static method: called on the CLASS, not an instance
  // HeadersCrm.getCrmHeader() — no "new HeadersCrm()" needed
  static getCrmHeader(): Record<string, string> {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CRM_API_TOKEN}`,
      "x-agent": process.env.CRM_AGENT_ID ?? "playwright-test",
      "x-correlation-id": `TEST-${Date.now()}`,
    };
  }

  // Different header sets for different API contexts
  static getSoapHeader(soapAction: string): Record<string, string> {
    return {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: `"${soapAction}"`,
      Authorization: `Bearer ${process.env.SOAP_API_TOKEN}`,
    };
  }

  static getIVRApiHeader(): Record<string, string> {
    return {
      Accept: "application/json",
      "x-ivr-client-id": process.env.IVR_CLIENT_ID!,
      "x-ivr-secret": process.env.IVR_CLIENT_SECRET!,
    };
  }
}
```

**Why static?**

- You never need to store state in the header class. It reads from env vars and builds fresh headers.
- `HeadersCrm.getCrmHeader()` is simpler to call than `new HeadersCrm().getCrmHeader()`.
- All header logic lives in ONE file. Adding a new required header means editing one file, not hunting through test files.

---

## 4. The Static Factory Pattern for Payloads

Your `PayloadCrm.createCitationSearchByIdPayload(citationId)` is a **payload factory**:

```typescript
// data/payloads/PayloadCrm.ts

export class PayloadCrm {
  // Simple payload factory — takes parameters, returns a typed object
  static createCitationSearchByIdPayload(
    citationId: string,
  ): Record<string, unknown> {
    return {
      searchCriteria: {
        citationId: citationId,
        includeHistory: false,
      },
      pagination: {
        page: 1,
        limit: 10,
      },
    };
  }

  // Date range payload — assembles dates from helper
  static createCitationSearchByDateRangePayload(
    daysBefore: number,
    daysAfter: number,
  ): Record<string, unknown> {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysBefore);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + daysAfter);

    return {
      searchCriteria: {
        startDate: startDate.toISOString().split("T")[0], // 'YYYY-MM-DD'
        endDate: endDate.toISOString().split("T")[0],
        status: "ALL",
      },
    };
  }

  // SOAP envelope builder — for legacy endpoints
  static createSoapCitationSearchEnvelope(citationId: string): string {
    return `
      <?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                     xmlns:crm="http://crm.company.com/citations">
        <soap:Header>
          <crm:RequestId>${Date.now()}</crm:RequestId>
        </soap:Header>
        <soap:Body>
          <crm:SearchCitation>
            <crm:CitationId>${citationId}</crm:CitationId>
          </crm:SearchCitation>
        </soap:Body>
      </soap:Envelope>
    `.trim();
  }
}
```

**Why factory methods instead of plain objects in test files?**

- Payloads change when the API changes. If `searchCriteria` is renamed to `criteria`, you fix one factory, not 30 test files.
- Factory methods can compute dynamic values (dates, timestamps, UUIDs).
- Complex SOAP envelopes become one readable function call.

---

## 5. Environment-Based Endpoint Assembly

Your `endpoints.IVRAPI_CITATION_SEARCH` is assembled from environment variables. Here is the full pattern:

```typescript
// data/endpoints.ts

// Base URLs from environment — set per environment (dev/staging/prod)
const CRM_HOST = process.env.CRM_HOST ?? "https://crm-staging.company.com";
const IVR_HOST = process.env.IVR_HOST ?? "https://ivr-staging.company.com";
const ASD_HOST = process.env.ASD_HOST ?? "https://asd-staging.company.com";
const NW_HOST = process.env.NW_HOST ?? "https://nw-staging.company.com";

// API version — can change per env
const API_VERSION = process.env.API_VERSION ?? "v2";

// Endpoint constants — assembled from parts
export const endpoints = {
  // CRM endpoints
  CRM_CUSTOMER_SEARCH: `${CRM_HOST}/api/${API_VERSION}/customers/search`,
  CRM_CITATION_DETAILS: `${CRM_HOST}/api/${API_VERSION}/citations`,

  // IVR API endpoints
  IVRAPI_CITATION_SEARCH: `${IVR_HOST}/api/${API_VERSION}/citations/search`,
  IVRAPI_CITATION_BY_ID: `${IVR_HOST}/api/${API_VERSION}/citations`,

  // ASD API endpoints
  ASDAPI_CITATION_SEARCH: `${ASD_HOST}/api/${API_VERSION}/citations/search`,

  // NW API endpoints
  NWAPI_CITATION_SEARCH: `${NW_HOST}/api/${API_VERSION}/citations/search`,
} as const;
// ↑ "as const" makes the object deeply readonly — TypeScript error if you try to mutate
```

**Environment-specific `.env` files:**

```bash
# .env.staging
CRM_HOST=https://crm-staging.company.com
IVR_HOST=https://ivr-staging.company.com
API_VERSION=v2

# .env.production (never used in tests — just for documentation)
CRM_HOST=https://crm.company.com
IVR_HOST=https://ivr.company.com
```

```typescript
// playwright.config.ts — load the right env file
import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.TEST_ENV ?? "staging"}` });
// Run: TEST_ENV=production npx playwright test (would load .env.production)
```

---

## 6. Putting It All Together — Your `fetchCitationDetails` Refactored

```typescript
// Original (with improvements annotated):
export async function fetchCitationDetails(
  request: APIRequestContext,
  api: ApiType, // â† use enum instead of string
  citationId: string,
  testInfo?: TestInfo,
): Promise<CitationResponse | null> {
  // â† typed return instead of any

  const endpointMap: Record<ApiType, string> = {
    [ApiType.IVRAPI]: endpoints.IVRAPI_CITATION_SEARCH,
    [ApiType.ASDAPI]: endpoints.ASDAPI_CITATION_SEARCH,
    [ApiType.NWAPI]: endpoints.NWAPI_CITATION_SEARCH,
  };

  const endpoint = endpointMap[api];
  // No default needed — TypeScript enforces ApiType enum at compile time

  const headers = HeadersCrm.getCrmHeader();
  const payload = PayloadCrm.createCitationSearchByIdPayload(citationId);

  const apilib = new APIUtils(request, testInfo);
  const response = await apilib.postCallWithResponseCodeValidation(
    endpoint,
    headers,
    payload,
    200,
  );
  const body: CitationResponse = await response.json();

  if (validateCitationResponse(body)) {
    console.log(`Citation Summary: ${body.citations.length} citations found`);
  }

  return body;
}
```

---

## ðŸ‹ï¸ Practice Challenges

**Challenge 1 (getEndpointDescription):** What does `getEndpointDescription('/api/v2/customers/CMS12345/addresses')` return? Trace through the method step by step.

<details><summary>Answer</summary>

1. Split: `['api', 'v2', 'customers', 'CMS12345', 'addresses']`
2. Filter (remove empty + version): `['api', 'customers', 'CMS12345', 'addresses']`
   - Wait — 'api' is also not a version number. It stays. But it's also not an ID. Let's re-trace:
   - parts = `['api', 'customers', 'CMS12345', 'addresses']`
3. Loop from right (i=3): `parts[3] = 'addresses'` → not an ID.
   - Check: `i < parts.length - 1`? → `3 < 3`? → false. So we go to the "else" branch.
   - `description = 'Addresses'` (capitalised)
   - Break.
4. Return: `"Addresses"`

The method correctly identifies 'addresses' as the final sub-resource and returns it capitalised.

</details>

**Challenge 2 (Factory Design):** Your API team adds a new required header `x-request-nonce` (a UUID that must be unique per request for replay attack prevention). Where do you add it in the architecture, and what is the impact on existing tests?

<details><summary>Answer</summary>

Add it to `HeadersCrm.getCrmHeader()`:

```typescript
static getCrmHeader(): Record<string, string> {
  return {
    // existing headers...
    'x-request-nonce': randomUUID(), // unique per call
  };
}
```

Impact on existing tests: ZERO. All tests that call `HeadersCrm.getCrmHeader()` automatically get the new header. No test file needs to change. This is the exact reason the Factory pattern exists.

</details>

**Challenge 3 (Endpoint Assembly):** The staging IVR API is being migrated from `v2` to `v3`. Only the IVR endpoints change — CRM and ASD stay on `v2`. Redesign the `endpoints.ts` file to handle this without changing any test file.

<details><summary>Answer</summary>

```typescript
const CRM_VERSION = process.env.CRM_API_VERSION ?? "v2";
const IVR_VERSION = process.env.IVR_API_VERSION ?? "v3"; // â† separate version
const ASD_VERSION = process.env.ASD_API_VERSION ?? "v2";

export const endpoints = {
  CRM_CUSTOMER_SEARCH: `${CRM_HOST}/api/${CRM_VERSION}/customers/search`,
  IVRAPI_CITATION_SEARCH: `${IVR_HOST}/api/${IVR_VERSION}/citations/search`,
  ASDAPI_CITATION_SEARCH: `${ASD_HOST}/api/${ASD_VERSION}/citations/search`,
} as const;
```

No test file changes. The version per API is controlled from the `.env` file.

</details>

---

### Challenge 4 [Spot the Bug — `as const` Mutation]

```typescript
// endpoints.ts
export const endpoints = {
  CRM_CITATION_DETAILS: `${CRM_HOST}/api/v2/citations`,
} as const;

// In a test fixture, someone does this:
endpoints.CRM_CITATION_DETAILS = `${CRM_HOST}/api/v3/citations`; // ← Can they?
```

Will TypeScript allow this mutation? What runtime error (if any) occurs?

<details><summary>Answer</summary>

**TypeScript compile-time error** — TypeScript will reject the assignment with:  
`Cannot assign to 'CRM_CITATION_DETAILS' because it is a read-only property.`

`as const` makes the object **deeply readonly** at the type level. Every property becomes `readonly`, preventing mutation.

However, note that `as const` is a TypeScript type annotation — it has **zero runtime effect**. If you cast away the type (`(endpoints as any).CRM_CITATION_DETAILS = '...'`), the mutation silently succeeds at runtime. This is why deep-freeze utilities exist for production-critical config:

```typescript
import { deepFreeze } from "./utils";
export const endpoints = deepFreeze({
  CRM_CITATION_DETAILS: `${CRM_HOST}/api/v2/citations`,
});
```

`Object.freeze()` / `deepFreeze()` throws a `TypeError` on mutation in strict mode at runtime.

**SDE Insight**: `as const` catches mistakes at compile time during development. `Object.freeze` catches them in CI/production. Use both for config objects that must never be mutated.

</details>

---

### Challenge 5 [Architecture — When Factory Becomes Over-Engineering]

Your team has only 2 API tests. A teammate insists on implementing `HeadersCrm`, `PayloadCrm`, `APIUtils`, and environment-assembled `endpoints.ts` from day one. You argue this is over-engineering. Who is right, and what is the correct threshold rule?

<details><summary>Answer</summary>

**Both are right depending on trajectory.**

The teammate is right if the project is expected to grow to 20+ tests within one sprint — retrofitting architecture into 50 test files later is far more expensive than building it once now.

You are right if this is a one-off investigation script or a very short-lived test suite — the abstraction layers add cognitive overhead for no benefit.

**The correct threshold rule (industry standard)**:

| Signal                                                       | Action                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------ |
| 1 test file, 1-3 API calls                                   | Use `request.get()` directly in the test — no wrappers |
| 2+ test files call the SAME endpoint                         | Extract headers into a shared factory                  |
| 3+ files reference the same base URL                         | Introduce `endpoints.ts`                               |
| 5+ files need the same response-parsing/error-handling logic | Introduce `APIUtils`                                   |

**SDE principle**: Don't abstract until the duplication hurts. But once it hurts, abstract decisively — because duplication compounds.

</details>

---

**Navigation**: [← Previous: Enterprise Headers & Auth](03_Enterprise_Headers_Auth.md) | [Index](../00_MASTER_INDEX.md) | [Next: Data From API To Test →](05_Data_From_API_To_Test.md)
