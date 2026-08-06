# Chapter 41 — Real-World Production Scenarios Part 4: Schema Evolution, Migrations & Data Integrity Crises

**What:** 25 real-world schema/migration/integrity disasters (Scenarios 76–100) with 5W-H + fixes
**Why:** Schema changes are the #1 cause of production outages in database-backed systems
**Where:** Every growing application — startups scaling up, enterprises modernizing
**How:** Understand the failure → SQL/migration fix → Spring Boot/backend fix → DSA insight

---

## 📋 Scenario Master Index (Part 4: Scenarios 76–100)

| #   | Scenario                                                 | Category       |
| --- | -------------------------------------------------------- | -------------- |
| 76  | ALTER TABLE locks table for 2 hours                      | Schema Change  |
| 77  | Adding NOT NULL column to 500M-row table                 | Schema Change  |
| 78  | Column type change from VARCHAR to INT breaks data       | Schema Change  |
| 79  | Dropping column that application still reads             | Schema Change  |
| 80  | Foreign key added retroactively — orphan data discovered | Integrity      |
| 81  | CHECK constraint added — 50K rows violate it             | Integrity      |
| 82  | ENUM type extended — deployment order matters            | Schema Change  |
| 83  | Default value change breaks INSERT logic                 | Schema Change  |
| 84  | Migration runs on prod before code deploy                | Deployment     |
| 85  | Rollback migration fails — no down migration exists      | Deployment     |
| 86  | Data migration corrupts UTF-8 characters                 | Data Migration |
| 87  | Timezone mismatch: UTC vs local time chaos               | Data Integrity |
| 88  | NULL vs empty string inconsistency across tables         | Data Integrity |
| 89  | Decimal precision loss: $0.01 becomes $0.00              | Data Integrity |
| 90  | Duplicate data from failed unique constraint migration   | Data Integrity |
| 91  | Circular foreign key preventing table drops              | Schema Design  |
| 92  | God table with 200 columns — unmaintainable              | Schema Design  |
| 93  | EAV (Entity-Attribute-Value) anti-pattern at scale       | Schema Design  |
| 94  | Polymorphic association with no FK enforcement           | Schema Design  |
| 95  | Database drift: dev/staging/prod schemas diverge         | Deployment     |
| 96  | Renaming a table — 47 applications break                 | Schema Change  |
| 97  | Adding a generated/computed column                       | Schema Change  |
| 98  | Splitting a monolith table for microservices             | Architecture   |
| 99  | Data leak between tenants (multi-tenant)                 | Security       |
| 100 | Production data accidentally deleted — recovery          | Disaster       |

---

## Scenario 76: ALTER TABLE Locks Table for 2 Hours

### 🔴 The Incident

DBA runs `ALTER TABLE orders ADD COLUMN discount DECIMAL(10,2)` on a 500M-row table. Table locked for full rewrite. All writes blocked. API returns 503 for 2 hours.

### 5W-H Analysis

| Question  | Answer                                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| **What**  | MySQL < 8.0 copies entire table for most ALTER operations. Even MySQL 8.0 InnoDB online DDL may need exclusive lock briefly |
| **Why**   | Adding nullable column with no default is metadata-only in PostgreSQL but NOT in MySQL                                      |
| **When**  | Any schema change on a large table during business hours                                                                    |
| **Where** | MySQL (most ALTERs), PostgreSQL (only specific ALTERs like type change)                                                     |
| **Who**   | DBA or developer running migrations without understanding locking implications                                              |
| **How**   | Use online schema change tools; plan for zero-downtime                                                                      |

### SQL Solutions

```sql
-- PostgreSQL: Adding nullable column is instant (metadata-only)
ALTER TABLE orders ADD COLUMN discount DECIMAL(10,2);
-- ✅ Instant, no lock, no rewrite — even on 500M rows

-- PostgreSQL: Adding column with DEFAULT is also instant (v11+)
ALTER TABLE orders ADD COLUMN discount DECIMAL(10,2) DEFAULT 0.00;
-- ✅ Instant in PG 11+ (stores default in pg_attribute, not in rows)

-- MySQL: Use pt-online-schema-change (Percona) or gh-ost (GitHub)
-- These tools:
-- 1. Create shadow table with new schema
-- 2. Copy rows in batches
-- 3. Use triggers/binlog to capture live changes
-- 4. Atomic rename at the end

-- MySQL 8.0 INSTANT DDL (metadata-only for adding columns):
ALTER TABLE orders ADD COLUMN discount DECIMAL(10,2), ALGORITHM=INSTANT;
-- ✅ Instant IF the database supports it for this specific operation
-- ❌ Fails for: adding NOT NULL, changing column type, adding indexes

-- For operations that need rewrite, use ALGORITHM=INPLACE:
ALTER TABLE orders ADD INDEX idx_discount (discount), ALGORITHM=INPLACE, LOCK=NONE;
-- Builds index without blocking reads/writes
```

### Spring Boot: Flyway Migration with Safety Check

```java
// V20250308__add_discount_column.sql
-- Safety: check if this is PostgreSQL (instant) or MySQL (needs online tool)
DO $$
BEGIN
    -- PostgreSQL: instant metadata-only change
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0.00;
END $$;
```

### DSA Connection

- **Table copy = Array resizing** — creating new larger array and copying all elements
- **Online DDL = In-place modification** — modifying array while reads continue (concurrent data structure)
- **Shadow table swap = Double buffering** — write to back buffer, swap pointers

---

## Scenario 77: Adding NOT NULL Column to 500M-Row Table

### 🔴 The Incident

`ALTER TABLE orders ADD COLUMN region VARCHAR(10) NOT NULL` — fails because existing 500M rows have NULL. Or locks table to rewrite all rows with default.

### SQL Solution — The Safe 3-Step Pattern

```sql
-- NEVER do this on a large table:
ALTER TABLE orders ADD COLUMN region VARCHAR(10) NOT NULL DEFAULT 'US';
-- MySQL: copies entire table. PostgreSQL: instant in v11+ but NOT NULL check scans all rows

-- SAFE 3-Step Pattern:

-- Step 1: Add column as NULLABLE (instant, no lock)
ALTER TABLE orders ADD COLUMN region VARCHAR(10);

-- Step 2: Backfill in batches (no long lock)
UPDATE orders SET region = 'US' WHERE region IS NULL AND id BETWEEN 1 AND 1000000;
UPDATE orders SET region = 'US' WHERE region IS NULL AND id BETWEEN 1000001 AND 2000000;
-- ... repeat in batches

-- Step 3: Add NOT NULL constraint (after all rows backfilled)
-- PostgreSQL: validate constraint without blocking writes
ALTER TABLE orders ADD CONSTRAINT orders_region_not_null
    CHECK (region IS NOT NULL) NOT VALID;  -- Adds constraint but doesn't validate
ALTER TABLE orders VALIDATE CONSTRAINT orders_region_not_null;  -- Validates without exclusive lock

-- MySQL: Add NOT NULL (requires brief metadata lock)
ALTER TABLE orders MODIFY COLUMN region VARCHAR(10) NOT NULL DEFAULT 'US';
```

### Spring Boot Batch Backfill

```java
@Component
public class BackfillRegionMigration {

    @Autowired
    private JdbcTemplate jdbc;

    public void backfill() {
        int batchSize = 50000;
        Long maxId = jdbc.queryForObject("SELECT MAX(id) FROM orders", Long.class);

        for (long start = 0; start <= maxId; start += batchSize) {
            jdbc.update(
                "UPDATE orders SET region = 'US' WHERE region IS NULL AND id BETWEEN ? AND ?",
                start, start + batchSize - 1
            );

            // Don't hammer the database
            try { Thread.sleep(50); } catch (InterruptedException e) { break; }
        }
    }
}
```

---

## Scenario 78: Column Type Change Breaks Data

### 🔴 The Incident

Developer changes `phone VARCHAR(15)` to `phone BIGINT`. Rows with `+1-555-0123` or `NULL` fail. Table locked during attempted conversion. Rollback takes 30 minutes.

### SQL Solution

```sql
-- NEVER: Direct type change on production
ALTER TABLE users ALTER COLUMN phone TYPE BIGINT;
-- ERROR: invalid input syntax for integer: "+1-555-0123"

-- SAFE: Add new column, migrate data, swap
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN phone_number BIGINT;

-- Step 2: Migrate valid data
UPDATE users SET phone_number = CASE
    WHEN phone ~ '^\d+$' THEN phone::BIGINT  -- Only pure numeric strings
    ELSE NULL  -- Mark non-numeric for review
END;

-- Step 3: Find problematic data for manual review
SELECT id, phone FROM users
WHERE phone IS NOT NULL AND phone !~ '^\d+$';
-- Shows: "+1-555-0123", "(555) 012-3456", "N/A", etc.

-- Step 4: After data cleaned and application updated:
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users RENAME COLUMN phone_number TO phone;
```

---

🔬 **Section Challenge — Scenario 78: Column Type Change Breaks Data**

**Challenge 1 (The Re-Cast Trap):** You are migrating an old `user_id` column from `VARCHAR(50)` to `UUID`. You run `ALTER TABLE users ALTER COLUMN user_id TYPE UUID USING user_id::UUID;`. The migration fails halfway through because row #5,000,000 has a `user_id` of `'UNKNOWN'`. How do you safely cast valid UUIDs while nullifying invalid ones without crashing the migration?

<details><summary>Answer</summary>

You must use a `CASE` statement within the `USING` clause, paired with a regex check (or a custom exception-handling function), to safely cast the data.

```sql
ALTER TABLE users
ALTER COLUMN user_id TYPE UUID
USING CASE
    WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN user_id::UUID
    ELSE NULL
END;
```

This guarantees the transaction succeeds. You can then query for `WHERE user_id IS NULL` to handle the dirty data manually.

</details>

## Scenario 79: Dropping Column That Application Still Reads

### 🔴 The Incident

DBA drops `users.middle_name` column. Application still has `SELECT * FROM users` which maps to a DTO with `middleName`. All API calls crash.

### Safe Column Removal — The Expand-Contract Pattern

```sql
-- Phase 1: EXPAND — Stop WRITING to the column (application change)
-- Deploy code that stops writing to middle_name
-- Remove middle_name from SELECT lists, DTO mappings

-- Phase 2: CONTRACT — After all app servers deployed (days/weeks later)
-- Only THEN drop the column
ALTER TABLE users DROP COLUMN middle_name;

-- The timeline:
-- Day 1: Deploy code v2 (stops reading/writing middle_name)
-- Day 3: Verify no queries reference the column
-- Day 5: Drop column in migration
```

### Verify No Code References Before Dropping

```sql
-- PostgreSQL: Check if column is being accessed
SELECT
    query,
    calls,
    mean_exec_time
FROM pg_stat_statements
WHERE query ILIKE '%middle_name%'
ORDER BY calls DESC;
-- If no results → safe to drop
```

### Spring Boot DTO Evolution

```java
// Phase 1: Keep column in entity but mark for removal
@Entity
public class User {
    @Id private Long id;
    private String name;

    @Deprecated  // Signal to team: don't use this
    @Column(name = "middle_name", insertable = false, updatable = false)
    private String middleName;
}

// Phase 2: Remove from entity (after column dropped)
@Entity
public class User {
    @Id private Long id;
    private String name;
    // middle_name removed
}
```

---

## Scenario 80: Foreign Key Added Retroactively — Orphan Data Discovered

### 🔴 The Incident

Team decides to add FK from `orders.customer_id` → `customers.id`. ALTER fails: 12,000 orders reference non-existent customers.

### SQL Solution

```sql
-- Step 1: Find orphans
SELECT o.id, o.customer_id
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE c.id IS NULL;
-- Returns 12,000 orphaned orders

-- Step 2: Decide what to do with orphans
-- Option A: Assign to a "deleted customer" placeholder
INSERT INTO customers (id, name, email) VALUES (0, 'DELETED_CUSTOMER', 'deleted@placeholder.com');
UPDATE orders SET customer_id = 0 WHERE customer_id NOT IN (SELECT id FROM customers);

-- Option B: Move orphans to archive
INSERT INTO orders_orphan_archive SELECT * FROM orders
WHERE customer_id NOT IN (SELECT id FROM customers);
DELETE FROM orders WHERE customer_id NOT IN (SELECT id FROM customers);

-- Option C: Set to NULL (if column allows it)
ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL;
UPDATE orders SET customer_id = NULL
WHERE customer_id NOT IN (SELECT id FROM customers);

-- Step 3: NOW add the FK constraint
ALTER TABLE orders ADD CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id);

-- PostgreSQL: Add NOT VALID first (faster, non-blocking)
ALTER TABLE orders ADD CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT fk_orders_customer;
```

---

## Scenario 81: CHECK Constraint Added — 50K Rows Violate It

### SQL Solution

```sql
-- Trying to add: status must be one of ('pending','active','completed','cancelled')
ALTER TABLE orders ADD CONSTRAINT chk_status
    CHECK (status IN ('pending', 'active', 'completed', 'cancelled'));
-- ERROR: 50,000 rows have status = 'shipped', 'returned', 'hold', etc.

-- Step 1: Find all distinct violating values
SELECT status, COUNT(*) FROM orders
WHERE status NOT IN ('pending', 'active', 'completed', 'cancelled')
GROUP BY status ORDER BY COUNT(*) DESC;
-- shipped: 30,000 | returned: 15,000 | hold: 5,000

-- Step 2: Map old values to new
UPDATE orders SET status = CASE status
    WHEN 'shipped' THEN 'completed'
    WHEN 'returned' THEN 'cancelled'
    WHEN 'hold' THEN 'pending'
    ELSE status
END
WHERE status NOT IN ('pending', 'active', 'completed', 'cancelled');

-- Step 3: Add the constraint
ALTER TABLE orders ADD CONSTRAINT chk_status
    CHECK (status IN ('pending', 'active', 'completed', 'cancelled'));
```

---

## Scenario 82: ENUM Type Extended — Deployment Order Matters

### 🔴 The Incident

Application starts sending `status = 'processing'` before the database ENUM is updated. All inserts fail.

### SQL Solution

```sql
-- PostgreSQL ENUM — adding a value
ALTER TYPE order_status ADD VALUE 'processing' AFTER 'pending';
-- Since PG12, this CAN run inside a transaction -- but the new value still
-- can't be USED (inserted, compared, cast) within that same transaction,
-- only after it commits. Practically the same constraint either way:

-- Deployment order:
-- 1. FIRST: Add ENUM value in database (migration runs and commits)
-- 2. THEN:  Deploy application code that uses new value
-- Never the other way around!

-- MySQL ENUM — modify column
ALTER TABLE orders MODIFY COLUMN status
    ENUM('pending', 'processing', 'active', 'completed', 'cancelled');

-- BETTER: Don't use database ENUMs at all!
-- Use VARCHAR with CHECK constraint instead:
ALTER TABLE orders ALTER COLUMN status TYPE VARCHAR(20);
ALTER TABLE orders ADD CONSTRAINT chk_status
    CHECK (status IN ('pending', 'processing', 'active', 'completed', 'cancelled'));
-- VARCHAR + CHECK = flexible, versionable, transactional
```

---

🔬 **Section Challenge — Scenario 82: ENUM Type Extended — Deployment Order Matters**

**Challenge 1 (The Postgres ENUM Transaction Trap):** You need to add `'refunded'` to your `order_status` ENUM and immediately backfill some rows with it, so you write one Flyway migration: `ALTER TYPE order_status ADD VALUE 'refunded'; UPDATE orders SET status = 'refunded' WHERE ...;`. What error occurs on modern PostgreSQL (12+), and how do you avoid it?

<details><summary>Answer</summary>

PostgreSQL will throw: `ERROR: unsafe use of new value of enum type "refunded"` with a hint that new enum values must be committed before they can be used. Before PostgreSQL 12, `ALTER TYPE ... ADD VALUE` genuinely could not run inside a transaction block at all — but that restriction was lifted in PG12. What replaced it is narrower but still real: the newly added value isn't usable (in an INSERT, UPDATE, comparison, or cast) within the SAME transaction that added it, because the catalog change isn't visible for use until it actually commits. Flyway runs each migration file in one transaction by default, so a single migration that both adds the enum value and immediately uses it hits this wall every time.

**The Fix:** Split it into two migrations — one that only adds the value (and commits), and a later one (a subsequent Flyway run/deploy) that uses it. Alternatively, avoid ENUMs entirely and use `VARCHAR` + `CHECK` constraint, which has no such restriction and is fully transactional either way.

</details>

## Scenario 83: Default Value Change Breaks INSERT Logic

### SQL Solution

```sql
-- Old: created_at defaults to CURRENT_TIMESTAMP
-- Someone changes it: ALTER TABLE orders ALTER COLUMN created_at SET DEFAULT '2020-01-01';
-- Now all new orders show as created in 2020!

-- DETECT unexpected defaults:
SELECT column_name, column_default, data_type
FROM information_schema.columns
WHERE table_name = 'orders' AND column_default IS NOT NULL;

-- Spring Boot: Explicitly set all important fields
@Entity
public class Order {
    @Column(nullable = false)
    @CreationTimestamp  // Hibernate sets this, ignoring DB default
    private Instant createdAt;
}
```

---

## Scenario 84: Migration Runs on Prod Before Code Deploy

### 🔴 The Incident

Migration adds column `discount_type` (NOT NULL). Old code doesn't set it. All INSERTs fail. Revenue lost until hotfix.

### The Rule: Migrations Must Be Backward Compatible

```sql
-- BAD migration: Breaks old code
ALTER TABLE orders ADD COLUMN discount_type VARCHAR(20) NOT NULL;
-- Old code INSERT doesn't include discount_type → fails!

-- GOOD migration: Works with old AND new code
ALTER TABLE orders ADD COLUMN discount_type VARCHAR(20) DEFAULT 'none';
-- Old code INSERT: discount_type gets 'none' automatically → works!
-- New code INSERT: sends discount_type explicitly → works!

-- The backward-compatible migration timeline:
-- v1 code: INSERT INTO orders (amount) VALUES (100)     ← No discount_type
-- Deploy migration: ADD COLUMN discount_type DEFAULT 'none'
-- v1 code still works! (gets default 'none')
-- Deploy v2 code:  INSERT INTO orders (amount, discount_type) VALUES (100, 'percentage')
-- v2 code works too!
-- Later: ADD NOT NULL constraint (after all rows have values)
```

---

## Scenario 85: Rollback Migration Fails — No Down Migration

### SQL Solution

```sql
-- Flyway doesn't support down migrations by default
-- YOU must write them manually

-- V42__add_discount_column.sql (UP)
ALTER TABLE orders ADD COLUMN discount DECIMAL(10,2) DEFAULT 0.00;

-- V42__add_discount_column_UNDO.sql (DOWN / rollback)
ALTER TABLE orders DROP COLUMN discount;

-- PROBLEM: Dropping column loses data! Can't truly rollback!
-- Better pattern: Feature flags instead of rollback

-- For risky migrations, use a reversible approach:
-- UP: CREATE TABLE orders_v2 AS SELECT *, 0.00 AS discount FROM orders;
-- DOWN: DROP TABLE orders_v2;
-- CUTOVER: RENAME orders TO orders_old; RENAME orders_v2 TO orders;
-- ROLLBACK: RENAME orders TO orders_v2; RENAME orders_old TO orders;
```

---

## Scenario 86: Data Migration Corrupts UTF-8 Characters

### SQL Solution

```sql
-- PROBLEM: Customer names with accents become garbled
-- "José" → "JosÃ©"   (correct UTF-8 bytes for é, misread one byte at a time as Latin-1)
-- Cause: Reading as latin1 but data is actually UTF-8

-- Step 1: Detect encoding issues
SELECT id, name, LENGTH(name), CHAR_LENGTH(name)
FROM customers
WHERE LENGTH(name) != CHAR_LENGTH(name);
-- If LENGTH (bytes) > CHAR_LENGTH (chars), multi-byte chars exist

-- Step 2: Fix garbled data
-- MySQL:
UPDATE customers SET name = CONVERT(CAST(CONVERT(name USING latin1) AS BINARY) USING utf8mb4)
WHERE name LIKE '%Ã%';  -- Common mojibake pattern

-- Step 3: Ensure correct encoding going forward
ALTER DATABASE mydb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE customers CONVERT TO CHARACTER SET utf8mb4;
```

---

## Scenario 87: Timezone Mismatch — UTC vs Local Time Chaos

### 🔴 The Incident

Server in UTC, database in UTC, but application stores `LocalDateTime` without timezone. Report in IST (UTC+5:30) shows orders placed at "wrong" times.

### SQL Solution

```sql
-- PROBLEM: TIMESTAMP WITHOUT TIME ZONE stored
-- Java sends: 2025-03-08 14:30:00 (local IST)
-- DB stores:  2025-03-08 14:30:00 (no TZ info — ambiguous!)
-- Report reads in UTC: thinks it's 2025-03-08 14:30:00 UTC (wrong by 5.5 hours)

-- FIX: Always use TIMESTAMP WITH TIME ZONE
ALTER TABLE orders ALTER COLUMN created_at TYPE TIMESTAMPTZ
    USING created_at AT TIME ZONE 'Asia/Kolkata';
-- Converts existing data from assumed IST to UTC internal storage

-- PostgreSQL: Force timezone
SET timezone = 'UTC';
-- All TIMESTAMPTZ values displayed in UTC

-- Convert for display:
SELECT created_at AT TIME ZONE 'Asia/Kolkata' AS local_time FROM orders;
```

### Spring Boot Fix

```java
// application.yml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          time_zone: UTC  # Always store in UTC

// Entity
@Entity
public class Order {
    @Column(columnDefinition = "TIMESTAMPTZ")
    private Instant createdAt;  // Use Instant (UTC), never LocalDateTime!

    @PrePersist
    private void prePersist() {
        this.createdAt = Instant.now();  // Always UTC
    }
}

// API response: Convert to user's timezone
@GetMapping("/orders/{id}")
public OrderResponse getOrder(@PathVariable Long id,
                               @RequestHeader("X-Timezone") String tz) {
    Order order = orderRepo.findById(id).orElseThrow();
    ZonedDateTime local = order.getCreatedAt().atZone(ZoneId.of(tz));
    return new OrderResponse(order, local);
}
```

---

## Scenario 88: NULL vs Empty String Inconsistency

### SQL Solution

```sql
-- PROBLEM: Some columns have NULL, others have '' for "no value"
SELECT COUNT(*) FROM users WHERE middle_name IS NULL;      -- 50,000
SELECT COUNT(*) FROM users WHERE middle_name = '';          -- 23,000
-- Total "no middle name" = 73,000 but queries miss half!

-- FIX: Normalize to one convention (prefer NULL)
UPDATE users SET middle_name = NULL WHERE middle_name = '';

-- Add constraint to prevent empty strings:
ALTER TABLE users ADD CONSTRAINT chk_no_empty_string
    CHECK (middle_name IS NULL OR LENGTH(TRIM(middle_name)) > 0);

-- Oracle trap: Oracle treats '' as NULL automatically!
-- PostgreSQL/MySQL: '' and NULL are different

-- Application-level fix:
```

```java
// Spring Boot: Normalize in setter
@Entity
public class User {
    public void setMiddleName(String value) {
        this.middleName = (value != null && value.trim().isEmpty()) ? null : value;
    }
}

// Or: JPA AttributeConverter
@Converter(autoApply = true)
public class EmptyToNullConverter implements AttributeConverter<String, String> {
    @Override
    public String convertToDatabaseColumn(String s) {
        return (s != null && s.trim().isEmpty()) ? null : s;
    }

    @Override
    public String convertToEntityAttribute(String s) {
        return s;
    }
}
```

---

## Scenario 89: Decimal Precision Loss — $0.01 Becomes $0.00

### SQL Solution

```sql
-- PROBLEM: Price stored as FLOAT
CREATE TABLE products (price FLOAT);
INSERT INTO products VALUES (19.99);
SELECT price FROM products;  -- 19.989999999999998!

SELECT SUM(price) FROM products WHERE id IN (1,2,3);
-- Expected: 59.97, Got: 59.9699999999999994

-- FIX: Use DECIMAL/NUMERIC (exact precision)
ALTER TABLE products ALTER COLUMN price TYPE DECIMAL(10,2);
-- DECIMAL(10,2) = up to 99999999.99 — exact to the penny

-- Store prices as integers (cents) — even safer:
ALTER TABLE products ADD COLUMN price_cents INT;
UPDATE products SET price_cents = ROUND(price * 100);
-- $19.99 stored as 1999
-- All math is integer — no floating point issues ever

-- The golden rules:
-- FLOAT/DOUBLE: for scientific calculations (approximate OK)
-- DECIMAL:      for money (exact required)
-- INTEGER:      for money in smallest unit (cents) — safest
```

### Spring Boot Money Handling

```java
// NEVER use float/double for money
// BAD:
private double price;   // 19.989999999
private float price;    // 19.99 → 19.9899998

// GOOD:
private BigDecimal price;  // Exact: 19.99

@Entity
public class Product {
    @Column(precision = 10, scale = 2)
    private BigDecimal price;
}

// Or: Use integer cents
@Entity
public class Product {
    private int priceCents;  // 1999 = $19.99

    @Transient
    public BigDecimal getPriceDecimal() {
        return BigDecimal.valueOf(priceCents, 2);
    }
}
```

### DSA Connection

- **IEEE 754 floating point** = Binary representation can't express 0.1 exactly (like 1/3 in decimal)
- **Fixed-point arithmetic** = Storing offset integer (multiply by 100)
- **BigDecimal = Arbitrary precision** = Stores digits as array, not binary float

---

## Scenario 90: Duplicate Data from Failed Unique Constraint Migration

### SQL Solution

```sql
-- Trying to add UNIQUE on email, but 200 duplicates exist
ALTER TABLE users ADD CONSTRAINT uk_email UNIQUE (email);
-- ERROR: could not create unique index: duplicate key

-- Step 1: Find duplicates
SELECT email, COUNT(*), array_agg(id) AS duplicate_ids
FROM users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Step 2: Keep the most recent, mark others
WITH ranked AS (
    SELECT id, email,
        ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) AS rn
    FROM users
)
UPDATE users SET email = email || '_dup_' || id
FROM ranked
WHERE users.id = ranked.id AND ranked.rn > 1;
-- "john@example.com" (dup) → "john@example.com_dup_42"
-- Original stays as "john@example.com"

-- Step 3: Now add the constraint
ALTER TABLE users ADD CONSTRAINT uk_email UNIQUE (email);

-- Step 4: Notify affected users to verify their accounts
SELECT id, email FROM users WHERE email LIKE '%_dup_%';
```

---

## Scenario 91: Circular Foreign Key Preventing Table Drops

### SQL Solution

```sql
-- PROBLEM:
-- table_a.b_id → table_b(id)
-- table_b.a_id → table_a(id)
-- Can't drop either table!

-- FIX: Drop constraints first, then tables
ALTER TABLE table_a DROP CONSTRAINT fk_a_to_b;
ALTER TABLE table_b DROP CONSTRAINT fk_b_to_a;
DROP TABLE table_a;
DROP TABLE table_b;

-- Better design: Break the circular dependency
-- Use a junction/linking table instead
CREATE TABLE a_b_links (
    a_id INT REFERENCES table_a(id),
    b_id INT REFERENCES table_b(id),
    PRIMARY KEY (a_id, b_id)
);
```

---

## Scenario 92: God Table with 200 Columns

### 🔴 The Incident

`customer_master` table has 200 columns: personal info, billing, shipping, preferences, CRM fields, analytics flags, marketing... Every query touches all columns (row too wide for buffer pool).

### SQL Solution — Vertical Decomposition

```sql
-- Split by concern:
CREATE TABLE customers (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP
);

CREATE TABLE customer_billing (
    customer_id BIGINT PRIMARY KEY REFERENCES customers(id),
    billing_address JSONB,
    tax_id VARCHAR(20),
    payment_method VARCHAR(20)
);

CREATE TABLE customer_preferences (
    customer_id BIGINT PRIMARY KEY REFERENCES customers(id),
    language VARCHAR(5),
    currency VARCHAR(3),
    notification_settings JSONB
);

CREATE TABLE customer_analytics (
    customer_id BIGINT PRIMARY KEY REFERENCES customers(id),
    last_login TIMESTAMP,
    login_count INT,
    lifetime_value DECIMAL(10,2),
    churn_risk_score DECIMAL(3,2)
);

-- Create a VIEW for backward compatibility
CREATE VIEW customer_master_v AS
SELECT c.*, cb.*, cp.*, ca.*
FROM customers c
LEFT JOIN customer_billing cb USING (customer_id)
LEFT JOIN customer_preferences cp USING (customer_id)
LEFT JOIN customer_analytics ca USING (customer_id);
-- Old code using customer_master_v still works!
```

### DSA Connection

- **Wide row = Struct of Arrays** → queries scan too much data
- **Vertical split = Column store** → each query only reads needed columns
- **View = Adapter pattern** — old interface wrapping new structure

---

## Scenario 93: EAV Anti-Pattern at Scale

### SQL Solution

```sql
-- EAV (Entity-Attribute-Value) table:
CREATE TABLE product_attributes (
    product_id INT,
    attribute_name VARCHAR(50),
    attribute_value VARCHAR(255)
);
-- INSERT INTO product_attributes VALUES (1, 'color', 'red');
-- INSERT INTO product_attributes VALUES (1, 'size', 'XL');
-- INSERT INTO product_attributes VALUES (1, 'weight', '2.5');

-- PROBLEM 1: To get one product, you need N queries (or N self-joins)
SELECT
    p.id,
    MAX(CASE WHEN pa.attribute_name = 'color' THEN pa.attribute_value END) AS color,
    MAX(CASE WHEN pa.attribute_name = 'size' THEN pa.attribute_value END) AS size,
    MAX(CASE WHEN pa.attribute_name = 'weight' THEN pa.attribute_value END) AS weight
FROM products p
JOIN product_attributes pa ON pa.product_id = p.id
WHERE p.id = 1
GROUP BY p.id;
-- For 50 attributes, this is 50 CASE statements!

-- PROBLEM 2: Can't enforce types (weight stored as VARCHAR)
-- PROBLEM 3: Can't add constraints (e.g., weight must be positive)
-- PROBLEM 4: Indexes are useless (all attributes in one column)

-- FIX: Use JSONB instead of EAV (PostgreSQL)
ALTER TABLE products ADD COLUMN attributes JSONB DEFAULT '{}';
UPDATE products SET attributes = '{"color": "red", "size": "XL", "weight": 2.5}';

-- Query is now simple:
SELECT id, attributes->>'color' AS color, (attributes->>'weight')::NUMERIC AS weight
FROM products WHERE id = 1;

-- Can index specific JSON paths:
CREATE INDEX idx_prod_color ON products USING GIN(attributes);
SELECT * FROM products WHERE attributes @> '{"color": "red"}';

-- FIX 2: Use concrete columns for common attributes + JSONB for extras
CREATE TABLE products (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100),
    color VARCHAR(20),      -- Common: concrete column
    size VARCHAR(10),       -- Common: concrete column
    weight DECIMAL(10,2),   -- Common: concrete column with type!
    extra_attributes JSONB  -- Rare/variable: flexible JSON
);
```

---

## Scenario 94–100: Quick-Fire Schema & Disaster Scenarios

### Scenario 94: Polymorphic Association — No FK Enforcement

```sql
-- PROBLEM: comments.commentable_type + comments.commentable_id
-- Can point to posts, products, or users — but NO foreign key possible!
CREATE TABLE comments (
    id BIGINT PRIMARY KEY,
    commentable_type VARCHAR(20),  -- 'Post', 'Product', 'User'
    commentable_id BIGINT,         -- References different tables
    body TEXT
);
-- Database can't enforce: commentable_id must exist in the right table

-- FIX: Separate FK columns
CREATE TABLE comments (
    id BIGINT PRIMARY KEY,
    post_id BIGINT REFERENCES posts(id),
    product_id BIGINT REFERENCES products(id),
    user_id BIGINT REFERENCES users(id),
    body TEXT,
    CHECK (
        (post_id IS NOT NULL)::INT +
        (product_id IS NOT NULL)::INT +
        (user_id IS NOT NULL)::INT = 1  -- Exactly one must be set
    )
);
```

### Scenario 95: Database Drift — Dev/Staging/Prod Diverge

```sql
-- DETECT: Compare schemas
-- PostgreSQL: pg_dump --schema-only
pg_dump --schema-only -d dev_db > dev_schema.sql
pg_dump --schema-only -d prod_db > prod_schema.sql
diff dev_schema.sql prod_schema.sql

-- FIX: Use migration tools (Flyway/Liquibase) and NEVER apply manual DDL to prod
-- All schema changes MUST go through migration files
```

### Scenario 96: Renaming a Table — 47 Applications Break

```sql
-- SAFE: Create VIEW with old name
ALTER TABLE users RENAME TO user_accounts;
CREATE VIEW users AS SELECT * FROM user_accounts;
-- Old apps using "users" still work via the view
-- Migrate apps one by one to use "user_accounts"
-- Drop view after all apps updated
```

### Scenario 97: Adding a Generated/Computed Column

```sql
-- PostgreSQL:
ALTER TABLE orders ADD COLUMN total_with_tax DECIMAL(10,2)
    GENERATED ALWAYS AS (total * 1.18) STORED;  -- 18% tax

-- MySQL:
ALTER TABLE orders ADD COLUMN total_with_tax DECIMAL(10,2)
    GENERATED ALWAYS AS (total * 1.18) STORED;

-- VIRTUAL (not stored, computed on read — saves space):
ALTER TABLE orders ADD COLUMN total_with_tax DECIMAL(10,2)
    GENERATED ALWAYS AS (total * 1.18) VIRTUAL;  -- MySQL only
```

### Scenario 98: Splitting a Monolith Table for Microservices

```sql
-- Monolith: single orders table with everything
-- Microservices: order-service, payment-service, shipping-service each need their own DB

-- Step 1: Identify bounded contexts
-- order_service: orders(id, customer_id, status, total, created_at)
-- payment_service: payments(order_id, amount, method, status, paid_at)
-- shipping_service: shipments(order_id, address, carrier, tracking, shipped_at)

-- Step 2: Create change data capture (CDC) to sync
-- Use Debezium to stream changes from monolith → microservice DBs

-- Step 3: Dual-write period (both monolith and microservice)
-- Step 4: Verify consistency
-- Step 5: Cut over reads to microservice DB
-- Step 6: Cut over writes to microservice DB
-- Step 7: Decommission monolith table
```

### Scenario 99: Data Leak Between Tenants (Multi-Tenant)

```sql
-- PROBLEM: Missing WHERE tenant_id = ? returns OTHER tenant's data
SELECT * FROM invoices WHERE status = 'pending';
-- Returns ALL tenants' pending invoices!

-- FIX 1: Row-Level Security (PostgreSQL)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON invoices
    USING (tenant_id = current_setting('app.current_tenant')::INT);
-- Now IMPOSSIBLE to access other tenant's data, even with bad queries

-- FIX 2: Separate schemas per tenant
CREATE SCHEMA tenant_42;
CREATE TABLE tenant_42.invoices (LIKE public.invoices INCLUDING ALL);
-- Application sets search_path per request

-- Spring Boot: Set tenant context
```

```java
@Component
public class TenantFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        String tenantId = ((HttpServletRequest) req).getHeader("X-Tenant-Id");
        // Set PostgreSQL session variable
        jdbc.execute("SET app.current_tenant = " + Integer.parseInt(tenantId));
        chain.doFilter(req, res);
    }
}
```

### Scenario 100: Production Data Accidentally Deleted — Recovery

```sql
-- OH NO: DELETE FROM orders; (missing WHERE clause)
-- 10 million orders just deleted!

-- Recovery Option 1: Point-in-time recovery (PostgreSQL)
-- Requires WAL archiving configured BEFORE the incident
pg_basebackup -D /recovery_dir
-- Replay WAL up to 1 minute before the DELETE
recovery_target_time = '2025-03-08 14:29:00'

-- Recovery Option 2: Flashback query (Oracle, MySQL 8.0 with binlog)
-- MySQL: mysqlbinlog to extract and replay INSERT statements
mysqlbinlog --start-position=12345 --stop-position=67890 binlog.000042 | mysql

-- Recovery Option 3: pgBackRest (PostgreSQL)
pgbackrest --stanza=main --type=time --target='2025-03-08 14:29:00' restore

-- PREVENTION:
-- 1. Always require WHERE in DELETE/UPDATE (sql_safe_updates in MySQL)
SET sql_safe_updates = 1;
-- Now DELETE/UPDATE without WHERE or LIMIT is rejected!

-- 2. Test DELETE with SELECT first
SELECT COUNT(*) FROM orders WHERE status = 'cancelled' AND created_at < '2024-01-01';
-- Verify the count before running DELETE

-- 3. Use soft delete instead of hard delete
UPDATE orders SET deleted_at = NOW() WHERE id = 42;
-- Recoverable! Just SET deleted_at = NULL
```

### Spring Boot Prevent Accidental Mass Delete

```java
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    // DANGER: This allows deleteAll()!
    // Override to prevent accidental mass deletes:

    @Override
    default void deleteAll() {
        throw new UnsupportedOperationException(
            "Mass delete disabled. Use deleteByIdIn() with specific IDs."
        );
    }
}
```

---

## 🧠 DSA Patterns Behind Schema & Migration Scenarios

| Scenario               | DSA Pattern                                             |
| ---------------------- | ------------------------------------------------------- |
| ALTER TABLE copy       | **Array resize** — allocate new, copy, swap             |
| 3-step NOT NULL add    | **Gradual migration** — phase change over time          |
| Expand-contract        | **Blue-green deployment** — two versions coexist        |
| Orphan detection       | **Graph: find unreachable nodes** — dangling references |
| Dedup before unique    | **HashSet / sorting** — detect duplicates               |
| God table split        | **Decomposition** — SRP (Single Responsibility)         |
| EAV → JSONB            | **Hash map** — key-value store per entity               |
| Circular FK            | **Cycle in directed graph** — break with indirection    |
| Schema drift           | **Version diff** — three-way merge conflict             |
| Point-in-time recovery | **Undo log / WAL replay** — event sourcing              |

---

[⬅ Previous: 40_RealWorld_Production_Scenarios_Part3](40_RealWorld_Production_Scenarios_Part3.md) | [📚 Index](00_INDEX.md) | [Next: 42_RealWorld_Production_Scenarios_Part5 ➡](42_RealWorld_Production_Scenarios_Part5.md)

### Historical Evolution

**Predecessors (with years):**
- **Facebook Infrastructure (2010)**: Published "Online Schema Change for MySQL" — the first open description of how to alter large tables without downtime using trigger-based dual-write
- **GitHub Engineering (2016)**: Released gh-ost (GitHub Online Schema Tool) — replaced trigger-based migration with binary log capture, eliminating the trigger lock contention problem that plagued Facebook's approach
- **MySQL Oracle (2013)**: MySQL 5.6 introduced ALGORITHM=INPLACE, LOCK=NONE for many DDL operations — native online DDL reducing the need for external tools for simple schema changes
- **Martin Fowler, "Parallel Change" (2014)**: Named and formalized the expand-contract migration pattern in his bliki, drawing together practices already used informally for safe schema and API evolution — adding nullable columns first, deploying code that writes to both, then dropping the old column in a separate deployment

**Evolution narrative:**
Schema migration was largely ignored as a problem until social-media-scale companies hit multi-hour ALTER TABLE locks on tables with hundreds of millions of rows. Facebook's 2010 online schema change paper was the first systematic treatment — they used triggers to capture live changes while copying data to a shadow table. GitHub's gh-ost (2016) improved on this by using the MySQL binlog instead of triggers (avoiding trigger lock contention) and making the migration controllable via a pseudo-table with no triggers at all. Fowler's expand-contract framing (2014) gave the industry a name and a formal three-phase structure for the safest way to handle column renames and drops — it treats schema migration as a multi-step handoff between code and database, never breaking either during transition.

**Modern practice anchor:**
Today, tools like Flyway and Liquibase formalize expand-contract as migration scripts, gh-ost handles MySQL online DDL, and PostgreSQL 11+ makes ADD COLUMN with DEFAULT instantaneous. The industry learned that schema changes are fundamentally different from code changes: during deployment, both old and new code must work with both old and new schema simultaneously.


---

## Reality Check

**"High availability means zero downtime"** → High availability (HA) means MINIMAL downtime. A PostgreSQL primary with synchronous standby achieves 99.99 percent uptime — which is still 52 minutes of downtime per year. Failover takes 10-60 seconds during which writes are unavailable. Planned maintenance (version upgrades, security patches) requires either downtime or rolling upgrades with backward-compatible schemas. Zero downtime is aspirational, not achievable for stateful systems.

**"Replication makes backups unnecessary"** → Replication protects against HARDWARE failure (primary dies, replica takes over). It does NOT protect against LOGICAL errors (DROP TABLE propagates to all replicas instantly). A junior developer running DELETE FROM users without WHERE replicates to every replica within milliseconds. Point-in-time recovery from WAL-based backups is the only protection against logical errors.

**"Connection timeout and query timeout are the same"** → Connection timeout is how long the application waits to ESTABLISH a TCP connection to the database (typically 5-10 seconds). Query timeout (statement timeout) is how long the database allows a query to RUN before killing it. Without a query timeout, a missing-index query scanning 100 million rows runs for 30 minutes, holding a connection pool slot. Set BOTH timeouts in production.

**"Read replicas double read capacity"** → Read replicas handle INDEPENDENT read queries. But if every read follows a write (read-your-writes consistency requirement), the read must go to the primary, gaining nothing from replicas. Read replicas benefit: dashboard queries, report generation, search indexing, and reads where slight staleness is acceptable. Measure your read-after-write percentage before adding replicas.

**"Database performance degrades linearly with data size"** → B-tree index performance degrades LOGARITHMICALLY — doubling the data adds one tree level, increasing lookup from 3 to 4 I/O operations. Sequential scans degrade linearly. This means indexed queries remain fast as data grows (1ms on 1 million rows, 1.3ms on 1 billion rows), but unindexed queries degrade proportionally (100ms on 1 million rows, 100000ms on 1 billion rows). The index/no-index gap widens exponentially with data growth.
