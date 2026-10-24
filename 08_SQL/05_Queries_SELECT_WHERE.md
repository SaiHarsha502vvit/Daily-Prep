> **SQL Chapter 05/20** | [← Previous](04_DML_Manipulating_Data.md) | [Index](../00_MASTER_INDEX.md) | [Next →](06_Aggregations_GroupBy.md)

---

## Chapter 5: Basic Queries (SELECT, WHERE, ORDER BY)

### 🧠 How SQL Queries Work — Thinking in Sets

The most important mindset shift when learning SQL: **SQL is a declarative language**. You describe **what data you want**, not **how to get it**. When you write `SELECT name FROM employees WHERE salary > 50000`, you're saying _"give me names of employees earning more than 50k"_ — the database decides _how_ to find them (which index to use, which algorithm, etc.).

#### The Logical Execution Order — Why It Matters

SQL doesn't execute in the order you write it. You write `SELECT ... FROM ... WHERE ... ORDER BY`, but the database processes it as:

```
1. FROM        → identify which table(s)
2. WHERE       → filter individual rows
3. GROUP BY    → create groups (if aggregating)
4. HAVING      → filter groups
5. SELECT      → choose/compute columns
6. DISTINCT    → remove duplicates
7. ORDER BY    → sort results
8. LIMIT       → restrict output
```

This explains several common SQL puzzles:

- **Why can't I use a column alias in WHERE?** Because WHERE executes _before_ SELECT, so the alias doesn't exist yet.
- **Why CAN I use an alias in ORDER BY?** Because ORDER BY executes _after_ SELECT.
- **Why is HAVING separate from WHERE?** Because WHERE filters rows _before_ grouping, while HAVING filters _after_ grouping.

#### The NULL Trap — A Critical Concept

`NULL` in SQL means **unknown/missing**, not zero, not empty string, not false. It follows **three-valued logic** (TRUE, FALSE, NULL):

- `NULL = NULL` → NULL (not TRUE! Two unknowns aren't necessarily equal)
- `NULL > 5` → NULL (you can't compare unknown to anything)
- `NOT NULL` → NULL (the opposite of unknown is still unknown)

This is why you must use `IS NULL` instead of `= NULL`. It's the #1 source of SQL bugs for beginners.

---

### SELECT Fundamentals

#### 📝 Formal Syntax — The Complete SELECT Statement

```
SELECT [DISTINCT] <column1> [AS <alias>], <column2>, <expression>, ...
FROM <table_name> [AS <alias>]
[WHERE <condition>]                              -- Filter individual rows
[GROUP BY <column1>, <column2>, ...]             -- Group rows
[HAVING <aggregate_condition>]                   -- Filter groups
[ORDER BY <column1> [ASC|DESC], <column2> [ASC|DESC], ...]
[LIMIT <count> [OFFSET <skip>]];                 -- Restrict output
```

#### 📝 Formal Syntax — WHERE Conditions

```
WHERE <column> = <value>                         -- Equality
WHERE <column> != <value>  |  <column> <> <value>  -- Not equal
WHERE <column> > | >= | < | <= <value>           -- Comparison
WHERE <column> BETWEEN <low> AND <high>          -- Range (inclusive)
WHERE <column> IN (<value1>, <value2>, ...)      -- Set membership
WHERE <column> LIKE '<pattern>'                  -- Pattern matching (% = any chars, _ = one char)
WHERE <column> IS NULL  |  IS NOT NULL           -- NULL checks (never use = NULL!)
WHERE <condition1> AND <condition2>              -- Both must be true
WHERE <condition1> OR <condition2>               -- Either must be true
WHERE NOT <condition>                            -- Negation
```

---

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- SELECT - RETRIEVING DATA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Select all columns
SELECT * FROM employees;

-- Select specific columns
SELECT first_name, last_name, email FROM employees;

-- Select with alias (rename columns in output)
SELECT
    first_name AS "First Name",
    last_name AS "Last Name",
    salary AS "Monthly Salary",
    salary * 12 AS "Annual Salary"
FROM employees;

-- Select with calculations
SELECT
    first_name,
    salary,
    salary * 0.10 AS tax,
    salary - (salary * 0.10) AS net_salary
FROM employees;

-- Select distinct values (remove duplicates)
SELECT DISTINCT dept_id FROM employees;

SELECT DISTINCT dept_id, job_title FROM employees;  -- Combination distinct

-- Select with CONCAT (string concatenation)
SELECT
    CONCAT(first_name, ' ', last_name) AS full_name,
    email
FROM employees;

-- Select with COALESCE (handle NULL values)
SELECT
    first_name,
    COALESCE(phone, 'No phone') AS phone,
    COALESCE(commission_pct, 0) AS commission
FROM employees;

-- Select with CASE (conditional output)
SELECT
    first_name,
    salary,
    CASE
        WHEN salary >= 100000 THEN 'High'
        WHEN salary >= 50000 THEN 'Medium'
        ELSE 'Low'
    END AS salary_grade
FROM employees;
```

### WHERE Clause - Filtering Data

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- WHERE CLAUSE - ALL COMPARISON OPERATORS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Equal
SELECT * FROM employees WHERE dept_id = 1;

-- Not equal
SELECT * FROM employees WHERE dept_id != 1;
SELECT * FROM employees WHERE dept_id <> 1;  -- Same as above

-- Greater than, Less than
SELECT * FROM employees WHERE salary > 80000;
SELECT * FROM employees WHERE salary < 80000;
SELECT * FROM employees WHERE salary >= 80000;
SELECT * FROM employees WHERE salary <= 80000;


-- ═══════════════════════════════════════════════════════════════════════════════
-- LOGICAL OPERATORS (AND, OR, NOT)
-- ═══════════════════════════════════════════════════════════════════════════════

-- AND (both conditions must be true)
SELECT * FROM employees
WHERE dept_id = 1 AND salary > 100000;

-- OR (at least one condition must be true)
SELECT * FROM employees
WHERE dept_id = 1 OR dept_id = 2;

-- NOT (negates condition)
SELECT * FROM employees
WHERE NOT dept_id = 1;

-- Combined (use parentheses for clarity!)
SELECT * FROM employees
WHERE (dept_id = 1 OR dept_id = 2) AND salary > 80000;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SPECIAL OPERATORS
-- ═══════════════════════════════════════════════════════════════════════════════

-- BETWEEN (inclusive range)
SELECT * FROM employees
WHERE salary BETWEEN 50000 AND 100000;
-- Same as: WHERE salary >= 50000 AND salary <= 100000

SELECT * FROM employees
WHERE hire_date BETWEEN '2020-01-01' AND '2020-12-31';

-- IN (match any value in list)
SELECT * FROM employees
WHERE dept_id IN (1, 2, 3);
-- Same as: WHERE dept_id = 1 OR dept_id = 2 OR dept_id = 3

SELECT * FROM employees
WHERE job_title IN ('Manager', 'Senior Developer', 'Lead');

-- NOT IN
SELECT * FROM employees
WHERE dept_id NOT IN (4, 5);

-- IS NULL / IS NOT NULL
SELECT * FROM employees WHERE manager_id IS NULL;
SELECT * FROM employees WHERE manager_id IS NOT NULL;
-- Note: = NULL won't work! Must use IS NULL


-- ═══════════════════════════════════════════════════════════════════════════════
-- LIKE - PATTERN MATCHING
-- ═══════════════════════════════════════════════════════════════════════════════

-- % = any number of characters (including zero)
-- _ = exactly one character

-- Starts with
SELECT * FROM employees WHERE first_name LIKE 'R%';    -- Rajesh, Rahul...

-- Ends with
SELECT * FROM employees WHERE email LIKE '%@gmail.com';

-- Contains
SELECT * FROM employees WHERE job_title LIKE '%Manager%';

-- Exactly N characters
SELECT * FROM employees WHERE emp_code LIKE 'E___';    -- E001, E002...

-- Combined patterns
SELECT * FROM employees WHERE email LIKE '%@%.%';      -- Valid email pattern

-- NOT LIKE
SELECT * FROM employees WHERE email NOT LIKE '%@gmail.com';

-- ESCAPE special characters
SELECT * FROM products WHERE name LIKE '%10\%%' ESCAPE '\';  -- Contains '10%'

-- Case insensitive (MySQL is case-insensitive by default for LIKE)
SELECT * FROM employees WHERE LOWER(first_name) LIKE 'r%';  -- Explicit


-- ═══════════════════════════════════════════════════════════════════════════════
-- REGEXP / RLIKE - REGULAR EXPRESSIONS (MySQL)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Match pattern
SELECT * FROM employees WHERE first_name REGEXP '^[A-M]';  -- Starts with A-M

-- Match email format
SELECT * FROM customers WHERE email REGEXP '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';

-- Match phone number format
SELECT * FROM customers WHERE phone REGEXP '^[0-9]{10}$';
```

### ORDER BY - Sorting Results

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- ORDER BY - SORTING RESULTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ascending (default)
SELECT * FROM employees ORDER BY salary;
SELECT * FROM employees ORDER BY salary ASC;  -- Explicit

-- Descending
SELECT * FROM employees ORDER BY salary DESC;

-- Multiple columns (first priority, then second)
SELECT * FROM employees
ORDER BY dept_id ASC, salary DESC;

-- Order by alias
SELECT first_name, salary, salary * 12 AS annual
FROM employees
ORDER BY annual DESC;

-- Order by column position (not recommended, but works)
SELECT first_name, last_name, salary
FROM employees
ORDER BY 3 DESC;  -- 3rd column = salary

-- Order by expression
SELECT * FROM employees
ORDER BY (salary + COALESCE(salary * commission_pct, 0)) DESC;

-- Order with NULL handling
SELECT * FROM employees
ORDER BY commission_pct NULLS LAST;  -- PostgreSQL
-- MySQL: ORDER BY ISNULL(commission_pct), commission_pct;

-- Order by CASE (custom order)
SELECT * FROM employees
ORDER BY CASE job_title
    WHEN 'Manager' THEN 1
    WHEN 'Lead' THEN 2
    WHEN 'Senior Developer' THEN 3
    ELSE 4
END;

-- Random order (useful for sampling)
SELECT * FROM employees ORDER BY RAND() LIMIT 5;  -- MySQL
SELECT * FROM employees ORDER BY RANDOM() LIMIT 5;  -- PostgreSQL
```

### LIMIT and OFFSET - Pagination

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- LIMIT - RESTRICTING RESULT COUNT
-- ═══════════════════════════════════════════════════════════════════════════════

-- Get first N rows
SELECT * FROM employees LIMIT 10;

-- Get top 5 highest paid
SELECT * FROM employees
ORDER BY salary DESC
LIMIT 5;

-- OFFSET - Skip first N rows (for pagination)
SELECT * FROM employees
ORDER BY emp_id
LIMIT 10 OFFSET 20;  -- Skip 20, get next 10 (page 3)

-- Alternative syntax (MySQL)
SELECT * FROM employees
ORDER BY emp_id
LIMIT 20, 10;  -- LIMIT offset, count


-- ═══════════════════════════════════════════════════════════════════════════════
-- PAGINATION EXAMPLE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Page 1 (rows 1-10)
SELECT * FROM products ORDER BY product_id LIMIT 10 OFFSET 0;

-- Page 2 (rows 11-20)
SELECT * FROM products ORDER BY product_id LIMIT 10 OFFSET 10;

-- Page 3 (rows 21-30)
SELECT * FROM products ORDER BY product_id LIMIT 10 OFFSET 20;

-- General formula: OFFSET = (page_number - 1) * page_size

-- Get total count for pagination UI
SELECT COUNT(*) AS total_products FROM products;
```

---

## 📝 PRACTICE EXERCISES - PART 1

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- PRACTICE PROBLEMS - FOUNDATIONS
-- ═══════════════════════════════════════════════════════════════════════════════

/*
Use this sample database for practice:

Tables: employees, departments, products, customers, orders, order_items
(Schemas provided in Chapter 3)
*/

-- LEVEL: EASY

-- 1. Select all employees from the Engineering department
-- Expected: Use WHERE with subquery or JOIN

-- 2. Find all employees whose salary is between 60000 and 100000
-- Expected: Use BETWEEN

-- 3. List all products that contain 'phone' in their name (case insensitive)
-- Expected: Use LIKE

-- 4. Find all customers who don't have a phone number
-- Expected: Use IS NULL

-- 5. Get the top 10 highest paid employees
-- Expected: Use ORDER BY and LIMIT


-- LEVEL: MEDIUM

-- 6. Find all employees who were hired in 2021 or 2022
-- Expected: Multiple approaches possible (BETWEEN, IN, YEAR())

-- 7. List employees sorted by department, then by salary (highest first within dept)
-- Expected: ORDER BY multiple columns

-- 8. Find all managers (employees who have other employees reporting to them)
-- Expected: Use subquery with EXISTS or IN

-- 9. Get the 3rd page of products (10 products per page), sorted by price
-- Expected: Use LIMIT and OFFSET

-- 10. Display employees with their full name and salary grade
--     (High: >100000, Medium: 50000-100000, Low: <50000)
-- Expected: Use CASE statement


-- Try to solve these before looking at solutions below!

```

---

## ✅ SOLUTIONS TO PRACTICE EXERCISES

```sql
-- SOLUTIONS

-- 1. Employees from Engineering
SELECT e.* FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
WHERE d.dept_name = 'Engineering';

-- 2. Salary between 60000 and 100000
SELECT * FROM employees WHERE salary BETWEEN 60000 AND 100000;

-- 3. Products containing 'phone'
SELECT * FROM products WHERE LOWER(name) LIKE '%phone%';

-- 4. Customers without phone
SELECT * FROM customers WHERE phone IS NULL;

-- 5. Top 10 highest paid
SELECT * FROM employees ORDER BY salary DESC LIMIT 10;

-- 6. Hired in 2021 or 2022
SELECT * FROM employees
WHERE YEAR(hire_date) IN (2021, 2022);
-- OR: WHERE hire_date BETWEEN '2021-01-01' AND '2022-12-31';

-- 7. Sorted by dept then salary
SELECT * FROM employees ORDER BY dept_id ASC, salary DESC;

-- 8. Find managers
SELECT DISTINCT m.* FROM employees m
WHERE EXISTS (SELECT 1 FROM employees e WHERE e.manager_id = m.emp_id);
-- OR: WHERE emp_id IN (SELECT DISTINCT manager_id FROM employees WHERE manager_id IS NOT NULL);

-- 9. 3rd page of products
SELECT * FROM products ORDER BY price LIMIT 10 OFFSET 20;

-- 10. Full name and salary grade
SELECT
    CONCAT(first_name, ' ', last_name) AS full_name,
    salary,
    CASE
        WHEN salary > 100000 THEN 'High'
        WHEN salary >= 50000 THEN 'Medium'
        ELSE 'Low'
    END AS salary_grade
FROM employees;
```

---

_"Part 1 Complete! You now understand Database basics, Data Types, DDL, DML, and basic SELECT queries."_

---

> **Navigation**: [< Previous](04_DML_Manipulating_Data.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](06_Aggregations_GroupBy.md)

### Historical Evolution

**Predecessors (with years):**
- **Chamberlin & Boyce SEQUEL** (1974): Created SEQUEL — the first declarative query language where SELECT/FROM/WHERE order was chosen for human readability, not execution order, directly shaping modern SQL syntax.
- **Edgar F. Codd** (1970): Introduced three-valued logic (TRUE, FALSE, UNKNOWN) to handle missing information formally, a philosophical decision that caused the NULL semantics still confusing SQL developers today.
- **Chris Date** (1975): Wrote extensively on the NULL problem and three-valued logic inconsistencies, documenting edge cases like `NULL = NULL` being NULL not TRUE that persist as common bugs.
- **SQL-86**: Standardized the SELECT statement and NULL concept, cementing three-valued logic as a permanent feature of SQL.
- **SQL-92**: Added CASE expressions, completing the declarative expression capability that enables all modern conditional SQL logic.

**Evolution narrative:**
Chamberlin designed SEQUEL's keyword order (SELECT...FROM...WHERE) as a near-English sentence — "SELECT name FROM employees WHERE salary > 50000" — prioritizing human readability. But internally, the query must be parsed and optimized: the database can't evaluate SELECT before it knows which table to read. This gap between write order and execution order produced the query processing pipeline (FROM → WHERE → GROUP BY → SELECT → ORDER BY) that confuses every SQL learner. Codd's decision to model NULL as a third logical value (UNKNOWN, not ZERO or EMPTY) was philosophically rigorous — it correctly represents "we don't know this value" — but it created the NULL trap where `WHERE salary > 50000` silently excludes NULL salary rows. SQL-92's CASE expressions finally gave SQL a proper conditional construct, replacing earlier COBOL-style IF expressions that couldn't be nested in SELECT clauses.

**Modern practice anchor:**
Today, every SQL interview expects candidates to explain why `WHERE` filters before SELECT (and therefore can't use aliases) and why `IS NULL` must be used instead of `= NULL` — both direct consequences of Chamberlin's read-order design and Codd's three-valued logic from the 1970s.

### Production Reality

**Failure modes:**
1. **SELECT * with BLOB columns causing 8-second page loads**: A `SELECT *` on a `user_profiles` table pulls a `profile_pic` MEDIUMBLOB (5MB) on every page view, even when the pic isn't displayed. Queries returning 10 rows with 5MB BLOBs each consume 50MB per request. A Stack Overflow 2011 incident traced slow page loads to `SELECT *` pulling LONGTEXT columns across the wire unnecessarily.
2. **Leading wildcard LIKE disabling index**: `WHERE email LIKE '%@gmail.com'` forces a full index scan (or table scan) because the B-tree cannot navigate from a trailing wildcard — it must examine every index entry. On 10M users, this query takes 5-10 seconds. Fix: use a reverse-index or full-text index.
3. **Function on indexed column in WHERE clause**: `WHERE YEAR(hire_date) = 2023` applies YEAR() to every row before filtering, preventing the index on `hire_date` from being used. The database does a seq scan even with an index present. Fix: use `WHERE hire_date >= '2023-01-01' AND hire_date < '2024-01-01'`.

**Debug workflow:**
1. Run `EXPLAIN ANALYZE` and check for `Seq Scan` or `type=ALL` — if present on a table with an index on the filtered column, suspect a function wrapper or leading wildcard.
2. Profile column sizes: `SELECT AVG(LENGTH(col)) FROM table` to find unexpectedly large columns, then remove them from `SELECT *` to explicit column lists.
3. Replace `LIKE '%pattern%'` with `LIKE 'pattern%'` where possible, or migrate to full-text search (MySQL `MATCH ... AGAINST`, PostgreSQL `tsvector`). Check `pg_stat_user_indexes` for index usage ratios.

**Modern practice anchor:**
Today, query analyzers like `pt-query-digest` (Percona), MySQL `performance_schema`, and PostgreSQL `pg_stat_statements` surface slow queries with high row counts — catching SELECT * abuse and unindexed LIKE patterns automatically in production.


---

## Reality Check

**"WHERE filters the original table rows"** → Conceptually true, but the query planner can reorder operations significantly. The logical evaluation order is: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. This means you CANNOT use a SELECT alias in WHERE (the alias doesn't exist yet). You CAN use a SELECT alias in ORDER BY in most databases (they evaluate SELECT before ORDER BY). HAVING vs WHERE: HAVING filters AFTER aggregation, WHERE filters BEFORE.

**"LIMIT makes the whole query faster"** → LIMIT reduces the number of rows returned to the client, and the planner may short-circuit execution for simple queries. But for `ORDER BY col LIMIT 10` without an index on col, the database must sort ALL rows then take 10 — the sort cost is still paid. With an index on col, the planner can do an index scan and stop after 10 rows. LIMIT without ORDER BY returns an arbitrary subset — not "the first N rows" in any meaningful sense.

**"OR in WHERE is always slower than two separate queries"** → OR can prevent index usage: `WHERE city = 'NYC' OR zip = '10001'` may do two index scans unioned, or a full table scan. But two separate queries have network overhead and transaction isolation issues. Modern query planners handle simple OR conditions well with index-merge optimizations. Profile before splitting queries. UNION ALL (instead of OR) is a common rewrite that often helps the planner use two separate index scans.

**"BETWEEN is inclusive on both ends in all databases"** → `BETWEEN a AND b` is `>= a AND <= b` (inclusive on both ends) in all major SQL databases. The gotcha is with dates and timestamps: `BETWEEN '2024-01-01' AND '2024-01-31'` excludes any timestamps on 2024-01-31 after midnight (e.g., 2024-01-31 14:00:00). For dates with timestamps, use `>= '2024-01-01' AND < '2024-02-01'` instead of BETWEEN.

**"SELECT DISTINCT is the right way to remove duplicates from results"** → DISTINCT deduplicate by comparing all selected columns. It requires sorting or hashing the entire result set — O(n log n) or O(n). If you're using DISTINCT to fix a broken JOIN (you joined a one-to-many and got duplicate parent rows), fixing the JOIN is better than patching with DISTINCT. DISTINCT is correct for: "what unique values exist in this column?" Suspicious for: "why am I getting duplicates from this join?"
