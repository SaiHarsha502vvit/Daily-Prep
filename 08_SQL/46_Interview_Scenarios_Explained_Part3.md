# Chapter 46 — Interview-Grade Scenario Explanations Part 3: Schema, Migration & Architecture

> **What:** 10+ scenarios covering schema evolution, production migrations, backend architecture failures — the topics that signal "this person has actually worked in production"
> **Who Benefits:** Anyone interviewing for mid-to-senior backend/full-stack roles

---

## 📋 Scenarios in This File

| # | Scenario | Interview Trigger |
|---|----------|-------------------|
| S21 | Schema Migration Gone Wrong | "Tell me about your worst deployment" |
| S22 | Circular Foreign Key / Delete Cascade Crisis | "How do you handle referential integrity?" |
| S23 | JSON Column Abuse | "When would you use JSON columns vs normalized tables?" |
| S24 | Soft Delete Leading to Performance Decay | "How do you handle deletes in production?" |
| S25 | Enum Column That Won't Scale | "How do you design for schema evolution?" |
| S26 | Multi-Tenant Data Isolation Failure | "How would you design a multi-tenant system?" |
| S27 | Time Zone Bugs in Production | "Tell me about a subtle bug that was hard to track down" |
| S28 | Bulk Import Killing Production | "How do you handle large data imports?" |
| S29 | Microservice Database Anti-Patterns | "What's the biggest mistake in microservice architecture?" |
| S30 | Monitoring Blind Spots | "How do you know when something is wrong before users do?" |

---




## S21: Schema Migration Gone Wrong

### 🎤 Interview Question
> "Tell me about your worst deployment experience."

### ✅ Professional Answer

"The worst deployment I was involved in was a column rename on a live table. A developer renamed `user_name` to `username` in a migration script. Flyway applied it in production, and immediately every query referencing `user_name` broke — the application was still deploying the old code version. We had a 4-minute outage.

**What went wrong:** The deployment ran migrations BEFORE deploying the new application code. For 2-4 minutes, old code referenced the old column name that no longer existed.

**The correct pattern for column renames:**"

```sql
-- Phase 1: Deploy with new column (additive, backward-compatible)
ALTER TABLE users ADD COLUMN username VARCHAR(100);
UPDATE users SET username = user_name WHERE username IS NULL;
-- Create trigger to keep both columns in sync:
CREATE OR REPLACE FUNCTION sync_username() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.username IS NOT NULL AND NEW.user_name IS NULL THEN
        NEW.user_name := NEW.username;
    ELSIF NEW.user_name IS NOT NULL AND NEW.username IS NULL THEN
        NEW.username := NEW.user_name;
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_username BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION sync_username();

-- Phase 2: Deploy new code that reads/writes 'username' column
-- Old code still works because user_name exists + trigger syncs

-- Phase 3: Remove old column (after all code deployed and verified)
DROP TRIGGER trg_sync_username ON users;
ALTER TABLE users DROP COLUMN user_name;
```

"**This is the expand-and-contract pattern:**
1. **Expand:** Add new column alongside old one (both work)
2. **Migrate:** New code uses new column; sync keeps old working
3. **Contract:** Remove old column after all code updated

It adds complexity but guarantees zero downtime."

### 📚 Theory: Safe vs Unsafe Migration Operations

```
SAFE (instant, no lock):
✅ ADD COLUMN (nullable, no default in older PG; any in PG11+)
✅ ADD INDEX CONCURRENTLY
✅ CREATE TABLE
✅ DROP INDEX CONCURRENTLY
✅ ADD new enum value (PostgreSQL)

UNSAFE (table rewrite or exclusive lock):
❌ ALTER COLUMN TYPE (rewrite in many cases)
❌ ADD COLUMN NOT NULL without default (older PostgreSQL)
❌ DROP COLUMN on hot table (rewrites in MySQL)
❌ RENAME COLUMN (breaks existing code)
❌ ADD FOREIGN KEY (needs to validate ALL existing rows)

MAKE UNSAFE SAFE:
- ADD FK → ADD CONSTRAINT ... NOT VALID, then VALIDATE CONSTRAINT (two steps)
- ALTER TYPE → Add new column, backfill, swap, drop old
- DROP COLUMN → Stop using it, deploy, then drop
```

### 🔄 Variants

**Variant A: Rolling back a migration**
```sql
-- ALWAYS write reversible migrations
-- Flyway: V1__add_discount.sql + V1__undo_add_discount.sql
-- DO NOT: ALTER TABLE DROP COLUMN as "rollback" for ADD COLUMN
--   → DATA LOSS if the column was populated between deploy and rollback

-- Safe rollback: Just deploy old code. Leave new column. Clean up later.
```

---

## S22: Circular Foreign Key / Cascade Delete Crisis

### 🎤 Interview Question
> "How do you handle complex referential integrity?"

### ✅ Professional Answer

```sql
-- PROBLEM: Cascade delete wipes out more than expected
-- users → orders → order_items → inventory_reservations
--                → shipping_labels → tracking_events
-- DELETE FROM users WHERE id = 100;
-- With ON DELETE CASCADE: Deletes user + ALL orders + items + reservations + labels + events
-- Could delete thousands of rows across 6 tables from ONE delete

-- SOLUTION 1: Use RESTRICT + application-level cleanup
ALTER TABLE orders ADD CONSTRAINT fk_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
-- DELETE FROM users WHERE id = 100; → ERROR: still referenced by orders
-- Force explicit cleanup in the right order

-- SOLUTION 2: Soft delete (mark inactive, don't truly delete)
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
UPDATE users SET deleted_at = NOW() WHERE id = 100;
-- User is "deleted" but data remains for audit/compliance
-- Queries filter: WHERE deleted_at IS NULL

-- SOLUTION 3: For truly necessary deletes — batch and control
-- First, audit what will be affected:
WITH RECURSIVE cascade_count AS (
    SELECT 'orders' AS table_name, COUNT(*) AS cnt FROM orders WHERE user_id = 100
    UNION ALL
    SELECT 'order_items', COUNT(*) FROM order_items WHERE order_id IN 
        (SELECT id FROM orders WHERE user_id = 100)
    -- ... continue for all dependent tables
)
SELECT * FROM cascade_count;
-- Review the impact BEFORE executing the delete
```

---

## S23: JSON Column Abuse

### 🎤 Interview Question
> "When would you use JSON columns vs normalized tables?"

### ✅ Professional Answer

"JSON columns are powerful but frequently misused. Here's my decision framework:

**Use JSON when:**
- Schema-less data that varies per row (user preferences, form submissions)
- Rarely queried/filtered — just stored and returned to the application
- Third-party webhook payloads that you want to store raw

**Use normalized tables when:**
- You need to query/filter/join on the data
- The structure is consistent across rows
- You need UNIQUE constraints or foreign keys on the data

**The anti-pattern I've seen most often:**"

```sql
-- BAD: Storing structured data as JSON
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    data JSONB  -- everything as JSON
);

-- Want to find orders over $100? 
SELECT * FROM orders WHERE (data->>'total')::numeric > 100;
-- Problems:
-- 1. Can't use standard B-Tree index (need GIN or expression index)
-- 2. No type safety — data->>'total' could be "abc"
-- 3. No FK constraints — data->>'customer_id' can reference nonexistent customer
-- 4. No NOT NULL enforcement on specific fields
-- 5. Schema evolution is invisible — no migration tracks changes

-- GOOD: JSON for genuinely semi-structured parts
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    total DECIMAL(12,2) NOT NULL,        -- indexed, typed, constrained
    status VARCHAR(20) NOT NULL,         -- filtered frequently
    metadata JSONB DEFAULT '{}'::jsonb   -- variable extra data: source, UTM tags, etc.
);

-- Index the JSON field you actually query:
CREATE INDEX idx_orders_metadata_source ON orders ((metadata->>'source'));
```

### 📚 When Each Approach Wins

```
| Criteria              | Normalized Table | JSONB Column     |
|----------------------|:----------------:|:----------------:|
| Query performance    | ★★★★★           | ★★★              |
| Schema flexibility   | ★★               | ★★★★★           |
| Data integrity       | ★★★★★           | ★★               |
| Index efficiency     | ★★★★★           | ★★★ (GIN/expr)  |
| Joins                | ★★★★★           | ★ (expensive)    |
| Schema evolution     | ★★★ (migrations) | ★★★★ (flexible) |
| Storage efficiency   | ★★★★             | ★★★ (overhead)   |
```

---

## S24: Soft Delete Performance Decay

### 🎤 Interview Question
> "How do you handle deletes in a production system?"

### ✅ Professional Answer

"Soft delete (setting `deleted_at` instead of actually deleting) is the standard practice for audit trails and data recovery. But it creates a hidden performance problem: your indexes grow forever.

**The scenario:**"

```sql
-- Table: 50M total rows, 45M are soft-deleted, 5M are active
-- Every query adds: WHERE deleted_at IS NULL
SELECT * FROM orders WHERE status = 'pending' AND deleted_at IS NULL;

-- The index on (status) contains all 50M rows
-- But you only care about 5M active rows → 90% of index is waste

-- SOLUTION: Partial index (PostgreSQL)
CREATE INDEX idx_orders_status_active 
ON orders (status) 
WHERE deleted_at IS NULL;
-- This index only contains the 5M active rows → 10x smaller → 10x faster

-- MySQL equivalent: No partial indexes, but you can use a generated column
ALTER TABLE orders ADD COLUMN is_active BOOLEAN GENERATED ALWAYS AS 
    (CASE WHEN deleted_at IS NULL THEN TRUE ELSE NULL END) STORED;
CREATE INDEX idx_orders_active ON orders (is_active, status);
-- NULL values aren't indexed in MySQL → only active rows in index
```

```java
// Spring Boot: Global specification to always filter soft-deleted
@Where(clause = "deleted_at IS NULL")  // Hibernate auto-adds this
@Entity
public class Order {
    // ...
    private Instant deletedAt;
}

// WARNING: @Where is applied to entity queries but NOT to native queries
// Always remember to add the filter in native SQL manually
```

### 📚 Theory

```
Why soft delete indexes bloat:
- Hard delete: B-Tree removes entry → index stays small
- Soft delete: Row stays → index entry stays → index grows monotonically
- Over time: 90% of index entries point to invisible rows
- Full index scan includes invisible rows → wasted I/O

Partial index math:
- Full index on 50M rows: ~1.5GB
- Partial index on 5M active rows: ~150MB
- 10x smaller → fits in RAM → 10x faster queries

Alternative: Partitioning by active/archived
- Active partition: small, fast, hot
- Archive partition: large, cold, rarely accessed
- Move rows to archive partition periodically
```

---

## S25: Enum Column That Won't Scale

### 🎤 Interview Question
> "How do you handle status fields that accumulate more values over time?"

### ✅ Professional Answer

```sql
-- PROBLEM WITH MYSQL ENUM:
CREATE TABLE orders (
    status ENUM('pending', 'confirmed', 'shipped') NOT NULL
);
-- Adding a new value requires ALTER TABLE → table rewrite in older MySQL
-- ALTER TABLE orders MODIFY status ENUM('pending', 'confirmed', 'shipped', 'cancelled');
-- On 100M rows → minutes of downtime

-- BETTER APPROACHES:

-- Approach 1: VARCHAR with CHECK constraint (PostgreSQL)
CREATE TABLE orders (
    status VARCHAR(20) NOT NULL,
    CONSTRAINT chk_status CHECK (status IN ('pending', 'confirmed', 'shipped'))
);
-- Adding a value: Just modify the CHECK constraint (instant metadata change)
ALTER TABLE orders DROP CONSTRAINT chk_status;
ALTER TABLE orders ADD CONSTRAINT chk_status 
    CHECK (status IN ('pending', 'confirmed', 'shipped', 'cancelled'));

-- Approach 2: Lookup table (most flexible)
CREATE TABLE order_statuses (
    code VARCHAR(20) PRIMARY KEY,
    display_name VARCHAR(100),
    sort_order INT,
    is_terminal BOOLEAN DEFAULT FALSE
);
INSERT INTO order_statuses VALUES 
    ('pending', 'Pending', 1, false),
    ('confirmed', 'Confirmed', 2, false),
    ('shipped', 'Shipped', 3, false),
    ('cancelled', 'Cancelled', 4, true);

CREATE TABLE orders (
    status VARCHAR(20) NOT NULL REFERENCES order_statuses(code)
);
-- Adding a new status: Just INSERT into lookup table. No ALTER TABLE at all.

-- Approach 3: Java enum + VARCHAR (my preferred for Spring Boot)
-- Database: VARCHAR(20) — flexible, no schema change for new values
-- Application: Java enum — type safety, IDE support, switch statements
```

---

## S26: Multi-Tenant Data Isolation Failure

### 🎤 Interview Question
> "How would you design a multi-tenant system?"

### ✅ Professional Answer

"Multi-tenancy has three architecture patterns, each with different isolation vs efficiency trade-offs:

```
PATTERN 1: Shared database, shared schema (column-based tenant isolation)
┌─────────────────────────────┐
│ orders TABLE                │
│ id | tenant_id | data       │
│  1 |    A      | ...        │
│  2 |    B      | ...        │ ← ALL tenants in ONE table
│  3 |    A      | ...        │
└─────────────────────────────┘
PROS: Simple, cheap, easy to maintain
CONS: One missing WHERE tenant_id = ? → DATA LEAK
      "Noisy neighbor" — one tenant's queries affect all

PATTERN 2: Shared database, separate schemas
┌─────────────┬─────────────┐
│ tenant_a.   │ tenant_b.   │
│ orders      │ orders      │
│ id | data   │ id | data   │
│  1 | ...    │  1 | ...    │
└─────────────┴─────────────┘
PROS: Good isolation, shared infrastructure
CONS: Schema migrations must run for EACH tenant schema

PATTERN 3: Separate databases per tenant
PROS: Complete isolation, easy compliance (GDPR)
CONS: Expensive, complex management, connection pool per DB
```

**The most common bug (Pattern 1):**"

```java
// DANGEROUS: Developer forgets tenant filter
@Query("SELECT o FROM Order o WHERE o.status = :status")
List<Order> findByStatus(@Param("status") String status);
// Returns ALL tenants' orders → DATA BREACH

// SOLUTION: Hibernate filter (applied automatically)
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = String.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Entity
public class Order {
    @Column(name = "tenant_id", nullable = false)
    private String tenantId;
}

// Enable filter on every request (in interceptor):
@Component
public class TenantInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, ...) {
        String tenantId = extractTenantId(request);
        Session session = entityManager.unwrap(Session.class);
        session.enableFilter("tenantFilter").setParameter("tenantId", tenantId);
        return true;
    }
}
// Now EVERY query automatically includes WHERE tenant_id = ?
// Impossible to accidentally leak data across tenants
```

```sql
-- ADDITIONAL SAFETY: Row-Level Security (PostgreSQL)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders
    USING (tenant_id = current_setting('app.tenant_id'));
-- Even raw SQL queries are filtered by the database itself
-- Defense in depth: even if application bug skips filter, DB enforces it
```

---

## S27: Time Zone Bugs in Production

### 🎤 Interview Question
> "Tell me about a subtle bug that was hard to track down."

### ✅ Professional Answer

"Time zone bugs are insidious because they only manifest for certain users in certain time zones, and often only around midnight UTC.

**The bug:** A report showing 'orders placed today' was missing orders for users in UTC+12 (New Zealand) and double-counting orders for UTC-12. The report used `DATE(created_at) = CURRENT_DATE` — which compared server-local dates.

**The fix:**"

```sql
-- BAD: Depends on server timezone
SELECT * FROM orders WHERE DATE(created_at) = CURRENT_DATE;
-- Server is UTC. User is in Tokyo (UTC+9).
-- User's "today" starts at 3 PM UTC yesterday from server's perspective

-- GOOD: Always store as TIMESTAMPTZ, convert per user
-- Store: 2025-07-24T22:30:00+09:00 → stored as 2025-07-24T13:30:00Z
-- Query with user's timezone:
SELECT * FROM orders 
WHERE created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Tokyo')
  AND created_at <  DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Tokyo') + INTERVAL '1 day';
```

```java
// Spring Boot: Always use Instant (UTC) internally
@Entity
public class Order {
    @Column(columnDefinition = "TIMESTAMPTZ")
    private Instant createdAt;  // Always UTC — no timezone ambiguity
    
    // Convert for display only:
    public ZonedDateTime getCreatedAtForUser(ZoneId userZone) {
        return createdAt.atZone(userZone);
    }
}

// CRITICAL RULES:
// 1. Store TIMESTAMPTZ (not TIMESTAMP) in PostgreSQL
// 2. Use Instant (not LocalDateTime) in Java
// 3. Convert to user's timezone only at the display layer
// 4. Never use DATE() or CURRENT_DATE in cross-timezone queries
```

---




## S28: Bulk Import Killing Production

### 🎤 Interview Question
> "How do you handle large data imports in a live system?"

### ✅ Professional Answer

```java
// PROBLEM: Importing 5M rows in one transaction
@Transactional
public void importOrders(List<Order> orders) {
    orderRepo.saveAll(orders);  // 5M inserts in ONE transaction
    // Holds locks for the entire duration
    // WAL grows to massive size
    // Other queries slow down or timeout
    // OOM if Hibernate tries to track 5M entities
}

// SOLUTION: Batch import with throttling
public void importOrders(List<Order> orders) {
    int batchSize = 1000;
    for (int i = 0; i < orders.size(); i += batchSize) {
        List<Order> batch = orders.subList(i, Math.min(i + batchSize, orders.size()));
        importBatch(batch);
        
        if (i % 100000 == 0) {
            log.info("Imported {}/{} rows", i, orders.size());
            Thread.sleep(100);  // Brief pause to let other queries breathe
        }
    }
}

@Transactional
public void importBatch(List<Order> batch) {
    // Use JDBC batch insert for maximum speed
    jdbcTemplate.batchUpdate(
        "INSERT INTO orders (customer_id, amount, status) VALUES (?, ?, ?)",
        new BatchPreparedStatementSetter() {
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                ps.setLong(1, batch.get(i).getCustomerId());
                ps.setBigDecimal(2, batch.get(i).getAmount());
                ps.setString(3, batch.get(i).getStatus());
            }
            public int getBatchSize() { return batch.size(); }
        }
    );
}
```

```sql
-- For really large imports: Use COPY (PostgreSQL) or LOAD DATA (MySQL)
-- PostgreSQL COPY: 30x faster than INSERT for bulk loads
COPY orders (customer_id, amount, status) FROM '/tmp/orders.csv' CSV HEADER;
-- Note: Temporarily disabling indexes during bulk load can speed things up 10x
-- Re-add indexes after import
```

---




## S29: Microservice Database Anti-Patterns

### 🎤 Interview Question
> "What's the biggest mistake teams make with microservice databases?"

### ✅ Professional Answer

"The biggest mistake is **shared database** — multiple microservices reading/writing the same database tables. It defeats the entire purpose of microservices.

**Anti-pattern 1: Shared tables**"

```
ORDER SERVICE ──→ ┌──────────────┐ ←── USER SERVICE
                  │  users table │
                  │  orders table│
PAYMENT SERVICE ─→│  payments    │ ←── REPORTING SERVICE
                  └──────────────┘
Problems:
- Schema change to 'users' requires coordinating 4 teams
- One service's heavy query slows all others
- No independent deployment — all services coupled to same schema
```

"**Correct pattern: Database per service + API/events for communication**"

```
ORDER SERVICE ──→ [orders_db]
                      │
         ┌────────────┤ (events)
         ↓            ↓
USER SERVICE ──→ [users_db]    PAYMENT SERVICE ──→ [payments_db]

- Each service owns its data exclusively
- Need user data from Order Service? Call User Service API
- Need to sync data? Use events (eventual consistency)
```

"**Anti-pattern 2: Distributed join through API calls**"

```java
// BAD: N+1 across microservices
List<Order> orders = orderService.getOrders();
for (Order o : orders) {
    User user = userService.getUser(o.getUserId());  // HTTP call per order!
}

// GOOD: Batch API + local denormalization
List<Long> userIds = orders.stream().map(Order::getUserId).distinct().toList();
Map<Long, User> users = userService.getUsersByIds(userIds);  // ONE call

// BETTER: Store needed user data locally (denormalize)
// Order Service keeps a copy of user name/email
// Updated via events: UserUpdatedEvent → Order Service updates local copy
```

---



## S30: Monitoring Blind Spots That Hide Production Issues

### 🎤 Interview Question
> "How do you know when something is wrong before users complain?"

### ✅ Professional Answer

"I set up monitoring with the 4 Golden Signals (from Google SRE): latency, traffic, errors, saturation. Plus database-specific metrics:

**The dashboards I always build:**"

```sql
-- 1. SLOW QUERY MONITORING (real-time)
-- PostgreSQL: pg_stat_statements top 10 by total time
SELECT LEFT(query, 100), calls, mean_exec_time, total_exec_time
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;

-- 2. CONNECTION POOL HEALTH
-- Alert when: active connections > 80% of pool size
-- Alert when: waiting connections > 0 for more than 5 seconds

-- 3. REPLICATION LAG (for read replicas)
SELECT NOW() - pg_last_xact_replay_timestamp() AS replication_lag;
-- Alert when: lag > 5 seconds

-- 4. TABLE BLOAT (dead rows from soft deletes / MVCC)
SELECT relname, n_dead_tup, n_live_tup, 
       ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 10000
ORDER BY n_dead_tup DESC;
-- Alert when: dead_pct > 20% → VACUUM needed

-- 5. LONG-RUNNING TRANSACTIONS
SELECT pid, NOW() - xact_start AS duration, state, LEFT(query, 100)
FROM pg_stat_activity
WHERE xact_start IS NOT NULL AND NOW() - xact_start > INTERVAL '5 minutes';
-- Alert when: any transaction > 5 minutes
```

```java
// Spring Boot metrics to export (via Micrometer → Prometheus → Grafana):
@Bean
MeterRegistryCustomizer<MeterRegistry> metricsConfig() {
    return registry -> {
        // Request latency percentiles (p50, p95, p99)
        // These catch degradation BEFORE averages move
        // Average response time: 200ms (looks fine)
        // p99 response time: 5000ms (5% of users suffering!)
    };
}

// Alert thresholds I configure:
// - p99 latency > 2x normal → WARNING
// - p99 latency > 5x normal → CRITICAL
// - Error rate > 1% → WARNING
// - Error rate > 5% → CRITICAL
// - Connection pool utilization > 80% → WARNING
// - Disk space < 20% → WARNING
```

---




## 🎯 Architecture Decision Interview Cheat Sheet

| Decision Point | Junior Says | Senior Says |
|---------------|------------|-------------|
| Schema migration | "I'll just ALTER TABLE" | "I'll use expand-and-contract with zero-downtime migrations" |
| Soft vs hard delete | "Just delete it" | "Soft delete with partial indexes and archival strategy" |
| JSON columns | "Let's store everything as JSON" | "Structured data gets columns; dynamic metadata gets JSONB" |
| Multi-tenancy | "Add tenant_id column" | "RLS + Hibernate filter for defense-in-depth isolation" |
| Data import | "saveAll() with @Transactional" | "Batched JDBC inserts with throttling and COPY for large loads" |
| Microservices DB | "All services use the same database" | "Database per service, events for synchronization" |
| Monitoring | "We check logs when users complain" | "Golden signals + p99 latency alerts catch issues before users notice" |

---

[⬅ Previous: 45_Interview_Scenarios_Part2](45_Interview_Scenarios_Explained_Part2.md) | [📚 Index](00_INDEX.md) | [Next: 47_Theory_Deep_Dive ➡](47_Theory_Deep_Dive_Database_Internals.md)
