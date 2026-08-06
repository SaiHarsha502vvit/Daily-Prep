**SQL Chapter 06/20** | [? Previous](05_Queries_SELECT_WHERE.md) | [Index](../00_MASTER_INDEX.md) | [Next ?](07_JOINs_Complete.md)

---

## Chapter 6: Aggregate Functions & GROUP BY

### ?? Understanding Aggregation — Collapsing Many Rows Into One

Aggregation is the process of **combining multiple rows into a single summary value**. Think of it as zooming out: instead of seeing every individual employee's salary, you see the average salary per department. This is fundamental to data analysis — business decisions are made on summaries, not individual records.

#### Why GROUP BY Exists — The Single-Value Rule

When you use an aggregate function like `AVG(salary)`, the database collapses all rows into one result. But what if you want the average salary **per department**? You need `GROUP BY dept_id` — this tells the database to create separate "buckets" (one per department) and apply the aggregate to each bucket independently.

The **critical rule**: Every column in your `SELECT` must either be:

1. Inside an aggregate function (`SUM(salary)`, `COUNT(*)`, etc.), OR
2. Listed in the `GROUP BY` clause

Why? Because if you say `SELECT dept_id, first_name, AVG(salary)`, the database doesn't know _which_ `first_name` to pick for each department — there are many employees per department, but only one average. This creates an ambiguity that SQL prevents by requiring the GROUP BY rule.

#### WHERE vs HAVING — When to Filter

This distinction confuses everyone at first, but it's simple once you understand the execution order:

- **WHERE** filters **individual rows** _before_ groups are formed. Use it when your condition operates on raw column values (e.g., `WHERE salary > 50000`).
- **HAVING** filters **groups** _after_ aggregation. Use it when your condition operates on aggregate results (e.g., `HAVING AVG(salary) > 50000`).

Think of it this way: WHERE decides which employees to consider. HAVING decides which departments to show in the final result.

?? **Performance Tip:** Always prefer WHERE over HAVING when possible. Filtering rows early (with WHERE) means fewer rows to aggregate, which is faster. Only use HAVING for conditions that _require_ aggregate values.

#### ?? Formal Syntax — Aggregate Functions

```
SELECT <aggregate_function>(<column_name>)
FROM <table_name>
[WHERE <condition>];

-- Available aggregate functions:
COUNT(*)                                         -- Count all rows (including NULLs)
COUNT(<column>)                                  -- Count non-NULL values
COUNT(DISTINCT <column>)                         -- Count unique non-NULL values
SUM(<column>)                                    -- Sum of all values
AVG(<column>)                                    -- Average of all values
MIN(<column>)                                    -- Minimum value
MAX(<column>)                                    -- Maximum value
```

#### ?? Formal Syntax — GROUP BY with HAVING

```
SELECT <column1>, <column2>, <aggregate_function>(<column>)
FROM <table_name>
[WHERE <row_condition>]                          -- Filters rows BEFORE grouping
GROUP BY <column1>, <column2>                    -- Creates groups
[HAVING <aggregate_condition>]                   -- Filters groups AFTER aggregation
[ORDER BY <column_or_aggregate> [ASC|DESC]];
```

#### ?? Formal Syntax — ROLLUP & CUBE (Subtotals)

```
-- ROLLUP: Generates subtotals in hierarchical order
GROUP BY ROLLUP (<column1>, <column2>);          -- Subtotals for col1, then grand total

-- CUBE: Generates subtotals for ALL combinations
GROUP BY CUBE (<column1>, <column2>);            -- Subtotals for col1, col2, col1+col2, grand total
```

---

```
+---------------------------------------------------------------------------------+
|                    AGGREGATE FUNCTIONS - SUMMARY                                |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  Aggregate functions perform calculations on a SET of values and return         |
|  a SINGLE value. They ignore NULL values (except COUNT(*)).                     |
|                                                                                 |
|  +--------------------------------------------------------------------------+   |
|  |  Function       | Description                        | Example           |   |
|  +-----------------+------------------------------------+-------------------|   |
|  | COUNT(*)        | Count all rows                     | COUNT(*)          |   |
|  | COUNT(column)   | Count non-NULL values              | COUNT(email)      |   |
|  | COUNT(DISTINCT) | Count unique values                | COUNT(DISTINCT d) |   |
|  | SUM(column)     | Sum of all values                  | SUM(salary)       |   |
|  | AVG(column)     | Average of all values              | AVG(price)        |   |
|  | MIN(column)     | Minimum value                      | MIN(hire_date)    |   |
|  | MAX(column)     | Maximum value                      | MAX(salary)       |   |
|  | GROUP_CONCAT()  | Concatenate values (MySQL)         | GROUP_CONCAT(name)|   |
|  | STRING_AGG()    | Concatenate values (PostgreSQL)    | STRING_AGG(n,',') |   |
|  +--------------------------------------------------------------------------+   |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

```sql
-- -------------------------------------------------------------------------------
-- AGGREGATE FUNCTIONS - EXAMPLES
-- -------------------------------------------------------------------------------

-- COUNT - Counting rows
SELECT COUNT(*) AS total_employees FROM employees;
SELECT COUNT(phone) AS employees_with_phone FROM employees;  -- Ignores NULL
SELECT COUNT(DISTINCT dept_id) AS department_count FROM employees;

-- SUM - Total of numeric column
SELECT SUM(salary) AS total_salary FROM employees;
SELECT SUM(salary) AS eng_salary FROM employees WHERE dept_id = 1;

-- AVG - Average value
SELECT AVG(salary) AS avg_salary FROM employees;
SELECT ROUND(AVG(salary), 2) AS avg_salary FROM employees;  -- Rounded

-- MIN / MAX
SELECT MIN(salary) AS min_salary, MAX(salary) AS max_salary FROM employees;
SELECT MIN(hire_date) AS first_hire, MAX(hire_date) AS latest_hire FROM employees;

-- All aggregates together
SELECT
    COUNT(*) AS total_employees,
    SUM(salary) AS total_salary,
    AVG(salary) AS avg_salary,
    MIN(salary) AS min_salary,
    MAX(salary) AS max_salary
FROM employees;

-- GROUP_CONCAT (MySQL) - Concatenate values into string
SELECT GROUP_CONCAT(first_name) AS all_names FROM employees WHERE dept_id = 1;
-- Result: "Rajesh,Priya,Amit"

SELECT GROUP_CONCAT(first_name ORDER BY first_name SEPARATOR ', ') AS all_names
FROM employees WHERE dept_id = 1;
-- Result: "Amit, Priya, Rajesh"

-- STRING_AGG (PostgreSQL)
SELECT STRING_AGG(first_name, ', ' ORDER BY first_name) AS all_names
FROM employees WHERE dept_id = 1;
```

### GROUP BY - Grouping Data

```
+---------------------------------------------------------------------------------+
|                    GROUP BY - HOW IT WORKS                                      |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  GROUP BY divides rows into groups based on column values.                      |
|  Aggregate functions are then applied to each group separately.                 |
|                                                                                 |
|  Original Data:                    After GROUP BY dept_id:                      |
|  +--------------------------+     +----------------------------------------+    |
|  | emp_id | dept | salary   |     | dept | count | sum_sal  | avg_sal     |     |
|  +--------+------+----------|     +------+-------+----------+-------------|     |
|  | 1      | 1    | 100000   |     | 1    | 3     | 280000   | 93333.33    |     |
|  | 2      | 1    | 80000    |     | 2    | 2     | 150000   | 75000.00    |     |
|  | 3      | 1    | 100000   |     +----------------------------------------+    |
|  | 4      | 2    | 90000    |                                                   |
|  | 5      | 2    | 60000    |     SELECT dept_id,                               |
|  +--------------------------+            COUNT(*) AS count,                     |
|                                          SUM(salary) AS sum_sal,                |
|                                          AVG(salary) AS avg_sal                 |
|                                   FROM employees                                |
|                                   GROUP BY dept_id;                             |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

```sql
-- -------------------------------------------------------------------------------
-- GROUP BY - EXAMPLES
-- -------------------------------------------------------------------------------

-- Basic GROUP BY
SELECT dept_id, COUNT(*) AS employee_count
FROM employees
GROUP BY dept_id;

-- GROUP BY with multiple aggregates
SELECT
    dept_id,
    COUNT(*) AS emp_count,
    SUM(salary) AS total_salary,
    AVG(salary) AS avg_salary,
    MIN(salary) AS min_salary,
    MAX(salary) AS max_salary
FROM employees
GROUP BY dept_id;

-- GROUP BY with JOIN (show department name)
SELECT
    d.dept_name,
    COUNT(*) AS emp_count,
    ROUND(AVG(e.salary), 2) AS avg_salary
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
GROUP BY d.dept_id, d.dept_name;

-- GROUP BY multiple columns
SELECT
    dept_id,
    job_title,
    COUNT(*) AS count,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY dept_id, job_title
ORDER BY dept_id, avg_salary DESC;

-- GROUP BY with expressions
SELECT
    YEAR(hire_date) AS hire_year,
    COUNT(*) AS hires
FROM employees
GROUP BY YEAR(hire_date)
ORDER BY hire_year;

-- GROUP BY with CASE (custom grouping)
SELECT
    CASE
        WHEN salary >= 100000 THEN 'High'
        WHEN salary >= 50000 THEN 'Medium'
        ELSE 'Low'
    END AS salary_band,
    COUNT(*) AS employee_count
FROM employees
GROUP BY
    CASE
        WHEN salary >= 100000 THEN 'High'
        WHEN salary >= 50000 THEN 'Medium'
        ELSE 'Low'
    END;


-- -------------------------------------------------------------------------------
-- HAVING - FILTERING GROUPS
-- -------------------------------------------------------------------------------

-- WHERE filters ROWS before grouping
-- HAVING filters GROUPS after grouping

-- Find departments with more than 2 employees
SELECT dept_id, COUNT(*) AS emp_count
FROM employees
GROUP BY dept_id
HAVING COUNT(*) > 2;

-- Find departments where average salary > 80000
SELECT dept_id, AVG(salary) AS avg_salary
FROM employees
GROUP BY dept_id
HAVING AVG(salary) > 80000;

-- Combined WHERE and HAVING
SELECT
    dept_id,
    COUNT(*) AS active_count,
    AVG(salary) AS avg_salary
FROM employees
WHERE is_active = TRUE           -- Filter rows first
GROUP BY dept_id
HAVING COUNT(*) >= 2             -- Then filter groups
   AND AVG(salary) > 70000
ORDER BY avg_salary DESC;


-- -------------------------------------------------------------------------------
-- EXECUTION ORDER (Important!)
-- -------------------------------------------------------------------------------

/*
SQL Execution Order:
1. FROM        - Get data from tables
2. JOIN        - Join tables together
3. WHERE       - Filter individual rows
4. GROUP BY    - Create groups
5. HAVING      - Filter groups
6. SELECT      - Choose columns and compute aggregates
7. DISTINCT    - Remove duplicates
8. ORDER BY    - Sort results
9. LIMIT       - Restrict output count

This is why you can't use column aliases in WHERE but can in ORDER BY!
*/


-- -------------------------------------------------------------------------------
-- ROLLUP & CUBE - SUBTOTALS
-- -------------------------------------------------------------------------------

-- ROLLUP: Creates subtotals at each level + grand total
SELECT
    COALESCE(d.dept_name, 'TOTAL') AS department,
    COALESCE(e.job_title, 'Subtotal') AS job_title,
    COUNT(*) AS emp_count,
    SUM(e.salary) AS total_salary
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
GROUP BY d.dept_name, e.job_title WITH ROLLUP;

-- CUBE: Creates subtotals for all combinations (PostgreSQL)
SELECT
    COALESCE(d.dept_name, 'ALL') AS department,
    COALESCE(e.job_title, 'ALL') AS job_title,
    COUNT(*) AS emp_count
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
GROUP BY CUBE(d.dept_name, e.job_title);

-- GROUPING SETS: Explicit grouping combinations
SELECT
    d.dept_name,
    YEAR(e.hire_date) AS hire_year,
    COUNT(*) AS emp_count
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
GROUP BY GROUPING SETS (
    (d.dept_name),
    (YEAR(e.hire_date)),
    (d.dept_name, YEAR(e.hire_date))
);
```

---

**Navigation**: [< Previous](05_Queries_SELECT_WHERE.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](07_JOINs_Complete.md)

🔬 **Section Challenge — Chapter 6: Aggregate Functions & GROUP BY**

**Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.

<details><summary>Answer</summary>

Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.

</details>

### Historical Evolution

**Predecessors (with years):**
- **IBM System R** (1974–1979): First implemented GROUP BY and HAVING as part of the SQL language, demonstrating that set-level aggregation could be efficiently executed using sort-based algorithms.
- **SQL-86**: First ANSI standard to codify COUNT, SUM, AVG, MIN, MAX as standard aggregate functions, enabling portable aggregation queries across databases.
- **SQL:1999 (OLAP)**: Introduced CUBE, ROLLUP, and GROUPING SETS for analytical reporting — enabling subtotals and cross-tabulations in a single query.
- **SQL:2003**: Added ranking window functions (ROW_NUMBER, RANK, DENSE_RANK, NTILE), PARTITION BY for grouped windowing, and PERCENT_RANK/CUME_DIST for statistical distribution queries.
- **ISO/IEC 9075-2:2003**: Standardized WITH CUBE and WITH ROLLUP syntax, enabling dimensional reporting that previously required multiple queries or expensive self-joins.

**Evolution narrative:**
System R implemented GROUP BY by sorting rows into groups and then applying aggregate functions — a simple but effective approach for reporting. The OLAP extension in SQL:1999 was a direct response to data warehousing needs, where business users wanted "total by region, total by product, total by both" in a single query. CUBE generates all combinations (2^n groupings), ROLLUP generates a hierarchy — these are the workhorses of modern BI report generation. The window function additions in SQL:2003 were equally transformative: before LAG/LEAD, calculating period-over-period growth required self-joins; before SUM() OVER(), running totals required complex correlated subqueries. These features collectively shifted analytical SQL from multiple-pass queries to single-pass set operations.

**Modern practice anchor:**
Today, every SQL analytics interview tests GROUP BY with HAVING and window functions like ROW_NUMBER() OVER (PARTITION BY ...) — features originating in System R (1974) and SQL:2003 respectively, underpinning every modern BI dashboard and financial report.

### Production Reality

**Failure modes:**
1. **COUNT(*) on 100M-row table without WHERE**: Running `SELECT COUNT(*) FROM events` on an unpartitioned 100M-row table requires a full table scan — it takes 45+ seconds and holds a shared lock blocking all writes. Fix: use `WHERE event_date >= CURRENT_DATE - INTERVAL '1 day'` or maintain a counter cache table updated by triggers.
2. **DISTINCT vs GROUP BY performance on high-cardinality columns**: `SELECT DISTINCT user_id FROM events` on 1B rows forces a sort+dedup of 1B values. `GROUP BY user_id` is semantically equivalent but some databases handle it more efficiently. Both require O(n) memory. Fix: use `SELECT COUNT(DISTINCT user_id)` which is optimized to return only the count.
3. **ROLLUP memory blow-up on multi-column groupings**: `GROUP BY ROLLUP(region, country, city, store)` generates 16 groupings (2^4) — if each group requires a hash table in memory, a 4-level ROLLUP on a large dataset can exhaust temp_tables_space and cause disk spills that slow queries 100x.

**Debug workflow:**
(1) Use `EXPLAIN ANALYZE` to measure aggregation time — look for `HashAggregate` vs `Sort` nodes and check `peak_memory` and `spills`.
(2) For large COUNTs, check row estimates in `EXPLAIN` — if `rows` estimate is way off, run `ANALYZE table` to update statistics.
(3) For ROLLUP/CUBE, test with production data volume in a staging environment and monitor `work_mem` (PostgreSQL) or `sort_buffer_size` (MySQL) to confirm the query fits in memory.

**Modern practice anchor:**
Today, materialized views (Snowflake, PostgreSQL, Oracle) pre-compute expensive COUNT/GROUP BY aggregations on a schedule, eliminating the need for real-time COUNT(*) on large tables. Real-time dashboards use streaming ingestion (Kafka + DruDB) to maintain pre-aggregated counters.


---

## Reality Check

**"GROUP BY runs after WHERE"** → The SQL execution order is: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY. WHERE filters ROWS before grouping. HAVING filters GROUPS after aggregation. Writing a filter condition in HAVING instead of WHERE means the database first groups all rows (expensive) then discards groups — instead of discarding rows first (cheap) then grouping the remainder. This can change query time from seconds to minutes on large datasets.

**"COUNT(*) and COUNT(column) are the same"** → COUNT(*) counts all rows including those with NULL values. COUNT(column) counts only rows where column is NOT NULL. COUNT(DISTINCT column) counts unique non-NULL values. On a table with 1000 rows where 200 have NULL in column_a: COUNT(*) returns 1000, COUNT(column_a) returns 800, and COUNT(DISTINCT column_a) returns however many unique non-NULL values exist.

**"AVG ignores NULLs"** → AVG does ignore NULLs, which changes the denominator. Three values (10, NULL, 20): AVG returns 15 (sum 30 / count 2) not 10 (sum 30 / count 3). If you want NULLs treated as zero, use AVG(COALESCE(column, 0)). The difference between AVG-ignoring-NULL and AVG-treating-NULL-as-zero is a common source of incorrect business metrics.

**"HAVING is just WHERE for aggregated columns"** → HAVING can reference any column in the GROUP BY clause, not just aggregated values. But using HAVING for non-aggregate filtering is a performance mistake because it filters after grouping. The only correct use of HAVING is filtering on aggregate results: HAVING COUNT(*) > 5 or HAVING SUM(amount) > 1000. Everything else belongs in WHERE.

**"ORDER BY on aggregated results uses the index"** → ORDER BY on an aggregate column like ORDER BY COUNT(*) DESC cannot use an index because the aggregate value does not exist until after grouping. The database must compute all groups, calculate the aggregate for each, then sort the results. For large result sets, this requires a temporary table and a sort operation. Adding LIMIT can help the optimizer use a top-N sort instead of a full sort.
