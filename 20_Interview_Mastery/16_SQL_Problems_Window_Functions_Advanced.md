> **Navigation**: [⬅ SQL Foundations & Intermediate](15_SQL_Problems_Foundations_Intermediate.md) | [📚 Index](00_INDEX.md) | [Next: SQL Analytics & Real-World ➡](17_SQL_Problems_Analytics_RealWorld_Design.md)

# File 16 — SQL Problems: Window Functions & Advanced Techniques

## Logic-First, Code-Second: The 5W+H Way

> Window Functions = "Compute something across a SET of rows related to the current row, WITHOUT collapsing them."
> The key difference from GROUP BY: Window functions keep every row.

---

## WINDOW FUNCTION CORE CONCEPTS

### The Anatomy of a Window Function

```
function_name() OVER (
  PARTITION BY col1, col2    → "Reset the window for each group"
  ORDER BY col3              → "Sort rows within the partition"
  ROWS/RANGE frame           → "Which rows to include in the calculation"
)
```

**PARTITION BY** = GROUP BY but keeps rows.
**ORDER BY** = Defines row order within each partition.
**Frame** = Sliding window of rows for the calculation.

### The Big Three Ranking Functions

| Function | Ties | Gaps | Example (values: 100, 100, 90) |
|----------|------|------|--------------------------------|
| ROW_NUMBER | No ties | N/A | 1, 2, 3 |
| RANK | Same rank | Yes | 1, 1, 3 |
| DENSE_RANK | Same rank | No | 1, 1, 2 |

---



> 🔬 **Section Challenge — WINDOW FUNCTION CORE CONCEPTS**
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

## RANKING PROBLEMS

---

### Problem 1: Rank Scores

**WHAT**: Rank scores in descending order. Ties get same rank, no gaps.

**WHY DENSE_RANK**:
- "Same rank for ties" → not ROW_NUMBER
- "No gaps" → not RANK → must be DENSE_RANK

**HOW — The Logic Chain**:
```
SELECT score,
       DENSE_RANK() OVER (ORDER BY score DESC) AS 'rank'
FROM Scores
ORDER BY score DESC
```

**Interview narration**: "The requirement says no gaps in ranking, so DENSE_RANK is the right choice. RANK would leave gaps after ties."

---

### Problem 2: Nth Highest Salary (Generalized)

**WHAT**: Write a function to get the Nth highest salary.

**WHY DENSE_RANK + variable N**:
```
CREATE FUNCTION getNthHighestSalary(N INT) RETURNS INT
BEGIN
  RETURN (
    SELECT DISTINCT salary FROM (
      SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rk
      FROM Employee
    ) ranked WHERE rk = N
  );
END
```

**Why DISTINCT**: Multiple employees might have the same salary at rank N.

---

### Problem 3: Consecutive Numbers (3+ in a Row)

**WHAT**: Find numbers that appear at least 3 times consecutively.

**WHY LAG/LEAD to compare adjacent rows**:
```
SELECT DISTINCT num AS ConsecutiveNums FROM (
  SELECT num,
    LAG(num, 1) OVER (ORDER BY id) AS prev1,
    LAG(num, 2) OVER (ORDER BY id) AS prev2
  FROM Logs
) t WHERE num = prev1 AND num = prev2
```

**Alternative — Self-join approach (no window functions)**:
```
SELECT DISTINCT l1.num AS ConsecutiveNums
FROM Logs l1
JOIN Logs l2 ON l1.id = l2.id - 1
JOIN Logs l3 ON l1.id = l3.id - 2
WHERE l1.num = l2.num AND l2.num = l3.num
```

**When to use which**: Window function approach is more flexible (easy to change to N consecutive). Self-join is simpler for exactly 3.

---

### Problem 4: Row Running Total

**WHAT**: Calculate cumulative sum of amounts ordered by date.

**WHY SUM with ORDER BY creates running total**:
```
SELECT date, amount,
       SUM(amount) OVER (ORDER BY date) AS running_total
FROM Transactions
```

**The frame insight**: When ORDER BY is specified but no explicit frame, the default is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. This naturally creates a running total.

**Partitioned running total** (reset per customer):
```
SUM(amount) OVER (PARTITION BY customer_id ORDER BY date) AS running_total
```

---

### Problem 5: Moving Average (Last N Rows)

**WHAT**: Calculate 3-day moving average of prices.

**WHY explicit ROWS frame**:
```
SELECT date, price,
       AVG(price) OVER (
         ORDER BY date
         ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ) AS moving_avg_3day
FROM Prices
```

**ROWS vs RANGE**: ROWS counts physical rows (exactly 2 before current). RANGE uses value range (all rows whose ORDER BY value is within range). For distinct dates, they're the same. For duplicate dates, RANGE includes all duplicates.

---

### Problem 6: Year-over-Year Growth Rate

**WHAT**: Calculate revenue growth percentage compared to previous year.

**WHY LAG to access previous row's value**:
```
SELECT year, revenue,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY year)) 
             / LAG(revenue) OVER (ORDER BY year), 2) AS growth_pct
FROM AnnualRevenue
```

**The pattern**: "Compare current row to previous/next row" → LAG(column, offset, default) or LEAD(column, offset, default).
- LAG(salary, 1, 0) → previous row's salary, default 0
- LEAD(salary, 2) → salary 2 rows ahead

---

### Problem 7: Find the Start of Each Gap in a Sequence

**WHAT**: Given a sequence of ids (some missing), find where the gaps start.

**WHY ROW_NUMBER trick for gap detection**:
```
SELECT MIN(id) AS gap_start, MAX(id) AS gap_end FROM (
  SELECT id, id - ROW_NUMBER() OVER (ORDER BY id) AS grp
  FROM Sequence
) t GROUP BY grp
```

**The "islands and gaps" technique**:
- For consecutive values: value - ROW_NUMBER() = constant
- When a gap occurs, the constant changes → new group
- GROUP BY this "group identifier" finds each island

---




## ADVANCED WINDOW PATTERNS

---

### Problem 8: Median Salary per Department

**WHAT**: Find median salary in each department.

**WHY counting-based approach with window functions**:
```
SELECT department, AVG(salary) AS median_salary
FROM (
  SELECT department, salary,
         ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary) AS rn,
         COUNT(*) OVER (PARTITION BY department) AS cnt
  FROM Employees
) t
WHERE rn IN (FLOOR((cnt+1)/2.0), CEIL((cnt+1)/2.0))
GROUP BY department
```

**Logic**: For odd count → median is the middle element. For even count → average of two middle elements. `FLOOR((cnt+1)/2)` and `CEIL((cnt+1)/2)` give the one (or two) middle positions.

---

### Problem 9: Employee with Highest Salary per Department (Ties Allowed)

**WHAT**: All employees earning the max salary in their department.

**WHY RANK or DENSE_RANK partitioned by department**:
```
SELECT department, name, salary FROM (
  SELECT *, RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rk
  FROM Employees
) ranked WHERE rk = 1
```

**Why not ROW_NUMBER**: ROW_NUMBER would pick only ONE employee even on ties. RANK gives ties the same rank.

---

### Problem 10: Last Value vs First Value

**WHAT**: For each employee, show their salary alongside the dept min and dept max.

**WHY FIRST_VALUE and LAST_VALUE with proper framing**:
```
SELECT name, salary,
       FIRST_VALUE(salary) OVER w AS dept_min,
       LAST_VALUE(salary) OVER w AS dept_max
FROM Employees
WINDOW w AS (PARTITION BY department ORDER BY salary
             ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
```

**The LAST_VALUE trap**: Without `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`, the default frame only goes to CURRENT ROW. So LAST_VALUE returns the CURRENT row, not the actual last row. Always specify the full frame with LAST_VALUE.

---




## CTEs AND RECURSIVE SQL

---

### Problem 11: Recursive Employee Hierarchy

**WHAT**: Build complete management chain from CEO down.

**WHY recursive CTE**:
```
WITH RECURSIVE hierarchy AS (
  -- Base case: CEO (no manager)
  SELECT id, name, manager_id, 0 AS level
  FROM Employees WHERE manager_id IS NULL
  
  UNION ALL
  
  -- Recursive step: join employees to their managers
  SELECT e.id, e.name, e.manager_id, h.level + 1
  FROM Employees e
  JOIN hierarchy h ON e.manager_id = h.id
)
SELECT * FROM hierarchy ORDER BY level, name
```

**The recursive CTE pattern**:
1. Anchor member → starting rows (base case)
2. UNION ALL
3. Recursive member → references the CTE itself
4. Terminates when recursive member returns no rows

---

### Problem 12: Generate Date Series (Fill Missing Dates)

**WHAT**: Generate all dates in a range, even those missing from the data.

**WHY recursive CTE generates the series**:
```
WITH RECURSIVE dates AS (
  SELECT '2024-01-01' AS dt
  UNION ALL
  SELECT DATE_ADD(dt, INTERVAL 1 DAY) FROM dates WHERE dt < '2024-01-31'
)
SELECT d.dt, COALESCE(s.amount, 0) AS amount
FROM dates d
LEFT JOIN Sales s ON d.dt = s.sale_date
```

**Use case**: Reports that need every date, even zero-activity days.

---

### Problem 13: Running Difference (Current - Previous)

**WHAT**: Show the change in value from the previous row.

**WHY LAG computes the difference**:
```
SELECT date, value,
       value - LAG(value, 1, value) OVER (ORDER BY date) AS daily_change
FROM Metrics
```

**The default parameter**: `LAG(value, 1, value)` → if there's no previous row (first row), use the current value as default, making daily_change = 0.

---

## SUBQUERY AND CTE PATTERNS

---

### Problem 14: Correlated Subquery — Employees Above Department Average

**WHAT**: Find employees earning above their department's average.

**WHY correlated subquery references outer table**:
```
SELECT name, salary, department
FROM Employees e
WHERE salary > (
  SELECT AVG(salary) FROM Employees WHERE department = e.department
)
```

**The "correlated" part**: The inner query references `e.department` from the outer query. It runs ONCE PER ROW of the outer query.

**Performance concern**: For large tables, a JOIN with a pre-computed CTE is faster:
```
WITH dept_avg AS (
  SELECT department, AVG(salary) AS avg_sal FROM Employees GROUP BY department
)
SELECT e.name, e.salary FROM Employees e
JOIN dept_avg d ON e.department = d.department
WHERE e.salary > d.avg_sal
```

---

### Problem 15: EXISTS vs IN — When and Why

**WHAT**: Find departments that have at least one employee earning > 100K.

**EXISTS approach**:
```
SELECT d.name FROM Departments d
WHERE EXISTS (SELECT 1 FROM Employees e WHERE e.dept_id = d.id AND e.salary > 100000)
```

**IN approach**:
```
SELECT d.name FROM Departments d
WHERE d.id IN (SELECT dept_id FROM Employees WHERE salary > 100000)
```

**When to use which**:
- EXISTS: Better when outer table is small, inner table is large (stops at first match)
- IN: Better when subquery result is small (computes full list once)
- NOT EXISTS: Always safe with NULLs. NOT IN fails if subquery has NULLs.

---

### Problem 16: PIVOT — Transform Rows to Columns

**WHAT**: Show monthly sales as columns: Jan, Feb, Mar...

**WHY conditional aggregation simulates PIVOT**:
```
SELECT product,
       SUM(CASE WHEN month = 'Jan' THEN amount ELSE 0 END) AS Jan,
       SUM(CASE WHEN month = 'Feb' THEN amount ELSE 0 END) AS Feb,
       SUM(CASE WHEN month = 'Mar' THEN amount ELSE 0 END) AS Mar
FROM Sales
GROUP BY product
```

**The mental model**: Each CASE WHEN creates a "column filter" — it only sums values for that specific month. GROUP BY product collapses all months into one row per product.

---

### Problem 17: UNPIVOT — Transform Columns to Rows

**WHAT**: Turn columns Jan, Feb, Mar back into rows.

**WHY UNION ALL simulates UNPIVOT**:
```
SELECT product, 'Jan' AS month, Jan AS amount FROM MonthlySales
UNION ALL
SELECT product, 'Feb' AS month, Feb AS amount FROM MonthlySales
UNION ALL
SELECT product, 'Mar' AS month, Mar AS amount FROM MonthlySales
```

---



## MASTER PROBLEM MAP — Window Functions & Advanced

| # | Problem | Core Technique | Key Insight |
|---|---------|---------------|-------------|
| 1 | Rank Scores | DENSE_RANK | No gaps = DENSE_RANK |
| 2 | Nth Highest Salary | DENSE_RANK + filter rk=N | Generalized with variable |
| 3 | Consecutive Numbers | LAG(num,1), LAG(num,2) | Compare adjacent rows |
| 4 | Running Total | SUM() OVER (ORDER BY) | Default frame = cumulative |
| 5 | Moving Average | AVG() OVER (ROWS frame) | ROWS BETWEEN N PRECEDING AND CURRENT |
| 6 | YoY Growth | LAG + arithmetic | (current-prev)/prev |
| 7 | Gap Detection | id - ROW_NUMBER() | Islands and gaps technique |
| 8 | Median per Group | ROW_NUMBER + COUNT + FLOOR/CEIL | Middle position(s) |
| 9 | Max per Dept (ties) | RANK PARTITION BY dept | RANK keeps all ties |
| 10 | First/Last Value | FIRST_VALUE + UNBOUNDED frame | LAST_VALUE needs full frame |
| 11 | Employee Hierarchy | Recursive CTE | Anchor + recursive + UNION ALL |
| 12 | Fill Missing Dates | Recursive CTE + LEFT JOIN | Generate series then join |
| 13 | Running Difference | LAG with default | value - LAG(value,1,value) |
| 14 | Above Dept Average | Correlated subquery / CTE + JOIN | Inner references outer |
| 15 | EXISTS vs IN | EXISTS / IN / NOT EXISTS | NOT IN fails with NULLs |
| 16 | Rows to Columns | SUM(CASE WHEN) | Conditional aggregation pivot |
| 17 | Columns to Rows | UNION ALL | Manual UNPIVOT |

---



> 🔬 **Section Challenge — MASTER PROBLEM MAP — Window Functions & Advanced**
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

## Frame Specification Cheat Sheet

```
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW     → Running total (default)
ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING → Entire partition
ROWS BETWEEN 2 PRECEDING AND CURRENT ROW              → Last 3 rows
ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING               → Centered 3-row window
ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING      → From here to end
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


> **Navigation**: [⬅ SQL Foundations & Intermediate](15_SQL_Problems_Foundations_Intermediate.md) | [📚 Index](00_INDEX.md) | [Next: SQL Analytics & Real-World ➡](17_SQL_Problems_Analytics_RealWorld_Design.md)
