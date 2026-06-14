# Chapter 48 — Problem Variants Bank: 100+ Interview Practice Problems

**What:** Every core scenario from chapters 38-46 with 2-4 variants each — different scales, constraints, technologies. Practice these to handle any twist an interviewer throws.
**How To Use:** Pick a variant. Explain using the SIREN framework from Chapter 43. Time yourself: 2 minutes for the summary, 5 minutes for the deep dive.

---

## 📋 Variant Categories

| Category                 | Variants    | Key Skills Tested                    |
| ------------------------ | ----------- | ------------------------------------ |
| A. ID & Primary Key      | 12 variants | Scale estimation, migration planning |
| B. Query Performance     | 15 variants | Index design, execution plans        |
| C. N+1 & ORM             | 10 variants | ORM understanding, batch patterns    |
| D. Pagination            | 8 variants  | Cursor design, API patterns          |
| E. Connection & Pool     | 10 variants | Resource management, Little's Law    |
| F. Concurrency & Locks   | 15 variants | Deadlocks, isolation, locking        |
| G. Schema & Migration    | 12 variants | Zero-downtime DDL, expand-contract   |
| H. Architecture & Design | 12 variants | Trade-offs, distributed systems      |
| I. Monitoring & Debug    | 8 variants  | Diagnosis, metrics, troubleshooting  |

---

## A. ID & Primary Key Variants

### A1. INT to BIGINT Migration on 24/7 System

**Setup:** E-commerce orders table, 2B rows, INT PK at 95% capacity, zero-downtime requirement.
**Twist:** The table has 15 foreign key references from other tables.
**Expected Discussion Points:**

- Shadow table approach with sequence continuation
- FK migration order (child tables first or parent first?)
- Dual-write period duration and rollback plan
- How to verify data integrity after migration

### A2. UUID v4 Performance Regression

**Setup:** Team migrated from INT to UUID v4 for distributed IDs. INSERT throughput dropped 60%.
**Twist:** They also noticed their ORDER BY queries got 3x slower.
**Expected Discussion Points:**

- B-Tree fragmentation from random UUIDs (page splits)
- Index size doubled (16 bytes vs 8 bytes)
- Solution: UUID v7 (time-ordered) or Snowflake IDs
- How to measure: pg_stat_user_tables → n_tup_ins, idx_scan vs seq_scan

### A3. Snowflake ID Clock Skew

**Setup:** Distributed system using Snowflake IDs. After a server clock jumped backward, IDs collided.
**Twist:** The collision wasn't detected immediately — orders were overwritten.
**Expected Discussion Points:**

- Snowflake ID structure (timestamp + machine + sequence)
- Clock skew in distributed systems
- Solution: Machine-local clock check, refuse to generate if clock goes backward
- Detection: Add UNIQUE constraint + conflict handling

### A4. Multi-Region ID Collision After Database Merge

**Setup:** Two regions (US and EU) each have independent PostgreSQL databases. After merger, data must be consolidated.
**Expected Discussion Points:**

- ID ranges overlap (both start from 1)
- Solutions: Offset one range, add region prefix, switch to UUIDs
- FK references in both databases need remapping
- Data migration tools: pg_dump with id transformation scripts

### A5. Running Out of VARCHAR Business IDs

**Setup:** Invoice numbers follow pattern `INV-YYYY-NNNNN` (e.g., `INV-2025-00001`). At 99,999/year limit.
**Twist:** Changing format breaks integration with 3 external payment processors.
**Expected Discussion Points:**

- Extend to 7 digits? Alphanumeric? New format entirely?
- External API compatibility and versioning
- Database: decouple internal ID from business ID
- Transition period with both old and new format

### A6. Auto-Increment Gaps Causing Business Panic

**Setup:** Business stakeholders notice invoice IDs have gaps (1, 2, 5, 6, 9...) and suspect data loss.
**Expected Discussion Points:**

- Auto-increment gaps are NORMAL (rolled-back transactions, failed inserts)
- Gaps do NOT indicate data loss
- If business requires gapless: use a counter table with pessimistic lock (but: bottleneck!)
- Education: explain auto-increment vs business sequence number difference

### A7. Composite Primary Key Migration

**Setup:** Legacy table uses composite PK (customer_id, order_date, sequence_num). Need to add a surrogate key.
**Expected Discussion Points:**

- ADD COLUMN with DEFAULT → BIGSERIAL
- Old queries still work (composite still unique)
- Gradually migrate FKs from composite to surrogate
- Index on old composite for backward compatibility

### A8. ID Sequence Exhausted Silently

**Setup:** Sequence maxed out on a Saturday night. Application started getting duplicate key violations.
**Expected Discussion Points:**

- Monitoring: alert when sequence value > 80% of max
- PostgreSQL: `SELECT last_value, max_value FROM sequence_name;`
- Immediate fix: ALTER SEQUENCE ... MAXVALUE 9223372036854775807 AS BIGINT
- Post-mortem: add monitoring, create runbook

### A9. Replication Sequence Conflict

**Setup:** Master-master replication. Both nodes generate the same sequence values → PK collisions.
**Expected Discussion Points:**

- Each node needs different sequence increment/offset
  Node A: START 1, INCREMENT 2 (odd: 1,3,5,7...)
  Node B: START 2, INCREMENT 2 (even: 2,4,6,8...)
- Better: UUIDs for multi-master setups
- Consider: CRDTs for conflict-free replicated data

### A10. Archival Table ID Strategy

**Setup:** Active table: 10M rows. Archive table: 500M rows. Both need IDs that don't collide.
**Expected Discussion Points:**

- Shared sequence across both tables
- OR: Archive table uses negative IDs (rarely queried, doesn't matter)
- OR: UUID for archive, INT for active (different access patterns)
- Query pattern: 99% of queries hit active table only

### A11. Microservice ID Coordination

**Setup:** 12 microservices all need to generate unique IDs independently.
**Expected Discussion Points:**

- UUID v7: no coordination needed, time-ordered
- Snowflake ID: needs machine ID assignment (ZooKeeper or config)
- Database sequence per service: needs network call → latency
- Twitter's approach: machine_id from deployment config

### A12. ID Reuse After Hard Delete

**Setup:** GDPR requires hard delete of user data. After deleting user 12345, a new user gets ID 12345.
**Expected Discussion Points:**

- Auto-increment doesn't reuse IDs (PostgreSQL), but recovery scenarios can reset sequence
- Old references in logs, audit trails, external systems still point to ID 12345
- Solution: Never reuse IDs. After GDPR delete, ID is permanently retired.
- Better: Soft delete + data anonymization (overwrite PII with nulls)

---

## B. Query Performance Variants

### B1. Index on Wrong Column Order

**Setup:** Index (created_at, status, customer_id). Query: WHERE customer_id = ? AND status = ? AND created_at > ?.
**Question:** Why is this 100x slower than it should be?
**Answer:** Range column (created_at) is leftmost → B-Tree enters wide branch → can't narrow by status/customer.
**Fix:** Reorder to (customer_id, status, created_at) — equality first, range last.

### B2. Covering Index Opportunity Missed

**Setup:** Dashboard query: `SELECT customer_id, status, COUNT(*) FROM orders GROUP BY customer_id, status`
**Runs in 45 seconds** with full table scan.
**Fix:** `CREATE INDEX idx_covering ON orders (customer_id, status);` → Index Only Scan → 200ms.

### B3. Function Kills Index

**Setup:** `WHERE YEAR(created_at) = 2025` on indexed created_at column → full scan.
**Fix:** `WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01'` → index scan.

### B4. Type Mismatch Kills Index

**Setup:** `WHERE phone_number = 1234567890` but phone_number is VARCHAR → implicit cast → full scan.
**Fix:** `WHERE phone_number = '1234567890'` → index scan.

### B5. OR Condition Index Bypass

**Setup:** `WHERE status = 'pending' OR customer_name LIKE '%john%'` → full scan.
**Why:** OR with different columns can't use a single index efficiently.
**Fix:** UNION of two indexed queries, or GIN trigram index for LIKE '%..%'.

### B6. Large IN List

**Setup:** `WHERE id IN (1, 2, 3, ..., 50000)` → optimizer generates bad plan.
**Fix:** INSERT IDs into temp table, JOIN instead of IN. Or use `= ANY(ARRAY[...])` with limit.

### B7. Subquery vs JOIN Performance

**Setup:** `WHERE customer_id IN (SELECT id FROM customers WHERE country = 'Japan')` → slow.
**Alternative:** `JOIN customers ON ... WHERE customers.country = 'Japan'` → optimizer may produce same plan, but check EXPLAIN.

### B8. DISTINCT on Unindexed Column

**Setup:** `SELECT DISTINCT city FROM users` on 50M rows, no index on city → hash aggregate on full table.
**Fix:** CREATE INDEX on (city) → Index Only Scan with skip scan (PostgreSQL 15+).

### B9. Window Function Killing Performance

**Setup:** `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC)` on 100M rows → full sort.
**Fix:** Index on (customer_id, created_at DESC) → eliminates sort step.

### B10. LIKE '%pattern%' Full Scan

**Setup:** Search by partial name: `WHERE name LIKE '%johnson%'` → always full scan.
**Fix PostgreSQL:** `CREATE EXTENSION pg_trgm; CREATE INDEX idx_name_trgm ON users USING GIN (name gin_trgm_ops);`
**Fix MySQL:** Full-text search index.

### B11. NOT IN with NULLs

**Setup:** `WHERE id NOT IN (SELECT parent_id FROM categories)` returns no rows when parent_id has NULLs!
**Why:** `NOT IN` with NULL in subquery = unknown for ALL rows.
**Fix:** `WHERE id NOT IN (SELECT parent_id FROM categories WHERE parent_id IS NOT NULL)` or `NOT EXISTS`.

### B12. Correlated Subquery O(n²)

**Setup:** `SELECT *, (SELECT MAX(amount) FROM orders o WHERE o.customer_id = c.id) FROM customers c`
**Problem:** Subquery runs once PER customer row = O(n) subqueries.
**Fix:** `LEFT JOIN LATERAL` or just `GROUP BY + JOIN`.

### B13. Materialized View Staleness

**Setup:** Dashboard runs complex aggregation every time → 30 seconds. Used `CREATE MATERIALIZED VIEW` → instant reads but stale data.
**Discuss:** Refresh strategy (CONCURRENTLY vs full), cache vs materialized view, eventual consistency.

### B14. Statistics Not Updated After Bulk Load

**Setup:** Imported 5M rows, queries suddenly slow. EXPLAIN shows wildly wrong row estimates.
**Fix:** `ANALYZE table_name;` Updates statistics. Autovacuum has a delay after bulk inserts.

### B15. Parallel Query Not Kicking In

**Setup:** Query on 50M rows uses only 1 CPU core despite `max_parallel_workers_per_gather = 4`.
**Reasons:** Table too small (optimizer deems parallel overhead not worth it), function marked PARALLEL UNSAFE, or `min_parallel_table_scan_size` too high.

---

## C. N+1 & ORM Variants

### C1. N+1 in GraphQL Resolver

**Setup:** GraphQL query fetches users → each user resolves orders → each order resolves items. DataLoader not configured.
**Fix:** Use DataLoader to batch by parent key: collect all user IDs, fetch all orders in one query, distribute to resolvers.

### C2. N+1 Hidden by @Cacheable

**Setup:** N+1 queries are cached individually. Appears fast on second request but cold cache is catastrophically slow.
**Problem:** 1000 individual cache entries instead of 1 batch cache entry.
**Fix:** Cache at collection level, not individual entity level.

### C3. Eager Fetch Causing Cartesian Explosion

**Setup:** Entity with 3 @OneToMany collections all set to EAGER. Fetching 10 parents loads 10 × 20 × 5 × 3 = 3000 rows.
**Fix:** Use LAZY + JOIN FETCH only where needed. @BatchSize as safety net. DTO projections for list views.

### C4. N+1 in Spring Data's findAll()

**Setup:** `findAll()` returns 1000 entities with lazy collections. Template iterates and accesses collections → 1001 queries.
**Fix:** Use `@EntityGraph` or custom `@Query("SELECT e FROM Entity e JOIN FETCH e.children")`.

### C5. N+1 Across Microservices

**Same as S3 Variant A:** REST API calls in a loop. Fix with batch API endpoint.

### C6. Hibernate Second-Level Cache Masking N+1

**Setup:** N+1 hits second-level cache (fast), but cache cold start or eviction causes cascade of DB queries.
**Discuss:** Second-level cache configuration, cache warming strategies, monitoring cache hit ratio.

### C7. N+1 in Batch Job

**Setup:** Nightly job processes 100K records, each triggering lazy load → 100K individual queries → 4 hours.
**Fix:** Pre-fetch all needed data in chunks of 500, process in-memory. Job now finishes in 10 minutes.

### C8. Projection Eliminating N+1

**Setup:** View layer only needs user name and order count. Loading full entities triggers lazy collections.
**Fix:** `SELECT new UserSummary(u.name, SIZE(u.orders)) FROM User u` → one query, no entities.

### C9. N+1 with Pagination

**Setup:** `findAll(PageRequest.of(0, 20))` correctly limits to 20, but each entity triggers lazy loads → 1 + 20 queries.
**Fix:** Custom query with JOIN FETCH + pageable. Warning: JOIN FETCH with pagination requires `countQuery` parameter.

### C10. Parent-Child-Grandchild N+1+M

**Setup:** 3-level hierarchy: Department → Employees → Tasks. Loading 10 departments: 1 + 10 + 10×50 = 511 queries.
**Fix:** @BatchSize(size=50) on each level → 1 + 1 + 10 = 12 queries (batched fetches).

---

## D. Pagination Variants

### D1. Cursor Pagination with Compound Sort Key

**Setup:** Sort by (popularity DESC, created_at DESC). Page cursor must encode both values.
**Fix:** `WHERE (popularity, created_at) < (?, ?)` with row comparison.

### D2. Bi-directional Cursor Pagination

**Setup:** API needs "next page" AND "previous page" with cursor.
**Fix:** Two cursors: `afterId` and `beforeId`. Reverse ORDER BY for backward pagination.

### D3. Pagination with Real-Time Data

**Setup:** New orders inserted between page requests → user sees duplicates or misses items.
**Fix:** Keyset pagination naturally handles this (cursor is stable). OFFSET would shift.

### D4. Search + Pagination on Full-Text Results

**Setup:** Full-text search returns results ranked by relevance. OFFSET/LIMIT re-searches every page.
**Fix:** Materialize search results into temp table with rank, then paginate the temp table.

### D5. Infinite Scroll with Deletion

**Setup:** User scrolls, items get deleted. Cursor points to deleted row → next page starts wrong.
**Fix:** Use `WHERE id > ?` → if ID deleted, next query still works (skips to next existing ID).

### D6. API Pagination: Page Token vs Page Number

**Design question:** External API — opaque cursor token vs page=3 style.
**Discuss:** Token hides implementation, prevents client abuse of deep pages, enables backend migration.

### D7. Count(\*) for Page Numbers

**Setup:** UI shows "Page 3 of 1,472" but COUNT(\*) takes 8 seconds on 500M rows.
**Fix:** Approximate count, cached count, or remove total page count from UI.

### D8. Pagination Across Shards

**Setup:** Data sharded across 4 databases. Need globally sorted paginated results.
**Fix:** Query each shard for top N, merge-sort in application, return top N from merged result.

---

## E. Connection & Pool Variants

### E1. Pool Size Too Large

**Setup:** 20 application instances × 50 connections each = 1000 connections to one PostgreSQL instance.
**PostgreSQL can handle ~500 connections efficiently.
**Fix:\*\* Use PgBouncer (connection pooler) between app and DB. 1000 app connections → 100 DB connections.

### E2. Connection Pool + Lambda/Serverless

**Setup:** 100 Lambda functions each open a connection pool → 100+ connections for brief functions.
**Fix:** RDS Proxy / PgBouncer as intermediary. Lambda connects to proxy, proxy maintains small pool to DB.

### E3. Read Replica Connection Routing

**Setup:** Writes go to primary, reads should go to replica. How to route?
**Fix:** Two connection pools in Spring Boot. `@Transactional(readOnly = true)` routes to replica.

### E4. Connection Pool Exhaustion During Deploy

**Setup:** Rolling deploy: old pods draining connections while new pods opening connections. Brief period of 2x connection usage.
**Fix:** `min-idle` < `max-pool-size`. Old pods release idle connections first. New pods start with minimum.

### E5. Slow Query Hogging Connections

**Setup:** One bad query takes 30 seconds, holding a connection. Under load, all connections occupied by slow queries.
**Fix:** `statement_timeout = '5s'` at database level. Application-level timeout on queries. Connection pool `max-lifetime`.

### E6. Connection Test on Borrow

**Setup:** Database restarted, pooled connections are now dead. App gets "connection refused" errors.
**Fix:** `connection-test-query: SELECT 1` or `validation-timeout: 5000` in HikariCP config.

### E7. Too Many Pools (Multi-Tenant)

**Setup:** Multi-tenant app creates one connection pool per tenant × 500 tenants = 500 pools × 10 connections = 5000 connections.
**Fix:** Shared pool with tenant context. SET search_path per request. Or PgBouncer with server-side tenant switching.

### E8. Transaction Leak in @Async Method

**Setup:** `@Async @Transactional` method — new thread doesn't inherit transaction context → transaction management undefined.
**Fix:** Remove @Transactional from @Async method, manage transactions explicitly within the async method.

### E9. Connection Pool Starvation After Network Blip

**Setup:** Network hiccup causes 10 connections to go "zombie" (TCP half-open). Pool thinks they're active.
**Fix:** `keepalive-time: 30000` in HikariCP. TCP keepalive detects dead connections.

### E10. Pool Sizing Math (Little's Law)

**Setup:** 200 req/s, average query time 5ms.
**Answer:** L = λ × W = 200 × 0.005 = 1 connection needed on average.
Pool size 10 handles 10x burst. Pool size 50 is wasteful (unused connections consume DB memory).

---

🔬 **Section Challenge — E. Connection & Pool Variants**

**Challenge 1 (Reasoning):** Using Little's Law, why can a pool of 10 connections handle 200 requests/sec when average DB time is 5ms, but fail badly when DB time becomes 500ms?

<details><summary>Answer</summary>

Little's Law says required concurrency is roughly `L = lambda * W`. At 200 req/s and 5ms DB time, `L = 200 * 0.005 = 1` connection on average; a pool of 10 has burst headroom. At 500ms, `L = 200 * 0.5 = 100` connections. A pool of 10 queues requests, timeouts rise, and latency compounds. The constraint that changed is service time, not request rate.

</details>

**Challenge 2 (Design):** A network blip leaves connections half-open and the pool thinks they are still active. What database/pool guardrails reduce the blast radius?

<details><summary>Answer</summary>

Enable connection keepalive/validation so dead sockets are detected before checkout, set reasonable connection and query timeouts, use max lifetime so old connections are recycled, and monitor active vs idle pool counts. On the database side, set idle transaction timeouts and inspect server-side wait events. The goal is fast failure and replacement of bad connections instead of silently pinning pool capacity.

</details>

## F. Concurrency & Lock Variants

### F1. Deadlock in Batch Update

**Setup:** Batch job updates 10K rows individually. Concurrent batch on overlapping rows → deadlock.
**Fix:** Both batches sort by ID before updating. Same order = no circular wait.

### F2. Optimistic Lock Retry Infinite Loop

**Setup:** High-contention counter updated by 100 threads. OptimisticLockException cascades into infinite retry.
**Fix:** Max retry limit (3 attempts). If still failing, switch to atomic SQL: `UPDATE SET count = count + 1`.

### F3. @Version Not Working with Native Query

**Setup:** `@Modifying @Query(nativeQuery = true)` bypasses JPA version check.
**Fix:** Add `AND version = :version` manually to native UPDATE, increment version in the query.

### F4. Advisory Lock for Distributed Cron

**Setup:** 5 app instances all run `@Scheduled` at the same time. Only one should execute.
**Fix:** `SELECT pg_try_advisory_lock(12345)` → returns true for ONE instance only. Others skip gracefully.

### F5. SELECT FOR UPDATE Skip Locked (Job Queue)

**Setup:** 10 workers competing for jobs. FOR UPDATE without SKIP LOCKED → serialized → one worker at a time.
**Fix:** `FOR UPDATE SKIP LOCKED` → each worker grabs different row → parallel processing.

### F6. Deadlock From FK Check

**Setup:** INSERT into child table triggers shared lock on parent row (FK check). Two inserts referencing different children but same parent → deadlock under load.
**Discuss:** FK lock behavior varies by database. MySQL InnoDB takes shared lock on referenced row.

### F7. Isolation Level Wrong for Report

**Setup:** Report uses READ COMMITTED. SUM of debits ≠ SUM of credits due to concurrent inserts.
**Fix:** REPEATABLE READ or generate report from a read replica with a consistent snapshot.

### F8. Two-Phase Commit Timeout

**Setup:** 2PC across two databases. Coordinator crashes after PREPARE but before COMMIT → both DBs stuck with prepared transactions.
**Discuss:** 2PC blocking problem. Recovery: reconnect coordinator, check prepared transactions, resolve.

### F9. Counter Table Hot Spot

**Setup:** `UPDATE counters SET value = value + 1 WHERE name = 'page_views'` → single row bottleneck.
**Fix:** Sharded counters: 10 rows for 'page_views', randomly increment one. SUM to read total.

### F10. Phantom Delete + Foreign Key

**Setup:** Check "parent exists" → INSERT child. Between check and insert, parent is deleted → FK violation.
**Fix:** The FK constraint handles this! Database checks between insert and commit. No need for manual check.

### F11. Isolation Anomaly: Write Skew

**Setup:** Constraint: at least one doctor must be on-call. Doctor A and Doctor B both read "2 on-call", both remove themselves. Result: 0 on-call. Neither transaction saw a violation.
**Fix:** SERIALIZABLE isolation. Or materialze the constraint with a counter table + CHECK.

### F12. Deadlock Between DDL and DML

**Setup:** ALTER TABLE waiting for long SELECT. Another INSERT waiting for ALTER's queue position. SELECT waiting for INSERT's row lock.
**Fix:** Always `SET lock_timeout = '3s'` before DDL. Kill long-running queries before maintenance.

### F13. CAS (Compare-And-Swap) Pattern

**Setup:** `UPDATE accounts SET balance = 500 WHERE id = 1 AND balance = 1000`
**If returns 0 rows:** someone changed balance between your read and write. Retry with fresh read.
**This is optimistic locking without @Version — pure SQL.**

### F14. MySQL's Default REPEATABLE READ Surprises

**Setup:** Developer from PostgreSQL background confused: MySQL REPEATABLE READ still allows phantom reads with locking reads (`SELECT ... FOR UPDATE` sees new committed rows).
**Discuss:** MVCC snapshot vs locking read behavior differences between PostgreSQL and MySQL.

### F15. Long Transaction Preventing VACUUM

**Setup:** Old transaction (started 3 hours ago, forgot to commit) → VACUUM can't clean rows visible to that transaction → table bloat grows.
**Fix:** `idle_in_transaction_session_timeout = '10 min'` in PostgreSQL config. Monitor `pg_stat_activity` for old transactions.

---

## G. Schema & Migration Variants

### G1. Adding NOT NULL Column to 500M Row Table

**Fix:** Add nullable → backfill in batches → add NOT NULL constraint.

### G2. Renaming Table Without Downtime

**Fix:** Expand-contract. Create new table name as VIEW pointing to old table. Migrate in phases.

### G3. Splitting One Table Into Two

**Setup:** `users` table has profile fields AND authentication fields. Want to split for microservice ownership.
**Fix:** Create `user_profiles` and `user_auth` tables. Dual-write period. Migrate reads. Drop columns from original.

### G4. Adding Full-Text Search to Existing Table

**Fix:** Add `tsvector` column. Create GIN index. Background job populates for existing rows. Trigger keeps it updated.

### G5. Changing Column Type (INT → VARCHAR)

**Setup:** Phone number stored as INT (no leading zeros, no country code). Need VARCHAR.
**Fix:** Add new VARCHAR column, copy with transformation, verify, swap, drop old.

### G6. Dropping a Column Safely

**Setup:** Want to drop `legacy_field` but unsure if any code still reads it.
**Fix:** First: log access to column (application audit). Wait 2 weeks. If no access → safe to drop.

### G7. Foreign Key to Partitioned Table

**Setup:** PostgreSQL didn't support FKs referencing partitioned tables before PG 12.
**Discuss:** Database version constraints on schema design. Test DDL in staging with prod-like data.

### G8. Index-Only Migration (No Table Change)

**Setup:** Need new index on 100M row table. Normal CREATE INDEX locks writes.
**Fix:** `CREATE INDEX CONCURRENTLY` — takes longer, but no write lock.

### G9. Flyway Out-of-Order Migration Conflict

**Setup:** Developer A creates V23. Developer B creates V23 on different branch. Both merge → collision.
**Fix:** Use timestamps instead of sequential numbers: V20250724_123456\_\_description.sql.

### G10. Rollback After Failed Migration

**Setup:** Migration partially applied (added column, but subsequent step failed). Table in inconsistent state.
**Fix:** Migrations should be atomic (single transaction). If split: each step should be independently reversible.

### G11. Data Migration: Backfilling Computed Column

**Setup:** New `full_name` column = `first_name || ' ' || last_name`. 50M rows to backfill.
**Fix:** Batch update 10K at a time. Consider generated column instead: always computed, no backfill.

### G12. Charset Migration (latin1 → utf8mb4, MySQL)

**Setup:** Old table in latin1. Emoji and CJK characters getting corrupted.
**Fix:** ALTER TABLE CONVERT TO CHARACTER SET utf8mb4 → full table rewrite → schedule during low traffic.

---

## H. Architecture & Design Variants

### H1. Read Replica Lag Causing Stale Reads

**Setup:** User creates order (writes to primary), gets redirected to order confirmation page (reads from replica). Replica is 2 seconds behind → "Order not found" error.
**Fix:** "Read your own writes" — use primary for reads within X seconds after a write, or pass write timestamp as cookie.

### H2. Shared Database Between Microservices

**Discussion variant:** 3 teams share one database. Team A's schema migration breaks Team B's queries.
**Lesson:** Database per service. If shared needed: define clear API contracts (database views as API).

### H3. Event Sourcing vs State Storage

**Setup:** Shopping cart stored as mutable state. Need audit trail of all changes.
**Compare:** Event sourcing (store events, compute state) vs state + audit table (store both).

### H4. CQRS: Separate Read and Write Models

**Setup:** Write model is normalized (3NF). Read queries need 5 JOINs. Dashboard is slow.
**Fix:** Denormalized read model materialized from events. Writes go to normalized tables.

### H5. Circuit Breaker Tuning

**Setup:** Circuit opens too easily (5 errors out of 10 = 50% → OPEN). But 3 of those 5 were timeout errors from network blip.
**Fix:** Separate error types. Only count 5xx errors, not timeouts. Or: sliding window of 100, threshold 30%.

### H6. Retry-safe (Idempotent) API Design

**Setup:** Payment API called twice due to network timeout retry → customer charged twice.
**Fix:** Idempotency key: client sends unique key per request. Server stores key → second call returns cached result.

### H7. Database as Queue Anti-Pattern

**Setup:** Using a database table as a job queue. Works at low volume. At 1000 jobs/sec → lock contention.
**Fix:** Use SKIP LOCKED (works up to ~5000 jobs/sec). Beyond that → dedicated message broker (RabbitMQ/Kafka).

### H8. Soft Delete Across Microservices

**Setup:** User Service soft-deletes user. Order Service still references user. Reports show deleted-user orders.
**Fix:** Event-driven: UserDeletedEvent → Order Service marks orders as "user-deleted". Consistent view across services.

### H9. Cache Invalidation Hell

**Setup:** Cache TTL 5 minutes. User updates profile. Sees old profile for up to 5 minutes.
**Fix:** Event-driven cache invalidation: on write → publish event → cache listener evicts key immediately.

### H10. Time-Series Data Growing Unbounded

**Setup:** IoT sensor data: 1M rows/hour. Table hits 1B rows in 6 weeks. All queries slow.
**Fix:** Partition by time (daily/weekly). Drop old partitions (instant DELETE of billions of rows). Use TimescaleDB.

### H11. Blue-Green Deployment with Database

**Setup:** Blue-green deploy: two app versions. Both must work with same database during transition.
**Constraint:** Migration must be backward-compatible. No column drops, no renames, no type changes.

### H12. Feature Flag with Database Fallback

**Setup:** New query logic behind feature flag. If flag off → old query. If flag on → new query.
**Fix:** Deploy new code with flag off. Enable for 1% → monitor → 10% → 100%. Rollback = flag off (instant).

---

## I. Monitoring & Debug Variants

### I1. Mystery Slow Query That's Fast When Run Manually

**Cause:** Parameterized query → optimizer uses generic plan that's bad for specific parameter.
**Debug:** Check `pg_stat_statements` for the specific query. Run `EXPLAIN (ANALYZE)` with actual parameters.

### I2. Periodic 2-Second Latency Spike Every 5 Minutes

**Cause:** Checkpoint flush. All dirty pages written to disk simultaneously.
**Fix:** `checkpoint_completion_target = 0.9` (spread I/O), `max_wal_size` increase.

### I3. Disk Full Because of WAL

**Cause:** Replication slot with disconnected replica → WAL retained forever.
**Fix:** Drop abandoned replication slot. Add monitoring for WAL size growth.

### I4. OOM Killer Takes Out PostgreSQL

**Cause:** PostgreSQL + Application competing for memory. OOM killer chooses PostgreSQL (largest process).
**Fix:** Set `vm.overcommit_memory = 2` on Linux. Reduce `shared_buffers` if total RAM is tight.

### I5. Index Bloat After Mass Update

**Setup:** Batch job updated 10M rows. Each update creates new index entry + dead entry. Index doubled.
**Fix:** `REINDEX INDEX CONCURRENTLY idx_name;` (PostgreSQL 12+). Or schedule periodic reindex.

### I6. Connection Timeouts Only During Business Hours

**Cause:** Connection pool sized for average load (10 req/s). Peak load: 100 req/s. Pool exhausted 9 AM - 5 PM.
**Fix:** Size pool for peak: Little's Law. Add connection pool metrics to monitoring dashboard.

### I7. Sudden Query Plan Change (Plan Regression)

**Cause:** ANALYZE ran, statistics updated, optimizer chose different (worse) plan.
**Fix:** `pg_hint_plan` extension to force specific plan. Or update statistics with larger sample size.

### I8. Replica Falling Behind During Batch Job

**Cause:** Batch job generates massive WAL → replica can't apply fast enough → lag grows.
**Fix:** Throttle batch job with `pg_sleep()` between batches. Or dedicated replica not used for reads during batch.

---

## 🎯 How to Practice These Variants

```
FOR EACH VARIANT:

1. READ the setup (30 seconds)
2. PAUSE — formulate your answer mentally (1 minute)
3. SPEAK your answer out loud using SIREN format (2 minutes):
   - Situation: Restate the problem in professional terms
   - Investigation: What would you check first?
   - Root Cause: What's actually happening?
   - Execution: Your solution (with trade-offs)
   - Next Steps: How do you prevent recurrence?
4. CHECK the expected discussion points
5. IDENTIFY any gaps in your understanding → study that theory (Chapter 47)

DAILY PRACTICE:
- Morning: 3 random variants (different categories)
- Evening: Review the ones you struggled with
- Weekly: Practice with a friend (they ask, you explain)

INTERVIEW SIMULATION:
- Set timer: 5 minutes per variant
- Record yourself explaining
- Review: Do you sound confident? Did you mention trade-offs?
- Score yourself against the Interview Self-Check (Chapter 43, Part 10)
```

---

[⬅ Previous: 47_Theory_Deep_Dive](47_Theory_Deep_Dive_Database_Internals.md) | [📚 Index](00_INDEX.md) | [Next: Coming Soon ➡](00_INDEX.md)

### Historical Evolution

**Predecessors (with years):**
- **ISO/IEC (1986, 1989, 1992, 1999, 2003, 2008, 2011, 2016, 2023)**: SQL standards evolution from SQL-86 (first standard) through SQL:2023 — each iteration added features (CTEs in SQL:1999, window functions in SQL:2003, recursive CTEs in SQL:1999) that changed what was considered "SQL knowledge"
- **ACM (1960s)**: Problem-variant pedagogy formalized in computer science education — presenting a core problem with deliberate parameter/variant modifications to test deep understanding vs. rote memorization
- **ICPC (1970)**: International Collegiate Programming Contest launched — established the competitive programming format of timed problem-solving with edge cases and variants that later influenced technical interview design
- **Chandler Hulburd / LeetCode (2015)**: LeetCode founded — democratized problem-variant practice by providing an online platform with 3000+ problems, company-specific filters, and difficulty ratings used by millions preparing for technical interviews

**Evolution narrative:**
SQL interview preparation evolved through three eras. The certification era (1990s-2000s) tested SQL knowledge via multiple-choice exams on joins and subqueries. The stored-procedure era (2005-2012) tested SQL as part of full-stack development with emphasis on stored procedures and database design. The production-scenario era (2013+) shifted to real-world scenarios: here is the production incident, walk me through diagnosis and fix. This mirrors the shift from "know SQL syntax" to "operate SQL in production." Problem-variant banks like LeetCode's SQL section and this chapter's 100+ variants emerged because interviewers discovered that candidates who memorized solutions to 50 standard queries would freeze on a new twist — while candidates trained on variants could reason through novel scenarios.

**Modern practice anchor:**
Today's SQL interview preparation combines LeetCode-style pattern drilling (variant banks, timed practice, peer explanation) with production-scenario SIREN framework communication (Chapter 43). The best preparation is deliberately breaking working solutions: take a known pattern and ask "what if the table has 5 billion rows?" or "what if the FK is missing an index?" — building the muscle of reasoning from first principles rather than pattern matching.

### Production Reality

**Failure modes:**
1. **ID exhaustion at 95% capacity**: Auto-increment BIGINT approaching max value (9.2 quintillion) — alert fired at 95%, no capacity planning done, migration scheduled as emergency over weekend
2. **Snowflake ID collisions on Saturday night**: Clock regression on virtual machine causes 500ms of duplicate Snowflake IDs — 847 orders merged into single record, reconciliation required
3. **Connection pool 100% utilization**: HikariCP pool of 100 connections fully consumed — 101st request queued, latency spikes from 20ms to 4500ms, health checks start failing, cascade timeout begins

**Debug workflow:**
1. Check auto-increment usage: `SELECT MAX(id), MAX(id)::float / 9223372036854775807 AS percent_exhausted FROM table_name` — alert at 80%
2. Monitor Snowflake worker IDs: log `worker_id` and `timestamp` for collision detection, alert if duplicate timestamp + worker_id + sequence observed
3. Query `pg_stat_activity` for connection states: `SELECT state, COUNT(*) FROM pg_stat_activity GROUP BY state` — connections in 'active' state indicate slow queries

**Modern practice anchor:**
Problem variants must include production failure scenarios — interview-ready engineers explain not just the solution but what breaks when the solution fails.
