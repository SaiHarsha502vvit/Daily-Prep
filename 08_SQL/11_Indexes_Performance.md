> **SQL Chapter 11/20** | [← Previous](10_Normalization.md) | [Index](../00_MASTER_INDEX.md) | [Next →](12_Views_StoredProcs_Triggers.md)

---

## Chapter 11: Indexes & Query Performance

### Index Types

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE INDEXES                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  INDEX = Data structure that improves query speed (like book index)             │
│                                                                                  │
│  WITHOUT INDEX (Full Table Scan):                                               │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  SELECT * FROM employees WHERE last_name = 'Kumar';                        ││
│  │                                                                            ││
│  │  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐                               ││
│  │  │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │10 │  ← Check EVERY row            ││
│  │  └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘    (O(n) - slow!)              ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  WITH INDEX (B-Tree Search):                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                     ┌─────────────┐                                        ││
│  │                     │   [K-P]     │ ← Root: Is 'Kumar' < 'K' or > 'P'?     ││
│  │                     └──────┬──────┘                                        ││
│  │              ┌─────────────┼─────────────┐                                 ││
│  │         ┌────▼────┐   ┌────▼────┐   ┌────▼────┐                            ││
│  │         │ [A-J]   │   │ [K-P]   │   │ [Q-Z]   │ ← Navigate down            ││
│  │         └─────────┘   └────┬────┘   └─────────┘                            ││
│  │                            ▼                                               ││
│  │                    ┌───────────────┐                                       ││
│  │                    │ Kumar → Row 5 │ ← Found! (O(log n) - fast!)           ││
│  │                    └───────────────┘                                       ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│                                                                                  │
│  INDEX TYPES:                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  Type          │ Description                        │ Use Case             ││
│  ├────────────────┼────────────────────────────────────┼──────────────────────┤│
│  │ B-Tree         │ Balanced tree, default type        │ Most queries         ││
│  │ Hash           │ Hash table lookup                  │ Exact match only     ││
│  │ Full-Text      │ Text search with stemming          │ Search in documents  ││
│  │ Spatial/GiST   │ Geographic data                    │ Location queries     ││
│  │ Composite      │ Multiple columns                   │ Multi-column WHERE   ││
│  │ Covering       │ Includes all needed columns        │ Avoid table access   ││
│  │ Partial        │ Index subset of rows               │ Filtered data        ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
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

