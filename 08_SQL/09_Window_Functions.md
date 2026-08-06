**SQL Chapter 09/20** | [← Previous](08_Subqueries_CTEs.md) | [Index](../00_MASTER_INDEX.md) | [Next →](10_Normalization.md)

---

## Chapter 9: Window Functions

### Window Functions Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    WINDOW FUNCTIONS - OVERVIEW                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Window functions perform calculations across a SET of rows related to the      │
│  current row, WITHOUT collapsing the result into a single row (unlike GROUP BY).│
│                                                                                 │
│  Syntax:                                                                        │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  function_name() OVER (                                                    │ │
│  │      [PARTITION BY column1, column2]  ← Groups for calculation             │ │
│  │      [ORDER BY column3]               ← Order within group                 │ │
│  │      [ROWS/RANGE frame_clause]        ← Which rows to consider             │ │
│  │  )                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  WINDOW FUNCTION CATEGORIES:                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  1. RANKING Functions                                                      │ │
│  │     • ROW_NUMBER() - Unique sequential number                              │ │
│  │     • RANK()       - Rank with gaps                                        │ │
│  │     • DENSE_RANK() - Rank without gaps                                     │ │
│  │     • NTILE(n)     - Divide into n groups                                  │ │
│  │                                                                            │ │
│  │  2. VALUE Functions                                                        │ │
│  │     • LAG()         - Previous row value                                   │ │
│  │     • LEAD()        - Next row value                                       │ │
│  │     • FIRST_VALUE() - First value in window                                │ │
│  │     • LAST_VALUE()  - Last value in window                                 │ │
│  │     • NTH_VALUE()   - Nth value in window                                  │ │
│  │                                                                            │ │
│  │  3. AGGREGATE Functions (as window)                                        │ │
│  │     • SUM() OVER()                                                         │ │
│  │     • AVG() OVER()                                                         │ │
│  │     • COUNT() OVER()                                                       │ │
│  │     • MIN() OVER(), MAX() OVER()                                           │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Ranking Functions

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- RANKING FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Sample data for examples:
-- employees: (emp_id, name, dept_id, salary)
-- 1, Alice, 1, 100000
-- 2, Bob, 1, 90000
-- 3, Carol, 1, 90000
-- 4, Dave, 2, 85000
-- 5, Eve, 2, 85000
-- 6, Frank, 2, 75000

-- ROW_NUMBER - Unique number for each row
SELECT
    first_name,
    dept_id,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num
FROM employees;
-- Alice: 1, Bob: 2, Carol: 3 (unique even with same salary)

-- ROW_NUMBER with PARTITION
SELECT
    first_name,
    dept_id,
    salary,
    ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dept_rank
FROM employees;
-- Dept 1: Alice=1, Bob=2, Carol=3
-- Dept 2: Dave=1, Eve=2, Frank=3


-- RANK - Same rank for ties, then gaps
SELECT
    first_name,
    salary,
    RANK() OVER (ORDER BY salary DESC) AS rnk
FROM employees;
-- Alice: 1, Bob: 2, Carol: 2, Dave: 4, Eve: 4, Frank: 6
-- (Note the gap after ties)


-- DENSE_RANK - Same rank for ties, no gaps
SELECT
    first_name,
    salary,
    DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk
FROM employees;
-- Alice: 1, Bob: 2, Carol: 2, Dave: 3, Eve: 3, Frank: 4
-- (No gaps)


-- NTILE - Divide into N groups
SELECT
    first_name,
    salary,
    NTILE(3) OVER (ORDER BY salary DESC) AS salary_tercile
FROM employees;
-- Groups employees into 3 equal-ish buckets
-- Top 33%: 1, Middle 33%: 2, Bottom 33%: 3


-- PRACTICAL: Top 3 earners per department
SELECT * FROM (
    SELECT
        e.*,
        d.dept_name,
        DENSE_RANK() OVER (PARTITION BY e.dept_id ORDER BY e.salary DESC) AS dept_rank
    FROM employees e
    JOIN departments d ON e.dept_id = d.dept_id
) ranked
WHERE dept_rank <= 3;


-- PRACTICAL: Percentile ranking
SELECT
    first_name,
    salary,
    PERCENT_RANK() OVER (ORDER BY salary) AS percentile,
    CUME_DIST() OVER (ORDER BY salary) AS cumulative_dist
FROM employees;
```

### LAG and LEAD

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- LAG AND LEAD - ACCESS ADJACENT ROWS
-- ═══════════════════════════════════════════════════════════════════════════════

-- LAG - Get previous row value
SELECT
    order_date,
    total AS today_sales,
    LAG(total, 1) OVER (ORDER BY order_date) AS yesterday_sales,
    total - LAG(total, 1) OVER (ORDER BY order_date) AS daily_change
FROM daily_sales;

-- LAG with default value (avoid NULL)
SELECT
    order_date,
    total,
    LAG(total, 1, 0) OVER (ORDER BY order_date) AS prev_total
FROM daily_sales;

-- LEAD - Get next row value
SELECT
    order_date,
    total AS today_sales,
    LEAD(total, 1) OVER (ORDER BY order_date) AS tomorrow_sales
FROM daily_sales;


-- Month-over-month growth
SELECT
    month,
    revenue,
    LAG(revenue) OVER (ORDER BY month) AS prev_month,
    ROUND((revenue - LAG(revenue) OVER (ORDER BY month)) /
          LAG(revenue) OVER (ORDER BY month) * 100, 2) AS mom_growth_pct
FROM monthly_revenue;


-- Year-over-year comparison
SELECT
    month,
    revenue,
    LAG(revenue, 12) OVER (ORDER BY month) AS same_month_last_year,
    revenue - LAG(revenue, 12) OVER (ORDER BY month) AS yoy_change
FROM monthly_revenue;


-- Find consecutive events (login streaks)
WITH user_logins AS (
    SELECT
        user_id,
        login_date,
        LAG(login_date) OVER (PARTITION BY user_id ORDER BY login_date) AS prev_login,
        DATEDIFF(login_date, LAG(login_date) OVER (PARTITION BY user_id ORDER BY login_date)) AS days_since_last
    FROM logins
)
SELECT * FROM user_logins WHERE days_since_last = 1;  -- Consecutive days
```

### Running Totals and Moving Averages

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- AGGREGATE WINDOW FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Running total (cumulative sum)
SELECT
    order_date,
    total,
    SUM(total) OVER (ORDER BY order_date) AS running_total
FROM orders;

-- Running total by category
SELECT
    category_id,
    order_date,
    total,
    SUM(total) OVER (PARTITION BY category_id ORDER BY order_date) AS category_running_total
FROM orders;


-- Moving average (last 7 days)
SELECT
    order_date,
    total,
    AVG(total) OVER (
        ORDER BY order_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7day
FROM daily_sales;


-- Moving sum (last 30 days)
SELECT
    order_date,
    total,
    SUM(total) OVER (
        ORDER BY order_date
        ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
    ) AS rolling_30day_total
FROM daily_sales;


-- Percentage of total
SELECT
    dept_id,
    first_name,
    salary,
    SUM(salary) OVER () AS company_total,
    ROUND(salary * 100.0 / SUM(salary) OVER (), 2) AS pct_of_total
FROM employees;

-- Percentage within department
SELECT
    dept_id,
    first_name,
    salary,
    SUM(salary) OVER (PARTITION BY dept_id) AS dept_total,
    ROUND(salary * 100.0 / SUM(salary) OVER (PARTITION BY dept_id), 2) AS pct_of_dept
FROM employees;


-- ═══════════════════════════════════════════════════════════════════════════════
-- WINDOW FRAME SPECIFICATION
-- ═══════════════════════════════════════════════════════════════════════════════

/*
ROWS BETWEEN:
- UNBOUNDED PRECEDING: From the beginning
- n PRECEDING: n rows before current
- CURRENT ROW: The current row
- n FOLLOWING: n rows after current
- UNBOUNDED FOLLOWING: To the end

Examples:
*/

-- All rows from start to current
SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)

-- 3 rows before and after current (7-row window)
AVG(amount) OVER (ORDER BY date ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING)

-- Current row to the end
SUM(amount) OVER (ORDER BY date ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)

-- All rows (entire window)
SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)


-- ═══════════════════════════════════════════════════════════════════════════════
-- FIRST_VALUE, LAST_VALUE, NTH_VALUE
-- ═══════════════════════════════════════════════════════════════════════════════

-- First hired in each department
SELECT
    dept_id,
    first_name,
    hire_date,
    FIRST_VALUE(first_name) OVER (
        PARTITION BY dept_id ORDER BY hire_date
    ) AS first_hired
FROM employees;

-- Compare to highest salary in department
SELECT
    dept_id,
    first_name,
    salary,
    FIRST_VALUE(salary) OVER (
        PARTITION BY dept_id ORDER BY salary DESC
    ) AS highest_in_dept,
    salary - FIRST_VALUE(salary) OVER (
        PARTITION BY dept_id ORDER BY salary DESC
    ) AS diff_from_highest
FROM employees;

-- LAST_VALUE (need explicit frame for correct result)
SELECT
    dept_id,
    first_name,
    salary,
    LAST_VALUE(salary) OVER (
        PARTITION BY dept_id ORDER BY salary DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS lowest_in_dept
FROM employees;


-- ═══════════════════════════════════════════════════════════════════════════════
-- NAMED WINDOWS (reduce repetition)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT
    dept_id,
    first_name,
    salary,
    ROW_NUMBER() OVER w AS row_num,
    RANK() OVER w AS rnk,
    DENSE_RANK() OVER w AS dense_rnk,
    SUM(salary) OVER w AS running_sum
FROM employees
WINDOW w AS (PARTITION BY dept_id ORDER BY salary DESC);
```

---

🔬 **Section Challenge — Chapter 9: Window Functions**

**Challenge 1 (Reasoning):** Why can't you use a window function in a WHERE clause? How do you filter on window function results?

<details><summary>Answer</summary>

Window functions run in a logical step AFTER WHERE filtering. The WHERE clause operates on base rows; window functions are computed on the result set. Solution: wrap in a subquery/CTE. `WITH ranked AS (SELECT *, ROW_NUMBER() OVER(...) rn FROM t) SELECT * FROM ranked WHERE rn = 1`. This is 'standard' pattern for top-N-per-group.

</details>

> [!NOTE]
> **Open Source Reference: Window Aggregation Engine**
>
> - [postgres/nodeWindowAgg.c](https://github.com/postgres/postgres/blob/master/src/backend/executor/nodeWindowAgg.c) -> **Invariant:** The executor groups tuples into partitions, caching them in a `tuplestore`. It evaluates window functions over the defined frame boundaries without reducing the input row count.
> - **Local rewrite:** While `GROUP BY` routes tuples to an aggregator that emits a single result row per group (destroying base row visibility), the `WindowAgg` node buffers the partition, evaluates the aggregate or ranking function, and emits the result appended to _every_ original row.
> - **Constraint warning:** Because it requires sorting and buffering (often spilling to disk if `work_mem` is exceeded), window functions are expensive on large partitions. Always define the narrowest `PARTITION BY` possible and filter with `WHERE` _before_ the window function runs.

**Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.

<details><summary>Answer</summary>

Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.

</details>

### NTILE — Dividing Rows into N Buckets

`NTILE(n)` splits the ordered rows in a window into `n` roughly-equal groups and labels each row with its group number — the standard way to compute quartiles, deciles, or any other N-way split.

```sql
SELECT
    customer_id,
    total_spent,
    NTILE(4) OVER (ORDER BY total_spent) AS spending_quartile
FROM customer_lifetime_value;
-- Quartile 1 = lowest 25% of spenders, Quartile 4 = highest 25%
-- If the row count doesn't divide evenly by n, the extra rows go to the earliest groups first
```

### FIRST_VALUE, LAST_VALUE, NTH_VALUE — Referencing a Fixed Position in the Window

These pull a value from a specific position in the window and attach it to every row — useful for comparing each row against a fixed reference point (the first purchase, the day's opening price) rather than the previous/next row that `LAG`/`LEAD` give you.

```sql
-- Compare every sale to the day's FIRST sale and its HIGHEST sale
SELECT
    sale_time,
    amount,
    FIRST_VALUE(amount) OVER (ORDER BY sale_time) AS first_sale,
    MAX(amount) OVER () AS highest_sale,                          -- empty OVER() = whole result set is the window
    amount - FIRST_VALUE(amount) OVER (ORDER BY sale_time) AS diff_from_first
FROM sales;

-- Each customer's first order date, and how many days since then
SELECT
    customer_id,
    order_id,
    order_date,
    FIRST_VALUE(order_date) OVER (
        PARTITION BY customer_id ORDER BY order_date
    ) AS first_order_date,
    DATEDIFF(order_date, FIRST_VALUE(order_date) OVER (
        PARTITION BY customer_id ORDER BY order_date
    )) AS days_since_first_order
FROM orders;
```

`LAST_VALUE` needs its frame spelled out explicitly to behave the way its name suggests — by default the window frame stops at the *current* row, so `LAST_VALUE` without an explicit `ROWS BETWEEN ... AND UNBOUNDED FOLLOWING` just returns the current row, not the true last row of the partition. This is the single most common window-function bug — verify with a small dataset before trusting `LAST_VALUE` output.

### PERCENT_RANK and CUME_DIST — Percentile Analysis

Both describe where a row sits in the overall distribution, as a fraction between 0 and 1:

```sql
SELECT
    customer_id,
    total_spent,
    ROUND(PERCENT_RANK() OVER (ORDER BY total_spent) * 100, 2) AS percentile,
    ROUND(CUME_DIST() OVER (ORDER BY total_spent) * 100, 2) AS cumulative_dist
FROM customer_lifetime_value;
/*
customer_id | total_spent | percentile | cumulative_dist
1001        | 500         | 0.00       | 20.00            <- lowest spender
1002        | 1000        | 25.00      | 40.00
1003        | 1500        | 50.00      | 60.00
1004        | 2000        | 75.00      | 80.00
1005        | 5000        | 100.00     | 100.00           <- highest spender
*/
-- verified: sqlite3 :memory: reproduces this table exactly for 5 rows (500,1000,1500,2000,5000)
```

`PERCENT_RANK` = (rank - 1) / (total rows - 1) — always 0 for the first row and 1 for the last. `CUME_DIST` = (rows with value <= this row) / (total rows) — the fraction of the dataset at or below this row. Use `PERCENT_RANK` to answer "where does this row rank relative to the extremes"; use `CUME_DIST` to answer "what fraction of all rows does this row beat or tie." A common use: `WHERE percentile >= 0.90` inside a CTE to isolate the top 10% of a distribution.

## 📝 PRACTICE EXERCISES - PART 2

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- PRACTICE PROBLEMS - INTERMEDIATE
-- ═══════════════════════════════════════════════════════════════════════════════

-- AGGREGATES & GROUP BY

-- 1. Find the total salary expense per department

-- 2. Find departments with average salary > 80000

-- 3. Count employees by job title, show titles with 2+ employees

-- 4. Find the min, max, and average order total by month


-- JOINS

-- 5. List all employees with their department names (include employees without dept)

-- 6. Find products that have never been ordered

-- 7. Show each order with customer name, product names, and quantities


-- SUBQUERIES

-- 8. Find employees who earn more than the company average

-- 9. Find the most recent order for each customer

-- 10. Find departments where all employees earn > 50000


-- WINDOW FUNCTIONS

-- 11. Rank employees by salary within their department

-- 12. Calculate running total of sales by date

-- 13. Find each employee's salary as percentage of department total

-- 14. Calculate month-over-month revenue growth

-- 15. Find top 2 products by sales in each category


-- Try to solve before checking solutions!
```

---

## ✅ SOLUTIONS TO PART 2 EXERCISES

```sql
-- SOLUTIONS

-- 1. Total salary per department
SELECT dept_id, SUM(salary) AS total_salary
FROM employees
GROUP BY dept_id;

-- 2. Departments with avg salary > 80000
SELECT dept_id, AVG(salary) AS avg_salary
FROM employees
GROUP BY dept_id
HAVING AVG(salary) > 80000;

-- 3. Job titles with 2+ employees
SELECT job_title, COUNT(*) AS employee_count
FROM employees
GROUP BY job_title
HAVING COUNT(*) >= 2;

-- 4. Order stats by month
SELECT
    DATE_FORMAT(order_date, '%Y-%m') AS month,
    MIN(total) AS min_order,
    MAX(total) AS max_order,
    AVG(total) AS avg_order
FROM orders
GROUP BY DATE_FORMAT(order_date, '%Y-%m');

-- 5. Employees with department names
SELECT e.*, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id;

-- 6. Products never ordered
SELECT p.*
FROM products p
LEFT JOIN order_items oi ON p.product_id = oi.product_id
WHERE oi.item_id IS NULL;

-- 7. Orders with details
SELECT o.order_number, c.first_name, p.name, oi.quantity
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id;

-- 8. Above company average
SELECT * FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- 9. Most recent order per customer
SELECT o.*
FROM orders o
WHERE o.order_date = (
    SELECT MAX(o2.order_date)
    FROM orders o2
    WHERE o2.customer_id = o.customer_id
);

-- 10. Departments where all earn > 50000
SELECT dept_id
FROM employees
GROUP BY dept_id
HAVING MIN(salary) > 50000;

-- 11. Rank within department
SELECT
    e.*,
    DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dept_rank
FROM employees e;

-- 12. Running total
SELECT
    order_date,
    total,
    SUM(total) OVER (ORDER BY order_date) AS running_total
FROM orders;

-- 13. Percentage of department
SELECT
    first_name,
    dept_id,
    salary,
    ROUND(salary * 100.0 / SUM(salary) OVER (PARTITION BY dept_id), 2) AS pct_of_dept
FROM employees;

-- 14. Month-over-month growth
WITH monthly AS (
    SELECT
        DATE_FORMAT(order_date, '%Y-%m') AS month,
        SUM(total) AS revenue
    FROM orders
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
)
SELECT
    month,
    revenue,
    LAG(revenue) OVER (ORDER BY month) AS prev_month,
    ROUND((revenue - LAG(revenue) OVER (ORDER BY month)) / LAG(revenue) OVER (ORDER BY month) * 100, 2) AS growth_pct
FROM monthly;

-- 15. Top 2 products per category
SELECT * FROM (
    SELECT
        p.category_id,
        p.name,
        SUM(oi.quantity) AS total_sold,
        DENSE_RANK() OVER (PARTITION BY p.category_id ORDER BY SUM(oi.quantity) DESC) AS rnk
    FROM products p
    JOIN order_items oi ON p.product_id = oi.product_id
    GROUP BY p.category_id, p.product_id, p.name
) ranked
WHERE rnk <= 2;
```

---

_"Part 2 Complete! You now understand Aggregates, GROUP BY, JOINs, Subqueries, CTEs, and Window Functions."_

---

## Where Window Functions Fit

Window functions solve a specific limitation of `GROUP BY`: grouping collapses rows, so you lose the individual row once you have the aggregate.

```
Original rows                          After GROUP BY dept
emp | dept | salary                    dept | avg_salary
A   | IT   | 60000        ──────►      IT   | 65000
B   | IT   | 70000                     HR   | 50000
C   | HR   | 50000
```

Now you can no longer show "Alice's salary next to her department's average" — that row is gone. A window function keeps every row and adds the aggregate as a new column instead of collapsing into it:

```sql
SELECT emp, dept, salary,
       AVG(salary) OVER (PARTITION BY dept) AS dept_avg
FROM employees;
-- emp | dept | salary | dept_avg
-- A   | IT   | 60000  | 65000     <- Alice's own row survives, with the group aggregate attached
-- B   | IT   | 70000  | 65000
-- C   | HR   | 50000  | 50000
```

That's the whole mechanism: `PARTITION BY` groups rows the same way `GROUP BY` would, but instead of collapsing each group into one output row, the aggregate is computed per group and broadcast back onto every row in it.

Window functions are the fourth of four building blocks this module teaches for shaping query results — each with its own dedicated chapter:

| Building block | Question it answers | Chapter |
| --- | --- | --- |
| JOINs | Which tables' columns do I need to combine into one row? | [Chapter 7 — JOINs Complete](07_JOINs_Complete.md) |
| GROUP BY / aggregates | How do I collapse many rows into one summary row per group? | [Chapter 6 — Aggregations & GROUP BY](06_Aggregations_GroupBy.md) |
| CTEs / subqueries | How do I build a query out of named, reusable intermediate steps? | [Chapter 8 — Subqueries & CTEs](08_Subqueries_CTEs.md) |
| Window functions | How do I compute a per-group aggregate *without* collapsing rows? | This chapter |

Realistic analytics queries combine all four — a cohort-retention or funnel-conversion query typically wraps a `JOIN`, feeds it through a `GROUP BY`, structures the steps as CTEs, and uses a window function like `RANK()` for the final "top N per group" step. The full worked versions of those patterns (cohort analysis, funnel analysis, RFM, top-N-per-group, gap detection) live in [Chapter 24 — SQL for Data Analysts](24_SQL_Data_Analyst_RealWorld.md) and [Chapter 28 — Data Analytics Intermediate](28_Data_Analytics_Intermediate.md), which also cover the Python/pandas side of the same analysis.

### Historical Evolution

**Predecessors (with years):**
- **SQL:1999**: Introduced window functions (OVER clause, PARTITION BY, ROWS/RANGE frames, FIRST_VALUE, LAST_VALUE, LEAD, LAG) as a core language feature — the most significant SQL enhancement since SQL-92.
- **SQL:2003**: Added ranking window functions (ROW_NUMBER, RANK, DENSE_RANK, NTILE, PERCENT_RANK, CUME_DIST) completing the window function catalog.
- **PostgreSQL 8.4** (2009): First major open-source database to implement full window function support, bringing analytical SQL to the developer mainstream.
- **MySQL 8.0** (2018): Added window functions after a decade of community demand — prior to this, MySQL lacked them entirely, driving many developers to PostgreSQL for analytics work.
- **ISO/IEC 9075-2:2003**: Standardized window function frame clauses (ROWS BETWEEN, RANGE BETWEEN), enabling precise control over running totals and moving averages.

**Evolution narrative:**
Window functions were the missing piece between GROUP BY (which collapses rows) and raw SELECT (which doesn't support ranking/running calculations). Before SQL:1999, computing a running total required a correlated subquery or self-join — O(n^2) performance — and ranking required complex CASE expressions over GROUP BY results. SQL:1999's window model was elegant: the OVER clause defined a "window" of rows relative to the current row, and aggregate functions naturally extended to windowed execution. The key insight was framing: SUM() OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) gave developers running totals without any subquery. PostgreSQL's 2009 implementation made this accessible to the open-source world; MySQL's 2018 addition finally standardized window functions across all major open-source databases, eliminating the "use PostgreSQL for analytics" migration pattern.

**Modern practice anchor:**
Today, window functions appear in virtually every SQL analytics interview and production analytics pipeline — ROW_NUMBER() for deduplication, LAG/LEAD for period-over-period analysis, and SUM() OVER() for running totals are workhorses in every data analyst's toolkit, all directly inherited from SQL:1999.


---

## Reality Check

**"Window functions and GROUP BY both aggregate — they're interchangeable"** → GROUP BY collapses rows into one row per group. Window functions compute aggregates WITHOUT collapsing rows — every input row appears in the output with the aggregate value added as a column. `SUM(amount) OVER (PARTITION BY customer_id)` gives each order row a column showing that customer's total. You cannot replicate this with GROUP BY without a self-join.

**"PARTITION BY in window functions is the same as GROUP BY"** → `PARTITION BY` defines the window — the group of rows used for calculating the function for each row. The rows are NOT collapsed. `GROUP BY` collapses. They look similar syntactically but have fundamentally different output shapes.

**"ROW_NUMBER(), RANK(), and DENSE_RANK() give the same results"** → They differ on ties. Given scores 90, 85, 85, 80: ROW_NUMBER: 1, 2, 3, 4 (arbitrary tiebreaker). RANK: 1, 2, 2, 4 (gap after tie — no rank 3). DENSE_RANK: 1, 2, 2, 3 (no gap). For "top 3 distinct scores" use DENSE_RANK. For "3rd place record exactly" use ROW_NUMBER with an ORDER BY tiebreaker. For "Olympic-style ranking with gaps" use RANK.

**"LEAD and LAG require sorting within the window"** → Yes — `LAG(col, 1) OVER (PARTITION BY group ORDER BY date)` looks at the previous row within each partition in date order. Without ORDER BY in the OVER clause, "previous" is undefined. Omitting ORDER BY when using LAG/LEAD is a logical error that returns unpredictable results without an error message.

**"Window functions are slower than equivalent subqueries"** → Not necessarily. Window functions use a single pass through sorted data. Equivalent self-joins or correlated subqueries may require multiple passes. Modern query planners optimise window functions well. The readable window function version is usually not slower than the equivalent subquery — profile before assuming.
