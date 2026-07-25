# 21. Enterprise Project Structure — The "Why" Behind Every Folder

**Navigation**: [← Chapter 20: Practice Resources](../00_Pathways/PATHWAY_01_LEARNING.md) | [Index](../00_INDEX.md) | [→ Chapter 22: Headers, Payloads & Endpoints](./22_Headers_Payloads_Endpoints_Factory.md)

**Cross-links:**

- [`06_Custom_Fixtures_Architecture.md`](../02_Core_Architecture/06_Custom_Fixtures_Architecture.md) — Fixtures internals
- [`05_POM_Architecture_Deep_Dive.md`](../02_Core_Architecture/05_POM_Architecture_Deep_Dive.md) — POM structure
- [`24_Advanced_API_Testing/07_Complex_Nested_API_Assertions.md`](../../24_Advanced_API_Testing/07_Complex_Nested_API_Assertions.md) — API layer

---

## The Core Question This Chapter Answers

When you join a real automation team and open the repo, you see this:

```
tests/
├── fixtures/
├── pages/
├── components/
├── clients/
├── config/
│   ├── endpoints.ts
│   └── environments.ts
├── data/
│   ├── headers/
│   ├── payloads/
│   └── enums/
├── types/
├── utils/
└── specs/
```

A junior SDET's first question: **"Why is it split this way? Can't we just put everything in the spec file?"**

This chapter answers that question with **real enterprise reasoning** — not "because best practices say so," but because each decision prevents a real, painful failure that has happened to real teams.

---

## 1. The "Everything in One File" Disaster

Let's start where everyone starts — the bad version:

```typescript
// ❌ BAD: everything in the spec file — seen in every junior team's early days

test("Create citation and verify notification", async ({ page, request }) => {
  // Hardcoded URL — breaks when you deploy to staging
  await page.goto("http://localhost:8080/crm");

  // Hardcoded credentials — they expire, rotate, or change environments
  await page.fill("#username", "admin@company.com");
  await page.fill("#password", "Admin@123");
  await page.click("#loginBtn");

  // Hardcoded API endpoint — breaks in every other environment
  const response = await request.post("http://localhost:9090/api/citations", {
    headers: {
      Authorization: "Bearer eyJhbGciOiJSUzI1NiJ9...", // ← this expires!
      "Content-Type": "application/json",
      "X-Tenant-ID": "ACME-001", // ← different per environment
    },
    data: {
      customerId: "C-001",
      amount: 150.0,
      status: "PENDING",
      citationType: "PARKING",
    },
  });

  // Inline assertion — no shared expectation library
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.status).toBe("PENDING");

  // Checking a notification 3 lines below the API call — no separation
  const notifResponse = await request.get(
    `http://localhost:9090/api/notifications?userId=C-001`,
  );
  const notifs = await notifResponse.json();
  expect(notifs[0].type).toBe("CITATION_CREATED");
});
```

**What breaks immediately:**

1. Commits staging credentials to Git → **security incident**
2. Another test has `localhost:8080` → when you run against staging, everything fails
3. The Bearer token expires in 1 hour → CI fails at 2 AM
4. `'PARKING'` is a magic string → someone renames it in the DB to `'PARKING_VIOLATION'` → silent test failure
5. Four people each hard-code the same header → one person updates it, three tests still have the old value

---

## 2. The Folder Map — Each Folder Solves One Problem

### `config/` — "What environment are we running in?"

```typescript
// config/environments.ts
// WHY: URLs change per environment (local, dev, staging, prod).
//      Tests must NEVER have URLs hardcoded. They read from this file.

export const Environments = {
  local: {
    crmUrl: "http://localhost:8080/crm",
    customerPortalUrl: "http://localhost:3000",
    apiBaseUrl: "http://localhost:9090",
    notificationServiceUrl: "http://localhost:9091",
  },
  dev: {
    crmUrl: "https://dev-crm.company.com",
    customerPortalUrl: "https://dev-portal.company.com",
    apiBaseUrl: "https://dev-api.company.com",
    notificationServiceUrl: "https://dev-notifications.company.com",
  },
  staging: {
    crmUrl: "https://staging-crm.company.com",
    customerPortalUrl: "https://staging-portal.company.com",
    apiBaseUrl: "https://staging-api.company.com",
    notificationServiceUrl: "https://staging-notifications.company.com",
  },
} as const;

// Which environment to use — set by CI/CD or local .env file
export type Environment = keyof typeof Environments;
export const currentEnv = (process.env.TEST_ENV ?? "local") as Environment;
export const config = Environments[currentEnv];
```

**Why this pattern?** `config.crmUrl` is used 40 times across your test suite. When you need to test against staging, you just set `TEST_ENV=staging`. Without this, you'd have to find-and-replace 40 hardcoded URLs and hope you didn't miss one.

---

### `config/endpoints.ts` — "What are the exact API paths?"

```typescript
// config/endpoints.ts
// WHY: API paths change across versions (v1 → v2) and environments.
//      Centralising them means you change ONE line when a path changes.

import { config } from "./environments";

// Functions, not constants — they compose the base URL + path at call time
// This way, if config.apiBaseUrl changes, all endpoints update automatically.
export const Endpoints = {
  citations: {
    create: () => `${config.apiBaseUrl}/api/v2/citations`,
    getById: (id: string) => `${config.apiBaseUrl}/api/v2/citations/${id}`,
    update: (id: string) => `${config.apiBaseUrl}/api/v2/citations/${id}`,
    delete: (id: string) => `${config.apiBaseUrl}/api/v2/citations/${id}`,
    search: () => `${config.apiBaseUrl}/api/v2/citations/search`,
    byUser: (userId: string) =>
      `${config.apiBaseUrl}/api/v2/citations?userId=${userId}`,
  },
  notifications: {
    getByUser: (userId: string) =>
      `${config.notificationServiceUrl}/api/notifications?userId=${userId}`,
    send: () => `${config.notificationServiceUrl}/api/notifications`,
  },
  auth: {
    login: () => `${config.apiBaseUrl}/api/auth/login`,
    refresh: () => `${config.apiBaseUrl}/api/auth/refresh`,
  },
  users: {
    create: () => `${config.apiBaseUrl}/api/v1/users`,
    getById: (id: string) => `${config.apiBaseUrl}/api/v1/users/${id}`,
  },
} as const;

// Usage in tests:
// const response = await request.get(Endpoints.citations.getById('CIT-001'));
// ← If the path changes from /v2/ to /v3/, you change it in ONE place.
```

**Why functions, not strings?** Because `Endpoints.citations.getById('CIT-001')` produces a full URL at call time. The `id` parameter is required — TypeScript catches `Endpoints.citations.getById()` (missing arg) at compile time, not at runtime.

---

### `data/enums/` — "Why enums instead of magic strings?"

```typescript
// data/enums/citation.enums.ts
// WHY: 'PARKING' can be typo'd as 'PAKING'. 'PAID' can become 'Paid'.
//      TypeScript enums catch these at compile time, not after a 3-hour debug session.

export enum CitationStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  DISPUTED = "DISPUTED",
  CANCELLED = "CANCELLED",
}

export enum CitationType {
  PARKING = "PARKING",
  SPEEDING = "SPEEDING",
  BUS_LANE = "BUS_LANE",
  NO_PERMIT = "NO_PERMIT",
}

export enum UserRole {
  ADMIN = "ADMIN",
  AGENT = "AGENT",
  SUPERVISOR = "SUPERVISOR",
  CUSTOMER = "CUSTOMER",
}

export enum NotificationType {
  CITATION_CREATED = "CITATION_CREATED",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED",
}
```

**The before/after:**

```typescript
// ❌ BEFORE — magic strings, typos compile and fail at runtime
await citationClient.createCitation({ status: "Pending", type: "parking" });
// TypeScript: no error. API returns 400. You spend 20 minutes debugging.

// ✅ AFTER — enums, typos fail at compile time in VS Code before you even run
await citationClient.createCitation({
  status: CitationStatus.PENDING, // try typing CitationStatus.Pening — red underline immediately
  type: CitationType.PARKING,
});
```

**Autocomplete bonus:** When you type `CitationStatus.` — VS Code shows all valid values. No need to open the API docs.

---

### `data/headers/` — "Why separate files for request headers?"

```typescript
// data/headers/HeadersCrm.ts
// WHY: Every API call to the CRM needs the same 4 headers.
//      Duplicating them across 30 test files is maintenance hell.
//      When X-Tenant-ID format changes, you fix ONE file, not 30.

export class HeadersCrm {
  // Static: no instance needed — headers are just data, not stateful behaviour
  static auth(accessToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${accessToken}`, // accessToken from fixture, NOT hardcoded
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Tenant-ID": process.env.TENANT_ID!, // from env, NOT hardcoded
    };
  }

  // Different auth method for service-to-service (API key instead of Bearer)
  static apiKey(): Record<string, string> {
    return {
      "X-API-Key": process.env.CRM_API_KEY!,
      "Content-Type": "application/json",
      "X-Tenant-ID": process.env.TENANT_ID!,
    };
  }

  // Multipart for file uploads
  static multipart(accessToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${accessToken}`,
      "X-Tenant-ID": process.env.TENANT_ID!,
      // Note: NO Content-Type here — browser sets it automatically for multipart
    };
  }
}

// Usage in clients:
// await request.post(url, { headers: HeadersCrm.auth(accessToken), data: payload });
```

**Why static methods?** Headers are stateless data — they don't need object instance state. A static factory method gives you the data when called, with zero object creation overhead.

**Why the access token is a PARAMETER, not read directly from env?**
Because the access token comes from the **fixture** (which may have refreshed it), not from `process.env`. If it came from `process.env`, and the token expired, every test would fail with 401s but you'd have no fixture-level retry logic.

---

### `data/payloads/` — "Why separate files for request bodies?"

```typescript
// data/payloads/PayloadsCitation.ts
// WHY: API request bodies are big, complex objects. Defining them in spec
//      files makes specs hard to read. A factory function keeps specs clean.

import { CitationStatus, CitationType } from "../enums/citation.enums";

// The TypeScript interface — defines exactly what the API expects
export interface CreateCitationPayload {
  customerId: string;
  amount: number;
  status: CitationStatus;
  citationType: CitationType;
  issueDate?: string; // optional — API uses today's date if omitted
  notes?: string; // optional
  registrationPlate?: string;
  locationCode?: string;
}

// Factory class — creates payloads with sensible test defaults
export class PayloadsCitation {
  // The "standard" payload for happy-path tests
  static create(
    overrides: Partial<CreateCitationPayload> = {},
  ): CreateCitationPayload {
    return {
      customerId: overrides.customerId ?? "TEST-CUSTOMER-001",
      amount: overrides.amount ?? 150.0,
      status: overrides.status ?? CitationStatus.PENDING,
      citationType: overrides.citationType ?? CitationType.PARKING,
      issueDate: overrides.issueDate ?? new Date().toISOString().split("T")[0],
      ...overrides,
    };
  }

  // A ready-made PAID citation payload
  static paid(customerId: string): CreateCitationPayload {
    return PayloadsCitation.create({
      customerId,
      status: CitationStatus.PAID,
      amount: 200.0,
    });
  }

  // A citation ready for dispute
  static disputed(customerId: string): CreateCitationPayload {
    return PayloadsCitation.create({
      customerId,
      status: CitationStatus.DISPUTED,
      notes: "Customer disputes this citation — automated test",
    });
  }
}

// Usage in tests — clean, readable, no large JSON blocks in spec files:
// await citationsClient.create(PayloadsCitation.create({ customerId: account.userId }));
// await citationsClient.create(PayloadsCitation.paid(account.userId));
```

**The override pattern is critical.** `PayloadsCitation.create({ customerId: account.userId })` gives you the standard payload BUT with the real test user's ID. You're not inventing test data — you're composing it with the actual runtime values from your fixtures.

---

### `types/` — "Why a separate folder for TypeScript interfaces?"

```typescript
// types/api-responses.types.ts
// WHY: API response shapes are used in MULTIPLE places:
//      - In clients (parsing the response)
//      - In tests (asserting on the response)
//      - In utilities (transforming the response)
//      Keeping them in one place prevents duplication and ensures consistency.

export interface CitationApiResponse {
  citationId: string;
  customerId: string;
  status: "PENDING" | "PAID" | "OVERDUE" | "DISPUTED" | "CANCELLED";
  amount: number;
  citationType: string;
  issueDate: string;
  createdAt: string;
  updatedAt: string;
  notifications?: NotificationSummary[];
}

export interface NotificationSummary {
  id: string;
  type: string;
  sentAt: string;
  channel: "email" | "sms" | "push";
  status: "queued" | "sent" | "delivered" | "failed";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

---

### `clients/` — "Why a client class for each API service?"

```typescript
// clients/CitationsApiClient.ts
// WHY: Direct `request.post(url, { headers, data })` calls in tests are verbose
//      and leak implementation details (URL, headers, parsing) into the spec.
//      A client class hides all of that behind a clean method call.
//      Tests say WHAT to do; clients handle HOW to do it via HTTP.

import { type APIRequestContext } from "@playwright/test";
import { Endpoints } from "../config/endpoints";
import { HeadersCrm } from "../data/headers/HeadersCrm";
import type {
  CitationApiResponse,
  CreateCitationPayload,
} from "../types/api-responses.types";

export class CitationsApiClient {
  constructor(
    private readonly request: APIRequestContext, // injected from fixture
    private readonly accessToken: string, // injected from account fixture
  ) {}

  async create(payload: CreateCitationPayload): Promise<CitationApiResponse> {
    const response = await this.request.post(Endpoints.citations.create(), {
      headers: HeadersCrm.auth(this.accessToken),
      data: payload,
    });

    if (!response.ok()) {
      throw new Error(
        `CitationsApiClient.create failed: ${response.status()} ${response.statusText()}\n` +
          `URL: ${Endpoints.citations.create()}\n` +
          `Response: ${await response.text()}`,
      );
    }

    return response.json() as Promise<CitationApiResponse>;
  }

  async getById(citationId: string): Promise<CitationApiResponse> {
    const response = await this.request.get(
      Endpoints.citations.getById(citationId),
      {
        headers: HeadersCrm.auth(this.accessToken),
      },
    );

    if (response.status() === 404) {
      throw new Error(`Citation not found: ${citationId}`);
    }
    if (!response.ok()) {
      throw new Error(
        `CitationsApiClient.getById failed: ${response.status()} for ${citationId}`,
      );
    }

    return response.json() as Promise<CitationApiResponse>;
  }

  async updateStatus(
    citationId: string,
    status: string,
  ): Promise<CitationApiResponse> {
    const response = await this.request.patch(
      Endpoints.citations.update(citationId),
      {
        headers: HeadersCrm.auth(this.accessToken),
        data: { status },
      },
    );

    if (!response.ok()) {
      throw new Error(
        `CitationsApiClient.updateStatus failed: ${response.status()}`,
      );
    }

    return response.json() as Promise<CitationApiResponse>;
  }
}
```

**The critical question: why is the error thrown from the CLIENT, not checked in the test?**

Because tests should be about **assertions on business behaviour**, not about HTTP error handling. If `create()` throws, the test step fails with a clear message. If you check `response.ok()` in every test, you have HTTP code noise in 50 spec files.

---

### `utils/` — "Why utility files? What goes in them?"

```typescript
// utils/date.utils.ts
// WHY: Date formatting is used in 15 different test files.
//      A utility avoids duplication and makes the intent clear.

export const DateUtils = {
  today(): string {
    return new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'
  },
  daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
  },
  isoNow(): string {
    return new Date().toISOString(); // 'YYYY-MM-DDTHH:mm:ss.sssZ'
  },
  unixNow(): number {
    return Math.floor(Date.now() / 1000);
  },
};

// Usage in tests:
// PayloadsCitation.create({ issueDate: DateUtils.today() })

// utils/string.utils.ts
export const StringUtils = {
  randomEmail(prefix = "test"): string {
    return `${prefix}-${Date.now()}@company-test.com`;
  },
  randomName(): string {
    return `AutoTest-${Date.now()}`;
  },
  truncate(str: string, maxLength = 50): string {
    return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
  },
};
```

---

## 3. The Full Picture — How Everything Connects

```
playwright.config.ts
  Sets: baseURL, workers, projects, storageState
         ↓
fixtures/index.ts
  Provides: account (worker-scoped), citationsClient (test-scoped)
  account reads from: process.env (set by .env file or CI/CD)
         ↓
spec file (tests/specs/citations/create-citation.spec.ts)
  Imports: { test, expect } from '../../fixtures'
  Uses:    PayloadsCitation (payloads), Endpoints (via client), enums
  NEVER contains: URLs, credentials, raw JSON payloads
         ↓
         test('...', async ({ page, account, citationsClient }) => {
           const masterPage = new MasterPage(page);   ← POM before steps
           const data = { citationId: null };          ← accumulator
           await test.step('Step 1', async () => { ... });
         })
```

---

## 4. The Monorepo Structure & Shared Library Pattern

As teams grow, you often end up with multiple Playwright projects testing different micro-frontends or services, all needing the same POMs, clients, and payloads.

Instead of copying `clients/` and `pages/` into 5 different repositories, enterprise teams use a **Monorepo** structure.

### Monorepo Architecture Visualised

```mermaid
graph TD
    subgraph "Monorepo (packages/)"
        subgraph "Shared Libraries"
            CORE[core-test-utils<br/>(db, auth, reporters)]
            API[shared-api-clients<br/>(axios, payloads)]
            POM[shared-poms<br/>(login, navigation)]
        end

        subgraph "Test Projects"
            CRM[CRM Tests<br/>(playwright.config.ts)]
            BILL[Billing Tests<br/>(playwright.config.ts)]
            CUST[Customer Portal Tests<br/>(playwright.config.ts)]
        end
    end

    CRM --> CORE
    CRM --> API
    CRM --> POM

    BILL --> CORE
    BILL --> API

    CUST --> CORE
    CUST --> API
    CUST --> POM
```

**The Shared Library Pattern:**
Create an internal npm package (e.g., `@mycompany/test-core`) containing the setup code, generic helpers, API clients, and common page objects.

```typescript
// In CRM Tests: playwright.config.ts
import { enterpriseConfig } from "@mycompany/test-core/config";

export default {
  ...enterpriseConfig, // Inherits workers, reporters, retries
  testDir: "./tests",
};
```

```typescript
// In CRM Tests: tests/login.spec.ts
import { test, expect } from "@mycompany/test-core/fixtures";
import { LoginPage } from "@mycompany/shared-poms";

test("login to CRM", async ({ page, authAccount }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login(authAccount.email, authAccount.password);
});
```

---

## 5. TSConfig Paths Strategy

When your project gets deep, imports become unreadable:

```typescript
// ❌ BAD: "Relative path hell"
import { PayloadsCitation } from "../../../../data/payloads/PayloadsCitation";
import { CitationsApiClient } from "../../../../clients/CitationsApiClient";
```

**The Fix:** Use `tsconfig.json` paths to map root directories to `@` aliases.

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@data/*": ["data/*"],
      "@clients/*": ["clients/*"],
      "@pages/*": ["pages/*"],
      "@fixtures/*": ["fixtures/*"]
    }
  }
}
```

```typescript
// ✅ GOOD: Absolute alias imports
import { PayloadsCitation } from "@data/payloads/PayloadsCitation";
import { CitationsApiClient } from "@clients/CitationsApiClient";
```

_Note: Playwright understands `tsconfig.json` paths automatically out of the box._

---

## 🏋️ Practice Challenges

### Challenge 1 [MCQ] — Why Endpoints Are Functions

`Endpoints.citations.getById` is defined as `(id: string) => \`...\``instead of`'https://api.example.com/citations/${id}'`. Why?

A) Functions are faster than template literals  
B) TypeScript enforces the `id` argument at compile time, and the base URL from `config` is composed at call time (so environment changes are automatic)  
C) Arrow functions are required for `as const` to work  
D) This is just convention — both approaches work identically

<details><summary>Answer</summary>

**B** — Two reasons:

1. TypeScript sees `getById()` (missing `id`) as a compile-time error. A string constant like `'https://api.example.com/citations/undefined'` would produce a runtime error instead.
2. The URL is assembled from `config.apiBaseUrl` at call time. When you switch from `local` to `staging`, `config.apiBaseUrl` changes → all endpoints change automatically. A hardcoded string in a constant wouldn't update.
</details>

---

### Challenge 2 [Spot the Bug]

```typescript
// data/payloads/PayloadsCitation.ts
export class PayloadsCitation {
  static create(): CreateCitationPayload {
    return {
      customerId: "FIXED-TEST-CUSTOMER", // ← hardcoded
      amount: 150.0,
      status: CitationStatus.PENDING,
      citationType: CitationType.PARKING,
    };
  }
}

// In test:
const citation = await citationsClient.create(PayloadsCitation.create());
expect(citation.customerId).toBe(account.userId); // ← fails!
```

<details><summary>Answer</summary>

`PayloadsCitation.create()` always uses `'FIXED-TEST-CUSTOMER'` regardless of which test account is running. The `expect(citation.customerId).toBe(account.userId)` fails because the citation was created for `FIXED-TEST-CUSTOMER`, not the real test user.

Fix — accept an override:

```typescript
static create(overrides: Partial<CreateCitationPayload> = {}): CreateCitationPayload {
  return {
    customerId: overrides.customerId ?? 'TEST-CUSTOMER-001', // overrideable default
    amount: overrides.amount ?? 150.00,
    status: CitationStatus.PENDING,
    citationType: CitationType.PARKING,
    ...overrides,
  };
}

// In test:
const citation = await citationsClient.create(
  PayloadsCitation.create({ customerId: account.userId }) // ← real user ID
);
```

</details>

---

### Challenge 3 [Write It Yourself]

Write a `PayloadsUser` factory class with two methods:

- `newAgent(email: string)` — creates an AGENT role user with the given email
- `newSupervisor(email: string, teamId: string)` — creates a SUPERVISOR with an additional `teamId` field

<details><summary>Answer</summary>

```typescript
// data/payloads/PayloadsUser.ts

import { UserRole } from "../enums/citation.enums";

export interface CreateUserPayload {
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  teamId?: string; // optional — only for SUPERVISOR and above
  isActive: boolean;
}

export class PayloadsUser {
  static newAgent(email: string): CreateUserPayload {
    return {
      email,
      role: UserRole.AGENT,
      firstName: `Agent-${Date.now()}`,
      lastName: "Automation",
      isActive: true,
    };
  }

  static newSupervisor(email: string, teamId: string): CreateUserPayload {
    return {
      email,
      role: UserRole.SUPERVISOR,
      firstName: `Supervisor-${Date.now()}`,
      lastName: "Automation",
      teamId,
      isActive: true,
    };
  }
}
```

</details>

---

### Challenge 4 [MCQ] — Where Does Error Handling Belong?

You have a `CitationsApiClient.create()` that gets a 422 Unprocessable Entity from the server. Where should the error be handled?

A) In the spec file: `if (!response.ok()) { console.warn(...); }` — so tests control their own error logic  
B) Swallowed in the client: catch the error and return `null` — so tests don't crash on validation errors  
C) Thrown in the client with a descriptive message — so the test step fails clearly with full context  
D) In a global Playwright error handler — so one handler covers all API errors

<details><summary>Answer</summary>

**C** — Throw in the client with a descriptive message including: HTTP status, URL, and response body.

**Why not A**: If every spec file checks `!response.ok()`, you have HTTP error handling code in 50 test files. When the error format changes, you update 50 files. The client is the single place to put this.

**Why not B**: Returning `null` silently hides failures. The test sees `null` and crashes with `Cannot read properties of null` — giving you ZERO information about WHY it failed. Always prefer explicit failures with context.

**Why not D**: Global handlers catch all errors but can't add context specific to which client method failed. `CitationsApiClient.create` failing is different from `CitationsApiClient.getById` failing — you want the error message to reflect that.

**The pattern:**

```typescript
// In client (throw with context):
if (!response.ok()) {
  throw new Error(
    `CitationsApiClient.create failed: ${response.status()} ${response.statusText()}\n` +
      `URL: ${url}\nPayload: ${JSON.stringify(payload)}\nResponse: ${await response.text()}`,
  );
}

// In test (no error handling needed — if it throws, the test step fails with the above message):
await test.step("Create citation via API", async () => {
  citation = await citationsClient.create(
    PayloadsCitation.create({ customerId: account.userId }),
  );
  // If create() throws 422, this step fails with full context. No need to check here.
});
```

</details>

---

### Challenge 5 [Spot the Bug — Architecture]

```typescript
// clients/CitationsApiClient.ts
async create(payload: CreateCitationPayload): Promise<{ citationId: string; status: string }> {
  const response = await this.request.post(url, { data: payload });
  return response.json();
}

// tests/specs/citations.spec.ts
const citation: { citationId: string; status: string; createdAt: string } = await citationsClient.create(payload);
// ^ TypeScript error: Property 'createdAt' does not exist on type '{ citationId: string; status: string }'
```

The test needs `createdAt` but the client's return type doesn't include it. What is the correct fix?

<details><summary>Answer</summary>

The response type is defined inline in the client's return type — which doesn't match the actual API response. The same type is being manually re-declared in the spec file with different fields.

**Root cause**: The response type is not centralised in `types/api-responses.types.ts`. It's being defined ad-hoc in the client and again in the test.

**Fix**:

1. Define the full response type in `types/api-responses.types.ts`:

```typescript
// types/api-responses.types.ts
export interface CitationApiResponse {
  citationId: string;
  status: string;
  createdAt: string; // ← included once, in the shared type
  amount: number;
  // ... all other fields
}
```

2. Import it everywhere:

```typescript
// clients/CitationsApiClient.ts
import type { CitationApiResponse } from '../types/api-responses.types';

async create(payload: CreateCitationPayload): Promise<CitationApiResponse> {
  // ...
}

// tests/specs/citations.spec.ts
import type { CitationApiResponse } from '../../types/api-responses.types';
const citation: CitationApiResponse = await citationsClient.create(payload);
// TypeScript now knows ALL fields including createdAt
```

One type definition. Used in 20 places. When the API adds a new field, you add it once — all clients and tests immediately see it.

</details>

---

**Navigation**: [← Chapter 20: Practice Resources](../00_Pathways/PATHWAY_01_LEARNING.md) | [Index](../00_INDEX.md) | [→ Chapter 22: Headers, Payloads & Endpoints](./22_Headers_Payloads_Endpoints_Factory.md)


---

## Reality Check

**"Flat test file structure works for all project sizes"** ? A flat directory with 200 test files is unnavigable. Enterprise structure needs: functional grouping (auth, checkout, admin), layer separation (e2e, api, visual), and environment configuration (staging, production). The structure should match your CI pipeline: each directory can run independently, enabling selective test execution based on what changed.

**"One shared page object per page is sufficient"** ? Large pages with 50+ interactive elements produce page objects with 50+ methods. Split by logical COMPONENT: LoginForm, NavigationBar, UserProfileCard, OrderTable. Components compose into page-level operations. This mirrors how frontend developers think and makes maintenance tractable when a component redesign affects only one file.

**"Global test fixtures handle all shared setup"** ? Global fixtures run once for the ENTIRE suite. But some setup is per-WORKER (database connection), per-TEST (unique test data), or per-PROJECT (configuration). Playwright supports all four scopes. Using global scope for per-test data creates shared state bugs. Using per-test scope for expensive setup (browser login) wastes execution time.

**"Enterprise projects need custom test runners"** ? Playwright's built-in runner handles: parallel execution, retries, sharding across CI nodes, project-based configuration, and multiple reporters. Building a custom runner introduces bugs that Playwright has already solved. Extend Playwright with custom fixtures, reporters, and global setup � do not replace the runner.

**"More abstraction layers make tests more maintainable"** ? Test ? Page Object ? Component ? Element ? Utility creates 5 layers of indirection. When a test fails, you debug through 5 files to find the issue. Two layers (test ? page/component objects) is sufficient for most projects. Add a third layer only when 10+ page objects share identical patterns that can be extracted into a base class.
