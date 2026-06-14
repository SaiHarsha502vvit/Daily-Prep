**Navigation**: [< Previous](06_Implementation_Checklist.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](08_Debugging_DryRun.md)

# 🗃️ SQL Mental Pipeline — Think in Sets, Build Queries Step-by-Step

**The key insight**: SQL doesn't work like Java. In Java, you think in LOOPS (process one row at a time). In SQL, you think in SETS (operate on entire tables at once). This shift is the #1 barrier for programmers learning SQL.

---

## Part 1: The Mindset Shift — Loops vs Sets

### Java Thinking (WRONG for SQL)

```
"For each employee, check if their salary > 50000, then get their name"
→ Loop through employees, if salary > 50000, add to result list
```

### SQL Thinking (CORRECT)

```
"From the employees TABLE, FILTER rows where salary > 50000, PICK the name column"
→ SELECT name FROM employees WHERE salary > 50000;

You're describing WHAT you want, not HOW to get it.
SQL is declarative — you describe the result, the engine figures out the steps.
```

### Mental Model: Think of Tables as Spreadsheets

```
employees table = a spreadsheet
Each row = one employee
Each column = one attribute (name, salary, dept_id)
Your query = a formula that produces a NEW spreadsheet from existing ones
```

---

## Part 2: The SQL Execution Order — MEMORIZE THIS

### What You Write vs What Runs

```
WRITING ORDER:          EXECUTION ORDER (how SQL actually processes):
SELECT    ─── 5th ───→  1. FROM / JOIN    (which tables?)
FROM      ─── 1st ───→  2. WHERE          (filter rows)
JOIN      ─── 1st ───→  3. GROUP BY       (make groups)
WHERE     ─── 2nd ───→  4. HAVING         (filter groups)
GROUP BY  ─── 3rd ───→  5. SELECT         (pick columns)
HAVING    ─── 4th ───→  6. DISTINCT       (remove duplicates)
ORDER BY  ─── 6th ───→  7. ORDER BY       (sort)
LIMIT     ─── 7th ───→  8. LIMIT/OFFSET   (paginate)
```

### Why Execution Order Matters

```sql
-- This WORKS:
SELECT dept, COUNT(*) AS cnt
FROM employees
GROUP BY dept
HAVING cnt > 5;     -- "cnt" is available because SELECT runs before HAVING?
                     -- Actually, HAVING runs before SELECT!
                     -- MySQL allows alias here as exception, but standard SQL doesn't.

-- Standard SQL way:
HAVING COUNT(*) > 5;  -- Use the expression, not the alias
```

### Memory Trick: "**F**rogs **W**ill **G**ladly **H**elp **S**olve **O**ur **L**essons"

```
FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
```

---

## Part 3: The Query Building Pipeline

### Step-by-Step Building Method

For ANY SQL question, build your query in this order:

```
Step 1: FROM — "What tables do I need?"
Step 2: JOIN — "How are the tables connected?"
Step 3: WHERE — "What rows do I want to filter OUT?"
Step 4: GROUP BY — "Do I need to aggregate?"
Step 5: HAVING — "Filter AFTER grouping?"
Step 6: SELECT — "What columns/expressions do I want to see?"
Step 7: ORDER BY — "What order?"
Step 8: LIMIT — "How many rows?"
```

### Worked Example: "Find departments with more than 5 employees earning above 50K"

```sql
-- Step 1: FROM — I need employees table
FROM employees e

-- Step 2: JOIN — I might need departments table for dept name
JOIN departments d ON e.dept_id = d.id

-- Step 3: WHERE — Filter to salaries above 50K
WHERE e.salary > 50000

-- Step 4: GROUP BY — Group by department
GROUP BY d.name

-- Step 5: HAVING — Only departments with count > 5
HAVING COUNT(*) > 5

-- Step 6: SELECT — I want dept name and count
SELECT d.name, COUNT(*) AS employee_count

-- FINAL assembled query:
SELECT d.name, COUNT(*) AS employee_count
FROM employees e
JOIN departments d ON e.dept_id = d.id
WHERE e.salary > 50000
GROUP BY d.name
HAVING COUNT(*) > 5
ORDER BY employee_count DESC;
```

---

## Part 4: JOIN Mental Models

### The Venn Diagram Approach

```
Table A       Table B
┌─────┐      ┌─────┐
│  A  │      │  B  │
│  ┌──┼──────┼──┐  │
│  │ A∩B     │  │  │
│  └──┼──────┼──┘  │
└─────┘      └─────┘

INNER JOIN:      A ∩ B         (only matching rows)
LEFT JOIN:       All A + matching B (null if no match)
RIGHT JOIN:      matching A + All B
FULL OUTER JOIN: All A + All B (nulls where no match)
CROSS JOIN:      A × B         (every combo — rarely wanted)
```

### When to Use Each JOIN

```
"Get employees WITH their department name"    → INNER JOIN (skip employees with no dept)
"Get ALL employees, even without department"  → LEFT JOIN (keep all employees)
"Find employees WITHOUT a department"         → LEFT JOIN + WHERE b.id IS NULL
"Find all possible team pairings"             → CROSS JOIN (or self-join)
"Find matching records in both tables"        → INNER JOIN
```

### The Self-Join Pattern

```sql
-- "Find employees who earn more than their manager"
-- Same table, two roles → self-join with aliases

SELECT e.name AS employee, m.name AS manager
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;

-- Mental model: Imagine two COPIES of the same spreadsheet side by side
-- One copy = "as employee", other copy = "as manager"
```

---

🔬 **Section Challenge — Part 4: JOIN Mental Models**

**Challenge 1 (Mental Model — Who/When/What):** Draw the mental pipeline for: `SELECT c.name, COUNT(o.id) FROM customers c LEFT JOIN orders o ON c.id = o.customer_id WHERE c.country = 'IN' GROUP BY c.id HAVING COUNT(o.id) = 0`. **Who** gets counted as 0? **When** does the LEFT JOIN matter here? **What** would INNER JOIN return instead?

<details><summary>Answer</summary>

**Mental pipeline:** (1) FROM+JOIN: all `customers` rows from India (after WHERE pushdown) LEFT JOINed with `orders` — customers with no orders get `o.id = NULL`. (2) WHERE `c.country = 'IN'` — filters customers table (the LEFT side) — safe, doesn't remove NULL rows. (3) GROUP BY: each customer becomes one group. (4) HAVING `COUNT(o.id) = 0` — `COUNT(o.id)` counts non-NULL values, so customers with no orders get `COUNT(o.id) = 0`. **Who gets counted as 0?** Indian customers with zero orders — the NULL rows from the LEFT JOIN. **When does LEFT JOIN matter?** EXACTLY here — it's what keeps customers with no orders in the result set. **What would INNER JOIN return?** Empty set — INNER JOIN excludes customers with no orders, so HAVING COUNT(o.id)=0 would never be true. This query pattern (LEFT JOIN + HAVING COUNT = 0) is the canonical "find entities with no related records" template.

</details>

## Part 5: Subquery vs JOIN — Decision Framework

### When to Use Subquery

```
1. "Find employees whose salary > AVERAGE salary"
   → The inner query computes ONE value
   SELECT * FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);

2. "Find employees in departments located in NYC"
   → The inner query computes a LIST
   SELECT * FROM employees WHERE dept_id IN (SELECT id FROM departments WHERE city = 'NYC');

3. Correlated subquery — when inner query DEPENDS on outer query
   "Find employees who earn max in their department"
   SELECT * FROM employees e
   WHERE salary = (SELECT MAX(salary) FROM employees WHERE dept_id = e.dept_id);
```

### When to Use JOIN Instead

```
1. When you need columns from BOTH tables → JOIN
2. When subquery would be executed for EACH row (correlated) → Consider JOIN
3. When you need to combine/match data → JOIN

Rule of thumb: If you need columns from multiple tables in SELECT → use JOIN
               If you need a value for filtering (WHERE/HAVING) → subquery is fine
```

---

🔬 **Section Challenge — Part 5: Subquery vs JOIN — Decision Framework**

**Challenge 1 (Reasoning):** You need to "find employees whose salary is greater than the average salary." Why must you use a subquery for this, rather than a JOIN?

<details><summary>Answer</summary>

Because "average salary" is an aggregate value computed over the entire `employees` table, while the filtering condition (`>`) must be applied to individual rows. A JOIN requires matching keys between rows, but here we are comparing row-level data against a global aggregate. You cannot compute `AVG(salary)` and select individual rows in the same level without a window function. Therefore, the subquery `(SELECT AVG(salary) FROM employees)` is necessary to compute the scalar aggregate first.

</details>

**Challenge 2 (Performance):** Correlated subqueries are often described as having `O(N^2)` performance characteristics. Why? How can a JOIN fix this?

<details><summary>Answer</summary>

A correlated subquery references columns from the outer query (e.g., `WHERE salary = (SELECT MAX(salary) FROM employees WHERE dept_id = outer.dept_id)`). This forces the database engine to execute the inner query _once for every single row_ returned by the outer query. If the outer table has N rows, the inner table is scanned N times, leading to `O(N^2)` performance. A JOIN fixes this by computing the aggregate for all departments _once_ (e.g., `JOIN (SELECT dept_id, MAX(salary) AS max_sal FROM employees GROUP BY dept_id)`), returning a temporary table that is then hash-joined to the outer query in `O(N)` time.

</details>

## Part 6: GROUP BY + Aggregation — Mental Model

### Think of GROUP BY as "Making Piles"

```
Before GROUP BY (individual rows):
| name   | dept | salary |
|--------|------|--------|
| Alice  | HR   | 60000  |
| Bob    | IT   | 75000  |
| Carol  | HR   | 55000  |
| Dave   | IT   | 80000  |

After GROUP BY dept (piles):
┌────────────┐  ┌────────────┐
│ HR pile    │  │ IT pile    │
│ Alice 60K  │  │ Bob 75K    │
│ Carol 55K  │  │ Dave 80K   │
└────────────┘  └────────────┘

Now you can only SELECT:
✅ The pile label (dept)          → SELECT dept
✅ Aggregate of pile (COUNT, SUM) → SELECT COUNT(*), AVG(salary)
❌ Individual row values (name)   → ERROR! Which name from the pile?
```

### Common Aggregations

```sql
COUNT(*)         — Number of rows (including NULLs)
COUNT(column)    — Number of NON-NULL values
SUM(column)      — Total
AVG(column)      — Average
MIN(column)      — Smallest
MAX(column)      — Largest
GROUP_CONCAT()   — Combine strings (MySQL)
STRING_AGG()     — Combine strings (PostgreSQL)
```

### WHERE vs HAVING

```
WHERE:  Filters ROWS before grouping    → Cannot use aggregates
HAVING: Filters GROUPS after grouping   → CAN use aggregates

-- "Departments with average salary > 60K (exclude interns first)"
SELECT dept, AVG(salary)
FROM employees
WHERE role != 'Intern'      -- Filter ROWS first (before grouping)
GROUP BY dept
HAVING AVG(salary) > 60000  -- Filter GROUPS (after grouping)
```

---

## Part 7: Window Functions — "Aggregation Without Losing Rows"

### The Problem Window Functions Solve

```
GROUP BY collapses rows → you lose individual row data
Window functions compute aggregates BUT keep every row!

| name  | dept | salary | dept_avg | dept_rank |
|-------|------|--------|----------|-----------|
| Alice | HR   | 60000  | 57500    | 1         |  ← Each row kept!
| Carol | HR   | 55000  | 57500    | 2         |
| Dave  | IT   | 80000  | 77500    | 1         |
| Bob   | IT   | 75000  | 77500    | 2         |
```

### Window Function Template

```sql
function_name() OVER (
    PARTITION BY column    -- Like GROUP BY, but keeps rows
    ORDER BY column        -- Ordering within each partition
    ROWS BETWEEN ...       -- Optional: frame specification
)
```

### The 3 Most Important Window Functions

```sql
-- 1. ROW_NUMBER(): Unique rank (1, 2, 3, 4)
ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC)

-- 2. RANK(): Same rank for ties, skip next (1, 1, 3, 4)
RANK() OVER (PARTITION BY dept ORDER BY salary DESC)

-- 3. DENSE_RANK(): Same rank for ties, no skip (1, 1, 2, 3)
DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC)

-- Common use: "Top N per group"
SELECT * FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS rn
    FROM employees
) ranked
WHERE rn <= 3;  -- Top 3 earners per department
```

---

🔬 **Section Challenge — Part 7: Window Functions — "Aggregation Without Losing Rows"**

**Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.

<details><summary>Answer</summary>

Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.

</details>

## Part 8: SQL Problem Classification

```
See these keywords in the problem? → Use this approach:

"For each department/category..."    → GROUP BY
"Top N per group"                    → Window function + ROW_NUMBER()
"Running total / cumulative sum"     → Window function + SUM() OVER
"Compare with previous row"          → LAG() / LEAD() window functions
"Employees not in any project"       → LEFT JOIN + IS NULL (or NOT IN)
"Second highest salary"              → DENSE_RANK() or LIMIT/OFFSET or subquery
"Find duplicates"                    → GROUP BY + HAVING COUNT(*) > 1
"Consecutive dates/numbers"          → ROW_NUMBER trick (value - row_num = constant for consecutive)
"Pivot/Unpivot data"                 → CASE WHEN + GROUP BY (or PIVOT keyword)
"Hierarchical data (manager chain)"  → Self-join or recursive CTE
```

---

## Part 9: SQL Debugging Checklist

```
□ Does my JOIN produce duplicates? (Check if join keys are unique)
□ NULL handling: IS NULL not = NULL (NULL = NULL is false!)
□ Am I selecting non-grouped columns without aggregate? → SQL error
□ HAVING vs WHERE: aggregate functions only in HAVING
□ String comparison: 'abc' (single quotes), not "abc" in standard SQL
□ Date comparison: Use proper date functions, don't compare strings
□ ORDER BY: Is my sort correct? ASC (default) vs DESC
□ LIMIT without ORDER BY: Results are non-deterministic
□ COUNT(*) vs COUNT(column): * counts NULLs, column doesn't
□ Subquery returns multiple rows but used with = instead of IN?
```

---

## NEW DIAGRAM — SQL Query Execution Pipeline (FROM → LIMIT, Annotated)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DIAGRAM: SQL Query Execution Pipeline — Clause-by-Clause with Labels       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  WHAT YOU WRITE (declarative):                                               │
│  SELECT col, COUNT(*) FROM table JOIN t2 ON ... WHERE ...                    │
│  GROUP BY col HAVING ... ORDER BY col LIMIT ...                              │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  WHAT SQL ENGINE ACTUALLY RUNS (pipeline order):                     │    │
│  │                                                                       │    │
│  │  ① FROM / JOIN                                                        │    │
│  │     ├─ Reads source tables from disk                                 │    │
│  │     ├─ Executes JOINs (produces Cartesian product, then filters)     │    │
│  │     └─ Output: full joined row set                                   │    │
│  │     │                                                                  │    │
│  │     ▼                                                                  │    │
│  │  ② WHERE (row-level filter)                                           │    │
│  │     ├─ Evaluates condition for each row from FROM/JOIN               │    │
│  │     ├─ Eliminates rows that don't match                               │    │
│  │     └─ CANNOT use aggregate functions (COUNT, SUM, AVG) here!        │    │
│  │     │                                                                  │    │
│  │     ▼                                                                  │    │
│  │  ③ GROUP BY (creates groups/piles)                                    │    │
│  │     ├─ Groups rows that share the same GROUP BY key(s)               │    │
│  │     ├─ One output row per unique key value                           │    │
│  │     └─ CANNOT SELECT individual columns (only key + aggregates)      │    │
│  │     │                                                                  │    │
│  │     ▼                                                                  │    │
│  │  ④ HAVING (group-level filter)                                        │    │
│  │     ├─ Evaluates condition for each GROUP (after aggregation)        │    │
│  │     ├─ CAN use aggregate functions (COUNT, SUM, AVG, MIN, MAX)      │    │
│  │     └─ WHERE filters BEFORE groups; HAVING filters AFTER groups     │    │
│  │     │                                                                  │    │
│  │     ▼                                                                  │    │
│  │  ⑤ SELECT (project columns)                                           │    │
│  │     ├─ Evaluates expressions (col renames, arithmetic, functions)    │    │
│  │     ├─ Computes aggregate functions over the group                   │    │
│  │     └─ NOTE: SELECT runs AFTER HAVING but referenced in some DBs     │    │
│  │     │                                                                  │    │
│  │     ▼                                                                  │    │
│  │  ⑥ DISTINCT (optional, remove duplicates)                             │    │
│  │     └─ Scans result, eliminates duplicate rows                       │    │
│  │     │                                                                  │    │
│  │     ▼                                                                  │    │
│  │  ⑦ ORDER BY (sort result)                                              │    │
│  │     ├─ Sorts rows by specified column(s), ASC (default) or DESC      │    │
│  │     └─ NOTE: This happens AFTER all filtering — sort cost grows     │    │
│  │           with result set size, not original table size!             │    │
│  │     │                                                                  │    │
│  │     ▼                                                                  │    │
│  │  ⑧ LIMIT / OFFSET (paginate)                                           │    │
│  │     └─ Keeps only top N rows, skips OFFSET rows                      │    │
│  │                                                                       │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  WORKED EXAMPLE: "Departments with more than 5 employees earning > 50K"     │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                                                                       │    │
│  │  Input tables: employees(id, name, salary, dept_id)                  │    │
│  │                 departments(id, name)                                │    │
│  │                                                                       │    │
│  │  Step 1 FROM: employees JOIN departments ON dept_id = departments.id │    │
│  │             Produces: [name, salary, dept_name] for all rows         │    │
│  │                                                                       │    │
│  │  Step 2 WHERE: salary > 50000                                        │    │
│  │             Filters: only high-earning employees remain             │    │
│  │                                                                       │    │
│  │  Step 3 GROUP BY: dept_name                                          │    │
│  │             Groups: each department name → one group                │    │
│  │                                                                       │    │
│  │  Step 4 HAVING: COUNT(*) > 5                                         │    │
│  │             Filters: only departments with > 5 qualifying employees  │    │
│  │                                                                       │    │
│  │  Step 5 SELECT: dept_name, COUNT(*) AS emp_count                    │    │
│  │             Projects: [dept_name, emp_count] per group              │    │
│  │                                                                       │    │
│  │  Step 7 ORDER BY: emp_count DESC                                     │    │
│  │             Sorts: largest departments first                        │    │
│  │                                                                       │    │
│  │  FINAL OUTPUT: [dept_name, emp_count] for qualifying departments     │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  MEMORY TRICK: "Frogs Will Gladly Help Solve Our Lessons"                   │
│  FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Historical Evolution

> **Why this section**: mental-model pedagogy requires knowing the prior art. The frameworks below all have named predecessors — naming them prevents reinventing the wheel and connects your reasoning to decades of computer-science practice.

| Year | Predecessor | Contribution |
| --- | --- | --- |
| 1970 | Codd | Relational model — set-theory foundation for databases |
| 1974 | Chamberlin & Boyce | SEQUEL — first SQL language design |
| 1974-1979 | System R | IBM's relational database implementation (ARIES, query optimization) |
| 1974 | Stonebraker & Wong | INGRES — first academic relational DB |
| 1985 | Codd | 12 rules — formal definition of relational DBMS |

**Evolution narrative**: Edgar Codd's 1970 paper "A Relational Model of Data for Large Shared Data Banks" established the theoretical foundation: data as sets, operations as relational algebra, and the separation of logical and physical storage. This was revolutionary because it replaced navigational data access (following pointers) with declarative set operations — the mental shift this guide emphasizes. Donald Chamberlin and Raymond Boyce's 1974 SEQUEL language (evolving into SQL) provided the human interface to Codd's theory. IBM's System R project (1974-1979) implemented the relational model, invented the ARIES recovery algorithm, and developed query optimization techniques that still underpin modern SQL engines. Michael Stonebraker's INGRES (1974) provided the academic counterpart, pioneering distributed query processing. Codd's 1985 formalization of the "12 rules" synthesized the full relational theory into a checklist that defined what a true relational database must implement.

**Modern practice anchor**: Today's SQL optimization (PostgreSQL, MySQL, SQLite query planners) directly inherits System R's query optimization techniques and INGRES's distributed processing research. The "FROM → WHERE → GROUP BY → HAVING → SELECT" execution order taught in this guide matches the execution pipeline designed by System R and formalized in Codd's rules.

## Production Reality

> **Why this section**: a mental model is only useful if it predicts what breaks in production. Below are named failure modes tied to this mental model, with debug workflows and modern observability tools.

### Failure Mode 1: N+1 Query Storm — ORM Default Kills Performance at Scale

**What goes wrong**: A typical ORM query pattern — fetch 100 users, then loop through and call `user.getPosts()` for each — fires 1 + 100 separate database queries. With 1,000 users, that's 1,001 queries. At n=10,000, a "select all" screen triggers a 10,001-query storm that saturates the DB connection pool and causes request timeouts.

**Cost**: Query timeout errors (typically 5-30 second threshold). Users see blank screens. Database CPU spikes to 100%, affecting all other services. SLA breach if page's p99 latency exceeds limit.

**Debug workflow**:
1. Enable `pg_stat_statements` (PostgreSQL) or MySQL slow query log. Look for patterns of many sequential queries with identical structure but different IDs.
2. Check ORM query log / Django SQL logging / RailsBullet for N+1 patterns in development before they hit production.
3. Run `EXPLAIN ANALYZE` on the top N queries: look for high total_time with low plan overhead — that's the N+1 signature.
4. Fix with eager loading: `JOIN` in SQL, or `SELECT ... IN (...)` batched approach, or DataLoader batching pattern at the application layer.

### Failure Mode 2: Missing Index — Full Table Scan on Production Data Volume

**What goes wrong**: A migration adds a new column and a query filters on it. Works fine in staging (10K rows). In production (10M rows) the query does a sequential scan taking 30+ seconds, causing request timeouts. The index was never added because the staging dataset didn't reflect production row counts.

**Cost**: Production outage. Users see timeout errors. The missing index silently compounds: as the table grows, query time grows linearly until it crosses the timeout threshold.

**Debug workflow**:
1. Run `EXPLAIN ANALYZE` on all new queries in staging using a production-data-size snapshot.
2. Check `pg_stat_user_indexes` to verify indexes are actually being used (not just created).
3. Add `EXPLAIN` regression tests to CI: if a query plan changes from index scan to sequential scan on large tables, fail the build.
4. Monitor `seq_scan` vs `idx_scan` ratio in `pg_stat_user_tables` — a sudden spike in sequential scans on a previously indexed table signals a missing or dropped index.

### Failure Mode 3: Query Plan Regression After Postgres Upgrade

**What goes wrong**: Upgrading PostgreSQL from 12 to 14 changed the query planner's statistics model. A previously fast query switched from index scan to sequential scan because the planner overestimated row count after a schema change. The application was not modified — only the database version.

**Cost**: Feature rollback or emergency database downgrade. Production service degraded during investigation. At scale, hours of engineering time lost to planner diagnosis.

**Debug workflow**:
1. Before upgrading, run `pg_upgrade --checks` and compare query plans for the top 50 queries.
2. Set `pg_hint_plan` or use optimizer hints to force known-good plans in new versions.
3. Run `ANALYZE` on all tables immediately after upgrade — stale statistics are the #1 cause of planner regressions.
4. Pin query plans for critical queries using `PLAN Hint` or stored outlines so upgrades don't silently change them.

### Failure Mode 4: Production Row Count Underestimation — Wrong JOIN Order

**What goes wrong**: PostgreSQL's planner misestimates the number of rows from a table with non-uniform distribution (e.g., a `status` column where 99% of rows have `status='active'` and 1% have `status='archived'`). The planner picks a nested loop join when a hash join would be orders of magnitude faster. The query runs for 30+ seconds.

**Cost**: Production query timeout. Lock contention on the slow table. Cascading latency for dependent services.

**Debug workflow**:
1. Run `EXPLAIN (ANALYZE, BUFFERS)` — look for `rows=1000` in the plan vs `actual rows=1000000` in reality.
2. Create partial statistics: `CREATE STATISTICS s1 (dependencies) ON status FROM orders; ANALYZE;` to help the planner understand skewed distributions.
3. Add explicit join order hints for critical queries using `/*+ Leading(t orders) */` style hints in PostgreSQL 13+.
4. Run `pg_stats` histogram check on the skewed column — if histogram buckets are too coarse, adjust with `ALTER TABLE orders ALTER COLUMN status SET STATISTICS 500`.

### Modern Production Tools

- **`pg_stat_statements`**: Tracks total_time, calls, and mean_time per query. Identify N+1 patterns by finding queries with the same template but different literal IDs.
- **Slow query log (`log_min_duration_statement = 1000`)**: Log all queries over 1 second to capture regression signatures after schema changes.
- **`EXPLAIN ANALYZE`**: Always run on production-sized data. The plan can change dramatically with row count — staging with 10K rows tells a completely different story than production with 10M.
- **Heroku Data Clerk / pgMustard**: Visual query plan analysis. Identifies expensive scans, misestimated rows, and missing indexes automatically.
- **Neon / PlanetScale / CockroachDB**: Managed SQL with automatic index recommendation and query performance monitoring built into the cloud console.

## Conceptual Depth & Topical Breadth

> **Why this section**: this mental model rests on a specific invariant, and its variants cover a spectrum of trade-offs. Knowing the invariant and the variants lets you apply the model correctly across problems.

### Invariant

SQL is **set-based, not row-based** — you describe the result set, not the iteration. The invariant is that a SQL query operates on entire tables as sets, producing a new set as output. This is fundamentally different from imperative loops because set operations have no inherent order and no intermediate state between rows. The second critical invariant is that **execution order differs from writing order** — SQL engines execute FROM/JOIN first, then WHERE, GROUP BY, HAVING, SELECT, ORDER BY, and LIMIT last. This matters because you cannot reference column aliases defined in SELECT within WHERE (which runs earlier), and HAVING runs after GROUP BY (so it can filter on aggregates). Understanding these two invariants — set semantics and execution order — explains why SQL queries behave unexpectedly when programmers apply loop-based intuition.

### Variants Comparison

| JOIN Type | Output Rows | Use Case | NULL Handling |
| --- | --- | --- | --- |
| INNER JOIN | Only matching rows in both tables | Default, intersection | No NULLs from join |
| LEFT JOIN | All left rows + matching right (NULL if no match) | Optional relationships | Right columns become NULL |
| RIGHT JOIN | All right rows + matching left (NULL if no match) | Rare, usually rewrite as LEFT | Left columns become NULL |
| FULL OUTER JOIN | All rows from both tables | Complete union, rarely needed | Both sides can be NULL |
| CROSS JOIN | Cartesian product (all pairs) | Generating combinations | No NULLs, n*m rows |

### Decision Table

| Clause | Runs At | Can Reference | Use When |
| --- | --- | --- | --- |
| WHERE | After FROM/JOIN | Columns from source tables | Filter individual rows |
| GROUP BY | After WHERE | Columns to group by | Aggregation needed |
| HAVING | After GROUP BY | Aggregates, grouped columns | Filter after aggregation |
| SELECT | After HAVING | Any column, aliases | Select output columns |
| ORDER BY | After SELECT | Any column, aliases | Sort final result |
| LIMIT | Last | Numeric literals | Pagination |

### Filter Clause Comparison

| Clause | Filters On | Evaluated | Can Use Aggregate Functions |
| --- | --- | --- | --- |
| WHERE | Individual rows | Before GROUP BY | No |
| HAVING | Group aggregates | After GROUP BY | Yes |
| DISTINCT | Entire result set | After SELECT | Yes (in SELECT) |
