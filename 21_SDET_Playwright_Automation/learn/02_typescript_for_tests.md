# 02. TypeScript for Tests

> Why type-driven test code pays back in maintenance cost. The progression from "JS-with-types" to "the type system catches bugs at compile time." Where generics are essential and where they're showoff code. Cross-links to the API surface; not duplicate of it.

---

## Why TypeScript at all

The case for TS in test code:

1. **Autocomplete on POMs and fixtures** — the IDE tells you what's available.
2. **Refactor safely** — rename a method; every test that used it shows the change.
3. **Catch typos at compile** — `actoken` vs `accessToken` is a compile error, not a runtime 401.
4. **Self-documenting APIs** — type signatures replace JSDoc most of the time.
5. **Onboarding signal** — new hires read types, learn the system shape.

The case against:

- "Strict TS slows me down." Real, for the first month. Pays back from month 2.
- "We have `any` everywhere anyway." Then you've taken on TS's cost and not its benefit. Tighten one file at a time.

For an SDET earning enterprise wages, the productivity ROI of TS is positive. Doesn't mean it's free.

---

## The journey

### Stage 1 — TS-as-JS

```typescript
test("login", async ({ page }: any) => {
  await page.goto("/login");
  // ...
});
```

You can write this. It works. You get zero TS benefit.

Signs you're here:

- Every parameter is `: any`.
- `as any` casts everywhere.
- Tests work but refactoring is dangerous.

### Stage 2 — Inferred types

```typescript
import { test } from "@playwright/test";

test("login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("user@example.com");
});
```

The `{ page }` destructure is inferred from `test`'s signature. No annotations needed. Autocomplete works. Most enterprise tests live here.

### Stage 3 — Explicit typed APIs

```typescript
interface Citation {
  id: string;
  status: "PENDING" | "PAID" | "DISPUTED" | "DELETED";
  amount: number;
}

class CitationsClient {
  async getById(id: string): Promise<Citation> {
    const response = await this.request.get(`/citations/${id}`);
    return response.json();
  }
}
```

Domain types, typed clients, typed fixtures. The framework's body is typed; tests destructure into typed names.

This is where the framework lives. Reference: [`reference/06_api_testing.md`](../reference/06_api_testing.md).

### Stage 4 — Type-driven design

```typescript
type CitationStatus = "PENDING" | "PAID" | "DISPUTED" | "DELETED";

type Citation<S extends CitationStatus = CitationStatus> = {
  id: string;
  status: S;
  amount: number;
  paidAt: S extends "PAID" ? string : null;
  disputeReason: S extends "DISPUTED" ? string : null;
};

async function payCitation(c: Citation<"PENDING">): Promise<Citation<"PAID">> {
  // Caller must pass PENDING citation. Returns PAID.
}
```

Types model state machines. Impossible states become uncallable. The type system catches "you tried to pay an already-paid citation" before runtime.

Most tests don't need this. It's the right level for the framework's foundation classes.

---

## The patterns that matter

### Discriminated unions for API responses

```typescript
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

async function getCitation(id: string): Promise<ApiResult<Citation>> {
  const response = await request.get(`/citations/${id}`);
  if (!response.ok()) {
    return { ok: false, error: await response.json() };
  }
  return { ok: true, data: await response.json() };
}

const result = await getCitation("CIT-001");
if (result.ok) {
  // TS knows result.data exists
  expect(result.data.amount).toBe(150);
} else {
  // TS knows result.error exists
  expect(result.error.code).toBe("NOT_FOUND");
}
```

The `if (result.ok)` narrows the type. No more `if (response.data)` checks scattered everywhere.

### Generics for reusable HTTP wrappers

```typescript
class APIUtils {
  async post<TPayload, TResponse>(
    endpoint: string,
    payload: TPayload,
  ): Promise<TResponse> {
    const r = await this.request.post(endpoint, { data: payload });
    return r.json();
  }
}

const citation = await api.post<CreateCitation, Citation>("/citations", {
  amount: 150,
  status: "PENDING",
});
// citation is typed as Citation
```

Reference: [`reference/06_api_testing.md`](../reference/06_api_testing.md).

### `as const` for immutable test data

```typescript
const TEST_USERS = {
  admin: { username: "admin", role: "ADMIN" },
  user: { username: "user", role: "USER" },
} as const;

// TEST_USERS.admin.role is typed as the literal 'ADMIN', not string.
function loginAs(role: "ADMIN" | "USER") {
  /* ... */
}
loginAs(TEST_USERS.admin.role); // works — role is literal 'ADMIN'
```

Without `as const`, `role` widens to `string` and the call fails type-check.

### Branded types for IDs

```typescript
type CustomerId = string & { readonly __brand: "CustomerId" };
type OrderId = string & { readonly __brand: "OrderId" };

function asCustomerId(s: string): CustomerId {
  return s as CustomerId;
}

async function getCustomer(id: CustomerId): Promise<Customer> {
  /* ... */
}
async function getOrder(id: OrderId): Promise<Order> {
  /* ... */
}

const cid = asCustomerId("cust-001");
const oid = "ord-001" as OrderId;

getCustomer(cid); // OK
getCustomer(oid); // ❌ TS error — type mismatch
```

Prevents "passed an order ID where customer ID was expected" at compile time. Rare in tests but useful in large frameworks with many ID types.

### `satisfies` for type-check without widening

```typescript
const ENDPOINTS = {
  citations: {
    list: "/citations",
    create: "/citations",
    getById: (id: string) => `/citations/${id}`,
  },
} satisfies Record<string, Record<string, string | ((arg: string) => string)>>;

ENDPOINTS.citations.getById("CIT-001"); // typed as string
```

`satisfies` validates shape without widening. Useful for config objects where you want strong inference AND validation.

---

## Generics — where they earn their complexity

| Pattern                              | Use?                                 |
| ------------------------------------ | ------------------------------------ |
| `APIUtils.post<TPayload, TResponse>` | ✅ Yes — reusable wrapper            |
| `Factory<T>().build()`               | ✅ Yes — generic builders            |
| `Pool<T>(items: T[])`                | ✅ Yes — generic resource pool       |
| `<T extends Locator>(loc: T)`        | ❌ Probably no — `Locator` is enough |
| 5-parameter generic                  | ❌ Almost always overengineered      |
| Generics in test bodies              | ❌ Tests should be concrete          |

Rule: generics in framework code, concrete types in test bodies.

---

## Strict mode — turn it on

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

`noUncheckedIndexedAccess` is the underappreciated one:

```typescript
const items = ["a", "b"];
const first = items[0]; // typed as 'string | undefined' (was just 'string')
```

Forces null-handling. Catches "what if the array is empty" at compile time.

Adoption strategy: turn it on for new code. Leave existing files unchecked with `// @ts-nocheck` until refactored. Don't try to fix everything at once.

---

## What the type system can't do

- Catch off-by-one in loops.
- Catch wrong field comparison (`expect(a.id).toBe(b.name)`).
- Catch missing assertions.
- Catch slow tests.
- Catch tests testing the wrong thing.

TS catches a CLASS of bug. The rest is still on you.

---

## What's next

- [03. POM thinking](./03_pom.md) — applying TS to page objects.
- [`reference/04_fixtures.md`](../reference/04_fixtures.md) — generic fixtures and their `test.extend<T, W>()`.
- [`reference/06_api_testing.md`](../reference/06_api_testing.md) — typed clients and Zod schemas.
- External: [`17_TypeScript/`](../../17_TypeScript/) for type system deep dives.
