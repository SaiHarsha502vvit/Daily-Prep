# 📝 SQL — Problem Sets

## `08_SQL` Module | ETH Zurich Database Course Style

> **Critical rule:** Every solution shows **MySQL 8.0** AND **Oracle 19c** side by side. Differences are marked explicitly (`LIMIT` vs `FETCH FIRST`, `IFNULL` vs `NVL`, `GROUP_CONCAT` vs `LISTAGG`, etc.).

---

## Shared Schema (Used Across All Problem Sets)

```sql
CREATE TABLE employees (
    emp_id     INT          PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    dept_id    INT,
    salary     DECIMAL(10,2),
    hire_date  DATE,
    manager_id INT  -- self-reference; NULL = top-level manager
);

CREATE TABLE departments (
    dept_id   INT          PRIMARY KEY,
    dept_name VARCHAR(50)  NOT NULL,
    budget    DECIMAL(15,2)
);

CREATE TABLE projects (
    proj_id    INT          PRIMARY KEY,
    proj_name  VARCHAR(100) NOT NULL,
    dept_id    INT,
    start_date DATE,
    end_date   DATE
);

CREATE TABLE emp_projects (
    emp_id       INT,
    proj_id      INT,
    role         VARCHAR(50),
    hours_worked INT,
    PRIMARY KEY (emp_id, proj_id)
);
```

---

## Problem Set SQL-PS1 — Joins & Aggregations

**Prerequisites:** `08_SQL` Joins and Aggregation chapters

---

### Part A: Theoretical

**A1 (Easy).** Find all employees with their department name. Include employees who are not assigned to any department.

<details><summary>MySQL Answer + Oracle Answer</summary>

```sql
-- MySQL 8.0
SELECT e.emp_id, e.name, d.dept_name
FROM   employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id;

-- Oracle 19c
SELECT e.emp_id, e.name, d.dept_name
FROM   employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id;
-- Note: Oracle also supports legacy (+) syntax but ANSI LEFT JOIN is preferred
-- Legacy (avoid): WHERE e.dept_id = d.dept_id(+)
```

🔴 **Erklärung:**

| Mistake                                     | Why                               | Fix                                          |
| ------------------------------------------- | --------------------------------- | -------------------------------------------- |
| `INNER JOIN`                                | Drops employees with NULL dept_id | Use `LEFT JOIN` to keep all employees        |
| `WHERE dept_id IS NOT NULL` after LEFT JOIN | Converts LEFT to INNER            | Remove the WHERE filter on the joined column |

</details>

---

**A2 (Medium).** Find departments where the average salary is above the company-wide average salary.

<details><summary>MySQL Answer + Oracle Answer</summary>

```sql
-- MySQL 8.0
SELECT d.dept_name, AVG(e.salary) AS avg_salary
FROM   employees e
JOIN   departments d ON e.dept_id = d.dept_id
GROUP BY d.dept_id, d.dept_name
HAVING AVG(e.salary) > (SELECT AVG(salary) FROM employees);

-- Oracle 19c (identical syntax — same result)
SELECT d.dept_name, AVG(e.salary) AS avg_salary
FROM   employees e
JOIN   departments d ON e.dept_id = d.dept_id
GROUP BY d.dept_id, d.dept_name
HAVING AVG(e.salary) > (SELECT AVG(salary) FROM employees);
```

🔴 **Erklärung:**

| Mistake                          | Why                                                            | Fix                                        |
| -------------------------------- | -------------------------------------------------------------- | ------------------------------------------ |
| `WHERE AVG(salary) > ...`        | Cannot use aggregate in WHERE clause                           | Use `HAVING` — it filters AFTER grouping   |
| Computing global avg in app code | Extra round-trip; correlated scalar subquery is more efficient | Use correlated subquery directly in HAVING |

</details>

---

**A3 (Hard).** For each manager, find the count of direct reports and their total salary bill. Only show managers with more than 3 direct reports.

<details><summary>MySQL Answer + Oracle Answer</summary>

```sql
-- MySQL 8.0
SELECT m.emp_id,
       m.name            AS manager_name,
       COUNT(e.emp_id)   AS direct_reports,
       SUM(e.salary)     AS total_salary_bill
FROM   employees m
JOIN   employees e ON e.manager_id = m.emp_id   -- self-join
GROUP BY m.emp_id, m.name
HAVING COUNT(e.emp_id) > 3
ORDER BY direct_reports DESC;

-- Oracle 19c (same — self-join works identically)
SELECT m.emp_id,
       m.name                    AS manager_name,
       COUNT(e.emp_id)           AS direct_reports,
       SUM(e.salary)             AS total_salary_bill
FROM   employees m
JOIN   employees e ON e.manager_id = m.emp_id
GROUP BY m.emp_id, m.name
HAVING COUNT(e.emp_id) > 3
ORDER BY direct_reports DESC;
```

🔴 **Erklärung:**

| Mistake                             | Why                                    | Fix                                                          |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| Single-table GROUP BY on manager_id | Can't get manager name without joining | Self-join employees table as `m` (manager) and `e` (reports) |
| `HAVING COUNT(*) > 3`               | Counts NULLs — inflates count          | `COUNT(e.emp_id)` counts non-null reports only               |

</details>

---

**A4 (Hard).** Find employees who work on MORE projects than the average number of projects per employee.

<details><summary>MySQL Answer + Oracle Answer</summary>

```sql
-- MySQL 8.0
SELECT e.name, COUNT(ep.proj_id) AS project_count
FROM   employees e
JOIN   emp_projects ep ON e.emp_id = ep.emp_id
GROUP BY e.emp_id, e.name
HAVING COUNT(ep.proj_id) > (
    SELECT AVG(proj_count)
    FROM (
        SELECT COUNT(proj_id) AS proj_count
        FROM   emp_projects
        GROUP BY emp_id
    ) AS counts
);

-- Oracle 19c
SELECT e.name, COUNT(ep.proj_id) AS project_count
FROM   employees e
JOIN   emp_projects ep ON e.emp_id = ep.emp_id
GROUP BY e.emp_id, e.name
HAVING COUNT(ep.proj_id) > (
    SELECT AVG(proj_count)
    FROM (
        SELECT COUNT(proj_id) AS proj_count
        FROM   emp_projects
        GROUP BY emp_id
    )  -- Oracle does NOT need alias for subquery in FROM clause (but it doesn't hurt)
);
```

> **MySQL vs Oracle difference:** MySQL requires an alias for derived tables in FROM clause (`AS counts`). Oracle does NOT require it.

</details>

---

### Part B: Implementation

**B1.** Top-3 highest paid employees per department — using Window Functions vs subquery. Show BOTH approaches.

<details><summary>MySQL Answer + Oracle Answer</summary>

```sql
-- ============ WINDOW FUNCTION APPROACH ============

-- MySQL 8.0
SELECT dept_name, name, salary, rnk
FROM (
    SELECT d.dept_name, e.name, e.salary,
           DENSE_RANK() OVER (PARTITION BY e.dept_id ORDER BY e.salary DESC) AS rnk
    FROM employees e
    JOIN departments d ON e.dept_id = d.dept_id
) ranked
WHERE rnk <= 3;

-- Oracle 19c (identical window function syntax)
SELECT dept_name, name, salary, rnk
FROM (
    SELECT d.dept_name, e.name, e.salary,
           DENSE_RANK() OVER (PARTITION BY e.dept_id ORDER BY e.salary DESC) AS rnk
    FROM employees e
    JOIN departments d ON e.dept_id = d.dept_id
)
WHERE rnk <= 3;

-- ============ CORRELATED SUBQUERY APPROACH ============

-- MySQL 8.0
SELECT d.dept_name, e.name, e.salary
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
WHERE (
    SELECT COUNT(DISTINCT e2.salary)
    FROM employees e2
    WHERE e2.dept_id = e.dept_id AND e2.salary > e.salary
) < 3;

-- Oracle 19c (identical)
SELECT d.dept_name, e.name, e.salary
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
WHERE (
    SELECT COUNT(DISTINCT e2.salary)
    FROM employees e2
    WHERE e2.dept_id = e.dept_id AND e2.salary > e.salary
) < 3;
```

> **Window Function is O(n log n). Correlated subquery is O(n²).** Always use Window Functions for production top-N-per-group queries.

</details>

---

### Part C: Challenge

**C1.** Detect salary anomalies — find employees earning MORE than their own manager.

<details><summary>MySQL Answer + Oracle Answer</summary>

```sql
-- MySQL 8.0
SELECT e.name        AS employee,
       e.salary      AS emp_salary,
       m.name        AS manager,
       m.salary      AS mgr_salary
FROM   employees e
JOIN   employees m ON e.manager_id = m.emp_id
WHERE  e.salary > m.salary
ORDER BY (e.salary - m.salary) DESC;

-- Oracle 19c (identical)
SELECT e.name        AS employee,
       e.salary      AS emp_salary,
       m.name        AS manager,
       m.salary      AS mgr_salary
FROM   employees e
JOIN   employees m ON e.manager_id = m.emp_id
WHERE  e.salary > m.salary
ORDER BY (e.salary - m.salary) DESC;
```

</details>

---

## Problem Set SQL-PS2 — Window Functions

**Prerequisites:** `08_SQL` Window Functions chapter

---

### Part A: Theoretical

**A1 (Easy).** Using the employees table, show the difference between `ROW_NUMBER()`, `RANK()`, and `DENSE_RANK()` with sample data where all three give different results.

<details><summary>MySQL Answer + Oracle Answer</summary>

```sql
-- Sample data concept: [Alice=90000, Bob=85000, Carol=85000, Dave=75000]

-- MySQL 8.0
SELECT name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,
       RANK()       OVER (ORDER BY salary DESC) AS rnk,
       DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk
FROM employees
WHERE dept_id = 1;

-- Oracle 19c (identical syntax)
SELECT name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,
       RANK()       OVER (ORDER BY salary DESC) AS rnk,
       DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk
FROM employees
WHERE dept_id = 1;
```

**Expected result for tied salaries (Bob=Carol=85000):**

| name  | salary | ROW_NUMBER | RANK | DENSE_RANK |
| ----- | ------ | ---------- | ---- | ---------- |
| Alice | 90000  | 1          | 1    | 1          |
| Bob   | 85000  | 2          | 2    | 2          |
| Carol | 85000  | 3          | 2    | 2          |
| Dave  | 75000  | 4          | 4    | 3          |

- `ROW_NUMBER`: always unique, arbitrary order for ties
- `RANK`: ties get same rank, next rank skips (gap: 2,2,4)
- `DENSE_RANK`: ties get same rank, no gap (2,2,3)

🔴 **Erklärung:** Use `ROW_NUMBER` when you need exactly one row per partition (e.g., dedup). Use `DENSE_RANK` for ranking where tied values should not create gaps (leaderboards). Use `RANK` rarely — the gap is usually confusing to users.

</details>

---

**A2 (Medium).** Calculate a running total of salary ordered by hire_date.

<details><summary>MySQL Answer + Oracle Answer</summary>

```sql
-- MySQL 8.0
SELECT name,
       hire_date,
       salary,
       SUM(salary) OVER (ORDER BY hire_date
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM employees
ORDER BY hire_date;

-- Oracle 19c (identical)
SELECT name,
       hire_date,
       salary,
       SUM(salary) OVER (ORDER BY hire_date
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM employees
ORDER BY hire_date;
```

🔴 **Erklärung:** `SUM(salary) OVER (ORDER BY hire_date)` without an explicit frame clause uses `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` by default — this can produce unexpected results when multiple employees share the same hire_date (all get the same cumulative sum). Prefer explicit `ROWS BETWEEN` for correctness.

</details>

---

**A3 (Hard).** Find the employee hired just before and just after each employee. Calculate days between consecutive hires.

<details><summary>MySQL Answer + Oracle Answer</summary>

```sql
-- MySQL 8.0
SELECT name,
       hire_date,
       LAG(name)      OVER (ORDER BY hire_date) AS prev_employee,
       LAG(hire_date) OVER (ORDER BY hire_date) AS prev_hire_date,
       LEAD(name)      OVER (ORDER BY hire_date) AS next_employee,
       LEAD(hire_date) OVER (ORDER BY hire_date) AS next_hire_date,
       DATEDIFF(hire_date,
           LAG(hire_date) OVER (ORDER BY hire_date)) AS days_since_prev_hire
FROM employees
ORDER BY hire_date;

-- Oracle 19c
SELECT name,
       hire_date,
       LAG(name)      OVER (ORDER BY hire_date) AS prev_employee,
       LAG(hire_date) OVER (ORDER BY hire_date) AS prev_hire_date,
       LEAD(name)      OVER (ORDER BY hire_date) AS next_employee,
       LEAD(hire_date) OVER (ORDER BY hire_date) AS next_hire_date,
       hire_date - LAG(hire_date) OVER (ORDER BY hire_date) AS days_since_prev_hire
       -- Oracle: DATE subtraction gives NUMBER of days directly
FROM employees
ORDER BY hire_date;
```

> **MySQL vs Oracle difference:** `DATEDIFF(d1, d2)` in MySQL; `date1 - date2` in Oracle returns NUMBER.

</details>

---

### Part B: Implementation

**B2.** Month-over-Month revenue growth per department using LAG().

```sql
-- Schema assumption: table monthly_revenue(dept_id, year_month DATE, revenue DECIMAL)

-- MySQL 8.0
SELECT dept_id,
       year_month,
       revenue,
       LAG(revenue) OVER (PARTITION BY dept_id ORDER BY year_month) AS prev_month_revenue,
       ROUND(
           (revenue - LAG(revenue) OVER (PARTITION BY dept_id ORDER BY year_month))
           / LAG(revenue) OVER (PARTITION BY dept_id ORDER BY year_month) * 100, 2
       ) AS growth_pct
FROM monthly_revenue
ORDER BY dept_id, year_month;

-- Oracle 19c (identical — LAG/LEAD syntax is ANSI standard)
-- Only difference: ROUND works the same; no syntax change needed
```

---

## Problem Set SQL-PS3 — CTEs & Recursive Queries

---

### Part A: Theoretical

**A1 (Medium).** Rewrite this 3-level nested subquery as a CTE:

```sql
-- Original (hard to read)
SELECT name, salary
FROM employees
WHERE dept_id IN (
    SELECT dept_id FROM departments
    WHERE budget > (SELECT AVG(budget) FROM departments)
);
```

<details><summary>MySQL Answer + Oracle Answer</summary>

```sql
-- MySQL 8.0
WITH avg_budget AS (
    SELECT AVG(budget) AS avg_b FROM departments
),
high_budget_depts AS (
    SELECT dept_id FROM departments, avg_budget
    WHERE budget > avg_b
)
SELECT e.name, e.salary
FROM employees e
JOIN high_budget_depts hbd ON e.dept_id = hbd.dept_id;

-- Oracle 19c (identical WITH clause syntax)
WITH avg_budget AS (
    SELECT AVG(budget) AS avg_b FROM departments
),
high_budget_depts AS (
    SELECT dept_id FROM departments
    CROSS JOIN avg_budget
    WHERE budget > avg_b
)
SELECT e.name, e.salary
FROM employees e
JOIN high_budget_depts hbd ON e.dept_id = hbd.dept_id;
```

</details>

---

**A2 (Hard).** Write a recursive CTE to find the full org chart hierarchy from a given manager.

<details><summary>MySQL Answer + Oracle Answer</summary>

```sql
-- MySQL 8.0 (requires MySQL 8.0+ for recursive CTEs)
WITH RECURSIVE org_chart AS (
    -- Anchor: start from the root manager
    SELECT emp_id, name, manager_id, 0 AS depth, CAST(name AS CHAR(1000)) AS path
    FROM employees
    WHERE emp_id = 1  -- starting manager_id

    UNION ALL

    -- Recursive: find direct reports at each level
    SELECT e.emp_id, e.name, e.manager_id, oc.depth + 1,
           CONCAT(oc.path, ' > ', e.name)
    FROM employees e
    JOIN org_chart oc ON e.manager_id = oc.emp_id
)
SELECT CONCAT(REPEAT('  ', depth), name) AS indented_name, depth, path   -- MySQL: || is logical OR, not concat, by default
FROM org_chart
ORDER BY path;

-- Oracle 19c — Option 1: Recursive CTE (Oracle 11g R2+)
WITH org_chart(emp_id, name, manager_id, depth, path) AS (
    SELECT emp_id, name, manager_id, 0, name
    FROM employees WHERE emp_id = 1

    UNION ALL

    SELECT e.emp_id, e.name, e.manager_id, oc.depth + 1,
           oc.path || ' > ' || e.name
    FROM employees e
    JOIN org_chart oc ON e.manager_id = oc.emp_id
)
SELECT LPAD(' ', depth * 2) || name AS indented_name, depth
FROM org_chart ORDER BY path;

-- Oracle 19c — Option 2: CONNECT BY (Oracle-native, simpler)
SELECT LPAD(' ', LEVEL * 2) || name AS indented_name,
       LEVEL AS depth,
       SYS_CONNECT_BY_PATH(name, ' > ') AS path
FROM employees
START WITH emp_id = 1
CONNECT BY PRIOR emp_id = manager_id
ORDER SIBLINGS BY name;
```

> **MySQL vs Oracle:** Oracle's `CONNECT BY` is far more concise for hierarchy queries. MySQL requires recursive CTEs (available from 8.0). Oracle supports both approaches.

</details>

---

**A3 (Hard).** Generate all dates between two dates using a recursive CTE.

<details><summary>MySQL Answer + Oracle Answer</summary>

```sql
-- MySQL 8.0
WITH RECURSIVE date_series AS (
    SELECT DATE('2024-01-01') AS dt
    UNION ALL
    SELECT DATE_ADD(dt, INTERVAL 1 DAY)
    FROM date_series
    WHERE dt < DATE('2024-01-31')
)
SELECT dt FROM date_series;

-- Oracle 19c — Option 1: Recursive CTE
WITH date_series(dt) AS (
    SELECT DATE '2024-01-01' FROM dual
    UNION ALL
    SELECT dt + 1 FROM date_series WHERE dt < DATE '2024-01-31'
)
SELECT dt FROM date_series;

-- Oracle 19c — Option 2: CONNECT BY LEVEL (more idiomatic Oracle)
SELECT DATE '2024-01-01' + LEVEL - 1 AS dt
FROM dual
CONNECT BY LEVEL <= DATE '2024-01-31' - DATE '2024-01-01' + 1;
```

> **MySQL vs Oracle date arithmetic:** MySQL: `DATE_ADD(dt, INTERVAL 1 DAY)`. Oracle: `dt + 1` (dates are numeric in Oracle — adding 1 = adding 1 day).

</details>

---

## Problem Set SQL-PS4 — Indexes & Query Optimization

---

### Part A: Theoretical

**A1 (Easy).** What is the difference between a clustered index and a non-clustered index? How does MySQL InnoDB differ from Oracle?

<details><summary>Answer</summary>

**Clustered Index:** The table data IS sorted and stored in the index order. There is only one clustered index per table.

- **MySQL InnoDB:** The PRIMARY KEY is always the clustered index. Data rows are stored in B-Tree order by PK. If no PK, InnoDB creates a hidden 6-byte row ID.
- **Oracle:** Requires explicit `CREATE TABLE ... ORGANIZATION INDEX` (IOT — Index Organized Table). Standard Oracle tables are heap-organized (no implicit clustered index).

**Non-Clustered Index (MySQL: secondary index):** A separate B-Tree where leaf nodes contain the indexed column value + a pointer (in InnoDB: the PK value, NOT the physical row address). Every secondary index lookup does two B-Tree traversals: index → PK, then PK → row.

🔴 **Erklärung:** In MySQL InnoDB, a secondary index on `email` stores `(email, primary_key)`. A query `SELECT * FROM users WHERE email = ?` does: (1) find email in secondary index → get PK, (2) look up PK in clustered index → get full row. This is called a **double lookup**. A covering index (`SELECT id, email FROM users WHERE email = ?`) avoids step 2.

</details>

---

**A2 (Medium).** Given this EXPLAIN output, identify the bottleneck and write the fix:

```
id | select_type | table     | type | key  | rows   | Extra
1  | SIMPLE      | employees | ALL  | NULL | 100000 | Using where
```

<details><summary>MySQL Answer + Oracle Answer</summary>

**Bottleneck:** `type = ALL` = full table scan. `key = NULL` = no index used. Scanning 100,000 rows for a WHERE filter.

**Assumption:** The query is `SELECT * FROM employees WHERE dept_id = 5 ORDER BY salary DESC;`

```sql
-- MySQL 8.0 — Create composite index
CREATE INDEX idx_dept_salary ON employees (dept_id, salary DESC);

-- After index:
-- type = ref (index lookup on dept_id)
-- key = idx_dept_salary
-- rows ≈ 50 (only rows with dept_id=5)
-- Extra: Using index condition

-- Oracle 19c
CREATE INDEX idx_dept_salary ON employees (dept_id, salary DESC);

-- Oracle check plan:
EXPLAIN PLAN FOR SELECT * FROM employees WHERE dept_id = 5 ORDER BY salary DESC;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Should show: INDEX RANGE SCAN on idx_dept_salary
```

🔴 **Erklärung:** A single-column index on `dept_id` alone would fix the filter but not the sort (still needs filesort). The composite index `(dept_id, salary DESC)` covers both the WHERE and ORDER BY — eliminating filesort entirely.

</details>

---

**A3 (Hard).** What is a covering index? Rewrite this query to use one.

```sql
SELECT name, salary FROM employees WHERE dept_id = 5 ORDER BY salary DESC;
```

<details><summary>MySQL Answer + Oracle Answer</summary>

**Covering index:** An index that contains ALL columns referenced by the query (SELECT, WHERE, ORDER BY). The database engine can satisfy the entire query from the index alone — never touching the actual data rows.

```sql
-- MySQL 8.0 — Covering index includes all referenced columns
CREATE INDEX idx_covering ON employees (dept_id, salary DESC, name);
-- Columns in index: dept_id (WHERE), salary (ORDER BY), name (SELECT)
-- MySQL EXPLAIN will show: Extra = "Using index" (no heap access!)

-- Oracle 19c
CREATE INDEX idx_covering ON employees (dept_id, salary DESC, name);
-- EXPLAIN PLAN will show: INDEX RANGE SCAN (no TABLE ACCESS FULL)
```

**Why covering indexes are powerful:** Instead of: index lookup → get PK → heap lookup (2 I/Os per row), you just do: index scan (1 I/O path). For read-heavy tables, this can be a 10-100x speedup.

**Trade-off:** Larger index = slower writes (INSERT/UPDATE must maintain more index entries). Never add columns to an index just in case — be surgical.

🔴 **Erklärung:** Students add `SELECT *` to queries and wonder why covering indexes don't help. `SELECT *` requires ALL columns — no index can cover that unless it includes every column (defeats the purpose). Design queries to select only needed columns, then build covering indexes around those.

</details>

---

[← Back to Semester 2 Guide](../00_CURRICULUM/SEMESTER_2_GUIDE.md)

### Historical Evolution

**Predecessors (with years):**
- **ACM Computer Science Examinations** (1960s): Established structured programming problem sets as the standard for evaluating computer science competency, the origin of the problem-set pedagogy SQL courses later adopted.
- **ACM ICPC (International Collegiate Programming Contest)** (1977): Introduced rigorous time-limited algorithmic problem solving at scale, demonstrating that standardized problem formats could objectively evaluate SQL reasoning under pressure — directly applicable to technical interview formats.
- **SQL-86 to SQL:2023**: The SQL standard evolved through SQL-86, SQL-89, SQL-92, SQL:1999, SQL:2003, SQL:2008, SQL:2011, and SQL:2023, adding window functions, CTEs, recursive queries, JSON support, and pattern matching — each addition created new problem types that now appear in technical interviews.
- **ETH Zurich Database Group** (2000s–present): Pioneered the university-level SQL problem set format combining theoretical reasoning questions with hands-on implementation exercises, directly influencing the structure of modern SQL curriculum and interview assessments.

**Evolution narrative:**
SQL problem sets evolved from two separate traditions: the ACM's programming competition exercises (which tested algorithmic thinking) and the database industry's need for practical competency evaluation. The ETH Zurich course style — pairing theoretical "identify the bug" questions with implementation exercises showing MySQL and Oracle side-by-side — emerged as the gold standard because it simultaneously tests understanding and syntax recall. As SQL added complexity (window functions in SQL:2003, CTEs in SQL:1999, recursive queries in SQL:1999), interview problem sets expanded correspondingly. Modern SQL interview problems now routinely combine window functions, CTEs, and joins in a single query — a compound challenge that wouldn't have been conceivable when SEQUEL was first designed. The SQL:2023 standard's new pattern matching (MATCH_RECOGNIZE) is already beginning to appear in advanced interview questions.

**Modern practice anchor:**
Today, SQL problem sets are the dominant format in technical interviews (HackerRank, LeetCode Database, Pramp) — companies use them to screen candidates because SQL proficiency directly correlates with on-the-job productivity, a link first established by the ETH Zurich database course pedagogy and the ACM ICPC competition format.

### Production Reality

**Failure modes:**
1. **Top-N-per-group misimplementation scaling to O(n²)**: A correlated subquery for "top 3 per department" — `WHERE (SELECT COUNT(*) FROM employees e2 WHERE e2.dept_id = e.dept_id AND e2.salary > e.salary) < 3` — runs the inner query for every employee. With 10,000 employees across 100 departments, that's 10,000 × 10,000 = 100M row comparisons. Fix: use `ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn`.
2. **Derived table alias differences causing query failures**: MySQL requires aliases for derived tables in FROM (`FROM (SELECT ...) AS t`), while Oracle allows omitting them in some contexts. A query `FROM (SELECT ... FROM ...)` without alias fails in MySQL 8.0 with "Every derived table must have its own alias" but works in Oracle. This breaks cross-database ORM migrations.
3. **Recursive CTE infinite loop in org-chart queries**: A recursive CTE without a termination guard (e.g., wrong join condition `ON e.manager_id = oc.emp_id` with circular manager data) loops forever until `max_execution_time` or `cte_max_recursion_depth` (default 3000 in PostgreSQL) is hit, crashing the query with "infinite recursion detected".

**Debug workflow:**
(1) Run `EXPLAIN ANALYZE` on top-N queries — compare estimated rows vs actual rows, and check for nested loop with high loop count indicating O(n²).
(2) Bench-test with production data volume in staging: load 10k employee records and time the correlated subquery vs window function approach. The window function should be 100x+ faster.
(3) Set `cte_max_recursion_depth` guard in PostgreSQL (`SET cte_max_recursion_depth = 1000;`) and add explicit LIMIT to recursive CTEs to catch infinite loops early.

**Modern practice anchor:**
Today, CI/CD pipelines run SQL query benchmarking against synthetic data at production scale (e.g., pgBench, generated 100k-row datasets) to catch O(n²) patterns before they reach production, and tools like pg_stat_statements flag queries with unexpectedly high invocation counts.
