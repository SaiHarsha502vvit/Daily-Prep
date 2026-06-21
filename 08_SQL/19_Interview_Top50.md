> **SQL Chapter 19/20** | [← Previous](18a_SQL_Projects_Beginner.md) | [Index](../00_MASTER_INDEX.md) | [Next →](20_CheatSheet_QuickRef.md)

---

## Chapter 23: Interview Questions (Top 50)

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- TOP 50 SQL INTERVIEW QUESTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Q1: What is the difference between WHERE and HAVING?
-- A: WHERE filters rows before grouping (and before SELECT projection), so you cannot reference column aliases or aggregate functions there. HAVING runs after GROUP BY and can filter on group-level aggregates. Think of WHERE as the bouncer at the door and HAVING as the manager who decides which groups make the final list.
-- Example: SELECT dept, COUNT(*) FROM employees WHERE salary > 50000 GROUP BY dept -- WHERE on base rows, then COUNT(*)
--          SELECT dept, COUNT(*) FROM employees GROUP BY dept HAVING COUNT(*) > 5   -- COUNT after grouping

-- Q2: Find the second highest salary
SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);
-- Or: SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1;

-- Q3: Find duplicate records
SELECT email, COUNT(*) FROM employees GROUP BY email HAVING COUNT(*) > 1;

-- Q4: Delete duplicate records keeping one
DELETE e1 FROM employees e1
INNER JOIN employees e2
WHERE e1.emp_id > e2.emp_id AND e1.email = e2.email;

-- Q5: Difference between DELETE, TRUNCATE, DROP
-- The key distinction is what each statement removes and how:
-- DELETE removes rows one-by-one, firing triggers and writing each row to the transaction log (MVCC: marks rows as deleted, visible to old snapshots until COMMIT). It respects WHERE, so DELETE FROM employees WHERE dept_id = 5 removes only matching rows. Rollback is possible.
-- TRUNCATE deallocates entire data pages, leaving the table structure but emptying it in a single metadata operation. It resets AUTO_INCREMENT/sequence counters, cannot have a WHERE clause, and is not fully logged row-by-row (PostgreSQL marks the whole transaction in WAL; MySQL InnoDB treats it as DDL). Rollback is generally not possible after COMMIT. This is why TRUNCATE is faster but destructive.
-- DROP removes the table entirely — schema AND data — and invalidates any view, stored procedure, or foreign key that referenced it. It is DDL and cannot be rolled back in most engines. Use DROP when you want the table gone, not just emptied.

-- Q6: What is a self join?
-- A: A self join merges a table with itself using two different aliases, allowing a row to be compared against other rows in the same table. This is needed whenever a relationship exists within a single entity — hierarchy (employee→manager), graph edges (user→friend), time-gap pairs. The join condition uses different aliases on the same column(s). The mechanism is identical to any INNER or LEFT JOIN; both sides of ON reference the same underlying table object.
-- Example: emp e LEFT JOIN emp m ON e.manager_id = m.emp_id -- each employee row sees its manager's row
SELECT e.name AS employee, m.name AS manager
FROM employees e LEFT JOIN employees m ON e.manager_id = m.emp_id;

-- Q7: Find employees with no manager
SELECT * FROM employees WHERE manager_id IS NULL;

-- Q8: Difference between UNION and UNION ALL
-- UNION executes a DISTINCT operation across the combined row set (sorting or hashing to eliminate duplicates), costing O(n log n) in memory or temp disk space. UNION ALL simply concatenates both result sets with no deduplication — O(n) with no extra memory overhead. Because UNION must materialize the full combined set before returning the first row, it cannot stream results. UNION ALL can begin returning rows immediately.
-- Rule of thumb: use UNION ALL unless you explicitly need duplicate elimination. If you know the two sets are disjoint (e.g., INSERT INTO ... SELECT ... WHERE condition1 UNION ALL SELECT ... WHERE condition2), UNION ALL is both correct and significantly faster.

-- Q9: Find Nth highest salary
SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET N-1;

-- Q10: Difference between RANK, DENSE_RANK, ROW_NUMBER
-- All three assign a sequential integer to each row in a window ordered by the ORDER BY clause. The difference is what happens to rows with equal sort keys (ties):
-- ROW_NUMBER always assigns a unique integer — even if two rows tie, one gets N and the other gets N+1 (arbitrary, non-deterministic if no tiebreaker).
-- RANK assigns the same integer to tied rows, then SKIPS the next rank(s) — two rows at rank 1 means the next row gets rank 3 (Olympic scoring).
-- DENSE_RANK assigns the same integer to tied rows with NO gaps — two rows at rank 1, next row gets rank 2.
-- Mechanism: window functions compute over the row set defined by PARTITION BY/ORDER BY. ROW_NUMBER uses a simple counter; RANK/DENSE_RANK maintain a rank counter that increments only after a sort-key change. Use RANK for leaderboards, DENSE_RANK for percentile buckets, ROW_NUMBER for de-duplication.

-- Q11: Write a query to transpose rows to columns (PIVOT)
SELECT
    employee_id,
    MAX(CASE WHEN month = 'Jan' THEN sales END) AS Jan,
    MAX(CASE WHEN month = 'Feb' THEN sales END) AS Feb,
    MAX(CASE WHEN month = 'Mar' THEN sales END) AS Mar
FROM monthly_sales GROUP BY employee_id;

-- Q12: Find customers who ordered every product
SELECT customer_id FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY customer_id
HAVING COUNT(DISTINCT product_id) = (SELECT COUNT(*) FROM products);

-- Q13: What are ACID properties?
-- ACID is the contract a database makes with your application:
-- Atomicity: A transaction is all-or-nothing — if any statement fails, the entire transaction rolls back. Without it, a transfer could deduct from A and fail to credit B, losing money. The DBMS achieves this via an undo log (PostgreSQL/MVCC) or rollback segment (InnoDB).
-- Consistency: Every transaction takes the database from one valid state to another. Foreign keys, CHECK constraints, and unique indexes are enforced at commit time. If you violate a CHECK mid-transaction, the COMMIT fails and rolls back.
-- Isolation: Concurrent transactions behave as if they ran sequentially. The isolation level (READ COMMITTED, REPEATABLE READ, SERIALIZABLE) controls which anomalies are permitted. Under REPEATABLE READ (MySQL InnoDB default), the snapshot is taken at transaction start; under READ COMMITTED (PostgreSQL default), the snapshot is updated before each statement.
-- Durability: Once COMMIT returns success, the data is permanent even if the server crashes. Achieved by writing to WAL (write-ahead log) before returning OK, then flushing log pages to disk on checkpoint.

-- Q14: Explain different types of indexes
-- B-Tree (balanced tree) is the default in virtually every engine. Keys are stored sorted in a tree of uniform depth (3-4 levels for billions of rows). Range queries (WHERE col BETWEEN 10 AND 20) are efficient because leaf pages are linked in sorted order. Works for equality (=) and range (>, <, BETWEEN).
-- Hash indexes use a hash function to map keys to buckets — equality lookups are O(1). But hash maps have no ordering, so they cannot support range scans or sorting. PostgreSQL uses hash indexes for internal system catalogs; MySQL MEMORY engine uses hash by default.
-- Full-text indexes build an inverted index over tokenized text, enabling MATCH ... AGAINST searches. InnoDB (MySQL 5.6+) and PostgreSQL tsvector/tsquery use variants. Not used for WHERE col LIKE '%pattern%' — that forces a table scan.
-- Composite (multi-column) indexes apply the leftmost prefix rule: an index on (a, b, c) can satisfy WHERE a = ? AND b = ? but not WHERE b = ? alone. Put equality columns first, range/order-by columns last.
-- Covering (include) indexes add non-key columns to a secondary index so the query is served entirely from the index (index-only scan). PostgreSQL: CREATE INDEX ON orders(customer_id) INCLUDE (total, status); — covers SELECT total, status WHERE customer_id = ?

-- Q15: What is normalization? Explain normal forms.
-- Normalization eliminates redundant storage and prevents update/insert/delete anomalies:
-- 1NF: Every cell is a single atomic value; no repeating groups or arrays. A phone_numbers column with '555-1234, 555-5678' violates 1NF.
-- 2NF: No partial dependencies — no non-key column depends on only part of a composite primary key. If (order_id, product_id) is PK and product_name depends only on product_id, fix by moving product_name to a products table.
-- 3NF: No transitive dependencies — no non-key column depends on another non-key column. If emp_id → dept_id → dept_budget, move dept_budget to a departments table.
-- BCNF (Boyce-Codd): Every determinant must be a candidate key. A table (student, subject, teacher) where teacher→subject but teacher is not a candidate key violates BCNF.
-- The mechanism: normalization ensures each fact lives in exactly one place, eliminating update anomalies. The cost is more joins — which is why high-read analytical schemas are often deliberately denormalized.

-- Q16: What is a CTE?
-- Common Table Expression - named temporary result set
WITH cte AS (SELECT * FROM employees WHERE salary > 50000)
SELECT * FROM cte;

-- Q17: Difference between INNER JOIN and LEFT JOIN
-- INNER JOIN returns only rows where the ON condition is satisfied in BOTH tables. LEFT JOIN preserves all left-table rows regardless of matches; right-table columns are NULL for non-matching rows.
-- The subtle trap: adding a WHERE clause that filters on the right table (e.g., WHERE right_table.status = 'active') silently converts a LEFT JOIN to an INNER JOIN — NULL rows are eliminated by the WHERE filter. To keep LEFT JOIN semantic with a right-table filter, move the condition into the ON clause: LEFT JOIN orders o ON o.cust_id = c.id AND o.status = 'active'. This is the #1 cause of unexpected row count drops in production reports.

-- Q18: What is a correlated subquery?
-- A correlated subquery references a column from the outer query, re-evaluating for every row the outer query produces. Execution model: for each outer row, evaluate the subquery with the current outer binding substituted. This is O(n) subquery executions, not O(1). For a 10,000-row outer table, that is 10,000 executions.
-- The inner query cannot run independently because its WHERE contains a reference like inner.dept_id = outer.dept_id. The planner typically executes this as a nested loop join — each outer row probes an inner index on dept_id. If the inner query has an aggregate (AVG(salary)), the aggregate is recomputed from scratch each time.
-- For large tables, rewrite as a JOIN with a derived table: SELECT e.* FROM employees e JOIN (SELECT dept_id, AVG(salary) avg_sal FROM employees GROUP BY dept_id) d ON e.dept_id = d.dept_id AND e.salary > d.avg_sal — O(n) once instead of O(n×m).
SELECT * FROM employees e WHERE salary > (SELECT AVG(salary) FROM employees WHERE dept_id = e.dept_id);

-- Q19: How to optimize a slow query?
-- (1) Run EXPLAIN ANALYZE (PostgreSQL) or EXPLAIN FORMAT=JSON (MySQL) — look for Seq Scan on large tables, Sort (Disk), or Hash join with large row estimates. (2) Check estimate vs. actual rows — a >10x discrepancy means stale statistics; run ANALYZE or VACUUM ANALYZE. (3) Add targeted indexes on WHERE, JOIN, and ORDER BY columns. Avoid applying functions to indexed columns in WHERE (YEAR(created_at) = 2024 prevents index use); instead use created_at >= '2024-01-01' AND created_at < '2025-01-01'. (4) Eliminate SELECT * — name only needed columns to enable covering index scans. (5) Check for implicit type coercion (WHERE emp_id = '123' on INTEGER prevents index use). (6) For expensive analytical queries, consider materialized views or summary tables.

-- Q20: What is a deadlock?
-- A deadlock occurs when two (or more) transactions each hold a lock the other needs, forming a circular wait. The DBMS picks a victim transaction, rolls it back with an error (PostgreSQL SQLSTATE 40P01; MySQL error 1213), and lets the other proceed. Application code must retry the victim.
-- Classic example: T1 holds Row-A, needs Row-B; T2 holds Row-B, needs Row-A. Most DBMSes use a waits-for graph (deadlock detection) rather than lock timeouts. To minimize deadlocks: acquire locks in a consistent order; keep transactions short; use SELECT FOR UPDATE; avoid user interaction inside transactions.

-- Q21: Find running total
SELECT date, amount, SUM(amount) OVER (ORDER BY date) AS running_total FROM sales;

-- Q22: Find consecutive days of login
WITH numbered AS (
    SELECT user_id, login_date,
        login_date - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) AS grp
    FROM logins
)
SELECT user_id, COUNT(*) AS consecutive_days FROM numbered GROUP BY user_id, grp;

-- Q23: What is a view? Can you update a view?
-- A view is a named stored SELECT query. When queried, the DBMS substitutes the view definition into the statement (text substitution in MySQL < 8.0; PostgreSQL uses the rule system) and executes the combined query. Views store no data — they recompute on each call.
-- An updatable view must reference only one base table, contain no aggregates/DISTINCT/GROUP BY/UNION/subqueries in the top level, and include all NOT NULL columns without defaults. Materialized views (PostgreSQL, Oracle, SQL Server Enterprise) differ — they store the pre-computed result on disk and refresh on schedule. They give O(1) query time for expensive aggregations but may serve stale data until the next REFRESH.

-- Q24: Difference between stored procedure and function
-- Stored procedures (CALL) can contain multiple statements, modify data, commit/rollback, and have no mandatory return value. Functions (called in expressions: SELECT my_func(col)) must return a value and cannot issue COMMIT/ROLLBACK in PostgreSQL or DDL in MySQL.
-- Execution model matters: a function called in SELECT is executed once per row — for 10,000 rows the function body executes 10,000 times. A slow function in a SELECT column causes O(n) degradation. Use procedures when you need side effects or multi-statement logic; use functions for pure transformations.

-- Q25: What is a trigger?
-- A trigger fires automatically on a DML event (INSERT/UPDATE/DELETE) on a specified table, either BEFORE (validate/modify incoming rows) or AFTER (log, update other tables). Triggers can be row-level (per affected row) or statement-level (once per statement).
-- Key pitfalls: (1) Recursive triggers — a BEFORE INSERT trigger that inserts into the same table re-fires until stack overflow. (2) Execution order is not guaranteed across multiple triggers on the same event in PostgreSQL (use one trigger per timing); MySQL fires in creation order. (3) In high-concurrency bulk loads, row-level triggers add O(n) overhead per row — a batch INSERT that would take 2s may take 20s with a trigger.

-- Q26: How does a window function differ from a GROUP BY?
-- GROUP BY collapses rows into one summary row per group, hiding individual rows. Window functions compute an aggregate or ranking per row while preserving the full row. Execution order: window functions run after FROM/JOIN/WHERE/GROUP BY/HAVING but before DISTINCT/ORDER BY/LIMIT. Because they run in SELECT, you cannot filter them with WHERE — use a subquery or CTE.
-- SELECT dept_id, salary, AVG(salary) OVER (PARTITION BY dept_id) AS dept_avg FROM employees -- window keeps all rows
-- SELECT dept_id, AVG(salary) FROM employees GROUP BY dept_id                      -- one row per dept

-- Q27: What is a subquery vs. a CTE?
-- A subquery is an anonymous SELECT embedded in WHERE/FROM/SELECT. A CTE (WITH clause) is a named subquery defined before the main query. CTEs improve readability and in PostgreSQL can be materialized or inlined — the optimizer chooses. Recursive CTEs (WITH RECURSIVE) can iterate, which subqueries cannot.

-- Q28: What is a covering index?
-- A covering index includes all columns a query needs, so the DB reads only the index (not the heap). PostgreSQL: CREATE INDEX ON orders(customer_id) INCLUDE (total, status); — SELECT total, status WHERE customer_id = ? needs no table access. MySQL: use a composite index with all selected columns in order. This turns a secondary index lookup into an index-only scan.

-- Q29: What is a foreign key, and why does it need an index?
-- A FK enforces referential integrity (parent row must exist before child INSERT; parent cannot be deleted if children exist unless ON DELETE CASCADE). Most engines do not auto-create an index on the FK column. Without an index, a parent DELETE scans every child row — O(n_children) with no index. Always create an explicit index on child_table(parent_id). PostgreSQL does not auto-index FKs; MySQL InnoDB does for constraint enforcement but not for JOIN performance.

-- Q30: What is the difference between CLUSTERED and NON-CLUSTERED index?
-- A clustered index stores row data in the B+tree leaf pages — the table IS the index (one per table, typically the PK). In InnoDB, the PK is the clustered index; without a PK, InnoDB uses a unique non-null column or generates a hidden row ID. A non-clustered (secondary) index stores (index key, PK value) at the leaf — lookups require a second B+tree traversal (index → PK → row). PostgreSQL differs: all indexes are secondary; row data lives in a separate heap.

-- Q31: What is index cardinality and why does it matter?
-- Cardinality = distinct values / total rows. High cardinality (UUID, PK, email) is selective — B-tree index is very effective. Low cardinality (gender, is_active, status) returns a large percentage of rows — optimizer often ignores the index and uses a seq scan. For low-cardinality columns, use a partial/filtered index (WHERE is_active = true) or a covering index.

-- Q32: What is a partial index?
-- CREATE INDEX ON orders(customer_id) WHERE status = 'pending'; — only pending rows are indexed. This dramatically reduces index size (only 5% of rows if most are completed), keeping it in memory. The optimizer uses it only for queries that include the WHERE condition. Ideal for high-cardinality derived flags on large tables.

-- Q33: How does ON DELETE CASCADE work?
-- When a parent row is deleted, the DBMS automatically deletes matching child rows. The mechanism: InnoDB marks child rows as deleted (MVCC) and schedules them for purge. For millions of children, this generates many WAL entries and can take minutes — it is NOT a fast metadata operation. Use TRUNCATE on parent (not DELETE) only if you can truncate the child too; otherwise use soft deletes (is_deleted flag) or batched hard deletes.

-- Q34: What is the execution order of SQL clauses?
-- (1) FROM/JOIN, (2) WHERE, (3) GROUP BY, (4) HAVING, (5) SELECT, (6) ORDER BY, (7) LIMIT/OFFSET. Window functions (OVER) are computed as part of SELECT. This order is why you cannot use SELECT aliases in WHERE (WHERE runs before SELECT) and why HAVING can filter on aggregates (HAVING runs after GROUP BY).

-- Q35: What is a foreign key constraint in a self-referential table?
-- A table with FK referencing itself (employees.manager_id → employees.emp_id) requires careful ordering: new employees need manager_id referencing an already-existing emp_id. ON DELETE RESTRICT prevents manager deletion if children exist; ON DELETE SET NULL sets their manager_id to NULL; ON DELETE CASCADE cascades down the hierarchy (dangerous — can delete entire org chart). PostgreSQL supports MATCH FULL (both FK columns must be NULL or both non-NULL).

-- Q36: What is the difference between NVL, COALESCE, and IFNULL?
-- NVL is Oracle-specific; COALESCE and IFNULL are ANSI. COALESCE(a, b, c, ...) returns the first non-NULL argument, evaluating left-to-right until one is non-NULL. IFNULL(a, b) returns b if a is NULL (only two arguments). In modern engines, COALESCE and IFNULL are optimized identically. NVL in older Oracle could prevent index use in some contexts. Use COALESCE for portability.

-- Q37: What is a materialized view vs. a regular view?
-- A regular view is a text macro expanded at query time — no data stored, recomputed on each call. A materialized view stores the pre-computed result on disk, refreshed on schedule or trigger. Materialized views give O(1) query time for expensive aggregations but may serve stale data. PostgreSQL: REFRESH MATERIALIZED VIEW my_mat_view CONCURRENTLY. Oracle and SQL Server Enterprise have similar features.

-- Q38: What is a recursive CTE and when would you use it?
-- WITH RECURSIVE defines a CTE that references itself: an anchor member (base rows) UNION ALL with a recursive member that joins the CTE to the base table. Use for: org chart traversal, bill of materials explosion, graph traversal, network path finding. The recursive member must have a termination condition (LIMIT, level check) to prevent infinite loops. PostgreSQL's cte_max_recursion_depth (default 3000) caps iterations.
```

---

> **Navigation**: [< Previous](18b_SQL_Projects_Advanced.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](20_CheatSheet_QuickRef.md)

### Historical Evolution

**Predecessors (with years):**
- **Oracle/Sybase** (1990s): Early enterprise databases that established SQL as the standard for interview technical screens
- **LeetCode** (2015): Formalized SQL interview question banks with difficulty ratings and company frequency tags
- **HackerRank** (2012): Pioneered automated assessment platforms that companies adopted for initial screening
- **Pramp** (2015): Peer interview practice platform that democratized mock technical interviews
- **SQL-92 Standard** (1992): Baseline syntax that all SQL interviews assume (JOINs, subqueries, GROUP BY, HAVING)

**Evolution narrative:**
SQL interviews evolved from whiteboard queries in onsite loops (2010) to automated platform assessments (2012-2015) to hybrid formats combining live coding with system design discussions. Oracle and Sybase dominance in enterprise created a baseline expectation of SQL proficiency for database-related roles. LeetCode's SQL section (launched 2015) codified 50-100 problems as the "standard prep curriculum" that candidates now share in study groups. Modern interviews test not just query writing but optimization, schema design, and debugging skills reflecting actual production challenges.

**Modern practice anchor:**
Top 50 SQL interview questions now include window functions (LAG/LEAD, RANK), CTEs, and optimization challenges that appear consistently at Google, Meta, Amazon, and Apple.

### Production Reality

**Failure modes:**
1. **SELECT * in production workloads**: Interview queries use `SELECT *` freely, but in production on a table with 20 VARCHAR(2000) columns and a BLOB for file attachments, this causes 8-second page load times as the app transfers megabytes per row. Stack Overflow's 2013 slow-down was partially traced to `SELECT *` pulling unneeded BLOB columns over the wire.
2. **ORDER BY without LIMIT on unbounded results**: A query written as practice exercise `SELECT * FROM employees ORDER BY hire_date` — when called without pagination — sorts 50,000 rows and streams them all. In a web API this causes timeout and memory exhaustion. Fix: always apply keyset or offset pagination.
3. **NULL handling surprises in production filters**: An interview query `WHERE dept_id != 5` silently drops NULL dept_id rows (NULL != 5 evaluates to NULL, not TRUE). In a production report this means the "unassigned" bucket is always zero. Every SQL developer discovers this bug in their first month on the job.

**Debug workflow:**
(1) Review query execution plans with `EXPLAIN ANALYZE` — look for `Seq Scan` and `Sort (Disk)` indicating full-table sort without index.
(2) Enable query logging in production and filter for queries returning >10,000 rows unexpectedly.
(3) Test NULL-edge-case queries: run `WHERE col != val` and explicitly check `WHERE col IS NULL` to ensure all buckets are accounted for.

**Modern practice anchor:**
Today, tools like New Relic, Datadog, and Percona's PMM dashboard visualize query row counts and latency in production, catching interview-style unbounded results before they cascade into page timeouts.
