> **Navigation**: [Back to Index](00_INDEX.md) | [< Prev](36_Advanced_Data_Modeling.md) | [Next >](38_RealWorld_Production_Scenarios_Part1.md)

# Chapter 37 — SQL 5W-H Deep Reasoning Framework

## What Is This File?
This is the **capstone** of the SQL section. We apply the **5W-H framework** (Who, What, When, Where, Why, How) systematically to EVERY major SQL concept — giving you a mental model to reason about ANY SQL topic from first principles.

> "If you can't explain it simply, you don't understand it well enough." — Einstein

---

## The 5W-H Framework for SQL Learning

```
For ANY SQL concept, ask:
┌──────┬──────────────────────────────────────────────────────┐
│ WHO  │ Who uses this? What role? What team?                  │
│ WHAT │ What exactly IS this? Define it in one sentence.      │
│ WHEN │ When should I use it? When should I NOT?              │
│ WHERE│ Where in the system/query/architecture does it live?  │
│ WHY  │ Why does it exist? What problem does it solve?        │
│ HOW  │ How does it work internally? How do I implement it?   │
└──────┴──────────────────────────────────────────────────────┘

+ FREEZE MOMENT: "If I freeze time RIGHT HERE, what is in memory?"
```

---




## 1. SELECT Statement

| Question | Answer |
|----------|--------|
| **WHO** | Every developer, analyst, DBA — anyone querying data |
| **WHAT** | Retrieves data from one or more tables based on conditions |
| **WHEN** | Whenever you need to READ data (reports, APIs, dashboards) |
| **WHERE** | Runs in the query execution engine; result goes to client |
| **WHY** | Data has no value sitting in tables — SELECT extracts value |
| **HOW** | Parser → Optimizer → Execution Engine → Fetch rows → Return |

**Freeze Moment**: After WHERE but before GROUP BY — what rows exist?
```sql
SELECT department, COUNT(*)              -- 5. Project columns + aggregate
FROM employees                           -- 1. Scan table
WHERE salary > 50000                     -- 2. Filter rows (FREEZE: only high earners remain)
GROUP BY department                      -- 3. Group filtered rows
HAVING COUNT(*) > 5                      -- 4. Filter groups
ORDER BY COUNT(*) DESC                   -- 6. Sort result
LIMIT 10;                                -- 7. Truncate output
```

---

## 2. JOINs

| Question | Answer |
|----------|--------|
| **WHO** | Anyone combining data from multiple tables |
| **WHAT** | Combines rows from two tables based on a matching condition |
| **WHEN** | When data is normalized (split across tables) — nearly always |
| **WHERE** | Between FROM and WHERE in query execution order |
| **WHY** | Normalization eliminates redundancy but splits data — JOINs reunite it |
| **HOW** | Nested loop, hash join, or merge join (optimizer decides) |

**Freeze Moment**: What happens with NULL in a LEFT JOIN?
```sql
-- Orders table has user_id = 42, but users table has NO user_id = 42
SELECT u.name, o.amount
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id;
-- FREEZE: For user_id 42, the orders columns are ALL NULL
-- The row still appears: (NULL, NULL) for the order columns
-- This is WHY LEFT JOIN exists — to keep unmatched rows from the left table
```

---



> 🔬 **Section Challenge — 2. JOINs**
>
> **Challenge 1 (Reasoning):** `LEFT JOIN` returns all rows from the left table. When does it return MORE rows than the left table?
> <details><summary>Answer</summary>
>
> When the right table has MULTIPLE matching rows for one left-table row. Example: Orders LEFT JOIN OrderItems — one order with 5 items = 5 result rows for that one order. Analogy: `1 order × 5 items = 5 rows`. Always check your join multiplicity. Use `SELECT COUNT(*) vs COUNT(DISTINCT left.id)` to detect row explosion.
> </details>
>
> **Challenge 2 (Bug Hunt):** `SELECT * FROM A, B WHERE A.id = B.a_id` — what join type is this and is it equivalent to `A JOIN B ON A.id = B.a_id`?
> <details><summary>Answer</summary>
>
> It's an old-style INNER JOIN. Functionally equivalent to `A INNER JOIN B ON A.id = B.a_id` — only returns rows where both sides match. BUT: the comma syntax is dangerous. Forgetting the WHERE clause on a multi-table comma join → CROSS JOIN (cartesian product). Explicit JOIN syntax with ON makes intent clear and prevents the accidental cross join.
> </details>
>

## 3. Indexes

| Question | Answer |
|----------|--------|
| **WHO** | DBAs, backend devs optimizing query performance |
| **WHAT** | A data structure (B-tree, hash, GIN) that speeds up data retrieval |
| **WHEN** | Columns in WHERE, JOIN, ORDER BY that handle large datasets |
| **WHERE** | Stored on disk alongside the table. Maintained on INSERT/UPDATE/DELETE |
| **WHY** | Full table scan = O(n). Index lookup = O(log n). Massive speedup |
| **HOW** | B-tree: sorted structure, binary search. Hash: direct lookup. GIN: inverted index |

**Freeze Moment**: What happens when you INSERT with 5 indexes?
```
INSERT INTO users (name, email, city, age, status) VALUES (...);

FREEZE: The DB engine must:
1. Write the row to the table heap          ← 1 write
2. Update B-tree for idx_name               ← 1 B-tree insert
3. Update B-tree for idx_email              ← 1 B-tree insert  
4. Update B-tree for idx_city               ← 1 B-tree insert
5. Update B-tree for idx_age                ← 1 B-tree insert
6. Update B-tree for idx_status             ← 1 B-tree insert

Total: 6 writes for 1 INSERT!
This is WHY too many indexes slow down writes.
Rule: Index what you QUERY, not what you have.
```

---

## 4. Transactions & ACID

| Question | Answer |
|----------|--------|
| **WHO** | Any system doing multi-step operations (payments, transfers) |
| **WHAT** | A group of SQL statements that succeed or fail as ONE unit |
| **WHEN** | Any operation where partial execution = data corruption |
| **WHERE** | Managed by the DB engine's transaction manager + WAL (Write-Ahead Log) |
| **WHY** | Without transactions: crash mid-transfer = money vanishes |
| **HOW** | BEGIN → execute statements → COMMIT (all saved) or ROLLBACK (all undone) |

**Freeze Moment**: What happens if power fails AFTER COMMIT but BEFORE data hits disk?
```
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;  ← Written to WAL (Write-Ahead Log) on disk

POWER FAILURE HERE!

FREEZE: The data pages might NOT be on disk yet.
BUT the WAL IS on disk (fsync'd at COMMIT).
On restart: DB replays WAL → applies the changes → data is consistent.
This is the D in ACID (Durability) — WAL guarantees it.
```

---



> 🔬 **Section Challenge — 4. Transactions & ACID**
>
> **Challenge 1 (Reasoning):** Two transactions T1 and T2 both run `SELECT balance WHERE id=1; UPDATE balance=balance-100 WHERE id=1`. What anomaly occurs at READ COMMITTED and how does REPEATABLE READ fix it?
> <details><summary>Answer</summary>
>
> READ COMMITTED: both T1 and T2 read balance=1000. Both compute 900. Both write 900. Final balance: 900 (expected: 800). Lost update! REPEATABLE READ (with locking SELECT FOR UPDATE): first SELECT acquires a read lock. T2's SELECT blocks until T1 commits. After T1 commits (balance=900), T2 reads 900, writes 800. Correct! Alternatively: use `UPDATE ... WHERE balance=1000` (optimistic locking with version check).
> </details>
>

## 5. Normalization

| Question | Answer |
|----------|--------|
| **WHO** | Database designers, application architects |
| **WHAT** | Organizing data to eliminate redundancy and dependency anomalies |
| **WHEN** | Designing OLTP schemas (application databases) |
| **WHERE** | At the schema design phase, before writing any code |
| **WHY** | Redundancy → update anomalies → inconsistent data → bugs |
| **HOW** | 1NF (atomic values) → 2NF (no partial deps) → 3NF (no transitive deps) → BCNF |

**Freeze Moment**: Why does denormalization exist if normalization is "correct"?
```
Normalization: customers + addresses + orders + order_items = 4 JOINs per query
Denormalization: one flat table = 0 JOINs, reads are FAST

OLTP (write-heavy): Normalize → avoid update anomalies
OLAP (read-heavy):  Denormalize → avoid JOIN overhead

Neither is "wrong" — they solve DIFFERENT problems.
```

---

## 6. Window Functions

| Question | Answer |
|----------|--------|
| **WHO** | Analysts doing rankings, running totals, comparisons |
| **WHAT** | Functions that compute across a set of rows RELATED to the current row |
| **WHEN** | Rankings, running aggregates, lead/lag comparisons, percentiles |
| **WHERE** | Executed AFTER WHERE/GROUP BY/HAVING, BEFORE ORDER BY/LIMIT |
| **WHY** | Regular GROUP BY collapses rows. Window functions KEEP all rows |
| **HOW** | OVER() defines the window: PARTITION BY (groups) + ORDER BY (sequence) |

**Freeze Moment**: ROW_NUMBER vs RANK vs DENSE_RANK
```
Scores: 100, 90, 90, 80

ROW_NUMBER: 1, 2, 3, 4     ← Always unique, arbitrary tie-break
RANK:       1, 2, 2, 4     ← Ties get same rank, next rank SKIPPED
DENSE_RANK: 1, 2, 2, 3     ← Ties get same rank, next rank NOT skipped

When to use which:
- ROW_NUMBER: pagination, deduplication (pick one per group)
- RANK:       competition rankings (3rd place skipped if 2-way tie for 2nd)
- DENSE_RANK: no gaps wanted (top N categories)
```

---



> 🔬 **Section Challenge — 6. Window Functions**
>
> **Challenge 1 (Reasoning):** Why can't you use a window function in a WHERE clause? How do you filter on window function results?
> <details><summary>Answer</summary>
>
> Window functions run in a logical step AFTER WHERE filtering. The WHERE clause operates on base rows; window functions are computed on the result set. Solution: wrap in a subquery/CTE. `WITH ranked AS (SELECT *, ROW_NUMBER() OVER(...) rn FROM t) SELECT * FROM ranked WHERE rn = 1`. This is 'standard' pattern for top-N-per-group.
> </details>
>
> **Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.
> <details><summary>Answer</summary>
>
> Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.
> </details>
>

## 7. Subqueries vs CTEs vs Temp Tables

| Question | Answer |
|----------|--------|
| **WHO** | Every SQL developer making complex queries |
| **WHAT** | Three ways to break complex queries into parts |
| **WHEN** | Query needs intermediate results or self-references |
| **WHERE** | Subquery: inline. CTE: before main query. Temp table: in tempdb |
| **WHY** | Readability, reusability, and sometimes performance |
| **HOW** | See comparison below |

```
┌──────────────┬───────────────────────────────────────────────┐
│ Approach     │ Best For                                       │
├──────────────┼───────────────────────────────────────────────┤
│ Subquery     │ Simple one-time expressions, EXISTS checks     │
│ CTE (WITH)   │ Readability, recursive queries, reuse in query │
│ Temp Table   │ Large intermediate results reused multiple     │
│              │ times, cross-query persistence                  │
│ View         │ Permanent reusable query, access control        │
│ Mat. View    │ Cached results for expensive queries            │
└──────────────┴───────────────────────────────────────────────┘
```

---

## 8. Query Optimization

| Question | Answer |
|----------|--------|
| **WHO** | Backend devs with slow queries, DBAs tuning production |
| **WHAT** | Making queries run faster without changing results |
| **WHEN** | Query takes > 100ms, full table scans on large tables, N+1 queries |
| **WHERE** | Query planner/optimizer, EXPLAIN output, pg_stat_statements |
| **WHY** | Slow queries = slow app = lost users = lost revenue |
| **HOW** | EXPLAIN → identify bottleneck → add index / rewrite query / restructure |

**Optimization Checklist (in order)**:
```
1. EXPLAIN ANALYZE — see what the DB is actually doing
2. Check for Seq Scan on large tables → add index
3. Check for Nested Loop on large sets → consider hash join
4. Check for Sort → add index on ORDER BY column
5. Check WHERE: is the condition SARGable? (can it use an index?)
   ❌ WHERE YEAR(date) = 2026       ← function wrapping = no index
   ✅ WHERE date >= '2026-01-01'    ← direct comparison = index used
6. Check SELECT *: are you fetching unused columns?
7. Check JOINs: are FK columns indexed?
8. Check N+1: are you doing 1000 queries when 1 JOIN would work?
```

---

## 9. SQL Injection

| Question | Answer |
|----------|--------|
| **WHO** | EVERY developer — this is the #1 web vulnerability |
| **WHAT** | An attack where user input is executed as SQL code |
| **WHEN** | Whenever user input is concatenated into SQL strings |
| **WHERE** | Web forms, API endpoints, search boxes — any user input to SQL |
| **WHY** | One unparameterized query = entire database stolen |
| **HOW** | Attacker enters SQL syntax as input; DB executes it as code |

**Freeze Moment**: Why does parameterization work?
```
Concatenation: "SELECT * FROM users WHERE name = '" + input + "'"
  → DB sees: SELECT * FROM users WHERE name = '' OR '1'='1' --'
  → The input BECAME PART OF THE SQL STRUCTURE

Parameterization: "SELECT * FROM users WHERE name = $1" 
  → DB sees: SELECT * FROM users WHERE name = [parameter: "' OR '1'='1' --"]
  → The input is treated as DATA, never as SQL CODE
  → Even if it contains SQL syntax, it's just a string value
  
The DB compiles the query FIRST, then plugs in parameters.
The parameters can NEVER change the query structure.
```

---




## 10. Partitioning

| Question | Answer |
|----------|--------|
| **WHO** | DBAs managing tables with 100M+ rows |
| **WHAT** | Splitting one logical table into multiple physical segments |
| **WHEN** | Large tables with clear partition keys (date, region, tenant) |
| **WHERE** | Transparent to the application — queries hit the main table name |
| **WHY** | Partition pruning: skip irrelevant data. Faster deletes: DROP PARTITION |
| **HOW** | RANGE (by date), LIST (by category), HASH (even distribution) |

---




## 11. Replication

| Question | Answer |
|----------|--------|
| **WHO** | Ops teams ensuring high availability and read scalability |
| **WHAT** | Copying data from primary DB to one or more replicas |
| **WHEN** | Read-heavy apps, disaster recovery, geographic distribution |
| **WHERE** | WAL streaming (PostgreSQL), binlog (MySQL), between servers |
| **WHY** | Single server = single point of failure. Replicas = resilience |
| **HOW** | Primary writes WAL → ships to replica → replica replays it |

---

## 12. JSON in SQL

| Question | Answer |
|----------|--------|
| **WHO** | Full-stack devs, API builders, anyone storing semi-structured data |
| **WHAT** | Storing and querying JSON documents inside a relational database |
| **WHEN** | Flexible schemas, API payloads, configuration, audit logs |
| **WHERE** | JSONB column + GIN index (PostgreSQL) or JSON type (MySQL) |
| **WHY** | Avoids adding a NoSQL DB when you need SOME flexibility |
| **HOW** | ->/->> operators (PG), JSON_EXTRACT (MySQL), OPENJSON (SQL Server) |

---




## Master Mental Model: SQL Execution Flow

```
Human writes: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT

Database executes: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT

Freeze at each step:

1. FROM/JOIN     → All possible row combinations (Cartesian product before ON)
2. WHERE         → Filtered rows (only matching conditions survive)
3. GROUP BY      → Rows grouped into buckets (one bucket per unique key)
4. HAVING        → Groups filtered (only groups meeting condition survive)
5. SELECT        → Project columns, compute expressions, aliases born here
6. DISTINCT      → Remove duplicate rows
7. ORDER BY      → Sort the result set (can use aliases!)
8. LIMIT/OFFSET  → Truncate the sorted result

This is WHY you can't use a SELECT alias in WHERE:
  WHERE alias > 5  ❌  (alias doesn't exist yet at step 2)
  HAVING alias > 5 ✅  (some DBs allow it, but technically step 5 > step 4)
  ORDER BY alias   ✅  (step 7 > step 5, alias exists)
```

---

## The "Teach Back" Test

For each concept, try to complete this sentence:

> "[CONCEPT] exists because without it, [PROBLEM] would happen.
> It works by [MECHANISM], and you should use it when [CONDITION]."

**Examples**:
- "**Indexes** exist because without them, every query would scan the entire table. They work by maintaining a sorted B-tree structure, and you should use them when columns appear in WHERE/JOIN/ORDER BY on large tables."

- "**Transactions** exist because without them, a crash mid-operation would leave data in an inconsistent state. They work by writing changes to a WAL before applying them, and you should use them when multiple statements must succeed or fail together."

- "**Normalization** exists because without it, updating one fact requires changing many rows (update anomaly). It works by decomposing tables to eliminate redundant dependencies, and you should use it when designing OLTP schemas where data integrity matters most."

---

## SQL Topic Mastery Checklist

```
Rate yourself 1-5 for each:

Foundation:
[ ] SELECT, WHERE, ORDER BY, LIMIT
[ ] JOINs (INNER, LEFT, RIGHT, FULL, CROSS)
[ ] GROUP BY, HAVING, aggregations
[ ] Subqueries and CTEs
[ ] UNION, INTERSECT, EXCEPT

Intermediate:
[ ] Window functions (ROW_NUMBER, RANK, LAG, LEAD)
[ ] Indexes (B-tree, GIN, BRIN, partial, covering)
[ ] Transactions and isolation levels
[ ] Views and materialized views
[ ] Constraints (PK, FK, UNIQUE, CHECK, NOT NULL)

Advanced:
[ ] Query optimization (EXPLAIN ANALYZE)
[ ] Recursive CTEs (hierarchical queries)
[ ] JSON/JSONB operations
[ ] Partitioning and sharding
[ ] Temporal tables (SCD Type 2)

Professional:
[ ] Database migrations (Flyway/Liquibase/Alembic)
[ ] Replication and high availability
[ ] Security (injection prevention, roles, RLS)
[ ] Data modeling (Star Schema, Data Vault)
[ ] Python + SQL integration for analytics
```

---


---

## 🏋️ Practice & Interview Questions — SQL

### Predict / Trace
**Q1.** What's the difference between WHERE and HAVING?
<details><summary>Answer</summary>

`WHERE` filters rows **before** grouping. `HAVING` filters groups **after** `GROUP BY`. You can't use aggregate functions in WHERE. `HAVING COUNT(*) > 5` works, `WHERE COUNT(*) > 5` does not.
</details>

**Q2.** What does this return? `SELECT 1 FROM dual WHERE NULL = NULL`
<details><summary>Answer</summary>

**No rows returned.** NULL is not equal to NULL — use `IS NULL` or `IS NOT NULL`. `NULL = NULL` evaluates to UNKNOWN, not TRUE.
</details>

### Coding Problems
**Q3.** ⭐ Second highest salary — handle the case where it doesn't exist (return NULL).
<details><summary>Solution</summary>

```sql
SELECT MAX(salary) AS SecondHighestSalary
FROM Employee
WHERE salary < (SELECT MAX(salary) FROM Employee);
-- or
SELECT IFNULL((SELECT DISTINCT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1), NULL)
```
</details>

**Q4.** ⭐ Find employees earning more than their manager.
<details><summary>Solution</summary>

```sql
SELECT e.name FROM Employee e
JOIN Employee m ON e.managerId = m.id
WHERE e.salary > m.salary;
```
</details>

**Q5.** ⭐ Find duplicate emails.
<details><summary>Solution</summary>

```sql
SELECT email FROM Person GROUP BY email HAVING COUNT(*) > 1;
```
</details>

**Q6.** ⭐⭐ Rank scores without RANK() function.
<details><summary>Solution</summary>

```sql
SELECT s.score,
  (SELECT COUNT(DISTINCT s2.score) FROM Scores s2 WHERE s2.score >= s.score) AS rank
FROM Scores s ORDER BY score DESC;
```
</details>

**Q7.** ⭐⭐ Consecutive numbers — find numbers that appear 3+ times consecutively.
<details><summary>Solution</summary>

```sql
SELECT DISTINCT l1.Num AS ConsecutiveNums
FROM Logs l1, Logs l2, Logs l3
WHERE l1.Id=l2.Id-1 AND l2.Id=l3.Id-1
AND l1.Num=l2.Num AND l2.Num=l3.Num;
-- or use LAG/LEAD window functions
```
</details>

**Q8.** ⭐⭐ Department top 3 salaries (dense rank).
<details><summary>Solution</summary>

```sql
SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM Employee e JOIN Department d ON e.departmentId = d.id
WHERE (SELECT COUNT(DISTINCT e2.salary) FROM Employee e2
       WHERE e2.departmentId=e.departmentId AND e2.salary>e.salary) < 3;
```
</details>

**Q9.** ⭐⭐ Running total with window function.
<details><summary>Solution</summary>

```sql
SELECT date, amount,
  SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM transactions;
```
</details>

**Q10.** ⭐⭐ Pivot rows to columns (conditional aggregation).
<details><summary>Solution</summary>

```sql
SELECT year,
  SUM(CASE WHEN quarter=1 THEN revenue END) AS Q1,
  SUM(CASE WHEN quarter=2 THEN revenue END) AS Q2,
  SUM(CASE WHEN quarter=3 THEN revenue END) AS Q3,
  SUM(CASE WHEN quarter=4 THEN revenue END) AS Q4
FROM sales GROUP BY year;
```
</details>

**Q11.** ⭐⭐⭐ Find the median salary — without MEDIAN() function.
<details><summary>Solution</summary>

```sql
SELECT AVG(salary) AS median
FROM (SELECT salary, ROW_NUMBER() OVER(ORDER BY salary) AS rn, COUNT(*) OVER() AS cnt FROM Employee) t
WHERE rn IN (FLOOR((cnt+1)/2), CEIL((cnt+1)/2));
```
</details>

### Interview Questions
**Q12.** INNER JOIN vs LEFT JOIN — when does LEFT produce more rows?
<details><summary>Answer</summary>

LEFT JOIN includes ALL rows from the left table even if no match in right table (fills NULLs). INNER JOIN only includes rows where both sides have a match. If left table has rows with no match in right: LEFT produces more rows.
</details>

**Q13.** What is a covering index?
<details><summary>Answer</summary>

An index that contains ALL columns needed by a query — the DB can answer from the index alone without touching the table ("index-only scan"). Faster because it avoids the extra heap fetch.
</details>

**Q14.** EXPLAIN shows "Full Table Scan" — how do you fix it?
<details><summary>Answer</summary>

Add an index on the WHERE/JOIN/ORDER BY column. Check if the column has low cardinality (boolean — index may not help). Ensure the query isn't wrapping the column in a function (`WHERE YEAR(date) = 2024` prevents index use — rewrite as `WHERE date BETWEEN '2024-01-01' AND '2024-12-31'`).
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | NULL = NULL evaluates to? | UNKNOWN (use IS NULL) |
| 2 | COUNT(*) vs COUNT(col) | COUNT(*) counts all rows, COUNT(col) skips NULLs |
| 3 | RANK() vs DENSE_RANK() | RANK() skips numbers after ties, DENSE_RANK() doesn't |
| 4 | CROSS JOIN produces | Cartesian product (m × n rows) |
| 5 | Can you ORDER BY in a subquery? | Only when using TOP/LIMIT |
| 6 | TRUNCATE vs DELETE | TRUNCATE: no WHERE, no undo, faster. DELETE: filterable, transactional |
| 7 | What does COALESCE do? | Returns first non-NULL value from its arguments |
| 8 | Index on VARCHAR — what to watch out for? | Case sensitivity, collation, function-based searches bypass index |



---

## 🧠 Deep Conceptual Questions — SQL Internals & Reasoning

**C1. How does a SQL database execute a SELECT query internally?**
<details><summary>Deep Answer</summary>

1. **Parse**: SQL text → AST (syntax tree)
2. **Bind**: resolve table names, column names, types
3. **Optimize**: query planner generates candidate execution plans, estimates costs (based on statistics: row counts, column cardinality, index existence), picks cheapest
4. **Execute**: follow the plan — scan tables, apply filters, join, sort, project

The optimizer transforms: `SELECT ... WHERE ... JOIN ... ORDER BY` into an operator tree (Volcano model): TableScan → Filter → HashJoin → Sort → Project. Each operator is an iterator: `next()` pulls one row from its child. This pull-based model (lazy evaluation) avoids materializing intermediate results.
</details>

**C2. B-Tree index: why is it the default index structure in databases?**
<details><summary>Deep Answer</summary>

B-Tree (not binary tree — B stands for Balanced, not Binary): a self-balancing tree where each node can hold many keys. Properties: (1) height O(log_m N) where m=fan-out (typically 100-1000) → very short tree for millions of rows, (2) all leaf nodes at same depth → guaranteed O(log N) worst case, (3) range scans efficient — leaves linked in sequence, (4) supports equality AND range queries. Hash index: only equality (no range). Sequential scan: no index at all. B+Tree (variant): internal nodes only store keys (no values), leaves store data. All row pointers in leaves → better range scan (follow linked list of leaves).
</details>

**C3. Why does adding an index sometimes SLOW DOWN a query?**
<details><summary>Deep Answer</summary>

1. **Low cardinality**: index on a boolean column — if 50% rows have `active=true`, index gives you 50% of rows. Database may choose full table scan (cheaper: sequential I/O) over index (random I/O for 50% of rows). 
2. **Function on column**: `WHERE YEAR(created_at) = 2024` — index on `created_at` unused. Rewrite: `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'`.
3. **Write overhead**: every INSERT/UPDATE/DELETE must update ALL indexes. 5 indexes × N rows = 5× write amplification.
4. **Index not covering**: index exists but the SELECT columns aren't in the index → each index match → separate heap fetch → many random I/O. Solution: covering index (include all needed columns in index).
</details>

**C4. EXPLAIN / query execution plan: what are the key things to look for?**
<details><summary>Deep Answer</summary>

Red flags: (1) **"Full Table Scan" / "Seq Scan"** on a large table → missing index, (2) **high "rows" estimate** in join conditions → cartesian product risk, (3) **"Using filesort"** → ORDER BY can't use index, (4) **"Using temporary"** → intermediate table materialization, (5) **nested loops on large tables** → should be hash join or merge join. Green flags: "Using index" (covering index), "ref" or "eq_ref" access type (index used). Start fixing: add or fix index on WHERE/JOIN/ORDER BY columns, rewrite function-wrapped columns.
</details>

**C5. Window functions vs GROUP BY — when must you use window functions?**
<details><summary>Deep Answer</summary>

`GROUP BY` collapses rows to one per group — individual row data is lost. Window functions compute aggregates but **keep all rows**. Use window when: (1) you need both the aggregate AND the individual row (rank each employee and show their salary), (2) running totals (each row needs sum of all prior rows — GROUP BY can't do this), (3) lag/lead access (compare each row to previous/next — GROUP BY has no row ordering concept), (4) top-N per group (ROW_NUMBER partition — classic GROUP BY can't do this cleanly). Window functions = aggregation without collapsing.
</details>

**C6. Transaction isolation levels — what anomaly does each prevent?**
<details><summary>Deep Answer</summary>

| Level | Dirty Read | Non-repeatable Read | Phantom Read |
|---|---|---|---|
| READ UNCOMMITTED | Possible | Possible | Possible |
| READ COMMITTED | ✅ Prevented | Possible | Possible |
| REPEATABLE READ | ✅ | ✅ | Possible (MySQL InnoDB: prevented!) |
| SERIALIZABLE | ✅ | ✅ | ✅ |

**Dirty read**: read uncommitted data from another transaction (which may rollback). **Non-repeatable**: same query in same transaction returns different row values (another transaction committed update). **Phantom**: same query returns different row COUNT (another transaction inserted/deleted rows). Higher isolation = fewer anomalies but more lock contention. Most production databases use READ COMMITTED or REPEATABLE READ.
</details>

**C7. N+1 query problem: what is it, why does it happen, and how to fix?**
<details><summary>Deep Answer</summary>

**What**: fetching N orders, then for each order making a separate query for the customer = 1 + N queries total. Scales terribly: 1000 orders = 1001 queries. **Why**: ORMs (Hibernate, JPA) with lazy loading — accessing a relationship triggers a new query. **Fix 1**: Eager loading — `JOIN FETCH` or `.fetch()` — load everything in one query. **Fix 2**: Batch loading — fetch all order IDs, then `WHERE customer_id IN (id1, id2, ...)` — 2 queries. **Fix 3**: Projection/DTO query — `SELECT o.id, c.name FROM orders o JOIN customers c` — 1 query. **Detection**: count DB queries in tests (Spring: `@QueryCount`), log slow query warnings.
</details>


> **Navigation**: [Back to Index](00_INDEX.md) | [< Prev](36_Advanced_Data_Modeling.md) | [Next >](38_RealWorld_Production_Scenarios_Part1.md)
