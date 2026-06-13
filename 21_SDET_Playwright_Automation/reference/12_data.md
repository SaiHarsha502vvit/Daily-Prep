# Test Data

> The authoritative reference for test-data lifecycle, seeding strategies, database verification, cleanup patterns, and isolation. The thing that separates an enterprise suite from a homework project — at scale, test data IS the product.

---

## Table of contents

1. [The test-data problem](#1-the-test-data-problem)
2. [The 5 seeding strategies](#2-the-5-seeding-strategies)
3. [Static fixtures (JSON / CSV)](#3-static-fixtures)
4. [API-driven seeding](#4-api-driven-seeding)
5. [Direct database seeding](#5-direct-db-seeding)
6. [Factory + builder pattern](#6-factory--builder)
7. [The TestDataManager pattern](#7-testdatamanager)
8. [Isolation strategies](#8-isolation-strategies)
9. [Cleanup — try/finally and beyond](#9-cleanup)
10. [Direct SQL verification](#10-direct-sql)
11. [The three-layer verification model](#11-three-layer-verification)
12. [Soft delete vs hard delete](#12-soft-vs-hard-delete)
13. [PII handling in test data](#13-pii)
14. [GDPR considerations](#14-gdpr)
15. [Orphan sweepers](#15-orphan-sweepers)
16. [Cross-environment data parity](#16-cross-env-parity)
17. [Common production failures](#17-common-production-failures)
18. [Anti-pattern catalog](#18-anti-pattern-catalog)

---

## 1. The test-data problem

Tests need data. Bad data management causes:

- Test pollution (data from yesterday's run breaks today's).
- Parallel collisions (two workers create the same record, both fail).
- Stale assertions (a test asserts on data that changed).
- Cleanup failures (orphans accumulate, eventually DB is full).
- Cross-environment drift (test data only works in staging).
- PII leaks (real customer data ends up in test reports).

### 1.1 The minimum viable invariants

A healthy test-data layer guarantees:

1. **Determinism** — same test, same input, same output.
2. **Isolation** — Test A doesn't affect Test B.
3. **Cleanup** — created data is destroyed.
4. **Identifiability** — test data is visibly distinct from real data.
5. **Replayability** — tests work today AND next month.

If any of these is violated, you have a flakiness vector and a data-debt time bomb.

### 1.2 The cost of bad data

For a 200-test suite running 5x/day:
- 1000 tests/day creating ~5 records each → 5000 records/day.
- Without cleanup: 1.8M records/year accumulate.
- Query performance degrades by 10x.
- DB storage cost goes up linearly.
- New tests get harder to write (data assumptions break).

---

## 2. The 5 seeding strategies

| # | Strategy | Setup time | Isolation | Production-fidelity |
|---|---|---|---|---|
| 1 | Static JSON/CSV files | Instant | Low (shared) | Low (frozen) |
| 2 | API calls in fixtures | 50–500 ms | High | High |
| 3 | Direct DB inserts | 5–50 ms | High | Medium |
| 4 | Snapshot restore | 1–10 s | Highest | Highest |
| 5 | Faker + factories | 1 ms | High | Medium |

### 2.1 Static fixtures

```typescript
// test-data/customers.json
{ "id": "CUST-001", "name": "Alice", "email": "alice@test.com" }
```

Pros: simple, version-controlled, fast.
Cons: shared across all tests; can't represent every variant.

### 2.2 API-driven

```typescript
const customer = await api.createCustomer({ name: 'Alice' });
```

Pros: production-like (uses real validation, hooks, side effects).
Cons: requires the API to be up; latency.

### 2.3 Direct DB

```typescript
await db.query('INSERT INTO customers (id, name) VALUES ($1, $2)', [id, 'Alice']);
```

Pros: fast (no API roundtrip); precise control.
Cons: bypasses business logic (the app's hooks don't fire).

### 2.4 Snapshot restore

```typescript
// Before suite: restore DB from a snapshot
await execSync('pg_restore -d testdb fixtures/baseline.dump');
```

Pros: instant return to known state; production-like volume.
Cons: very slow; not parallelisable.

### 2.5 Faker + factories

```typescript
const customer = factory.customer({ status: 'ACTIVE' });
```

Pros: instant; flexible.
Cons: data is fake (not production-typical); randomness can hide bugs.

### 2.6 The decision matrix

| Use case | Best strategy |
|---|---|
| UI smoke tests with stable data | Static (JSON) |
| Per-test mutable record | API-driven |
| Bulk reference data | DB direct (seeding script) |
| Performance tests with realistic volume | Snapshot restore |
| Negative tests / edge cases | Faker + factories |

Most enterprise suites combine 2 and 5: static for reference data, API/Faker for per-test mutable records.

---

## 3. Static fixtures

### 3.1 JSON files

```typescript
// test-data/orangehrm/credentials.json
{
  "valid": { "username": "Admin", "password": "admin123" },
  "invalid": { "username": "wrong", "password": "wrong" }
}
```

```typescript
import credentials from '@/test-data/orangehrm/credentials.json';

await loginPage.login(credentials.valid.username, credentials.valid.password);
```

### 3.2 CSV files

```csv
id,name,role
1,Alice,admin
2,Bob,user
```

```typescript
import { parseCsv } from '@/utilities/helpers/file.helpers';
const text = fs.readFileSync('test-data/users.csv', 'utf8');
const users = parseCsv<{ id: string; name: string; role: string }>(text);
```

### 3.3 TypeScript-as-data

```typescript
// test-data/customers.ts
export const TEST_CUSTOMERS = {
  alice: { id: 'CUST-001', name: 'Alice', email: 'alice@test.com', role: 'ADMIN' as const },
  bob:   { id: 'CUST-002', name: 'Bob',   email: 'bob@test.com',   role: 'USER'  as const },
} as const;

// Type is automatically narrow: { alice: { id: 'CUST-001', ..., role: 'ADMIN' } }
```

Pros over JSON:
- TypeScript type safety
- IDE autocomplete
- Computed values (`new Date()`, env interpolation)

### 3.4 When static fixtures break

- Data ages out (a hardcoded "2024-01-01" date becomes "in the past").
- Schema evolves (new required field; old fixture doesn't have it).
- Parallel collision (multiple tests use the same fixture and mutate it).

Mitigation: keep static data MINIMAL. Use it for reference (lists of countries, role names, etc.) — not for mutable records.

---

## 4. API-driven seeding

### 4.1 Fixture pattern

```typescript
const test = base.extend<{ testCitation: Citation }>({
  testCitation: async ({ citationsClient }, use) => {
    const citation = await citationsClient.create({
      status: 'PENDING',
      amount: 150,
      customerId: 'cust-default',
      testFlag: true,                      // marks as synthetic
    });

    await use(citation);

    // Cleanup
    try {
      await citationsClient.delete(citation.id);
    } catch (e) {
      console.warn(`[cleanup] failed: ${e}`);
    }
  },
});
```

### 4.2 Cascading creation

```typescript
const test = base.extend<{ customerWithOrder: { customer: Customer; order: Order } }>({
  customerWithOrder: async ({ api }, use) => {
    const customer = await api.customers.create({ name: 'Test', testFlag: true });
    const order = await api.orders.create({
      customerId: customer.id,
      items: [{ sku: 'X', qty: 1 }],
      testFlag: true,
    });

    await use({ customer, order });

    // Cleanup in reverse dependency order
    try { await api.orders.delete(order.id); } catch (e) { /* ... */ }
    try { await api.customers.delete(customer.id); } catch (e) { /* ... */ }
  },
});
```

Order matters: delete the order BEFORE the customer (FK constraint).

### 4.3 The `testFlag` convention

```typescript
const TEST_FLAG = { testFlag: true, testCreatedAt: new Date().toISOString() };

await api.customers.create({ name: 'Alice', ...TEST_FLAG });
```

Marks records as synthetic. Three benefits:
- Easy to identify in DB queries.
- Cleanup scripts can filter on it (delete `WHERE testFlag = true`).
- Production filters can EXCLUDE synthetic data from reports.

### 4.4 The "test mode" backend

Some apps add a "test mode" that bypasses business logic for setup:

```typescript
// Special test-only endpoint
await api.test.createCustomer({ id: 'specific-id', name: 'Alice' });
```

Pros: precise control (specific IDs, future dates, edge cases).
Cons: REQUIRES backend cooperation; "test mode" endpoints can become attack surface.

### 4.5 When API-driven is slow

If your API is slow (500 ms per call) and you create 5 records per test:
- 50 tests × 5 records × 500 ms = 125 seconds of pure setup.

Mitigations:
- Move to worker-scoped fixtures for shared setup data.
- Bulk API endpoints (`POST /citations/bulk { items: [...] }`).
- Direct DB seeding for non-business-critical fixtures.

---

## 5. Direct DB seeding

### 5.1 The pattern

```typescript
import { Pool } from 'pg';

const db = new Pool({ connectionString: process.env.TEST_DATABASE_URL });

const test = base.extend<{ db: Pool }>({
  db: async ({}, use) => {
    await use(db);
    // Don't dispose — shared pool
  },
});
```

```typescript
test('citation appears in dashboard', async ({ page, db }) => {
  const id = randomUUID();
  await db.query(
    'INSERT INTO citations (id, status, amount, customer_id, test_flag) VALUES ($1, $2, $3, $4, true)',
    [id, 'PENDING', 150, 'cust-001'],
  );

  await page.goto('/citations');
  await expect(page.getByText(id)).toBeVisible();

  await db.query('DELETE FROM citations WHERE id = $1', [id]);
});
```

### 5.2 Worker-scoped DB pool

```typescript
const test = base.extend<{}, { db: Pool }>({
  db: [async ({}, use) => {
    const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 10 });
    await use(pool);
    await pool.end();
  }, { scope: 'worker' }],
});
```

One pool per worker. Tests in the worker share the pool.

### 5.3 When NOT to direct-seed

Direct seeding bypasses business logic:
- No webhook firing.
- No audit log entry.
- No derived columns computed.
- No event published.

For tests that verify the business logic (e.g., "creating a citation triggers a notification"), direct seeding gives WRONG results.

Use API seeding for those. Use direct DB only for:
- Reference data (countries, roles).
- Test data that shouldn't trigger workflows.
- Setup that's not under test.

### 5.4 Transactions for atomic setup

```typescript
const test = base.extend<{ db: Pool }>({
  db: async ({}, use) => {
    const client = await db.connect();
    await client.query('BEGIN');
    try {
      await use({ query: client.query.bind(client) } as any);
    } finally {
      await client.query('ROLLBACK');           // discard all changes
      client.release();
    }
  },
});
```

Every change in the test is rolled back. Best isolation. But: the app under test may not see the changes (different transaction).

This only works for tests that don't go through the UI/API — pure DB-level unit tests of triggers, views, functions.

---

## 6. Factory + builder

### 6.1 The factory class

```typescript
export class CustomerFactory {
  static default(overrides: Partial<Customer> = {}): Customer {
    return {
      id: `cust-${randomUUID()}`,
      name: `Test Customer ${Date.now()}`,
      email: `test-${randomUUID()}@example.com`,
      role: 'USER',
      status: 'ACTIVE',
      testFlag: true,
      ...overrides,
    };
  }

  static admin(overrides: Partial<Customer> = {}): Customer {
    return CustomerFactory.default({ role: 'ADMIN', ...overrides });
  }

  static inactive(overrides: Partial<Customer> = {}): Customer {
    return CustomerFactory.default({ status: 'INACTIVE', ...overrides });
  }
}
```

### 6.2 Usage

```typescript
// Standard customer
const c1 = CustomerFactory.default();

// Override one field
const c2 = CustomerFactory.default({ name: 'Alice' });

// Combine variants
const c3 = CustomerFactory.admin({ status: 'INACTIVE' });
```

### 6.3 Builder for complex objects

```typescript
class OrderBuilder {
  private order: Partial<Order> = {
    id: `ord-${randomUUID()}`,
    items: [],
    status: 'NEW',
    testFlag: true,
  };

  withCustomer(customerId: string): this {
    this.order.customerId = customerId;
    return this;
  }

  withItem(sku: string, qty: number): this {
    this.order.items!.push({ sku, qty });
    return this;
  }

  asPaid(): this {
    this.order.status = 'PAID';
    this.order.paidAt = new Date().toISOString();
    return this;
  }

  build(): Order { return this.order as Order; }
}

const order = new OrderBuilder()
  .withCustomer('cust-001')
  .withItem('SKU-A', 2)
  .withItem('SKU-B', 1)
  .asPaid()
  .build();
```

### 6.4 Faker integration

```typescript
import { faker } from '@faker-js/faker';

export class CustomerFactory {
  static realistic(overrides: Partial<Customer> = {}): Customer {
    return {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        zip: faker.location.zipCode(),
      },
      role: 'USER',
      testFlag: true,
      ...overrides,
    };
  }
}
```

For deterministic randomness (reproducible tests):

```typescript
faker.seed(testInfo.testId.charCodeAt(0));  // same test → same fake data
```

---

## 7. TestDataManager

For tests that create multiple records, track them all for cleanup.

### 7.1 The class

```typescript
export class TestDataManager {
  private createdRecords: { type: string; id: string }[] = [];

  constructor(private readonly api: ApiClient) {}

  async createCustomer(overrides: Partial<Customer> = {}): Promise<Customer> {
    const customer = await this.api.customers.create(CustomerFactory.default(overrides));
    this.createdRecords.push({ type: 'customer', id: customer.id });
    return customer;
  }

  async createOrder(customerId: string, overrides: Partial<Order> = {}): Promise<Order> {
    const order = await this.api.orders.create({ customerId, ...overrides, testFlag: true });
    this.createdRecords.push({ type: 'order', id: order.id });
    return order;
  }

  async cleanup(): Promise<void> {
    // Reverse order — dependencies last
    for (const record of this.createdRecords.reverse()) {
      try {
        await this.api[record.type + 's'].delete(record.id);
      } catch (e) {
        console.warn(`[cleanup] failed: ${record.type} ${record.id}: ${e}`);
      }
    }
    this.createdRecords = [];
  }
}
```

### 7.2 Fixture wrapper

```typescript
const test = base.extend<{ data: TestDataManager }>({
  data: async ({ api }, use) => {
    const manager = new TestDataManager(api);
    await use(manager);
    await manager.cleanup();
  },
});
```

### 7.3 Usage

```typescript
test('multi-record scenario', async ({ data }) => {
  const customer = await data.createCustomer({ name: 'Alice' });
  const order1 = await data.createOrder(customer.id);
  const order2 = await data.createOrder(customer.id);
  // ... assertions

  // Cleanup runs automatically — deletes orders first, then customer
});
```

---

## 8. Isolation strategies

### 8.1 Unique IDs per test

```typescript
const customerId = `cust-${randomUUID()}`;
```

Guarantees no collision across parallel tests. The simplest correct approach.

### 8.2 Per-test namespace

```typescript
const namespace = testInfo.testId.slice(0, 8);
const customerId = `cust-${namespace}-001`;
```

Predictable IDs scoped to the test. Easier to debug ("which test created this orphan?").

### 8.3 Per-worker namespace

```typescript
const namespace = `w${testInfo.workerIndex}`;
const customerId = `cust-${namespace}-${counter++}`;
```

For tests within a worker that need predictable IDs. Doesn't work with `fullyParallel: true` (multiple tests in one worker run in parallel).

### 8.4 Database schema-per-worker

```typescript
const test = base.extend<{}, { db: Pool }>({
  db: [async ({}, use, workerInfo) => {
    const schemaName = `test_w${workerInfo.workerIndex}`;
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    await pool.query(`SET search_path TO ${schemaName}`);
    // Migrations to set up schema...

    await use(pool);

    await pool.query(`DROP SCHEMA ${schemaName} CASCADE`);
  }, { scope: 'worker' }],
});
```

Each worker has its own schema. Tests can use simple IDs ("CUST-001") without collision.

Heavy setup; only worth it for very large suites.

### 8.5 Database-per-worker (containers)

```typescript
const test = base.extend<{}, { dbUrl: string }>({
  dbUrl: [async ({}, use, workerInfo) => {
    const port = 5432 + workerInfo.workerIndex;
    await execSync(`docker run -d --name test-db-${workerInfo.workerIndex} -p ${port}:5432 postgres:15`);
    await waitForPort(port);
    const url = `postgresql://test:test@localhost:${port}/test`;
    await use(url);
    await execSync(`docker rm -f test-db-${workerInfo.workerIndex}`);
  }, { scope: 'worker' }],
});
```

Maximum isolation. Slow setup; only for very specialised needs.

---

## 9. Cleanup

### 9.1 The try/finally pattern

```typescript
const test = base.extend<{ customer: Customer }>({
  customer: async ({ api }, use) => {
    const customer = await api.customers.create({ /* ... */ });
    try {
      await use(customer);
    } finally {
      try {
        await api.customers.delete(customer.id);
      } catch (e) {
        console.warn(`[cleanup] failed: ${e}`);
      }
    }
  },
});
```

The inner try/catch ensures cleanup failures don't replace the test failure.

### 9.2 Cleanup runs even on test failure

The fixture's teardown (everything after `use()`) runs regardless of test outcome. If the test throws, teardown still runs.

### 9.3 What if cleanup itself throws?

| Test result | Cleanup result | Reported as |
|---|---|---|
| Passed | Passed | Passed |
| Passed | Threw | **Failed** with cleanup error |
| Failed | Passed | Failed (test error) |
| Failed | Threw | Failed (test error wins; cleanup error logged) |

The right pattern: log cleanup failures, don't rethrow if the test passed:

```typescript
} finally {
  try {
    await cleanup(record);
  } catch (e) {
    if (testInfo.status === 'passed') {
      console.warn(`[cleanup] suppressed: ${e}`);
    } else {
      // Test already failed; log but don't add noise
      console.warn(`[cleanup] failed: ${e}`);
    }
  }
}
```

### 9.4 The `testInfo.status` timing

`testInfo.status` is undefined until the test body returns. Inside the fixture, you can only check it AFTER `await use()`:

```typescript
async ({ api }, use, testInfo) => {
  const record = await create();
  await use(record);
  // ← testInfo.status is set here
  if (testInfo.status === 'failed') {
    await captureStateForDebugging(record);
  }
  await delete_(record);
}
```

### 9.5 Global teardown for orphan sweep

```typescript
// global.teardown.ts
export default async function () {
  const orphanCount = await db.query(
    "DELETE FROM customers WHERE test_flag = true AND created_at < NOW() - INTERVAL '1 hour'",
  );
  console.log(`Swept ${orphanCount.rowCount} orphan records`);
}
```

```typescript
// playwright.config.ts
globalTeardown: require.resolve('./global.teardown.ts'),
```

Catches orphans from runs that crashed mid-cleanup.

---

## 10. Direct SQL

For verifying database state directly.

### 10.1 Basic query

```typescript
const result = await db.query('SELECT * FROM customers WHERE id = $1', ['cust-001']);
expect(result.rows[0].status).toBe('ACTIVE');
```

### 10.2 Typed queries with Zod

```typescript
const CustomerRow = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DELETED']),
  created_at: z.date(),
});

const rows = await db.query('SELECT * FROM customers');
const customers = rows.rows.map(r => CustomerRow.parse(r));
expect(customers.find(c => c.id === 'cust-001')?.status).toBe('ACTIVE');
```

### 10.3 The DB client choice

| Library | DB | When |
|---|---|---|
| `pg` | Postgres | Standard |
| `mysql2` | MySQL | Standard |
| `mssql` | SQL Server | Standard |
| `@databases/sqlite` | SQLite | In-memory tests |
| `mongodb` | MongoDB | Document stores |

### 10.4 Connection pooling

Don't create a new connection per test:

```typescript
// ❌ Creates 100 connections for 100 tests
test('...', async () => {
  const client = new Client(connectionString);
  await client.connect();
  // ... query ...
  await client.end();
});

// ✅ One pool, worker-scoped
const test = base.extend<{}, { pool: Pool }>({
  pool: [async ({}, use) => {
    const pool = new Pool({ connectionString, max: 5 });
    await use(pool);
    await pool.end();
  }, { scope: 'worker' }],
});
```

### 10.5 Audit log verification

```typescript
const events = await db.query(
  'SELECT * FROM audit_log WHERE entity_id = $1 ORDER BY created_at',
  ['cust-001'],
);

expect(events.rows.map(e => e.event_type)).toEqual([
  'customer.created',
  'customer.email.changed',
  'customer.deleted',
]);
```

Critical for testing event-sourced systems: did the right events fire?

---

## 11. Three-layer verification

The most powerful pattern: assert at UI, API, and DB layers in one test.

### 11.1 The pattern

```typescript
test('editing customer name persists end-to-end', async ({ page, api, db }) => {
  // ── UI: trigger the change ─────────────────────────────────
  await page.goto('/customers/CUST-001');
  await page.getByLabel('Name').fill('Updated Name');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved')).toBeVisible();

  // ── API: verify the change at the service layer ───────────
  const apiCustomer = await api.customers.getById('CUST-001');
  expect(apiCustomer.name).toBe('Updated Name');

  // ── DB: verify the change at the storage layer (truth) ────
  const dbRows = await db.query('SELECT name FROM customers WHERE id = $1', ['CUST-001']);
  expect(dbRows.rows[0].name).toBe('Updated Name');
});
```

### 11.2 What each layer catches

| Layer | Catches |
|---|---|
| UI assertion | The user sees the change |
| API assertion | The service successfully processed it |
| DB assertion | The change is persisted (the ground truth) |

A bug at any layer fails the test with a CLEAR signal of where it broke.

### 11.3 The Success Theatre Anti-Pattern

```typescript
// ❌ UI says "Saved" but API returned 500 silently
await page.click('#save');
await expect(page.getByText('Saved')).toBeVisible();
// Test passes — but did anything actually save?
```

The fix is to add the API and DB verification layers. UI "Saved" alone is not sufficient evidence.

### 11.4 When to use 3-layer verification

| Test type | 3-layer recommended? |
|---|---|
| Critical business flow (checkout, payment) | YES |
| Important user flow (signup, profile edit) | Yes |
| Minor UI flow (theme toggle) | UI alone is fine |
| Pure UI rendering (logo color) | UI alone |

The cost (3 assertions instead of 1) is small. The benefit (catching real bugs) is large for critical paths.

---

## 12. Soft delete vs hard delete

### 12.1 Soft delete

```sql
UPDATE customers SET status = 'DELETED', deleted_at = NOW() WHERE id = 'cust-001';
```

Record stays. Marked deleted. Queries filter out.

### 12.2 Hard delete

```sql
DELETE FROM customers WHERE id = 'cust-001';
```

Record removed.

### 12.3 Implications for tests

| | Soft delete | Hard delete |
|---|---|---|
| Test cleanup leaves "DELETED" records | Yes — accumulate | No — gone |
| Foreign key constraints | Easier (refs intact) | Stricter (must delete in order) |
| Audit log fidelity | Better (history preserved) | Worse |
| DB size impact of test runs | Linear growth | None |

For testing, prefer:
- Hard delete in test cleanup (no accumulation).
- Soft delete in the app's actual delete flow (for audit).
- Verify both: soft-delete sets `status='DELETED'`, then cleanup does hard-delete.

---

## 13. PII

Personally Identifiable Information in test data is a liability.

### 13.1 What's PII

| Category | Examples |
|---|---|
| Identifiers | SSN, passport, driver's license, national ID |
| Contact | Email, phone, address |
| Financial | Credit card, bank account |
| Biometric | Fingerprint, face data |
| Behavioural | Click history, location trace |

### 13.2 Synthetic PII

```typescript
// ❌ Real-looking PII
{ ssn: '123-45-6789', creditCard: '4111-1111-1111-1111' }

// ✅ Marked-synthetic PII
{ ssn: 'TEST-XX-XXXX', creditCard: '4111-TEST-CARD' }

// ✅ Faker (random but realistic-shaped)
{ ssn: faker.string.numeric('XXX-XX-XXXX'), creditCard: faker.finance.creditCardNumber() }
```

Marker prefixes (`TEST-`, `TST-`) let production code reject test data accidentally hitting prod.

### 13.3 Never use production data in tests

```typescript
// ❌ Real customer in test
await db.query("INSERT INTO test_customers SELECT * FROM customers WHERE id = 'CUST-19234'");
```

Even if you anonymise, real names/addresses leak.

Always synthesise OR use a sanctioned anonymised data set.

### 13.4 PII in test logs

```typescript
// ❌ Real PII in CI log
console.log(`Customer email: ${customer.email}`);

// ✅ Mask
console.log(`Customer email: ${customer.email.replace(/(.{3}).*@/, '$1***@')}`);
```

CI logs are visible to everyone with repo access. Treat them as semi-public.

### 13.5 PII in trace files

Playwright trace files capture full network traffic. PII in request/response bodies appears in traces.

For sensitive tests, use trace masking:

```typescript
use: {
  trace: {
    mode: 'retain-on-failure',
    // Custom — Playwright doesn't have built-in PII masking
  },
}
```

No built-in masking. Either:
- Don't send real PII (use synthetic).
- Use a custom reporter that scrubs trace files before upload.

---

## 14. GDPR

### 14.1 The right to erasure

Under GDPR (and similar laws), users can request all their data be deleted.

For test environments:
- Don't store real PII without consent.
- Synthetic test data is exempt (it's not personal data).
- Document your test data isolation in compliance audits.

### 14.2 Right of access

Users can request their data. Test data shouldn't appear in those reports.

The `testFlag` convention helps: production exports filter `WHERE testFlag = true` out.

### 14.3 Data retention

Test environments typically have shorter retention than production. Audit that synthetic data is regularly purged.

```typescript
// nightly_purge.ts
await db.query("DELETE FROM customers WHERE test_flag = true AND created_at < NOW() - INTERVAL '30 days'");
```

---

## 15. Orphan sweepers

When test cleanup fails (crash, OOM, timeout), data leaks. Sweepers fix this.

### 15.1 The pattern

```typescript
// scripts/sweep-test-data.ts
import { Pool } from 'pg';

const db = new Pool({ connectionString: process.env.DATABASE_URL });

async function sweep() {
  const tables = ['customers', 'orders', 'invoices', 'payments'];
  for (const table of tables) {
    const result = await db.query(
      `DELETE FROM ${table} WHERE test_flag = true AND created_at < NOW() - INTERVAL '1 hour'`,
    );
    console.log(`Swept ${result.rowCount} from ${table}`);
  }
}

sweep().then(() => db.end());
```

### 15.2 Scheduling

```yaml
# .github/workflows/nightly-sweep.yml
on:
  schedule:
    - cron: '0 2 * * *'   # 2am daily

jobs:
  sweep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: ts-node scripts/sweep-test-data.ts
        env:
          DATABASE_URL: ${{ secrets.STAGING_DB_URL }}
```

### 15.3 The "1 hour" buffer

Sweep doesn't immediately delete. Wait long enough that long-running tests finish first. Otherwise the sweeper races with in-flight tests.

### 15.4 Audit log of sweeps

```typescript
await db.query("INSERT INTO sweep_log (run_at, tables_swept, row_count) VALUES (NOW(), $1, $2)",
  [JSON.stringify(['customers', 'orders']), totalSwept]);
```

Track sweeper runs. Spike = test cleanup is failing.

---

## 16. Cross-environment

### 16.1 Multi-environment test data

Your tests likely run against `local`, `dev`, `staging`. Data may differ.

| Environment | Available data | Test approach |
|---|---|---|
| `local` (your laptop) | Whatever you seeded | Seed in fixtures |
| `dev` (shared CI) | Volatile (everyone changes it) | Per-test fixtures only |
| `staging` (prod-like) | Stable reference data + per-run test data | Mix of static + fixture |
| `prod` (NEVER) | Real users | DON'T |

### 16.2 Environment-aware fixtures

```typescript
const test = base.extend<{ testCustomer: Customer }>({
  testCustomer: async ({ api }, use) => {
    if (process.env.ENV === 'local') {
      // Use a hardcoded local seed
      await use({ id: 'cust-local-001', name: 'Local Test' } as Customer);
    } else {
      // Create per-test in shared envs
      const customer = await api.customers.create({ /* ... */ });
      await use(customer);
      await api.customers.delete(customer.id);
    }
  },
});
```

### 16.3 The seed parity script

```typescript
// scripts/seed-shared-env.ts
async function seedSharedEnvironment(env: 'dev' | 'staging') {
  const customers = [
    { id: 'CUST-SHARED-001', name: 'Reference Customer 1' },
    { id: 'CUST-SHARED-002', name: 'Reference Customer 2' },
  ];

  for (const c of customers) {
    await api.customers.upsert(c);
  }
}
```

Run on demand to (re)seed reference data after the env was reset.

---

## 17. Common production failures

### Failure 1 — Orphans accumulate to millions

**Symptom:** Staging DB has 5M test customers; queries are slow.

**Cause:** Test cleanup occasionally fails; no sweeper.

**Fix:** Add nightly sweeper. `testFlag` + age check.

### Failure 2 — Test data appears in customer-facing reports

**Symptom:** Marketing complaint: report shows "Test Customer" entries.

**Cause:** Production query doesn't filter `testFlag`.

**Fix:** Add `WHERE test_flag = false` everywhere production queries data. Plus update test cleanup.

### Failure 3 — Parallel tests fail with FK violation

**Symptom:** Tests intermittently fail with "DELETE violates foreign key."

**Cause:** Test A creates customer; Test B creates order with that customer; A's cleanup tries to delete customer; B's order still references it.

**Fix:** Use unique IDs per test. Or coordinate cleanup order across fixtures.

### Failure 4 — Static fixture broke after schema change

**Symptom:** Tests fail loading `customers.json` with type errors.

**Cause:** Backend added a required field; static fixture doesn't have it.

**Fix:** Either update the fixture (and watch for repeat) OR move to factory-based generation (computed at test time, adapts more easily).

### Failure 5 — Faker generates duplicate emails

**Symptom:** Email uniqueness constraint violations.

**Cause:** `faker.internet.email()` can collide across parallel tests.

**Fix:** Append a UUID: `faker.internet.email().replace('@', `+${randomUUID()}@`)`.

### Failure 6 — DB pool exhausted

**Symptom:** `Error: connection pool exhausted` after ~50 tests.

**Cause:** Each test opens a new connection without closing. Or the pool size is too small for `workers × tests-in-flight`.

**Fix:** Worker-scoped pool. Reasonable `max` (10–20). Verify with `SELECT count(*) FROM pg_stat_activity`.

### Failure 7 — Test data survives a "reset" command

**Symptom:** Reset script claims success, but data still there.

**Cause:** Reset script uses unauthenticated DELETE; app's soft-delete logic intercepts.

**Fix:** Use TRUNCATE or DELETE directly at the DB level for test resets. Or call the app's hard-delete endpoint if exposed.

### Failure 8 — Date-based assertions fail after midnight

**Symptom:** Test passes at 23:00, fails at 00:30.

**Cause:** Hardcoded "today" date.

**Fix:** Compute relative dates: `new Date()`. Or freeze time via `clock`:

```typescript
await page.clock.install({ time: new Date('2026-06-09T12:00:00Z') });
```

### Failure 9 — Test data from yesterday breaks today

**Symptom:** Test A in yesterday's run created customer ID 100. Today's Test B tries to create the same ID — fails.

**Cause:** Sequential numeric IDs from a test-local counter.

**Fix:** UUIDs.

### Failure 10 — PII leaked to trace files

**Symptom:** Trace files in CI artifacts contain real customer emails.

**Cause:** Tests used real customer data.

**Fix:** Synthetic data only. Audit all hardcoded values.

---

## 18. Anti-pattern catalog

| ❌ | ✅ |
|---|---|
| Hardcoded IDs in parallel tests | UUIDs |
| Real PII in test data | Synthetic with `TEST-` prefix or Faker |
| Static JSON for mutable records | Factories with `testFlag` |
| No cleanup at all | try/finally with explicit delete |
| Cleanup that rethrows on failure | Log and continue |
| Direct DB seeding for business-logic-dependent tests | API seeding |
| API seeding for read-only reference data | Static or DB seeding |
| One global test customer across all tests | Per-test customer |
| Cleanup that doesn't check test status | `testInfo.status` to capture state on failure |
| `setTimeout` waiting for data to propagate | `expect.poll` |
| No `testFlag` marker | Always mark synthetic data |
| Sweeper that deletes everything | Filter on `testFlag = true` AND age |
| Direct DELETE in app's "delete" endpoint | Soft delete in app; hard delete in test cleanup |
| Production data copied to staging | Synthesise or use sanctioned anonymised dataset |
| Connection per test | Worker-scoped pool |
| Trusting "Saved" toast as proof | Three-layer verification for critical flows |

---

## Cross-references

- API setup patterns: [`./06_api_testing.md`](./06_api_testing.md)
- Fixture lifecycle (cleanup timing): [`./04_fixtures.md`](./04_fixtures.md)
- DB verification patterns: deep dive at [`Ch30 Database Verification via Direct SQL`](../05_Advanced_Topics/30_Database_Verification_Direct_SQL.md)
- Real test data layer: [`../framework/utilities/data/`](../framework/utilities/data/)
