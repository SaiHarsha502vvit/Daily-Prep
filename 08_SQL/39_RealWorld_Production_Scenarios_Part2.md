# Chapter 39 — Real-World Production Scenarios Part 2: Query Performance & Optimization Crises

**What:** 25 real-world query performance disasters (Scenarios 26–50) with full 5W-H + fixes
**Why:** Slow queries cost revenue, frustrate users, and wake engineers at 3 AM
**Where:** Every production database — OLTP and OLAP
**How:** Identify the anti-pattern → SQL fix → Spring Boot/Backend fix → DSA insight

---

## 📋 Scenario Master Index (Part 2: Scenarios 26–50)

| #   | Scenario                                           | Category           |
| --- | -------------------------------------------------- | ------------------ |
| 26  | SELECT \* in production code                       | Query Anti-Pattern |
| 27  | N+1 query problem — 1000 queries for 1 page        | ORM/Backend        |
| 28  | Missing index on WHERE clause — full table scan    | Index Missing      |
| 29  | Wrong index order — composite index not used       | Index Design       |
| 30  | LIKE '%search%' — can't use index                  | Search Pattern     |
| 31  | Implicit type conversion killing index             | Index Bypass       |
| 32  | OR conditions preventing index usage               | Query Anti-Pattern |
| 33  | Correlated subquery running O(n²)                  | Query Anti-Pattern |
| 34  | DISTINCT masking a JOIN explosion                  | Query Anti-Pattern |
| 35  | COUNT(\*) on billion-row table — 45-minute query   | Aggregate          |
| 36  | Pagination with OFFSET — gets slower every page    | Pagination         |
| 37  | Sorting without index — filesort on disk           | Sort               |
| 38  | Function on indexed column — index bypass          | Index Bypass       |
| 39  | Query plan regression after statistics update      | Plan Instability   |
| 40  | Temp table spill to disk — insufficient work_mem   | Memory             |
| 41  | Connection pool exhaustion — too many idle queries | Connection         |
| 42  | Cartesian product from missing JOIN condition      | Query Bug          |
| 43  | NOT IN with NULL — returns zero rows               | NULL Trap          |
| 44  | Index-only scan prevented by visibility check      | PostgreSQL         |
| 45  | Multi-table JOIN producing 100M intermediate rows  | JOIN Explosion     |
| 46  | Subquery in SELECT list — hidden N+1               | Query Anti-Pattern |
| 47  | UNION vs UNION ALL — accidental dedup of 10M rows  | Query Anti-Pattern |
| 48  | Prepared statement plan cache bloat                | Memory             |
| 49  | Lock wait timeout from unindexed FK update         | Lock               |
| 50  | Dashboard query running every 5 seconds per user   | Load Pattern       |

---

## Scenario 26: SELECT \* in Production Code

### 🔴 The Incident

API endpoint fetches `SELECT * FROM users` with 47 columns including a 500KB `profile_json` BLOB. Page loads take 8 seconds. Network bandwidth saturated.

### 5W-H Analysis

| Question  | Answer                                                                                 |
| --------- | -------------------------------------------------------------------------------------- |
| **What**  | Fetching 47 columns when only 3 are needed; transferring 500x more data than necessary |
| **Why**   | Developer used `findAll()` JPA method, or wrote `SELECT *` for convenience             |
| **When**  | Becomes critical when tables have BLOB/TEXT columns or lots of unused columns          |
| **Where** | API endpoints, reports, list screens — anything that fetches multiple rows             |
| **Who**   | Junior devs, ORMs with default fetch-all, copy-pasted SQL                              |
| **How**   | Select only needed columns, use DTO projections                                        |

### SQL Solution

```sql
-- BAD: Fetches 47 columns including 500KB profile_json
SELECT * FROM users WHERE active = TRUE LIMIT 100;
-- Result: 100 rows × 500KB = 50MB transferred

-- GOOD: Only fetch what the API needs
SELECT id, name, email, avatar_url
FROM users WHERE active = TRUE LIMIT 100;
-- Result: 100 rows × 200B = 20KB transferred — 2500x smaller!

-- MEASURE the difference:
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM users LIMIT 100;
-- Buffers: shared hit=5432  (reads the entire wide row from TOAST)

EXPLAIN (ANALYZE, BUFFERS) SELECT id, name, email FROM users LIMIT 100;
-- Buffers: shared hit=12  (reads only from the main heap page)
```

### Spring Boot / JPA Fix

```java
// BAD: JPA default loads everything
@GetMapping("/users")
public List<User> getUsers() {
    return userRepo.findAll();  // SELECT * — all 47 columns
}

// GOOD: DTO Projection — only fetches needed columns
public interface UserListView {
    Long getId();
    String getName();
    String getEmail();
    String getAvatarUrl();
}

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    @Query("SELECT u.id AS id, u.name AS name, u.email AS email, " +
           "u.avatarUrl AS avatarUrl FROM User u WHERE u.active = true")
    List<UserListView> findActiveUserList();
}

// Or using Spring Data projection:
List<UserListView> findByActiveTrue();  // Spring auto-generates optimal SQL
```

### DSA Connection

- **Column pruning** = Array slicing — only copy elements you need
- **Wide row vs narrow row** = Struct of Arrays vs Array of Structs — memory layout optimization

---

## Scenario 27: N+1 Query Problem — 1000 Queries for 1 Page

### 🔴 The Incident

Page showing 50 orders with customer names fires 51 queries: 1 for orders + 50 individual customer lookups. Page takes 12 seconds.

### 5W-H Analysis

| Question  | Answer                                                                  |
| --------- | ----------------------------------------------------------------------- |
| **What**  | ORM lazy-loads relationships; each access triggers a separate SQL query |
| **Why**   | `@ManyToOne(fetch = FetchType.LAZY)` + iterating in a loop              |
| **When**  | Any list page with related entities                                     |
| **Where** | JPA/Hibernate, Django ORM, ActiveRecord, Entity Framework               |
| **Who**   | Any dev who iterates over parent entities and accesses child fields     |
| **How**   | JOIN FETCH, batch fetching, or custom query                             |

### SQL Demonstration

```sql
-- This is what the ORM is generating:
-- Query 1: SELECT * FROM orders LIMIT 50;
-- Query 2: SELECT * FROM customers WHERE id = 101;
-- Query 3: SELECT * FROM customers WHERE id = 102;
-- ... 48 more queries
-- Total: 51 queries, 51 round-trips to database

-- FIX: Single JOIN query
SELECT o.id, o.order_date, o.total, c.name AS customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.id
ORDER BY o.order_date DESC
LIMIT 50;
-- 1 query, 1 round-trip

-- FIX 2: Batch fetch (if JOIN isn't suitable)
SELECT * FROM orders ORDER BY order_date DESC LIMIT 50;
-- Collect all customer_ids: [101, 102, 103, ...]
SELECT * FROM customers WHERE id IN (101, 102, 103, ...);
-- 2 queries instead of 51
```

### Spring Boot Fix

```java
// BAD: Lazy loading causes N+1
@Entity
public class Order {
    @ManyToOne(fetch = FetchType.LAZY)  // Each order.getCustomer() = 1 query
    private Customer customer;
}

// FIX 1: JOIN FETCH in JPQL
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT o FROM Order o JOIN FETCH o.customer ORDER BY o.orderDate DESC")
    List<Order> findAllWithCustomer(Pageable pageable);
}

// FIX 2: Entity Graph (declarative)
@EntityGraph(attributePaths = {"customer", "orderItems"})
List<Order> findTop50ByOrderByOrderDateDesc();

// FIX 3: Hibernate @BatchSize — loads 25 customers in 2 queries instead of 50
@Entity
public class Customer {
    @BatchSize(size = 25)  // Hibernate fetches 25 at a time
    @OneToMany(mappedBy = "customer")
    private List<Order> orders;
}

// DETECT N+1: Enable Hibernate statistics
// application.yml:
spring:
  jpa:
    properties:
      hibernate:
        generate_statistics: true
        # Logs: "Session Metrics { 51 JDBC statements }" — RED FLAG!
```

### DSA Connection

- **N+1 = O(n) nested lookups** = Not pre-building a HashMap
- **JOIN FETCH = HashJoin** = Build hash table of customers O(n), then probe O(1) per order
- **Batch fetch = Chunked processing** = Process in groups of K instead of 1-by-1

---

## Scenario 28: Missing Index on WHERE Clause — Full Table Scan

### 🔴 The Incident

`SELECT * FROM orders WHERE customer_email = 'john@example.com'` takes 15 seconds on a 50M row table. EXPLAIN shows `Seq Scan`.

### SQL Solution

```sql
-- BEFORE: No index, sequential scan
EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_email = 'john@example.com';
-- Seq Scan on orders  (cost=0.00..1234567.89 rows=50000000)
-- Execution Time: 15432.123 ms

-- FIX: Create index
CREATE INDEX CONCURRENTLY idx_orders_email ON orders(customer_email);

-- AFTER: Index scan
EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_email = 'john@example.com';
-- Index Scan using idx_orders_email  (cost=0.56..8.58 rows=1)
-- Execution Time: 0.042 ms

-- That's 367,000x faster!

-- FIND ALL missing indexes: Tables with sequential scans
SELECT
    schemaname || '.' || relname AS table_name,
    seq_scan,
    seq_tup_read,
    idx_scan,
    CASE WHEN seq_scan > 0
         THEN ROUND(seq_tup_read::NUMERIC / seq_scan)
         ELSE 0 END AS avg_rows_per_seq_scan,
    pg_size_pretty(pg_relation_size(relid)) AS table_size
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan          -- More seq scans than index scans
  AND pg_relation_size(relid) > 10 * 1024 * 1024  -- Tables > 10MB
ORDER BY seq_tup_read DESC;

-- MySQL equivalent:
SELECT * FROM sys.statements_with_full_table_scans
ORDER BY no_index_used_count DESC LIMIT 20;
```

### Spring Boot: Automatic Index Suggestion Logger

```java
@Aspect
@Component
public class SlowQueryDetector {

    @Around("execution(* com.app.repository.*.*(..))")
    public Object detectSlowQueries(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.nanoTime();
        Object result = joinPoint.proceed();
        long elapsed = (System.nanoTime() - start) / 1_000_000;

        if (elapsed > 100) {  // > 100ms
            log.warn("SLOW QUERY: {}.{} took {}ms — check for missing index",
                joinPoint.getTarget().getClass().getSimpleName(),
                joinPoint.getSignature().getName(),
                elapsed
            );
        }
        return result;
    }
}
```

---

## Scenario 29: Wrong Index Order — Composite Index Not Used

### 🔴 The Incident

Index exists on `(status, created_at, customer_id)` but query `WHERE customer_id = 5 AND status = 'active'` doesn't use it efficiently.

### 5W-H Analysis

| Question  | Answer                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------ |
| **What**  | Composite index follows leftmost prefix rule; skipping first column can't use B-Tree efficiently |
| **Why**   | Index designed for one query pattern but used for a different one                                |
| **When**  | When queries don't match the leftmost columns of the composite index                             |
| **Where** | All B-Tree index implementations (MySQL, PostgreSQL, Oracle)                                     |
| **Who**   | Devs who add indexes without understanding column order matters                                  |
| **How**   | Reorder columns by: equality first → range second → sort third                                   |

### SQL Solution

```sql
-- The index: (status, created_at, customer_id)
-- B-Tree structure:
--   Level 1: status = 'active' | status = 'cancelled' | status = 'shipped'
--   Level 2: created_at ranges within each status
--   Level 3: customer_id within each status+date

-- Query 1: WHERE status = 'active' AND created_at > '2025-01-01'
-- ✅ USES INDEX perfectly (leftmost prefix: status, created_at)

-- Query 2: WHERE customer_id = 5
-- ❌ CANNOT USE INDEX (customer_id is the THIRD column)

-- Query 3: WHERE customer_id = 5 AND status = 'active'
-- ⚠️ Can use index for status, but not customer_id efficiently

-- THE RULE: Equality → Range → Sort
-- For: WHERE status = ? AND customer_id = ? AND created_at > ? ORDER BY created_at
-- Best index: (status, customer_id, created_at)
--   status = 'active'     → equality, narrows to 30%
--   customer_id = 5       → equality, narrows to 0.01%
--   created_at > '2025-01-01' → range scan on remaining rows
--   ORDER BY created_at   → already sorted! No filesort needed

CREATE INDEX idx_orders_optimal ON orders(status, customer_id, created_at);

-- VERIFY with EXPLAIN:
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE status = 'active' AND customer_id = 5 AND created_at > '2025-01-01'
ORDER BY created_at DESC
LIMIT 20;
-- Index Scan using idx_orders_optimal
-- Sort: NONE (index already sorted)
```

### DSA Connection

- **Composite index = Multi-level sorting** = Sorting by (last_name, first_name, age) — can binary search by last_name or (last_name, first_name) but NOT first_name alone
- **Leftmost prefix = Trie traversal** — must traverse from root, can't skip levels

---

## Scenario 30: LIKE '%search%' — Can't Use Index

### 🔴 The Incident

Search feature: `WHERE product_name LIKE '%laptop%'` on 10M products. Full table scan every search. Users wait 8 seconds.

### SQL Solutions

```sql
-- Problem: Leading wildcard prevents B-Tree index usage
EXPLAIN SELECT * FROM products WHERE name LIKE '%laptop%';
-- Seq Scan (B-Tree index = useless for leading %)

-- Solution 1: Full-Text Search (PostgreSQL)
ALTER TABLE products ADD COLUMN name_tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english', name || ' ' || description)) STORED;
CREATE INDEX idx_products_fts ON products USING GIN(name_tsv);

SELECT * FROM products
WHERE name_tsv @@ to_tsquery('english', 'laptop & gaming');
-- GIN index scan: < 5ms on 10M rows

-- Solution 2: Trigram index (PostgreSQL — pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_products_name_trgm ON products USING GIN(name gin_trgm_ops);

SELECT * FROM products WHERE name LIKE '%laptop%';
-- Now uses GIN trigram index! Works even with leading %

SELECT * FROM products WHERE name % 'laptap';  -- Fuzzy match (typo-tolerant)
SELECT *, similarity(name, 'laptap') AS sim FROM products
WHERE name % 'laptap' ORDER BY sim DESC;

-- Solution 3: MySQL Full-Text
ALTER TABLE products ADD FULLTEXT INDEX ft_name_desc (name, description);
SELECT * FROM products
WHERE MATCH(name, description) AGAINST('laptop gaming' IN BOOLEAN MODE);

-- Solution 4: Generated column for prefix search
-- If searches are always "starts with":
ALTER TABLE products ADD COLUMN name_reversed VARCHAR(255)
    GENERATED ALWAYS AS (REVERSE(name)) STORED;
CREATE INDEX idx_name_rev ON products(name_reversed);
-- WHERE name LIKE '%phone' → WHERE name_reversed LIKE 'enohp%' → uses index!
```

### Spring Boot Full-Text Search Integration

```java
// JPA native query with PostgreSQL full-text
@Query(value = "SELECT * FROM products " +
    "WHERE name_tsv @@ plainto_tsquery(:query) " +
    "ORDER BY ts_rank(name_tsv, plainto_tsquery(:query)) DESC " +
    "LIMIT :limit", nativeQuery = true)
List<Product> fullTextSearch(@Param("query") String query, @Param("limit") int limit);

// Or build Specification for dynamic search
public static Specification<Product> search(String term) {
    return (root, query, cb) -> {
        // Use full-text for longer terms, LIKE for short ones
        if (term.length() >= 3) {
            return cb.isTrue(cb.function("fts_match", Boolean.class,
                root.get("name"), cb.literal(term)));
        }
        return cb.like(cb.lower(root.get("name")), "%" + term.toLowerCase() + "%");
    };
}
```

---

## Scenario 31: Implicit Type Conversion Killing Index

### 🔴 The Incident

Column `phone VARCHAR(15)` has an index. Query `WHERE phone = 9876543210` (numeric, no quotes) does full table scan because database converts every row's VARCHAR to number for comparison.

### SQL Solution

```sql
-- PROBLEM: Type mismatch forces conversion
EXPLAIN SELECT * FROM users WHERE phone = 9876543210;
-- MySQL: Full Table Scan (converting VARCHAR to INT for every row)
-- The INDEX on phone(VARCHAR) cannot be used!

-- FIX: Use correct type in query
EXPLAIN SELECT * FROM users WHERE phone = '9876543210';
-- Index Scan! No conversion needed.

-- Common type mismatch traps:
-- 1. VARCHAR column compared with INT
WHERE phone = 1234567890           -- BAD
WHERE phone = '1234567890'          -- GOOD

-- 2. DATE column compared with string in wrong format
WHERE created_at = '03/08/2025'     -- BAD (ambiguous format)
WHERE created_at = '2025-03-08'     -- GOOD (ISO 8601)

-- 3. DECIMAL compared with float
WHERE price = 19.99                 -- May lose precision
WHERE price = CAST(19.99 AS DECIMAL(10,2))  -- Explicit

-- DETECT implicit conversions (MySQL):
EXPLAIN SELECT * FROM users WHERE phone = 9876543210\G
-- Look for: "Using where" without "Using index" = conversion happened

-- PostgreSQL: Will refuse with an error (safer!):
-- ERROR: operator does not exist: character varying = integer
```

### Spring Boot Prevention

```java
// BAD: JPA might send wrong type
@Query("SELECT u FROM User u WHERE u.phone = :phone")
User findByPhone(@Param("phone") Long phone);  // Long → implicit conversion!

// GOOD: Correct parameter type
@Query("SELECT u FROM User u WHERE u.phone = :phone")
User findByPhone(@Param("phone") String phone);  // String → no conversion
```

---

## Scenario 32: OR Conditions Preventing Index Usage

### 🔴 The Incident

`WHERE status = 'active' OR email = 'john@example.com'` — neither index is used because the optimizer can't use two different indexes in a single scan efficiently.

### SQL Solution

```sql
-- PROBLEM: OR prevents single index usage
SELECT * FROM users WHERE status = 'active' OR email = 'john@example.com';
-- Seq Scan (can't use idx_status OR idx_email efficiently)

-- FIX 1: UNION ALL (each branch uses its own index)
SELECT * FROM users WHERE status = 'active'
UNION
SELECT * FROM users WHERE email = 'john@example.com';
-- Each SELECT uses its own index, results merged

-- FIX 2: Create a composite index (if this query is frequent)
CREATE INDEX idx_status_email ON users(status, email);

-- FIX 3: Bitmap Index Scan (PostgreSQL does this automatically sometimes)
-- PostgreSQL can combine multiple indexes with BitmapOr:
-- Bitmap Index Scan on idx_status → Bitmap
-- Bitmap Index Scan on idx_email → Bitmap
-- BitmapOr → Combined Bitmap
-- Bitmap Heap Scan on users

-- FIX 4: Rewrite application logic to split queries
-- Instead of one query with OR, make two targeted queries
```

### Spring Boot Dynamic Query Builder

```java
// Specification pattern handles OR efficiently
public static Specification<User> searchUsers(String status, String email) {
    return (root, query, cb) -> {
        List<Predicate> predicates = new ArrayList<>();
        if (status != null) predicates.add(cb.equal(root.get("status"), status));
        if (email != null) predicates.add(cb.equal(root.get("email"), email));
        return cb.or(predicates.toArray(new Predicate[0]));
    };
}
```

---

## Scenario 33: Correlated Subquery Running O(n²)

### 🔴 The Incident

Query finds "latest order per customer" using correlated subquery. For 1M customers × 50M orders = evaluating subquery 1M times. Runtime: 2 hours.

### SQL Solution

```sql
-- BAD: Correlated subquery (runs once PER ROW of outer query)
SELECT * FROM orders o1
WHERE o1.order_date = (
    SELECT MAX(o2.order_date)
    FROM orders o2
    WHERE o2.customer_id = o1.customer_id  -- Correlation! Runs for EACH o1 row
);
-- O(n²): For each of 50M orders, scan orders table again

-- FIX 1: Window function (single pass!)
SELECT * FROM (
    SELECT *, ROW_NUMBER() OVER (
        PARTITION BY customer_id ORDER BY order_date DESC
    ) AS rn
    FROM orders
) ranked WHERE rn = 1;
-- O(n log n): Sort once, pick first per group

-- FIX 2: LATERAL JOIN (PostgreSQL) — uses index
SELECT DISTINCT ON (c.id) c.id, o.*
FROM customers c
JOIN LATERAL (
    SELECT * FROM orders
    WHERE customer_id = c.id
    ORDER BY order_date DESC
    LIMIT 1
) o ON true;
-- Uses index on orders(customer_id, order_date DESC) — very fast

-- FIX 3: Self-JOIN with aggregation
SELECT o.*
FROM orders o
JOIN (
    SELECT customer_id, MAX(order_date) AS max_date
    FROM orders GROUP BY customer_id
) latest ON o.customer_id = latest.customer_id
        AND o.order_date = latest.max_date;

-- PERFORMANCE COMPARISON (50M orders, 1M customers):
-- Correlated subquery: 2+ hours
-- Window function:     45 seconds
-- LATERAL JOIN:        3 seconds (with index)
```

### DSA Connection

- **Correlated subquery = Nested loops** = O(n²) — for each element, scan all elements
- **Window function = Sort + single pass** = O(n log n + n)
- **LATERAL JOIN = Index lookup** = O(n × log m) where m = orders per customer

---

## Scenario 34: DISTINCT Masking a JOIN Explosion

### 🔴 The Incident

Query has `SELECT DISTINCT` and returns correct results, but takes 30 minutes. Without DISTINCT, it returns 100x more rows. The DISTINCT is hiding a Cartesian product from a bad JOIN.

### SQL Solution

```sql
-- BAD: Accidental many-to-many explosion
SELECT DISTINCT u.id, u.name, u.email
FROM users u
JOIN orders o ON o.customer_id = u.id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id;
-- 1000 users × 10 orders each × 5 items each = 50,000 rows
-- DISTINCT deduplicates back to 1000 — but work was already done!

-- DIAGNOSIS: Remove DISTINCT to see the explosion
SELECT COUNT(*) FROM users u      -- What you expect: 1000
JOIN orders o ON o.customer_id = u.id
JOIN order_items oi ON oi.order_id = o.id;
-- Actual count: 50,000 — explosion!

-- FIX: Use EXISTS instead of JOIN (if you don't need related data)
SELECT u.id, u.name, u.email
FROM users u
WHERE EXISTS (
    SELECT 1 FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.customer_id = u.id
);
-- No DISTINCT needed, no explosion

-- FIX 2: Aggregate before joining
SELECT u.id, u.name, u.email, os.total_orders
FROM users u
JOIN (
    SELECT customer_id, COUNT(*) AS total_orders
    FROM orders GROUP BY customer_id
) os ON os.customer_id = u.id;
-- Pre-aggregation prevents explosion
```

---

🔬 **Section Challenge — Scenario 34: DISTINCT Masking a JOIN Explosion**

**Challenge 1 (Debug — Who/When/What):** A query uses `SELECT DISTINCT customer_id FROM orders JOIN tags ON orders.id = tags.order_id WHERE tags.name = 'VIP'`. It seems fast and returns correct-looking customer IDs. **Who** is hiding a problem? **When** would removing DISTINCT break the query? **What** is the performance trap?

<details><summary>Answer</summary>

**Who is hiding it?** `DISTINCT` — it masks the JOIN explosion happening underneath. Before DISTINCT, the result may have 500K rows (one per order-tag combination for VIP customers). DISTINCT then deduplicates them to 20K unique customer IDs. **When would removing DISTINCT break it?** Any SUM, COUNT, or AVG on this result — if you later add `SUM(orders.total)`, you'd sum each order N times (once per VIP tag on that order). **The performance trap:** The DB still materializes all 500K rows before DISTINCT eliminates them — wasted work. **Better alternatives:** (1) `EXISTS`: `SELECT DISTINCT customer_id FROM orders o WHERE EXISTS (SELECT 1 FROM tags t WHERE t.order_id = o.id AND t.name = 'VIP')` — stops at first matching tag per order. (2) Semi-join in subquery: `WHERE order_id IN (SELECT order_id FROM tags WHERE name = 'VIP')`. Both avoid materializing the full Cartesian result. **Lesson:** DISTINCT is often a code smell that signals a hidden fan-out JOIN. Always ask: "Why do I need DISTINCT here?"

</details>

## Scenario 35: COUNT(\*) on Billion-Row Table — 45-Minute Query

### SQL Solution

```sql
-- PROBLEM: Exact count requires scanning every row
SELECT COUNT(*) FROM events;  -- 45 minutes on 1.2B rows

-- FIX 1: Fast approximate count (PostgreSQL)
SELECT reltuples::BIGINT AS approx_count
FROM pg_class WHERE relname = 'events';
-- Instant! Accurate within 1-5% after recent ANALYZE

-- FIX 2: Counter cache table (maintained by triggers)
CREATE TABLE table_counts (
    table_name VARCHAR(50) PRIMARY KEY,
    row_count BIGINT DEFAULT 0
);

CREATE OR REPLACE FUNCTION update_count() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE table_counts SET row_count = row_count + 1 WHERE table_name = TG_TABLE_NAME;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE table_counts SET row_count = row_count - 1 WHERE table_name = TG_TABLE_NAME;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_count_trigger
AFTER INSERT OR DELETE ON events
FOR EACH ROW EXECUTE FUNCTION update_count();

-- Read count instantly:
SELECT row_count FROM table_counts WHERE table_name = 'events';

-- FIX 3: Partial count with conditions — use index
SELECT COUNT(*) FROM events WHERE created_at > '2025-03-01';
-- With index on created_at: scans only recent rows, much faster
```

### Spring Boot Cache for Counts

```java
@Service
public class EventService {

    @Cacheable(value = "eventCount", key = "'total'",
               unless = "#result == null")
    public Long getEventCount() {
        // Use approximate count for display purposes
        return jdbc.queryForObject(
            "SELECT reltuples::BIGINT FROM pg_class WHERE relname = 'events'",
            Long.class
        );
    }

    @CacheEvict(value = "eventCount", allEntries = true)
    @Scheduled(fixedRate = 60000)  // Refresh every minute
    public void refreshCount() {}
}
```

---

## Scenario 36: Pagination with OFFSET — Gets Slower Every Page

### 🔴 The Incident

Page 1 loads in 50ms. Page 100 loads in 3 seconds. Page 10,000 loads in 2 minutes. Users can't navigate past page 50.

### 5W-H Analysis

| Question  | Answer                                                                          |
| --------- | ------------------------------------------------------------------------------- |
| **What**  | `OFFSET 10000 LIMIT 20` must skip 10,000 rows THEN return 20 — the skip is O(n) |
| **Why**   | Database fetches and discards OFFSET rows before returning LIMIT rows           |
| **When**  | Any paginated list/API/feed with deep pages                                     |
| **Where** | All SQL databases — OFFSET is universally slow                                  |
| **Who**   | Every developer building list APIs                                              |
| **How**   | Keyset/Cursor pagination: `WHERE id > last_seen_id LIMIT 20`                    |

### SQL Solution

```sql
-- BAD: OFFSET pagination
SELECT * FROM products ORDER BY id LIMIT 20 OFFSET 200000;
-- Database: fetch 200,020 rows → throw away 200,000 → return 20
-- Time: 2.3 seconds (grows linearly with page number)

-- GOOD: Keyset pagination (cursor-based)
SELECT * FROM products WHERE id > 200000 ORDER BY id LIMIT 20;
-- Database: seek directly to id 200000 using index → return next 20
-- Time: 0.3ms (CONSTANT regardless of page number)

-- FOR MULTI-COLUMN SORT (e.g., ORDER BY created_at DESC, id DESC):
SELECT * FROM products
WHERE (created_at, id) < ('2025-03-07 15:30:00', 98765)
ORDER BY created_at DESC, id DESC
LIMIT 20;
-- Requires index: CREATE INDEX idx_prod_sort ON products(created_at DESC, id DESC);

-- FOR SEARCH + PAGINATION:
SELECT * FROM products
WHERE category = 'electronics'
  AND (created_at, id) < ('2025-03-07 15:30:00', 98765)
ORDER BY created_at DESC, id DESC
LIMIT 20;
-- Index: CREATE INDEX idx_prod_cat_sort ON products(category, created_at DESC, id DESC);

-- COMPARISON ON 10M ROWS:
-- OFFSET 0:       0.5ms    Keyset:  0.3ms
-- OFFSET 10,000:  120ms    Keyset:  0.3ms
-- OFFSET 100,000: 850ms    Keyset:  0.3ms
-- OFFSET 1M:      8.5s     Keyset:  0.3ms
```

### Spring Boot Cursor Pagination

```java
// Request DTO
public class CursorPageRequest {
    private String afterCursor;  // Base64 encoded (createdAt,id)
    private int limit = 20;
}

// Response DTO
public class CursorPage<T> {
    private List<T> items;
    private String nextCursor;
    private boolean hasMore;
}

@Repository
public class ProductCursorRepository {

    @Autowired
    private JdbcTemplate jdbc;

    public CursorPage<Product> findByCursor(String afterCursor, int limit) {
        List<Product> items;

        if (afterCursor == null) {
            items = jdbc.query(
                "SELECT * FROM products ORDER BY created_at DESC, id DESC LIMIT ?",
                productRowMapper, limit + 1  // Fetch 1 extra to check hasMore
            );
        } else {
            // Decode cursor → (timestamp, id)
            String[] parts = decodeCursor(afterCursor);
            items = jdbc.query(
                "SELECT * FROM products " +
                "WHERE (created_at, id) < (?, ?) " +
                "ORDER BY created_at DESC, id DESC LIMIT ?",
                productRowMapper,
                Timestamp.valueOf(parts[0]), Long.parseLong(parts[1]), limit + 1
            );
        }

        boolean hasMore = items.size() > limit;
        if (hasMore) items = items.subList(0, limit);

        String nextCursor = hasMore ?
            encodeCursor(items.get(items.size() - 1)) : null;

        return new CursorPage<>(items, nextCursor, hasMore);
    }
}
```

### DSA Connection

- **OFFSET = Skip list traversal** = O(n) to skip n nodes
- **Keyset = Binary search** = O(log n) seek to position
- **Cursor = Iterator pattern** = Maintains position state for O(1) next

---

## Scenario 37: Sorting Without Index — Filesort on Disk

### SQL Solution

```sql
-- PROBLEM:
EXPLAIN SELECT * FROM events ORDER BY created_at DESC LIMIT 100;
-- Sort Method: external merge (Disk), Sort Key: created_at
-- Sort Space Used: 2048MB  ← Entire table sorted on disk!

-- FIX: Index covers the sort
CREATE INDEX idx_events_created ON events(created_at DESC);

EXPLAIN SELECT * FROM events ORDER BY created_at DESC LIMIT 100;
-- Index Scan using idx_events_created (no sort needed!)
-- The index IS the sorted order

-- MULTI-COLUMN SORT: Index must match sort direction
-- Query: ORDER BY status ASC, created_at DESC
-- Index: CREATE INDEX idx ON events(status ASC, created_at DESC);
-- Wrong: CREATE INDEX idx ON events(status ASC, created_at ASC);  -- Sort still needed!

-- Increase sort memory if index isn't possible:
SET work_mem = '512MB';  -- Per-operation sort memory (PostgreSQL)
-- Keeps sort in memory instead of spilling to disk
```

---

## Scenario 38: Function on Indexed Column — Index Bypass

### SQL Solution

```sql
-- BAD: Function wraps indexed column
SELECT * FROM orders WHERE YEAR(created_at) = 2025;
-- Index on created_at CANNOT be used (function transforms each row)

-- GOOD: Rewrite as range condition
SELECT * FROM orders
WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01';
-- Index Scan! No function evaluation needed.

-- Common function traps:
WHERE UPPER(email) = 'JOHN@EXAMPLE.COM'  -- BAD
WHERE email = 'john@example.com'          -- GOOD (use case-insensitive collation)
-- Or: CREATE INDEX idx_email_lower ON users(LOWER(email));  -- Expression index

WHERE DATE(created_at) = '2025-03-08'     -- BAD
WHERE created_at >= '2025-03-08' AND created_at < '2025-03-09'  -- GOOD

WHERE CONCAT(first_name, ' ', last_name) = 'John Doe'  -- BAD
-- FIX: Generated column + index
ALTER TABLE users ADD COLUMN full_name VARCHAR(200)
    GENERATED ALWAYS AS (CONCAT(first_name, ' ', last_name)) STORED;
CREATE INDEX idx_full_name ON users(full_name);

-- PostgreSQL expression indexes (no generated column needed):
CREATE INDEX idx_lower_email ON users(LOWER(email));
SELECT * FROM users WHERE LOWER(email) = 'john@example.com';  -- Uses index!
```

---

## Scenario 39: Query Plan Regression After Statistics Update

### 🔴 The Incident

Query ran in 100ms for months. After `ANALYZE` (statistics refresh), same query now takes 30 seconds. The optimizer chose a different plan based on new statistics.

### SQL Solution

```sql
-- Diagnose: Compare old and new plans
-- PostgreSQL: View planner's cost estimates
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) SELECT ...;

-- Force the old plan (emergency fix):
-- PostgreSQL: Disable specific plan types
SET enable_seqscan = OFF;        -- Force index scan
SET enable_hashjoin = OFF;        -- Force nested loop join
SET enable_mergejoin = OFF;

-- Then re-enable after fixing root cause:
RESET ALL;

-- MySQL: Use index hints
SELECT /*+ INDEX(orders idx_customer_date) */ *
FROM orders WHERE customer_id = 5;

-- Or force specific join order:
SELECT /*+ JOIN_ORDER(orders, customers) */ *
FROM orders JOIN customers ON ...;

-- ROOT CAUSE FIX: Update statistics more accurately
ANALYZE orders;  -- Refresh statistics
-- For skewed data, increase statistics target:
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;  -- Default 100
ANALYZE orders;

-- PostgreSQL: Pin a good plan using pg_hint_plan extension
/*+ SeqScan(users) IndexScan(orders idx_orders_customer) */
SELECT * FROM users u JOIN orders o ON o.customer_id = u.id;
```

---

## Scenario 40: Temp Table Spill to Disk — Insufficient work_mem

### SQL Solution

```sql
-- PROBLEM: Sort/Hash operations exceed memory, spill to disk
EXPLAIN (ANALYZE, BUFFERS)
SELECT customer_id, SUM(total) FROM orders GROUP BY customer_id;
-- Sort Method: external merge  Disk: 1024MB  ← SLOW!

-- FIX: Increase work_mem for this session
SET work_mem = '512MB';
-- Now: Sort Method: quicksort  Memory: 450MB  ← In-memory, fast!
RESET work_mem;

-- Don't set globally too high: work_mem × max_connections × sorts_per_query
-- 512MB × 100 connections × 3 sorts = 150GB — OOM!

-- Per-query adjustment in Spring Boot:
-- jdbc.execute("SET LOCAL work_mem = '256MB'");
-- jdbc.query("SELECT ...");
-- Transaction end automatically resets
```

---

## Scenarios 41–50: Quick-Fire Query Optimization

### Scenario 41: Connection Pool Exhaustion

```java
// PROBLEM: All connections busy, new requests wait/timeout
// Spring Boot detection:
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      leak-detection-threshold: 30000  #  Warns if connection held > 30s
      connection-timeout: 5000

// FIX: Find leaked connections
@Scheduled(fixedRate = 10000)
public void checkPool() {
    HikariPool pool = (HikariPool) dataSource.unwrap(HikariDataSource.class).getHikariPoolMXBean();
    log.info("Pool: active={}, idle={}, waiting={}",
        pool.getActiveConnections(), pool.getIdleConnections(), pool.getThreadsAwaitingConnection());

    if (pool.getThreadsAwaitingConnection() > 5) {
        log.error("CONNECTION POOL EXHAUSTION IMMINENT!");
    }
}
```

### Scenario 42: Cartesian Product from Missing JOIN Condition

```sql
-- PROBLEM: Forgot the ON clause
SELECT u.name, o.total FROM users u, orders o;
-- 10,000 users × 50,000 orders = 500,000,000 rows!

-- MySQL: Enable strict mode to catch old-style joins
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,ONLY_FULL_GROUP_BY';

-- FIX: Always use explicit JOIN
SELECT u.name, o.total FROM users u JOIN orders o ON o.customer_id = u.id;
```

### Scenario 43: NOT IN with NULL — Returns Zero Rows

```sql
-- PROBLEM: NOT IN fails silently when subquery contains NULL
SELECT * FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders);
-- If ANY customer_id in orders is NULL, this returns EMPTY RESULT!
-- Reason: NULL comparisons always return UNKNOWN, NOT IN requires ALL TRUE

-- FIX: Use NOT EXISTS
SELECT * FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
-- Correctly handles NULLs

-- FIX 2: Exclude NULLs explicitly
SELECT * FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders WHERE customer_id IS NOT NULL);
```

### Scenario 44: Index-Only Scan Prevented by Visibility Check

```sql
-- PostgreSQL: Index-only scan should be instant but hits heap anyway
EXPLAIN ANALYZE SELECT customer_id FROM orders WHERE customer_id = 5;
-- Index Only Scan ... heap fetches: 45000  ← Reading heap for visibility!

-- WHY: PostgreSQL visibility map not updated. Dead tuples need VACUUM.
VACUUM orders;
-- Now: heap fetches: 0  ← True index-only scan!
```

### Scenario 45: Multi-Table JOIN Producing 100M Intermediate Rows

```sql
-- PROBLEM: 5-table join explodes before final GROUP BY reduces it
SELECT c.name, COUNT(*)
FROM customers c
JOIN orders o ON ...
JOIN order_items oi ON ...
JOIN products p ON ...
JOIN categories cat ON ...
GROUP BY c.name;

-- FIX: Pre-aggregate before joining
WITH order_counts AS (
    SELECT customer_id, COUNT(*) AS cnt
    FROM orders GROUP BY customer_id
)
SELECT c.name, oc.cnt
FROM customers c JOIN order_counts oc ON oc.customer_id = c.id;
```

### Scenario 46: Subquery in SELECT List — Hidden N+1

```sql
-- PROBLEM: Subquery in SELECT runs once per row
SELECT
    o.id,
    (SELECT name FROM customers WHERE id = o.customer_id) AS customer_name,
    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
FROM orders o;
-- 50,000 orders × 2 subqueries = 100,000 extra queries!

-- FIX: Use JOINs
SELECT o.id, c.name, COALESCE(ic.item_count, 0) AS item_count
FROM orders o
JOIN customers c ON c.id = o.customer_id
LEFT JOIN (
    SELECT order_id, COUNT(*) AS item_count FROM order_items GROUP BY order_id
) ic ON ic.order_id = o.id;
```

### Scenario 47: UNION vs UNION ALL — Accidental Dedup

```sql
-- PROBLEM: UNION sorts and deduplicates (expensive)
SELECT id, name FROM active_users
UNION
SELECT id, name FROM archived_users;
-- Sort 10M rows for dedup when there are no duplicates!

-- FIX: Use UNION ALL when duplicates are impossible/acceptable
SELECT id, name FROM active_users
UNION ALL
SELECT id, name FROM archived_users;
-- No sort, no dedup — 10x faster
```

### Scenario 48: Prepared Statement Plan Cache Bloat

```sql
-- PostgreSQL: 10,000 different query patterns cached
SELECT count(*) FROM pg_prepared_statements;

-- Deallocate unused plans:
DEALLOCATE ALL;

-- Or set auto-limit:
ALTER SYSTEM SET plan_cache_mode = 'force_custom_plan';  -- Disables caching
-- Better: fix application to use parameterized queries (share plans)
```

### Scenario 49: Lock Wait from Unindexed FK Update

```sql
-- PROBLEM: UPDATE on parent table, child table has FK without index
UPDATE customers SET status = 'inactive' WHERE id = 5;
-- MySQL locks ENTIRE child table scanning for FK violations!

-- FIX: Index the foreign key column
CREATE INDEX idx_orders_customer ON orders(customer_id);
-- Now: only locks matching rows, not entire table
```

### Scenario 50: Dashboard Queries Running Every 5 Seconds Per User

```sql
-- PROBLEM: 500 users × dashboard refresh every 5s = 100 queries/second
-- Same 10 queries repeated 100×/second

-- FIX: Materialized view refreshed every minute
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
    COUNT(*) FILTER (WHERE status = 'active') AS active_orders,
    SUM(total) FILTER (WHERE created_at > CURRENT_DATE) AS today_revenue,
    COUNT(DISTINCT customer_id) AS unique_customers_today
FROM orders WHERE created_at > CURRENT_DATE - INTERVAL '30 days';

REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
-- 500 users all read from the materialized view = 0 query load
```

### Spring Boot Dashboard Cache

```java
@Service
public class DashboardService {

    @Cacheable(value = "dashboard", key = "#tenantId")
    public DashboardStats getDashboard(Long tenantId) {
        return jdbc.queryForObject(
            "SELECT * FROM dashboard_stats WHERE tenant_id = ?",
            dashboardMapper, tenantId
        );
    }

    @Scheduled(fixedRate = 60000)  // Refresh materialized view every 60s
    @CacheEvict(value = "dashboard", allEntries = true)
    public void refreshDashboard() {
        jdbc.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats");
    }
}
```

---

## 🧠 DSA Patterns Behind Query Optimization

| Scenario              | DSA Pattern                                            |
| --------------------- | ------------------------------------------------------ |
| SELECT \* waste       | **Pruning** — skip unnecessary branches                |
| N+1 queries           | **Batching** — batch lookups with HashMap              |
| Missing index         | **Binary Search vs Linear Scan** — O(log n) vs O(n)    |
| Composite index order | **Trie / Multi-level sort** — prefix matching          |
| LIKE %text%           | **Inverted index** — pre-process for substring search  |
| Correlated subquery   | **Nested loops → HashJoin** — O(n²) → O(n)             |
| OFFSET pagination     | **Array index vs linked list traverse** — O(1) vs O(n) |
| Keyset pagination     | **BST seek** — start from a known position             |
| COUNT(\*) cache       | **Memoization** — store computed results               |
| JOIN explosion        | **Early termination** — aggregate before expanding     |

---

[⬅ Previous: 38_RealWorld_Production_Scenarios_Part1](38_RealWorld_Production_Scenarios_Part1.md) | [📚 Index](00_INDEX.md) | [Next: 40_RealWorld_Production_Scenarios_Part3 ➡](40_RealWorld_Production_Scenarios_Part3.md)

### Historical Evolution

**Predecessors (with years):**
- **Gavin King (2001)**: Created Hibernate — the ORM that popularized the N+1 query problem by making lazy loading the default, silently generating hundreds of queries from one entity access
- **SQL practitioners (pre-2000s)**: SELECT * became ubiquitous as a shorthand — developers debugged by seeing all columns; the network and memory cost was not measured until web scale
- **PostgreSQL Global Development Group (2000)**: PostgreSQL 7.0 introduced EXPLAIN ANALYZE — making query plans observable for the first time to non-DBA developers

**Evolution narrative:**
Query performance problems are as old as SQL itself. Early databases ran on expensive mainframes where every query was scrutinized. The PC era (1990s) democratized databases but also democratized bad patterns: SELECT * for convenience, no indexes because "disk is cheap," and ORMs that abstracted away the SQL generation. Hibernate (2001) was a productivity revolution that also became the N+1 query factory — developers who never saw the SQL it generated had no reason to worry about 1000 queries per page. The EXPLAIN ANALYZE command existed in commercial databases but PostgreSQL's open-source EXPLAIN made plan analysis accessible to everyone.

**Modern practice anchor:**
Today, every major ORM (Hibernate, Django, ActiveRecord, EF Core) includes query logging, N+1 detection tools, and JOIN FETCH / eager loading options — a direct response to the decade of production pain caused by these patterns.


---

## Reality Check

**"Database locks are always a problem"** ? Locks are the mechanism that ensures data consistency. A SELECT FOR UPDATE correctly locks a row during a read-modify-write cycle to prevent lost updates. The problem is UNINTENDED locks: queries that accidentally lock entire tables (missing index causes table scan with row locks escalating to table lock), or transactions held open during user think-time. Understand lock GRANULARITY (row vs page vs table) and lock DURATION (transaction scope).

**"Connection pooling is a set-and-forget configuration"** ? Pool size depends on: concurrent request count, average query duration, and database max_connections. A pool of 50 connections with queries averaging 10ms handles 5000 queries per second. But if one slow query takes 5 seconds, it holds a connection for 500x longer, starving other requests. Monitor pool utilization, wait time, and timeout events. Adjust pool size based on production metrics, not defaults.

**"Schema migrations should run during deployments"** ? Large-scale migrations (adding a column to a billion-row table, rebuilding an index) can take hours and lock the table. Running them during deployment means the deployment takes hours or the application serves errors during migration. Separate schema migrations from application deployments: migrate first with backward-compatible changes, deploy new code that uses the new schema, then clean up the old schema in a subsequent migration.

**"Deadlocks are rare and can be ignored"** ? Deadlocks occur when two transactions wait for each other's locks. The database automatically detects and kills one (the victim). In high-concurrency systems, deadlocks happen multiple times per minute. The application must: catch the deadlock exception, retry the transaction, and log the occurrence. Consistent lock ordering (always update tables in the same order across transactions) prevents most deadlocks.

**"Partitioning makes queries faster"** ? Partitioning by range (e.g., by month) speeds up queries that include the partition key in the WHERE clause because the optimizer skips irrelevant partitions (partition pruning). But queries WITHOUT the partition key scan ALL partitions — potentially slower than a single-table index scan. Partition only tables where queries consistently filter by the partition key and where the table is too large for indexes alone.
