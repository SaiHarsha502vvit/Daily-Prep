# 🗄️ SQL Interview Thinking — From Query to Production Decision

[⬅ Complexity Masterclass](04_Complexity_Analysis_Masterclass.md) | [📚 Index](00_INDEX.md) | [Next: System Design Blueprint ➡](06_System_Design_Blueprint.md)

---

**"SQL interviews test whether you can think in SETS, not loops."**

This guide bridges DSA thinking with SQL interview mastery. Same brain, different language.

---

## Table of Contents

1. [The SQL Mindset Shift](#1-the-sql-mindset-shift)
2. [Query Execution Order — The Foundation](#2-query-execution-order)
3. [The 15 SQL Interview Patterns](#3-the-15-sql-interview-patterns)
4. [Performance Thinking — EXPLAIN Your Way to Senior](#4-performance-thinking)
5. [Schema Design Interview Questions](#5-schema-design-interview-questions)
6. [SQL ↔ DSA Bridge](#6-sql-dsa-bridge)
7. [20 Interview Problems — Solved Like a Senior](#7-twenty-interview-problems)

---

## 1. The SQL Mindset Shift

### Procedural Brain vs Set-Based Brain

```
PROCEDURAL THINKING (how Java programmers think):
  "For each order, find the customer, check if they spent > $1000,
   add them to the result list, then sort by total"

SET-BASED THINKING (how SQL experts think):
  "The SET of customers whose total order amount exceeds $1000,
   ordered by their total"

  SELECT c.name, SUM(o.amount) AS total
  FROM customers c
  JOIN orders o ON c.id = o.customer_id
  GROUP BY c.id, c.name
  HAVING SUM(o.amount) > 1000
  ORDER BY total DESC;

THE SHIFT:
  ❌ STOP thinking: "loop through each row..."
  ✅ START thinking: "the SET of rows WHERE..."
```

### The 5W+H for SQL Problems

```
WHAT  → What tables/columns are involved? What's the output?
WHY   → Why can't a simple SELECT work? What makes this complex?
WHERE → Where do I filter? (WHERE vs HAVING vs JOIN condition)
WHEN  → When in the execution order does my logic apply?
WHO   → Who are the entities? (customer, order, product — ERD thinking)
HOW   → How do I express this? (JOIN type, window function, subquery)
```

---

🔬 **Section Challenge — 1. The SQL Mindset Shift**

**Challenge 1 (Procedural vs Set-Based Thinking):** A junior developer writes a Python script that pulls all 50,000 rows from the `Users` table into memory, loops through them to find users registered before 2020, and calculates the sum of their `lifetime_value`. Why is this an anti-pattern, and what is the specific SQL translation that represents "Set-Based Thinking"?

<details><summary>Answer</summary>

This is an anti-pattern because pulling all rows into application memory violates the **Data Gravity** principle—you are moving massive amounts of data to the compute, rather than pushing the compute to the data.

In "Set-Based Thinking," you define the _exact subset_ of data you want and let the database engine handle the loops in optimized C/C++ via indexes.
The correct SQL is:

```sql
SELECT SUM(lifetime_value)
FROM Users
WHERE registration_date < '2020-01-01';
```

This reduces network payload from 50,000 rows to a single integer, utilizing the database's native aggregation speed.

</details>

```
                    SQL EXECUTION ORDER
                    (not the order you write it!)

         ┌───────────────────────────────────┐
  Step 1 │  FROM / JOIN                       │ ← Combine tables
         │  Cartesian product, then ON filter │
         ├───────────────────────────────────┤
  Step 2 │  WHERE                             │ ← Row-level filtering
         │  Filter individual rows             │
         ├───────────────────────────────────┤
  Step 3 │  GROUP BY                          │ ← Create groups
         │  Aggregate rows into groups         │
         ├───────────────────────────────────┤
  Step 4 │  HAVING                            │ ← Group-level filtering
         │  Filter groups (after aggregation) │
         ├───────────────────────────────────┤
  Step 5 │  SELECT                            │ ← Choose columns
         │  Compute expressions, aliases       │
         ├───────────────────────────────────┤
  Step 6 │  DISTINCT                          │ ← Remove duplicates
         ├───────────────────────────────────┤
  Step 7 │  ORDER BY                          │ ← Sort results
         │  (can use aliases from SELECT)      │
         ├───────────────────────────────────┤
  Step 8 │  LIMIT / OFFSET                    │ ← Paginate
         └───────────────────────────────────┘

WHY THIS MATTERS IN INTERVIEWS:

  Q: "Why can't I use a column alias in WHERE?"
  A: "Because WHERE executes BEFORE SELECT. The alias
      doesn't exist yet when WHERE filters rows."

  Q: "Why use HAVING instead of WHERE for aggregate conditions?"
  A: "WHERE filters BEFORE grouping — it can't see aggregates.
      HAVING filters AFTER grouping — it CAN use aggregates."

  Q: "Can I use aliases in ORDER BY?"
  A: "Yes! ORDER BY executes AFTER SELECT, so aliases are available."
```

---

## 3. The 15 SQL Interview Patterns

### Pattern 1: TOP-N (Ranking)

```sql
-- "Find the second highest salary"
-- Three approaches (show you know alternatives):

-- Approach 1: OFFSET (simplest, but NULL handling needed)
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;
-- Problem: returns empty if < 2 salaries, not NULL

-- Approach 2: Subquery for NULL safety
SELECT (
    SELECT DISTINCT salary
    FROM employees
    ORDER BY salary DESC
    LIMIT 1 OFFSET 1
) AS second_highest;
-- Returns NULL if not found — correct behavior

-- Approach 3: Window function (most generalizable for Nth)
SELECT salary
FROM (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
    FROM employees
) ranked
WHERE rnk = 2
LIMIT 1;

-- INTERVIEW INSIGHT: "I'd use DENSE_RANK because it handles ties correctly.
-- If two people share the highest salary, DENSE_RANK assigns rank 1 to both
-- and rank 2 to the next distinct value. ROW_NUMBER would skip rank 2."
```

### Pattern 2: Running Aggregates (Window Functions)

```sql
-- "Calculate running total of sales by date"
SELECT
    sale_date,
    amount,
    SUM(amount) OVER (ORDER BY sale_date) AS running_total,
    AVG(amount) OVER (ORDER BY sale_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
        AS seven_day_avg
FROM sales;

-- KEY WINDOW FUNCTION TYPES:
-- ROWS BETWEEN ... AND ...    → Physical rows (exactly 7 rows)
-- RANGE BETWEEN ... AND ...   → Logical range (dates within 7 days)
-- PARTITION BY col            → Reset per group
-- ORDER BY col                → Define the window ordering
```

### Pattern 3: Self-JOIN (Comparing Rows)

```sql
-- "Find employees earning more than their manager"
SELECT e.name AS employee, e.salary AS emp_salary,
       m.name AS manager, m.salary AS mgr_salary
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;

-- "Find consecutive dates with increasing temperature"
SELECT w2.id
FROM weather w1
JOIN weather w2 ON w2.recordDate = w1.recordDate + INTERVAL '1 day'
WHERE w2.temperature > w1.temperature;
```

### Pattern 4: NOT EXISTS / LEFT JOIN NULL (Anti-Join)

```sql
-- "Find customers who never placed an order"

-- Approach 1: NOT EXISTS (usually most efficient)
SELECT c.name
FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.customer_id = c.id
);

-- Approach 2: LEFT JOIN + IS NULL
SELECT c.name
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;

-- Approach 3: NOT IN (beware NULLs!)
SELECT c.name
FROM customers c
WHERE c.id NOT IN (SELECT customer_id FROM orders WHERE customer_id IS NOT NULL);
-- ⚠️ If subquery returns NULL, NOT IN returns no rows! Always filter NULLs.

-- INTERVIEW: "I prefer NOT EXISTS because:
-- 1. It handles NULLs correctly
-- 2. It short-circuits (stops checking after first match)
-- 3. The optimizer can use anti-join strategies"
```

### Pattern 5: GROUP BY + HAVING (Aggregation Filtering)

```sql
-- "Find departments with more than 5 employees earning above average"
SELECT d.name, COUNT(*) AS high_earners
FROM departments d
JOIN employees e ON d.id = e.department_id
WHERE e.salary > (SELECT AVG(salary) FROM employees)
GROUP BY d.id, d.name
HAVING COUNT(*) > 5;

-- WHERE filters ROWS (before grouping)
-- HAVING filters GROUPS (after aggregation)
```

### Pattern 6: Pivoting / Conditional Aggregation

```sql
-- "Show sales by quarter as columns"
SELECT
    product_name,
    SUM(CASE WHEN quarter = 'Q1' THEN revenue ELSE 0 END) AS q1,
    SUM(CASE WHEN quarter = 'Q2' THEN revenue ELSE 0 END) AS q2,
    SUM(CASE WHEN quarter = 'Q3' THEN revenue ELSE 0 END) AS q3,
    SUM(CASE WHEN quarter = 'Q4' THEN revenue ELSE 0 END) AS q4
FROM sales
GROUP BY product_name;

-- This is the SQL equivalent of a pivot table.
-- PostgreSQL has CROSSTAB, MySQL/Postgres support FILTER (WHERE ...)
```

### Pattern 7: Recursive CTE (Hierarchical Data)

```sql
-- "Find all managers in the chain above an employee"
WITH RECURSIVE manager_chain AS (
    -- Base case: the employee
    SELECT id, name, manager_id, 1 AS level
    FROM employees
    WHERE id = 42

    UNION ALL

    -- Recursive case: their manager, and their manager's manager...
    SELECT e.id, e.name, e.manager_id, mc.level + 1
    FROM employees e
    JOIN manager_chain mc ON e.id = mc.manager_id
)
SELECT * FROM manager_chain ORDER BY level;

-- USE CASES: org charts, bill of materials, file systems, category trees
-- ALWAYS add a depth limit to prevent infinite recursion
```

### Pattern 8: Date/Time Gaps and Islands

```sql
-- "Find consecutive login streaks"
WITH numbered AS (
    SELECT user_id, login_date,
           login_date - ROW_NUMBER() OVER (
               PARTITION BY user_id ORDER BY login_date
           ) * INTERVAL '1 day' AS grp
    FROM logins
)
SELECT user_id,
       MIN(login_date) AS streak_start,
       MAX(login_date) AS streak_end,
       COUNT(*) AS streak_days
FROM numbered
GROUP BY user_id, grp
HAVING COUNT(*) >= 3;  -- Streaks of 3+ days

-- THE ISLAND TRICK:
-- Consecutive dates minus their row number = same constant
-- Dates: Jan 1, Jan 2, Jan 3, Jan 5, Jan 6
-- Row#:    1      2      3      4      5
-- Diff:  Dec 31 Dec 31 Dec 31 Jan 1  Jan 1  ← groups emerge!
```

### Pattern 9: Percentile / Median

```sql
-- "Find the median salary per department"

-- Approach 1: PERCENTILE_CONT (PostgreSQL)
SELECT department_id,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) AS median
FROM employees
GROUP BY department_id;

-- Approach 2: Using ROW_NUMBER (works everywhere)
WITH ranked AS (
    SELECT salary, department_id,
           ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary) AS rn,
           COUNT(*) OVER (PARTITION BY department_id) AS cnt
    FROM employees
)
SELECT department_id, AVG(salary) AS median
FROM ranked
WHERE rn IN (FLOOR((cnt + 1) / 2.0), CEIL((cnt + 1) / 2.0))
GROUP BY department_id;
```

### Pattern 10: Lead/Lag (Adjacent Row Comparison)

```sql
-- "Find the difference between each sale and the previous sale"
SELECT
    sale_date,
    amount,
    LAG(amount) OVER (ORDER BY sale_date) AS prev_amount,
    amount - LAG(amount) OVER (ORDER BY sale_date) AS change,
    LEAD(amount) OVER (ORDER BY sale_date) AS next_amount
FROM sales;

-- LAG(col, N, default) → N rows BEFORE current
-- LEAD(col, N, default) → N rows AFTER current
```

### Pattern 11: EXISTS for Correlated Conditions

```sql
-- "Find products that were never returned"
SELECT p.name
FROM products p
WHERE EXISTS (
    SELECT 1 FROM order_items oi WHERE oi.product_id = p.id
)
AND NOT EXISTS (
    SELECT 1 FROM returns r WHERE r.product_id = p.id
);
-- "Sold at least once AND never returned"
```

### Pattern 12: UNION / INTERSECT / EXCEPT (Set Operations)

```sql
-- "Find customers who bought from BOTH category A and category B"
SELECT customer_id FROM orders WHERE category = 'A'
INTERSECT
SELECT customer_id FROM orders WHERE category = 'B';

-- Equivalent self-join:
SELECT DISTINCT a.customer_id
FROM orders a
JOIN orders b ON a.customer_id = b.customer_id
WHERE a.category = 'A' AND b.category = 'B';
```

### Pattern 13: Lateral Join / CROSS APPLY

```sql
-- "For each customer, show their last 3 orders"
SELECT c.name, recent.order_date, recent.amount
FROM customers c
CROSS JOIN LATERAL (
    SELECT order_date, amount
    FROM orders o
    WHERE o.customer_id = c.id
    ORDER BY order_date DESC
    LIMIT 3
) recent;

-- LATERAL = "for each row in the outer query, run this subquery"
-- Like a correlated subquery but returns multiple rows
```

### Pattern 14: Cumulative Distribution / Percentages

```sql
-- "What percentage of total revenue does each product contribute?"
SELECT
    product_name,
    revenue,
    revenue * 100.0 / SUM(revenue) OVER () AS pct_of_total,
    SUM(revenue) OVER (ORDER BY revenue DESC) * 100.0
        / SUM(revenue) OVER () AS cumulative_pct
FROM product_sales
ORDER BY revenue DESC;
-- This creates a Pareto chart (80/20 analysis) in SQL
```

### Pattern 15: Deduplication / First Row Per Group

```sql
-- "For each customer, find their most recent order"

-- Approach 1: ROW_NUMBER (most flexible)
WITH ranked AS (
    SELECT *, ROW_NUMBER() OVER (
        PARTITION BY customer_id ORDER BY order_date DESC
    ) AS rn
    FROM orders
)
SELECT * FROM ranked WHERE rn = 1;

-- Approach 2: DISTINCT ON (PostgreSQL only)
SELECT DISTINCT ON (customer_id) *
FROM orders
ORDER BY customer_id, order_date DESC;

-- Approach 3: Correlated subquery
SELECT *
FROM orders o1
WHERE order_date = (
    SELECT MAX(order_date) FROM orders o2
    WHERE o2.customer_id = o1.customer_id
);
```

---

## 4. Performance Thinking — EXPLAIN Your Way to Senior

### Reading EXPLAIN Output

```
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 42;

POSSIBLE OUTPUTS:

1. Seq Scan on orders (cost=0.00..1542.00 rows=100 width=45)
   Filter: (customer_id = 42)
   Rows Removed by Filter: 99900
   Actual time: 15.234ms
   → PROBLEM: scanning ALL 100K rows to find 100. Need index!

2. Index Scan using idx_orders_customer on orders (cost=0.42..8.44 rows=100)
   Index Cond: (customer_id = 42)
   Actual time: 0.234ms
   → GOOD: Using index, only reading relevant rows.

3. Bitmap Heap Scan on orders (cost=5.17..397.00 rows=100)
   → Bitmap Index Scan on idx_orders_customer
   → OK: Using bitmap for moderate selectivity. Not as fast as index scan
     but better than seq scan.
```

### The Performance Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                SQL PERFORMANCE DECISION TREE                      │
│                                                                   │
│  Query is slow                                                   │
│       │                                                          │
│       ▼                                                          │
│  Run EXPLAIN ANALYZE                                             │
│       │                                                          │
│  ┌────┴────────────────────────────────────────┐                 │
│  │                                              │                │
│  ▼                                              ▼                │
│  Seq Scan on large table?              Nested Loop with Seq Scan?│
│  │                                     │                         │
│  ▼                                     ▼                         │
│  ADD INDEX on                          ADD INDEX on              │
│  WHERE/JOIN columns                    JOIN column (FK)           │
│                                                                   │
│  Still slow?                                                     │
│  │                                                               │
│  ├─ Check column ORDER in composite index (matches query?)       │
│  ├─ Check if SELECT * pulls unnecessary columns                  │
│  ├─ Check cardinality (index ignored if > 20% of table scanned) │
│  ├─ Check for implicit type conversion (kills index usage)       │
│  ├─ Check for function on indexed column: WHERE YEAR(date) =... │
│  │   → Rewrite as WHERE date BETWEEN '2024-01-01' AND '2024-12-31'│
│  └─ Consider covering index (include all SELECT columns)         │
└─────────────────────────────────────────────────────────────────┘
```

### Index Strategy Cheat Sheet

```
WHEN DO YOU NEED AN INDEX?

  ✅ YES — Always index:
    • Primary Key (automatic)
    • Foreign Keys (JOIN performance)
    • Columns in WHERE that filter large tables
    • Columns in ORDER BY (avoids sort)

  ⚠️ MAYBE — Consider carefully:
    • Columns in GROUP BY (depends on query mix)
    • Column used in range filters (BETWEEN, >, <)
    • Multi-column filters → composite index

  ❌ NO — Skip index:
    • Small tables (< 1000 rows)
    • Low cardinality columns (boolean, status with 3 values)
    • Tables with heavy writes, rare reads
    • Columns never used in WHERE/JOIN/ORDER BY

COMPOSITE INDEX ORDER MATTERS:
  INDEX(a, b, c) can be used for:
    • WHERE a = ?                    ✅ (leftmost prefix)
    • WHERE a = ? AND b = ?          ✅
    • WHERE a = ? AND b = ? AND c = ? ✅
    • WHERE b = ?                    ❌ (not leftmost!)
    • WHERE a = ? AND c = ?          ✅ a part used, c requires scan

  RULE: Put equality columns FIRST, range columns LAST
    → Good: INDEX(status, created_at) for WHERE status = 'active' AND created_at > ?
    → Bad:  INDEX(created_at, status) — range on first column blocks second
```

---

🔬 **Section Challenge — 4. Performance Thinking — EXPLAIN Your Way to Senior**

**Challenge 1 (Composite Index Trap):** You have a table `Orders` with a composite index on `(status, created_at)`. You run the following query: `SELECT * FROM Orders WHERE created_at > '2024-01-01' AND status = 'SHIPPED';`. Will this query fully utilize the composite index? Explain why or why not based on the EXPLAIN rules.

<details><summary>Answer</summary>

**Yes, it will fully utilize the index.**
The trap here is thinking that the order of conditions in the `WHERE` clause must match the index definition. _The SQL Optimizer is smart enough to reorder your `WHERE` conditions to match the index._

Because `status` is an equality check (`=`) and it is the **first** column in the `(status, created_at)` index, the database will instantly jump to the 'SHIPPED' section of the B-Tree, and then seamlessly scan the contiguous `created_at` values > '2024-01-01'.
(Note: If the index was `(created_at, status)`, the range scan on `created_at` would block the index from filtering efficiently on `status`, leading to heavy sequential scanning).

</details>

### Normalization vs Denormalization

```
NORMALIZATION (3NF):
  ✅ No data redundancy
  ✅ Easy to update (change in one place)
  ✅ Data integrity guaranteed
  ❌ More JOINs needed for queries
  ❌ Slower reads for complex reports

  USE WHEN: OLTP system, many writes, data integrity critical

DENORMALIZATION:
  ✅ Faster reads (fewer JOINs)
  ✅ Simpler queries
  ❌ Data redundancy (storage cost)
  ❌ Update anomalies (must update multiple places)
  ❌ Harder to maintain consistency

  USE WHEN: OLAP/reporting, read-heavy workload, acceptable staleness

INTERVIEW ANSWER:
  "I'd normalize for the transactional system (3NF for data integrity),
   then create denormalized views or summary tables for reporting queries.
   This gives us the best of both worlds."
```

### Schema Design Patterns

```
PATTERN: SOFT DELETE
  ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
  -- NULL means active, timestamp means deleted

  INTERVIEW CONSIDERATIONS:
  • Add partial index: CREATE INDEX idx_active ON users(id) WHERE deleted_at IS NULL
  • All queries need WHERE deleted_at IS NULL (easy to forget!)
  • Alternative: move to archive table (cleaner but more complex)

PATTERN: POLYMORPHIC ASSOCIATION
  -- "Comments can belong to posts, videos, or photos"

  -- Approach 1: Separate FK columns (sparse but safe)
  CREATE TABLE comments (
      id SERIAL PRIMARY KEY,
      body TEXT,
      post_id INT REFERENCES posts(id),
      video_id INT REFERENCES videos(id),
      -- Only one will be non-NULL
      CHECK (num_nonnulls(post_id, video_id) = 1)
  );

  -- Approach 2: Type + ID (flexible but no FK)
  CREATE TABLE comments (
      id SERIAL PRIMARY KEY,
      body TEXT,
      commentable_type VARCHAR(50),  -- 'Post', 'Video'
      commentable_id INT             -- No FK constraint possible!
  );

  INTERVIEW: "Approach 1 has referential integrity. Approach 2 is more
  flexible (supports new types without schema change) but loses FK safety.
  I'd use Approach 1 unless the number of types is truly dynamic."

PATTERN: TYPE 2 SLOWLY CHANGING DIMENSION
  -- Track historical changes
  CREATE TABLE employee_history (
      id SERIAL,
      employee_id INT,
      salary INT,
      title VARCHAR(100),
      valid_from DATE,
      valid_to DATE,  -- NULL means current
      is_current BOOLEAN DEFAULT true
  );
  -- Query current: WHERE is_current = true
  -- Query point-in-time: WHERE valid_from <= date AND (valid_to IS NULL OR valid_to > date)
```

---

## 6. SQL ↔ DSA Bridge

### Same Concept, Different Language

```
┌──────────────────────┬──────────────────────┬──────────────────────┐
│  DSA Concept         │  SQL Equivalent       │  Example             │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ HashMap lookup       │ Index Seek             │ WHERE id = 5         │
│ Sorting              │ ORDER BY               │ ORDER BY name        │
│ Filtering            │ WHERE                  │ WHERE age > 25       │
│ GroupBy + Reduce     │ GROUP BY + aggregate   │ GROUP BY dept SUM()  │
│ Sliding Window       │ Window Function        │ SUM() OVER (ROWS...)│
│ Two Pointer          │ Self-JOIN              │ t1 JOIN t1 ON ...    │
│ Binary Search        │ B-Tree Index           │ Auto in index scan   │
│ DFS/BFS              │ Recursive CTE          │ WITH RECURSIVE ...   │
│ Set operations       │ UNION/INTERSECT/EXCEPT │ Real set math        │
│ Prefix Sum           │ Running SUM() OVER()   │ Cumulative total     │
│ Merge two sorted     │ UNION ALL + ORDER BY   │ Combine + sort       │
│ Count distinct       │ COUNT(DISTINCT col)    │ Unique values        │
│ Top-K                │ ORDER BY + LIMIT K     │ Top K results        │
│ Frequency count      │ GROUP BY + COUNT       │ Mode, histogram      │
│ Deduplication        │ DISTINCT / ROW_NUMBER  │ First per group      │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

### Think Like an Optimizer

```
THE DB OPTIMIZER IS AN ALGORITHM SELECTOR:

  Your SQL query describes WHAT you want.
  The optimizer decides HOW to get it (algorithm choice).

  Nested Loop Join = Brute force O(n × m)   → small tables
  Hash Join         = HashMap O(n + m)       → medium-large, equi-join
  Merge Join        = Merge sorted O(n + m)  → pre-sorted, range joins

  Index Scan = Binary Search O(log n)
  Seq Scan   = Linear Scan O(n)

  "Understanding the optimizer means knowing WHICH algorithm
   the database will choose, and providing indexes/statistics
   so it makes the RIGHT choice."
```

---

## 7. 20 Interview Problems — Solved Like a Senior

### Problem 1: Consecutive Numbers

```sql
-- "Find numbers that appear at least 3 times consecutively"
-- Table: Logs(id, num)

-- Approach: Self-join on consecutive IDs
SELECT DISTINCT l1.num AS ConsecutiveNums
FROM logs l1
JOIN logs l2 ON l1.id = l2.id - 1
JOIN logs l3 ON l2.id = l3.id - 1
WHERE l1.num = l2.num AND l2.num = l3.num;

-- Better: Window function (handles gaps in IDs)
WITH groups AS (
    SELECT num,
           id - ROW_NUMBER() OVER (PARTITION BY num ORDER BY id) AS grp
    FROM logs
)
SELECT DISTINCT num FROM groups
GROUP BY num, grp
HAVING COUNT(*) >= 3;
```

### Problem 2: Department with Highest Average Salary

```sql
-- "Find the department(s) with the highest average salary"
WITH dept_avg AS (
    SELECT department_id, AVG(salary) AS avg_sal,
           RANK() OVER (ORDER BY AVG(salary) DESC) AS rnk
    FROM employees
    GROUP BY department_id
)
SELECT d.name, da.avg_sal
FROM dept_avg da
JOIN departments d ON da.department_id = d.id
WHERE da.rnk = 1;
-- Using RANK handles ties (multiple departments with same avg)
```

### Problem 3: Trips and Users Cancellation Rate

```sql
-- "Find the cancellation rate for unbanned users per day"
SELECT
    t.request_at AS Day,
    ROUND(
        SUM(CASE WHEN t.status LIKE 'cancelled%' THEN 1.0 ELSE 0 END)
        / COUNT(*), 2
    ) AS "Cancellation Rate"
FROM trips t
JOIN users c ON t.client_id = c.users_id AND c.banned = 'No'
JOIN users d ON t.driver_id = d.users_id AND d.banned = 'No'
WHERE t.request_at BETWEEN '2013-10-01' AND '2013-10-03'
GROUP BY t.request_at;
```

### Problem 4: Exchange Seats

```sql
-- "Swap every two consecutive students' seats"
SELECT
    CASE
        WHEN id % 2 = 1 AND id = (SELECT MAX(id) FROM seat) THEN id
        WHEN id % 2 = 1 THEN id + 1
        ELSE id - 1
    END AS id,
    student
FROM seat
ORDER BY id;
-- Odd IDs get +1, even IDs get -1, last odd ID stays (if odd total)
```

### Problem 5: Employees Earning More Than Managers

```sql
SELECT e.name AS Employee
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;
-- Classic self-join. Interview: explain why self-join works.
```

### Problem 6: Rank Scores

```sql
-- Dense ranking of scores
SELECT score,
       DENSE_RANK() OVER (ORDER BY score DESC) AS rank
FROM scores
ORDER BY score DESC;

-- EXPLAIN the difference between:
-- ROW_NUMBER: 1, 2, 3, 4 (no ties)
-- RANK:       1, 1, 3, 4 (ties skip numbers)
-- DENSE_RANK: 1, 1, 2, 3 (ties don't skip)
```

### Problem 7: Customers Who Bought All Products

```sql
-- "Find customers who bought every product"
SELECT customer_id
FROM customer_product
GROUP BY customer_id
HAVING COUNT(DISTINCT product_id) = (SELECT COUNT(*) FROM products);
-- The HAVING clause checks: "did this customer buy as many distinct
-- products as the total number of products?"
```

### Problem 8: Year-over-Year Growth

```sql
WITH yearly AS (
    SELECT
        EXTRACT(YEAR FROM order_date) AS year,
        SUM(amount) AS total
    FROM orders
    GROUP BY EXTRACT(YEAR FROM order_date)
)
SELECT
    y.year,
    y.total,
    prev.total AS prev_year,
    ROUND((y.total - prev.total) * 100.0 / prev.total, 2) AS yoy_growth_pct
FROM yearly y
LEFT JOIN yearly prev ON y.year = prev.year + 1
ORDER BY y.year;
```

### Problem 9: Nth Highest (Generalized)

```sql
-- "Write a function to find the Nth highest salary"
CREATE FUNCTION getNthHighestSalary(N INT) RETURNS INT AS $$
    SELECT DISTINCT salary
    FROM (
        SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
        FROM employees
    ) ranked
    WHERE rnk = N;
$$ LANGUAGE SQL;
```

### Problem 10: Moving Average

```sql
-- "7-day moving average of daily revenue"
SELECT
    sale_date,
    daily_revenue,
    AVG(daily_revenue) OVER (
        ORDER BY sale_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS seven_day_avg
FROM daily_sales;
-- NOTE: ROWS = exact row count, RANGE = value-based (different for gaps!)
```

### Problems 11-20: Quick Solutions

```sql
-- 11. Find duplicate emails
SELECT email FROM person GROUP BY email HAVING COUNT(*) > 1;

-- 12. Customers who placed orders in consecutive months
WITH monthly AS (
    SELECT customer_id, DATE_TRUNC('month', order_date) AS month,
           LAG(DATE_TRUNC('month', order_date)) OVER (
               PARTITION BY customer_id ORDER BY DATE_TRUNC('month', order_date)
           ) AS prev_month
    FROM orders
)
SELECT DISTINCT customer_id FROM monthly
WHERE month - prev_month = INTERVAL '1 month';

-- 13. Running total per category
SELECT category, sale_date, amount,
       SUM(amount) OVER (PARTITION BY category ORDER BY sale_date) AS running_total
FROM sales;

-- 14. First purchase per customer
SELECT DISTINCT ON (customer_id) *
FROM orders ORDER BY customer_id, order_date;
-- (PostgreSQL) or ROW_NUMBER approach for MySQL

-- 15. Products that were never bought
SELECT p.name FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
WHERE oi.id IS NULL;

-- 16. Pivot monthly sales
SELECT product_id,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 1 THEN amount END) AS jan,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 2 THEN amount END) AS feb
FROM sales GROUP BY product_id;

-- 17. Median using PERCENTILE_CONT
SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) FROM employees;

-- 18. Tree node type (root, inner, leaf)
SELECT id,
    CASE
        WHEN parent_id IS NULL THEN 'Root'
        WHEN id IN (SELECT parent_id FROM tree WHERE parent_id IS NOT NULL) THEN 'Inner'
        ELSE 'Leaf'
    END AS type
FROM tree;

-- 19. Gaps in sequence
SELECT a.id + 1 AS gap_start, MIN(b.id) - 1 AS gap_end
FROM seq a
JOIN seq b ON b.id > a.id
WHERE a.id + 1 NOT IN (SELECT id FROM seq)
GROUP BY a.id;

-- 20. Department budget utilization
WITH dept_usage AS (
    SELECT d.name, d.budget,
           COALESCE(SUM(e.salary), 0) AS total_salary,
           ROUND(COALESCE(SUM(e.salary), 0) * 100.0 / d.budget, 2) AS utilization
    FROM departments d
    LEFT JOIN employees e ON d.id = e.department_id
    GROUP BY d.id, d.name, d.budget
)
SELECT *, CASE
    WHEN utilization > 100 THEN 'OVER BUDGET'
    WHEN utilization > 90 THEN 'WARNING'
    ELSE 'OK'
END AS status
FROM dept_usage ORDER BY utilization DESC;
```

---

## Cross-References

| Topic                            | Deep Dive                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| SQL Complete Guide (48 chapters) | [08_SQL/](../08_SQL/00_INDEX.md)                                                            |
| Production SQL Scenarios         | [08_SQL/38-42 (Real-World Scenarios)](../08_SQL/38_RealWorld_Production_Scenarios_Part1.md) |
| Interview Scenario Explanations  | [08_SQL/44-46 (Interview Scenarios)](../08_SQL/44_Interview_Scenarios_Explained_Part1.md)   |
| Database Internals Theory        | [08_SQL/47 (Theory Deep Dive)](../08_SQL/47_Theory_Deep_Dive_Database_Internals.md)         |
| DSA Algorithm Thinking           | [03_Algorithms/01_Algorithm_Thinking](../03_Algorithms/01_Algorithm_Thinking.md)            |

---

[⬅ Complexity Masterclass](04_Complexity_Analysis_Masterclass.md) | [📚 Index](00_INDEX.md) | [Next: System Design Blueprint ➡](06_System_Design_Blueprint.md)


---

## Reality Check

**"SQL interviews test whether you know the syntax"** ? SQL interviews test THINKING in sets and the query pipeline, not syntax recall ([14_MM SQL-pipeline, 08_SQL]): the logical execution order (FROM-WHERE-GROUP-HAVING-SELECT-ORDER � the [14_MM SQL-pipeline] that explains why aliases work in ORDER BY not WHERE, why aggregates need HAVING), the set-based thinking (the join-and-aggregate over the row-by-row loop � the [Enterprise 06] set-based-not-procedural), and the window functions for the analytical questions. "Know the syntax" is the surface � the interview probes whether you think in the SQL pipeline (the [14_MM] mental model), decompose an analytical question into the right joins-groups-windows, and reason about what the query actually computes, which is why syntax-memorization fails on the novel question that needs the pipeline-thinking to construct.

**"Window functions are advanced and rarely needed"** ? Window functions are core to analytical SQL and appear constantly in real interviews and work ([08_SQL, Problem_Sets_SQL/16]): the running total, the rank-within-group, the lag/lead for period-comparison, the top-N-per-group � the analytical questions that GROUP BY cannot answer (the [08_SQL] window-versus-aggregate, the row-level detail alongside the aggregate that windows provide and grouping collapses). "Advanced and rarely needed" is the outdated view � window functions are the standard tool for the ranking, running-total, period-comparison, and top-N-per-group questions that dominate analytical SQL interviews and real reporting work, and the candidate who avoids them (the correlated-subquery workaround, the self-join gymnastics) writes worse, slower queries for the questions windows solve cleanly.

**"The query works, so it's correct"** ? A query returning results is not a correct query � the SQL correctness traps are subtle ([14_MM SQL-pipeline, 08_SQL]): the JOIN that duplicates rows (the one-to-many fanout that inflates the SUM � the [08_SQL] cardinality bug), the NULL handling (the NOT IN with NULLs that returns empty, the aggregate that skips NULLs changing the denominator � the [14_MM SQL-pipeline] three-valued logic), the WHERE-versus-ON on outer joins (the condition that silently converts LEFT to INNER � [14_MM SQL-pipeline]), and the GROUP BY that is wrong-grained. "Works therefore correct" is why SQL bugs reach production � the query runs and returns plausible numbers that are wrong (the duplicated-by-join sum, the NULL-dropped rows), and the correctness check is reasoning through the pipeline (the join cardinality, the NULL semantics, the grouping grain) not just seeing results appear.

**"Optimize the query by adding indexes"** ? Query optimization in interviews and practice is about the query STRUCTURE and the execution plan, not reflexive index-adding ([08_SQL, 13_DE, 06_OOP system-design]): the query rewritten to be sargable (the function-on-the-column that defeats the index � the [08_SQL] index-usability), the join order and the plan (the EXPLAIN that shows the actual bottleneck � [13_DE profile-first]), the avoiding of the correlated subquery that runs per-row, and the right index for the actual query pattern ([13_DE system-design] leftmost-prefix). "Add indexes" is the reflexive non-answer � the interview probes whether you can read a plan, rewrite a query to be index-usable, and reason about the actual cost ([08_SQL internals]), and indexes are one tool (with their own write-cost � [13_DE]) applied after understanding the query's actual performance problem, not the blanket first response to "make it faster."

**"SQL thinking is separate from programming thinking"** ? SQL's set-based, declarative thinking is a distinct and valuable MODE that complements procedural thinking, and the strongest engineers switch between them ([14_MM SQL-pipeline, Enterprise 06]): the problem solved elegantly in one set-based query versus painfully in application-code loops (the [Enterprise 06] set-based-beats-row-by-row � the N+1 that a join eliminates), the declarative "what I want" versus the procedural "how to get it." "Separate from programming" undersells the value � SQL thinking (sets, declarative, the pipeline) is a mode that, when fluent, solves data problems far more efficiently than procedural code (the [Enterprise 06] batch that should be a query), and the engineer who thinks procedurally in SQL (the cursor loop, the app-side join) writes slow wrong queries, which is why developing the set-based declarative mode (the [14_MM SQL-pipeline]) is a real skill that complements and does not duplicate procedural programming thinking.
