**Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next >](21_Database_Internals.md)

# SQL Interview — Top 50 Problems & Patterns

## How to Use This Guide

This is your SQL interview ready-reckoner.

- 50 problems organized by pattern, not by difficulty.
- Each problem has: Schema, Question, Solution, Explanation.
- Focus on PATTERNS — once you learn the pattern, you can
  solve any variation.

COMMON INTERVIEW DATASETS (used throughout):

- Employees (id, name, dept_id, salary, hire_date, mgr_id)
- Departments (id, name, location)
- Orders (id, customer_id, amount, order_date, status)
- Products (id, name, category, price, stock)
- Students (id, name, score, class)

---

## Pattern 1: Basic SELECT & Filtering (Q1-Q5)

### Q1. Second Highest Salary

```sql
-- Method 1: LIMIT + OFFSET
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;

-- Method 2: Subquery (handles NULL if < 2 distinct salaries)
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- Method 3: DENSE_RANK (most flexible — Nth highest)
SELECT salary FROM (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rk
    FROM employees
) ranked
WHERE rk = 2;
```

**Pattern:** "Nth highest" → DENSE_RANK or LIMIT/OFFSET. DENSE_RANK handles ties correctly.

---

### Q2. Employees Earning More Than Their Manager

```sql
SELECT e.name AS employee
FROM employees e
JOIN employees m ON e.mgr_id = m.id
WHERE e.salary > m.salary;
```

**Pattern:** Self-join — join a table to itself using a foreign key relationship.

---

### Q3. Duplicate Emails

```sql
-- Find duplicates
SELECT email, COUNT(*) AS cnt
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Delete duplicates (keep lowest ID)
DELETE u1 FROM users u1
JOIN users u2 ON u1.email = u2.email AND u1.id > u2.id;
```

**Pattern:** GROUP BY + HAVING COUNT(\*) > 1 finds duplicates. Self-join deletes them.

---

### Q4. Customers Who Never Ordered

```sql
-- Method 1: LEFT JOIN + IS NULL
SELECT c.name
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;

-- Method 2: NOT EXISTS (often faster)
SELECT c.name
FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.customer_id = c.id
);

-- Method 3: NOT IN (careful with NULLs!)
SELECT name FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders WHERE customer_id IS NOT NULL);
```

**Pattern:** "Never/No match" → LEFT JOIN + IS NULL or NOT EXISTS. Prefer NOT EXISTS.

---

### Q5. Rising Temperature (Compare With Previous Row)

```sql
-- Find dates where temp is higher than the previous day
SELECT w1.id
FROM weather w1
JOIN weather w2 ON w1.recordDate = DATE_ADD(w2.recordDate, INTERVAL 1 DAY)
WHERE w1.temperature > w2.temperature;

-- Using LAG (cleaner):
SELECT id FROM (
    SELECT id, temperature,
           LAG(temperature) OVER (ORDER BY recordDate) AS prev_temp
    FROM weather
) t
WHERE temperature > prev_temp;
```

**Pattern:** Compare current row with previous → LAG() or self-join on date arithmetic.

---

## Pattern 2: GROUP BY & Aggregation (Q6-Q12)

### Q6. Department With Highest Average Salary

```sql
SELECT d.name, AVG(e.salary) AS avg_salary
FROM employees e
JOIN departments d ON e.dept_id = d.id
GROUP BY d.name
ORDER BY avg_salary DESC
LIMIT 1;
```

---

### Q7. Count of Each Department (Including Empty Departments)

```sql
SELECT d.name, COUNT(e.id) AS emp_count
FROM departments d
LEFT JOIN employees e ON d.id = e.dept_id
GROUP BY d.name
ORDER BY emp_count DESC;
```

**Pattern:** LEFT JOIN from the "all" table. COUNT(e.id) not COUNT(\*) — NULL won't be counted.

---

### Q8. Products Ordered More Than 3 Times in Last Month

```sql
SELECT p.name, COUNT(o.id) AS order_count
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.order_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
GROUP BY p.name
HAVING COUNT(o.id) > 3;
```

---

### Q9. Highest Salary in Each Department

```sql
-- Method 1: Subquery
SELECT d.name, e.name, e.salary
FROM employees e
JOIN departments d ON e.dept_id = d.id
WHERE e.salary = (
    SELECT MAX(salary) FROM employees WHERE dept_id = e.dept_id
);

-- Method 2: Window function
SELECT dept_name, emp_name, salary FROM (
    SELECT d.name AS dept_name, e.name AS emp_name, e.salary,
           RANK() OVER (PARTITION BY d.id ORDER BY e.salary DESC) AS rk
    FROM employees e JOIN departments d ON e.dept_id = d.id
) ranked
WHERE rk = 1;
```

**Pattern:** "Top N per group" → RANK/ROW_NUMBER with PARTITION BY.

---

### Q10. Customers With Total Orders > $1000

```sql
SELECT c.name, SUM(o.amount) AS total_spent
FROM customers c
JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name
HAVING SUM(o.amount) > 1000
ORDER BY total_spent DESC;
```

---

### Q11. Moving Average (Last 3 Days)

```sql
SELECT order_date,
       daily_total,
       AVG(daily_total) OVER (
           ORDER BY order_date
           ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ) AS moving_avg_3day
FROM (
    SELECT order_date, SUM(amount) AS daily_total
    FROM orders
    GROUP BY order_date
) daily;
```

**Pattern:** Sliding window → ROWS BETWEEN N PRECEDING AND CURRENT ROW.

---

### Q12. Year-Over-Year Growth

```sql
WITH yearly AS (
    SELECT YEAR(order_date) AS yr, SUM(amount) AS revenue
    FROM orders
    GROUP BY YEAR(order_date)
)
SELECT yr, revenue,
       LAG(revenue) OVER (ORDER BY yr) AS prev_revenue,
       ROUND((revenue - LAG(revenue) OVER (ORDER BY yr))
             / LAG(revenue) OVER (ORDER BY yr) * 100, 2) AS growth_pct
FROM yearly;
```

**Pattern:** YoY/MoM growth → LAG to get previous period, then calculate percentage.

---

## Pattern 3: Window Functions (Q13-Q20)

### Q13. Rank Employees by Salary Within Department

```sql
SELECT name, dept_id, salary,
       ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS row_num,
       RANK()       OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rank_num,
       DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dense_rank_num
FROM employees;
```

```
╔══════════════════════════════════════════════════════════════════════╗
║  ROW_NUMBER vs RANK vs DENSE_RANK                                    ║
║                                                                      ║
║  Salary: 100, 100, 90, 80                                            ║
║                                                                      ║
║  ROW_NUMBER: 1, 2, 3, 4   (unique, arbitrary for ties)               ║
║  RANK:       1, 1, 3, 4   (ties get same rank, gaps after)           ║
║  DENSE_RANK: 1, 1, 2, 3   (ties get same rank, NO gaps)              ║
║                                                                      ║
║  Use ROW_NUMBER for pagination, DENSE_RANK for "Nth highest"         ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

### Q14. Running Total of Orders

```sql
SELECT order_date, amount,
       SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders;

-- Running total per customer
SELECT customer_id, order_date, amount,
       SUM(amount) OVER (
           PARTITION BY customer_id ORDER BY order_date
       ) AS customer_running_total
FROM orders;
```

---

### Q15. First and Last Order Per Customer

```sql
SELECT DISTINCT customer_id,
       FIRST_VALUE(order_date) OVER (
           PARTITION BY customer_id ORDER BY order_date
       ) AS first_order,
       LAST_VALUE(order_date) OVER (
           PARTITION BY customer_id ORDER BY order_date
           ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
       ) AS last_order
FROM orders;
```

**Warning:** LAST_VALUE needs explicit window frame — default frame goes only to CURRENT ROW.

---

### Q16. Median Salary (No Built-in Function)

```sql
-- Method: Use ROW_NUMBER and count
WITH ranked AS (
    SELECT salary,
           ROW_NUMBER() OVER (ORDER BY salary) AS rn,
           COUNT(*) OVER () AS total
    FROM employees
)
SELECT AVG(salary) AS median_salary
FROM ranked
WHERE rn IN (FLOOR((total + 1) / 2.0), CEIL((total + 1) / 2.0));
```

---

### Q17. Percentile / Top 10% Earners

```sql
SELECT name, salary FROM (
    SELECT name, salary,
           PERCENT_RANK() OVER (ORDER BY salary) AS pct_rank
    FROM employees
) t
WHERE pct_rank >= 0.90;

-- Alternative with NTILE
SELECT name, salary FROM (
    SELECT name, salary,
           NTILE(10) OVER (ORDER BY salary) AS decile
    FROM employees
) t
WHERE decile = 10;
```

---

### Q18. Gap Detection (Missing Dates)

```sql
WITH date_series AS (
    SELECT MIN(order_date) AS dt FROM orders
    UNION ALL
    SELECT DATE_ADD(dt, INTERVAL 1 DAY) FROM date_series
    WHERE dt < (SELECT MAX(order_date) FROM orders)
)
SELECT ds.dt AS missing_date
FROM date_series ds
LEFT JOIN orders o ON ds.dt = o.order_date
WHERE o.id IS NULL;
```

**Pattern:** Generate a complete series → LEFT JOIN → find NULLs.

---

### Q19. Consecutive Streak (Login Streak)

```sql
WITH numbered AS (
    SELECT user_id, login_date,
           login_date - INTERVAL ROW_NUMBER() OVER (
               PARTITION BY user_id ORDER BY login_date
           ) DAY AS grp
    FROM logins
)
SELECT user_id, COUNT(*) AS streak,
       MIN(login_date) AS streak_start,
       MAX(login_date) AS streak_end
FROM numbered
GROUP BY user_id, grp
HAVING COUNT(*) >= 3
ORDER BY streak DESC;
```

**Pattern:** "Consecutive" → Subtract ROW_NUMBER from date → same group = consecutive.

---

### Q20. Pivot / Transpose Rows to Columns

```sql
-- Pivot: Monthly sales per product
SELECT product_name,
    SUM(CASE WHEN MONTH(sale_date) = 1 THEN amount ELSE 0 END) AS Jan,
    SUM(CASE WHEN MONTH(sale_date) = 2 THEN amount ELSE 0 END) AS Feb,
    SUM(CASE WHEN MONTH(sale_date) = 3 THEN amount ELSE 0 END) AS Mar
    -- ... continue for each month
FROM sales
GROUP BY product_name;
```

**Pattern:** Pivot → CASE WHEN inside aggregation. No native PIVOT in MySQL (SQL Server has it).

---

🔬 **Section Challenge — Pattern 3: Window Functions (Q13-Q20)**

**Challenge (Reasoning):** Q19's streak-detection trick subtracts `ROW_NUMBER()` (as a day count) from each login date to compute `grp`, then groups by `(user_id, grp)`. Walk through why consecutive login dates always land in the same `grp`, and why a single missed day breaks it into two groups.

<details><summary>Answer</summary>

Take a user who logs in on Jan 1, 2, 3, then skips to Jan 5, 6. Ordered by date, `ROW_NUMBER()` assigns 1, 2, 3, 4, 5. Subtracting the row number from each date (as a day offset): Jan 1 − 1 day = Dec 31; Jan 2 − 2 days = Dec 31; Jan 3 − 3 days = Dec 31 — three different dates, same subtraction result, because both the date *and* the row number advanced by exactly one each time, so the gap between them stays constant. Jan 5 − 4 days = Jan 1; Jan 6 − 5 days = Jan 1 — a second, different constant. The row number only advances by 1 per row regardless of how large the actual date gap is, so the moment a date jumps by more than a day, the subtraction result shifts to a new constant, splitting the streak into a new group. `GROUP BY user_id, grp` then just counts how many rows share each constant — that count is the streak length. The trick works precisely because `ROW_NUMBER()` counts *rows*, not days, so it's insensitive to gaps by design, and the arithmetic converts "same row-to-row spacing as row-number spacing" into "identical computed value."

</details>

## Pattern 4: Joins & Subqueries (Q21-Q30)

### Q21. Find Employees in Same Department as 'John'

```sql
SELECT name FROM employees
WHERE dept_id = (SELECT dept_id FROM employees WHERE name = 'John')
  AND name != 'John';
```

---

### Q22. Departments With More Than Average Employee Count

```sql
WITH dept_counts AS (
    SELECT dept_id, COUNT(*) AS cnt
    FROM employees
    GROUP BY dept_id
)
SELECT d.name, dc.cnt
FROM dept_counts dc
JOIN departments d ON dc.dept_id = d.id
WHERE dc.cnt > (SELECT AVG(cnt) FROM dept_counts);
```

---

### Q23. Mutual Friends / Relationships

```sql
-- Find if two users are connected (bidirectional friends table)
-- friends(user_id, friend_id)

-- Count mutual friends between user 1 and user 2
SELECT COUNT(*) AS mutual_friends
FROM friends f1
JOIN friends f2 ON f1.friend_id = f2.friend_id
WHERE f1.user_id = 1 AND f2.user_id = 2;
```

---

### Q24. Students Who Scored Above Class Average

```sql
SELECT s.name, s.score, s.class
FROM students s
WHERE s.score > (
    SELECT AVG(score) FROM students WHERE class = s.class
);

-- Using Window Function (no correlated subquery):
SELECT name, score, class FROM (
    SELECT name, score, class,
           AVG(score) OVER (PARTITION BY class) AS class_avg
    FROM students
) t
WHERE score > class_avg;
```

**Pattern:** Correlated subquery vs. window function — window function is usually faster.

---

### Q25. All Combinations (Cross Join)

```sql
-- Generate all possible student-subject combinations
SELECT s.name, sub.name AS subject
FROM students s
CROSS JOIN subjects sub;

-- Find students missing a subject (no score)
SELECT s.name, sub.name AS missing_subject
FROM students s
CROSS JOIN subjects sub
LEFT JOIN scores sc ON s.id = sc.student_id AND sub.id = sc.subject_id
WHERE sc.id IS NULL;
```

---

### Q26. Recursive CTE — Organization Hierarchy

```sql
-- Find all managers above an employee
WITH RECURSIVE managers AS (
    SELECT id, name, mgr_id, 1 AS level
    FROM employees WHERE id = 42

    UNION ALL

    SELECT e.id, e.name, e.mgr_id, m.level + 1
    FROM employees e
    JOIN managers m ON e.id = m.mgr_id
)
SELECT * FROM managers;
```

**Pattern:** Recursive CTE = start with base case → UNION ALL → recursive step.

---

### Q27. FULL OUTER JOIN (MySQL Workaround)

```sql
-- MySQL doesn't have FULL OUTER JOIN — simulate it
SELECT a.id, a.value, b.value
FROM table_a a LEFT JOIN table_b b ON a.id = b.id
UNION
SELECT b.id, a.value, b.value
FROM table_a a RIGHT JOIN table_b b ON a.id = b.id;
```

---

### Q28. Find Overlapping Date Ranges

```sql
-- Find bookings that overlap
SELECT a.id AS booking1, b.id AS booking2
FROM bookings a
JOIN bookings b ON a.id < b.id
  AND a.room_id = b.room_id
  AND a.start_date < b.end_date
  AND b.start_date < a.end_date;
```

**Pattern:** Overlap condition: A.start < B.end AND B.start < A.end.

---

### Q29. Exists vs IN Performance

```sql
-- EXISTS is better when outer table is small, subquery table is large
SELECT * FROM departments d
WHERE EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.id);

-- IN is better when subquery result is small
SELECT * FROM employees
WHERE dept_id IN (SELECT id FROM departments WHERE location = 'NYC');
```

---

### Q30. Self-Join — Find Pairs

```sql
-- Find employee pairs in the same department
SELECT e1.name, e2.name, e1.dept_id
FROM employees e1
JOIN employees e2 ON e1.dept_id = e2.dept_id AND e1.id < e2.id;
```

**Note:** `e1.id < e2.id` prevents duplicate pairs (A,B) and (B,A).

---

🔬 **Section Challenge — Pattern 4: Joins & Subqueries (Q21-Q30)**

**Challenge 1 (Performance — Who/When/What):** Find customers who placed at least one order. Three options: `JOIN + DISTINCT`, `WHERE EXISTS (subquery)`, `WHERE id IN (subquery)`. **Who** wins at scale? **When** does IN become dangerous? **What** does the optimizer actually do?

<details><summary>Answer</summary>

**`JOIN + DISTINCT`:** `SELECT DISTINCT c.id FROM customers c JOIN orders o ON c.id = o.customer_id`. The optimizer can use a semi-join optimization — it stops processing once it finds the first matching order per customer. Generally fast with an index on `orders.customer_id`. **`EXISTS`:** `WHERE EXISTS (SELECT 1 FROM orders WHERE customer_id = c.id)`. Semantically a semi-join — stops at first match per customer. Most optimizers convert this to the same execution plan as JOIN. Preferred for clarity of intent. **`IN`:** `WHERE id IN (SELECT customer_id FROM orders)`. **When dangerous?** When the subquery returns a large result set (100K+ IDs). The DB materializes the entire subquery result into memory before the outer query runs. MySQL historically couldn't optimize correlated IN subqueries well. **What optimizer does:** PostgreSQL and modern MySQL convert all three to the same Hash Semi-Join or Nested Loop Semi-Join. Use `EXPLAIN` to confirm — if they produce the same plan, choose `EXISTS` for readability.

</details>

## Pattern 5: Data Modification & Transactions (Q31-Q37)

### Q31. UPDATE With JOIN

```sql
-- Give 10% raise to employees in the 'Engineering' department
UPDATE employees e
JOIN departments d ON e.dept_id = d.id
SET e.salary = e.salary * 1.10
WHERE d.name = 'Engineering';
```

---

### 📌 Q32. Insert ... on Duplicate Key / Upsert

```sql
-- MySQL: Insert or update if exists
INSERT INTO inventory (product_id, quantity)
VALUES (101, 50)
ON DUPLICATE KEY UPDATE quantity = quantity + 50;

-- PostgreSQL: UPSERT
INSERT INTO inventory (product_id, quantity)
VALUES (101, 50)
ON CONFLICT (product_id) DO UPDATE SET quantity = inventory.quantity + 50;
```

---

### Q33. DELETE With Subquery

```sql
-- Delete orders older than 2 years with no associated shipments
DELETE o FROM orders o
LEFT JOIN shipments s ON o.id = s.order_id
WHERE s.id IS NULL
  AND o.order_date < DATE_SUB(CURDATE(), INTERVAL 2 YEAR);
```

---

### Q34. MERGE (SQL Server / Oracle)

```sql
-- SQL Server: Synchronize target with source
MERGE INTO target_table t
USING source_table s ON t.id = s.id
WHEN MATCHED THEN
    UPDATE SET t.value = s.value
WHEN NOT MATCHED THEN
    INSERT (id, value) VALUES (s.id, s.value)
WHEN NOT MATCHED BY SOURCE THEN
    DELETE;
```

---

### Q35. Transaction Isolation Levels

```sql
-- Set isolation level
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

BEGIN TRANSACTION;
    SELECT balance FROM accounts WHERE id = 1;  -- reads 1000
    -- Another transaction changes balance to 500
    SELECT balance FROM accounts WHERE id = 1;  -- depends on level!

    -- READ UNCOMMITTED: might read 500 (dirty read)
    -- READ COMMITTED:   reads 1000 (no dirty read, but non-repeatable)
    -- REPEATABLE READ:  reads 1000 both times (consistent)
    -- SERIALIZABLE:     reads 1000, blocks other writers
COMMIT;
```

```
╔══════════════════════════════════════════════════════════════════════╗
║  Isolation Level     │ Dirty Read │ Non-Repeatable │ Phantom         ║
║  ────────────────────┼────────────┼────────────────┼────────────     ║
║  READ UNCOMMITTED    │  Yes       │  Yes           │  Yes            ║
║  READ COMMITTED      │  No        │  Yes           │  Yes            ║
║  REPEATABLE READ     │  No        │  No            │  Yes            ║
║  SERIALIZABLE        │  No        │  No            │  No             ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

### Q36. Deadlock Example

```sql
-- Transaction 1:
BEGIN; UPDATE accounts SET balance = balance - 100 WHERE id = 1;
       UPDATE accounts SET balance = balance + 100 WHERE id = 2; COMMIT;

-- Transaction 2 (simultaneous):
BEGIN; UPDATE accounts SET balance = balance - 50 WHERE id = 2;
       UPDATE accounts SET balance = balance + 50 WHERE id = 1; COMMIT;
-- → DEADLOCK! T1 locks row 1 waiting for 2, T2 locks row 2 waiting for 1

-- SOLUTION: Always lock in the same order (sort by ID)
```

---

### Q37. Optimistic vs Pessimistic Locking

```sql
-- PESSIMISTIC: Lock the row while reading
SELECT * FROM products WHERE id = 1 FOR UPDATE;  -- row locked
UPDATE products SET stock = stock - 1 WHERE id = 1;
COMMIT;

-- OPTIMISTIC: Use version column, no lock
SELECT stock, version FROM products WHERE id = 1;
-- Got stock=10, version=5
UPDATE products SET stock = 9, version = 6
WHERE id = 1 AND version = 5;  -- fails if someone else updated
-- If rows_affected = 0 → retry
```

---

🔬 **Section Challenge — Pattern 5: Data Modification & Transactions (Q31-Q37)**

**Challenge 1 (Reasoning):** The optimistic-locking example above runs `UPDATE products SET stock=9, version=6 WHERE id=1 AND version=5` and then checks `rows_affected`. Under what condition does this fail safely, and why is checking `rows_affected == 0` essential instead of just trusting the UPDATE worked?

<details><summary>Answer</summary>

It fails safely whenever another transaction updated the SAME row (and bumped its version) between this transaction's SELECT and its UPDATE — the WHERE clause's `version = 5` no longer matches anything (the row's real version is now 6+), so the UPDATE matches ZERO rows and silently does nothing. Critically, an UPDATE that matches no rows is not a SQL error — it succeeds with `rows_affected = 0`. Without checking that count, the application would wrongly assume the update went through and proceed as if stock were now 9, when in reality nothing changed and the row still reflects whatever the OTHER transaction wrote — a lost update disguised as a successful one.

</details>

## Pattern 6: Performance & Indexing (Q38-Q44)

### Q38. EXPLAIN Plan Reading

```sql
EXPLAIN SELECT * FROM orders WHERE customer_id = 42 AND status = 'SHIPPED';

-- Key fields to read:
-- type: ALL (full scan, BAD) → index → ref → eq_ref → const (BEST)
-- possible_keys: which indexes COULD be used
-- key: which index IS used
-- rows: estimated rows scanned
-- Extra: "Using where", "Using index" (covering), "Using filesort" (bad)
```

```
╔══════════════════════════════════════════════════════════════════════╗
║  EXPLAIN type (best → worst):                                        ║
║  const → eq_ref → ref → range → index → ALL                          ║
║                                                                      ║
║  const:   WHERE primary_key = 42                                     ║
║  eq_ref:  JOIN on primary key (unique match)                         ║
║  ref:     JOIN on non-unique index                                   ║
║  range:   WHERE price BETWEEN 10 AND 50                              ║
║  index:   Full index scan (better than ALL but still slow)           ║
║  ALL:     Full table scan (RED FLAG 🚩)                               ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

### Q39. Index Strategies

```sql
-- Single column index
CREATE INDEX idx_customer ON orders(customer_id);

-- Composite index (column order matters!)
CREATE INDEX idx_cust_status ON orders(customer_id, status);
-- ✅ WHERE customer_id = 42                    (uses index)
-- ✅ WHERE customer_id = 42 AND status = 'DONE' (uses index)
-- ❌ WHERE status = 'DONE'                     (can't use — leftmost prefix rule)

-- Covering index (index contains all needed columns)
CREATE INDEX idx_covering ON orders(customer_id, status, amount);
-- SELECT amount FROM orders WHERE customer_id = 42 AND status = 'DONE'
-- → "Using index" (never touches the table, reads from index only)
```

---

### Q40. When NOT to Use Indexes

```sql
-- Index is IGNORED when:

-- 1. Function on indexed column
WHERE YEAR(created_at) = 2024         -- ❌ won't use index
WHERE created_at >= '2024-01-01'
  AND created_at < '2025-01-01'       -- ✅ uses index

-- 2. Implicit type conversion
WHERE phone = 1234567890              -- ❌ phone is VARCHAR, comparing to INT
WHERE phone = '1234567890'            -- ✅

-- 3. LIKE with leading wildcard
WHERE name LIKE '%john%'              -- ❌ full scan
WHERE name LIKE 'john%'              -- ✅ range scan

-- 4. OR across different columns without individual indexes
WHERE customer_id = 1 OR status = 'A' -- ❌ if only one index exists
-- Solution: Separate indexes + UNION
```

---

### Q41. Pagination Strategies

```sql
-- OFFSET pagination (simple but SLOW for large offsets)
SELECT * FROM products ORDER BY id LIMIT 20 OFFSET 10000;
-- MySQL must scan and skip 10,000 rows!

-- KEYSET pagination (cursor-based — FAST)
SELECT * FROM products WHERE id > 10020 ORDER BY id LIMIT 20;
-- Jumps directly to id 10020 using index, no skipping!

-- When to use what:
-- OFFSET: Simple UIs, small datasets, "jump to page 50"
-- KEYSET: APIs, infinite scroll, million+ rows
```

---

### Q42. Query Optimization Patterns

```sql
-- SLOW: SELECT *
SELECT * FROM orders WHERE customer_id = 42;
-- FAST: Select only needed columns
SELECT id, amount, status FROM orders WHERE customer_id = 42;

-- SLOW: IN with large subquery
SELECT * FROM products WHERE id IN (SELECT product_id FROM order_items);
-- FAST: EXISTS
SELECT * FROM products p
WHERE EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.id);

-- SLOW: Multiple separate queries in app code
-- FAST: Single query with JOIN or batch IN
SELECT * FROM orders WHERE id IN (1, 2, 3, 4, 5);
```

---

### Q43. Partitioning

```sql
-- Range partitioning by date (large tables)
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    order_date DATE,
    amount DECIMAL(10,2)
) PARTITION BY RANGE (YEAR(order_date)) (
    PARTITION p2022 VALUES LESS THAN (2023),
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Benefits: Query for 2024 only scans p2024 partition
-- Also easier to archive: ALTER TABLE orders DROP PARTITION p2022;
```

---

### Q44. Slow Query Diagnosis Checklist

```
╔══════════════════════════════════════════════════════════════════════╗
║  Query is slow? Follow this checklist:                               ║
║                                                                      ║
║  1. Run EXPLAIN — is it ALL (full table scan)?                       ║
║  2. Is there an index on the WHERE/JOIN columns?                     ║
║  3. Is a function breaking index usage?                              ║
║  4. Is the query returning too many rows? (add LIMIT)                ║
║  5. Is SELECT * fetching unnecessary columns?                        ║
║  6. Is there an N+1 query problem in the app code?                   ║
║  7. Is the table very large? Consider partitioning.                  ║
║  8. Are statistics stale? ANALYZE TABLE.                             ║
║  9. Is the query running during peak load? Check locks.              ║
║  10. Can you cache the result instead of hitting DB every time?      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Pattern 7: Advanced & Tricky (Q45-Q50)

### Q45. Generate a Calendar Table

```sql
-- Recursive CTE to generate dates
WITH RECURSIVE calendar AS (
    SELECT '2024-01-01' AS dt
    UNION ALL
    SELECT DATE_ADD(dt, INTERVAL 1 DAY) FROM calendar
    WHERE dt < '2024-12-31'
)
SELECT dt, DAYNAME(dt) AS day_name
FROM calendar;
```

---

### Q46. Cumulative Distribution (% of Total)

```sql
SELECT category, total_sales,
       ROUND(total_sales / SUM(total_sales) OVER () * 100, 2) AS pct_of_total,
       ROUND(SUM(total_sales) OVER (ORDER BY total_sales DESC)
             / SUM(total_sales) OVER () * 100, 2) AS cumulative_pct
FROM (
    SELECT category, SUM(amount) AS total_sales FROM sales GROUP BY category
) t
ORDER BY total_sales DESC;
```

**Pattern:** SUM() OVER() without PARTITION = grand total. Useful for "% of total".

---

### Q47. String Manipulation (Clean Data)

```sql
-- Split full name into first and last
SELECT
    SUBSTRING_INDEX(full_name, ' ', 1) AS first_name,
    SUBSTRING_INDEX(full_name, ' ', -1) AS last_name
FROM users;

-- Remove extra spaces
SELECT TRIM(BOTH ' ' FROM name) AS clean_name FROM users;

-- Find rows with non-ASCII characters
SELECT * FROM users WHERE name REGEXP '[^a-zA-Z0-9 ]';

-- Extract domain from email
SELECT SUBSTRING_INDEX(email, '@', -1) AS domain,
       COUNT(*) AS user_count
FROM users
GROUP BY domain
ORDER BY user_count DESC;
```

---

### Q48. JSON Queries (MySQL 5.7+ / PostgreSQL)

```sql
-- MySQL: Extract from JSON column
SELECT
    id,
    JSON_EXTRACT(metadata, '$.color') AS color,
    metadata->>'$.size' AS size
FROM products
WHERE JSON_EXTRACT(metadata, '$.color') = '"red"';

-- PostgreSQL: JSONB is more powerful
SELECT * FROM products
WHERE metadata @> '{"color": "red"}';  -- containment operator
```

---

### Q49. The HAVING Without GROUP BY Trick

```sql
-- Check if ALL rows meet a condition
SELECT 'All orders shipped' AS status
FROM orders
HAVING MIN(status) = 'SHIPPED' AND MAX(status) = 'SHIPPED';
-- Returns row only if every order has status 'SHIPPED'

-- Check if table is empty
SELECT 'No orders' AS msg
FROM orders
HAVING COUNT(*) = 0;
```

---

### Q50. Interview Brain Teasers

```sql
-- 1. Swap values without temp column
UPDATE seat SET id = CASE
    WHEN id % 2 = 1 AND id < (SELECT COUNT(*) FROM seat) THEN id + 1
    WHEN id % 2 = 0 THEN id - 1
    ELSE id
END;

-- 2. Find the mode (most frequent value)
SELECT score FROM students
GROUP BY score
ORDER BY COUNT(*) DESC
LIMIT 1;

-- 3. Department with no employees
SELECT d.name FROM departments d
LEFT JOIN employees e ON d.id = e.dept_id
GROUP BY d.id, d.name
HAVING COUNT(e.id) = 0;

-- 4. Consecutive 3+ rows with same value
SELECT DISTINCT l1.id
FROM logs l1
JOIN logs l2 ON l2.id = l1.id + 1 AND l2.value = l1.value
JOIN logs l3 ON l3.id = l1.id + 2 AND l3.value = l1.value;
```

---

## Quick Reference — Pattern Cheat Sheet

```
╔════════════════════════════════════════════════════════════════════════╗
║  PATTERN                        │  SQL TOOL                            ║
║  ───────────────────────────────┼────────────────────────────────      ║
║  Nth highest/lowest             │  DENSE_RANK() or LIMIT OFFSET        ║
║  Top N per group                │  RANK() PARTITION BY                 ║
║  Running total                  │  SUM() OVER (ORDER BY ...)           ║
║  Moving average                 │  AVG() OVER (ROWS BETWEEN)           ║
║  Previous/Next row              │  LAG() / LEAD()                      ║
║  Compare with previous period   │  LAG() with date grouping            ║
║  Find duplicates                │  GROUP BY + HAVING COUNT > 1         ║
║  Find missing / no match        │  LEFT JOIN + IS NULL / NOT EXISTS    ║
║  Consecutive streak             │  ROW_NUMBER date subtraction         ║
║  Pivot rows → columns          │  CASE WHEN inside SUM/COUNT           ║
║  Hierarchy / Tree               │  Recursive CTE                       ║
║  Gap detection                  │  Generate series + LEFT JOIN         ║
║  Date overlaps                  │  A.start < B.end AND B.start < A.end ║
║  Pagination (fast)             │  Keyset (WHERE id > ?)                ║
║  % of total                     │  value / SUM() OVER ()               ║
║  Upsert                         │  ON DUPLICATE KEY / ON CONFLICT      ║
╚════════════════════════════════════════════════════════════════════════╝
```

---

_Practice these 50 problems and you'll recognize patterns in any SQL interview question._

### Historical Evolution

**Predecessors (with years):**
- **Alexander** (1977): Christopher Alexander's "A Pattern Language" introduced the concept of reusable design patterns in architecture, later adopted by software engineering (Gang of Four 1995)
- **LeetCode SQL Section** (2015): Categorized SQL interview questions into patterns (Top K, Consecutive, Gap Detection), making preparation systematic rather than random
- **HackerRank** (2012): Early platform that structured SQL challenges by difficulty and skill area
- **Pramp** (2015): Peer mock interview platform that revealed which patterns consistently appeared in real interviews
- **SQL-99 / SQL:2003** (1999/2003): Window functions and recursive CTE standardization enabled the complex patterns now tested in interviews

**Evolution narrative:**
Pattern-based SQL interview preparation emerged from the observation that despite thousands of possible questions, only ~30 core patterns exist. Early interview candidates memorized hundreds of specific questions, an exhausting approach that didn't transfer to novel problems. The Gang of Four design pattern movement (1995) inspired a similar categorization in SQL: instead of memorizing solutions, learn the underlying pattern (islands, gaps, ranks, running totals). LeetCode's SQL section (2015) made this systematic with tagged patterns, allowing candidates to practice "Consecutive Days" problems until mastery rather than memorizing each variant.

**Modern practice anchor:**
Modern SQL interviews at Google, Meta, and Amazon test pattern recognition—candidates who know the N-highest (DENSE_RANK), running total (SUM OVER), and consecutive streak (date-ROW_NUMBER) patterns can solve novel problems by identification rather than derivation.

### Production Reality

**Failure modes:**
1. **MySQL FULL OUTER JOIN workaround failures**: The UNION-based workaround (`LEFT JOIN ... UNION RIGHT JOIN ...`) is correct only when both sides return NULL-safe matches. If `table_a.id` and `table_b.id` both have NULLs, the UNION approach drops those rows (NULL != NULL). On large tables (50M+ rows), the intermediate LEFT + RIGHT results consume twice the temp space.
2. **Correlated IN vs EXISTS performance at 10M rows**: Correlated `IN (SELECT ...)` in MySQL pre-8.0 materializes the subquery for every outer row (1M outer rows × subquery = 1M full table scans). EXISTS with a join hint uses semi-join optimization — single scan with early termination. On 10M-row `orders` × 100K-row `customers`, IN takes 45 minutes; EXISTS takes 4 seconds.
3. **Slow query log missing critical queries**: Queries below `long_query_time = 2` are not logged. A query taking 1.8 seconds (just under threshold) running 100K times/day consumes 50 hours of DB CPU/day but leaves no trace in slow query log. `pg_stat_statements` (PostgreSQL) or `performance_schema` (MySQL) captures total execution time, not per-query time.

**Debug workflow:**
1. For FULL OUTER JOIN in MySQL, validate NULL row handling: `SELECT COUNT(*) FROM a LEFT JOIN b ON ... UNION SELECT COUNT(*) FROM a RIGHT JOIN b ON ...` — compare with actual row count. If different, use `WHERE id IS NOT NULL` guards on both sides.
2. Check query execution plans with `EXPLAIN FORMAT=JSON` for correlated subqueries. If `exec_nodes` shows "Materialize" with estimated rows equal to outer rows, the subquery is being materialized per row. Rewrite as JOIN or EXISTS.
3. Enable `performance_schema` in MySQL: `UPDATE performance_schema.setup_consumers SET ENABLED = 'YES' WHERE NAME LIKE '%statements%';` and query `performance_schema.events_statements_summary_by_digest` to find high-frequency, medium-duration queries.

**Modern practice anchor:**
Production SQL debugging requires `pg_stat_statements` / `performance_schema` for frequency + duration analysis, not just slow query logs which miss medium-duration high-frequency queries.


---

## Reality Check

**"Interview SQL problems represent real work"** → Interview problems test algorithmic SQL thinking: self-joins, window functions, recursive CTEs. Real work involves: understanding a 200-table schema, writing queries against poorly named columns with tribal knowledge requirements, optimizing slow queries on production data, and translating vague business questions into precise SQL. Practice interview problems for interviews but build schema understanding skills for the job.

**"The fastest query is always the best answer in an interview"** → Interviewers evaluate: correctness first, readability second, then performance. A correct, readable CTE-based solution that an interviewer can follow beats a clever single-query solution using obscure syntax that requires explanation. Write the readable version first, then offer the optimized version if asked about performance.

**"You should always normalize your SQL answers"** → Interview problems often require denormalized thinking: self-joins on the same table, conditional aggregation with CASE WHEN, and pivot-style queries. Over-normalizing your approach (creating temporary views for every subquery) adds complexity without value. Match your approach to the problem — some problems are naturally solved with denormalized patterns.

**"Window functions solve every ranking problem"** → ROW_NUMBER, RANK, and DENSE_RANK handle rankings differently: ROW_NUMBER gives unique ranks (1,2,3), RANK gives tied ranks with gaps (1,1,3), DENSE_RANK gives tied ranks without gaps (1,1,2). Using the wrong ranking function is a common interview mistake. Know the difference by considering: should ties share a rank? Should the next rank account for the number of ties?

**"NULL-safe comparisons are optional"** → Interview queries often have NULLs in test data that break naive solutions. A self-join comparing manager_id = employee_id misses rows where manager_id is NULL. A NOT IN subquery with NULL values returns empty results because NOT IN (1, 2, NULL) is never TRUE (anything compared to NULL yields UNKNOWN). Use NOT EXISTS or explicit IS NOT NULL checks. Interviewers deliberately include NULLs to test this awareness.
