# Chapter 44 — Interview-Grade Scenario Explanations Part 1: Data & Performance

**What:** 30+ scenarios explained EXACTLY as a senior engineer would in an interview — with theory, variants, and professional language
**Format:** Each scenario = Interview Question → Professional Answer → Theory → Variants → Follow-up Questions You Should Expect

---

## 📋 Scenarios in This File

| # | Scenario | Interview Trigger |
|---|----------|-------------------|
| S1 | INT Primary Key Exhaustion | "Tell me about a scaling challenge you handled" |
| S2 | Full Table Scan on Large Table | "Describe a performance issue you diagnosed" |
| S3 | N+1 Query Problem | "What's the worst performance bug you've seen?" |
| S4 | Slow Pagination (OFFSET) | "How would you implement pagination for large datasets?" |
| S5 | Missing Index / Wrong Index | "Walk me through how you'd optimize a slow query" |
| S6 | Connection Pool Exhaustion | "Tell me about a production outage you resolved" |
| S7 | Hot Partition / Uneven Shard | "How does your system handle data distribution?" |
| S8 | Cache Stampede / Thundering Herd | "How do you handle cache failures at scale?" |
| S9 | Slow COUNT(*) on Billion Rows | "How would you get a count of records efficiently?" |
| S10 | SELECT * in Production | "What common anti-patterns have you fixed?" |

---




## S1: Primary Key ID Exhaustion

### 🎤 Interview Question
"Tell me about a scaling challenge you dealt with in production."

### ✅ Professional Answer (SIREN Format)

**SITUATION:**
"I was working on a high-throughput transaction processing system that had been running for 6+ years. Each transaction generated a row in our main `transactions` table with an auto-incrementing INT primary key. We were processing approximately 200,000 new records per day."

**INVESTIGATION:**
"During a routine capacity review, I noticed our max ID had crossed 1.8 billion — that's 84% of the INT max of 2,147,483,647. At our insertion rate, we had roughly 6 months before hitting the wall. I ran a simple projection query:"

```sql
-- The diagnostic query I ran
SELECT 
    MAX(id) AS current_max,
    2147483647 - MAX(id) AS remaining_ids,
    (2147483647 - MAX(id)) / 
        (SELECT COUNT(*) FROM transactions 
         WHERE created_at > CURRENT_DATE - INTERVAL '30 days') * 30 
        AS estimated_days_remaining
FROM transactions;
```

**ROOT CAUSE:**
"The table was created years ago with INT (4 bytes, max ~2.1B) when nobody anticipated this growth. This is a fundamental design decision that's invisible until you're close to the limit."

**EXECUTION:**
"I evaluated three approaches:

1. **ALTER to BIGINT directly** — In PostgreSQL, `ALTER TABLE transactions ALTER COLUMN id TYPE BIGINT` requires a full table rewrite. With 1.8B rows, this would lock the table for hours. Not acceptable for a 24/7 system.

2. **Shadow table approach (what we chose):**"

```sql
-- Step 1: Create new table with BIGINT
CREATE TABLE transactions_v2 (
    id BIGSERIAL PRIMARY KEY,  -- BIGINT auto-increment
    -- all other columns identical
    customer_id BIGINT NOT NULL,
    amount DECIMAL(12,2),
    status VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Set sequence to continue from current max
SELECT setval('transactions_v2_id_seq', (SELECT MAX(id) FROM transactions));

-- Step 3: Application dual-writes to old AND new table (behind feature flag)
-- Step 4: Background job copies historical data in batches
-- Step 5: Verify counts match
-- Step 6: Atomic swap: RENAME transactions TO transactions_old; 
--         RENAME transactions_v2 TO transactions;
-- Step 7: Drop old table after verification period
```

"3. **UUID migration** — More future-proof with 128-bit space, but UUIDs are 2x larger than BIGINT and random UUIDs (v4) cause B-Tree fragmentation. We'd only choose this if we needed distributed ID generation without coordination."

**NEXT STEPS:**
"I added a monitoring alert that fires when any auto-increment column reaches 50% of its type's max value. I also documented a runbook for the migration pattern so the team can apply it to other tables proactively."

### 📚 Theory Deep-Dive

```
WHY INT runs out:
- INT = 4 bytes = 32 bits = 2^31 - 1 = 2,147,483,647 max (signed)
- At 100K inserts/day: lasts 58 years
- At 1M inserts/day:   lasts 5.8 years ← danger zone
- At 10M inserts/day:  lasts 214 days  

WHY BIGINT is enough:
- BIGINT = 8 bytes = 64 bits = 2^63 - 1 = 9,223,372,036,854,775,807
- At 1M inserts/day: lasts 25,269,512,428 years (25 billion years)
- The sun will burn out first

WHY UUID v4 fragments B-Trees:
- B-Tree leaf pages store rows in sorted order
- Sequential IDs: always insert at the rightmost page → append-only
- Random UUIDs: insert into random pages → page splits → I/O amplification
- Measured impact: 30-60% more disk I/O for random inserts on large tables

WHY UUID v7 fixes this:
- UUID v7 = timestamp (48 bits) + randomness (80 bits)
- First 48 bits are time-ordered → inserts are essentially sequential
- Gets distributed generation + B-Tree friendliness
```

### 🔄 Variants You Should Know

**Variant A: VARCHAR(9) ID running out**
```sql
-- Business uses formatted IDs like "ORD000001" to "ORD999999"
-- Max: 999,999 IDs for 6-digit numeric part
-- Solution: Extend format OR switch to alphanumeric (base-36)
-- "ORD000001" → "ORDZZZZZ1" = 36^6 = 2.1 billion combinations
-- OR increase digits: "ORD0000001" (7 digits = 10M)
```

**Variant B: Snowflake ID for distributed systems**
```
Structure: [timestamp 41 bits][machine_id 10 bits][sequence 12 bits]
- 41-bit timestamp: ~69 years
- 10-bit machine: 1024 workers
- 12-bit sequence: 4096 IDs per millisecond per machine
- Total: ~4M IDs/second across all machines
- Time-ordered for B-Tree efficiency
```

**Variant C: After a database merge/acquisition**
```sql
-- Company A has user IDs 1-500,000
-- Company B has user IDs 1-300,000
-- COLLISION! Both have user ID 1234

-- Solution 1: Offset one database
UPDATE company_b.users SET id = id + 1000000;

-- Solution 2: Surrogate key + source tag  
ALTER TABLE merged_users ADD COLUMN source VARCHAR(10);
-- (id=1234, source='A') and (id=1234, source='B') coexist
```

### ❓ Follow-Up Questions to Expect

```
Q: "Why not just use UUID from the start?"
A: "UUIDs are excellent for distributed systems, but they have trade-offs:
    16 bytes vs 8 bytes for BIGINT (doubles index size), UUID v4 is random 
    which causes B-Tree fragmentation. For a single-database system, BIGINT 
    auto-increment is simpler and more performant. If I were designing a 
    new distributed system today, I'd use UUID v7."

Q: "How did you handle the migration without downtime?"
A: "The key insight is that RENAME TABLE is an atomic metadata operation — 
    it takes microseconds regardless of table size. The expensive part 
    (copying data) happens in the background while the old table serves 
    traffic. The dual-write period ensures no data loss during the transition."

Q: "What happens to foreign keys during migration?"
A: "Great question — any table with a FK to our transactions table also 
    needs to be migrated. I mapped all FK dependencies first and included 
    them in the migration plan. In PostgreSQL, I also temporarily dropped 
    FK constraints during the backfill and re-added them after."
```

---

## S2: Full Table Scan on Large Table

### 🎤 Interview Question
"Walk me through how you'd diagnose and fix a slow database query."

### ✅ Professional Answer

"When I encounter a slow query, I follow a systematic approach:

**Step 1: Get the execution plan**"

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders 
WHERE customer_id = 12345 
  AND status = 'pending' 
  AND created_at > '2025-01-01';

-- BEFORE fix (bad plan):
-- Seq Scan on orders  (cost=0.00..2847563.00 rows=847 width=186)
--   Filter: ((customer_id = 12345) AND (status = 'pending') AND ...)
--   Rows Removed by Filter: 49999153
--   Buffers: shared hit=1284632 read=563421
--   Planning Time: 0.5 ms
--   Execution Time: 28456.322 ms   ← 28 seconds!
```

"The execution plan tells me everything:
- **Seq Scan** = full table scan, reading every row
- **Rows Removed by Filter: 49,999,153** = we read 50M rows to find 847 matches
- **Buffers: read=563,421** = 563K disk page reads. At 8KB per page, that's ~4.4GB of I/O

**Step 2: Create the right index**

The key insight is composite index column ordering. The rule is **Equality → Range → Sort**:"

```sql
-- customer_id = exact match (EQUALITY)
-- status = exact match (EQUALITY)  
-- created_at > date (RANGE)
-- So the optimal index is:
CREATE INDEX idx_orders_cust_status_date 
ON orders (customer_id, status, created_at);
-- ↑ Equality columns first, range column last

-- AFTER fix (good plan):
-- Index Scan using idx_orders_cust_status_date on orders
--   Index Cond: ((customer_id = 12345) AND (status = 'pending') AND (created_at > ...))
--   Buffers: shared hit=12
--   Execution Time: 0.847 ms    ← 0.8ms! (33,600x faster)
```

"**Why this order matters:** The database traverses the B-Tree from left to right. Equality conditions narrow the search space completely — the database jumps directly to the right branch. If we put the range condition first, every branch after that point must be scanned."

### 📚 Theory Deep-Dive

```
B-Tree Composite Index Internals:

Index on (customer_id, status, created_at):
                    [Root]
                   /      \
         [cust<5000]     [cust≥5000]
              |               |
    [12345,'active']   [12345,'pending']      ← Equality: direct jump
              |               |
    [2024-06-15]→      [2025-01-01]→          ← Range: scan from here
    [2024-07-20]→      [2025-01-15]→
    [2024-08-30]→      [2025-02-28]→

Index on (created_at, customer_id, status):  ← WRONG ORDER
                    [Root]
                   /      \
      [date<2025-01-01] [date≥2025-01-01]     ← Range: enters wide branch
              |               |
    [all customers]    [all customers]         ← Must scan ALL of these
    [all statuses]     [all statuses]          ← Can't narrow further!
```

```
The Performance Math:
- Full scan: 50M rows × 186 bytes = 9.3GB data 
  → ~1.2M page reads → ~5-30 seconds
- Index scan: 4 B-Tree levels + 847 row lookups 
  → ~860 page reads → <1ms
- That's a 1,400x reduction in I/O
```

### 🔄 Variants

**Variant A: Index exists but not used**
```sql
-- Query uses function on indexed column:
WHERE LOWER(email) = 'john@example.com'
-- Index on email is USELESS because LOWER(email) != email
-- Fix: Expression index
CREATE INDEX idx_email_lower ON users (LOWER(email));

-- Query has implicit type conversion:
WHERE phone = 12345  -- phone is VARCHAR, comparing to INT
-- Database converts EVERY row's phone to INT → full scan
-- Fix: Match types: WHERE phone = '12345'
```

**Variant B: Index scan vs bitmap scan vs seq scan**
```sql
-- The optimizer makes intelligent choices:
-- < 5% of table: Index Scan (random I/O, few pages)
-- 5-20% of table: Bitmap Index Scan (batch random I/O)
-- > 20% of table: Seq Scan (sequential is faster than lots of random)
-- This is WHY adding an index doesn't always help queries that 
-- return large portions of the table!
```

**Variant C: Covering index (index-only scan)**
```sql
-- Query: SELECT customer_id, status, COUNT(*) FROM orders GROUP BY 1, 2
-- If index is (customer_id, status), database reads ONLY the index
-- No table access needed = Index Only Scan = even faster
CREATE INDEX idx_covering ON orders (customer_id, status);
-- The answer is in the index itself — no "heap fetch" needed
```

---

## S3: N+1 Query Problem

### 🎤 Interview Question
"What's the most common performance problem in ORM-based applications?"

### ✅ Professional Answer

"The N+1 query problem is arguably the most prevalent performance issue in any application using an ORM like Hibernate/JPA. It's subtle because the code looks perfectly correct — it's only visible when you monitor the actual SQL being generated.

**Here's what happens:**"

```java
// This innocent-looking code:
List<Customer> customers = customerRepo.findAll();  // 1 query
for (Customer c : customers) {
    System.out.println(c.getName() + ": " + c.getOrders().size());
    // ↑ Each .getOrders() fires a NEW query → N more queries
}

// SQL that actually runs:
// 1. SELECT * FROM customers                          ← 1 query
// 2. SELECT * FROM orders WHERE customer_id = 1       ← +1
// 3. SELECT * FROM orders WHERE customer_id = 2       ← +1
// 4. SELECT * FROM orders WHERE customer_id = 3       ← +1
// ... 
// 1001. SELECT * FROM orders WHERE customer_id = 1000 ← +1
// Total: 1 + 1000 = 1001 queries for what should be 1 query!
```

**The root cause is the ORM's lazy loading strategy.** `@OneToMany` defaults to `FetchType.LAZY`, which is actually the *correct* default — you don't want to load every relationship eagerly all the time. The problem is that developers access the lazy collection in a loop without realizing each access is a separate database round-trip.

**The fix depends on the context:**"

```java
// FIX 1: JOIN FETCH — load everything in one query
@Query("SELECT c FROM Customer c JOIN FETCH c.orders")
List<Customer> findAllWithOrders();
// SQL: SELECT c.*, o.* FROM customers c JOIN orders o ON o.customer_id = c.id
// ONE query, all data loaded

// FIX 2: @EntityGraph — declarative eager loading
@EntityGraph(attributePaths = {"orders"})
List<Customer> findAll();  // Spring Data adds the JOIN automatically

// FIX 3: @BatchSize — batched lazy loading (safety net)
@Entity
public class Customer {
    @OneToMany(mappedBy = "customer")
    @BatchSize(size = 100)  // Load 100 customers' orders at a time
    private List<Order> orders;
}
// Instead of 1000 queries: SELECT * FROM orders WHERE customer_id IN (1,2,...,100)
// Only 10 batch queries instead of 1000

// FIX 4: DTO projection — don't load entities at all
@Query("SELECT new com.app.dto.CustomerSummary(c.id, c.name, SIZE(c.orders)) " +
       "FROM Customer c")
List<CustomerSummary> findAllSummaries();
// ONE query, no entities, no lazy loading, no N+1
```

### 📚 Theory Deep-Dive

```
WHY is N+1 so bad?

Time complexity:
- N+1 approach: O(n) queries × O(1) per query = O(n) round-trips
- Each round-trip: ~0.5ms network + ~0.1ms query = ~0.6ms
- 1000 customers: 1000 × 0.6ms = 600ms JUST in round-trips
  (not counting any query execution time)

- JOIN FETCH approach: O(1) query
- Single round-trip: 0.5ms + query execution
- Even with a large result set, it's ONE trip: ~10ms total

Network latency is the killer, not query execution time.
Even if each query takes 0.1ms, 1000 sequential round-trips = 500ms+ of network overhead.

This is equivalent to the difference between:
- O(n) sequential API calls (microservice hell)
- O(1) bulk API call
```

### 🔄 Variants

**Variant A: N+1 in REST API (not just ORM)**
```java
// Same anti-pattern in microservices:
List<Order> orders = orderService.getOrders();       // 1 call
for (Order o : orders) {
    Customer c = customerService.getCustomer(o.getCustomerId());  // N calls!
}

// Fix: Batch API
List<Customer> customers = customerService.getCustomersByIds(
    orders.stream().map(Order::getCustomerId).distinct().toList()
);
// 1 + 1 = 2 calls total
```

**Variant B: N+1 with nested relationships (N+1+M)**
```java
// Customer → Orders → OrderItems
// 1 query for customers
// N queries for orders
// N*M queries for items
// Total: 1 + N + N*M queries!

// Fix: Multi-level JOIN FETCH
@Query("SELECT c FROM Customer c " +
       "JOIN FETCH c.orders o " + 
       "JOIN FETCH o.items")
List<Customer> findAllWithOrdersAndItems();
// WARNING: This creates a Cartesian product — use with care on large datasets
// Better to use @BatchSize for deep relationships
```

**Variant C: Detecting N+1 automatically**
```java
// Add query counting in tests:
@Test
void shouldNotHaveNPlusOne() {
    long queryCount = getQueryCount();
    customerService.getCustomersWithOrders();
    assertThat(getQueryCount() - queryCount).isLessThan(5);
}

// Or use a library like datasource-proxy:
// Logs WARNING when more than X queries per request
```

---

## S4: Slow Pagination (OFFSET Hell)

### 🎤 Interview Question
"How would you implement pagination for a table with 100 million rows?"

### ✅ Professional Answer

"The naive approach — OFFSET/LIMIT — works fine for page 1 or page 10, but degrades catastrophically on deep pages. Let me explain why and the alternative.

**The problem with OFFSET:**"

```sql
-- Page 1: fine
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 0;
-- Database reads 20 rows. Fast.

-- Page 1000: slow
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 19980;
-- Database reads 20,000 rows, discards 19,980, returns 20. Slow.

-- Page 50000: catastrophically slow
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 999980;
-- Database reads 1,000,000 rows, discards 999,980, returns 20. 
-- Execution time: 8+ seconds on 100M rows!
```

"**Why this happens:** Database engines can't 'jump' to offset N. They must scan from the beginning, count N rows, discard them, then return the next batch. It's O(offset) work for every page request.

**The solution is keyset (cursor-based) pagination:**"

```sql
-- Instead of: SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 999980
-- Use:        SELECT * FROM orders WHERE id > 999980 ORDER BY id LIMIT 20

-- The WHERE id > 999980 uses the B-Tree index to JUMP directly to that row
-- O(log n) seek instead of O(offset) scan
-- SAME execution time for page 1 and page 50,000!
```

```java
// Spring Boot implementation:
@GetMapping("/api/orders")
public Page<OrderDTO> getOrders(
        @RequestParam(required = false) Long afterId,
        @RequestParam(defaultValue = "20") int pageSize) {
    
    List<Order> orders;
    if (afterId == null) {
        orders = orderRepo.findTopNByOrderByIdAsc(pageSize + 1);
    } else {
        orders = orderRepo.findByIdGreaterThanOrderByIdAsc(afterId, 
                                    PageRequest.of(0, pageSize + 1));
    }
    
    boolean hasNext = orders.size() > pageSize;
    if (hasNext) orders = orders.subList(0, pageSize);
    
    Long nextCursor = hasNext ? orders.get(orders.size() - 1).getId() : null;
    
    return new Page<>(
        orders.stream().map(OrderDTO::from).toList(),
        nextCursor,
        hasNext
    );
}
```

### 📚 Theory Deep-Dive

```
OFFSET pagination: O(offset + limit) per page
- Page 1:      Scan 20 rows      → 0.1ms
- Page 100:    Scan 2,000 rows   → 1ms
- Page 10,000: Scan 200,000 rows → 100ms
- Page 50,000: Scan 1,000,000 rows → 800ms+
- LINEAR degradation with page depth

Keyset pagination: O(log n + limit) per page
- Page 1:      Index seek + 20 rows → 0.2ms
- Page 100:    Index seek + 20 rows → 0.2ms
- Page 10,000: Index seek + 20 rows → 0.2ms
- Page 50,000: Index seek + 20 rows → 0.2ms
- CONSTANT time regardless of page depth

The B-Tree seek: For 100M rows, index depth ≈ 4
- Read root page (in memory/cache)
- Read 3 more index pages (likely in buffer pool)
- Read 20 data pages
- Total: ~24 page reads = ~0.2ms
- Same whether the cursor is at row 1 or row 99,999,999
```

### 🔄 Variants

**Variant A: Multi-column sort (compound cursor)**
```sql
-- Can't use simple WHERE id > ? when sorting by (created_at DESC, id DESC)
-- Keyset condition for compound sort:
SELECT * FROM orders
WHERE (created_at, id) < ('2025-03-08 14:00:00', 99876)
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- PostgreSQL row comparison works perfectly here
-- The index needed: CREATE INDEX idx ON orders (created_at DESC, id DESC);
```

**Variant B: Total count problem**
```sql
-- Users want "Page 3 of 15,000" but COUNT(*) on 100M rows is slow
-- Solutions:
-- 1. Approximate count: SELECT reltuples FROM pg_class WHERE relname = 'orders';
-- 2. Don't show total: "Showing 20 results. Load more →"
-- 3. Cache the count: Refresh every 5 minutes
-- 4. Pre-computed: Maintain a counter table with triggers
```

**Variant C: API pagination for external consumers**
```
OFFSET-based: GET /api/orders?page=5&pageSize=20
- Simple for client
- BAD for deep pages
- Results can shift if data changes between pages

CURSOR-based: GET /api/orders?after=eyJpZCI6MTIzNH0&limit=20
- Consistent results even with concurrent inserts
- Always same performance
- Cursor is opaque (Base64 encoded) → client can't hack page numbers
- Trade-off: Can't jump to arbitrary page (must traverse sequentially)
```

---




## S5: Missing Index / Wrong Index Order

### 🎤 Interview Question
"How do you identify missing indexes in production?"

### ✅ Professional Answer

"I use a combination of database statistics and slow query monitoring:

**1. PostgreSQL: Find tables with high sequential scan ratios**"

```sql
-- Tables that are scanned sequentially too often
SELECT 
    schemaname, relname AS table_name,
    seq_scan,                   -- Number of sequential scans
    idx_scan,                   -- Number of index scans
    CASE WHEN (seq_scan + idx_scan) > 0 
         THEN ROUND(100.0 * seq_scan / (seq_scan + idx_scan), 1)
         ELSE 0 
    END AS pct_seq_scan,
    n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE n_live_tup > 10000  -- Only tables with significant data
ORDER BY pct_seq_scan DESC, seq_scan DESC;

-- If a table with 10M rows has 95% sequential scans → likely missing indexes
```

**2. Find the actual slow queries:**"

```sql
-- PostgreSQL (requires pg_stat_statements extension)
SELECT 
    LEFT(query, 200) AS query,
    calls,
    ROUND(mean_exec_time::numeric, 2) AS avg_ms,
    ROUND(total_exec_time::numeric / 1000, 2) AS total_seconds
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- Queries averaging > 100ms
ORDER BY total_exec_time DESC
LIMIT 20;
```

**3. Analyze the worst queries:**"

```sql
EXPLAIN (ANALYZE, BUFFERS) 
<paste the slow query here>;
-- Look for:
-- ❌ Seq Scan on large table
-- ❌ "Rows Removed by Filter: 5000000" (scanned 5M, needed 50)
-- ❌ Nested Loop with inner Seq Scan
-- ✅ Index Scan / Index Only Scan = good
-- ✅ Bitmap Index Scan = acceptable for moderate selectivity
```

### 📚 Theory: Composite Index Column Order

```
THE GOLDEN RULE: Equality → Range → Sort (ERS)

Given query:
  WHERE status = 'active'          ← Equality
    AND category = 'electronics'   ← Equality
    AND price BETWEEN 100 AND 500  ← Range
  ORDER BY created_at DESC         ← Sort

OPTIMAL index: (status, category, price, created_at)
                  E        E       R         S

WHY THIS ORDER WORKS:
1. status = 'active'       → B-Tree jumps to exact branch
2. category = 'electronics' → Narrows to exact sub-branch
3. price BETWEEN 100..500  → Scans range within that sub-branch
4. created_at              → Data is already sorted → no filesort!

WRONG ORDER:
(price, status, category, created_at)
  R       E       E          S
→ Range on price first → enters wide branch → must scan ALL of it
→ Can't efficiently use status/category after a range condition
→ Much worse performance
```

### 🔄 Variants

**Variant A: Redundant indexes wasting space**
```sql
-- You have:
-- INDEX (a, b, c)
-- INDEX (a, b)     ← REDUNDANT! (a,b,c) covers (a,b) queries
-- INDEX (a)        ← REDUNDANT! (a,b,c) covers (a) queries
-- INDEX (b, a)     ← NOT redundant! Different leading column

-- Detect redundant indexes:
SELECT 
    idx1.indexrelid::regclass AS possibly_redundant,
    idx2.indexrelid::regclass AS covering_index
FROM pg_index idx1
JOIN pg_index idx2 ON idx1.indrelid = idx2.indrelid 
    AND idx1.indexrelid != idx2.indexrelid
WHERE idx1.indkey::text = ANY(
    SELECT unnest(string_to_array(idx2.indkey::text, ' '))
);
-- Review before dropping — covering index must include ALL columns of the smaller one
```

**Variant B: Index exists but optimizer chooses not to use it**
```sql
-- Possible reasons:
-- 1. Statistics are stale → ANALYZE table_name;
-- 2. Query returns > 20% of table → seq scan is genuinely faster
-- 3. Parameterized query plan cached with bad estimate
-- 4. Data distribution changed but plan hasn't updated

-- Force re-analysis:
ANALYZE orders;

-- Check if statistics match reality:
SELECT tablename, attname, n_distinct, most_common_vals
FROM pg_stats WHERE tablename = 'orders' AND attname = 'status';
```

---

## S6: Connection Pool Exhaustion

### 🎤 Interview Question
"Tell me about a production outage you helped resolve."

### ✅ Professional Answer

"One of the most impactful incidents I handled was a connection pool exhaustion that caused a complete API outage.

**SITUATION:** At 2 PM on a Tuesday — peak traffic — our API started returning 500 errors. Every endpoint failed. Within 3 minutes, 100% of requests were failing. The monitoring dashboard showed database connection wait time spiking to 30 seconds (our timeout).

**INVESTIGATION:** I checked HikariCP metrics and saw all 20 connections were in 'active' state with zero available. I queried PostgreSQL directly:"

```sql
SELECT pid, state, query, 
       NOW() - xact_start AS transaction_duration,
       NOW() - query_start AS query_duration,
       wait_event_type, wait_event
FROM pg_stat_activity
WHERE datname = 'production'
ORDER BY xact_start;

-- Found: 18 connections in 'idle in transaction' state
-- Transaction durations: 15s, 22s, 28s, 45s...
-- They were all running the same query at some point
```

"**ROOT CAUSE:** A developer had added a new endpoint that called an external payment API *inside* a `@Transactional` method. When the payment API slowed down (it was having its own incident), each request held a database connection for the full duration of the HTTP call — up to 45 seconds. Since we only had 20 connections, and each was tied up for 45 seconds, our pool capacity was effectively (20 connections / 45 seconds) = ~0.4 requests per second. Our actual traffic was 50 requests/second.

**EXECUTION — immediate (5 minutes):**"

```sql
-- Kill the hung transactions
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle in transaction' 
  AND NOW() - xact_start > INTERVAL '30 seconds';
```

🔬 **Section Challenge — S6: Connection Pool Exhaustion**

**Challenge 1 (Reasoning):** A payment API slows down, and every request keeps a database transaction open while waiting for HTTP. Why does this drain the connection pool even if each SQL statement is fast?
<details><summary>Answer</summary>

The transaction owns a database connection for the whole method, not only while SQL is executing. If the external API waits 45 seconds, that connection is pinned for 45 seconds. With 20 pool connections, capacity becomes roughly `20 / 45 = 0.44` requests/sec for that path, no matter how fast the actual SQL is. The fix is to move external calls outside the transaction or split the workflow into short DB transactions plus retryable/outbox steps.
</details>

**Challenge 2 (Design):** Why is killing `idle in transaction` sessions only an emergency action, not the real fix?
<details><summary>Answer</summary>

Terminating sessions frees connections immediately, but it can abort in-flight business work and does not remove the code path that created long transactions. The real fix is to shorten transaction scope, add transaction timeouts, add Hikari leak detection, and keep non-DB I/O outside DB transactions. Emergency termination restores service; code and configuration changes prevent recurrence.
</details>


```yaml
# Increase pool size for immediate relief:
spring:
  datasource:
    hikari:
      maximum-pool-size: 50
      idle-in-transaction-session-timeout: 30000  # Kill after 30s
```

"**EXECUTION — fix (same day):**"

```java
// BEFORE (bad):
@Transactional
public OrderResult placeOrder(OrderRequest req) {
    Order order = orderRepo.save(new Order(req));    // DB: 5ms
    PaymentResult pay = paymentClient.charge(order); // HTTP: 1-45 seconds!
    order.setPaymentId(pay.getId());                  // DB: 5ms
    return new OrderResult(order, pay);
    // Connection held for entire method: 1-45 seconds
}

// AFTER (fixed):
public OrderResult placeOrder(OrderRequest req) {
    Order order = saveOrder(req);                     // Transaction: 10ms
    PaymentResult pay = paymentClient.charge(order);  // No transaction, no connection
    updateOrderPayment(order.getId(), pay.getId());   // Transaction: 5ms
    return new OrderResult(order, pay);
    // Connection held: 10ms + 5ms = 15ms total
}

@Transactional
private Order saveOrder(OrderRequest req) {
    return orderRepo.save(new Order(req));  // Quick transaction
}

@Transactional
private void updateOrderPayment(Long orderId, String paymentId) {
    orderRepo.updatePaymentId(orderId, paymentId);  // Quick transaction
}
```

"**NEXT STEPS:** I added three things:
1. HikariCP pool utilization alert at 80%
2. `idle-in-transaction-session-timeout` at the PostgreSQL level (30 seconds)
3. A static analysis rule that flags `@Transactional` methods containing HTTP client calls"

### 📚 Theory Deep-Dive

```
Connection Pool Math — Little's Law:
  L = λ × W
  L = average connections in use
  λ = arrival rate (requests per second)
  W = average time each connection is held

  Before fix: λ = 50 req/s, W = 15s → L = 750 connections needed!
  Pool size = 20 → overflow → timeout → 503 errors

  After fix:  λ = 50 req/s, W = 0.015s → L = 0.75 connections needed
  Pool size = 20 → 19 connections idle → healthy

  Moral: Connection hold time matters MORE than pool size.
  Increasing pool size is a band-aid. Reducing hold time is the fix.

Pool sizing formula (HikariCP recommended):
  pool_size = (core_count * 2) + effective_spindle_count
  For SSD with 4-core server: (4 * 2) + 1 = 9 → round to 10
  Most applications do well with 10-30 connections per application instance
```

---

## S7: Hot Partition / Uneven Data Distribution

### 🎤 Interview Question
"How do you handle data skew in a distributed database?"

### ✅ Professional Answer

```sql
-- PROBLEM: Table partitioned by created_date
-- All today's queries hit the SAME partition
-- That partition's disk is saturated while other partitions idle

-- Detect hot partition:
SELECT 
    tableoid::regclass AS partition_name,
    COUNT(*) AS rows,
    pg_size_pretty(pg_relation_size(tableoid)) AS size
FROM orders
GROUP BY tableoid
ORDER BY COUNT(*) DESC;

-- SOLUTIONS:
-- 1. Hash partition (distributes evenly regardless of date)
CREATE TABLE orders (id BIGINT, created_at TIMESTAMPTZ, ...)
PARTITION BY HASH (id);
CREATE TABLE orders_p0 PARTITION OF orders FOR VALUES WITH (MODULUS 8, REMAINDER 0);
CREATE TABLE orders_p1 PARTITION OF orders FOR VALUES WITH (MODULUS 8, REMAINDER 1);
-- ... 8 partitions, evenly distributed by hash of id

-- 2. Composite partitioning (range by date, then hash by id)
-- Monthly partitions, each sub-partitioned by hash
-- Best of both worlds: time-based archival + even distribution

-- 3. For sharded databases: Use consistent hashing with virtual nodes
-- Each physical shard gets 100+ virtual nodes on the hash ring
-- Random distribution → naturally even with enough virtual nodes
```

---

## S8: Cache Stampede / Thundering Herd

### 🎤 Interview Question
"How do you handle cache failures at scale?"

### ✅ Professional Answer

"Cache stampede happens when a cache entry expires and hundreds of concurrent requests all try to regenerate the same cached value simultaneously. Each one queries the database, which can overload it.

**Scenario:** 500 requests/second all hit the 'top products' cache key. TTL expires. All 500 requests simultaneously hit the database with the same expensive query."

```java
// BAD: Simple cache-aside
public List<Product> getTopProducts() {
    List<Product> cached = cache.get("top_products");
    if (cached == null) {
        // 500 threads ALL reach here simultaneously
        cached = productRepo.findTopExpensive();  // 500 identical DB queries!
        cache.put("top_products", cached, Duration.ofMinutes(5));
    }
    return cached;
}

// FIX 1: Lock-based (only one thread regenerates)
public List<Product> getTopProducts() {
    List<Product> cached = cache.get("top_products");
    if (cached != null) return cached;
    
    // Only one thread acquires the lock
    if (regenerationLock.tryLock("top_products", Duration.ofSeconds(10))) {
        try {
            // Double-check after acquiring lock
            cached = cache.get("top_products");
            if (cached != null) return cached;
            
            cached = productRepo.findTopExpensive();  // 1 DB query
            cache.put("top_products", cached, Duration.ofMinutes(5));
            return cached;
        } finally {
            regenerationLock.unlock("top_products");
        }
    } else {
        // Other threads wait or return stale value
        return cache.getStaleOrWait("top_products");
    }
}

// FIX 2: Probabilistic early expiration
// Each request has a small chance of regenerating BEFORE the TTL expires
// The hotter the key, the more likely it gets refreshed early
public List<Product> getTopProducts() {
    CacheEntry<List<Product>> entry = cache.getWithMetadata("top_products");
    if (entry == null) return regenerateAndCache();
    
    double ttlRemaining = entry.getRemainingTtl().toSeconds();
    double totalTtl = 300.0;  // 5 minutes
    // As TTL approaches 0, probability of refresh approaches 1
    if (Math.random() < Math.exp(-ttlRemaining / totalTtl * 5)) {
        CompletableFuture.runAsync(this::regenerateAndCache);  // Background refresh
    }
    return entry.getValue();
}

// FIX 3: Background refresh (simplest for production)
@Scheduled(fixedRate = 240000)  // Refresh every 4 minutes (TTL is 5min → always fresh)
public void refreshTopProducts() {
    List<Product> products = productRepo.findTopExpensive();
    cache.put("top_products", products, Duration.ofMinutes(5));
}
```

### 📚 Theory

```
Thundering Herd — O(n) simultaneous requests:
- Without protection: N concurrent requests → N identical DB queries
- With lock: N requests → 1 DB query + (N-1) wait for result
- With background refresh: 0 DB queries on user path — always from cache

DSA connection:
- Lock → Mutex/Semaphore — only one thread enters critical section
- Probabilistic refresh → Randomized algorithm — avoid synchronized behavior
- Background refresh → Producer-Consumer — producer fills cache, consumers read
```

---




## S9: Slow COUNT(*) on Billion Rows

### 🎤 Interview Question
"How would you implement a 'total results' count for a search feature?"

### ✅ Professional Answer

```sql
-- PROBLEM: SELECT COUNT(*) FROM orders WHERE status = 'active';
-- On 1 billion rows, even with an index, this takes 5-30 seconds
-- Because COUNT(*) must VISIT every matching row to count it

-- WHY it's slow even with index:
-- Index contains pointers to rows. Database must follow EACH pointer
-- to check if the row is visible (MVCC visibility check).
-- Index: 500M 'active' entries × 1 visibility check each = slow

-- SOLUTION 1: Approximate count (PostgreSQL)
SELECT reltuples AS approximate_count
FROM pg_class WHERE relname = 'orders';
-- Returns approximate row count maintained by ANALYZE
-- Accuracy: ±5-10%, updates after VACUUM/ANALYZE

-- SOLUTION 2: Counter cache table (exact, real-time)
CREATE TABLE order_counts (
    status VARCHAR(20) PRIMARY KEY,
    count BIGINT DEFAULT 0
);

-- Maintain with trigger:
CREATE OR REPLACE FUNCTION update_order_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO order_counts (status, count) VALUES (NEW.status, 1)
        ON CONFLICT (status) DO UPDATE SET count = order_counts.count + 1;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE order_counts SET count = count - 1 WHERE status = OLD.status;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        UPDATE order_counts SET count = count - 1 WHERE status = OLD.status;
        INSERT INTO order_counts (status, count) VALUES (NEW.status, 1)
        ON CONFLICT (status) DO UPDATE SET count = order_counts.count + 1;
    END IF;
    RETURN NULL;
END $$ LANGUAGE plpgsql;

-- SOLUTION 3: Cached COUNT with periodic refresh
@Cacheable(value = "orderCounts", key = "#status")
public long getOrderCount(String status) {
    return orderRepo.countByStatus(status);
}

@Scheduled(fixedRate = 60000)  // Refresh every minute
@CacheEvict(value = "orderCounts", allEntries = true)
public void refreshCounts() {}
```

---

## S10: SELECT * in Production

### 🎤 Interview Question
"What common anti-patterns do you look for in code reviews?"

### ✅ Professional Answer

"SELECT * is one of the first things I flag. It seems harmless but causes real performance problems at scale:

**1. Network bandwidth waste:**"

```sql
-- orders table has 30 columns, 500 bytes total per row
-- API only needs: id, status, total
-- SELECT *: 500 bytes × 10,000 rows = 5MB transferred
-- SELECT id, status, total: 50 bytes × 10,000 rows = 500KB (10x less)
```

**2. Prevents index-only scans:**"
```sql
-- If index is (status, created_at), and query is:
SELECT status, created_at FROM orders WHERE status = 'pending';
-- With SELECT specific columns → Index Only Scan (no table access!)
-- With SELECT * → Index Scan + heap fetch for every row (much slower)
```

**3. Breaks when schema changes:**"
```java
// ResultSet mapped positionally:
String name = rs.getString(2);  // Was 'name', but someone added a column before it
// Now column 2 is 'middle_name' → BUG

// Fix: Use explicit column names
String name = rs.getString("name");  // Always correct regardless of schema changes
```

**4. Spring Boot/JPA version:**"
```java
// BAD: Load full entity for a simple status check
Optional<Order> order = orderRepo.findById(id);
return order.get().getStatus();
// Loads ALL 30 columns to read 1 field

// GOOD: Projection
@Query("SELECT o.status FROM Order o WHERE o.id = :id")
String findStatusById(@Param("id") Long id);
// Loads only the status column
```

---




## 🧠 Pattern Map: Problems → Professional Diagnosis

| When You See... | Immediately Think... | Say in Interview... |
|-----------------|---------------------|---------------------|
| Slow query | Execution plan → Seq Scan? | "I'd start with EXPLAIN ANALYZE to examine the execution plan" |
| Timeout errors | Connection pool or lock contention | "This pattern suggests either pool exhaustion or lock contention; I'd check pg_stat_activity" |
| Intermittent slowness | Lock contention or plan regression | "The intermittent nature suggests a concurrency issue, possibly lock contention during peak traffic" |
| OOM in application | Unbounded collection loading | "This is consistent with unbounded entity accumulation — likely loading too many entities in a single transaction" |
| Data inconsistency | Race condition or missing constraint | "This indicates either a race condition in the write path or a missing database constraint" |
| Spike then recovery | Cache expiration or GC pause | "The spike-and-recovery pattern is characteristic of cache stampede or a major GC pause" |

---

[⬅ Previous: 43_Interview_Mindset](43_Interview_Mindset_How_Professionals_Explain.md) | [📚 Index](00_INDEX.md) | [Next: 45_Interview_Scenarios_Part2 ➡](45_Interview_Scenarios_Explained_Part2.md)
