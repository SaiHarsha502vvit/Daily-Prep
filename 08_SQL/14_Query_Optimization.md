> **SQL Chapter 14/20** | [← Previous](13_Transactions_ACID.md) | [Index](../00_MASTER_INDEX.md) | [Next →](15_Analytics_Warehousing_ETL.md)

---

## Chapter 16: Query Optimization & Execution Plans

### Query Optimization Strategies

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    QUERY OPTIMIZATION CHECKLIST                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. SELECT ONLY WHAT YOU NEED                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  BAD:  SELECT * FROM large_table WHERE id = 1;                             │ │
│  │  GOOD: SELECT id, name, email FROM large_table WHERE id = 1;               │ │
│  │                                                                            │ │
│  │  Why: Less data transfer, possible covering index usage                    │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  2. USE PROPER INDEXES                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  • Index columns in WHERE, JOIN, ORDER BY                                  │ │
│  │  • Composite indexes for multi-column filters                              │ │
│  │  • Covering indexes to avoid table lookups                                 │ │
│  │  • But don't over-index (hurts writes)                                     │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  3. AVOID FUNCTIONS ON INDEXED COLUMNS                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  BAD:  WHERE YEAR(created_at) = 2024                                       │ │
│  │  GOOD: WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'      │ │
│  │                                                                            │ │
│  │  BAD:  WHERE LOWER(email) = 'test@example.com'                             │ │
│  │  GOOD: Create functional index or store lowercase version                  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  4. USE JOINS INSTEAD OF SUBQUERIES (when possible)                             │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  BAD:  WHERE id IN (SELECT id FROM other_table WHERE ...)                  │ │
│  │  GOOD: JOIN other_table ON ... WHERE ...                                   │ │
│  │                                                                            │ │
│  │  (Modern optimizers often rewrite, but explicit JOINs are clearer)         │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  5. LIMIT EARLY                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  • Use LIMIT to reduce result set                                          │ │
│  │  • Filter in subqueries before joins                                       │ │
│  │  • Use EXISTS instead of COUNT(*) for existence checks                     │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  6. BATCH OPERATIONS                                                            │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  • INSERT multiple rows in single statement                                │ │
│  │  • DELETE/UPDATE in batches with LIMIT                                     │ │
│  │  • Use transactions for related operations                                 │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- QUERY OPTIMIZATION EXAMPLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- EXAMPLE 1: Avoid SELECT *
-- BAD
SELECT * FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.customer_id = 123;

-- GOOD
SELECT o.order_id, o.order_date, o.total, oi.product_id, oi.quantity
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.customer_id = 123;


-- EXAMPLE 2: Optimize EXISTS vs IN vs JOIN
-- For checking existence (best)
SELECT c.* FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);

-- For getting matching records
SELECT DISTINCT c.* FROM customers c
JOIN orders o ON o.customer_id = c.customer_id;

-- IN works well for small lists
SELECT * FROM products WHERE category_id IN (1, 2, 3);


-- EXAMPLE 3: Optimize COUNT
-- BAD - counts all rows then compares
SELECT * FROM orders WHERE (SELECT COUNT(*) FROM order_items WHERE order_id = orders.order_id) > 5;

-- GOOD - stops at 6
SELECT * FROM orders o
WHERE EXISTS (
    SELECT 1 FROM order_items oi
    WHERE oi.order_id = o.order_id
    GROUP BY oi.order_id
    HAVING COUNT(*) > 5
);


-- EXAMPLE 4: Optimize OR conditions
-- BAD (may not use index efficiently)
SELECT * FROM products WHERE category_id = 1 OR category_id = 2 OR price < 100;

-- GOOD (can use indexes)
SELECT * FROM products WHERE category_id IN (1, 2)
UNION ALL
SELECT * FROM products WHERE category_id NOT IN (1, 2) AND price < 100;


-- EXAMPLE 5: Pre-filter before JOIN
-- BAD
SELECT c.name, o.order_date, o.total
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_date >= '2024-01-01' AND c.country = 'India';

-- GOOD (filter first, then join)
SELECT c.name, o.order_date, o.total
FROM (SELECT * FROM customers WHERE country = 'India') c
JOIN (SELECT * FROM orders WHERE order_date >= '2024-01-01') o
ON c.customer_id = o.customer_id;


-- EXAMPLE 6: Pagination optimization
-- BAD for large offsets
SELECT * FROM products ORDER BY product_id LIMIT 10 OFFSET 100000;  -- Slow!

-- GOOD - use keyset pagination
SELECT * FROM products
WHERE product_id > 100000  -- Last seen ID
ORDER BY product_id
LIMIT 10;


-- EXAMPLE 7: Batch inserts
-- BAD (100 separate inserts)
INSERT INTO logs (message) VALUES ('Log 1');
INSERT INTO logs (message) VALUES ('Log 2');
-- ... 98 more

-- GOOD (single insert)
INSERT INTO logs (message) VALUES
    ('Log 1'), ('Log 2'), ('Log 3'), ... , ('Log 100');


-- EXAMPLE 8: Batch deletes
-- BAD (locks table for long time)
DELETE FROM old_logs WHERE created_at < '2023-01-01';  -- Millions of rows!

-- GOOD (delete in batches)
REPEAT
    DELETE FROM old_logs
    WHERE created_at < '2023-01-01'
    LIMIT 10000;
UNTIL ROW_COUNT() = 0 END REPEAT;


-- ═══════════════════════════════════════════════════════════════════════════════
-- READING EXECUTION PLANS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Get execution plan
EXPLAIN ANALYZE
SELECT e.*, d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
WHERE e.salary > 80000;

/*
EXPLAIN Output Interpretation:

┌─────────────────────────────────────────────────────────────────────────────┐
│ id │ select_type │ table │ type   │ key          │ rows │ Extra             │
├────┼─────────────┼───────┼────────┼──────────────┼──────┼───────────────────┤
│ 1  │ SIMPLE      │ e     │ range  │ idx_salary   │ 50   │ Using where       │
│ 1  │ SIMPLE      │ d     │ eq_ref │ PRIMARY      │ 1    │ NULL              │
└─────────────────────────────────────────────────────────────────────────────┘

Reading this:
1. Query ID 1, simple query (no subqueries)
2. Table 'e' (employees):
   - type=range: Using index range scan (good!)
   - key=idx_salary: Using our salary index
   - rows=50: Estimated 50 rows to examine
   - Extra=Using where: Additional filtering
3. Table 'd' (departments):
   - type=eq_ref: Unique index lookup (best for joins!)
   - key=PRIMARY: Using primary key
   - rows=1: One lookup per employee (as expected)

Key Metrics:
- Total rows examined: 50 * 1 = 50 (good!)
- Access types (best to worst):
  const > eq_ref > ref > range > index > ALL
*/

-- PostgreSQL: More detailed output
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM employees WHERE dept_id = 1;
```

---

> **Navigation**: [< Previous](13_Transactions_ACID.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](15_Analytics_Warehousing_ETL.md)