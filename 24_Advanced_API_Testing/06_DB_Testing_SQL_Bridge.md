# 06. DB Testing — The SQL Bridge

**Navigation**: [â† Previous: Data From API To Test](05_Data_From_API_To_Test.md) | [Index](../00_MASTER_INDEX.md)

**Cross-links:**

- [`08_SQL/07_JOINs_Complete.md`](../08_SQL/07_JOINs_Complete.md) — JOIN patterns for verification queries
- [`08_SQL/08_Subqueries_CTEs.md`](../08_SQL/08_Subqueries_CTEs.md) — CTEs for multi-table verifications
- [`08_SQL/13_Transactions_ACID.md`](../08_SQL/13_Transactions_ACID.md) — Transactions for DB teardown
- [`21_SDET/06_Custom_Fixtures_Architecture.md`](../21_SDET_Playwright_Automation/06_Custom_Fixtures_Architecture.md) — The `yield` fixture teardown pattern

---

## 5W1H — Why This Chapter?

- **WHAT**: How to connect from Playwright tests directly to a SQL database, write verification queries, and clean up test data — covering both SQL Server (mssql) and PostgreSQL (pg).
- **WHY**: APIs can return cached or incorrect data. The database is the ONLY source of truth. DB verification is the difference between knowing your feature works and hoping it works.
- **WHO**: SDETs who currently verify test results only through the API or UI, and want to add a DB layer for bulletproof validation.
- **WHEN**: For critical data paths — create, update, delete, financial transactions — where incorrect data persistence has real consequences.
- **HOW**: By building the DB connection fixture, writing SDET-grade JOIN queries, and integrating DB verification into your existing multi-step test patterns.

---

## 1. Why Test the Database Directly?

Three scenarios where API + UI verification is NOT enough:

### Scenario 1 — The Cache Problem

```
Test:  POST /api/citations  → creates citation → returns 201 with citationId: 'CIT-999'
Test:  GET  /api/citations/CIT-999 → returns { status: 'PAID' } ✅ test passes

Reality: The write hit the CACHE, not the database.
         The citation was never persisted.
         The cache expires in 30 minutes.
         The customer's PAID status disappears.
         You have a production incident.

DB check would have revealed: SELECT * FROM Citations WHERE citation_id = 'CIT-999'
→ 0 rows returned. Test would have failed. Bug would have been caught.
```

### Scenario 2 — The Partial Write

```
API call creates a Customer record with 3 related records (address, phone, preferences).
API returns 201. UI shows the customer correctly.
But: the preferences record failed to write (DB constraint violation).
API silently swallowed the error. UI reads preferences from defaults.

DB check: SELECT * FROM CustomerPreferences WHERE customer_id = 'C-001'
→ 0 rows. Bug caught.
```

### Scenario 3 — The Amount Mismatch

```
Payment of $150.00 processed.
API returns: { payment: { amount: 150.00 } }
UI shows: "$150.00"
DB stores: 15000 (stored as cents, but application bug caused 100x multiplication)

DB check: SELECT amount FROM Payments WHERE payment_id = 'PAY-001'
→ 15000. Expected 150 or 15000 depending on the schema.
Type mismatch bugs are only caught by reading the raw DB value.
```

---

## 2. Connecting From Playwright — The Setup

### SQL Server (your enterprise environment — `mssql` package)

```bash
# Install once in your Playwright project:
npm install mssql
npm install @types/mssql --save-dev
```

```typescript
// fixtures/db.fixture.ts
import * as sql from "mssql";
import { test as base } from "@playwright/test";

interface DBFixtures {
  db: sql.ConnectionPool;
}

export const test = base.extend<{}, DBFixtures>({
  db: [
    async ({}, use) => {
      // Worker-scoped: ONE connection pool per worker process
      const config: sql.config = {
        server: process.env.DB_HOST!,
        database: process.env.DB_NAME!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        port: parseInt(process.env.DB_PORT ?? "1433"),
        options: {
          encrypt: true, // required for Azure SQL
          trustServerCertificate: true, // for internal/self-signed certs
          connectTimeout: 30000,
        },
        pool: {
          max: 5, // max 5 concurrent connections per worker
          min: 1,
          idleTimeoutMillis: 30000,
        },
      };

      const pool = await sql.connect(config);
      await use(pool);
      await pool.close(); // runs after ALL tests in this worker finish
    },
    { scope: "worker" },
  ],
});

export { expect } from "@playwright/test";
```

### PostgreSQL (for non-Microsoft environments — `pg` package)

```typescript
import { Pool } from 'pg';

db: [async ({}, use) => {
  const pool = new Pool({
    host:     process.env.DB_HOST,
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port:     parseInt(process.env.DB_PORT ?? '5432'),
    max: 5,
    idleTimeoutMillis: 30000,
  });

  await use(pool);
  await pool.end();

}, { scope: 'worker' }],
```

---

## 3. Writing Your First DB Verification Query

### Simple Single-Table Check

```typescript
// In your test:
import { test, expect } from "../fixtures/db.fixture";

test("Citation is persisted to DB after API creation", async ({
  request,
  db,
}) => {
  // Step 1: Create citation via API
  const citationId = await createCitationViaApi(request);

  // Step 2: Verify it exists in the DB
  await test.step("Verify citation record in database", async () => {
    const result =
      await //      ↑ parameterised query — NEVER string concatenate (SQL injection risk!)
      db.request().input("citationId", sql.NVarChar(50), citationId).query(`
        SELECT 
          citation_id,
          status,
          amount,
          customer_id,
          created_at
        FROM Citations
        WHERE citation_id = @citationId
      `);

    // Assert the record exists
    expect(result.recordset).toHaveLength(1);

    // Assert specific field values
    const record = result.recordset[0];
    expect(record.citation_id).toBe(citationId);
    expect(record.status).toBe("PENDING"); // new citation starts as PENDING
    expect(record.amount).toBe(150.0);
    expect(record.customer_id).toBeTruthy(); // customer ID is set
  });
});
```

> [!IMPORTANT]
> **Always use parameterised queries.** Never concatenate user-provided or test-generated values into SQL strings. Even in test code, string concatenation in SQL creates injection vulnerabilities and escaping issues with special characters (apostrophes in names, etc.).
>
> ```typescript
> // âŒ NEVER:
> .query(`SELECT * FROM Citations WHERE citation_id = '${citationId}'`)
> // ✅ ALWAYS:
> .input('citationId', sql.NVarChar, citationId)
> .query(`SELECT * FROM Citations WHERE citation_id = @citationId`)
> ```

---

## 4. JOIN Queries for SDET Verification

Most real verification requires looking at multiple tables. Cross-link with [`08_SQL/07_JOINs_Complete.md`](../08_SQL/07_JOINs_Complete.md) for JOIN fundamentals.

### Scenario: Verify Citation is Linked to the Correct Customer

```typescript
await test.step("DB: Verify citation-to-customer relationship", async () => {
  const result = await db
    .request()
    .input("citationId", sql.NVarChar, data.citationId)
    .input("expectedEmail", sql.NVarChar, data.customerEmail).query(`
      SELECT 
        c.citation_id,
        c.status          AS citation_status,
        c.amount          AS citation_amount,
        cu.customer_id,
        cu.email          AS customer_email,
        cu.first_name     AS customer_first_name
      FROM Citations c
        INNER JOIN Customers cu 
          ON c.customer_id = cu.customer_id
      WHERE c.citation_id = @citationId
        AND cu.email = @expectedEmail
    `);

  expect(result.recordset).toHaveLength(1);
  // If 0 rows: citation exists but doesn't belong to this customer (data integrity bug)

  const record = result.recordset[0];
  expect(record.citation_status).toBe("PAID");
  expect(record.customer_email).toBe(data.customerEmail);
});
```

### Scenario: Verify No Duplicate Citations

```typescript
await test.step("DB: Verify no duplicate citations for this vehicle on this date", async () => {
  const result = await db
    .request()
    .input("vehicleId", sql.NVarChar, data.vehicleId)
    .input("issueDate", sql.Date, new Date(data.issueDate)).query(`
      SELECT 
        vehicle_id,
        CAST(issue_date AS DATE) AS issue_date,
        COUNT(*) AS citation_count
      FROM Citations
      WHERE vehicle_id = @vehicleId
        AND CAST(issue_date AS DATE) = @issueDate
      GROUP BY vehicle_id, CAST(issue_date AS DATE)
      HAVING COUNT(*) > 1
    `);

  // If any rows returned: duplicates exist — data integrity bug
  expect(result.recordset).toHaveLength(0);
});
```

### Scenario: Verify Payment Chain (3 Tables)

```typescript
await test.step("DB: Verify full payment chain (citation → payment → receipt)", async () => {
  const result = await db
    .request()
    .input("citationId", sql.NVarChar, data.citationId).query(`
      SELECT 
        c.citation_id,
        c.status          AS citation_status,
        p.payment_id,
        p.amount          AS payment_amount,
        p.method          AS payment_method,
        p.processed_at,
        r.receipt_id,
        r.sent_to_email   AS receipt_email
      FROM Citations c
        INNER JOIN Payments p ON c.citation_id = p.citation_id
        LEFT JOIN Receipts r  ON p.payment_id = r.payment_id
      WHERE c.citation_id = @citationId
    `);

  expect(result.recordset).toHaveLength(1);
  const row = result.recordset[0];

  // Citation is marked PAID
  expect(row.citation_status).toBe("PAID");

  // Payment amount matches
  expect(row.payment_amount).toBe(data.expectedPaymentAmount);

  // Receipt was generated (LEFT JOIN — might be null if receipt service failed)
  expect(row.receipt_id, "Receipt not generated for payment").not.toBeNull();
});
```

---

## 5. CTEs for Readable Multi-Step DB Verification

For complex verification logic, CTEs (Common Table Expressions) make queries readable. Cross-link with [`08_SQL/08_Subqueries_CTEs.md`](../08_SQL/08_Subqueries_CTEs.md).

```typescript
// Verify: the 5 most recent citations for this customer are all PAID
await test.step("DB: Verify recent citation payment history via CTE", async () => {
  const result = await db
    .request()
    .input("customerId", sql.NVarChar, data.customerId).query(`
      WITH RecentCitations AS (
        SELECT 
          citation_id,
          status,
          amount,
          issue_date,
          ROW_NUMBER() OVER (ORDER BY issue_date DESC) AS rn
        FROM Citations
        WHERE customer_id = @customerId
      ),
      PaidCheck AS (
        SELECT 
          citation_id,
          status,
          (CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) AS is_paid
        FROM RecentCitations
        WHERE rn <= 5
      )
      SELECT 
        COUNT(*) AS total_recent,
        SUM(is_paid) AS paid_count,
        COUNT(*) - SUM(is_paid) AS unpaid_count
      FROM PaidCheck
    `);

  const summary = result.recordset[0];
  expect(summary.total_recent).toBe(5);
  expect(summary.unpaid_count).toBe(0); // All 5 recent citations are PAID
});
```

---

## 6. DB Teardown — Cleaning Up After Tests

Two patterns for teardown: fixture-based (preferred) and explicit in the test.

### Pattern 1: Fixture-Based Teardown (Preferred)

```typescript
// The fixture creates AND cleans up the test data:
testCitation: async ({ request, db }, use) => {
  // SETUP: Create via API
  const response = await request.post('/api/citations', {
    data: { vehicleId: `VH-${Date.now()}`, amount: 75.00 }
  });
  const { citationId } = await response.json();

  await use(citationId); // test runs here

  // TEARDOWN: runs even if the test failed
  try {
    // Try UI/API delete first (tests the delete feature)
    await request.delete(`/api/citations/${citationId}`);
  } catch {
    // Fallback: direct DB delete (never leaves orphaned records)
    await db.request()
      .input('id', sql.NVarChar, citationId)
      .query(`DELETE FROM Citations WHERE citation_id = @id`);
  }
},
```

### Pattern 2: Explicit Teardown With Transaction

```typescript
// For complex teardown that must be atomic:
test.afterEach(async ({ db }, testInfo) => {
  if (testInfo.status === "passed") return; // only clean up on failure? optional

  // Wrap teardown in a transaction so either ALL deletions succeed or NONE do
  const transaction = new sql.Transaction(db);
  await transaction.begin();

  try {
    const request = new sql.Request(transaction);
    // Delete in correct order (foreign key constraints — child before parent)
    await request.input("testRunId", sql.NVarChar, testInfo.testId)
      .query(`DELETE FROM Receipts WHERE payment_id IN (
                SELECT payment_id FROM Payments WHERE test_run_id = @testRunId
              )`);

    await request.query(`DELETE FROM Payments WHERE test_run_id = @testRunId`);
    await request.query(`DELETE FROM Citations WHERE test_run_id = @testRunId`);

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});
```

> [!TIP]
> The best practice is to include a `test_run_id` column in all test-created records. Insert `testInfo.testId` when creating test data. This makes cleanup trivial: `DELETE FROM ... WHERE test_run_id = @testRunId`. It also makes it easy to find orphaned records from failed runs.

---

## 7. Two-Strategy Verification — API + DB Together

Your confirmed approach: verify BOTH the API response AND the DB state.

```typescript
test("Payment marks citation as PAID in both API and DB", async ({
  request,
  db,
  account,
}) => {
  const data = {
    citationId: "CIT-001",
    paymentAmount: 150.0,
    apiStatus: null as string | null,
    dbStatus: null as string | null,
    dbPaymentId: null as string | null,
  };

  await test.step("Submit payment via API", async () => {
    const response = await request.post("/api/payments", {
      headers: HeadersCrm.getCrmHeader(),
      data: {
        citationId: data.citationId,
        amount: data.paymentAmount,
        method: "CARD",
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    data.dbPaymentId = body.paymentId;
  });

  await test.step("API: Verify citation status is now PAID", async () => {
    const response = await request.get(`/api/citations/${data.citationId}`, {
      headers: HeadersCrm.getCrmHeader(),
    });
    const body = await response.json();
    data.apiStatus = body?.citation?.status;
    expect(data.apiStatus).toBe("PAID");
  });

  await test.step("DB: Verify citation_status column updated to PAID", async () => {
    const result = await db
      .request()
      .input("id", sql.NVarChar, data.citationId)
      .query(`SELECT status FROM Citations WHERE citation_id = @id`);

    data.dbStatus = result.recordset[0]?.status;
    expect(data.dbStatus).toBe("PAID");
  });

  await test.step("DB: Verify payment record created with correct amount", async () => {
    const result = await db
      .request()
      .input("paymentId", sql.NVarChar, data.dbPaymentId)
      .query(
        `SELECT amount, method, citation_id FROM Payments WHERE payment_id = @paymentId`,
      );

    expect(result.recordset).toHaveLength(1);
    expect(result.recordset[0].amount).toBe(data.paymentAmount);
    expect(result.recordset[0].method).toBe("CARD");
    expect(result.recordset[0].citation_id).toBe(data.citationId);
  });

  await test.step("Cross-verify: API status matches DB status", async () => {
    expect(data.apiStatus).toBe(data.dbStatus); // both are 'PAID'
  });
});
```

---

## ðŸ‹ï¸ Practice Challenges

**Challenge 1 (JOIN Design):** Write a SQL query (can be pseudocode) to verify: "Customer C-001 has exactly 3 PAID citations and 0 OVERDUE citations, and all PAID citations have a corresponding payment record."

<details><summary>Answer</summary>

```sql
WITH CitationSummary AS (
  SELECT
    cu.customer_id,
    SUM(CASE WHEN c.status = 'PAID'    THEN 1 ELSE 0 END) AS paid_count,
    SUM(CASE WHEN c.status = 'OVERDUE' THEN 1 ELSE 0 END) AS overdue_count,
    SUM(CASE WHEN c.status = 'PAID' AND p.payment_id IS NULL THEN 1 ELSE 0 END) AS paid_no_payment
  FROM Customers cu
    INNER JOIN Citations c ON cu.customer_id = c.customer_id
    LEFT JOIN Payments p ON c.citation_id = p.citation_id
  WHERE cu.customer_id = 'C-001'
  GROUP BY cu.customer_id
)
SELECT paid_count, overdue_count, paid_no_payment FROM CitationSummary;

-- Assert in Playwright:
-- expect(result.recordset[0].paid_count).toBe(3);
-- expect(result.recordset[0].overdue_count).toBe(0);
-- expect(result.recordset[0].paid_no_payment).toBe(0);
```

</details>

**Challenge 2 (SQL Injection Prevention):** A teammate wrote this DB verification code. What is wrong with it and how do you fix it?

```typescript
const citationId = body.citations[0].citationId;
const result = await db
  .request()
  .query(`SELECT * FROM Citations WHERE citation_id = '${citationId}'`);
```

<details><summary>Answer</summary>

This is vulnerable to SQL injection. If `citationId` contains a single quote (e.g., `CIT-001'; DROP TABLE Citations;--`), the query structure breaks. Fix:

```typescript
const result = await db
  .request()
  .input("citationId", sql.NVarChar(50), citationId)
  .query("SELECT * FROM Citations WHERE citation_id = @citationId");
```

The parameterised approach escapes special characters automatically and is not structurally alterable by the input value.

</details>

**Challenge 3 (Teardown Design):** Your test creates: 1 Customer record → 3 Citation records → 1 Payment record. There are foreign key constraints: Citations reference Customers (customer_id FK), Payments reference Citations (citation_id FK). In what ORDER must you delete records, and why?

<details><summary>Answer</summary>

Delete in reverse dependency order — child records before parent records:

1. `DELETE FROM Payments WHERE citation_id IN (...)` — Payments depend on Citations
2. `DELETE FROM Citations WHERE customer_id = @customerId` — Citations depend on Customers
3. `DELETE FROM Customers WHERE customer_id = @customerId` — Customer is the root

If you delete the Customer first, the DB will throw a FK constraint violation (Citations still reference it). The rule: always delete the most-dependent (leaf) tables first, work up to the root (parent) table last.

</details>

---

### Challenge 4 [MCQ — DB Assertion Timing]

Your API test creates a citation via POST, which triggers an async background job to update a customer's `citationCount` in the `Customers` table. You immediately query the DB after the POST and the count hasn't updated yet. The test fails intermittently. What is the correct fix?

A) Add `await page.waitForTimeout(3000)` to wait for the background job.  
B) Poll the DB with `expect.poll` until the count matches the expected value.  
C) Use `NOLOCK` hint in the SQL query to bypass locking.  
D) Use a raw SQL `SLEEP(3)` statement inside the query.

<details><summary>Answer</summary>

**B** — Poll the DB with `expect.poll`:

```typescript
// Using a pg/mssql DB client inside the test:
await expect
  .poll(
    async () => {
      const result = await dbClient.query(
        "SELECT citation_count FROM Customers WHERE customer_id = $1",
        ["USR-001"],
      );
      return result.rows[0]?.citation_count;
    },
    {
      message: "Customer citation_count should have incremented to 5",
      timeout: 10_000,
      intervals: [500],
    },
  )
  .toBe(5);
```

Why not A/D? `waitForTimeout` and `SLEEP` create fixed waits that are either too short (flaky) or too long (slow). `expect.poll` is adaptive — it stops the moment the condition is met.

Why not C? `NOLOCK` (SQL Server) reads dirty uncommitted data. It can return stale or partial rows from in-flight transactions. In tests, this produces false positives — you read a value before the transaction commits.

**SDE principle**: Async side-effects require async waiting strategies. Never use fixed sleeps in tests that verify eventually-consistent data.

</details>

---

### Challenge 5 [Spot the Bug — Teardown Order & FK Constraints]

```typescript
test.afterEach(async ({ dbClient, testData }) => {
  // Teardown after test — delete all test data
  await dbClient.query(
    `DELETE FROM Customers WHERE customer_id = '${testData.customerId}'`,
  );
  await dbClient.query(
    `DELETE FROM Citations WHERE customer_id = '${testData.customerId}'`,
  );
  await dbClient.query(`DELETE FROM Payments WHERE citation_id IN (
    SELECT id FROM Citations WHERE customer_id = '${testData.customerId}'
  )`);
});
```

There are two serious bugs in this teardown. Identify both.

<details><summary>Answer</summary>

**Bug 1 — Wrong deletion order (FK constraint violation)**:  
The teardown deletes `Customers` first. If `Citations` has a foreign key referencing `Customers`, the DB will reject the deletion with a constraint error (`FOREIGN KEY constraint failed`). The correct order is leaf → parent:

1. Delete `Payments` first (references `Citations`)
2. Delete `Citations` second (references `Customers`)
3. Delete `Customers` last (the root)

**Bug 2 — SQL Injection via string interpolation**:  
`'${testData.customerId}'` inserts the value directly into the SQL string. If `customerId` was set by the test to include SQL like `'; DROP TABLE Customers; --`, the statement executes maliciously.

Use parameterized queries:

```typescript
test.afterEach(async ({ dbClient, testData }) => {
  const id = testData.customerId;
  // Correct order: leaf tables first
  await dbClient.query(
    "DELETE FROM Payments  WHERE citation_id IN (SELECT id FROM Citations WHERE customer_id = $1)",
    [id],
  );
  await dbClient.query("DELETE FROM Citations WHERE customer_id = $1", [id]);
  await dbClient.query("DELETE FROM Customers WHERE customer_id = $1", [id]);
});
```

Parameterized queries prevent injection AND handle special characters (apostrophes, percent signs) safely.

</details>

---

**Navigation**: [← Previous: Data From API To Test](05_Data_From_API_To_Test.md) | [Index](../00_MASTER_INDEX.md)
