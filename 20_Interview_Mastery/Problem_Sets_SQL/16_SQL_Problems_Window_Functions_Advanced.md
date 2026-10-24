**Navigation**: [⬅ SQL Foundations & Intermediate](15_SQL_Problems_Foundations_Intermediate.md) | [📚 Index](../00_INDEX.md) | [Next: SQL Analytics & Real-World ➡](17_SQL_Problems_Analytics_RealWorld_Design.md)

# File 16 — SQL Problems: Window Functions & Advanced Techniques

## Logic-First, Code-Second: The 5W+H Way

Window Functions = "Compute something across a SET of rows related to the current row, WITHOUT collapsing them."
The key difference from GROUP BY: Window functions keep every row.

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

- **PARTITION BY** = GROUP BY but keeps rows.
- **ORDER BY** = Defines row order within each partition.
- **Frame** = Sliding window of rows for the calculation.

### The Big Three Ranking Functions

| Function   | Ties      | Gaps | Example (values: 100, 100, 90) |
| ---------- | --------- | ---- | ------------------------------ |
| ROW_NUMBER | No ties   | N/A  | 1, 2, 3                        |
| RANK       | Same rank | Yes  | 1, 1, 3                        |
| DENSE_RANK | Same rank | No   | 1, 1, 2                        |

---

🔬 **Section Challenge — WINDOW FUNCTION CORE CONCEPTS**

**Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.

<details><summary>Answer</summary>

Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.

</details>

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

| #   | Problem             | Core Technique                   | Key Insight                          |
| --- | ------------------- | -------------------------------- | ------------------------------------ |
| 1   | Rank Scores         | DENSE_RANK                       | No gaps = DENSE_RANK                 |
| 2   | Nth Highest Salary  | DENSE_RANK + filter rk=N         | Generalized with variable            |
| 3   | Consecutive Numbers | LAG(num,1), LAG(num,2)           | Compare adjacent rows                |
| 4   | Running Total       | SUM() OVER (ORDER BY)            | Default frame = cumulative           |
| 5   | Moving Average      | AVG() OVER (ROWS frame)          | ROWS BETWEEN N PRECEDING AND CURRENT |
| 6   | YoY Growth          | LAG + arithmetic                 | (current-prev)/prev                  |
| 7   | Gap Detection       | id - ROW_NUMBER()                | Islands and gaps technique           |
| 8   | Median per Group    | ROW_NUMBER + COUNT + FLOOR/CEIL  | Middle position(s)                   |
| 9   | Max per Dept (ties) | RANK PARTITION BY dept           | RANK keeps all ties                  |
| 10  | First/Last Value    | FIRST_VALUE + UNBOUNDED frame    | LAST_VALUE needs full frame          |
| 11  | Employee Hierarchy  | Recursive CTE                    | Anchor + recursive + UNION ALL       |
| 12  | Fill Missing Dates  | Recursive CTE + LEFT JOIN        | Generate series then join            |
| 13  | Running Difference  | LAG with default                 | value - LAG(value,1,value)           |
| 14  | Above Dept Average  | Correlated subquery / CTE + JOIN | Inner references outer               |
| 15  | EXISTS vs IN        | EXISTS / IN / NOT EXISTS         | NOT IN fails with NULLs              |
| 16  | Rows to Columns     | SUM(CASE WHEN)                   | Conditional aggregation pivot        |
| 17  | Columns to Rows     | UNION ALL                        | Manual UNPIVOT                       |

---

🔬 **Section Challenge — MASTER PROBLEM MAP — Window Functions & Advanced**

**Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.

<details><summary>Answer</summary>

Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.

</details>

## Frame Specification Cheat Sheet

```
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW     → Running total (default)
ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING → Entire partition
ROWS BETWEEN 2 PRECEDING AND CURRENT ROW              → Last 3 rows
ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING               → Centered 3-row window
ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING      → From here to end
```


---

## Reality Check

**"Window functions are just fancy aggregates"** — Windows compute a value PER ROW using a window of related rows WITHOUT collapsing them — the opposite of GROUP BY ([08_SQL]): the running total that keeps every row, the rank-within-group alongside the detail, the lag/lead comparing to the previous row. GROUP BY collapses to one row per group; windows preserve the rows and add the computed column — conflating them is why people reach for self-joins or subqueries to do what a window does cleanly.

**"OVER (PARTITION BY) is the same as GROUP BY"** — PARTITION BY defines the window scope WITHOUT collapsing rows ([08_SQL]): SUM() OVER (PARTITION BY dept) puts the department total on EVERY employee row (detail plus aggregate together), where GROUP BY dept collapses to one row per department. The distinction is exactly what windows are for (row-level detail with group-level aggregates in one query), and the misconception produces the wrong choice between them.

**"The window frame default is what I want"** — The default frame (RANGE from unbounded-preceding to current-row when ORDER BY is present) is a subtle trap ([08_SQL]): the running total that unexpectedly includes or excludes ties (RANGE-versus-ROWS matters when the ORDER BY has duplicate values), the frame that is not what the question needs. Specifying the frame (ROWS BETWEEN ... explicitly) is the discipline the advanced problems drill, because the default frame produces subtly-wrong running calculations on tied values.

**"Ranking functions are interchangeable"** — ROW_NUMBER, RANK, and DENSE_RANK differ on TIES in ways that change results ([08_SQL]): ROW_NUMBER gives distinct sequential numbers (arbitrary tie-breaking), RANK leaves gaps after ties (1,1,3), DENSE_RANK does not (1,1,2). The top-N-per-group question's correctness depends on which you use (do ties share a rank, do you want exactly N or all-tied-at-N), and the interchangeable assumption produces the wrong count on tied data.

**"Advanced windows are rarely needed in practice"** — Windows are the standard tool for the analytical questions that dominate real reporting and interviews ([08_SQL, 05_SQL_Interview_Thinking]): the period-over-period comparison (lag), the running total, the top-N-per-category, the moving average, the gap-and-island problems. "Rarely needed" is the outdated view — these are exactly the analytical questions businesses ask constantly, and the candidate who avoids windows writes the slower, more-complex self-join or correlated-subquery versions of what windows solve cleanly, which is why advanced window fluency is a core analytical-SQL skill not a niche.
