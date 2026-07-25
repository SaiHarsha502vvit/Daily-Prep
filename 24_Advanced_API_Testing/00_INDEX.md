# 22. Advanced API Testing — Module Index

**Module Goal:** Master enterprise-grade API testing — REST, SOAP, complex JSON/XML responses, custom headers, factory patterns for maintainability, and direct database verification from Playwright tests.

---

## Reading Order & Time Estimates

| #   | Chapter                                                       | Time   | Key Topics                                                         | Cross-links                           |
| --- | ------------------------------------------------------------- | ------ | ------------------------------------------------------------------ | ------------------------------------- |
| 01  | [API Testing Foundations](01_API_Testing_Foundations.md)      | 40 min | REST vs SOAP, HTTP methods, status codes, Playwright's `request`   | `22_DevOps/08_HTTP_Complete`          |
| 02  | [Complex JSON and SOAP](02_Complex_JSON_and_SOAP.md)          | 45 min | Nested JSON parsing, optional chaining, SOAP envelope structure    | `17_TS/02_Advanced_Types`             |
| 03  | [Enterprise Headers & Auth](03_Enterprise_Headers_Auth.md)    | 35 min | Bearer tokens, `x-agent`, `x-correlation-id`, `SOAPAction`, Accept | `22_DevOps/08_HTTP_Complete`          |
| 04  | [APIUtils & Factory Pattern](04_API_Utils_Factory_Pattern.md) | 55 min | **APIUtils dissected, HeadersCrm/PayloadCrm, endpoint assembly**   | `06_OOP/02_Design_Patterns`           |
| 05  | [Data From API To Test](05_Data_From_API_To_Test.md)          | 45 min | **Typed response interfaces, API→UI bridge, parameterised tests**  | `21_SDET/07_E2E_Architecture`         |
| 06  | [DB Testing SQL Bridge](06_DB_Testing_SQL_Bridge.md)          | 55 min | **mssql/pg fixture, JOIN queries, CTE assertions, teardown**       | `08_SQL/07`, `08_SQL/08`, `08_SQL/13` |

**Bolded chapters** = Advanced enterprise content.

---

## Architecture Map

```
Enterprise API Codebase
         │
    ┌────┴──────────────────────────────────────────┐
    │                                               │
 endpoints.ts          HeadersCrm.ts    PayloadCrm.ts
 (URL assembly)        (static factory) (static factory)
    │                          └──────────┘
    │                               │
    └──────────────┬────────────────┘
                   ↓
              APIUtils.ts
          (wrapper: log + validate + retry)
                   │
         ┌─────────┴──────────┐
         ↓                    ↓
   Test Files            DB Fixture
   (REST/SOAP calls)     (SQL verification)
         │                    │
         └────────┬───────────┘
                  ↓
          Typed Data Accumulator
          (carries data across test.step()s)
```

---

## Quick Reference — Enterprise API Patterns

### POST Call Pattern (Your Codebase Style)

```typescript
const apilib = new APIUtils(request, testInfo);
const response = await apilib.postCallWithResponseCodeValidation(
  endpoints.IVRAPI_CITATION_SEARCH,
  HeadersCrm.getCrmHeader(),
  PayloadCrm.createCitationSearchByIdPayload(citationId),
  200,
);
const body: CitationSearchResponse = await response.json();
```

### Safe Data Extraction

```typescript
const citationId = body?.citations?.[0]?.citationId ?? null;
const status =
  body?.citations?.find((c) => c.status === "PAID")?.status ?? "NONE";
```

### DB Verification (SQL Server)

```typescript
const result = await db
  .request()
  .input("id", sql.NVarChar, citationId)
  .query("SELECT status FROM Citations WHERE citation_id = @id");
expect(result.recordset[0].status).toBe("PAID");
```

### Parameterised Test Across 3 APIs

```typescript
for (const { name, endpoint } of apiTestCases) {
  test(`Citation search via ${name}`, async ({ request }) => { ... });
}
```

---

## Links to Related Modules

- **SDET/Playwright**: [`21_SDET_Playwright_Automation/`](../21_SDET_Playwright_Automation/00_INDEX.md) — The UI side of your test flows
- **SQL**: [`08_SQL/07_JOINs_Complete.md`](../08_SQL/07_JOINs_Complete.md) — JOIN patterns for DB verification queries
- **SQL**: [`08_SQL/08_Subqueries_CTEs.md`](../08_SQL/08_Subqueries_CTEs.md) — CTEs for readable multi-table assertions
- **SQL**: [`08_SQL/13_Transactions_ACID.md`](../08_SQL/13_Transactions_ACID.md) — Transactions for atomic DB teardown
- **HTTP**: [`22_DevOps/08_HTTP_Complete.md`](../22_DevOps/08_HTTP_Complete.md) — How HTTP works (headers, body, methods)
- **OOP**: [`06_OOP_Design/02_Design_Patterns.md`](../06_OOP_Design/02_Design_Patterns.md) — Factory, Builder, Strategy patterns
