> **SQL Chapter 11/20** | [← Previous](10_Normalization.md) | [Index](../00_MASTER_INDEX.md) | [Next →](12_Views_StoredProcs_Triggers.md)

---

## Chapter 11: Indexes & Query Performance

### 🧠 Understanding Indexes — Why They Exist and How They Work

An index is a **separate data structure** that the database maintains alongside your table, specifically designed to speed up data retrieval. Without an index, finding a row requires a **full table scan** — the database reads every single row, one by one, checking if it matches your WHERE clause. For a table with 10 million rows, this means reading 10 million rows even if only one matches.

With an index, the database can jump directly to the matching rows, just like a book's index lets you jump to the right page instead of reading every page.

#### How B-Tree Indexes Actually Work

The most common index type is the **B-Tree** (Balanced Tree). Understanding its structure explains _why_ certain queries use indexes and others don't:

A B-Tree organizes data into a **hierarchy of sorted pages**. Each page holds multiple keys and pointers. Starting from the root, the database compares your search value against the keys in each page to decide which child page to visit next. This process repeats until it reaches a leaf page containing the actual row location.

**Key Properties:**

- The tree is always **balanced** — every path from root to leaf is the same length. This guarantees O(log n) lookups regardless of data distribution.
- Leaf pages are **linked together** in sorted order, which makes range queries (`BETWEEN`, `<`, `>`) efficient — once you find the start of the range, you just follow the linked list.
- For a table with 10 million rows, a B-Tree typically has **3-4 levels**. This means finding any row requires only 3-4 disk reads, instead of millions.

#### The Read-Write Trade-Off — Indexes Are NOT Free

Every index you create has a cost:

- **Storage:** An index is a copy of the indexed column(s) plus pointers, stored in a separate B-Tree structure. Multiple indexes on a large table can collectively be larger than the table itself.
- **Write Overhead:** Every `INSERT`, `UPDATE`, or `DELETE` on the table must also update every index that references the affected columns. If a table has 5 indexes and you insert 1 row, the database performs 6 write operations (1 table + 5 indexes).
- **Maintenance:** Indexes can become **fragmented** over time as data is inserted and deleted, requiring periodic rebuilding.

> 💡 **Rule of Thumb:** Index columns that are frequently used in `WHERE`, `JOIN`, and `ORDER BY` clauses. Don't index columns that are rarely queried or frequently updated. For write-heavy tables (logging, event tracking), keep indexes minimal.

#### Index Selectivity — Why Some Indexes Are Useless

**Selectivity** is the ratio of distinct values to total rows. A column with high selectivity (many unique values, like `email` or `user_id`) makes an excellent index candidate because each lookup narrows down to very few rows.

A column with low selectivity (few unique values, like `gender` with only `M`/`F`/`O`) makes a **terrible** index. If 50% of rows are `M`, the database would still need to read half the table — at that point, a full table scan is actually faster because it avoids the overhead of jumping between index and table pages.

| Column      | Distinct Values | Selectivity | Worth Indexing?                                            |
| ----------- | --------------- | ----------- | ---------------------------------------------------------- |
| `user_id`   | 10,000,000      | Very High   | ✅ Yes — each lookup returns 1 row                         |
| `email`     | 9,800,000       | Very High   | ✅ Yes — nearly unique                                     |
| `city`      | 5,000           | Medium      | ⚠️ Maybe — depends on query patterns                       |
| `gender`    | 3               | Very Low    | ❌ No — each value matches ~33% of rows                    |
| `is_active` | 2               | Very Low    | ❌ No (unless using **partial index** on just active rows) |

#### Composite Indexes — Column Order Is Everything

A composite index on `(dept_id, salary)` is sorted **first by dept_id, then by salary within each dept_id**. Think of it like a phone book sorted by last name, then first name. This means:

- ✅ `WHERE dept_id = 1` — uses the index (leftmost column)
- ✅ `WHERE dept_id = 1 AND salary > 50000` — uses the index (both columns, in order)
- ❌ `WHERE salary > 50000` — **cannot use this index!** (skipping the leftmost column is like trying to find everyone named "John" in a phone book sorted by last name — you'd have to scan the entire book)

This is called the **leftmost prefix rule** and is one of the most commonly misunderstood aspects of database indexing.

---

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE INDEXES                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  INDEX = Data structure that improves query speed (like book index)             │
│                                                                                 │
│  WITHOUT INDEX (Full Table Scan):                                               │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  SELECT * FROM employees WHERE last_name = 'Kumar';                        │ │
│  │                                                                            │ │
│  │  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐                               │   │
│  │  │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │10 │  ← Check EVERY row            │   │
│  │  └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘    (O(n) - slow!)              │  │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  WITH INDEX (B-Tree Search):                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                     ┌─────────────┐                                        │ │
│  │                     │   [K-P]     │ ← Root: Is 'Kumar' < 'K' or > 'P'?     │ │
│  │                     └──────┬──────┘                                        │ │
│  │              ┌─────────────┼─────────────┐                                 │ │
│  │         ┌────▼────┐   ┌────▼────┐   ┌────▼────┐                            │ │
│  │         │ [A-J]   │   │ [K-P]   │   │ [Q-Z]   │ ← Navigate down            │ │
│  │         └─────────┘   └────┬────┘   └─────────┘                            │ │
│  │                            ▼                                               │ │
│  │                    ┌───────────────┐                                       │ │
│  │                    │ Kumar → Row 5 │ ← Found! (O(log n) - fast!)           │ │
│  │                    └───────────────┘                                       │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│                                                                                 │
│  INDEX TYPES:                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  Type          │ Description                        │ Use Case             │ │
│  ├────────────────┼────────────────────────────────────┼──────────────────────┤ │
│  │ B-Tree         │ Balanced tree, default type        │ Most queries         │ │
│  │ Hash           │ Hash table lookup                  │ Exact match only     │ │
│  │ Full-Text      │ Text search with stemming          │ Search in documents  │ │
│  │ Spatial/GiST   │ Geographic data                    │ Location queries     │ │
│  │ Composite      │ Multiple columns                   │ Multi-column WHERE   │ │
│  │ Covering       │ Includes all needed columns        │ Avoid table access   │ │
│  │ Partial        │ Index subset of rows               │ Filtered data        │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- CREATING AND MANAGING INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Single column index
CREATE INDEX idx_emp_lastname ON employees(last_name);

-- Composite index (column order matters!)
CREATE INDEX idx_emp_dept_salary ON employees(dept_id, salary);
-- Good for: WHERE dept_id = 1 AND salary > 50000
-- Good for: WHERE dept_id = 1  (leftmost column)
-- BAD for: WHERE salary > 50000  (doesn't use index!)

-- Unique index
CREATE UNIQUE INDEX idx_emp_email ON employees(email);

-- Descending index (for ORDER BY DESC queries)
CREATE INDEX idx_orders_date_desc ON orders(order_date DESC);

-- Partial index (PostgreSQL) - index only relevant rows
CREATE INDEX idx_active_orders ON orders(order_date)
WHERE status = 'active';

-- Full-text index (MySQL)
CREATE FULLTEXT INDEX idx_product_search ON products(name, description);

-- Using full-text search
SELECT * FROM products
WHERE MATCH(name, description) AGAINST('laptop gaming' IN NATURAL LANGUAGE MODE);


-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEX MAINTENANCE
-- ═══════════════════════════════════════════════════════════════════════════════

-- View indexes on a table
SHOW INDEX FROM employees;  -- MySQL
-- PostgreSQL:
SELECT * FROM pg_indexes WHERE tablename = 'employees';

-- Drop index
DROP INDEX idx_emp_lastname ON employees;  -- MySQL
DROP INDEX IF EXISTS idx_emp_lastname;      -- PostgreSQL

-- Rebuild/Optimize index
ALTER INDEX idx_emp_lastname REBUILD;  -- PostgreSQL
OPTIMIZE TABLE employees;               -- MySQL (rebuilds indexes)


-- ═══════════════════════════════════════════════════════════════════════════════
-- WHEN TO INDEX / NOT INDEX
-- ═══════════════════════════════════════════════════════════════════════════════

/*
CREATE INDEX when:
✓ Column used in WHERE clauses frequently
✓ Column used in JOIN conditions
✓ Column used in ORDER BY
✓ Column with high cardinality (many unique values)
✓ Foreign key columns

DON'T index when:
✗ Small tables (full scan is fast enough)
✗ Columns rarely used in queries
✗ Columns with low cardinality (e.g., gender: M/F)
✗ Tables with heavy INSERT/UPDATE/DELETE
✗ Columns frequently updated

REMEMBER: Indexes speed up reads but slow down writes!
*/
```

### Query Execution Plans

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- EXPLAIN - UNDERSTANDING QUERY EXECUTION
-- ═══════════════════════════════════════════════════════════════════════════════

-- MySQL EXPLAIN
EXPLAIN SELECT * FROM employees WHERE last_name = 'Kumar';

/*
Output:
+----+-------------+-----------+------+---------------+------+---------+------+------+-------------+
| id | select_type | table     | type | possible_keys | key  | key_len | ref  | rows | Extra       |
+----+-------------+-----------+------+---------------+------+---------+------+------+-------------+
| 1  | SIMPLE      | employees | ref  | idx_lastname  | idx..| 202     | const| 5    | Using index |
+----+-------------+-----------+------+---------------+------+---------+------+------+-------------+

KEY COLUMNS:
- type: Access method (best to worst)
  ALL        : Full table scan (BAD!)
  index      : Full index scan
  range      : Index range scan (BETWEEN, <, >)
  ref        : Index lookup for non-unique values
  eq_ref     : Index lookup for unique values (best for JOINs)
  const      : Single row lookup by PK (best!)

- key: Which index is used (NULL = no index used)
- rows: Estimated rows to examine
- Extra: Additional info
  Using index      : Covered by index (good!)
  Using where      : Additional filtering needed
  Using filesort   : Sorting without index (slow)
  Using temporary  : Temp table needed (slow)
*/

-- More detailed explain
EXPLAIN ANALYZE SELECT * FROM employees WHERE last_name = 'Kumar';

-- PostgreSQL
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM employees WHERE last_name = 'Kumar';


-- ═══════════════════════════════════════════════════════════════════════════════
-- QUERY OPTIMIZATION EXAMPLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- BAD: Function on indexed column (can't use index)
SELECT * FROM employees WHERE YEAR(hire_date) = 2023;

-- GOOD: Range query (uses index)
SELECT * FROM employees
WHERE hire_date >= '2023-01-01' AND hire_date < '2024-01-01';


-- BAD: Leading wildcard (can't use index)
SELECT * FROM products WHERE name LIKE '%phone%';

-- GOOD: Trailing wildcard (uses index)
SELECT * FROM products WHERE name LIKE 'phone%';


-- BAD: Implicit conversion (index might not be used)
SELECT * FROM employees WHERE emp_code = 123;  -- emp_code is VARCHAR

-- GOOD: Match data types
SELECT * FROM employees WHERE emp_code = '123';


-- BAD: OR can prevent index usage
SELECT * FROM employees WHERE dept_id = 1 OR dept_id = 2;

-- GOOD: Use IN instead
SELECT * FROM employees WHERE dept_id IN (1, 2);


-- BAD: Not using covering index
SELECT * FROM employees WHERE dept_id = 1;

-- GOOD: Select only indexed columns (index-only scan)
SELECT emp_id, dept_id FROM employees WHERE dept_id = 1;
```

---

> 🔬 **Section Challenge — B-Tree Internals & EXPLAIN Analysis**
>
> **Challenge 1 (The Leading Edge Trap):** You have a composite B-Tree index on `(last_name, first_name, date_of_birth)`. You run `SELECT * FROM employees WHERE first_name = 'John' AND date_of_birth = '1990-01-01'`. The DBA points to the `EXPLAIN` output showing a `Seq Scan` (or `ALL` access type in MySQL) and says your query is bypassing the index. Why does this happen mechanically within the B-Tree?
>
> <details><summary>Answer</summary>
>
> This happens because of the **Leftmost Prefix Rule**. A composite B-Tree is sorted hierarchically: it orders all rows by `last_name` first, and only orders by `first_name` _within_ identical last names. Without providing the `last_name` in the `WHERE` clause, the database has no starting node to navigate the tree's branches. It's mathematically identical to searching for a first name "John" in a physical phone book—you must scan every single page.
>
> **The Fix:** You must either include the leading column (`last_name`) in your query predicates, or create a secondary index where `first_name` is the leading edge.
>
> </details>

---

> **Navigation**: [< Previous](10_Normalization.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](12_Views_StoredProcs_Triggers.md)

### Historical Evolution

**Predecessors (with years):**
- **Bayer & McCreight** (1972): Invented the B-tree (Balanced Tree) data structure — the foundational index structure for virtually every database system, enabling O(log n) lookups regardless of data distribution.
- **IBM System R** (1974–1979): Implemented the first B-tree indexes in a production DBMS, demonstrating that indexes could dramatically speed up queries while remaining practical to maintain under insertions and deletions.
- **Litwin** (1980): Introduced the first extendible hash index — enabling dynamic hash tables that grew gracefully with data, the ancestor of modern hash indexes used for equality lookups.
- **Stonebraker (GiST)** (1995): The Generalized Search Tree (GiST) in PostgreSQL provided an extensible index infrastructure supporting geometric, full-text, and custom data types — transforming indexes from pure B-trees to a pluggable framework.
- **O'Neil et al.** (1996): Introduced the LSM-tree (Log-Structured Merge-tree) — the index structure underlying LevelDB, RocksDB, Cassandra, and ScyllaDB, optimized for write-heavy workloads where B-trees incur excessive write amplification.
- **PostgreSQL GIN** (2006): Generalized Inverted Index supporting array containment queries and full-text search — the index behind modern JSON and array column types.

**Evolution narrative:**
Bayer and McCreight invented B-trees in 1972 — before relational databases existed — as a way to maintain sorted data on disk with guaranteed balanced search depth. System R adopted B-trees as its index structure and the combination proved so effective that it persists today in every major database (InnoDB, PostgreSQL, Oracle, SQL Server all use B-trees as the default). The key insight was that a B-tree's leaf nodes are linked in sorted order, making range queries (BETWEEN, <, >) almost as fast as point queries — a property no other data structure offered. Hash indexes (Litwin 1980) were faster for exact-match lookups but couldn't handle ranges, creating the split that persists today: B-tree for general use, hash for specialized key-value stores. The LSM-tree's arrival in 1996 was a response to write-intensive workloads (time-series, logging) where B-trees were write-amplified — each update rewrote multiple tree levels. LSM-trees batch writes into memtables and merge them asynchronously, achieving 10x write throughput at the cost of slower point reads. GiST and GIN extended the index concept beyond scalar types, enabling PostgreSQL to index geometric objects, documents, and JSON natively.

**Modern practice anchor:**
Today, every database performance interview tests B-tree index understanding — composite index column ordering, covering indexes, and the leftmost prefix rule — all direct descendants of Bayer and McCreight's 1972 paper. Production systems at companies like Stripe and Shopify still tune their read/write ratios using B-tree vs LSM-tree trade-offs.

### Production Reality

**Failure modes:**
1. **Missing index causing full table scan on 500M rows**: A `SELECT * FROM events WHERE user_id = 12345 AND event_type = 'purchase'` on a 500M-row table without an index on `(user_id, event_type)` does a full sequential scan — 8-12 seconds per query, 40,000 IOPS consumption. Stripe's 2018 incident where a migration removed an index on `balance_transactions.account_id` caused 3-hour query latency spikes affecting payment processing globally.
2. **Function on indexed column disabling index (LOWER/upper/date functions)**: `WHERE LOWER(email) = 'user@example.com'` prevents the B-tree index on `email` from being used — the database must apply LOWER() to every row. On 50M users, this is a full table scan. Fix: use expression indexes `CREATE INDEX ON users (LOWER(email))` or enforce case-insensitive storage (varchar collation).
3. **Leading wildcard LIKE '%pattern%' preventing index use**: `WHERE name LIKE '%phone%'` cannot use a B-tree index. A 2019 Cloudflare performance incident was partly caused by application search queries using leading wildcards on million-row tables, forcing full scans that saturated database CPU.

**Debug workflow:**
(1) Check `pg_stat_user_tables` for `seq_scan vs idx_scan` ratios — if `seq_scan > idx_scan` on a large table, add indexes.
(2) Run `EXPLAIN (ANALYZE, BUFFERS)` and look for `Seq Scan` on large tables. For composite indexes, verify the `key` column in EXPLAIN output matches the leftmost prefix of your index.
(3) For function-wrapped WHERE clauses, check if an expression index exists: `SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname LIKE '%lower%'`. If missing, create one matching the exact expression used in queries.

**Modern practice anchor:**
Today, Percona's PMM, Datadog's database monitoring, and PostgreSQL's `pg_stat_statements` automatically surface missing index candidates by comparing seq_scan frequency against table size — catching the Stripe-style index removal incident in staging before it reaches production.
